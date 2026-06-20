import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  setupPollyWithPersistScrubber,
  teardownPolly,
  type PersistedHarRecording,
  type PollyContext,
} from "../harness";
import { createPolymarket } from "@apicity/polymarket";

const USER_ADDRESS = "0xf9ac4c4ef54ee6010a28299ec1d616b63bf7806e";
const CONDITION_ID =
  "0x384e2707bbb95da4bfa6f330fe7d5ccbec1c0a85e20be900cbf599987588e1a4";

function keepFirstJsonArrayEntry(recording: PersistedHarRecording): void {
  const content = recording.response?.content;
  const text = content?.text;
  if (!content || typeof text !== "string") return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }
  if (!Array.isArray(parsed) || parsed.length <= 1) return;

  const trimmed = JSON.stringify(parsed.slice(0, 1));
  content.text = trimmed;
  content.size = new TextEncoder().encode(trimmed).length;
  recording.response!.bodySize = content.size;
}

describe("polymarket current Data API public gaps", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("health() returns Data API status", async () => {
    ctx = setupPolly("polymarket/data-health");
    const provider = createPolymarket();

    const res = await provider.get.data.health();

    expect(res.data).toBe("OK");
  });

  it("traded(query) returns total traded market count", async () => {
    ctx = setupPolly("polymarket/data-traded");
    const provider = createPolymarket();

    const res = await provider.get.data.traded({ user: USER_ADDRESS });

    expect(res.user.toLowerCase()).toBe(USER_ADDRESS.toLowerCase());
    expect(typeof res.traded).toBe("number");
  });

  it("closedPositions(query) lists closed positions", async () => {
    ctx = setupPolly("polymarket/data-closed-positions");
    const provider = createPolymarket();

    const res = await provider.get.data.closedPositions({
      user: USER_ADDRESS,
      limit: 1,
    });

    expect(Array.isArray(res)).toBe(true);
    if (res.length > 0) {
      expect(res[0].proxyWallet.toLowerCase()).toBe(USER_ADDRESS.toLowerCase());
      expect(typeof res[0].realizedPnl).toBe("number");
    }
  });

  it("marketPositions(query) lists positions grouped by outcome token", async () => {
    ctx = setupPolly("polymarket/data-market-positions");
    const provider = createPolymarket();

    const res = await provider.get.data.marketPositions({
      market: CONDITION_ID,
      limit: 1,
    });

    expect(Array.isArray(res)).toBe(true);
    if (res.length > 0) {
      expect(typeof res[0].token).toBe("string");
      expect(Array.isArray(res[0].positions)).toBe(true);
    }
  });

  it("positions.combos(query) returns combo positions and pagination", async () => {
    ctx = setupPolly("polymarket/data-combo-positions");
    const provider = createPolymarket();

    const res = await provider.get.data.positions.combos({
      user: USER_ADDRESS,
      limit: 1,
    });

    expect(Array.isArray(res.combos)).toBe(true);
    expect(typeof res.pagination.has_more).toBe("boolean");
  });

  it("activity.combos(query) returns combo activity and pagination", async () => {
    ctx = setupPolly("polymarket/data-combo-activity");
    const provider = createPolymarket();

    const res = await provider.get.data.activity.combos({
      user: USER_ADDRESS,
      limit: 1,
    });

    expect(Array.isArray(res.activity)).toBe(true);
    expect(typeof res.pagination.has_more).toBe("boolean");
  });

  it("builders.leaderboard(query) returns aggregated builder rankings", async () => {
    ctx = setupPolly("polymarket/data-builders-leaderboard");
    const provider = createPolymarket();

    const res = await provider.get.data.builders.leaderboard({
      timePeriod: "DAY",
      limit: 1,
    });

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(typeof res[0].builder).toBe("string");
    expect(typeof res[0].volume).toBe("number");
  });

  it("builders.volume(query) returns daily builder volume rows", async () => {
    ctx = setupPollyWithPersistScrubber(
      "polymarket/data-builders-volume",
      keepFirstJsonArrayEntry
    );
    const provider = createPolymarket();

    const res = await provider.get.data.builders.volume({ timePeriod: "DAY" });

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(typeof res[0].dt).toBe("string");
    expect(typeof res[0].volume).toBe("number");
  });

  it("leaderboard(query) returns trader leaderboard rankings", async () => {
    ctx = setupPolly("polymarket/data-leaderboard");
    const provider = createPolymarket();

    const res = await provider.get.data.leaderboard({
      timePeriod: "DAY",
      limit: 1,
    });

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(typeof res[0].proxyWallet).toBe("string");
    expect(typeof res[0].pnl).toBe("number");
  });
});
