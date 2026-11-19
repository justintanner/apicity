import { describe, expect, it } from "vitest";
import {
  Seedance25FlashRequestSchema,
  Seedance25RequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// Seedance 2.5 Flash, from https://docs.kie.ai/market/bytedance/seedance-2-5-flash
// as read on 2026-11-19 (ac-zrziuf).
const model = "bytedance/seedance-2-5-flash";
const IMAGE = "https://example.com/a.png";
const VIDEO = "https://example.com/a.mp4";
const AUDIO = "https://example.com/a.mp3";

const parse = (input: Record<string, unknown>) =>
  Seedance25FlashRequestSchema.safeParse({ model, input });

const messages = (input: Record<string, unknown>) => {
  const result = parse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("Seedance 2.5 Flash request schema", () => {
  it("applies the documented defaults and leaves duration unset", () => {
    expect(
      Seedance25FlashRequestSchema.parse({ model, input: { prompt: "x" } })
        .input
    ).toEqual({
      prompt: "x",
      return_last_frame: false,
      generate_audio: false,
      resolution: "720p",
      aspect_ratio: "adaptive",
      output_format: "mp4",
      nsfw_checker: false,
    });
  });

  it("is the createTask guard for the model", () => {
    expect(CREATE_TASK_GUARDS[model]).toBe(Seedance25FlashRequestSchema);
  });

  it.each(["480p", "720p"])("accepts %s", (resolution) => {
    expect(parse({ prompt: "x", resolution }).success).toBe(true);
  });

  it.each(["1080p", "4k"])("rejects %s, which Flash does not offer", (r) => {
    expect(parse({ prompt: "x", resolution: r }).success).toBe(false);
  });

  it.each([-1, 4, 30])("accepts duration %d", (duration) => {
    expect(parse({ prompt: "x", duration }).success).toBe(true);
  });

  it.each([0, 3, 31, 4.5, "5"])("rejects duration %j", (duration) => {
    expect(parse({ prompt: "x", duration }).success).toBe(false);
  });

  it("holds the Flash reference limits: 10 images, 5 videos, 5 audio clips", () => {
    const ok = {
      prompt: "x",
      reference_image_urls: Array(10).fill(IMAGE),
      reference_video_urls: Array(5).fill(VIDEO),
      reference_audio_urls: Array(5).fill(AUDIO),
    };
    expect(parse(ok).success).toBe(true);
    for (const [field, url, max] of [
      ["reference_image_urls", IMAGE, 10],
      ["reference_video_urls", VIDEO, 5],
      ["reference_audio_urls", AUDIO, 5],
    ] as const) {
      expect(
        parse({ ...ok, [field]: Array(max + 1).fill(url) }).success,
        field
      ).toBe(false);
    }
  });

  it("caps the prompt at 20480 characters", () => {
    expect(parse({ prompt: "a".repeat(20480) }).success).toBe(true);
    expect(parse({ prompt: "a".repeat(20481) }).success).toBe(false);
  });

  it("has no draft mode", () => {
    expect(Seedance25FlashRequestSchema.shape.input.shape).not.toHaveProperty(
      "draft"
    );
  });

  it("requires a prompt for text-to-video only", () => {
    expect(messages({})).toEqual([
      "Seedance 2.5 Flash text-to-video requires prompt",
    ]);
    expect(parse({ first_frame_url: IMAGE }).success).toBe(true);
    expect(parse({ reference_image_urls: [IMAGE] }).success).toBe(true);
    // Audio-only references: a prompt plus reference audio.
    expect(parse({ prompt: "x", reference_audio_urls: [AUDIO] }).success).toBe(
      true
    );
  });

  it("keeps the frame and reference scenarios apart", () => {
    expect(
      messages({ first_frame_url: IMAGE, reference_video_urls: [VIDEO] })
    ).toEqual([
      "reference_video_urls cannot be combined with first_frame_url or last_frame_url",
    ]);
    expect(messages({ prompt: "x", last_frame_url: IMAGE })).toEqual([
      "last_frame_url requires first_frame_url",
    ]);
    expect(messages({ first_frame_url: IMAGE, aspect_ratio: "16:9" })).toEqual([
      "Seedance 2.5 Flash first-frame and first-last-frame tasks only support adaptive aspect ratio",
    ]);
  });

  it("takes omni_reference_task_type only with reference materials", () => {
    expect(
      messages({ prompt: "x", omni_reference_task_type: "reference" })
    ).toEqual([
      "omni_reference_task_type requires reference_image_urls, reference_video_urls or reference_audio_urls",
    ]);
    for (const type of ["auto", "reference"]) {
      expect(
        parse({
          prompt: "x",
          reference_image_urls: [IMAGE],
          omni_reference_task_type: type,
          aspect_ratio: "16:9",
          duration: 5,
        }).success,
        type
      ).toBe(true);
    }
    expect(
      parse({
        prompt: "x",
        reference_image_urls: [IMAGE],
        omni_reference_task_type: "remix",
      }).success
    ).toBe(false);
  });

  it("holds edit and extend to a reference video at the adaptive ratio", () => {
    expect(
      messages({
        prompt: "x",
        reference_image_urls: [IMAGE],
        omni_reference_task_type: "extend",
        aspect_ratio: "16:9",
      })
    ).toEqual([
      "omni_reference_task_type extend requires reference_video_urls",
      "omni_reference_task_type extend requires adaptive aspect_ratio",
    ]);
    expect(
      parse({
        prompt: "x",
        reference_video_urls: [VIDEO],
        omni_reference_task_type: "extend",
        duration: 5,
      }).success
    ).toBe(true);
  });

  it("holds edit to duration -1", () => {
    const edit = {
      prompt: "x",
      reference_video_urls: [VIDEO],
      omni_reference_task_type: "edit",
    };
    expect(messages(edit)).toEqual([
      "omni_reference_task_type edit requires duration -1",
    ]);
    expect(messages({ ...edit, duration: 5 })).toEqual([
      "omni_reference_task_type edit requires duration -1",
    ]);
    expect(parse({ ...edit, duration: -1 }).success).toBe(true);
  });

  it("describes the same fields it parses", () => {
    const descriptor = modelInputSchemas[model];
    expect(descriptor?.type).toBe("video");
    expect(Object.keys(descriptor!.fields).sort()).toEqual(
      Object.keys(Seedance25FlashRequestSchema.shape.input.shape).sort()
    );
    expect(descriptor!.fields.resolution.enum).toEqual(["480p", "720p"]);
    expect(descriptor!.fields.duration).not.toHaveProperty("default");
  });
});

describe("Seedance 2.5 keeps its own rules after the shared scenario helper", () => {
  it("still names Seedance 2.5 in its frame message and checks draft mode", () => {
    const result = Seedance25RequestSchema.safeParse({
      model: "bytedance/seedance-2-5",
      input: {
        first_frame_url: IMAGE,
        aspect_ratio: "16:9",
        draft: true,
        resolution: "720p",
      },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      "Seedance 2.5 draft mode requires 480p resolution",
      "Seedance 2.5 first-frame and first-last-frame tasks only support adaptive aspect ratio",
    ]);
  });
});
