import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

const TOKEN_ID =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";

describe("polymarket clob prices-history", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return a time-price series for an interval", async () => {
    ctx = setupPolly("polymarket/clob-prices-history-interval");
    const provider = polymarket();

    const res = await provider.get.clob.pricesHistory({
      market: TOKEN_ID,
      interval: "1h",
    });

    expect(Array.isArray(res.history)).toBe(true);
    expect(res.history.length).toBeGreaterThan(0);
    const first = res.history[0];
    expect(typeof first.t).toBe("number");
    expect(typeof first.p).toBe("number");
    expect(first.t).toBeGreaterThan(1_700_000_000);
    expect(first.p).toBeGreaterThanOrEqual(0);
    expect(first.p).toBeLessThanOrEqual(1);
  });

  it("should accept startTs / endTs / fidelity together", async () => {
    ctx = setupPolly("polymarket/clob-prices-history-window");
    const provider = polymarket();

    const res = await provider.get.clob.pricesHistory({
      market: TOKEN_ID,
      startTs: 1777800000,
      endTs: 1778000000,
      fidelity: 60,
    });

    // Smoke-test the parameter wiring; the server's interpretation of the
    // endTs bound is not strictly enforced (responses can extend past it),
    // so we only assert the response shape.
    expect(Array.isArray(res.history)).toBe(true);
    if (res.history.length > 0) {
      expect(typeof res.history[0].t).toBe("number");
      expect(typeof res.history[0].p).toBe("number");
    }
  });
});
