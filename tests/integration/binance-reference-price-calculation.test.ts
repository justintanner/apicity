import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance reference price calculation integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the reference price calculation details for one symbol", async () => {
    ctx = setupPolly("binance/reference-price-calculation");
    const binance = createBinance();

    const result = await binance.api.v3.referencePrice.calculation({
      symbol: "BTCUSDT",
    });

    expect(result).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        calculationType: expect.any(String),
      })
    );
  });
});
