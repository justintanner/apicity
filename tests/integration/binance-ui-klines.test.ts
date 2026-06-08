import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance UI klines integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets Spot UI klines for one symbol and interval", async () => {
    ctx = setupPolly("binance/ui-klines");
    const binance = createBinance();

    const result = await binance.api.v3.uiKlines({
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
