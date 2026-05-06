import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

describe("polymarket gamma sports surface", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("sports() lists supported sports", async () => {
    ctx = setupPolly("polymarket/gamma-sports-list");
    const provider = polymarket();

    const res = await provider.get.gamma.sports();

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    const s = res[0];
    expect(typeof s.id).toBe("number");
    expect(typeof s.sport).toBe("string");
  });

  it("sports.marketTypes() lists supported market-type identifiers", async () => {
    ctx = setupPolly("polymarket/gamma-sports-market-types");
    const provider = polymarket();

    const res = await provider.get.gamma.sports.marketTypes();

    expect(Array.isArray(res.marketTypes)).toBe(true);
    expect(res.marketTypes.length).toBeGreaterThan(0);
    expect(typeof res.marketTypes[0]).toBe("string");
  });
});
