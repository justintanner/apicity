import { describe, expect, it } from "vitest";

import {
  CreateTaskRequestSchema,
  FluxKontextGenerateRequestSchema,
  KIE_MEDIA_MODELS,
  KieClaudeRequestSchema,
  KieGrokResponsesRequestSchema,
  KieMediaModelSchema,
  KieResponsesRequestSchema,
  Seedance2FastInputSchema,
  Seedance2InputSchema,
  Seedance2MiniInputSchema,
  SunoGenerateRequestSchema,
  VeoExtendRequestSchema,
  VeoGenerateRequestSchema,
} from "@apicity/kie/zod";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/mcp-server/src/schema";

const HTTPS_URL = "https://example.com/image.png";
const LOCAL_PATH = "@asset/photo.png";

function urlIssueMessages(
  result:
    | ReturnType<typeof Seedance2MiniInputSchema.safeParse>
    | ReturnType<typeof Seedance2InputSchema.safeParse>
    | ReturnType<typeof Seedance2FastInputSchema.safeParse>
): string[] {
  return (result.error?.issues ?? [])
    .filter((issue) => issue.path.includes("reference_image_urls"))
    .map((issue) => issue.message);
}

// All three seedance variants share the `.max(9)` cap, so that is asserted
// across the family. Media elements are plain strings family-wide: schemas
// validate the construction boundary, where fields may still hold local
// slugs such as `@asset/photo.png` (URL reachability is kie.ai's job at
// task-creation time). The presence axis differs: mini defaults to `[]`,
// the siblings stay `.optional()`.
const VARIANTS = [
  {
    name: "bytedance/seedance-2-mini",
    schema: Seedance2MiniInputSchema,
    base: {},
  },
  {
    name: "bytedance/seedance-2",
    schema: Seedance2InputSchema,
    base: { prompt: "a cinematic drone shot over a canyon" },
  },
  {
    name: "bytedance/seedance-2-fast",
    schema: Seedance2FastInputSchema,
    base: { prompt: "a cinematic drone shot over a canyon" },
  },
] as const;

describe("KIE Zod schema validation", () => {
  describe.each(VARIANTS)(
    "$name reference_image_urls cap",
    ({ schema, base }) => {
      it("accepts an at-cap array of 9 URLs", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: Array(9).fill(HTTPS_URL),
        });
        expect(result.success).toBe(true);
      });

      it("rejects an over-cap array of 10 URLs", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: Array(10).fill(HTTPS_URL),
        });
        expect(result.success).toBe(false);
        expect(urlIssueMessages(result).length).toBeGreaterThan(0);
      });
    }
  );

  // Review finding R-2: an earlier revision tightened `.url()` onto reference
  // elements, which is breaking for callers currently passing non-URL strings
  // (e.g. not-yet-uploaded local slugs). Pinned family-wide so the tightening
  // cannot return without its own requirement.
  describe.each(VARIANTS)(
    "$name accepts non-URL strings",
    ({ schema, base }) => {
      it("does not enforce a URL shape on reference_image_urls", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: [LOCAL_PATH],
        });
        expect(result.success).toBe(true);
      });
    }
  );

  describe("bytedance/seedance-2-mini local slug acceptance", () => {
    it("accepts local slugs in all three reference arrays", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: ["@img-ref-1"],
        reference_video_urls: ["@vid-ref-1"],
        reference_audio_urls: ["not-a-url"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts a valid HTTPS URL", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: [HTTPS_URL],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("seedance reference_image_urls presence semantics", () => {
    it("defaults mini's reference_image_urls to an empty array", () => {
      const result = Seedance2MiniInputSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.reference_image_urls).toEqual([]);
    });

    it("leaves the siblings' reference_image_urls absent when omitted", () => {
      const result = Seedance2InputSchema.safeParse({
        prompt: "a cinematic drone shot over a canyon",
      });
      expect(result.success).toBe(true);
      expect(result.data?.reference_image_urls).toBeUndefined();
    });
  });

  // pixverse-v6/text-to-video keeps `prompt`, `aspect_ratio`, `quality`, and
  // `duration` required even though the upstream spec documents defaults
  // (16:9 / 720p / 5) — the documented-defaults trap seedream/seedance
  // already hit, so the server never applies them and neither do we. Every
  // case goes through CreateTaskRequestSchema, the same createTask boundary
  // the kie.ts guard runs, which also proves the request schema is wired
  // into the MediaGenerationRequestSchema union (BR-3).
  describe("pixverse-v6/text-to-video", () => {
    const SPEC_PROMPT =
      "A cinematic sunrise illuminates a mist-shrouded mountain lake; the " +
      "camera slowly sweeps across the water's surface as a flock of birds " +
      "flies overhead.";
    const specRequest = {
      model: "pixverse-v6/text-to-video",
      input: {
        prompt: SPEC_PROMPT,
        aspect_ratio: "16:9",
        quality: "720p",
        duration: 5,
        generate_audio_switch: false,
        generate_multi_clip_switch: false,
        seed: 123456789,
      },
    };

    it("parses and round-trips the spec example payload", () => {
      const parsed = CreateTaskRequestSchema.safeParse(specRequest);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toEqual(specRequest);
    });

    it("defaults both generate switches to false when omitted", () => {
      const input: Record<string, unknown> = { ...specRequest.input };
      delete input.generate_audio_switch;
      delete input.generate_multi_clip_switch;
      const parsed = CreateTaskRequestSchema.safeParse({
        ...specRequest,
        input,
      });
      expect(parsed.success).toBe(true);
      expect(parsed.data?.input).toMatchObject({
        generate_audio_switch: false,
        generate_multi_clip_switch: false,
      });
    });

    it.each(["prompt", "aspect_ratio", "quality", "duration"])(
      "rejects a payload missing the required %s",
      (field) => {
        const input: Record<string, unknown> = { ...specRequest.input };
        delete input[field];
        expect(
          CreateTaskRequestSchema.safeParse({ ...specRequest, input }).success
        ).toBe(false);
      }
    );

    it.each(["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"])(
      "accepts aspect_ratio %s",
      (aspect_ratio) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            ...specRequest,
            input: { ...specRequest.input, aspect_ratio },
          }).success
        ).toBe(true);
      }
    );

    it.each(["4:5", "16:10"])("rejects aspect_ratio %s", (aspect_ratio) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          ...specRequest,
          input: { ...specRequest.input, aspect_ratio },
        }).success
      ).toBe(false);
    });

    it.each(["360p", "540p", "720p", "1080p"])(
      "accepts quality %s",
      (quality) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            ...specRequest,
            input: { ...specRequest.input, quality },
          }).success
        ).toBe(true);
      }
    );

    it.each(["480p", "2160p"])("rejects quality %s", (quality) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          ...specRequest,
          input: { ...specRequest.input, quality },
        }).success
      ).toBe(false);
    });

    it.each([1, 15])(
      "accepts duration at the inclusive boundary %s",
      (duration) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            ...specRequest,
            input: { ...specRequest.input, duration },
          }).success
        ).toBe(true);
      }
    );

    it.each([0, 16])("rejects duration %s", (duration) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          ...specRequest,
          input: { ...specRequest.input, duration },
        }).success
      ).toBe(false);
    });

    it.each([0, 2147483647])(
      "accepts seed at the inclusive boundary %s",
      (seed) => {
        expect(
          CreateTaskRequestSchema.safeParse({
            ...specRequest,
            input: { ...specRequest.input, seed },
          }).success
        ).toBe(true);
      }
    );

    it.each([-1, 2147483648])("rejects seed %s", (seed) => {
      expect(
        CreateTaskRequestSchema.safeParse({
          ...specRequest,
          input: { ...specRequest.input, seed },
        }).success
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Model-enum escape hatches (TRI-002…TRI-008)
// ---------------------------------------------------------------------------
//
// CLAUDE.md -> Code Conventions -> "Model-identifier enums stay open": a field
// naming an upstream *model registry* is `z.enum([...known]).or(<alias>)`,
// where the alias is a named `z.string().regex(...)` matching that vendor's
// real id grammar — never a bare `.or(z.string())`, which accepts typos. The
// known ids stay enumerated so MCP clients keep autocomplete.
//
// Each opened field is asserted along four axes: BR-1 every listed id still
// parses, BR-2 a plausible not-yet-listed id that matches the family grammar
// parses, BR-3/BR-4 near-miss typos and foreign-family ids are rejected, and
// BR-6 the enum branch survives conversion to MCP tool input JSON Schema.

interface ModelParseOutcome {
  success: boolean;
  flagsModel: boolean;
}

function modelOutcome(result: {
  success: boolean;
  error?: { issues: readonly { path: readonly PropertyKey[] }[] };
}): ModelParseOutcome {
  return {
    success: result.success,
    flagsModel: (result.error?.issues ?? []).some((issue) =>
      issue.path.includes("model")
    ),
  };
}

function modelBranches(schema: JsonSchema): JsonSchema[] {
  const properties = schema.properties as Record<string, JsonSchema>;
  return properties.model.anyOf as JsonSchema[];
}

const CLAUDE_MESSAGES = [{ role: "user", content: "Hello" }];

const OPENED_MODEL_FIELDS = [
  {
    triage: "TRI-002",
    label: "FluxKontextGenerateRequestSchema.model",
    listed: ["flux-kontext-pro", "flux-kontext-max"],
    // A future Flux Kontext tier: same family prefix, new variant segment.
    aliases: ["flux-kontext-ultra"],
    // BR-3 bare family name and casing typo; BR-4 a sibling Flux family and a
    // missing separator.
    rejected: [
      "flux-kontext",
      "flux-pro",
      "fluxkontext-pro",
      "FLUX-KONTEXT-PRO",
    ],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        FluxKontextGenerateRequestSchema.safeParse({
          prompt: "a paper boat crossing a quiet pond",
          model,
        })
      ),
    jsonSchema: (): JsonSchema =>
      zodToJsonSchema(FluxKontextGenerateRequestSchema),
  },
  {
    triage: "TRI-003",
    label: "KieResponsesRequestSchema.model",
    listed: ["gpt-5-5"],
    aliases: ["gpt-6", "gpt-5-5-mini"],
    // BR-3 bare family and spelled-out/truncated versions; BR-4 a Grok id on
    // the OpenAI-only field.
    rejected: ["gpt", "gpt-five", "gpt-", "grok-4-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieResponsesRequestSchema.safeParse({
          model,
          input: "summarize this thread",
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(KieResponsesRequestSchema),
  },
  {
    triage: "TRI-004",
    label: "KieGrokResponsesRequestSchema.model",
    listed: ["grok-4-5"],
    aliases: ["grok-5", "grok-4-5-fast"],
    // BR-4 `gpt-5-5` is the sibling endpoint's listed id and must not cross.
    rejected: ["grok", "grok-four", "gpt-5-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieGrokResponsesRequestSchema.safeParse({
          model,
          input: "summarize this thread",
        })
      ),
    jsonSchema: (): JsonSchema =>
      zodToJsonSchema(KieGrokResponsesRequestSchema),
  },
  {
    triage: "TRI-005",
    label: "VeoGenerateRequestSchema.model",
    listed: ["veo3", "veo3_fast"],
    aliases: ["veo4_fast"],
    // BR-3 kie's Veo grammar is underscored, so the hyphenated `veo3-fast` and
    // googleflow's dotted `veo-3.1-fast` are both typos here; BR-4 `gpt-4o`.
    rejected: ["veo3-fast", "veo-3.1-fast", "veo", "gpt-4o"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        VeoGenerateRequestSchema.safeParse({
          prompt: "a cat playing piano",
          model,
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(VeoGenerateRequestSchema),
  },
  {
    triage: "TRI-006",
    label: "SunoGenerateRequestSchema.model",
    listed: ["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"],
    aliases: ["V6", "V5_5PLUS"],
    // BR-3 wrong case and wrong separator on listed ids; BR-4 an ElevenLabs
    // style music id.
    rejected: ["v5", "V", "V4-5", "V4_5plus", "music_v1"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        SunoGenerateRequestSchema.safeParse({
          prompt: "a happy pop song about summer",
          model,
          instrumental: false,
          customMode: true,
          callBackUrl: "https://example.com/cb",
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(SunoGenerateRequestSchema),
  },
  {
    triage: "TRI-007",
    label: "KieClaudeRequestSchema.model",
    listed: ["claude-sonnet-4-6", "claude-haiku-4-5"],
    aliases: ["claude-opus-5-0"],
    // BR-3 versionless and familyless near-misses of a listed id; BR-4 a GPT
    // id on a Claude-only field.
    rejected: ["claude-sonnet", "claude-4-6", "claude", "gpt-5-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieClaudeRequestSchema.safeParse({
          model,
          messages: CLAUDE_MESSAGES,
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(KieClaudeRequestSchema),
  },
] as const;

describe.each(OPENED_MODEL_FIELDS)(
  "$triage $label",
  ({ listed, aliases, rejected, parse, jsonSchema }) => {
    it.each(listed)("accepts the listed model %s", (model) => {
      expect(parse(model).success).toBe(true);
    });

    it.each(aliases)("accepts the alias %s", (model) => {
      expect(parse(model).success).toBe(true);
    });

    it.each(rejected)("rejects the model %j", (model) => {
      const outcome = parse(model);
      expect(outcome.success).toBe(false);
      expect(outcome.flagsModel).toBe(true);
    });

    it("rejects a non-string model", () => {
      expect(parse(42).success).toBe(false);
    });

    // BR-6. Every listed id also matches the alias regex — checked here rather
    // than by eye — so the enum branch carries zero validation weight and
    // exists only for MCP client autocomplete. Nothing else pins it, so a
    // "dead code" cleanup could delete it while the suite stayed green. This
    // is that pin.
    it("keeps every listed id in the enum branch of the MCP JSON Schema", () => {
      const branches = modelBranches(jsonSchema());

      expect(branches).toHaveLength(2);
      expect(branches[0]).toMatchObject({
        type: "string",
        enum: [...listed],
      });

      const alias = new RegExp(String(branches[1].pattern));
      expect(branches[1].type).toBe("string");
      expect(listed.filter((id) => !alias.test(id))).toEqual([]);
    });
  }
);

// TRI-008. `fast | quality` is a rendering-tier vocabulary, not a model
// registry — the counterexample class CLAUDE.md names alongside `quality` and
// SimpleFunctionsModelSchema. BR-5: opening the sibling Veo generate field
// must not loosen this one, directly or through a shared alias.
describe("TRI-008 VeoExtendRequestSchema.model stays a closed set", () => {
  const extendBase = { taskId: "task-123", prompt: "extend the video" };

  it.each(["fast", "quality"])("accepts the listed tier %s", (model) => {
    const result = VeoExtendRequestSchema.safeParse({ ...extendBase, model });
    expect(result.success).toBe(true);
  });

  it.each(["veo3", "veo3_fast", "veo4_fast", "medium", "invalid"])(
    "still rejects %j",
    (model) => {
      const outcome = modelOutcome(
        VeoExtendRequestSchema.safeParse({ ...extendBase, model })
      );
      expect(outcome.success).toBe(false);
      expect(outcome.flagsModel).toBe(true);
    }
  );

  it("emits a bare enum, not an anyOf hatch, in the MCP JSON Schema", () => {
    const properties = zodToJsonSchema(VeoExtendRequestSchema)
      .properties as Record<string, JsonSchema>;

    expect(properties.model.anyOf).toBeUndefined();
    expect(properties.model).toMatchObject({
      type: "string",
      enum: ["fast", "quality"],
    });
  });
});

// ---------------------------------------------------------------------------
// TRI-001 KieMediaModelSchema — one escape hatch per vendor family
// ---------------------------------------------------------------------------
//
// KieMediaModelSchema is kie's aggregator catalogue: 48 ids drawn from a dozen
// unrelated vendors behind one `createTask` endpoint. REQ-006 forbids opening
// it with a single catch-all regex, so it carries one alias per vendor family
// and five singletons stay enumerated with no alias at all.
//
// BR-4 needs care here that the single-family schemas above do not. A foreign
// *catalogue* id — `happyhorse/video-edit` on the Kling family — is accepted by
// KieMediaModelSchema, through the enum branch, and always was: the whole point
// of the aggregator is that all 48 are valid. So cross-family leakage cannot be
// asserted with safeParse; it is asserted structurally instead, against the
// alias patterns themselves ("partitions the catalogue" below). The per-family
// `rejected` lists therefore carry BR-3 near-miss typos plus BR-4 ids from
// vendors kie fronts on *other* surfaces (`grok-4-5`, `gpt-5-5`) or under other
// providers' grammars (`wan2.7-i2v`, `qwen-image-2.0`, `eleven_flash_v3`),
// none of which is a member of this catalogue.

const MEDIA_MODEL_FAMILIES = [
  {
    family: "Kling",
    listed: [
      "kling-3.0/video",
      "kling-3.0/motion-control",
      "kling/v3-turbo-image-to-video",
      "kling/v3-turbo-text-to-video",
    ],
    aliases: ["kling-3.5/video", "kling/v4-turbo-text-to-video"],
    rejected: ["kling", "kling-3.0", "kling3.0/video", "Kling-3.0/video"],
  },
  {
    family: "Grok Imagine",
    listed: [
      "grok-imagine/text-to-image",
      "grok-imagine/image-to-image",
      "grok-imagine/text-to-video",
      "grok-imagine/image-to-video",
      "grok-imagine/extend",
      "grok-imagine/upscale",
      "grok-imagine-video-1-5-preview",
    ],
    aliases: ["grok-imagine/text-to-audio", "grok-imagine-video-2-0-preview"],
    // `grok-4-5` is kie's own Grok *responses* id — a different surface, and
    // not a media model.
    rejected: ["grok-imagine", "grokimagine/extend", "grok-4-5"],
  },
  {
    family: "Nano Banana",
    listed: ["nano-banana-pro", "nano-banana-2"],
    aliases: ["nano-banana-3", "nano-banana-pro-max"],
    rejected: ["nano-banana", "nanobanana-2", "nano_banana_2", "NANO-BANANA-2"],
  },
  {
    family: "GPT Image",
    listed: [
      "gpt-image/1.5-image-to-image",
      "gpt-image-2-image-to-image",
      "gpt-image-2-text-to-image",
    ],
    aliases: ["gpt-image-3-text-to-image", "gpt-image/2.5-image-to-image"],
    rejected: [
      "gpt-image",
      "gpt-image-2",
      "gptimage-2-text-to-image",
      "gpt-5-5",
    ],
  },
  {
    family: "Seedream",
    listed: [
      "seedream/5-lite-image-to-image",
      "seedream/5-lite-text-to-image",
      "seedream/5-pro-image-to-image",
      "seedream/5-pro-text-to-image",
    ],
    aliases: [
      "seedream/6-pro-text-to-image",
      "seedream/5.5-lite-text-to-image",
    ],
    rejected: [
      "seedream/5",
      "seedream",
      "seedream-5-pro-text-to-image",
      "seedream/pro-text-to-image",
    ],
  },
  {
    family: "Qwen",
    listed: ["qwen2/text-to-image", "qwen2/image-edit"],
    aliases: ["qwen3/text-to-image", "qwen2.5/image-edit"],
    // `qwen-image-2.0` / `qwen-image-edit` are Alibaba's first-party grammar
    // for a different product line, not kie media ids.
    rejected: [
      "qwen/text-to-image",
      "qwen2",
      "qwen-image-2.0",
      "qwen-image-edit",
    ],
  },
  {
    family: "Seedance",
    listed: [
      "bytedance/seedance-2-fast",
      "bytedance/seedance-2",
      "bytedance/seedance-2-mini",
    ],
    aliases: ["bytedance/seedance-3", "bytedance/seedance-2-pro"],
    rejected: [
      "bytedance/seedance",
      "seedance-2",
      "bytedance/seedream-5",
      "bytedance/seedance-2-",
    ],
  },
  {
    family: "Wan",
    listed: [
      "wan/2-7-image-to-video",
      "wan/2-7-text-to-video",
      "wan/2-7-r2v",
      "wan/2-7-videoedit",
      "wan/2-7-image",
      "wan/2-7-image-pro",
    ],
    aliases: ["wan/2-8-image-to-video", "wan/3-0-r2v"],
    // `wan2.7-i2v` is Alibaba's dotted, un-namespaced grammar for the same
    // upstream family — a foreign id on this field.
    rejected: ["wan/2-7", "wan", "wan/image-to-video", "wan2.7-i2v"],
  },
  {
    family: "HappyHorse",
    listed: [
      "happyhorse/text-to-video",
      "happyhorse/image-to-video",
      "happyhorse/reference-to-video",
      "happyhorse/video-edit",
      "happyhorse-1-1/text-to-video",
      "happyhorse-1-1/image-to-video",
      "happyhorse-1-1/reference-to-video",
    ],
    aliases: ["happyhorse-2-0/text-to-video", "happyhorse/audio-to-video"],
    rejected: [
      "happyhorse",
      "happyhorse-1-1",
      "happyhorse1-1/text-to-video",
      "happyhorse/Video-Edit",
    ],
  },
  {
    family: "ElevenLabs",
    listed: [
      "elevenlabs/audio-isolation",
      "elevenlabs/text-to-dialogue-v3",
      "elevenlabs/text-to-speech-multilingual-v2",
      "elevenlabs/text-to-speech-turbo-2-5",
      "elevenlabs/sound-effect-v2",
    ],
    aliases: ["elevenlabs/text-to-speech-flash-v3", "elevenlabs/music-v2"],
    // `eleven_flash_v3` is ElevenLabs' own underscored grammar, which the
    // @apicity/elevenlabs provider validates. It is not a kie media id.
    rejected: [
      "elevenlabs",
      "eleven_flash_v3",
      "ElevenLabs/audio-isolation",
      "elevenlabs/Sound-Effect-v2",
    ],
  },
] as const;

// The five ids that deliberately carry no alias: each is the only model kie
// lists for its vendor, and one sample cannot establish a family grammar.
const MEDIA_SINGLETON_MODELS = [
  "omnihuman-1-5",
  "volcengine/video-to-video-lip-sync",
  "gemini-omni-video",
  "sora-watermark-remover",
  "pixverse-v6/text-to-video",
] as const;

// `.or()` chaining nests left, so the emitted JSON Schema is a left-deep tree
// of two-branch `anyOf`s rather than one flat list. Flatten it to leaves.
function anyOfLeaves(schema: JsonSchema): JsonSchema[] {
  const branches = schema.anyOf as JsonSchema[] | undefined;
  return branches ? branches.flatMap(anyOfLeaves) : [schema];
}

const mediaLeaves = anyOfLeaves(zodToJsonSchema(KieMediaModelSchema));
const mediaEnumLeaves = mediaLeaves.filter((leaf) => Array.isArray(leaf.enum));
const mediaAliasPatterns = mediaLeaves
  .filter((leaf) => typeof leaf.pattern === "string")
  .map((leaf) => new RegExp(String(leaf.pattern)));

describe("TRI-001 KieMediaModelSchema", () => {
  // BR-6, and AC-05's no-id-removed-renamed-or-reordered check in executable
  // form: the enum branch must still be the catalogue, in order.
  it("keeps the whole catalogue in the enum branch of the MCP JSON Schema", () => {
    expect(mediaEnumLeaves).toHaveLength(1);
    expect(mediaEnumLeaves[0]).toMatchObject({
      type: "string",
      enum: [...KIE_MEDIA_MODELS],
    });
  });

  // AC-07: opened per vendor family, never by one catch-all regex.
  it("opens the catalogue with one alias per vendor family", () => {
    expect(mediaAliasPatterns).toHaveLength(MEDIA_MODEL_FAMILIES.length);
  });

  it.each(MEDIA_SINGLETON_MODELS)(
    "keeps the singleton %s reachable only through the enum",
    (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
      expect(mediaAliasPatterns.filter((re) => re.test(model))).toEqual([]);
    }
  );
});

describe.each(MEDIA_MODEL_FAMILIES)(
  "TRI-001 KieMediaModelSchema $family family",
  ({ listed, aliases, rejected }) => {
    it.each(listed)("accepts the listed model %s", (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
    });

    it.each(aliases)("accepts the alias %s", (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(true);
    });

    it.each(rejected)("rejects the model %j", (model) => {
      expect(KieMediaModelSchema.safeParse(model).success).toBe(false);
    });

    // The cross-family check safeParse cannot make: this family's alias owns
    // exactly its own ids. If any alias ever widened toward `.*` it would start
    // matching another vendor's ids here, long before it matched anything
    // outside the catalogue.
    it("partitions the catalogue — one alias owns exactly this family", () => {
      const family = listed as readonly string[];
      const owners = family.map((id) =>
        mediaAliasPatterns.findIndex((re) => re.test(id))
      );

      expect(owners).not.toContain(-1);
      expect(new Set(owners).size).toBe(1);
      for (const id of family) {
        expect(mediaAliasPatterns.filter((re) => re.test(id))).toHaveLength(1);
      }

      const owner = mediaAliasPatterns[owners[0]];
      const foreign = KIE_MEDIA_MODELS.filter((id) => !family.includes(id));
      expect(foreign.filter((id) => owner.test(id))).toEqual([]);
    });
  }
);

// The single biggest hazard in opening this schema is invisible to `tsc`:
// `KieMediaModel` keys `Record<KieMediaModel, ModelInputSchema>`, and inferring
// it off the now-open schema widens it to `string`, which stops that Record
// requiring an entry per model and stops it rejecting a typo'd key. zod.ts
// pins that at compile time (KieMediaModelStaysLiteral); this is the runtime
// half.
describe("TRI-001 KieMediaModel stays the literal catalogue", () => {
  it("has exactly one modelInputSchemas entry per listed model", () => {
    expect(Object.keys(modelInputSchemas).sort()).toEqual(
      [...KIE_MEDIA_MODELS].sort()
    );
  });

  it("yields undefined metadata for a hatched id rather than throwing", () => {
    const hatched = "kling-3.5/video";
    expect(KieMediaModelSchema.safeParse(hatched).success).toBe(true);
    // modelInputSchemas is provider *metadata* (kie.ts) — nothing dispatches on
    // it — so an id that arrives through the hatch is simply undocumented, not
    // a runtime failure.
    expect(
      (modelInputSchemas as Record<string, unknown>)[hatched]
    ).toBeUndefined();
  });

  // BR-5. Opening the envelope's `model` must not loosen the per-model input
  // contract: CreateTaskRequestSchema pipes the envelope into a union with one
  // member per *listed* model, so a hatched id still fails there. Same payload,
  // only the model differs, so the rejection is the model and nothing else.
  it("still rejects a hatched id at the createTask input contract", () => {
    const input = { duration: "5", mode: "std", multi_shots: false };

    expect(
      CreateTaskRequestSchema.safeParse({ model: "kling-3.0/video", input })
        .success
    ).toBe(true);
    expect(
      CreateTaskRequestSchema.safeParse({ model: "kling-3.5/video", input })
        .success
    ).toBe(false);
  });
});
