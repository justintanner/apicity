import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

export const ElevenLabsOptionsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type ElevenLabsOptions = z.infer<typeof ElevenLabsOptionsSchema>;

// ---------------------------------------------------------------------------
// GET /v2/voices
// ---------------------------------------------------------------------------

export const ElevenLabsListVoicesRequestSchema = z.object({
  next_page_token: z.string().nullable().optional(),
  page_size: z.number().int().max(100).optional(),
  search: z.string().nullable().optional(),
  sort: z.enum(["created_at_unix", "name"]).nullable().optional(),
  sort_direction: z.enum(["asc", "desc"]).nullable().optional(),
  voice_type: z
    .enum([
      "personal",
      "community",
      "default",
      "workspace",
      "non-default",
      "non-community",
      "saved",
    ])
    .nullable()
    .optional(),
  category: z
    .enum(["premade", "cloned", "generated", "professional"])
    .nullable()
    .optional(),
  fine_tuning_state: z
    .enum([
      "draft",
      "not_verified",
      "not_started",
      "queued",
      "fine_tuning",
      "fine_tuned",
      "failed",
      "delayed",
    ])
    .nullable()
    .optional(),
  collection_id: z.string().nullable().optional(),
  include_total_count: z.boolean().optional(),
  voice_ids: z.array(z.string()).max(100).nullable().optional(),
});

export type ElevenLabsListVoicesRequest = z.input<
  typeof ElevenLabsListVoicesRequestSchema
>;
export type ElevenLabsListVoicesRequestInput = ElevenLabsListVoicesRequest;
export type ElevenLabsListVoicesParsedRequest = z.output<
  typeof ElevenLabsListVoicesRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/voices/:voice_id
// ---------------------------------------------------------------------------

export const ElevenLabsGetVoiceRequestSchema = z.object({
  with_settings: z.boolean().optional(),
});

export type ElevenLabsGetVoiceRequest = z.input<
  typeof ElevenLabsGetVoiceRequestSchema
>;
export type ElevenLabsGetVoiceRequestInput = ElevenLabsGetVoiceRequest;
export type ElevenLabsGetVoiceParsedRequest = z.output<
  typeof ElevenLabsGetVoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/voices
// ---------------------------------------------------------------------------

export const ElevenLabsListV1VoicesRequestSchema = z.object({
  show_legacy: z.boolean().nullable().optional(),
});

export type ElevenLabsListV1VoicesRequest = z.input<
  typeof ElevenLabsListV1VoicesRequestSchema
>;
export type ElevenLabsListV1VoicesRequestInput = ElevenLabsListV1VoicesRequest;
export type ElevenLabsListV1VoicesParsedRequest = z.output<
  typeof ElevenLabsListV1VoicesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/add
// ---------------------------------------------------------------------------

export const ElevenLabsAddVoiceRequestSchema = z.object({
  name: z.string(),
  files: z.array(z.custom<Blob>((value) => value instanceof Blob)).min(1),
  remove_background_noise: z.boolean().optional(),
  description: z.string().nullable().optional(),
  labels: z
    .union([z.record(z.string(), z.string()), z.string()])
    .nullable()
    .optional(),
});

export type ElevenLabsAddVoiceRequest = z.input<
  typeof ElevenLabsAddVoiceRequestSchema
>;
export type ElevenLabsAddVoiceRequestInput = ElevenLabsAddVoiceRequest;
export type ElevenLabsAddVoiceParsedRequest = z.output<
  typeof ElevenLabsAddVoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/:voice_id/edit
// ---------------------------------------------------------------------------

export const ElevenLabsEditVoiceRequestSchema = z.object({
  name: z.string(),
  files: z.array(z.custom<Blob>((value) => value instanceof Blob)).optional(),
  remove_background_noise: z.boolean().optional(),
  description: z.string().nullable().optional(),
  labels: z
    .union([z.record(z.string(), z.string()), z.string()])
    .nullable()
    .optional(),
  moderate_metadata: z.boolean().optional(),
});

export type ElevenLabsEditVoiceRequest = z.input<
  typeof ElevenLabsEditVoiceRequestSchema
>;
export type ElevenLabsEditVoiceRequestInput = ElevenLabsEditVoiceRequest;
export type ElevenLabsEditVoiceParsedRequest = z.output<
  typeof ElevenLabsEditVoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/:voice_id/settings/edit
// ---------------------------------------------------------------------------

export const ElevenLabsEditVoiceSettingsRequestSchema = z.object({
  stability: z.number().nullable().optional(),
  use_speaker_boost: z.boolean().nullable().optional(),
  similarity_boost: z.number().nullable().optional(),
  style: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
});

export type ElevenLabsEditVoiceSettingsRequest = z.input<
  typeof ElevenLabsEditVoiceSettingsRequestSchema
>;
export type ElevenLabsEditVoiceSettingsRequestInput =
  ElevenLabsEditVoiceSettingsRequest;
export type ElevenLabsEditVoiceSettingsParsedRequest = z.output<
  typeof ElevenLabsEditVoiceSettingsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/add/:public_user_id/:voice_id
// ---------------------------------------------------------------------------

export const ElevenLabsAddSharedVoiceRequestSchema = z.object({
  new_name: z.string(),
  bookmarked: z.boolean().optional(),
});

export type ElevenLabsAddSharedVoiceRequest = z.input<
  typeof ElevenLabsAddSharedVoiceRequestSchema
>;
export type ElevenLabsAddSharedVoiceRequestInput =
  ElevenLabsAddSharedVoiceRequest;
export type ElevenLabsAddSharedVoiceParsedRequest = z.output<
  typeof ElevenLabsAddSharedVoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/shared-voices
// ---------------------------------------------------------------------------

export const ElevenLabsSharedVoicesRequestSchema = z.object({
  page_size: z.number().int().optional(),
  category: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  age: z.string().nullable().optional(),
  accent: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  use_cases: z.array(z.string()).nullable().optional(),
  descriptives: z.array(z.string()).nullable().optional(),
  featured: z.boolean().optional(),
  min_notice_period_days: z.number().int().nullable().optional(),
  include_custom_rates: z.boolean().nullable().optional(),
  include_live_moderated: z.boolean().nullable().optional(),
  reader_app_enabled: z.boolean().optional(),
  owner_id: z.string().nullable().optional(),
  sort: z.string().nullable().optional(),
  page: z.number().int().optional(),
});

export type ElevenLabsSharedVoicesRequest = z.input<
  typeof ElevenLabsSharedVoicesRequestSchema
>;
export type ElevenLabsSharedVoicesRequestInput = ElevenLabsSharedVoicesRequest;
export type ElevenLabsSharedVoicesParsedRequest = z.output<
  typeof ElevenLabsSharedVoicesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/similar-voices
// ---------------------------------------------------------------------------

export const ElevenLabsSimilarVoicesRequestSchema = z.object({
  audio_file: z.custom<Blob>((value) => value instanceof Blob).optional(),
  similarity_threshold: z.number().nullable().optional(),
  top_k: z.number().int().nullable().optional(),
});

export type ElevenLabsSimilarVoicesRequest = z.input<
  typeof ElevenLabsSimilarVoicesRequestSchema
>;
export type ElevenLabsSimilarVoicesRequestInput =
  ElevenLabsSimilarVoicesRequest;
export type ElevenLabsSimilarVoicesParsedRequest = z.output<
  typeof ElevenLabsSimilarVoicesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/pvc
// ---------------------------------------------------------------------------

export const ElevenLabsCreatePvcVoiceRequestSchema = z.object({
  name: z.string().max(100),
  language: z.string(),
  description: z.string().max(500).nullable().optional(),
  labels: z.record(z.string(), z.string()).nullable().optional(),
});

export type ElevenLabsCreatePvcVoiceRequest = z.input<
  typeof ElevenLabsCreatePvcVoiceRequestSchema
>;
export type ElevenLabsCreatePvcVoiceRequestInput =
  ElevenLabsCreatePvcVoiceRequest;
export type ElevenLabsCreatePvcVoiceParsedRequest = z.output<
  typeof ElevenLabsCreatePvcVoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/pvc/:voice_id
// ---------------------------------------------------------------------------

export const ElevenLabsEditPvcVoiceRequestSchema = z.object({
  name: z.string().max(100),
  language: z.string(),
  description: z.string().max(500).nullable().optional(),
  labels: z.record(z.string(), z.string()).nullable().optional(),
});

export type ElevenLabsEditPvcVoiceRequest = z.input<
  typeof ElevenLabsEditPvcVoiceRequestSchema
>;
export type ElevenLabsEditPvcVoiceRequestInput = ElevenLabsEditPvcVoiceRequest;
export type ElevenLabsEditPvcVoiceParsedRequest = z.output<
  typeof ElevenLabsEditPvcVoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/pvc/:voice_id/samples
// ---------------------------------------------------------------------------

export const ElevenLabsAddPvcSamplesRequestSchema = z.object({
  files: z.array(z.custom<Blob>((value) => value instanceof Blob)).min(1),
  remove_background_noise: z.boolean().optional(),
});

export type ElevenLabsAddPvcSamplesRequest = z.input<
  typeof ElevenLabsAddPvcSamplesRequestSchema
>;
export type ElevenLabsAddPvcSamplesRequestInput =
  ElevenLabsAddPvcSamplesRequest;
export type ElevenLabsAddPvcSamplesParsedRequest = z.output<
  typeof ElevenLabsAddPvcSamplesRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/voices/pvc/:voice_id/samples/:sample_id/audio
// ---------------------------------------------------------------------------

export const ElevenLabsGetPvcSampleAudioRequestSchema = z.object({
  remove_background_noise: z.boolean().optional(),
});

export type ElevenLabsGetPvcSampleAudioRequest = z.input<
  typeof ElevenLabsGetPvcSampleAudioRequestSchema
>;
export type ElevenLabsGetPvcSampleAudioRequestInput =
  ElevenLabsGetPvcSampleAudioRequest;
export type ElevenLabsGetPvcSampleAudioParsedRequest = z.output<
  typeof ElevenLabsGetPvcSampleAudioRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/pvc/:voice_id/captcha
// ---------------------------------------------------------------------------

export const ElevenLabsPvcVoiceCaptchaRequestSchema = z.object({
  recording: z.custom<Blob>((value) => value instanceof Blob),
});

export type ElevenLabsPvcVoiceCaptchaRequest = z.input<
  typeof ElevenLabsPvcVoiceCaptchaRequestSchema
>;
export type ElevenLabsPvcVoiceCaptchaRequestInput =
  ElevenLabsPvcVoiceCaptchaRequest;
export type ElevenLabsPvcVoiceCaptchaParsedRequest = z.output<
  typeof ElevenLabsPvcVoiceCaptchaRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/pvc/:voice_id/samples/:sample_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdatePvcVoiceSampleRequestSchema = z.object({
  remove_background_noise: z.boolean().optional(),
  selected_speaker_ids: z.array(z.string()).nullable().optional(),
  trim_start_time: z.number().int().nullable().optional(),
  trim_end_time: z.number().int().nullable().optional(),
  file_name: z.string().nullable().optional(),
});

export type ElevenLabsUpdatePvcVoiceSampleRequest = z.input<
  typeof ElevenLabsUpdatePvcVoiceSampleRequestSchema
>;
export type ElevenLabsUpdatePvcVoiceSampleRequestInput =
  ElevenLabsUpdatePvcVoiceSampleRequest;
export type ElevenLabsUpdatePvcVoiceSampleParsedRequest = z.output<
  typeof ElevenLabsUpdatePvcVoiceSampleRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/pvc/:voice_id/train
// ---------------------------------------------------------------------------

export const ElevenLabsPvcTrainRequestSchema = z.object({
  model_id: z.string().nullable().optional(),
});

export type ElevenLabsPvcTrainRequest = z.input<
  typeof ElevenLabsPvcTrainRequestSchema
>;
export type ElevenLabsPvcTrainRequestInput = ElevenLabsPvcTrainRequest;
export type ElevenLabsPvcTrainParsedRequest = z.output<
  typeof ElevenLabsPvcTrainRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/sound-generation
// ---------------------------------------------------------------------------

// `output_format` is a query-string parameter, not a body field. We carry it on
// the same request object for ergonomics; the factory strips it out and moves
// it to the URL query before serialising the body.
export const ElevenLabsSoundGenerationRequestSchema = z.object({
  text: z.string().min(1).max(450),
  model_id: z.string().optional(),
  duration_seconds: z.number().min(0.5).max(30).nullable().optional(),
  prompt_influence: z.number().min(0).max(1).nullable().optional(),
  loop: z.boolean().optional(),
  output_format: z.string().optional(),
});

export type ElevenLabsSoundGenerationRequest = z.input<
  typeof ElevenLabsSoundGenerationRequestSchema
>;
export type ElevenLabsSoundGenerationRequestInput =
  ElevenLabsSoundGenerationRequest;
export type ElevenLabsSoundGenerationParsedRequest = z.output<
  typeof ElevenLabsSoundGenerationRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/text-to-speech/:voice_id
// ---------------------------------------------------------------------------

// `voice_id` is a path parameter on the factory method, not a body field.
// `output_format` and `enable_logging` are query-string parameters.
export const ElevenLabsVoiceSettingsSchema = z
  .object({
    stability: z.number().min(0).max(1).optional(),
    similarity_boost: z.number().min(0).max(1).optional(),
    style: z.number().min(0).max(1).optional(),
    use_speaker_boost: z.boolean().optional(),
    speed: z.number().optional(),
  })
  .passthrough();

export const ElevenLabsPronunciationDictionaryLocatorSchema = z
  .object({
    pronunciation_dictionary_id: z.string(),
    version_id: z.string().optional(),
  })
  .passthrough();

// Per-model text length caps for POST /v1/text-to-speech, keyed by model_id.
// Values are upstream's own `maximum_text_length_per_request`, taken from the
// recorded GET /v1/models response
// (tests/recordings/elevenlabs_2379486140/models_343003787). Only models whose
// `can_do_text_to_speech` is true are listed here. That is a statement about
// the table, not about what the schema admits: the alias hatch below is a
// shape check, so a speech-to-speech id (eleven_english_sts_v2,
// eleven_multilingual_sts_v2) parses, finds no entry in this table, and falls
// back to the static 40000-character bound on `text`. Upstream remains the
// authority on which model an endpoint actually serves.
export const ELEVENLABS_TEXT_TO_SPEECH_MODEL_TEXT_LIMITS = {
  eleven_v3: 5000,
  eleven_flash_v2: 30000,
  eleven_flash_v2_5: 40000,
  eleven_monolingual_v1: 10000,
  eleven_multilingual_v1: 10000,
  eleven_multilingual_v2: 10000,
  eleven_turbo_v2: 30000,
  eleven_turbo_v2_5: 40000,
} as const;

// Upstream ships new ElevenLabs model versions before this package's enum
// catches up, so the enum below is unioned with an alias escape hatch. The
// grammar is taken from the recorded GET /v1/models response
// (tests/recordings/elevenlabs_2379486140/models_343003787): an id is
// `eleven_`, then lowercase alphanumeric family segments, then a terminal
// version `v<digits>` with optional dot-free point releases, e.g.
// eleven_flash_v3, eleven_turbo_v3_5. Anchoring the version at the *end* is
// the load-bearing part. A bare family-prefix hatch like
// `/^eleven_[a-z0-9_]+$/` would wrongly accept `eleven_typo` and
// `eleven_v2_flash`; anything that is not a versioned ElevenLabs id must be
// added to the enum explicitly.
const ElevenLabsModelAliasSchema = z
  .string()
  .regex(
    /^eleven_(?:[a-z0-9]+_)*v\d+(?:_\d+)*$/,
    "Expected a listed model or a versioned ElevenLabs id (e.g. eleven_flash_v3)"
  );

export const ElevenLabsTextToSpeechModelIdSchema = z
  .enum([
    "eleven_v3",
    "eleven_flash_v2",
    "eleven_flash_v2_5",
    "eleven_monolingual_v1",
    "eleven_multilingual_v1",
    "eleven_multilingual_v2",
    "eleven_turbo_v2",
    "eleven_turbo_v2_5",
  ])
  .or(ElevenLabsModelAliasSchema);

// The most permissive documented cap. It is applied statically to `text` so
// that it survives conversion to MCP tool input JSON Schema; the per-model cap
// is layered on as a .superRefine below. Cross-field refinements are dropped by
// that conversion (the converter unwraps ZodEffects to its inner type), so an
// MCP client sees this permissive bound rather than the per-model one. Callers
// using .safeParse directly get the exact per-model cap.
const ELEVENLABS_TEXT_TO_SPEECH_MAX_TEXT_LENGTH = 40000;

// ElevenLabs serves POST /v1/text-to-speech with this model when the request
// omits `model_id`. The recorded GET /v1/models response carries no `default`
// flag, so this comes from ElevenLabs' documentation rather than from evidence
// in this repo — re-check it against upstream docs before trusting it. This is
// the single place to update if upstream changes its default; the cap itself is
// read from ELEVENLABS_TEXT_TO_SPEECH_MODEL_TEXT_LIMITS, never hardcoded.
const ELEVENLABS_TEXT_TO_SPEECH_DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export const ElevenLabsTextToSpeechRequestSchema = z
  .object({
    text: z.string().min(1).max(ELEVENLABS_TEXT_TO_SPEECH_MAX_TEXT_LENGTH),
    model_id: ElevenLabsTextToSpeechModelIdSchema.optional(),
    language_code: z.string().nullable().optional(),
    voice_settings: ElevenLabsVoiceSettingsSchema.nullable().optional(),
    pronunciation_dictionary_locators: z
      .array(ElevenLabsPronunciationDictionaryLocatorSchema)
      .nullable()
      .optional(),
    seed: z.number().int().min(0).max(4294967295).nullable().optional(),
    previous_text: z.string().nullable().optional(),
    next_text: z.string().nullable().optional(),
    previous_request_ids: z.array(z.string()).nullable().optional(),
    next_request_ids: z.array(z.string()).nullable().optional(),
    use_pvc_as_ivc: z.boolean().optional(),
    apply_text_normalization: z.enum(["auto", "on", "off"]).optional(),
    output_format: z.string().optional(),
    enable_logging: z.boolean().optional(),
  })
  .superRefine((req, ctx) => {
    const { model_id } = req;
    // An omitted model_id is not "no model": upstream serves the request with
    // its default TTS model, so validate against that model's cap.
    const isDefaulted = model_id === undefined;
    const effectiveModelId = isDefaulted
      ? ELEVENLABS_TEXT_TO_SPEECH_DEFAULT_MODEL_ID
      : model_id;
    // An id admitted by the alias hatch has no entry in the cap table, so it
    // has no per-model cap — only the static .max() bound on `text` applies.
    if (!(effectiveModelId in ELEVENLABS_TEXT_TO_SPEECH_MODEL_TEXT_LIMITS))
      return;
    const limit =
      ELEVENLABS_TEXT_TO_SPEECH_MODEL_TEXT_LIMITS[
        effectiveModelId as keyof typeof ELEVENLABS_TEXT_TO_SPEECH_MODEL_TEXT_LIMITS
      ];
    if (req.text.length > limit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: isDefaulted
          ? `This request omits model_id, so ElevenLabs will use ${effectiveModelId}, which accepts at most ${limit} characters of text; received ${req.text.length}. Set model_id explicitly to use a model with a larger cap.`
          : `${req.model_id} accepts at most ${limit} characters of text; received ${req.text.length}.`,
        path: ["text"],
      });
    }
  })
  .describe(
    "Text accepts at most 10000 characters when model_id is omitted " +
      "(ElevenLabs defaults to eleven_multilingual_v2). Explicit model_id " +
      "values use their model-specific limits, up to 40000 characters."
  );

export type ElevenLabsTextToSpeechRequest = z.input<
  typeof ElevenLabsTextToSpeechRequestSchema
>;
export type ElevenLabsTextToSpeechRequestInput = ElevenLabsTextToSpeechRequest;
export type ElevenLabsTextToSpeechParsedRequest = z.output<
  typeof ElevenLabsTextToSpeechRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/text-to-dialogue
// ---------------------------------------------------------------------------

export const ElevenLabsTextToDialogueRequestSchema = z.object({
  inputs: z
    .array(
      z.object({
        text: z.string().min(1),
        voice_id: z.string().min(1),
      })
    )
    .min(1),
  model_id: z.string().optional(),
  language_code: z.string().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
  pronunciation_dictionary_locators: z
    .array(ElevenLabsPronunciationDictionaryLocatorSchema)
    .nullable()
    .optional(),
  seed: z.number().int().min(0).max(4294967295).nullable().optional(),
  apply_text_normalization: z.enum(["auto", "on", "off"]).optional(),
  output_format: z.string().optional(),
  enable_logging: z.boolean().optional(),
});

export type ElevenLabsTextToDialogueRequest = z.input<
  typeof ElevenLabsTextToDialogueRequestSchema
>;
export type ElevenLabsTextToDialogueRequestInput =
  ElevenLabsTextToDialogueRequest;
export type ElevenLabsTextToDialogueParsedRequest = z.output<
  typeof ElevenLabsTextToDialogueRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/speech-to-text
// ---------------------------------------------------------------------------

// ElevenLabs ships new Scribe model versions before this package's enum catches
// up, so the enum below is unioned with an alias escape hatch. The upstream
// grammar for this family is literal `scribe_v`, then a version `<digits>` with
// optional underscore-separated point releases, e.g. scribe_v3, scribe_v2_5.
// Anchoring the version at the *end* is the load-bearing part: a looser hatch
// like `/^scribe_.+$/` would wrongly accept `scribe_typo`. The `scribe_` prefix
// also keeps the modality boundary — `eleven_flash_v3` is a text-to-speech id
// and must not become a valid speech-to-text `model_id`.
const ElevenLabsScribeModelAliasSchema = z
  .string()
  .regex(
    /^scribe_v\d+(?:_\d+)*$/,
    "Expected a listed model or a versioned ElevenLabs Scribe id (e.g. scribe_v3)"
  );

// Multipart form: exactly one of `file` or `cloud_storage_url` is required.
// `enable_logging` is a query-string parameter; the factory strips it from the
// body and moves it to the URL.
export const ElevenLabsSpeechToTextRequestSchema = z.object({
  model_id: z
    .enum(["scribe_v1", "scribe_v2"])
    .or(ElevenLabsScribeModelAliasSchema),
  file: z.custom<Blob>().optional(),
  cloud_storage_url: z.string().url().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  language_code: z.string().nullable().optional(),
  tag_audio_events: z.boolean().optional(),
  num_speakers: z.number().int().min(1).max(32).nullable().optional(),
  timestamps_granularity: z.enum(["none", "word", "character"]).optional(),
  diarize: z.boolean().optional(),
  diarization_threshold: z.number().min(0).max(2).nullable().optional(),
  additional_formats: z.array(z.record(z.string(), z.unknown())).optional(),
  file_format: z.enum(["pcm_s16le_16", "other"]).optional(),
  webhook: z.boolean().optional(),
  webhook_id: z.string().nullable().optional(),
  webhook_metadata: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .nullable()
    .optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  seed: z.number().int().min(0).max(2147483647).nullable().optional(),
  use_multi_channel: z.boolean().optional(),
  entity_detection: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .optional(),
  entity_redaction: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .optional(),
  entity_redaction_mode: z
    .enum(["redacted", "entity_type", "enumerated_entity_type"])
    .optional(),
  no_verbatim: z.boolean().optional(),
  detect_speaker_roles: z.boolean().optional(),
  keyterms: z.array(z.string().max(50)).max(1000).optional(),
  enable_logging: z.boolean().optional(),
});

export type ElevenLabsSpeechToTextRequest = z.input<
  typeof ElevenLabsSpeechToTextRequestSchema
>;
export type ElevenLabsSpeechToTextRequestInput = ElevenLabsSpeechToTextRequest;
export type ElevenLabsSpeechToTextParsedRequest = z.output<
  typeof ElevenLabsSpeechToTextRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/speech-to-speech/{voiceId}  (and /stream)
// ---------------------------------------------------------------------------

// Multipart form: `audio` is the source recording whose content/emotion drives
// the conversion. `output_format` and `enable_logging` are query-string params;
// the factory strips them from the body and moves them to the URL.
// `voice_settings` must be sent as a JSON-encoded string in the form body; the
// factory accepts either a settings object (serialized for you) or a string.
export const ElevenLabsSpeechToSpeechRequestSchema = z.object({
  audio: z.custom<Blob>(),
  model_id: z.string().optional(),
  voice_settings: z
    .union([ElevenLabsVoiceSettingsSchema, z.string()])
    .nullable()
    .optional(),
  seed: z.number().int().min(0).max(4294967295).nullable().optional(),
  remove_background_noise: z.boolean().optional(),
  file_format: z.enum(["pcm_s16le_16", "other"]).nullable().optional(),
  output_format: z.string().optional(),
  enable_logging: z.boolean().optional(),
});

export type ElevenLabsSpeechToSpeechRequest = z.input<
  typeof ElevenLabsSpeechToSpeechRequestSchema
>;
export type ElevenLabsSpeechToSpeechRequestInput =
  ElevenLabsSpeechToSpeechRequest;
export type ElevenLabsSpeechToSpeechParsedRequest = z.output<
  typeof ElevenLabsSpeechToSpeechRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/audio-isolation  (and /stream)
// ---------------------------------------------------------------------------

const ElevenLabsAudioIsolationFileFormatSchema = z.enum([
  "pcm_s16le_16",
  "other",
]);

export const ElevenLabsAudioIsolationRequestSchema = z.object({
  audio: z.custom<Blob>((value) => value instanceof Blob),
  file_format: ElevenLabsAudioIsolationFileFormatSchema.nullable().optional(),
  preview_b64: z.string().nullable().optional(),
});

export type ElevenLabsAudioIsolationRequest = z.input<
  typeof ElevenLabsAudioIsolationRequestSchema
>;
export type ElevenLabsAudioIsolationRequestInput =
  ElevenLabsAudioIsolationRequest;
export type ElevenLabsAudioIsolationParsedRequest = z.output<
  typeof ElevenLabsAudioIsolationRequestSchema
>;

export const ElevenLabsAudioIsolationStreamRequestSchema = z.object({
  audio: z.custom<Blob>((value) => value instanceof Blob),
  file_format: ElevenLabsAudioIsolationFileFormatSchema.nullable().optional(),
});

export type ElevenLabsAudioIsolationStreamRequest = z.input<
  typeof ElevenLabsAudioIsolationStreamRequestSchema
>;
export type ElevenLabsAudioIsolationStreamRequestInput =
  ElevenLabsAudioIsolationStreamRequest;
export type ElevenLabsAudioIsolationStreamParsedRequest = z.output<
  typeof ElevenLabsAudioIsolationStreamRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/audio-isolation/history
// ---------------------------------------------------------------------------

export const ElevenLabsAudioIsolationHistoryListRequestSchema = z.object({
  page_size: z.number().int().min(1).max(1000).optional(),
  page: z.number().int().min(1).optional(),
  search: z.string().nullable().optional(),
});

export type ElevenLabsAudioIsolationHistoryListRequest = z.input<
  typeof ElevenLabsAudioIsolationHistoryListRequestSchema
>;
export type ElevenLabsAudioIsolationHistoryListRequestInput =
  ElevenLabsAudioIsolationHistoryListRequest;
export type ElevenLabsAudioIsolationHistoryListParsedRequest = z.output<
  typeof ElevenLabsAudioIsolationHistoryListRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/audio-native
// ---------------------------------------------------------------------------

const ElevenLabsAudioNativeTextNormalizationSchema = z.enum([
  "auto",
  "on",
  "off",
  "apply_english",
]);

export const ElevenLabsAudioNativeCreateProjectRequestSchema = z.object({
  name: z.string(),
  image: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  small: z.boolean().optional(),
  text_color: z.string().nullable().optional(),
  background_color: z.string().nullable().optional(),
  sessionization: z.number().int().optional(),
  voice_id: z.string().nullable().optional(),
  model_id: z.string().nullable().optional(),
  file: z.custom<Blob>((value) => value instanceof Blob).optional(),
  auto_convert: z.boolean().optional(),
  apply_text_normalization:
    ElevenLabsAudioNativeTextNormalizationSchema.nullable().optional(),
  pronunciation_dictionary_locators: z.array(z.string()).optional(),
});

export type ElevenLabsAudioNativeCreateProjectRequest = z.input<
  typeof ElevenLabsAudioNativeCreateProjectRequestSchema
>;
export type ElevenLabsAudioNativeCreateProjectRequestInput =
  ElevenLabsAudioNativeCreateProjectRequest;
export type ElevenLabsAudioNativeCreateProjectParsedRequest = z.output<
  typeof ElevenLabsAudioNativeCreateProjectRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/audio-native/content
// ---------------------------------------------------------------------------

export const ElevenLabsAudioNativeUpdateContentFromUrlRequestSchema = z.object({
  url: z.string().url(),
  author: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

export type ElevenLabsAudioNativeUpdateContentFromUrlRequest = z.input<
  typeof ElevenLabsAudioNativeUpdateContentFromUrlRequestSchema
>;
export type ElevenLabsAudioNativeUpdateContentFromUrlRequestInput =
  ElevenLabsAudioNativeUpdateContentFromUrlRequest;
export type ElevenLabsAudioNativeUpdateContentFromUrlParsedRequest = z.output<
  typeof ElevenLabsAudioNativeUpdateContentFromUrlRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/audio-native/:project_id/content
// ---------------------------------------------------------------------------

export const ElevenLabsAudioNativeUpdateProjectContentRequestSchema = z.object({
  file: z.custom<Blob>((value) => value instanceof Blob).optional(),
  auto_convert: z.boolean().optional(),
  auto_publish: z.boolean().optional(),
});

export type ElevenLabsAudioNativeUpdateProjectContentRequest = z.input<
  typeof ElevenLabsAudioNativeUpdateProjectContentRequestSchema
>;
export type ElevenLabsAudioNativeUpdateProjectContentRequestInput =
  ElevenLabsAudioNativeUpdateProjectContentRequest;
export type ElevenLabsAudioNativeUpdateProjectContentParsedRequest = z.output<
  typeof ElevenLabsAudioNativeUpdateProjectContentRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/forced-alignment
// ---------------------------------------------------------------------------

export const ElevenLabsForcedAlignmentRequestSchema = z.object({
  file: z.custom<Blob>((value) => value instanceof Blob),
  text: z.string(),
});

export type ElevenLabsForcedAlignmentRequest = z.input<
  typeof ElevenLabsForcedAlignmentRequestSchema
>;
export type ElevenLabsForcedAlignmentRequestInput =
  ElevenLabsForcedAlignmentRequest;
export type ElevenLabsForcedAlignmentParsedRequest = z.output<
  typeof ElevenLabsForcedAlignmentRequestSchema
>;

// ---------------------------------------------------------------------------
// Music shared schemas
// ---------------------------------------------------------------------------

const ElevenLabsMusicTimeRangeSchema = z.object({
  start_ms: z.number().int(),
  end_ms: z.number().int(),
});

const ElevenLabsMusicSongSectionSchema = z.object({
  section_name: z.string(),
  positive_local_styles: z.array(z.string()),
  negative_local_styles: z.array(z.string()),
  duration_ms: z.number().int(),
  lines: z.array(z.string()),
  source_from: z
    .object({
      song_id: z.string(),
      range: ElevenLabsMusicTimeRangeSchema,
      negative_ranges: z.array(ElevenLabsMusicTimeRangeSchema).optional(),
    })
    .nullable()
    .optional(),
});

const ElevenLabsMusicPromptSchema = z.object({
  positive_global_styles: z.array(z.string()),
  negative_global_styles: z.array(z.string()),
  sections: z.array(ElevenLabsMusicSongSectionSchema),
});

const ElevenLabsMusicAudioRefChunkSchema = z.object({
  song_id: z.string(),
  range: ElevenLabsMusicTimeRangeSchema,
});

const ElevenLabsMusicGenerationChunkSchema = z.object({
  text: z.string(),
  duration_ms: z.number().int(),
  positive_styles: z.array(z.string()),
  negative_styles: z.array(z.string()).optional(),
  context_adherence: z.enum(["low", "medium", "high"]).optional(),
  conditioning_ref: ElevenLabsMusicAudioRefChunkSchema.nullable().optional(),
  condition_strength: z
    .enum(["low", "medium", "high", "xhigh"])
    .nullable()
    .optional(),
});

const ElevenLabsCompositionPlanSchema = z.object({
  chunks: z.array(
    z.union([
      ElevenLabsMusicGenerationChunkSchema,
      ElevenLabsMusicAudioRefChunkSchema,
    ])
  ),
});

const ElevenLabsMusicCompositionPlanSchema = z.union([
  ElevenLabsMusicPromptSchema,
  ElevenLabsCompositionPlanSchema,
]);

// ElevenLabs ships new music model versions before this package's enum catches
// up, so the enum below is unioned with an alias escape hatch. The upstream
// grammar for this family is literal `music_v`, then a version `<digits>` with
// optional underscore-separated point releases, e.g. music_v3, music_v2_5.
// Anchoring the version at the *end* is the load-bearing part: a looser hatch
// like `/^music_.+$/` would wrongly accept `music_typo`. Anything that is not a
// versioned music id must be added to the enum explicitly.
const ElevenLabsMusicModelAliasSchema = z
  .string()
  .regex(
    /^music_v\d+(?:_\d+)*$/,
    "Expected a listed model or a versioned ElevenLabs music id (e.g. music_v3)"
  );

const ElevenLabsMusicModelIdSchema = z
  .enum(["music_v1", "music_v2"])
  .or(ElevenLabsMusicModelAliasSchema);

// `output_format` is a query-string parameter, not a body field. As with the
// other audio endpoints, it is carried on the same request object and the
// factory strips it out and moves it to the URL query.
const musicComposeBaseShape = {
  prompt: z.string().max(4100).nullable().optional(),
  generation_mode: z
    .enum(["track", "loop", "ambience", "video_to_music"])
    .nullable()
    .optional(),
  lyrics_text: z.string().max(4000).nullable().optional(),
  composition_plan: ElevenLabsMusicCompositionPlanSchema.nullable().optional(),
  music_length_ms: z.number().int().min(3000).max(600000).nullable().optional(),
  model_id: ElevenLabsMusicModelIdSchema.optional(),
  seed: z.number().int().min(0).max(2147483647).nullable().optional(),
  force_instrumental: z.boolean().optional(),
  finetune_id: z.string().max(100).nullable().optional(),
  finetune_strength: z.number().optional(),
  use_phonetic_names: z.boolean().optional(),
  store_for_inpainting: z.boolean().optional(),
};

// ---------------------------------------------------------------------------
// POST /v1/music
// ---------------------------------------------------------------------------

export const ElevenLabsComposeMusicRequestSchema = z.object({
  ...musicComposeBaseShape,
  respect_sections_durations: z.boolean().optional(),
  sign_with_c2pa: z.boolean().optional(),
  output_format: z.string().optional(),
});

export type ElevenLabsComposeMusicRequest = z.input<
  typeof ElevenLabsComposeMusicRequestSchema
>;
export type ElevenLabsComposeMusicRequestInput = ElevenLabsComposeMusicRequest;
export type ElevenLabsComposeMusicParsedRequest = z.output<
  typeof ElevenLabsComposeMusicRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/music/detailed
// ---------------------------------------------------------------------------

export const ElevenLabsComposeMusicDetailedRequestSchema = z.object({
  ...musicComposeBaseShape,
  respect_sections_durations: z.boolean().optional(),
  with_timestamps: z.boolean().optional(),
  sign_with_c2pa: z.boolean().optional(),
  output_format: z.string().optional(),
});

export type ElevenLabsComposeMusicDetailedRequest = z.input<
  typeof ElevenLabsComposeMusicDetailedRequestSchema
>;
export type ElevenLabsComposeMusicDetailedRequestInput =
  ElevenLabsComposeMusicDetailedRequest;
export type ElevenLabsComposeMusicDetailedParsedRequest = z.output<
  typeof ElevenLabsComposeMusicDetailedRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/music/stream
// ---------------------------------------------------------------------------

export const ElevenLabsComposeMusicStreamRequestSchema = z.object({
  ...musicComposeBaseShape,
  output_format: z.string().optional(),
});

export type ElevenLabsComposeMusicStreamRequest = z.input<
  typeof ElevenLabsComposeMusicStreamRequestSchema
>;
export type ElevenLabsComposeMusicStreamRequestInput =
  ElevenLabsComposeMusicStreamRequest;
export type ElevenLabsComposeMusicStreamParsedRequest = z.output<
  typeof ElevenLabsComposeMusicStreamRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/music/plan
// ---------------------------------------------------------------------------

export const ElevenLabsMusicPlanRequestSchema = z.object({
  prompt: z.string().max(4100),
  music_length_ms: z.number().int().min(3000).max(600000).nullable().optional(),
  source_composition_plan:
    ElevenLabsMusicCompositionPlanSchema.nullable().optional(),
  model_id: ElevenLabsMusicModelIdSchema.optional(),
});

export type ElevenLabsMusicPlanRequest = z.input<
  typeof ElevenLabsMusicPlanRequestSchema
>;
export type ElevenLabsMusicPlanRequestInput = ElevenLabsMusicPlanRequest;
export type ElevenLabsMusicPlanParsedRequest = z.output<
  typeof ElevenLabsMusicPlanRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/music/stem-separation
// ---------------------------------------------------------------------------

export const ElevenLabsMusicStemSeparationRequestSchema = z.object({
  file: z.custom<Blob>((value) => value instanceof Blob),
  stem_variation_id: z.enum(["two_stems_v1", "six_stems_v1"]).optional(),
  sign_with_c2pa: z.boolean().optional(),
  output_format: z.string().optional(),
});

export type ElevenLabsMusicStemSeparationRequest = z.input<
  typeof ElevenLabsMusicStemSeparationRequestSchema
>;
export type ElevenLabsMusicStemSeparationRequestInput =
  ElevenLabsMusicStemSeparationRequest;
export type ElevenLabsMusicStemSeparationParsedRequest = z.output<
  typeof ElevenLabsMusicStemSeparationRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/music/upload
// ---------------------------------------------------------------------------

export const ElevenLabsMusicUploadRequestSchema = z.object({
  file: z.custom<Blob>((value) => value instanceof Blob),
  extract_composition_plan: z
    .union([z.boolean(), z.enum(["music_v1", "music_v2"])])
    .optional(),
  with_timestamps: z.boolean().optional(),
});

export type ElevenLabsMusicUploadRequest = z.input<
  typeof ElevenLabsMusicUploadRequestSchema
>;
export type ElevenLabsMusicUploadRequestInput = ElevenLabsMusicUploadRequest;
export type ElevenLabsMusicUploadParsedRequest = z.output<
  typeof ElevenLabsMusicUploadRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/music/video-to-music
// ---------------------------------------------------------------------------

export const ElevenLabsVideoToMusicRequestSchema = z.object({
  videos: z
    .array(z.custom<Blob>((value) => value instanceof Blob))
    .min(1)
    .max(10),
  description: z.string().min(1).max(1000).nullable().optional(),
  tags: z.array(z.string()).max(10).optional(),
  model_id: ElevenLabsMusicModelIdSchema.optional(),
  sign_with_c2pa: z.boolean().optional(),
  output_format: z.string().optional(),
});

export type ElevenLabsVideoToMusicRequest = z.input<
  typeof ElevenLabsVideoToMusicRequestSchema
>;
export type ElevenLabsVideoToMusicRequestInput = ElevenLabsVideoToMusicRequest;
export type ElevenLabsVideoToMusicParsedRequest = z.output<
  typeof ElevenLabsVideoToMusicRequestSchema
>;

// ---------------------------------------------------------------------------
// Workspace administration shared schemas
// ---------------------------------------------------------------------------

const ElevenLabsWorkspaceSeatTypeSchema = z.enum([
  "workspace_admin",
  "workspace_member",
  "workspace_lite_member",
]);

const ElevenLabsWorkspaceResourceTypeSchema = z.enum([
  "voice",
  "voice_collection",
  "pronunciation_dictionary",
  "dubbing",
  "project",
  "convai_agents",
  "convai_knowledge_base_documents",
  "convai_tools",
  "convai_settings",
  "convai_secrets",
  "workspace_auth_connections",
  "convai_phone_numbers",
  "convai_mcp_servers",
  "convai_api_integration_connections",
  "convai_api_integration_trigger_connections",
  "convai_batch_calls",
  "convai_agent_response_tests",
  "convai_test_suite_invocations",
  "convai_crawl_jobs",
  "convai_crawl_tasks",
  "convai_whatsapp_accounts",
  "convai_agent_versions",
  "convai_agent_branches",
  "convai_agent_versions_deployments",
  "convai_memory_entries",
  "convai_coaching_proposals",
  "convai_templates",
  "dashboard",
  "dashboard_configuration",
  "convai_agent_drafts",
  "resource_locators",
  "assets",
  "content_generations",
  "content_templates",
  "songs",
  "transcription_tasks",
  "avatars",
  "avatar_video_generations",
  "resource_collection",
  "studio_projects",
]);

const ElevenLabsWorkspaceResourceRoleSchema = z.enum([
  "admin",
  "editor",
  "commenter",
  "viewer",
]);

const ElevenLabsWorkspaceWebhookHmacSettingsSchema = z.object({
  auth_type: z.literal("hmac"),
  name: z.string(),
  webhook_url: z.string(),
  request_headers: z.record(z.string(), z.string()).nullable().optional(),
});

const ElevenLabsWorkspaceAuthAlgorithmSchema = z.enum([
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
]);

const ElevenLabsWorkspaceAuthTokenResponseFieldSchema = z.enum([
  "access_token",
  "id_token",
]);

const ElevenLabsWorkspaceAuthStringMapSchema = z.record(z.string(), z.string());

// ---------------------------------------------------------------------------
// GET /v1/workspace/audit-logs
// ---------------------------------------------------------------------------

export const ElevenLabsListWorkspaceAuditLogsRequestSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().nullable().optional(),
  time_from_unix_ms: z.number().int().nullable().optional(),
  time_to_unix_ms: z.number().int().nullable().optional(),
  actor_uid: z.string().nullable().optional(),
  class_name: z.string().nullable().optional(),
  activity_name: z.string().nullable().optional(),
});

export type ElevenLabsListWorkspaceAuditLogsRequest = z.input<
  typeof ElevenLabsListWorkspaceAuditLogsRequestSchema
>;
export type ElevenLabsListWorkspaceAuditLogsRequestInput =
  ElevenLabsListWorkspaceAuditLogsRequest;
export type ElevenLabsListWorkspaceAuditLogsParsedRequest = z.output<
  typeof ElevenLabsListWorkspaceAuditLogsRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/workspace/groups/search
// ---------------------------------------------------------------------------

export const ElevenLabsSearchWorkspaceGroupsRequestSchema = z.object({
  name: z.string(),
});

export type ElevenLabsSearchWorkspaceGroupsRequest = z.input<
  typeof ElevenLabsSearchWorkspaceGroupsRequestSchema
>;
export type ElevenLabsSearchWorkspaceGroupsRequestInput =
  ElevenLabsSearchWorkspaceGroupsRequest;
export type ElevenLabsSearchWorkspaceGroupsParsedRequest = z.output<
  typeof ElevenLabsSearchWorkspaceGroupsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/groups/:group_id/members
// ---------------------------------------------------------------------------

export const ElevenLabsAddWorkspaceGroupMemberRequestSchema = z.object({
  email: z.string(),
});

export type ElevenLabsAddWorkspaceGroupMemberRequest = z.input<
  typeof ElevenLabsAddWorkspaceGroupMemberRequestSchema
>;
export type ElevenLabsAddWorkspaceGroupMemberRequestInput =
  ElevenLabsAddWorkspaceGroupMemberRequest;
export type ElevenLabsAddWorkspaceGroupMemberParsedRequest = z.output<
  typeof ElevenLabsAddWorkspaceGroupMemberRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/groups/:group_id/members/remove
// ---------------------------------------------------------------------------

export const ElevenLabsRemoveWorkspaceGroupMemberRequestSchema = z.object({
  email: z.string(),
});

export type ElevenLabsRemoveWorkspaceGroupMemberRequest = z.input<
  typeof ElevenLabsRemoveWorkspaceGroupMemberRequestSchema
>;
export type ElevenLabsRemoveWorkspaceGroupMemberRequestInput =
  ElevenLabsRemoveWorkspaceGroupMemberRequest;
export type ElevenLabsRemoveWorkspaceGroupMemberParsedRequest = z.output<
  typeof ElevenLabsRemoveWorkspaceGroupMemberRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/members
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateWorkspaceMemberRequestSchema = z.object({
  email: z.string(),
  is_locked: z.boolean().nullable().optional(),
  workspace_role: ElevenLabsWorkspaceSeatTypeSchema.nullable().optional(),
  workspace_seat_type: ElevenLabsWorkspaceSeatTypeSchema.nullable().optional(),
});

export type ElevenLabsUpdateWorkspaceMemberRequest = z.input<
  typeof ElevenLabsUpdateWorkspaceMemberRequestSchema
>;
export type ElevenLabsUpdateWorkspaceMemberRequestInput =
  ElevenLabsUpdateWorkspaceMemberRequest;
export type ElevenLabsUpdateWorkspaceMemberParsedRequest = z.output<
  typeof ElevenLabsUpdateWorkspaceMemberRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/invites/add
// ---------------------------------------------------------------------------

export const ElevenLabsAddWorkspaceInviteRequestSchema = z.object({
  email: z.string(),
  workspace_permission: z.string().nullable().optional(),
  seat_type: ElevenLabsWorkspaceSeatTypeSchema.nullable().optional(),
  group_ids: z.array(z.string()).nullable().optional(),
});

export type ElevenLabsAddWorkspaceInviteRequest = z.input<
  typeof ElevenLabsAddWorkspaceInviteRequestSchema
>;
export type ElevenLabsAddWorkspaceInviteRequestInput =
  ElevenLabsAddWorkspaceInviteRequest;
export type ElevenLabsAddWorkspaceInviteParsedRequest = z.output<
  typeof ElevenLabsAddWorkspaceInviteRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/invites/add-bulk
// ---------------------------------------------------------------------------

export const ElevenLabsAddWorkspaceInvitesBulkRequestSchema = z.object({
  emails: z.array(z.string()),
  seat_type: ElevenLabsWorkspaceSeatTypeSchema.nullable().optional(),
  group_ids: z.array(z.string()).nullable().optional(),
});

export type ElevenLabsAddWorkspaceInvitesBulkRequest = z.input<
  typeof ElevenLabsAddWorkspaceInvitesBulkRequestSchema
>;
export type ElevenLabsAddWorkspaceInvitesBulkRequestInput =
  ElevenLabsAddWorkspaceInvitesBulkRequest;
export type ElevenLabsAddWorkspaceInvitesBulkParsedRequest = z.output<
  typeof ElevenLabsAddWorkspaceInvitesBulkRequestSchema
>;

// ---------------------------------------------------------------------------
// DELETE /v1/workspace/invites
// ---------------------------------------------------------------------------

export const ElevenLabsDeleteWorkspaceInviteRequestSchema = z.object({
  email: z.string(),
});

export type ElevenLabsDeleteWorkspaceInviteRequest = z.input<
  typeof ElevenLabsDeleteWorkspaceInviteRequestSchema
>;
export type ElevenLabsDeleteWorkspaceInviteRequestInput =
  ElevenLabsDeleteWorkspaceInviteRequest;
export type ElevenLabsDeleteWorkspaceInviteParsedRequest = z.output<
  typeof ElevenLabsDeleteWorkspaceInviteRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/workspace/resources/:resource_id
// ---------------------------------------------------------------------------

export const ElevenLabsGetWorkspaceResourceRequestSchema = z.object({
  resource_type: ElevenLabsWorkspaceResourceTypeSchema,
});

export type ElevenLabsGetWorkspaceResourceRequest = z.input<
  typeof ElevenLabsGetWorkspaceResourceRequestSchema
>;
export type ElevenLabsGetWorkspaceResourceRequestInput =
  ElevenLabsGetWorkspaceResourceRequest;
export type ElevenLabsGetWorkspaceResourceParsedRequest = z.output<
  typeof ElevenLabsGetWorkspaceResourceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/resources/:resource_id/share
// ---------------------------------------------------------------------------

export const ElevenLabsShareWorkspaceResourceRequestSchema = z.object({
  role: ElevenLabsWorkspaceResourceRoleSchema,
  resource_type: ElevenLabsWorkspaceResourceTypeSchema,
  user_email: z.string().nullable().optional(),
  group_id: z.string().nullable().optional(),
  workspace_api_key_id: z.string().nullable().optional(),
});

export type ElevenLabsShareWorkspaceResourceRequest = z.input<
  typeof ElevenLabsShareWorkspaceResourceRequestSchema
>;
export type ElevenLabsShareWorkspaceResourceRequestInput =
  ElevenLabsShareWorkspaceResourceRequest;
export type ElevenLabsShareWorkspaceResourceParsedRequest = z.output<
  typeof ElevenLabsShareWorkspaceResourceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/resources/:resource_id/unshare
// ---------------------------------------------------------------------------

export const ElevenLabsUnshareWorkspaceResourceRequestSchema = z.object({
  resource_type: ElevenLabsWorkspaceResourceTypeSchema,
  user_email: z.string().nullable().optional(),
  group_id: z.string().nullable().optional(),
  workspace_api_key_id: z.string().nullable().optional(),
});

export type ElevenLabsUnshareWorkspaceResourceRequest = z.input<
  typeof ElevenLabsUnshareWorkspaceResourceRequestSchema
>;
export type ElevenLabsUnshareWorkspaceResourceRequestInput =
  ElevenLabsUnshareWorkspaceResourceRequest;
export type ElevenLabsUnshareWorkspaceResourceParsedRequest = z.output<
  typeof ElevenLabsUnshareWorkspaceResourceRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/workspace/webhooks
// ---------------------------------------------------------------------------

export const ElevenLabsListWorkspaceWebhooksRequestSchema = z.object({
  include_usages: z.boolean().optional(),
});

export type ElevenLabsListWorkspaceWebhooksRequest = z.input<
  typeof ElevenLabsListWorkspaceWebhooksRequestSchema
>;
export type ElevenLabsListWorkspaceWebhooksRequestInput =
  ElevenLabsListWorkspaceWebhooksRequest;
export type ElevenLabsListWorkspaceWebhooksParsedRequest = z.output<
  typeof ElevenLabsListWorkspaceWebhooksRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/webhooks
// ---------------------------------------------------------------------------

export const ElevenLabsCreateWorkspaceWebhookRequestSchema = z.object({
  settings: ElevenLabsWorkspaceWebhookHmacSettingsSchema,
});

export type ElevenLabsCreateWorkspaceWebhookRequest = z.input<
  typeof ElevenLabsCreateWorkspaceWebhookRequestSchema
>;
export type ElevenLabsCreateWorkspaceWebhookRequestInput =
  ElevenLabsCreateWorkspaceWebhookRequest;
export type ElevenLabsCreateWorkspaceWebhookParsedRequest = z.output<
  typeof ElevenLabsCreateWorkspaceWebhookRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/workspace/webhooks/:webhook_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateWorkspaceWebhookRequestSchema = z.object({
  is_disabled: z.boolean(),
  name: z.string(),
  retry_enabled: z.boolean().nullable().optional(),
  request_headers: z.record(z.string(), z.string()).nullable().optional(),
});

export type ElevenLabsUpdateWorkspaceWebhookRequest = z.input<
  typeof ElevenLabsUpdateWorkspaceWebhookRequestSchema
>;
export type ElevenLabsUpdateWorkspaceWebhookRequestInput =
  ElevenLabsUpdateWorkspaceWebhookRequest;
export type ElevenLabsUpdateWorkspaceWebhookParsedRequest = z.output<
  typeof ElevenLabsUpdateWorkspaceWebhookRequestSchema
>;

const ElevenLabsCreateOAuth2ClientCredsRequestSchema = z.object({
  name: z.string(),
  auth_type: z.literal("oauth2_client_credentials").optional(),
  provider: z.string(),
  client_id: z.string(),
  token_url: z.string(),
  scopes: z.array(z.string()).optional(),
  extra_params: ElevenLabsWorkspaceAuthStringMapSchema.optional(),
  basic_auth_in_header: z.boolean().optional(),
  client_secret: z.string(),
  custom_headers: ElevenLabsWorkspaceAuthStringMapSchema.optional(),
});

const ElevenLabsCreateCustomHeaderAuthRequestSchema = z.object({
  name: z.string(),
  auth_type: z.literal("custom_header_auth").optional(),
  provider: z.string(),
  header_name: z.string(),
  token: z.string(),
});

const ElevenLabsCreateBasicAuthRequestSchema = z.object({
  name: z.string(),
  auth_type: z.literal("basic_auth").optional(),
  provider: z.string(),
  username: z.string(),
  password: z.string(),
});

const ElevenLabsCreateBearerAuthRequestSchema = z.object({
  name: z.string(),
  auth_type: z.literal("bearer_auth").optional(),
  provider: z.string(),
  token: z.string(),
});

const ElevenLabsCreateOAuth2JwtRequestSchema = z.object({
  name: z.string(),
  auth_type: z.literal("oauth2_jwt").optional(),
  provider: z.string(),
  algorithm: ElevenLabsWorkspaceAuthAlgorithmSchema.optional(),
  key_id: z.string().nullable().optional(),
  issuer: z.string(),
  audience: z.string(),
  subject: z.string(),
  expiration_seconds: z.number().int().min(60).max(86400).optional(),
  extra_params: ElevenLabsWorkspaceAuthStringMapSchema.optional(),
  token_url: z.string(),
  scopes: z.array(z.string()).optional(),
  token_response_field:
    ElevenLabsWorkspaceAuthTokenResponseFieldSchema.optional(),
  secret_key: z.string(),
});

const ElevenLabsCreatePrivateKeyJwtRequestSchema = z.object({
  name: z.string(),
  auth_type: z.literal("private_key_jwt").optional(),
  provider: z.string(),
  algorithm: ElevenLabsWorkspaceAuthAlgorithmSchema.optional(),
  key_id: z.string().nullable().optional(),
  issuer: z.string(),
  audience: z.string(),
  subject: z.string(),
  expiration_seconds: z.number().int().min(60).max(86400).optional(),
  extra_params: ElevenLabsWorkspaceAuthStringMapSchema.optional(),
  secret_key: z.string(),
});

const ElevenLabsCreateMtlsAuthRequestSchema = z.object({
  name: z.string(),
  auth_type: z.literal("mtls").optional(),
  provider: z.string(),
  client_certificate: z.string(),
  client_key: z.string(),
  ca_certificate: z.string().nullable().optional(),
  key_passphrase: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// POST /v1/workspace/auth-connections
// ---------------------------------------------------------------------------

export const ElevenLabsCreateWorkspaceAuthConnectionRequestSchema = z.union([
  ElevenLabsCreateOAuth2ClientCredsRequestSchema,
  ElevenLabsCreateCustomHeaderAuthRequestSchema,
  ElevenLabsCreateBasicAuthRequestSchema,
  ElevenLabsCreateBearerAuthRequestSchema,
  ElevenLabsCreateOAuth2JwtRequestSchema,
  ElevenLabsCreatePrivateKeyJwtRequestSchema,
  ElevenLabsCreateMtlsAuthRequestSchema,
]);

export type ElevenLabsCreateWorkspaceAuthConnectionRequest = z.input<
  typeof ElevenLabsCreateWorkspaceAuthConnectionRequestSchema
>;
export type ElevenLabsCreateWorkspaceAuthConnectionRequestInput =
  ElevenLabsCreateWorkspaceAuthConnectionRequest;
export type ElevenLabsCreateWorkspaceAuthConnectionParsedRequest = z.output<
  typeof ElevenLabsCreateWorkspaceAuthConnectionRequestSchema
>;

const ElevenLabsUpdateOAuth2ClientCredsRequestSchema = z.object({
  auth_type: z.literal("oauth2_client_credentials").optional(),
  provider: z.string().nullable().optional(),
  client_id: z.string().nullable().optional(),
  scopes: z.array(z.string()).nullable().optional(),
  extra_params: ElevenLabsWorkspaceAuthStringMapSchema.nullable().optional(),
  basic_auth_in_header: z.boolean().nullable().optional(),
  client_secret: z.string().nullable().optional(),
  custom_headers: ElevenLabsWorkspaceAuthStringMapSchema.nullable().optional(),
});

const ElevenLabsUpdateBasicAuthRequestSchema = z.object({
  auth_type: z.literal("basic_auth").optional(),
  provider: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
});

const ElevenLabsUpdateBearerAuthRequestSchema = z.object({
  auth_type: z.literal("bearer_auth").optional(),
  provider: z.string().nullable().optional(),
  token: z.string().nullable().optional(),
});

const ElevenLabsUpdateOAuth2JwtRequestSchema = z.object({
  auth_type: z.literal("oauth2_jwt").optional(),
  provider: z.string().nullable().optional(),
  algorithm: ElevenLabsWorkspaceAuthAlgorithmSchema.nullable().optional(),
  key_id: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  audience: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  expiration_seconds: z.number().int().min(60).max(86400).nullable().optional(),
  extra_params: ElevenLabsWorkspaceAuthStringMapSchema.nullable().optional(),
  scopes: z.array(z.string()).nullable().optional(),
  token_response_field:
    ElevenLabsWorkspaceAuthTokenResponseFieldSchema.nullable().optional(),
  secret_key: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// PATCH /v1/workspace/auth-connections/:auth_connection_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateWorkspaceAuthConnectionRequestSchema = z.union([
  ElevenLabsUpdateOAuth2ClientCredsRequestSchema,
  ElevenLabsUpdateBasicAuthRequestSchema,
  ElevenLabsUpdateBearerAuthRequestSchema,
  ElevenLabsUpdateOAuth2JwtRequestSchema,
]);

export type ElevenLabsUpdateWorkspaceAuthConnectionRequest = z.input<
  typeof ElevenLabsUpdateWorkspaceAuthConnectionRequestSchema
>;
export type ElevenLabsUpdateWorkspaceAuthConnectionRequestInput =
  ElevenLabsUpdateWorkspaceAuthConnectionRequest;
export type ElevenLabsUpdateWorkspaceAuthConnectionParsedRequest = z.output<
  typeof ElevenLabsUpdateWorkspaceAuthConnectionRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspaces/api-keys/disable
// ---------------------------------------------------------------------------

export const ElevenLabsDisableWorkspaceApiKeyRequestSchema = z.object({
  api_key_name: z.literal("self"),
});

export type ElevenLabsDisableWorkspaceApiKeyRequest = z.input<
  typeof ElevenLabsDisableWorkspaceApiKeyRequestSchema
>;
export type ElevenLabsDisableWorkspaceApiKeyRequestInput =
  ElevenLabsDisableWorkspaceApiKeyRequest;
export type ElevenLabsDisableWorkspaceApiKeyParsedRequest = z.output<
  typeof ElevenLabsDisableWorkspaceApiKeyRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspaces/api-keys/third-party-disabling
// ---------------------------------------------------------------------------

export const ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequestSchema =
  z.object({
    third_party_disable_allowed: z.boolean().nullable().optional(),
  });

export type ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequest = z.input<
  typeof ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequestSchema
>;
export type ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequestInput =
  ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequest;
export type ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingParsedRequest =
  z.output<typeof ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequestSchema>;

// ---------------------------------------------------------------------------
// Service account shared schemas
// ---------------------------------------------------------------------------

const ElevenLabsServiceAccountPermissionSchema = z.enum([
  "text_to_speech",
  "speech_to_speech",
  "speech_to_text",
  "models_read",
  "models_write",
  "voices_read",
  "voices_write",
  "speech_history_read",
  "speech_history_write",
  "sound_generation",
  "audio_isolation",
  "voice_generation",
  "dubbing_read",
  "dubbing_write",
  "pronunciation_dictionaries_read",
  "pronunciation_dictionaries_write",
  "user_read",
  "user_write",
  "projects_read",
  "projects_write",
  "audio_native_read",
  "audio_native_write",
  "workspace_read",
  "workspace_write",
  "forced_alignment",
  "convai_read",
  "convai_write",
  "music_generation",
  "image_video_generation",
  "add_voice_from_voice_library",
  "create_instant_voice_clone",
  "create_professional_voice_clone",
  "publish_voice_to_voice_library",
  "share_voice_externally",
  "create_user_api_key",
  "workspace_analytics_full_read",
  "webhooks_write",
  "service_account_write",
  "group_members_manage",
  "workspace_members_read",
  "workspace_members_invite",
  "workspace_members_remove",
  "terms_of_service_accept",
  "audit_log_read",
  "conversation_privacy_manage",
  "copy_resources_cross_workspace",
  "synthid_detector",
]);

const ElevenLabsServiceAccountPermissionsSchema = z.union([
  z.array(ElevenLabsServiceAccountPermissionSchema),
  z.literal("all"),
]);

const ElevenLabsAllowedIpsSchema = z.array(z.string()).min(1).max(100);

// ---------------------------------------------------------------------------
// POST /v1/service-accounts/:service_account_user_id/api-keys
// ---------------------------------------------------------------------------

export const ElevenLabsCreateServiceAccountApiKeyRequestSchema = z.object({
  name: z.string(),
  permissions: ElevenLabsServiceAccountPermissionsSchema,
  character_limit: z.number().int().nullable().optional(),
  allowed_ips: ElevenLabsAllowedIpsSchema.nullable().optional(),
  third_party_disable_allowed: z.boolean().nullable().optional(),
});

export type ElevenLabsCreateServiceAccountApiKeyRequest = z.input<
  typeof ElevenLabsCreateServiceAccountApiKeyRequestSchema
>;
export type ElevenLabsCreateServiceAccountApiKeyRequestInput =
  ElevenLabsCreateServiceAccountApiKeyRequest;
export type ElevenLabsCreateServiceAccountApiKeyParsedRequest = z.output<
  typeof ElevenLabsCreateServiceAccountApiKeyRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/service-accounts/:service_account_user_id/api-keys/:api_key_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateServiceAccountApiKeyRequestSchema = z.object({
  is_enabled: z.union([z.boolean(), z.literal("no_update")]).optional(),
  name: z.string().nullable().optional(),
  permissions: z
    .union([
      z.array(ElevenLabsServiceAccountPermissionSchema),
      z.enum(["all", "no_update"]),
    ])
    .optional(),
  character_limit: z
    .union([z.number().int(), z.literal("no_update"), z.null()])
    .optional(),
  allowed_ips: z
    .union([ElevenLabsAllowedIpsSchema, z.enum(["clear", "no_update"])])
    .optional(),
  third_party_disable_allowed: z
    .union([z.boolean(), z.enum(["clear", "no_update"])])
    .optional(),
});

export type ElevenLabsUpdateServiceAccountApiKeyRequest = z.input<
  typeof ElevenLabsUpdateServiceAccountApiKeyRequestSchema
>;
export type ElevenLabsUpdateServiceAccountApiKeyRequestInput =
  ElevenLabsUpdateServiceAccountApiKeyRequest;
export type ElevenLabsUpdateServiceAccountApiKeyParsedRequest = z.output<
  typeof ElevenLabsUpdateServiceAccountApiKeyRequestSchema
>;

// ---------------------------------------------------------------------------
// Workspace analytics shared schemas
// ---------------------------------------------------------------------------

const ElevenLabsWorkspaceAnalyticsGroupBySchema = z.enum([
  "product_type",
  "model",
  "voice_id",
  "user_id",
  "fiat_currency",
  "fiat_charge_type",
  "region",
  "reporting_workspace_id",
  "request_source",
  "resource_id",
  "subresource_id",
  "request_queue_type",
  "voice_multiplier",
  "hashed_xi_api_key",
  "billing_group_id",
]);

const ElevenLabsWorkspaceAnalyticsFilterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const ElevenLabsWorkspaceAnalyticsColumnFilterSchema = z.object({
  column: z.string(),
  operation: z.enum(["in", "not_in", "le", "ge", "lt", "gt", "eq", "neq"]),
  values: z.array(ElevenLabsWorkspaceAnalyticsFilterValueSchema),
});

// ---------------------------------------------------------------------------
// GET /v1/usage/character-stats
// ---------------------------------------------------------------------------

export const ElevenLabsUsageCharacterStatsRequestSchema = z.object({
  start_unix: z.number().int(),
  end_unix: z.number().int(),
});

export type ElevenLabsUsageCharacterStatsRequest = z.input<
  typeof ElevenLabsUsageCharacterStatsRequestSchema
>;
export type ElevenLabsUsageCharacterStatsRequestInput =
  ElevenLabsUsageCharacterStatsRequest;
export type ElevenLabsUsageCharacterStatsParsedRequest = z.output<
  typeof ElevenLabsUsageCharacterStatsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/analytics/requests
// ---------------------------------------------------------------------------

export const ElevenLabsWorkspaceAnalyticsRequestsRequestSchema = z
  .object({
    start_time: z.number().int().min(1577836800000).nullable().optional(),
    end_time: z.number().int().min(1577836800000).nullable().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    sort: z.enum(["asc", "desc"]).nullable().optional(),
    filters: z
      .array(ElevenLabsWorkspaceAnalyticsColumnFilterSchema)
      .nullable()
      .optional(),
    search: z.string().nullable().optional(),
  })
  .superRefine((req, ctx) => {
    if (req.start_time == null && req.end_time == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one of start_time or end_time is required.",
        path: ["start_time"],
      });
    }
  });

export type ElevenLabsWorkspaceAnalyticsRequestsRequest = z.input<
  typeof ElevenLabsWorkspaceAnalyticsRequestsRequestSchema
>;
export type ElevenLabsWorkspaceAnalyticsRequestsRequestInput =
  ElevenLabsWorkspaceAnalyticsRequestsRequest;
export type ElevenLabsWorkspaceAnalyticsRequestsParsedRequest = z.output<
  typeof ElevenLabsWorkspaceAnalyticsRequestsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/workspace/analytics/query/usage-by-product-over-time
// ---------------------------------------------------------------------------

export const ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema =
  z.object({
    start_time: z.number().int().min(1577836800000),
    end_time: z.number().int().min(1577836800000),
    interval_seconds: z.number().int().min(1).optional(),
    group_by: z
      .array(ElevenLabsWorkspaceAnalyticsGroupBySchema)
      .nullable()
      .optional(),
    filters: z
      .array(ElevenLabsWorkspaceAnalyticsColumnFilterSchema)
      .nullable()
      .optional(),
    time_zone: z.string().optional(),
  });

export type ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest = z.input<
  typeof ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema
>;
export type ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestInput =
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest;
export type ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeParsedRequest =
  z.output<
    typeof ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema
  >;

// ---------------------------------------------------------------------------
// POST /v1/voices/pvc/:voice_id/verification
// ---------------------------------------------------------------------------

export const ElevenLabsPvcManualVerificationRequestSchema = z.object({
  files: z.array(z.custom<Blob>((value) => value instanceof Blob)).min(1),
  extra_text: z.string().nullable().optional(),
});

export type ElevenLabsPvcManualVerificationRequest = z.input<
  typeof ElevenLabsPvcManualVerificationRequestSchema
>;
export type ElevenLabsPvcManualVerificationRequestInput =
  ElevenLabsPvcManualVerificationRequest;
export type ElevenLabsPvcManualVerificationParsedRequest = z.output<
  typeof ElevenLabsPvcManualVerificationRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform (Conversational AI) — shared
// ---------------------------------------------------------------------------

// The agent `conversation_config`, `platform_settings`, and `workflow` payloads
// are large, deeply-nested config trees. We keep them as permissive records so
// the schema stays a thin metadata surface — callers compose the nested config
// themselves and the server passes it straight through.
const ElevenLabsAgentConfigObjectSchema = z.record(z.string(), z.unknown());

// ---------------------------------------------------------------------------
// POST /v1/convai/agents/create
// ---------------------------------------------------------------------------

// `enable_versioning` is a query-string parameter, not a body field. We carry it
// on the request object for ergonomics; the factory strips it out and moves it
// to the URL query before serialising the body.
export const ElevenLabsCreateAgentRequestSchema = z.object({
  conversation_config: ElevenLabsAgentConfigObjectSchema,
  platform_settings: ElevenLabsAgentConfigObjectSchema.nullable().optional(),
  workflow: ElevenLabsAgentConfigObjectSchema.optional(),
  name: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  enable_versioning: z.boolean().optional(),
});

export type ElevenLabsCreateAgentRequest = z.input<
  typeof ElevenLabsCreateAgentRequestSchema
>;
export type ElevenLabsCreateAgentRequestInput = ElevenLabsCreateAgentRequest;
export type ElevenLabsCreateAgentParsedRequest = z.output<
  typeof ElevenLabsCreateAgentRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/agents/:agent_id
// ---------------------------------------------------------------------------

export const ElevenLabsGetAgentRequestSchema = z.object({
  version_id: z.string().optional(),
  branch_id: z.string().optional(),
});

export type ElevenLabsGetAgentRequest = z.input<
  typeof ElevenLabsGetAgentRequestSchema
>;
export type ElevenLabsGetAgentRequestInput = ElevenLabsGetAgentRequest;
export type ElevenLabsGetAgentParsedRequest = z.output<
  typeof ElevenLabsGetAgentRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/agents
// ---------------------------------------------------------------------------

export const ElevenLabsListAgentsRequestSchema = z.object({
  page_size: z.number().int().min(1).max(100).optional(),
  search: z.string().nullable().optional(),
  archived: z.boolean().nullable().optional(),
  show_only_owned_agents: z.boolean().optional(),
  created_by_user_id: z.string().nullable().optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
  sort_by: z
    .enum(["name", "created_at", "call_count_7d"])
    .nullable()
    .optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListAgentsRequest = z.input<
  typeof ElevenLabsListAgentsRequestSchema
>;
export type ElevenLabsListAgentsRequestInput = ElevenLabsListAgentsRequest;
export type ElevenLabsListAgentsParsedRequest = z.output<
  typeof ElevenLabsListAgentsRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/agents/:agent_id
// ---------------------------------------------------------------------------

// `enable_versioning_if_not_enabled` and `branch_id` are query-string params.
// The factory strips them from the body and moves them to the URL query.
export const ElevenLabsUpdateAgentRequestSchema = z.object({
  conversation_config: ElevenLabsAgentConfigObjectSchema.nullable().optional(),
  platform_settings: ElevenLabsAgentConfigObjectSchema.nullable().optional(),
  workflow: ElevenLabsAgentConfigObjectSchema.optional(),
  name: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  version_description: z.string().nullable().optional(),
  enable_versioning_if_not_enabled: z.boolean().optional(),
  branch_id: z.string().optional(),
});

export type ElevenLabsUpdateAgentRequest = z.input<
  typeof ElevenLabsUpdateAgentRequestSchema
>;
export type ElevenLabsUpdateAgentRequestInput = ElevenLabsUpdateAgentRequest;
export type ElevenLabsUpdateAgentParsedRequest = z.output<
  typeof ElevenLabsUpdateAgentRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/agents/:agent_id/widget
// ---------------------------------------------------------------------------

export const ElevenLabsGetAgentWidgetRequestSchema = z.object({
  conversation_signature: z.string().optional(),
});

export type ElevenLabsGetAgentWidgetRequest = z.input<
  typeof ElevenLabsGetAgentWidgetRequestSchema
>;
export type ElevenLabsGetAgentWidgetRequestInput =
  ElevenLabsGetAgentWidgetRequest;
export type ElevenLabsGetAgentWidgetParsedRequest = z.output<
  typeof ElevenLabsGetAgentWidgetRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/agents/:agent_id/branches
// ---------------------------------------------------------------------------

export const ElevenLabsListAgentBranchesRequestSchema = z.object({
  include_archived: z.boolean().optional(),
  limit: z.number().int().optional(),
});

export type ElevenLabsListAgentBranchesRequest = z.input<
  typeof ElevenLabsListAgentBranchesRequestSchema
>;
export type ElevenLabsListAgentBranchesRequestInput =
  ElevenLabsListAgentBranchesRequest;
export type ElevenLabsListAgentBranchesParsedRequest = z.output<
  typeof ElevenLabsListAgentBranchesRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/agents/summaries
// ---------------------------------------------------------------------------

export const ElevenLabsGetAgentSummariesRequestSchema = z.object({
  agent_ids: z.array(z.string()).max(100),
});

export type ElevenLabsGetAgentSummariesRequest = z.input<
  typeof ElevenLabsGetAgentSummariesRequestSchema
>;
export type ElevenLabsGetAgentSummariesRequestInput =
  ElevenLabsGetAgentSummariesRequest;
export type ElevenLabsGetAgentSummariesParsedRequest = z.output<
  typeof ElevenLabsGetAgentSummariesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/agents/:agent_id/duplicate
// ---------------------------------------------------------------------------

export const ElevenLabsDuplicateAgentRequestSchema = z.object({
  name: z.string().nullable().optional(),
});

export type ElevenLabsDuplicateAgentRequest = z.input<
  typeof ElevenLabsDuplicateAgentRequestSchema
>;
export type ElevenLabsDuplicateAgentRequestInput =
  ElevenLabsDuplicateAgentRequest;
export type ElevenLabsDuplicateAgentParsedRequest = z.output<
  typeof ElevenLabsDuplicateAgentRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/agents/:agent_id/avatar
// ---------------------------------------------------------------------------

export const ElevenLabsPostAgentAvatarRequestSchema = z.object({
  avatar_file: z.custom<Blob>((value) => value instanceof Blob),
});

export type ElevenLabsPostAgentAvatarRequest = z.input<
  typeof ElevenLabsPostAgentAvatarRequestSchema
>;
export type ElevenLabsPostAgentAvatarRequestInput =
  ElevenLabsPostAgentAvatarRequest;
export type ElevenLabsPostAgentAvatarParsedRequest = z.output<
  typeof ElevenLabsPostAgentAvatarRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/agents/:agent_id/simulate-conversation
// ---------------------------------------------------------------------------

export const ElevenLabsSimulateConversationRequestSchema = z.object({
  simulation_specification: ElevenLabsAgentConfigObjectSchema,
  extra_evaluation_criteria: z
    .array(ElevenLabsAgentConfigObjectSchema)
    .nullable()
    .optional(),
  new_turns_limit: z.number().int().optional(),
});

export type ElevenLabsSimulateConversationRequest = z.input<
  typeof ElevenLabsSimulateConversationRequestSchema
>;
export type ElevenLabsSimulateConversationRequestInput =
  ElevenLabsSimulateConversationRequest;
export type ElevenLabsSimulateConversationParsedRequest = z.output<
  typeof ElevenLabsSimulateConversationRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/agents/:agent_id/topics
// ---------------------------------------------------------------------------

export const ElevenLabsGetAgentTopicsRequestSchema = z.object({
  from_unix_secs: z.number().int().nullable().optional(),
  to_unix_secs: z.number().int().nullable().optional(),
});

export type ElevenLabsGetAgentTopicsRequest = z.input<
  typeof ElevenLabsGetAgentTopicsRequestSchema
>;
export type ElevenLabsGetAgentTopicsRequestInput =
  ElevenLabsGetAgentTopicsRequest;
export type ElevenLabsGetAgentTopicsParsedRequest = z.output<
  typeof ElevenLabsGetAgentTopicsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/agent/:agent_id/llm-usage/calculate
// ---------------------------------------------------------------------------

export const ElevenLabsCalculateAgentLlmUsageRequestSchema = z.object({
  prompt_length: z.number().int().nullable().optional(),
  number_of_pages: z.number().int().nullable().optional(),
  rag_enabled: z.boolean().nullable().optional(),
});

export type ElevenLabsCalculateAgentLlmUsageRequest = z.input<
  typeof ElevenLabsCalculateAgentLlmUsageRequestSchema
>;
export type ElevenLabsCalculateAgentLlmUsageRequestInput =
  ElevenLabsCalculateAgentLlmUsageRequest;
export type ElevenLabsCalculateAgentLlmUsageParsedRequest = z.output<
  typeof ElevenLabsCalculateAgentLlmUsageRequestSchema
>;

// ---------------------------------------------------------------------------
// POST/DELETE /v1/convai/agents/:agent_id/drafts
// ---------------------------------------------------------------------------

export const ElevenLabsCreateAgentDraftRequestSchema = z.object({
  branch_id: z.string(),
  conversation_config: ElevenLabsAgentConfigObjectSchema,
  platform_settings: ElevenLabsAgentConfigObjectSchema,
  workflow: ElevenLabsAgentConfigObjectSchema,
  name: z.string(),
  tags: z.array(z.string()).nullable().optional(),
});

export type ElevenLabsCreateAgentDraftRequest = z.input<
  typeof ElevenLabsCreateAgentDraftRequestSchema
>;
export type ElevenLabsCreateAgentDraftRequestInput =
  ElevenLabsCreateAgentDraftRequest;
export type ElevenLabsCreateAgentDraftParsedRequest = z.output<
  typeof ElevenLabsCreateAgentDraftRequestSchema
>;

export const ElevenLabsDeleteAgentDraftRequestSchema = z.object({
  branch_id: z.string(),
});

export type ElevenLabsDeleteAgentDraftRequest = z.input<
  typeof ElevenLabsDeleteAgentDraftRequestSchema
>;
export type ElevenLabsDeleteAgentDraftRequestInput =
  ElevenLabsDeleteAgentDraftRequest;
export type ElevenLabsDeleteAgentDraftParsedRequest = z.output<
  typeof ElevenLabsDeleteAgentDraftRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/agents/:agent_id/deployments
// ---------------------------------------------------------------------------

export const ElevenLabsCreateAgentDeploymentRequestSchema = z.object({
  deployment_request: z.object({
    requests: z.array(
      z.object({
        branch_id: z.string(),
        deployment_strategy: ElevenLabsAgentConfigObjectSchema,
      })
    ),
  }),
});

export type ElevenLabsCreateAgentDeploymentRequest = z.input<
  typeof ElevenLabsCreateAgentDeploymentRequestSchema
>;
export type ElevenLabsCreateAgentDeploymentRequestInput =
  ElevenLabsCreateAgentDeploymentRequest;
export type ElevenLabsCreateAgentDeploymentParsedRequest = z.output<
  typeof ElevenLabsCreateAgentDeploymentRequestSchema
>;

// ---------------------------------------------------------------------------
// POST/PATCH /v1/convai/agents/:agent_id/branches
// ---------------------------------------------------------------------------

const ElevenLabsAgentBranchProtectionStatusSchema = z.enum([
  "writer_perms_required",
  "admin_perms_required",
]);

export const ElevenLabsCreateAgentBranchRequestSchema = z.object({
  parent_version_id: z.string(),
  name: z.string(),
  description: z.string(),
  conversation_config: ElevenLabsAgentConfigObjectSchema.nullable().optional(),
  platform_settings: ElevenLabsAgentConfigObjectSchema.nullable().optional(),
  workflow: ElevenLabsAgentConfigObjectSchema.nullable().optional(),
});

export type ElevenLabsCreateAgentBranchRequest = z.input<
  typeof ElevenLabsCreateAgentBranchRequestSchema
>;
export type ElevenLabsCreateAgentBranchRequestInput =
  ElevenLabsCreateAgentBranchRequest;
export type ElevenLabsCreateAgentBranchParsedRequest = z.output<
  typeof ElevenLabsCreateAgentBranchRequestSchema
>;

export const ElevenLabsUpdateAgentBranchRequestSchema = z.object({
  name: z.string().nullable().optional(),
  is_archived: z.boolean().nullable().optional(),
  protection_status:
    ElevenLabsAgentBranchProtectionStatusSchema.nullable().optional(),
});

export type ElevenLabsUpdateAgentBranchRequest = z.input<
  typeof ElevenLabsUpdateAgentBranchRequestSchema
>;
export type ElevenLabsUpdateAgentBranchRequestInput =
  ElevenLabsUpdateAgentBranchRequest;
export type ElevenLabsUpdateAgentBranchParsedRequest = z.output<
  typeof ElevenLabsUpdateAgentBranchRequestSchema
>;

export const ElevenLabsMergeAgentBranchRequestSchema = z.object({
  target_branch_id: z.string(),
  archive_source_branch: z.boolean().optional(),
  force: z.boolean().optional(),
});

export type ElevenLabsMergeAgentBranchRequest = z.input<
  typeof ElevenLabsMergeAgentBranchRequestSchema
>;
export type ElevenLabsMergeAgentBranchRequestInput =
  ElevenLabsMergeAgentBranchRequest;
export type ElevenLabsMergeAgentBranchParsedRequest = z.output<
  typeof ElevenLabsMergeAgentBranchRequestSchema
>;

export const ElevenLabsPreviewAgentBranchMergeRequestSchema = z.object({
  target_branch_id: z.string(),
  force: z.boolean().optional(),
});

export type ElevenLabsPreviewAgentBranchMergeRequest = z.input<
  typeof ElevenLabsPreviewAgentBranchMergeRequestSchema
>;
export type ElevenLabsPreviewAgentBranchMergeRequestInput =
  ElevenLabsPreviewAgentBranchMergeRequest;
export type ElevenLabsPreviewAgentBranchMergeParsedRequest = z.output<
  typeof ElevenLabsPreviewAgentBranchMergeRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/analytics/live-count
// ---------------------------------------------------------------------------

export const ElevenLabsGetLiveConversationCountRequestSchema = z.object({
  agent_id: z.string().nullable().optional(),
});

export type ElevenLabsGetLiveConversationCountRequest = z.input<
  typeof ElevenLabsGetLiveConversationCountRequestSchema
>;
export type ElevenLabsGetLiveConversationCountRequestInput =
  ElevenLabsGetLiveConversationCountRequest;
export type ElevenLabsGetLiveConversationCountParsedRequest = z.output<
  typeof ElevenLabsGetLiveConversationCountRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform (Conversational AI) — Misc
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /v1/convai/users
// ---------------------------------------------------------------------------

export const ElevenLabsListConversationUsersRequestSchema = z.object({
  agent_id: z.string().nullable().optional(),
  branch_id: z.string().nullable().optional(),
  call_start_before_unix: z.number().int().nullable().optional(),
  call_start_after_unix: z.number().int().nullable().optional(),
  search: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  sort_by: z.enum(["last_contact_unix_secs", "conversation_count"]).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListConversationUsersRequest = z.input<
  typeof ElevenLabsListConversationUsersRequestSchema
>;
export type ElevenLabsListConversationUsersRequestInput =
  ElevenLabsListConversationUsersRequest;
export type ElevenLabsListConversationUsersParsedRequest = z.output<
  typeof ElevenLabsListConversationUsersRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/llm-usage/calculate
// ---------------------------------------------------------------------------

export const ElevenLabsCalculateLlmUsageRequestSchema = z.object({
  prompt_length: z.number().int(),
  number_of_pages: z.number().int(),
  rag_enabled: z.boolean(),
});

export type ElevenLabsCalculateLlmUsageRequest = z.input<
  typeof ElevenLabsCalculateLlmUsageRequestSchema
>;
export type ElevenLabsCalculateLlmUsageRequestInput =
  ElevenLabsCalculateLlmUsageRequest;
export type ElevenLabsCalculateLlmUsageParsedRequest = z.output<
  typeof ElevenLabsCalculateLlmUsageRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform (Conversational AI) — Conversation Tags
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /v1/convai/tags
// ---------------------------------------------------------------------------

export const ElevenLabsListConversationTagsRequestSchema = z.object({
  page_size: z.number().int().min(1).max(100).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListConversationTagsRequest = z.input<
  typeof ElevenLabsListConversationTagsRequestSchema
>;
export type ElevenLabsListConversationTagsRequestInput =
  ElevenLabsListConversationTagsRequest;
export type ElevenLabsListConversationTagsParsedRequest = z.output<
  typeof ElevenLabsListConversationTagsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/tags
// ---------------------------------------------------------------------------

export const ElevenLabsCreateConversationTagRequestSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
});

export type ElevenLabsCreateConversationTagRequest = z.input<
  typeof ElevenLabsCreateConversationTagRequestSchema
>;
export type ElevenLabsCreateConversationTagRequestInput =
  ElevenLabsCreateConversationTagRequest;
export type ElevenLabsCreateConversationTagParsedRequest = z.output<
  typeof ElevenLabsCreateConversationTagRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/tags/:tag_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateConversationTagRequestSchema = z.object({
  title: z.string().min(1).max(120).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});

export type ElevenLabsUpdateConversationTagRequest = z.input<
  typeof ElevenLabsUpdateConversationTagRequestSchema
>;
export type ElevenLabsUpdateConversationTagRequestInput =
  ElevenLabsUpdateConversationTagRequest;
export type ElevenLabsUpdateConversationTagParsedRequest = z.output<
  typeof ElevenLabsUpdateConversationTagRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform (Conversational AI) — Settings / Secrets / Env Variables
// ---------------------------------------------------------------------------

const ElevenLabsConvaiSecretLocatorSchema = z.object({
  secret_id: z.string(),
});

const ElevenLabsConvaiClientDataWebhookSchema = z.object({
  url: z.string(),
  request_headers: z.record(
    z.string(),
    z.union([z.string(), ElevenLabsConvaiSecretLocatorSchema])
  ),
});

const ElevenLabsConvaiWebhookEventSchema = z.enum([
  "transcript",
  "audio",
  "call_initiation_failure",
  "unredacted_transcript",
  "unredacted_audio",
]);

const ElevenLabsConvaiWebhookTranscriptFormatSchema = z.enum([
  "json",
  "opentelemetry",
]);

const ElevenLabsConvaiWebhooksSchema = z.object({
  post_call_webhook_id: z.string().nullable().optional(),
  events: z.array(ElevenLabsConvaiWebhookEventSchema).optional(),
  transcript_format: ElevenLabsConvaiWebhookTranscriptFormatSchema.optional(),
  send_audio: z.boolean().nullable().optional(),
});

const ElevenLabsConvaiSettingsSchema = z.object({
  conversation_initiation_client_data_webhook:
    ElevenLabsConvaiClientDataWebhookSchema.nullable().optional(),
  webhooks: ElevenLabsConvaiWebhooksSchema.optional(),
  can_use_mcp_servers: z.boolean().optional(),
  rag_retention_period_days: z.number().int().min(1).max(30).optional(),
  conversation_embedding_retention_days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .nullable()
    .optional(),
  default_livekit_stack: z.enum(["standard", "static"]).optional(),
});

// ---------------------------------------------------------------------------
// PATCH /v1/convai/settings
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateConvaiSettingsRequestSchema =
  ElevenLabsConvaiSettingsSchema;

export type ElevenLabsUpdateConvaiSettingsRequest = z.input<
  typeof ElevenLabsUpdateConvaiSettingsRequestSchema
>;
export type ElevenLabsUpdateConvaiSettingsRequestInput =
  ElevenLabsUpdateConvaiSettingsRequest;
export type ElevenLabsUpdateConvaiSettingsParsedRequest = z.output<
  typeof ElevenLabsUpdateConvaiSettingsRequestSchema
>;

const ElevenLabsConvaiDashboardCallSuccessChartSchema = z.object({
  name: z.string(),
  type: z.literal("call_success").optional(),
});

const ElevenLabsConvaiDashboardCriteriaChartSchema = z.object({
  name: z.string(),
  type: z.literal("criteria").optional(),
  criteria_id: z.string(),
});

const ElevenLabsConvaiDashboardDataCollectionChartSchema = z.object({
  name: z.string(),
  type: z.literal("data_collection").optional(),
  data_collection_id: z.string(),
});

const ElevenLabsConvaiDashboardChartSchema = z.union([
  ElevenLabsConvaiDashboardCallSuccessChartSchema,
  ElevenLabsConvaiDashboardCriteriaChartSchema,
  ElevenLabsConvaiDashboardDataCollectionChartSchema,
]);

// ---------------------------------------------------------------------------
// PATCH /v1/convai/settings/dashboard
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateConvaiDashboardSettingsRequestSchema = z.object({
  charts: z.array(ElevenLabsConvaiDashboardChartSchema).max(4).optional(),
});

export type ElevenLabsUpdateConvaiDashboardSettingsRequest = z.input<
  typeof ElevenLabsUpdateConvaiDashboardSettingsRequestSchema
>;
export type ElevenLabsUpdateConvaiDashboardSettingsRequestInput =
  ElevenLabsUpdateConvaiDashboardSettingsRequest;
export type ElevenLabsUpdateConvaiDashboardSettingsParsedRequest = z.output<
  typeof ElevenLabsUpdateConvaiDashboardSettingsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/secrets
// ---------------------------------------------------------------------------

export const ElevenLabsCreateWorkspaceSecretRequestSchema = z.object({
  type: z.literal("new"),
  name: z.string(),
  value: z.string(),
});

export type ElevenLabsCreateWorkspaceSecretRequest = z.input<
  typeof ElevenLabsCreateWorkspaceSecretRequestSchema
>;
export type ElevenLabsCreateWorkspaceSecretRequestInput =
  ElevenLabsCreateWorkspaceSecretRequest;
export type ElevenLabsCreateWorkspaceSecretParsedRequest = z.output<
  typeof ElevenLabsCreateWorkspaceSecretRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/secrets
// ---------------------------------------------------------------------------

export const ElevenLabsListWorkspaceSecretsRequestSchema = z.object({
  page_size: z.number().int().min(1).max(100).nullable().optional(),
  dependency_limit: z.number().int().min(1).max(100).nullable().optional(),
  search: z.string().nullable().optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListWorkspaceSecretsRequest = z.input<
  typeof ElevenLabsListWorkspaceSecretsRequestSchema
>;
export type ElevenLabsListWorkspaceSecretsRequestInput =
  ElevenLabsListWorkspaceSecretsRequest;
export type ElevenLabsListWorkspaceSecretsParsedRequest = z.output<
  typeof ElevenLabsListWorkspaceSecretsRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/secrets/:secret_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateWorkspaceSecretRequestSchema = z.object({
  type: z.literal("update"),
  name: z.string(),
  value: z.string(),
});

export type ElevenLabsUpdateWorkspaceSecretRequest = z.input<
  typeof ElevenLabsUpdateWorkspaceSecretRequestSchema
>;
export type ElevenLabsUpdateWorkspaceSecretRequestInput =
  ElevenLabsUpdateWorkspaceSecretRequest;
export type ElevenLabsUpdateWorkspaceSecretParsedRequest = z.output<
  typeof ElevenLabsUpdateWorkspaceSecretRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/secrets/:secret_id/dependencies/:resource_type
// ---------------------------------------------------------------------------

export const ElevenLabsGetSecretDependenciesRequestSchema = z.object({
  page_size: z.number().int().min(1).max(100).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsGetSecretDependenciesRequest = z.input<
  typeof ElevenLabsGetSecretDependenciesRequestSchema
>;
export type ElevenLabsGetSecretDependenciesRequestInput =
  ElevenLabsGetSecretDependenciesRequest;
export type ElevenLabsGetSecretDependenciesParsedRequest = z.output<
  typeof ElevenLabsGetSecretDependenciesRequestSchema
>;

const ElevenLabsEnvironmentVariableSecretValueRequestSchema = z.object({
  secret_id: z.string(),
});

const ElevenLabsEnvironmentVariableAuthConnectionValueRequestSchema = z.object({
  auth_connection_id: z.string(),
});

const ElevenLabsEnvironmentVariableTypeSchema = z.enum([
  "string",
  "secret",
  "auth_connection",
]);
const ElevenLabsEnvironmentVariableLabelSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,63}$/);

// ---------------------------------------------------------------------------
// GET /v1/convai/environment-variables
// ---------------------------------------------------------------------------

export const ElevenLabsListEnvironmentVariablesRequestSchema = z.object({
  cursor: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  label: z.string().nullable().optional(),
  environment: z.string().nullable().optional(),
  type: ElevenLabsEnvironmentVariableTypeSchema.nullable().optional(),
});

export type ElevenLabsListEnvironmentVariablesRequest = z.input<
  typeof ElevenLabsListEnvironmentVariablesRequestSchema
>;
export type ElevenLabsListEnvironmentVariablesRequestInput =
  ElevenLabsListEnvironmentVariablesRequest;
export type ElevenLabsListEnvironmentVariablesParsedRequest = z.output<
  typeof ElevenLabsListEnvironmentVariablesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/environment-variables
// ---------------------------------------------------------------------------

export const ElevenLabsCreateEnvironmentVariableRequestSchema =
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("string"),
      label: ElevenLabsEnvironmentVariableLabelSchema,
      values: z.record(z.string(), z.string().min(1)),
    }),
    z.object({
      type: z.literal("secret"),
      label: ElevenLabsEnvironmentVariableLabelSchema,
      values: z.record(
        z.string(),
        ElevenLabsEnvironmentVariableSecretValueRequestSchema
      ),
    }),
    z.object({
      type: z.literal("auth_connection"),
      label: ElevenLabsEnvironmentVariableLabelSchema,
      values: z.record(
        z.string(),
        ElevenLabsEnvironmentVariableAuthConnectionValueRequestSchema
      ),
    }),
  ]);

export type ElevenLabsCreateEnvironmentVariableRequest = z.input<
  typeof ElevenLabsCreateEnvironmentVariableRequestSchema
>;
export type ElevenLabsCreateEnvironmentVariableRequestInput =
  ElevenLabsCreateEnvironmentVariableRequest;
export type ElevenLabsCreateEnvironmentVariableParsedRequest = z.output<
  typeof ElevenLabsCreateEnvironmentVariableRequestSchema
>;

const ElevenLabsEnvironmentVariableUpdateValueSchema = z.union([
  z.string().min(1),
  ElevenLabsEnvironmentVariableSecretValueRequestSchema,
  ElevenLabsEnvironmentVariableAuthConnectionValueRequestSchema,
  z.null(),
]);

// ---------------------------------------------------------------------------
// PATCH /v1/convai/environment-variables/:env_var_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateEnvironmentVariableRequestSchema = z.object({
  values: z.record(z.string(), ElevenLabsEnvironmentVariableUpdateValueSchema),
});

export type ElevenLabsUpdateEnvironmentVariableRequest = z.input<
  typeof ElevenLabsUpdateEnvironmentVariableRequestSchema
>;
export type ElevenLabsUpdateEnvironmentVariableRequestInput =
  ElevenLabsUpdateEnvironmentVariableRequest;
export type ElevenLabsUpdateEnvironmentVariableParsedRequest = z.output<
  typeof ElevenLabsUpdateEnvironmentVariableRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform (Conversational AI) — Tools
// ---------------------------------------------------------------------------

// `tool_config` is a discriminated union over four tool types (client, webhook,
// system, mcp), each a large nested config tree; `response_mocks` are equally
// open-ended. We keep both as permissive records so the schema stays a thin
// metadata surface — callers compose the nested config themselves and the
// server passes it straight through.
const ElevenLabsToolConfigObjectSchema = z.record(z.string(), z.unknown());

// ---------------------------------------------------------------------------
// POST /v1/convai/tools
// ---------------------------------------------------------------------------

export const ElevenLabsCreateToolRequestSchema = z.object({
  tool_config: ElevenLabsToolConfigObjectSchema,
  response_mocks: z
    .array(ElevenLabsToolConfigObjectSchema)
    .nullable()
    .optional(),
});

export type ElevenLabsCreateToolRequest = z.input<
  typeof ElevenLabsCreateToolRequestSchema
>;
export type ElevenLabsCreateToolRequestInput = ElevenLabsCreateToolRequest;
export type ElevenLabsCreateToolParsedRequest = z.output<
  typeof ElevenLabsCreateToolRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/tools
// ---------------------------------------------------------------------------

export const ElevenLabsListToolsRequestSchema = z.object({
  search: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  show_only_owned_documents: z.boolean().optional(),
  created_by_user_id: z.string().nullable().optional(),
  types: z
    .array(z.enum(["webhook", "client", "api_integration_webhook"]))
    .nullable()
    .optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
  sort_by: z.enum(["name", "created_at"]).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListToolsRequest = z.input<
  typeof ElevenLabsListToolsRequestSchema
>;
export type ElevenLabsListToolsRequestInput = ElevenLabsListToolsRequest;
export type ElevenLabsListToolsParsedRequest = z.output<
  typeof ElevenLabsListToolsRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/tools/:tool_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateToolRequestSchema = z.object({
  tool_config: ElevenLabsToolConfigObjectSchema,
  response_mocks: z
    .array(ElevenLabsToolConfigObjectSchema)
    .nullable()
    .optional(),
});

export type ElevenLabsUpdateToolRequest = z.input<
  typeof ElevenLabsUpdateToolRequestSchema
>;
export type ElevenLabsUpdateToolRequestInput = ElevenLabsUpdateToolRequest;
export type ElevenLabsUpdateToolParsedRequest = z.output<
  typeof ElevenLabsUpdateToolRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/tools/:tool_id/dependent-agents
// ---------------------------------------------------------------------------

export const ElevenLabsGetToolDependentAgentsRequestSchema = z.object({
  cursor: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
});

export type ElevenLabsGetToolDependentAgentsRequest = z.input<
  typeof ElevenLabsGetToolDependentAgentsRequestSchema
>;
export type ElevenLabsGetToolDependentAgentsRequestInput =
  ElevenLabsGetToolDependentAgentsRequest;
export type ElevenLabsGetToolDependentAgentsParsedRequest = z.output<
  typeof ElevenLabsGetToolDependentAgentsRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/tools/:tool_id/executions
// ---------------------------------------------------------------------------

export const ElevenLabsGetToolExecutionsRequestSchema = z.object({
  cursor: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  is_error: z.boolean().nullable().optional(),
  agent_id: z.string().nullable().optional(),
  branch_id: z.string().nullable().optional(),
  start_time: z.number().nullable().optional(),
  end_time: z.number().nullable().optional(),
});

export type ElevenLabsGetToolExecutionsRequest = z.input<
  typeof ElevenLabsGetToolExecutionsRequestSchema
>;
export type ElevenLabsGetToolExecutionsRequestInput =
  ElevenLabsGetToolExecutionsRequest;
export type ElevenLabsGetToolExecutionsParsedRequest = z.output<
  typeof ElevenLabsGetToolExecutionsRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform (Conversational AI) — MCP Servers
// ---------------------------------------------------------------------------

const ElevenLabsMcpApprovalPolicySchema = z.enum([
  "auto_approve_all",
  "require_approval_all",
  "require_approval_per_tool",
]);
const ElevenLabsMcpToolApprovalPolicySchema = z.enum([
  "auto_approved",
  "requires_approval",
]);
const ElevenLabsMcpServerTransportSchema = z.enum(["SSE", "STREAMABLE_HTTP"]);
const ElevenLabsPreToolSpeechModeSchema = z.enum(["auto", "force", "off"]);
const ElevenLabsToolCallSoundTypeSchema = z.enum([
  "typing",
  "elevator1",
  "elevator2",
  "elevator3",
  "elevator4",
]);
const ElevenLabsToolCallSoundBehaviorSchema = z.enum(["auto", "always"]);
const ElevenLabsToolExecutionModeSchema = z.enum([
  "immediate",
  "post_tool_speech",
  "async",
]);

const ElevenLabsMcpConfigObjectSchema = z.record(z.string(), z.unknown());
const ElevenLabsMcpHeaderValueSchema = z.union([
  z.string(),
  ElevenLabsMcpConfigObjectSchema,
]);
const ElevenLabsMcpResponseTimeoutSchema = z.number().int().min(5).max(300);

const ElevenLabsMcpToolApprovalHashSchema = z.object({
  tool_name: z.string(),
  tool_hash: z.string(),
  approval_policy: ElevenLabsMcpToolApprovalPolicySchema.optional(),
});

const ElevenLabsMcpToolConfigOverrideBaseSchema = z.object({
  force_pre_tool_speech: z.boolean().nullable().optional(),
  pre_tool_speech: ElevenLabsPreToolSpeechModeSchema.nullable().optional(),
  disable_interruptions: z.boolean().nullable().optional(),
  tool_call_sound: ElevenLabsToolCallSoundTypeSchema.nullable().optional(),
  tool_call_sound_behavior:
    ElevenLabsToolCallSoundBehaviorSchema.nullable().optional(),
  execution_mode: ElevenLabsToolExecutionModeSchema.nullable().optional(),
  response_timeout_secs:
    ElevenLabsMcpResponseTimeoutSchema.nullable().optional(),
  assignments: z.array(ElevenLabsMcpConfigObjectSchema).nullable().optional(),
  input_overrides: z
    .record(z.string(), ElevenLabsMcpConfigObjectSchema)
    .nullable()
    .optional(),
  response_mocks: z
    .array(ElevenLabsMcpConfigObjectSchema)
    .nullable()
    .optional(),
});

const ElevenLabsMcpToolConfigOverrideWithNameSchema =
  ElevenLabsMcpToolConfigOverrideBaseSchema.extend({
    tool_name: z.string(),
  });

// ---------------------------------------------------------------------------
// POST /v1/convai/mcp-servers
// ---------------------------------------------------------------------------

export const ElevenLabsCreateMcpServerRequestSchema = z.object({
  config: z.object({
    approval_policy: ElevenLabsMcpApprovalPolicySchema.optional(),
    tool_approval_hashes: z
      .array(ElevenLabsMcpToolApprovalHashSchema)
      .optional(),
    transport: ElevenLabsMcpServerTransportSchema.optional(),
    url: z.union([z.string(), ElevenLabsMcpConfigObjectSchema]),
    secret_token: ElevenLabsMcpConfigObjectSchema.nullable().optional(),
    request_headers: z
      .record(z.string(), ElevenLabsMcpHeaderValueSchema)
      .optional(),
    auth_connection: ElevenLabsMcpConfigObjectSchema.nullable().optional(),
    name: z.string(),
    description: z.string().optional(),
    force_pre_tool_speech: z.boolean().optional(),
    pre_tool_speech: ElevenLabsPreToolSpeechModeSchema.optional(),
    disable_interruptions: z.boolean().optional(),
    tool_call_sound: ElevenLabsToolCallSoundTypeSchema.nullable().optional(),
    tool_call_sound_behavior: ElevenLabsToolCallSoundBehaviorSchema.optional(),
    execution_mode: ElevenLabsToolExecutionModeSchema.optional(),
    response_timeout_secs: ElevenLabsMcpResponseTimeoutSchema.optional(),
    tool_config_overrides: z
      .array(ElevenLabsMcpToolConfigOverrideWithNameSchema)
      .optional(),
    disable_compression: z.boolean().optional(),
  }),
});

export type ElevenLabsCreateMcpServerRequest = z.input<
  typeof ElevenLabsCreateMcpServerRequestSchema
>;
export type ElevenLabsCreateMcpServerRequestInput =
  ElevenLabsCreateMcpServerRequest;
export type ElevenLabsCreateMcpServerParsedRequest = z.output<
  typeof ElevenLabsCreateMcpServerRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/mcp-servers/:mcp_server_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateMcpServerRequestSchema = z.object({
  approval_policy: ElevenLabsMcpApprovalPolicySchema.nullable().optional(),
  force_pre_tool_speech: z.boolean().nullable().optional(),
  pre_tool_speech: ElevenLabsPreToolSpeechModeSchema.nullable().optional(),
  disable_interruptions: z.boolean().nullable().optional(),
  tool_call_sound: ElevenLabsToolCallSoundTypeSchema.nullable().optional(),
  tool_call_sound_behavior:
    ElevenLabsToolCallSoundBehaviorSchema.nullable().optional(),
  execution_mode: ElevenLabsToolExecutionModeSchema.nullable().optional(),
  response_timeout_secs:
    ElevenLabsMcpResponseTimeoutSchema.nullable().optional(),
  request_headers: z
    .record(z.string(), ElevenLabsMcpHeaderValueSchema)
    .nullable()
    .optional(),
  disable_compression: z.boolean().nullable().optional(),
  secret_token: ElevenLabsMcpConfigObjectSchema.nullable().optional(),
  auth_connection: ElevenLabsMcpConfigObjectSchema.nullable().optional(),
});

export type ElevenLabsUpdateMcpServerRequest = z.input<
  typeof ElevenLabsUpdateMcpServerRequestSchema
>;
export type ElevenLabsUpdateMcpServerRequestInput =
  ElevenLabsUpdateMcpServerRequest;
export type ElevenLabsUpdateMcpServerParsedRequest = z.output<
  typeof ElevenLabsUpdateMcpServerRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/mcp-servers/:mcp_server_id/tool-approvals
// ---------------------------------------------------------------------------

export const ElevenLabsCreateMcpServerToolApprovalRequestSchema = z.object({
  tool_name: z.string(),
  tool_description: z.string(),
  input_schema: ElevenLabsMcpConfigObjectSchema.optional(),
  approval_policy: ElevenLabsMcpToolApprovalPolicySchema.optional(),
});

export type ElevenLabsCreateMcpServerToolApprovalRequest = z.input<
  typeof ElevenLabsCreateMcpServerToolApprovalRequestSchema
>;
export type ElevenLabsCreateMcpServerToolApprovalRequestInput =
  ElevenLabsCreateMcpServerToolApprovalRequest;
export type ElevenLabsCreateMcpServerToolApprovalParsedRequest = z.output<
  typeof ElevenLabsCreateMcpServerToolApprovalRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/mcp-servers/:mcp_server_id/tool-configs
// ---------------------------------------------------------------------------

export const ElevenLabsCreateMcpToolConfigOverrideRequestSchema =
  ElevenLabsMcpToolConfigOverrideWithNameSchema;

export type ElevenLabsCreateMcpToolConfigOverrideRequest = z.input<
  typeof ElevenLabsCreateMcpToolConfigOverrideRequestSchema
>;
export type ElevenLabsCreateMcpToolConfigOverrideRequestInput =
  ElevenLabsCreateMcpToolConfigOverrideRequest;
export type ElevenLabsCreateMcpToolConfigOverrideParsedRequest = z.output<
  typeof ElevenLabsCreateMcpToolConfigOverrideRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/mcp-servers/:mcp_server_id/tool-configs/:tool_name
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateMcpToolConfigOverrideRequestSchema =
  ElevenLabsMcpToolConfigOverrideBaseSchema;

export type ElevenLabsUpdateMcpToolConfigOverrideRequest = z.input<
  typeof ElevenLabsUpdateMcpToolConfigOverrideRequestSchema
>;
export type ElevenLabsUpdateMcpToolConfigOverrideRequestInput =
  ElevenLabsUpdateMcpToolConfigOverrideRequest;
export type ElevenLabsUpdateMcpToolConfigOverrideParsedRequest = z.output<
  typeof ElevenLabsUpdateMcpToolConfigOverrideRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform (Conversational AI) — Tests / Test Invocations
// ---------------------------------------------------------------------------

// The test payloads embed conversation transcripts, tool evaluation config,
// simulation config, and optional ad-hoc agent overrides. Keep those nested
// trees permissive in the same style as agent/tool config schemas above.
const ElevenLabsAgentTestObjectSchema = z.record(z.string(), z.unknown());
const ElevenLabsAgentTestTypeSchema = z.enum([
  "llm",
  "tool",
  "simulation",
  "folder",
]);
const ElevenLabsAgentTestSharingModeSchema = z.enum(["all", "shared_with_me"]);

const ElevenLabsAgentTestPayloadSchema = z.object({
  from_conversation_metadata:
    ElevenLabsAgentTestObjectSchema.nullable().optional(),
  dynamic_variables: z.record(z.string(), z.unknown()).optional(),
  chat_history: z.array(ElevenLabsAgentTestObjectSchema).max(200).optional(),
  conversation_initiation_source: z.string().nullable().optional(),
  type: z.enum(["llm", "tool", "simulation"]).optional(),
  success_condition: z.string().nullable().optional(),
  success_conditions: z.array(z.string()).max(30).optional(),
  success_examples: z.array(ElevenLabsAgentTestObjectSchema).max(5).optional(),
  failure_examples: z.array(ElevenLabsAgentTestObjectSchema).max(5).optional(),
  tool_call_parameters: ElevenLabsAgentTestObjectSchema.nullable().optional(),
  check_any_tool_matches: z.boolean().nullable().optional(),
  simulation_scenario: z.string().optional(),
  simulation_max_turns: z.number().int().min(1).max(50).optional(),
  simulation_environment: z.string().nullable().optional(),
  tool_mock_config: ElevenLabsAgentTestObjectSchema.optional(),
  evaluation_model: z
    .union([z.string(), ElevenLabsAgentTestObjectSchema])
    .nullable()
    .optional(),
  simulated_user_model: z
    .union([z.string(), ElevenLabsAgentTestObjectSchema])
    .nullable()
    .optional(),
  name: z.string(),
  parent_folder_id: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// POST /v1/convai/agent-testing/create
// ---------------------------------------------------------------------------

export const ElevenLabsCreateAgentTestRequestSchema =
  ElevenLabsAgentTestPayloadSchema;

export type ElevenLabsCreateAgentTestRequest = z.input<
  typeof ElevenLabsCreateAgentTestRequestSchema
>;
export type ElevenLabsCreateAgentTestRequestInput =
  ElevenLabsCreateAgentTestRequest;
export type ElevenLabsCreateAgentTestParsedRequest = z.output<
  typeof ElevenLabsCreateAgentTestRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/agent-testing
// ---------------------------------------------------------------------------

export const ElevenLabsListAgentTestsRequestSchema = z.object({
  cursor: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  search: z.string().nullable().optional(),
  parent_folder_id: z.string().nullable().optional(),
  types: z.array(ElevenLabsAgentTestTypeSchema).nullable().optional(),
  include_folders: z.boolean().nullable().optional(),
  sort_mode: z.enum(["default", "folders_first"]).optional(),
  sharing_mode: ElevenLabsAgentTestSharingModeSchema.optional(),
});

export type ElevenLabsListAgentTestsRequest = z.input<
  typeof ElevenLabsListAgentTestsRequestSchema
>;
export type ElevenLabsListAgentTestsRequestInput =
  ElevenLabsListAgentTestsRequest;
export type ElevenLabsListAgentTestsParsedRequest = z.output<
  typeof ElevenLabsListAgentTestsRequestSchema
>;

// ---------------------------------------------------------------------------
// PUT /v1/convai/agent-testing/:test_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateAgentTestRequestSchema =
  ElevenLabsAgentTestPayloadSchema;

export type ElevenLabsUpdateAgentTestRequest = z.input<
  typeof ElevenLabsUpdateAgentTestRequestSchema
>;
export type ElevenLabsUpdateAgentTestRequestInput =
  ElevenLabsUpdateAgentTestRequest;
export type ElevenLabsUpdateAgentTestParsedRequest = z.output<
  typeof ElevenLabsUpdateAgentTestRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/agent-testing/summaries
// ---------------------------------------------------------------------------

export const ElevenLabsGetAgentTestSummariesRequestSchema = z.object({
  test_ids: z.array(z.string()),
});

export type ElevenLabsGetAgentTestSummariesRequest = z.input<
  typeof ElevenLabsGetAgentTestSummariesRequestSchema
>;
export type ElevenLabsGetAgentTestSummariesRequestInput =
  ElevenLabsGetAgentTestSummariesRequest;
export type ElevenLabsGetAgentTestSummariesParsedRequest = z.output<
  typeof ElevenLabsGetAgentTestSummariesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/agent-testing/bulk-move
// ---------------------------------------------------------------------------

export const ElevenLabsBulkMoveAgentTestsRequestSchema = z.object({
  entity_ids: z.array(z.string()).min(1),
  move_to: z.string().nullable().optional(),
});

export type ElevenLabsBulkMoveAgentTestsRequest = z.input<
  typeof ElevenLabsBulkMoveAgentTestsRequestSchema
>;
export type ElevenLabsBulkMoveAgentTestsRequestInput =
  ElevenLabsBulkMoveAgentTestsRequest;
export type ElevenLabsBulkMoveAgentTestsParsedRequest = z.output<
  typeof ElevenLabsBulkMoveAgentTestsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST/PATCH/DELETE /v1/convai/agent-testing/folders
// ---------------------------------------------------------------------------

export const ElevenLabsCreateAgentTestFolderRequestSchema = z.object({
  name: z.string(),
  parent_folder_id: z.string().nullable().optional(),
});

export type ElevenLabsCreateAgentTestFolderRequest = z.input<
  typeof ElevenLabsCreateAgentTestFolderRequestSchema
>;
export type ElevenLabsCreateAgentTestFolderRequestInput =
  ElevenLabsCreateAgentTestFolderRequest;
export type ElevenLabsCreateAgentTestFolderParsedRequest = z.output<
  typeof ElevenLabsCreateAgentTestFolderRequestSchema
>;

export const ElevenLabsUpdateAgentTestFolderRequestSchema = z.object({
  name: z.string(),
});

export type ElevenLabsUpdateAgentTestFolderRequest = z.input<
  typeof ElevenLabsUpdateAgentTestFolderRequestSchema
>;
export type ElevenLabsUpdateAgentTestFolderRequestInput =
  ElevenLabsUpdateAgentTestFolderRequest;
export type ElevenLabsUpdateAgentTestFolderParsedRequest = z.output<
  typeof ElevenLabsUpdateAgentTestFolderRequestSchema
>;

export const ElevenLabsDeleteAgentTestFolderRequestSchema = z.object({
  force: z.boolean().optional(),
});

export type ElevenLabsDeleteAgentTestFolderRequest = z.input<
  typeof ElevenLabsDeleteAgentTestFolderRequestSchema
>;
export type ElevenLabsDeleteAgentTestFolderRequestInput =
  ElevenLabsDeleteAgentTestFolderRequest;
export type ElevenLabsDeleteAgentTestFolderParsedRequest = z.output<
  typeof ElevenLabsDeleteAgentTestFolderRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/agents/:agent_id/run-tests
// ---------------------------------------------------------------------------

export const ElevenLabsRunAgentTestsRequestSchema = z.object({
  tests: z
    .array(
      z.object({
        test_id: z.string(),
        workflow_node_id: z.string().nullable().optional(),
        root_folder_id: z.string().nullable().optional(),
        root_folder_name: z.string().nullable().optional(),
      })
    )
    .min(1)
    .max(5000),
  agent_config_override: ElevenLabsAgentTestObjectSchema.nullable().optional(),
  branch_id: z.string().nullable().optional(),
  repeat_count: z.number().int().min(1).max(50).optional(),
});

export type ElevenLabsRunAgentTestsRequest = z.input<
  typeof ElevenLabsRunAgentTestsRequestSchema
>;
export type ElevenLabsRunAgentTestsRequestInput =
  ElevenLabsRunAgentTestsRequest;
export type ElevenLabsRunAgentTestsParsedRequest = z.output<
  typeof ElevenLabsRunAgentTestsRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/test-invocations
// ---------------------------------------------------------------------------

export const ElevenLabsListTestInvocationsRequestSchema = z.object({
  agent_id: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListTestInvocationsRequest = z.input<
  typeof ElevenLabsListTestInvocationsRequestSchema
>;
export type ElevenLabsListTestInvocationsRequestInput =
  ElevenLabsListTestInvocationsRequest;
export type ElevenLabsListTestInvocationsParsedRequest = z.output<
  typeof ElevenLabsListTestInvocationsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/test-invocations/:test_invocation_id/resubmit
// ---------------------------------------------------------------------------

export const ElevenLabsResubmitTestsRequestSchema = z.object({
  test_run_ids: z.array(z.string()).min(1).max(5000),
  agent_config_override: ElevenLabsAgentTestObjectSchema.nullable().optional(),
  agent_id: z.string(),
  branch_id: z.string().nullable().optional(),
});

export type ElevenLabsResubmitTestsRequest = z.input<
  typeof ElevenLabsResubmitTestsRequestSchema
>;
export type ElevenLabsResubmitTestsRequestInput =
  ElevenLabsResubmitTestsRequest;
export type ElevenLabsResubmitTestsParsedRequest = z.output<
  typeof ElevenLabsResubmitTestsRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform — Knowledge Base
// ---------------------------------------------------------------------------

const ElevenLabsKnowledgeBaseDocumentTypeSchema = z.enum([
  "file",
  "url",
  "text",
  "folder",
]);

// Deliberately closed. Unlike the ElevenLabs model families above, these are
// two curated third-party embedding models that ElevenLabs selected rather than
// versions of one upstream line; they share no id grammar a regex could express
// without degenerating toward `.*`. A new option here is a product decision, so
// it is added to this enum explicitly.
const ElevenLabsKnowledgeBaseEmbeddingModelSchema = z.enum([
  "e5_mistral_7b_instruct",
  "multilingual_e5_large_instruct",
]);

const ElevenLabsKnowledgeBaseDependentTypeSchema = z.enum([
  "direct",
  "transitive",
  "all",
]);

// ---------------------------------------------------------------------------
// POST /v1/convai/knowledge-base/url
// ---------------------------------------------------------------------------

export const ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestSchema =
  z.object({
    url: z.string().url(),
    name: z.string().nullable().optional(),
    parent_folder_id: z.string().nullable().optional(),
    enable_auto_sync: z.boolean().optional(),
    auto_remove: z.boolean().optional(),
  });

export type ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest = z.input<
  typeof ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestSchema
>;
export type ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestInput =
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest;
export type ElevenLabsCreateKnowledgeBaseDocumentFromUrlParsedRequest =
  z.output<typeof ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestSchema>;

// ---------------------------------------------------------------------------
// POST /v1/convai/knowledge-base/text
// ---------------------------------------------------------------------------

export const ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestSchema =
  z.object({
    text: z.string(),
    name: z.string().nullable().optional(),
    parent_folder_id: z.string().nullable().optional(),
  });

export type ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest = z.input<
  typeof ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestSchema
>;
export type ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestInput =
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest;
export type ElevenLabsCreateKnowledgeBaseDocumentFromTextParsedRequest =
  z.output<typeof ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestSchema>;

// ---------------------------------------------------------------------------
// POST /v1/convai/knowledge-base/file
// ---------------------------------------------------------------------------

// Multipart form: `file` is the binary document; `name` and `parent_folder_id`
// are optional text fields.
export const ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestSchema =
  z.object({
    file: z.custom<Blob>(),
    name: z.string().nullable().optional(),
    parent_folder_id: z.string().nullable().optional(),
  });

export type ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest = z.input<
  typeof ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestSchema
>;
export type ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestInput =
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest;
export type ElevenLabsCreateKnowledgeBaseDocumentFromFileParsedRequest =
  z.output<typeof ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestSchema>;

// ---------------------------------------------------------------------------
// GET /v1/convai/knowledge-base
// ---------------------------------------------------------------------------

export const ElevenLabsListKnowledgeBaseDocumentsRequestSchema = z.object({
  page_size: z.number().int().min(1).max(100).optional(),
  search: z.string().nullable().optional(),
  show_only_owned_documents: z.boolean().optional(),
  created_by_user_id: z.string().nullable().optional(),
  types: z
    .array(ElevenLabsKnowledgeBaseDocumentTypeSchema)
    .nullable()
    .optional(),
  parent_folder_id: z.string().nullable().optional(),
  ancestor_folder_id: z.string().nullable().optional(),
  folders_first: z.boolean().optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
  sort_by: z
    .enum(["name", "created_at", "updated_at", "size"])
    .nullable()
    .optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListKnowledgeBaseDocumentsRequest = z.input<
  typeof ElevenLabsListKnowledgeBaseDocumentsRequestSchema
>;
export type ElevenLabsListKnowledgeBaseDocumentsRequestInput =
  ElevenLabsListKnowledgeBaseDocumentsRequest;
export type ElevenLabsListKnowledgeBaseDocumentsParsedRequest = z.output<
  typeof ElevenLabsListKnowledgeBaseDocumentsRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/knowledge-base/:documentation_id
// ---------------------------------------------------------------------------

export const ElevenLabsGetKnowledgeBaseDocumentRequestSchema = z.object({
  agent_id: z.string().optional(),
});

export type ElevenLabsGetKnowledgeBaseDocumentRequest = z.input<
  typeof ElevenLabsGetKnowledgeBaseDocumentRequestSchema
>;
export type ElevenLabsGetKnowledgeBaseDocumentRequestInput =
  ElevenLabsGetKnowledgeBaseDocumentRequest;
export type ElevenLabsGetKnowledgeBaseDocumentParsedRequest = z.output<
  typeof ElevenLabsGetKnowledgeBaseDocumentRequestSchema
>;

// ---------------------------------------------------------------------------
// DELETE /v1/convai/knowledge-base/:documentation_id
// ---------------------------------------------------------------------------

export const ElevenLabsDeleteKnowledgeBaseDocumentRequestSchema = z.object({
  force: z.boolean().optional(),
});

export type ElevenLabsDeleteKnowledgeBaseDocumentRequest = z.input<
  typeof ElevenLabsDeleteKnowledgeBaseDocumentRequestSchema
>;
export type ElevenLabsDeleteKnowledgeBaseDocumentRequestInput =
  ElevenLabsDeleteKnowledgeBaseDocumentRequest;
export type ElevenLabsDeleteKnowledgeBaseDocumentParsedRequest = z.output<
  typeof ElevenLabsDeleteKnowledgeBaseDocumentRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/knowledge-base/summaries
// ---------------------------------------------------------------------------

export const ElevenLabsGetKnowledgeBaseSummariesRequestSchema = z.object({
  document_ids: z.array(z.string()).min(1).max(100),
});

export type ElevenLabsGetKnowledgeBaseSummariesRequest = z.input<
  typeof ElevenLabsGetKnowledgeBaseSummariesRequestSchema
>;
export type ElevenLabsGetKnowledgeBaseSummariesRequestInput =
  ElevenLabsGetKnowledgeBaseSummariesRequest;
export type ElevenLabsGetKnowledgeBaseSummariesParsedRequest = z.output<
  typeof ElevenLabsGetKnowledgeBaseSummariesRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/knowledge-base/search
// ---------------------------------------------------------------------------

export const ElevenLabsSearchKnowledgeBaseContentRequestSchema = z.object({
  query: z.string(),
  page_size: z.number().int().min(1).max(100).optional(),
  types: z
    .array(ElevenLabsKnowledgeBaseDocumentTypeSchema)
    .nullable()
    .optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsSearchKnowledgeBaseContentRequest = z.input<
  typeof ElevenLabsSearchKnowledgeBaseContentRequestSchema
>;
export type ElevenLabsSearchKnowledgeBaseContentRequestInput =
  ElevenLabsSearchKnowledgeBaseContentRequest;
export type ElevenLabsSearchKnowledgeBaseContentParsedRequest = z.output<
  typeof ElevenLabsSearchKnowledgeBaseContentRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/knowledge-base/:documentation_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateKnowledgeBaseDocumentRequestSchema = z.object({
  name: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
});

export type ElevenLabsUpdateKnowledgeBaseDocumentRequest = z.input<
  typeof ElevenLabsUpdateKnowledgeBaseDocumentRequestSchema
>;
export type ElevenLabsUpdateKnowledgeBaseDocumentRequestInput =
  ElevenLabsUpdateKnowledgeBaseDocumentRequest;
export type ElevenLabsUpdateKnowledgeBaseDocumentParsedRequest = z.output<
  typeof ElevenLabsUpdateKnowledgeBaseDocumentRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/knowledge-base/:documentation_id/chunks
// ---------------------------------------------------------------------------

export const ElevenLabsListKnowledgeBaseDocumentChunksRequestSchema = z.object({
  embedding_model: ElevenLabsKnowledgeBaseEmbeddingModelSchema,
  page_size: z.number().int().min(1).max(100).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListKnowledgeBaseDocumentChunksRequest = z.input<
  typeof ElevenLabsListKnowledgeBaseDocumentChunksRequestSchema
>;
export type ElevenLabsListKnowledgeBaseDocumentChunksRequestInput =
  ElevenLabsListKnowledgeBaseDocumentChunksRequest;
export type ElevenLabsListKnowledgeBaseDocumentChunksParsedRequest = z.output<
  typeof ElevenLabsListKnowledgeBaseDocumentChunksRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/knowledge-base/:documentation_id/chunk/:chunk_id
// ---------------------------------------------------------------------------

export const ElevenLabsGetKnowledgeBaseDocumentChunkRequestSchema = z.object({
  embedding_model:
    ElevenLabsKnowledgeBaseEmbeddingModelSchema.nullable().optional(),
});

export type ElevenLabsGetKnowledgeBaseDocumentChunkRequest = z.input<
  typeof ElevenLabsGetKnowledgeBaseDocumentChunkRequestSchema
>;
export type ElevenLabsGetKnowledgeBaseDocumentChunkRequestInput =
  ElevenLabsGetKnowledgeBaseDocumentChunkRequest;
export type ElevenLabsGetKnowledgeBaseDocumentChunkParsedRequest = z.output<
  typeof ElevenLabsGetKnowledgeBaseDocumentChunkRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/knowledge-base/:documentation_id/dependent-agents
// ---------------------------------------------------------------------------

export const ElevenLabsGetKnowledgeBaseDependentAgentsRequestSchema = z.object({
  dependent_type: ElevenLabsKnowledgeBaseDependentTypeSchema.optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsGetKnowledgeBaseDependentAgentsRequest = z.input<
  typeof ElevenLabsGetKnowledgeBaseDependentAgentsRequestSchema
>;
export type ElevenLabsGetKnowledgeBaseDependentAgentsRequestInput =
  ElevenLabsGetKnowledgeBaseDependentAgentsRequest;
export type ElevenLabsGetKnowledgeBaseDependentAgentsParsedRequest = z.output<
  typeof ElevenLabsGetKnowledgeBaseDependentAgentsRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/knowledge-base/:documentation_id/update-file
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateKnowledgeBaseFileDocumentRequestSchema = z.object({
  file: z.custom<Blob>(),
});

export type ElevenLabsUpdateKnowledgeBaseFileDocumentRequest = z.input<
  typeof ElevenLabsUpdateKnowledgeBaseFileDocumentRequestSchema
>;
export type ElevenLabsUpdateKnowledgeBaseFileDocumentRequestInput =
  ElevenLabsUpdateKnowledgeBaseFileDocumentRequest;
export type ElevenLabsUpdateKnowledgeBaseFileDocumentParsedRequest = z.output<
  typeof ElevenLabsUpdateKnowledgeBaseFileDocumentRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/knowledge-base/rag-index
// ---------------------------------------------------------------------------

export const ElevenLabsComputeKnowledgeBaseRagIndexesRequestSchema = z.object({
  items: z.array(
    z.object({
      document_id: z.string(),
      create_if_missing: z.boolean(),
      model: ElevenLabsKnowledgeBaseEmbeddingModelSchema,
    })
  ),
});

export type ElevenLabsComputeKnowledgeBaseRagIndexesRequest = z.input<
  typeof ElevenLabsComputeKnowledgeBaseRagIndexesRequestSchema
>;
export type ElevenLabsComputeKnowledgeBaseRagIndexesRequestInput =
  ElevenLabsComputeKnowledgeBaseRagIndexesRequest;
export type ElevenLabsComputeKnowledgeBaseRagIndexesParsedRequest = z.output<
  typeof ElevenLabsComputeKnowledgeBaseRagIndexesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/knowledge-base/:documentation_id/rag-index
// ---------------------------------------------------------------------------

export const ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequestSchema =
  z.object({
    model: ElevenLabsKnowledgeBaseEmbeddingModelSchema,
  });

export type ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest = z.input<
  typeof ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequestSchema
>;
export type ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequestInput =
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest;
export type ElevenLabsComputeKnowledgeBaseDocumentRagIndexParsedRequest =
  z.output<typeof ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequestSchema>;

// ---------------------------------------------------------------------------
// POST /v1/convai/knowledge-base/folder
// ---------------------------------------------------------------------------

export const ElevenLabsCreateKnowledgeBaseFolderRequestSchema = z.object({
  name: z.string(),
  parent_folder_id: z.string().nullable().optional(),
  enable_auto_sync: z.boolean().optional(),
  auto_remove: z.boolean().optional(),
});

export type ElevenLabsCreateKnowledgeBaseFolderRequest = z.input<
  typeof ElevenLabsCreateKnowledgeBaseFolderRequestSchema
>;
export type ElevenLabsCreateKnowledgeBaseFolderRequestInput =
  ElevenLabsCreateKnowledgeBaseFolderRequest;
export type ElevenLabsCreateKnowledgeBaseFolderParsedRequest = z.output<
  typeof ElevenLabsCreateKnowledgeBaseFolderRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/knowledge-base/bulk-move
// ---------------------------------------------------------------------------

export const ElevenLabsBulkMoveKnowledgeBaseDocumentsRequestSchema = z.object({
  document_ids: z.array(z.string()),
  move_to: z.string().nullable().optional(),
});

export type ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest = z.input<
  typeof ElevenLabsBulkMoveKnowledgeBaseDocumentsRequestSchema
>;
export type ElevenLabsBulkMoveKnowledgeBaseDocumentsRequestInput =
  ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest;
export type ElevenLabsBulkMoveKnowledgeBaseDocumentsParsedRequest = z.output<
  typeof ElevenLabsBulkMoveKnowledgeBaseDocumentsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/knowledge-base/:document_id/move
// ---------------------------------------------------------------------------

export const ElevenLabsMoveKnowledgeBaseEntityRequestSchema = z.object({
  move_to: z.string().nullable().optional(),
});

export type ElevenLabsMoveKnowledgeBaseEntityRequest = z.input<
  typeof ElevenLabsMoveKnowledgeBaseEntityRequestSchema
>;
export type ElevenLabsMoveKnowledgeBaseEntityRequestInput =
  ElevenLabsMoveKnowledgeBaseEntityRequest;
export type ElevenLabsMoveKnowledgeBaseEntityParsedRequest = z.output<
  typeof ElevenLabsMoveKnowledgeBaseEntityRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform — Conversations
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /v1/convai/conversations
// ---------------------------------------------------------------------------

// All fields are query-string filters; the factory serialises them onto the
// URL. Array-valued filters (`evaluation_params`, `main_languages`, ...) are
// repeated as multiple query params by `buildQueryString`.
export const ElevenLabsListConversationsRequestSchema = z.object({
  cursor: z.string().nullable().optional(),
  agent_id: z.string().nullable().optional(),
  call_successful: z
    .enum(["success", "failure", "unknown"])
    .nullable()
    .optional(),
  call_start_before_unix: z.number().int().nullable().optional(),
  call_start_after_unix: z.number().int().nullable().optional(),
  call_duration_min_secs: z.number().int().nullable().optional(),
  call_duration_max_secs: z.number().int().nullable().optional(),
  rating_min: z.number().int().nullable().optional(),
  rating_max: z.number().int().nullable().optional(),
  has_feedback_comment: z.boolean().nullable().optional(),
  user_id: z.string().nullable().optional(),
  evaluation_params: z.array(z.string()).nullable().optional(),
  data_collection_params: z.array(z.string()).nullable().optional(),
  tool_names: z.array(z.string()).nullable().optional(),
  tool_names_successful: z.array(z.string()).nullable().optional(),
  tool_names_errored: z.array(z.string()).nullable().optional(),
  main_languages: z.array(z.string()).nullable().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  summary_mode: z.enum(["exclude", "include"]).optional(),
  search: z.string().nullable().optional(),
  text_only: z.boolean().nullable().optional(),
  branch_id: z.string().nullable().optional(),
  topic_ids: z.array(z.string()).nullable().optional(),
  exclude_statuses: z.array(z.string()).nullable().optional(),
  tag_ids: z.array(z.string()).nullable().optional(),
  termination_reasons: z.array(z.string()).nullable().optional(),
});

export type ElevenLabsListConversationsRequest = z.input<
  typeof ElevenLabsListConversationsRequestSchema
>;
export type ElevenLabsListConversationsRequestInput =
  ElevenLabsListConversationsRequest;
export type ElevenLabsListConversationsParsedRequest = z.output<
  typeof ElevenLabsListConversationsRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/conversations/:conversation_id
// ---------------------------------------------------------------------------

export const ElevenLabsGetConversationRequestSchema = z.object({
  format: z.enum(["json", "opentelemetry"]).optional(),
});

export type ElevenLabsGetConversationRequest = z.input<
  typeof ElevenLabsGetConversationRequestSchema
>;
export type ElevenLabsGetConversationRequestInput =
  ElevenLabsGetConversationRequest;
export type ElevenLabsGetConversationParsedRequest = z.output<
  typeof ElevenLabsGetConversationRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/conversation/get-signed-url
// ---------------------------------------------------------------------------

export const ElevenLabsGetSignedUrlRequestSchema = z.object({
  agent_id: z.string(),
  include_conversation_id: z.boolean().optional(),
  branch_id: z.string().nullable().optional(),
  environment: z.string().nullable().optional(),
});

export type ElevenLabsGetSignedUrlRequest = z.input<
  typeof ElevenLabsGetSignedUrlRequestSchema
>;
export type ElevenLabsGetSignedUrlRequestInput = ElevenLabsGetSignedUrlRequest;
export type ElevenLabsGetSignedUrlParsedRequest = z.output<
  typeof ElevenLabsGetSignedUrlRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/conversation/token
// ---------------------------------------------------------------------------

export const ElevenLabsGetConversationTokenRequestSchema = z.object({
  agent_id: z.string(),
  participant_name: z.string().nullable().optional(),
  branch_id: z.string().nullable().optional(),
  environment: z.string().nullable().optional(),
});

export type ElevenLabsGetConversationTokenRequest = z.input<
  typeof ElevenLabsGetConversationTokenRequestSchema
>;
export type ElevenLabsGetConversationTokenRequestInput =
  ElevenLabsGetConversationTokenRequest;
export type ElevenLabsGetConversationTokenParsedRequest = z.output<
  typeof ElevenLabsGetConversationTokenRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/conversations/messages/smart-search
// ---------------------------------------------------------------------------

export const ElevenLabsSmartSearchConversationMessagesRequestSchema = z.object({
  text_query: z.string(),
  agent_id: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(50).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsSmartSearchConversationMessagesRequest = z.input<
  typeof ElevenLabsSmartSearchConversationMessagesRequestSchema
>;
export type ElevenLabsSmartSearchConversationMessagesRequestInput =
  ElevenLabsSmartSearchConversationMessagesRequest;
export type ElevenLabsSmartSearchConversationMessagesParsedRequest = z.output<
  typeof ElevenLabsSmartSearchConversationMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/conversations/messages/text-search
// ---------------------------------------------------------------------------

export const ElevenLabsTextSearchConversationMessagesRequestSchema = z.object({
  text_query: z.string(),
  agent_id: z.string().nullable().optional(),
  call_successful: z
    .enum(["success", "failure", "unknown"])
    .nullable()
    .optional(),
  call_start_before_unix: z.number().int().nullable().optional(),
  call_start_after_unix: z.number().int().nullable().optional(),
  call_duration_min_secs: z.number().int().nullable().optional(),
  call_duration_max_secs: z.number().int().nullable().optional(),
  rating_max: z.number().int().nullable().optional(),
  rating_min: z.number().int().nullable().optional(),
  has_feedback_comment: z.boolean().nullable().optional(),
  user_id: z.string().nullable().optional(),
  evaluation_params: z.array(z.string()).nullable().optional(),
  data_collection_params: z.array(z.string()).nullable().optional(),
  tool_names: z.array(z.string()).nullable().optional(),
  tool_names_successful: z.array(z.string()).nullable().optional(),
  tool_names_errored: z.array(z.string()).nullable().optional(),
  main_languages: z.array(z.string()).nullable().optional(),
  page_size: z.number().int().min(1).max(50).optional(),
  summary_mode: z.enum(["exclude", "include"]).optional(),
  conversation_initiation_source: z
    .enum([
      "unknown",
      "android_sdk",
      "node_js_sdk",
      "react_native_sdk",
      "react_sdk",
      "js_sdk",
      "python_sdk",
      "widget",
      "sip_trunk",
      "twilio",
      "exotel",
      "genesys",
      "swift_sdk",
      "whatsapp",
      "twilio_sms",
      "flutter_sdk",
      "zendesk_integration",
      "slack_integration",
      "telegram_integration",
      "intercom_integration",
      "freshdesk_integration",
      "template_preview",
      "genesys_bot_connector",
    ])
    .nullable()
    .optional(),
  text_only: z.boolean().nullable().optional(),
  conversation_product_type: z
    .enum(["agents", "speech_engine"])
    .nullable()
    .optional(),
  branch_id: z.string().nullable().optional(),
  topic_ids: z.array(z.string()).nullable().optional(),
  sort_by: z.enum(["search_score", "created_at"]).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsTextSearchConversationMessagesRequest = z.input<
  typeof ElevenLabsTextSearchConversationMessagesRequestSchema
>;
export type ElevenLabsTextSearchConversationMessagesRequestInput =
  ElevenLabsTextSearchConversationMessagesRequest;
export type ElevenLabsTextSearchConversationMessagesParsedRequest = z.output<
  typeof ElevenLabsTextSearchConversationMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/conversations/:conversation_id/feedback
// ---------------------------------------------------------------------------

export const ElevenLabsConversationFeedbackRequestSchema = z.object({
  feedback: z.enum(["like", "dislike"]).nullable().optional(),
});

export type ElevenLabsConversationFeedbackRequest = z.input<
  typeof ElevenLabsConversationFeedbackRequestSchema
>;
export type ElevenLabsConversationFeedbackRequestInput =
  ElevenLabsConversationFeedbackRequest;
export type ElevenLabsConversationFeedbackParsedRequest = z.output<
  typeof ElevenLabsConversationFeedbackRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/conversations/:conversation_id/files
// ---------------------------------------------------------------------------

export const ElevenLabsUploadConversationFileRequestSchema = z.object({
  file: z.custom<Blob>((value) => value instanceof Blob),
});

export type ElevenLabsUploadConversationFileRequest = z.input<
  typeof ElevenLabsUploadConversationFileRequestSchema
>;
export type ElevenLabsUploadConversationFileRequestInput =
  ElevenLabsUploadConversationFileRequest;
export type ElevenLabsUploadConversationFileParsedRequest = z.output<
  typeof ElevenLabsUploadConversationFileRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/conversations/:conversation_id/sip-messages
// ---------------------------------------------------------------------------

export const ElevenLabsGetConversationSipMessagesRequestSchema = z.object({
  page_size: z.number().int().min(1).max(20).optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsGetConversationSipMessagesRequest = z.input<
  typeof ElevenLabsGetConversationSipMessagesRequestSchema
>;
export type ElevenLabsGetConversationSipMessagesRequestInput =
  ElevenLabsGetConversationSipMessagesRequest;
export type ElevenLabsGetConversationSipMessagesParsedRequest = z.output<
  typeof ElevenLabsGetConversationSipMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/conversations/:conversation_id/tags
// ---------------------------------------------------------------------------

export const ElevenLabsAssignConversationTagsRequestSchema = z.object({
  tag_ids: z.array(z.string()).min(1).max(50),
});

export type ElevenLabsAssignConversationTagsRequest = z.input<
  typeof ElevenLabsAssignConversationTagsRequestSchema
>;
export type ElevenLabsAssignConversationTagsRequestInput =
  ElevenLabsAssignConversationTagsRequest;
export type ElevenLabsAssignConversationTagsParsedRequest = z.output<
  typeof ElevenLabsAssignConversationTagsRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/conversations/:conversation_id/analysis/evaluations/run
// ---------------------------------------------------------------------------

export const ElevenLabsRunConversationEvaluationsRequestSchema = z.object({
  evaluation_id: z.string(),
  scope: z.enum(["conversation", "agent"]).optional(),
});

export type ElevenLabsRunConversationEvaluationsRequest = z.input<
  typeof ElevenLabsRunConversationEvaluationsRequestSchema
>;
export type ElevenLabsRunConversationEvaluationsRequestInput =
  ElevenLabsRunConversationEvaluationsRequest;
export type ElevenLabsRunConversationEvaluationsParsedRequest = z.output<
  typeof ElevenLabsRunConversationEvaluationsRequestSchema
>;

// ---------------------------------------------------------------------------
// Agents Platform (Conversational AI) — batch calling / telephony
// ---------------------------------------------------------------------------

// SIP-trunk inbound/outbound trunk configs and the per-conversation client
// data / telephony config are large, deeply-nested objects. We keep them as
// permissive records so the schema stays a thin metadata surface — callers
// compose the nested config themselves and the server passes it straight
// through.
const ElevenLabsConvaiConfigObjectSchema = z.record(z.string(), z.unknown());

const ElevenLabsBatchCallWhatsAppParamsSchema = z.object({
  whatsapp_phone_number_id: z.string().nullable().optional(),
  whatsapp_call_permission_request_template_name: z.string(),
  whatsapp_call_permission_request_template_language_code: z.string(),
});

const ElevenLabsBatchCallTelephonyConfigSchema = z.object({
  ringing_timeout_secs: z.number().int().min(1).max(999).optional(),
});

const ElevenLabsBatchCallRecipientSchema = z.object({
  id: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  whatsapp_user_id: z.string().nullable().optional(),
  conversation_initiation_client_data:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
});

// ---------------------------------------------------------------------------
// POST /v1/convai/batch-calling/submit
// ---------------------------------------------------------------------------

export const ElevenLabsSubmitBatchCallRequestSchema = z.object({
  call_name: z.string(),
  agent_id: z.string(),
  recipients: z.array(ElevenLabsBatchCallRecipientSchema).max(10000),
  scheduled_time_unix: z.number().int().nullable().optional(),
  agent_phone_number_id: z.string().nullable().optional(),
  whatsapp_params:
    ElevenLabsBatchCallWhatsAppParamsSchema.nullable().optional(),
  timezone: z.string().nullable().optional(),
  branch_id: z.string().nullable().optional(),
  environment: z.string().nullable().optional(),
  telephony_call_config: ElevenLabsBatchCallTelephonyConfigSchema.optional(),
  target_concurrency_limit: z.number().int().min(1).nullable().optional(),
});

export type ElevenLabsSubmitBatchCallRequest = z.input<
  typeof ElevenLabsSubmitBatchCallRequestSchema
>;
export type ElevenLabsSubmitBatchCallRequestInput =
  ElevenLabsSubmitBatchCallRequest;
export type ElevenLabsSubmitBatchCallParsedRequest = z.output<
  typeof ElevenLabsSubmitBatchCallRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/batch-calling/workspace
// ---------------------------------------------------------------------------

export const ElevenLabsListWorkspaceBatchCallsRequestSchema = z.object({
  limit: z.number().int().optional(),
  last_doc: z.string().nullable().optional(),
  agent_id: z.string().nullable().optional(),
});

export type ElevenLabsListWorkspaceBatchCallsRequest = z.input<
  typeof ElevenLabsListWorkspaceBatchCallsRequestSchema
>;
export type ElevenLabsListWorkspaceBatchCallsRequestInput =
  ElevenLabsListWorkspaceBatchCallsRequest;
export type ElevenLabsListWorkspaceBatchCallsParsedRequest = z.output<
  typeof ElevenLabsListWorkspaceBatchCallsRequestSchema
>;

export const ElevenLabsPhoneNumberProvider = z.enum([
  "twilio",
  "exotel",
  "sip_trunk",
]);

// ---------------------------------------------------------------------------
// POST /v1/convai/phone-numbers
// ---------------------------------------------------------------------------

// Importing a phone number is a discriminated union upstream (twilio / exotel /
// sip_trunk), each provider carrying its own credential fields. We model the
// shared keys as required and every provider-specific field as optional so the
// request object stays a single flat shape the MCP server can expose; callers
// supply the fields their chosen `provider` needs.
export const ElevenLabsCreatePhoneNumberRequestSchema = z.object({
  phone_number: z.string(),
  label: z.string(),
  provider: ElevenLabsPhoneNumberProvider,
  // Twilio
  sid: z.string().optional(),
  token: z.string().optional(),
  region_config: ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
  // Exotel
  account_sid: z.string().optional(),
  api_key: z.string().optional(),
  api_token: z.string().optional(),
  api_subdomain: z
    .enum(["api.in.exotel.com", "api.exotel.com"])
    .nullable()
    .optional(),
  app_id: z.string().optional(),
  applet_url: z.string().nullable().optional(),
  // SIP trunk
  inbound_trunk_config:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
  outbound_trunk_config:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
  // Deprecated upstream, accepted for backwards compatibility.
  supports_inbound: z.boolean().nullable().optional(),
  supports_outbound: z.boolean().nullable().optional(),
});

export type ElevenLabsCreatePhoneNumberRequest = z.input<
  typeof ElevenLabsCreatePhoneNumberRequestSchema
>;
export type ElevenLabsCreatePhoneNumberRequestInput =
  ElevenLabsCreatePhoneNumberRequest;
export type ElevenLabsCreatePhoneNumberParsedRequest = z.output<
  typeof ElevenLabsCreatePhoneNumberRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/phone-numbers
// ---------------------------------------------------------------------------

export const ElevenLabsListPhoneNumbersRequestSchema = z.object({
  provider: ElevenLabsPhoneNumberProvider.optional(),
  agent_id: z.string().nullable().optional(),
  branch_id: z.string().nullable().optional(),
});

export type ElevenLabsListPhoneNumbersRequest = z.input<
  typeof ElevenLabsListPhoneNumbersRequestSchema
>;
export type ElevenLabsListPhoneNumbersRequestInput =
  ElevenLabsListPhoneNumbersRequest;
export type ElevenLabsListPhoneNumbersParsedRequest = z.output<
  typeof ElevenLabsListPhoneNumbersRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/phone-numbers/:phone_number_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdatePhoneNumberRequestSchema = z.object({
  agent_id: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  inbound_trunk_config:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
  outbound_trunk_config:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
  livekit_stack: z.string().nullable().optional(),
  store_sip_messages: z.boolean().nullable().optional(),
  environment: z.string().nullable().optional(),
  branch_id: z.string().nullable().optional(),
});

export type ElevenLabsUpdatePhoneNumberRequest = z.input<
  typeof ElevenLabsUpdatePhoneNumberRequestSchema
>;
export type ElevenLabsUpdatePhoneNumberRequestInput =
  ElevenLabsUpdatePhoneNumberRequest;
export type ElevenLabsUpdatePhoneNumberParsedRequest = z.output<
  typeof ElevenLabsUpdatePhoneNumberRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/phone-numbers/:phone_number_id/sip-messages
// ---------------------------------------------------------------------------

export const ElevenLabsGetPhoneNumberSipMessagesRequestSchema =
  ElevenLabsGetConversationSipMessagesRequestSchema;

export type ElevenLabsGetPhoneNumberSipMessagesRequest = z.input<
  typeof ElevenLabsGetPhoneNumberSipMessagesRequestSchema
>;
export type ElevenLabsGetPhoneNumberSipMessagesRequestInput =
  ElevenLabsGetPhoneNumberSipMessagesRequest;
export type ElevenLabsGetPhoneNumberSipMessagesParsedRequest = z.output<
  typeof ElevenLabsGetPhoneNumberSipMessagesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/twilio/register-call
// ---------------------------------------------------------------------------

const ElevenLabsTelephonyDirectionSchema = z.enum(["inbound", "outbound"]);

const ElevenLabsTelephonyCallConfigSchema = z.object({
  ringing_timeout_secs: z.number().int().min(1).max(999).optional(),
});

export const ElevenLabsRegisterTwilioCallRequestSchema = z.object({
  agent_id: z.string(),
  from_number: z.string(),
  to_number: z.string(),
  direction: ElevenLabsTelephonyDirectionSchema.optional(),
  conversation_initiation_client_data:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
});

export type ElevenLabsRegisterTwilioCallRequest = z.input<
  typeof ElevenLabsRegisterTwilioCallRequestSchema
>;
export type ElevenLabsRegisterTwilioCallRequestInput =
  ElevenLabsRegisterTwilioCallRequest;
export type ElevenLabsRegisterTwilioCallParsedRequest = z.output<
  typeof ElevenLabsRegisterTwilioCallRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/twilio/outbound-call
// ---------------------------------------------------------------------------

export const ElevenLabsTwilioOutboundCallRequestSchema = z.object({
  agent_id: z.string(),
  agent_phone_number_id: z.string(),
  to_number: z.string(),
  conversation_initiation_client_data:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
  call_recording_enabled: z.boolean().nullable().optional(),
  telephony_call_config:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
});

export type ElevenLabsTwilioOutboundCallRequest = z.input<
  typeof ElevenLabsTwilioOutboundCallRequestSchema
>;
export type ElevenLabsTwilioOutboundCallRequestInput =
  ElevenLabsTwilioOutboundCallRequest;
export type ElevenLabsTwilioOutboundCallParsedRequest = z.output<
  typeof ElevenLabsTwilioOutboundCallRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/sip-trunk/outbound-call
// ---------------------------------------------------------------------------

export const ElevenLabsSipTrunkOutboundCallRequestSchema = z.object({
  agent_id: z.string(),
  agent_phone_number_id: z.string(),
  to_number: z.string(),
  conversation_initiation_client_data:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
  telephony_call_config:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
});

export type ElevenLabsSipTrunkOutboundCallRequest = z.input<
  typeof ElevenLabsSipTrunkOutboundCallRequestSchema
>;
export type ElevenLabsSipTrunkOutboundCallRequestInput =
  ElevenLabsSipTrunkOutboundCallRequest;
export type ElevenLabsSipTrunkOutboundCallParsedRequest = z.output<
  typeof ElevenLabsSipTrunkOutboundCallRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/exotel/outbound-call
// ---------------------------------------------------------------------------

export const ElevenLabsExotelOutboundCallRequestSchema = z.object({
  agent_id: z.string(),
  agent_phone_number_id: z.string(),
  to_number: z.string(),
  conversation_initiation_client_data:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
  telephony_call_config:
    ElevenLabsTelephonyCallConfigSchema.nullable().optional(),
});

export type ElevenLabsExotelOutboundCallRequest = z.input<
  typeof ElevenLabsExotelOutboundCallRequestSchema
>;
export type ElevenLabsExotelOutboundCallRequestInput =
  ElevenLabsExotelOutboundCallRequest;
export type ElevenLabsExotelOutboundCallParsedRequest = z.output<
  typeof ElevenLabsExotelOutboundCallRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/whatsapp/outbound-call
// ---------------------------------------------------------------------------

export const ElevenLabsWhatsAppOutboundCallRequestSchema = z.object({
  whatsapp_phone_number_id: z.string(),
  whatsapp_user_id: z.string(),
  whatsapp_call_permission_request_template_name: z.string(),
  whatsapp_call_permission_request_template_language_code: z.string(),
  agent_id: z.string(),
  conversation_initiation_client_data:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
});

export type ElevenLabsWhatsAppOutboundCallRequest = z.input<
  typeof ElevenLabsWhatsAppOutboundCallRequestSchema
>;
export type ElevenLabsWhatsAppOutboundCallRequestInput =
  ElevenLabsWhatsAppOutboundCallRequest;
export type ElevenLabsWhatsAppOutboundCallParsedRequest = z.output<
  typeof ElevenLabsWhatsAppOutboundCallRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/convai/whatsapp/outbound-message
// ---------------------------------------------------------------------------

const ElevenLabsWhatsAppTemplateTextParamSchema = z.object({
  parameter_name: z.string().nullable().optional(),
  type: z.literal("text").optional(),
  text: z.string(),
});

const ElevenLabsWhatsAppTemplateImageParamSchema = z.object({
  type: z.literal("image").optional(),
  image: z.object({
    link: z.string(),
  }),
});

const ElevenLabsWhatsAppTemplateDocumentParamSchema = z.object({
  type: z.literal("document").optional(),
  document: z.object({
    link: z.string(),
    filename: z.string().nullable().optional(),
  }),
});

const ElevenLabsWhatsAppTemplateLocationParamSchema = z.object({
  type: z.literal("location").optional(),
  location: z.object({
    latitude: z.string(),
    longitude: z.string(),
    name: z.string(),
    address: z.string(),
  }),
});

const ElevenLabsWhatsAppTemplateHeaderParamSchema = z.union([
  ElevenLabsWhatsAppTemplateTextParamSchema,
  ElevenLabsWhatsAppTemplateImageParamSchema,
  ElevenLabsWhatsAppTemplateDocumentParamSchema,
  ElevenLabsWhatsAppTemplateLocationParamSchema,
]);

const ElevenLabsWhatsAppTemplateComponentSchema = z.union([
  z.object({
    type: z.literal("header").optional(),
    parameters: z.array(ElevenLabsWhatsAppTemplateHeaderParamSchema),
  }),
  z.object({
    type: z.literal("body").optional(),
    parameters: z.array(ElevenLabsWhatsAppTemplateTextParamSchema),
  }),
  z.object({
    type: z.literal("button").optional(),
    parameters: z.array(ElevenLabsWhatsAppTemplateTextParamSchema),
    index: z.number().int(),
    sub_type: z.string(),
  }),
]);

export const ElevenLabsWhatsAppOutboundMessageRequestSchema = z.object({
  whatsapp_phone_number_id: z.string(),
  whatsapp_user_id: z.string(),
  template_name: z.string(),
  template_language_code: z.string(),
  template_params: z.array(ElevenLabsWhatsAppTemplateComponentSchema),
  agent_id: z.string(),
  conversation_initiation_client_data:
    ElevenLabsConvaiConfigObjectSchema.nullable().optional(),
});

export type ElevenLabsWhatsAppOutboundMessageRequest = z.input<
  typeof ElevenLabsWhatsAppOutboundMessageRequestSchema
>;
export type ElevenLabsWhatsAppOutboundMessageRequestInput =
  ElevenLabsWhatsAppOutboundMessageRequest;
export type ElevenLabsWhatsAppOutboundMessageParsedRequest = z.output<
  typeof ElevenLabsWhatsAppOutboundMessageRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/convai/whatsapp-accounts
// ---------------------------------------------------------------------------

export const ElevenLabsListWhatsAppAccountsRequestSchema = z.object({
  agent_id: z.string().nullable().optional(),
});

export type ElevenLabsListWhatsAppAccountsRequest = z.input<
  typeof ElevenLabsListWhatsAppAccountsRequestSchema
>;
export type ElevenLabsListWhatsAppAccountsRequestInput =
  ElevenLabsListWhatsAppAccountsRequest;
export type ElevenLabsListWhatsAppAccountsParsedRequest = z.output<
  typeof ElevenLabsListWhatsAppAccountsRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/convai/whatsapp-accounts/:phone_number_id
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateWhatsAppAccountRequestSchema = z.object({
  assigned_agent_id: z.string().nullable().optional(),
  enable_messaging: z.boolean().nullable().optional(),
  enable_audio_message_response: z.boolean().nullable().optional(),
});

export type ElevenLabsUpdateWhatsAppAccountRequest = z.input<
  typeof ElevenLabsUpdateWhatsAppAccountRequestSchema
>;
export type ElevenLabsUpdateWhatsAppAccountRequestInput =
  ElevenLabsUpdateWhatsAppAccountRequest;
export type ElevenLabsUpdateWhatsAppAccountParsedRequest = z.output<
  typeof ElevenLabsUpdateWhatsAppAccountRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/text-to-voice
// ---------------------------------------------------------------------------

export const ElevenLabsCreateVoiceFromPreviewRequestSchema = z.object({
  voice_name: z.string(),
  voice_description: z.string().min(20).max(1000),
  generated_voice_id: z.string(),
  labels: z.record(z.string(), z.string()).nullable().optional(),
  played_not_selected_voice_ids: z.array(z.string()).nullable().optional(),
});

export type ElevenLabsCreateVoiceFromPreviewRequest = z.input<
  typeof ElevenLabsCreateVoiceFromPreviewRequestSchema
>;
export type ElevenLabsCreateVoiceFromPreviewRequestInput =
  ElevenLabsCreateVoiceFromPreviewRequest;
export type ElevenLabsCreateVoiceFromPreviewParsedRequest = z.output<
  typeof ElevenLabsCreateVoiceFromPreviewRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/text-to-voice/design
// ---------------------------------------------------------------------------

// ElevenLabs ships new text-to-voice model versions before this package's enum
// catches up, so the enum below is unioned with an alias escape hatch. The
// upstream grammar is `eleven_`, then optional lowercase alphanumeric family
// segments, then the literal modality segment `ttv_`, then a terminal version
// `v<digits>` with optional underscore-separated point releases, e.g.
// eleven_ttv_v4, eleven_multilingual_ttv_v3_5.
//
// This deliberately does not reuse `ElevenLabsModelAliasSchema`: that
// text-to-speech hatch already matches both enumerated ids here, but it would
// also make `eleven_flash_v3` — a text-to-speech model — a valid voice-design
// `model_id`. Requiring `ttv_` before the terminal version keeps the modality
// boundary, at the cost of two near-identical alias consts in this file.
const ElevenLabsTtvModelAliasSchema = z
  .string()
  .regex(
    /^eleven_(?:[a-z0-9]+_)*ttv_v\d+(?:_\d+)*$/,
    "Expected a listed model or a versioned ElevenLabs text-to-voice id (e.g. eleven_ttv_v4)"
  );

export const ElevenLabsVoiceDesignRequestSchema = z.object({
  voice_description: z.string().min(20).max(1000),
  model_id: z
    .enum(["eleven_multilingual_ttv_v2", "eleven_ttv_v3"])
    .or(ElevenLabsTtvModelAliasSchema)
    .optional(),
  text: z.string().min(100).max(1000).nullable().optional(),
  auto_generate_text: z.boolean().optional(),
  loudness: z.number().min(-1.0).max(1.0).optional(),
  seed: z.number().int().min(0).max(2147483647).nullable().optional(),
  guidance_scale: z.number().min(0.0).max(100.0).optional(),
  stream_previews: z.boolean().optional(),
  should_enhance: z.boolean().optional(),
  remixing_session_id: z.string().nullable().optional(),
  remixing_session_iteration_id: z.string().nullable().optional(),
  quality: z.number().min(-1.0).max(1.0).nullable().optional(),
  reference_audio_base64: z.string().nullable().optional(),
  prompt_strength: z.number().min(0.0).max(1.0).nullable().optional(),
  output_format: z.string().optional(),
});

export type ElevenLabsVoiceDesignRequest = z.input<
  typeof ElevenLabsVoiceDesignRequestSchema
>;
export type ElevenLabsVoiceDesignRequestInput = ElevenLabsVoiceDesignRequest;
export type ElevenLabsVoiceDesignParsedRequest = z.output<
  typeof ElevenLabsVoiceDesignRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/text-to-voice/:voice_id/remix
// ---------------------------------------------------------------------------

export const ElevenLabsVoiceRemixRequestSchema = z.object({
  voice_description: z.string().min(5).max(1000),
  text: z.string().min(100).max(1000).nullable().optional(),
  auto_generate_text: z.boolean().optional(),
  loudness: z.number().min(-1.0).max(1.0).optional(),
  seed: z.number().int().min(0).max(2147483647).nullable().optional(),
  guidance_scale: z.number().min(0.0).max(100.0).optional(),
  stream_previews: z.boolean().optional(),
  remixing_session_id: z.string().nullable().optional(),
  remixing_session_iteration_id: z.string().nullable().optional(),
  prompt_strength: z.number().min(0.0).max(1.0).nullable().optional(),
  output_format: z.string().optional(),
});

export type ElevenLabsVoiceRemixRequest = z.input<
  typeof ElevenLabsVoiceRemixRequestSchema
>;
export type ElevenLabsVoiceRemixRequestInput = ElevenLabsVoiceRemixRequest;
export type ElevenLabsVoiceRemixParsedRequest = z.output<
  typeof ElevenLabsVoiceRemixRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/history
// ---------------------------------------------------------------------------

export const ElevenLabsHistoryListRequestSchema = z.object({
  page_size: z.number().int().max(1000).optional(),
  start_after_history_item_id: z.string().nullable().optional(),
  voice_id: z.string().nullable().optional(),
  model_id: z.string().nullable().optional(),
  date_before_unix: z.number().int().nullable().optional(),
  date_after_unix: z.number().int().nullable().optional(),
  sort_direction: z.enum(["asc", "desc"]).nullable().optional(),
  search: z.string().nullable().optional(),
  source: z.enum(["TTS", "STS", "Flows"]).nullable().optional(),
});

export type ElevenLabsHistoryListRequest = z.input<
  typeof ElevenLabsHistoryListRequestSchema
>;
export type ElevenLabsHistoryListRequestInput = ElevenLabsHistoryListRequest;
export type ElevenLabsHistoryListParsedRequest = z.output<
  typeof ElevenLabsHistoryListRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/history/download
// ---------------------------------------------------------------------------

export const ElevenLabsHistoryDownloadRequestSchema = z.object({
  history_item_ids: z.array(z.string()),
  output_format: z.string().nullable().optional(),
});

export type ElevenLabsHistoryDownloadRequest = z.input<
  typeof ElevenLabsHistoryDownloadRequestSchema
>;
export type ElevenLabsHistoryDownloadRequestInput =
  ElevenLabsHistoryDownloadRequest;
export type ElevenLabsHistoryDownloadParsedRequest = z.output<
  typeof ElevenLabsHistoryDownloadRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/dubbing
// ---------------------------------------------------------------------------

export const ElevenLabsListDubbingRequestSchema = z.object({
  cursor: z.string().nullable().optional(),
  page_size: z.number().int().min(1).max(200).optional(),
  dubbing_status: z.enum(["dubbing", "dubbed", "failed"]).optional(),
  dubbing_statuses: z
    .array(z.enum(["queued", "preparing", "dubbing", "dubbed", "failed"]))
    .nullable()
    .optional(),
  dubbing_models: z
    .array(z.enum(["dubbing_v1", "dubbing_v2"]))
    .nullable()
    .optional(),
  target_language_codes: z.array(z.string()).nullable().optional(),
  creation_sources: z
    .array(z.enum(["flow_node", "dubbing_ui", "dubbing_api"]))
    .nullable()
    .optional(),
  filter_by_creator: z.enum(["personal", "others", "all"]).optional(),
  order_by: z.enum(["created_at", "name"]).optional(),
  order_direction: z.enum(["DESCENDING", "ASCENDING"]).optional(),
});

export type ElevenLabsListDubbingRequest = z.input<
  typeof ElevenLabsListDubbingRequestSchema
>;
export type ElevenLabsListDubbingRequestInput = ElevenLabsListDubbingRequest;
export type ElevenLabsListDubbingParsedRequest = z.output<
  typeof ElevenLabsListDubbingRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/dubbing
// ---------------------------------------------------------------------------

export const ElevenLabsCreateDubbingRequestSchema = z.object({
  file: z.custom<Blob>().optional(),
  csv_file: z.custom<Blob>().optional(),
  foreground_audio_file: z.custom<Blob>().optional(),
  background_audio_file: z.custom<Blob>().optional(),
  name: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  source_lang: z.string().optional(),
  target_lang: z.string().nullable().optional(),
  target_accent: z.string().nullable().optional(),
  num_speakers: z.number().int().optional(),
  watermark: z.boolean().optional(),
  start_time: z.number().int().nullable().optional(),
  end_time: z.number().int().nullable().optional(),
  highest_resolution: z.boolean().optional(),
  drop_background_audio: z.boolean().optional(),
  use_profanity_filter: z.boolean().nullable().optional(),
  dubbing_studio: z.boolean().optional(),
  disable_voice_cloning: z.boolean().optional(),
  mode: z.string().optional(),
  csv_fps: z.number().nullable().optional(),
});

export type ElevenLabsCreateDubbingRequest = z.input<
  typeof ElevenLabsCreateDubbingRequestSchema
>;
export type ElevenLabsCreateDubbingRequestInput =
  ElevenLabsCreateDubbingRequest;
export type ElevenLabsCreateDubbingParsedRequest = z.output<
  typeof ElevenLabsCreateDubbingRequestSchema
>;

// ===========================================================================
// Studio / Projects
// ===========================================================================

const StudioPronunciationDictionaryLocatorSchema = z.object({
  pronunciation_dictionary_id: z.string(),
  version_id: z.string().nullable().optional(),
});

const StudioApplyTextNormalizationSchema = z.enum([
  "auto",
  "on",
  "off",
  "apply_english",
]);

const StudioQualityPresetSchema = z.enum([
  "standard",
  "high",
  "ultra",
  "ultra_lossless",
]);

// ---------------------------------------------------------------------------
// POST /v1/studio/podcasts
// ---------------------------------------------------------------------------

const StudioPodcastSourceSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("url"), url: z.string() }),
]);

export const ElevenLabsStudioCreatePodcastRequestSchema = z.object({
  model_id: z.string(),
  mode: z.union([
    z.object({
      type: z.literal("conversation"),
      conversation: z.object({
        host_voice_id: z.string(),
        guest_voice_id: z.string(),
      }),
    }),
    z.object({
      type: z.literal("bulletin"),
      bulletin: z.object({ host_voice_id: z.string() }),
    }),
  ]),
  source: z.union([
    StudioPodcastSourceSchema,
    z.array(StudioPodcastSourceSchema),
  ]),
  quality_preset: StudioQualityPresetSchema.optional(),
  duration_scale: z.enum(["short", "default", "long"]).optional(),
  language: z.string().length(2).nullable().optional(),
  intro: z.string().max(1500).nullable().optional(),
  outro: z.string().max(1500).nullable().optional(),
  instructions_prompt: z.string().max(3000).nullable().optional(),
  highlights: z.array(z.string().min(10).max(70)).nullable().optional(),
  callback_url: z.string().nullable().optional(),
  apply_text_normalization:
    StudioApplyTextNormalizationSchema.nullable().optional(),
});

export type ElevenLabsStudioCreatePodcastRequest = z.input<
  typeof ElevenLabsStudioCreatePodcastRequestSchema
>;
export type ElevenLabsStudioCreatePodcastRequestInput =
  ElevenLabsStudioCreatePodcastRequest;
export type ElevenLabsStudioCreatePodcastParsedRequest = z.output<
  typeof ElevenLabsStudioCreatePodcastRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/studio/projects/{project_id}
// ---------------------------------------------------------------------------

export const ElevenLabsStudioGetProjectRequestSchema = z.object({
  share_id: z.string().nullable().optional(),
});

export type ElevenLabsStudioGetProjectRequest = z.input<
  typeof ElevenLabsStudioGetProjectRequestSchema
>;
export type ElevenLabsStudioGetProjectRequestInput =
  ElevenLabsStudioGetProjectRequest;
export type ElevenLabsStudioGetProjectParsedRequest = z.output<
  typeof ElevenLabsStudioGetProjectRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/studio/projects  (multipart/form-data)
// ---------------------------------------------------------------------------

export const ElevenLabsStudioCreateProjectRequestSchema = z.object({
  name: z.string(),
  default_title_voice_id: z.string().nullable().optional(),
  default_paragraph_voice_id: z.string().nullable().optional(),
  default_model_id: z.string().nullable().optional(),
  from_url: z.string().nullable().optional(),
  from_document: z.custom<Blob>().nullable().optional(),
  from_content_json: z.string().optional(),
  quality_preset: StudioQualityPresetSchema.optional(),
  title: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  genres: z.array(z.string()).optional(),
  target_audience: z
    .enum(["children", "young adult", "adult", "all ages"])
    .nullable()
    .optional(),
  language: z.string().length(2).nullable().optional(),
  content_type: z.string().nullable().optional(),
  original_publication_date: z.string().nullable().optional(),
  mature_content: z.boolean().nullable().optional(),
  isbn_number: z.string().nullable().optional(),
  acx_volume_normalization: z.boolean().optional(),
  volume_normalization: z.boolean().optional(),
  pronunciation_dictionary_locators: z
    .array(StudioPronunciationDictionaryLocatorSchema)
    .optional(),
  callback_url: z.string().nullable().optional(),
  fiction: z.enum(["fiction", "non-fiction"]).nullable().optional(),
  apply_text_normalization:
    StudioApplyTextNormalizationSchema.nullable().optional(),
  auto_convert: z.boolean().optional(),
  auto_assign_voices: z.boolean().nullable().optional(),
  source_type: z
    .enum(["blank", "book", "article", "genfm", "video", "screenplay"])
    .nullable()
    .optional(),
  voice_settings: z.array(z.record(z.string(), z.unknown())).optional(),
  create_publishing_read: z.boolean().nullable().optional(),
});

export type ElevenLabsStudioCreateProjectRequest = z.input<
  typeof ElevenLabsStudioCreateProjectRequestSchema
>;
export type ElevenLabsStudioCreateProjectRequestInput =
  ElevenLabsStudioCreateProjectRequest;
export type ElevenLabsStudioCreateProjectParsedRequest = z.output<
  typeof ElevenLabsStudioCreateProjectRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/studio/projects/{project_id}
// ---------------------------------------------------------------------------

export const ElevenLabsStudioUpdateProjectRequestSchema = z.object({
  name: z.string(),
  default_title_voice_id: z.string(),
  default_paragraph_voice_id: z.string(),
  title: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  isbn_number: z.string().nullable().optional(),
  volume_normalization: z.boolean().optional(),
});

export type ElevenLabsStudioUpdateProjectRequest = z.input<
  typeof ElevenLabsStudioUpdateProjectRequestSchema
>;
export type ElevenLabsStudioUpdateProjectRequestInput =
  ElevenLabsStudioUpdateProjectRequest;
export type ElevenLabsStudioUpdateProjectParsedRequest = z.output<
  typeof ElevenLabsStudioUpdateProjectRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/studio/projects/{project_id}/content  (multipart/form-data)
// ---------------------------------------------------------------------------

export const ElevenLabsStudioUpdateProjectContentRequestSchema = z.object({
  from_url: z.string().nullable().optional(),
  from_document: z.custom<Blob>().nullable().optional(),
  from_content_json: z.string().optional(),
  auto_convert: z.boolean().optional(),
});

export type ElevenLabsStudioUpdateProjectContentRequest = z.input<
  typeof ElevenLabsStudioUpdateProjectContentRequestSchema
>;
export type ElevenLabsStudioUpdateProjectContentRequestInput =
  ElevenLabsStudioUpdateProjectContentRequest;
export type ElevenLabsStudioUpdateProjectContentParsedRequest = z.output<
  typeof ElevenLabsStudioUpdateProjectContentRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/studio/projects/{project_id}/pronunciation-dictionaries
// ---------------------------------------------------------------------------

export const ElevenLabsStudioCreatePronunciationDictionariesRequestSchema =
  z.object({
    pronunciation_dictionary_locators: z.array(
      StudioPronunciationDictionaryLocatorSchema
    ),
    invalidate_affected_text: z.boolean().optional(),
  });

export type ElevenLabsStudioCreatePronunciationDictionariesRequest = z.input<
  typeof ElevenLabsStudioCreatePronunciationDictionariesRequestSchema
>;
export type ElevenLabsStudioCreatePronunciationDictionariesRequestInput =
  ElevenLabsStudioCreatePronunciationDictionariesRequest;
export type ElevenLabsStudioCreatePronunciationDictionariesParsedRequest =
  z.output<typeof ElevenLabsStudioCreatePronunciationDictionariesRequestSchema>;

// ---------------------------------------------------------------------------
// POST /v1/studio/projects/{project_id}/snapshots/{snapshot_id}/stream
// POST .../chapters/{chapter_id}/snapshots/{chapter_snapshot_id}/stream
// ---------------------------------------------------------------------------

export const ElevenLabsStudioStreamAudioRequestSchema = z.object({
  convert_to_mpeg: z.boolean().optional(),
});

export type ElevenLabsStudioStreamAudioRequest = z.input<
  typeof ElevenLabsStudioStreamAudioRequestSchema
>;
export type ElevenLabsStudioStreamAudioRequestInput =
  ElevenLabsStudioStreamAudioRequest;
export type ElevenLabsStudioStreamAudioParsedRequest = z.output<
  typeof ElevenLabsStudioStreamAudioRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/studio/projects/{project_id}/chapters
// ---------------------------------------------------------------------------

export const ElevenLabsStudioCreateChapterRequestSchema = z.object({
  name: z.string(),
  from_url: z.string().nullable().optional(),
});

export type ElevenLabsStudioCreateChapterRequest = z.input<
  typeof ElevenLabsStudioCreateChapterRequestSchema
>;
export type ElevenLabsStudioCreateChapterRequestInput =
  ElevenLabsStudioCreateChapterRequest;
export type ElevenLabsStudioCreateChapterParsedRequest = z.output<
  typeof ElevenLabsStudioCreateChapterRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/studio/projects/{project_id}/chapters/{chapter_id}
// ---------------------------------------------------------------------------

const StudioChapterContentNodeSchema = z.object({
  type: z.string(),
  text: z.string(),
  voice_id: z.string(),
});

const StudioChapterContentBlockSchema = z.object({
  sub_type: z.enum(["p", "h1", "h2", "h3"]).nullable().optional(),
  nodes: z.array(StudioChapterContentNodeSchema),
  block_id: z.string().nullable().optional(),
});

export const ElevenLabsStudioUpdateChapterRequestSchema = z.object({
  name: z.string().nullable().optional(),
  content: z
    .object({ blocks: z.array(StudioChapterContentBlockSchema) })
    .nullable()
    .optional(),
});

export type ElevenLabsStudioUpdateChapterRequest = z.input<
  typeof ElevenLabsStudioUpdateChapterRequestSchema
>;
export type ElevenLabsStudioUpdateChapterRequestInput =
  ElevenLabsStudioUpdateChapterRequest;
export type ElevenLabsStudioUpdateChapterParsedRequest = z.output<
  typeof ElevenLabsStudioUpdateChapterRequestSchema
>;

// ---------------------------------------------------------------------------
// Pronunciation Dictionaries
// ---------------------------------------------------------------------------

export const ElevenLabsListPronunciationDictionariesRequestSchema = z.object({
  cursor: z.string().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  sort: z.enum(["creation_time_unix", "name"]).optional(),
  sort_direction: z.string().optional(),
});

export const ElevenLabsAddPronunciationDictionaryFromFileRequestSchema =
  z.object({
    name: z.string(),
    file: z.any().optional(),
    description: z.string().optional(),
    workspace_access: z
      .enum(["admin", "editor", "commenter", "viewer"])
      .optional(),
  });

export const ElevenLabsPronunciationDictionaryAliasRuleRequestSchema = z.object(
  {
    string_to_replace: z.string(),
    case_sensitive: z.boolean().optional(),
    word_boundaries: z.boolean().optional(),
    type: z.literal("alias"),
    alias: z.string(),
  }
);

export const ElevenLabsPronunciationDictionaryPhonemeRuleRequestSchema =
  z.object({
    string_to_replace: z.string(),
    case_sensitive: z.boolean().optional(),
    word_boundaries: z.boolean().optional(),
    type: z.literal("phoneme"),
    phoneme: z.string(),
    alphabet: z.string(),
  });

export const ElevenLabsPronunciationDictionaryRuleRequestSchema = z.union([
  ElevenLabsPronunciationDictionaryAliasRuleRequestSchema,
  ElevenLabsPronunciationDictionaryPhonemeRuleRequestSchema,
]);

export const ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema =
  z.object({
    name: z.string(),
    description: z.string().optional(),
    workspace_access: z
      .enum(["admin", "editor", "commenter", "viewer"])
      .optional(),
    rules: z.array(ElevenLabsPronunciationDictionaryRuleRequestSchema),
  });

export const ElevenLabsGetPronunciationDictionaryRequestSchema = z.object({});

export const ElevenLabsUpdatePronunciationDictionaryRequestSchema = z.object({
  name: z.string().optional(),
  archived: z.boolean().optional(),
});

export const ElevenLabsAddPronunciationDictionaryRulesRequestSchema = z.object({
  rules: z.array(ElevenLabsPronunciationDictionaryRuleRequestSchema),
});

export const ElevenLabsRemovePronunciationDictionaryRulesRequestSchema =
  z.object({
    rule_strings: z.array(z.string()),
  });

export const ElevenLabsSetPronunciationDictionaryRulesRequestSchema = z.object({
  rules: z.array(ElevenLabsPronunciationDictionaryRuleRequestSchema),
});

export const ElevenLabsDownloadPronunciationDictionaryRequestSchema = z.object(
  {}
);

export type ElevenLabsListPronunciationDictionariesRequest = z.input<
  typeof ElevenLabsListPronunciationDictionariesRequestSchema
>;
export type ElevenLabsListPronunciationDictionariesRequestInput = z.input<
  typeof ElevenLabsListPronunciationDictionariesRequestSchema
>;
export type ElevenLabsListPronunciationDictionariesParsedRequest = z.output<
  typeof ElevenLabsListPronunciationDictionariesRequestSchema
>;

export type ElevenLabsAddPronunciationDictionaryFromFileRequest = z.input<
  typeof ElevenLabsAddPronunciationDictionaryFromFileRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryFromFileRequestInput = z.input<
  typeof ElevenLabsAddPronunciationDictionaryFromFileRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryFromFileParsedRequest =
  z.output<typeof ElevenLabsAddPronunciationDictionaryFromFileRequestSchema>;

export type ElevenLabsAddPronunciationDictionaryFromRulesRequest = z.input<
  typeof ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryFromRulesRequestInput = z.input<
  typeof ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryFromRulesParsedRequest =
  z.output<typeof ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema>;

export type ElevenLabsGetPronunciationDictionaryRequest = z.input<
  typeof ElevenLabsGetPronunciationDictionaryRequestSchema
>;
export type ElevenLabsGetPronunciationDictionaryRequestInput = z.input<
  typeof ElevenLabsGetPronunciationDictionaryRequestSchema
>;
export type ElevenLabsGetPronunciationDictionaryParsedRequest = z.output<
  typeof ElevenLabsGetPronunciationDictionaryRequestSchema
>;

export type ElevenLabsUpdatePronunciationDictionaryRequest = z.input<
  typeof ElevenLabsUpdatePronunciationDictionaryRequestSchema
>;
export type ElevenLabsUpdatePronunciationDictionaryRequestInput = z.input<
  typeof ElevenLabsUpdatePronunciationDictionaryRequestSchema
>;
export type ElevenLabsUpdatePronunciationDictionaryParsedRequest = z.output<
  typeof ElevenLabsUpdatePronunciationDictionaryRequestSchema
>;

export type ElevenLabsAddPronunciationDictionaryRulesRequest = z.input<
  typeof ElevenLabsAddPronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryRulesRequestInput = z.input<
  typeof ElevenLabsAddPronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryRulesParsedRequest = z.output<
  typeof ElevenLabsAddPronunciationDictionaryRulesRequestSchema
>;

export type ElevenLabsRemovePronunciationDictionaryRulesRequest = z.input<
  typeof ElevenLabsRemovePronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsRemovePronunciationDictionaryRulesRequestInput = z.input<
  typeof ElevenLabsRemovePronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsRemovePronunciationDictionaryRulesParsedRequest =
  z.output<typeof ElevenLabsRemovePronunciationDictionaryRulesRequestSchema>;

export type ElevenLabsSetPronunciationDictionaryRulesRequest = z.input<
  typeof ElevenLabsSetPronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsSetPronunciationDictionaryRulesRequestInput = z.input<
  typeof ElevenLabsSetPronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsSetPronunciationDictionaryRulesParsedRequest = z.output<
  typeof ElevenLabsSetPronunciationDictionaryRulesRequestSchema
>;

export type ElevenLabsDownloadPronunciationDictionaryRequest = z.input<
  typeof ElevenLabsDownloadPronunciationDictionaryRequestSchema
>;
export type ElevenLabsDownloadPronunciationDictionaryRequestInput = z.input<
  typeof ElevenLabsDownloadPronunciationDictionaryRequestSchema
>;
export type ElevenLabsDownloadPronunciationDictionaryParsedRequest = z.output<
  typeof ElevenLabsDownloadPronunciationDictionaryRequestSchema
>;

export type ElevenLabsPronunciationDictionaryAliasRuleRequest = z.input<
  typeof ElevenLabsPronunciationDictionaryAliasRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryAliasRuleRequestInput = z.input<
  typeof ElevenLabsPronunciationDictionaryAliasRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryAliasRuleParsedRequest = z.output<
  typeof ElevenLabsPronunciationDictionaryAliasRuleRequestSchema
>;

export type ElevenLabsPronunciationDictionaryPhonemeRuleRequest = z.input<
  typeof ElevenLabsPronunciationDictionaryPhonemeRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryPhonemeRuleRequestInput = z.input<
  typeof ElevenLabsPronunciationDictionaryPhonemeRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryPhonemeRuleParsedRequest =
  z.output<typeof ElevenLabsPronunciationDictionaryPhonemeRuleRequestSchema>;

export type ElevenLabsPronunciationDictionaryRuleRequest = z.input<
  typeof ElevenLabsPronunciationDictionaryRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryRuleRequestInput = z.input<
  typeof ElevenLabsPronunciationDictionaryRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryRuleParsedRequest = z.output<
  typeof ElevenLabsPronunciationDictionaryRuleRequestSchema
>;

// ---------------------------------------------------------------------------
// Speech Engine
// ---------------------------------------------------------------------------

const ElevenLabsSpeechEngineHeaderValueSchema = z.union([
  z.string(),
  z.object({ secret_id: z.string() }),
  z.object({ variable_name: z.string() }),
]);

const ElevenLabsSpeechEngineConfigSchema = z.object({
  ws_url: z.string(),
  request_headers: z
    .record(z.string(), ElevenLabsSpeechEngineHeaderValueSchema)
    .optional(),
});

const ElevenLabsSpeechEngineObjectConfigSchema = z.record(
  z.string(),
  z.unknown()
);

// ---------------------------------------------------------------------------
// GET /v1/speech-engine
// ---------------------------------------------------------------------------

export const ElevenLabsListSpeechEnginesRequestSchema = z.object({
  page_size: z.number().int().max(100).optional(),
  search: z.string().nullable().optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
  sort_by: z
    .enum(["name", "created_at", "call_count_7d"])
    .nullable()
    .optional(),
  cursor: z.string().nullable().optional(),
});

export type ElevenLabsListSpeechEnginesRequest = z.input<
  typeof ElevenLabsListSpeechEnginesRequestSchema
>;
export type ElevenLabsListSpeechEnginesRequestInput =
  ElevenLabsListSpeechEnginesRequest;
export type ElevenLabsListSpeechEnginesParsedRequest = z.output<
  typeof ElevenLabsListSpeechEnginesRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/speech-engine
// ---------------------------------------------------------------------------

export const ElevenLabsCreateSpeechEngineRequestSchema = z.object({
  name: z.string().optional(),
  speech_engine: ElevenLabsSpeechEngineConfigSchema,
  asr: ElevenLabsSpeechEngineObjectConfigSchema.optional(),
  tts: ElevenLabsSpeechEngineObjectConfigSchema.optional(),
  turn: ElevenLabsSpeechEngineObjectConfigSchema.optional(),
  conversation: ElevenLabsSpeechEngineObjectConfigSchema.optional(),
  privacy: ElevenLabsSpeechEngineObjectConfigSchema.optional(),
  call_limits: ElevenLabsSpeechEngineObjectConfigSchema.optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
  overrides: ElevenLabsSpeechEngineObjectConfigSchema.optional(),
});

export type ElevenLabsCreateSpeechEngineRequest = z.input<
  typeof ElevenLabsCreateSpeechEngineRequestSchema
>;
export type ElevenLabsCreateSpeechEngineRequestInput =
  ElevenLabsCreateSpeechEngineRequest;
export type ElevenLabsCreateSpeechEngineParsedRequest = z.output<
  typeof ElevenLabsCreateSpeechEngineRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/speech-engine/{speechEngineId}
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateSpeechEngineRequestSchema = z.object({
  name: z.string().nullable().optional(),
  speech_engine: ElevenLabsSpeechEngineConfigSchema.nullable().optional(),
  asr: ElevenLabsSpeechEngineObjectConfigSchema.nullable().optional(),
  tts: ElevenLabsSpeechEngineObjectConfigSchema.nullable().optional(),
  turn: ElevenLabsSpeechEngineObjectConfigSchema.nullable().optional(),
  conversation: ElevenLabsSpeechEngineObjectConfigSchema.nullable().optional(),
  privacy: ElevenLabsSpeechEngineObjectConfigSchema.nullable().optional(),
  call_limits: ElevenLabsSpeechEngineObjectConfigSchema.nullable().optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  overrides: ElevenLabsSpeechEngineObjectConfigSchema.nullable().optional(),
});

export type ElevenLabsUpdateSpeechEngineRequest = z.input<
  typeof ElevenLabsUpdateSpeechEngineRequestSchema
>;
export type ElevenLabsUpdateSpeechEngineRequestInput =
  ElevenLabsUpdateSpeechEngineRequest;
export type ElevenLabsUpdateSpeechEngineParsedRequest = z.output<
  typeof ElevenLabsUpdateSpeechEngineRequestSchema
>;

// ---------------------------------------------------------------------------
// Productions / Orders shared schemas
// ---------------------------------------------------------------------------

const ElevenLabsOrderRequestStateSchema = z.enum([
  "open",
  "submitted",
  "paid",
  "accepted",
  "rejected",
  "done",
]);

const ElevenLabsCueOptionsRequestSchema = z.object({
  min_duration_ms: z.number().int().max(2000).optional(),
  max_duration_ms: z.number().int().min(4000).optional(),
  max_lines_per_cue: z.number().int().min(1).max(3).optional(),
  max_chars_per_line: z.number().int().min(16).max(50).optional(),
  max_chars_per_s: z.number().int().min(15).max(30).nullable().optional(),
  min_gap_between_cues_frames: z
    .number()
    .int()
    .min(0)
    .max(6)
    .nullable()
    .optional(),
});

const ElevenLabsDubOrderItemRequestSchema = z.object({
  kind: z.literal("dub").optional(),
  media_id: z.string(),
  source_language: z.string(),
  destination_languages: z.array(z.string()),
  include_captions: z.boolean(),
  include_source_captions: z.boolean(),
  instructions: z.string().nullable().optional(),
  captions_sdh: z.boolean().nullable().optional(),
});

const ElevenLabsSubtitleOrderItemRequestSchema = z.object({
  kind: z.literal("subtitles").optional(),
  media_ids: z.array(z.string()),
  source_language: z.string(),
  destination_languages: z.array(z.string()),
  cue_options: ElevenLabsCueOptionsRequestSchema.optional(),
  sdh: z.boolean().optional(),
  instructions: z.string().nullable().optional(),
});

const ElevenLabsOrderItemRequestSchema = z.union([
  ElevenLabsDubOrderItemRequestSchema,
  ElevenLabsSubtitleOrderItemRequestSchema,
]);

// ---------------------------------------------------------------------------
// GET /v1/productions/orders
// ---------------------------------------------------------------------------

export const ElevenLabsListOrdersRequestSchema = z.object({
  page_size: z.number().int().max(100).optional(),
  offset: z.number().int().min(0).optional(),
  status: z.array(ElevenLabsOrderRequestStateSchema).nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export type ElevenLabsListOrdersRequest = z.input<
  typeof ElevenLabsListOrdersRequestSchema
>;
export type ElevenLabsListOrdersRequestInput = ElevenLabsListOrdersRequest;
export type ElevenLabsListOrdersParsedRequest = z.output<
  typeof ElevenLabsListOrdersRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/productions/orders
// ---------------------------------------------------------------------------

export const ElevenLabsCreateOrderRequestSchema = z.object({
  sandbox: z.boolean().optional(),
});

export type ElevenLabsCreateOrderRequest = z.input<
  typeof ElevenLabsCreateOrderRequestSchema
>;
export type ElevenLabsCreateOrderRequestInput = ElevenLabsCreateOrderRequest;
export type ElevenLabsCreateOrderParsedRequest = z.output<
  typeof ElevenLabsCreateOrderRequestSchema
>;

// ---------------------------------------------------------------------------
// PATCH /v1/productions/orders/{orderId}
// ---------------------------------------------------------------------------

export const ElevenLabsUpdateOrderRequestSchema = z.object({
  name: z.string().min(1).max(120),
});

export type ElevenLabsUpdateOrderRequest = z.input<
  typeof ElevenLabsUpdateOrderRequestSchema
>;
export type ElevenLabsUpdateOrderRequestInput = ElevenLabsUpdateOrderRequest;
export type ElevenLabsUpdateOrderParsedRequest = z.output<
  typeof ElevenLabsUpdateOrderRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/productions/orders/{orderId}/items
// ---------------------------------------------------------------------------

export const ElevenLabsUpsertOrderItemRequestSchema = z.object({
  item: ElevenLabsOrderItemRequestSchema,
  item_id: z.string().nullable().optional(),
});

export type ElevenLabsUpsertOrderItemRequest = z.input<
  typeof ElevenLabsUpsertOrderItemRequestSchema
>;
export type ElevenLabsUpsertOrderItemRequestInput =
  ElevenLabsUpsertOrderItemRequest;
export type ElevenLabsUpsertOrderItemParsedRequest = z.output<
  typeof ElevenLabsUpsertOrderItemRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/productions/orders/{orderId}/media
// ---------------------------------------------------------------------------

export const ElevenLabsRegisterOrderMediaRequestSchema = z.object({
  declared_language: z.string(),
  media: z.custom<Blob>((value) => value instanceof Blob).optional(),
  media_url: z.string().nullable().optional(),
  media_url_filename: z.string().nullable().optional(),
  media_url_content_type: z.string().nullable().optional(),
});

export type ElevenLabsRegisterOrderMediaRequest = z.input<
  typeof ElevenLabsRegisterOrderMediaRequestSchema
>;
export type ElevenLabsRegisterOrderMediaRequestInput =
  ElevenLabsRegisterOrderMediaRequest;
export type ElevenLabsRegisterOrderMediaParsedRequest = z.output<
  typeof ElevenLabsRegisterOrderMediaRequestSchema
>;
