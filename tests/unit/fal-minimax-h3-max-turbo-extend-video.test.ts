import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalMinimaxH3MaxTurboExtendVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "minimax/h3-max-turbo/extend-video";
const input = {
  video_url: "https://example.com/video.mp4",
  prompt: "The bird keeps flying.",
};
describe("MiniMax H3 Max Turbo extension contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3MaxTurbo.extendVideo;
    expect(leaf).toBe(provider.post.run.minimax.h3MaxTurbo.extendVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("applies the documented defaults", () =>
    expect(schema.parse(input)).toEqual({
      ...input,
      aspect_ratio: "auto",
      resolution: "768P",
      duration: 5,
      enable_prompt_expansion: true,
      enable_safety_checker: true,
      output: "extended",
    }));
  it.each([0.71, 1, 15])("accepts documented numeric duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(true)
  );
  it.each([0, 0.7, 15.1, "5"])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(false)
  );
  it("permits nullable seed and up to three audio references", () => {
    expect(
      schema.safeParse({
        ...input,
        seed: null,
        reference_audio_urls: ["a", "b", "c"],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...input, reference_audio_urls: ["a", "b", "c", "d"] })
        .success
    ).toBe(false);
  });
  it.each(["video_url", "prompt"])("rejects empty %s", (key) =>
    expect(schema.safeParse({ ...input, [key]: "" }).success).toBe(false)
  );
  it("enforces prompt limit", () =>
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(50001) }).success
    ).toBe(false));
  it.each([
    ["480P", 0.025],
    ["768P", 0.04],
    ["1080P", 0.08],
    ["2K", 0.16],
  ] as const)("prices %s continuation seconds", (resolution, rate) => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...input, resolution, duration: 2 },
      costHints: { inputDurationSeconds: 60 },
    });
    expect(estimate.usd).toBeCloseTo(rate * 2);
    expect(estimate.warnings).toEqual([]);
  });
  it("prices the default five-second 768P continuation", () =>
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: input }).usd
    ).toBe(0.2));
});
