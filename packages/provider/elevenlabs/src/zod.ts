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
