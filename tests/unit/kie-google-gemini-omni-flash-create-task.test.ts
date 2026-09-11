import { describe, expect, expectTypeOf, it } from "vitest";

import {
  GoogleGeminiOmniFlash11RequestSchema as RootGoogleGeminiOmniFlash11RequestSchema,
  type GoogleGeminiOmniFlash11ParsedRequest,
  type GoogleGeminiOmniFlash11Request,
  type GoogleGeminiOmniFlash11RequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  GoogleGeminiOmniFlash11RequestSchema,
  KIE_MEDIA_MODELS,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "google/gemini-omni-flash-1-1" as const;

const DOCUMENTED_REQUEST = {
  model: MODEL,
  input: {
    prompt:
      "Generate a short video of a futuristic city at night, with the camera slowly pushing forward as a character emerges from a neon-lit street.",
    image_urls: [
      "https://example.com/assets/scene-1.png",
      "https://example.com/assets/scene-2.png",
    ],
    audio_ids: ["audio_01hx8p0demo"],
    video_list: [
      { url: "https://example.com/assets/clip.mp4", start: 0, ends: 10 },
    ],
    duration: "4",
  },
} satisfies GoogleGeminiOmniFlash11Request;

const GOOGLE_GEMINI_OMNI_REJECTED_MODELS = [
  "google/gemini-omni-flash-1-2",
  "gemini-omni-flash-1-1",
  "google/gemini-omni-flash",
  "GOOGLE/GEMINI-OMNI-FLASH-1-1",
] as const;

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

describe("Kie Gemini Omni 1.1 Flash request contracts", () => {
  it("accepts the documented example directly, through the guard, and through the aggregate", () => {
    expect(
      GoogleGeminiOmniFlash11RequestSchema.safeParse(DOCUMENTED_REQUEST).success
    ).toBe(true);
    expect(
      CREATE_TASK_GUARDS[MODEL].safeParse(DOCUMENTED_REQUEST).success
    ).toBe(true);
    expect(CreateTaskRequestSchema.safeParse(DOCUMENTED_REQUEST).success).toBe(
      true
    );
    expect(
      MediaGenerationRequestSchema.safeParse(DOCUMENTED_REQUEST).success
    ).toBe(true);
  });

  it.each(GOOGLE_GEMINI_OMNI_REJECTED_MODELS)(
    "rejects the out-of-scope model %j",
    (model) => {
      const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
        ...DOCUMENTED_REQUEST,
        model,
      });
      expect(result.success).toBe(false);
    }
  );

  it("rejects a request missing duration", () => {
    const { duration: _omit, ...inputWithoutDuration } =
      DOCUMENTED_REQUEST.input;
    void _omit;
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: inputWithoutDuration,
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "duration"])).toBe(true);
  });

  it("rejects a numeric duration", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: { ...DOCUMENTED_REQUEST.input, duration: 4 },
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "duration"])).toBe(true);
  });

  it("rejects last_frame_url without first_frame_url", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        last_frame_url: "https://example.com/assets/last-frame.png",
      },
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "last_frame_url"])).toBe(true);
  });

  it("rejects first_frame_url combined with image_urls", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        first_frame_url: "https://example.com/assets/first-frame.png",
        image_urls: ["https://example.com/assets/scene-1.png"],
      },
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "image_urls"])).toBe(true);
  });

  it("rejects a clip whose end is not after its start by more than 0.5s and more than 10s", () => {
    const overlong = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        video_list: [
          { url: "https://example.com/assets/clip.mp4", start: 0, ends: 10.5 },
        ],
      },
    });
    expect(overlong.success).toBe(false);
    expect(issueAt(overlong, ["input", "video_list", "0", "ends"])).toBe(true);

    const tooLong = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        video_list: [
          { url: "https://example.com/assets/clip.mp4", start: 0, ends: 11 },
        ],
      },
    });
    expect(tooLong.success).toBe(false);
    expect(issueAt(tooLong, ["input", "video_list", "0", "ends"])).toBe(true);
  });

  it("accepts a clip lasting exactly 10 seconds", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        video_list: [
          { url: "https://example.com/assets/clip.mp4", start: 0, ends: 10 },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects seven image_urls plus one clip (9 quota units)", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        image_urls: Array.from(
          { length: 7 },
          (_, i) => `https://example.com/assets/scene-${i}.png`
        ),
        video_list: [
          { url: "https://example.com/assets/clip.mp4", start: 0, ends: 10 },
        ],
      },
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "image_urls"])).toBe(true);
  });

  it("rejects four character_ids alongside a video_list clip", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        character_ids: ["c1", "c2", "c3", "c4"],
        video_list: [
          { url: "https://example.com/assets/clip.mp4", start: 0, ends: 10 },
        ],
      },
    });
    expect(result.success).toBe(false);
    expect(issueAt(result, ["input", "character_ids"])).toBe(true);
  });

  it("accepts first_frame_url alone", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        first_frame_url: "https://example.com/assets/first-frame.png",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts first_frame_url with last_frame_url", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        first_frame_url: "https://example.com/assets/first-frame.png",
        last_frame_url: "https://example.com/assets/last-frame.png",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts 360p resolution", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        resolution: "360p",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts seven image_urls without a clip", () => {
    const result = GoogleGeminiOmniFlash11RequestSchema.safeParse({
      model: MODEL,
      input: {
        prompt: DOCUMENTED_REQUEST.input.prompt,
        duration: "4",
        image_urls: Array.from(
          { length: 7 },
          (_, i) => `https://example.com/assets/scene-${i}.png`
        ),
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("Kie Gemini Omni 1.1 Flash registries and descriptors", () => {
  it("is registered in the roster, guards, and descriptors", () => {
    expect(KIE_MEDIA_MODELS.includes(MODEL)).toBe(true);
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(
      GoogleGeminiOmniFlash11RequestSchema
    );
    expect(modelInputSchemas[MODEL]).toBeDefined();
  });

  it("exposes a video descriptor with prompt and duration required and resolution defaulting to 720p", () => {
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("video");
    expect(descriptor.fields.prompt.required).toBe(true);
    expect(descriptor.fields.duration.required).toBe(true);
    expect(descriptor.fields.resolution.default).toBe("720p");
  });
});

describe("Kie Gemini Omni 1.1 Flash public exports", () => {
  it("keeps the root schema value identical to the zod subpath", () => {
    expect(RootGoogleGeminiOmniFlash11RequestSchema).toBe(
      GoogleGeminiOmniFlash11RequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<GoogleGeminiOmniFlash11RequestInput>().toEqualTypeOf<GoogleGeminiOmniFlash11Request>();
    expectTypeOf(
      GoogleGeminiOmniFlash11RequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<GoogleGeminiOmniFlash11ParsedRequest>();
    expectTypeOf<
      GoogleGeminiOmniFlash11Request["model"]
    >().toEqualTypeOf<"google/gemini-omni-flash-1-1">();
  });
});
