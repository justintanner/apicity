import { describe, expect, it } from "vitest";
import {
  Kling40ImageRequestSchema,
  KIE_MEDIA_MODELS,
  MediaGenerationRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";

// Kling 4.0 Image, from https://docs.kie.ai/market/kling-4-0/image as read on
// 2026-11-19 (ac-i4vebc).
const model = "kling-4-0/image";
const IMAGE = "https://example.com/a.png";
const element = (name: string) => ({
  name,
  image_urls: ["https://example.com/front.jpg", "https://example.com/side.jpg"],
});

const parse = (input: Record<string, unknown>) =>
  Kling40ImageRequestSchema.safeParse({ model, input });

const messages = (input: Record<string, unknown>) => {
  const result = parse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("Kling 4.0 Image request schema", () => {
  it("is listed, guarded and reachable through the aggregate", () => {
    expect(KIE_MEDIA_MODELS).toContain(model);
    expect(CREATE_TASK_GUARDS[model]).toBe(Kling40ImageRequestSchema);
    expect(
      MediaGenerationRequestSchema.safeParse({
        model,
        input: { prompt: "A red apple" },
      }).success
    ).toBe(true);
  });

  it("applies the documented defaults and leaves count unset", () => {
    expect(
      Kling40ImageRequestSchema.parse({ model, input: { prompt: "x" } }).input
    ).toEqual({
      prompt: "x",
      image_urls: [],
      elements: [],
      mode: "default",
      resolution: "2k",
      aspect_ratio: "auto",
    });
  });

  it("requires a prompt of 1-20000 characters", () => {
    expect(parse({}).success).toBe(false);
    expect(parse({ prompt: "" }).success).toBe(false);
    expect(parse({ prompt: "x".repeat(20000) }).success).toBe(true);
    expect(parse({ prompt: "x".repeat(20001) }).success).toBe(false);
  });

  it.each(["2k", "4k", "8k"])("accepts resolution %s", (resolution) => {
    expect(parse({ prompt: "x", resolution }).success).toBe(true);
  });

  it.each(["1k", "2K", "1080p"])("rejects resolution %s", (resolution) => {
    expect(parse({ prompt: "x", resolution }).success).toBe(false);
  });

  it("takes the nine documented aspect ratios", () => {
    for (const aspect_ratio of [
      "auto",
      "9:16",
      "2:3",
      "3:4",
      "1:1",
      "4:3",
      "3:2",
      "16:9",
      "21:9",
    ]) {
      expect(parse({ prompt: "x", aspect_ratio }).success, aspect_ratio).toBe(
        true
      );
    }
    expect(parse({ prompt: "x", aspect_ratio: "5:4" }).success).toBe(false);
  });

  it("takes count 1-9 in the default mode", () => {
    expect(messages({ prompt: "x", count: 1 })).toEqual([]);
    expect(messages({ prompt: "x", count: 9 })).toEqual([]);
    expect(messages({ prompt: "x", count: 10 })).toEqual([
      "default mode takes a count of 1-9",
    ]);
    for (const count of [0, 1.5, "2"]) {
      expect(parse({ prompt: "x", count }).success, String(count)).toBe(false);
    }
  });

  it("requires count 2-10 in series mode", () => {
    expect(messages({ prompt: "x", mode: "series" })).toEqual([
      "series mode requires count (2-10)",
    ]);
    expect(messages({ prompt: "x", mode: "series", count: 1 })).toEqual([
      "series mode takes a count of 2-10",
    ]);
    expect(messages({ prompt: "x", mode: "series", count: 2 })).toEqual([]);
    expect(messages({ prompt: "x", mode: "series", count: 10 })).toEqual([]);
    expect(parse({ prompt: "x", mode: "series", count: 11 }).success).toBe(
      false
    );
  });

  it("holds image_urls and elements to 10 together", () => {
    expect(
      messages({
        prompt: "x",
        image_urls: Array.from({ length: 10 }, () => IMAGE),
      })
    ).toEqual([]);
    expect(
      messages({
        prompt: "x",
        image_urls: Array.from({ length: 6 }, () => IMAGE),
        elements: ["A", "B", "C", "D", "E"].map(element),
      })
    ).toEqual(["image_urls and elements together cannot exceed 10"]);
    expect(
      parse({
        prompt: "x",
        image_urls: Array.from({ length: 11 }, () => IMAGE),
      }).success
    ).toBe(false);
  });

  it("takes public http(s) reference URLs only", () => {
    expect(parse({ prompt: "x", image_urls: ["ftp://a/b.png"] }).success).toBe(
      false
    );
  });

  it("validates elements: 2-4 images, tag, description and name", () => {
    expect(
      messages({
        prompt: "@Hero waves",
        elements: [
          {
            ...element("Hero"),
            tag: "character",
            description: "A young man in a red jacket",
          },
        ],
      })
    ).toEqual([]);
    expect(
      parse({
        prompt: "x",
        elements: [{ name: "Hero", image_urls: [IMAGE] }],
      }).success
    ).toBe(false);
    expect(
      parse({
        prompt: "x",
        elements: [{ ...element("Hero"), tag: "vehicle" }],
      }).success
    ).toBe(false);
    expect(
      parse({
        prompt: "x",
        elements: [{ ...element("Hero"), description: "x".repeat(101) }],
      }).success
    ).toBe(false);
    for (const name of ["", "a".repeat(21), "has space", "Hero!"]) {
      expect(
        parse({ prompt: "x", elements: [element(name)] }).success,
        name
      ).toBe(false);
    }
    expect(parse({ prompt: "x", elements: [element("英雄_1")] }).success).toBe(
      true
    );
  });

  it("refuses reserved and repeated element names", () => {
    expect(
      messages({
        prompt: "x",
        elements: [element("image_1"), element("Object_2"), element("Hero")],
      })
    ).toEqual([
      "image_1 is a reserved element name",
      "Object_2 is a reserved element name",
    ]);
    expect(
      messages({ prompt: "x", elements: [element("Hero"), element("hero")] })
    ).toEqual(["hero repeats a name in elements (case-insensitive)"]);
    // video_N is reserved on the Kling 4.0 video models, not here.
    expect(messages({ prompt: "x", elements: [element("video_1")] })).toEqual(
      []
    );
  });

  it("refuses unknown input fields, as the docs' additionalProperties: false does", () => {
    expect(parse({ prompt: "x", negative_prompt: "blur" }).success).toBe(false);
  });

  it("describes the same fields it parses", () => {
    const descriptor = modelInputSchemas[model];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields).sort()).toEqual(
      Object.keys(Kling40ImageRequestSchema.shape.input.shape).sort()
    );
    expect(descriptor.fields.prompt).toMatchObject({
      required: true,
      maxLength: 20000,
    });
    expect(descriptor.fields.resolution.enum).toEqual(["2k", "4k", "8k"]);
    expect(descriptor.fields.count).toMatchObject({
      type: "integer",
      minimum: 1,
      maximum: 10,
    });
    expect(descriptor.fields.count).not.toHaveProperty("default");
  });
});
