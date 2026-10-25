import { describe, it, expect } from "vitest";
import {
  CreateTaskRequestSchema,
  Kling40KeyframeToVideoInputSchema,
  Kling40KeyframeToVideoRequestSchema,
  Kling40ReferenceToVideoInputSchema,
  Kling40ReferenceToVideoRequestSchema,
  Kling40TaskResultJsonSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { zodToJsonSchema } from "../../packages/cli/src/schema";

const REFERENCE = "kling-4.0/reference-to-video";
const KEYFRAME = "kling-4.0/keyframe-to-video";
const url = (name: string) => `https://example.com/${name}`;
const images = (count: number) =>
  Array.from({ length: count }, (_, index) => url(`image-${index}.png`));
const videos = (count: number) =>
  Array.from({ length: count }, (_, index) => url(`video-${index}.mp4`));

const reference = (input: Record<string, unknown>) =>
  Kling40ReferenceToVideoRequestSchema.safeParse({
    model: REFERENCE,
    input: { prompt: "A cat waves", ...input },
  });
const keyframe = (input: Record<string, unknown>) =>
  Kling40KeyframeToVideoRequestSchema.safeParse({
    model: KEYFRAME,
    input: { prompt: "A cat waves", ...input },
  });
const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe("Kling 4.0 createTask models", () => {
  it.each([REFERENCE, KEYFRAME] as const)(
    "%s is guarded and accepted by the createTask union",
    (model) => {
      const request = { model, input: { prompt: "A cat waves" } };
      expect(CREATE_TASK_GUARDS[model]).toBe(
        model === REFERENCE
          ? Kling40ReferenceToVideoRequestSchema
          : Kling40KeyframeToVideoRequestSchema
      );
      expect(CREATE_TASK_GUARDS[model].safeParse(request).success).toBe(true);
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
    }
  );

  it("applies the documented reference-to-video defaults", () => {
    const parsed = Kling40ReferenceToVideoRequestSchema.parse({
      model: REFERENCE,
      input: { prompt: "A cat waves" },
    });
    expect(parsed.input).toEqual({
      prompt: "A cat waves",
      duration: 5,
      resolution: "720p",
      image_urls: [],
      video_urls: [],
      keep_original_sound: false,
      elements: [],
      voices: [],
    });
  });

  it("applies the documented keyframe-to-video defaults", () => {
    const parsed = Kling40KeyframeToVideoRequestSchema.parse({
      model: KEYFRAME,
      input: { prompt: "A cat waves" },
    });
    expect(parsed.input).toEqual({
      prompt: "A cat waves",
      duration: 5,
      resolution: "720p",
      keyframe_urls: [],
    });
  });

  it.each([REFERENCE, KEYFRAME] as const)(
    "%s accepts every documented enum value and the duration bounds",
    (model) => {
      const parse = model === REFERENCE ? reference : keyframe;
      for (const resolution of ["720p", "1080p"]) {
        expect(parse({ resolution }).success).toBe(true);
      }
      for (const aspect_ratio of ["auto", "16:9", "9:16", "1:1", "21:9"]) {
        expect(parse({ aspect_ratio }).success).toBe(true);
      }
      for (const duration of [3, 30]) {
        expect(parse({ duration }).success).toBe(true);
      }
      expect(parse({ prompt: "x".repeat(8000) }).success).toBe(true);
    }
  );

  it.each([
    { duration: 2 },
    { duration: 31 },
    { duration: 5.5 },
    { duration: "5" },
    { resolution: "4k" },
    { aspect_ratio: "4:3" },
    { prompt: "" },
    { prompt: "x".repeat(8001) },
  ])("rejects shared input %#", (input) => {
    expect(reference(input).success).toBe(false);
    expect(keyframe(input).success).toBe(false);
  });

  it.each([
    { image_urls: images(11) },
    { video_urls: videos(6) },
    { image_urls: ["ftp://example.com/cat.png"] },
    { video_urls: ["data:video/mp4;base64,AAAA"] },
    { keep_original_sound: "false" },
    { elements: Array(8).fill({ name: "Cat", image_urls: images(2) }) },
    {
      voices: ["A", "B", "C", "D"].map((name) => ({
        name,
        audio_url: url("voice.mp3"),
      })),
    },
    { voices: [{ name: "Narrator" }] },
  ])("rejects reference-to-video materials %#", (input) => {
    expect(reference(input).success).toBe(false);
  });

  it("accepts every material type within its limits", () => {
    const result = reference({
      prompt:
        "@Hero holds the doll from @image_1 in @video_1 and greets @Voice",
      image_urls: images(1),
      video_urls: videos(1),
      keep_original_sound: true,
      elements: [
        {
          name: "Hero",
          image_urls: images(4),
          tag: "character",
          description: "x".repeat(100),
          voice_url: url("hero.mp3"),
        },
        { name: "猫咪_2", video_url: url("cat.mp4"), tag: "character" },
        { name: "Dog", image_urls: images(2) },
      ],
      voices: [{ name: "Voice", audio_url: url("voice.mp3") }],
    });
    expect(result.success).toBe(true);
  });

  it.each([
    [{ name: "Cat" }, "either 2-4 image_urls or one video_url"],
    [
      { name: "Cat", image_urls: images(2), video_url: url("cat.mp4") },
      "either 2-4 image_urls or one video_url",
    ],
    [
      { name: "Cat", video_url: url("cat.mp4"), tag: "animal" },
      "always a character subject",
    ],
    [
      {
        name: "Cat",
        image_urls: images(2),
        tag: "prop",
        voice_url: url("cat.mp3"),
      },
      "voice_url binds only to a character subject",
    ],
  ])("rejects element %#", (element, message) => {
    const result = reference({ elements: [element] });
    expect(result.success).toBe(false);
    expect(messages(result).join(" ")).toContain(message);
  });

  it.each([
    { name: "Cat", image_urls: images(1) },
    { name: "Cat", image_urls: images(5) },
    { name: "Cat", image_urls: images(2), description: "x".repeat(101) },
    { name: "Cat", image_urls: images(2), tag: "robot" },
    { name: "two words", image_urls: images(2) },
    { name: "x".repeat(21), image_urls: images(2) },
    { name: "", image_urls: images(2) },
  ])("rejects element field %#", (element) => {
    expect(reference({ elements: [element] }).success).toBe(false);
  });

  it("accepts a voice on an image subject whose tag is omitted", () => {
    expect(
      reference({
        elements: [
          { name: "Cat", image_urls: images(2), voice_url: url("cat.mp3") },
        ],
      }).success
    ).toBe(true);
  });

  it.each([
    "image_1",
    "Video_2",
    "keyframe_3",
    "object_10",
    "AUDIO_9",
    "first_frame",
    "Last_Frame",
  ])("rejects the reserved name %s", (name) => {
    const result = reference({
      voices: [{ name, audio_url: url("voice.mp3") }],
    });
    expect(result.success).toBe(false);
    expect(messages(result)).toEqual([`${name} is a reserved material name`]);
  });

  it("accepts names that only resemble reserved tags", () => {
    expect(
      reference({
        voices: ["image_x", "video", "first_frame_2"].map((name) => ({
          name,
          audio_url: url("voice.mp3"),
        })),
      }).success
    ).toBe(true);
  });

  it("rejects a name repeated across elements and voices, ignoring case", () => {
    const result = reference({
      elements: [{ name: "Hero", image_urls: images(2) }],
      voices: [{ name: "hero", audio_url: url("hero.mp3") }],
    });
    expect(result.success).toBe(false);
    expect(messages(result)).toEqual([
      "hero repeats a name in elements or voices (case-insensitive)",
    ]);
  });

  it("caps video subjects, videos and the material total", () => {
    const videoElements = (count: number) =>
      Array.from({ length: count }, (_, index) => ({
        name: `Actor${index}`,
        video_url: url(`actor-${index}.mp4`),
      }));
    expect(reference({ elements: videoElements(3) }).success).toBe(true);
    expect(messages(reference({ elements: videoElements(4) }))).toContain(
      "At most 3 elements can be video subjects"
    );
    expect(
      reference({ elements: videoElements(2), video_urls: videos(3) }).success
    ).toBe(true);
    expect(
      messages(reference({ elements: videoElements(3), video_urls: videos(3) }))
    ).toEqual(["video_urls and video elements together cannot exceed 5"]);

    const fifteen = {
      image_urls: images(10),
      video_urls: videos(4),
      voices: [{ name: "Voice", audio_url: url("voice.mp3") }],
    };
    expect(reference(fifteen).success).toBe(true);
    expect(messages(reference({ ...fifteen, video_urls: videos(5) }))).toEqual([
      "image_urls, video_urls, elements and voices together cannot exceed 15",
    ]);
  });

  it.each([
    [3, 4],
    [4, 5],
    [5, 6],
    [8, 9],
    [9, 10],
    [30, 10],
  ])("allows %i s keyframe videos at most %i frames", (duration, frames) => {
    const withFrames = (count: number) =>
      keyframe({
        duration,
        first_frame_url: url("first.png"),
        keyframe_urls: images(Math.min(count - 2, 8)),
        last_frame_url: url("last.png"),
      });
    expect(withFrames(frames).success).toBe(true);
    if (frames < 10) {
      expect(messages(withFrames(frames + 1))).toEqual([
        `duration ${duration}s allows at most ${frames} frames (first + keyframes + last), got ${frames + 1}`,
      ]);
    }
  });

  it("counts the frame cap against the default duration", () => {
    const result = keyframe({
      first_frame_url: url("first.png"),
      keyframe_urls: images(5),
      last_frame_url: url("last.png"),
    });
    expect(messages(result)).toEqual([
      "duration 5s allows at most 6 frames (first + keyframes + last), got 7",
    ]);
  });

  it.each([
    { keyframe_urls: images(9), duration: 30 },
    { first_frame_url: "ftp://example.com/first.png" },
    { last_frame_url: "" },
    { keyframe_urls: ["first.png"] },
  ])("rejects keyframe input %#", (input) => {
    expect(keyframe(input).success).toBe(false);
  });

  it("validates the task result JSON", () => {
    expect(
      Kling40TaskResultJsonSchema.parse({
        resultUrls: ["https://tempfile.aiquickdraw.com/k/clip.mp4"],
      })
    ).toEqual({ resultUrls: ["https://tempfile.aiquickdraw.com/k/clip.mp4"] });
    expect(Kling40TaskResultJsonSchema.safeParse({}).success).toBe(false);
    expect(
      Kling40TaskResultJsonSchema.safeParse({ resultUrls: [] }).success
    ).toBe(false);
  });
});

describe("Kling 4.0 model input descriptors", () => {
  it.each([
    [REFERENCE, Kling40ReferenceToVideoInputSchema],
    [KEYFRAME, Kling40KeyframeToVideoInputSchema],
  ] as const)("%s mirrors its input schema", (model, schema) => {
    const descriptor = modelInputSchemas[model];
    const json = zodToJsonSchema(schema);
    const properties = json.properties as Record<
      string,
      Record<string, unknown>
    >;
    expect(descriptor.type).toBe("video");
    expect(Object.keys(descriptor.fields).sort()).toEqual(
      Object.keys(schema.shape).sort()
    );
    for (const [name, field] of Object.entries(descriptor.fields)) {
      const property = properties[name];
      expect(field.required === true, name).toBe(name === "prompt");
      for (const key of [
        "enum",
        "default",
        "minimum",
        "maximum",
        "minLength",
        "maxLength",
        "maxItems",
      ] as const) {
        expect(field[key], `${name}.${key}`).toEqual(property[key]);
      }
      if (property.description !== undefined) {
        expect(field.description, name).toBe(property.description);
      }
    }
  });

  it("describes element and voice items like the request schema", () => {
    const fields = modelInputSchemas[REFERENCE].fields;
    const json = zodToJsonSchema(Kling40ReferenceToVideoInputSchema);
    const properties = json.properties as Record<
      string,
      { items: { properties: Record<string, Record<string, unknown>> } }
    >;
    for (const list of ["elements", "voices"] as const) {
      const items = fields[list].items?.properties ?? {};
      const expected = properties[list].items.properties;
      expect(Object.keys(items).sort(), list).toEqual(
        Object.keys(expected).sort()
      );
      for (const [name, field] of Object.entries(items)) {
        for (const key of ["enum", "minItems", "maxItems", "maxLength"]) {
          expect(
            field[key as keyof typeof field],
            `${list}.${name}.${key}`
          ).toEqual(expected[name][key]);
        }
        if (expected[name].description !== undefined) {
          expect(field.description, `${list}.${name}`).toBe(
            expected[name].description
          );
        }
      }
    }
    const name = fields.elements.items?.properties?.name;
    expect(name?.required).toBe(true);
    const pattern = new RegExp(name?.pattern ?? "");
    expect(pattern.test("猫咪_2")).toBe(true);
    expect(pattern.test("two words")).toBe(false);
    expect(pattern.test("x".repeat(21))).toBe(false);
  });
});

describe("Kling 4.0 pricing", () => {
  const estimate = (
    model: string,
    input: Record<string, unknown>,
    inputDurationSeconds?: number
  ) =>
    computeEstimate({
      provider: "kie",
      payload: { model, input },
      ...(inputDurationSeconds === undefined
        ? {}
        : { costHints: { inputDurationSeconds } }),
    });

  it.each([REFERENCE, KEYFRAME])(
    "%s bills output seconds by resolution, default 5 s at 720p",
    (model) => {
      expect(estimate(model, {}).usd).toBeCloseTo(5 * 0.1425, 10);
      expect(estimate(model, { duration: 3 }).usd).toBeCloseTo(0.4275, 10);
      // The docs callback examples: 285 and 425 credits at $0.005.
      expect(
        estimate(model, { duration: 10, resolution: "720p" }).usd
      ).toBeCloseTo(1.425, 10);
      expect(
        estimate(model, { duration: 10, resolution: "1080p" }).usd
      ).toBeCloseTo(2.125, 10);
      const malformed = estimate(model, { duration: null });
      expect(malformed.usd).toBe(0);
      expect(malformed.warnings.join(" ")).toContain("could not derive units");
    }
  );

  it("bills images, image subjects and voices as no video input", () => {
    const result = estimate(REFERENCE, {
      duration: 3,
      image_urls: images(2),
      elements: [{ name: "Cat", image_urls: images(2) }],
      voices: [{ name: "Voice", audio_url: url("voice.mp3") }],
    });
    expect(result.usd).toBeCloseTo(0.4275, 10);
    expect(result.warnings).toEqual([]);
  });

  it("bills video input on output + max(output, input) seconds", () => {
    // The page's own examples: a 10 s output bills 20 s with a 5 s input
    // and 25 s with a 15 s input.
    expect(
      estimate(REFERENCE, { duration: 10, video_urls: videos(1) }, 5).usd
    ).toBeCloseTo(20 * 0.085, 10);
    expect(
      estimate(REFERENCE, { duration: 10, video_urls: videos(1) }, 15).usd
    ).toBeCloseTo(25 * 0.085, 10);
    expect(
      estimate(
        REFERENCE,
        {
          duration: 4,
          resolution: "1080p",
          elements: [{ name: "Actor", video_url: url("actor.mp4") }],
        },
        3
      ).usd
    ).toBeCloseTo(8 * 0.1275, 10);
  });

  it("fails closed on video input without a declared input length", () => {
    const result = estimate(REFERENCE, {
      duration: 5,
      video_urls: videos(1),
    });
    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("costHints.inputDurationSeconds");
    for (const input of [{ video_urls: url("clip.mp4") }, { elements: {} }]) {
      const malformed = estimate(REFERENCE, input, 5);
      expect(malformed.usd).toBe(0);
      expect(malformed.warnings.join(" ")).toContain("not an array");
    }
  });

  it("ignores the input-length hint without video input", () => {
    expect(estimate(REFERENCE, { duration: 3 }, 30).usd).toBeCloseTo(
      0.4275,
      10
    );
    expect(estimate(KEYFRAME, { duration: 3 }, 30).usd).toBeCloseTo(0.4275, 10);
  });
});
