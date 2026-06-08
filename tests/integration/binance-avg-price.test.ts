import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance average price integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the current average Spot price for one symbol", async () => {
    ctx = setupPolly("binance/avg-price");
    const binance = createBinance();

    const result = await binance.api.v3.avgPrice({
      symbol: "BTCUSDT",
    });

    expect(result).toEqual(
      expect.objectContaining({
        mins: expect.any(Number),
        price: expect.any(String),
        closeTime: expect.any(Number),
      })
    );
  });
});
