import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance aggregate trades integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets aggregate Spot trades for one symbol", async () => {
    ctx = setupPolly("binance/agg-trades");
    const binance = createBinance();

    const result = await binance.api.v3.aggTrades({
      symbol: "BTCUSDT",
      limit: 5,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual(
      expect.objectContaining({
        a: expect.any(Number),
        p: expect.any(String),
        q: expect.any(String),
        f: expect.any(Number),
        l: expect.any(Number),
        T: expect.any(Number),
        m: expect.any(Boolean),
        M: expect.any(Boolean),
      })
    );
  });
});
