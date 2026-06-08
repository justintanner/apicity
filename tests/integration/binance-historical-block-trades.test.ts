import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance historical block trades integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets historical Spot block trades for one symbol", async () => {
    ctx = setupPolly("binance/historical-block-trades");
    const binance = createBinance();

    const result = await binance.api.v3.historicalBlockTrades({
      symbol: "BTCUSDT",
      fromId: 1,
      limit: 1,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        price: expect.any(String),
        qty: expect.any(String),
        quoteQty: expect.any(String),
        time: expect.any(Number),
        isBuyerMaker: expect.any(Boolean),
      })
    );
  });
});
