import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance 24hr ticker integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets 24hr Spot ticker statistics for one symbol", async () => {
    ctx = setupPolly("binance/ticker-24hr");
    const binance = createBinance();

    const result = await binance.api.v3.ticker.twentyFourHr({
      symbol: "BTCUSDT",
    });

    expect(result).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        priceChange: expect.any(String),
        priceChangePercent: expect.any(String),
        weightedAvgPrice: expect.any(String),
        lastPrice: expect.any(String),
        openTime: expect.any(Number),
        closeTime: expect.any(Number),
        count: expect.any(Number),
      })
    );
  });
});
