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

export type ElevenLabsListVoicesRequest = z.infer<
  typeof ElevenLabsListVoicesRequestSchema
>;

// ---------------------------------------------------------------------------
// GET /v1/voices/:voice_id
// ---------------------------------------------------------------------------

export const ElevenLabsGetVoiceRequestSchema = z.object({
  with_settings: z.boolean().optional(),
});

export type ElevenLabsGetVoiceRequest = z.infer<
  typeof ElevenLabsGetVoiceRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /v1/voices/pvc/:voice_id/captcha
// ---------------------------------------------------------------------------

export const ElevenLabsPvcVoiceCaptchaRequestSchema = z.object({
  recording: z.custom<Blob>((value) => value instanceof Blob),
});

export type ElevenLabsPvcVoiceCaptchaRequest = z.infer<
  typeof ElevenLabsPvcVoiceCaptchaRequestSchema
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

export type ElevenLabsSoundGenerationRequest = z.infer<
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

export type ElevenLabsTextToSpeechRequest = z.infer<
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
});

export type ElevenLabsTextToDialogueRequest = z.infer<
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
  additional_formats: z.array(z.record(z.unknown())).optional(),
  file_format: z.enum(["pcm_s16le_16", "other"]).optional(),
  webhook: z.boolean().optional(),
  webhook_id: z.string().nullable().optional(),
  webhook_metadata: z
    .union([z.string(), z.record(z.unknown())])
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

export type ElevenLabsSpeechToTextRequest = z.infer<
  typeof ElevenLabsSpeechToTextRequestSchema
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

export type ElevenLabsWorkspaceAnalyticsRequestsRequest = z.infer<
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

export type ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest = z.infer<
  typeof ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema
>;
