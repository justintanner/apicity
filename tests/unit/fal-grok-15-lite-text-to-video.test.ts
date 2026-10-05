import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalXaiGrokImagineVideoV1p5LiteTextToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "xai/grok-imagine-video/v1.5/lite/text-to-video";
describe("Grok 1.5 Lite text-to-video", () => {
  it("registers the leaf, aliases, and queue schema", () => {
    const p = createFal({ apiKey: "test-key" });
    const leaf = p.run.xai.grokImagineVideo.v1p5.lite.textToVideo;
    expect(leaf).toBe(p.post.run.xai.grokImagineVideo.v1p5.lite.textToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("uses six seconds, 720p, and 16:9 by default", () =>
    expect(schema.parse({ prompt: "Panda" })).toEqual({
      prompt: "Panda",
      duration: 6,
      resolution: "720p",
      aspect_ratio: "16:9",
    }));
  it.each([1, 15])("accepts duration %s", (duration) =>
    expect(schema.safeParse({ prompt: "Panda", duration }).success).toBe(true)
  );
  it.each([0, 16, 1.5, "6"])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ prompt: "Panda", duration }).success).toBe(false)
  );
  it("enforces the 4096-character prompt maximum", () => {
    expect(schema.safeParse({ prompt: "p".repeat(4096) }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(4097) }).success).toBe(false);
  });
  it.each([
    ["480p", 0.02],
    ["720p", 0.03],
    ["1080p", 0.14],
  ] as const)("prices %s output", (resolution, rate) => {
    const e = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { prompt: "Panda", resolution, duration: 5 },
    });
    expect(e.usd).toBeCloseTo(rate * 5);
    expect(e.warnings).toEqual([]);
  });
  it("estimates the default duration and resolution", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { prompt: "Panda" },
      }).usd
    ).toBe(0.18));
});
