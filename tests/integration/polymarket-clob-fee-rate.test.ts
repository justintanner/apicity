import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createPolymarket } from "@apicity/polymarket";

const TOKEN_ID =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";

describe("polymarket clob fee-rate", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return the base fee for a token", async () => {
    ctx = setupPolly("polymarket/clob-fee-rate");
    const provider = createPolymarket();

    const res = await provider.get.clob.feeRate(TOKEN_ID);

    expect(typeof res.base_fee).toBe("number");
    expect(res.base_fee).toBeGreaterThanOrEqual(0);
  });
});
