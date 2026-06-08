import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance symbol price ticker integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the latest Spot ticker price for one symbol", async () => {
    ctx = setupPolly("binance/ticker-price");
    const binance = createBinance();

    const result = await binance.api.v3.ticker.price({
      symbol: "BTCUSDT",
    });

    expect(result).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        price: expect.any(String),
      })
    );
  });
});
