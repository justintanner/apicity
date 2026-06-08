import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance time integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the Spot REST API server time", async () => {
    ctx = setupPolly("binance/time");
    const binance = createBinance();

    const result = await binance.api.v3.time();

    expect(result.serverTime).toEqual(expect.any(Number));
  });
});
