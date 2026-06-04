import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createPolymarket } from "@apicity/polymarket";

describe("polymarket gamma series + tags surface", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("series() lists series as a bare JSON array", async () => {
    ctx = setupPolly("polymarket/gamma-series-list");
    const provider = createPolymarket();

    const res = await provider.get.gamma.series({ limit: 1 });
    expect(Array.isArray(res)).toBe(true);
    if (Array.isArray(res)) {
      expect(res.length).toBeGreaterThan(0);
      expect(typeof res[0].id).toBe("string");
      expect(typeof res[0].slug).toBe("string");
    }
  });

  it("series(id) retrieves a single series", async () => {
    ctx = setupPolly("polymarket/gamma-series-by-id");
    const provider = createPolymarket();

    const s = await provider.get.gamma.series("1");
    expect(Array.isArray(s)).toBe(false);
    if (!Array.isArray(s)) {
      expect(s.id).toBe("1");
    }
  });

  it("tags() lists tags as a bare JSON array", async () => {
    ctx = setupPolly("polymarket/gamma-tags-list");
    const provider = createPolymarket();

    const res = await provider.get.gamma.tags({ limit: 2 });
    expect(Array.isArray(res)).toBe(true);
    if (Array.isArray(res)) {
      expect(res.length).toBeGreaterThan(0);
    }
  });

  it("tags(id) retrieves a single tag", async () => {
    ctx = setupPolly("polymarket/gamma-tags-by-id");
    const provider = createPolymarket();

    const t = await provider.get.gamma.tags("2");
    expect(Array.isArray(t)).toBe(false);
    if (!Array.isArray(t)) {
      expect(t.id).toBe("2");
      expect(typeof t.label).toBe("string");
    }
  });

  it("tags.slug(slug) retrieves a tag by its slug", async () => {
    ctx = setupPolly("polymarket/gamma-tags-by-slug");
    const provider = createPolymarket();

    const t = await provider.get.gamma.tags.slug("politics");
    expect(t.slug).toBe("politics");
  });

  it("tags.relatedTags(id) returns related-tag relationship rows", async () => {
    ctx = setupPolly("polymarket/gamma-tags-related-by-id");
    const provider = createPolymarket();

    const rels = await provider.get.gamma.tags.relatedTags("2");
    expect(Array.isArray(rels)).toBe(true);
    if (rels.length > 0) {
      expect(typeof rels[0].tagID).toBe("number");
      expect(typeof rels[0].relatedTagID).toBe("number");
      expect(typeof rels[0].rank).toBe("number");
    }
  });

  it("tags.relatedTags.slug(slug) returns related-tag rows by slug", async () => {
    ctx = setupPolly("polymarket/gamma-tags-related-by-slug");
    const provider = createPolymarket();

    const rels = await provider.get.gamma.tags.relatedTags.slug("politics");
    expect(Array.isArray(rels)).toBe(true);
  });
});
