import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance exchange info integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets Spot exchange metadata for one symbol", async () => {
    ctx = setupPolly("binance/exchange-info");
    const binance = createBinance();

    const result = await binance.api.v3.exchangeInfo({
      symbol: "BTCUSDT",
      showPermissionSets: false,
    });

    expect(result.timezone).toBe("UTC");
    expect(result.symbols).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "BTCUSDT",
          status: expect.any(String),
        }),
      ])
    );
  });
});
