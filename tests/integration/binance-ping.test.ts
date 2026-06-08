import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("binance ping integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("tests Spot REST API connectivity", async () => {
    ctx = setupPolly("binance/ping");
    const binance = createBinance();

    const result = await binance.api.v3.ping();

    expect(result).toEqual({});
  });
});
