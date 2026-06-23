import { afterEach, describe, expect, it } from "vitest";

import type { SimpleFunctionsProvider } from "@apicity/simplefunctions";
import {
  createSimpleFunctions,
  SimpleFunctionsContagionRequestSchema,
  SimpleFunctionsCrossVenueRequestSchema,
  SimpleFunctionsMarketCandlesRequestSchema,
  SimpleFunctionsMarketDetailRequestSchema,
  SimpleFunctionsMarketDetailResponseSchema,
  SimpleFunctionsMarketHistoryResponseSchema,
  SimpleFunctionsMicrostructureHistoryRequestSchema,
  SimpleFunctionsPublicListRequestSchema,
  SimpleFunctionsPublicSearchRequestSchema,
  SimpleFunctionsScanRequestSchema,
  SimpleFunctionsScreenByTickersRequestSchema,
  SimpleFunctionsScreenRequestSchema,
  SimpleFunctionsTickerRequestSchema,
} from "@apicity/simplefunctions";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const MARKET_TICKER = "KXRATECUT-26DEC31";
const SPECIAL_TICKER = " KX RATE/CUT ";
const ENCODED_SPECIAL_TICKER = "KX%20RATE%2FCUT";

interface FetchCall {
  url: string;
  method?: string;
  headers: Record<string, string>;
  body?: BodyInit | null;
}

interface PublicEndpointCase {
  name: string;
  invoke: (provider: SimpleFunctionsProvider) => Promise<unknown>;
  path: string;
  searchParams?: Record<string, string>;
  schema: unknown;
  getSchema: (provider: SimpleFunctionsProvider) => unknown;
}

function expectObject(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  return value as Record<string, unknown>;
}

function headersToRecord(
  headers: HeadersInit | undefined
): Record<string, string> {
  const record: Record<string, string> = {};
  if (!headers) return record;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      record[key.toLowerCase()] = value;
    });
    return record;
  }

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      record[key.toLowerCase()] = value;
    }
    return record;
  }

  for (const [key, value] of Object.entries(headers)) {
    record[key.toLowerCase()] = value;
  }
  return record;
}

function fetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function fetchMethod(
  input: RequestInfo | URL,
  init: RequestInit | undefined
): string | undefined {
  if (init?.method) return init.method;
  if (input instanceof Request) return input.method;
  return undefined;
}

function fetchHeaders(
  input: RequestInfo | URL,
  init: RequestInit | undefined
): HeadersInit | undefined {
  if (init?.headers) return init.headers;
  if (input instanceof Request) return input.headers;
  return undefined;
}

function createJsonFetch(calls: FetchCall[], body: unknown): typeof fetch {
  return async (input, init) => {
    calls.push({
      url: fetchUrl(input),
      method: fetchMethod(input, init),
      headers: headersToRecord(fetchHeaders(input, init)),
      body: init?.body,
    });

    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
    });
  };
}

function expectOnlyCall(calls: FetchCall[]): FetchCall {
  expect(calls).toHaveLength(1);
  const call = calls[0];
  if (!call) {
    throw new Error("Expected one fetch call");
  }
  return call;
}

function expectNoBearer(call: FetchCall): void {
  expect(call.headers.authorization).toBeUndefined();
}

async function expectPublicGet(
  provider: SimpleFunctionsProvider,
  calls: FetchCall[],
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
  expect(call.method).toBe("GET");
  expect(url.pathname).toBe(expectedPath);
  expectNoBearer(call);

  const entries = Array.from(url.searchParams.entries()).sort();
  expect(entries).toEqual(Object.entries(expectedQuery).sort());
}

const publicDiscoveryCases: PublicEndpointCase[] = [
  {
    name: "markets",
    invoke: (provider) =>
      provider.api.public.markets({
        q: "fed",
        category: "macro",
        venue: "kalshi",
        limit: 5,
        offset: 10,
      }),
    path: "/api/public/markets",
    searchParams: {
      q: "fed",
      category: "macro",
      venue: "kalshi",
      limit: "5",
      offset: "10",
    },
    schema: SimpleFunctionsPublicListRequestSchema,
    getSchema: (provider) => provider.api.public.markets.schema,
  },
  {
    name: "newmarkets",
    invoke: (provider) =>
      provider.api.public.newmarkets({
        category: "macro",
        limit: 4,
      }),
    path: "/api/public/newmarkets",
    searchParams: {
      category: "macro",
      limit: "4",
    },
    schema: SimpleFunctionsPublicListRequestSchema,
    getSchema: (provider) => provider.api.public.newmarkets.schema,
  },
  {
    name: "scan",
    invoke: (provider) =>
      provider.api.public.scan({
        q: "rate",
        mode: "market",
        series: "fed",
        market: MARKET_TICKER,
        limit: 6,
      }),
    path: "/api/public/scan",
    searchParams: {
      q: "rate",
      mode: "market",
      series: "fed",
      market: MARKET_TICKER,
      limit: "6",
    },
    schema: SimpleFunctionsScanRequestSchema,
    getSchema: (provider) => provider.api.public.scan.schema,
  },
  {
    name: "screen",
    invoke: (provider) =>
      provider.api.public.screen({
        venue: "polymarket",
        category: "macro",
        minPrice: 0.2,
        maxPrice: 0.8,
        minVolume: 1000,
        limit: 12,
      }),
    path: "/api/public/screen",
    searchParams: {
      venue: "polymarket",
      category: "macro",
      minPrice: "0.2",
      maxPrice: "0.8",
      minVolume: "1000",
      limit: "12",
    },
    schema: SimpleFunctionsScreenRequestSchema,
    getSchema: (provider) => provider.api.public.screen.schema,
  },
  {
    name: "screen-by-tickers",
    invoke: (provider) =>
      provider.api.public.screenByTickers({
        tickers: ["FED-YES", "FED-NO"],
        venue: "kalshi",
        minVolume: 25,
      }),
    path: "/api/public/screen-by-tickers",
    searchParams: {
      tickers: "FED-YES,FED-NO",
      venue: "kalshi",
      minVolume: "25",
    },
    schema: SimpleFunctionsScreenByTickersRequestSchema,
    getSchema: (provider) => provider.api.public.screenByTickers.schema,
  },
  {
    name: "search",
    invoke: (provider) =>
      provider.api.public.search({
        q: " fed ",
        limit: 3,
      }),
    path: "/api/public/search",
    searchParams: {
      q: "fed",
      limit: "3",
    },
    schema: SimpleFunctionsPublicSearchRequestSchema,
    getSchema: (provider) => provider.api.public.search.schema,
  },
  {
    name: "market",
    invoke: (provider) =>
      provider.api.public.market({
        ticker: SPECIAL_TICKER,
        depth: true,
        cvPreset: "detail",
        cvMinConf: 0.7,
        cvMaxDtDays: 14,
        nextActions: "off",
      }),
    path: `/api/public/market/${ENCODED_SPECIAL_TICKER}`,
    searchParams: {
      depth: "true",
      cv_preset: "detail",
      cv_min_conf: "0.7",
      cv_max_dt_days: "14",
      nextActions: "off",
    },
    schema: SimpleFunctionsMarketDetailRequestSchema,
    getSchema: (provider) => provider.api.public.market.schema,
  },
  {
    name: "market-history",
    invoke: (provider) =>
      provider.api.public.market.history({
        ticker: SPECIAL_TICKER,
      }),
    path: `/api/public/market/${ENCODED_SPECIAL_TICKER}/history`,
    schema: SimpleFunctionsTickerRequestSchema,
    getSchema: (provider) => provider.api.public.market.history.schema,
  },
  {
    name: "market-candles",
    invoke: (provider) =>
      provider.api.public.market.candles({
        ticker: SPECIAL_TICKER,
        venue: "kalshi",
        timeframe: "1h",
        tf: "5m",
        limit: 120,
      }),
    path: `/api/public/market/${ENCODED_SPECIAL_TICKER}/candles`,
    searchParams: {
      venue: "kalshi",
      timeframe: "1h",
      tf: "5m",
      limit: "120",
    },
    schema: SimpleFunctionsMarketCandlesRequestSchema,
    getSchema: (provider) => provider.api.public.market.candles.schema,
  },
  {
    name: "market-microstructure-history",
    invoke: (provider) =>
      provider.api.public.marketMicrostructureHistory({
        ticker: MARKET_TICKER,
        venue: "kalshi",
        days: 30,
        limit: 20,
      }),
    path: "/api/public/market-microstructure-history",
    searchParams: {
      ticker: MARKET_TICKER,
      venue: "kalshi",
      days: "30",
      limit: "20",
    },
    schema: SimpleFunctionsMicrostructureHistoryRequestSchema,
    getSchema: (provider) =>
      provider.api.public.marketMicrostructureHistory.schema,
  },
  {
    name: "live-tickers",
    invoke: (provider) =>
      provider.api.public.liveTickers({
        q: "fed",
        venue: "polymarket",
        limit: 8,
      }),
    path: "/api/public/live-tickers",
    searchParams: {
      q: "fed",
      venue: "polymarket",
      limit: "8",
    },
    schema: SimpleFunctionsPublicListRequestSchema,
    getSchema: (provider) => provider.api.public.liveTickers.schema,
  },
  {
    name: "cross-venue-pairs",
    invoke: (provider) =>
      provider.api.public.crossVenue.pairs({
        venue: "kalshi",
        minConfidence: 0.8,
        limit: 7,
      }),
    path: "/api/public/cross-venue/pairs",
    searchParams: {
      venue: "kalshi",
      minConfidence: "0.8",
      limit: "7",
    },
    schema: SimpleFunctionsCrossVenueRequestSchema,
    getSchema: (provider) => provider.api.public.crossVenue.pairs.schema,
  },
  {
    name: "cross-venue-stats",
    invoke: (provider) =>
      provider.api.public.crossVenue.stats({
        minConfidence: 0.6,
        limit: 9,
      }),
    path: "/api/public/cross-venue/stats",
    searchParams: {
      minConfidence: "0.6",
      limit: "9",
    },
    schema: SimpleFunctionsCrossVenueRequestSchema,
    getSchema: (provider) => provider.api.public.crossVenue.stats.schema,
  },
  {
    name: "liquidity-by-theme",
    invoke: (provider) =>
      provider.api.public.liquidityByTheme({
        category: "macro",
        limit: 11,
      }),
    path: "/api/public/liquidity-by-theme",
    searchParams: {
      category: "macro",
      limit: "11",
    },
    schema: SimpleFunctionsPublicListRequestSchema,
    getSchema: (provider) => provider.api.public.liquidityByTheme.schema,
  },
  {
    name: "contagion",
    invoke: (provider) =>
      provider.api.public.contagion({
        ticker: MARKET_TICKER,
        window: "7d",
        limit: 13,
      }),
    path: "/api/public/contagion",
    searchParams: {
      ticker: MARKET_TICKER,
      window: "7d",
      limit: "13",
    },
    schema: SimpleFunctionsContagionRequestSchema,
    getSchema: (provider) => provider.api.public.contagion.schema,
  },
];

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

  it("serializes public market discovery endpoints without auth", async () => {
    const calls: FetchCall[] = [];
    const provider = createSimpleFunctions({
      fetch: createJsonFetch(calls, { ok: true }),
    });

    for (const endpoint of publicDiscoveryCases) {
      const before = calls.length;

      expect(endpoint.getSchema(provider)).toBe(endpoint.schema);
      await endpoint.invoke(provider);

      const call = calls[before];
      if (!call) {
        throw new Error(`Expected fetch call for ${endpoint.name}`);
      }
      const url = new URL(call.url);
      const expectedParams = endpoint.searchParams ?? {};

      expect(call.method).toBe("GET");
      expect(call.body).toBeUndefined();
      expectNoBearer(call);
      expect(url.origin).toBe("https://simplefunctions.dev");
      expect(url.pathname).toBe(endpoint.path);
      expect(Array.from(url.searchParams.keys()).sort()).toEqual(
        Object.keys(expectedParams).sort()
      );

      for (const [key, value] of Object.entries(expectedParams)) {
        expect(url.searchParams.get(key), endpoint.name).toBe(value);
      }
    }

    expect(calls).toHaveLength(publicDiscoveryCases.length);
  });

  it("passes configured auth through public market discovery reads", async () => {
    const calls: FetchCall[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls, { ok: true }),
    });

    await provider.api.public.markets({ limit: 1 });

    expect(expectOnlyCall(calls).headers.authorization).toBe(
      "Bearer sf_live_test"
    );
  });

  it("serializes public market detail query parameters", async () => {
    const calls: FetchCall[] = [];
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
    const calls: FetchCall[] = [];
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
    const calls: FetchCall[] = [];
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
    const calls: FetchCall[] = [];
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
    const calls: FetchCall[] = [];
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
    const calls: FetchCall[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls, { ok: true }),
    });

    await provider.api.public.calendar({ limit: 1 });

    expect(expectOnlyCall(calls).headers.authorization).toBe(
      "Bearer sf_live_test"
    );
  });

  it("validates required public gov/econ path and query values locally", async () => {
    const calls: FetchCall[] = [];
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
