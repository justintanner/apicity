import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createPolymarket } from "@apicity/polymarket";

const TOKEN_ID =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";

describe("polymarket clob midpoint", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return the midpoint price for a token", async () => {
    ctx = setupPolly("polymarket/clob-midpoint");
    const provider = createPolymarket();

    const res = await provider.get.clob.midpoint({ token_id: TOKEN_ID });

    expect(typeof res.mid).toBe("string");
    const n = Number(res.mid);
    expect(Number.isFinite(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThanOrEqual(1);
  });
});
