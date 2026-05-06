import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

describe("polymarket clob time", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return the server time as a unix-seconds number", async () => {
    ctx = setupPolly("polymarket/clob-time");
    const provider = polymarket();

    const now = await provider.get.clob.time();

    expect(typeof now).toBe("number");
    expect(Number.isFinite(now)).toBe(true);
    // Sanity-bound: any plausible Unix-seconds value falls inside this window.
    expect(now).toBeGreaterThan(1_700_000_000);
    expect(now).toBeLessThan(4_102_444_800);
  });
});
