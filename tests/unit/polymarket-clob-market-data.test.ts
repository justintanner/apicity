import { describe, expect, it, vi } from "vitest";

import { createPolymarket } from "../../packages/provider/polymarket/src";

const BASE_URL = "https://clob.test";
const TOKEN_ID = "token-123";
const PATH_TOKEN_ID = "token/with space";
const CONDITION_ID = "condition/with space";
const NEXT_CURSOR = "MTAwMA==/next";

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function inputUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function createMarketDataProvider() {
  const calls: CapturedRequest[] = [];
  const mockFetch = vi.fn(
    async (
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1]
    ): Promise<Response> => {
      const url = inputUrl(input);
      const requestInit = init ?? {};
      calls.push({ url, init: requestInit });

      const { pathname } = new URL(url);
      if (pathname === "/time") {
        return new Response("1778040747", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }

      switch (pathname) {
        case "/book":
          return jsonResponse({
            asset_id: TOKEN_ID,
            market: "0xmarket",
            timestamp: "1778040747",
            hash: "0xhash",
            bids: [],
            asks: [],
          });
        case "/price":
          return jsonResponse({ price: "0.42" });
        case "/midpoint":
          return jsonResponse({ mid: "0.43" });
        case "/spread":
          return jsonResponse({ spread: "0.01" });
        case "/last-trade-price":
          return jsonResponse({ price: "0.42", side: "BUY" });
        case "/prices-history":
          return jsonResponse({ history: [{ t: 1778040000, p: 0.42 }] });
        case "/markets":
        case "/sampling-markets":
          return jsonResponse({
            data: [],
            next_cursor: NEXT_CURSOR,
            limit: 1000,
            count: 0,
          });
        case "/simplified-markets":
        case "/sampling-simplified-markets":
          return jsonResponse({
            data: [],
            next_cursor: NEXT_CURSOR,
            limit: 1000,
            count: 0,
          });
        case "/books":
          return jsonResponse([]);
        case "/prices":
          return jsonResponse({ [TOKEN_ID]: { BUY: "0.42", SELL: "0.43" } });
        case "/midpoints":
          return jsonResponse({ [TOKEN_ID]: "0.43" });
        case "/spreads":
          return jsonResponse({ [TOKEN_ID]: "0.01" });
        case "/last-trades-prices":
          return jsonResponse([
            { token_id: TOKEN_ID, price: "0.42", side: "BUY" },
          ]);
        case "/batch-prices-history":
          return jsonResponse({ history: { [TOKEN_ID]: [] } });
        default:
          if (pathname.startsWith("/tick-size/")) {
            return jsonResponse({ minimum_tick_size: 0.01 });
          }
          if (pathname.startsWith("/fee-rate/")) {
            return jsonResponse({ base_fee: 0 });
          }
          if (pathname.startsWith("/markets-by-token/")) {
            return jsonResponse({
              condition_id: CONDITION_ID,
              primary_token_id: TOKEN_ID,
              secondary_token_id: "token-456",
            });
          }
          if (pathname.startsWith("/clob-markets/")) {
            return jsonResponse({
              c: CONDITION_ID,
              t: [],
              r: { mi: 0, ma: 0, e: false, moas: 0 },
              mos: 5,
              mts: 0.01,
              mbf: 0,
              tbf: 0,
              ao: true,
              cbos: false,
              aot: "1778040747",
              ibce: false,
              fd: { r: 0, e: 0, to: false },
            });
          }
          if (pathname.startsWith("/markets/")) {
            return jsonResponse({ condition_id: CONDITION_ID });
          }
      }

      return jsonResponse({});
    }
  );

  return {
    calls,
    provider: createPolymarket({
      clobBaseURL: BASE_URL,
      fetch: mockFetch as unknown as typeof fetch,
    }),
  };
}

function pathAndSearch({ url }: CapturedRequest): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

describe("Polymarket CLOB market-data request wiring", () => {
  it("serializes singular market-data GET URLs", async () => {
    const { calls, provider } = createMarketDataProvider();

    await provider.get.clob.time();
    await provider.get.clob.book({ token_id: TOKEN_ID });
    await provider.get.clob.price({ token_id: TOKEN_ID, side: "BUY" });
    await provider.get.clob.midpoint({ token_id: TOKEN_ID });
    await provider.get.clob.spread({ token_id: TOKEN_ID });
    await provider.get.clob.lastTradePrice({ token_id: TOKEN_ID });
    await provider.get.clob.tickSize(PATH_TOKEN_ID);
    await provider.get.clob.feeRate(PATH_TOKEN_ID);
    await provider.get.clob.pricesHistory({
      market: TOKEN_ID,
      interval: "1h",
      startTs: 1700000000,
      endTs: 1700003600,
      fidelity: 5,
    });

    expect(calls.map(pathAndSearch)).toEqual([
      "/time",
      "/book?token_id=token-123",
      "/price?token_id=token-123&side=BUY",
      "/midpoint?token_id=token-123",
      "/spread?token_id=token-123",
      "/last-trade-price?token_id=token-123",
      "/tick-size/token%2Fwith%20space",
      "/fee-rate/token%2Fwith%20space",
      "/prices-history?market=token-123&interval=1h&startTs=1700000000&endTs=1700003600&fidelity=5",
    ]);
    for (const call of calls) {
      expect(call.init.method).toBe("GET");
      expect(call.init.body).toBeUndefined();
    }
  });

  it("serializes market list, lookup, and pagination URLs", async () => {
    const { calls, provider } = createMarketDataProvider();

    await provider.get.clob.markets();
    await provider.get.clob.markets({ next_cursor: NEXT_CURSOR });
    await provider.get.clob.markets(CONDITION_ID);
    await provider.get.clob.samplingMarkets({ next_cursor: NEXT_CURSOR });
    await provider.get.clob.simplifiedMarkets({ next_cursor: NEXT_CURSOR });
    await provider.get.clob.samplingSimplifiedMarkets({
      next_cursor: NEXT_CURSOR,
    });
    await provider.get.clob.marketsByToken(PATH_TOKEN_ID);
    await provider.get.clob.clobMarkets(CONDITION_ID);

    expect(calls.map(pathAndSearch)).toEqual([
      "/markets",
      "/markets?next_cursor=MTAwMA%3D%3D%2Fnext",
      "/markets/condition%2Fwith%20space",
      "/sampling-markets?next_cursor=MTAwMA%3D%3D%2Fnext",
      "/simplified-markets?next_cursor=MTAwMA%3D%3D%2Fnext",
      "/sampling-simplified-markets?next_cursor=MTAwMA%3D%3D%2Fnext",
      "/markets-by-token/token%2Fwith%20space",
      "/clob-markets/condition%2Fwith%20space",
    ]);
    for (const call of calls) {
      expect(call.init.method).toBe("GET");
      expect(call.init.body).toBeUndefined();
    }
  });

  it("serializes batch POST URLs, JSON bodies, and schemas", async () => {
    const { calls, provider } = createMarketDataProvider();
    const tokenBatch = [{ token_id: TOKEN_ID }];
    const pricesBatch = [
      { token_id: TOKEN_ID, side: "BUY" as const },
      { token_id: TOKEN_ID, side: "SELL" as const },
    ];
    const historyBatch = {
      markets: [TOKEN_ID, "token-456"],
      interval: "1h" as const,
      startTs: 1700000000,
      endTs: 1700003600,
      fidelity: 5,
    };

    await provider.post.clob.books(tokenBatch);
    await provider.post.clob.prices(pricesBatch);
    await provider.post.clob.midpoints(tokenBatch);
    await provider.post.clob.spreads(tokenBatch);
    await provider.post.clob.lastTradesPrices(tokenBatch);
    await provider.post.clob.batchPricesHistory(historyBatch);

    expect(calls.map(pathAndSearch)).toEqual([
      "/books",
      "/prices",
      "/midpoints",
      "/spreads",
      "/last-trades-prices",
      "/batch-prices-history",
    ]);
    expect(calls.map((call) => call.init.body)).toEqual([
      JSON.stringify(tokenBatch),
      JSON.stringify(pricesBatch),
      JSON.stringify(tokenBatch),
      JSON.stringify(tokenBatch),
      JSON.stringify(tokenBatch),
      JSON.stringify(historyBatch),
    ]);
    for (const call of calls) {
      expect(call.init.method).toBe("POST");
      expect(call.init.headers).toEqual({ "Content-Type": "application/json" });
    }

    expect(provider.post.clob.books.schema.parse(tokenBatch)).toEqual(
      tokenBatch
    );
    expect(provider.post.clob.midpoints.schema.parse(tokenBatch)).toEqual(
      tokenBatch
    );
    expect(provider.post.clob.spreads.schema.parse(tokenBatch)).toEqual(
      tokenBatch
    );
    expect(
      provider.post.clob.lastTradesPrices.schema.parse(tokenBatch)
    ).toEqual(tokenBatch);
    expect(provider.post.clob.prices.schema.parse(pricesBatch)).toEqual(
      pricesBatch
    );
    expect(
      provider.post.clob.batchPricesHistory.schema.parse(historyBatch)
    ).toEqual(historyBatch);
    expect(() => provider.post.clob.books.schema.parse([])).toThrow();
    expect(() =>
      provider.post.clob.prices.schema.parse([
        { token_id: TOKEN_ID, side: "HOLD" },
      ] as unknown)
    ).toThrow();
  });
});
