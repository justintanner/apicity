import type { z } from "zod";

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  FireworksChatRequest,
  FireworksCompletionRequest,
  FireworksEmbeddingRequest,
  FireworksRerankRequest,
  AnthropicMessagesRequest,
  FireworksTranscriptionRequest,
  FireworksTranslationRequest,
  FireworksStreamingTranscriptionOptions,
  FireworksAudioBatchTranscriptionRequest,
  FireworksAudioBatchTranslationRequest,
  FireworksTextToImageRequest,
  FireworksKontextRequest,
  FireworksGetResultRequest,
  FireworksCreateModelRequest,
  FireworksUpdateModelRequest,
  FireworksPrepareModelRequest,
  FireworksGetUploadEndpointRequest,
  FireworksValidateUploadRequest,
  FireworksBatchJobCreateRequest,
  FireworksSFTCreateRequest,
  FireworksDpoJobCreateRequest,
  FireworksRFTCreateRequest,
  FireworksRlorTrainerJobCreateRequest,
  FireworksRlorTrainerJobExecuteStepRequest,
  FireworksCreateDeploymentRequest,
  FireworksUpdateDeploymentRequest,
  FireworksScaleDeploymentRequest,
  FireworksCreateDeployedModelRequest,
  FireworksUpdateDeployedModelRequest,
  FireworksCreateDatasetRequest,
  FireworksUpdateDatasetRequest,
  FireworksDatasetGetUploadEndpointRequest,
  FireworksDatasetValidateUploadRequest,
  FireworksCreateUserRequest,
  FireworksUpdateUserRequest,
  FireworksCreateApiKeyRequest,
  FireworksDeleteApiKeyRequest,
  FireworksCreateSecretRequest,
  FireworksUpdateSecretRequest,
  FireworksCreateEvaluatorRequest,
  FireworksUpdateEvaluatorRequest,
  FireworksGetUploadEndpointEvaluatorRequest,
  FireworksCreateEvaluationJobRequest,
  FireworksOptions,
} from "./zod";

// Re-import to use in local interface definitions
import type {
  FireworksChatRequest,
  FireworksCompletionRequest,
  FireworksEmbeddingRequest,
  FireworksRerankRequest,
  AnthropicMessagesRequest,
  FireworksTranscriptionRequest,
  FireworksTranslationRequest,
  FireworksStreamingTranscriptionOptions,
  FireworksAudioBatchTranscriptionRequest,
  FireworksAudioBatchTranslationRequest,
  FireworksTextToImageRequest,
  FireworksKontextRequest,
  FireworksGetResultRequest,
  FireworksCreateModelRequest,
  FireworksPrepareModelRequest,
  FireworksGetUploadEndpointRequest,
  FireworksValidateUploadRequest,
  FireworksBatchJobCreateRequest,
  FireworksSFTCreateRequest,
  FireworksDpoJobCreateRequest,
  FireworksRFTCreateRequest,
  FireworksRlorTrainerJobCreateRequest,
  FireworksRlorTrainerJobExecuteStepRequest,
  FireworksCreateDeploymentRequest,
  FireworksUpdateDeploymentRequest,
  FireworksScaleDeploymentRequest,
  FireworksCreateDeployedModelRequest,
  FireworksUpdateDeployedModelRequest,
  FireworksCreateDatasetRequest,
  FireworksUpdateDatasetRequest,
  FireworksDatasetGetUploadEndpointRequest,
  FireworksDatasetValidateUploadRequest,
  FireworksCreateUserRequest,
  FireworksUpdateUserRequest,
  FireworksCreateApiKeyRequest,
  FireworksDeleteApiKeyRequest,
  FireworksCreateSecretRequest,
  FireworksUpdateSecretRequest,
  FireworksCreateEvaluatorRequest,
  FireworksUpdateEvaluatorRequest,
  FireworksGetUploadEndpointEvaluatorRequest,
  FireworksCreateEvaluationJobRequest,
  FireworksUpdateModelRequest,
} from "./zod";

// Chat message
export interface FireworksMessage {
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: FireworksToolCall[];
  tool_call_id?: string;
  name?: string;
}

// Tool function definition
export interface FireworksToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// Tool definition
export interface FireworksTool {
  type: "function";
  function: FireworksToolFunction;
}

// Tool call in response
export interface FireworksToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Usage info
export interface FireworksUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Chat request
export interface FireworksChatChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: FireworksToolCall[];
  };
  finish_reason: string;
}

export interface FireworksChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: FireworksChatChoice[];
  usage?: FireworksUsage;
}

// Chat completion streaming chunk (OpenAI SSE format)
export interface FireworksChatStreamDelta {
  role?: string;
  content?: string | null;
  tool_calls?: FireworksToolCall[];
  reasoning_content?: string;
}

export interface FireworksChatStreamChoice {
  index: number;
  delta: FireworksChatStreamDelta;
  finish_reason: string | null;
}

export interface FireworksChatStreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: FireworksChatStreamChoice[];
  usage?: FireworksUsage;
}

// Completions request
export interface FireworksCompletionChoice {
  index: number;
  text: string;
  finish_reason: string;
  logprobs?: Record<string, unknown> | null;
}

export interface FireworksCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: FireworksCompletionChoice[];
  usage?: FireworksUsage;
}

// Completion streaming chunk (OpenAI SSE format)
export interface FireworksCompletionStreamChoice {
  index: number;
  text: string;
  finish_reason: string | null;
  logprobs?: Record<string, unknown> | null;
}

export interface FireworksCompletionStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: FireworksCompletionStreamChoice[];
  usage?: FireworksUsage;
}

// Anthropic Messages types (for /v1/messages endpoint)

export type AnthropicRole = "user" | "assistant";

export interface AnthropicBase64ImageSource {
  type: "base64";
  media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string;
}

export interface AnthropicUrlImageSource {
  type: "url";
  url: string;
}

export type AnthropicImageSource = AnthropicBase64ImageSource;
export interface AnthropicTextBlock {
  type: "text";
  text: string;
}

export interface AnthropicImageBlock {
  type: "image";
  source: AnthropicImageSource;
}

export interface AnthropicThinkingBlock {
  type: "thinking";
  thinking: string;
  signature: string;
}

export interface AnthropicRedactedThinkingBlock {
  type: "redacted_thinking";
  data: string;
}

export interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AnthropicToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content?: string | AnthropicInputContentBlock[];
  is_error?: boolean;
}

export type AnthropicInputContentBlock =
  | AnthropicTextBlock
  | AnthropicImageBlock
  | AnthropicThinkingBlock
  | AnthropicRedactedThinkingBlock
  | AnthropicToolUseBlock;
export type AnthropicMessageContent = string | AnthropicInputContentBlock[];

export interface AnthropicInputMessage {
  role: AnthropicRole;
  content: AnthropicMessageContent;
}

export interface AnthropicToolDefinition {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
  strict?: boolean;
}

export interface AnthropicThinkingConfig {
  type: "enabled" | "disabled";
  budget_tokens?: number;
}

export type AnthropicResponseContentBlock =
  | AnthropicTextBlock
  | AnthropicThinkingBlock
  | AnthropicRedactedThinkingBlock;
export type AnthropicStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "tool_use"
  | "pause_turn";
export interface AnthropicMessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicResponseContentBlock[];
  model: string;
  stop_reason: AnthropicStopReason | null;
  stop_sequence: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicStreamEvent {
  type: string;
  index?: number;
  delta?: {
    type?: string;
    text?: string;
    thinking?: string;
    signature?: string;
    partial_json?: string;
    stop_reason?: AnthropicStopReason;
    stop_sequence?: string | null;
  };
  content_block?: AnthropicResponseContentBlock;
  message?: AnthropicMessagesResponse;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

// Embeddings request

// Embeddings response
export interface FireworksEmbeddingData {
  object: "embedding";
  index: number;
  embedding: number[];
}

export interface FireworksEmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface FireworksEmbeddingResponse {
  object: "list";
  data: FireworksEmbeddingData[];
  model: string;
  usage: FireworksEmbeddingUsage;
}

// Rerank request

// Rerank response
export interface FireworksRerankResult {
  index: number;
  relevance_score: number;
  document?: string;
}

export interface FireworksRerankUsage {
  prompt_tokens: number;
  total_tokens: number;
  completion_tokens: number;
}

export interface FireworksRerankResponse {
  object: "list";
  model: string;
  data: FireworksRerankResult[];
  usage: FireworksRerankUsage;
}

// Audio transcription request

// Audio transcription response (json format)
export interface FireworksTranscriptionResponse {
  text: string;
}

// Audio transcription verbose response
export interface FireworksTranscriptionWord {
  word: string;
  language: string;
  probability: number;
  hallucination_score: number;
  start: number;
  end: number;
  speaker_id?: string;
}

export interface FireworksTranscriptionSegment {
  id: number;
  text: string;
  language: string;
  start: number;
  end: number;
  speaker_id?: string;
  words?: FireworksTranscriptionWord[] | null;
}

export interface FireworksTranscriptionVerboseResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  words?: FireworksTranscriptionWord[] | null;
  segments?: FireworksTranscriptionSegment[] | null;
}

// Audio translation request

// Audio translation response
export interface FireworksTranslationResponse {
  text: string;
}

// Audio streaming transcription (WebSocket)

export interface FireworksStreamingTranscriptionWord {
  word: string;
  language: string;
  probability: number;
  hallucination_score: number;
  start?: number;
  end?: number;
  is_final: boolean;
}

export interface FireworksStreamingTranscriptionSegment {
  id: number;
  text: string;
  language: string;
  words?: FireworksStreamingTranscriptionWord[] | null;
  start?: number;
  end?: number;
}

export interface FireworksStreamingTranscriptionResult {
  task: "transcribe" | "translate";
  language: string;
  text: string;
  words?: FireworksStreamingTranscriptionWord[] | null;
  segments?: FireworksStreamingTranscriptionSegment[] | null;
}

export interface FireworksStreamingStateClearEvent {
  event_id: string;
  object: "stt.state.clear";
  reset_id: string;
}

export interface FireworksStreamingStateClearedEvent {
  event_id: string;
  object: "stt.state.cleared";
  reset_id: string;
}

export interface FireworksStreamingInputTraceEvent {
  event_id: string;
  object: "stt.input.trace";
  trace_id: string;
}

export interface FireworksStreamingOutputTraceEvent {
  event_id: string;
  object: "stt.output.trace";
  trace_id: string;
}

export interface FireworksStreamingCheckpointEvent {
  checkpoint_id: string;
}

export type FireworksStreamingTranscriptionMessage =
  | FireworksStreamingTranscriptionResult
  | FireworksStreamingStateClearedEvent
  | FireworksStreamingOutputTraceEvent;
export interface FireworksStreamingTranscriptionSession {
  send(audio: ArrayBuffer | Uint8Array): void;
  clearState(resetId?: string): void;
  trace(traceId: string): void;
  close(): void;
  [Symbol.asyncIterator](): AsyncIterator<FireworksStreamingTranscriptionMessage>;
}

// Supervised Fine-Tuning (SFT) types

export interface FireworksSFTAwsS3Config {
  credentialsSecret?: string;
  iamRoleArn?: string;
}

export interface FireworksSFTAzureBlobStorageConfig {
  credentialsSecret?: string;
  managedIdentityClientId?: string;
  tenantId?: string;
}

export interface FireworksSFTWandbConfig {
  enabled?: boolean;
  apiKey?: string;
  project?: string;
  entity?: string;
  runId?: string;
  url?: string;
}

export interface FireworksSFTJobProgress {
  percent?: number;
  epoch?: number;
  totalInputRequests?: number;
  totalProcessedRequests?: number;
  successfullyProcessedRequests?: number;
  failedRequests?: number;
  outputRows?: number;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokenCount?: number;
}

export interface FireworksSFTEstimatedCost {
  currencyCode?: string;
  units?: string;
  nanos?: number;
}

export interface FireworksSFTStatus {
  code?: string;
  message?: string;
}

export interface FireworksSFTJob {
  name?: string;
  createTime?: string;
  completedTime?: string;
  updateTime?: string;
  state?: string;
  status?: FireworksSFTStatus;
  dataset?: string;
  displayName?: string;
  baseModel?: string;
  warmStartFrom?: string;
  outputModel?: string;
  jinjaTemplate?: string;
  epochs?: number;
  learningRate?: number;
  maxContextLength?: number;
  loraRank?: number;
  earlyStop?: boolean;
  evaluationDataset?: string;
  isTurbo?: boolean;
  evalAutoCarveout?: boolean;
  region?: string;
  nodes?: number;
  batchSize?: number;
  batchSizeSamples?: number;
  gradientAccumulationSteps?: number;
  learningRateWarmupSteps?: number;
  mtpEnabled?: boolean;
  mtpNumDraftTokens?: number;
  mtpFreezeBaseModel?: boolean;
  optimizerWeightDecay?: number;
  usePurpose?: string;
  awsS3Config?: FireworksSFTAwsS3Config;
  azureBlobStorageConfig?: FireworksSFTAzureBlobStorageConfig;
  wandbConfig?: FireworksSFTWandbConfig;
  createdBy?: string;
  jobProgress?: FireworksSFTJobProgress;
  estimatedCost?: FireworksSFTEstimatedCost;
  metricsFileSignedUrl?: string;
  trainerLogsSignedUrl?: string;
}

export interface FireworksSFTListRequest {
  accountId: string;
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
}

export interface FireworksSFTListResponse {
  supervisedFineTuningJobs: FireworksSFTJob[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksSFTGetRequest {
  accountId: string;
  jobId: string;
}

export interface FireworksSFTDeleteRequest {
  accountId: string;
  jobId: string;
}

export interface FireworksSFTResumeRequest {
  accountId: string;
  jobId: string;
}

// Batch inference job types

export interface FireworksBatchInferenceParameters {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  n?: number;
  topK?: number;
  extraBody?: string;
}

export interface FireworksBatchJobProgress {
  percent?: number;
  epoch?: number;
  totalInputRequests?: number;
  totalProcessedRequests?: number;
  successfullyProcessedRequests?: number;
  failedRequests?: number;
  outputRows?: number;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokenCount?: number;
}

export type FireworksBatchJobState =
  | "JOB_STATE_UNSPECIFIED"
  | "JOB_STATE_CREATING"
  | "JOB_STATE_CREATING_INPUT_DATASET"
  | "JOB_STATE_VALIDATING"
  | "JOB_STATE_PENDING"
  | "JOB_STATE_RUNNING"
  | "JOB_STATE_WRITING_RESULTS"
  | "JOB_STATE_COMPLETED"
  | "JOB_STATE_FAILED"
  | "JOB_STATE_CANCELLED"
  | "JOB_STATE_CANCELLING"
  | "JOB_STATE_EXPIRED"
  | "JOB_STATE_DELETING"
  | "JOB_STATE_DELETING_CLEANING_UP"
  | "JOB_STATE_RE_QUEUEING"
  | "JOB_STATE_IDLE"
  | "JOB_STATE_EARLY_STOPPED";
export interface FireworksBatchJob {
  name?: string;
  displayName?: string;
  model?: string;
  inputDatasetId?: string;
  outputDatasetId?: string;
  inferenceParameters?: FireworksBatchInferenceParameters;
  precision?: string;
  continuedFromJobName?: string;
  createTime?: string;
  createdBy?: string;
  state?: FireworksBatchJobState;
  status?: { code?: string; message?: string };
  updateTime?: string;
  jobProgress?: FireworksBatchJobProgress;
}

export interface FireworksBatchJobListRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
}

export interface FireworksBatchJobListResponse {
  batchInferenceJobs?: FireworksBatchJob[];
  nextPageToken?: string;
  totalSize?: number;
}

// Audio batch processing types

export interface FireworksAudioBatchSubmitResponse {
  batch_id: string;
}

export type FireworksAudioBatchJobStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";
export interface FireworksAudioBatchJob {
  batch_id?: string;
  status?: FireworksAudioBatchJobStatus;
  created_at?: string;
  updated_at?: string;
  progress?: number;
  results?: Record<string, unknown>[];
  error?: string;
}

// Training region enum (shared across fine-tuning jobs)
export type FireworksTrainingRegion =
  | "REGION_UNSPECIFIED"
  | "US_IOWA_1"
  | "US_VIRGINIA_1"
  | "US_VIRGINIA_2"
  | "US_ILLINOIS_1"
  | "AP_TOKYO_1"
  | "EU_LONDON_1"
  | "US_ARIZONA_1"
  | "US_TEXAS_1"
  | "US_ILLINOIS_2"
  | "EU_FRANKFURT_1"
  | "US_TEXAS_2"
  | "EU_PARIS_1"
  | "EU_HELSINKI_1"
  | "US_NEVADA_1"
  | "EU_ICELAND_1"
  | "EU_ICELAND_2"
  | "US_WASHINGTON_1"
  | "US_WASHINGTON_2"
  | "EU_ICELAND_DEV_1"
  | "US_WASHINGTON_3"
  | "US_ARIZONA_2"
  | "AP_TOKYO_2"
  | "US_CALIFORNIA_1"
  | "US_MISSOURI_1"
  | "US_UTAH_1"
  | "US_TEXAS_3"
  | "US_ARIZONA_3"
  | "US_GEORGIA_1"
  | "US_GEORGIA_2"
  | "US_WASHINGTON_4"
  | "US_GEORGIA_3"
  | "NA_BRITISHCOLUMBIA_1"
  | "US_GEORGIA_4"
  | "EU_ICELAND_3"
  | "US_OHIO_1";
export interface FireworksBaseTrainingConfig {
  baseModel?: string;
  warmStartFrom?: string;
  outputModel?: string;
  learningRate?: number;
  epochs?: number;
  batchSize?: number;
  batchSizeSamples?: number;
  gradientAccumulationSteps?: number;
  learningRateWarmupSteps?: number;
  maxContextLength?: number;
  loraRank?: number;
  optimizerWeightDecay?: number;
  jinjaTemplate?: string;
  region?: FireworksTrainingRegion;
}

// Reinforcement learning loss config (shared across DPO, RFT)
export type FireworksRLLossMethod =
  | "METHOD_UNSPECIFIED"
  | "GRPO"
  | "DAPO"
  | "DPO"
  | "ORPO";
export interface FireworksRLLossConfig {
  method?: FireworksRLLossMethod;
  klBeta?: number;
}

// W&B integration config (shared across fine-tuning jobs)
export interface FireworksWandbConfig {
  enabled?: boolean;
  apiKey?: string;
  project?: string;
  entity?: string;
  runId?: string;
  url?: string;
}

// AWS S3 config (shared across fine-tuning jobs)
export interface FireworksAwsS3Config {
  credentialsSecret?: string;
  iamRoleArn?: string;
}

// Azure Blob Storage config (shared across fine-tuning jobs)
export interface FireworksAzureBlobStorageConfig {
  credentialsSecret?: string;
  managedIdentityClientId?: string;
  tenantId?: string;
}

// DPO Fine-Tuning Job types

export interface FireworksDpoJob {
  name?: string;
  displayName?: string;
  createTime?: string;
  completedTime?: string;
  dataset?: string;
  state?: FireworksBatchJobState;
  status?: { code?: FireworksStatusCode; message?: string };
  createdBy?: string;
  trainingConfig?: FireworksBaseTrainingConfig;
  lossConfig?: FireworksRLLossConfig;
  wandbConfig?: FireworksWandbConfig;
  trainerLogsSignedUrl?: string;
  awsS3Config?: FireworksAwsS3Config;
  azureBlobStorageConfig?: FireworksAzureBlobStorageConfig;
}

export interface FireworksDpoJobListRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksDpoJobListResponse {
  dpoJobs?: FireworksDpoJob[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksDpoJobGetRequest {
  readMask?: string;
}

export interface FireworksMetricsFileEndpointResponse {
  signedUrl?: string;
}

// Evaluator types

export type FireworksEvaluatorState =
  | "STATE_UNSPECIFIED"
  | "ACTIVE"
  | "BUILDING";
export type FireworksEvaluatorSourceType =
  | "TYPE_UNSPECIFIED"
  | "TYPE_UPLOAD"
  | "TYPE_GITHUB";
export type FireworksCriterionType = "TYPE_UNSPECIFIED" | "CODE_SNIPPETS";

export interface FireworksCodeSnippets {
  language?: string;
  fileContents?: Record<string, string>;
  entryFile?: string;
  entryFunc?: string;
}

export interface FireworksCriterion {
  type?: FireworksCriterionType;
  name?: string;
  description?: string;
  codeSnippets?: FireworksCodeSnippets;
}

export interface FireworksEvaluatorSource {
  type?: FireworksEvaluatorSourceType;
  githubRepositoryName?: string;
}

export interface FireworksEvaluator {
  name?: string;
  displayName?: string;
  description?: string;
  createTime?: string;
  createdBy?: string;
  updateTime?: string;
  state?: FireworksEvaluatorState;
  status?: { code?: FireworksStatusCode; message?: string };
  criteria?: FireworksCriterion[];
  requirements?: string;
  entryPoint?: string;
  commitHash?: string;
  source?: FireworksEvaluatorSource;
  defaultDataset?: string;
}

export interface FireworksUpdateEvaluatorOptions {
  prepareCodeUpload?: boolean;
}

export interface FireworksListEvaluatorsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListEvaluatorsResponse {
  evaluators?: FireworksEvaluator[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksGetEvaluatorRequest {
  readMask?: string;
}

export interface FireworksGetUploadEndpointEvaluatorResponse {
  filenameToSignedUrls?: Record<string, string>;
}

export interface FireworksGetBuildLogEndpointRequest {
  readMask?: string;
}

export interface FireworksGetBuildLogEndpointResponse {
  buildLogSignedUri?: string;
}

export interface FireworksGetSourceCodeSignedUrlRequest {
  readMask?: string;
}

export interface FireworksGetSourceCodeSignedUrlResponse {
  filenameToSignedUrls?: Record<string, string>;
}

// Evaluation Job types

export type FireworksEvaluationJobState =
  | "JOB_STATE_UNSPECIFIED"
  | "JOB_STATE_CREATING"
  | "JOB_STATE_RUNNING"
  | "JOB_STATE_COMPLETED"
  | "JOB_STATE_FAILED"
  | "JOB_STATE_CANCELLED"
  | "JOB_STATE_DELETING"
  | "JOB_STATE_WRITING_RESULTS"
  | "JOB_STATE_VALIDATING"
  | "JOB_STATE_DELETING_CLEANING_UP"
  | "JOB_STATE_PENDING"
  | "JOB_STATE_EXPIRED"
  | "JOB_STATE_RE_QUEUEING"
  | "JOB_STATE_CREATING_INPUT_DATASET"
  | "JOB_STATE_IDLE"
  | "JOB_STATE_CANCELLING"
  | "JOB_STATE_EARLY_STOPPED";
export interface FireworksEvaluationJob {
  name?: string;
  displayName?: string;
  createTime?: string;
  createdBy?: string;
  updateTime?: string;
  state?: FireworksEvaluationJobState;
  status?: { code?: FireworksStatusCode; message?: string };
  evaluator?: string;
  inputDataset?: string;
  outputDataset?: string;
  outputStats?: string;
  metrics?: Record<string, number>;
  awsS3Config?: FireworksAwsS3Config;
}

export interface FireworksListEvaluationJobsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListEvaluationJobsResponse {
  evaluationJobs?: FireworksEvaluationJob[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksGetEvaluationJobRequest {
  readMask?: string;
}

export interface FireworksGetExecutionLogEndpointResponse {
  executionLogSignedUri?: string;
  contentType?: string;
  expireTime?: string;
}

// Reinforcement Fine-Tuning (RFT) Job types

export interface FireworksRFTInferenceParams {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

export interface FireworksRFTJob {
  name?: string;
  displayName?: string;
  createTime?: string;
  completedTime?: string;
  updateTime?: string;
  dataset?: string;
  evaluator?: string;
  state?: FireworksBatchJobState;
  status?: { code?: FireworksStatusCode; message?: string };
  createdBy?: string;
  trainingConfig?: FireworksBaseTrainingConfig;
  inferenceParams?: FireworksRFTInferenceParams;
  lossConfig?: FireworksRLLossConfig;
  wandbConfig?: FireworksWandbConfig;
  awsS3Config?: FireworksAwsS3Config;
  azureBlobStorageConfig?: FireworksAzureBlobStorageConfig;
  trainerLogsSignedUrl?: string;
}

export interface FireworksRFTListRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksRFTListResponse {
  reinforcementFineTuningJobs?: FireworksRFTJob[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksRFTGetRequest {
  readMask?: string;
}

// RLOR Trainer Job types (RFT training steps sub-resource)

export interface FireworksRlorRewardWeight {
  name?: string;
  weight?: number;
}

export interface FireworksRlorTrainerJob {
  name?: string;
  displayName?: string;
  createTime?: string;
  completedTime?: string;
  updateTime?: string;
  dataset?: string;
  evaluator?: string;
  state?: FireworksBatchJobState;
  status?: { code?: FireworksStatusCode; message?: string };
  createdBy?: string;
  trainingConfig?: FireworksBaseTrainingConfig;
  inferenceParams?: FireworksRFTInferenceParams;
  lossConfig?: FireworksRLLossConfig;
  rewardWeights?: FireworksRlorRewardWeight[];
  wandbConfig?: FireworksWandbConfig;
  awsS3Config?: FireworksAwsS3Config;
  azureBlobStorageConfig?: FireworksAzureBlobStorageConfig;
  trainerLogsSignedUrl?: string;
}

export interface FireworksRlorTrainerJobListRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksRlorTrainerJobListResponse {
  rlorTrainerJobs?: FireworksRlorTrainerJob[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksRlorTrainerJobGetRequest {
  readMask?: string;
}

// Namespace types
interface FireworksChatCompletionsStreamMethod {
  (
    req: FireworksChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<FireworksChatStreamChunk>;
  schema: z.ZodType;
}

interface FireworksChatCompletionsStreamMethod {
  (
    req: FireworksChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<FireworksChatStreamChunk>;
  schema: z.ZodType;
}

interface FireworksChatCompletionsMethod {
  (
    req: FireworksChatRequest,
    signal?: AbortSignal
  ): Promise<FireworksChatResponse>;
  schema: z.ZodType;
}

interface FireworksCompletionsStreamMethod {
  (
    req: FireworksCompletionRequest,
    signal?: AbortSignal
  ): AsyncIterable<FireworksCompletionStreamChunk>;
  schema: z.ZodType;
}

interface FireworksCompletionsMethod {
  (
    req: FireworksCompletionRequest,
    signal?: AbortSignal
  ): Promise<FireworksCompletionResponse>;
  schema: z.ZodType;
}

interface FireworksEmbeddingsMethod {
  (
    req: FireworksEmbeddingRequest,
    signal?: AbortSignal
  ): Promise<FireworksEmbeddingResponse>;
  schema: z.ZodType;
}

interface FireworksRerankMethod {
  (
    req: FireworksRerankRequest,
    signal?: AbortSignal
  ): Promise<FireworksRerankResponse>;
  schema: z.ZodType;
}

interface FireworksMessagesStreamMethod {
  (
    req: AnthropicMessagesRequest,
    signal?: AbortSignal
  ): AsyncIterable<AnthropicStreamEvent>;
  schema: z.ZodType;
}

interface FireworksMessagesMethod {
  (
    req: AnthropicMessagesRequest,
    signal?: AbortSignal
  ): Promise<AnthropicMessagesResponse>;
  schema: z.ZodType;
}

interface FireworksStreamingTranscriptionsMethod {
  (
    opts?: FireworksStreamingTranscriptionOptions
  ): FireworksStreamingTranscriptionSession;
  schema: z.ZodType;
}

interface FireworksAudioBatchTranscriptionsMethod {
  (
    req: FireworksAudioBatchTranscriptionRequest,
    signal?: AbortSignal
  ): Promise<FireworksAudioBatchSubmitResponse>;
  schema: z.ZodType;
}

interface FireworksAudioBatchTranslationsMethod {
  (
    req: FireworksAudioBatchTranslationRequest,
    signal?: AbortSignal
  ): Promise<FireworksAudioBatchSubmitResponse>;
  schema: z.ZodType;
}

interface FireworksBatchJobCreateMethod {
  (
    accountId: string,
    req: FireworksBatchJobCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksBatchJob>;
  schema: z.ZodType;
}

interface FireworksSFTCreateMethod {
  (
    req: FireworksSFTCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksSFTJob>;
  schema: z.ZodType;
}

interface FireworksSFTDeleteMethod {
  (
    req: FireworksSFTDeleteRequest,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
}

interface FireworksChatNamespace {
  completions: FireworksChatCompletionsMethod;
}

interface FireworksTranscriptionsMethod {
  (
    req: FireworksTranscriptionRequest,
    signal?: AbortSignal
  ): Promise<FireworksTranscriptionResponse>;
  streaming: FireworksStreamingTranscriptionsMethod;
  schema: z.ZodType;
}

interface FireworksTranslationsMethod {
  (
    req: FireworksTranslationRequest,
    signal?: AbortSignal
  ): Promise<FireworksTranslationResponse>;
  schema: z.ZodType;
}

interface FireworksAudioBatchNamespace {
  transcriptions: FireworksAudioBatchTranscriptionsMethod;
  translations: FireworksAudioBatchTranslationsMethod;
  get(
    accountId: string,
    batchId: string,
    signal?: AbortSignal
  ): Promise<FireworksAudioBatchJob>;
}

interface FireworksAudioNamespace {
  transcriptions: FireworksTranscriptionsMethod;
  translations: FireworksTranslationsMethod;
  batch: FireworksAudioBatchNamespace;
}

interface FireworksWorkflowsNamespace {
  textToImage: FireworksTextToImageMethod;
  kontext: FireworksKontextMethod;
  getResult: FireworksGetResultMethod;
}

interface FireworksBatchInferenceJobsNamespace {
  create: FireworksBatchJobCreateMethod;
  get(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksBatchJob>;
  list(
    accountId: string,
    opts?: FireworksBatchJobListRequest,
    signal?: AbortSignal
  ): Promise<FireworksBatchJobListResponse>;
  delete(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
}

interface FireworksSFTListMethod {
  (
    req: FireworksSFTListRequest,
    signal?: AbortSignal
  ): Promise<FireworksSFTListResponse>;
}

interface FireworksSFTGetMethod {
  (req: FireworksSFTGetRequest, signal?: AbortSignal): Promise<FireworksSFTJob>;
}

interface FireworksSFTResumeMethod {
  (
    req: FireworksSFTResumeRequest,
    signal?: AbortSignal
  ): Promise<FireworksSFTJob>;
}

interface FireworksSFTNamespace {
  create: FireworksSFTCreateMethod;
  list: FireworksSFTListMethod;
  get: FireworksSFTGetMethod;
  delete: FireworksSFTDeleteMethod;
  resume: FireworksSFTResumeMethod;
}

interface FireworksDeploymentsNamespace {
  list(
    accountId: string,
    params?: FireworksListDeploymentsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListDeploymentsResponse>;
  create: FireworksCreateDeploymentMethod;
  get(
    accountId: string,
    deploymentId: string,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
  update: FireworksUpdateDeploymentMethod;
  delete(
    accountId: string,
    deploymentId: string,
    options?: FireworksDeleteDeploymentOptions,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  scale: FireworksScaleDeploymentMethod;
  undelete(
    accountId: string,
    deploymentId: string,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
  // Verb accessor for POST on /accounts/:id/deployments
  post(
    accountId: string,
    req: FireworksCreateDeploymentRequest,
    options?: FireworksCreateDeploymentOptions,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
}

interface FireworksDeploymentShapesNamespace {
  get(
    accountId: string,
    shapeId: string,
    params?: FireworksGetDeploymentShapeRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeploymentShape>;
  versions: {
    list(
      accountId: string,
      shapeId: string,
      params?: FireworksListDeploymentShapeVersionsRequest,
      signal?: AbortSignal
    ): Promise<FireworksListDeploymentShapeVersionsResponse>;
    get(
      accountId: string,
      shapeId: string,
      versionId: string,
      params?: FireworksGetDeploymentShapeVersionRequest,
      signal?: AbortSignal
    ): Promise<FireworksDeploymentShapeVersion>;
  };
}

interface FireworksDatasetGetDownloadEndpointMethod {
  (
    accountId: string,
    datasetId: string,
    req?: FireworksDatasetGetDownloadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksDatasetGetDownloadEndpointResponse>;
  schema: z.ZodType;
}

interface FireworksDatasetsNamespace {
  list(
    accountId: string,
    params?: FireworksListDatasetsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListDatasetsResponse>;
  create: FireworksDatasetCreateMethod;
  get(
    accountId: string,
    datasetId: string,
    req?: FireworksGetDatasetRequest,
    signal?: AbortSignal
  ): Promise<FireworksDataset>;
  update: FireworksDatasetUpdateMethod;
  delete(
    accountId: string,
    datasetId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  getUploadEndpoint: FireworksDatasetGetUploadEndpointMethod;
  getDownloadEndpoint: FireworksDatasetGetDownloadEndpointMethod;
  validateUpload: FireworksDatasetValidateUploadMethod;
}

interface FireworksDeployedModelsNamespace {
  list(
    accountId: string,
    params?: FireworksListDeployedModelsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListDeployedModelsResponse>;
  create: FireworksCreateDeployedModelMethod;
  get(
    accountId: string,
    deployedModelId: string,
    params?: FireworksGetDeployedModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeployedModel>;
  update: FireworksUpdateDeployedModelMethod;
  delete(
    accountId: string,
    deployedModelId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}

interface FireworksDpoJobsNamespace {
  create: FireworksDpoJobCreateMethod;
  get(
    accountId: string,
    jobId: string,
    req?: FireworksDpoJobGetRequest,
    signal?: AbortSignal
  ): Promise<FireworksDpoJob>;
  list(
    accountId: string,
    req?: FireworksDpoJobListRequest,
    signal?: AbortSignal
  ): Promise<FireworksDpoJobListResponse>;
  delete(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  resume(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksDpoJob>;
  getMetricsFileEndpoint(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksMetricsFileEndpointResponse>;
}

interface FireworksUsersNamespace {
  list(
    accountId: string,
    params?: FireworksListUsersRequest,
    signal?: AbortSignal
  ): Promise<FireworksListUsersResponse>;
  create: FireworksCreateUserMethod;
  get(
    accountId: string,
    userId: string,
    params?: FireworksGetUserRequest,
    signal?: AbortSignal
  ): Promise<FireworksUser>;
  update: FireworksUpdateUserMethod;
  // Verb accessor for POST on /accounts/:id/users
  post(
    accountId: string,
    req: FireworksCreateUserRequest,
    options?: FireworksCreateUserOptions,
    signal?: AbortSignal
  ): Promise<FireworksUser>;
}

interface FireworksApiKeysNamespace {
  list(
    accountId: string,
    userId: string,
    params?: FireworksListApiKeysRequest,
    signal?: AbortSignal
  ): Promise<FireworksListApiKeysResponse>;
  create: FireworksCreateApiKeyMethod;
  delete: FireworksDeleteApiKeyMethod;
}

interface FireworksSecretsNamespace {
  list(
    accountId: string,
    params?: FireworksListSecretsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListSecretsResponse>;
  create: FireworksCreateSecretMethod;
  get(
    accountId: string,
    secretId: string,
    params?: { readMask?: string },
    signal?: AbortSignal
  ): Promise<FireworksSecret>;
  update: FireworksUpdateSecretMethod;
  delete(
    accountId: string,
    secretId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
}

interface FireworksEvaluatorsNamespace {
  create: FireworksCreateEvaluatorMethod;
  list(
    accountId: string,
    params?: FireworksListEvaluatorsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListEvaluatorsResponse>;
  get(
    accountId: string,
    evaluatorId: string,
    params?: FireworksGetEvaluatorRequest,
    signal?: AbortSignal
  ): Promise<FireworksEvaluator>;
  update: FireworksUpdateEvaluatorMethod;
  delete(
    accountId: string,
    evaluatorId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  getUploadEndpoint: FireworksGetUploadEndpointEvaluatorMethod;
  validateUpload(
    accountId: string,
    evaluatorId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  getBuildLogEndpoint(
    accountId: string,
    evaluatorId: string,
    params?: FireworksGetBuildLogEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetBuildLogEndpointResponse>;
  getSourceCodeSignedUrl(
    accountId: string,
    evaluatorId: string,
    params?: FireworksGetSourceCodeSignedUrlRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetSourceCodeSignedUrlResponse>;
}

interface FireworksEvaluationJobsNamespace {
  create: FireworksCreateEvaluationJobMethod;
  list(
    accountId: string,
    params?: FireworksListEvaluationJobsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListEvaluationJobsResponse>;
  get(
    accountId: string,
    evaluationJobId: string,
    params?: FireworksGetEvaluationJobRequest,
    signal?: AbortSignal
  ): Promise<FireworksEvaluationJob>;
  delete(
    accountId: string,
    evaluationJobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  getExecutionLogEndpoint(
    accountId: string,
    evaluationJobId: string,
    signal?: AbortSignal
  ): Promise<FireworksGetExecutionLogEndpointResponse>;
}

interface FireworksRFTNamespace {
  create: FireworksRFTCreateMethod;
  get(
    accountId: string,
    jobId: string,
    req?: FireworksRFTGetRequest,
    signal?: AbortSignal
  ): Promise<FireworksRFTJob>;
  list(
    accountId: string,
    req?: FireworksRFTListRequest,
    signal?: AbortSignal
  ): Promise<FireworksRFTListResponse>;
  delete(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  resume(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksRFTJob>;
}

interface FireworksRlorTrainerJobsNamespace {
  create: FireworksRlorTrainerJobCreateMethod;
  get(
    accountId: string,
    jobId: string,
    req?: FireworksRlorTrainerJobGetRequest,
    signal?: AbortSignal
  ): Promise<FireworksRlorTrainerJob>;
  list(
    accountId: string,
    req?: FireworksRlorTrainerJobListRequest,
    signal?: AbortSignal
  ): Promise<FireworksRlorTrainerJobListResponse>;
  delete(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  executeTrainStep: FireworksRlorTrainerJobExecuteStepMethod;
  resume(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksRlorTrainerJob>;
}

interface FireworksAccountsNamespace {
  list(
    params?: FireworksListAccountsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListAccountsResponse>;
  get(
    accountId: string,
    params?: FireworksGetAccountRequest,
    signal?: AbortSignal
  ): Promise<FireworksAccount>;
  users: FireworksUsersNamespace;
  apiKeys: FireworksApiKeysNamespace;
  secrets: FireworksSecretsNamespace;
  models: FireworksModelsNamespace;
  datasets: FireworksDatasetsNamespace;
  batchInferenceJobs: FireworksBatchInferenceJobsNamespace;
  supervisedFineTuningJobs: FireworksSFTNamespace;
  deployments: FireworksDeploymentsNamespace;
  deployedModels: FireworksDeployedModelsNamespace;
  deploymentShapes: FireworksDeploymentShapesNamespace;
  dpoJobs: FireworksDpoJobsNamespace;
  evaluators: FireworksEvaluatorsNamespace;
  evaluationJobs: FireworksEvaluationJobsNamespace;
  reinforcementFineTuningJobs: FireworksRFTNamespace;
  rlorTrainerJobs: FireworksRlorTrainerJobsNamespace;
}

interface FireworksV1Namespace {
  chat: FireworksChatNamespace;
  completions: FireworksCompletionsMethod;
  embeddings: FireworksEmbeddingsMethod;
  rerank: FireworksRerankMethod;
  messages: FireworksMessagesMethod;
  workflows: FireworksWorkflowsNamespace;
  audio: FireworksAudioNamespace;
  accounts: FireworksAccountsNamespace;
}

// Provider interface
export interface FireworksProvider {
  inference: { v1: FireworksV1Namespace };
  post: FireworksPostNamespace;
  get: FireworksGetNamespace;
  patch: FireworksPatchNamespace;
  delete: FireworksDeleteNamespace;
  ws: FireworksWsNamespace;
}

// Text-to-image request (synchronous FLUX schnell/dev)

// Text-to-image JSON response
export interface FireworksTextToImageResponse {
  id: string;
  base64: string[];
  finishReason: "SUCCESS" | "CONTENT_FILTERED";
  seed: number;
}

// Kontext async request (FLUX Kontext Pro/Max)

// Kontext async create response
export interface FireworksKontextResponse {
  request_id: string;
}

// Kontext get_result request

// Kontext get_result response
export interface FireworksGetResultResponse {
  id: string;
  status:
    | "Task not found"
    | "Pending"
    | "Request Moderated"
    | "Content Moderated"
    | "Ready"
    | "Error";
  result: unknown;
  progress: number | null;
  details: Record<string, unknown> | null;
}

// Namespace types for workflows
interface FireworksTextToImageMethod {
  (
    model: string,
    req: FireworksTextToImageRequest,
    signal?: AbortSignal
  ): Promise<FireworksTextToImageResponse>;
  schema: z.ZodType;
}

interface FireworksKontextMethod {
  (
    model: string,
    req: FireworksKontextRequest,
    signal?: AbortSignal
  ): Promise<FireworksKontextResponse>;
  schema: z.ZodType;
}

interface FireworksGetResultMethod {
  (
    model: string,
    req: FireworksGetResultRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetResultResponse>;
  schema: z.ZodType;
}

// Models CRUD types

export type FireworksModelKind =
  | "KIND_UNSPECIFIED"
  | "HF_BASE_MODEL"
  | "HF_PEFT_ADDON"
  | "HF_TEFT_ADDON"
  | "FLUMINA_BASE_MODEL"
  | "FLUMINA_ADDON"
  | "DRAFT_ADDON"
  | "FIRE_AGENT"
  | "LIVE_MERGE"
  | "CUSTOM_MODEL"
  | "EMBEDDING_MODEL";
export type FireworksModelState = "STATE_UNSPECIFIED" | "UPLOADING" | "READY";

export type FireworksDeploymentPrecision =
  | "PRECISION_UNSPECIFIED"
  | "FP16"
  | "FP8"
  | "FP8_MM"
  | "FP8_AR"
  | "FP8_MM_KV_ATTN"
  | "FP8_KV"
  | "FP8_MM_V2"
  | "FP8_V2"
  | "FP8_MM_KV_ATTN_V2"
  | "NF4"
  | "FP4"
  | "BF16"
  | "FP4_BLOCKSCALED_MM";
export type FireworksStatusCode =
  | "OK"
  | "CANCELLED"
  | "UNKNOWN"
  | "INVALID_ARGUMENT"
  | "DEADLINE_EXCEEDED"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "PERMISSION_DENIED"
  | "UNAUTHENTICATED"
  | "RESOURCE_EXHAUSTED"
  | "FAILED_PRECONDITION"
  | "ABORTED"
  | "OUT_OF_RANGE"
  | "UNIMPLEMENTED"
  | "INTERNAL"
  | "UNAVAILABLE";
export type FireworksCheckpointFormat = "NATIVE" | "HUGGINGFACE";
export type FireworksDeployedModelState =
  | "STATE_UNSPECIFIED"
  | "UNDEPLOYING"
  | "DEPLOYING"
  | "DEPLOYED";
export type FireworksSnapshotType = "FULL_SNAPSHOT" | "INCREMENTAL_SNAPSHOT";

export interface FireworksBaseModelDetails {
  worldSize?: number;
  checkpointFormat?: FireworksCheckpointFormat;
  parameterCount?: string;
  moe?: boolean;
  tunable?: boolean;
  modelType?: string;
  supportsFireattention?: boolean;
  defaultPrecision?: FireworksDeploymentPrecision;
  supportsMtp?: boolean;
}

export interface FireworksPEFTDetails {
  baseModel: string;
  r: number;
  targetModules: string[];
  baseModelType?: string;
  mergeAddonModelName?: string;
}

export interface FireworksTEFTDetails {
  [key: string]: unknown;
}

export interface FireworksConversationConfig {
  style: string;
  system?: string;
  template?: string;
}

export interface FireworksModelStatus {
  code: FireworksStatusCode;
  message: string;
}

export interface FireworksDeployedModelRef {
  name: string;
  deployment: string;
  state: FireworksDeployedModelState;
  default: boolean;
  public: boolean;
}

export interface FireworksModel {
  name?: string;
  displayName?: string;
  description?: string;
  kind?: FireworksModelKind;
  createTime?: string;
  updateTime?: string;
  state?: FireworksModelState;
  status?: FireworksModelStatus;
  githubUrl?: string;
  huggingFaceUrl?: string;
  baseModelDetails?: FireworksBaseModelDetails;
  peftDetails?: FireworksPEFTDetails;
  teftDetails?: FireworksTEFTDetails;
  public?: boolean;
  conversationConfig?: FireworksConversationConfig;
  contextLength?: number;
  supportsImageInput?: boolean;
  supportsTools?: boolean;
  defaultDraftModel?: string;
  defaultDraftTokenCount?: number;
  supportsLora?: boolean;
  useHfApplyChatTemplate?: boolean;
  trainingContextLength?: number;
  snapshotType?: FireworksSnapshotType;
  importedFrom?: string;
  fineTuningJob?: string;
  deployedModelRefs?: FireworksDeployedModelRef[];
  cluster?: string;
  calibrated?: boolean;
  tunable?: boolean;
  defaultSamplingParams?: Record<string, number>;
  rlTunable?: boolean;
  supportedPrecisions?: FireworksDeploymentPrecision[];
  supportedPrecisionsWithCalibration?: FireworksDeploymentPrecision[];
  supportsServerless?: boolean;
}

export interface FireworksListModelsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListModelsResponse {
  models: FireworksModel[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksGetModelRequest {
  readMask?: string;
}

export interface FireworksGetUploadEndpointResponse {
  filenameToSignedUrls?: Record<string, string>;
  filenameToUnsignedUris?: Record<string, string>;
}

export interface FireworksGetDownloadEndpointRequest {
  readMask?: string;
}

export interface FireworksGetDownloadEndpointResponse {
  filenameToSignedUrls?: Record<string, string>;
}

export interface FireworksValidateUploadResponse {
  warnings?: string[];
}

// Models namespace types
interface FireworksModelsListMethod {
  (
    accountId: string,
    req?: FireworksListModelsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListModelsResponse>;
  schema: z.ZodType;
}

interface FireworksModelsCreateMethod {
  (
    accountId: string,
    req: FireworksCreateModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
  schema: z.ZodType;
}

interface FireworksModelsGetMethod {
  (
    accountId: string,
    modelId: string,
    req?: FireworksGetModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
  schema: z.ZodType;
}

interface FireworksModelsUpdateMethod {
  (
    accountId: string,
    modelId: string,
    req: FireworksUpdateModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
  schema: z.ZodType;
  // Verb accessor for POST on /accounts/:id/models/:mid
  post(
    accountId: string,
    modelId: string,
    req: FireworksUpdateModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
}

interface FireworksModelsDeleteMethod {
  (
    accountId: string,
    modelId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  schema: z.ZodType;
}

interface FireworksModelsPrepareMethod {
  (
    accountId: string,
    modelId: string,
    req: FireworksPrepareModelRequest,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  schema: z.ZodType;
}

interface FireworksModelsGetUploadEndpointMethod {
  (
    accountId: string,
    modelId: string,
    req: FireworksGetUploadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetUploadEndpointResponse>;
  schema: z.ZodType;
}

interface FireworksModelsGetDownloadEndpointMethod {
  (
    accountId: string,
    modelId: string,
    req?: FireworksGetDownloadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetDownloadEndpointResponse>;
  schema: z.ZodType;
}

interface FireworksModelsValidateUploadMethod {
  (
    accountId: string,
    modelId: string,
    req?: FireworksValidateUploadRequest,
    signal?: AbortSignal
  ): Promise<FireworksValidateUploadResponse>;
  schema: z.ZodType;
}

export interface FireworksModelsNamespace {
  list: FireworksModelsListMethod;
  create: FireworksModelsCreateMethod;
  get: FireworksModelsGetMethod;
  update: FireworksModelsUpdateMethod;
  delete: FireworksModelsDeleteMethod;
  prepare: FireworksModelsPrepareMethod;
  getUploadEndpoint: FireworksModelsGetUploadEndpointMethod;
  getDownloadEndpoint: FireworksModelsGetDownloadEndpointMethod;
  validateUpload: FireworksModelsValidateUploadMethod;
  // Verb accessor for POST on /accounts/:id/models
  post(
    accountId: string,
    req: FireworksCreateModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
}

export type FireworksDeploymentState =
  | "STATE_UNSPECIFIED"
  | "CREATING"
  | "READY"
  | "DELETING"
  | "FAILED"
  | "UPDATING";
export type FireworksAcceleratorType =
  | "ACCELERATOR_TYPE_UNSPECIFIED"
  | "NVIDIA_A100_80GB"
  | "NVIDIA_H100_80GB"
  | "AMD_MI300X_192GB"
  | "NVIDIA_A10G_24GB"
  | "NVIDIA_A100_40GB"
  | "NVIDIA_L4_24GB"
  | "NVIDIA_H200_141GB"
  | "NVIDIA_B200_180GB"
  | "AMD_MI325X_256GB";
export interface FireworksAutoscalingPolicy {
  scaleUpWindow?: string;
  scaleDownWindow?: string;
  scaleToZeroWindow?: string;
  loadTargets?: Record<string, number>;
}

export interface FireworksReplicaStats {
  pendingSchedulingReplicaCount?: number;
  downloadingModelReplicaCount?: number;
  initializingReplicaCount?: number;
  readyReplicaCount?: number;
}

export interface FireworksDeployment {
  name?: string;
  displayName?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  deleteTime?: string;
  purgeTime?: string;
  expireTime?: string;
  state?: FireworksDeploymentState;
  status?: { code?: string; message?: string };
  baseModel: string;
  minReplicaCount?: number;
  maxReplicaCount?: number;
  maxWithRevocableReplicaCount?: number;
  desiredReplicaCount?: number;
  replicaCount?: number;
  autoscalingPolicy?: FireworksAutoscalingPolicy;
  acceleratorCount?: number;
  acceleratorType?: FireworksAcceleratorType;
  precision?: FireworksDeploymentPrecision;
  cluster?: string;
  enableAddons?: boolean;
  draftTokenCount?: number;
  draftModel?: string;
  ngramSpeculationLength?: number;
  enableSessionAffinity?: boolean;
  maxContextLength?: number;
  deploymentShape?: string;
  activeModelVersion?: string;
  targetModelVersion?: string;
  replicaStats?: FireworksReplicaStats;
  pricingPlanId?: string;
}

export interface FireworksCreateDeploymentOptions {
  deploymentId?: string;
  disableAutoDeploy?: boolean;
  disableSpeculativeDecoding?: boolean;
  validateOnly?: boolean;
  skipShapeValidation?: boolean;
}

export interface FireworksListDeploymentsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  showDeleted?: boolean;
  readMask?: string;
}

export interface FireworksListDeploymentsResponse {
  deployments: FireworksDeployment[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksDeleteDeploymentOptions {
  hard?: boolean;
  ignoreChecks?: boolean;
}

export interface FireworksDeploymentShape {
  name?: string;
  displayName?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  baseModel?: string;
  modelType?: string;
  parameterCount?: string;
  acceleratorCount?: number;
  acceleratorType?: FireworksAcceleratorType;
  precision?: FireworksDeploymentPrecision;
  disableDeploymentSizeValidation?: boolean;
  enableAddons?: boolean;
  draftTokenCount?: number;
  draftModel?: string;
  ngramSpeculationLength?: number;
  enableSessionAffinity?: boolean;
  numLoraDeviceCached?: number;
  maxContextLength?: number;
  presetType?: string;
}

export interface FireworksGetDeploymentShapeRequest {
  readMask?: string;
}

export interface FireworksGetDeploymentShapeVersionRequest {
  readMask?: string;
}

export interface FireworksDeploymentShapeVersion {
  name?: string;
  createTime?: string;
  snapshot?: FireworksDeploymentShape;
  validated?: boolean;
  public?: boolean;
  latestValidated?: boolean;
}

export interface FireworksListDeploymentShapeVersionsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListDeploymentShapeVersionsResponse {
  deploymentShapeVersions: FireworksDeploymentShapeVersion[];
  nextPageToken?: string;
  totalSize?: number;
}

// Deployed Models (LoRA management)
export interface FireworksDeployedModel {
  name?: string;
  displayName?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  model?: string;
  deployment?: string;
  default?: boolean;
  state?: FireworksDeployedModelState;
  serverless?: boolean;
  status?: FireworksModelStatus;
  public?: boolean;
}

export interface FireworksCreateDeployedModelOptions {
  replaceMergedAddon?: boolean;
}

export interface FireworksListDeployedModelsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListDeployedModelsResponse {
  deployedModels: FireworksDeployedModel[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksGetDeployedModelRequest {
  readMask?: string;
}

interface FireworksCreateDeploymentMethod {
  (
    accountId: string,
    req: FireworksCreateDeploymentRequest,
    options?: FireworksCreateDeploymentOptions,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
  schema: z.ZodType;
}

interface FireworksUpdateDeploymentMethod {
  (
    accountId: string,
    deploymentId: string,
    req: FireworksUpdateDeploymentRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
  schema: z.ZodType;
  // Verb accessor for POST on /accounts/:id/deployments/:did
  post(
    accountId: string,
    deploymentId: string,
    req: FireworksUpdateDeploymentRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
}

interface FireworksScaleDeploymentMethod {
  (
    accountId: string,
    deploymentId: string,
    req: FireworksScaleDeploymentRequest,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  schema: z.ZodType;
}

// Dataset types

export type FireworksDatasetState = "STATE_UNSPECIFIED" | "UPLOADING" | "READY";

export type FireworksDatasetFormat =
  | "FORMAT_UNSPECIFIED"
  | "CHAT"
  | "COMPLETION";
export interface FireworksDatasetStatus {
  code?: FireworksStatusCode;
  message?: string;
}

export interface FireworksDatasetTransformed {
  sourceDatasetId?: string;
  filter?: string;
  originalFormat?: FireworksDatasetFormat;
}

export interface FireworksDatasetSplitted {
  sourceDatasetId?: string;
}

export interface FireworksDatasetEvaluationResult {
  evaluationJobId?: string;
}

export interface FireworksDataset {
  name?: string;
  displayName?: string;
  createTime?: string;
  updateTime?: string;
  state?: FireworksDatasetState;
  status?: FireworksDatasetStatus;
  exampleCount?: number;
  userUploaded?: Record<string, unknown>;
  evaluationResult?: FireworksDatasetEvaluationResult;
  transformed?: FireworksDatasetTransformed;
  splitted?: FireworksDatasetSplitted;
  evalProtocol?: Record<string, unknown>;
  externalUrl?: string;
  format?: FireworksDatasetFormat;
  createdBy?: string;
  sourceJobName?: string;
  estimatedTokenCount?: number;
  averageTurnCount?: number;
}

export interface FireworksListDatasetsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListDatasetsResponse {
  datasets: FireworksDataset[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksGetDatasetRequest {
  readMask?: string;
}

export interface FireworksDatasetGetUploadEndpointResponse {
  filenameToSignedUrls?: Record<string, string>;
}

export interface FireworksDatasetGetDownloadEndpointRequest {
  readMask?: string;
  downloadLineage?: boolean;
}

export interface FireworksDatasetGetDownloadEndpointResponse {
  filenameToSignedUrls?: Record<string, string>;
}

// Dataset namespace types

interface FireworksDatasetCreateMethod {
  (
    accountId: string,
    req: FireworksCreateDatasetRequest,
    signal?: AbortSignal
  ): Promise<FireworksDataset>;
  schema: z.ZodType;
}

interface FireworksDatasetUpdateMethod {
  (
    accountId: string,
    datasetId: string,
    req: FireworksUpdateDatasetRequest,
    signal?: AbortSignal
  ): Promise<FireworksDataset>;
  schema: z.ZodType;
}

interface FireworksDatasetGetUploadEndpointMethod {
  (
    accountId: string,
    datasetId: string,
    req: FireworksDatasetGetUploadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksDatasetGetUploadEndpointResponse>;
  schema: z.ZodType;
}

interface FireworksDatasetValidateUploadMethod {
  (
    accountId: string,
    datasetId: string,
    req?: FireworksDatasetValidateUploadRequest,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  schema: z.ZodType;
}

// Deployed Models namespace types
interface FireworksCreateDeployedModelMethod {
  (
    accountId: string,
    req: FireworksCreateDeployedModelRequest,
    options?: FireworksCreateDeployedModelOptions,
    signal?: AbortSignal
  ): Promise<FireworksDeployedModel>;
  schema: z.ZodType;
}

interface FireworksUpdateDeployedModelMethod {
  (
    accountId: string,
    deployedModelId: string,
    req: FireworksUpdateDeployedModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeployedModel>;
  schema: z.ZodType;
}

// DPO Jobs namespace types
interface FireworksDpoJobCreateMethod {
  (
    accountId: string,
    req: FireworksDpoJobCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksDpoJob>;
  schema: z.ZodType;
}

// Account types

export type FireworksAccountType = "ACCOUNT_TYPE_UNSPECIFIED" | "ENTERPRISE";

export type FireworksAccountState =
  | "STATE_UNSPECIFIED"
  | "CREATING"
  | "READY"
  | "UPDATING";
export type FireworksAccountSuspendState =
  | "UNSUSPENDED"
  | "FAILED_PAYMENTS"
  | "CREDIT_DEPLETED"
  | "MONTHLY_SPEND_LIMIT_EXCEEDED";
export interface FireworksAccount {
  name: string;
  displayName?: string;
  createTime?: string;
  email?: string;
  accountType?: FireworksAccountType;
  state?: FireworksAccountState;
  status?: { code: string; message: string };
  suspendState?: FireworksAccountSuspendState;
  updateTime?: string;
}

export interface FireworksListAccountsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListAccountsResponse {
  accounts: FireworksAccount[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksGetAccountRequest {
  readMask?: string;
}

// User types

export type FireworksUserRole = "admin" | "user" | "contributor";
export type FireworksUserState =
  | "STATE_UNSPECIFIED"
  | "CREATING"
  | "READY"
  | "UPDATING";
export interface FireworksUser {
  name: string;
  displayName?: string;
  email?: string;
  role?: FireworksUserRole;
  serviceAccount?: boolean;
  createTime?: string;
  updateTime?: string;
  state?: FireworksUserState;
  status?: { code: string; message: string };
}

export interface FireworksListUsersRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListUsersResponse {
  users: FireworksUser[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksCreateUserOptions {
  userId?: string;
}

export interface FireworksGetUserRequest {
  readMask?: string;
}

// API Key types

export interface FireworksApiKey {
  keyId: string;
  displayName?: string;
  key?: string;
  createTime?: string;
  secure?: boolean;
  email?: string;
  prefix?: string;
  expireTime?: string;
}

export interface FireworksListApiKeysRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListApiKeysResponse {
  apiKeys: FireworksApiKey[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface FireworksSecret {
  name: string;
  keyName: string;
  value?: string;
}

export interface FireworksListSecretsRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
  readMask?: string;
}

export interface FireworksListSecretsResponse {
  secrets: FireworksSecret[];
  nextPageToken?: string;
  totalSize?: number;
}

// Account management namespace types

interface FireworksCreateUserMethod {
  (
    accountId: string,
    req: FireworksCreateUserRequest,
    options?: FireworksCreateUserOptions,
    signal?: AbortSignal
  ): Promise<FireworksUser>;
  schema: z.ZodType;
}

interface FireworksUpdateUserMethod {
  (
    accountId: string,
    userId: string,
    req: FireworksUpdateUserRequest,
    signal?: AbortSignal
  ): Promise<FireworksUser>;
  schema: z.ZodType;
  // Verb accessor for POST on /accounts/:id/users/:uid
  post(
    accountId: string,
    userId: string,
    req: FireworksUpdateUserRequest,
    signal?: AbortSignal
  ): Promise<FireworksUser>;
}

interface FireworksCreateApiKeyMethod {
  (
    accountId: string,
    userId: string,
    req: FireworksCreateApiKeyRequest,
    signal?: AbortSignal
  ): Promise<FireworksApiKey>;
  schema: z.ZodType;
}

interface FireworksDeleteApiKeyMethod {
  (
    accountId: string,
    userId: string,
    req: FireworksDeleteApiKeyRequest,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  schema: z.ZodType;
}

interface FireworksCreateSecretMethod {
  (
    accountId: string,
    req: FireworksCreateSecretRequest,
    signal?: AbortSignal
  ): Promise<FireworksSecret>;
  schema: z.ZodType;
}

// Evaluators namespace types
interface FireworksCreateEvaluatorMethod {
  (
    accountId: string,
    req: FireworksCreateEvaluatorRequest,
    signal?: AbortSignal
  ): Promise<FireworksEvaluator>;
  schema: z.ZodType;
}

interface FireworksUpdateEvaluatorMethod {
  (
    accountId: string,
    evaluatorId: string,
    req: FireworksUpdateEvaluatorRequest,
    options?: FireworksUpdateEvaluatorOptions,
    signal?: AbortSignal
  ): Promise<FireworksEvaluator>;
  schema: z.ZodType;
}

interface FireworksGetUploadEndpointEvaluatorMethod {
  (
    accountId: string,
    evaluatorId: string,
    req: FireworksGetUploadEndpointEvaluatorRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetUploadEndpointEvaluatorResponse>;
  schema: z.ZodType;
}

// Evaluation Jobs namespace types
interface FireworksCreateEvaluationJobMethod {
  (
    accountId: string,
    req: FireworksCreateEvaluationJobRequest,
    signal?: AbortSignal
  ): Promise<FireworksEvaluationJob>;
  schema: z.ZodType;
}

interface FireworksUpdateSecretMethod {
  (
    accountId: string,
    secretId: string,
    req: FireworksUpdateSecretRequest,
    signal?: AbortSignal
  ): Promise<FireworksSecret>;
  schema: z.ZodType;
}

// RFT Jobs namespace types
interface FireworksRFTCreateMethod {
  (
    accountId: string,
    req: FireworksRFTCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksRFTJob>;
  schema: z.ZodType;
}

// RLOR Trainer Jobs namespace types
interface FireworksRlorTrainerJobCreateMethod {
  (
    accountId: string,
    req: FireworksRlorTrainerJobCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksRlorTrainerJob>;
  schema: z.ZodType;
}

interface FireworksRlorTrainerJobExecuteStepMethod {
  (
    accountId: string,
    jobId: string,
    req: FireworksRlorTrainerJobExecuteStepRequest,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  schema: z.ZodType;
}

// Error class
export class FireworksError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "FireworksError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// =============== Verb-Prefixed API Surface Types ===============

// POST v1 namespace types
interface FireworksPostV1ChatNamespace {
  completions: FireworksChatCompletionsMethod;
}

interface FireworksPostV1WorkflowsNamespace {
  textToImage: FireworksTextToImageMethod;
  kontext: FireworksKontextMethod;
  getResult: FireworksGetResultMethod;
}

interface FireworksPostV1AudioTranscriptionsMethod {
  (
    req: FireworksTranscriptionRequest,
    signal?: AbortSignal
  ): Promise<FireworksTranscriptionResponse>;
  schema: z.ZodType;
}

interface FireworksPostV1AudioTranslationsMethod {
  (
    req: FireworksTranslationRequest,
    signal?: AbortSignal
  ): Promise<FireworksTranslationResponse>;
  schema: z.ZodType;
}

interface FireworksPostV1AudioBatchNamespace {
  transcriptions: FireworksAudioBatchTranscriptionsMethod;
  translations: FireworksAudioBatchTranslationsMethod;
}

interface FireworksPostV1AudioNamespace {
  transcriptions: FireworksPostV1AudioTranscriptionsMethod;
  translations: FireworksPostV1AudioTranslationsMethod;
  batch: FireworksPostV1AudioBatchNamespace;
}

interface FireworksPostV1AccountsUsersNamespace {
  create: FireworksCreateUserMethod;
  update: FireworksUpdateUserMethod;
}

interface FireworksPostV1AccountsModelsNamespace {
  create: FireworksModelsCreateMethod;
  prepare: FireworksModelsPrepareMethod;
  getUploadEndpoint: FireworksModelsGetUploadEndpointMethod;
}

interface FireworksPostV1AccountsDeploymentsNamespace {
  create: FireworksCreateDeploymentMethod;
  undelete(
    accountId: string,
    deploymentId: string,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
}

interface FireworksPostV1AccountsDeployedModelsNamespace {
  create: FireworksCreateDeployedModelMethod;
}

interface FireworksPostV1AccountsApiKeysNamespace {
  create: FireworksCreateApiKeyMethod;
}

interface FireworksPostV1AccountsSecretsNamespace {
  create: FireworksCreateSecretMethod;
}

interface FireworksPostV1AccountsDatasetsNamespace {
  create: FireworksDatasetCreateMethod;
  getUploadEndpoint: FireworksDatasetGetUploadEndpointMethod;
  validateUpload: FireworksDatasetValidateUploadMethod;
}

interface FireworksPostV1AccountsBatchInferenceJobsNamespace {
  create: FireworksBatchJobCreateMethod;
}

interface FireworksPostV1AccountsSupervisedFineTuningJobsNamespace {
  create: FireworksSFTCreateMethod;
  resume(
    req: FireworksSFTResumeRequest,
    signal?: AbortSignal
  ): Promise<FireworksSFTJob>;
}

interface FireworksPostV1AccountsDpoJobsNamespace {
  create: FireworksDpoJobCreateMethod;
  resume(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksDpoJob>;
}

interface FireworksPostV1AccountsEvaluatorsNamespace {
  create: FireworksCreateEvaluatorMethod;
  getUploadEndpoint: FireworksGetUploadEndpointEvaluatorMethod;
  validateUpload(
    accountId: string,
    evaluatorId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}

interface FireworksPostV1AccountsEvaluationJobsNamespace {
  create: FireworksCreateEvaluationJobMethod;
}

interface FireworksPostV1AccountsRFTNamespace {
  create: FireworksRFTCreateMethod;
  resume(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksRFTJob>;
}

interface FireworksPostV1AccountsRlorTrainerJobsNamespace {
  create: FireworksRlorTrainerJobCreateMethod;
  executeTrainStep: FireworksRlorTrainerJobExecuteStepMethod;
  resume(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksRlorTrainerJob>;
}

interface FireworksPostV1AccountsNamespace {
  users: FireworksPostV1AccountsUsersNamespace;
  models: FireworksPostV1AccountsModelsNamespace;
  deployments: FireworksPostV1AccountsDeploymentsNamespace;
  deployedModels: FireworksPostV1AccountsDeployedModelsNamespace;
  apiKeys: FireworksPostV1AccountsApiKeysNamespace;
  secrets: FireworksPostV1AccountsSecretsNamespace;
  datasets: FireworksPostV1AccountsDatasetsNamespace;
  batchInferenceJobs: FireworksPostV1AccountsBatchInferenceJobsNamespace;
  supervisedFineTuningJobs: FireworksPostV1AccountsSupervisedFineTuningJobsNamespace;
  dpoJobs: FireworksPostV1AccountsDpoJobsNamespace;
  evaluators: FireworksPostV1AccountsEvaluatorsNamespace;
  evaluationJobs: FireworksPostV1AccountsEvaluationJobsNamespace;
  reinforcementFineTuningJobs: FireworksPostV1AccountsRFTNamespace;
  rlorTrainerJobs: FireworksPostV1AccountsRlorTrainerJobsNamespace;
}

interface FireworksPostV1Namespace {
  chat: FireworksPostV1ChatNamespace;
  completions: FireworksCompletionsMethod;
  embeddings: FireworksEmbeddingsMethod;
  rerank: FireworksRerankMethod;
  messages: FireworksMessagesMethod;
  workflows: FireworksPostV1WorkflowsNamespace;
  audio: FireworksPostV1AudioNamespace;
  accounts: FireworksPostV1AccountsNamespace;
}

interface FireworksPostStreamV1Namespace {
  chat: {
    completions: FireworksChatCompletionsStreamMethod;
  };
  completions: FireworksCompletionsStreamMethod;
  messages: FireworksMessagesStreamMethod;
}

interface FireworksPostNamespace {
  inference: { v1: FireworksPostV1Namespace };
  stream: {
    inference: { v1: FireworksPostStreamV1Namespace };
  };
}

// GET v1 namespace types
interface FireworksGetV1AccountsUsersNamespace {
  list(
    accountId: string,
    params?: FireworksListUsersRequest,
    signal?: AbortSignal
  ): Promise<FireworksListUsersResponse>;
  get(
    accountId: string,
    userId: string,
    params?: FireworksGetUserRequest,
    signal?: AbortSignal
  ): Promise<FireworksUser>;
}

interface FireworksGetV1AccountsApiKeysNamespace {
  list(
    accountId: string,
    userId: string,
    params?: FireworksListApiKeysRequest,
    signal?: AbortSignal
  ): Promise<FireworksListApiKeysResponse>;
}

interface FireworksGetV1AccountsSecretsNamespace {
  list(
    accountId: string,
    params?: FireworksListSecretsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListSecretsResponse>;
  get(
    accountId: string,
    secretId: string,
    params?: { readMask?: string },
    signal?: AbortSignal
  ): Promise<FireworksSecret>;
}

interface FireworksGetV1AccountsModelsNamespace {
  list(
    accountId: string,
    req?: FireworksListModelsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListModelsResponse>;
  get(
    accountId: string,
    modelId: string,
    req?: FireworksGetModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
  getDownloadEndpoint(
    accountId: string,
    modelId: string,
    req?: FireworksGetDownloadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetDownloadEndpointResponse>;
  validateUpload(
    accountId: string,
    modelId: string,
    req?: FireworksValidateUploadRequest,
    signal?: AbortSignal
  ): Promise<FireworksValidateUploadResponse>;
}

interface FireworksGetV1AccountsDatasetsNamespace {
  list(
    accountId: string,
    params?: FireworksListDatasetsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListDatasetsResponse>;
  get(
    accountId: string,
    datasetId: string,
    req?: FireworksGetDatasetRequest,
    signal?: AbortSignal
  ): Promise<FireworksDataset>;
  getDownloadEndpoint(
    accountId: string,
    datasetId: string,
    req?: FireworksDatasetGetDownloadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksDatasetGetDownloadEndpointResponse>;
}

interface FireworksGetV1AccountsBatchInferenceJobsNamespace {
  list(
    accountId: string,
    req?: FireworksBatchJobListRequest,
    signal?: AbortSignal
  ): Promise<FireworksBatchJobListResponse>;
  get(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksBatchJob>;
}

interface FireworksGetV1AccountsSFTNamespace {
  list(
    req: FireworksSFTListRequest,
    signal?: AbortSignal
  ): Promise<FireworksSFTListResponse>;
  get(
    req: FireworksSFTGetRequest,
    signal?: AbortSignal
  ): Promise<FireworksSFTJob>;
}

interface FireworksGetV1AccountsDeploymentsNamespace {
  list(
    accountId: string,
    params?: FireworksListDeploymentsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListDeploymentsResponse>;
  get(
    accountId: string,
    deploymentId: string,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
}

interface FireworksGetV1AccountsDeploymentShapesVersionsNamespace {
  list(
    accountId: string,
    shapeId: string,
    params?: FireworksListDeploymentShapeVersionsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListDeploymentShapeVersionsResponse>;
  get(
    accountId: string,
    shapeId: string,
    versionId: string,
    params?: FireworksGetDeploymentShapeVersionRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeploymentShapeVersion>;
}

interface FireworksGetV1AccountsDeploymentShapesNamespace {
  get(
    accountId: string,
    shapeId: string,
    params?: FireworksGetDeploymentShapeRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeploymentShape>;
  versions: FireworksGetV1AccountsDeploymentShapesVersionsNamespace;
}

interface FireworksGetV1AccountsDeployedModelsNamespace {
  list(
    accountId: string,
    params?: FireworksListDeployedModelsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListDeployedModelsResponse>;
  get(
    accountId: string,
    deployedModelId: string,
    params?: FireworksGetDeployedModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeployedModel>;
}

interface FireworksGetV1AccountsDpoJobsNamespace {
  list(
    accountId: string,
    req?: FireworksDpoJobListRequest,
    signal?: AbortSignal
  ): Promise<FireworksDpoJobListResponse>;
  get(
    accountId: string,
    jobId: string,
    req?: FireworksDpoJobGetRequest,
    signal?: AbortSignal
  ): Promise<FireworksDpoJob>;
  getMetricsFileEndpoint(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<FireworksMetricsFileEndpointResponse>;
}

interface FireworksGetV1AccountsEvaluatorsNamespace {
  list(
    accountId: string,
    params?: FireworksListEvaluatorsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListEvaluatorsResponse>;
  get(
    accountId: string,
    evaluatorId: string,
    params?: FireworksGetEvaluatorRequest,
    signal?: AbortSignal
  ): Promise<FireworksEvaluator>;
  getBuildLogEndpoint(
    accountId: string,
    evaluatorId: string,
    params?: FireworksGetBuildLogEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetBuildLogEndpointResponse>;
  getSourceCodeSignedUrl(
    accountId: string,
    evaluatorId: string,
    params?: FireworksGetSourceCodeSignedUrlRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetSourceCodeSignedUrlResponse>;
}

interface FireworksGetV1AccountsEvaluationJobsNamespace {
  list(
    accountId: string,
    params?: FireworksListEvaluationJobsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListEvaluationJobsResponse>;
  get(
    accountId: string,
    evaluationJobId: string,
    params?: FireworksGetEvaluationJobRequest,
    signal?: AbortSignal
  ): Promise<FireworksEvaluationJob>;
  getExecutionLogEndpoint(
    accountId: string,
    evaluationJobId: string,
    signal?: AbortSignal
  ): Promise<FireworksGetExecutionLogEndpointResponse>;
}

interface FireworksGetV1AccountsRFTNamespace {
  list(
    accountId: string,
    req?: FireworksRFTListRequest,
    signal?: AbortSignal
  ): Promise<FireworksRFTListResponse>;
  get(
    accountId: string,
    jobId: string,
    req?: FireworksRFTGetRequest,
    signal?: AbortSignal
  ): Promise<FireworksRFTJob>;
}

interface FireworksGetV1AccountsRlorTrainerJobsNamespace {
  list(
    accountId: string,
    req?: FireworksRlorTrainerJobListRequest,
    signal?: AbortSignal
  ): Promise<FireworksRlorTrainerJobListResponse>;
  get(
    accountId: string,
    jobId: string,
    req?: FireworksRlorTrainerJobGetRequest,
    signal?: AbortSignal
  ): Promise<FireworksRlorTrainerJob>;
}

interface FireworksGetV1AccountsNamespace {
  list(
    params?: FireworksListAccountsRequest,
    signal?: AbortSignal
  ): Promise<FireworksListAccountsResponse>;
  get(
    accountId: string,
    params?: FireworksGetAccountRequest,
    signal?: AbortSignal
  ): Promise<FireworksAccount>;
  users: FireworksGetV1AccountsUsersNamespace;
  apiKeys: FireworksGetV1AccountsApiKeysNamespace;
  secrets: FireworksGetV1AccountsSecretsNamespace;
  models: FireworksGetV1AccountsModelsNamespace;
  datasets: FireworksGetV1AccountsDatasetsNamespace;
  batchInferenceJobs: FireworksGetV1AccountsBatchInferenceJobsNamespace;
  supervisedFineTuningJobs: FireworksGetV1AccountsSFTNamespace;
  deployments: FireworksGetV1AccountsDeploymentsNamespace;
  deploymentShapes: FireworksGetV1AccountsDeploymentShapesNamespace;
  deployedModels: FireworksGetV1AccountsDeployedModelsNamespace;
  dpoJobs: FireworksGetV1AccountsDpoJobsNamespace;
  evaluators: FireworksGetV1AccountsEvaluatorsNamespace;
  evaluationJobs: FireworksGetV1AccountsEvaluationJobsNamespace;
  reinforcementFineTuningJobs: FireworksGetV1AccountsRFTNamespace;
  rlorTrainerJobs: FireworksGetV1AccountsRlorTrainerJobsNamespace;
}

interface FireworksGetV1AudioBatchNamespace {
  get(
    accountId: string,
    batchId: string,
    signal?: AbortSignal
  ): Promise<FireworksAudioBatchJob>;
}

interface FireworksGetV1AudioNamespace {
  batch: FireworksGetV1AudioBatchNamespace;
}

interface FireworksGetV1Namespace {
  accounts: FireworksGetV1AccountsNamespace;
  audio: FireworksGetV1AudioNamespace;
}

interface FireworksGetNamespace {
  inference: { v1: FireworksGetV1Namespace };
}

// PATCH v1 namespace types
interface FireworksPatchV1AccountsUsersNamespace {
  update: FireworksUpdateUserMethod;
}

interface FireworksPatchV1AccountsModelsNamespace {
  update: FireworksModelsUpdateMethod;
}

interface FireworksPatchV1AccountsDatasetsNamespace {
  update: FireworksDatasetUpdateMethod;
}

interface FireworksPatchV1AccountsDeploymentsNamespace {
  update: FireworksUpdateDeploymentMethod;
  scale: FireworksScaleDeploymentMethod;
}

interface FireworksPatchV1AccountsDeployedModelsNamespace {
  update: FireworksUpdateDeployedModelMethod;
}

interface FireworksPatchV1AccountsSecretsNamespace {
  update: FireworksUpdateSecretMethod;
}

interface FireworksPatchV1AccountsEvaluatorsNamespace {
  update: FireworksUpdateEvaluatorMethod;
}

interface FireworksPatchV1AccountsNamespace {
  users: FireworksPatchV1AccountsUsersNamespace;
  models: FireworksPatchV1AccountsModelsNamespace;
  datasets: FireworksPatchV1AccountsDatasetsNamespace;
  deployments: FireworksPatchV1AccountsDeploymentsNamespace;
  deployedModels: FireworksPatchV1AccountsDeployedModelsNamespace;
  secrets: FireworksPatchV1AccountsSecretsNamespace;
  evaluators: FireworksPatchV1AccountsEvaluatorsNamespace;
}

interface FireworksPatchV1Namespace {
  accounts: FireworksPatchV1AccountsNamespace;
}

interface FireworksPatchNamespace {
  inference: { v1: FireworksPatchV1Namespace };
}

// DELETE v1 namespace types
interface FireworksDeleteV1AccountsApiKeysNamespace {
  delete: FireworksDeleteApiKeyMethod;
}

interface FireworksDeleteV1AccountsSecretsNamespace {
  delete(
    accountId: string,
    secretId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
}

interface FireworksDeleteV1AccountsModelsNamespace {
  delete: FireworksModelsDeleteMethod;
}

interface FireworksDeleteV1AccountsDatasetsNamespace {
  delete(
    accountId: string,
    datasetId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}

interface FireworksDeleteV1AccountsBatchInferenceJobsNamespace {
  delete(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
}

interface FireworksDeleteV1AccountsSFTNamespace {
  delete: FireworksSFTDeleteMethod;
}

interface FireworksDeleteV1AccountsDeploymentsNamespace {
  delete(
    accountId: string,
    deploymentId: string,
    options?: FireworksDeleteDeploymentOptions,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}

interface FireworksDeleteV1AccountsDeployedModelsNamespace {
  delete(
    accountId: string,
    deployedModelId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}

interface FireworksDeleteV1AccountsDpoJobsNamespace {
  delete(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
}

interface FireworksDeleteV1AccountsEvaluatorsNamespace {
  delete(
    accountId: string,
    evaluatorId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}

interface FireworksDeleteV1AccountsEvaluationJobsNamespace {
  delete(
    accountId: string,
    evaluationJobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}

interface FireworksDeleteV1AccountsRFTNamespace {
  delete(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
}

interface FireworksDeleteV1AccountsRlorTrainerJobsNamespace {
  delete(
    accountId: string,
    jobId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
}

interface FireworksDeleteV1AccountsNamespace {
  apiKeys: FireworksDeleteV1AccountsApiKeysNamespace;
  secrets: FireworksDeleteV1AccountsSecretsNamespace;
  models: FireworksDeleteV1AccountsModelsNamespace;
  datasets: FireworksDeleteV1AccountsDatasetsNamespace;
  batchInferenceJobs: FireworksDeleteV1AccountsBatchInferenceJobsNamespace;
  supervisedFineTuningJobs: FireworksDeleteV1AccountsSFTNamespace;
  deployments: FireworksDeleteV1AccountsDeploymentsNamespace;
  deployedModels: FireworksDeleteV1AccountsDeployedModelsNamespace;
  dpoJobs: FireworksDeleteV1AccountsDpoJobsNamespace;
  evaluators: FireworksDeleteV1AccountsEvaluatorsNamespace;
  evaluationJobs: FireworksDeleteV1AccountsEvaluationJobsNamespace;
  reinforcementFineTuningJobs: FireworksDeleteV1AccountsRFTNamespace;
  rlorTrainerJobs: FireworksDeleteV1AccountsRlorTrainerJobsNamespace;
}

interface FireworksDeleteV1Namespace {
  accounts: FireworksDeleteV1AccountsNamespace;
}

interface FireworksDeleteNamespace {
  inference: { v1: FireworksDeleteV1Namespace };
}

// WS (WebSocket) v1 namespace types
interface FireworksWsV1AudioTranscriptionsNamespace {
  streaming: FireworksStreamingTranscriptionsMethod;
}

interface FireworksWsV1AudioNamespace {
  transcriptions: FireworksWsV1AudioTranscriptionsNamespace;
}

interface FireworksWsV1Namespace {
  audio: FireworksWsV1AudioNamespace;
}

interface FireworksWsNamespace {
  inference: { v1: FireworksWsV1Namespace };
}
