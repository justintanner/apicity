import { describe, expect, expectTypeOf, it } from "vitest";

import {
  GoogleGeminiOmniFlash12AspectRatioSchema as RootGoogleGeminiOmniFlash12AspectRatioSchema,
  GoogleGeminiOmniFlash12RequestSchema as RootGoogleGeminiOmniFlash12RequestSchema,
  type GoogleGeminiOmniFlash12AspectRatio,
  type GoogleGeminiOmniFlash12ParsedRequest,
  type GoogleGeminiOmniFlash12Request,
  type GoogleGeminiOmniFlash12RequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  GoogleGeminiOmniFlash11RequestSchema,
  GoogleGeminiOmniFlash12AspectRatioSchema,
  GoogleGeminiOmniFlash12RequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "google/gemini-omni-flash-1-2" as const;

// The docs request example (read 2026-11-12): reference images plus a
// character, which the page added after the survey's 06:10Z read.
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt:
      "The character walks through a rainy street at night, neon reflections",
    duration: 8,
    aspect_ratio: "9:16",
    resolution: "720p",
    image_urls: [
      "https://example.com/ref1.png",
      "https://example.com/ref2.png",
    ],
    character_ids: ["character_01hx8p0demo"],
  },
} satisfies GoogleGeminiOmniFlash12Request;

const FIRST_FRAME = "https://example.com/first.png";
const LAST_FRAME = "https://example.com/last.png";
const CLIP = "https://example.com/clip.mp4";
const images = (count: number) =>
  Array.from({ length: count }, (_, i) => `https://example.com/ref${i}.png`);

// One request per documented generation mode (A-D on the page).
const MODE_REQUESTS = {
  text: {
    model: MODEL,
    input: {
      prompt: "A red panda waves once, then holds still.",
      duration: 3,
      resolution: "360p",
      aspect_ratio: "16:9",
    },
  },
  firstFrame: {
    model: MODEL,
    input: {
      prompt: "It turns around.",
      duration: 15,
      first_frame_url: FIRST_FRAME,
    },
  },
  firstAndLastFrame: {
    model: MODEL,
    input: {
      prompt: "It walks from the first frame to the last.",
      duration: 10,
      first_frame_url: FIRST_FRAME,
      last_frame_url: LAST_FRAME,
    },
  },
  videoEdit: {
    model: MODEL,
    input: {
      prompt: "Restyle the clip as a watercolor.",
      video_list: [CLIP],
      image_urls: images(5),
      character_ids: ["character_01hx8p0demo", "character_02hx8p0demo"],
    },
  },
} satisfies Record<string, GoogleGeminiOmniFlash12Request>;

function issueAt(
  result: { success: boolean; error?: { issues: unknown[] } },
  path: string[]
) {
  if (result.success || !result.error) return false;
  return result.error.issues.some((issue) => {
    if (typeof issue !== "object" || issue === null || !("path" in issue)) {
      return false;
    }
    const issuePath = issue.path;
    return Array.isArray(issuePath) && issuePath.join(".") === path.join(".");
  });
}

function parseInput(input: Record<string, unknown>) {
  return GoogleGeminiOmniFlash12RequestSchema.safeParse({
    model: MODEL,
    input,
  });
}

describe("Kie Gemini Omni 1.2 Flash request contracts", () => {
  it("accepts the documented example and every mode directly, through the guard, and through the aggregates", () => {
    for (const request of [
      DOCUMENTED_REQUEST,
      ...Object.values(MODE_REQUESTS),
    ]) {
      expect(
        GoogleGeminiOmniFlash12RequestSchema.safeParse(request).success
      ).toBe(true);
      expect(CREATE_TASK_GUARDS[MODEL].safeParse(request).success).toBe(true);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    }
  });

  it("injects the documented aspect_ratio and resolution defaults", () => {
    const parsed = GoogleGeminiOmniFlash12RequestSchema.parse({
      model: MODEL,
      input: { prompt: "A lighthouse at dusk.", duration: 5 },
    });
    expect(parsed.input).toEqual({
      prompt: "A lighthouse at dusk.",
      duration: 5,
      aspect_ratio: "16:9",
      resolution: "720p",
    });
  });

  it("requires duration outside video edit and refuses it with video_list", () => {
    const missing = parseInput({ prompt: "No length." });
    expect(missing.success).toBe(false);
    expect(issueAt(missing, ["input", "duration"])).toBe(true);

    const missingWithFrame = parseInput({
      prompt: "No length.",
      first_frame_url: FIRST_FRAME,
    });
    expect(missingWithFrame.success).toBe(false);
    expect(issueAt(missingWithFrame, ["input", "duration"])).toBe(true);

    const withVideo = parseInput({
      prompt: "An edit.",
      duration: 5,
      video_list: [CLIP],
    });
    expect(withVideo.success).toBe(false);
    expect(issueAt(withVideo, ["input", "duration"])).toBe(true);
  });

  it("takes an integer duration of 3-15, and 3-10 with first and last frame", () => {
    for (const duration of [3, 15]) {
      expect(parseInput({ prompt: "x", duration }).success, `${duration}`).toBe(
        true
      );
    }
    for (const duration of [2, 16, 4.5, "8"]) {
      const result = parseInput({ prompt: "x", duration });
      expect(result.success, `${duration}`).toBe(false);
      expect(issueAt(result, ["input", "duration"]), `${duration}`).toBe(true);
    }
    const tooLong = parseInput({
      prompt: "x",
      duration: 11,
      first_frame_url: FIRST_FRAME,
      last_frame_url: LAST_FRAME,
    });
    expect(tooLong.success).toBe(false);
    expect(issueAt(tooLong, ["input", "duration"])).toBe(true);
  });

  it("refuses last_frame_url without first_frame_url", () => {
    const result = parseInput({
      prompt: "x",
      duration: 5,
      last_frame_url: LAST_FRAME,
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "last_frame_url"])).toBe(true);
  });

  it("keeps image_urls, video_list and character_ids off the frame modes", () => {
    for (const [field, value] of [
      ["image_urls", images(1)],
      ["video_list", [CLIP]],
      ["character_ids", ["character_01hx8p0demo"]],
    ] as const) {
      for (const frames of [
        { first_frame_url: FIRST_FRAME },
        { first_frame_url: FIRST_FRAME, last_frame_url: LAST_FRAME },
      ]) {
        const input: Record<string, unknown> = {
          prompt: "x",
          ...frames,
          [field]: value,
        };
        if (field !== "video_list") input.duration = 5;
        const result = parseInput(input);
        expect(result.success, field).toBe(false);
        expect(issueAt(result, ["input", field]), field).toBe(true);
      }
    }
  });

  it("enforces the 7-slot image quota and the list caps", () => {
    expect(
      parseInput({ prompt: "x", duration: 5, image_urls: images(6) }).success
    ).toBe(true);
    expect(
      parseInput({ prompt: "x", video_list: [CLIP], image_urls: images(5) })
        .success
    ).toBe(true);

    const overQuota = parseInput({
      prompt: "x",
      video_list: [CLIP],
      image_urls: images(6),
    });
    expect(overQuota.success).toBe(false);
    expect(issueAt(overQuota, ["input", "image_urls"])).toBe(true);

    for (const [field, value, extra] of [
      ["image_urls", images(7), { duration: 5 }],
      ["video_list", [CLIP, CLIP], {}],
      ["character_ids", ["a", "b", "c"], { duration: 5 }],
    ] as const) {
      const result = parseInput({ prompt: "x", ...extra, [field]: value });
      expect(result.success, field).toBe(false);
      expect(issueAt(result, ["input", field]), field).toBe(true);
    }
  });

  it("rejects out-of-range seeds, prompts and enum values", () => {
    expect(parseInput({ prompt: "x", duration: 5, seeds: 12345 }).success).toBe(
      true
    );
    const cases: Array<[string, Record<string, unknown>]> = [
      ["seeds", { seeds: 9999 }],
      ["seeds", { seeds: 100000 }],
      ["seeds", { seeds: 12345.5 }],
      ["prompt", { prompt: "" }],
      ["prompt", { prompt: "x".repeat(20001) }],
      ["aspect_ratio", { aspect_ratio: "1:1" }],
      ["resolution", { resolution: "2k" }],
    ];
    for (const [field, patch] of cases) {
      const result = parseInput({ prompt: "x", duration: 5, ...patch });
      expect(result.success, JSON.stringify(patch)).toBe(false);
      expect(issueAt(result, ["input", field]), field).toBe(true);
    }
  });

  it("is not the 1.1 contract", () => {
    expect(
      GoogleGeminiOmniFlash11RequestSchema.safeParse({
        ...DOCUMENTED_REQUEST,
        model: "google/gemini-omni-flash-1-1",
      }).success
    ).toBe(false);
    expect(
      GoogleGeminiOmniFlash12RequestSchema.safeParse({
        ...DOCUMENTED_REQUEST,
        model: "google/gemini-omni-flash-1-1",
      }).success
    ).toBe(false);
  });
});

describe("Kie Gemini Omni 1.2 Flash registries and descriptors", () => {
  it("is registered in the roster, the model schema, the guards and the descriptors", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(
      GoogleGeminiOmniFlash12RequestSchema
    );
    expect(modelInputSchemas[MODEL]).toBeDefined();
  });

  it("describes every documented field, with prompt required and the defaults stated", () => {
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("video");
    expect(Object.keys(descriptor.fields)).toEqual([
      "prompt",
      "duration",
      "aspect_ratio",
      "resolution",
      "seeds",
      "image_urls",
      "character_ids",
      "first_frame_url",
      "last_frame_url",
      "video_list",
    ]);
    expect(descriptor.fields.prompt.required).toBe(true);
    expect(descriptor.fields.duration).toMatchObject({
      type: "integer",
      minimum: 3,
      maximum: 15,
    });
    expect(descriptor.fields.aspect_ratio.enum).toEqual([
      "16:9",
      "9:16",
      "auto",
    ]);
    expect(descriptor.fields.aspect_ratio.default).toBe("16:9");
    expect(descriptor.fields.resolution.enum).toEqual([
      "360p",
      "720p",
      "1080p",
      "4k",
    ]);
    expect(descriptor.fields.resolution.default).toBe("720p");
    expect(descriptor.fields.image_urls.maxItems).toBe(6);
    expect(descriptor.fields.character_ids.maxItems).toBe(2);
    expect(descriptor.fields.video_list.maxItems).toBe(1);
  });
});

describe("Kie Gemini Omni 1.2 Flash public exports", () => {
  it("keeps the root schema values identical to the zod subpath", () => {
    expect(RootGoogleGeminiOmniFlash12RequestSchema).toBe(
      GoogleGeminiOmniFlash12RequestSchema
    );
    expect(RootGoogleGeminiOmniFlash12AspectRatioSchema).toBe(
      GoogleGeminiOmniFlash12AspectRatioSchema
    );
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<GoogleGeminiOmniFlash12RequestInput>().toEqualTypeOf<GoogleGeminiOmniFlash12Request>();
    expectTypeOf(
      GoogleGeminiOmniFlash12RequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<GoogleGeminiOmniFlash12ParsedRequest>();
    expectTypeOf<
      GoogleGeminiOmniFlash12Request["model"]
    >().toEqualTypeOf<"google/gemini-omni-flash-1-2">();
    expectTypeOf<GoogleGeminiOmniFlash12AspectRatio>().toEqualTypeOf<
      "16:9" | "9:16" | "auto"
    >();
  });
});
