import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.workspace.analytics.query.usageByProductOverTime", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/workspace-usage-by-product-over-time");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("queries workspace usage as a tabular analytics response", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(
      provider.post.v1.workspace.analytics.query.usageByProductOverTime
    ).toBe(provider.v1.workspace.analytics.query.usageByProductOverTime);

    const response =
      await provider.v1.workspace.analytics.query.usageByProductOverTime({
        start_time: Date.UTC(2026, 0, 1),
        end_time: Date.UTC(2026, 0, 2),
        interval_seconds: 86400,
        group_by: ["product_type"],
        time_zone: "UTC",
      });

    expect(Array.isArray(response.columns)).toBe(true);
    expect(Array.isArray(response.column_types)).toBe(true);
    expect(Array.isArray(response.column_units)).toBe(true);
    expect(Array.isArray(response.rows)).toBe(true);
    expect(response.column_types).toHaveLength(response.columns.length);
    expect(response.column_units).toHaveLength(response.columns.length);

    for (const row of response.rows) {
      expect(row).toHaveLength(response.columns.length);
    }
  });
});
