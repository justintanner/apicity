import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance trading day ticker integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets Spot ticker statistics for one trading day", async () => {
    ctx = setupPolly("binance/ticker-trading-day");
    const binance = createBinance();

    const result = await binance.api.v3.ticker.tradingDay({
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
