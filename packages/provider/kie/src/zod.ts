import { z } from "zod";
import type { PayGateConfig } from "./paygate";

// ---------------------------------------------------------------------------
// Enums / named union types
// ---------------------------------------------------------------------------

// kie's media catalogue is an *aggregator*: one `createTask` endpoint fronting
// ~50 ids drawn from a dozen unrelated vendors, each of which ships new ids on
// its own cadence. CLAUDE.md -> Code Conventions -> "Model-identifier enums
// stay open" therefore applies — but a single regex wide enough to span
// `kling-3.0/video`, `nano-banana-2`, `wan/2-7-r2v` and
// `elevenlabs/sound-effect-v2` at once degenerates toward `.*`, which is the
// precise failure that rule exists to prevent. So the hatch is one alias *per
// vendor family*, each anchored on that vendor's own prefix and unioned in
// separately below. `tests/unit/kie-zod.test.ts` pins the partition: every
// alias must match all of its own family's listed ids and none of the other
// catalogue entries.

// Kling ships two id shapes behind this endpoint: a versioned namespace
// (`kling-3.0/video`) and a bare namespace carrying the version inside the
// task segment (`kling/v3-turbo-text-to-video`). Both branches are written
// out. The `/` is load-bearing — `kling3.0/video` is a typo, not an
// unreleased model — and so is the lowercase-alphanumeric task grammar.
const KieMediaKlingModelAliasSchema = z
  .string()
  .regex(
    /^kling(?:-\d+(?:\.\d+)*)?\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a kie Kling alias (e.g. kling-3.5/video)"
  );

// Grok Imagine also ships two shapes: the slash-namespaced task form
// (`grok-imagine/upscale`) and a dashed product id
// (`grok-imagine-video-1-5-preview`). Both are spelled out. The `imagine`
// segment is what keeps this alias off kie's *other* Grok surface — the
// text-only `grok-4-5` of KieGrokResponsesRequestSchema is a different family
// and must not become a valid media model.
const KieMediaGrokImagineModelAliasSchema = z
  .string()
  .regex(
    /^grok-imagine(?:\/|-)[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a kie Grok Imagine alias (e.g. grok-imagine/text-to-audio)"
  );

// Nano Banana is a flat dashed family: the `nano-banana-` prefix plus one or
// more variant segments, which may be a tier (`pro`) or a version (`2`). The
// trailing segment is load-bearing: without it the bare family name
// `nano-banana` would parse, and the underscored `nano_banana_2` — a
// plausible transcription of the same product — is not an id kie accepts.
const KieMediaNanoBananaModelAliasSchema = z
  .string()
  .regex(
    /^nano-banana-[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a kie Nano Banana alias (e.g. nano-banana-3)"
  );

// kie's GPT Image ids are `gpt-image`, a `/` or `-` separator, a numeric
// version, then one or more task segments — both `gpt-image/1.5-image-to-image`
// and `gpt-image-2-text-to-image` ship today, so both separators are written
// out. The task suffix is required: `gpt-image-2` alone is the family, not a
// model, and the version anchor keeps kie's unrelated `gpt-5-5` responses id
// off this field.
const KieMediaGptImageModelAliasSchema = z
  .string()
  .regex(
    /^gpt-image(?:\/|-)\d+(?:\.\d+)*(?:-[a-z][a-z0-9]*)+$/,
    "Expected a listed model or a kie GPT Image alias (e.g. gpt-image-3-text-to-image)"
  );

// Seedream is namespaced, version-first, then tier and task segments:
// `seedream/<version>-<tier>-<task>`. Requiring the leading digit after the
// slash is what separates it from ByteDance's other line in this catalogue —
// `bytedance/seedance-2` is one character away and a different family.
const KieMediaSeedreamModelAliasSchema = z
  .string()
  .regex(
    /^seedream\/\d+(?:\.\d+)*(?:-[a-z][a-z0-9]*)+$/,
    "Expected a listed model or a kie Seedream alias (e.g. seedream/6-pro-text-to-image)"
  );

// kie's versioned Qwen media ids put the major version in the namespace itself
// (`qwen2/image-edit`), so the version is required before the `/`. That is a
// different grammar from Alibaba's first-party `qwen-image-2.0` /
// `qwen-image-edit` ids, which name a different product line and must not
// cross over. Unversioned `qwen/*` ids (text-to-image, image-edit,
// image-to-image) are deliberate enum-only catalogue entries — the alias is
// not widened to accept them (operator ruling ac-ly4x9j / ac-7hi3xx).
const KieMediaQwenModelAliasSchema = z
  .string()
  .regex(
    /^qwen\d+(?:\.\d+)*\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a kie Qwen alias (e.g. qwen3/image-edit)"
  );

// Seedance is versioned with optional size/speed variants under ByteDance's
// namespace: `bytedance/seedance-<version>[-<variant>]`. The alias is anchored
// on the `seedance` product, not on the bare `bytedance/` namespace: a
// wildcard product segment there would silently accept every future ByteDance
// line, which is the catch-all this file is avoiding.
const KieMediaSeedanceModelAliasSchema = z
  .string()
  .regex(
    /^bytedance\/seedance-\d+(?:\.\d+)*(?:-[a-z][a-z0-9]*)*$/,
    "Expected a listed model or a kie Seedance alias (e.g. bytedance/seedance-3)"
  );

// kie writes Wan versions with dashes inside a namespace
// (`wan/2-7-image-to-video`), where Alibaba's first-party ids for the same
// upstream model family use dots and no namespace (`wan2.7-i2v`). The `/` and
// the dashed version are therefore both load-bearing here, and this alias is
// deliberately not a reuse of alibaba's AlibabaWanModelAliasSchema.
const KieMediaWanModelAliasSchema = z
  .string()
  .regex(
    /^wan\/\d+(?:-\d+)*-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a kie Wan alias (e.g. wan/2-8-image-to-video)"
  );

// HappyHorse ships the same task set under a bare namespace and under a
// dash-versioned one (`happyhorse/text-to-video`,
// `happyhorse-1-1/text-to-video`), so the version group is optional and both
// branches are written out. A namespace on its own (`happyhorse-1-1`) is not
// a model id.
const KieMediaHappyHorseModelAliasSchema = z
  .string()
  .regex(
    /^happyhorse(?:-\d+(?:-\d+)*)?\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a kie HappyHorse alias (e.g. happyhorse-2-0/text-to-video)"
  );

// kie exposes ElevenLabs as a namespace of dash-joined task ids
// (`elevenlabs/text-to-speech-turbo-2-5`), with the model version trailing the
// task rather than leading it. That is a different grammar from ElevenLabs'
// own underscored `eleven_flash_v3` ids — which the @apicity/elevenlabs
// provider validates — so an ElevenLabs-native id is a foreign family here and
// stays rejected.
const KieMediaElevenLabsModelAliasSchema = z
  .string()
  .regex(
    /^elevenlabs\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a kie ElevenLabs alias (e.g. elevenlabs/text-to-speech-flash-v3)"
  );

// kie namespaces PixVerse by dashed product version, then the task slug:
// `pixverse-v6/text-to-video`. The `-v` prefix on the version is what
// separates a real id from the bare product name — `pixverse/…` and
// `pixverse6/…` are typos, not future releases — and the task segment is
// required because `pixverse-v6` alone names the family, not a model.
const KieMediaPixverseModelAliasSchema = z
  .string()
  .regex(
    /^pixverse-v\d+(?:\.\d+)*\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a kie PixVerse alias (e.g. pixverse-v7/text-to-video)"
  );

// The catalogue itself, in upstream's order — not regrouped by family, since
// reordering would read as renames in review and the alias comments above
// already state each family's membership.
//
// Singleton / fixed-product ids that stay enum-only with no alias hatch:
// `omnihuman-1-5` plus its two sub-tasks (`omnihuman-1-5/human-identification`,
// `omnihuman-1-5/subject-detection`), `volcengine/video-to-video-lip-sync`,
// `gemini-omni-video`, and `sora-watermark-remover`. Omnihuman's sub-tasks are
// path-suffixed siblings of a fixed product slug, not a versioned family
// grammar — nothing here distinguishes `omnihuman-<major>-<minor>` from a
// product name, so any regex would be a guess that either rejects the real
// next release or widens into the wildcard this file exists to avoid. They
// gain an alias only if kie ships a grammar that can be justified; until then
// each new id from those vendors is an explicit enum addition.
//
// MiniMax H3 also stays enum-only even though it has three task variants. The
// approved surface is exactly these H3 ids; the variants do not establish a
// version grammar or authorize arbitrary future task slugs.
//
// Google market ids (`google/gemini-*-tts`, `google/imagen4*`,
// `google/nano-banana*`) stay enum-only. The five imagen/nano-banana ids plus
// two TTS models do not establish a safe open `google/…` alias grammar — the
// product segments (imagen4, nano-banana, gemini-*-tts) are not a versioned
// family that would justify an open hatch.
// Topaz likewise stays enum-only: `topaz/image-upscale` and
// `topaz/video-upscale` are the only two ids kie documents for the vendor, and
// the task segment (`image-upscale` / `video-upscale`) is not a versioned
// grammar that would justify an open alias hatch.
// Unversioned Qwen v1 (`qwen/text-to-image`, `qwen/image-edit`,
// `qwen/image-to-image`) is also enum-only: the Qwen alias requires a digit
// before `/` for `qwen2/*` (and future versioned) ids, and was deliberately
// not widened (ac-ly4x9j).
//
// `infinitalk/from-audio` and `z-image` are single-sample vendors — each is the
// only id kie documents for its product — so both stay enum-only with no alias
// hatch until a second family member ships (zod.ts:155-166 convention).
//
// Ideogram likewise stays enum-only: the six documented task slugs
// (`character`, `character-edit`, `character-remix`, `v3-edit`, `v3-remix`,
// `v3-text-to-image`) are discrete product surfaces, not a versioned grammar
// that would justify an open `ideogram/…` alias hatch.
export const KIE_MEDIA_MODELS = [
  "kling-3.0/video",
  "kling-3.0/motion-control",
  "kling/v3-turbo-image-to-video",
  "kling/v3-turbo-text-to-video",
  // Documented Kling createTask models (alias-accepted; catalogue for guards
  // + modelInputSchemas). Docs under https://docs.kie.ai/market/kling/.
  "kling-2.6/image-to-video",
  "kling-2.6/motion-control",
  "kling-2.6/text-to-video",
  "kling/ai-avatar-pro",
  "kling/ai-avatar-standard",
  "kling/v2-1-master-image-to-video",
  "kling/v2-1-master-text-to-video",
  "kling/v2-1-pro",
  "kling/v2-1-standard",
  "kling/v2-5-turbo-image-to-video-pro",
  "kling/v2-5-turbo-text-to-video-pro",
  "grok-imagine/text-to-image",
  "grok-imagine/image-to-image",
  "grok-imagine/text-to-video",
  "grok-imagine/image-to-video",
  "grok-imagine-video-1-5-preview",
  "nano-banana-pro",
  "nano-banana-2",
  "nano-banana-2-lite",
  "gpt-image/1.5-image-to-image",
  "gpt-image/1.5-text-to-image",
  "gpt-image-2-image-to-image",
  "gpt-image-2-text-to-image",
  "seedream/5-lite-image-to-image",
  "seedream/5-lite-text-to-image",
  "seedream/5-pro-image-to-image",
  "seedream/5-pro-text-to-image",
  "grok-imagine/extend",
  "grok-imagine/upscale",
  "qwen2/text-to-image",
  "qwen2/image-edit",
  "qwen/text-to-image",
  "qwen/image-edit",
  "qwen/image-to-image",
  "bytedance/seedance-2-fast",
  "bytedance/seedance-2",
  "bytedance/seedance-2-mini",
  "bytedance/seedance-1.5-pro",
  // ByteDance non-Seedance createTask models — enum-only (Seedance alias is
  // product-anchored; seedream/v1-* ids do not match it).
  "bytedance/seedream",
  "bytedance/seedream-v4-edit",
  "bytedance/seedream-v4-text-to-image",
  "bytedance/v1-lite-image-to-video",
  "bytedance/v1-lite-text-to-video",
  "bytedance/v1-pro-fast-image-to-video",
  "bytedance/v1-pro-image-to-video",
  "bytedance/v1-pro-text-to-video",
  "wan/2-7-image-to-video",
  "wan/2-7-text-to-video",
  "wan/2-7-r2v",
  "wan/2-7-videoedit",
  "wan/2-7-image",
  "wan/2-7-image-pro",
  "happyhorse/text-to-video",
  "happyhorse/image-to-video",
  "happyhorse/reference-to-video",
  "happyhorse/video-edit",
  "happyhorse-1-1/text-to-video",
  "happyhorse-1-1/image-to-video",
  "happyhorse-1-1/reference-to-video",
  "omnihuman-1-5",
  // Omnihuman sub-tasks — enum-only siblings of the bare product id (no alias).
  "omnihuman-1-5/human-identification",
  "omnihuman-1-5/subject-detection",
  "volcengine/video-to-video-lip-sync",
  "gemini-omni-video",
  "elevenlabs/audio-isolation",
  "elevenlabs/text-to-dialogue-v3",
  "elevenlabs/text-to-speech-multilingual-v2",
  "elevenlabs/text-to-speech-turbo-2-5",
  "elevenlabs/sound-effect-v2",
  "sora-watermark-remover",
  // Recraft image utilities — singleton vendor ids (no alias hatch yet).
  "recraft/crisp-upscale",
  "recraft/remove-background",
  "pixverse-v6/text-to-video",
  "pixverse-v6/image-to-video",
  "pixverse-v6/transition",
  "pixverse-v6/extend",
  "pixverse-v6/reference-to-video",
  "minimax-h3/text-to-video",
  "minimax-h3/image-to-video",
  "minimax-h3/reference-to-video",
  "google/gemini-2-5-pro-tts",
  "google/gemini-3-1-flash-tts",
  // Google Imagen 4 + namespaced Nano Banana — enum-only (no google/ alias).
  "google/imagen4",
  "google/imagen4-fast",
  "google/imagen4-ultra",
  "google/nano-banana",
  "google/nano-banana-edit",
  "topaz/image-upscale",
  "topaz/video-upscale",
  // Singleton vendor ids (no alias hatch yet).
  "infinitalk/from-audio",
  "z-image",
  // Flux-2 image models — enum-only vendor (no alias hatch; task segment is
  // not a version grammar). Doc path uses `flux2`; model ids use `flux-2/…`.
  "flux-2/flex-image-to-image",
  "flux-2/flex-text-to-image",
  "flux-2/pro-image-to-image",
  "flux-2/pro-text-to-image",
  // Ideogram — enum-only vendor (no alias hatch).
  "ideogram/character",
  "ideogram/character-edit",
  "ideogram/character-remix",
  "ideogram/v3-edit",
  "ideogram/v3-remix",
  "ideogram/v3-text-to-image",
  // Hailuo video models — enum-only vendor (task + tier segments are not a
  // version grammar). Six documented market models; no alias hatch.
  "hailuo/02-image-to-video-pro",
  "hailuo/02-image-to-video-standard",
  "hailuo/02-text-to-video-pro",
  "hailuo/02-text-to-video-standard",
  "hailuo/2-3-image-to-video-pro",
  "hailuo/2-3-image-to-video-standard",
] as const;

export const KieMediaModelSchema = z
  .enum(KIE_MEDIA_MODELS)
  .or(KieMediaKlingModelAliasSchema)
  .or(KieMediaGrokImagineModelAliasSchema)
  .or(KieMediaNanoBananaModelAliasSchema)
  .or(KieMediaGptImageModelAliasSchema)
  .or(KieMediaSeedreamModelAliasSchema)
  .or(KieMediaQwenModelAliasSchema)
  .or(KieMediaSeedanceModelAliasSchema)
  .or(KieMediaWanModelAliasSchema)
  .or(KieMediaHappyHorseModelAliasSchema)
  .or(KieMediaElevenLabsModelAliasSchema)
  .or(KieMediaPixverseModelAliasSchema);

export const MediaTypeSchema = z.enum([
  "image",
  "video",
  "audio",
  "transcription",
]);

export const GeminiOmniAudioVoiceIds = [
  "achernar",
  "achird",
  "algenib",
  "algieba",
  "alnilam",
  "aoede",
  "autonoe",
  "callirrhoe",
  "charon",
  "despina",
  "enceladus",
  "erinome",
  "fenrir",
  "gacrux",
  "iapetus",
  "kore",
  "laomedeia",
  "leda",
  "orus",
  "puck",
  "pulcherrima",
  "rasalgethi",
  "sadachbia",
  "sadaltager",
  "schedar",
  "sulafat",
  "umbriel",
  "vindemiatrix",
  "zephyr",
  "zubenelgenubi",
] as const;

export const GeminiOmniAudioVoiceIdSchema = z.enum(GeminiOmniAudioVoiceIds);

// Google Gemini TTS market models use PascalCase voice display names (Zephyr,
// Fenrir, …), which is a different surface from the lowercase
// GeminiOmniAudioVoiceIds used by gemini-omni-audio create.
export const GoogleGeminiTtsVoiceNames = [
  "Achernar",
  "Achird",
  "Algenib",
  "Algieba",
  "Alnilam",
  "Aoede",
  "Autonoe",
  "Callirrhoe",
  "Charon",
  "Despina",
  "Enceladus",
  "Erinome",
  "Fenrir",
  "Gacrux",
  "Iapetus",
  "Kore",
  "Laomedeia",
  "Leda",
  "Orus",
  "Puck",
  "Pulcherrima",
  "Rasalgethi",
  "Sadachbia",
  "Sadaltager",
  "Schedar",
  "Sulafat",
  "Umbriel",
  "Vindemiatrix",
  "Zephyr",
  "Zubenelgenubi",
] as const;

export const GoogleGeminiTtsVoiceNameSchema = z.enum(GoogleGeminiTtsVoiceNames);

export const GoogleGeminiTtsAccentSchema = z.enum([
  "Neutral",
  "American (Gen)",
  "American (Valley)",
  "American (South)",
  "British (RP)",
  "British (Brixton)",
  "Transatlantic",
  "Australian",
]);

export const GoogleGeminiTtsStyleSchema = z.enum([
  "Vocal Smile",
  "Newscaster",
  "Whisper",
  "Empathetic",
  "Promo/Hype",
  "Deadpan",
]);

export const GoogleGeminiTtsPaceSchema = z.enum([
  "Natural",
  "Rapid Fire",
  "The Drift",
  "Staccato",
]);

// Upstream requires 「Speaker N」 (e.g. "Speaker 1"). Digits are unrestricted
// so multi-speaker casts beyond 9 remain valid. Implemented as refine (not
// .regex) so the pattern does not appear in JSON Schema as a numeric-string
// candidate for the numeric-input compatibility audit.
export const GoogleGeminiTtsSpeakerIdSchema = z
  .string()
  .refine((value) => /^Speaker \d+$/.test(value), {
    message: 'Expected a speaker id in "Speaker N" format (e.g. "Speaker 1")',
  });

export const GoogleGeminiTtsTemperatureContract = {
  minimum: 0,
  maximum: 2,
  default: 1,
} as const;

export const GoogleGeminiTtsDialogueTextMaxLength = 10000;

export const KieGeminiRoleSchema = z.enum(["user", "model"]);

export const KieGeminiThinkingLevelSchema = z.enum(["low", "high"]);

export const KieGeminiInlineDataSchema = z.object({
  mime_type: z.string().min(1),
  data: z.string().min(1),
});

export const KieGeminiFileDataSchema = z.object({
  mime_type: z.string().min(1),
  file_uri: z.string().min(1),
});

export const KieGeminiPartSchema = z
  .object({
    text: z.string().optional(),
    inline_data: KieGeminiInlineDataSchema.optional(),
    file_data: KieGeminiFileDataSchema.optional(),
  })
  .strict()
  .refine(
    (part) =>
      part.text !== undefined ||
      part.inline_data !== undefined ||
      part.file_data !== undefined,
    {
      message: "parts entries must include text, inline_data, or file_data",
    }
  );

export const KieGeminiContentSchema = z.object({
  role: KieGeminiRoleSchema,
  parts: z.array(KieGeminiPartSchema).min(1),
});

export const KieGeminiFunctionParametersSchema = z
  .object({
    type: z.string().optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

export const KieGeminiFunctionDeclarationSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parameters: KieGeminiFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGeminiGoogleSearchSchema = z.object({}).strict();

export const KieGeminiGoogleSearchToolSchema = z
  .object({
    googleSearch: KieGeminiGoogleSearchSchema,
  })
  .strict();

export const KieGeminiFunctionDeclarationsToolSchema = z
  .object({
    functionDeclarations: z.array(KieGeminiFunctionDeclarationSchema).min(1),
  })
  .strict();

export const KieGeminiToolSchema = z
  .object({
    googleSearch: KieGeminiGoogleSearchSchema.optional(),
    functionDeclarations: z
      .array(KieGeminiFunctionDeclarationSchema)
      .min(1)
      .optional(),
  })
  .strict()
  .refine(
    (tool) =>
      tool.googleSearch !== undefined ||
      tool.functionDeclarations !== undefined,
    {
      message:
        "tools entries must include googleSearch or functionDeclarations",
    }
  );

export const KieGeminiThinkingConfigSchema = z
  .object({
    includeThoughts: z.boolean().optional(),
    thinkingLevel: KieGeminiThinkingLevelSchema.optional(),
  })
  .strict();

export const KieGeminiGenerationConfigSchema = z
  .object({
    temperature: z.number().optional(),
    topP: z.number().optional(),
    topK: z.number().optional(),
    candidateCount: z.number().int().positive().optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    stopSequences: z.array(z.string()).optional(),
    thinkingConfig: KieGeminiThinkingConfigSchema.optional(),
  })
  .passthrough();

export const KieGemini35FlashStreamGenerateContentRequestSchema = z
  .object({
    stream: z.boolean().default(true),
    contents: z.array(KieGeminiContentSchema).min(1),
    tools: z.array(KieGeminiToolSchema).optional(),
    generationConfig: KieGeminiGenerationConfigSchema.optional(),
  })
  .passthrough();

// Docs: https://docs.kie.ai/market/gemini/gemini-3-6-flash
export const KieGemini36FlashStreamGenerateContentRequestSchema = z
  .object({
    stream: z.boolean().default(true),
    contents: z.array(KieGeminiContentSchema).min(1),
    tools: z.array(KieGeminiToolSchema).optional(),
    generationConfig: KieGeminiGenerationConfigSchema.optional(),
  })
  .passthrough();

export const KieGemini31ProMessageRoleSchema = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
]);

export const KieGemini31ProContentItemTypeSchema = z.enum([
  "text",
  "image_url",
]);

export const KieGemini31ProReasoningEffortSchema = z.enum(["low", "high"]);

export const KieGemini31ProToolTypeSchema = z.enum(["function"]);

export const KieGemini31ProToolFunctionNameSchema = z.enum(["googleSearch"]);

export const KieGemini31ProTextContentItemSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .strict();

export const KieGemini31ProMediaContentItemSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).strict(),
  })
  .strict();

export const KieGemini31ProContentItemSchema = z.discriminatedUnion("type", [
  KieGemini31ProTextContentItemSchema,
  KieGemini31ProMediaContentItemSchema,
]);

export const KieGemini31ProMessageSchema = z
  .object({
    role: KieGemini31ProMessageRoleSchema,
    content: z.array(KieGemini31ProContentItemSchema).min(1),
  })
  .passthrough();

export const KieGemini31ProToolFunctionParametersSchema = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

export const KieGemini31ProToolFunctionSchema = z
  .object({
    name: KieGemini31ProToolFunctionNameSchema,
    description: z.string().optional(),
    parameters: KieGemini31ProToolFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGemini31ProToolSchema = z
  .object({
    type: KieGemini31ProToolTypeSchema,
    function: KieGemini31ProToolFunctionSchema,
  })
  .strict();

export const KieGemini31ProChatCompletionsRequestSchema = z
  .object({
    model: z.literal("gemini-3.1-pro").optional(),
    messages: z.array(KieGemini31ProMessageSchema).min(1),
    stream: z.boolean().default(true),
    tools: z.array(KieGemini31ProToolSchema).min(0).optional(),
    include_thoughts: z.boolean().default(true),
    reasoning_effort: KieGemini31ProReasoningEffortSchema.default("high"),
  })
  .passthrough();

export type KieGemini31ProMessageRole = z.infer<
  typeof KieGemini31ProMessageRoleSchema
>;
export type KieGemini31ProContentItemType = z.infer<
  typeof KieGemini31ProContentItemTypeSchema
>;
export type KieGemini31ProReasoningEffort = z.infer<
  typeof KieGemini31ProReasoningEffortSchema
>;
export type KieGemini31ProToolType = z.infer<
  typeof KieGemini31ProToolTypeSchema
>;
export type KieGemini31ProToolFunctionName = z.infer<
  typeof KieGemini31ProToolFunctionNameSchema
>;
export type KieGemini31ProTextContentItem = z.infer<
  typeof KieGemini31ProTextContentItemSchema
>;
export type KieGemini31ProMediaContentItem = z.infer<
  typeof KieGemini31ProMediaContentItemSchema
>;
export type KieGemini31ProContentItem = z.infer<
  typeof KieGemini31ProContentItemSchema
>;
export type KieGemini31ProMessage = z.infer<typeof KieGemini31ProMessageSchema>;
export type KieGemini31ProToolFunctionParameters = z.infer<
  typeof KieGemini31ProToolFunctionParametersSchema
>;
export type KieGemini31ProToolFunction = z.infer<
  typeof KieGemini31ProToolFunctionSchema
>;
export type KieGemini31ProTool = z.infer<typeof KieGemini31ProToolSchema>;
export type KieGemini31ProChatCompletionsRequest = z.input<
  typeof KieGemini31ProChatCompletionsRequestSchema
>;
export type KieGemini31ProChatCompletionsRequestInput =
  KieGemini31ProChatCompletionsRequest;
export type KieGemini31ProChatCompletionsParsedRequest = z.output<
  typeof KieGemini31ProChatCompletionsRequestSchema
>;

// Gemini 2.5 Flash OpenAI-compatible chat completions
// Docs: https://docs.kie.ai/market/gemini/gemini-2-5-flash
export const KieGemini25FlashMessageRoleSchema = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
]);

export const KieGemini25FlashContentItemTypeSchema = z.enum([
  "text",
  "image_url",
]);

export const KieGemini25FlashToolTypeSchema = z.enum(["function"]);

export const KieGemini25FlashTextContentItemSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .strict();

export const KieGemini25FlashMediaContentItemSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).strict(),
  })
  .strict();

export const KieGemini25FlashContentItemSchema = z.discriminatedUnion("type", [
  KieGemini25FlashTextContentItemSchema,
  KieGemini25FlashMediaContentItemSchema,
]);

export const KieGemini25FlashMessageSchema = z
  .object({
    role: KieGemini25FlashMessageRoleSchema,
    content: z.array(KieGemini25FlashContentItemSchema).min(1),
  })
  .passthrough();

export const KieGemini25FlashToolFunctionParametersSchema = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

// googleSearch or custom function declarations (mutually exclusive upstream).
export const KieGemini25FlashToolFunctionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parameters: KieGemini25FlashToolFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGemini25FlashToolSchema = z
  .object({
    type: KieGemini25FlashToolTypeSchema,
    function: KieGemini25FlashToolFunctionSchema,
  })
  .strict();

export const KieGemini25FlashResponseFormatSchema = z
  .object({
    type: z.string().optional(),
    json_schema: z.record(z.string(), z.unknown()).optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const KieGemini25FlashChatCompletionsRequestSchema = z
  .object({
    model: z.literal("gemini-2.5-flash").optional(),
    messages: z.array(KieGemini25FlashMessageSchema).min(1),
    stream: z.boolean().default(true),
    tools: z.array(KieGemini25FlashToolSchema).min(0).optional(),
    include_thoughts: z.boolean().default(true),
    response_format: KieGemini25FlashResponseFormatSchema.optional(),
  })
  .passthrough();

export type KieGemini25FlashMessageRole = z.infer<
  typeof KieGemini25FlashMessageRoleSchema
>;
export type KieGemini25FlashContentItemType = z.infer<
  typeof KieGemini25FlashContentItemTypeSchema
>;
export type KieGemini25FlashToolType = z.infer<
  typeof KieGemini25FlashToolTypeSchema
>;
export type KieGemini25FlashTextContentItem = z.infer<
  typeof KieGemini25FlashTextContentItemSchema
>;
export type KieGemini25FlashMediaContentItem = z.infer<
  typeof KieGemini25FlashMediaContentItemSchema
>;
export type KieGemini25FlashContentItem = z.infer<
  typeof KieGemini25FlashContentItemSchema
>;
export type KieGemini25FlashMessage = z.infer<
  typeof KieGemini25FlashMessageSchema
>;
export type KieGemini25FlashToolFunctionParameters = z.infer<
  typeof KieGemini25FlashToolFunctionParametersSchema
>;
export type KieGemini25FlashToolFunction = z.infer<
  typeof KieGemini25FlashToolFunctionSchema
>;
export type KieGemini25FlashTool = z.infer<typeof KieGemini25FlashToolSchema>;
export type KieGemini25FlashResponseFormat = z.infer<
  typeof KieGemini25FlashResponseFormatSchema
>;
export type KieGemini25FlashChatCompletionsRequest = z.input<
  typeof KieGemini25FlashChatCompletionsRequestSchema
>;
export type KieGemini25FlashChatCompletionsRequestInput =
  KieGemini25FlashChatCompletionsRequest;
export type KieGemini25FlashChatCompletionsParsedRequest = z.output<
  typeof KieGemini25FlashChatCompletionsRequestSchema
>;

// Gemini 3 Flash OpenAI-compatible chat completions
// Docs: https://docs.kie.ai/market/gemini/gemini-3-flash
export const KieGemini3FlashMessageRoleSchema = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
]);

export const KieGemini3FlashContentItemTypeSchema = z.enum([
  "text",
  "image_url",
]);

export const KieGemini3FlashReasoningEffortSchema = z.enum(["low", "high"]);

export const KieGemini3FlashToolTypeSchema = z.enum(["function"]);

export const KieGemini3FlashTextContentItemSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .strict();

export const KieGemini3FlashMediaContentItemSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).strict(),
  })
  .strict();

export const KieGemini3FlashContentItemSchema = z.discriminatedUnion("type", [
  KieGemini3FlashTextContentItemSchema,
  KieGemini3FlashMediaContentItemSchema,
]);

export const KieGemini3FlashMessageSchema = z
  .object({
    role: KieGemini3FlashMessageRoleSchema,
    content: z.array(KieGemini3FlashContentItemSchema).min(1),
  })
  .passthrough();

export const KieGemini3FlashToolFunctionParametersSchema = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

// googleSearch or custom function declarations (mutually exclusive upstream).
export const KieGemini3FlashToolFunctionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parameters: KieGemini3FlashToolFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGemini3FlashToolSchema = z
  .object({
    type: KieGemini3FlashToolTypeSchema,
    function: KieGemini3FlashToolFunctionSchema,
  })
  .strict();

export const KieGemini3FlashResponseFormatSchema = z
  .object({
    type: z.string().optional(),
    json_schema: z.record(z.string(), z.unknown()).optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const KieGemini3FlashChatCompletionsRequestSchema = z
  .object({
    model: z.literal("gemini-3-flash").optional(),
    messages: z.array(KieGemini3FlashMessageSchema).min(1),
    stream: z.boolean().default(true),
    tools: z.array(KieGemini3FlashToolSchema).min(0).optional(),
    include_thoughts: z.boolean().default(true),
    reasoning_effort: KieGemini3FlashReasoningEffortSchema.default("high"),
    response_format: KieGemini3FlashResponseFormatSchema.optional(),
  })
  .passthrough();

export type KieGemini3FlashMessageRole = z.infer<
  typeof KieGemini3FlashMessageRoleSchema
>;
export type KieGemini3FlashContentItemType = z.infer<
  typeof KieGemini3FlashContentItemTypeSchema
>;
export type KieGemini3FlashReasoningEffort = z.infer<
  typeof KieGemini3FlashReasoningEffortSchema
>;
export type KieGemini3FlashToolType = z.infer<
  typeof KieGemini3FlashToolTypeSchema
>;
export type KieGemini3FlashTextContentItem = z.infer<
  typeof KieGemini3FlashTextContentItemSchema
>;
export type KieGemini3FlashMediaContentItem = z.infer<
  typeof KieGemini3FlashMediaContentItemSchema
>;
export type KieGemini3FlashContentItem = z.infer<
  typeof KieGemini3FlashContentItemSchema
>;
export type KieGemini3FlashMessage = z.infer<
  typeof KieGemini3FlashMessageSchema
>;
export type KieGemini3FlashToolFunctionParameters = z.infer<
  typeof KieGemini3FlashToolFunctionParametersSchema
>;
export type KieGemini3FlashToolFunction = z.infer<
  typeof KieGemini3FlashToolFunctionSchema
>;
export type KieGemini3FlashTool = z.infer<typeof KieGemini3FlashToolSchema>;
export type KieGemini3FlashResponseFormat = z.infer<
  typeof KieGemini3FlashResponseFormatSchema
>;
export type KieGemini3FlashChatCompletionsRequest = z.input<
  typeof KieGemini3FlashChatCompletionsRequestSchema
>;
export type KieGemini3FlashChatCompletionsRequestInput =
  KieGemini3FlashChatCompletionsRequest;
export type KieGemini3FlashChatCompletionsParsedRequest = z.output<
  typeof KieGemini3FlashChatCompletionsRequestSchema
>;

// Gemini 3.5 Flash OpenAI-compatible chat completions
// Docs: https://docs.kie.ai/market/gemini/gemini-3-5-flash-openai
export const KieGemini35FlashOpenaiMessageRoleSchema = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
]);

export const KieGemini35FlashOpenaiContentItemTypeSchema = z.enum([
  "text",
  "image_url",
]);

export const KieGemini35FlashOpenaiReasoningEffortSchema = z.enum([
  "low",
  "high",
]);

export const KieGemini35FlashOpenaiToolTypeSchema = z.enum(["function"]);

export const KieGemini35FlashOpenaiTextContentItemSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .strict();

export const KieGemini35FlashOpenaiMediaContentItemSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).strict(),
  })
  .strict();

export const KieGemini35FlashOpenaiContentItemSchema = z.discriminatedUnion(
  "type",
  [
    KieGemini35FlashOpenaiTextContentItemSchema,
    KieGemini35FlashOpenaiMediaContentItemSchema,
  ]
);

export const KieGemini35FlashOpenaiMessageSchema = z
  .object({
    role: KieGemini35FlashOpenaiMessageRoleSchema,
    content: z.array(KieGemini35FlashOpenaiContentItemSchema).min(1),
  })
  .passthrough();

export const KieGemini35FlashOpenaiToolFunctionParametersSchema = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

// googleSearch or custom function declarations (mutually exclusive upstream).
export const KieGemini35FlashOpenaiToolFunctionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parameters: KieGemini35FlashOpenaiToolFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGemini35FlashOpenaiToolSchema = z
  .object({
    type: KieGemini35FlashOpenaiToolTypeSchema,
    function: KieGemini35FlashOpenaiToolFunctionSchema,
  })
  .strict();

export const KieGemini35FlashOpenaiResponseFormatSchema = z
  .object({
    type: z.string().optional(),
    json_schema: z.record(z.string(), z.unknown()).optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const KieGemini35FlashOpenaiChatCompletionsRequestSchema = z
  .object({
    model: z.literal("gemini-3-5-flash-thinking").optional(),
    messages: z.array(KieGemini35FlashOpenaiMessageSchema).min(1),
    stream: z.boolean().default(true),
    tools: z.array(KieGemini35FlashOpenaiToolSchema).min(0).optional(),
    include_thoughts: z.boolean().default(true),
    reasoning_effort:
      KieGemini35FlashOpenaiReasoningEffortSchema.default("high"),
    response_format: KieGemini35FlashOpenaiResponseFormatSchema.optional(),
  })
  .passthrough();

export type KieGemini35FlashOpenaiMessageRole = z.infer<
  typeof KieGemini35FlashOpenaiMessageRoleSchema
>;
export type KieGemini35FlashOpenaiContentItemType = z.infer<
  typeof KieGemini35FlashOpenaiContentItemTypeSchema
>;
export type KieGemini35FlashOpenaiReasoningEffort = z.infer<
  typeof KieGemini35FlashOpenaiReasoningEffortSchema
>;
export type KieGemini35FlashOpenaiToolType = z.infer<
  typeof KieGemini35FlashOpenaiToolTypeSchema
>;
export type KieGemini35FlashOpenaiTextContentItem = z.infer<
  typeof KieGemini35FlashOpenaiTextContentItemSchema
>;
export type KieGemini35FlashOpenaiMediaContentItem = z.infer<
  typeof KieGemini35FlashOpenaiMediaContentItemSchema
>;
export type KieGemini35FlashOpenaiContentItem = z.infer<
  typeof KieGemini35FlashOpenaiContentItemSchema
>;
export type KieGemini35FlashOpenaiMessage = z.infer<
  typeof KieGemini35FlashOpenaiMessageSchema
>;
export type KieGemini35FlashOpenaiToolFunctionParameters = z.infer<
  typeof KieGemini35FlashOpenaiToolFunctionParametersSchema
>;
export type KieGemini35FlashOpenaiToolFunction = z.infer<
  typeof KieGemini35FlashOpenaiToolFunctionSchema
>;
export type KieGemini35FlashOpenaiTool = z.infer<
  typeof KieGemini35FlashOpenaiToolSchema
>;
export type KieGemini35FlashOpenaiResponseFormat = z.infer<
  typeof KieGemini35FlashOpenaiResponseFormatSchema
>;
export type KieGemini35FlashOpenaiChatCompletionsRequest = z.input<
  typeof KieGemini35FlashOpenaiChatCompletionsRequestSchema
>;
export type KieGemini35FlashOpenaiChatCompletionsRequestInput =
  KieGemini35FlashOpenaiChatCompletionsRequest;
export type KieGemini35FlashOpenaiChatCompletionsParsedRequest = z.output<
  typeof KieGemini35FlashOpenaiChatCompletionsRequestSchema
>;

// Gemini 3.6 Flash OpenAI-compatible chat completions
// Docs: https://docs.kie.ai/market/gemini/gemini-3-6-flash-openai
export const KieGemini36FlashOpenaiMessageRoleSchema = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
]);

export const KieGemini36FlashOpenaiContentItemTypeSchema = z.enum([
  "text",
  "image_url",
]);

export const KieGemini36FlashOpenaiReasoningEffortSchema = z.enum([
  "low",
  "high",
]);

export const KieGemini36FlashOpenaiToolTypeSchema = z.enum(["function"]);

export const KieGemini36FlashOpenaiTextContentItemSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .strict();

export const KieGemini36FlashOpenaiMediaContentItemSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).strict(),
  })
  .strict();

export const KieGemini36FlashOpenaiContentItemSchema = z.discriminatedUnion(
  "type",
  [
    KieGemini36FlashOpenaiTextContentItemSchema,
    KieGemini36FlashOpenaiMediaContentItemSchema,
  ]
);

export const KieGemini36FlashOpenaiMessageSchema = z
  .object({
    role: KieGemini36FlashOpenaiMessageRoleSchema,
    content: z.array(KieGemini36FlashOpenaiContentItemSchema).min(1),
  })
  .passthrough();

export const KieGemini36FlashOpenaiToolFunctionParametersSchema = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

// googleSearch or custom function declarations (mutually exclusive upstream).
export const KieGemini36FlashOpenaiToolFunctionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parameters: KieGemini36FlashOpenaiToolFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGemini36FlashOpenaiToolSchema = z
  .object({
    type: KieGemini36FlashOpenaiToolTypeSchema,
    function: KieGemini36FlashOpenaiToolFunctionSchema,
  })
  .strict();

export const KieGemini36FlashOpenaiResponseFormatSchema = z
  .object({
    type: z.string().optional(),
    json_schema: z.record(z.string(), z.unknown()).optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const KieGemini36FlashOpenaiChatCompletionsRequestSchema = z
  .object({
    model: z.literal("gemini-3-6-flash").optional(),
    messages: z.array(KieGemini36FlashOpenaiMessageSchema).min(1),
    stream: z.boolean().default(true),
    tools: z.array(KieGemini36FlashOpenaiToolSchema).min(0).optional(),
    include_thoughts: z.boolean().default(true),
    reasoning_effort:
      KieGemini36FlashOpenaiReasoningEffortSchema.default("high"),
    response_format: KieGemini36FlashOpenaiResponseFormatSchema.optional(),
  })
  .passthrough();

export type KieGemini36FlashOpenaiMessageRole = z.infer<
  typeof KieGemini36FlashOpenaiMessageRoleSchema
>;
export type KieGemini36FlashOpenaiContentItemType = z.infer<
  typeof KieGemini36FlashOpenaiContentItemTypeSchema
>;
export type KieGemini36FlashOpenaiReasoningEffort = z.infer<
  typeof KieGemini36FlashOpenaiReasoningEffortSchema
>;
export type KieGemini36FlashOpenaiToolType = z.infer<
  typeof KieGemini36FlashOpenaiToolTypeSchema
>;
export type KieGemini36FlashOpenaiTextContentItem = z.infer<
  typeof KieGemini36FlashOpenaiTextContentItemSchema
>;
export type KieGemini36FlashOpenaiMediaContentItem = z.infer<
  typeof KieGemini36FlashOpenaiMediaContentItemSchema
>;
export type KieGemini36FlashOpenaiContentItem = z.infer<
  typeof KieGemini36FlashOpenaiContentItemSchema
>;
export type KieGemini36FlashOpenaiMessage = z.infer<
  typeof KieGemini36FlashOpenaiMessageSchema
>;
export type KieGemini36FlashOpenaiToolFunctionParameters = z.infer<
  typeof KieGemini36FlashOpenaiToolFunctionParametersSchema
>;
export type KieGemini36FlashOpenaiToolFunction = z.infer<
  typeof KieGemini36FlashOpenaiToolFunctionSchema
>;
export type KieGemini36FlashOpenaiTool = z.infer<
  typeof KieGemini36FlashOpenaiToolSchema
>;
export type KieGemini36FlashOpenaiResponseFormat = z.infer<
  typeof KieGemini36FlashOpenaiResponseFormatSchema
>;
export type KieGemini36FlashOpenaiChatCompletionsRequest = z.input<
  typeof KieGemini36FlashOpenaiChatCompletionsRequestSchema
>;
export type KieGemini36FlashOpenaiChatCompletionsRequestInput =
  KieGemini36FlashOpenaiChatCompletionsRequest;
export type KieGemini36FlashOpenaiChatCompletionsParsedRequest = z.output<
  typeof KieGemini36FlashOpenaiChatCompletionsRequestSchema
>;

// Gemini 3 Pro OpenAI-compatible chat completions
// Docs: https://docs.kie.ai/market/gemini/gemini-3-pro
export const KieGemini3ProMessageRoleSchema = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
]);

export const KieGemini3ProContentItemTypeSchema = z.enum(["text", "image_url"]);

export const KieGemini3ProReasoningEffortSchema = z.enum(["low", "high"]);

export const KieGemini3ProToolTypeSchema = z.enum(["function"]);

export const KieGemini3ProTextContentItemSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .strict();

export const KieGemini3ProMediaContentItemSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).strict(),
  })
  .strict();

export const KieGemini3ProContentItemSchema = z.discriminatedUnion("type", [
  KieGemini3ProTextContentItemSchema,
  KieGemini3ProMediaContentItemSchema,
]);

export const KieGemini3ProMessageSchema = z
  .object({
    role: KieGemini3ProMessageRoleSchema,
    content: z.array(KieGemini3ProContentItemSchema).min(1),
  })
  .passthrough();

export const KieGemini3ProToolFunctionParametersSchema = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

// googleSearch or custom function declarations (mutually exclusive upstream).
export const KieGemini3ProToolFunctionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parameters: KieGemini3ProToolFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGemini3ProToolSchema = z
  .object({
    type: KieGemini3ProToolTypeSchema,
    function: KieGemini3ProToolFunctionSchema,
  })
  .strict();

export const KieGemini3ProResponseFormatSchema = z
  .object({
    type: z.string().optional(),
    json_schema: z.record(z.string(), z.unknown()).optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const KieGemini3ProChatCompletionsRequestSchema = z
  .object({
    model: z.literal("gemini-3-pro").optional(),
    messages: z.array(KieGemini3ProMessageSchema).min(1),
    stream: z.boolean().default(true),
    tools: z.array(KieGemini3ProToolSchema).min(0).optional(),
    include_thoughts: z.boolean().default(true),
    reasoning_effort: KieGemini3ProReasoningEffortSchema.default("high"),
    response_format: KieGemini3ProResponseFormatSchema.optional(),
  })
  .passthrough();

export type KieGemini3ProMessageRole = z.infer<
  typeof KieGemini3ProMessageRoleSchema
>;
export type KieGemini3ProContentItemType = z.infer<
  typeof KieGemini3ProContentItemTypeSchema
>;
export type KieGemini3ProReasoningEffort = z.infer<
  typeof KieGemini3ProReasoningEffortSchema
>;
export type KieGemini3ProToolType = z.infer<typeof KieGemini3ProToolTypeSchema>;
export type KieGemini3ProTextContentItem = z.infer<
  typeof KieGemini3ProTextContentItemSchema
>;
export type KieGemini3ProMediaContentItem = z.infer<
  typeof KieGemini3ProMediaContentItemSchema
>;
export type KieGemini3ProContentItem = z.infer<
  typeof KieGemini3ProContentItemSchema
>;
export type KieGemini3ProMessage = z.infer<typeof KieGemini3ProMessageSchema>;
export type KieGemini3ProToolFunctionParameters = z.infer<
  typeof KieGemini3ProToolFunctionParametersSchema
>;
export type KieGemini3ProToolFunction = z.infer<
  typeof KieGemini3ProToolFunctionSchema
>;
export type KieGemini3ProTool = z.infer<typeof KieGemini3ProToolSchema>;
export type KieGemini3ProResponseFormat = z.infer<
  typeof KieGemini3ProResponseFormatSchema
>;
export type KieGemini3ProChatCompletionsRequest = z.input<
  typeof KieGemini3ProChatCompletionsRequestSchema
>;
export type KieGemini3ProChatCompletionsRequestInput =
  KieGemini3ProChatCompletionsRequest;
export type KieGemini3ProChatCompletionsParsedRequest = z.output<
  typeof KieGemini3ProChatCompletionsRequestSchema
>;

// Gemini 2.5 Pro OpenAI-compatible chat completions
// Docs: https://docs.kie.ai/market/gemini/gemini-2-5-pro
export const KieGemini25ProMessageRoleSchema = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
]);

export const KieGemini25ProContentItemTypeSchema = z.enum([
  "text",
  "image_url",
]);

export const KieGemini25ProToolTypeSchema = z.enum(["function"]);

export const KieGemini25ProReasoningEffortSchema = z.enum(["low", "high"]);

export const KieGemini25ProTextContentItemSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .strict();

export const KieGemini25ProMediaContentItemSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).strict(),
  })
  .strict();

export const KieGemini25ProContentItemSchema = z.discriminatedUnion("type", [
  KieGemini25ProTextContentItemSchema,
  KieGemini25ProMediaContentItemSchema,
]);

export const KieGemini25ProMessageSchema = z
  .object({
    role: KieGemini25ProMessageRoleSchema,
    content: z.array(KieGemini25ProContentItemSchema).min(1),
  })
  .passthrough();

export const KieGemini25ProToolFunctionParametersSchema = z
  .object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough();

// googleSearch or custom function declarations (mutually exclusive upstream).
export const KieGemini25ProToolFunctionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    parameters: KieGemini25ProToolFunctionParametersSchema.optional(),
  })
  .passthrough();

export const KieGemini25ProToolSchema = z
  .object({
    type: KieGemini25ProToolTypeSchema,
    function: KieGemini25ProToolFunctionSchema,
  })
  .strict();

export const KieGemini25ProResponseFormatSchema = z
  .object({
    type: z.string().optional(),
    json_schema: z.record(z.string(), z.unknown()).optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const KieGemini25ProChatCompletionsRequestSchema = z
  .object({
    model: z.literal("gemini-2.5-pro").optional(),
    messages: z.array(KieGemini25ProMessageSchema).min(1),
    stream: z.boolean().default(true),
    tools: z.array(KieGemini25ProToolSchema).min(0).optional(),
    include_thoughts: z.boolean().default(true),
    reasoning_effort: KieGemini25ProReasoningEffortSchema.default("high"),
    response_format: KieGemini25ProResponseFormatSchema.optional(),
  })
  .passthrough();

export type KieGemini25ProMessageRole = z.infer<
  typeof KieGemini25ProMessageRoleSchema
>;
export type KieGemini25ProContentItemType = z.infer<
  typeof KieGemini25ProContentItemTypeSchema
>;
export type KieGemini25ProToolType = z.infer<
  typeof KieGemini25ProToolTypeSchema
>;
export type KieGemini25ProReasoningEffort = z.infer<
  typeof KieGemini25ProReasoningEffortSchema
>;
export type KieGemini25ProTextContentItem = z.infer<
  typeof KieGemini25ProTextContentItemSchema
>;
export type KieGemini25ProMediaContentItem = z.infer<
  typeof KieGemini25ProMediaContentItemSchema
>;
export type KieGemini25ProContentItem = z.infer<
  typeof KieGemini25ProContentItemSchema
>;
export type KieGemini25ProMessage = z.infer<typeof KieGemini25ProMessageSchema>;
export type KieGemini25ProToolFunctionParameters = z.infer<
  typeof KieGemini25ProToolFunctionParametersSchema
>;
export type KieGemini25ProToolFunction = z.infer<
  typeof KieGemini25ProToolFunctionSchema
>;
export type KieGemini25ProTool = z.infer<typeof KieGemini25ProToolSchema>;
export type KieGemini25ProResponseFormat = z.infer<
  typeof KieGemini25ProResponseFormatSchema
>;
export type KieGemini25ProChatCompletionsRequest = z.input<
  typeof KieGemini25ProChatCompletionsRequestSchema
>;
export type KieGemini25ProChatCompletionsRequestInput =
  KieGemini25ProChatCompletionsRequest;
export type KieGemini25ProChatCompletionsParsedRequest = z.output<
  typeof KieGemini25ProChatCompletionsRequestSchema
>;

export const KlingDurationSchema = z.enum([
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
]);

export const KlingAspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);

export const KlingModeSchema = z.enum(["std", "pro", "4K"]);

export const KlingV3TurboResolutionSchema = z.enum(["720p", "1080p"]);

export const KlingV3TurboAspectRatioSchema = z.enum(["1:1", "9:16", "16:9"]);

export const KlingV3TurboDurationSchema = z.string().regex(/^[1-9]\d*$/);

export const KlingV3TurboTextToVideoDurationSchema = z.enum([
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
]);

export const GrokTextToVideoModeSchema = z.enum(["fun", "normal", "spicy"]);

export const GrokImageToVideoModeSchema = z.enum(["fun", "normal", "spicy"]);

export const GrokImagineModeSchema = z.enum(["fun", "normal", "spicy"]);

export const GrokTextToVideoAspectRatioSchema = z.enum([
  "2:3",
  "3:2",
  "1:1",
  "16:9",
  "9:16",
]);

export const GrokImageToVideoAspectRatioSchema = z.enum([
  "2:3",
  "3:2",
  "1:1",
  "16:9",
  "9:16",
]);

const GrokDurationNumberSchema = z.number().int().min(6).max(30);

const GrokDurationStringSchema = z.string().regex(/^(?:[6-9]|[12][0-9]|30)$/);

export const GrokTextToVideoDurationSchema = z.union([
  GrokDurationNumberSchema,
  GrokDurationStringSchema,
]);

export const GrokImageToVideoDurationSchema = z.union([
  GrokDurationNumberSchema,
  GrokDurationStringSchema,
]);

// The bounded Grok Extend matrix recorded in
// docs/kie-numeric-input-compatibility.md accepts only these JSON strings.
// Keep the caller's representation unchanged; do not coerce numbers.
export const GrokImagineDurationSchema = z.enum(["6", "10"]);

export const GrokImagineResolutionSchema = z.enum(["480p", "720p", "1080p"]);

const GrokImagineLegacyResolutionSchema = z.enum(["480p", "720p"]);

const GROK_IMAGINE_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isGrokImagineImageUrl(value: string): boolean {
  try {
    const pathname = new URL(value).pathname.toLowerCase();
    return GROK_IMAGINE_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

export const GrokImagineImageUrlSchema = z
  .string()
  .url()
  .refine(isGrokImagineImageUrl, {
    message: "image_urls entries must be JPEG, PNG, or WEBP URLs",
  });

// The current KIE Grok Imagine 1.5 Quick Start still publishes video calls under
// the existing grok-imagine/text-to-video and grok-imagine/image-to-video suite
// slugs. This preview-only slug is kept for compatibility with earlier KIE
// recordings that exposed a separate image-to-video preview model.
export const GrokVideo15AspectRatioSchema = z.enum([
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
]);

export const NanoBananaResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const NanoBananaOutputFormatSchema = z.enum(["png", "jpg"]);

export const GptImageQualitySchema = z.enum(["medium", "high"]);

export const Qwen2ImageSizeSchema = z.enum([
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
]);

// Unversioned Qwen (`qwen/*`) uses fal-style named size tokens, not aspect
// ratios. Shared by text-to-image and image-edit.
// Docs: https://docs.kie.ai/market/qwen/text-to-image
// Docs: https://docs.kie.ai/market/qwen/image-edit
export const QwenImageSizeSchema = z.enum([
  "square",
  "square_hd",
  "portrait_4_3",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_16_9",
]);

// Shared acceleration enum for all three unversioned Qwen models.
// Docs: https://docs.kie.ai/market/qwen/text-to-image
// Docs: https://docs.kie.ai/market/qwen/image-edit
// Docs: https://docs.kie.ai/market/qwen/image-to-image
export const QwenAccelerationSchema = z.enum(["none", "regular", "high"]);

// image-edit documents num_images as a numeric-string enum (not a number).
// Docs: https://docs.kie.ai/market/qwen/image-edit
export const QwenImageEditNumImagesSchema = z.enum(["1", "2", "3", "4"]);

export const Wan27ResolutionSchema = z.enum(["720p", "1080p"]);

export const Wan27AspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
]);

export const Wan27AudioSettingSchema = z.enum(["auto", "origin"]);

export const Wan27ImageResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const Wan27ImageAspectRatioSchema = z.enum([
  "1:1",
  "16:9",
  "4:3",
  "21:9",
  "3:4",
  "9:16",
  "8:1",
  "1:8",
]);

export const Wan27VideoEditDurationValues = [
  0, 2, 3, 4, 5, 6, 7, 8, 9, 10,
] as const;

export type Wan27VideoEditDuration =
  (typeof Wan27VideoEditDurationValues)[number];

export const Wan27VideoEditDurationSchema = z
  .number()
  .int()
  .min(0)
  .max(10)
  .refine((duration) => duration === 0 || duration >= 2, {
    message: "Duration must be 0 or an integer from 2 to 10.",
  })
  .describe(
    "Duration in seconds, 0 or 2-10."
  ) as z.ZodType<Wan27VideoEditDuration>;

export const HappyHorseResolutionSchema = z.enum(["720p", "1080p"]);

export const HappyHorseAspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
]);

export const HappyHorse11AspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "1:1",
  "9:21",
  "21:9",
]);

export const HappyHorseAudioSettingSchema = z.enum(["auto", "origin"]);

export const HAPPYHORSE_DURATION_MIN_SECONDS = 3;
export const HAPPYHORSE_DURATION_MAX_SECONDS = 15;
export const HappyHorseDurationSchema = z
  .number()
  .int()
  .min(HAPPYHORSE_DURATION_MIN_SECONDS)
  .max(HAPPYHORSE_DURATION_MAX_SECONDS);

export const Omnihuman15OutputResolutionSchema = z.enum(["720", "1080"]);

export const VolcengineVideoToVideoLipSyncModeSchema = z.enum([
  "lite",
  "basic",
]);

export const GeminiOmniVideoDurationSchema = z.enum(["4", "6", "8", "10"]);

export const GeminiOmniVideoAspectRatioSchema = z.enum(["16:9", "9:16"]);

export const GeminiOmniVideoResolutionSchema = z.enum(["720p", "1080p", "4k"]);

export const Seedance2MiniResolutionSchema = z.enum(["480p", "720p"]);

export const Seedance2MiniAspectRatioSchema = z.enum([
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9",
  "adaptive",
]);

export const Seedance2MiniTaskStateSchema = z.enum([
  "waiting",
  "success",
  "fail",
]);

export const MiniMaxH3PromptSchema = z.string().min(1).max(7000);
export const MiniMaxH3DurationSchema = z.number().int().min(4).max(15);
export const MiniMaxH3ResolutionSchema = z.enum(["768P", "2K"]);
export const MiniMaxH3FixedAspectRatioSchema = z.enum([
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
]);
export const MiniMaxH3ReferenceAspectRatioSchema = z.enum([
  "adaptive",
  ...MiniMaxH3FixedAspectRatioSchema.options,
]);

const MINIMAX_H3_MEDIA_ADDRESS_PROTOCOLS = new Set(["http:", "https:", "oss:"]);

function isMiniMaxH3MediaAddress(value: string): boolean {
  try {
    return MINIMAX_H3_MEDIA_ADDRESS_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

export const MiniMaxH3MediaAddressSchema = z
  .string()
  .url()
  .refine(isMiniMaxH3MediaAddress, {
    message: "Expected an HTTP, HTTPS, or OSS media address",
  });

// ---------------------------------------------------------------------------
// Sub-schemas (composable building blocks)
// ---------------------------------------------------------------------------

export const KlingElementSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  element_input_urls: z.array(z.string()).optional(),
  element_input_video_urls: z.array(z.string()).optional(),
});

export const MultiShotPromptSchema = z.object({
  prompt: z.string().min(1).max(500),
  duration: z.number().int().min(1).max(12),
});

export const Wan27ImageColorPaletteSchema = z.object({
  hex: z.string().min(1),
  ratio: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Media request schemas
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Kling market createTask models (2.6 / v2.1 / v2.5 / AI Avatar)
// Docs: https://docs.kie.ai/market/kling/
// ---------------------------------------------------------------------------

// Shared numeric-string duration for older Kling market models ("5" | "10").
export const KlingMarketDurationSchema = z.enum(["5", "10"]);

// Shared CFG scale (0–1, step 0.1 in docs; keep continuous number bounds).
export const KlingCfgScaleSchema = z.number().min(0).max(1);

// Docs: https://docs.kie.ai/market/kling/text-to-video
// Required: prompt, sound, aspect_ratio, duration. Prompt max 1000.
export const Kling26TextToVideoRequestSchema = z.object({
  model: z.literal("kling-2.6/text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(1000),
    sound: z.boolean(),
    aspect_ratio: KlingAspectRatioSchema,
    duration: KlingMarketDurationSchema,
  }),
});

// Docs: https://docs.kie.ai/market/kling/image-to-video
// Required: prompt, image_urls (max 1), sound, duration.
export const Kling26ImageToVideoRequestSchema = z.object({
  model: z.literal("kling-2.6/image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(1000),
    image_urls: z.array(z.string().min(1)).min(1).max(1),
    sound: z.boolean(),
    duration: KlingMarketDurationSchema,
  }),
});

// Docs: https://docs.kie.ai/market/kling/motion-control
// Required: input_urls (max 1), video_urls (max 1), character_orientation, mode.
// mode values are 720p|1080p (OpenAPI enum; description mentions std/pro).
export const Kling26MotionControlRequestSchema = z.object({
  model: z.literal("kling-2.6/motion-control"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(2500).optional(),
    input_urls: z.array(z.string().min(1)).min(1).max(1),
    video_urls: z.array(z.string().min(1)).min(1).max(1),
    character_orientation: z.enum(["image", "video"]),
    mode: z.enum(["720p", "1080p"]),
  }),
});

// Shared AI Avatar input (pro + standard). Prompt required; empty string allowed.
const KlingAiAvatarInputSchema = z.object({
  image_url: z.string().min(1),
  audio_url: z.string().min(1),
  prompt: z.string().max(5000),
});

// Docs: https://docs.kie.ai/market/kling/ai-avatar-pro
export const KlingAiAvatarProRequestSchema = z.object({
  model: z.literal("kling/ai-avatar-pro"),
  callBackUrl: z.string().optional(),
  input: KlingAiAvatarInputSchema,
});

// Docs: https://docs.kie.ai/market/kling/ai-avatar-standard
export const KlingAiAvatarStandardRequestSchema = z.object({
  model: z.literal("kling/ai-avatar-standard"),
  callBackUrl: z.string().optional(),
  input: KlingAiAvatarInputSchema,
});

// Docs: https://docs.kie.ai/market/kling/v2-1-master-image-to-video
// Required: prompt (max 5000), image_url. Optional: duration, negative_prompt,
// cfg_scale. Do not inject documented defaults so createTask preserves omit.
export const KlingV21MasterImageToVideoRequestSchema = z.object({
  model: z.literal("kling/v2-1-master-image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    image_url: z.string().min(1),
    duration: KlingMarketDurationSchema.optional(),
    negative_prompt: z.string().max(500).optional(),
    cfg_scale: KlingCfgScaleSchema.optional(),
  }),
});

// Docs: https://docs.kie.ai/market/kling/v2-1-master-text-to-video
// Required: prompt. Optional: duration, aspect_ratio, negative_prompt, cfg_scale.
export const KlingV21MasterTextToVideoRequestSchema = z.object({
  model: z.literal("kling/v2-1-master-text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    duration: KlingMarketDurationSchema.optional(),
    aspect_ratio: KlingAspectRatioSchema.optional(),
    negative_prompt: z.string().max(500).optional(),
    cfg_scale: KlingCfgScaleSchema.optional(),
  }),
});

// Docs: https://docs.kie.ai/market/kling/v2-1-pro
// Required: prompt, image_url. Optional: duration, negative_prompt, cfg_scale,
// tail_image_url.
export const KlingV21ProRequestSchema = z.object({
  model: z.literal("kling/v2-1-pro"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    image_url: z.string().min(1),
    duration: KlingMarketDurationSchema.optional(),
    negative_prompt: z.string().max(500).optional(),
    cfg_scale: KlingCfgScaleSchema.optional(),
    tail_image_url: z.string().min(1).optional(),
  }),
});

// Docs: https://docs.kie.ai/market/kling/v2-1-standard
// Required: prompt, image_url. Optional: duration, negative_prompt, cfg_scale.
// No tail_image_url on standard.
export const KlingV21StandardRequestSchema = z.object({
  model: z.literal("kling/v2-1-standard"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    image_url: z.string().min(1),
    duration: KlingMarketDurationSchema.optional(),
    negative_prompt: z.string().max(500).optional(),
    cfg_scale: KlingCfgScaleSchema.optional(),
  }),
});

// Docs: https://docs.kie.ai/market/kling/v25-turbo-image-to-video-pro
// Required: prompt (max 2500), image_url. Optional: tail_image_url, duration,
// negative_prompt, cfg_scale. (Upstream schema enum is buggy; model id is
// kling/v2-5-turbo-image-to-video-pro.)
export const KlingV25TurboImageToVideoProRequestSchema = z.object({
  model: z.literal("kling/v2-5-turbo-image-to-video-pro"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(2500),
    image_url: z.string().min(1),
    tail_image_url: z.string().min(1).optional(),
    duration: KlingMarketDurationSchema.optional(),
    negative_prompt: z.string().max(500).optional(),
    cfg_scale: KlingCfgScaleSchema.optional(),
  }),
});

// Docs: https://docs.kie.ai/market/kling/v25-turbo-text-to-video-pro
// Required: prompt (max 2500). Optional: duration, aspect_ratio,
// negative_prompt (max 2500), cfg_scale.
export const KlingV25TurboTextToVideoProRequestSchema = z.object({
  model: z.literal("kling/v2-5-turbo-text-to-video-pro"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(2500),
    duration: KlingMarketDurationSchema.optional(),
    aspect_ratio: KlingAspectRatioSchema.optional(),
    negative_prompt: z.string().max(2500).optional(),
    cfg_scale: KlingCfgScaleSchema.optional(),
  }),
});

export const KlingVideoRequestSchema = z.object({
  model: z.literal("kling-3.0/video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().optional(),
    image_urls: z.array(z.string()).optional(),
    // `sound` is optional, not required: modelInputSchemas omits `required`
    // for it and documents "default false, true when multi_shots". The
    // default is context-dependent, so it is deliberately left un-`.default()`
    // as well — pinning `.default(false)` locally would send an explicit
    // `false` the caller never chose and suppress the upstream promotion to
    // `true` under multi-shot mode. Let the caller omit it and let Kie decide.
    sound: z.boolean().optional(),
    duration: KlingDurationSchema,
    aspect_ratio: KlingAspectRatioSchema.optional(),
    mode: KlingModeSchema,
    multi_shots: z.boolean(),
    multi_prompt: z.array(MultiShotPromptSchema).optional(),
    kling_elements: z.array(KlingElementSchema).max(3).optional(),
  }),
});

export const KlingV3TurboImageToVideoRequestSchema = z.object({
  model: z.literal("kling/v3-turbo-image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1),
    image_urls: z.array(z.string().min(1)).min(1).max(1),
    duration: KlingV3TurboDurationSchema,
    resolution: KlingV3TurboResolutionSchema,
  }),
});

export const KlingV3TurboTextToVideoRequestSchema = z.object({
  model: z.literal("kling/v3-turbo-text-to-video"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(2500),
    duration: KlingV3TurboTextToVideoDurationSchema.default("5"),
    aspect_ratio: KlingV3TurboAspectRatioSchema.default("16:9"),
    resolution: KlingV3TurboResolutionSchema.default("720p"),
  }),
});

export const KlingMotionControlRequestSchema = z.object({
  model: z.literal("kling-3.0/motion-control"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().optional(),
    input_urls: z.array(z.string()).min(1).max(1),
    video_urls: z.array(z.string()).min(1),
    mode: z.enum(["720p", "1080p"]).optional(),
    character_orientation: z.enum(["video", "image"]).optional(),
    background_source: z.enum(["input_video", "input_image"]).optional(),
  }),
});

export const GrokTextToImageRequestSchema = z.object({
  model: z.literal("grok-imagine/text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    aspect_ratio: z.enum(["2:3", "3:2", "1:1", "16:9", "9:16"]).default("16:9"),
    nsfw_checker: z.boolean().default(false),
    enable_pro: z.boolean().optional(),
  }),
});

export const Qwen2TextToImageRequestSchema = z.object({
  model: z.literal("qwen2/text-to-image"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(800),
    image_size: Qwen2ImageSizeSchema.default("16:9"),
    seed: z.number().int().optional(),
    output_format: z.enum(["jpeg", "png"]).default("png"),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const Qwen2ImageEditRequestSchema = z.object({
  model: z.literal("qwen2/image-edit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(800),
    image_url: z.string().min(1),
    image_size: z
      .enum(["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"])
      .default("16:9"),
    output_format: z.enum(["jpeg", "png"]).default("png"),
    seed: z.number().multipleOf(1).optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Unversioned Qwen v1 createTask models (enum-only; alias stays digit-required).
// Docs: https://docs.kie.ai/market/qwen/text-to-image
export const QwenTextToImageRequestSchema = z.object({
  model: z.literal("qwen/text-to-image"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    image_size: QwenImageSizeSchema.default("square_hd"),
    num_inference_steps: z.number().min(2).max(250).default(30),
    seed: z.number().int().optional(),
    guidance_scale: z.number().min(0).max(20).default(2.5),
    enable_safety_checker: z.boolean().optional(),
    output_format: z.enum(["png", "jpeg"]).default("png"),
    negative_prompt: z.string().max(500).optional(),
    acceleration: QwenAccelerationSchema.default("none"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/qwen/image-edit
export const QwenImageEditRequestSchema = z.object({
  model: z.literal("qwen/image-edit"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(2000),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    acceleration: QwenAccelerationSchema.default("none"),
    image_size: QwenImageSizeSchema.default("landscape_4_3"),
    // OpenAPI declares number with step 1; max 49 (not 250 like t2i/i2i).
    num_inference_steps: z.number().min(2).max(49).default(25),
    seed: z.number().int().optional(),
    guidance_scale: z.number().min(0).max(20).default(4),
    sync_mode: z.boolean().optional(),
    // Numeric-string enum per OpenAPI (`"1"` | `"2"` | `"3"` | `"4"`).
    num_images: QwenImageEditNumImagesSchema.optional(),
    enable_safety_checker: z.boolean().optional(),
    output_format: z.enum(["jpeg", "png"]).default("png"),
    negative_prompt: z.string().max(500).optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/qwen/image-to-image
export const QwenImageToImageRequestSchema = z.object({
  model: z.literal("qwen/image-to-image"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    strength: z.number().min(0).max(1).default(0.8),
    output_format: z.enum(["png", "jpeg"]).default("png"),
    acceleration: QwenAccelerationSchema.default("none"),
    negative_prompt: z.string().max(500).optional(),
    seed: z.number().int().optional(),
    num_inference_steps: z.number().min(2).max(250).default(30),
    guidance_scale: z.number().min(0).max(20).default(2.5),
    enable_safety_checker: z.boolean().optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GrokImageToImageRequestSchema = z.object({
  model: z.literal("grok-imagine/image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(390000).optional(),
    image_urls: z.tuple([z.string()]),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GrokTextToVideoRequestSchema = z.object({
  model: z.literal("grok-imagine/text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    aspect_ratio: GrokTextToVideoAspectRatioSchema.optional(),
    mode: GrokTextToVideoModeSchema.optional(),
    duration: GrokTextToVideoDurationSchema.optional(),
    resolution: GrokImagineResolutionSchema.optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GrokImageToVideoRequestSchema = z
  .object({
    model: z.literal("grok-imagine/image-to-video"),
    callBackUrl: z.string().url().optional(),
    input: z.object({
      prompt: z.string().max(4096).optional(),
      image_urls: z
        .array(GrokImagineImageUrlSchema)
        .min(1)
        .max(7, "grok-imagine/image-to-video accepts at most 7 image_urls")
        .optional(),
      task_id: z.string().min(1).max(100).optional(),
      index: z.number().int().min(0).max(5).default(0),
      mode: GrokImageToVideoModeSchema.default("normal"),
      duration: GrokImageToVideoDurationSchema.default(6),
      resolution: GrokImagineResolutionSchema.default("480p"),
      aspect_ratio: GrokImageToVideoAspectRatioSchema.default("16:9"),
      nsfw_checker: z.boolean().default(false),
    }),
  })
  .superRefine((v, ctx) => {
    const hasImageUrls = Boolean(v.input.image_urls?.length);
    const hasTaskId = Boolean(v.input.task_id);

    if (hasImageUrls === hasTaskId) {
      ctx.addIssue({
        code: "custom",
        message:
          "grok-imagine/image-to-video requires exactly one of image_urls or task_id",
        path: ["input", "image_urls"],
      });
    }

    if (hasImageUrls && v.input.mode === "spicy") {
      ctx.addIssue({
        code: "custom",
        message:
          "grok-imagine/image-to-video spicy mode is unavailable with external image_urls",
        path: ["input", "mode"],
      });
    }

    if (
      v.input.resolution === "1080p" &&
      (v.input.image_urls?.length ?? 0) > 1
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "grok-imagine/image-to-video accepts exactly 1 image_url at 1080p",
        path: ["input", "image_urls"],
      });
    }
  });

// Legacy preview compatibility slug. Current KIE Grok Imagine 1.5 public docs
// use grok-imagine/image-to-video for image-to-video calls.
export const GrokVideo15PreviewRequestSchema = z.object({
  model: z.literal("grok-imagine-video-1-5-preview"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(4096).optional(),
    image_urls: z.array(z.string()).min(1),
    aspect_ratio: GrokVideo15AspectRatioSchema.default("auto"),
    resolution: GrokImagineLegacyResolutionSchema.default("480p"),
    duration: z.number().int().min(1).max(15).default(8),
    nsfw_checker: z.boolean().default(true),
  }),
});

export const GrokVideoExtendRequestSchema = z.object({
  model: z.literal("grok-imagine/extend"),
  callBackUrl: z.string().optional(),
  // Top-level cost hint naming the source video's resolution (recording sends
  // "480p"); retains the evidence-backed legacy resolution vocabulary.
  resolution: GrokImagineLegacyResolutionSchema.optional(),
  input: z.object({
    task_id: z.string().min(1).max(100),
    prompt: z.string().min(1).max(5000),
    // Current evidence accepts fractional positions and rejects omission.
    // KIE applies no usable default, so preserve the required number as sent.
    extend_at: z.number().min(0),
    extend_times: GrokImagineDurationSchema,
  }),
});

export const GrokVideoUpscaleRequestSchema = z.object({
  model: z.literal("grok-imagine/upscale"),
  callBackUrl: z.string().optional(),
  input: z.object({
    task_id: z.string().min(1).max(100),
  }),
});

export const NanoBananaProRequestSchema = z.object({
  model: z.literal("nano-banana-pro"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1),
    image_input: z.array(z.string()).max(8).optional(),
    aspect_ratio: z
      .enum([
        "1:1",
        "2:3",
        "3:2",
        "3:4",
        "4:3",
        "4:5",
        "5:4",
        "9:16",
        "16:9",
        "21:9",
        "auto",
      ])
      .default("16:9"),
    resolution: NanoBananaResolutionSchema.default("2K"),
    output_format: NanoBananaOutputFormatSchema.optional(),
  }),
});

// Inner input schema kept unrefined so callers can walk `.shape` for slot
// introspection (see Seedance2InputSchema for full rationale).
export const Seedance2FastInputSchema = z.object({
  prompt: z.string().min(3).max(20000),
  first_frame_url: z.string().optional(),
  last_frame_url: z.string().optional(),
  reference_image_urls: z.array(z.string()).max(9).optional(),
  reference_video_urls: z.array(z.string()).max(3).optional(),
  reference_audio_urls: z.array(z.string()).max(3).optional(),
  /** @deprecated */
  return_last_frame: z.boolean().optional(),
  generate_audio: z.boolean().optional(),
  resolution: z.enum(["480p", "720p"]).optional(),
  aspect_ratio: z
    .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "adaptive"])
    .optional(),
  duration: z.number().int().min(4).max(15).default(5),
  web_search: z.boolean().optional(),
  nsfw_checker: z.boolean().default(false),
});

const Seedance2FastRequestObjectSchema = z.object({
  model: z.literal("bytedance/seedance-2-fast"),
  callBackUrl: z.string().optional(),
  input: Seedance2FastInputSchema,
});

// Mirrors the bytedance/seedance-2 mutual-exclusion rule — fast variant
// shares the input shape and the same documented constraint that
// first/last frames and multimodal references are mutually exclusive.
export const Seedance2FastRequestSchema =
  Seedance2FastRequestObjectSchema.refine(
    (v) => {
      const hasReference =
        (v.input.reference_image_urls?.length ?? 0) > 0 ||
        (v.input.reference_video_urls?.length ?? 0) > 0 ||
        (v.input.reference_audio_urls?.length ?? 0) > 0;
      const hasFrame =
        Boolean(v.input.first_frame_url) || Boolean(v.input.last_frame_url);
      return !(hasReference && hasFrame);
    },
    {
      message:
        "bytedance/seedance-2-fast does not accept reference_image_urls, reference_video_urls, or reference_audio_urls combined with first_frame_url or last_frame_url (these scenarios are mutually exclusive)",
      path: ["input", "reference_image_urls"],
    }
  );

// Inner input schema kept unrefined so callers (e.g. videocity) can walk
// `.shape` for slot-constraint introspection — wrapping the request in
// `.refine()` below turns it into ZodEffects and hides `.shape`.
export const Seedance2InputSchema = z.object({
  prompt: z.string().min(3).max(20000),
  first_frame_url: z.string().optional(),
  last_frame_url: z.string().optional(),
  reference_image_urls: z.array(z.string()).max(9).optional(),
  reference_video_urls: z.array(z.string()).max(3).optional(),
  reference_audio_urls: z.array(z.string()).max(3).optional(),
  /** @deprecated */
  return_last_frame: z.boolean().optional(),
  generate_audio: z.boolean().optional(),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  aspect_ratio: z
    .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "21:9", "adaptive"])
    .optional(),
  duration: z.number().int().min(4).max(15).default(5),
  web_search: z.boolean().optional(),
  nsfw_checker: z.boolean().default(false),
});

const Seedance2RequestObjectSchema = z.object({
  model: z.literal("bytedance/seedance-2"),
  callBackUrl: z.string().optional(),
  input: Seedance2InputSchema,
});

// Per Kie docs, bytedance/seedance-2 has three mutually exclusive scenarios:
// Image-to-Video (first frame), Image-to-Video (first + last frames), and
// Multimodal Reference-to-Video (any of reference_image_urls /
// reference_video_urls / reference_audio_urls). Mixing first/last frames
// with any reference_* field returns "The reference video and the first
// and last frames are mutually exclusive, and only one scene can be
// selected" from createTask. Enforce at the SDK boundary.
export const Seedance2RequestSchema = Seedance2RequestObjectSchema.refine(
  (v) => {
    const hasReference =
      (v.input.reference_image_urls?.length ?? 0) > 0 ||
      (v.input.reference_video_urls?.length ?? 0) > 0 ||
      (v.input.reference_audio_urls?.length ?? 0) > 0;
    const hasFrame =
      Boolean(v.input.first_frame_url) || Boolean(v.input.last_frame_url);
    return !(hasReference && hasFrame);
  },
  {
    message:
      "bytedance/seedance-2 does not accept reference_image_urls, reference_video_urls, or reference_audio_urls combined with first_frame_url or last_frame_url (these scenarios are mutually exclusive)",
    path: ["input", "reference_image_urls"],
  }
);

export const Seedance2MiniInputSchema = z.object({
  prompt: z.string().max(20000).optional(),
  reference_image_urls: z.array(z.string()).max(9).default([]),
  reference_video_urls: z.array(z.string()).max(3).default([]),
  reference_audio_urls: z.array(z.string()).max(3).default([]),
  generate_audio: z.boolean().default(true),
  resolution: Seedance2MiniResolutionSchema.default("720p"),
  aspect_ratio: Seedance2MiniAspectRatioSchema.default("16:9"),
  duration: z.number().int().min(4).max(15).default(5),
  web_search: z.boolean().default(false),
  nsfw_checker: z.boolean().default(true),
});

export const Seedance2MiniRequestSchema = z.object({
  model: z.literal("bytedance/seedance-2-mini"),
  callBackUrl: z.string().url().optional(),
  input: Seedance2MiniInputSchema,
});

// Docs: https://docs.kie.ai/market/bytedance/seedance-1-5-pro
// Distinct input shape from seedance-2*: `input_urls` (0-2) instead of
// first/last/reference frames, plus `fixed_lens`. Duration range is 4-12.
export const Seedance15ProAspectRatioSchema = z.enum([
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
  "21:9",
]);

export const Seedance15ProResolutionSchema = z.enum(["480p", "720p", "1080p"]);

export const Seedance15ProInputSchema = z.object({
  prompt: z.string().min(3).max(20000),
  input_urls: z.array(z.string()).max(2).optional(),
  // Required by the OpenAPI `required` list (documented default "1:1").
  aspect_ratio: Seedance15ProAspectRatioSchema,
  resolution: Seedance15ProResolutionSchema.default("720p"),
  // Required; documented range 4-12 seconds.
  duration: z.number().int().min(4).max(12),
  fixed_lens: z.boolean().default(false),
  generate_audio: z.boolean().default(false),
  nsfw_checker: z.boolean().default(false),
});

export const Seedance15ProRequestSchema = z.object({
  model: z.literal("bytedance/seedance-1.5-pro"),
  callBackUrl: z.string().optional(),
  input: Seedance15ProInputSchema,
});

// ---------------------------------------------------------------------------
// ByteDance non-Seedance createTask models (ac-ww94di)
// Docs live under market/seedream/* and market/bytedance/v1-* paths; model ids
// use the bytedance/ namespace. Seedance alias does not cover these products.
// ---------------------------------------------------------------------------

// Docs: https://docs.kie.ai/market/seedream/seedream (Seedream 3.0)
export const BytedanceSeedreamImageSizeSchema = z.enum([
  "square",
  "square_hd",
  "portrait_4_3",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_16_9",
]);

export const BytedanceSeedreamInputSchema = z.object({
  prompt: z.string().min(3).max(5000),
  image_size: BytedanceSeedreamImageSizeSchema.default("square_hd"),
  guidance_scale: z.number().min(1).max(10).default(2.5),
  seed: z.number().int().optional(),
});

export const BytedanceSeedreamRequestSchema = z.object({
  model: z.literal("bytedance/seedream"),
  callBackUrl: z.string().optional(),
  input: BytedanceSeedreamInputSchema,
});

// Shared image_size / resolution enums for Seedream 4.0 text-to-image + edit.
// Docs: https://docs.kie.ai/market/seedream/seedream-v4-text-to-image
// Docs: https://docs.kie.ai/market/seedream/seedream-v4-edit
export const BytedanceSeedreamV4ImageSizeSchema = z.enum([
  "square",
  "square_hd",
  "portrait_4_3",
  "portrait_3_2",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_3_2",
  "landscape_16_9",
  "landscape_21_9",
]);

export const BytedanceSeedreamV4ImageResolutionSchema = z.enum([
  "1K",
  "2K",
  "4K",
]);

export const BytedanceSeedreamV4TextToImageInputSchema = z.object({
  prompt: z.string().min(3).max(5000),
  image_size: BytedanceSeedreamV4ImageSizeSchema.default("square_hd"),
  image_resolution: BytedanceSeedreamV4ImageResolutionSchema.default("1K"),
  max_images: z.number().int().min(1).max(6).default(1),
  seed: z.number().int().optional(),
  nsfw_checker: z.boolean().default(false),
});

export const BytedanceSeedreamV4TextToImageRequestSchema = z.object({
  model: z.literal("bytedance/seedream-v4-text-to-image"),
  callBackUrl: z.string().optional(),
  input: BytedanceSeedreamV4TextToImageInputSchema,
});

export const BytedanceSeedreamV4EditInputSchema = z.object({
  prompt: z.string().min(3).max(5000),
  image_urls: z.array(z.string()).min(1).max(10),
  image_size: BytedanceSeedreamV4ImageSizeSchema.default("square_hd"),
  image_resolution: BytedanceSeedreamV4ImageResolutionSchema.default("1K"),
  max_images: z.number().int().min(1).max(6).default(1),
  seed: z.number().int().optional(),
  nsfw_checker: z.boolean().default(false),
});

export const BytedanceSeedreamV4EditRequestSchema = z.object({
  model: z.literal("bytedance/seedream-v4-edit"),
  callBackUrl: z.string().optional(),
  input: BytedanceSeedreamV4EditInputSchema,
});

// Shared video field vocabs for bytedance/v1-* models.
// Docs: https://docs.kie.ai/market/bytedance/v1-pro-text-to-video (and siblings)
export const BytedanceV1VideoDurationSchema = z.enum(["5", "10"]);
export const BytedanceV1VideoResolutionSchema = z.enum([
  "480p",
  "720p",
  "1080p",
]);
export const BytedanceV1ProFastVideoResolutionSchema = z.enum([
  "720p",
  "1080p",
]);
export const BytedanceV1LiteTextAspectRatioSchema = z.enum([
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "9:21",
]);
export const BytedanceV1ProTextAspectRatioSchema = z.enum([
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
]);

const bytedanceV1SeedField = z
  .number()
  .int()
  .min(-1)
  .max(2147483647)
  .optional();

export const BytedanceV1LiteImageToVideoInputSchema = z.object({
  prompt: z.string().min(3).max(10000),
  image_url: z.string().min(1),
  resolution: BytedanceV1VideoResolutionSchema.default("720p"),
  duration: BytedanceV1VideoDurationSchema.default("5"),
  camera_fixed: z.boolean().optional(),
  seed: bytedanceV1SeedField,
  enable_safety_checker: z.boolean().optional(),
  end_image_url: z.string().optional(),
  nsfw_checker: z.boolean().default(false),
});

export const BytedanceV1LiteImageToVideoRequestSchema = z.object({
  model: z.literal("bytedance/v1-lite-image-to-video"),
  callBackUrl: z.string().optional(),
  input: BytedanceV1LiteImageToVideoInputSchema,
});

export const BytedanceV1LiteTextToVideoInputSchema = z.object({
  prompt: z.string().min(3).max(10000),
  aspect_ratio: BytedanceV1LiteTextAspectRatioSchema.default("16:9"),
  resolution: BytedanceV1VideoResolutionSchema.default("720p"),
  duration: BytedanceV1VideoDurationSchema.default("5"),
  camera_fixed: z.boolean().optional(),
  seed: bytedanceV1SeedField,
  enable_safety_checker: z.boolean().optional(),
  nsfw_checker: z.boolean().default(false),
});

export const BytedanceV1LiteTextToVideoRequestSchema = z.object({
  model: z.literal("bytedance/v1-lite-text-to-video"),
  callBackUrl: z.string().optional(),
  input: BytedanceV1LiteTextToVideoInputSchema,
});

export const BytedanceV1ProFastImageToVideoInputSchema = z.object({
  prompt: z.string().min(3).max(10000),
  image_url: z.string().min(1),
  resolution: BytedanceV1ProFastVideoResolutionSchema.default("720p"),
  duration: BytedanceV1VideoDurationSchema.default("5"),
  nsfw_checker: z.boolean().default(false),
});

export const BytedanceV1ProFastImageToVideoRequestSchema = z.object({
  model: z.literal("bytedance/v1-pro-fast-image-to-video"),
  callBackUrl: z.string().optional(),
  input: BytedanceV1ProFastImageToVideoInputSchema,
});

export const BytedanceV1ProImageToVideoInputSchema = z.object({
  prompt: z.string().min(3).max(10000),
  image_url: z.string().min(1),
  resolution: BytedanceV1VideoResolutionSchema.default("720p"),
  duration: BytedanceV1VideoDurationSchema.default("5"),
  camera_fixed: z.boolean().optional(),
  seed: bytedanceV1SeedField,
  enable_safety_checker: z.boolean().optional(),
  nsfw_checker: z.boolean().default(false),
});

export const BytedanceV1ProImageToVideoRequestSchema = z.object({
  model: z.literal("bytedance/v1-pro-image-to-video"),
  callBackUrl: z.string().optional(),
  input: BytedanceV1ProImageToVideoInputSchema,
});

export const BytedanceV1ProTextToVideoInputSchema = z.object({
  prompt: z.string().min(3).max(10000),
  aspect_ratio: BytedanceV1ProTextAspectRatioSchema.default("16:9"),
  resolution: BytedanceV1VideoResolutionSchema.default("720p"),
  duration: BytedanceV1VideoDurationSchema.default("5"),
  camera_fixed: z.boolean().optional(),
  seed: bytedanceV1SeedField,
  enable_safety_checker: z.boolean().optional(),
  nsfw_checker: z.boolean().default(false),
});

export const BytedanceV1ProTextToVideoRequestSchema = z.object({
  model: z.literal("bytedance/v1-pro-text-to-video"),
  callBackUrl: z.string().optional(),
  input: BytedanceV1ProTextToVideoInputSchema,
});

export const NanoBanana2RequestSchema = z.object({
  model: z.literal("nano-banana-2"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(20000),
    image_input: z.array(z.string().url()).max(14).optional(),
    aspect_ratio: z
      .enum([
        "1:1",
        "1:4",
        "1:8",
        "2:3",
        "3:2",
        "3:4",
        "4:1",
        "4:3",
        "4:5",
        "5:4",
        "8:1",
        "9:16",
        "16:9",
        "21:9",
        "auto",
      ])
      .default("auto"),
    resolution: NanoBananaResolutionSchema.default("1K"),
    output_format: NanoBananaOutputFormatSchema.default("jpg"),
  }),
});

// Docs: https://docs.kie.ai/market/google/nano-banana-2-lite
// Lite uses `image_urls` (not `image_input`) and has no resolution/output_format.
export const NanoBanana2LiteAspectRatioSchema = z.enum([
  "1:1",
  "1:4",
  "1:8",
  "2:3",
  "3:2",
  "3:4",
  "4:1",
  "4:3",
  "4:5",
  "5:4",
  "8:1",
  "9:16",
  "16:9",
  "21:9",
  "auto",
]);

export const NanoBanana2LiteRequestSchema = z.object({
  model: z.literal("nano-banana-2-lite"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(20000),
    // Optional references; omit or [] for pure text-to-image. Max 10.
    image_urls: z.array(z.string()).max(10).optional(),
    aspect_ratio: NanoBanana2LiteAspectRatioSchema.default("auto"),
  }),
});

export const GptImageToImageRequestSchema = z.object({
  model: z.literal("gpt-image/1.5-image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    input_urls: z.array(z.string()).min(1).max(4),
    prompt: z.string().min(1),
    aspect_ratio: z.enum(["1:1", "2:3", "3:2"]).optional(),
    quality: GptImageQualitySchema.optional(),
  }),
});

// Docs: https://docs.kie.ai/market/gpt-image/1-5-text-to-image
// OpenAPI marks aspect_ratio and quality required (documented defaults 1:1 /
// medium). Keep them required without local defaults so callers choose.
export const GptImage15TextToImageAspectRatioSchema = z.enum([
  "1:1",
  "2:3",
  "3:2",
]);

export const GptImage15TextToImageRequestSchema = z.object({
  model: z.literal("gpt-image/1.5-text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1),
    aspect_ratio: GptImage15TextToImageAspectRatioSchema,
    quality: GptImageQualitySchema,
  }),
});

export const GptImage2ImageToImageAspectRatioSchema = z.enum([
  "auto",
  "1:1",
  "5:4",
  "9:16",
  "21:9",
  "16:9",
  "4:3",
  "3:2",
  "4:5",
  "3:4",
  "2:3",
]);

export const GptImage2ImageToImageResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const GptImage2ImageToImageRequestSchema = z.object({
  model: z.literal("gpt-image-2-image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(20000),
    input_urls: z.array(z.string()).min(1).max(16),
    aspect_ratio: GptImage2ImageToImageAspectRatioSchema.default("auto"),
    resolution: GptImage2ImageToImageResolutionSchema.default("1K"),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const GptImage2TextToImageAspectRatioSchema = z.enum([
  "auto",
  "1:1",
  "3:2",
  "2:3",
  "4:3",
  "3:4",
  "5:4",
  "4:5",
  "9:16",
  "16:9",
  "2:1",
  "1:2",
  "3:1",
  "1:3",
  "21:9",
  "9:21",
]);

export const GptImage2TextToImageResolutionSchema = z.enum(["1K", "2K", "4K"]);

export const GptImage2TextToImageRequestSchema = z.object({
  model: z.literal("gpt-image-2-text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(20000),
    aspect_ratio: GptImage2TextToImageAspectRatioSchema.default("auto"),
    resolution: GptImage2TextToImageResolutionSchema.default("1K"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// `quality` is required here despite carrying an upstream default. Kie's docs
// list it as optional defaulting to `basic`, but POST /api/v1/jobs/createTask
// answers 422 with `{"code":422,"msg":"This field is required"}` when the key
// is absent from `input` — the documented default is never applied server-side
// for the seedream/5-lite models. Omitting `.default("basic")` here is
// deliberate: defaulting locally would paper over the upstream 422 and send a
// quality the caller never chose. Required-ness forces callers to pick
// basic/high explicitly. Do not relax to `.optional()` or `.default()` without
// re-confirming against a live createTask call.
export const SeedreamImageToImageRequestSchema = z.object({
  model: z.literal("seedream/5-lite-image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    image_urls: z.array(z.string()).min(1).max(14),
    prompt: z.string().min(3).max(3000),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"])
      .default("16:9"),
    quality: z.enum(["basic", "high"]),
    nsfw_checker: z.boolean().default(false),
  }),
});

// `quality` is required for the same reason as the image-to-image sibling
// above: Kie documents a `basic` default, but seedream/5-lite createTask
// answers `"This field is required"` when the key is absent. See the note on
// SeedreamImageToImageRequestSchema.
export const SeedreamTextToImageRequestSchema = z.object({
  model: z.literal("seedream/5-lite-text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(3).max(3000),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"])
      .default("16:9"),
    quality: z.enum(["basic", "high"]),
    nsfw_checker: z.boolean().default(false),
  }),
});

// seedream/5-pro-image-to-image is the higher-fidelity sibling of the lite
// variant: fewer input images (max 10 vs 14), no 21:9 aspect ratio, and an
// extra png/jpeg output_format. Like the lite models, Kie rejects createTask
// with `"This field is required"` when `quality` is missing despite docs
// listing a default, so treat it as required at the SDK boundary.
export const SeedreamProImageToImageRequestSchema = z.object({
  model: z.literal("seedream/5-pro-image-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    image_urls: z.array(z.string()).min(1).max(10),
    prompt: z.string().min(3).max(3000),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2"])
      .default("1:1"),
    quality: z.enum(["basic", "high"]),
    output_format: z.enum(["png", "jpeg"]).default("png"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// seedream/5-pro-text-to-image is the text-only sibling of the pro
// image-to-image model: same aspect ratios, quality tiers, and png/jpeg
// output_format, but no image_urls input. Like the other seedream models,
// Kie rejects createTask with `"This field is required"` when `quality` is
// missing despite the docs listing a default, so treat it as required at the
// SDK boundary.
export const SeedreamProTextToImageRequestSchema = z.object({
  model: z.literal("seedream/5-pro-text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(3).max(3000),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2"])
      .default("1:1"),
    quality: z.enum(["basic", "high"]),
    output_format: z.enum(["png", "jpeg"]).default("png"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// seedream/4.5-text-to-image is an alias-accepted Seedream id (matches
// KieMediaSeedreamModelAliasSchema) that still needs its own createTask
// request member so CreateTaskRequestSchema accepts it.
// Docs: https://docs.kie.ai/market/seedream/4-5-text-to-image
// OpenAPI lists aspect_ratio + quality as required; quality is kept required
// without `.default()` for the same documented-defaults trap as seedream/5-*.
export const Seedream45TextToImageRequestSchema = z.object({
  model: z.literal("seedream/4.5-text-to-image"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(3).max(3000),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"])
      .default("1:1"),
    quality: z.enum(["basic", "high"]),
    nsfw_checker: z.boolean().default(false),
  }),
});

// seedream/4.5-edit is the image-edit sibling of 4.5 text-to-image: same
// aspect ratios (including 21:9) and quality tiers, plus image_urls (max 14).
// Docs: https://docs.kie.ai/market/seedream/4-5-edit
export const Seedream45EditRequestSchema = z.object({
  model: z.literal("seedream/4.5-edit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(3).max(3000),
    image_urls: z.array(z.string()).min(1).max(14),
    aspect_ratio: z
      .enum(["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"])
      .default("1:1"),
    quality: z.enum(["basic", "high"]),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const SoraWatermarkRequestSchema = z.object({
  model: z.literal("sora-watermark-remover"),
  callBackUrl: z.string().optional(),
  input: z.object({
    video_url: z.string().min(1),
    upload_method: z.enum(["s3", "oss"]).optional(),
  }),
});

export const RecraftCrispUpscaleRequestSchema = z.object({
  model: z.literal("recraft/crisp-upscale"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    image: z.string().min(1),
  }),
});

export const RecraftRemoveBackgroundRequestSchema = z.object({
  model: z.literal("recraft/remove-background"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    image: z.string().min(1),
  }),
});

export const HappyHorseTextToVideoRequestSchema = z.object({
  model: z.literal("happyhorse/text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    resolution: HappyHorseResolutionSchema.optional(),
    aspect_ratio: HappyHorseAspectRatioSchema.optional(),
    duration: HappyHorseDurationSchema.optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
  }),
});

export const HappyHorseImageToVideoRequestSchema = z.object({
  model: z.literal("happyhorse/image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(5000).optional(),
    image_urls: z.array(z.string()).min(1).max(1),
    resolution: HappyHorseResolutionSchema.optional(),
    duration: HappyHorseDurationSchema.optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
  }),
});

export const HappyHorseReferenceToVideoRequestSchema = z.object({
  model: z.literal("happyhorse/reference-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    reference_image: z.array(z.string()).min(1).max(9),
    resolution: HappyHorseResolutionSchema.optional(),
    aspect_ratio: HappyHorseAspectRatioSchema.optional(),
    duration: HappyHorseDurationSchema.optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
  }),
});

export const HappyHorseVideoEditRequestSchema = z.object({
  model: z.literal("happyhorse/video-edit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    video_url: z.string().min(1),
    reference_image: z.array(z.string()).max(5).optional(),
    resolution: HappyHorseResolutionSchema.optional(),
    audio_setting: HappyHorseAudioSettingSchema.optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
  }),
});

export const HappyHorse11TextToVideoRequestSchema = z.object({
  model: z.literal("happyhorse-1-1/text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    resolution: HappyHorseResolutionSchema.default("1080p"),
    aspect_ratio: HappyHorse11AspectRatioSchema.default("16:9"),
    duration: HappyHorseDurationSchema.default(5),
  }),
});

export const HappyHorse11ImageToVideoRequestSchema = z.object({
  model: z.literal("happyhorse-1-1/image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(5000).default(""),
    image_urls: z.array(z.string().url()).min(1).max(1),
    resolution: HappyHorseResolutionSchema.default("1080p"),
    duration: HappyHorseDurationSchema.default(5),
  }),
});

export const HappyHorse11ReferenceToVideoRequestSchema = z.object({
  model: z.literal("happyhorse-1-1/reference-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    reference_image: z.array(z.string().url()).min(1).max(9),
    resolution: HappyHorseResolutionSchema.default("1080p"),
    aspect_ratio: HappyHorse11AspectRatioSchema.default("16:9"),
    duration: HappyHorseDurationSchema.default(5),
  }),
});

export const HappyHorse11ResponseCodeSchema = z.union([
  z.literal(200),
  z.literal(401),
  z.literal(402),
  z.literal(404),
  z.literal(422),
  z.literal(429),
  z.literal(433),
  z.literal(455),
  z.literal(500),
  z.literal(501),
  z.literal(505),
]);

export const HappyHorse11ErrorResponseCodeSchema = z.union([
  z.literal(401),
  z.literal(402),
  z.literal(404),
  z.literal(422),
  z.literal(429),
  z.literal(433),
  z.literal(455),
  z.literal(500),
  z.literal(501),
  z.literal(505),
]);

export const HappyHorse11CreateTaskResponseSchema = z.union([
  z.object({
    code: z.literal(200),
    msg: z.string(),
    data: z.object({
      taskId: z.string(),
    }),
  }),
  z.object({
    code: HappyHorse11ErrorResponseCodeSchema,
    msg: z.string(),
    data: z.unknown().optional(),
  }),
]);

export const Omnihuman15RequestSchema = z.object({
  model: z.literal("omnihuman-1-5"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    image_url: z.string().url(),
    mask_url: z.array(z.string().url()).max(5).optional(),
    audio_url: z.string().url(),
    prompt: z.string().max(1000).optional(),
    output_resolution: Omnihuman15OutputResolutionSchema.default("1080"),
    pe_fast_mode: z.boolean().default(false),
    seed: z.number().int().min(-1).default(-1),
  }),
});

// Omnihuman 1.5 human identification (portrait subject recognition).
// Docs: https://docs.kie.ai/market/omnihuman-1-5/human-identification
export const Omnihuman15HumanIdentificationRequestSchema = z.object({
  model: z.literal("omnihuman-1-5/human-identification"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    // Portrait image URL (jpg/png/jpeg, max 5 MB, under 4096x4096).
    image_url: z.string().url(),
  }),
});

// Omnihuman 1.5 subject detection (up to 5 subjects in a portrait).
// Docs: https://docs.kie.ai/market/omnihuman-1-5/subject-detection
export const Omnihuman15SubjectDetectionRequestSchema = z.object({
  model: z.literal("omnihuman-1-5/subject-detection"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    // Portrait image URL (jpg/png/jpeg, max 5 MB); up to 5 subjects detected.
    image_url: z.string().url(),
  }),
});

export const VolcengineVideoToVideoLipSyncRequestSchema = z.object({
  model: z.literal("volcengine/video-to-video-lip-sync"),
  callBackUrl: z.string().optional(),
  input: z.object({
    mode: VolcengineVideoToVideoLipSyncModeSchema,
    video_url: z.string().min(1),
    audio_url: z.string().min(1),
    separate_vocal: z.boolean().default(false),
    open_scenedet: z.boolean().default(false),
    align_audio: z.boolean().default(true),
    align_audio_reverse: z.boolean().default(false),
    templ_start_seconds: z.number().min(0).default(0),
  }),
});

const GeminiOmniVideoListItemSchema = z
  .object({
    url: z.string().url(),
    start: z.number().min(0),
    ends: z.number().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.ends <= value.start) {
      ctx.addIssue({
        code: "custom",
        message: "ends must be greater than start",
        path: ["ends"],
      });
    }

    if (value.ends - value.start >= 10) {
      ctx.addIssue({
        code: "custom",
        message: "video clip duration must be less than 10 seconds",
        path: ["ends"],
      });
    }
  });

export const GeminiOmniVideoRequestSchema = z
  .object({
    model: z.literal("gemini-omni-video"),
    callBackUrl: z.string().url().optional(),
    input: z.object({
      prompt: z.string().min(1).max(20000),
      image_urls: z.array(z.string().url()).max(7).optional(),
      audio_ids: z.array(z.string().min(1)).max(3).optional(),
      video_list: z.array(GeminiOmniVideoListItemSchema).max(1).optional(),
      character_ids: z.array(z.string().min(1)).max(3).optional(),
      duration: GeminiOmniVideoDurationSchema,
      aspect_ratio: GeminiOmniVideoAspectRatioSchema.optional(),
      seed: z.number().int().min(0).max(2147483647).optional(),
      resolution: GeminiOmniVideoResolutionSchema.default("720p"),
    }),
  })
  .superRefine((value, ctx) => {
    const imageUnits = value.input.image_urls?.length ?? 0;
    const videoUnits = (value.input.video_list?.length ?? 0) * 2;
    const characterUnits = value.input.character_ids?.length ?? 0;
    const quotaUnits = imageUnits + videoUnits + characterUnits;

    if (quotaUnits > 7) {
      ctx.addIssue({
        code: "custom",
        message:
          "gemini-omni-video quota exceeded: image_urls + video_list * 2 + character_ids must be <= 7",
        path: ["input", "image_urls"],
      });
    }
  });

export const ElevenLabsTextToSpeechNumericContract = {
  stability: { minimum: 0, maximum: 1, default: 0.5 },
  similarity_boost: { minimum: 0, maximum: 1, default: 0.75 },
  style: { minimum: 0, maximum: 1, default: 0 },
  speed: { minimum: 0.7, maximum: 1.2, default: 1 },
} as const;

export const ElevenLabsTextToDialogueStabilityContract = {
  values: [0, 0.5, 1],
  default: 0.5,
} as const;

const ElevenLabsTextToSpeechInputSchema = z.object({
  text: z.string().min(1),
  voice: z.string().min(1),
  stability: z
    .number()
    .min(ElevenLabsTextToSpeechNumericContract.stability.minimum)
    .max(ElevenLabsTextToSpeechNumericContract.stability.maximum)
    .default(ElevenLabsTextToSpeechNumericContract.stability.default),
  similarity_boost: z
    .number()
    .min(ElevenLabsTextToSpeechNumericContract.similarity_boost.minimum)
    .max(ElevenLabsTextToSpeechNumericContract.similarity_boost.maximum)
    .default(ElevenLabsTextToSpeechNumericContract.similarity_boost.default),
  style: z
    .number()
    .min(ElevenLabsTextToSpeechNumericContract.style.minimum)
    .max(ElevenLabsTextToSpeechNumericContract.style.maximum)
    .default(ElevenLabsTextToSpeechNumericContract.style.default),
  speed: z
    .number()
    .min(ElevenLabsTextToSpeechNumericContract.speed.minimum)
    .max(ElevenLabsTextToSpeechNumericContract.speed.maximum)
    .default(ElevenLabsTextToSpeechNumericContract.speed.default),
  timestamps: z.boolean().optional(),
  previous_text: z.string().optional(),
  next_text: z.string().optional(),
  language_code: z.string().optional(),
});

export const ElevenLabsAudioIsolationRequestSchema = z.object({
  model: z.literal("elevenlabs/audio-isolation"),
  callBackUrl: z.string().optional(),
  input: z.object({
    audio_url: z.string().min(1),
  }),
});

export const ElevenLabsTextToDialogueV3RequestSchema = z.object({
  model: z.literal("elevenlabs/text-to-dialogue-v3"),
  callBackUrl: z.string().optional(),
  input: z.object({
    dialogue: z
      .array(
        z.object({
          text: z.string().min(1),
          voice: z.string().min(1),
        })
      )
      .min(1),
    stability: z
      .union([
        z.literal(ElevenLabsTextToDialogueStabilityContract.values[0]),
        z.literal(ElevenLabsTextToDialogueStabilityContract.values[1]),
        z.literal(ElevenLabsTextToDialogueStabilityContract.values[2]),
      ])
      .default(ElevenLabsTextToDialogueStabilityContract.default),
  }),
});

export const ElevenLabsTextToSpeechMultilingualV2RequestSchema = z.object({
  model: z.literal("elevenlabs/text-to-speech-multilingual-v2"),
  callBackUrl: z.string().optional(),
  input: ElevenLabsTextToSpeechInputSchema,
});

export const ElevenLabsTextToSpeechTurbo25RequestSchema = z.object({
  model: z.literal("elevenlabs/text-to-speech-turbo-2-5"),
  callBackUrl: z.string().optional(),
  input: ElevenLabsTextToSpeechInputSchema,
});

export const ElevenLabsSoundEffectV2RequestSchema = z.object({
  model: z.literal("elevenlabs/sound-effect-v2"),
  callBackUrl: z.string().optional(),
  input: z.object({
    text: z.string(),
    loop: z.boolean().optional(),
    prompt_influence: z.number().optional(),
    output_format: z.string().optional(),
  }),
});

// Refines live on the outer request object (not the `input` sub-object) so
// that `input.*` fields remain introspectable by downstream tools that walk
// ZodArray/ZodObject defs (e.g. videocity's readSlotConstraints).
export const Wan27ImageToVideoRequestSchema = z
  .object({
    model: z.literal("wan/2-7-image-to-video"),
    callBackUrl: z.string().optional(),
    input: z.object({
      prompt: z.string().min(1).max(5000),
      negative_prompt: z.string().max(500).optional(),
      first_frame_url: z.string().optional(),
      last_frame_url: z.string().optional(),
      first_clip_url: z.string().optional(),
      driving_audio_url: z.string().optional(),
      resolution: Wan27ResolutionSchema.optional(),
      duration: z.number().int().min(2).max(15).optional(),
      prompt_extend: z.boolean().optional(),
      watermark: z.boolean().optional(),
      seed: z.number().int().min(0).max(2147483647).optional(),
      nsfw_checker: z.boolean().default(false),
    }),
  })
  .refine(
    (v) =>
      Boolean(v.input.first_frame_url) ||
      Boolean(v.input.last_frame_url) ||
      Boolean(v.input.first_clip_url),
    {
      message:
        "wan/2-7-image-to-video requires at least one of first_frame_url, last_frame_url, or first_clip_url",
      path: ["input", "first_frame_url"],
    }
  )
  .refine(
    (v) =>
      !(
        v.input.first_clip_url &&
        (v.input.first_frame_url || v.input.last_frame_url)
      ),
    {
      message:
        "wan/2-7-image-to-video does not accept first_clip_url combined with first_frame_url or last_frame_url",
      path: ["input", "first_clip_url"],
    }
  );

export const Wan27TextToVideoRequestSchema = z.object({
  model: z.literal("wan/2-7-text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    negative_prompt: z.string().max(500).optional(),
    audio_url: z.string().optional(),
    resolution: Wan27ResolutionSchema.optional(),
    ratio: Wan27AspectRatioSchema.optional(),
    duration: z.number().int().min(2).max(15).optional(),
    prompt_extend: z.boolean().optional(),
    watermark: z.boolean().optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Per-field max(5) on reference_image/reference_video; the combined-≤5 cap is
// enforced by callers (would require a wrapper-level refine, which would
// turn this into ZodEffects and break `.shape` introspection used by
// videocity's slot-constraint readers).
export const Wan27RefToVideoRequestSchema = z.object({
  model: z.literal("wan/2-7-r2v"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    negative_prompt: z.string().max(500).optional(),
    reference_image: z.array(z.string()).max(5).optional(),
    reference_video: z.array(z.string()).max(5).optional(),
    first_frame: z.string().optional(),
    reference_voice: z.string().optional(),
    resolution: Wan27ResolutionSchema.optional(),
    aspect_ratio: Wan27AspectRatioSchema.optional(),
    duration: z.number().int().min(2).max(10).optional(),
    prompt_extend: z.boolean().optional(),
    watermark: z.boolean().optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

export const Wan27VideoEditRequestSchema = z.object({
  model: z.literal("wan/2-7-videoedit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().max(5000).optional(),
    negative_prompt: z.string().max(500).optional(),
    video_url: z.string().min(1),
    reference_image: z.string().optional(),
    resolution: Wan27ResolutionSchema.optional(),
    aspect_ratio: Wan27AspectRatioSchema.optional(),
    duration: Wan27VideoEditDurationSchema.optional(),
    audio_setting: Wan27AudioSettingSchema.optional(),
    prompt_extend: z.boolean().optional(),
    watermark: z.boolean().optional(),
    seed: z.number().int().min(0).max(2147483647).optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

const Wan27ImageInputShape = {
  prompt: z.string().min(1).max(5000),
  input_urls: z.array(z.string()).max(9).optional(),
  aspect_ratio: Wan27ImageAspectRatioSchema.default("16:9"),
  enable_sequential: z.boolean().optional(),
  n: z.number().int().min(1).max(12).optional(),
  resolution: Wan27ImageResolutionSchema.optional(),
  thinking_mode: z.boolean().optional(),
  color_palette: z
    .array(Wan27ImageColorPaletteSchema)
    .min(3)
    .max(10)
    .optional(),
  bbox_list: z
    .array(z.array(z.array(z.number().multipleOf(1)).length(4)).max(2))
    .optional(),
  watermark: z.boolean().optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
  nsfw_checker: z.boolean().default(false),
} as const;

const wan27ImageAspectRatioRequiresResolution = (v: {
  input: { aspect_ratio?: unknown; resolution?: unknown };
}): boolean =>
  v.input.aspect_ratio === undefined || v.input.resolution !== undefined;

const wan27ImageAspectRatioRefinement = {
  message: "aspect_ratio requires resolution",
  path: ["input", "resolution"] as Array<string | number>,
};

const wan27Image4KRequiresNonSequentialTextToImage = (v: {
  input: {
    resolution?: unknown;
    enable_sequential?: unknown;
    input_urls?: unknown;
  };
}): boolean => {
  if (v.input.resolution !== "4K") return true;
  if (v.input.enable_sequential === true) return false;
  const urls = v.input.input_urls;
  if (Array.isArray(urls) && urls.length > 0) return false;
  return true;
};

const wan27Image4KRefinement = {
  message: "resolution 4K is only supported for non-sequential text-to-image",
  path: ["input", "resolution"] as Array<string | number>,
};

export const Wan27ImageInputSchema = z.object(Wan27ImageInputShape);

const Wan27ImageRequestObjectSchema = z.object({
  model: z.literal("wan/2-7-image"),
  callBackUrl: z.string().optional(),
  input: Wan27ImageInputSchema,
});

const Wan27ImageProRequestObjectSchema = z.object({
  model: z.literal("wan/2-7-image-pro"),
  callBackUrl: z.string().optional(),
  input: Wan27ImageInputSchema,
});

export const Wan27ImageRequestSchema = Wan27ImageRequestObjectSchema.refine(
  wan27ImageAspectRatioRequiresResolution,
  wan27ImageAspectRatioRefinement
).refine(wan27Image4KRequiresNonSequentialTextToImage, wan27Image4KRefinement);

export const Wan27ImageProRequestSchema =
  Wan27ImageProRequestObjectSchema.refine(
    wan27ImageAspectRatioRequiresResolution,
    wan27ImageAspectRatioRefinement
  ).refine(
    wan27Image4KRequiresNonSequentialTextToImage,
    wan27Image4KRefinement
  );

// ---------------------------------------------------------------------------
// WAN alias-accepted createTask models (not in KIE_MEDIA_MODELS; they match
// KieMediaWanModelAliasSchema and need per-model request members so
// CreateTaskRequestSchema / MediaGenerationRequestSchema accept them).
// Docs: https://docs.kie.ai/market/wan/
// ---------------------------------------------------------------------------

export const Wan22A14bTurboResolutionSchema = z.enum(["480p", "720p"]);
export const Wan22A14bTurboAccelerationSchema = z.enum(["none", "regular"]);
export const Wan22A14bTurboAspectRatioSchema = z.enum(["16:9", "9:16"]);
export const Wan22ExtendedResolutionSchema = z.enum(["480p", "580p", "720p"]);
export const Wan25DurationSchema = z.enum(["5", "10"]);
export const Wan25ResolutionSchema = z.enum(["720p", "1080p"]);
export const Wan25AspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);
export const Wan26DurationSchema = z.enum(["5", "10", "15"]);
export const Wan26VideoDurationSchema = z.enum(["5", "10"]);
export const Wan26ResolutionSchema = z.enum(["720p", "1080p"]);

const wanSeedField = z.number().int().min(0).max(2147483647).optional();

// Docs: https://docs.kie.ai/market/wan/2-2-a14b-image-to-video-turbo
export const Wan22A14bImageToVideoTurboRequestSchema = z.object({
  model: z.literal("wan/2-2-a14b-image-to-video-turbo"),
  callBackUrl: z.string().optional(),
  input: z.object({
    image_url: z.string().min(1),
    prompt: z.string().min(1).max(5000),
    resolution: Wan22A14bTurboResolutionSchema.default("720p"),
    enable_prompt_expansion: z.boolean().optional(),
    seed: wanSeedField,
    acceleration: Wan22A14bTurboAccelerationSchema.default("none"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-2-a14b-speech-to-video-turbo
export const Wan22A14bSpeechToVideoTurboRequestSchema = z.object({
  model: z.literal("wan/2-2-a14b-speech-to-video-turbo"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    image_url: z.string().min(1),
    audio_url: z.string().min(1),
    num_frames: z.number().int().min(40).max(120).default(80),
    frames_per_second: z.number().int().min(4).max(60).default(16),
    resolution: Wan22ExtendedResolutionSchema.default("480p"),
    negative_prompt: z.string().max(500).optional(),
    seed: wanSeedField,
    num_inference_steps: z.number().int().min(2).max(40).default(27),
    guidance_scale: z.number().min(1).max(10).default(3.5),
    shift: z.number().min(1).max(10).default(5),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-2-a14b-text-to-video-turbo
export const Wan22A14bTextToVideoTurboRequestSchema = z.object({
  model: z.literal("wan/2-2-a14b-text-to-video-turbo"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    resolution: Wan22A14bTurboResolutionSchema.default("720p"),
    aspect_ratio: Wan22A14bTurboAspectRatioSchema.default("16:9"),
    enable_prompt_expansion: z.boolean().optional(),
    seed: wanSeedField,
    acceleration: Wan22A14bTurboAccelerationSchema.default("none"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-2-animate-move
export const Wan22AnimateMoveRequestSchema = z.object({
  model: z.literal("wan/2-2-animate-move"),
  callBackUrl: z.string().optional(),
  input: z.object({
    video_url: z.string().min(1),
    image_url: z.string().min(1),
    resolution: Wan22ExtendedResolutionSchema.default("480p"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-2-animate-replace
export const Wan22AnimateReplaceRequestSchema = z.object({
  model: z.literal("wan/2-2-animate-replace"),
  callBackUrl: z.string().optional(),
  input: z.object({
    video_url: z.string().min(1),
    image_url: z.string().min(1),
    resolution: Wan22ExtendedResolutionSchema.default("480p"),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-5-image-to-video
// duration is required with no OpenAPI default — keep required without
// `.default()` (documented-defaults trap).
export const Wan25ImageToVideoRequestSchema = z.object({
  model: z.literal("wan/2-5-image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(800),
    image_url: z.string().min(1),
    duration: Wan25DurationSchema,
    resolution: Wan25ResolutionSchema.optional(),
    negative_prompt: z.string().max(500).optional(),
    enable_prompt_expansion: z.boolean().optional(),
    seed: wanSeedField,
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-5-text-to-video
export const Wan25TextToVideoRequestSchema = z.object({
  model: z.literal("wan/2-5-text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(800),
    duration: Wan25DurationSchema,
    aspect_ratio: Wan25AspectRatioSchema.optional(),
    resolution: Wan25ResolutionSchema.optional(),
    negative_prompt: z.string().max(500).optional(),
    enable_prompt_expansion: z.boolean().optional(),
    seed: wanSeedField,
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-6-flash-image-to-video
// `audio` is required (pricing differs with/without sound); no default.
export const Wan26FlashImageToVideoRequestSchema = z.object({
  model: z.literal("wan/2-6-flash-image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(2).max(1500),
    image_urls: z.array(z.string().min(1)).min(1).max(1),
    duration: Wan26DurationSchema.default("5"),
    resolution: Wan26ResolutionSchema.default("1080p"),
    audio: z.boolean(),
    multi_shots: z.boolean().optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-6-flash-video-to-video
export const Wan26FlashVideoToVideoRequestSchema = z.object({
  model: z.literal("wan/2-6-flash-video-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(2).max(1500),
    video_urls: z.array(z.string().min(1)).min(1).max(3),
    duration: Wan26VideoDurationSchema.default("5"),
    resolution: Wan26ResolutionSchema.default("1080p"),
    audio: z.boolean().optional(),
    multi_shots: z.boolean().optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-6-image-to-video
export const Wan26ImageToVideoRequestSchema = z.object({
  model: z.literal("wan/2-6-image-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(2).max(5000),
    image_urls: z.array(z.string().min(1)).min(1).max(1),
    duration: Wan26DurationSchema.default("5"),
    resolution: Wan26ResolutionSchema.default("1080p"),
    multi_shots: z.boolean().default(false),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-6-text-to-video
export const Wan26TextToVideoRequestSchema = z.object({
  model: z.literal("wan/2-6-text-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    duration: Wan26DurationSchema.default("5"),
    resolution: Wan26ResolutionSchema.default("1080p"),
    multi_shots: z.boolean().default(false),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/wan/2-6-video-to-video
export const Wan26VideoToVideoRequestSchema = z.object({
  model: z.literal("wan/2-6-video-to-video"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(2).max(5000),
    video_urls: z.array(z.string().min(1)).min(1).max(3),
    duration: Wan26VideoDurationSchema.default("5"),
    resolution: Wan26ResolutionSchema.default("1080p"),
    multi_shots: z.boolean().default(false),
    nsfw_checker: z.boolean().default(false),
  }),
});

// PixVerse V6 shared value domains. Every model in the family draws prompt,
// quality, duration, and seed from these same ranges, and the two that expose
// aspect_ratio (text-to-video, reference-to-video) share its eight values, so
// each domain is spelled out once here rather than per model.
const PixverseV6PromptSchema = z.string().min(3).max(5000);
const PixverseV6QualitySchema = z.enum(["360p", "540p", "720p", "1080p"]);
const PixverseV6AspectRatioSchema = z.enum([
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "2:3",
  "3:2",
  "21:9",
]);
const PixverseV6DurationSchema = z.number().int().min(1).max(15);
const PixverseV6SeedSchema = z.number().int().min(0).max(2147483647);

// PixVerse V6 text-to-video. The upstream spec documents defaults for
// aspect_ratio (16:9), quality (720p), and duration (5) yet still marks them
// required — the server never applies documented defaults (the same trap
// seedream/seedance hit), so the schema keeps them required and records the
// defaults only in the modelInputSchemas registry metadata. The same holds for
// every PixVerse V6 model below.
export const PixverseV6TextToVideoInputSchema = z.object({
  prompt: PixverseV6PromptSchema,
  aspect_ratio: PixverseV6AspectRatioSchema,
  quality: PixverseV6QualitySchema,
  duration: PixverseV6DurationSchema,
  generate_audio_switch: z.boolean().default(false),
  generate_multi_clip_switch: z.boolean().default(false),
  seed: PixverseV6SeedSchema.optional(),
});

export const PixverseV6TextToVideoRequestSchema = z.object({
  model: z.literal("pixverse-v6/text-to-video"),
  callBackUrl: z.string().url().optional(),
  input: PixverseV6TextToVideoInputSchema,
});

// PixVerse V6 image-to-video. Upstream carries no aspect_ratio field here, and
// duration is exclusive with template_id: a template fixes the duration, so
// passing both is rejected. image_urls' 1..2 bounds are an SDK-side tightening
// — upstream encodes neither minItems nor maxItems and states "up to 2" only
// in prose.
export const PixverseV6ImageToVideoInputSchema = z.object({
  prompt: PixverseV6PromptSchema,
  image_urls: z.array(z.string().url()).min(1).max(2),
  quality: PixverseV6QualitySchema,
  duration: PixverseV6DurationSchema.optional(),
  template_id: z.string().min(1).optional(),
  generate_audio_switch: z.boolean().default(false),
  generate_multi_clip_switch: z.boolean().default(false),
  seed: PixverseV6SeedSchema.optional(),
});

export const PixverseV6ImageToVideoRequestSchema = z
  .object({
    model: z.literal("pixverse-v6/image-to-video"),
    callBackUrl: z.string().url().optional(),
    input: PixverseV6ImageToVideoInputSchema,
  })
  .superRefine((v, ctx) => {
    // Presence, not truthiness: `Boolean(0)` would read a supplied
    // `duration: 0` as absent and emit a spurious exclusivity issue on top of
    // the range failure. (The grok-imagine precedent above uses
    // `Boolean(image_urls?.length)` because there an empty array *is* absent —
    // not the same case.)
    const hasDuration = v.input.duration !== undefined;
    const hasTemplateId = v.input.template_id !== undefined;

    if (hasDuration === hasTemplateId) {
      ctx.addIssue({
        code: "custom",
        message:
          "pixverse-v6/image-to-video requires exactly one of duration or template_id",
        path: ["input", "duration"],
      });
    }
  });

// PixVerse V6 first & last frame transition. No aspect_ratio and no
// generate_multi_clip_switch upstream; both frame URLs are required.
export const PixverseV6TransitionInputSchema = z.object({
  prompt: PixverseV6PromptSchema,
  first_frame_image_url: z.string().url(),
  last_frame_image_url: z.string().url(),
  quality: PixverseV6QualitySchema,
  duration: PixverseV6DurationSchema,
  generate_audio_switch: z.boolean().default(false),
  seed: PixverseV6SeedSchema.optional(),
});

export const PixverseV6TransitionRequestSchema = z.object({
  model: z.literal("pixverse-v6/transition"),
  callBackUrl: z.string().url().optional(),
  input: PixverseV6TransitionInputSchema,
});

// PixVerse V6 extend. The camelCase `taskId` beside snake_case `video_url` is
// upstream's own inconsistency, reproduced verbatim because renaming it would
// silently produce 422s. Upstream encodes the exclusivity as a two-variant
// anyOf, and its prose calls the two fields "mutually exclusive"; the
// refinement below is that rule. generate_audio_switch is optional rather than
// defaulted here: extend is the one model in the family for which upstream
// documents no default for it.
export const PixverseV6ExtendInputSchema = z.object({
  prompt: PixverseV6PromptSchema,
  duration: PixverseV6DurationSchema,
  quality: PixverseV6QualitySchema,
  taskId: z.string().min(1).optional(),
  video_url: z.string().url().optional(),
  generate_audio_switch: z.boolean().optional(),
  seed: PixverseV6SeedSchema.optional(),
});

export const PixverseV6ExtendRequestSchema = z
  .object({
    model: z.literal("pixverse-v6/extend"),
    callBackUrl: z.string().url().optional(),
    input: PixverseV6ExtendInputSchema,
  })
  .superRefine((v, ctx) => {
    if ((v.input.taskId !== undefined) === (v.input.video_url !== undefined)) {
      ctx.addIssue({
        code: "custom",
        message:
          "pixverse-v6/extend requires exactly one of taskId or video_url",
        path: ["input", "video_url"],
      });
    }
  });

const PixverseV6ImageReferenceSchema = z.object({
  image_url: z.string().url(),
  type: z.enum(["subject", "background"]).default("subject"),
  ref_name: z.string().min(1).max(30).optional(),
});

// PixVerse V6 reference-to-video. aspect_ratio and quality are required here
// even though both document defaults — upstream's required array wins.
export const PixverseV6ReferenceToVideoInputSchema = z.object({
  prompt: PixverseV6PromptSchema,
  image_references: z.array(PixverseV6ImageReferenceSchema).min(1).max(7),
  aspect_ratio: PixverseV6AspectRatioSchema,
  quality: PixverseV6QualitySchema,
  duration: PixverseV6DurationSchema,
  generate_audio_switch: z.boolean().default(false),
  seed: PixverseV6SeedSchema.optional(),
});

export const PixverseV6ReferenceToVideoRequestSchema = z
  .object({
    model: z.literal("pixverse-v6/reference-to-video"),
    callBackUrl: z.string().url().optional(),
    input: PixverseV6ReferenceToVideoInputSchema,
  })
  .superRefine((v, ctx) => {
    // Upstream: "ref_name must be unique within the same list." A duplicate
    // makes an `@name` mention in the prompt ambiguous. Unnamed references are
    // not compared — ref_name is optional, so any number may be omitted.
    const seen = new Set<string>();

    for (const [index, reference] of v.input.image_references.entries()) {
      const refName = reference.ref_name;
      if (refName === undefined) continue;

      if (seen.has(refName)) {
        ctx.addIssue({
          code: "custom",
          message: `pixverse-v6/reference-to-video requires unique ref_name values within image_references (duplicate: ${refName})`,
          path: ["input", "image_references", index, "ref_name"],
        });
      }

      seen.add(refName);
    }
  });

export const MiniMaxH3TextToVideoInputSchema = z
  .object({
    prompt: MiniMaxH3PromptSchema,
    aspect_ratio: MiniMaxH3FixedAspectRatioSchema,
    duration: MiniMaxH3DurationSchema,
    resolution: MiniMaxH3ResolutionSchema.optional(),
  })
  .strict();

export const MiniMaxH3TextToVideoRequestSchema = z.object({
  model: z.literal("minimax-h3/text-to-video"),
  callBackUrl: z.string().url().optional(),
  input: MiniMaxH3TextToVideoInputSchema,
});

export const MiniMaxH3ImageToVideoInputSchema = z
  .object({
    prompt: MiniMaxH3PromptSchema,
    first_frame_url: MiniMaxH3MediaAddressSchema.optional(),
    last_frame_url: MiniMaxH3MediaAddressSchema.optional(),
    duration: MiniMaxH3DurationSchema,
    resolution: MiniMaxH3ResolutionSchema.optional(),
  })
  .strict();

export const MiniMaxH3ImageToVideoRequestSchema = z
  .object({
    model: z.literal("minimax-h3/image-to-video"),
    callBackUrl: z.string().url().optional(),
    input: MiniMaxH3ImageToVideoInputSchema,
  })
  .superRefine((value, ctx) => {
    if (
      value.input.first_frame_url === undefined &&
      value.input.last_frame_url === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one of input.first_frame_url or input.last_frame_url is required",
        path: ["input", "first_frame_url"],
      });
    }
  });

export const MiniMaxH3ReferenceToVideoInputSchema = z
  .object({
    prompt: MiniMaxH3PromptSchema,
    reference_image_urls: z
      .array(MiniMaxH3MediaAddressSchema)
      .max(9)
      .optional(),
    reference_video_urls: z
      .array(MiniMaxH3MediaAddressSchema)
      .max(3)
      .optional(),
    reference_audio_urls: z
      .array(MiniMaxH3MediaAddressSchema)
      .max(3)
      .optional(),
    aspect_ratio: MiniMaxH3ReferenceAspectRatioSchema.optional(),
    duration: MiniMaxH3DurationSchema,
    resolution: MiniMaxH3ResolutionSchema.optional(),
  })
  .strict();

export const MiniMaxH3ReferenceToVideoRequestSchema = z
  .object({
    model: z.literal("minimax-h3/reference-to-video"),
    callBackUrl: z.string().url().optional(),
    input: MiniMaxH3ReferenceToVideoInputSchema,
  })
  .superRefine((value, ctx) => {
    const hasImageReference = Boolean(value.input.reference_image_urls?.length);
    const hasVideoReference = Boolean(value.input.reference_video_urls?.length);

    if (!hasImageReference && !hasVideoReference) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one non-empty input.reference_image_urls or input.reference_video_urls array is required",
        path: ["input", "reference_image_urls"],
      });
    }
  });

// Google Gemini TTS createTask models share one input shape. Sources:
// - https://docs.kie.ai/google/gemini-2-5-pro-tts
// - https://docs.kie.ai/market/google/gemini-3-1-flash-tts
//
// temperature is optional with a documented default of 1; the SDK enforces the
// 0–2 range without injecting the default on parse so createTask preserves an
// omitted field. speakers[].speaker_id must be "Speaker N"; text is capped at
// GoogleGeminiTtsDialogueTextMaxLength.
export const GoogleGeminiTtsSpeakerSchema = z
  .object({
    speaker_id: GoogleGeminiTtsSpeakerIdSchema,
    voice_name: GoogleGeminiTtsVoiceNameSchema,
    audio_profile: z.string().optional(),
    accent: GoogleGeminiTtsAccentSchema,
    style: GoogleGeminiTtsStyleSchema.optional(),
    pace: GoogleGeminiTtsPaceSchema.optional(),
  })
  .strict();

export const GoogleGeminiTtsDialogueTurnSchema = z
  .object({
    speaker_id: GoogleGeminiTtsSpeakerIdSchema,
    text: z.string().min(1).max(GoogleGeminiTtsDialogueTextMaxLength),
  })
  .strict();

export const GoogleGeminiTtsInputSchema = z
  .object({
    temperature: z
      .number()
      .min(GoogleGeminiTtsTemperatureContract.minimum)
      .max(GoogleGeminiTtsTemperatureContract.maximum)
      .optional(),
    scene: z.string().optional(),
    sample_context: z.string().optional(),
    speakers: z.array(GoogleGeminiTtsSpeakerSchema).min(1),
    dialogue_turns: z.array(GoogleGeminiTtsDialogueTurnSchema).min(1),
  })
  .strict();

export const GoogleGemini25ProTtsRequestSchema = z.object({
  model: z.literal("google/gemini-2-5-pro-tts"),
  callBackUrl: z.string().url().optional(),
  input: GoogleGeminiTtsInputSchema,
});

export const GoogleGemini31FlashTtsRequestSchema = z.object({
  model: z.literal("google/gemini-3-1-flash-tts"),
  callBackUrl: z.string().url().optional(),
  input: GoogleGeminiTtsInputSchema,
});

// ---------------------------------------------------------------------------
// Google Imagen 4 + namespaced Nano Banana createTask models
// Docs: https://docs.kie.ai/market/google/imagen4 and siblings
// Note: these are `google/…` market ids (enum-only). Flat `nano-banana-*` ids
// already live elsewhere in this file under the Nano Banana alias family.
// ---------------------------------------------------------------------------

// Imagen 4 aspect ratios (shared by imagen4 / imagen4-fast / imagen4-ultra).
export const GoogleImagen4AspectRatioSchema = z.enum([
  "1:1",
  "16:9",
  "9:16",
  "3:4",
  "4:3",
  "auto",
]);

// imagen4 + imagen4-ultra: seed is a free-form string (max 500).
// imagen4-fast OpenAPI types seed as integer instead.
const GoogleImagen4StringSeedInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  negative_prompt: z.string().max(5000).optional(),
  aspect_ratio: GoogleImagen4AspectRatioSchema.optional(),
  seed: z.string().max(500).optional(),
});

const GoogleImagen4FastInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  negative_prompt: z.string().max(5000).optional(),
  aspect_ratio: GoogleImagen4AspectRatioSchema.optional(),
  seed: z.number().int().optional(),
});

// Docs: https://docs.kie.ai/market/google/imagen4
export const GoogleImagen4RequestSchema = z.object({
  model: z.literal("google/imagen4"),
  callBackUrl: z.string().optional(),
  input: GoogleImagen4StringSeedInputSchema,
});

// Docs: https://docs.kie.ai/market/google/imagen4-fast
export const GoogleImagen4FastRequestSchema = z.object({
  model: z.literal("google/imagen4-fast"),
  callBackUrl: z.string().optional(),
  input: GoogleImagen4FastInputSchema,
});

// Docs: https://docs.kie.ai/market/google/imagen4-ultra
export const GoogleImagen4UltraRequestSchema = z.object({
  model: z.literal("google/imagen4-ultra"),
  callBackUrl: z.string().optional(),
  input: GoogleImagen4StringSeedInputSchema,
});

// Namespaced google/nano-banana* (distinct from flat nano-banana-*).
export const GoogleNanoBananaAspectRatioSchema = z.enum([
  "1:1",
  "9:16",
  "16:9",
  "3:4",
  "4:3",
  "3:2",
  "2:3",
  "5:4",
  "4:5",
  "21:9",
  "auto",
]);

// OpenAPI uses `jpeg` (not `jpg`) for these namespaced google models.
export const GoogleNanoBananaOutputFormatSchema = z.enum(["png", "jpeg"]);

// Docs: https://docs.kie.ai/market/google/nano-banana
export const GoogleNanoBananaRequestSchema = z.object({
  model: z.literal("google/nano-banana"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    output_format: GoogleNanoBananaOutputFormatSchema.optional(),
    aspect_ratio: GoogleNanoBananaAspectRatioSchema.optional(),
    // Deprecated upstream in favor of aspect_ratio; still accepted for wire
    // compatibility with older clients / docs examples.
    image_size: GoogleNanoBananaAspectRatioSchema.optional(),
    nsfw_checker: z.boolean().optional(),
  }),
});

// Docs: https://docs.kie.ai/market/google/nano-banana-edit
export const GoogleNanoBananaEditRequestSchema = z.object({
  model: z.literal("google/nano-banana-edit"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    // 1–10 reference image URLs after upload (jpeg/png/webp, max 10 MB each).
    image_urls: z.array(z.string()).min(1).max(10),
    output_format: GoogleNanoBananaOutputFormatSchema.optional(),
    aspect_ratio: GoogleNanoBananaAspectRatioSchema.optional(),
    // Deprecated upstream in favor of aspect_ratio; still accepted for wire
    // compatibility with older clients / docs examples.
    image_size: GoogleNanoBananaAspectRatioSchema.optional(),
  }),
});

// Topaz upscale factor is a string enum in the upstream OpenAPI (not a number):
// "1" | "2" | "4". Shared by both Topaz createTask models.
// Docs: https://docs.kie.ai/market/topaz/image-upscale
// Docs: https://docs.kie.ai/market/topaz/video-upscale
export const TopazUpscaleFactorSchema = z.enum(["1", "2", "4"]);

export const TopazImageUpscaleRequestSchema = z.object({
  model: z.literal("topaz/image-upscale"),
  callBackUrl: z.string().optional(),
  input: z.object({
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    // Required by the image-upscale OpenAPI `required` list (documented default
    // is "2", but omitting still fails upstream validation).
    upscale_factor: TopazUpscaleFactorSchema,
  }),
});

export const TopazVideoUpscaleRequestSchema = z.object({
  model: z.literal("topaz/video-upscale"),
  callBackUrl: z.string().optional(),
  input: z.object({
    // File URL after upload (mp4/quicktime/mkv, max 50 MB) — not file content.
    video_url: z.string().min(1),
    // Optional on video-upscale; documented default is "2".
    upscale_factor: TopazUpscaleFactorSchema.optional(),
  }),
});

// Infinitalk talking-head video from a portrait + audio drive.
// Docs: https://docs.kie.ai/market/infinitalk/from-audio
export const InfinitalkFromAudioResolutionSchema = z.enum(["480p", "720p"]);

export const InfinitalkFromAudioRequestSchema = z.object({
  model: z.literal("infinitalk/from-audio"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    // File URL after upload (mpeg/wav/aac/mp4/ogg, max 10 MB) — not file content.
    audio_url: z.string().min(1),
    prompt: z.string().min(1).max(5000),
    // Optional; documented default is "480p".
    resolution: InfinitalkFromAudioResolutionSchema.optional(),
    // Documented valid range is 10000–1000000.
    seed: z.number().int().min(10000).max(1000000).optional(),
  }),
});

// Z-Image text-to-image singleton.
// Docs: https://docs.kie.ai/market/z-image/z-image
export const ZImageAspectRatioSchema = z.enum([
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
]);

export const ZImageRequestSchema = z.object({
  model: z.literal("z-image"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(1000),
    // Required by the OpenAPI `required` list (documented default is "1:1").
    aspect_ratio: ZImageAspectRatioSchema,
    // Optional; documented default is false.
    nsfw_checker: z.boolean().default(false),
  }),
});

// Ideogram createTask models — enum-only vendor (no alias hatch).
// Docs: https://docs.kie.ai/market/ideogram/v3-text-to-image
// Docs: https://docs.kie.ai/market/ideogram/v3-edit
// Docs: https://docs.kie.ai/market/ideogram/v3-remix
// Docs: https://docs.kie.ai/market/ideogram/character
// Docs: https://docs.kie.ai/market/ideogram/character-edit
// Docs: https://docs.kie.ai/market/ideogram/character-remix
export const IdeogramRenderingSpeedSchema = z.enum([
  "TURBO",
  "BALANCED",
  "QUALITY",
]);

export const IdeogramImageSizeSchema = z.enum([
  "square",
  "square_hd",
  "portrait_4_3",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_16_9",
]);

// Numeric-string enum per OpenAPI (`"1"` | `"2"` | `"3"` | `"4"`).
export const IdeogramNumImagesSchema = z.enum(["1", "2", "3", "4"]);

// V3 style surface (text-to-image / remix). Cannot be used with style_codes.
export const IdeogramV3StyleSchema = z.enum([
  "AUTO",
  "GENERAL",
  "REALISTIC",
  "DESIGN",
]);

// Character style surface (character / character-edit / character-remix).
export const IdeogramCharacterStyleSchema = z.enum([
  "AUTO",
  "REALISTIC",
  "FICTION",
]);

export const IdeogramV3TextToImageRequestSchema = z.object({
  model: z.literal("ideogram/v3-text-to-image"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    rendering_speed: IdeogramRenderingSpeedSchema.optional(),
    style: IdeogramV3StyleSchema.optional(),
    expand_prompt: z.boolean().optional(),
    image_size: IdeogramImageSizeSchema.optional(),
    seed: z.number().int().optional(),
    negative_prompt: z.string().max(5000).optional(),
  }),
});

export const IdeogramV3EditRequestSchema = z.object({
  model: z.literal("ideogram/v3-edit"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    mask_url: z.string().min(1),
    rendering_speed: IdeogramRenderingSpeedSchema.optional(),
    expand_prompt: z.boolean().optional(),
    seed: z.number().int().optional(),
  }),
});

export const IdeogramV3RemixRequestSchema = z.object({
  model: z.literal("ideogram/v3-remix"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    rendering_speed: IdeogramRenderingSpeedSchema.optional(),
    style: IdeogramV3StyleSchema.optional(),
    expand_prompt: z.boolean().optional(),
    image_size: IdeogramImageSizeSchema.optional(),
    num_images: IdeogramNumImagesSchema.optional(),
    seed: z.number().int().optional(),
    // Documented range 0.01–1 step 0.01.
    strength: z.number().min(0.01).max(1).optional(),
    negative_prompt: z.string().max(5000).optional(),
  }),
});

export const IdeogramCharacterRequestSchema = z.object({
  model: z.literal("ideogram/character"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    // Currently only 1 image is supported; rest ignored. Total size max 10 MB.
    reference_image_urls: z.array(z.string().min(1)).min(1),
    rendering_speed: IdeogramRenderingSpeedSchema.optional(),
    style: IdeogramCharacterStyleSchema.optional(),
    expand_prompt: z.boolean().optional(),
    num_images: IdeogramNumImagesSchema.optional(),
    image_size: IdeogramImageSizeSchema.optional(),
    seed: z.number().int().optional(),
    negative_prompt: z.string().max(5000).optional(),
  }),
});

export const IdeogramCharacterEditRequestSchema = z.object({
  model: z.literal("ideogram/character-edit"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    mask_url: z.string().min(1),
    // Currently only 1 image is supported; rest ignored. Total size max 10 MB.
    reference_image_urls: z.array(z.string().min(1)).min(1),
    rendering_speed: IdeogramRenderingSpeedSchema.optional(),
    style: IdeogramCharacterStyleSchema.optional(),
    expand_prompt: z.boolean().optional(),
    num_images: IdeogramNumImagesSchema.optional(),
    seed: z.number().int().optional(),
  }),
});

export const IdeogramCharacterRemixRequestSchema = z.object({
  model: z.literal("ideogram/character-remix"),
  callBackUrl: z.string().url().optional(),
  input: z.object({
    prompt: z.string().min(1).max(5000),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    // Currently only 1 image is supported; rest ignored. Total size max 10 MB.
    reference_image_urls: z.array(z.string().min(1)).min(1),
    rendering_speed: IdeogramRenderingSpeedSchema.optional(),
    style: IdeogramCharacterStyleSchema.optional(),
    expand_prompt: z.boolean().optional(),
    image_size: IdeogramImageSizeSchema.optional(),
    num_images: IdeogramNumImagesSchema.optional(),
    seed: z.number().int().optional(),
    // Documented range 0.1–1 step 0.1.
    strength: z.number().min(0.1).max(1).optional(),
    // Character-remix OpenAPI caps negative_prompt at 500 (not 5000).
    negative_prompt: z.string().max(500).optional(),
    // Style reference image URLs (jpeg/png/webp, max 10 MB total).
    image_urls: z.array(z.string().min(1)).optional(),
    // OpenAPI types this as a string URL (empty string allowed in examples).
    reference_mask_urls: z.string().optional(),
  }),
});

// ---------------------------------------------------------------------------
// Flux-2 market createTask models (pro + flex, text/image to image)
// Docs: https://docs.kie.ai/market/flux2/pro-text-to-image and siblings
// Note: doc path segment is `flux2`; model ids are `flux-2/…`.
// ---------------------------------------------------------------------------

// Text-to-image aspect ratios (pro + flex share the same closed set; no auto).
export const Flux2TextToImageAspectRatioSchema = z.enum([
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
  "3:2",
  "2:3",
]);

// Image-to-image adds `auto` (match first input image ratio).
export const Flux2ImageToImageAspectRatioSchema = z.enum([
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
  "3:2",
  "2:3",
  "auto",
]);

export const Flux2ResolutionSchema = z.enum(["1K", "2K"]);

// Shared input shape for flux-2/*-text-to-image (pro and flex).
// OpenAPI marks prompt, aspect_ratio, and resolution required (documented
// defaults 1:1 / 1K). Keep them required without local defaults so callers
// choose. prompt length is 3–5000.
const Flux2TextToImageInputSchema = z.object({
  prompt: z.string().min(3).max(5000),
  aspect_ratio: Flux2TextToImageAspectRatioSchema,
  resolution: Flux2ResolutionSchema,
  nsfw_checker: z.boolean().default(false),
});

// Shared input shape for flux-2/*-image-to-image (pro and flex).
// input_urls is 1–8 reference image URLs after upload.
const Flux2ImageToImageInputSchema = z.object({
  input_urls: z.array(z.string()).min(1).max(8),
  prompt: z.string().min(3).max(5000),
  aspect_ratio: Flux2ImageToImageAspectRatioSchema,
  resolution: Flux2ResolutionSchema,
  nsfw_checker: z.boolean().default(false),
});

// Docs: https://docs.kie.ai/market/flux2/pro-text-to-image
export const Flux2ProTextToImageRequestSchema = z.object({
  model: z.literal("flux-2/pro-text-to-image"),
  callBackUrl: z.string().optional(),
  input: Flux2TextToImageInputSchema,
});

// Docs: https://docs.kie.ai/market/flux2/flex-text-to-image
export const Flux2FlexTextToImageRequestSchema = z.object({
  model: z.literal("flux-2/flex-text-to-image"),
  callBackUrl: z.string().optional(),
  input: Flux2TextToImageInputSchema,
});

// Docs: https://docs.kie.ai/market/flux2/pro-image-to-image
export const Flux2ProImageToImageRequestSchema = z.object({
  model: z.literal("flux-2/pro-image-to-image"),
  callBackUrl: z.string().optional(),
  input: Flux2ImageToImageInputSchema,
});

// Docs: https://docs.kie.ai/market/flux2/flex-image-to-image
export const Flux2FlexImageToImageRequestSchema = z.object({
  model: z.literal("flux-2/flex-image-to-image"),
  callBackUrl: z.string().optional(),
  input: Flux2ImageToImageInputSchema,
});

// ---------------------------------------------------------------------------
// Hailuo market createTask models (02 + 2-3, text/image to video)
// Docs: https://docs.kie.ai/market/hailuo/02-text-to-video-pro and siblings
// ---------------------------------------------------------------------------

// Duration is a numeric string enum on all Hailuo models that expose it.
// OpenAPI declares string "6" | "10"; keep exact strings (reject numbers).
export const HailuoDurationSchema = z.enum(["6", "10"]);

// 02-image-to-video-standard only (pro has no resolution field).
export const Hailuo02StandardResolutionSchema = z.enum(["512P", "768P"]);

// 2-3 image-to-video pro + standard.
export const Hailuo23ResolutionSchema = z.enum(["768P", "1080P"]);

// Shared: 10s is unsupported at 1080P (documented for 2-3 variants).
function refineHailuoNoTenSecondsAt1080P(
  input: { duration?: "6" | "10"; resolution?: "768P" | "1080P" },
  ctx: z.RefinementCtx
): void {
  if (input.duration === "10" && input.resolution === "1080P") {
    ctx.addIssue({
      code: "custom",
      message:
        "hailuo 2-3 image-to-video does not support 10 second videos at 1080P",
      path: ["duration"],
    });
  }
}

// Docs: https://docs.kie.ai/market/hailuo/02-text-to-video-pro
// Required: prompt (max 1500). Optional: prompt_optimizer, nsfw_checker.
export const Hailuo02TextToVideoProRequestSchema = z.object({
  model: z.literal("hailuo/02-text-to-video-pro"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(1500),
    prompt_optimizer: z.boolean().optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/hailuo/02-text-to-video-standard
// Required: prompt. Optional: duration (default "6"), prompt_optimizer,
// nsfw_checker. Do not inject duration default so createTask preserves omit.
export const Hailuo02TextToVideoStandardRequestSchema = z.object({
  model: z.literal("hailuo/02-text-to-video-standard"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(1500),
    duration: HailuoDurationSchema.optional(),
    prompt_optimizer: z.boolean().optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/hailuo/02-image-to-video-pro
// Required: prompt, image_url. Optional: end_image_url, prompt_optimizer,
// nsfw_checker. No duration/resolution fields on pro.
export const Hailuo02ImageToVideoProRequestSchema = z.object({
  model: z.literal("hailuo/02-image-to-video-pro"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(1500),
    // File URL after upload (jpeg/png/webp, max 10 MB) — not file content.
    image_url: z.string().min(1),
    end_image_url: z.string().min(1).optional(),
    prompt_optimizer: z.boolean().optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Docs: https://docs.kie.ai/market/hailuo/02-image-to-video-standard
// Required: prompt, image_url. Optional: end_image_url, duration (default
// "10"), resolution (512P|768P, default 768P), prompt_optimizer, nsfw_checker.
export const Hailuo02ImageToVideoStandardRequestSchema = z.object({
  model: z.literal("hailuo/02-image-to-video-standard"),
  callBackUrl: z.string().optional(),
  input: z.object({
    prompt: z.string().min(1).max(1500),
    image_url: z.string().min(1),
    end_image_url: z.string().min(1).optional(),
    duration: HailuoDurationSchema.optional(),
    resolution: Hailuo02StandardResolutionSchema.optional(),
    prompt_optimizer: z.boolean().optional(),
    nsfw_checker: z.boolean().default(false),
  }),
});

// Shared input for hailuo/2-3-image-to-video-{pro,standard}.
// Required: prompt (max 5000), image_url. Optional: duration (default "6"),
// resolution (768P|1080P, default 768P), nsfw_checker. No end_image_url or
// prompt_optimizer on 2-3.
const Hailuo23ImageToVideoInputSchema = z
  .object({
    prompt: z.string().min(1).max(5000),
    image_url: z.string().min(1),
    duration: HailuoDurationSchema.optional(),
    resolution: Hailuo23ResolutionSchema.optional(),
    nsfw_checker: z.boolean().default(false),
  })
  .superRefine(refineHailuoNoTenSecondsAt1080P);

// Docs: https://docs.kie.ai/market/hailuo/2-3-image-to-video-pro
export const Hailuo23ImageToVideoProRequestSchema = z.object({
  model: z.literal("hailuo/2-3-image-to-video-pro"),
  callBackUrl: z.string().optional(),
  input: Hailuo23ImageToVideoInputSchema,
});

// Docs: https://docs.kie.ai/market/hailuo/2-3-image-to-video-standard
export const Hailuo23ImageToVideoStandardRequestSchema = z.object({
  model: z.literal("hailuo/2-3-image-to-video-standard"),
  callBackUrl: z.string().optional(),
  input: Hailuo23ImageToVideoInputSchema,
});

// ---------------------------------------------------------------------------
// Wan 2.7 task result schemas (parsed from KieTaskInfoData.resultJson)
//
// kie wraps async task results in a JSON envelope on `resultJson`. Both image
// and video Wan 2.7 endpoints return the same shape: an array of result URLs
// (image URLs for image jobs; one video URL for video jobs) plus an optional
// passthrough `resultObject` for endpoint-specific metadata. Consumers should
// `JSON.parse(data.resultJson)` then validate with these.
// ---------------------------------------------------------------------------

export const Wan27TaskResultJsonSchema = z.object({
  resultUrls: z.array(z.string().url()).min(1),
  resultObject: z.record(z.string(), z.unknown()).optional(),
});

export const Wan27VideoResultSchema = Wan27TaskResultJsonSchema;
export const Wan27ImageResultSchema = Wan27TaskResultJsonSchema;

export const Seedance2MiniTaskResultJsonSchema = z
  .object({
    resultUrls: z.array(z.string().url()).optional(),
    resultObject: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) => v.resultUrls !== undefined || v.resultObject !== undefined, {
    message: "resultJson must include resultUrls or resultObject",
  });

export const Seedance2MiniRecordInfoDataSchema = z.object({
  taskId: z.string().min(1),
  model: z.literal("bytedance/seedance-2-mini"),
  state: Seedance2MiniTaskStateSchema,
  param: z.string().min(1),
  resultJson: z.string().optional(),
  failCode: z.string().nullable(),
  failMsg: z.string().nullable(),
  costTime: z.number().int().nullable(),
  completeTime: z.number().int().nullable(),
  createTime: z.number().int(),
});

export const Seedance2MiniRecordInfoResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: Seedance2MiniRecordInfoDataSchema.optional(),
});

export const RecordInfoRequestSchema = z.object({
  taskId: z.string().min(1),
});

export const Gpt4oImageRecordInfoDataSchema = z.object({
  taskId: z.string().optional(),
  paramJson: z.string().optional(),
  completeTime: z.number().int().nullable().optional(),
  response: z
    .object({
      resultUrls: z.array(z.string()).optional(),
    })
    .nullable()
    .optional(),
  successFlag: z.number().int().optional(),
  status: z
    .enum(["GENERATING", "SUCCESS", "CREATE_TASK_FAILED", "GENERATE_FAILED"])
    .optional(),
  errorCode: z.number().int().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createTime: z.number().int().nullable().optional(),
  progress: z.string().nullable().optional(),
});

export const Gpt4oImageRecordInfoResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: Gpt4oImageRecordInfoDataSchema.nullable().optional(),
});

export const TaskResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: z
    .object({
      taskId: z.string().min(1),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Upload schemas
// ---------------------------------------------------------------------------

const blobSchema = z.instanceof(Blob);

export const UploadMediaRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().min(1),
  uploadPath: z.string().min(1),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});

export const FileUrlUploadRequestSchema = z.object({
  fileUrl: z.string().min(1),
  uploadPath: z.string().min(1),
  fileName: z.string().optional(),
});

export const FileBase64UploadRequestSchema = z.object({
  base64Data: z.string().min(1),
  uploadPath: z.string().min(1),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Download URL
// ---------------------------------------------------------------------------

export const DownloadUrlRequestSchema = z.object({
  url: z.string().min(1),
});

// POST /api/v1/gpt4o-image/download-url — convert a 4o image URL to a
// temporary direct download URL (valid ~20 minutes). Distinct from the
// common download-url route, which only takes `url`.
export const Gpt4oImageDownloadUrlRequestSchema = z.object({
  taskId: z.string().min(1),
  url: z.string().min(1),
});

export const GeminiOmniAudioCreateRequestSchema = z.object({
  audio_id: GeminiOmniAudioVoiceIdSchema,
  name: z.string().min(1).max(210),
  voice_description: z.string().min(1).max(20000).optional(),
  example_dialogue: z.string().min(1).max(120).optional(),
});

export const GeminiOmniCharacterCreateRequestSchema = z.object({
  descriptions: z.string().min(1),
  image_urls: z.array(z.string().url()).min(1).max(1),
  audio_ids: z.array(z.string().min(1)).optional(),
  character_name: z.string().min(1).optional(),
});

export const GeminiOmniCharacterCreateDataSchema = z.object({
  characterId: z.string().min(1),
  characterName: z.string().min(1),
  imageUrl: z.string().url(),
});

export const GeminiOmniCharacterCreateResponseSchema = z.object({
  code: z.number().optional(),
  msg: z.string(),
  data: GeminiOmniCharacterCreateDataSchema.optional(),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const KieOptionsSchema = z.object({
  apiKey: z.string().min(1),
  baseURL: z.string().url().optional(),
  uploadBaseURL: z.string().url().optional(),
  timeout: z.number().int().positive().optional(),
  fetch: z
    .custom<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >()
    .optional(),
  // Pay-gate configuration (shared HMAC secret). Required to call paid
  // endpoints such as createTask; omitting it makes those calls fail closed.
  paygate: z.custom<PayGateConfig>().optional(),
});

const CreateTaskEnvelopeSchema = z.object({
  model: KieMediaModelSchema,
  callBackUrl: z.string().optional(),
  input: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// Sub-provider schemas: Veo
// ---------------------------------------------------------------------------

// kie ships new Veo point releases behind this endpoint before the enum
// catches up, so the enum below is unioned with an alias escape hatch. kie's
// Veo grammar is *underscored*: `veo<major>` followed by optional lowercase
// variant segments joined by `_`, e.g. veo3, veo3_fast, veo4_fast. That is a
// different grammar from googleflow's dotted `veo-3.1-fast`, so this alias is
// deliberately not a reuse of GoogleFlowVeoModelAliasSchema. An unnarrowed
// string hatch would accept the hyphenated typo `veo3-fast` and even
// `gpt-4o`; anything that is not an underscored kie Veo id must be added to
// the enum explicitly.
const KieVeoModelAliasSchema = z
  .string()
  .regex(
    /^veo\d+(?:_[a-z0-9]+)*$/,
    "Expected a listed model or an underscored kie Veo alias (e.g. veo4_fast)"
  );

// Closed quality/length vocabs: upstream documents a fixed set of resolution
// and duration values (not a model registry that ships new ids independently).
export const VeoResolutionSchema = z.enum(["720p", "1080p", "4k"]);
export const VeoDurationSchema = z.union([
  z.literal(4),
  z.literal(6),
  z.literal(8),
]);

export const VeoGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z
    .enum(["veo3", "veo3_fast", "veo3_lite"])
    .or(KieVeoModelAliasSchema)
    .optional(),
  aspectRatio: z.enum(["16:9", "9:16", "Auto"]).optional(),
  generationType: z
    .enum([
      "TEXT_2_VIDEO",
      "REFERENCE_2_VIDEO",
      "FIRST_AND_LAST_FRAMES_2_VIDEO",
    ])
    .optional(),
  imageUrls: z.array(z.string()).optional(),
  seeds: z.number().optional(),
  watermark: z.string().optional(),
  enableTranslation: z.boolean().optional(),
  // Docs: https://docs.kie.ai/veo3-api/generate-veo-3-video
  resolution: VeoResolutionSchema.optional(),
  duration: VeoDurationSchema.optional(),
  callBackUrl: z.string().optional(),
  // Deprecated upstream; still accepted for callers that send it.
  enableFallback: z.boolean().optional(),
});

export const VeoExtendRequestSchema = z.object({
  taskId: z.string().min(1),
  prompt: z.string().min(1),
  // Deliberately closed: `fast | quality` is a rendering-tier vocabulary, not
  // a model registry — the same counterexample class CLAUDE.md names alongside
  // `quality` and SimpleFunctionsModelSchema. Upstream does not ship new tiers
  // on its own cadence, so no alias hatch belongs here; a new tier is an
  // explicit enum addition.
  model: z.enum(["fast", "quality"]).optional(),
  seeds: z.number().optional(),
  watermark: z.string().optional(),
  // Docs: https://docs.kie.ai/veo3-api/extend-video
  callBackUrl: z.string().optional(),
});

export const VeoGet1080pVideoRequestSchema = z.object({
  taskId: z.string().min(1),
  index: z.number().int().min(0).optional(),
});

export const VeoGet1080pVideoResponseSchema = z.object({
  code: z.number(),
  msg: z.string().optional(),
  data: z
    .object({
      resultUrl: z.string().url(),
    })
    .nullable()
    .optional(),
});

// Docs: https://docs.kie.ai/veo3-api/get-veo-3-4k-video
// POST body (unlike 1080p which is GET + query). Additional credits; optional
// callBackUrl for completion notifications.
export const VeoGet4kVideoRequestSchema = z.object({
  taskId: z.string().min(1),
  index: z.number().int().min(0).optional(),
  callBackUrl: z.string().optional(),
});

export const VeoGet4kVideoResponseSchema = z.object({
  code: z.number(),
  msg: z.string().optional(),
  data: z
    .object({
      taskId: z.string().optional(),
      resultUrls: z.array(z.string()).nullable().optional(),
      imageUrls: z.array(z.string()).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const VeoRecordInfoRequestSchema = z.object({
  taskId: z.string().min(1),
});

// successFlag: 0 GENERATING, 1 SUCCESS, 2 CREATE_TASK_FAILED, 3 GENERATE_FAILED
export const VeoSuccessFlagSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const VeoRecordInfoResultSchema = z
  .object({
    taskId: z.string().optional(),
    resultUrls: z.array(z.string()).optional(),
    originUrls: z.array(z.string()).optional(),
    fullResultUrls: z.array(z.string()).optional(),
    resolution: z.string().optional(),
    mediaIds: z.array(z.string()).optional(),
  })
  .passthrough();

export const VeoRecordInfoDataSchema = z.object({
  taskId: z.string(),
  paramJson: z.string().optional(),
  completeTime: z.string().nullable().optional(),
  response: VeoRecordInfoResultSchema.nullable().optional(),
  successFlag: VeoSuccessFlagSchema,
  errorCode: z.union([z.number().int(), z.string()]).nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createTime: z.string().optional(),
  fallbackFlag: z.boolean().optional(),
});

export const VeoRecordInfoResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: VeoRecordInfoDataSchema.nullable().optional(),
});

export type VeoGenerateRequest = z.input<typeof VeoGenerateRequestSchema>;
export type VeoGenerateRequestInput = VeoGenerateRequest;
export type VeoGenerateParsedRequest = z.output<
  typeof VeoGenerateRequestSchema
>;
export type VeoExtendRequest = z.input<typeof VeoExtendRequestSchema>;
export type VeoExtendRequestInput = VeoExtendRequest;
export type VeoExtendParsedRequest = z.output<typeof VeoExtendRequestSchema>;
export type VeoGet1080pVideoRequest = z.input<
  typeof VeoGet1080pVideoRequestSchema
>;
export type VeoGet1080pVideoRequestInput = VeoGet1080pVideoRequest;
export type VeoGet1080pVideoParsedRequest = z.output<
  typeof VeoGet1080pVideoRequestSchema
>;
export type VeoGet1080pVideoResponse = z.output<
  typeof VeoGet1080pVideoResponseSchema
>;
export type VeoGet4kVideoRequest = z.input<typeof VeoGet4kVideoRequestSchema>;
export type VeoGet4kVideoRequestInput = VeoGet4kVideoRequest;
export type VeoGet4kVideoParsedRequest = z.output<
  typeof VeoGet4kVideoRequestSchema
>;
export type VeoGet4kVideoResponse = z.output<
  typeof VeoGet4kVideoResponseSchema
>;
export type VeoRecordInfoRequest = z.input<typeof VeoRecordInfoRequestSchema>;
export type VeoRecordInfoRequestInput = VeoRecordInfoRequest;
export type VeoRecordInfoParsedRequest = z.output<
  typeof VeoRecordInfoRequestSchema
>;
export type VeoSuccessFlag = z.infer<typeof VeoSuccessFlagSchema>;
export type VeoRecordInfoResult = z.infer<typeof VeoRecordInfoResultSchema>;
export type VeoRecordInfoData = z.infer<typeof VeoRecordInfoDataSchema>;
export type VeoRecordInfoResponse = z.infer<typeof VeoRecordInfoResponseSchema>;
export type VeoModel = "veo3" | "veo3_fast" | "veo3_lite";
export type VeoGenerationType =
  | "TEXT_2_VIDEO"
  | "REFERENCE_2_VIDEO"
  | "FIRST_AND_LAST_FRAMES_2_VIDEO";

// ---------------------------------------------------------------------------
// Flux Kontext schemas
// ---------------------------------------------------------------------------

export const FluxKontextAspectRatioSchema = z.enum([
  "21:9",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
]);

// Black Forest Labs adds Flux Kontext tiers before this package's enum catches
// up, so the enum below is unioned with an alias escape hatch. The grammar is
// the `flux-kontext-` family prefix followed by one or more lowercase
// alphanumeric variant segments, e.g. flux-kontext-pro, flux-kontext-max,
// flux-kontext-ultra. The trailing segment is the load-bearing part: an
// unnarrowed string hatch — or one that stopped at the family prefix — would
// accept the bare family name `flux-kontext` and the uppercased
// `FLUX-KONTEXT-PRO`. Anything that is not a variant-suffixed Flux Kontext id
// must be added to the enum explicitly.
const FluxKontextModelAliasSchema = z
  .string()
  .regex(
    /^flux-kontext-[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a Flux Kontext alias (e.g. flux-kontext-ultra)"
  );

const FLUX_KONTEXT_MODELS = ["flux-kontext-pro", "flux-kontext-max"] as const;

export const FluxKontextModelSchema = z
  .enum(FLUX_KONTEXT_MODELS)
  .or(FluxKontextModelAliasSchema);

export const FluxKontextGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  enableTranslation: z.boolean().optional(),
  uploadCn: z.boolean().optional(),
  // Required only for image-editing mode (edit the referenced image).
  inputImage: z.string().url().optional(),
  aspectRatio: FluxKontextAspectRatioSchema.optional(),
  outputFormat: z.enum(["jpeg", "png"]).optional(),
  promptUpsampling: z.boolean().optional(),
  model: FluxKontextModelSchema.optional(),
  callBackUrl: z.string().url().optional(),
  safetyTolerance: z.number().int().min(0).max(6).optional(),
  watermark: z.string().optional(),
});

export type FluxKontextGenerateRequest = z.input<
  typeof FluxKontextGenerateRequestSchema
>;
export type FluxKontextGenerateRequestInput = FluxKontextGenerateRequest;
export type FluxKontextGenerateParsedRequest = z.output<
  typeof FluxKontextGenerateRequestSchema
>;
// Written out rather than `z.infer<typeof FluxKontextModelSchema>`: the schema
// is `enum | alias`, and `z.infer` over that collapses to bare `string`, which
// silently drops both autocomplete and typo rejection for every consumer of
// this exported name. Restating the listed ids and mirroring the runtime hatch
// with `string & {}` keeps the schema and the type accepting the same values
// while the literals stay visible in editors. Same treatment for
// KieResponsesModel and KieGrokResponsesModel below; KieMediaModel is the one
// deliberate exception and says why at its own declaration.
export type FluxKontextModel =
  | (typeof FLUX_KONTEXT_MODELS)[number]
  | (string & {});
export type FluxKontextAspectRatio = z.infer<
  typeof FluxKontextAspectRatioSchema
>;

// successFlag: 0 GENERATING, 1 SUCCESS, 2 CREATE_TASK_FAILED, 3 GENERATE_FAILED
export const FluxKontextSuccessFlagSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const FluxKontextRecordInfoRequestSchema = z.object({
  taskId: z.string().min(1),
});

export const FluxKontextRecordInfoDataSchema = z.object({
  taskId: z.string(),
  paramJson: z.string().optional(),
  completeTime: z.string().nullable().optional(),
  response: z
    .object({
      originImageUrl: z.string().optional(),
      resultImageUrl: z.string().optional(),
    })
    .nullable()
    .optional(),
  successFlag: FluxKontextSuccessFlagSchema,
  errorCode: z.number().int().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createTime: z.string().optional(),
});

export const FluxKontextRecordInfoResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: FluxKontextRecordInfoDataSchema.nullable().optional(),
});

export type FluxKontextRecordInfoRequest = z.input<
  typeof FluxKontextRecordInfoRequestSchema
>;
export type FluxKontextRecordInfoRequestInput = FluxKontextRecordInfoRequest;
export type FluxKontextSuccessFlag = z.infer<
  typeof FluxKontextSuccessFlagSchema
>;
export type FluxKontextRecordInfoData = z.infer<
  typeof FluxKontextRecordInfoDataSchema
>;
export type FluxKontextRecordInfoResponse = z.infer<
  typeof FluxKontextRecordInfoResponseSchema
>;

// ---------------------------------------------------------------------------
// 4o Image schemas
// ---------------------------------------------------------------------------

export const Gpt4oImageSizeSchema = z.enum(["1:1", "3:2", "2:3"]);

export const Gpt4oImageFallbackModelSchema = z.enum([
  "GPT_IMAGE_1",
  "FLUX_MAX",
]);

export const Gpt4oImageGenerateRequestSchema = z
  .object({
    // One of `prompt` / `filesUrl` must be provided (enforced below).
    prompt: z.string().min(1).optional(),
    // Up to 5 reference image URLs.
    filesUrl: z.array(z.string().url()).max(5).optional(),
    size: Gpt4oImageSizeSchema,
    // Mask URL for inpainting: black = modify, white = preserve.
    maskUrl: z.string().url().optional(),
    callBackUrl: z.string().url().optional(),
    isEnhance: z.boolean().optional(),
    uploadCn: z.boolean().optional(),
    enableFallback: z.boolean().optional(),
    fallbackModel: Gpt4oImageFallbackModelSchema.optional(),
  })
  .refine((req) => req.prompt !== undefined || req.filesUrl !== undefined, {
    message: "At least one of `prompt` or `filesUrl` must be provided",
  });

export type Gpt4oImageGenerateRequest = z.input<
  typeof Gpt4oImageGenerateRequestSchema
>;
export type Gpt4oImageGenerateRequestInput = Gpt4oImageGenerateRequest;
export type Gpt4oImageGenerateParsedRequest = z.output<
  typeof Gpt4oImageGenerateRequestSchema
>;
export type Gpt4oImageSize = z.infer<typeof Gpt4oImageSizeSchema>;
export type Gpt4oImageFallbackModel = z.infer<
  typeof Gpt4oImageFallbackModelSchema
>;

// ---------------------------------------------------------------------------
// Midjourney (mj) schemas
// ---------------------------------------------------------------------------

export const MjTaskTypeSchema = z.enum([
  "mj_txt2img",
  "mj_img2img",
  "mj_style_reference",
  "mj_omni_reference",
  "mj_video",
  "mj_video_hd",
]);

export const MjSpeedSchema = z.enum(["relaxed", "fast", "turbo"]);

export const MjVersionSchema = z.enum(["7", "6.1", "6", "5.2", "5.1", "niji6"]);

export const MjAspectRatioSchema = z.enum([
  "1:2",
  "9:16",
  "2:3",
  "3:4",
  "5:6",
  "6:5",
  "4:3",
  "3:2",
  "1:1",
  "16:9",
  "2:1",
]);

export const MjMotionSchema = z.enum(["high", "low"]);

export const MjGenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  taskType: MjTaskTypeSchema,
  // Not required when taskType is mj_video, mj_video_hd, or mj_omni_reference.
  speed: MjSpeedSchema.optional(),
  // Single input image; required for image-to-image / image-to-video modes.
  fileUrl: z.string().url().optional(),
  // Preferred over fileUrl; for video modes only one image link is allowed.
  fileUrls: z.array(z.string().url()).optional(),
  aspectRatio: MjAspectRatioSchema.optional(),
  version: MjVersionSchema.optional(),
  variety: z.number().int().min(0).max(100).optional(),
  stylization: z.number().int().min(0).max(1000).optional(),
  weirdness: z.number().int().min(0).max(3000).optional(),
  // Omni reference intensity; only used when taskType is mj_omni_reference.
  ow: z.number().int().min(1).max(1000).optional(),
  waterMark: z.string().optional(),
  enableTranslation: z.boolean().optional(),
  callBackUrl: z.string().url().optional(),
  // Video modes only: number of videos to generate.
  videoBatchSize: z
    .union([z.literal(1), z.literal(2), z.literal(4)])
    .optional(),
  // Required for mj_video / mj_video_hd; controls motion level.
  motion: MjMotionSchema.optional(),
});

export type MjGenerateRequest = z.input<typeof MjGenerateRequestSchema>;
export type MjGenerateRequestInput = MjGenerateRequest;
export type MjGenerateParsedRequest = z.output<typeof MjGenerateRequestSchema>;
export type MjTaskType = z.infer<typeof MjTaskTypeSchema>;
export type MjSpeed = z.infer<typeof MjSpeedSchema>;
export type MjVersion = z.infer<typeof MjVersionSchema>;
export type MjAspectRatio = z.infer<typeof MjAspectRatioSchema>;
export type MjMotion = z.infer<typeof MjMotionSchema>;

export const MjRecordInfoSuccessFlagSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const MjRecordInfoRequestSchema = z.object({
  taskId: z.string().min(1),
});

export const MjRecordInfoResultInfoSchema = z
  .object({
    resultUrls: z
      .array(
        z
          .object({
            resultUrl: z.string(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

export const MjRecordInfoDataSchema = z
  .object({
    taskId: z.string().optional(),
    taskType: MjTaskTypeSchema.optional(),
    paramJson: z.string().optional(),
    completeTime: z.string().nullable().optional(),
    resultInfoJson: MjRecordInfoResultInfoSchema.nullable().optional(),
    successFlag: MjRecordInfoSuccessFlagSchema.optional(),
    createTime: z.string().nullable().optional(),
    errorCode: z.number().int().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
  })
  .passthrough();

export const MjRecordInfoResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: MjRecordInfoDataSchema.nullable().optional(),
});

export type MjRecordInfoSuccessFlag = z.infer<
  typeof MjRecordInfoSuccessFlagSchema
>;
export type MjRecordInfoRequest = z.input<typeof MjRecordInfoRequestSchema>;
export type MjRecordInfoRequestInput = MjRecordInfoRequest;
export type MjRecordInfoResultInfo = z.infer<
  typeof MjRecordInfoResultInfoSchema
>;
export type MjRecordInfoData = z.infer<typeof MjRecordInfoDataSchema>;
export type MjRecordInfoResponse = z.infer<typeof MjRecordInfoResponseSchema>;

// ---------------------------------------------------------------------------
// Runway schemas
// ---------------------------------------------------------------------------

export const RunwayQualitySchema = z.enum(["720p", "1080p"]);

// Aspect ratio is required only for text-only generation (no imageUrl); when
// an imageUrl is supplied the reference image determines the aspect ratio.
export const RunwayAspectRatioSchema = z.enum([
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
]);

// Video length in seconds. 10s is incompatible with 1080p (per upstream docs).
export const RunwayDurationSchema = z.union([z.literal(5), z.literal(10)]);

export const RunwayGenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(1800),
  duration: RunwayDurationSchema,
  quality: RunwayQualitySchema,
  // Reference image to animate; also determines the output aspect ratio.
  imageUrl: z.string().url().optional(),
  // Required for text-only generation (omit when imageUrl is provided).
  aspectRatio: RunwayAspectRatioSchema.optional(),
  // Overlay text; empty string means no watermark.
  waterMark: z.string().optional(),
  callBackUrl: z.string().url().optional(),
});

export const RunwayExtendRequestSchema = z.object({
  // Task id of the original Runway generation to continue.
  taskId: z.string().min(1),
  prompt: z.string().min(1),
  quality: RunwayQualitySchema,
  waterMark: z.string().optional(),
  callBackUrl: z.string().url().optional(),
});

// Response shape for GET /api/v1/runway/record-detail.
export const RunwayVideoInfoSchema = z.object({
  videoId: z.string().optional(),
  taskId: z.string().optional(),
  videoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const RunwayGenerateParamSchema = z
  .object({
    prompt: z.string().optional(),
    imageUrl: z.string().optional(),
    expandPrompt: z.boolean().optional(),
  })
  .passthrough();

export const RunwayRecordDetailDataSchema = z.object({
  taskId: z.string().optional(),
  parentTaskId: z.string().nullable().optional(),
  generateParam: RunwayGenerateParamSchema.nullable().optional(),
  state: z.string().optional(),
  generateTime: z.string().nullable().optional(),
  videoInfo: RunwayVideoInfoSchema.nullable().optional(),
  failCode: z.number().int().nullable().optional(),
  failMsg: z.string().nullable().optional(),
  expireFlag: z.number().int().nullable().optional(),
});

export const RunwayRecordDetailResponseSchema = z.object({
  code: z.number().int(),
  msg: z.string(),
  data: RunwayRecordDetailDataSchema.nullable().optional(),
});

// Aleph (Runway video-to-video) record-info poll shape.
// Docs: https://docs.kie.ai/runway-api/get-aleph-video-details
export const AlephRecordInfoResponseResultSchema = z
  .object({
    taskId: z.string().optional(),
    resultVideoUrl: z.string().optional(),
    resultImageUrl: z.string().optional(),
  })
  .passthrough();

export const AlephRecordInfoDataSchema = z
  .object({
    taskId: z.string(),
    paramJson: z.string().optional(),
    response: AlephRecordInfoResponseResultSchema.nullable().optional(),
    completeTime: z.string().nullable().optional(),
    createTime: z.string().optional(),
    successFlag: z
      .union([z.literal(0), z.literal(1), z.number().int()])
      .optional(),
    errorCode: z.number().int().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
  })
  .passthrough();

export const AlephRecordInfoResponseSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: AlephRecordInfoDataSchema.nullable().optional(),
  })
  .passthrough();

export type AlephRecordInfoResponse = z.infer<
  typeof AlephRecordInfoResponseSchema
>;

export type RunwayGenerateRequest = z.input<typeof RunwayGenerateRequestSchema>;
export type RunwayGenerateRequestInput = RunwayGenerateRequest;
export type RunwayGenerateParsedRequest = z.output<
  typeof RunwayGenerateRequestSchema
>;
export type RunwayExtendRequest = z.input<typeof RunwayExtendRequestSchema>;
export type RunwayExtendRequestInput = RunwayExtendRequest;
export type RunwayExtendParsedRequest = z.output<
  typeof RunwayExtendRequestSchema
>;
export type RunwayQuality = z.infer<typeof RunwayQualitySchema>;
export type RunwayAspectRatio = z.infer<typeof RunwayAspectRatioSchema>;
export type RunwayDuration = z.infer<typeof RunwayDurationSchema>;
export type RunwayRecordDetailResponseSchemaType = z.infer<
  typeof RunwayRecordDetailResponseSchema
>;

// ---------------------------------------------------------------------------
// Sub-provider schemas: Suno
// ---------------------------------------------------------------------------

// Suno ships new model versions before this package's enum catches up, so the
// enum below is unioned with an alias escape hatch. Suno's grammar is an
// uppercase `V`, a major version, optional `_`-joined point releases, and an
// optional `PLUS`/`ALL` capability suffix, e.g. V4_5PLUS, V5_5, V6. Case and
// separator are the load-bearing parts: an unnarrowed string hatch would
// accept the lowercase `v5`, the hyphenated `V4-5`, the mixed-case `V4_5plus`
// and even `music_v1`. Anything that is not a Suno version id must be added to
// the enum explicitly.
export const SunoModelAliasSchema = z
  .string()
  .regex(
    /^V\d+(?:_\d+)*(?:PLUS|ALL)?$/,
    "Expected a listed model or a Suno version alias (e.g. V5_5PLUS)"
  );

export const SunoGenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z
    .enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"])
    .or(SunoModelAliasSchema),
  instrumental: z.boolean(),
  customMode: z.boolean(),
  callBackUrl: z.string().min(1),
  style: z.string().optional(),
  negativeTags: z.string().optional(),
  title: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
  personaId: z.string().optional(),
});

export type SunoGenerateRequest = z.input<typeof SunoGenerateRequestSchema>;
export type SunoGenerateRequestInput = SunoGenerateRequest;
export type SunoGenerateParsedRequest = z.output<
  typeof SunoGenerateRequestSchema
>;
export type SunoModel =
  | "V3_5"
  | "V4"
  | "V4_5"
  | "V4_5PLUS"
  | "V4_5ALL"
  | "V5"
  | "V5_5";

// ---------------------------------------------------------------------------
// Sub-provider schemas: Chat (GPT-5.5 / GPT-5.2 via Kie)
// ---------------------------------------------------------------------------

export const KieChatContentPartSchema = z.object({
  type: z.enum(["text", "image_url"]),
  text: z.string().optional(),
  image_url: z.object({ url: z.string() }).optional(),
});

export const KieChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([z.string(), z.array(KieChatContentPartSchema)]),
});

export const KieChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(KieChatMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
  response_format: z
    .object({
      type: z.enum(["text", "json_object", "json_schema"]),
      json_schema: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export type KieChatContentPart = z.infer<typeof KieChatContentPartSchema>;
export type KieChatMessage = z.infer<typeof KieChatMessageSchema>;
export type KieChatRequest = z.input<typeof KieChatRequestSchema>;
export type KieChatRequestInput = KieChatRequest;
export type KieChatParsedRequest = z.output<typeof KieChatRequestSchema>;

// ---------------------------------------------------------------------------
// Sub-provider schemas: Responses (GPT-5.5 via Kie)
// ---------------------------------------------------------------------------

// kie exposes new OpenAI GPT point releases behind the Responses endpoint
// before this package's enum catches up, so the enum below is unioned with an
// alias escape hatch. The grammar is `gpt-` then a version whose parts are
// joined by `-` or `.`, then optional lowercase variant segments, e.g.
// gpt-5-5, gpt-6, gpt-5-5-mini. An unnarrowed string hatch would accept the
// spelled-out `gpt-five`, the truncated `gpt-`, and even a Grok id on an
// OpenAI-only field; anything that is not a versioned GPT id must be added to
// the enum explicitly.
const KieOpenAiModelAliasSchema = z
  .string()
  .regex(
    /^gpt-\d+(?:[-.]\d+)*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a versioned GPT alias (e.g. gpt-5-5-mini)"
  );

const KIE_RESPONSES_MODELS = ["gpt-5-5"] as const;

export const KieResponsesModelSchema = z
  .enum(KIE_RESPONSES_MODELS)
  .or(KieOpenAiModelAliasSchema);

export const KieResponsesReasoningEffortSchema = z.enum([
  "low",
  "medium",
  "high",
  "xhigh",
]);

export const KieResponsesMessageRoleSchema = z.enum([
  "user",
  "assistant",
  "system",
  "developer",
  "tool",
]);

export const KieResponsesInputTextSchema = z.object({
  type: z.literal("input_text"),
  text: z.string().min(1),
});

export const KieResponsesInputImageSchema = z.object({
  type: z.literal("input_image"),
  image_url: z.string().url(),
});

export const KieResponsesInputFileSchema = z.object({
  type: z.literal("input_file"),
  file_url: z.string().url(),
});

export const KieResponsesInputContentSchema = z.discriminatedUnion("type", [
  KieResponsesInputTextSchema,
  KieResponsesInputImageSchema,
  KieResponsesInputFileSchema,
]);

export const KieResponsesInputMessageSchema = z.object({
  role: KieResponsesMessageRoleSchema,
  content: z.array(KieResponsesInputContentSchema).min(1),
});

export const KieResponsesReasoningSchema = z.object({
  effort: KieResponsesReasoningEffortSchema.default("low").optional(),
});

export const KieResponsesWebSearchToolSchema = z.object({
  type: z.literal("web_search"),
});

export const KieResponsesFunctionToolSchema = z.object({
  type: z.literal("function"),
  name: z.string().min(1),
  description: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()),
});

export const KieResponsesToolSchema = z.discriminatedUnion("type", [
  KieResponsesWebSearchToolSchema,
  KieResponsesFunctionToolSchema,
]);

export const KieResponsesToolsSchema = z
  .array(KieResponsesToolSchema)
  .superRefine((tools, ctx) => {
    const hasWebSearch = tools.some((tool) => tool.type === "web_search");
    const hasFunction = tools.some((tool) => tool.type === "function");
    if (hasWebSearch && hasFunction) {
      ctx.addIssue({
        code: "custom",
        message:
          "web_search and function tools are mutually exclusive for Kie responses",
      });
    }
  });

export const KieResponsesRequestSchema = z.object({
  model: KieResponsesModelSchema,
  stream: z.boolean().default(false).optional(),
  input: z.union([
    z.string().min(1),
    z.array(KieResponsesInputMessageSchema).min(1),
  ]),
  reasoning: KieResponsesReasoningSchema.optional(),
  tools: KieResponsesToolsSchema.optional(),
  tool_choice: z.string().optional(),
});

// Literal ids + hatch rather than `z.infer` — see FluxKontextModel above.
export type KieResponsesModel =
  | (typeof KIE_RESPONSES_MODELS)[number]
  | (string & {});
export type KieResponsesReasoningEffort = z.infer<
  typeof KieResponsesReasoningEffortSchema
>;
export type KieResponsesMessageRole = z.infer<
  typeof KieResponsesMessageRoleSchema
>;
export type KieResponsesInputText = z.infer<typeof KieResponsesInputTextSchema>;
export type KieResponsesInputImage = z.infer<
  typeof KieResponsesInputImageSchema
>;
export type KieResponsesInputFile = z.infer<typeof KieResponsesInputFileSchema>;
export type KieResponsesInputContent = z.infer<
  typeof KieResponsesInputContentSchema
>;
export type KieResponsesInputMessage = z.infer<
  typeof KieResponsesInputMessageSchema
>;
export type KieResponsesReasoning = z.infer<typeof KieResponsesReasoningSchema>;
export type KieResponsesWebSearchTool = z.infer<
  typeof KieResponsesWebSearchToolSchema
>;
export type KieResponsesFunctionTool = z.infer<
  typeof KieResponsesFunctionToolSchema
>;
export type KieResponsesTool = z.infer<typeof KieResponsesToolSchema>;
export type KieResponsesRequest = z.input<typeof KieResponsesRequestSchema>;
export type KieResponsesParsedRequest = z.output<
  typeof KieResponsesRequestSchema
>;

// Grok 4.5 shares the Kie Responses request contract, differing only by model.
// Reuse the codex input/message/reasoning/tools sub-schemas so the mixed
// web_search + function rejection (KieResponsesToolsSchema) behaves identically.
//
// xAI ships new Grok point releases on its own cadence, so the enum below gets
// the same treatment as its GPT sibling. The grammar is `grok-` then a version
// whose parts are joined by `-` or `.`, then optional lowercase variant
// segments, e.g. grok-4-5, grok-5, grok-4-5-fast. This is a separate alias
// from KieOpenAiModelAliasSchema on purpose: sharing one would make `gpt-5-5`
// a valid Grok model. Anything that is not a versioned Grok id must be added
// to the enum explicitly.
const KieGrokModelAliasSchema = z
  .string()
  .regex(
    /^grok-\d+(?:[-.]\d+)*(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a versioned Grok alias (e.g. grok-4-5-fast)"
  );

const KIE_GROK_RESPONSES_MODELS = ["grok-4-5"] as const;

export const KieGrokResponsesModelSchema = z
  .enum(KIE_GROK_RESPONSES_MODELS)
  .or(KieGrokModelAliasSchema);

export const KieGrokResponsesRequestSchema = z.object({
  model: KieGrokResponsesModelSchema,
  stream: z.boolean().default(false).optional(),
  input: z.union([
    z.string().min(1),
    z.array(KieResponsesInputMessageSchema).min(1),
  ]),
  reasoning: KieResponsesReasoningSchema.optional(),
  tools: KieResponsesToolsSchema.optional(),
  tool_choice: z.string().optional(),
});

// Literal ids + hatch rather than `z.infer` — see FluxKontextModel above.
export type KieGrokResponsesModel =
  | (typeof KIE_GROK_RESPONSES_MODELS)[number]
  | (string & {});
export type KieGrokResponsesRequest = z.input<
  typeof KieGrokResponsesRequestSchema
>;

// ---------------------------------------------------------------------------
// Sub-provider schemas: Claude (via Kie)
// ---------------------------------------------------------------------------

export const KieClaudeToolInputSchemaSchema = z.object({
  type: z.string(),
  properties: z.record(z.string(), z.unknown()).optional(),
  required: z.array(z.string()).optional(),
});

export const KieClaudeToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  input_schema: KieClaudeToolInputSchemaSchema,
});

export const KieClaudeContentPartSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough();

export const KieClaudeMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(KieClaudeContentPartSchema)]),
});

// Anthropic ships new Claude releases before this package's enum catches up,
// so the enum below is unioned with an alias escape hatch. The grammar is
// `claude-`, a lowercase family name, at least one `-`-joined numeric version
// part, then optional lowercase variant segments, e.g. claude-sonnet-4-6,
// claude-haiku-4-5, claude-opus-5-0. Requiring both the family name and the
// version is the load-bearing part: an unnarrowed string hatch would accept
// the versionless `claude-sonnet`, the familyless `claude-4-6`, and `gpt-5-5`
// on a Claude-only field. Anything else must be added to the enum explicitly.
const KieClaudeModelAliasSchema = z
  .string()
  .regex(
    /^claude-[a-z]+(?:-\d+)+(?:-[a-z0-9]+)*$/,
    "Expected a listed model or a versioned Claude alias (e.g. claude-opus-5-0)"
  );

export const KieClaudeRequestSchema = z.object({
  model: z
    .enum(["claude-sonnet-4-6", "claude-haiku-4-5"])
    .or(KieClaudeModelAliasSchema),
  messages: z.array(KieClaudeMessageSchema),
  tools: z.array(KieClaudeToolSchema).optional(),
  thinkingFlag: z.boolean().optional(),
  stream: z.boolean().optional(),
});

export type KieClaudeToolInputSchema = z.infer<
  typeof KieClaudeToolInputSchemaSchema
>;
export type KieClaudeTool = z.infer<typeof KieClaudeToolSchema>;
export type KieClaudeContentPart = z.infer<typeof KieClaudeContentPartSchema>;
export type KieClaudeMessage = z.infer<typeof KieClaudeMessageSchema>;
export type KieClaudeRequest = z.input<typeof KieClaudeRequestSchema>;
export type KieClaudeRequestInput = KieClaudeRequest;
export type KieClaudeParsedRequest = z.output<typeof KieClaudeRequestSchema>;

// ---------------------------------------------------------------------------
// Media generation request (discriminated union on model)
// ---------------------------------------------------------------------------

// Plain union (not discriminatedUnion) so individual members can be refined —
// discriminatedUnion requires ZodObject members, but `.refine()` wraps an
// object in ZodEffects. Parsing cost is slightly higher (tries each member)
// but accepted for the added input-contract validation.
export const MediaGenerationRequestSchema = z.union([
  KlingVideoRequestSchema,
  KlingMotionControlRequestSchema,
  KlingV3TurboImageToVideoRequestSchema,
  KlingV3TurboTextToVideoRequestSchema,
  Kling26TextToVideoRequestSchema,
  Kling26ImageToVideoRequestSchema,
  Kling26MotionControlRequestSchema,
  KlingAiAvatarProRequestSchema,
  KlingAiAvatarStandardRequestSchema,
  KlingV21MasterImageToVideoRequestSchema,
  KlingV21MasterTextToVideoRequestSchema,
  KlingV21ProRequestSchema,
  KlingV21StandardRequestSchema,
  KlingV25TurboImageToVideoProRequestSchema,
  KlingV25TurboTextToVideoProRequestSchema,
  GrokTextToImageRequestSchema,
  GrokImageToImageRequestSchema,
  GrokTextToVideoRequestSchema,
  GrokImageToVideoRequestSchema,
  GrokVideo15PreviewRequestSchema,
  GrokVideoExtendRequestSchema,
  GrokVideoUpscaleRequestSchema,
  NanoBananaProRequestSchema,
  NanoBanana2RequestSchema,
  NanoBanana2LiteRequestSchema,
  GptImageToImageRequestSchema,
  GptImage15TextToImageRequestSchema,
  GptImage2ImageToImageRequestSchema,
  GptImage2TextToImageRequestSchema,
  SeedreamImageToImageRequestSchema,
  SeedreamTextToImageRequestSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProTextToImageRequestSchema,
  Seedream45TextToImageRequestSchema,
  Seedream45EditRequestSchema,
  Qwen2TextToImageRequestSchema,
  Qwen2ImageEditRequestSchema,
  QwenTextToImageRequestSchema,
  QwenImageEditRequestSchema,
  QwenImageToImageRequestSchema,
  Seedance2FastRequestSchema,
  Seedance2RequestSchema,
  Seedance2MiniRequestSchema,
  Seedance15ProRequestSchema,
  BytedanceSeedreamRequestSchema,
  BytedanceSeedreamV4EditRequestSchema,
  BytedanceSeedreamV4TextToImageRequestSchema,
  BytedanceV1LiteImageToVideoRequestSchema,
  BytedanceV1LiteTextToVideoRequestSchema,
  BytedanceV1ProFastImageToVideoRequestSchema,
  BytedanceV1ProImageToVideoRequestSchema,
  BytedanceV1ProTextToVideoRequestSchema,
  Wan27ImageToVideoRequestSchema,
  Wan27TextToVideoRequestSchema,
  Wan27RefToVideoRequestSchema,
  Wan27VideoEditRequestSchema,
  Wan27ImageRequestSchema,
  Wan27ImageProRequestSchema,
  Wan22A14bImageToVideoTurboRequestSchema,
  Wan22A14bSpeechToVideoTurboRequestSchema,
  Wan22A14bTextToVideoTurboRequestSchema,
  Wan22AnimateMoveRequestSchema,
  Wan22AnimateReplaceRequestSchema,
  Wan25ImageToVideoRequestSchema,
  Wan25TextToVideoRequestSchema,
  Wan26FlashImageToVideoRequestSchema,
  Wan26FlashVideoToVideoRequestSchema,
  Wan26ImageToVideoRequestSchema,
  Wan26TextToVideoRequestSchema,
  Wan26VideoToVideoRequestSchema,
  HappyHorseTextToVideoRequestSchema,
  HappyHorseImageToVideoRequestSchema,
  HappyHorseReferenceToVideoRequestSchema,
  HappyHorseVideoEditRequestSchema,
  HappyHorse11TextToVideoRequestSchema,
  HappyHorse11ImageToVideoRequestSchema,
  HappyHorse11ReferenceToVideoRequestSchema,
  Omnihuman15RequestSchema,
  Omnihuman15HumanIdentificationRequestSchema,
  Omnihuman15SubjectDetectionRequestSchema,
  VolcengineVideoToVideoLipSyncRequestSchema,
  GeminiOmniVideoRequestSchema,
  ElevenLabsAudioIsolationRequestSchema,
  ElevenLabsTextToDialogueV3RequestSchema,
  ElevenLabsTextToSpeechMultilingualV2RequestSchema,
  ElevenLabsTextToSpeechTurbo25RequestSchema,
  ElevenLabsSoundEffectV2RequestSchema,
  SoraWatermarkRequestSchema,
  RecraftCrispUpscaleRequestSchema,
  RecraftRemoveBackgroundRequestSchema,
  PixverseV6TextToVideoRequestSchema,
  PixverseV6ImageToVideoRequestSchema,
  PixverseV6TransitionRequestSchema,
  PixverseV6ExtendRequestSchema,
  PixverseV6ReferenceToVideoRequestSchema,
  MiniMaxH3TextToVideoRequestSchema,
  MiniMaxH3ImageToVideoRequestSchema,
  MiniMaxH3ReferenceToVideoRequestSchema,
  GoogleGemini25ProTtsRequestSchema,
  GoogleGemini31FlashTtsRequestSchema,
  GoogleImagen4RequestSchema,
  GoogleImagen4FastRequestSchema,
  GoogleImagen4UltraRequestSchema,
  GoogleNanoBananaRequestSchema,
  GoogleNanoBananaEditRequestSchema,
  TopazImageUpscaleRequestSchema,
  TopazVideoUpscaleRequestSchema,
  InfinitalkFromAudioRequestSchema,
  ZImageRequestSchema,
  Flux2ProTextToImageRequestSchema,
  Flux2FlexTextToImageRequestSchema,
  Flux2ProImageToImageRequestSchema,
  Flux2FlexImageToImageRequestSchema,
  Hailuo02TextToVideoProRequestSchema,
  Hailuo02TextToVideoStandardRequestSchema,
  Hailuo02ImageToVideoProRequestSchema,
  Hailuo02ImageToVideoStandardRequestSchema,
  Hailuo23ImageToVideoProRequestSchema,
  Hailuo23ImageToVideoStandardRequestSchema,
  IdeogramV3TextToImageRequestSchema,
  IdeogramV3EditRequestSchema,
  IdeogramV3RemixRequestSchema,
  IdeogramCharacterRequestSchema,
  IdeogramCharacterEditRequestSchema,
  IdeogramCharacterRemixRequestSchema,
]);

// ---------------------------------------------------------------------------
// CreateTask request (alias for MediaGenerationRequest — what the createTask
// endpoint actually receives)
// ---------------------------------------------------------------------------

export const CreateTaskRequestSchema = CreateTaskEnvelopeSchema.pipe(
  MediaGenerationRequestSchema
);

// ---------------------------------------------------------------------------
// Inferred types (source of truth — replaces hand-written interfaces)
// ---------------------------------------------------------------------------

// Deliberately taken from KIE_MEDIA_MODELS rather than
// `z.infer<typeof KieMediaModelSchema>`: the *schema* is open (per-family
// alias hatches), but the *type* must stay the literal union of the listed
// ids, because it keys `Record<KieMediaModel, ModelInputSchema>` in
// model-schemas.ts and types.ts. Inferring it off the open schema widens it to
// `string`, which stops that Record requiring an entry per model and stops it
// rejecting a typo'd key — silently, with no tsc error anywhere.
//
// This is also the one open-enum type in this file that omits the
// `| (string & {})` hatch its siblings carry (FluxKontextModel,
// KieResponsesModel, KieGrokResponsesModel). That is deliberate, not an
// oversight: the hatch would reintroduce exactly the `string` widening the
// Record keying above depends on rejecting. Callers that need an unlisted id
// still get it — the *schema* accepts it, and every request type takes its
// model field from the schema, not from this alias.
export type KieMediaModel = (typeof KIE_MEDIA_MODELS)[number];

type AssertTrue<T extends true> = T;

// Compile-level pin for the line above. `Record<string, …>` and
// `Record<never, …>` both accept the model-schemas object literal without
// complaint, so nothing downstream catches a widened KieMediaModel on its own.
// This does: re-point the type at the open schema and the condition below
// resolves to `false`, which fails `AssertTrue`'s `extends true` constraint and
// errors here. The matching runtime pin (every listed id has exactly one
// modelInputSchemas entry) lives in tests/unit/kie-zod.test.ts.
export type KieMediaModelStaysLiteral = AssertTrue<
  string extends KieMediaModel ? false : true
>;

// The sibling pin, for the open-enum types that *do* carry the
// `| (string & {})` hatch. `string extends T` is `true` for those by
// construction, so the check above cannot be reused; this one asks the question
// that still discriminates them — are there literal members left to
// autocomplete? Re-point any of the three types below at
// `z.infer<typeof …Schema>` and its literals vanish, `LiteralPart` resolves to
// `never`, and `AssertTrue` errors here. Without this, nothing in the repo
// notices: types are erased before any test runs, and every one of these ids is
// assignable both before and after the widening.
type LiteralPart<T> = T extends string ? (string extends T ? never : T) : never;
type StaysAutocompletable<T> = [LiteralPart<T>] extends [never] ? false : true;

export type FluxKontextModelKeepsLiterals = AssertTrue<
  StaysAutocompletable<FluxKontextModel>
>;
export type KieResponsesModelKeepsLiterals = AssertTrue<
  StaysAutocompletable<KieResponsesModel>
>;
export type KieGrokResponsesModelKeepsLiterals = AssertTrue<
  StaysAutocompletable<KieGrokResponsesModel>
>;

export type MediaType = z.infer<typeof MediaTypeSchema>;

export type KlingDuration = z.infer<typeof KlingDurationSchema>;
export type KlingAspectRatio = z.infer<typeof KlingAspectRatioSchema>;
export type KlingMode = z.infer<typeof KlingModeSchema>;
export type KlingV3TurboDuration = z.infer<typeof KlingV3TurboDurationSchema>;
export type KlingV3TurboTextToVideoDuration = z.infer<
  typeof KlingV3TurboTextToVideoDurationSchema
>;
export type KlingV3TurboResolution = z.infer<
  typeof KlingV3TurboResolutionSchema
>;
export type KlingV3TurboAspectRatio = z.infer<
  typeof KlingV3TurboAspectRatioSchema
>;
export type GrokImagineMode = z.infer<typeof GrokImagineModeSchema>;
export type GrokTextToVideoMode = z.infer<typeof GrokTextToVideoModeSchema>;
export type GrokImageToVideoMode = z.infer<typeof GrokImageToVideoModeSchema>;
export type GrokTextToVideoAspectRatio = z.infer<
  typeof GrokTextToVideoAspectRatioSchema
>;
export type GrokImageToVideoAspectRatio = z.infer<
  typeof GrokImageToVideoAspectRatioSchema
>;
export type GrokTextToVideoDuration = z.infer<
  typeof GrokTextToVideoDurationSchema
>;
export type GrokImagineDuration = z.infer<typeof GrokImagineDurationSchema>;
export type GrokImageToVideoDuration = z.infer<
  typeof GrokImageToVideoDurationSchema
>;
export type GrokImagineResolution = z.infer<typeof GrokImagineResolutionSchema>;
export type GrokVideo15AspectRatio = z.infer<
  typeof GrokVideo15AspectRatioSchema
>;
export type NanoBananaResolution = z.infer<typeof NanoBananaResolutionSchema>;
export type NanoBananaOutputFormat = z.infer<
  typeof NanoBananaOutputFormatSchema
>;
export type GptImageQuality = z.infer<typeof GptImageQualitySchema>;
export type Qwen2ImageSize = z.infer<typeof Qwen2ImageSizeSchema>;
export type QwenImageSize = z.infer<typeof QwenImageSizeSchema>;
export type QwenAcceleration = z.infer<typeof QwenAccelerationSchema>;
export type QwenImageEditNumImages = z.infer<
  typeof QwenImageEditNumImagesSchema
>;
export type Wan27Resolution = z.infer<typeof Wan27ResolutionSchema>;
export type Wan27AspectRatio = z.infer<typeof Wan27AspectRatioSchema>;
export type Wan27AudioSetting = z.infer<typeof Wan27AudioSettingSchema>;
export type Wan27ImageResolution = z.infer<typeof Wan27ImageResolutionSchema>;
export type Wan27ImageAspectRatio = z.infer<typeof Wan27ImageAspectRatioSchema>;
export type HappyHorseResolution = z.infer<typeof HappyHorseResolutionSchema>;
export type HappyHorseAspectRatio = z.infer<typeof HappyHorseAspectRatioSchema>;
export type HappyHorse11AspectRatio = z.infer<
  typeof HappyHorse11AspectRatioSchema
>;
export type HappyHorseAudioSetting = z.infer<
  typeof HappyHorseAudioSettingSchema
>;
export type HappyHorseDuration = z.infer<typeof HappyHorseDurationSchema>;
export type Omnihuman15OutputResolution = z.infer<
  typeof Omnihuman15OutputResolutionSchema
>;
export type VolcengineVideoToVideoLipSyncMode = z.infer<
  typeof VolcengineVideoToVideoLipSyncModeSchema
>;
export type GeminiOmniVideoDuration = z.infer<
  typeof GeminiOmniVideoDurationSchema
>;
export type GeminiOmniVideoAspectRatio = z.infer<
  typeof GeminiOmniVideoAspectRatioSchema
>;
export type GeminiOmniVideoResolution = z.infer<
  typeof GeminiOmniVideoResolutionSchema
>;
export type Seedance2MiniResolution = z.infer<
  typeof Seedance2MiniResolutionSchema
>;
export type Seedance2MiniAspectRatio = z.infer<
  typeof Seedance2MiniAspectRatioSchema
>;
export type Seedance2MiniTaskState = z.infer<
  typeof Seedance2MiniTaskStateSchema
>;
export type MiniMaxH3Prompt = z.infer<typeof MiniMaxH3PromptSchema>;
export type MiniMaxH3Duration = z.infer<typeof MiniMaxH3DurationSchema>;
export type MiniMaxH3Resolution = z.infer<typeof MiniMaxH3ResolutionSchema>;
export type MiniMaxH3FixedAspectRatio = z.infer<
  typeof MiniMaxH3FixedAspectRatioSchema
>;
export type MiniMaxH3ReferenceAspectRatio = z.infer<
  typeof MiniMaxH3ReferenceAspectRatioSchema
>;
export type MiniMaxH3MediaAddress = z.infer<typeof MiniMaxH3MediaAddressSchema>;
export type GoogleGeminiTtsVoiceName = z.infer<
  typeof GoogleGeminiTtsVoiceNameSchema
>;
export type GoogleGeminiTtsAccent = z.infer<typeof GoogleGeminiTtsAccentSchema>;
export type GoogleGeminiTtsStyle = z.infer<typeof GoogleGeminiTtsStyleSchema>;
export type GoogleGeminiTtsPace = z.infer<typeof GoogleGeminiTtsPaceSchema>;
export type GoogleGeminiTtsSpeakerId = z.infer<
  typeof GoogleGeminiTtsSpeakerIdSchema
>;
export type GoogleGeminiTtsSpeaker = z.input<
  typeof GoogleGeminiTtsSpeakerSchema
>;
export type GoogleGeminiTtsDialogueTurn = z.input<
  typeof GoogleGeminiTtsDialogueTurnSchema
>;

export type KlingElement = z.infer<typeof KlingElementSchema>;
export type MultiShotPrompt = z.infer<typeof MultiShotPromptSchema>;
export type Wan27ImageColorPalette = z.infer<
  typeof Wan27ImageColorPaletteSchema
>;

export type KlingVideoRequest = z.input<typeof KlingVideoRequestSchema>;
export type KlingVideoRequestInput = KlingVideoRequest;
export type KlingVideoParsedRequest = z.output<typeof KlingVideoRequestSchema>;
export type KlingMotionControlRequest = z.input<
  typeof KlingMotionControlRequestSchema
>;
export type KlingMotionControlRequestInput = KlingMotionControlRequest;
export type KlingMotionControlParsedRequest = z.output<
  typeof KlingMotionControlRequestSchema
>;
export type KlingV3TurboImageToVideoRequest = z.input<
  typeof KlingV3TurboImageToVideoRequestSchema
>;
export type KlingV3TurboImageToVideoRequestInput =
  KlingV3TurboImageToVideoRequest;
export type KlingV3TurboImageToVideoParsedRequest = z.output<
  typeof KlingV3TurboImageToVideoRequestSchema
>;
export type KlingV3TurboTextToVideoRequest = z.input<
  typeof KlingV3TurboTextToVideoRequestSchema
>;
export type KlingV3TurboTextToVideoRequestInput =
  KlingV3TurboTextToVideoRequest;
export type KlingV3TurboTextToVideoParsedRequest = z.output<
  typeof KlingV3TurboTextToVideoRequestSchema
>;
export type KlingMarketDuration = z.infer<typeof KlingMarketDurationSchema>;
export type KlingCfgScale = z.infer<typeof KlingCfgScaleSchema>;
export type Kling26TextToVideoRequest = z.input<
  typeof Kling26TextToVideoRequestSchema
>;
export type Kling26TextToVideoRequestInput = Kling26TextToVideoRequest;
export type Kling26TextToVideoParsedRequest = z.output<
  typeof Kling26TextToVideoRequestSchema
>;
export type Kling26ImageToVideoRequest = z.input<
  typeof Kling26ImageToVideoRequestSchema
>;
export type Kling26ImageToVideoRequestInput = Kling26ImageToVideoRequest;
export type Kling26ImageToVideoParsedRequest = z.output<
  typeof Kling26ImageToVideoRequestSchema
>;
export type Kling26MotionControlRequest = z.input<
  typeof Kling26MotionControlRequestSchema
>;
export type Kling26MotionControlRequestInput = Kling26MotionControlRequest;
export type Kling26MotionControlParsedRequest = z.output<
  typeof Kling26MotionControlRequestSchema
>;
export type KlingAiAvatarProRequest = z.input<
  typeof KlingAiAvatarProRequestSchema
>;
export type KlingAiAvatarProRequestInput = KlingAiAvatarProRequest;
export type KlingAiAvatarProParsedRequest = z.output<
  typeof KlingAiAvatarProRequestSchema
>;
export type KlingAiAvatarStandardRequest = z.input<
  typeof KlingAiAvatarStandardRequestSchema
>;
export type KlingAiAvatarStandardRequestInput = KlingAiAvatarStandardRequest;
export type KlingAiAvatarStandardParsedRequest = z.output<
  typeof KlingAiAvatarStandardRequestSchema
>;
export type KlingV21MasterImageToVideoRequest = z.input<
  typeof KlingV21MasterImageToVideoRequestSchema
>;
export type KlingV21MasterImageToVideoRequestInput =
  KlingV21MasterImageToVideoRequest;
export type KlingV21MasterImageToVideoParsedRequest = z.output<
  typeof KlingV21MasterImageToVideoRequestSchema
>;
export type KlingV21MasterTextToVideoRequest = z.input<
  typeof KlingV21MasterTextToVideoRequestSchema
>;
export type KlingV21MasterTextToVideoRequestInput =
  KlingV21MasterTextToVideoRequest;
export type KlingV21MasterTextToVideoParsedRequest = z.output<
  typeof KlingV21MasterTextToVideoRequestSchema
>;
export type KlingV21ProRequest = z.input<typeof KlingV21ProRequestSchema>;
export type KlingV21ProRequestInput = KlingV21ProRequest;
export type KlingV21ProParsedRequest = z.output<
  typeof KlingV21ProRequestSchema
>;
export type KlingV21StandardRequest = z.input<
  typeof KlingV21StandardRequestSchema
>;
export type KlingV21StandardRequestInput = KlingV21StandardRequest;
export type KlingV21StandardParsedRequest = z.output<
  typeof KlingV21StandardRequestSchema
>;
export type KlingV25TurboImageToVideoProRequest = z.input<
  typeof KlingV25TurboImageToVideoProRequestSchema
>;
export type KlingV25TurboImageToVideoProRequestInput =
  KlingV25TurboImageToVideoProRequest;
export type KlingV25TurboImageToVideoProParsedRequest = z.output<
  typeof KlingV25TurboImageToVideoProRequestSchema
>;
export type KlingV25TurboTextToVideoProRequest = z.input<
  typeof KlingV25TurboTextToVideoProRequestSchema
>;
export type KlingV25TurboTextToVideoProRequestInput =
  KlingV25TurboTextToVideoProRequest;
export type KlingV25TurboTextToVideoProParsedRequest = z.output<
  typeof KlingV25TurboTextToVideoProRequestSchema
>;
export type GrokTextToImageRequest = z.input<
  typeof GrokTextToImageRequestSchema
>;
export type GrokTextToImageRequestInput = GrokTextToImageRequest;
export type GrokTextToImageParsedRequest = z.output<
  typeof GrokTextToImageRequestSchema
>;
export type Qwen2TextToImageRequest = z.input<
  typeof Qwen2TextToImageRequestSchema
>;
export type Qwen2TextToImageRequestInput = Qwen2TextToImageRequest;
export type Qwen2TextToImageParsedRequest = z.output<
  typeof Qwen2TextToImageRequestSchema
>;
export type Qwen2ImageEditRequest = z.input<typeof Qwen2ImageEditRequestSchema>;
export type Qwen2ImageEditRequestInput = Qwen2ImageEditRequest;
export type Qwen2ImageEditParsedRequest = z.output<
  typeof Qwen2ImageEditRequestSchema
>;
export type QwenTextToImageRequest = z.input<
  typeof QwenTextToImageRequestSchema
>;
export type QwenTextToImageRequestInput = QwenTextToImageRequest;
export type QwenTextToImageParsedRequest = z.output<
  typeof QwenTextToImageRequestSchema
>;
export type QwenImageEditRequest = z.input<typeof QwenImageEditRequestSchema>;
export type QwenImageEditRequestInput = QwenImageEditRequest;
export type QwenImageEditParsedRequest = z.output<
  typeof QwenImageEditRequestSchema
>;
export type QwenImageToImageRequest = z.input<
  typeof QwenImageToImageRequestSchema
>;
export type QwenImageToImageRequestInput = QwenImageToImageRequest;
export type QwenImageToImageParsedRequest = z.output<
  typeof QwenImageToImageRequestSchema
>;
export type GrokImageToImageRequest = z.input<
  typeof GrokImageToImageRequestSchema
>;
export type GrokImageToImageRequestInput = GrokImageToImageRequest;
export type GrokImageToImageParsedRequest = z.output<
  typeof GrokImageToImageRequestSchema
>;
export type GrokTextToVideoRequest = z.input<
  typeof GrokTextToVideoRequestSchema
>;
export type GrokTextToVideoRequestInput = GrokTextToVideoRequest;
export type GrokTextToVideoParsedRequest = z.output<
  typeof GrokTextToVideoRequestSchema
>;
export type GrokImageToVideoRequest = z.input<
  typeof GrokImageToVideoRequestSchema
>;
export type GrokImageToVideoRequestInput = GrokImageToVideoRequest;
export type GrokImageToVideoParsedRequest = z.output<
  typeof GrokImageToVideoRequestSchema
>;
export type GrokVideo15PreviewRequest = z.input<
  typeof GrokVideo15PreviewRequestSchema
>;
export type GrokVideo15PreviewRequestInput = GrokVideo15PreviewRequest;
export type GrokVideo15PreviewParsedRequest = z.output<
  typeof GrokVideo15PreviewRequestSchema
>;
export type GrokVideoExtendRequest = z.input<
  typeof GrokVideoExtendRequestSchema
>;
export type GrokVideoExtendRequestInput = GrokVideoExtendRequest;
export type GrokVideoExtendParsedRequest = z.output<
  typeof GrokVideoExtendRequestSchema
>;
export type GrokVideoUpscaleRequest = z.input<
  typeof GrokVideoUpscaleRequestSchema
>;
export type GrokVideoUpscaleRequestInput = GrokVideoUpscaleRequest;
export type GrokVideoUpscaleParsedRequest = z.output<
  typeof GrokVideoUpscaleRequestSchema
>;
export type NanoBananaProRequest = z.input<typeof NanoBananaProRequestSchema>;
export type NanoBananaProRequestInput = NanoBananaProRequest;
export type NanoBananaProParsedRequest = z.output<
  typeof NanoBananaProRequestSchema
>;
export type Seedance2FastInput = z.infer<typeof Seedance2FastInputSchema>;
export type Seedance2FastRequest = z.input<typeof Seedance2FastRequestSchema>;
export type Seedance2FastRequestInput = Seedance2FastRequest;
export type Seedance2FastParsedRequest = z.output<
  typeof Seedance2FastRequestSchema
>;
export type Seedance2Input = z.infer<typeof Seedance2InputSchema>;
export type Seedance2Request = z.input<typeof Seedance2RequestSchema>;
export type Seedance2RequestInput = Seedance2Request;
export type Seedance2ParsedRequest = z.output<typeof Seedance2RequestSchema>;
export type Seedance2MiniInput = z.infer<typeof Seedance2MiniInputSchema>;
export type Seedance2MiniRequest = z.input<typeof Seedance2MiniRequestSchema>;
export type Seedance2MiniRequestInput = Seedance2MiniRequest;
export type Seedance2MiniParsedRequest = z.output<
  typeof Seedance2MiniRequestSchema
>;
export type Seedance15ProAspectRatio = z.infer<
  typeof Seedance15ProAspectRatioSchema
>;
export type Seedance15ProResolution = z.infer<
  typeof Seedance15ProResolutionSchema
>;
export type Seedance15ProInput = z.infer<typeof Seedance15ProInputSchema>;
export type Seedance15ProRequest = z.input<typeof Seedance15ProRequestSchema>;
export type Seedance15ProRequestInput = Seedance15ProRequest;
export type Seedance15ProParsedRequest = z.output<
  typeof Seedance15ProRequestSchema
>;
export type BytedanceSeedreamImageSize = z.infer<
  typeof BytedanceSeedreamImageSizeSchema
>;
export type BytedanceSeedreamInput = z.infer<
  typeof BytedanceSeedreamInputSchema
>;
export type BytedanceSeedreamRequest = z.input<
  typeof BytedanceSeedreamRequestSchema
>;
export type BytedanceSeedreamRequestInput = BytedanceSeedreamRequest;
export type BytedanceSeedreamParsedRequest = z.output<
  typeof BytedanceSeedreamRequestSchema
>;
export type BytedanceSeedreamV4ImageSize = z.infer<
  typeof BytedanceSeedreamV4ImageSizeSchema
>;
export type BytedanceSeedreamV4ImageResolution = z.infer<
  typeof BytedanceSeedreamV4ImageResolutionSchema
>;
export type BytedanceSeedreamV4TextToImageInput = z.infer<
  typeof BytedanceSeedreamV4TextToImageInputSchema
>;
export type BytedanceSeedreamV4TextToImageRequest = z.input<
  typeof BytedanceSeedreamV4TextToImageRequestSchema
>;
export type BytedanceSeedreamV4TextToImageRequestInput =
  BytedanceSeedreamV4TextToImageRequest;
export type BytedanceSeedreamV4TextToImageParsedRequest = z.output<
  typeof BytedanceSeedreamV4TextToImageRequestSchema
>;
export type BytedanceSeedreamV4EditInput = z.infer<
  typeof BytedanceSeedreamV4EditInputSchema
>;
export type BytedanceSeedreamV4EditRequest = z.input<
  typeof BytedanceSeedreamV4EditRequestSchema
>;
export type BytedanceSeedreamV4EditRequestInput =
  BytedanceSeedreamV4EditRequest;
export type BytedanceSeedreamV4EditParsedRequest = z.output<
  typeof BytedanceSeedreamV4EditRequestSchema
>;
export type BytedanceV1VideoDuration = z.infer<
  typeof BytedanceV1VideoDurationSchema
>;
export type BytedanceV1VideoResolution = z.infer<
  typeof BytedanceV1VideoResolutionSchema
>;
export type BytedanceV1ProFastVideoResolution = z.infer<
  typeof BytedanceV1ProFastVideoResolutionSchema
>;
export type BytedanceV1LiteTextAspectRatio = z.infer<
  typeof BytedanceV1LiteTextAspectRatioSchema
>;
export type BytedanceV1ProTextAspectRatio = z.infer<
  typeof BytedanceV1ProTextAspectRatioSchema
>;
export type BytedanceV1LiteImageToVideoInput = z.infer<
  typeof BytedanceV1LiteImageToVideoInputSchema
>;
export type BytedanceV1LiteImageToVideoRequest = z.input<
  typeof BytedanceV1LiteImageToVideoRequestSchema
>;
export type BytedanceV1LiteImageToVideoRequestInput =
  BytedanceV1LiteImageToVideoRequest;
export type BytedanceV1LiteImageToVideoParsedRequest = z.output<
  typeof BytedanceV1LiteImageToVideoRequestSchema
>;
export type BytedanceV1LiteTextToVideoInput = z.infer<
  typeof BytedanceV1LiteTextToVideoInputSchema
>;
export type BytedanceV1LiteTextToVideoRequest = z.input<
  typeof BytedanceV1LiteTextToVideoRequestSchema
>;
export type BytedanceV1LiteTextToVideoRequestInput =
  BytedanceV1LiteTextToVideoRequest;
export type BytedanceV1LiteTextToVideoParsedRequest = z.output<
  typeof BytedanceV1LiteTextToVideoRequestSchema
>;
export type BytedanceV1ProFastImageToVideoInput = z.infer<
  typeof BytedanceV1ProFastImageToVideoInputSchema
>;
export type BytedanceV1ProFastImageToVideoRequest = z.input<
  typeof BytedanceV1ProFastImageToVideoRequestSchema
>;
export type BytedanceV1ProFastImageToVideoRequestInput =
  BytedanceV1ProFastImageToVideoRequest;
export type BytedanceV1ProFastImageToVideoParsedRequest = z.output<
  typeof BytedanceV1ProFastImageToVideoRequestSchema
>;
export type BytedanceV1ProImageToVideoInput = z.infer<
  typeof BytedanceV1ProImageToVideoInputSchema
>;
export type BytedanceV1ProImageToVideoRequest = z.input<
  typeof BytedanceV1ProImageToVideoRequestSchema
>;
export type BytedanceV1ProImageToVideoRequestInput =
  BytedanceV1ProImageToVideoRequest;
export type BytedanceV1ProImageToVideoParsedRequest = z.output<
  typeof BytedanceV1ProImageToVideoRequestSchema
>;
export type BytedanceV1ProTextToVideoInput = z.infer<
  typeof BytedanceV1ProTextToVideoInputSchema
>;
export type BytedanceV1ProTextToVideoRequest = z.input<
  typeof BytedanceV1ProTextToVideoRequestSchema
>;
export type BytedanceV1ProTextToVideoRequestInput =
  BytedanceV1ProTextToVideoRequest;
export type BytedanceV1ProTextToVideoParsedRequest = z.output<
  typeof BytedanceV1ProTextToVideoRequestSchema
>;
export type NanoBanana2Request = z.input<typeof NanoBanana2RequestSchema>;
export type NanoBanana2RequestInput = NanoBanana2Request;
export type NanoBanana2ParsedRequest = z.output<
  typeof NanoBanana2RequestSchema
>;
export type NanoBanana2LiteAspectRatio = z.infer<
  typeof NanoBanana2LiteAspectRatioSchema
>;
export type NanoBanana2LiteRequest = z.input<
  typeof NanoBanana2LiteRequestSchema
>;
export type NanoBanana2LiteRequestInput = NanoBanana2LiteRequest;
export type NanoBanana2LiteParsedRequest = z.output<
  typeof NanoBanana2LiteRequestSchema
>;
export type GptImageToImageRequest = z.input<
  typeof GptImageToImageRequestSchema
>;
export type GptImageToImageRequestInput = GptImageToImageRequest;
export type GptImageToImageParsedRequest = z.output<
  typeof GptImageToImageRequestSchema
>;
export type GptImage15TextToImageAspectRatio = z.infer<
  typeof GptImage15TextToImageAspectRatioSchema
>;
export type GptImage15TextToImageRequest = z.input<
  typeof GptImage15TextToImageRequestSchema
>;
export type GptImage15TextToImageRequestInput = GptImage15TextToImageRequest;
export type GptImage15TextToImageParsedRequest = z.output<
  typeof GptImage15TextToImageRequestSchema
>;
export type GptImage2ImageToImageAspectRatio = z.infer<
  typeof GptImage2ImageToImageAspectRatioSchema
>;
export type GptImage2ImageToImageResolution = z.infer<
  typeof GptImage2ImageToImageResolutionSchema
>;
export type GptImage2ImageToImageRequest = z.input<
  typeof GptImage2ImageToImageRequestSchema
>;
export type GptImage2ImageToImageRequestInput = GptImage2ImageToImageRequest;
export type GptImage2ImageToImageParsedRequest = z.output<
  typeof GptImage2ImageToImageRequestSchema
>;
export type GptImage2TextToImageAspectRatio = z.infer<
  typeof GptImage2TextToImageAspectRatioSchema
>;
export type GptImage2TextToImageResolution = z.infer<
  typeof GptImage2TextToImageResolutionSchema
>;
export type GptImage2TextToImageRequest = z.input<
  typeof GptImage2TextToImageRequestSchema
>;
export type GptImage2TextToImageRequestInput = GptImage2TextToImageRequest;
export type GptImage2TextToImageParsedRequest = z.output<
  typeof GptImage2TextToImageRequestSchema
>;
export type SeedreamImageToImageRequest = z.input<
  typeof SeedreamImageToImageRequestSchema
>;
export type SeedreamImageToImageRequestInput = SeedreamImageToImageRequest;
export type SeedreamImageToImageParsedRequest = z.output<
  typeof SeedreamImageToImageRequestSchema
>;
export type SeedreamTextToImageRequest = z.input<
  typeof SeedreamTextToImageRequestSchema
>;
export type SeedreamTextToImageRequestInput = SeedreamTextToImageRequest;
export type SeedreamTextToImageParsedRequest = z.output<
  typeof SeedreamTextToImageRequestSchema
>;
export type SeedreamProImageToImageRequest = z.input<
  typeof SeedreamProImageToImageRequestSchema
>;
export type SeedreamProImageToImageRequestInput =
  SeedreamProImageToImageRequest;
export type SeedreamProImageToImageParsedRequest = z.output<
  typeof SeedreamProImageToImageRequestSchema
>;
export type SeedreamProTextToImageRequest = z.input<
  typeof SeedreamProTextToImageRequestSchema
>;
export type SeedreamProTextToImageRequestInput = SeedreamProTextToImageRequest;
export type SeedreamProTextToImageParsedRequest = z.output<
  typeof SeedreamProTextToImageRequestSchema
>;
export type Seedream45TextToImageRequest = z.input<
  typeof Seedream45TextToImageRequestSchema
>;
export type Seedream45TextToImageRequestInput = Seedream45TextToImageRequest;
export type Seedream45TextToImageParsedRequest = z.output<
  typeof Seedream45TextToImageRequestSchema
>;
export type Seedream45EditRequest = z.input<typeof Seedream45EditRequestSchema>;
export type Seedream45EditRequestInput = Seedream45EditRequest;
export type Seedream45EditParsedRequest = z.output<
  typeof Seedream45EditRequestSchema
>;
export type SoraWatermarkRequest = z.input<typeof SoraWatermarkRequestSchema>;
export type SoraWatermarkRequestInput = SoraWatermarkRequest;
export type SoraWatermarkParsedRequest = z.output<
  typeof SoraWatermarkRequestSchema
>;
export type PixverseV6TextToVideoInput = z.infer<
  typeof PixverseV6TextToVideoInputSchema
>;
export type PixverseV6TextToVideoRequest = z.input<
  typeof PixverseV6TextToVideoRequestSchema
>;
export type PixverseV6TextToVideoRequestInput = PixverseV6TextToVideoRequest;
export type PixverseV6TextToVideoParsedRequest = z.output<
  typeof PixverseV6TextToVideoRequestSchema
>;
export type PixverseV6ImageToVideoInput = z.infer<
  typeof PixverseV6ImageToVideoInputSchema
>;
export type PixverseV6ImageToVideoRequest = z.input<
  typeof PixverseV6ImageToVideoRequestSchema
>;
export type PixverseV6ImageToVideoRequestInput = PixverseV6ImageToVideoRequest;
export type PixverseV6ImageToVideoParsedRequest = z.output<
  typeof PixverseV6ImageToVideoRequestSchema
>;
export type PixverseV6TransitionInput = z.infer<
  typeof PixverseV6TransitionInputSchema
>;
export type PixverseV6TransitionRequest = z.input<
  typeof PixverseV6TransitionRequestSchema
>;
export type PixverseV6TransitionRequestInput = PixverseV6TransitionRequest;
export type PixverseV6TransitionParsedRequest = z.output<
  typeof PixverseV6TransitionRequestSchema
>;
export type PixverseV6ExtendInput = z.infer<typeof PixverseV6ExtendInputSchema>;
export type PixverseV6ExtendRequest = z.input<
  typeof PixverseV6ExtendRequestSchema
>;
export type PixverseV6ExtendRequestInput = PixverseV6ExtendRequest;
export type PixverseV6ExtendParsedRequest = z.output<
  typeof PixverseV6ExtendRequestSchema
>;
export type PixverseV6ReferenceToVideoInput = z.infer<
  typeof PixverseV6ReferenceToVideoInputSchema
>;
export type PixverseV6ReferenceToVideoRequest = z.input<
  typeof PixverseV6ReferenceToVideoRequestSchema
>;
export type PixverseV6ReferenceToVideoRequestInput =
  PixverseV6ReferenceToVideoRequest;
export type PixverseV6ReferenceToVideoParsedRequest = z.output<
  typeof PixverseV6ReferenceToVideoRequestSchema
>;
export type MiniMaxH3TextToVideoInput = z.input<
  typeof MiniMaxH3TextToVideoInputSchema
>;
export type MiniMaxH3TextToVideoParsedInput = z.output<
  typeof MiniMaxH3TextToVideoInputSchema
>;
export type MiniMaxH3TextToVideoRequest = z.input<
  typeof MiniMaxH3TextToVideoRequestSchema
>;
export type MiniMaxH3TextToVideoRequestInput = MiniMaxH3TextToVideoRequest;
export type MiniMaxH3TextToVideoParsedRequest = z.output<
  typeof MiniMaxH3TextToVideoRequestSchema
>;
export type MiniMaxH3ImageToVideoInput = z.input<
  typeof MiniMaxH3ImageToVideoInputSchema
>;
export type MiniMaxH3ImageToVideoParsedInput = z.output<
  typeof MiniMaxH3ImageToVideoInputSchema
>;
export type MiniMaxH3ImageToVideoRequest = z.input<
  typeof MiniMaxH3ImageToVideoRequestSchema
>;
export type MiniMaxH3ImageToVideoRequestInput = MiniMaxH3ImageToVideoRequest;
export type MiniMaxH3ImageToVideoParsedRequest = z.output<
  typeof MiniMaxH3ImageToVideoRequestSchema
>;
export type MiniMaxH3ReferenceToVideoInput = z.input<
  typeof MiniMaxH3ReferenceToVideoInputSchema
>;
export type MiniMaxH3ReferenceToVideoParsedInput = z.output<
  typeof MiniMaxH3ReferenceToVideoInputSchema
>;
export type MiniMaxH3ReferenceToVideoRequest = z.input<
  typeof MiniMaxH3ReferenceToVideoRequestSchema
>;
export type MiniMaxH3ReferenceToVideoRequestInput =
  MiniMaxH3ReferenceToVideoRequest;
export type MiniMaxH3ReferenceToVideoParsedRequest = z.output<
  typeof MiniMaxH3ReferenceToVideoRequestSchema
>;
export type GoogleGeminiTtsInput = z.input<typeof GoogleGeminiTtsInputSchema>;
export type GoogleGeminiTtsParsedInput = z.output<
  typeof GoogleGeminiTtsInputSchema
>;
export type GoogleGemini25ProTtsRequest = z.input<
  typeof GoogleGemini25ProTtsRequestSchema
>;
export type GoogleGemini25ProTtsRequestInput = GoogleGemini25ProTtsRequest;
export type GoogleGemini25ProTtsParsedRequest = z.output<
  typeof GoogleGemini25ProTtsRequestSchema
>;
export type GoogleGemini31FlashTtsRequest = z.input<
  typeof GoogleGemini31FlashTtsRequestSchema
>;
export type GoogleGemini31FlashTtsRequestInput = GoogleGemini31FlashTtsRequest;
export type GoogleGemini31FlashTtsParsedRequest = z.output<
  typeof GoogleGemini31FlashTtsRequestSchema
>;
export type GoogleImagen4AspectRatio = z.infer<
  typeof GoogleImagen4AspectRatioSchema
>;
export type GoogleImagen4Request = z.input<typeof GoogleImagen4RequestSchema>;
export type GoogleImagen4RequestInput = GoogleImagen4Request;
export type GoogleImagen4ParsedRequest = z.output<
  typeof GoogleImagen4RequestSchema
>;
export type GoogleImagen4FastRequest = z.input<
  typeof GoogleImagen4FastRequestSchema
>;
export type GoogleImagen4FastRequestInput = GoogleImagen4FastRequest;
export type GoogleImagen4FastParsedRequest = z.output<
  typeof GoogleImagen4FastRequestSchema
>;
export type GoogleImagen4UltraRequest = z.input<
  typeof GoogleImagen4UltraRequestSchema
>;
export type GoogleImagen4UltraRequestInput = GoogleImagen4UltraRequest;
export type GoogleImagen4UltraParsedRequest = z.output<
  typeof GoogleImagen4UltraRequestSchema
>;
export type GoogleNanoBananaAspectRatio = z.infer<
  typeof GoogleNanoBananaAspectRatioSchema
>;
export type GoogleNanoBananaOutputFormat = z.infer<
  typeof GoogleNanoBananaOutputFormatSchema
>;
export type GoogleNanoBananaRequest = z.input<
  typeof GoogleNanoBananaRequestSchema
>;
export type GoogleNanoBananaRequestInput = GoogleNanoBananaRequest;
export type GoogleNanoBananaParsedRequest = z.output<
  typeof GoogleNanoBananaRequestSchema
>;
export type GoogleNanoBananaEditRequest = z.input<
  typeof GoogleNanoBananaEditRequestSchema
>;
export type GoogleNanoBananaEditRequestInput = GoogleNanoBananaEditRequest;
export type GoogleNanoBananaEditParsedRequest = z.output<
  typeof GoogleNanoBananaEditRequestSchema
>;

export type TopazUpscaleFactor = z.infer<typeof TopazUpscaleFactorSchema>;
export type TopazImageUpscaleRequest = z.input<
  typeof TopazImageUpscaleRequestSchema
>;
export type TopazImageUpscaleRequestInput = TopazImageUpscaleRequest;
export type TopazImageUpscaleParsedRequest = z.output<
  typeof TopazImageUpscaleRequestSchema
>;
export type TopazVideoUpscaleRequest = z.input<
  typeof TopazVideoUpscaleRequestSchema
>;
export type TopazVideoUpscaleRequestInput = TopazVideoUpscaleRequest;
export type TopazVideoUpscaleParsedRequest = z.output<
  typeof TopazVideoUpscaleRequestSchema
>;
export type InfinitalkFromAudioResolution = z.infer<
  typeof InfinitalkFromAudioResolutionSchema
>;
export type InfinitalkFromAudioRequest = z.input<
  typeof InfinitalkFromAudioRequestSchema
>;
export type InfinitalkFromAudioRequestInput = InfinitalkFromAudioRequest;
export type InfinitalkFromAudioParsedRequest = z.output<
  typeof InfinitalkFromAudioRequestSchema
>;
export type ZImageAspectRatio = z.infer<typeof ZImageAspectRatioSchema>;
export type ZImageRequest = z.input<typeof ZImageRequestSchema>;
export type ZImageRequestInput = ZImageRequest;
export type ZImageParsedRequest = z.output<typeof ZImageRequestSchema>;
export type Flux2TextToImageAspectRatio = z.infer<
  typeof Flux2TextToImageAspectRatioSchema
>;
export type Flux2ImageToImageAspectRatio = z.infer<
  typeof Flux2ImageToImageAspectRatioSchema
>;
export type Flux2Resolution = z.infer<typeof Flux2ResolutionSchema>;
export type Flux2ProTextToImageRequest = z.input<
  typeof Flux2ProTextToImageRequestSchema
>;
export type Flux2ProTextToImageRequestInput = Flux2ProTextToImageRequest;
export type Flux2ProTextToImageParsedRequest = z.output<
  typeof Flux2ProTextToImageRequestSchema
>;
export type Flux2FlexTextToImageRequest = z.input<
  typeof Flux2FlexTextToImageRequestSchema
>;
export type Flux2FlexTextToImageRequestInput = Flux2FlexTextToImageRequest;
export type Flux2FlexTextToImageParsedRequest = z.output<
  typeof Flux2FlexTextToImageRequestSchema
>;
export type Flux2ProImageToImageRequest = z.input<
  typeof Flux2ProImageToImageRequestSchema
>;
export type Flux2ProImageToImageRequestInput = Flux2ProImageToImageRequest;
export type Flux2ProImageToImageParsedRequest = z.output<
  typeof Flux2ProImageToImageRequestSchema
>;
export type Flux2FlexImageToImageRequest = z.input<
  typeof Flux2FlexImageToImageRequestSchema
>;
export type Flux2FlexImageToImageRequestInput = Flux2FlexImageToImageRequest;
export type Flux2FlexImageToImageParsedRequest = z.output<
  typeof Flux2FlexImageToImageRequestSchema
>;
export type IdeogramRenderingSpeed = z.infer<
  typeof IdeogramRenderingSpeedSchema
>;
export type IdeogramImageSize = z.infer<typeof IdeogramImageSizeSchema>;
export type IdeogramNumImages = z.infer<typeof IdeogramNumImagesSchema>;
export type IdeogramV3Style = z.infer<typeof IdeogramV3StyleSchema>;
export type IdeogramCharacterStyle = z.infer<
  typeof IdeogramCharacterStyleSchema
>;
export type IdeogramV3TextToImageRequest = z.input<
  typeof IdeogramV3TextToImageRequestSchema
>;
export type IdeogramV3TextToImageRequestInput = IdeogramV3TextToImageRequest;
export type IdeogramV3TextToImageParsedRequest = z.output<
  typeof IdeogramV3TextToImageRequestSchema
>;
export type IdeogramV3EditRequest = z.input<typeof IdeogramV3EditRequestSchema>;
export type IdeogramV3EditRequestInput = IdeogramV3EditRequest;
export type IdeogramV3EditParsedRequest = z.output<
  typeof IdeogramV3EditRequestSchema
>;
export type IdeogramV3RemixRequest = z.input<
  typeof IdeogramV3RemixRequestSchema
>;
export type IdeogramV3RemixRequestInput = IdeogramV3RemixRequest;
export type IdeogramV3RemixParsedRequest = z.output<
  typeof IdeogramV3RemixRequestSchema
>;
export type IdeogramCharacterRequest = z.input<
  typeof IdeogramCharacterRequestSchema
>;
export type IdeogramCharacterRequestInput = IdeogramCharacterRequest;
export type IdeogramCharacterParsedRequest = z.output<
  typeof IdeogramCharacterRequestSchema
>;
export type IdeogramCharacterEditRequest = z.input<
  typeof IdeogramCharacterEditRequestSchema
>;
export type IdeogramCharacterEditRequestInput = IdeogramCharacterEditRequest;
export type IdeogramCharacterEditParsedRequest = z.output<
  typeof IdeogramCharacterEditRequestSchema
>;
export type IdeogramCharacterRemixRequest = z.input<
  typeof IdeogramCharacterRemixRequestSchema
>;
export type IdeogramCharacterRemixRequestInput = IdeogramCharacterRemixRequest;
export type IdeogramCharacterRemixParsedRequest = z.output<
  typeof IdeogramCharacterRemixRequestSchema
>;
export type HailuoDuration = z.infer<typeof HailuoDurationSchema>;
export type Hailuo02StandardResolution = z.infer<
  typeof Hailuo02StandardResolutionSchema
>;
export type Hailuo23Resolution = z.infer<typeof Hailuo23ResolutionSchema>;
export type Hailuo02TextToVideoProRequest = z.input<
  typeof Hailuo02TextToVideoProRequestSchema
>;
export type Hailuo02TextToVideoProRequestInput = Hailuo02TextToVideoProRequest;
export type Hailuo02TextToVideoProParsedRequest = z.output<
  typeof Hailuo02TextToVideoProRequestSchema
>;
export type Hailuo02TextToVideoStandardRequest = z.input<
  typeof Hailuo02TextToVideoStandardRequestSchema
>;
export type Hailuo02TextToVideoStandardRequestInput =
  Hailuo02TextToVideoStandardRequest;
export type Hailuo02TextToVideoStandardParsedRequest = z.output<
  typeof Hailuo02TextToVideoStandardRequestSchema
>;
export type Hailuo02ImageToVideoProRequest = z.input<
  typeof Hailuo02ImageToVideoProRequestSchema
>;
export type Hailuo02ImageToVideoProRequestInput =
  Hailuo02ImageToVideoProRequest;
export type Hailuo02ImageToVideoProParsedRequest = z.output<
  typeof Hailuo02ImageToVideoProRequestSchema
>;
export type Hailuo02ImageToVideoStandardRequest = z.input<
  typeof Hailuo02ImageToVideoStandardRequestSchema
>;
export type Hailuo02ImageToVideoStandardRequestInput =
  Hailuo02ImageToVideoStandardRequest;
export type Hailuo02ImageToVideoStandardParsedRequest = z.output<
  typeof Hailuo02ImageToVideoStandardRequestSchema
>;
export type Hailuo23ImageToVideoProRequest = z.input<
  typeof Hailuo23ImageToVideoProRequestSchema
>;
export type Hailuo23ImageToVideoProRequestInput =
  Hailuo23ImageToVideoProRequest;
export type Hailuo23ImageToVideoProParsedRequest = z.output<
  typeof Hailuo23ImageToVideoProRequestSchema
>;
export type Hailuo23ImageToVideoStandardRequest = z.input<
  typeof Hailuo23ImageToVideoStandardRequestSchema
>;
export type Hailuo23ImageToVideoStandardRequestInput =
  Hailuo23ImageToVideoStandardRequest;
export type Hailuo23ImageToVideoStandardParsedRequest = z.output<
  typeof Hailuo23ImageToVideoStandardRequestSchema
>;
export type Wan27ImageToVideoRequest = z.input<
  typeof Wan27ImageToVideoRequestSchema
>;
export type Wan27ImageToVideoRequestInput = Wan27ImageToVideoRequest;
export type Wan27ImageToVideoParsedRequest = z.output<
  typeof Wan27ImageToVideoRequestSchema
>;
export type Wan27TextToVideoRequest = z.input<
  typeof Wan27TextToVideoRequestSchema
>;
export type Wan27TextToVideoRequestInput = Wan27TextToVideoRequest;
export type Wan27TextToVideoParsedRequest = z.output<
  typeof Wan27TextToVideoRequestSchema
>;
export type Wan27RefToVideoRequest = z.input<
  typeof Wan27RefToVideoRequestSchema
>;
export type Wan27RefToVideoRequestInput = Wan27RefToVideoRequest;
export type Wan27RefToVideoParsedRequest = z.output<
  typeof Wan27RefToVideoRequestSchema
>;
export type Wan27VideoEditRequest = z.input<typeof Wan27VideoEditRequestSchema>;
export type Wan27VideoEditRequestInput = Wan27VideoEditRequest;
export type Wan27VideoEditParsedRequest = z.output<
  typeof Wan27VideoEditRequestSchema
>;
export type Wan27ImageRequest = z.input<typeof Wan27ImageRequestSchema>;
export type Wan27ImageRequestInput = Wan27ImageRequest;
export type Wan27ImageParsedRequest = z.output<typeof Wan27ImageRequestSchema>;
export type Wan27ImageProRequest = z.input<typeof Wan27ImageProRequestSchema>;
export type Wan27ImageProRequestInput = Wan27ImageProRequest;
export type Wan27ImageProParsedRequest = z.output<
  typeof Wan27ImageProRequestSchema
>;
export type Wan22A14bTurboResolution = z.infer<
  typeof Wan22A14bTurboResolutionSchema
>;
export type Wan22A14bTurboAcceleration = z.infer<
  typeof Wan22A14bTurboAccelerationSchema
>;
export type Wan22A14bTurboAspectRatio = z.infer<
  typeof Wan22A14bTurboAspectRatioSchema
>;
export type Wan22ExtendedResolution = z.infer<
  typeof Wan22ExtendedResolutionSchema
>;
export type Wan25Duration = z.infer<typeof Wan25DurationSchema>;
export type Wan25Resolution = z.infer<typeof Wan25ResolutionSchema>;
export type Wan25AspectRatio = z.infer<typeof Wan25AspectRatioSchema>;
export type Wan26Duration = z.infer<typeof Wan26DurationSchema>;
export type Wan26VideoDuration = z.infer<typeof Wan26VideoDurationSchema>;
export type Wan26Resolution = z.infer<typeof Wan26ResolutionSchema>;
export type Wan22A14bImageToVideoTurboRequest = z.input<
  typeof Wan22A14bImageToVideoTurboRequestSchema
>;
export type Wan22A14bImageToVideoTurboRequestInput =
  Wan22A14bImageToVideoTurboRequest;
export type Wan22A14bImageToVideoTurboParsedRequest = z.output<
  typeof Wan22A14bImageToVideoTurboRequestSchema
>;
export type Wan22A14bSpeechToVideoTurboRequest = z.input<
  typeof Wan22A14bSpeechToVideoTurboRequestSchema
>;
export type Wan22A14bSpeechToVideoTurboRequestInput =
  Wan22A14bSpeechToVideoTurboRequest;
export type Wan22A14bSpeechToVideoTurboParsedRequest = z.output<
  typeof Wan22A14bSpeechToVideoTurboRequestSchema
>;
export type Wan22A14bTextToVideoTurboRequest = z.input<
  typeof Wan22A14bTextToVideoTurboRequestSchema
>;
export type Wan22A14bTextToVideoTurboRequestInput =
  Wan22A14bTextToVideoTurboRequest;
export type Wan22A14bTextToVideoTurboParsedRequest = z.output<
  typeof Wan22A14bTextToVideoTurboRequestSchema
>;
export type Wan22AnimateMoveRequest = z.input<
  typeof Wan22AnimateMoveRequestSchema
>;
export type Wan22AnimateMoveRequestInput = Wan22AnimateMoveRequest;
export type Wan22AnimateMoveParsedRequest = z.output<
  typeof Wan22AnimateMoveRequestSchema
>;
export type Wan22AnimateReplaceRequest = z.input<
  typeof Wan22AnimateReplaceRequestSchema
>;
export type Wan22AnimateReplaceRequestInput = Wan22AnimateReplaceRequest;
export type Wan22AnimateReplaceParsedRequest = z.output<
  typeof Wan22AnimateReplaceRequestSchema
>;
export type Wan25ImageToVideoRequest = z.input<
  typeof Wan25ImageToVideoRequestSchema
>;
export type Wan25ImageToVideoRequestInput = Wan25ImageToVideoRequest;
export type Wan25ImageToVideoParsedRequest = z.output<
  typeof Wan25ImageToVideoRequestSchema
>;
export type Wan25TextToVideoRequest = z.input<
  typeof Wan25TextToVideoRequestSchema
>;
export type Wan25TextToVideoRequestInput = Wan25TextToVideoRequest;
export type Wan25TextToVideoParsedRequest = z.output<
  typeof Wan25TextToVideoRequestSchema
>;
export type Wan26FlashImageToVideoRequest = z.input<
  typeof Wan26FlashImageToVideoRequestSchema
>;
export type Wan26FlashImageToVideoRequestInput = Wan26FlashImageToVideoRequest;
export type Wan26FlashImageToVideoParsedRequest = z.output<
  typeof Wan26FlashImageToVideoRequestSchema
>;
export type Wan26FlashVideoToVideoRequest = z.input<
  typeof Wan26FlashVideoToVideoRequestSchema
>;
export type Wan26FlashVideoToVideoRequestInput = Wan26FlashVideoToVideoRequest;
export type Wan26FlashVideoToVideoParsedRequest = z.output<
  typeof Wan26FlashVideoToVideoRequestSchema
>;
export type Wan26ImageToVideoRequest = z.input<
  typeof Wan26ImageToVideoRequestSchema
>;
export type Wan26ImageToVideoRequestInput = Wan26ImageToVideoRequest;
export type Wan26ImageToVideoParsedRequest = z.output<
  typeof Wan26ImageToVideoRequestSchema
>;
export type Wan26TextToVideoRequest = z.input<
  typeof Wan26TextToVideoRequestSchema
>;
export type Wan26TextToVideoRequestInput = Wan26TextToVideoRequest;
export type Wan26TextToVideoParsedRequest = z.output<
  typeof Wan26TextToVideoRequestSchema
>;
export type Wan26VideoToVideoRequest = z.input<
  typeof Wan26VideoToVideoRequestSchema
>;
export type Wan26VideoToVideoRequestInput = Wan26VideoToVideoRequest;
export type Wan26VideoToVideoParsedRequest = z.output<
  typeof Wan26VideoToVideoRequestSchema
>;
export type HappyHorseTextToVideoRequest = z.input<
  typeof HappyHorseTextToVideoRequestSchema
>;
export type HappyHorseTextToVideoRequestInput = HappyHorseTextToVideoRequest;
export type HappyHorseTextToVideoParsedRequest = z.output<
  typeof HappyHorseTextToVideoRequestSchema
>;
export type HappyHorseImageToVideoRequest = z.input<
  typeof HappyHorseImageToVideoRequestSchema
>;
export type HappyHorseImageToVideoRequestInput = HappyHorseImageToVideoRequest;
export type HappyHorseImageToVideoParsedRequest = z.output<
  typeof HappyHorseImageToVideoRequestSchema
>;
export type HappyHorseReferenceToVideoRequest = z.input<
  typeof HappyHorseReferenceToVideoRequestSchema
>;
export type HappyHorseReferenceToVideoRequestInput =
  HappyHorseReferenceToVideoRequest;
export type HappyHorseReferenceToVideoParsedRequest = z.output<
  typeof HappyHorseReferenceToVideoRequestSchema
>;
export type HappyHorseVideoEditRequest = z.input<
  typeof HappyHorseVideoEditRequestSchema
>;
export type HappyHorseVideoEditRequestInput = HappyHorseVideoEditRequest;
export type HappyHorseVideoEditParsedRequest = z.output<
  typeof HappyHorseVideoEditRequestSchema
>;
export type HappyHorse11TextToVideoRequest = z.input<
  typeof HappyHorse11TextToVideoRequestSchema
>;
export type HappyHorse11TextToVideoRequestInput =
  HappyHorse11TextToVideoRequest;
export type HappyHorse11TextToVideoParsedRequest = z.output<
  typeof HappyHorse11TextToVideoRequestSchema
>;
export type HappyHorse11ImageToVideoRequest = z.input<
  typeof HappyHorse11ImageToVideoRequestSchema
>;
export type HappyHorse11ImageToVideoRequestInput =
  HappyHorse11ImageToVideoRequest;
export type HappyHorse11ImageToVideoParsedRequest = z.output<
  typeof HappyHorse11ImageToVideoRequestSchema
>;
export type HappyHorse11ReferenceToVideoRequest = z.input<
  typeof HappyHorse11ReferenceToVideoRequestSchema
>;
export type HappyHorse11ReferenceToVideoRequestInput =
  HappyHorse11ReferenceToVideoRequest;
export type HappyHorse11ReferenceToVideoParsedRequest = z.output<
  typeof HappyHorse11ReferenceToVideoRequestSchema
>;
export type HappyHorse11CreateTaskResponse = z.infer<
  typeof HappyHorse11CreateTaskResponseSchema
>;
export type Omnihuman15Request = z.input<typeof Omnihuman15RequestSchema>;
export type Omnihuman15RequestInput = Omnihuman15Request;
export type Omnihuman15ParsedRequest = z.output<
  typeof Omnihuman15RequestSchema
>;
export type Omnihuman15HumanIdentificationRequest = z.input<
  typeof Omnihuman15HumanIdentificationRequestSchema
>;
export type Omnihuman15HumanIdentificationRequestInput =
  Omnihuman15HumanIdentificationRequest;
export type Omnihuman15HumanIdentificationParsedRequest = z.output<
  typeof Omnihuman15HumanIdentificationRequestSchema
>;
export type Omnihuman15SubjectDetectionRequest = z.input<
  typeof Omnihuman15SubjectDetectionRequestSchema
>;
export type Omnihuman15SubjectDetectionRequestInput =
  Omnihuman15SubjectDetectionRequest;
export type Omnihuman15SubjectDetectionParsedRequest = z.output<
  typeof Omnihuman15SubjectDetectionRequestSchema
>;
export type VolcengineVideoToVideoLipSyncRequest = z.input<
  typeof VolcengineVideoToVideoLipSyncRequestSchema
>;
export type VolcengineVideoToVideoLipSyncRequestInput =
  VolcengineVideoToVideoLipSyncRequest;
export type VolcengineVideoToVideoLipSyncParsedRequest = z.output<
  typeof VolcengineVideoToVideoLipSyncRequestSchema
>;
export type GeminiOmniVideoRequest = z.input<
  typeof GeminiOmniVideoRequestSchema
>;
export type GeminiOmniVideoRequestInput = GeminiOmniVideoRequest;
export type GeminiOmniVideoParsedRequest = z.output<
  typeof GeminiOmniVideoRequestSchema
>;
export type ElevenLabsAudioIsolationRequest = z.input<
  typeof ElevenLabsAudioIsolationRequestSchema
>;
export type ElevenLabsAudioIsolationRequestInput =
  ElevenLabsAudioIsolationRequest;
export type ElevenLabsAudioIsolationParsedRequest = z.output<
  typeof ElevenLabsAudioIsolationRequestSchema
>;
export type ElevenLabsTextToDialogueV3Request = z.input<
  typeof ElevenLabsTextToDialogueV3RequestSchema
>;
export type ElevenLabsTextToDialogueV3RequestInput =
  ElevenLabsTextToDialogueV3Request;
export type ElevenLabsTextToDialogueV3ParsedRequest = z.output<
  typeof ElevenLabsTextToDialogueV3RequestSchema
>;
export type ElevenLabsTextToSpeechMultilingualV2Request = z.input<
  typeof ElevenLabsTextToSpeechMultilingualV2RequestSchema
>;
export type ElevenLabsTextToSpeechMultilingualV2RequestInput =
  ElevenLabsTextToSpeechMultilingualV2Request;
export type ElevenLabsTextToSpeechMultilingualV2ParsedRequest = z.output<
  typeof ElevenLabsTextToSpeechMultilingualV2RequestSchema
>;
export type ElevenLabsTextToSpeechTurbo25Request = z.input<
  typeof ElevenLabsTextToSpeechTurbo25RequestSchema
>;
export type ElevenLabsTextToSpeechTurbo25RequestInput =
  ElevenLabsTextToSpeechTurbo25Request;
export type ElevenLabsTextToSpeechTurbo25ParsedRequest = z.output<
  typeof ElevenLabsTextToSpeechTurbo25RequestSchema
>;
export type ElevenLabsSoundEffectV2Request = z.input<
  typeof ElevenLabsSoundEffectV2RequestSchema
>;
export type ElevenLabsSoundEffectV2RequestInput =
  ElevenLabsSoundEffectV2Request;
export type ElevenLabsSoundEffectV2ParsedRequest = z.output<
  typeof ElevenLabsSoundEffectV2RequestSchema
>;
export type Wan27TaskResultJson = z.infer<typeof Wan27TaskResultJsonSchema>;
export type Wan27VideoResult = z.infer<typeof Wan27VideoResultSchema>;
export type Wan27ImageResult = z.infer<typeof Wan27ImageResultSchema>;
export type Seedance2MiniTaskResultJson = z.infer<
  typeof Seedance2MiniTaskResultJsonSchema
>;
export type Seedance2MiniRecordInfoData = z.infer<
  typeof Seedance2MiniRecordInfoDataSchema
>;
export type Seedance2MiniRecordInfoResponse = z.infer<
  typeof Seedance2MiniRecordInfoResponseSchema
>;
export type RecordInfoRequest = z.input<typeof RecordInfoRequestSchema>;
export type RecordInfoRequestInput = RecordInfoRequest;
export type Gpt4oImageRecordInfoResponseSchemaType = z.infer<
  typeof Gpt4oImageRecordInfoResponseSchema
>;
export type TaskResponseParsed = z.output<typeof TaskResponseSchema>;

export type UploadMediaRequest = z.input<typeof UploadMediaRequestSchema>;
export type UploadMediaRequestInput = UploadMediaRequest;
export type UploadMediaParsedRequest = z.output<
  typeof UploadMediaRequestSchema
>;
export type FileUrlUploadRequest = z.input<typeof FileUrlUploadRequestSchema>;
export type FileUrlUploadRequestInput = FileUrlUploadRequest;
export type FileUrlUploadParsedRequest = z.output<
  typeof FileUrlUploadRequestSchema
>;
export type FileBase64UploadRequest = z.input<
  typeof FileBase64UploadRequestSchema
>;
export type FileBase64UploadRequestInput = FileBase64UploadRequest;
export type FileBase64UploadParsedRequest = z.output<
  typeof FileBase64UploadRequestSchema
>;
export type DownloadUrlRequest = z.input<typeof DownloadUrlRequestSchema>;
export type DownloadUrlRequestInput = DownloadUrlRequest;
export type DownloadUrlParsedRequest = z.output<
  typeof DownloadUrlRequestSchema
>;
export type Gpt4oImageDownloadUrlRequest = z.input<
  typeof Gpt4oImageDownloadUrlRequestSchema
>;
export type Gpt4oImageDownloadUrlRequestInput = Gpt4oImageDownloadUrlRequest;
export type Gpt4oImageDownloadUrlParsedRequest = z.output<
  typeof Gpt4oImageDownloadUrlRequestSchema
>;
export type GeminiOmniAudioVoiceId = z.infer<
  typeof GeminiOmniAudioVoiceIdSchema
>;
export type GeminiOmniAudioCreateRequest = z.input<
  typeof GeminiOmniAudioCreateRequestSchema
>;
export type GeminiOmniAudioCreateRequestInput = GeminiOmniAudioCreateRequest;
export type GeminiOmniAudioCreateParsedRequest = z.output<
  typeof GeminiOmniAudioCreateRequestSchema
>;
export type GeminiOmniCharacterCreateRequest = z.input<
  typeof GeminiOmniCharacterCreateRequestSchema
>;
export type GeminiOmniCharacterCreateRequestInput =
  GeminiOmniCharacterCreateRequest;
export type GeminiOmniCharacterCreateParsedRequest = z.output<
  typeof GeminiOmniCharacterCreateRequestSchema
>;
export type GeminiOmniCharacterCreateData = z.output<
  typeof GeminiOmniCharacterCreateDataSchema
>;
export type GeminiOmniCharacterCreateResponse = z.output<
  typeof GeminiOmniCharacterCreateResponseSchema
>;
export type KieGeminiRole = z.infer<typeof KieGeminiRoleSchema>;
export type KieGeminiThinkingLevel = z.infer<
  typeof KieGeminiThinkingLevelSchema
>;
export type KieGeminiInlineData = z.infer<typeof KieGeminiInlineDataSchema>;
export type KieGeminiFileData = z.infer<typeof KieGeminiFileDataSchema>;
export type KieGeminiPart = z.infer<typeof KieGeminiPartSchema>;
export type KieGeminiContent = z.infer<typeof KieGeminiContentSchema>;
export type KieGeminiFunctionParameters = z.infer<
  typeof KieGeminiFunctionParametersSchema
>;
export type KieGeminiFunctionDeclaration = z.infer<
  typeof KieGeminiFunctionDeclarationSchema
>;
export type KieGeminiGoogleSearch = z.infer<typeof KieGeminiGoogleSearchSchema>;
export type KieGeminiGoogleSearchTool = z.infer<
  typeof KieGeminiGoogleSearchToolSchema
>;
export type KieGeminiFunctionDeclarationsTool = z.infer<
  typeof KieGeminiFunctionDeclarationsToolSchema
>;
export type KieGeminiTool = z.infer<typeof KieGeminiToolSchema>;
export type KieGeminiThinkingConfig = z.infer<
  typeof KieGeminiThinkingConfigSchema
>;
export type KieGeminiGenerationConfig = z.infer<
  typeof KieGeminiGenerationConfigSchema
>;
export type KieGemini35FlashStreamGenerateContentRequest = z.input<
  typeof KieGemini35FlashStreamGenerateContentRequestSchema
>;
export type KieGemini35FlashStreamGenerateContentParsedRequest = z.output<
  typeof KieGemini35FlashStreamGenerateContentRequestSchema
>;
export type KieGemini36FlashStreamGenerateContentRequest = z.input<
  typeof KieGemini36FlashStreamGenerateContentRequestSchema
>;
export type KieGemini36FlashStreamGenerateContentParsedRequest = z.output<
  typeof KieGemini36FlashStreamGenerateContentRequestSchema
>;
export type KieOptions = z.infer<typeof KieOptionsSchema>;

export type MediaGenerationRequest = z.input<
  typeof MediaGenerationRequestSchema
>;
export type MediaGenerationRequestInput = MediaGenerationRequest;
export type MediaGenerationParsedRequest = z.output<
  typeof MediaGenerationRequestSchema
>;
