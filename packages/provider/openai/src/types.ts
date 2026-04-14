import type { z } from "zod";

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  OpenAiOptions,
  OpenAiTextPart,
  OpenAiImageUrlPart,
  OpenAiContentPart,
  OpenAiMessage,
  OpenAiToolFunction,
  OpenAiTool,
  OpenAiChatRequest,
  OpenAiStoredCompletionUpdateRequest,
  OpenAiSpeechRequest,
  OpenAiTranscribeRequest,
  OpenAiTranslateRequest,
  OpenAiEmbeddingRequest,
  OpenAiImageEditRequest,
  OpenAiImageGenerationRequest,
  OpenAiModerationTextInput,
  OpenAiModerationImageUrlInput,
  OpenAiModerationMultiModalInput,
  OpenAiModerationRequest,
  OpenAiFileUploadRequest,
  OpenAiBatchCreateRequest,
  OpenAiResponseInputTextContent,
  OpenAiResponseInputImageContent,
  OpenAiResponseInputAudioContent,
  OpenAiResponseInputContent,
  OpenAiResponseInputMessage,
  OpenAiResponseFunctionCallOutput,
  OpenAiResponseItemReference,
  OpenAiResponseInputItem,
  OpenAiResponseFunctionTool,
  OpenAiResponseWebSearchTool,
  OpenAiResponseFileSearchTool,
  OpenAiResponseCodeInterpreterTool,
  OpenAiResponseTool,
  OpenAiResponseTextFormat,
  OpenAiResponseReasoning,
  OpenAiResponseRequest,
  OpenAiResponseCompactRequest,
  OpenAiResponseInputTokensRequest,
  OpenAiFineTuningHyperparameters,
  OpenAiFineTuningSupervisedHyperparameters,
  OpenAiFineTuningSupervisedMethod,
  OpenAiFineTuningDpoHyperparameters,
  OpenAiFineTuningDpoMethod,
  OpenAiFineTuningReinforcementHyperparameters,
  OpenAiFineTuningReinforcementMethod,
  OpenAiFineTuningMethod,
  OpenAiFineTuningWandbConfig,
  OpenAiFineTuningIntegration,
  OpenAiFineTuningJobCreateRequest,
  OpenAiCheckpointPermissionCreateRequest,
} from "./zod";

// ---------------------------------------------------------------------------
// Response types (hand-written — not schema-ified yet)
// ---------------------------------------------------------------------------

// Tool call in response
export interface OpenAiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Usage info (raw API shape)
export interface OpenAiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Transcription response
export interface OpenAiTranscribeResponse {
  text: string;
}

// Translation response
export interface OpenAiTranslateResponse {
  text: string;
}

// Chat response (raw API shape)
export interface OpenAiChatChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: OpenAiToolCall[];
  };
  finish_reason: string;
}

export interface OpenAiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAiChatChoice[];
  usage?: OpenAiUsage;
  metadata?: Record<string, string>;
  error?: { message?: string; type?: string };
}

// --- Stored Chat Completions API types ---

export interface OpenAiStoredCompletionListOptions {
  after?: string;
  limit?: number;
  order?: "asc" | "desc";
  metadata?: Record<string, string>;
}

export interface OpenAiStoredCompletionListResponse {
  object: "list";
  data: OpenAiChatResponse[];
  has_more: boolean;
  first_id: string;
  last_id: string;
}

export interface OpenAiStoredCompletionDeleteResponse {
  id: string;
  object: "chat.completion.deleted";
  deleted: true;
}

export interface OpenAiStoredCompletionMessage {
  id: string;
  role: string;
  content: string | null;
  refusal?: string | null;
  function_call?: Record<string, unknown> | null;
  tool_calls?: OpenAiToolCall[] | null;
}

export interface OpenAiStoredCompletionMessageListOptions {
  after?: string;
  limit?: number;
  order?: "asc" | "desc";
}

export interface OpenAiStoredCompletionMessageListResponse {
  object: "list";
  data: OpenAiStoredCompletionMessage[];
  has_more: boolean;
  first_id: string;
  last_id: string;
}

// Embeddings response
export interface OpenAiEmbeddingData {
  object: "embedding";
  index: number;
  embedding: number[];
}

export interface OpenAiEmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface OpenAiEmbeddingResponse {
  object: "list";
  data: OpenAiEmbeddingData[];
  model: string;
  usage: OpenAiEmbeddingUsage;
}

// Image edit response
export interface OpenAiImageData {
  b64_json?: string | null;
  revised_prompt?: string | null;
  url?: string | null;
}

export interface OpenAiImageEditUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_details?: {
    image_tokens: number;
    text_tokens: number;
  };
  output_tokens_details?: {
    image_tokens: number;
    text_tokens: number;
  };
}

export interface OpenAiImageEditResponse {
  created: number;
  data?: OpenAiImageData[];
  background?: "transparent" | "opaque" | null;
  output_format?: "png" | "webp" | "jpeg" | null;
  quality?: "low" | "medium" | "high" | null;
  size?: string | null;
  usage?: OpenAiImageEditUsage | null;
}

// Image generation response
export interface OpenAiGeneratedImage {
  b64_json?: string;
  url?: string;
  revised_prompt?: string;
}

export interface OpenAiImageGenerationUsage {
  input_tokens: number;
  input_tokens_details: {
    image_tokens: number;
    text_tokens: number;
  };
  output_tokens: number;
  total_tokens: number;
}

export interface OpenAiImageGenerationResponse {
  created: number;
  data: OpenAiGeneratedImage[];
  usage?: OpenAiImageGenerationUsage;
}

// --- Responses API output types ---

export interface OpenAiResponseAnnotation {
  type: "url_citation" | "file_citation" | "file_path";
  start_index: number;
  end_index: number;
  url?: string;
  title?: string;
  file_id?: string;
  filename?: string;
}

export interface OpenAiResponseOutputText {
  type: "output_text";
  text: string;
  annotations?: OpenAiResponseAnnotation[];
}

export interface OpenAiResponseRefusal {
  type: "refusal";
  refusal: string;
}

export type OpenAiResponseOutputContent =
  | OpenAiResponseOutputText
  | OpenAiResponseRefusal;

export interface OpenAiResponseOutputMessage {
  type: "message";
  id: string;
  role: "assistant";
  content: OpenAiResponseOutputContent[];
  status: "in_progress" | "completed" | "incomplete";
}

export interface OpenAiResponseFunctionCallItem {
  type: "function_call";
  id: string;
  call_id: string;
  name: string;
  arguments: string;
  status: "in_progress" | "completed" | "incomplete";
}

export interface OpenAiResponseWebSearchCallItem {
  type: "web_search_call";
  id: string;
  status: "completed";
}

export interface OpenAiResponseFileSearchCallItem {
  type: "file_search_call";
  id: string;
  status: "completed";
  results?: OpenAiResponseFileSearchResult[];
}

export interface OpenAiResponseFileSearchResult {
  file_id: string;
  filename: string;
  score: number;
  text: string;
}

export type OpenAiResponseOutputItem =
  | OpenAiResponseOutputMessage
  | OpenAiResponseFunctionCallItem
  | OpenAiResponseWebSearchCallItem
  | OpenAiResponseFileSearchCallItem;

// Responses API usage
export interface OpenAiResponseUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_details?: {
    cached_tokens: number;
  };
  output_tokens_details?: {
    reasoning_tokens: number;
  };
}

// Responses API delete response
export interface OpenAiResponseDeleteResponse {
  id: string;
  object: "response.deleted";
  deleted: true;
}

// Responses API GET options
export interface OpenAiResponseGetOptions {
  include?: string[];
  stream?: boolean;
}

// Responses API response
export interface OpenAiResponseResponse {
  id: string;
  object: "response";
  created_at: number;
  status:
    | "completed"
    | "failed"
    | "in_progress"
    | "incomplete"
    | "cancelled"
    | "queued";
  model: string;
  output: OpenAiResponseOutputItem[];
  usage?: OpenAiResponseUsage;
  error?: {
    code: string;
    message: string;
  } | null;
  incomplete_details?: {
    reason: string;
  } | null;
  instructions?: string | null;
  metadata?: Record<string, string>;
  temperature?: number | null;
  top_p?: number | null;
  max_output_tokens?: number | null;
  previous_response_id?: string | null;
}

// Responses API input_items list options
export interface OpenAiResponseInputItemsOptions {
  after?: string;
  limit?: number;
  order?: "asc" | "desc";
  include?: string[];
}

// Responses API input_items list response
import type { OpenAiResponseInputItem } from "./zod";

export interface OpenAiResponseInputItemsResponse {
  object: "list";
  data: (OpenAiResponseInputItem | OpenAiResponseOutputItem)[];
  first_id: string;
  last_id: string;
  has_more: boolean;
}

// Responses API compact response
export interface OpenAiResponseCompactResponse {
  id: string;
  object: "response.compaction";
  created_at: number;
  output: (OpenAiResponseInputItem | OpenAiResponseOutputItem)[];
  usage?: OpenAiResponseUsage;
}

// Responses API input_tokens response
export interface OpenAiResponseInputTokensResponse {
  object: "response.input_tokens";
  input_tokens: number;
}

// --- Fine-Tuning API response types ---

export interface OpenAiFineTuningJobError {
  code: string;
  message: string;
  param: string | null;
}

import type {
  OpenAiFineTuningHyperparameters,
  OpenAiFineTuningMethod,
  OpenAiFineTuningIntegration,
} from "./zod";

export interface OpenAiFineTuningJob {
  id: string;
  object: "fine_tuning.job";
  created_at: number;
  error: OpenAiFineTuningJobError | null;
  fine_tuned_model: string | null;
  finished_at: number | null;
  hyperparameters: OpenAiFineTuningHyperparameters;
  model: string;
  organization_id: string;
  result_files: string[];
  seed: number;
  status:
    | "validating_files"
    | "queued"
    | "running"
    | "succeeded"
    | "failed"
    | "cancelled";
  trained_tokens: number | null;
  training_file: string;
  validation_file: string | null;
  estimated_finish: number | null;
  integrations: OpenAiFineTuningIntegration[] | null;
  metadata: Record<string, string> | null;
  method: OpenAiFineTuningMethod | null;
}

export interface OpenAiFineTuningJobListOptions {
  after?: string;
  limit?: number;
  metadata?: Record<string, string>;
}

export interface OpenAiFineTuningJobListResponse {
  object: "list";
  data: OpenAiFineTuningJob[];
  has_more: boolean;
}

export interface OpenAiFineTuningJobEvent {
  id: string;
  object: "fine_tuning.job.event";
  created_at: number;
  level: "info" | "warn" | "error";
  message: string;
  data: Record<string, unknown> | null;
  type: "message" | "metrics" | null;
}

export interface OpenAiFineTuningJobEventListOptions {
  after?: string;
  limit?: number;
}

export interface OpenAiFineTuningJobEventListResponse {
  object: "list";
  data: OpenAiFineTuningJobEvent[];
  has_more: boolean;
}

export interface OpenAiFineTuningCheckpointMetrics {
  full_valid_loss?: number | null;
  full_valid_mean_token_accuracy?: number | null;
  step?: number | null;
  train_loss?: number | null;
  train_mean_token_accuracy?: number | null;
  valid_loss?: number | null;
  valid_mean_token_accuracy?: number | null;
}

export interface OpenAiFineTuningJobCheckpoint {
  id: string;
  object: "fine_tuning.job.checkpoint";
  created_at: number;
  fine_tuned_model_checkpoint: string;
  fine_tuning_job_id: string;
  metrics: OpenAiFineTuningCheckpointMetrics;
  step_number: number;
}

export interface OpenAiFineTuningJobCheckpointListOptions {
  after?: string;
  limit?: number;
}

export interface OpenAiFineTuningJobCheckpointListResponse {
  object: "list";
  data: OpenAiFineTuningJobCheckpoint[];
  has_more: boolean;
}

export interface OpenAiCheckpointPermission {
  id: string;
  object: "checkpoint.permission";
  created_at: number;
  project_id: string;
}

export interface OpenAiCheckpointPermissionCreateResponse {
  object: "list";
  data: OpenAiCheckpointPermission[];
}

export interface OpenAiCheckpointPermissionListOptions {
  after?: string;
  limit?: number;
  order?: "ascending" | "descending";
  project_id?: string;
}

export interface OpenAiCheckpointPermissionListResponse {
  object: "list";
  data: OpenAiCheckpointPermission[];
  has_more: boolean;
  first_id: string | null;
  last_id: string | null;
}

export interface OpenAiCheckpointPermissionDeleteResponse {
  id: string;
  object: "checkpoint.permission";
  deleted: boolean;
}

// --- Moderation response types ---

export interface OpenAiModerationCategories {
  harassment: boolean;
  "harassment/threatening": boolean;
  hate: boolean;
  "hate/threatening": boolean;
  illicit: boolean | null;
  "illicit/violent": boolean | null;
  "self-harm": boolean;
  "self-harm/instructions": boolean;
  "self-harm/intent": boolean;
  sexual: boolean;
  "sexual/minors": boolean;
  violence: boolean;
  "violence/graphic": boolean;
}

export interface OpenAiModerationCategoryScores {
  harassment: number;
  "harassment/threatening": number;
  hate: number;
  "hate/threatening": number;
  illicit: number;
  "illicit/violent": number;
  "self-harm": number;
  "self-harm/instructions": number;
  "self-harm/intent": number;
  sexual: number;
  "sexual/minors": number;
  violence: number;
  "violence/graphic": number;
}

export interface OpenAiModerationCategoryAppliedInputTypes {
  harassment: ("text" | "image")[];
  "harassment/threatening": ("text" | "image")[];
  hate: ("text" | "image")[];
  "hate/threatening": ("text" | "image")[];
  illicit: ("text" | "image")[];
  "illicit/violent": ("text" | "image")[];
  "self-harm": ("text" | "image")[];
  "self-harm/instructions": ("text" | "image")[];
  "self-harm/intent": ("text" | "image")[];
  sexual: ("text" | "image")[];
  "sexual/minors": ("text" | "image")[];
  violence: ("text" | "image")[];
  "violence/graphic": ("text" | "image")[];
}

export interface OpenAiModerationResult {
  flagged: boolean;
  categories: OpenAiModerationCategories;
  category_scores: OpenAiModerationCategoryScores;
  category_applied_input_types: OpenAiModerationCategoryAppliedInputTypes;
}

export interface OpenAiModerationResponse {
  id: string;
  model: string;
  results: OpenAiModerationResult[];
}

// --- Batches API response types ---

export interface OpenAiBatchRequestCounts {
  total: number;
  completed: number;
  failed: number;
}

export interface OpenAiBatchError {
  code: string;
  message: string;
  param?: string | null;
  line?: number | null;
}

export interface OpenAiBatchErrors {
  object: "list";
  data: OpenAiBatchError[];
}

export interface OpenAiBatch {
  id: string;
  object: "batch";
  endpoint: string;
  errors?: OpenAiBatchErrors | null;
  input_file_id: string;
  completion_window: string;
  status:
    | "validating"
    | "failed"
    | "in_progress"
    | "finalizing"
    | "completed"
    | "expired"
    | "cancelling"
    | "cancelled";
  output_file_id?: string | null;
  error_file_id?: string | null;
  created_at: number;
  in_progress_at?: number | null;
  expires_at?: number | null;
  finalizing_at?: number | null;
  completed_at?: number | null;
  failed_at?: number | null;
  expired_at?: number | null;
  cancelling_at?: number | null;
  cancelled_at?: number | null;
  request_counts?: OpenAiBatchRequestCounts;
  metadata?: Record<string, string> | null;
}

export interface OpenAiBatchListParams {
  after?: string;
  limit?: number;
}

export interface OpenAiBatchListResponse {
  object: "list";
  data: OpenAiBatch[];
  has_more: boolean;
  first_id?: string;
  last_id?: string;
}

// --- Files API response types ---

export interface OpenAiFile {
  id: string;
  object: "file";
  bytes: number;
  created_at: number;
  expires_at?: number;
  filename: string;
  purpose:
    | "assistants"
    | "assistants_output"
    | "batch"
    | "batch_output"
    | "fine-tune"
    | "fine-tune-results"
    | "vision"
    | "user_data";
  status: "uploaded" | "processed" | "error";
  status_details?: string;
}

export interface OpenAiFileListRequest {
  purpose?: string;
  limit?: number;
  order?: "asc" | "desc";
  after?: string;
}

export interface OpenAiFileListResponse {
  object: "list";
  data: OpenAiFile[];
  first_id: string;
  last_id: string;
  has_more: boolean;
}

export interface OpenAiFileDeleteResponse {
  id: string;
  object: "file";
  deleted: boolean;
}

// --- Models API types ---

export interface OpenAiModel {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

export interface OpenAiModelListResponse {
  object: "list";
  data: OpenAiModel[];
}

export interface OpenAiModelDeleteResponse {
  id: string;
  object: "model";
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// Method interface types (endpoint shapes with .schema)
// ---------------------------------------------------------------------------

// POST /v1/chat/completions (create)
// POST /v1/chat/completions/{id} (update) - overload by arity
import type {
  OpenAiChatRequest,
  OpenAiStoredCompletionUpdateRequest,
  OpenAiSpeechRequest,
  OpenAiTranscribeRequest,
  OpenAiTranslateRequest,
  OpenAiEmbeddingRequest,
  OpenAiImageEditRequest,
  OpenAiImageGenerationRequest,
  OpenAiModerationRequest,
  OpenAiFileUploadRequest,
  OpenAiBatchCreateRequest,
  OpenAiResponseRequest,
  OpenAiResponseCompactRequest,
  OpenAiResponseInputTokensRequest,
  OpenAiFineTuningJobCreateRequest,
  OpenAiCheckpointPermissionCreateRequest,
} from "./zod";

interface OpenAiPostV1ChatCompletionsBase {
  schema: z.ZodType<OpenAiChatRequest>;
}

export interface OpenAiPostV1ChatCompletions extends OpenAiPostV1ChatCompletionsBase {
  (req: OpenAiChatRequest, signal?: AbortSignal): Promise<OpenAiChatResponse>;
  (
    id: string,
    req: OpenAiStoredCompletionUpdateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiChatResponse>;
}

export interface OpenAiPostV1Embeddings {
  (
    req: OpenAiEmbeddingRequest,
    signal?: AbortSignal
  ): Promise<OpenAiEmbeddingResponse>;
  schema: z.ZodType<OpenAiEmbeddingRequest>;
}

export interface OpenAiPostV1AudioSpeech {
  (req: OpenAiSpeechRequest, signal?: AbortSignal): Promise<ArrayBuffer>;
  schema: z.ZodType<OpenAiSpeechRequest>;
}

export interface OpenAiPostV1AudioTranscriptions {
  (
    req: OpenAiTranscribeRequest,
    signal?: AbortSignal
  ): Promise<OpenAiTranscribeResponse>;
  schema: z.ZodType<OpenAiTranscribeRequest>;
}

export interface OpenAiPostV1AudioTranslations {
  (
    req: OpenAiTranslateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiTranslateResponse>;
  schema: z.ZodType<OpenAiTranslateRequest>;
}

export interface OpenAiPostV1ImagesGenerations {
  (
    req: OpenAiImageGenerationRequest,
    signal?: AbortSignal
  ): Promise<OpenAiImageGenerationResponse>;
  schema: z.ZodType<OpenAiImageGenerationRequest>;
}

export interface OpenAiPostV1ImagesEdits {
  (
    req: OpenAiImageEditRequest,
    signal?: AbortSignal
  ): Promise<OpenAiImageEditResponse>;
  schema: z.ZodType<OpenAiImageEditRequest>;
}

export interface OpenAiPostV1Files {
  (req: OpenAiFileUploadRequest, signal?: AbortSignal): Promise<OpenAiFile>;
  schema: z.ZodType<OpenAiFileUploadRequest>;
}

export interface OpenAiPostV1Moderations {
  (
    req: OpenAiModerationRequest,
    signal?: AbortSignal
  ): Promise<OpenAiModerationResponse>;
  schema: z.ZodType<OpenAiModerationRequest>;
}

export interface OpenAiPostV1Responses {
  (
    req: OpenAiResponseRequest,
    signal?: AbortSignal
  ): Promise<OpenAiResponseResponse>;
  schema: z.ZodType<OpenAiResponseRequest>;
}

export interface OpenAiPostV1ResponsesCompact {
  (
    req: OpenAiResponseCompactRequest,
    signal?: AbortSignal
  ): Promise<OpenAiResponseCompactResponse>;
  schema: z.ZodType<OpenAiResponseCompactRequest>;
}

export interface OpenAiPostV1ResponsesInputTokens {
  (
    req: OpenAiResponseInputTokensRequest,
    signal?: AbortSignal
  ): Promise<OpenAiResponseInputTokensResponse>;
  schema: z.ZodType<OpenAiResponseInputTokensRequest>;
}

export interface OpenAiPostV1ResponsesCancel {
  (id: string, signal?: AbortSignal): Promise<OpenAiResponseResponse>;
}

export interface OpenAiPostV1Batches {
  (req: OpenAiBatchCreateRequest, signal?: AbortSignal): Promise<OpenAiBatch>;
  schema: z.ZodType<OpenAiBatchCreateRequest>;
}

export interface OpenAiPostV1BatchesCancel {
  (id: string, signal?: AbortSignal): Promise<OpenAiBatch>;
}

export interface OpenAiPostV1FineTuningJobs {
  (
    req: OpenAiFineTuningJobCreateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiFineTuningJob>;
  schema: z.ZodType<OpenAiFineTuningJobCreateRequest>;
}

export interface OpenAiPostV1FineTuningJobsCancel {
  (id: string, signal?: AbortSignal): Promise<OpenAiFineTuningJob>;
}

export interface OpenAiPostV1FineTuningJobsPause {
  (id: string, signal?: AbortSignal): Promise<OpenAiFineTuningJob>;
}

export interface OpenAiPostV1FineTuningJobsResume {
  (id: string, signal?: AbortSignal): Promise<OpenAiFineTuningJob>;
}

export interface OpenAiPostV1FineTuningCheckpointsPermissions {
  (
    checkpoint: string,
    req: OpenAiCheckpointPermissionCreateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiCheckpointPermissionCreateResponse>;
  schema: z.ZodType<OpenAiCheckpointPermissionCreateRequest>;
}

// Audio namespace for POST v1
export interface OpenAiPostV1AudioNamespace {
  speech: OpenAiPostV1AudioSpeech;
  transcriptions: OpenAiPostV1AudioTranscriptions;
  translations: OpenAiPostV1AudioTranslations;
}

// Chat namespace for POST v1
export interface OpenAiPostV1ChatNamespace {
  completions: OpenAiPostV1ChatCompletions;
}

// Images namespace for POST v1
export interface OpenAiPostV1ImagesNamespace {
  generations: OpenAiPostV1ImagesGenerations;
  edits: OpenAiPostV1ImagesEdits;
}

// Responses namespace for POST v1
export interface OpenAiPostV1ResponsesNamespace {
  (
    req: OpenAiResponseRequest,
    signal?: AbortSignal
  ): Promise<OpenAiResponseResponse>;
  schema: z.ZodType<OpenAiResponseRequest>;
  compact: OpenAiPostV1ResponsesCompact;
  inputTokens: OpenAiPostV1ResponsesInputTokens;
  cancel: OpenAiPostV1ResponsesCancel;
}

// Fine-tuning namespace for POST v1
export interface OpenAiPostV1FineTuningNamespace {
  jobs: OpenAiPostV1FineTuningJobs & {
    cancel: OpenAiPostV1FineTuningJobsCancel;
    pause: OpenAiPostV1FineTuningJobsPause;
    resume: OpenAiPostV1FineTuningJobsResume;
  };
  checkpoints: {
    permissions: OpenAiPostV1FineTuningCheckpointsPermissions;
  };
}

// POST v1 namespace
export interface OpenAiPostV1Namespace {
  chat: OpenAiPostV1ChatNamespace;
  audio: OpenAiPostV1AudioNamespace;
  embeddings: OpenAiPostV1Embeddings;
  files: OpenAiPostV1Files;
  images: OpenAiPostV1ImagesNamespace;
  moderations: OpenAiPostV1Moderations;
  responses: OpenAiPostV1ResponsesNamespace;
  batches: OpenAiPostV1Batches & {
    cancel: OpenAiPostV1BatchesCancel;
  };
  fineTuning: OpenAiPostV1FineTuningNamespace;
}

// --- GET v1 namespace types ---

export interface OpenAiGetV1ChatCompletions {
  (
    opts?: OpenAiStoredCompletionListOptions,
    signal?: AbortSignal
  ): Promise<OpenAiStoredCompletionListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiChatResponse>;
  messages: OpenAiGetV1ChatCompletionsMessages;
}

export interface OpenAiGetV1ChatCompletionsMessages {
  (
    id: string,
    opts?: OpenAiStoredCompletionMessageListOptions,
    signal?: AbortSignal
  ): Promise<OpenAiStoredCompletionMessageListResponse>;
}

export interface OpenAiGetV1Files {
  (
    opts?: OpenAiFileListRequest,
    signal?: AbortSignal
  ): Promise<OpenAiFileListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiFile>;
}

export interface OpenAiGetV1FilesContent {
  (id: string, signal?: AbortSignal): Promise<string>;
}

export interface OpenAiGetV1Models {
  (signal?: AbortSignal): Promise<OpenAiModelListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiModel>;
}

export interface OpenAiGetV1Responses {
  (
    id: string,
    opts?: OpenAiResponseGetOptions,
    signal?: AbortSignal
  ): Promise<OpenAiResponseResponse>;
}

export interface OpenAiGetV1ResponsesInputItems {
  (
    id: string,
    opts?: OpenAiResponseInputItemsOptions,
    signal?: AbortSignal
  ): Promise<OpenAiResponseInputItemsResponse>;
}

export interface OpenAiGetV1Batches {
  (
    opts?: OpenAiBatchListParams,
    signal?: AbortSignal
  ): Promise<OpenAiBatchListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiBatch>;
}

export interface OpenAiGetV1FineTuningJobs {
  (
    opts?: OpenAiFineTuningJobListOptions,
    signal?: AbortSignal
  ): Promise<OpenAiFineTuningJobListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiFineTuningJob>;
}

export interface OpenAiGetV1FineTuningJobsEvents {
  (
    id: string,
    opts?: OpenAiFineTuningJobEventListOptions,
    signal?: AbortSignal
  ): Promise<OpenAiFineTuningJobEventListResponse>;
}

export interface OpenAiGetV1FineTuningJobsCheckpoints {
  (
    id: string,
    opts?: OpenAiFineTuningJobCheckpointListOptions,
    signal?: AbortSignal
  ): Promise<OpenAiFineTuningJobCheckpointListResponse>;
}

export interface OpenAiGetV1FineTuningCheckpointsPermissions {
  (
    checkpoint: string,
    opts?: OpenAiCheckpointPermissionListOptions,
    signal?: AbortSignal
  ): Promise<OpenAiCheckpointPermissionListResponse>;
}

export interface OpenAiGetV1ChatNamespace {
  completions: OpenAiGetV1ChatCompletions;
}

export interface OpenAiGetV1FilesNamespace {
  (
    opts?: OpenAiFileListRequest,
    signal?: AbortSignal
  ): Promise<OpenAiFileListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiFile>;
  content: OpenAiGetV1FilesContent;
}

export interface OpenAiGetV1ModelsNamespace {
  (signal?: AbortSignal): Promise<OpenAiModelListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiModel>;
}

export interface OpenAiGetV1ResponsesNamespace {
  (
    id: string,
    opts?: OpenAiResponseGetOptions,
    signal?: AbortSignal
  ): Promise<OpenAiResponseResponse>;
  inputItems: OpenAiGetV1ResponsesInputItems;
}

export interface OpenAiGetV1BatchesNamespace {
  (
    opts?: OpenAiBatchListParams,
    signal?: AbortSignal
  ): Promise<OpenAiBatchListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiBatch>;
}

export interface OpenAiGetV1FineTuningNamespace {
  jobs: OpenAiGetV1FineTuningJobs & {
    events: OpenAiGetV1FineTuningJobsEvents;
    checkpoints: OpenAiGetV1FineTuningJobsCheckpoints;
  };
  checkpoints: {
    permissions: OpenAiGetV1FineTuningCheckpointsPermissions;
  };
}

export interface OpenAiGetV1Namespace {
  chat: OpenAiGetV1ChatNamespace;
  files: OpenAiGetV1FilesNamespace;
  models: OpenAiGetV1ModelsNamespace;
  responses: OpenAiGetV1ResponsesNamespace;
  batches: OpenAiGetV1BatchesNamespace;
  fineTuning: OpenAiGetV1FineTuningNamespace;
}

// --- DELETE v1 namespace types ---

export interface OpenAiDeleteV1ChatCompletions {
  (
    id: string,
    signal?: AbortSignal
  ): Promise<OpenAiStoredCompletionDeleteResponse>;
}

export interface OpenAiDeleteV1Files {
  (id: string, signal?: AbortSignal): Promise<OpenAiFileDeleteResponse>;
}

export interface OpenAiDeleteV1Models {
  (id: string, signal?: AbortSignal): Promise<OpenAiModelDeleteResponse>;
}

export interface OpenAiDeleteV1Responses {
  (id: string, signal?: AbortSignal): Promise<OpenAiResponseDeleteResponse>;
}

export interface OpenAiDeleteV1FineTuningCheckpointsPermissions {
  (
    checkpoint: string,
    permissionId: string,
    signal?: AbortSignal
  ): Promise<OpenAiCheckpointPermissionDeleteResponse>;
}

export interface OpenAiDeleteV1ChatNamespace {
  completions: OpenAiDeleteV1ChatCompletions;
}

export interface OpenAiDeleteV1FilesNamespace {
  (id: string, signal?: AbortSignal): Promise<OpenAiFileDeleteResponse>;
}

export interface OpenAiDeleteV1ModelsNamespace {
  (id: string, signal?: AbortSignal): Promise<OpenAiModelDeleteResponse>;
}

export interface OpenAiDeleteV1ResponsesNamespace {
  (id: string, signal?: AbortSignal): Promise<OpenAiResponseDeleteResponse>;
}

export interface OpenAiDeleteV1FineTuningNamespace {
  checkpoints: {
    permissions: OpenAiDeleteV1FineTuningCheckpointsPermissions;
  };
}

export interface OpenAiDeleteV1Namespace {
  chat: OpenAiDeleteV1ChatNamespace;
  files: OpenAiDeleteV1FilesNamespace;
  models: OpenAiDeleteV1ModelsNamespace;
  responses: OpenAiDeleteV1ResponsesNamespace;
  fineTuning: OpenAiDeleteV1FineTuningNamespace;
}

// --- Provider interface ---

export interface OpenAiProvider {
  post: { v1: OpenAiPostV1Namespace };
  get: { v1: OpenAiGetV1Namespace };
  delete: { v1: OpenAiDeleteV1Namespace };
}

// Error class
export class OpenAiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "OpenAiError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}
