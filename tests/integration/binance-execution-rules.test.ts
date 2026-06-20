import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance execution rules integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets Spot execution rules for one symbol", async () => {
    ctx = setupPolly("binance/execution-rules");
    const binance = createBinance();

    const result = await binance.api.v3.executionRules({
      symbol: "BTCUSDT",
    });

    expect(result.symbolRules).toEqual([
      expect.objectContaining({
        symbol: "BTCUSDT",
        rules: expect.arrayContaining([
          expect.objectContaining({
            ruleType: expect.any(String),
          }),
        ]),
      }),
    ]);
  });
});
