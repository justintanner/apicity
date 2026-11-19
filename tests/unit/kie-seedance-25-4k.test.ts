import { describe, expect, it } from "vitest";
import {
  Seedance25DraftRequestSchema,
  Seedance25FlashRequestSchema,
  Seedance25OmniReferenceTaskTypeSchema,
  Seedance25RequestSchema,
} from "../../packages/provider/kie/src/zod";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// Seedance 2.5's 4K tier and omni_reference_task_type, from
// https://docs.kie.ai/market/bytedance/seedance-2-5.md as read on 2026-11-19
// (ac-vggwxn).
const model = "bytedance/seedance-2-5";
const IMAGE = "https://example.com/a.png";
const VIDEO = "https://example.com/a.mp4";
const AUDIO = "https://example.com/a.mp3";

const parse = (input: Record<string, unknown>) =>
  Seedance25RequestSchema.safeParse({ model, input });

const messages = (input: Record<string, unknown>) => {
  const result = parse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("Seedance 2.5 4K", () => {
  it("accepts 4k for text, frame and reference requests", () => {
    for (const input of [
      { prompt: "x" },
      { first_frame_url: IMAGE, last_frame_url: IMAGE },
      { prompt: "x", reference_video_urls: [VIDEO], aspect_ratio: "16:9" },
    ]) {
      const result = parse({ ...input, resolution: "4k" });
      expect(result.success, JSON.stringify(input)).toBe(true);
      expect(result.data?.input.resolution).toBe("4k");
    }
  });

  it("keeps draft mode at 480p", () => {
    expect(messages({ prompt: "x", draft: true, resolution: "4k" })).toEqual([
      "Seedance 2.5 draft mode requires 480p resolution",
    ]);
  });

  it("keeps the draft render at 1080p", () => {
    expect(
      Seedance25DraftRequestSchema.safeParse({
        model: "bytedance/seedance-2-5-draft",
        input: { draft_task_id: "task", resolution: "4k" },
      }).success
    ).toBe(false);
  });

  it("describes the 4k tier", () => {
    const resolution = modelInputSchemas[model]?.fields.resolution;
    expect(resolution?.enum).toEqual(["480p", "720p", "1080p", "4k"]);
    expect(resolution?.description).toBe(
      Seedance25RequestSchema.shape.input.shape.resolution.description
    );
    expect(resolution?.description).toContain("H.265 (HEVC) 10-bit");
  });
});

describe("Seedance 2.5 omni_reference_task_type", () => {
  it("shares one task-type vocabulary with Flash", () => {
    expect(Seedance25OmniReferenceTaskTypeSchema.options).toEqual([
      "auto",
      "reference",
      "edit",
      "extend",
    ]);
    expect(modelInputSchemas[model]?.fields.omni_reference_task_type).toEqual(
      modelInputSchemas["bytedance/seedance-2-5-flash"]?.fields
        .omni_reference_task_type
    );
  });

  it("takes it only with reference materials", () => {
    expect(messages({ prompt: "x", omni_reference_task_type: "auto" })).toEqual(
      [
        "omni_reference_task_type requires reference_image_urls, reference_video_urls or reference_audio_urls",
      ]
    );
    expect(
      messages({ first_frame_url: IMAGE, omni_reference_task_type: "auto" })
    ).toEqual([
      "omni_reference_task_type requires reference_image_urls, reference_video_urls or reference_audio_urls",
    ]);
    for (const [type, field, url] of [
      ["auto", "reference_image_urls", IMAGE],
      ["reference", "reference_audio_urls", AUDIO],
    ] as const) {
      expect(
        parse({
          prompt: "x",
          [field]: [url],
          omni_reference_task_type: type,
          aspect_ratio: "16:9",
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
        resolution: "4k",
      }).success
    ).toBe(true);
  });

  it("holds edit to duration -1, which the schema default of 5 is not", () => {
    const edit = {
      prompt: "x",
      reference_video_urls: [VIDEO],
      omni_reference_task_type: "edit",
    };
    expect(messages(edit)).toEqual([
      "omni_reference_task_type edit requires duration -1",
    ]);
    expect(parse({ ...edit, duration: -1 }).success).toBe(true);
  });

  it("reports the same issues as Flash for the same request", () => {
    const flash = (input: Record<string, unknown>) => {
      const result = Seedance25FlashRequestSchema.safeParse({
        model: "bytedance/seedance-2-5-flash",
        input,
      });
      return result.success ? [] : result.error.issues.map((i) => i.message);
    };
    for (const input of [
      { prompt: "x", omni_reference_task_type: "reference" },
      {
        prompt: "x",
        reference_audio_urls: [AUDIO],
        omni_reference_task_type: "edit",
        aspect_ratio: "1:1",
        duration: 5,
      },
      {
        prompt: "x",
        reference_video_urls: [VIDEO],
        omni_reference_task_type: "edit",
        duration: -1,
      },
    ]) {
      expect(messages(input), JSON.stringify(input)).toEqual(flash(input));
    }
  });
});
