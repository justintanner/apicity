import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance klines integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets Spot klines for one symbol and interval", async () => {
    ctx = setupPolly("binance/klines");
    const binance = createBinance();

    const result = await binance.api.v3.klines({
      symbol: "BTCUSDT",
      interval: "1m",
      limit: 1,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual([
      expect.any(Number),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(Number),
      expect.any(String),
      expect.any(Number),
      expect.any(String),
      expect.any(String),
      expect.any(String),
    ]);
  });
});
