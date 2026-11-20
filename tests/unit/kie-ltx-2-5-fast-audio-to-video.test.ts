import { describe, expect, it } from "vitest";
import {
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  Ltx25FastAudioToVideoInputSchema,
  Ltx25FastAudioToVideoRequestSchema,
  MediaGenerationRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// LTX 2.5 Fast audio-to-video, from
// https://docs.kie.ai/market/ltx/2-5-fast-audio-to-video as read on 2026-11-19
// and re-read on 2026-11-20 (ac-ium3f4).
const model = "ltx/2-5-fast-audio-to-video";
const audio_url = "https://example.com/voice.mp3";
const image_url = "https://example.com/portrait.jpg";

const parse = (input: Record<string, unknown>) =>
  Ltx25FastAudioToVideoRequestSchema.safeParse({ model, input });

const issues = (input: Record<string, unknown>) => {
  const result = parse(input);
  return result.success
    ? []
    : result.error.issues.map(({ path, message }) => ({ path, message }));
};

describe("LTX 2.5 Fast audio-to-video request schema", () => {
  it("applies the documented defaults and leaves duration, image and seed unset", () => {
    expect(
      Ltx25FastAudioToVideoRequestSchema.parse({
        model,
        input: { audio_url, prompt: "x" },
      }).input
    ).toEqual({ audio_url, prompt: "x", resolution: "1080p", fps: 24 });
  });

  it("is registered, guarded and in the createTask union", () => {
    expect(KIE_MEDIA_MODELS).toContain(model);
    expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
    expect(CREATE_TASK_GUARDS[model]).toBe(Ltx25FastAudioToVideoRequestSchema);
    expect(
      MediaGenerationRequestSchema.safeParse({
        model,
        input: { audio_url, prompt: "x", resolution: "720p", duration: 2 },
      }).success
    ).toBe(true);
  });

  it("requires an audio URL and a prompt; the first-frame image is optional", () => {
    expect(parse({ prompt: "x" }).success).toBe(false);
    expect(parse({ audio_url: "voice.mp3", prompt: "x" }).success).toBe(false);
    expect(parse({ audio_url }).success).toBe(false);
    expect(parse({ audio_url, prompt: "" }).success).toBe(false);
    expect(parse({ audio_url, prompt: "x".repeat(5001) }).success).toBe(false);
    expect(parse({ audio_url, image_url, prompt: "x" }).success).toBe(true);
    expect(
      parse({ audio_url, image_url: "portrait.jpg", prompt: "x" }).success
    ).toBe(false);
  });

  it("has no aspect_ratio: the image sets it, else 16:9", () => {
    expect(Object.keys(Ltx25FastAudioToVideoInputSchema.shape).sort()).toEqual([
      "audio_url",
      "duration",
      "fps",
      "image_url",
      "prompt",
      "resolution",
      "seed",
    ]);
  });

  it.each([2, 2.5, 6.01, 20])("accepts duration %d", (duration) => {
    expect(parse({ audio_url, prompt: "x", duration }).success).toBe(true);
  });

  it.each([1.99, 0, -1, 20.01, "2"])("rejects duration %j", (duration) => {
    expect(parse({ audio_url, prompt: "x", duration }).success).toBe(false);
  });

  it("allows at most 10 seconds at 1440p or at 48 or 50 fps", () => {
    const path = ["input", "duration"];
    expect(
      issues({ audio_url, prompt: "x", resolution: "1440p", duration: 10.5 })
    ).toEqual([
      { path, message: "LTX 2.5 Fast allows at most 10 seconds at 1440p" },
    ]);
    expect(issues({ audio_url, prompt: "x", fps: 48, duration: 12 })).toEqual([
      { path, message: "LTX 2.5 Fast allows at most 10 seconds at 48 fps" },
    ]);
    for (const input of [
      { resolution: "1440p", duration: 10 },
      { fps: 50, duration: 2.75 },
      { resolution: "1440p", fps: 50 },
      { resolution: "1080p", fps: 25, duration: 20 },
    ])
      expect(parse({ audio_url, prompt: "x", ...input }).success).toBe(true);
  });

  it.each(["720p", "1080p", "1440p"])("accepts resolution %s", (resolution) => {
    expect(parse({ audio_url, prompt: "x", resolution }).success).toBe(true);
  });

  it.each([24, 25, 48, 50])("accepts fps %d", (fps) => {
    expect(parse({ audio_url, prompt: "x", fps }).success).toBe(true);
  });

  it.each([30, "24"])("rejects fps %j", (fps) => {
    expect(parse({ audio_url, prompt: "x", fps }).success).toBe(false);
  });

  it.each([-1, 2147483648, 1.5])("rejects seed %j", (seed) => {
    expect(parse({ audio_url, prompt: "x", seed }).success).toBe(false);
  });
});

describe("LTX 2.5 Fast audio-to-video descriptor", () => {
  const fields = modelInputSchemas[model].fields;

  it("describes every schema field, with the documented bounds and defaults", () => {
    expect(modelInputSchemas[model].type).toBe("video");
    expect(Object.keys(fields).sort()).toEqual(
      Object.keys(Ltx25FastAudioToVideoInputSchema.shape).sort()
    );
    expect(fields.audio_url).toMatchObject({ type: "string", required: true });
    expect(fields.image_url).toMatchObject({ type: "string" });
    expect(fields.image_url).not.toHaveProperty("required");
    expect(fields.prompt).toMatchObject({ required: true, maxLength: 5000 });
    expect(fields.resolution).toMatchObject({
      enum: ["720p", "1080p", "1440p"],
      default: "1080p",
    });
    expect(fields.fps).toMatchObject({ enum: [24, 25, 48, 50], default: 24 });
    expect(fields.duration).toEqual(
      expect.objectContaining({ type: "number", minimum: 2, maximum: 20 })
    );
    expect(fields.duration).not.toHaveProperty("default");
    expect(fields.seed).toMatchObject({ minimum: 0, maximum: 2147483647 });
  });
});
