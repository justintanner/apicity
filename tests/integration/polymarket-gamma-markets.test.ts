import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createPolymarket } from "@apicity/polymarket";

const MARKET_ID = "540816";
const MARKET_SLUG = "russia-ukraine-ceasefire-before-gta-vi-554";

describe("polymarket gamma markets surface", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("markets() lists active markets as a bare JSON array", async () => {
    ctx = setupPolly("polymarket/gamma-markets-list");
    const provider = createPolymarket();

    const res = await provider.get.gamma.markets({ limit: 2, closed: false });

    expect(Array.isArray(res)).toBe(true);
    if (Array.isArray(res)) {
      expect(res.length).toBeGreaterThan(0);
      const m = res[0];
      expect(typeof m.id).toBe("string");
      expect(typeof m.slug).toBe("string");
      expect(typeof m.question).toBe("string");
    }
  });

  it("markets(id) retrieves a single market", async () => {
    ctx = setupPolly("polymarket/gamma-markets-by-id");
    const provider = createPolymarket();

    const m = await provider.get.gamma.markets(MARKET_ID);

    expect(Array.isArray(m)).toBe(false);
    if (!Array.isArray(m)) {
      expect(m.id).toBe(MARKET_ID);
      expect(m.slug).toBe(MARKET_SLUG);
    }
  });

  it("markets.keyset() paginates with next_cursor", async () => {
    ctx = setupPolly("polymarket/gamma-markets-keyset");
    const provider = createPolymarket();

    const res = await provider.get.gamma.markets.keyset({ limit: 2 });

    expect(Array.isArray(res.markets)).toBe(true);
    expect(res.markets.length).toBeGreaterThan(0);
    expect(typeof res.next_cursor).toBe("string");
  });

  it("markets.slug(slug) retrieves a market by its slug", async () => {
    ctx = setupPolly("polymarket/gamma-markets-by-slug");
    const provider = createPolymarket();

    const m = await provider.get.gamma.markets.slug(MARKET_SLUG);

    expect(m.id).toBe(MARKET_ID);
    expect(m.slug).toBe(MARKET_SLUG);
  });

  it("markets.tags(id) returns the market's tags as an array", async () => {
    ctx = setupPolly("polymarket/gamma-markets-tags");
    const provider = createPolymarket();

    const tags = await provider.get.gamma.markets.tags(MARKET_ID);

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
    const t = tags[0];
    expect(typeof t.id).toBe("string");
    expect(typeof t.label).toBe("string");
    expect(typeof t.slug).toBe("string");
  });
});
