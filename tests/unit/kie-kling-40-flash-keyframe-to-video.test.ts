import { describe, expect, expectTypeOf, it } from "vitest";

import {
  Kling40FlashKeyframeToVideoRequestSchema as RootKling40FlashKeyframeToVideoRequestSchema,
  type Kling40FlashKeyframeToVideoParsedRequest,
  type Kling40FlashKeyframeToVideoRequest,
  type Kling40FlashKeyframeToVideoRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  Kling40FlashDurationSchema,
  Kling40FlashKeyframeToVideoRequestSchema,
  Kling40FlashResolutionSchema,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "kling-4.0/flash-keyframe-to-video" as const;
const FRAME = "https://example.com/first.png";

// The docs request example (read 2026-11-12).
const DOCUMENTED_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt:
      "Animate the supplied image as one continuous 10-second shot. REFERENCES: @first_frame is the exact opening frame.",
    first_frame_url:
      "https://static.aiquickdraw.com/tools/example/1793862976499_p1yBE2dY.png",
    duration: 5,
  },
} satisfies Kling40FlashKeyframeToVideoRequest;

// The recorded pin (tests/integration/kie-kling-40-flash-keyframe-to-video.test.ts).
const RECORDED_REQUEST = {
  model: MODEL,
  input: {
    prompt: "@first_frame The cat turns its head toward the camera.",
    duration: 3,
    resolution: "720p",
    first_frame_url: FRAME,
  },
} satisfies Kling40FlashKeyframeToVideoRequest;

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
  return Kling40FlashKeyframeToVideoRequestSchema.safeParse({
    model: MODEL,
    input,
  });
}

describe("Kie Kling 4.0 Flash keyframe-to-video request contract", () => {
  it("accepts the documented example and the recorded pin directly, through the guard, and through the aggregates", () => {
    for (const request of [DOCUMENTED_REQUEST, RECORDED_REQUEST]) {
      expect(
        Kling40FlashKeyframeToVideoRequestSchema.safeParse(request).success
      ).toBe(true);
      expect(CREATE_TASK_GUARDS[MODEL].safeParse(request).success).toBe(true);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    }
  });

  it("injects the documented defaults: 5 s at 720p", () => {
    const parsed = Kling40FlashKeyframeToVideoRequestSchema.parse({
      model: MODEL,
      input: { prompt: "A paper boat drifts down a rainy street." },
    });
    expect(parsed.input).toEqual({
      prompt: "A paper boat drifts down a rainy street.",
      duration: 5,
      resolution: "720p",
    });
  });

  it("bounds duration to an integer 3-20, below Kling 4.0's 30", () => {
    for (const duration of [3, 20]) {
      expect(parseInput({ prompt: "x", duration }).success).toBe(true);
    }
    for (const duration of [2, 21, 30, 4.5, "5"]) {
      const result = parseInput({ prompt: "x", duration });
      expect(result.success, String(duration)).toBe(false);
      expect(issueAt(result, ["input", "duration"])).toBe(true);
    }
  });

  it("takes only 720p and the four fixed ratios, with no auto", () => {
    for (const aspect_ratio of ["16:9", "9:16", "1:1", "21:9"]) {
      expect(parseInput({ prompt: "x", aspect_ratio }).success).toBe(true);
    }
    for (const [field, value] of [
      ["resolution", "1080p"],
      ["aspect_ratio", "auto"],
      ["aspect_ratio", "4:3"],
    ] as const) {
      const result = parseInput({ prompt: "x", [field]: value });
      expect(result.success, `${field}=${value}`).toBe(false);
      expect(issueAt(result, ["input", field])).toBe(true);
    }
  });

  it("rejects middle frames, a last frame and any other undocumented field", () => {
    for (const extra of [
      { keyframe_urls: [FRAME] },
      { last_frame_url: FRAME },
      { keyframes: [FRAME] },
      { last_frame: FRAME },
      { sound: true },
    ]) {
      const result = parseInput({
        prompt: "@first_frame",
        first_frame_url: FRAME,
        ...extra,
      });
      expect(result.success, JSON.stringify(extra)).toBe(false);
    }
  });

  it("bounds the prompt to 1-8000 characters and requires http(s) frame URLs", () => {
    expect(parseInput({ prompt: "x".repeat(8000) }).success).toBe(true);
    for (const prompt of [undefined, "", "x".repeat(8001)]) {
      expect(issueAt(parseInput({ prompt }), ["input", "prompt"])).toBe(true);
    }
    const ftp = parseInput({
      prompt: "@first_frame",
      first_frame_url: "ftp://example.com/first.png",
    });
    expect(issueAt(ftp, ["input", "first_frame_url"])).toBe(true);
  });

  it("carries the docs' field text into the JSON schema that apicity describe prints", () => {
    interface JsonNode {
      required?: string[];
      properties?: Record<string, JsonNode>;
      description?: string;
      default?: unknown;
      enum?: unknown[];
    }
    const json = zodToJsonSchema(
      Kling40FlashKeyframeToVideoRequestSchema
    ) as JsonNode;
    const input = json.properties?.input;
    expect(input?.required).toEqual(["prompt"]);
    const properties = input?.properties ?? {};
    expect(Object.keys(properties)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "aspect_ratio",
      "first_frame_url",
    ]);
    expect(properties.prompt?.description).toContain(
      "sending keyframes or last_frame is rejected"
    );
    expect(properties.duration?.default).toBe(5);
    expect(properties.resolution?.enum).toEqual(["720p"]);
    expect(properties.aspect_ratio?.enum).toEqual([
      "16:9",
      "9:16",
      "1:1",
      "21:9",
    ]);
  });
});

describe("Kie Kling 4.0 Flash keyframe-to-video model id", () => {
  it("lists the id, which the Kling alias also reads", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(
      Kling40FlashKeyframeToVideoRequestSchema
    );
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("video");
    expect(Object.keys(descriptor.fields)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "aspect_ratio",
      "first_frame_url",
    ]);
    expect(descriptor.fields.prompt).toMatchObject({
      required: true,
      minLength: 1,
      maxLength: 8000,
    });
    expect(descriptor.fields.duration).toMatchObject({
      type: "integer",
      minimum: 3,
      maximum: 20,
      default: 5,
    });
    expect(descriptor.fields.resolution.enum).toEqual(
      Kling40FlashResolutionSchema.options
    );
    expect(descriptor.fields.resolution.default).toBe("720p");
    expect(descriptor.fields.aspect_ratio.enum).toEqual([
      "16:9",
      "9:16",
      "1:1",
      "21:9",
    ]);
    expect(descriptor.fields.aspect_ratio.default).toBeUndefined();
  });

  it("exports the Flash limits both Flash models share", () => {
    expect(Kling40FlashDurationSchema.safeParse(20).success).toBe(true);
    expect(Kling40FlashDurationSchema.safeParse(21).success).toBe(false);
    expect(Kling40FlashResolutionSchema.options).toEqual(["720p"]);
  });
});

describe("Kie Kling 4.0 Flash keyframe-to-video public exports", () => {
  it("keeps the root schema value identical to the zod subpath", () => {
    expect(RootKling40FlashKeyframeToVideoRequestSchema).toBe(
      Kling40FlashKeyframeToVideoRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<Kling40FlashKeyframeToVideoRequestInput>().toEqualTypeOf<Kling40FlashKeyframeToVideoRequest>();
    expectTypeOf(
      Kling40FlashKeyframeToVideoRequestSchema.parse(DOCUMENTED_REQUEST)
    ).toEqualTypeOf<Kling40FlashKeyframeToVideoParsedRequest>();
    expectTypeOf<
      Kling40FlashKeyframeToVideoRequest["model"]
    >().toEqualTypeOf<"kling-4.0/flash-keyframe-to-video">();
    expectTypeOf<
      Kling40FlashKeyframeToVideoRequest["input"]["aspect_ratio"]
    >().toEqualTypeOf<"16:9" | "9:16" | "1:1" | "21:9" | undefined>();
  });
});
