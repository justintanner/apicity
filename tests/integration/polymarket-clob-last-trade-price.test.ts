import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

const TOKEN_ID =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";

describe("polymarket clob last-trade-price", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return the last trade price + side for a token", async () => {
    ctx = setupPolly("polymarket/clob-last-trade-price");
    const provider = polymarket();

    const res = await provider.get.clob.lastTradePrice({ token_id: TOKEN_ID });

    expect(typeof res.price).toBe("string");
    expect(["BUY", "SELL"]).toContain(res.side);
    const n = Number(res.price);
    expect(Number.isFinite(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThanOrEqual(1);
  });
});
