import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import { Seedance2MiniRequestSchema } from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// Seedance 2.0 Mini's first and last frames, from
// https://docs.kie.ai/market/bytedance/seedance-2-mini.md as read on
// 2026-11-19 (ac-7cp4o7).
const model = "bytedance/seedance-2-mini";
const IMAGE = "https://example.com/first.png";
const LAST = "https://example.com/last.png";

const parse = (input: Record<string, unknown>) =>
  Seedance2MiniRequestSchema.safeParse({ model, input });

const messages = (input: Record<string, unknown>) => {
  const result = parse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("Seedance 2.0 Mini frames", () => {
  it("is the createTask guard for the model", () => {
    expect(CREATE_TASK_GUARDS[model]).toBe(Seedance2MiniRequestSchema);
  });

  it("accepts a first frame, and a first and last frame", () => {
    for (const input of [
      { prompt: "The cat blinks", first_frame_url: IMAGE },
      { prompt: "The cat turns", first_frame_url: IMAGE, last_frame_url: LAST },
      {
        prompt: "The cat turns",
        first_frame_url: "asset://asset-20260404242101-76djj",
        last_frame_url: "asset://asset-20260404242101-76dkk",
      },
    ]) {
      const result = parse(input);
      expect(result.success, JSON.stringify(input)).toBe(true);
      expect(result.data?.input.first_frame_url).toBe(input.first_frame_url);
    }
  });

  it("keeps the documented 16:9 default with a frame (no adaptive rule)", () => {
    const result = parse({ prompt: "The cat blinks", first_frame_url: IMAGE });
    expect(result.data?.input.aspect_ratio).toBe("16:9");
  });

  it.each([
    ["reference_image_urls", "https://example.com/ref.png"],
    ["reference_video_urls", "https://example.com/ref.mp4"],
    ["reference_audio_urls", "https://example.com/ref.mp3"],
  ] as const)("refuses a frame with %s", (field, url) => {
    for (const frame of ["first_frame_url", "last_frame_url"] as const) {
      expect(
        messages({ prompt: "x", [frame]: IMAGE, [field]: [url] }),
        frame
      ).toEqual([
        `${field} cannot be combined with first_frame_url or last_frame_url`,
      ]);
    }
  });

  it("ignores the empty reference arrays the schema defaults", () => {
    expect(
      messages({
        prompt: "x",
        first_frame_url: IMAGE,
        reference_image_urls: [],
        reference_video_urls: [],
        reference_audio_urls: [],
      })
    ).toEqual([]);
  });

  it("still takes references without a frame", () => {
    expect(
      messages({
        prompt: "x",
        reference_image_urls: ["https://example.com/ref.png"],
        reference_video_urls: ["https://example.com/ref.mp4"],
      })
    ).toEqual([]);
  });

  it.each(["", "not a url", "asset://", "asset:// spaced"])(
    "rejects the frame reference %j",
    (value) => {
      expect(parse({ prompt: "x", first_frame_url: value }).success).toBe(
        false
      );
    }
  );

  it("describes the same fields it parses", () => {
    const descriptor = modelInputSchemas[model];
    expect(Object.keys(descriptor.fields).sort()).toEqual(
      Object.keys(Seedance2MiniRequestSchema.shape.input.shape).sort()
    );
    expect(descriptor.fields.first_frame_url.type).toBe("string");
    expect(descriptor.fields.last_frame_url.type).toBe("string");
  });

  // A frame is an image, not video input, so it prices in the no-video
  // column: 3.8 / 8.2 credits per second at 480p / 720p.
  it.each([
    ["480p", 0.019],
    ["720p", 0.041],
  ] as const)(
    "prices a %s first-frame request in the no-video column",
    (resolution, rate) => {
      const result = computeEstimate({
        provider: "kie",
        payload: {
          model,
          input: {
            prompt: "x",
            first_frame_url: IMAGE,
            resolution,
            duration: 5,
          },
        },
      });
      expect(result.usd).toBeCloseTo(5 * rate, 12);
      expect(result.warnings).toEqual([]);
    }
  );
});
