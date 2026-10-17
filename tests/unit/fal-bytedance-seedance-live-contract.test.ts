import { describe, expect, expectTypeOf, it } from "vitest";
import type { FalSeedance2p5TextToVideoResponse } from "@apicity/fal";
import {
  FalSeedance2p0FastImageToVideoRequestSchema,
  FalSeedance2p0FastReferenceToVideoRequestSchema,
  FalSeedance2p0FastTextToVideoRequestSchema,
  FalSeedance2p0ImageToVideoRequestSchema,
  FalSeedance2p0ReferenceToVideoRequestSchema,
  FalSeedance2p0TextToVideoRequestSchema,
  FalSeedance2p5ImageToVideoRequestSchema,
  FalSeedance2p5ReferenceToVideoRequestSchema,
  FalSeedance2p5TextToVideoRequestSchema,
} from "@apicity/fal/zod";

// The nine non-US Seedance 2.0, 2.0 Fast and 2.5 request schemas mirror the
// live queue OpenAPI Inputs read on 2026-10-17 (ac-f6nytq). `fields` and
// `required` are each Input's properties and required list; `resolutions` is
// its resolution enum and `offList` one value outside it.
const IMAGE = "https://example.com/cat.jpg";
const VIDEO = "https://example.com/ref.mp4";
const AUDIO = "https://example.com/ref.mp3";

const ENCODING = ["bitrate_mode", "codec", "end_user_id"];
const T2V_2P0 = [
  "prompt",
  "resolution",
  "duration",
  "aspect_ratio",
  "generate_audio",
  ...ENCODING,
];
const I2V_2P0 = [...T2V_2P0, "image_url", "end_image_url"];
const R2V_2P0 = [...T2V_2P0, "image_urls", "video_urls", "audio_urls"];
const T2V_2P5 = [...T2V_2P0, "draft"];
const I2V_2P5 = [...T2V_2P5, "image_url", "end_image_url"];
const R2V_2P5 = [
  ...T2V_2P5,
  "task",
  "image_urls",
  "video_urls",
  "audio_urls",
  "seed",
];

const RES_2P0 = ["480p", "720p", "1080p", "4k"];
const RES_FAST = ["480p", "720p"];
const RES_2P5 = ["480p", "720p", "1080p"];

const NINE = [
  {
    name: "2.0 text-to-video",
    schema: FalSeedance2p0TextToVideoRequestSchema,
    base: { prompt: "p" },
    fields: T2V_2P0,
    required: ["prompt"],
    resolutions: RES_2P0,
    offList: "8k",
  },
  {
    name: "2.0 image-to-video",
    schema: FalSeedance2p0ImageToVideoRequestSchema,
    base: { prompt: "p", image_url: IMAGE },
    fields: I2V_2P0,
    required: ["image_url", "prompt"],
    resolutions: RES_2P0,
    offList: "8k",
  },
  {
    name: "2.0 reference-to-video",
    schema: FalSeedance2p0ReferenceToVideoRequestSchema,
    base: { prompt: "p", image_urls: [IMAGE] },
    fields: R2V_2P0,
    required: ["prompt"],
    resolutions: RES_2P0,
    offList: "8k",
  },
  {
    name: "2.0 Fast text-to-video",
    schema: FalSeedance2p0FastTextToVideoRequestSchema,
    base: { prompt: "p" },
    fields: T2V_2P0,
    required: ["prompt"],
    resolutions: RES_FAST,
    offList: "1080p",
  },
  {
    name: "2.0 Fast image-to-video",
    schema: FalSeedance2p0FastImageToVideoRequestSchema,
    base: { prompt: "p", image_url: IMAGE },
    fields: I2V_2P0,
    required: ["image_url", "prompt"],
    resolutions: RES_FAST,
    offList: "1080p",
  },
  {
    name: "2.0 Fast reference-to-video",
    schema: FalSeedance2p0FastReferenceToVideoRequestSchema,
    base: { prompt: "p", image_urls: [IMAGE] },
    fields: R2V_2P0,
    required: ["prompt"],
    resolutions: RES_FAST,
    offList: "1080p",
  },
  {
    name: "2.5 text-to-video",
    schema: FalSeedance2p5TextToVideoRequestSchema,
    base: { prompt: "p" },
    fields: T2V_2P5,
    required: ["prompt"],
    resolutions: RES_2P5,
    offList: "4k",
  },
  {
    name: "2.5 image-to-video",
    schema: FalSeedance2p5ImageToVideoRequestSchema,
    base: { image_url: IMAGE },
    fields: I2V_2P5,
    required: ["image_url"],
    resolutions: RES_2P5,
    offList: "4k",
  },
  {
    name: "2.5 reference-to-video",
    schema: FalSeedance2p5ReferenceToVideoRequestSchema,
    base: {},
    fields: R2V_2P5,
    required: [],
    resolutions: RES_2P5,
    offList: "4k",
  },
];

describe.each(NINE)("Seedance $name live Input", (entry) => {
  const { schema, base } = entry;
  const ok = (extra: Record<string, unknown>) =>
    schema.safeParse({ ...base, ...extra }).success;

  it("declares exactly the live Input's fields", () => {
    expect(Object.keys(schema.shape).sort()).toEqual([...entry.fields].sort());
  });

  it("requires exactly the live Input's required fields", () => {
    const result = schema.safeParse({});
    const missing = result.success
      ? []
      : result.error.issues
          .filter((issue) => issue.code === "invalid_type")
          .map((issue) => String(issue.path[0]));
    expect(missing.sort()).toEqual(entry.required);
  });

  it("accepts each live resolution and rejects one outside the list", () => {
    for (const resolution of entry.resolutions) {
      expect(ok({ resolution }), resolution).toBe(true);
    }
    expect(ok({ resolution: entry.offList })).toBe(false);
  });

  it("closes bitrate_mode and codec on the live vocabularies", () => {
    expect(ok({ bitrate_mode: "standard", codec: "auto" })).toBe(true);
    expect(ok({ bitrate_mode: "high", codec: "H264" })).toBe(true);
    expect(ok({ codec: "H265" })).toBe(true);
    expect(ok({ codec: "VP9" })).toBe(false);
    expect(ok({ bitrate_mode: "ultra" })).toBe(false);
  });

  it("accepts a null end_user_id", () => {
    expect(ok({ end_user_id: null })).toBe(true);
  });
});

describe("Seedance seed follows each live Input", () => {
  // seed left the live 2.0, 2.0 Fast and 2.5 text- and image-to-video
  // Inputs; only 2.5 reference-to-video still declares it.
  it.each(NINE.filter((entry) => !entry.fields.includes("seed")))(
    "$name no longer declares seed",
    ({ schema, base }) => {
      const parsed = schema.parse({ ...base, seed: 7 });
      expect("seed" in parsed).toBe(false);
    }
  );

  it("keeps an integer or null seed on 2.5 reference-to-video", () => {
    const schema = FalSeedance2p5ReferenceToVideoRequestSchema;
    expect(schema.parse({ seed: 7 }).seed).toBe(7);
    expect(schema.parse({ seed: null }).seed).toBeNull();
    expect(schema.safeParse({ seed: 2.5 }).success).toBe(false);
  });
});

describe("Seedance 2.5 draft and task", () => {
  it.each([
    FalSeedance2p5TextToVideoRequestSchema,
    FalSeedance2p5ImageToVideoRequestSchema,
    FalSeedance2p5ReferenceToVideoRequestSchema,
  ])("takes a boolean draft flag (%#)", (schema) => {
    const base = { prompt: "p", image_url: IMAGE };
    expect(schema.parse({ ...base, draft: true }).draft).toBe(true);
    expect(schema.safeParse({ ...base, draft: "yes" }).success).toBe(false);
  });

  it("types the draft_id a draft-enabled text-to-video returns", () => {
    // The live Output declares draft_id as a string or null and does not
    // require it; draft/complete takes that id (ac-qstko3).
    expectTypeOf<FalSeedance2p5TextToVideoResponse["draft_id"]>().toEqualTypeOf<
      string | null | undefined
    >();
  });

  it("closes the reference-to-video task vocabulary", () => {
    const schema = FalSeedance2p5ReferenceToVideoRequestSchema;
    for (const task of ["reference", "editing", "extension"]) {
      expect(schema.safeParse({ task, video_urls: [VIDEO] }).success).toBe(
        true
      );
    }
    expect(schema.safeParse({ task: "remix" }).success).toBe(false);
  });

  it("keeps 2.5 image-to-video on the live const aspect_ratio", () => {
    const schema = FalSeedance2p5ImageToVideoRequestSchema;
    expect(schema.safeParse({ image_url: IMAGE, prompt: null }).success).toBe(
      true
    );
    expect(
      schema.safeParse({ image_url: IMAGE, aspect_ratio: "auto" }).success
    ).toBe(true);
    expect(
      schema.safeParse({ image_url: IMAGE, aspect_ratio: "16:9" }).success
    ).toBe(false);
  });
});

describe("Seedance nullable end frames", () => {
  it.each([
    FalSeedance2p0ImageToVideoRequestSchema,
    FalSeedance2p0FastImageToVideoRequestSchema,
    FalSeedance2p5ImageToVideoRequestSchema,
  ])("accepts a null end_image_url (%#)", (schema) => {
    expect(
      schema.safeParse({ prompt: "p", image_url: IMAGE, end_image_url: null })
        .success
    ).toBe(true);
  });
});

describe.each([
  ["2.0", FalSeedance2p0ReferenceToVideoRequestSchema],
  ["2.0 Fast", FalSeedance2p0FastReferenceToVideoRequestSchema],
])("Seedance %s reference-to-video documented rules", (_name, schema) => {
  const urls = (prefix: string, count: number) =>
    Array.from(
      { length: count },
      (_, i) => `https://example.com/${prefix}${i}`
    );

  it("allows at most 12 files across all modalities", () => {
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: urls("i", 9),
        video_urls: urls("v", 3),
      }).success
    ).toBe(true);
    const result = schema.safeParse({
      prompt: "p",
      image_urls: urls("i", 9),
      video_urls: urls("v", 3),
      audio_urls: [AUDIO],
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.issues.map((issue) => issue.message)).toContain(
      "Total files across all modalities must not exceed 12"
    );
  });

  it("requires an image or video beside audio references", () => {
    const audioOnly = schema.safeParse({ prompt: "p", audio_urls: [AUDIO] });
    expect(audioOnly.success).toBe(false);
    if (audioOnly.success) throw new Error("expected failure");
    expect(audioOnly.error.issues[0]?.path).toEqual(["audio_urls"]);
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: [IMAGE],
        audio_urls: [AUDIO],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        prompt: "p",
        video_urls: [VIDEO],
        audio_urls: [AUDIO],
      }).success
    ).toBe(true);
  });
});
