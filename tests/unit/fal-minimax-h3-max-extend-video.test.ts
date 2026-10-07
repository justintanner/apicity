import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalMinimaxH3MaxExtendVideoRequestSchema as schema,
  FalMinimaxH3MaxTurboExtendVideoRequestSchema as twin,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "minimax/h3-max/extend-video";
const input = {
  video_url: "https://example.com/video.mp4",
  prompt: "The bird keeps flying.",
};

describe("MiniMax H3 Max video extension contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3Max.extendVideo;
    expect(leaf).toBe(provider.post.run.minimax.h3Max.extendVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });

  it("applies the documented defaults and leaves seed and audio absent", () =>
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      aspect_ratio: "auto",
      resolution: "768P",
      duration: 5,
      enable_prompt_expansion: true,
      enable_safety_checker: true,
      output: "extended",
    }));

  it.each([0.71, 1, 15])("accepts documented duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(true)
  );

  it.each([0, 0.7, 15.1, "5"])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(false)
  );

  it("caps the prompt at 50,000 characters", () => {
    const at = schema.safeParse({ ...input, prompt: "p".repeat(50000) });
    const over = schema.safeParse({ ...input, prompt: "p".repeat(50001) });
    expect(at.success).toBe(true);
    expect(over.success).toBe(false);
  });

  it.each(["video_url", "prompt"])("rejects empty %s", (key) =>
    expect(schema.safeParse({ ...input, [key]: "" }).success).toBe(false)
  );

  it("requires a prompt", () =>
    expect(schema.safeParse({ video_url: input.video_url }).success).toBe(
      false
    ));

  it("permits up to three audio references", () => {
    const three = ["a", "b", "c"];
    expect(
      schema.safeParse({ ...input, reference_audio_urls: three }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...input, reference_audio_urls: [...three, "d"] })
        .success
    ).toBe(false);
  });

  it.each([null, 42])("accepts seed %s", (seed) =>
    expect(schema.safeParse({ ...input, seed }).success).toBe(true)
  );

  it("rejects a fractional seed", () =>
    expect(schema.safeParse({ ...input, seed: 1.5 }).success).toBe(false));

  it.each([
    ["resolution", "720P"],
    ["aspect_ratio", "2:1"],
    ["output", "full"],
  ])("rejects %s %s", (key, value) =>
    expect(schema.safeParse({ ...input, [key]: value }).success).toBe(false)
  );

  it("validates exactly like the turbo twin, unknown keys included", () => {
    const payloads: Record<string, unknown>[] = [
      input,
      { ...input, duration: 0.71 },
      { ...input, duration: 15 },
      { ...input, duration: 0.7 },
      { ...input, duration: "5" },
      { ...input, prompt: "p".repeat(50001) },
      { ...input, prompt: "" },
      { video_url: input.video_url },
      { ...input, reference_audio_urls: ["a", "b", "c"] },
      { ...input, reference_audio_urls: ["a", "b", "c", "d"] },
      { ...input, seed: null },
      { ...input, seed: 42 },
      { ...input, seed: 1.5 },
      { ...input, resolution: "720P" },
      { ...input, aspect_ratio: "2:1" },
      { ...input, output: "full" },
      {
        ...input,
        resolution: "480P",
        duration: 1,
        output: "continuation",
        enable_prompt_expansion: false,
      },
      { ...input, legacy: true },
    ];
    for (const payload of payloads) {
      const label = JSON.stringify(payload).slice(0, 120);
      const mine = schema.safeParse(payload);
      const theirs = twin.safeParse(payload);
      expect(mine.success, label).toBe(theirs.success);
      expect(mine.data, label).toStrictEqual(theirs.data);
    }
    expect(schema.parse({ ...input, legacy: true })).not.toHaveProperty(
      "legacy"
    );
  });

  it("describes the documented constraints without billing claims", () => {
    for (const key of [
      "video_url",
      "duration",
      "output",
      "reference_audio_urls",
    ] as const) {
      expect(schema.shape[key].description, key).toBeTruthy();
    }
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  it.each([
    ["minimal", input],
    ["2K 15-second", { ...input, resolution: "2K", duration: 15 }],
  ])("defers the %s payload to fal's estimate API", (_label, payload) => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    const estimate = computeEstimate({ provider: "fal", endpoint, payload });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings).toHaveLength(1);
    expect(estimate.warnings[0]).toContain(
      "POST https://api.fal.ai/v1/models/pricing/estimate"
    );
    expect(estimate.warnings[0]).toContain("fal.v1.models.pricing.estimate");
  });

  it("carries no local rate, slug or display name", () => {
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect(
      (MODEL_DISPLAY.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
  });
});
