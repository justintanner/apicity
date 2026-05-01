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
