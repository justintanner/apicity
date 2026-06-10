import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.workspace.analytics.requests", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/workspace-analytics-requests");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists workspace API request analytics", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const analytics = await provider.v1.workspace.analytics.requests({
      start_time: 4102444800000,
      limit: 1,
      sort: "asc",
    });

    expect(provider.post.v1.workspace.analytics.requests).toBe(
      provider.v1.workspace.analytics.requests
    );
    expect(Array.isArray(analytics.columns)).toBe(true);
    expect(Array.isArray(analytics.column_types)).toBe(true);
    expect(Array.isArray(analytics.rows)).toBe(true);
    expect(Array.isArray(analytics.column_units)).toBe(true);
    expect(analytics.column_types.length).toBe(analytics.columns.length);
    expect(analytics.column_units.length).toBe(analytics.columns.length);

    for (const row of analytics.rows) {
      expect(Array.isArray(row)).toBe(true);
      expect(row.length).toBe(analytics.columns.length);
    }
  });
});
