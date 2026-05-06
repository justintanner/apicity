import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

const TOKEN_ID =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";
const CONDITION_ID =
  "0x384e2707bbb95da4bfa6f330fe7d5ccbec1c0a85e20be900cbf599987588e1a4";

describe("polymarket clob markets surface", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("markets() lists markets with cursor pagination", async () => {
    ctx = setupPolly("polymarket/clob-markets-list");
    const provider = polymarket();

    const res = await provider.get.clob.markets();

    // markets() with no args returns the list shape — narrow via the envelope
    // fields, since the overload union is { data, ... } | Market.
    expect("data" in res && Array.isArray(res.data)).toBe(true);
    if ("data" in res) {
      expect(res.data.length).toBeGreaterThan(0);
      expect(typeof res.next_cursor).toBe("string");
      expect(typeof res.limit).toBe("number");
      expect(typeof res.count).toBe("number");
      const m = res.data[0];
      expect(typeof m.condition_id).toBe("string");
      expect(typeof m.question).toBe("string");
      expect(Array.isArray(m.tokens)).toBe(true);
    }
  });

  it("markets(conditionId) retrieves a single market", async () => {
    ctx = setupPolly("polymarket/clob-markets-by-id");
    const provider = polymarket();

    const m = await provider.get.clob.markets(CONDITION_ID);

    // Single-market shape — narrow on the question field.
    expect("question" in m).toBe(true);
    if ("question" in m) {
      expect(m.condition_id).toBe(CONDITION_ID);
      expect(typeof m.minimum_tick_size).toBe("number");
      expect(Array.isArray(m.tokens)).toBe(true);
      expect(m.tokens.length).toBe(2);
    }
  });

  it("samplingMarkets() returns active markets only", async () => {
    ctx = setupPolly("polymarket/clob-sampling-markets");
    const provider = polymarket();

    const res = await provider.get.clob.samplingMarkets();

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    // Sampling endpoint is documented to return only actively-trading markets.
    expect(res.data[0].active).toBe(true);
    expect(res.data[0].closed).toBe(false);
  });

  it("simplifiedMarkets() returns the leaner shape", async () => {
    ctx = setupPolly("polymarket/clob-simplified-markets");
    const provider = polymarket();

    const res = await provider.get.clob.simplifiedMarkets();

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    const sm = res.data[0];
    expect(typeof sm.condition_id).toBe("string");
    expect(Array.isArray(sm.tokens)).toBe(true);
    // Simplified shape lacks `question` text.
    expect("question" in sm).toBe(false);
  });

  it("samplingSimplifiedMarkets() returns active simplified markets", async () => {
    ctx = setupPolly("polymarket/clob-sampling-simplified-markets");
    const provider = polymarket();

    const res = await provider.get.clob.samplingSimplifiedMarkets();

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].active).toBe(true);
  });

  it("marketsByToken(tokenId) returns the condition + token pair", async () => {
    ctx = setupPolly("polymarket/clob-markets-by-token");
    const provider = polymarket();

    const res = await provider.get.clob.marketsByToken(TOKEN_ID);

    expect(res.condition_id).toBe(CONDITION_ID);
    expect(typeof res.primary_token_id).toBe("string");
    expect(typeof res.secondary_token_id).toBe("string");
    expect([res.primary_token_id, res.secondary_token_id]).toContain(TOKEN_ID);
  });

  it("clobMarkets(conditionId) returns the compact form", async () => {
    ctx = setupPolly("polymarket/clob-clob-markets");
    const provider = polymarket();

    const res = await provider.get.clob.clobMarkets(CONDITION_ID);

    expect(res.c).toBe(CONDITION_ID);
    expect(Array.isArray(res.t)).toBe(true);
    expect(res.t.length).toBe(2);
    expect(typeof res.mts).toBe("number");
    expect(typeof res.ao).toBe("boolean");
  });
});
