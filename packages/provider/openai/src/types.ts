import type { z } from "zod";
import type {
  ChatChoice,
  ChatToolCall,
  ChatUsage,
} from "./chat-fragments-types";
import type { OpenAiUploadCreateRequest, OpenAiResponseReasoning } from "./zod";

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
  OpenAiChatRequestInput,
  OpenAiChatParsedRequest,
  OpenAiStoredCompletionUpdateRequest,
  OpenAiStoredCompletionUpdateRequestInput,
  OpenAiStoredCompletionUpdateParsedRequest,
  OpenAiCompletionRequest,
  OpenAiCompletionRequestInput,
  OpenAiCompletionParsedRequest,
  OpenAiSpeechRequest,
  OpenAiSpeechRequestInput,
  OpenAiSpeechParsedRequest,
  OpenAiTranscribeRequest,
  OpenAiTranscribeRequestInput,
  OpenAiTranscribeParsedRequest,
  OpenAiTranslateRequest,
  OpenAiTranslateRequestInput,
  OpenAiTranslateParsedRequest,
  OpenAiEmbeddingRequest,
  OpenAiEmbeddingRequestInput,
  OpenAiEmbeddingParsedRequest,
  OpenAiImageEditRequest,
  OpenAiImageEditRequestInput,
  OpenAiImageEditParsedRequest,
  OpenAiImageGenerationRequest,
  OpenAiImageGenerationRequestInput,
  OpenAiImageGenerationParsedRequest,
  OpenAiImageVariationRequest,
  OpenAiImageVariationRequestInput,
  OpenAiImageVariationParsedRequest,
  OpenAiModerationTextInput,
  OpenAiModerationImageUrlInput,
  OpenAiModerationMultiModalInput,
  OpenAiModerationRequest,
  OpenAiModerationRequestInput,
  OpenAiModerationParsedRequest,
  OpenAiFileUploadRequest,
  OpenAiFileUploadRequestInput,
  OpenAiFileUploadParsedRequest,
  OpenAiContainerMemoryLimit,
  OpenAiContainerNetworkPolicyDomainSecret,
  OpenAiContainerNetworkPolicyDisabled,
  OpenAiContainerNetworkPolicyAllowlist,
  OpenAiContainerNetworkPolicy,
  OpenAiContainerSkillReference,
  OpenAiContainerInlineSkillSource,
  OpenAiContainerInlineSkill,
  OpenAiContainerSkill,
  OpenAiContainerCreateRequest,
  OpenAiContainerCreateRequestInput,
  OpenAiContainerCreateParsedRequest,
  OpenAiUploadCreateRequest,
  OpenAiUploadCreateRequestInput,
  OpenAiUploadCreateParsedRequest,
  OpenAiBatchCreateRequest,
  OpenAiBatchCreateRequestInput,
  OpenAiBatchCreateParsedRequest,
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
  OpenAiResponseRequestInput,
  OpenAiResponseParsedRequest,
  OpenAiResponseCompactRequest,
  OpenAiResponseCompactRequestInput,
  OpenAiResponseCompactParsedRequest,
  OpenAiResponseInputTokensRequest,
  OpenAiResponseInputTokensRequestInput,
  OpenAiResponseInputTokensParsedRequest,
  OpenAiEvalCustomDataSourceConfig,
  OpenAiEvalLogsDataSourceConfig,
  OpenAiEvalStoredCompletionsDataSourceConfig,
  OpenAiEvalDataSourceConfig,
  OpenAiEvalOutputTextContent,
  OpenAiEvalInputImageContent,
  OpenAiEvalInputAudioContent,
  OpenAiEvalMessageContentPart,
  OpenAiEvalMessageContent,
  OpenAiEvalSimpleInputMessage,
  OpenAiEvalMessageObject,
  OpenAiEvalInputMessage,
  OpenAiEvalLabelModelGrader,
  OpenAiEvalStringCheckGrader,
  OpenAiEvalTextSimilarityGrader,
  OpenAiEvalPythonGrader,
  OpenAiEvalScoreModelGrader,
  OpenAiEvalGrader,
  OpenAiEvalCreateRequest,
  OpenAiEvalCreateRequestInput,
  OpenAiEvalCreateParsedRequest,
  OpenAiConversationCreateRequest,
  OpenAiConversationCreateRequestInput,
  OpenAiConversationCreateParsedRequest,
  OpenAiRealtimeAudioFormat,
  OpenAiRealtimeNoiseReduction,
  OpenAiRealtimeAudioTranscription,
  OpenAiRealtimeServerVad,
  OpenAiRealtimeSemanticVad,
  OpenAiRealtimeTurnDetection,
  OpenAiRealtimeAudioInput,
  OpenAiRealtimeVoice,
  OpenAiRealtimeAudioOutput,
  OpenAiRealtimeAudioConfig,
  OpenAiRealtimePrompt,
  OpenAiRealtimeReasoning,
  OpenAiRealtimeToolChoice,
  OpenAiRealtimeFunctionTool,
  OpenAiRealtimeMcpTool,
  OpenAiRealtimeTool,
  OpenAiRealtimeTracing,
  OpenAiRealtimeTruncation,
  OpenAiRealtimeSessionCreateRequest,
  OpenAiRealtimeSessionCreateParsedRequest,
  OpenAiRealtimeTranscriptionSessionCreateRequest,
  OpenAiRealtimeTranscriptionSessionCreateParsedRequest,
  OpenAiRealtimeClientSecretRequest,
  OpenAiRealtimeClientSecretRequestInput,
  OpenAiRealtimeClientSecretParsedRequest,
  OpenAiVectorStoreExpirationPolicy,
  OpenAiVectorStoreAutoChunkingStrategy,
  OpenAiVectorStoreStaticChunkingStrategy,
  OpenAiVectorStoreChunkingStrategy,
  OpenAiVectorStoreCreateRequest,
  OpenAiVectorStoreCreateRequestInput,
  OpenAiVectorStoreCreateParsedRequest,
  OpenAiVectorStoreSearchComparisonFilter,
  OpenAiVectorStoreSearchCompoundFilter,
  OpenAiVectorStoreSearchFilter,
  OpenAiVectorStoreSearchRankingOptions,
  OpenAiVectorStoreSearchRequest,
  OpenAiVectorStoreSearchRequestInput,
  OpenAiVectorStoreSearchParsedRequest,
  OpenAiVectorStoreFileAttributes,
  OpenAiVectorStoreFileCreateRequest,
  OpenAiVectorStoreFileCreateRequestInput,
  OpenAiVectorStoreFileCreateParsedRequest,
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
  OpenAiFineTuningJobCreateRequestInput,
  OpenAiFineTuningJobCreateParsedRequest,
  OpenAiCheckpointPermissionCreateRequest,
  OpenAiCheckpointPermissionCreateRequestInput,
  OpenAiCheckpointPermissionCreateParsedRequest,
  OpenAiOrganizationUsageQuery,
  OpenAiOrganizationCostsQuery,
  OpenAiOrganizationProjectListQuery,
  OpenAiOrganizationProjectRateLimitListQuery,
} from "./zod";

// ---------------------------------------------------------------------------
// Response types (hand-written — not schema-ified yet)
// ---------------------------------------------------------------------------

// Empty extensions preserve provider-specific public interface names.
/* eslint-disable @typescript-eslint/no-empty-object-type */

// Tool call in response
export interface OpenAiToolCall extends ChatToolCall {}

// Usage info (raw API shape)
export interface OpenAiUsage extends ChatUsage {}

// Transcription response
export interface OpenAiTranscribeResponse {
  text: string;
}

// Translation response
export interface OpenAiTranslateResponse {
  text: string;
}

// Chat response (raw API shape)
export interface OpenAiChatChoice extends ChatChoice {}

/* eslint-enable @typescript-eslint/no-empty-object-type */

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

export interface OpenAiCompletionLogprobs {
  text_offset?: number[];
  token_logprobs?: Array<number | null>;
  tokens?: string[];
  top_logprobs?: Array<Record<string, number> | null>;
}

export interface OpenAiCompletionChoice {
  finish_reason: "stop" | "length" | "content_filter" | null;
  index: number;
  logprobs: OpenAiCompletionLogprobs | null;
  text: string;
}

export interface OpenAiCompletionTokensDetails {
  accepted_prediction_tokens?: number;
  audio_tokens?: number;
  reasoning_tokens?: number;
  rejected_prediction_tokens?: number;
}

export interface OpenAiCompletionPromptTokensDetails {
  audio_tokens?: number;
  cached_tokens?: number;
}

export interface OpenAiCompletionUsage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
  completion_tokens_details?: OpenAiCompletionTokensDetails;
  prompt_tokens_details?: OpenAiCompletionPromptTokensDetails;
}

export interface OpenAiCompletionResponse {
  id: string;
  object: "text_completion";
  created: number;
  model: string;
  choices: OpenAiCompletionChoice[];
  system_fingerprint?: string;
  usage?: OpenAiCompletionUsage;
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
  reasoning?: OpenAiResponseReasoning | null;
}

// Responses API input_items list options
export interface OpenAiResponseInputItemsOptions {
  after?: string;
  limit?: number;
  order?: "asc" | "desc";
  include?: string[];
}

// Responses API input_items list response
import type { OpenAiEvalGrader, OpenAiResponseInputItem } from "./zod";

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

// --- Evals API response types ---

export interface OpenAiEvalResolvedCustomDataSourceConfig {
  type: "custom";
  schema: Record<string, unknown>;
}

export interface OpenAiEvalResolvedLogsDataSourceConfig {
  type: "logs";
  schema: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface OpenAiEvalResolvedStoredCompletionsDataSourceConfig {
  type: "stored_completions";
  schema: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type OpenAiEvalResolvedDataSourceConfig =
  | OpenAiEvalResolvedCustomDataSourceConfig
  | OpenAiEvalResolvedLogsDataSourceConfig
  | OpenAiEvalResolvedStoredCompletionsDataSourceConfig;

export type OpenAiEvalTestingCriterion = OpenAiEvalGrader & {
  id?: string;
};

export interface OpenAiEval {
  id: string;
  object: "eval";
  created_at: number;
  data_source_config: OpenAiEvalResolvedDataSourceConfig;
  testing_criteria: OpenAiEvalTestingCriterion[];
  metadata: Record<string, string>;
  name: string;
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

export interface OpenAiUpload {
  id: string;
  object?: "upload";
  bytes: number;
  created_at: number;
  expires_at: number;
  filename: string;
  purpose: string;
  status: "pending" | "completed" | "cancelled" | "expired";
  file?: OpenAiFile;
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

export interface OpenAiContainerExpiresAfter {
  anchor?: "last_active_at";
  minutes?: number;
}

export interface OpenAiContainerResponseNetworkPolicy {
  type: "allowlist" | "disabled";
  allowed_domains?: string[];
}

export interface OpenAiContainer {
  id: string;
  created_at: number;
  name: string;
  object: "container";
  status: string;
  expires_after?: OpenAiContainerExpiresAfter;
  last_active_at?: number;
  memory_limit?: OpenAiContainerMemoryLimit;
  network_policy?: OpenAiContainerResponseNetworkPolicy;
}

// --- Vector Stores API response types ---

export interface OpenAiVectorStoreFileCounts {
  cancelled: number;
  completed: number;
  failed: number;
  in_progress: number;
  total: number;
}

export interface OpenAiVectorStore {
  id: string;
  object: "vector_store";
  created_at: number;
  name: string | null;
  description?: string | null;
  file_counts: OpenAiVectorStoreFileCounts;
  status: "expired" | "in_progress" | "completed";
  usage_bytes: number;
  bytes?: number;
  last_active_at?: number | null;
  metadata: Record<string, string>;
  expires_after?: OpenAiVectorStoreExpirationPolicy | null;
  expires_at?: number | null;
}

export interface OpenAiVectorStoreListRequest {
  limit?: number;
  order?: "asc" | "desc";
  after?: string;
  before?: string;
}

export interface OpenAiVectorStoreListResponse {
  object: "list";
  data: OpenAiVectorStore[];
  first_id: string;
  last_id: string;
  has_more: boolean;
}

export interface OpenAiVectorStoreSearchResultContentBlock {
  type: "text";
  text: string;
}

export interface OpenAiVectorStoreSearchResult {
  file_id: string;
  filename: string;
  score: number;
  attributes: Record<string, string | number | boolean> | null;
  content: OpenAiVectorStoreSearchResultContentBlock[];
}

export interface OpenAiVectorStoreSearchResponse {
  object: "vector_store.search_results.page";
  search_query: string[];
  data: OpenAiVectorStoreSearchResult[];
  has_more: boolean;
  next_page: string | null;
}

export interface OpenAiVectorStoreFileLastError {
  code: string;
  message: string;
}

export interface OpenAiVectorStoreFile {
  id: string;
  object: "vector_store.file";
  created_at: number;
  usage_bytes: number;
  vector_store_id: string;
  status: "in_progress" | "completed" | "cancelled" | "failed";
  last_error: OpenAiVectorStoreFileLastError | null;
  chunking_strategy?: OpenAiVectorStoreChunkingStrategy;
  attributes?: Record<string, string | number | boolean> | null;
}

export interface OpenAiVectorStoreFileListRequest {
  limit?: number;
  order?: "asc" | "desc";
  after?: string;
  before?: string;
  filter?: "in_progress" | "completed" | "failed" | "cancelled";
}

export interface OpenAiVectorStoreFileListResponse {
  object: "list";
  data: OpenAiVectorStoreFile[];
  first_id: string | null;
  last_id: string | null;
  has_more: boolean;
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

// --- Organization usage / costs / limits API types ---

export interface OpenAiOrganizationUsageResult {
  object: string;
  input_tokens?: number;
  output_tokens?: number;
  input_cached_tokens?: number;
  input_audio_tokens?: number;
  output_audio_tokens?: number;
  num_model_requests?: number;
  images?: number;
  num_seconds?: number;
  usage_bytes?: number;
  num_sessions?: number;
  project_id?: string | null;
  user_id?: string | null;
  api_key_id?: string | null;
  model?: string | null;
  batch?: boolean | null;
  service_tier?: string | null;
  size?: string | null;
  source?: string | null;
}

export interface OpenAiOrganizationUsageBucket {
  object: "bucket";
  start_time: number;
  end_time: number;
  results: OpenAiOrganizationUsageResult[];
}

export interface OpenAiOrganizationUsageResponse {
  object: "page";
  data: OpenAiOrganizationUsageBucket[];
  has_more: boolean;
  next_page: string | null;
}

// ---------------------------------------------------------------------------
// Codex usage (ChatGPT-plan rate limits) — GET /backend-api/wham/usage
// Undocumented internal endpoint the Codex CLI calls to render `/status`.
// `rate_limit.primary_window` is the rolling 5h window, `secondary_window`
// the weekly (1w) window; `used_percent` on each is the percentage consumed.
// ---------------------------------------------------------------------------

export interface OpenAiCodexUsageWindow {
  /** Percentage of this window's allowance consumed (0–100). */
  used_percent: number;
  /** Length of the rolling window in seconds (e.g. 18000 = 5h, 604800 = 1w). */
  limit_window_seconds?: number;
  /** Seconds until this window resets. */
  reset_after_seconds?: number;
  /** Unix-epoch time (seconds) at which this window resets. */
  reset_at?: number;
}

export interface OpenAiCodexRateLimit {
  allowed?: boolean;
  limit_reached?: boolean;
  /** Rolling 5-hour usage window. */
  primary_window?: OpenAiCodexUsageWindow | null;
  /** Weekly (1w) usage window. */
  secondary_window?: OpenAiCodexUsageWindow | null;
}

export interface OpenAiCodexAdditionalRateLimit {
  limit_name?: string;
  metered_feature?: string;
  rate_limit?: OpenAiCodexRateLimit | null;
}

export interface OpenAiCodexCredits {
  has_credits?: boolean;
  unlimited?: boolean;
  /** Remaining credit balance, serialized as a string (e.g. "9.99"). */
  balance?: string | null;
  approx_local_messages?: unknown[];
  approx_cloud_messages?: unknown[];
}

export interface OpenAiCodexRateLimitReachedType {
  type?: string;
}

export interface OpenAiCodexRateLimitResetCredits {
  available_count?: number;
}

export interface OpenAiCodexUsageResponse {
  /** ChatGPT plan tier (e.g. "free", "plus", "pro", "team", "enterprise"). */
  plan_type?: string;
  /** Primary Codex rate limit (5h + 1w windows). */
  rate_limit?: OpenAiCodexRateLimit | null;
  /** Extra metered limits (e.g. code review), each with its own windows. */
  additional_rate_limits?: OpenAiCodexAdditionalRateLimit[];
  credits?: OpenAiCodexCredits | null;
  rate_limit_reached_type?: OpenAiCodexRateLimitReachedType | null;
  rate_limit_reset_credits?: OpenAiCodexRateLimitResetCredits | null;
}

export interface OpenAiOrganizationCostAmount {
  value: number;
  currency: string;
}

export interface OpenAiOrganizationCostsResult {
  object: "organization.costs.result";
  amount: OpenAiOrganizationCostAmount;
  line_item: string | null;
  project_id: string | null;
}

export interface OpenAiOrganizationCostsBucket {
  object: "bucket";
  start_time: number;
  end_time: number;
  results: OpenAiOrganizationCostsResult[];
}

export interface OpenAiOrganizationCostsResponse {
  object: "page";
  data: OpenAiOrganizationCostsBucket[];
  has_more: boolean;
  next_page: string | null;
}

export interface OpenAiOrganizationProject {
  id: string;
  object: "organization.project";
  name: string;
  created_at: number;
  archived_at?: number | null;
  status?: string;
}

export interface OpenAiOrganizationProjectListResponse {
  object: "list";
  data: OpenAiOrganizationProject[];
  first_id?: string | null;
  last_id?: string | null;
  has_more: boolean;
}

export interface OpenAiProjectRateLimit {
  object: "project.rate_limit";
  id: string;
  model: string;
  max_requests_per_1_minute?: number;
  max_tokens_per_1_minute?: number;
  max_images_per_1_minute?: number;
  max_audio_megabytes_per_1_minute?: number;
  max_requests_per_1_day?: number;
  batch_1_day_max_input_tokens?: number;
}

export interface OpenAiProjectRateLimitListResponse {
  object: "list";
  data: OpenAiProjectRateLimit[];
  first_id?: string | null;
  last_id?: string | null;
  has_more: boolean;
}

// Conversations — durable, replayable threads for multi-step agents.
export interface OpenAiConversation {
  id: string;
  object: "conversation";
  created_at: number;
  metadata: Record<string, string> | null;
}

export interface OpenAiConversationRetrieveRequest {
  conversationId: string;
}

export type OpenAiConversationRetrieveResponse = OpenAiConversation;

export interface OpenAiRealtimeSessionResponse {
  id: string;
  object: "realtime.session";
  type: "realtime";
  audio?: Record<string, unknown> | null;
  client_secret?: Record<string, unknown> | null;
  expires_at?: number;
  include?: string[] | null;
  instructions?: string;
  max_output_tokens?: number | "inf";
  model?: string;
  output_modalities?: string[];
  prompt?: Record<string, unknown> | null;
  tracing?: "auto" | Record<string, unknown> | null;
  truncation?: string | Record<string, unknown>;
}

export interface OpenAiRealtimeTranscriptionSessionResponse {
  id: string;
  object: "realtime.transcription_session";
  type: "transcription";
  audio?: Record<string, unknown> | null;
  expires_at?: number;
  include?: string[] | null;
}

export interface OpenAiRealtimeClientSecretResponse {
  value: string;
  expires_at: number;
  session:
    | OpenAiRealtimeSessionResponse
    | OpenAiRealtimeTranscriptionSessionResponse;
}

// ---------------------------------------------------------------------------
// Method interface types (endpoint shapes with .schema)
// ---------------------------------------------------------------------------

// POST /v1/chat/completions (create)
// POST /v1/chat/completions/{id} (update) - overload by arity
import type {
  OpenAiChatRequest,
  OpenAiStoredCompletionUpdateRequest,
  OpenAiCompletionRequest,
  OpenAiSpeechRequest,
  OpenAiTranscribeRequest,
  OpenAiTranslateRequest,
  OpenAiEmbeddingRequest,
  OpenAiImageEditRequest,
  OpenAiImageGenerationRequest,
  OpenAiImageVariationRequest,
  OpenAiModerationRequest,
  OpenAiFileUploadRequest,
  OpenAiContainerMemoryLimit,
  OpenAiContainerCreateRequest,
  OpenAiBatchCreateRequest,
  OpenAiResponseRequest,
  OpenAiResponseCompactRequest,
  OpenAiResponseInputTokensRequest,
  OpenAiEvalCreateRequest,
  OpenAiConversationCreateRequest,
  OpenAiRealtimeClientSecretRequest,
  OpenAiVectorStoreExpirationPolicy,
  OpenAiVectorStoreChunkingStrategy,
  OpenAiVectorStoreCreateRequest,
  OpenAiVectorStoreSearchRequest,
  OpenAiVectorStoreFileCreateRequest,
  OpenAiFineTuningJobCreateRequest,
  OpenAiCheckpointPermissionCreateRequest,
  OpenAiOrganizationUsageQuery,
  OpenAiOrganizationCostsQuery,
  OpenAiOrganizationProjectListQuery,
  OpenAiOrganizationProjectRateLimitListQuery,
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

export interface OpenAiPostV1Completions {
  (
    req: OpenAiCompletionRequest,
    signal?: AbortSignal
  ): Promise<OpenAiCompletionResponse>;
  schema: z.ZodType<OpenAiCompletionRequest>;
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

export interface OpenAiPostV1ImagesVariations {
  (
    req: OpenAiImageVariationRequest,
    signal?: AbortSignal
  ): Promise<OpenAiImageGenerationResponse>;
  schema: z.ZodType<OpenAiImageVariationRequest>;
}

export interface OpenAiPostV1Files {
  // `filename` is a display name callers may carry alongside the Blob; the
  // runtime derives the multipart filename from the Blob itself, so it is
  // type-only and intentionally absent from the request schema.
  (
    req: OpenAiFileUploadRequest & { filename?: string },
    signal?: AbortSignal
  ): Promise<OpenAiFile>;
  schema: z.ZodType<OpenAiFileUploadRequest>;
}

export interface OpenAiPostV1Containers {
  (
    req: OpenAiContainerCreateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiContainer>;
  schema: z.ZodType<OpenAiContainerCreateRequest>;
}

export interface OpenAiPostV1Uploads {
  (req: OpenAiUploadCreateRequest, signal?: AbortSignal): Promise<OpenAiUpload>;
  schema: z.ZodType<OpenAiUploadCreateRequest>;
}

export interface OpenAiPostV1Moderations {
  (
    req: OpenAiModerationRequest,
    signal?: AbortSignal
  ): Promise<OpenAiModerationResponse>;
  schema: z.ZodType<OpenAiModerationRequest>;
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

export interface OpenAiPostV1Evals {
  (req: OpenAiEvalCreateRequest, signal?: AbortSignal): Promise<OpenAiEval>;
  schema: z.ZodType<OpenAiEvalCreateRequest>;
}

export interface OpenAiPostV1Conversations {
  (
    req: OpenAiConversationCreateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiConversation>;
  schema: z.ZodType<OpenAiConversationCreateRequest>;
}

export interface OpenAiPostV1VectorStoresSearch {
  (
    vectorStoreId: string,
    req: OpenAiVectorStoreSearchRequest,
    signal?: AbortSignal
  ): Promise<OpenAiVectorStoreSearchResponse>;
  schema: z.ZodType<OpenAiVectorStoreSearchRequest>;
}

export interface OpenAiPostV1VectorStoresFiles {
  (
    vectorStoreId: string,
    req: OpenAiVectorStoreFileCreateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiVectorStoreFile>;
  schema: z.ZodType<OpenAiVectorStoreFileCreateRequest>;
}

export interface OpenAiPostV1VectorStores {
  (
    req: OpenAiVectorStoreCreateRequest,
    signal?: AbortSignal
  ): Promise<OpenAiVectorStore>;
  schema: z.ZodType<OpenAiVectorStoreCreateRequest>;
  files: OpenAiPostV1VectorStoresFiles;
  search: OpenAiPostV1VectorStoresSearch;
}

export interface OpenAiPostV1RealtimeClientSecrets {
  (
    req: OpenAiRealtimeClientSecretRequest,
    signal?: AbortSignal
  ): Promise<OpenAiRealtimeClientSecretResponse>;
  schema: z.ZodType<OpenAiRealtimeClientSecretRequest>;
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
  variations: OpenAiPostV1ImagesVariations;
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

// Realtime namespace for POST v1
export interface OpenAiPostV1RealtimeNamespace {
  clientSecrets: OpenAiPostV1RealtimeClientSecrets;
}

// POST v1 namespace
export interface OpenAiPostV1Namespace {
  completions: OpenAiPostV1Completions;
  chat: OpenAiPostV1ChatNamespace;
  audio: OpenAiPostV1AudioNamespace;
  embeddings: OpenAiPostV1Embeddings;
  files: OpenAiPostV1Files;
  containers: OpenAiPostV1Containers;
  uploads: OpenAiPostV1Uploads;
  images: OpenAiPostV1ImagesNamespace;
  moderations: OpenAiPostV1Moderations;
  responses: OpenAiPostV1ResponsesNamespace;
  evals: OpenAiPostV1Evals;
  conversations: OpenAiPostV1Conversations;
  realtime: OpenAiPostV1RealtimeNamespace;
  vectorStores: OpenAiPostV1VectorStores;
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

export interface OpenAiGetV1FilesContent {
  (id: string, signal?: AbortSignal): Promise<string>;
}

export interface OpenAiGetV1ResponsesInputItems {
  (
    id: string,
    opts?: OpenAiResponseInputItemsOptions,
    signal?: AbortSignal
  ): Promise<OpenAiResponseInputItemsResponse>;
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

export interface OpenAiGetV1ConversationsRetrieve {
  (
    conversationId: OpenAiConversationRetrieveRequest["conversationId"],
    signal?: AbortSignal
  ): Promise<OpenAiConversationRetrieveResponse>;
}

export interface OpenAiGetV1ConversationsNamespace {
  retrieve: OpenAiGetV1ConversationsRetrieve;
}

export interface OpenAiGetV1BatchesNamespace {
  (
    opts?: OpenAiBatchListParams,
    signal?: AbortSignal
  ): Promise<OpenAiBatchListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiBatch>;
}

export interface OpenAiGetV1VectorStoresFiles {
  (
    vectorStoreId: string,
    opts?: OpenAiVectorStoreFileListRequest,
    signal?: AbortSignal
  ): Promise<OpenAiVectorStoreFileListResponse>;
}

export interface OpenAiGetV1VectorStoresNamespace {
  (
    opts?: OpenAiVectorStoreListRequest,
    signal?: AbortSignal
  ): Promise<OpenAiVectorStoreListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiVectorStore>;
  files: OpenAiGetV1VectorStoresFiles;
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

export interface OpenAiGetV1OrganizationUsageEndpoint {
  (
    opts: OpenAiOrganizationUsageQuery,
    signal?: AbortSignal
  ): Promise<OpenAiOrganizationUsageResponse>;
  schema: z.ZodType<OpenAiOrganizationUsageQuery>;
}

export interface OpenAiGetV1OrganizationCosts {
  (
    opts: OpenAiOrganizationCostsQuery,
    signal?: AbortSignal
  ): Promise<OpenAiOrganizationCostsResponse>;
  schema: z.ZodType<OpenAiOrganizationCostsQuery>;
}

export interface OpenAiGetV1OrganizationProjects {
  (
    opts?: OpenAiOrganizationProjectListQuery,
    signal?: AbortSignal
  ): Promise<OpenAiOrganizationProjectListResponse>;
  (id: string, signal?: AbortSignal): Promise<OpenAiOrganizationProject>;
  rateLimits: OpenAiGetV1OrganizationProjectRateLimits;
  schema: z.ZodType<OpenAiOrganizationProjectListQuery>;
}

export interface OpenAiGetV1OrganizationProjectRateLimits {
  (
    projectId: string,
    opts?: OpenAiOrganizationProjectRateLimitListQuery,
    signal?: AbortSignal
  ): Promise<OpenAiProjectRateLimitListResponse>;
  schema: z.ZodType<OpenAiOrganizationProjectRateLimitListQuery>;
}

export interface OpenAiGetV1OrganizationNamespace {
  usage: {
    completions: OpenAiGetV1OrganizationUsageEndpoint;
    embeddings: OpenAiGetV1OrganizationUsageEndpoint;
    moderations: OpenAiGetV1OrganizationUsageEndpoint;
    images: OpenAiGetV1OrganizationUsageEndpoint;
    audioSpeeches: OpenAiGetV1OrganizationUsageEndpoint;
    audioTranscriptions: OpenAiGetV1OrganizationUsageEndpoint;
    vectorStores: OpenAiGetV1OrganizationUsageEndpoint;
    codeInterpreterSessions: OpenAiGetV1OrganizationUsageEndpoint;
  };
  costs: OpenAiGetV1OrganizationCosts;
  projects: OpenAiGetV1OrganizationProjects;
}

export interface OpenAiGetV1Namespace {
  chat: OpenAiGetV1ChatNamespace;
  files: OpenAiGetV1FilesNamespace;
  models: OpenAiGetV1ModelsNamespace;
  responses: OpenAiGetV1ResponsesNamespace;
  conversations: OpenAiGetV1ConversationsNamespace;
  batches: OpenAiGetV1BatchesNamespace;
  fineTuning: OpenAiGetV1FineTuningNamespace;
  organization: OpenAiGetV1OrganizationNamespace;
  vectorStores: OpenAiGetV1VectorStoresNamespace;
}

// --- DELETE v1 namespace types ---

export interface OpenAiDeleteV1ChatCompletions {
  (
    id: string,
    signal?: AbortSignal
  ): Promise<OpenAiStoredCompletionDeleteResponse>;
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

export interface OpenAiGetCodexUsage {
  (signal?: AbortSignal): Promise<OpenAiCodexUsageResponse>;
}

export interface OpenAiGetCodexNamespace {
  usage: OpenAiGetCodexUsage;
}

export interface OpenAiProvider {
  post: { v1: OpenAiPostV1Namespace };
  get: { v1: OpenAiGetV1Namespace; codex: OpenAiGetCodexNamespace };
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
