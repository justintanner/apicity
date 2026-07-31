import { describe, expect, it } from "vitest";

import { createKie } from "@apicity/kie";
import {
  KlingVideoRequestSchema,
  SeedreamImageToImageRequestSchema,
  SeedreamTextToImageRequestSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProTextToImageRequestSchema,
} from "../../packages/provider/kie/src/zod";

describe("KIE modelInputSchemas metadata", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("exposes Grok manual constraints as public metadata", () => {
    const imageFields =
      provider.modelInputSchemas["grok-imagine/image-to-video"].fields;
    const textFields =
      provider.modelInputSchemas["grok-imagine/text-to-video"].fields;

    expect(imageFields.prompt.maxLength).toBe(4096);
    expect(imageFields.image_urls.minItems).toBe(1);
    expect(imageFields.image_urls.maxItems).toBe(7);
    expect(imageFields.index.type).toBe("integer");
    expect(imageFields.index.minimum).toBe(0);
    expect(imageFields.index.maximum).toBe(5);
    expect(imageFields.index.default).toBe(0);

    for (const fields of [textFields, imageFields]) {
      expect(fields.duration.type).toBe("integer");
      expect(fields.duration.acceptedTypes).toEqual(["integer", "string"]);
      expect(fields.duration.minimum).toBe(6);
      expect(fields.duration.maximum).toBe(30);
      expect(fields.duration.default).toBe(6);
      expect(fields.duration.description).toContain("^(?:[6-9]|[12][0-9]|30)$");
      expect(fields.duration.description).toContain(
        "preserves the supplied representation"
      );
    }
  });

  it("exposes Wan image numeric, string, and array constraints", () => {
    const fields = provider.modelInputSchemas["wan/2-7-image-pro"].fields;

    expect(fields.prompt.maxLength).toBe(5000);
    expect(fields.input_urls.maxItems).toBe(9);
    expect(fields.n.type).toBe("integer");
    expect(fields.n.minimum).toBe(1);
    expect(fields.n.maximum).toBe(12);
    expect(fields.color_palette.minItems).toBe(3);
    expect(fields.color_palette.maxItems).toBe(10);
    expect(fields.seed.type).toBe("integer");
    expect(fields.seed.minimum).toBe(0);
    expect(fields.seed.maximum).toBe(2147483647);
  });

  it("exposes HappyHorse duration and prompt constraints", () => {
    const fields =
      provider.modelInputSchemas["happyhorse/text-to-video"].fields;

    expect(fields.prompt.minLength).toBe(1);
    expect(fields.prompt.maxLength).toBe(5000);
    expect(fields.duration.type).toBe("integer");
    expect(fields.duration.minimum).toBe(3);
    expect(fields.duration.maximum).toBe(15);
    expect(fields.duration.default).toBe(5);
  });

  it("exposes HappyHorse 1.1 metadata and widened aspect ratios", () => {
    const textFields =
      provider.modelInputSchemas["happyhorse-1-1/text-to-video"].fields;
    const imageFields =
      provider.modelInputSchemas["happyhorse-1-1/image-to-video"].fields;
    const referenceFields =
      provider.modelInputSchemas["happyhorse-1-1/reference-to-video"].fields;

    expect(textFields.prompt.required).toBe(true);
    expect(textFields.prompt.maxLength).toBe(5000);
    expect(textFields.resolution.default).toBe("1080p");
    expect(textFields.aspect_ratio.enum).toContain("21:9");
    expect(textFields.duration.minimum).toBe(3);
    expect(textFields.duration.maximum).toBe(15);

    expect(imageFields.prompt.default).toBe("");
    expect(imageFields.image_urls.required).toBe(true);
    expect(imageFields.image_urls.maxItems).toBe(1);
    expect(imageFields.duration.default).toBe(5);

    expect(referenceFields.reference_image.required).toBe(true);
    expect(referenceFields.reference_image.maxItems).toBe(9);
    expect(referenceFields.aspect_ratio.enum).toContain("9:21");
    expect(referenceFields.duration.default).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// PixVerse V6 registry entries (REQ-007, AC-3)
// ---------------------------------------------------------------------------
//
// modelInputSchemas is the surface a consumer reads to discover a model's
// fields without opening zod.ts (US-3), so these assert the public metadata
// itself — enum membership, ranges, documented defaults, array bounds, and the
// nested image_references item shape — not the zod schema behind it. The
// documented defaults are the point of BR-8: they are recorded here precisely
// because the schema deliberately does *not* apply them.

describe("KIE PixVerse V6 modelInputSchemas metadata (REQ-007)", () => {
  const provider = createKie({ apiKey: "test-key" });
  const QUALITIES = ["360p", "540p", "720p", "1080p"];
  const ASPECT_RATIOS = [
    "16:9",
    "4:3",
    "1:1",
    "3:4",
    "9:16",
    "2:3",
    "3:2",
    "21:9",
  ];

  it.each([
    "pixverse-v6/text-to-video",
    "pixverse-v6/image-to-video",
    "pixverse-v6/transition",
    "pixverse-v6/extend",
    "pixverse-v6/reference-to-video",
  ] as const)("types %s as a video model with a 3-5000 prompt", (model) => {
    const entry = provider.modelInputSchemas[model];

    expect(entry.type).toBe("video");
    expect(entry.fields.prompt).toMatchObject({
      type: "string",
      required: true,
      minLength: 3,
      maxLength: 5000,
    });
    expect(entry.fields.quality.enum).toEqual(QUALITIES);
    expect(entry.fields.seed).toMatchObject({
      type: "integer",
      minimum: 0,
      maximum: 2147483647,
    });
  });

  it("documents image-to-video's 1-2 image_urls and its exclusive pair", () => {
    const fields =
      provider.modelInputSchemas["pixverse-v6/image-to-video"].fields;

    expect(fields.image_urls).toMatchObject({
      type: "array",
      required: true,
      minItems: 1,
      maxItems: 2,
    });
    expect(fields.image_urls.items?.type).toBe("string");
    expect(fields.quality.required).toBe(true);
    expect(fields.quality.default).toBe("720p");

    // Neither half of the duration/template_id pair is unconditionally
    // required, so neither is flagged `required` — the exclusivity lives in
    // the zod refinement and is spelled out in the descriptions.
    expect(fields.duration).toMatchObject({
      type: "integer",
      minimum: 1,
      maximum: 15,
      default: 5,
    });
    expect(fields.duration.required).toBeUndefined();
    expect(fields.template_id.required).toBeUndefined();
    expect(fields.template_id.minLength).toBe(1);
    expect(fields.duration.description).toContain("template_id");
    expect(fields.template_id.description).toContain("duration");

    expect(fields.generate_audio_switch.default).toBe(false);
    expect(fields.generate_multi_clip_switch.default).toBe(false);
    // BR-3: aspect ratio applies only to text-to-video and the fusion mode.
    expect(fields.aspect_ratio).toBeUndefined();
  });

  it("documents transition's two required frame URLs and no multi-clip switch", () => {
    const fields = provider.modelInputSchemas["pixverse-v6/transition"].fields;

    expect(fields.first_frame_image_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(fields.last_frame_image_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(fields.duration).toMatchObject({
      type: "integer",
      required: true,
      minimum: 1,
      maximum: 15,
      default: 5,
    });
    expect(fields.quality.default).toBe("720p");
    expect(fields.generate_audio_switch.default).toBe(false);
    expect(fields.generate_multi_clip_switch).toBeUndefined();
    expect(fields.aspect_ratio).toBeUndefined();
  });

  it("documents extend's exclusive sources and its absent defaults", () => {
    const fields = provider.modelInputSchemas["pixverse-v6/extend"].fields;

    expect(fields.taskId.type).toBe("string");
    expect(fields.video_url.type).toBe("string");
    expect(fields.taskId.required).toBeUndefined();
    expect(fields.video_url.required).toBeUndefined();
    expect(fields.taskId.description).toContain("video_url");
    expect(fields.video_url.description).toContain("taskId");

    expect(fields.quality.required).toBe(true);
    expect(fields.duration).toMatchObject({
      type: "integer",
      required: true,
      minimum: 1,
      maximum: 15,
    });

    // Alone in the family, extend documents no defaults at all upstream, so
    // the registry must not invent any.
    expect(fields.quality.default).toBeUndefined();
    expect(fields.duration.default).toBeUndefined();
    expect(fields.generate_audio_switch.default).toBeUndefined();
  });

  it("documents reference-to-video's 1-7 references and their item shape", () => {
    const fields =
      provider.modelInputSchemas["pixverse-v6/reference-to-video"].fields;

    expect(fields.image_references).toMatchObject({
      type: "array",
      required: true,
      minItems: 1,
      maxItems: 7,
    });

    const item = fields.image_references.items;
    expect(item?.type).toBe("object");
    const properties = item?.properties ?? {};
    expect(Object.keys(properties).sort()).toEqual([
      "image_url",
      "ref_name",
      "type",
    ]);
    expect(properties.image_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(properties.type).toMatchObject({
      type: "string",
      enum: ["subject", "background"],
      default: "subject",
    });
    expect(properties.ref_name).toMatchObject({
      type: "string",
      minLength: 1,
      maxLength: 30,
    });
    expect(properties.ref_name.required).toBeUndefined();

    expect(fields.aspect_ratio).toMatchObject({
      type: "string",
      required: true,
      default: "16:9",
    });
    expect(fields.aspect_ratio.enum).toEqual(ASPECT_RATIOS);
    expect(fields.duration.default).toBe(5);
    expect(fields.generate_multi_clip_switch).toBeUndefined();
  });
});

// AC-3. `callBackUrl` is a top-level envelope field on createTask, not model
// input. It leaked into the pixverse-v6/text-to-video registry entry once and
// was removed in review; asserting it across the whole registry rather than
// only the PixVerse rows means the next entry to copy the mistake fails here.
describe("KIE modelInputSchemas never expose callBackUrl as an input field", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("has no callBackUrl field on any model", () => {
    const offenders = Object.entries(provider.modelInputSchemas)
      .filter(([, entry]) => "callBackUrl" in entry.fields)
      .map(([model]) => model);

    expect(offenders).toEqual([]);
  });
});

// REQ-001 / AC-001. Kie documents a `basic` default for Seedream `quality`,
// but createTask answers "This field is required" when the key is absent, so
// the schemas declare it required and deliberately carry no `.default()`.
// These assertions pin that decision so a future "tidy up the defaults" pass
// cannot silently relax it back to optional.
describe("KIE Seedream quality stays required (REQ-001)", () => {
  const schemas = [
    ["seedream/5-lite-image-to-image", SeedreamImageToImageRequestSchema],
    ["seedream/5-lite-text-to-image", SeedreamTextToImageRequestSchema],
    ["seedream/5-pro-image-to-image", SeedreamProImageToImageRequestSchema],
    ["seedream/5-pro-text-to-image", SeedreamProTextToImageRequestSchema],
  ] as const;

  const baseInput = (model: string) => {
    const input: Record<string, unknown> = {
      prompt: "A quiet harbour at first light",
    };
    if (model.includes("image-to-image")) {
      input.image_urls = ["https://example.com/a.png"];
    }
    return input;
  };

  for (const [model, schema] of schemas) {
    it(`rejects ${model} without quality`, () => {
      const result = schema.safeParse({
        model,
        input: baseInput(model),
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("quality"))).toBe(
        true
      );
    });

    it(`accepts ${model} with an explicit quality`, () => {
      const result = schema.safeParse({
        model,
        input: { ...baseInput(model), quality: "high" },
      });

      expect(result.success).toBe(true);
    });

    it(`does not inject a quality default for ${model}`, () => {
      const result = schema.parse({
        model,
        input: { ...baseInput(model), quality: "basic" },
      });

      // `quality` round-trips exactly as supplied; nothing is defaulted in.
      expect(result.input.quality).toBe("basic");
    });
  }
});

// REQ-001 / AC-001. `kling-3.0/video` documents `sound` as "default false,
// true when multi_shots" and modelInputSchemas does not mark it `required`,
// but zod.ts declared it required. These assertions pin the corrected
// optional-and-undefaulted treatment: the caller may omit it, and omitting it
// must not synthesise a `false` that suppresses the upstream promotion to
// `true` under multi-shot mode.
describe("KIE kling-3.0/video sound is optional and undefaulted (REQ-001)", () => {
  const baseInput = {
    duration: "5",
    mode: "std",
    multi_shots: false,
  };

  it("accepts a request that omits sound", () => {
    const result = KlingVideoRequestSchema.safeParse({
      model: "kling-3.0/video",
      input: { ...baseInput },
    });

    expect(result.success).toBe(true);
  });

  it("does not inject a sound default when omitted", () => {
    const result = KlingVideoRequestSchema.parse({
      model: "kling-3.0/video",
      input: { ...baseInput },
    });

    // Absent stays absent — Kie applies its own context-dependent default.
    expect("sound" in result.input).toBe(false);
    expect(result.input.sound).toBeUndefined();
  });

  it("round-trips an explicit sound value unchanged", () => {
    for (const sound of [true, false]) {
      const result = KlingVideoRequestSchema.parse({
        model: "kling-3.0/video",
        input: { ...baseInput, sound },
      });

      expect(result.input.sound).toBe(sound);
    }
  });

  it("still rejects a non-boolean sound", () => {
    const result = KlingVideoRequestSchema.safeParse({
      model: "kling-3.0/video",
      input: { ...baseInput, sound: "yes" },
    });

    expect(result.success).toBe(false);
  });
});

// Drift guard for the audit behind REQ-001. modelInputSchemas is the
// doc-of-record for which Kie fields are mandatory; zod.ts is what callers
// actually validate against. The `sound` bug was these two disagreeing, so
// assert they agree for every field of the audited model rather than only
// pinning the one field that happened to be wrong.
describe("KIE kling-3.0/video zod matches modelInputSchemas (REQ-001)", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("marks exactly the documented-required fields as required", () => {
    const fields = provider.modelInputSchemas["kling-3.0/video"].fields;
    const documentedRequired = Object.entries(fields)
      .filter(([, spec]) => spec.required === true)
      .map(([name]) => name)
      .sort();

    const inputShape = KlingVideoRequestSchema.shape.input.shape;
    const zodRequired = Object.entries(inputShape)
      .filter(([, schema]) => !schema.safeParse(undefined).success)
      .map(([name]) => name)
      .sort();

    expect(zodRequired).toEqual(documentedRequired);
  });
});
