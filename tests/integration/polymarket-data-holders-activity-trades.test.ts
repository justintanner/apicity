import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createPolymarket } from "@apicity/polymarket";

const USER_ADDRESS = "0xf9ac4c4ef54ee6010a28299ec1d616b63bf7806e";
const CONDITION_ID =
  "0x384e2707bbb95da4bfa6f330fe7d5ccbec1c0a85e20be900cbf599987588e1a4";
const EVENT_ID = "16167";

describe("polymarket data holders+activity+trades surface", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("holders(query) returns per-token leaderboard groups", async () => {
    ctx = setupPolly("polymarket/data-holders");
    const provider = createPolymarket();

    const res = await provider.get.data.holders({
      market: CONDITION_ID,
      limit: 3,
    });

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    const g = res[0];
    expect(typeof g.token).toBe("string");
    expect(Array.isArray(g.holders)).toBe(true);
  });

  it("activity(query) returns the user's recent on-chain actions", async () => {
    ctx = setupPolly("polymarket/data-activity");
    const provider = createPolymarket();

    const res = await provider.get.data.activity({
      user: USER_ADDRESS,
      limit: 3,
    });

    expect(Array.isArray(res)).toBe(true);
    if (res.length > 0) {
      const a = res[0];
      expect(a.proxyWallet.toLowerCase()).toBe(USER_ADDRESS.toLowerCase());
      expect(typeof a.timestamp).toBe("number");
      expect(typeof a.transactionHash).toBe("string");
    }
  });

  it("trades(query) returns the user's trades", async () => {
    ctx = setupPolly("polymarket/data-trades");
    const provider = createPolymarket();

    const res = await provider.get.data.trades({
      user: USER_ADDRESS,
      limit: 3,
    });

    expect(Array.isArray(res)).toBe(true);
    if (res.length > 0) {
      const t = res[0];
      expect(["BUY", "SELL"]).toContain(t.side);
      expect(typeof t.size).toBe("number");
      expect(typeof t.price).toBe("number");
    }
  });

  it("oi() returns global open interest by default", async () => {
    ctx = setupPolly("polymarket/data-oi");
    const provider = createPolymarket();

    const res = await provider.get.data.oi();

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    const e = res[0];
    expect(typeof e.market).toBe("string");
    expect(typeof e.value).toBe("number");
  });

  it("liveVolume(query) returns per-event volume rollup", async () => {
    ctx = setupPolly("polymarket/data-live-volume");
    const provider = createPolymarket();

    const res = await provider.get.data.liveVolume({ id: EVENT_ID });

    expect(Array.isArray(res)).toBe(true);
    if (res.length > 0) {
      expect(typeof res[0].total).toBe("number");
      expect(Array.isArray(res[0].markets)).toBe(true);
    }
  });
});
