import { afterEach, describe, expect, it } from "vitest";

import {
  createSimpleFunctions,
  SimpleFunctionsMarketDetailResponseSchema,
  SimpleFunctionsMarketHistoryResponseSchema,
} from "@apicity/simplefunctions";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const MARKET_TICKER = "KXRATECUT-26DEC31";

type SimpleFunctionsProvider = ReturnType<typeof createSimpleFunctions>;

interface CapturedFetchCall {
  url: string;
  init?: RequestInit;
}

function expectObject(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  return value as Record<string, unknown>;
}

function createJsonFetch(
  calls: CapturedFetchCall[],
  body: unknown
): typeof fetch {
  return async (input, init) => {
    if (typeof input === "string") {
      calls.push({ url: input, init });
    } else if (input instanceof URL) {
      calls.push({ url: input.toString(), init });
    } else {
      calls.push({ url: input.url, init });
    }

    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
    });
  };
}

function expectOnlyCall(calls: CapturedFetchCall[]): CapturedFetchCall {
  expect(calls).toHaveLength(1);
  const call = calls[0];
  if (!call) {
    throw new Error("Expected one fetch call");
  }
  return call;
}

function expectNoBearer(call: CapturedFetchCall): void {
  expect(new Headers(call.init?.headers).has("Authorization")).toBe(false);
}

async function expectPublicGet(
  provider: SimpleFunctionsProvider,
  calls: CapturedFetchCall[],
  invoke: (provider: SimpleFunctionsProvider) => Promise<unknown>,
  expectedPath: string,
  expectedQuery: Record<string, string> = {}
): Promise<void> {
  const start = calls.length;
  const result = await invoke(provider);
  expect(result).toEqual({ ok: true });

  const call = calls[start];
  if (!call) {
    throw new Error(`Expected fetch call for ${expectedPath}`);
  }
  const url = new URL(call.url);
  expect(call.init?.method).toBe("GET");
  expect(url.pathname).toBe(expectedPath);
  expectNoBearer(call);

  const entries = Array.from(url.searchParams.entries()).sort();
  expect(entries).toEqual(Object.entries(expectedQuery).sort());
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
    const calls: CapturedFetchCall[] = [];
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

    const url = new URL(expectOnlyCall(calls).url);
    expect(url.pathname).toBe(`/api/public/market/${MARKET_TICKER}`);
    expect(url.searchParams.get("depth")).toBe("true");
    expect(url.searchParams.get("refresh")).toBe("true");
    expect(url.searchParams.get("cv_preset")).toBe("detail");
    expect(url.searchParams.get("cv_min_conf")).toBe("0.7");
    expect(url.searchParams.get("cv_max_dt_days")).toBe("14");
    expect(url.searchParams.get("nextActions")).toBe("off");
  });

  it("requires an API key for public market refresh", async () => {
    const calls: CapturedFetchCall[] = [];
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
    const calls: CapturedFetchCall[] = [];
    const provider = createSimpleFunctions({
      fetch: createJsonFetch(calls, {
        indicatorHistory: [],
        regimeHistory: [],
      }),
    });

    await provider.api.public.market.history({
      ticker: ` ${MARKET_TICKER} `,
    });

    const url = new URL(expectOnlyCall(calls).url);
    expect(url.pathname).toBe(`/api/public/market/${MARKET_TICKER}/history`);
    expect(url.search).toBe("");
  });

  it("serializes public index, calendar, and yield-curve reads", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createSimpleFunctions({
      fetch: createJsonFetch(calls, { ok: true }),
    });

    await expectPublicGet(
      provider,
      calls,
      (client) => client.api.public.index(),
      "/api/public/index"
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.index.history({ days: 30, theme: "inflation" }),
      "/api/public/index/history",
      { days: "30", theme: "inflation" }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.regime.scan({
          label: "maker",
          venue: "kalshi",
          limit: 9,
        }),
      "/api/public/regime/scan",
      { label: "maker", limit: "9", venue: "kalshi" }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.calibration({
          source: "polymarket",
          period: "30d",
          category: "macro",
          topic: "inflation",
          minVolume: 1000,
        }),
      "/api/public/calibration",
      {
        category: "macro",
        min_volume: "1000",
        period: "30d",
        source: "polymarket",
        topic: "inflation",
      }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.calendar({
          from: "2026-01-01",
          to: "2026-01-31",
          category: "macro",
          limit: 5,
        }),
      "/api/public/calendar",
      {
        category: "macro",
        from: "2026-01-01",
        limit: "5",
        to: "2026-01-31",
      }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) => client.api.public.yieldCurves(),
      "/api/public/yield-curves"
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.yieldCurves.event({ event: "FOMC/rates 2026" }),
      "/api/public/yield-curves/FOMC%2Frates%202026"
    );
  });

  it("serializes public government and economic context reads", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createSimpleFunctions({
      fetch: createJsonFetch(calls, { ok: true }),
    });

    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.queryGov({
          q: " federal budget ",
          mode: "raw",
          sources: ["congress", "kalshi"],
          limit: 7,
          depth: true,
        }),
      "/api/public/query-gov",
      {
        depth: "true",
        limit: "7",
        mode: "raw",
        q: "federal budget",
        sources: "congress,kalshi",
      }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.legislation({
          q: "budget",
          congress: 119,
          type: "hr",
          limit: 3,
        }),
      "/api/public/legislation",
      { congress: "119", limit: "3", q: "budget", type: "hr" }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.legislation.byBillId({ billId: "hr 1/2026" }),
      "/api/public/legislation/hr%201%2F2026"
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.congress.members({
          q: "smith",
          state: "CA",
          party: "D",
          chamber: "house",
          limit: 4,
        }),
      "/api/public/congress/members",
      {
        chamber: "house",
        limit: "4",
        party: "D",
        q: "smith",
        state: "CA",
      }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) => client.api.public.congress.member({ id: "A000055/house" }),
      "/api/public/congress/member/A000055%2Fhouse"
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.queryEcon({
          q: " cpi ",
          mode: "full",
          limit: 2,
          includeMarkets: true,
        }),
      "/api/public/query-econ",
      {
        includeMarkets: "true",
        limit: "2",
        mode: "full",
        q: "cpi",
      }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.fred({
          series: "CPIAUCSL",
          start: "2025-01-01",
          end: "2025-12-31",
          limit: 12,
        }),
      "/api/public/fred",
      {
        end: "2025-12-31",
        limit: "12",
        series: "CPIAUCSL",
        start: "2025-01-01",
      }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.databento({
          q: "treasury",
          category: "rates",
          venue: "kalshi",
          limit: 6,
          offset: 2,
        }),
      "/api/public/databento",
      {
        category: "rates",
        limit: "6",
        offset: "2",
        q: "treasury",
        venue: "kalshi",
      }
    );
    await expectPublicGet(
      provider,
      calls,
      (client) =>
        client.api.public.tradMarkets({
          q: "fed",
          category: "macro",
          limit: 8,
        }),
      "/api/public/trad-markets",
      { category: "macro", limit: "8", q: "fed" }
    );
  });

  it("passes optional bearer auth through public reads", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls, { ok: true }),
    });

    await provider.api.public.calendar({ limit: 1 });

    const call = expectOnlyCall(calls);
    expect(new Headers(call.init?.headers).get("Authorization")).toBe(
      "Bearer sf_live_test"
    );
  });

  it("validates required public gov/econ path and query values locally", async () => {
    const calls: CapturedFetchCall[] = [];
    const provider = createSimpleFunctions({
      fetch: createJsonFetch(calls, { ok: true }),
    });

    await expect(
      provider.api.public.queryGov({ q: "x" })
    ).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      provider.api.public.queryEcon({ q: " " })
    ).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      provider.api.public.fred({ series: " " })
    ).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      provider.api.public.yieldCurves.event({ event: " " })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.public.legislation.byBillId({ billId: " " })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.public.congress.member({ id: " " })
    ).rejects.toMatchObject({ status: 400 });
    expect(calls).toHaveLength(0);
  });
});
