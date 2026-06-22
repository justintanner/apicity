import { afterEach, describe, expect, it } from "vitest";

import {
  createSimpleFunctions,
  SimpleFunctionsMarketDetailResponseSchema,
  SimpleFunctionsMarketHistoryResponseSchema,
} from "@apicity/simplefunctions";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const MARKET_TICKER = "KXRATECUT-26DEC31";

function expectObject(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  return value as Record<string, unknown>;
}

function createJsonFetch(calls: string[], body: unknown): typeof fetch {
  return async (input) => {
    if (typeof input === "string") {
      calls.push(input);
    } else if (input instanceof URL) {
      calls.push(input.toString());
    } else {
      calls.push(input.url);
    }

    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
    });
  };
}

describe("simplefunctions public integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("runs a small public Query API request", async () => {
    ctx = setupPolly("simplefunctions/query-fed-rate-cut");
    const provider = createSimpleFunctions();

    const result = await provider.api.public.query({
      q: "federal reserve rate cut",
      mode: "raw",
      sources: ["kalshi", "polymarket"],
      limit: 3,
    });

    expect(result.query).toBeTypeOf("string");
    expectObject(result);
  });

  it("checks the real-time data API heartbeat", async () => {
    ctx = setupPolly("simplefunctions/data-heartbeat");
    const provider = createSimpleFunctions();

    const result = await provider.data.v1.heartbeat();

    expect(result.markets_tracked).toBeTypeOf("number");
    expect(result.generated_at).toBeTypeOf("number");
  });

  it("searches the separate real-time data API base", async () => {
    ctx = setupPolly("simplefunctions/data-search-fed");
    const provider = createSimpleFunctions();

    const result = await provider.data.v1.search({ q: "fed", limit: 3 });

    expect(result.query).toBe("fed");
    expect(Array.isArray(result.results)).toBe(true);
    if (result.results.length > 0) {
      expect(result.results[0].ticker).toBeTypeOf("string");
    }
  });

  it("reads an agent world JSON snapshot", async () => {
    ctx = setupPolly("simplefunctions/agent-world-snapshot-json");
    const provider = createSimpleFunctions();

    const result = await provider.api.agent.world({
      format: "json",
      op: "snapshot",
      limit: 3,
    });

    const body = expectObject(result);
    expect(Object.keys(body).length).toBeGreaterThan(0);
  });

  it("searches public analytical market data", async () => {
    ctx = setupPolly("simplefunctions/public-search-fed");
    const provider = createSimpleFunctions();

    const result = await provider.api.public.search({ q: "fed", limit: 3 });

    const body = expectObject(result);
    expect(Object.keys(body).length).toBeGreaterThan(0);
  });

  it("reads the public index summary", async () => {
    ctx = setupPolly("simplefunctions/public-index");
    const provider = createSimpleFunctions();

    const index = await provider.api.public.index();

    expect(Object.keys(expectObject(index)).length).toBeGreaterThan(0);
  });

  it("reads public market detail with orderbook depth", async () => {
    ctx = setupPolly("simplefunctions/public-market-detail");
    const provider = createSimpleFunctions();

    const market = await provider.api.public.market({
      ticker: MARKET_TICKER,
      depth: true,
    });

    expect(market.ticker).toBe(MARKET_TICKER);
    expect(market.title).toBeTypeOf("string");
    expect(
      SimpleFunctionsMarketDetailResponseSchema.safeParse(market).success
    ).toBe(true);
    if (market.bidLevels) {
      expect(Array.isArray(market.bidLevels)).toBe(true);
    }
    if (market.indicators) {
      expectObject(market.indicators);
    }
    if (market.regime) {
      expectObject(market.regime);
    }
  });

  it("reads public market indicator and regime history", async () => {
    ctx = setupPolly("simplefunctions/public-market-history");
    const provider = createSimpleFunctions();

    const history = await provider.api.public.market.history({
      ticker: MARKET_TICKER,
    });

    expect(
      SimpleFunctionsMarketHistoryResponseSchema.safeParse(history).success
    ).toBe(true);
    expect(history.windowDays).toBe(7);
    expect(Array.isArray(history.indicatorHistory)).toBe(true);
    expect(Array.isArray(history.regimeHistory)).toBe(true);
    expect(history.indicatorCount).toBe(history.indicatorHistory.length);
    expect(history.regimeCount).toBe(history.regimeHistory.length);
  });

  it("serializes public market detail query parameters", async () => {
    const calls: string[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls, { ticker: MARKET_TICKER }),
    });

    await provider.api.public.market({
      ticker: ` ${MARKET_TICKER} `,
      depth: true,
      refresh: true,
      cvPreset: "detail",
      cvMinConf: 0.7,
      cvMaxDtDays: 14,
      nextActions: "off",
    });

    const url = new URL(calls[0]);
    expect(url.pathname).toBe(`/api/public/market/${MARKET_TICKER}`);
    expect(url.searchParams.get("depth")).toBe("true");
    expect(url.searchParams.get("refresh")).toBe("true");
    expect(url.searchParams.get("cv_preset")).toBe("detail");
    expect(url.searchParams.get("cv_min_conf")).toBe("0.7");
    expect(url.searchParams.get("cv_max_dt_days")).toBe("14");
    expect(url.searchParams.get("nextActions")).toBe("off");
  });

  it("requires an API key for public market refresh", async () => {
    const calls: string[] = [];
    const provider = createSimpleFunctions({
      fetch: createJsonFetch(calls, { ticker: MARKET_TICKER }),
    });

    await expect(
      provider.api.public.market({
        ticker: MARKET_TICKER,
        refresh: true,
      })
    ).rejects.toMatchObject({ status: 401 });
    expect(calls).toHaveLength(0);
  });

  it("serializes public market history paths", async () => {
    const calls: string[] = [];
    const provider = createSimpleFunctions({
      fetch: createJsonFetch(calls, {
        indicatorHistory: [],
        regimeHistory: [],
      }),
    });

    await provider.api.public.market.history({
      ticker: ` ${MARKET_TICKER} `,
    });

    const url = new URL(calls[0]);
    expect(url.pathname).toBe(`/api/public/market/${MARKET_TICKER}/history`);
    expect(url.search).toBe("");
  });
});
