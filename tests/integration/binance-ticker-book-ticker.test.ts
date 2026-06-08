import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance order book ticker integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the best Spot order book prices for one symbol", async () => {
    ctx = setupPolly("binance/ticker-book-ticker");
    const binance = createBinance();

    const result = await binance.api.v3.ticker.bookTicker({
      symbol: "BTCUSDT",
    });

    expect(result).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        bidPrice: expect.any(String),
        bidQty: expect.any(String),
        askPrice: expect.any(String),
        askQty: expect.any(String),
      })
    );
  });
});
