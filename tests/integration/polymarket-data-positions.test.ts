import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createPolymarket } from "@apicity/polymarket";

const USER_ADDRESS = "0xf9ac4c4ef54ee6010a28299ec1d616b63bf7806e";

describe("polymarket data positions surface", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("positions(query) lists open positions for a wallet", async () => {
    ctx = setupPolly("polymarket/data-positions");
    const provider = createPolymarket();

    const res = await provider.get.data.positions({
      user: USER_ADDRESS,
      limit: 2,
    });

    expect(Array.isArray(res)).toBe(true);
    if (res.length > 0) {
      const p = res[0];
      expect(p.proxyWallet.toLowerCase()).toBe(USER_ADDRESS.toLowerCase());
      expect(typeof p.size).toBe("number");
      expect(typeof p.curPrice).toBe("number");
      expect(typeof p.cashPnl).toBe("number");
    }
  });

  it("value(query) returns the wallet's net portfolio value", async () => {
    ctx = setupPolly("polymarket/data-value");
    const provider = createPolymarket();

    const res = await provider.get.data.value({ user: USER_ADDRESS });

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].user.toLowerCase()).toBe(USER_ADDRESS.toLowerCase());
    expect(typeof res[0].value).toBe("number");
  });
});
