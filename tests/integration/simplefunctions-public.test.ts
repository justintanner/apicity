import { afterEach, describe, expect, it } from "vitest";

import { createSimpleFunctions } from "@apicity/simplefunctions";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

function expectObject(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  return value as Record<string, unknown>;
}

describe("simplefunctions public integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("runs a small public Query API request", async () => {
    ctx = setupPolly("simplefunctions/query-fed-rate-cut");
    const provider = createSimpleFunctions();

    const result = await provider.api.public.query({
      q: "federal reserve rate cut",
      mode: "raw",
      sources: ["kalshi", "polymarket"],
      limit: 3,
    });

    expect(result.query).toBeTypeOf("string");
    expectObject(result);
  });

  it("checks the real-time data API heartbeat", async () => {
    ctx = setupPolly("simplefunctions/data-heartbeat");
    const provider = createSimpleFunctions();

    const result = await provider.data.v1.heartbeat();

    expect(result.markets_tracked).toBeTypeOf("number");
    expect(result.generated_at).toBeTypeOf("number");
  });

  it("searches the separate real-time data API base", async () => {
    ctx = setupPolly("simplefunctions/data-search-fed");
    const provider = createSimpleFunctions();

    const result = await provider.data.v1.search({ q: "fed", limit: 3 });

    expect(result.query).toBe("fed");
    expect(Array.isArray(result.results)).toBe(true);
    if (result.results.length > 0) {
      expect(result.results[0].ticker).toBeTypeOf("string");
    }
  });

  it("reads an agent world JSON snapshot", async () => {
    ctx = setupPolly("simplefunctions/agent-world-snapshot-json");
    const provider = createSimpleFunctions();

    const result = await provider.api.agent.world({
      format: "json",
      op: "snapshot",
      limit: 3,
    });

    const body = expectObject(result);
    expect(Object.keys(body).length).toBeGreaterThan(0);
  });

  it("searches public analytical market data", async () => {
    ctx = setupPolly("simplefunctions/public-search-fed");
    const provider = createSimpleFunctions();

    const result = await provider.api.public.search({ q: "fed", limit: 3 });

    const body = expectObject(result);
    expect(Object.keys(body).length).toBeGreaterThan(0);
  });

  it("reads the public index summary", async () => {
    ctx = setupPolly("simplefunctions/public-index");
    const provider = createSimpleFunctions();

    const index = await provider.api.public.index();

    expect(Object.keys(expectObject(index)).length).toBeGreaterThan(0);
  });
});
