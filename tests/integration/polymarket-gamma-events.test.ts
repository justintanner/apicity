import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createPolymarket } from "@apicity/polymarket";

// Active event from late 2025 — chosen at record time because it has a
// long-running window and stable id/slug.
const EVENT_ID = "16167";
const EVENT_SLUG = "microstrategy-sell-any-bitcoin-in-2025";

interface HarHeader {
  name: string;
  value: string;
}

interface HarRecording {
  log: {
    entries: Array<{
      response: {
        headers: HarHeader[];
      };
    }>;
  };
}

describe("polymarket gamma events surface", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("events() preserves deprecated bare-array compatibility", async () => {
    ctx = setupPolly("polymarket/gamma-events-list");
    const provider = createPolymarket();

    const res = await provider.get.gamma.events({ limit: 2, closed: false });

    // events() with a query param returns the list shape (no envelope).
    expect(Array.isArray(res)).toBe(true);
    if (Array.isArray(res)) {
      expect(res.length).toBeGreaterThan(0);
      const e = res[0];
      expect(typeof e.id).toBe("string");
      expect(typeof e.slug).toBe("string");
      expect(typeof e.title).toBe("string");
      expect(Array.isArray(e.markets)).toBe(true);
    }
  });

  it("events() legacy fixture records upstream deprecation headers", () => {
    const harPath = resolve(
      __dirname,
      "../recordings/polymarket_3782428595/" +
        "gamma-events-list_3407432115/recording.har"
    );
    const har = JSON.parse(readFileSync(harPath, "utf8")) as HarRecording;
    const headers = new Map(
      har.log.entries[0].response.headers.map((header) => [
        header.name.toLowerCase(),
        header.value,
      ])
    );

    expect(headers.get("deprecation")).toBe("true");
    expect(headers.get("sunset")).toBe("Fri, 01 May 2026 00:00:00 GMT");
    expect(headers.get("warning")).toBe('299 - "use /events/keyset"');
  });

  it("events(id) retrieves a single event", async () => {
    ctx = setupPolly("polymarket/gamma-events-by-id");
    const provider = createPolymarket();

    const e = await provider.get.gamma.events(EVENT_ID);

    // Single shape — narrow on the title field (lists return arrays).
    expect(Array.isArray(e)).toBe(false);
    if (!Array.isArray(e)) {
      expect(e.id).toBe(EVENT_ID);
      expect(e.slug).toBe(EVENT_SLUG);
      expect(typeof e.title).toBe("string");
    }
  });

  it("events.keyset() paginates with next_cursor envelope", async () => {
    ctx = setupPolly("polymarket/gamma-events-keyset");
    const provider = createPolymarket();

    const res = await provider.get.gamma.events.keyset({ limit: 2 });

    expect(Array.isArray(res.events)).toBe(true);
    expect(res.events.length).toBeGreaterThan(0);
    expect(typeof res.next_cursor).toBe("string");
  });

  it("events.slug(slug) retrieves an event by its slug", async () => {
    ctx = setupPolly("polymarket/gamma-events-by-slug");
    const provider = createPolymarket();

    const e = await provider.get.gamma.events.slug(EVENT_SLUG);

    expect(e.id).toBe(EVENT_ID);
    expect(e.slug).toBe(EVENT_SLUG);
  });

  it("events.tags(id) returns the event's tags as an array", async () => {
    ctx = setupPolly("polymarket/gamma-events-tags");
    const provider = createPolymarket();

    const tags = await provider.get.gamma.events.tags(EVENT_ID);

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
    const t = tags[0];
    expect(typeof t.id).toBe("string");
    expect(typeof t.label).toBe("string");
    expect(typeof t.slug).toBe("string");
  });
});
