import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

const TOKEN_ID =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";

describe("polymarket clob price", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return the best price for a token + side", async () => {
    ctx = setupPolly("polymarket/clob-price");
    const provider = polymarket();

    const buy = await provider.get.clob.price({
      token_id: TOKEN_ID,
      side: "BUY",
    });

    expect(typeof buy.price).toBe("string");
    expect(buy.price.length).toBeGreaterThan(0);
    // Price is a decimal string in [0, 1] — sanity check.
    const n = Number(buy.price);
    expect(Number.isFinite(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThanOrEqual(1);
  });
});
