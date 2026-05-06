import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

const TOKEN_ID =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";

describe("polymarket clob tick-size", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return the minimum tick size for a token", async () => {
    ctx = setupPolly("polymarket/clob-tick-size");
    const provider = polymarket();

    const res = await provider.get.clob.tickSize(TOKEN_ID);

    expect(typeof res.minimum_tick_size).toBe("number");
    expect(res.minimum_tick_size).toBeGreaterThan(0);
    expect(res.minimum_tick_size).toBeLessThanOrEqual(1);
  });
});
