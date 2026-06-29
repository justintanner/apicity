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
  text: z.string().min(1),
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

export const ElevenLabsTextToSpeechRequestSchema = z.object({
  text: z.string().min(1),
  model_id: z.string().optional(),
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
});

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

// Multipart form: exactly one of `file` or `cloud_storage_url` is required.
// `enable_logging` is a query-string parameter; the factory strips it from the
// body and moves it to the URL.
export const ElevenLabsSpeechToTextRequestSchema = z.object({
  model_id: z.enum(["scribe_v1", "scribe_v2"]),
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

const ElevenLabsMusicModelIdSchema = z.enum(["music_v1", "music_v2"]);

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
// Agents Platform — Knowledge Base
// ---------------------------------------------------------------------------

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
    .array(z.enum(["file", "url", "text", "folder"]))
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
// Agents Platform (Conversational AI) — phone numbers & outbound calls
// ---------------------------------------------------------------------------

// SIP-trunk inbound/outbound trunk configs and the per-conversation client
// data / telephony config are large, deeply-nested objects. We keep them as
// permissive records so the schema stays a thin metadata surface — callers
// compose the nested config themselves and the server passes it straight
// through.
const ElevenLabsConvaiConfigObjectSchema = z.record(z.string(), z.unknown());

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

export const ElevenLabsVoiceDesignRequestSchema = z.object({
  voice_description: z.string().min(20).max(1000),
  model_id: z.enum(["eleven_multilingual_ttv_v2", "eleven_ttv_v3"]).optional(),
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

export type ElevenLabsListPronunciationDictionariesRequest = z.infer<
  typeof ElevenLabsListPronunciationDictionariesRequestSchema
>;
export type ElevenLabsListPronunciationDictionariesRequestInput = z.input<
  typeof ElevenLabsListPronunciationDictionariesRequestSchema
>;
export type ElevenLabsListPronunciationDictionariesParsedRequest = z.output<
  typeof ElevenLabsListPronunciationDictionariesRequestSchema
>;

export type ElevenLabsAddPronunciationDictionaryFromFileRequest = z.infer<
  typeof ElevenLabsAddPronunciationDictionaryFromFileRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryFromFileRequestInput = z.input<
  typeof ElevenLabsAddPronunciationDictionaryFromFileRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryFromFileParsedRequest =
  z.output<typeof ElevenLabsAddPronunciationDictionaryFromFileRequestSchema>;

export type ElevenLabsAddPronunciationDictionaryFromRulesRequest = z.infer<
  typeof ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryFromRulesRequestInput = z.input<
  typeof ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryFromRulesParsedRequest =
  z.output<typeof ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema>;

export type ElevenLabsGetPronunciationDictionaryRequest = z.infer<
  typeof ElevenLabsGetPronunciationDictionaryRequestSchema
>;
export type ElevenLabsGetPronunciationDictionaryRequestInput = z.input<
  typeof ElevenLabsGetPronunciationDictionaryRequestSchema
>;
export type ElevenLabsGetPronunciationDictionaryParsedRequest = z.output<
  typeof ElevenLabsGetPronunciationDictionaryRequestSchema
>;

export type ElevenLabsUpdatePronunciationDictionaryRequest = z.infer<
  typeof ElevenLabsUpdatePronunciationDictionaryRequestSchema
>;
export type ElevenLabsUpdatePronunciationDictionaryRequestInput = z.input<
  typeof ElevenLabsUpdatePronunciationDictionaryRequestSchema
>;
export type ElevenLabsUpdatePronunciationDictionaryParsedRequest = z.output<
  typeof ElevenLabsUpdatePronunciationDictionaryRequestSchema
>;

export type ElevenLabsAddPronunciationDictionaryRulesRequest = z.infer<
  typeof ElevenLabsAddPronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryRulesRequestInput = z.input<
  typeof ElevenLabsAddPronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsAddPronunciationDictionaryRulesParsedRequest = z.output<
  typeof ElevenLabsAddPronunciationDictionaryRulesRequestSchema
>;

export type ElevenLabsRemovePronunciationDictionaryRulesRequest = z.infer<
  typeof ElevenLabsRemovePronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsRemovePronunciationDictionaryRulesRequestInput = z.input<
  typeof ElevenLabsRemovePronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsRemovePronunciationDictionaryRulesParsedRequest =
  z.output<typeof ElevenLabsRemovePronunciationDictionaryRulesRequestSchema>;

export type ElevenLabsSetPronunciationDictionaryRulesRequest = z.infer<
  typeof ElevenLabsSetPronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsSetPronunciationDictionaryRulesRequestInput = z.input<
  typeof ElevenLabsSetPronunciationDictionaryRulesRequestSchema
>;
export type ElevenLabsSetPronunciationDictionaryRulesParsedRequest = z.output<
  typeof ElevenLabsSetPronunciationDictionaryRulesRequestSchema
>;

export type ElevenLabsDownloadPronunciationDictionaryRequest = z.infer<
  typeof ElevenLabsDownloadPronunciationDictionaryRequestSchema
>;
export type ElevenLabsDownloadPronunciationDictionaryRequestInput = z.input<
  typeof ElevenLabsDownloadPronunciationDictionaryRequestSchema
>;
export type ElevenLabsDownloadPronunciationDictionaryParsedRequest = z.output<
  typeof ElevenLabsDownloadPronunciationDictionaryRequestSchema
>;

export type ElevenLabsPronunciationDictionaryAliasRuleRequest = z.infer<
  typeof ElevenLabsPronunciationDictionaryAliasRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryAliasRuleRequestInput = z.input<
  typeof ElevenLabsPronunciationDictionaryAliasRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryAliasRuleParsedRequest = z.output<
  typeof ElevenLabsPronunciationDictionaryAliasRuleRequestSchema
>;

export type ElevenLabsPronunciationDictionaryPhonemeRuleRequest = z.infer<
  typeof ElevenLabsPronunciationDictionaryPhonemeRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryPhonemeRuleRequestInput = z.input<
  typeof ElevenLabsPronunciationDictionaryPhonemeRuleRequestSchema
>;
export type ElevenLabsPronunciationDictionaryPhonemeRuleParsedRequest =
  z.output<typeof ElevenLabsPronunciationDictionaryPhonemeRuleRequestSchema>;

export type ElevenLabsPronunciationDictionaryRuleRequest = z.infer<
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
