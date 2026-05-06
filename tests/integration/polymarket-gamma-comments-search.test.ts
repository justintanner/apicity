import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

const EVENT_ID = 16167;
const COMMENT_ID = "2887316";
const USER_ADDRESS = "0x11acc648a3252c67eb55542a4d1625047527cb98";

describe("polymarket gamma comments + search surface", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("comments(query) lists comments under an event", async () => {
    ctx = setupPolly("polymarket/gamma-comments-list");
    const provider = polymarket();

    const res = await provider.get.gamma.comments({
      parent_entity_type: "Event",
      parent_entity_id: EVENT_ID,
      limit: 2,
    });

    expect(Array.isArray(res)).toBe(true);
    if (res.length > 0) {
      const c = res[0];
      expect(c.parentEntityType).toBe("Event");
      expect(c.parentEntityID).toBe(EVENT_ID);
      expect(typeof c.body).toBe("string");
    }
  });

  it("comments(id) returns the matching comment array", async () => {
    ctx = setupPolly("polymarket/gamma-comments-by-id");
    const provider = polymarket();

    const res = await provider.get.gamma.comments(COMMENT_ID);

    expect(Array.isArray(res)).toBe(true);
    if (res.length > 0) {
      expect(res[0].id).toBe(COMMENT_ID);
    }
  });

  it("comments.byUser(address) returns the user's comments", async () => {
    ctx = setupPolly("polymarket/gamma-comments-by-user");
    const provider = polymarket();

    const res = await provider.get.gamma.comments.byUser(USER_ADDRESS, {
      limit: 5,
    });

    expect(Array.isArray(res)).toBe(true);
  });

  it("search(query) returns events + markets + profiles buckets", async () => {
    ctx = setupPolly("polymarket/gamma-search");
    const provider = polymarket();

    const res = await provider.get.gamma.search({
      q: "trump",
      limit_per_type: 2,
    });

    // Only `events` is consistently populated for narrow text queries — the
    // markets and profiles buckets may be omitted entirely. Verify each bucket
    // is either an array or undefined.
    expect(Array.isArray(res.events)).toBe(true);
    expect(typeof res.pagination.hasMore).toBe("boolean");
    expect(typeof res.pagination.totalResults).toBe("number");
    expect(res.markets === undefined || Array.isArray(res.markets)).toBe(true);
    expect(res.profiles === undefined || Array.isArray(res.profiles)).toBe(
      true
    );
  });
});
