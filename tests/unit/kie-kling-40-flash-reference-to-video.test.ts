import { describe, expect, expectTypeOf, it } from "vitest";

import {
  Kling40FlashReferenceToVideoRequestSchema as RootKling40FlashReferenceToVideoRequestSchema,
  type Kling40FlashReferenceToVideoParsedRequest,
  type Kling40FlashReferenceToVideoRequest,
  type Kling40FlashReferenceToVideoRequestInput,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  KIE_MEDIA_MODELS,
  KieMediaModelSchema,
  Kling40FlashReferenceToVideoRequestSchema,
  MediaGenerationRequestSchema,
} from "@apicity/kie/zod";

import { zodToJsonSchema } from "../../packages/cli/src/schema";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

const MODEL = "kling-4.0/flash-reference-to-video" as const;
const IMAGE = "https://example.com/cat.jpg";
const VIDEO = "https://example.com/clip.mp4";

// The recorded pin (tests/integration/kie-kling-40-flash-reference-to-video.test.ts).
const RECORDED_REQUEST = {
  model: MODEL,
  input: {
    prompt: "@image_1 The cat turns its head toward the camera.",
    duration: 3,
    resolution: "720p",
    image_urls: [IMAGE],
  },
} satisfies Kling40FlashReferenceToVideoRequest;

const FULL_REQUEST = {
  model: MODEL,
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt: "@Hero walks past @image_1 while @Dancer moves as in @video_1",
    duration: 10,
    aspect_ratio: "16:9",
    image_urls: [IMAGE],
    video_urls: [VIDEO],
    keep_original_sound: true,
    elements: [
      { name: "Hero", image_urls: [IMAGE, IMAGE], tag: "character" },
      { name: "Dancer", type: "video", video_url: VIDEO },
    ],
  },
} satisfies Kling40FlashReferenceToVideoRequest;

function issueAt(
  result: { success: boolean; error?: { issues: unknown[] } },
  path: Array<string | number>
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
  return Kling40FlashReferenceToVideoRequestSchema.safeParse({
    model: MODEL,
    input,
  });
}

describe("Kie Kling 4.0 Flash reference-to-video request contract", () => {
  it("accepts the recorded pin and a full request directly, through the guard, and through the aggregates", () => {
    for (const request of [RECORDED_REQUEST, FULL_REQUEST]) {
      expect(
        Kling40FlashReferenceToVideoRequestSchema.safeParse(request).success
      ).toBe(true);
      expect(CREATE_TASK_GUARDS[MODEL].safeParse(request).success).toBe(true);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(
        true
      );
    }
  });

  it("injects the documented defaults and the default image element type", () => {
    const parsed = Kling40FlashReferenceToVideoRequestSchema.parse({
      model: MODEL,
      input: {
        prompt: "@Hero waves",
        elements: [{ name: "Hero", image_urls: [IMAGE, IMAGE] }],
      },
    });
    expect(parsed.input).toEqual({
      prompt: "@Hero waves",
      duration: 5,
      resolution: "720p",
      image_urls: [],
      video_urls: [],
      keep_original_sound: false,
      elements: [{ name: "Hero", image_urls: [IMAGE, IMAGE], type: "image" }],
    });
  });

  it("keeps Flash's limits: 3-20 s, 720p only, auto allowed", () => {
    expect(parseInput({ prompt: "x", aspect_ratio: "auto" }).success).toBe(
      true
    );
    for (const [field, value] of [
      ["duration", 2],
      ["duration", 21],
      ["resolution", "1080p"],
    ] as const) {
      const result = parseInput({ prompt: "x", [field]: value });
      expect(result.success, `${field}=${value}`).toBe(false);
      expect(issueAt(result, ["input", field])).toBe(true);
    }
  });

  it("rejects standalone voices and other undocumented fields", () => {
    for (const extra of [
      { voices: [{ name: "Narrator", audio_url: "https://e.com/a.mp3" }] },
      { first_frame_url: IMAGE },
    ]) {
      expect(
        parseInput({ prompt: "x", ...extra }).success,
        JSON.stringify(extra)
      ).toBe(false);
    }
  });

  it("matches each element's media to its type", () => {
    const cases: Array<[Record<string, unknown>, Array<string | number>]> = [
      [{ name: "A", video_url: VIDEO }, ["input", "elements", 0]],
      [
        { name: "A", type: "video", image_urls: [IMAGE, IMAGE] },
        ["input", "elements", 0],
      ],
      [
        { name: "A", type: "video", video_url: VIDEO, tag: "animal" },
        ["input", "elements", 0, "tag"],
      ],
      [
        {
          name: "A",
          image_urls: [IMAGE, IMAGE],
          tag: "prop",
          voice_url: "https://e.com/a.mp3",
        },
        ["input", "elements", 0, "voice_url"],
      ],
      [
        { name: "image_1", image_urls: [IMAGE, IMAGE] },
        ["input", "elements", 0, "name"],
      ],
    ];
    for (const [element, path] of cases) {
      const result = parseInput({ prompt: "x", elements: [element] });
      expect(result.success, JSON.stringify(element)).toBe(false);
      expect(issueAt(result, path), JSON.stringify(element)).toBe(true);
    }
  });

  it("enforces the video, element-name and material quotas", () => {
    const videoElement = (name: string) => ({
      name,
      type: "video",
      video_url: VIDEO,
    });
    const tooManyVideoElements = parseInput({
      prompt: "x",
      elements: ["A", "B", "C", "D"].map(videoElement),
    });
    expect(issueAt(tooManyVideoElements, ["input", "elements"])).toBe(true);
    const tooManyVideos = parseInput({
      prompt: "x",
      video_urls: [VIDEO, VIDEO, VIDEO, VIDEO],
      elements: [videoElement("A"), videoElement("B")],
    });
    expect(issueAt(tooManyVideos, ["input", "video_urls"])).toBe(true);
    const tooManyMaterials = parseInput({
      prompt: "x",
      image_urls: Array(10).fill(IMAGE),
      video_urls: [VIDEO],
      elements: ["A", "B", "C", "D", "E"].map((name) => ({
        name,
        image_urls: [IMAGE, IMAGE],
      })),
    });
    expect(issueAt(tooManyMaterials, ["input", "elements"])).toBe(true);
    const duplicate = parseInput({
      prompt: "x",
      elements: [
        { name: "Hero", image_urls: [IMAGE, IMAGE] },
        { name: "hero", image_urls: [IMAGE, IMAGE] },
      ],
    });
    expect(issueAt(duplicate, ["input", "elements", 1, "name"])).toBe(true);
  });

  it("carries the docs' field text into the JSON schema that apicity describe prints", () => {
    interface JsonNode {
      required?: string[];
      properties?: Record<string, JsonNode>;
      description?: string;
    }
    const json = zodToJsonSchema(
      Kling40FlashReferenceToVideoRequestSchema
    ) as JsonNode;
    const properties = json.properties?.input?.properties ?? {};
    expect(Object.keys(properties)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "aspect_ratio",
      "image_urls",
      "video_urls",
      "keep_original_sound",
      "elements",
    ]);
    expect(properties.elements?.description).toContain(
      "Standalone voices are not supported on Kling 4.0 Flash"
    );
    expect(properties.video_urls?.description).toContain("2-20 seconds");
  });
});

describe("Kie Kling 4.0 Flash reference-to-video model id", () => {
  it("lists the id, which the Kling alias also reads", () => {
    expect(KIE_MEDIA_MODELS).toContain(MODEL);
    expect(KieMediaModelSchema.safeParse(MODEL).success).toBe(true);
  });

  it("is registered in the guards and the descriptors", () => {
    expect(CREATE_TASK_GUARDS[MODEL]).toBe(
      Kling40FlashReferenceToVideoRequestSchema
    );
    const descriptor = modelInputSchemas[MODEL];
    expect(descriptor.type).toBe("video");
    expect(Object.keys(descriptor.fields)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "aspect_ratio",
      "image_urls",
      "video_urls",
      "keep_original_sound",
      "elements",
    ]);
    // The Flash limits are the same objects the keyframe model uses.
    const keyframe =
      modelInputSchemas["kling-4.0/flash-keyframe-to-video"].fields;
    expect(descriptor.fields.duration).toBe(keyframe.duration);
    expect(descriptor.fields.resolution).toBe(keyframe.resolution);
    expect(descriptor.fields.aspect_ratio.enum).toContain("auto");
    expect(descriptor.fields.elements).toMatchObject({
      type: "array",
      maxItems: 7,
      items: {
        properties: { type: { enum: ["image", "video"], default: "image" } },
      },
    });
  });
});

describe("Kie Kling 4.0 Flash reference-to-video public exports", () => {
  it("keeps the root schema value identical to the zod subpath", () => {
    expect(RootKling40FlashReferenceToVideoRequestSchema).toBe(
      Kling40FlashReferenceToVideoRequestSchema
    );
  });

  it("preserves request aliases, parsed outputs, and the model literal", () => {
    expectTypeOf<Kling40FlashReferenceToVideoRequestInput>().toEqualTypeOf<Kling40FlashReferenceToVideoRequest>();
    expectTypeOf(
      Kling40FlashReferenceToVideoRequestSchema.parse(RECORDED_REQUEST)
    ).toEqualTypeOf<Kling40FlashReferenceToVideoParsedRequest>();
    expectTypeOf<
      Kling40FlashReferenceToVideoRequest["model"]
    >().toEqualTypeOf<"kling-4.0/flash-reference-to-video">();
  });
});
