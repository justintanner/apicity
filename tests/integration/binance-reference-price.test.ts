import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance reference price integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the current reference price for one symbol", async () => {
    ctx = setupPolly("binance/reference-price");
    const binance = createBinance();

    const result = await binance.api.v3.referencePrice({
      symbol: "BTCUSDT",
    });

    expect(result).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        referencePrice: expect.any(String),
        timestamp: expect.any(Number),
      })
    );
  });
});
