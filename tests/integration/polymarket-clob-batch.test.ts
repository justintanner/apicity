import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

const TOKEN_YES =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";
const TOKEN_NO =
  "50346565575310273995396997144874891836871065259829083228393044602519086496922";

describe("polymarket clob batch POSTs", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("books returns one orderbook per requested token", async () => {
    ctx = setupPolly("polymarket/clob-books-batch");
    const provider = polymarket();

    const res = await provider.post.clob.books([
      { token_id: TOKEN_YES },
      { token_id: TOKEN_NO },
    ]);

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(2);
    const first = res[0];
    expect(typeof first.market).toBe("string");
    expect(typeof first.asset_id).toBe("string");
    expect(Array.isArray(first.bids)).toBe(true);
    expect(Array.isArray(first.asks)).toBe(true);
  });

  it("prices returns a token→side→price map", async () => {
    ctx = setupPolly("polymarket/clob-prices-batch");
    const provider = polymarket();

    const res = await provider.post.clob.prices([
      { token_id: TOKEN_YES, side: "BUY" },
      { token_id: TOKEN_YES, side: "SELL" },
    ]);

    expect(Object.keys(res)).toContain(TOKEN_YES);
    const sides = res[TOKEN_YES];
    expect(typeof sides.BUY).toBe("string");
    expect(typeof sides.SELL).toBe("string");
  });

  it("midpoints returns a token→midpoint map", async () => {
    ctx = setupPolly("polymarket/clob-midpoints-batch");
    const provider = polymarket();

    const res = await provider.post.clob.midpoints([
      { token_id: TOKEN_YES },
      { token_id: TOKEN_NO },
    ]);

    expect(typeof res[TOKEN_YES]).toBe("string");
    expect(typeof res[TOKEN_NO]).toBe("string");
  });

  it("spreads returns a token→spread map", async () => {
    ctx = setupPolly("polymarket/clob-spreads-batch");
    const provider = polymarket();

    const res = await provider.post.clob.spreads([
      { token_id: TOKEN_YES },
      { token_id: TOKEN_NO },
    ]);

    expect(typeof res[TOKEN_YES]).toBe("string");
    expect(typeof res[TOKEN_NO]).toBe("string");
  });

  it("lastTradesPrices returns one entry per requested token", async () => {
    ctx = setupPolly("polymarket/clob-last-trades-prices-batch");
    const provider = polymarket();

    const res = await provider.post.clob.lastTradesPrices([
      { token_id: TOKEN_YES },
    ]);

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    const entry = res[0];
    expect(entry.token_id).toBe(TOKEN_YES);
    expect(typeof entry.price).toBe("string");
    expect(["BUY", "SELL"]).toContain(entry.side);
  });

  it("batchPricesHistory returns a per-market series map", async () => {
    ctx = setupPolly("polymarket/clob-batch-prices-history");
    const provider = polymarket();

    const res = await provider.post.clob.batchPricesHistory({
      markets: [TOKEN_YES, TOKEN_NO],
      interval: "1h",
    });

    expect(typeof res.history).toBe("object");
    const yesSeries = res.history[TOKEN_YES];
    const noSeries = res.history[TOKEN_NO];
    // At least one of the requested markets should return points; both is the
    // common case for actively-traded markets.
    const total = (yesSeries?.length ?? 0) + (noSeries?.length ?? 0);
    expect(total).toBeGreaterThan(0);
    if (yesSeries && yesSeries.length > 0) {
      expect(typeof yesSeries[0].t).toBe("number");
      expect(typeof yesSeries[0].p).toBe("number");
    }
  });

  it("exposes payload schemas for runtime validation", async () => {
    // No HAR needed — schema attachment is a static fact about the factory.
    ctx = setupPolly("polymarket/clob-batch-schemas");
    const provider = polymarket();

    expect(typeof provider.post.clob.books.schema.parse).toBe("function");
    expect(typeof provider.post.clob.prices.schema.parse).toBe("function");
    expect(typeof provider.post.clob.batchPricesHistory.schema.parse).toBe(
      "function"
    );
    // Empty arrays are rejected (server enforces minimum 1).
    expect(() => provider.post.clob.books.schema.parse([])).toThrow();
  });
});
