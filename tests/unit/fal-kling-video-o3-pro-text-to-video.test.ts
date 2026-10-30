import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createFal,
  type FalKlingVideoO3ProTextToVideoRequest,
  type FalKlingVideoO3ProTextToVideoResponse,
} from "@apicity/fal";
import {
  FalKlingVideoO3ProTextToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

const endpoint = "fal-ai/kling-video/o3/pro/text-to-video";

describe("Kling O3 Pro text-to-video", () => {
  it("exposes the new pro leaf beside standard and 4k", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.klingVideo.o3.pro.textToVideo;
    expect(leaf).toBe(provider.post.run.klingVideo.o3.pro.textToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(typeof provider.run.klingVideo.o3.standard.imageToVideo).toBe(
      "function"
    );
    expect(typeof provider.run.klingVideo.o3p4k.textToVideo).toBe("function");
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKlingVideoO3ProTextToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKlingVideoO3ProTextToVideoResponse>();
  });

  it("defaults to five seconds without audio and requires a prompt or shots", () => {
    expect(schema.parse({ prompt: "cat" })).toEqual({
      enable_safety_checker: true,
      prompt: "cat",
      duration: "5",
      aspect_ratio: "16:9",
      generate_audio: false,
      shot_type: "customize",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(
      schema.parse({ multi_prompt: [{ prompt: "cat" }] }).multi_prompt
    ).toEqual([{ prompt: "cat", duration: "5" }]);
    expect(schema.safeParse({ prompt: "x".repeat(2501) }).success).toBe(false);
    expect(schema.safeParse({ prompt: "x".repeat(2500) }).success).toBe(true);
  });

  it("accepts only documented duration, aspect and shot values", () => {
    for (const duration of ["3", "15"])
      expect(schema.safeParse({ prompt: "cat", duration }).success).toBe(true);
    for (const duration of ["2", "16", 3])
      expect(schema.safeParse({ prompt: "cat", duration }).success).toBe(false);
    for (const aspect_ratio of ["16:9", "9:16", "1:1"])
      expect(schema.safeParse({ prompt: "cat", aspect_ratio }).success).toBe(
        true
      );
    expect(
      schema.safeParse({ prompt: "cat", aspect_ratio: "auto" }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        multi_prompt: [{ prompt: "cat", duration: "1" }],
        shot_type: "intelligent",
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({ multi_prompt: [{ prompt: "cat", duration: "16" }] })
        .success
    ).toBe(false);
  });

  it("prices single-shot durations by audio and warns for unknown multi-shot billing", () => {
    const estimate = (payload: Record<string, unknown>) =>
      computeEstimate({ provider: "fal", endpoint, payload });
    expect(
      estimate({ prompt: "cat", duration: "3", generate_audio: false }).usd
    ).toBeCloseTo(0.336);
    expect(estimate({ prompt: "cat" }).usd).toBeCloseTo(0.56);
    expect(
      estimate({ prompt: "cat", duration: "5", generate_audio: true }).usd
    ).toBeCloseTo(0.7);
    expect(
      estimate({ multi_prompt: [{ prompt: "cat", duration: "3" }] }).warnings
        .length
    ).toBeGreaterThan(0);
  });
});
