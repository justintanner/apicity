import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBytedanceSeedance2p5FlashReferenceToVideoRequest,
  type FalBytedanceSeedance2p5FlashReferenceToVideoParsedRequest,
} from "@apicity/fal";
import {
  FAL_ENDPOINT_REQUEST_SCHEMAS,
  FalBytedanceSeedance2p5FlashReferenceToVideoRequestSchema as schema,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "bytedance/seedance-2.5/flash/reference-to-video";

describe("Seedance 2.5 Flash reference-to-video", () => {
  it("exposes the same schema and callable through both public paths", () => {
    const fal = createFal({ apiKey: "test-key" });
    const call = fal.run.bytedance.seedance2p5.flash.referenceToVideo;
    expect(call).toBe(
      fal.post.run.bytedance.seedance2p5.flash.referenceToVideo
    );
    expect(call.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalBytedanceSeedance2p5FlashReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p5FlashReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });

  it("applies the Flash defaults and accepts the documented options", () => {
    expect(schema.parse({})).toEqual({
      task: "reference",
      resolution: "720p",
      duration: "auto",
      aspect_ratio: "auto",
      generate_audio: true,
      bitrate_mode: "standard",
      codec: "auto",
      output_format: "mp4",
      return_last_frame: false,
    });
    for (const task of ["auto", "reference", "editing", "extension"]) {
      expect(
        schema.safeParse({
          prompt: null,
          task,
          resolution: "480p",
          duration: "30",
          aspect_ratio: "3:4",
          codec: "H265",
          output_format: "mov",
          return_last_frame: true,
          seed: null,
          end_user_id: null,
        }).success
      ).toBe(true);
    }
    for (const payload of [
      { resolution: "1080p" },
      { duration: "3" },
      { output_format: "webm" },
      { seed: 1.5 },
    ]) {
      expect(schema.safeParse(payload).success).toBe(false);
    }
  });

  it.each([
    ["image_urls", 10],
    ["video_urls", 5],
    ["audio_urls", 5],
  ] as const)("accepts up to the documented %s limit", (field, limit) => {
    const urls = Array<string>(limit).fill("https://example.com/reference");
    expect(schema.safeParse({ [field]: urls }).success).toBe(true);
    expect(schema.safeParse({ [field]: [...urls, urls[0]] }).success).toBe(
      false
    );
  });

  it("prices image references and discounts the combined video frames", () => {
    const base = { resolution: "480p", duration: "4", aspect_ratio: "1:1" };
    expect(MODEL_SLUGS.fal[endpoint]).toBe("sd2p5flash");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("Seedance 2.5 Flash");
    const estimate = (
      payload: Record<string, unknown>,
      inputDurationSeconds?: number
    ) =>
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...base, ...payload },
        costHints: { inputDurationSeconds },
      });
    expect(estimate({ image_urls: ["cat.jpg"] }).usd).toBeCloseTo(
      38.8 * 0.014,
      10
    );
    expect(estimate({ video_urls: ["cat.mp4"] }, 4).usd).toBeCloseTo(
      77.2 * 0.614 * 0.014,
      10
    );
    expect(estimate({ video_urls: ["cat.mp4"] }).warnings[0]).toContain(
      "inputDurationSeconds"
    );
    expect(estimate({ aspect_ratio: "auto" }).warnings[0]).toContain(
      "aspect_ratio"
    );
    expect(estimate({ task: "editing" }).warnings[0]).toContain("editing");
  });
});
