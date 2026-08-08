import { describe, expect, it } from "vitest";

import { createKie } from "@apicity/kie";
import {
  KlingVideoRequestSchema,
  SeedreamImageToImageRequestSchema,
  SeedreamTextToImageRequestSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProTextToImageRequestSchema,
  Seedream45TextToImageRequestSchema,
  Seedream45EditRequestSchema,
} from "../../packages/provider/kie/src/zod";

describe("KIE modelInputSchemas metadata", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("exposes Grok manual constraints as public metadata", () => {
    const imageFields =
      provider.modelInputSchemas["grok-imagine/image-to-video"].fields;
    const textFields =
      provider.modelInputSchemas["grok-imagine/text-to-video"].fields;
    const previewFields =
      provider.modelInputSchemas["grok-imagine-video-1-5-preview"].fields;
    const textToImageFields =
      provider.modelInputSchemas["grok-imagine/text-to-image"].fields;

    expect(imageFields.prompt.maxLength).toBe(4096);
    expect(imageFields.image_urls.minItems).toBe(1);
    expect(imageFields.image_urls.maxItems).toBe(7);
    expect(imageFields.image_urls.description).toContain("JPEG/PNG/WEBP");
    expect(imageFields.image_urls.description).toContain("max 7");
    expect(imageFields.image_urls.description).toContain("10MB each");
    expect(imageFields.image_urls.description).toContain("max 1 at 1080p");
    expect(imageFields.image_urls.description).toContain(
      "mutually exclusive with task_id"
    );
    expect(imageFields.index.type).toBe("integer");
    expect(imageFields.index.minimum).toBe(0);
    expect(imageFields.index.maximum).toBe(5);
    expect(imageFields.index.default).toBe(0);
    expect(textFields.resolution.enum).toEqual(["480p", "720p", "1080p"]);
    expect(imageFields.resolution.enum).toEqual(["480p", "720p", "1080p"]);
    expect(previewFields.resolution.enum).toEqual(["480p", "720p"]);
    expect(Object.hasOwn(textToImageFields, "resolution")).toBe(false);

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

  it("exposes the evidence-backed Grok Extend contract", () => {
    const fields = provider.modelInputSchemas["grok-imagine/extend"].fields;

    expect(fields.extend_at).toMatchObject({
      type: "number",
      required: true,
      minimum: 0,
    });
    expect(fields.extend_at.default).toBeUndefined();
    expect(fields.extend_at.maximum).toBeUndefined();
    expect(fields.extend_at.description).toContain("including fractions");
    expect(fields.extend_at.description).toContain("without coercion");

    expect(fields.extend_times).toMatchObject({
      type: "string",
      required: true,
      enum: ["6", "10"],
    });
    expect(fields.extend_times.acceptedTypes).toBeUndefined();
    expect(fields.extend_times.default).toBeUndefined();
    expect(fields.extend_times.description).toContain("numbers are rejected");
    expect(fields.extend_times.description).toContain("without coercion");
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

  it("exposes exact ElevenLabs numeric contracts", () => {
    const multilingualFields =
      provider.modelInputSchemas["elevenlabs/text-to-speech-multilingual-v2"]
        .fields;
    const turboFields =
      provider.modelInputSchemas["elevenlabs/text-to-speech-turbo-2-5"].fields;
    const expected = {
      stability: { minimum: 0, maximum: 1, default: 0.5 },
      similarity_boost: { minimum: 0, maximum: 1, default: 0.75 },
      style: { minimum: 0, maximum: 1, default: 0 },
      speed: { minimum: 0.7, maximum: 1.2, default: 1 },
    } as const;

    for (const [field, contract] of Object.entries(expected)) {
      expect(multilingualFields[field]).toMatchObject({
        type: "number",
        ...contract,
      });
      expect(turboFields[field]).toEqual(multilingualFields[field]);
      expect(multilingualFields[field].description).toContain("schema parsing");
      expect(multilingualFields[field].description).toContain("createTask");
    }

    const dialogueStability =
      provider.modelInputSchemas["elevenlabs/text-to-dialogue-v3"].fields
        .stability;
    expect(dialogueStability).toMatchObject({
      type: "number",
      enum: [0, 0.5, 1],
      default: 0.5,
    });
    expect(dialogueStability.minimum).toBeUndefined();
    expect(dialogueStability.maximum).toBeUndefined();
    expect(dialogueStability.description).toContain("Discrete");
    expect(dialogueStability.description).toContain("schema parsing");
    expect(dialogueStability.description).toContain("createTask");
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

// ---------------------------------------------------------------------------
// MiniMax H3 registry entries (REQ-005 through REQ-007, AC-5 and AC-6)
// ---------------------------------------------------------------------------

describe("KIE MiniMax H3 modelInputSchemas metadata (REQ-007)", () => {
  const provider = createKie({ apiKey: "test-key" });
  const MODELS = [
    "minimax-h3/text-to-video",
    "minimax-h3/image-to-video",
    "minimax-h3/reference-to-video",
  ] as const;
  const FIXED_ASPECT_RATIOS = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"];

  function expectDescription(
    description: string | undefined,
    fragments: readonly string[]
  ): void {
    for (const fragment of fragments) {
      expect(description).toContain(fragment);
    }
  }

  it("exposes exactly three video models with every and only their input fields", () => {
    const miniMaxModels = Object.keys(provider.modelInputSchemas).filter(
      (model) => model.startsWith("minimax-h3/")
    );
    expect(miniMaxModels).toEqual(MODELS);

    const expectedFields = {
      "minimax-h3/text-to-video": [
        "prompt",
        "aspect_ratio",
        "duration",
        "resolution",
      ],
      "minimax-h3/image-to-video": [
        "prompt",
        "first_frame_url",
        "last_frame_url",
        "duration",
        "resolution",
      ],
      "minimax-h3/reference-to-video": [
        "prompt",
        "reference_image_urls",
        "reference_video_urls",
        "reference_audio_urls",
        "aspect_ratio",
        "duration",
        "resolution",
      ],
    } as const;

    for (const model of MODELS) {
      const entry = provider.modelInputSchemas[model];
      expect(entry.type).toBe("video");
      expect(Object.keys(entry.fields)).toEqual(expectedFields[model]);
      expect(entry.fields.callBackUrl).toBeUndefined();
    }
  });

  it("documents shared prompt, duration, and resolution contracts", () => {
    for (const model of MODELS) {
      const fields = provider.modelInputSchemas[model].fields;

      expect(fields.prompt).toMatchObject({
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 7000,
      });
      expect(fields.duration).toMatchObject({
        type: "integer",
        required: true,
        minimum: 4,
        maximum: 15,
        default: 6,
      });
      expect(fields.duration.description).toContain("requires callers");
      expect(fields.resolution).toMatchObject({
        type: "string",
        enum: ["768P", "2K"],
        default: "2K",
      });
      expect(fields.resolution.required).toBeUndefined();
      expect(fields.resolution.description).toContain(
        "not synthesized locally"
      );
    }
  });

  it("documents text-to-video's fixed required aspect ratio", () => {
    const fields =
      provider.modelInputSchemas["minimax-h3/text-to-video"].fields;

    expect(fields.aspect_ratio).toMatchObject({
      type: "string",
      required: true,
      enum: FIXED_ASPECT_RATIOS,
    });
    expect(fields.aspect_ratio.default).toBeUndefined();
    expect(fields.aspect_ratio.description).toContain(
      "adaptive is not accepted"
    );
  });

  it("documents image-to-video frame dependencies and remote restrictions", () => {
    const fields =
      provider.modelInputSchemas["minimax-h3/image-to-video"].fields;

    for (const name of ["first_frame_url", "last_frame_url"] as const) {
      const field = fields[name];
      expect(field.type).toBe("string");
      expect(field.required).toBeUndefined();
      expectDescription(field.description, [
        "HTTP, HTTPS, or OSS",
        "at least one of first_frame_url or last_frame_url is required",
        "not inspected locally",
        "JPG/JPEG/PNG/WEBP/HEIC/HEIF",
        "30 MB",
        "256-5760",
        "0.4-2.5",
      ]);
    }
  });

  it("documents reference list caps, dependencies, and URL protocols", () => {
    const fields =
      provider.modelInputSchemas["minimax-h3/reference-to-video"].fields;
    const references = [
      ["reference_image_urls", 9],
      ["reference_video_urls", 3],
      ["reference_audio_urls", 3],
    ] as const;

    for (const [name, maxItems] of references) {
      const field = fields[name];
      expect(field).toMatchObject({ type: "array", maxItems });
      expect(field.required).toBeUndefined();
      expect(field.items?.type).toBe("string");
      expectDescription(field.items?.description, ["HTTP", "HTTPS", "OSS"]);
    }

    expectDescription(fields.reference_image_urls.description, [
      "at least one of reference_image_urls or reference_video_urls",
      "not inspected locally",
      "JPG/JPEG/PNG/WEBP/HEIC/HEIF",
      "30 MB",
      "256-5760",
      "0.4-2.5",
    ]);
    expectDescription(fields.reference_video_urls.description, [
      "at least one of reference_image_urls or reference_video_urls",
      "not inspected locally",
      "MP4/MOV",
      "H.264/H.265",
      "AAC/MP3",
      "50 MB",
      "2-15 seconds",
      "15 seconds combined",
      "256-5760",
      "0.4-2.5",
      "23.976-60",
    ]);
    expectDescription(fields.reference_audio_urls.description, [
      "cannot be the sole reference",
      "not inspected locally",
      "WAV/MP3",
      "15 MB",
      "2-15 seconds",
      "15 seconds combined",
    ]);
  });

  it("documents reference-to-video's optional adaptive aspect ratio", () => {
    const fields =
      provider.modelInputSchemas["minimax-h3/reference-to-video"].fields;

    expect(fields.aspect_ratio).toMatchObject({
      type: "string",
      enum: ["adaptive", ...FIXED_ASPECT_RATIOS],
      default: "adaptive",
    });
    expect(fields.aspect_ratio.required).toBeUndefined();
    expect(fields.aspect_ratio.description).toContain(
      "not synthesized locally"
    );
  });
});

// ---------------------------------------------------------------------------
// Google Gemini TTS registry entries
// ---------------------------------------------------------------------------

describe("KIE Google Gemini TTS modelInputSchemas metadata", () => {
  const provider = createKie({ apiKey: "test-key" });
  const MODELS = [
    "google/gemini-2-5-pro-tts",
    "google/gemini-3-1-flash-tts",
  ] as const;
  const EXPECTED_FIELDS = [
    "temperature",
    "scene",
    "sample_context",
    "speakers",
    "dialogue_turns",
  ] as const;

  it("exposes exactly two audio models with shared input fields", () => {
    const googleTtsModels = Object.keys(provider.modelInputSchemas).filter(
      (model) => model.startsWith("google/gemini-") && model.endsWith("-tts")
    );
    expect(googleTtsModels).toEqual([...MODELS]);

    for (const model of MODELS) {
      const entry = provider.modelInputSchemas[model];
      expect(entry.type).toBe("audio");
      expect(Object.keys(entry.fields)).toEqual([...EXPECTED_FIELDS]);
      expect(entry.fields.callBackUrl).toBeUndefined();
    }
  });

  it("documents temperature bounds with a metadata-only default", () => {
    for (const model of MODELS) {
      const temperature = provider.modelInputSchemas[model].fields.temperature;
      expect(temperature).toMatchObject({
        type: "number",
        minimum: 0,
        maximum: 2,
        default: 1,
      });
      expect(temperature.required).toBeUndefined();
      expect(temperature.description).toContain("not synthesized locally");
    }
  });

  it("documents required speakers and dialogue_turns object arrays", () => {
    for (const model of MODELS) {
      const fields = provider.modelInputSchemas[model].fields;

      expect(fields.speakers).toMatchObject({
        type: "array",
        required: true,
        minItems: 1,
      });
      expect(fields.speakers.items?.type).toBe("object");
      expect(fields.speakers.items?.properties?.speaker_id).toMatchObject({
        type: "string",
        required: true,
      });
      expect(fields.speakers.items?.properties?.voice_name).toMatchObject({
        type: "string",
        required: true,
      });
      expect(fields.speakers.items?.properties?.voice_name.enum).toContain(
        "Zephyr"
      );
      expect(fields.speakers.items?.properties?.accent).toMatchObject({
        type: "string",
        required: true,
      });
      expect(fields.speakers.items?.properties?.accent.enum).toContain(
        "British (RP)"
      );
      expect(fields.speakers.items?.properties?.style?.enum).toContain(
        "Deadpan"
      );
      expect(fields.speakers.items?.properties?.pace?.enum).toContain(
        "Staccato"
      );

      expect(fields.dialogue_turns).toMatchObject({
        type: "array",
        required: true,
        minItems: 1,
      });
      expect(fields.dialogue_turns.items?.properties?.text).toMatchObject({
        type: "string",
        required: true,
        minLength: 1,
        maxLength: 10000,
      });
    }
  });

  it("documents optional scene and sample_context strings", () => {
    for (const model of MODELS) {
      const fields = provider.modelInputSchemas[model].fields;
      expect(fields.scene).toMatchObject({ type: "string" });
      expect(fields.scene.required).toBeUndefined();
      expect(fields.sample_context).toMatchObject({ type: "string" });
      expect(fields.sample_context.required).toBeUndefined();
    }
  });
});

// Unversioned Qwen v1 registry entries
// ---------------------------------------------------------------------------

describe("KIE Qwen v1 modelInputSchemas metadata", () => {
  const provider = createKie({ apiKey: "test-key" });
  const MODELS = [
    "qwen/image-edit",
    "qwen/image-to-image",
    "qwen/text-to-image",
  ] as const;

  it("exposes exactly three unversioned Qwen models with input fields", () => {
    const qwenV1Models = Object.keys(provider.modelInputSchemas)
      .filter(
        (model) => model.startsWith("qwen/") && !model.startsWith("qwen2")
      )
      .sort();
    expect(qwenV1Models).toEqual([...MODELS].sort());

    expect(
      Object.keys(
        provider.modelInputSchemas["qwen/text-to-image"].fields
      ).sort()
    ).toEqual(
      [
        "acceleration",
        "enable_safety_checker",
        "guidance_scale",
        "image_size",
        "negative_prompt",
        "nsfw_checker",
        "num_inference_steps",
        "output_format",
        "prompt",
        "seed",
      ].sort()
    );
    expect(
      provider.modelInputSchemas["qwen/image-edit"].fields.image_url.required
    ).toBe(true);
    expect(
      provider.modelInputSchemas["qwen/image-to-image"].fields.image_url
        .required
    ).toBe(true);
  });

  it("documents text-to-image size enum and defaults", () => {
    const fields = provider.modelInputSchemas["qwen/text-to-image"].fields;

    expect(fields.prompt).toMatchObject({
      type: "string",
      required: true,
      maxLength: 5000,
    });
    expect(fields.image_size).toMatchObject({
      type: "string",
      default: "square_hd",
      enum: [
        "square",
        "square_hd",
        "portrait_4_3",
        "portrait_16_9",
        "landscape_4_3",
        "landscape_16_9",
      ],
    });
    expect(fields.num_inference_steps).toMatchObject({
      type: "number",
      minimum: 2,
      maximum: 250,
      default: 30,
    });
  });

  it("documents image-edit numeric-string num_images enum", () => {
    const fields = provider.modelInputSchemas["qwen/image-edit"].fields;

    expect(fields.num_images).toMatchObject({
      type: "string",
      enum: ["1", "2", "3", "4"],
    });
    expect(fields.num_images.required).toBeUndefined();
    expect(fields.image_size.default).toBe("landscape_4_3");
    expect(fields.num_inference_steps).toMatchObject({
      type: "number",
      minimum: 2,
      maximum: 49,
      default: 25,
    });
  });

  it("documents image-to-image strength bounds", () => {
    const fields = provider.modelInputSchemas["qwen/image-to-image"].fields;

    expect(fields.strength).toMatchObject({
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 0.8,
    });
  });
});

// Topaz registry entries
// ---------------------------------------------------------------------------

describe("KIE Topaz modelInputSchemas metadata", () => {
  const provider = createKie({ apiKey: "test-key" });
  const MODELS = ["topaz/image-upscale", "topaz/video-upscale"] as const;

  it("exposes exactly two Topaz models with their input fields", () => {
    const topazModels = Object.keys(provider.modelInputSchemas).filter(
      (model) => model.startsWith("topaz/")
    );
    expect(topazModels).toEqual(MODELS);

    expect(
      Object.keys(
        provider.modelInputSchemas["topaz/image-upscale"].fields
      ).sort()
    ).toEqual(["image_url", "upscale_factor"]);
    expect(
      Object.keys(
        provider.modelInputSchemas["topaz/video-upscale"].fields
      ).sort()
    ).toEqual(["upscale_factor", "video_url"]);
  });

  it("documents image-upscale required string factor enum", () => {
    const fields = provider.modelInputSchemas["topaz/image-upscale"].fields;

    expect(fields.image_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(fields.upscale_factor).toMatchObject({
      type: "string",
      required: true,
      enum: ["1", "2", "4"],
      default: "2",
    });
  });

  it("documents video-upscale optional string factor enum", () => {
    const fields = provider.modelInputSchemas["topaz/video-upscale"].fields;

    expect(fields.video_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(fields.upscale_factor).toMatchObject({
      type: "string",
      enum: ["1", "2", "4"],
      default: "2",
    });
    expect(fields.upscale_factor.required).toBeUndefined();
  });
});

// Infinitalk + z-image singleton registry entries
// ---------------------------------------------------------------------------

describe("KIE singleton vendor modelInputSchemas metadata", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("exposes infinitalk/from-audio video fields", () => {
    const schema = provider.modelInputSchemas["infinitalk/from-audio"];
    expect(schema.type).toBe("video");
    expect(Object.keys(schema.fields).sort()).toEqual([
      "audio_url",
      "image_url",
      "prompt",
      "resolution",
      "seed",
    ]);
    expect(schema.fields.image_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(schema.fields.audio_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(schema.fields.prompt).toMatchObject({
      type: "string",
      required: true,
      maxLength: 5000,
    });
    expect(schema.fields.resolution).toMatchObject({
      type: "string",
      enum: ["480p", "720p"],
      default: "480p",
    });
    expect(schema.fields.seed).toMatchObject({
      type: "integer",
      minimum: 10000,
      maximum: 1000000,
    });
  });

  it("exposes z-image image fields", () => {
    const schema = provider.modelInputSchemas["z-image"];
    expect(schema.type).toBe("image");
    expect(Object.keys(schema.fields).sort()).toEqual([
      "aspect_ratio",
      "nsfw_checker",
      "prompt",
    ]);
    expect(schema.fields.prompt).toMatchObject({
      type: "string",
      required: true,
      maxLength: 1000,
    });
    expect(schema.fields.aspect_ratio).toMatchObject({
      type: "string",
      required: true,
      enum: ["1:1", "4:3", "3:4", "16:9", "9:16"],
      default: "1:1",
    });
    expect(schema.fields.nsfw_checker).toMatchObject({
      type: "boolean",
      default: false,
    });
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
    ["seedream/4.5-text-to-image", Seedream45TextToImageRequestSchema],
    ["seedream/4.5-edit", Seedream45EditRequestSchema],
  ] as const;

  const baseInput = (model: string) => {
    const input: Record<string, unknown> = {
      prompt: "A quiet harbour at first light",
    };
    if (model.includes("image-to-image") || model.endsWith("-edit")) {
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

describe("KIE Seedream 5 Pro layer decomposition metadata", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("describes the exact image operation contract", () => {
    const entry =
      provider.modelInputSchemas["seedream/5-pro-layer-decomposition"];
    const fields = entry.fields;

    expect(entry.type).toBe("image");
    expect(Object.keys(fields).sort()).toEqual([
      "image_url",
      "output_format",
      "prompt",
      "size",
    ]);
    expect(fields.image_url).toMatchObject({
      type: "string",
      required: true,
    });
    expect(fields.image_url.description).toContain("remote source image");
    expect(fields.image_url.description).toContain(
      "PNG, JPEG, WebP, BMP, TIFF, or GIF"
    );
    expect(fields.image_url.description).toContain("30 MB");
    expect(fields.image_url.description).toContain("262,144-36,000,000 pixels");
    expect(fields.image_url.description).toContain("1:16-16:1 aspect ratio");
    expect(fields.image_url.description).toContain("HEIC/HEIF");
    expect(fields.image_url.description).toContain("does not fetch");
    expect(fields.prompt).toMatchObject({
      type: "string",
      maxLength: 5000,
    });
    expect(fields.prompt.description).toContain("<bbox>");
    expect(fields.size).toMatchObject({
      type: "string",
      enum: ["auto", "1K", "1.5K", "2K"],
      default: "auto",
    });
    expect(fields.output_format).toMatchObject({
      type: "string",
      enum: ["png", "jpeg"],
      default: "jpeg",
    });
    expect(fields.output_format.description).toContain("layers remain PNG");
  });
});

// REQ-002. Cataloguing the two Seedream 4.5 ids gave them modelInputSchemas
// entries. These assertions pin field parity with the shipped request schemas.
// The key-set equality is the pointed one: seedream/5-pro carries a png/jpeg
// `output_format`, the 4.5 fragments document none, and the entries must not
// invent one by pattern-matching their nearest neighbour.
describe("KIE Seedream 4.5 modelInputSchemas metadata (REQ-002)", () => {
  const provider = createKie({ apiKey: "test-key" });
  const MODELS = ["seedream/4.5-text-to-image", "seedream/4.5-edit"] as const;
  const ASPECT_RATIOS = [
    "1:1",
    "4:3",
    "3:4",
    "16:9",
    "9:16",
    "2:3",
    "3:2",
    "21:9",
  ];

  it("types both as image models with exactly their documented fields", () => {
    const expectedFields = {
      "seedream/4.5-text-to-image": [
        "prompt",
        "aspect_ratio",
        "quality",
        "nsfw_checker",
      ],
      "seedream/4.5-edit": [
        "image_urls",
        "prompt",
        "aspect_ratio",
        "quality",
        "nsfw_checker",
      ],
    } as const;

    for (const model of MODELS) {
      const entry = provider.modelInputSchemas[model];
      expect(entry.type).toBe("image");
      expect(Object.keys(entry.fields)).toEqual(expectedFields[model]);
      expect(entry.fields.output_format).toBeUndefined();
      expect(entry.fields.callBackUrl).toBeUndefined();
    }
  });

  it("documents the shared prompt, aspect_ratio, and quality contracts", () => {
    for (const model of MODELS) {
      const fields = provider.modelInputSchemas[model].fields;

      expect(fields.prompt).toMatchObject({
        type: "string",
        required: true,
      });
      expect(fields.prompt.description).toContain("3-3000");
      expect(fields.aspect_ratio).toMatchObject({ type: "string" });
      expect(fields.aspect_ratio.enum).toEqual(ASPECT_RATIOS);
      expect(fields.quality).toMatchObject({
        type: "string",
        required: true,
        enum: ["basic", "high"],
      });
      // The documented-defaults trap the zod schemas encode: `quality` is
      // required and deliberately carries no default here either.
      expect(fields.quality.default).toBeUndefined();
      expect(fields.nsfw_checker.type).toBe("boolean");
    }
  });

  it("documents the edit model's required 14-item image_urls", () => {
    const fields = provider.modelInputSchemas["seedream/4.5-edit"].fields;

    expect(fields.image_urls).toMatchObject({
      type: "array",
      required: true,
    });
    expect(fields.image_urls.items?.type).toBe("string");
    expect(fields.image_urls.description).toContain("14");
  });
});

// REQ-001 / REQ-006. Cataloguing the seven wan 2.2/2.5 ids gave them
// modelInputSchemas entries. These pin the constraints worth publishing as
// metadata rather than the whole field set: the media inputs each op requires,
// and the two documented-defaults answers the fragments give — the turbo pair
// publishes no 580p tier (kie prices one, so nothing but this enum records
// that the SDK cannot reach it), and wan 2.5 documents no default for either
// `duration` or `resolution`, so neither may be synthesised here.
describe("KIE wan 2.2/2.5 modelInputSchemas metadata (REQ-001)", () => {
  const provider = createKie({ apiKey: "test-key" });
  const MODELS = [
    "wan/2-2-a14b-image-to-video-turbo",
    "wan/2-2-a14b-speech-to-video-turbo",
    "wan/2-2-a14b-text-to-video-turbo",
    "wan/2-2-animate-move",
    "wan/2-2-animate-replace",
    "wan/2-5-image-to-video",
    "wan/2-5-text-to-video",
  ] as const;
  const ANIMATE_MODELS = [
    "wan/2-2-animate-move",
    "wan/2-2-animate-replace",
  ] as const;
  const WAN_25_MODELS = [
    "wan/2-5-image-to-video",
    "wan/2-5-text-to-video",
  ] as const;

  // The animate pair is the exception: its fragments expose no seed at all.
  const SEEDED_MODELS = MODELS.filter(
    (model) =>
      !ANIMATE_MODELS.includes(model as (typeof ANIMATE_MODELS)[number])
  );

  it("types all seven as video models with an undefaulted seed", () => {
    for (const model of MODELS) {
      const entry = provider.modelInputSchemas[model];

      expect(entry.type).toBe("video");
      expect(entry.fields.callBackUrl).toBeUndefined();
    }

    for (const model of SEEDED_MODELS) {
      const fields = provider.modelInputSchemas[model].fields;

      // Only the t2v/i2v turbo fragments bound `seed` (0..2147483647); the
      // speech-to-video and both 2.5 fragments type it as a bare integer, so
      // no bounds are published for those. Every seeded fragment publishes
      // default 0 beside "if None, a random seed is chosen" — recording that
      // default would make MCP clients prefill a fixed seed, so it is not.
      const bounded =
        model === "wan/2-2-a14b-text-to-video-turbo" ||
        model === "wan/2-2-a14b-image-to-video-turbo";

      expect(fields.seed).toMatchObject(
        bounded
          ? { type: "integer", minimum: 0, maximum: 2147483647 }
          : { type: "integer" }
      );
      if (!bounded) {
        expect(fields.seed.minimum).toBeUndefined();
        expect(fields.seed.maximum).toBeUndefined();
      }
      expect(fields.seed.default).toBeUndefined();
      expect(fields.seed.required).toBeUndefined();
    }

    for (const model of ANIMATE_MODELS) {
      expect(provider.modelInputSchemas[model].fields.seed).toBeUndefined();
    }
  });

  it("documents speech-to-video's audio input and frame contracts", () => {
    const fields =
      provider.modelInputSchemas["wan/2-2-a14b-speech-to-video-turbo"].fields;

    // The driving audio is what makes this model speech-to-video; without it
    // the guard now rejects the request before transport.
    expect(fields.audio_url).toMatchObject({ type: "string", required: true });
    expect(fields.image_url).toMatchObject({ type: "string", required: true });
    expect(fields.prompt).toMatchObject({ type: "string", required: true });
    expect(fields.num_frames).toMatchObject({
      type: "integer",
      minimum: 40,
      maximum: 120,
      default: 80,
    });
    expect(fields.frames_per_second).toMatchObject({
      type: "integer",
      minimum: 4,
      maximum: 60,
      default: 16,
    });
    // Output length is num_frames / frames_per_second — 5s at the defaults —
    // and there is no `duration` field to say so.
    expect(fields.duration).toBeUndefined();
    expect(fields.resolution.enum).toEqual(["480p", "580p", "720p"]);
  });

  it("documents both animate ops' required video and image inputs", () => {
    for (const model of ANIMATE_MODELS) {
      const fields = provider.modelInputSchemas[model].fields;

      expect(fields.video_url).toMatchObject({
        type: "string",
        required: true,
      });
      expect(fields.image_url).toMatchObject({
        type: "string",
        required: true,
      });
      // Both inherit the driving clip's length: no duration axis at all.
      expect(fields.duration).toBeUndefined();
      expect(fields.resolution).toMatchObject({
        type: "string",
        default: "480p",
      });
      expect(fields.resolution.enum).toEqual(["480p", "580p", "720p"]);
    }
  });

  it("documents wan 2.5's required duration with no injected default", () => {
    for (const model of WAN_25_MODELS) {
      const fields = provider.modelInputSchemas[model].fields;

      expect(fields.duration).toMatchObject({
        type: "string",
        required: true,
        enum: ["5", "10"],
      });
      expect(fields.duration.default).toBeUndefined();
      expect(fields.resolution).toMatchObject({ type: "string" });
      expect(fields.resolution.enum).toEqual(["720p", "1080p"]);
      expect(fields.resolution.default).toBeUndefined();
      expect(fields.resolution.required).toBeUndefined();
      expect(fields.prompt.maxLength).toBe(800);
    }
  });

  it("keeps 580p off the turbo pair kie prices it for", () => {
    for (const model of [
      "wan/2-2-a14b-image-to-video-turbo",
      "wan/2-2-a14b-text-to-video-turbo",
    ] as const) {
      const fields = provider.modelInputSchemas[model].fields;

      expect(fields.resolution.enum).toEqual(["480p", "720p"]);
      expect(fields.resolution.default).toBe("720p");
      expect(fields.acceleration).toMatchObject({
        type: "string",
        default: "none",
      });
      expect(fields.acceleration.enum).toEqual(["none", "regular"]);
      expect(fields.prompt.maxLength).toBe(5000);
    }
  });
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
