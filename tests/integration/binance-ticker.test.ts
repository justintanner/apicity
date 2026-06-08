import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance rolling window ticker integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets Spot ticker statistics for a rolling window", async () => {
    ctx = setupPolly("binance/ticker");
    const binance = createBinance();

    const result = await binance.api.v3.ticker({
      symbol: "BTCUSDT",
      windowSize: "1d",
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
