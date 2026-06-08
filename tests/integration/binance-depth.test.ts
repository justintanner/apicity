import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance depth integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the Spot order book for one symbol", async () => {
    ctx = setupPolly("binance/depth");
    const binance = createBinance();

    const result = await binance.api.v3.depth({
      symbol: "BTCUSDT",
      limit: 5,
    });

    expect(result.lastUpdateId).toEqual(expect.any(Number));
    expect(result.bids.length).toBeGreaterThan(0);
    expect(result.asks.length).toBeGreaterThan(0);
    expect(result.bids[0]).toEqual([expect.any(String), expect.any(String)]);
    expect(result.asks[0]).toEqual([expect.any(String), expect.any(String)]);
  });
});
