// Fireworks AI provider options
export interface FireworksOptions {
  apiKey: string;
  baseURL?: string;
  audioBaseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

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
export interface FireworksChatRequest {
  model: string;
  messages: FireworksMessage[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  n?: number;
  stop?: string | string[];
  stream?: boolean;
  tools?: FireworksTool[];
  tool_choice?:
    | "auto"
    | "none"
    | "required"
    | { type: "function"; function: { name: string } };
  response_format?: {
    type: "text" | "json_object" | "json_schema" | "grammar";
    json_schema?: Record<string, unknown>;
    grammar?: Record<string, unknown>;
  };
  frequency_penalty?: number;
  presence_penalty?: number;
  logprobs?: boolean;
  top_logprobs?: number;
  reasoning_effort?: "low" | "medium" | "high" | "none";
  user?: string;
}

// Chat response
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

// Completions request
export interface FireworksCompletionRequest {
  model: string;
  prompt: string | string[] | number[] | number[][];
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  n?: number;
  stop?: string | string[];
  stream?: boolean;
  echo?: boolean;
  echo_last?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  logprobs?: boolean | number;
  top_logprobs?: number;
  response_format?: {
    type: "text" | "json_object" | "json_schema" | "grammar";
    json_schema?: Record<string, unknown>;
    grammar?: Record<string, unknown>;
  };
  reasoning_effort?: "low" | "medium" | "high" | "none";
  seed?: number;
  user?: string;
}

// Completions response
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

export type AnthropicImageSource =
  | AnthropicBase64ImageSource
  | AnthropicUrlImageSource;

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
  | AnthropicToolUseBlock
  | AnthropicToolResultBlock;

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

export interface AnthropicMessagesRequest {
  model: string;
  messages: AnthropicInputMessage[];
  max_tokens?: number;
  system?: string | { type: "text"; text: string }[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  metadata?: { user_id?: string };
  thinking?: AnthropicThinkingConfig;
  tools?: AnthropicToolDefinition[];
  tool_choice?:
    | { type: "auto"; disable_parallel_tool_use?: boolean }
    | { type: "any"; disable_parallel_tool_use?: boolean }
    | { type: "none" }
    | {
        type: "tool";
        name: string;
        disable_parallel_tool_use?: boolean;
      };
  raw_output?: boolean;
}

export type AnthropicResponseContentBlock =
  | AnthropicTextBlock
  | AnthropicThinkingBlock
  | AnthropicRedactedThinkingBlock
  | AnthropicToolUseBlock;

export type AnthropicStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "tool_use"
  | "pause_turn"
  | "refusal";

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
export interface FireworksEmbeddingRequest {
  model: string;
  input: string | string[] | number[] | number[][];
  dimensions?: number;
  prompt_template?: string;
  return_logits?: number[];
  normalize?: boolean;
}

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
export interface FireworksRerankRequest {
  model: string;
  query: string;
  documents: string[];
  top_n?: number;
  return_documents?: boolean;
}

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
export interface FireworksTranscriptionRequest {
  file: Blob | string;
  model?: string;
  vad_model?: "silero" | "whisperx-pyannet";
  alignment_model?: "mms_fa" | "tdnn_ffn";
  language?: string;
  prompt?: string;
  temperature?: number | number[];
  response_format?: "json" | "text" | "srt" | "verbose_json" | "vtt";
  timestamp_granularities?: string | string[];
  diarize?: "true" | "false";
  min_speakers?: number;
  max_speakers?: number;
  preprocessing?: "none" | "dynamic" | "soft_dynamic" | "bass_dynamic";
}

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
export interface FireworksTranslationRequest {
  file: Blob | string;
  model?: string;
  vad_model?: "silero" | "whisperx-pyannet";
  alignment_model?: "mms_fa" | "tdnn_ffn";
  language?: string;
  prompt?: string;
  temperature?: number | number[];
  response_format?: "json" | "text" | "srt" | "verbose_json" | "vtt";
  timestamp_granularities?: string | string[];
  preprocessing?: "none" | "dynamic" | "soft_dynamic" | "bass_dynamic";
}

// Audio translation response
export interface FireworksTranslationResponse {
  text: string;
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

export interface FireworksSFTCreateRequest {
  accountId: string;
  dataset: string;
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
  supervisedFineTuningJobId?: string;
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
  | "JOB_STATE_EARLY_STOPPED"
  | "JOB_STATE_PAUSED";

export interface FireworksBatchJobCreateRequest {
  model: string;
  inputDatasetId: string;
  displayName?: string;
  outputDatasetId?: string;
  inferenceParameters?: FireworksBatchInferenceParameters;
  precision?: string;
  continuedFromJobName?: string;
}

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

// Payload schema types
export interface PayloadFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
  items?: PayloadFieldSchema;
  properties?: Record<string, PayloadFieldSchema>;
}

export interface PayloadSchema {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  contentType: "application/json" | "multipart/form-data";
  fields: Record<string, PayloadFieldSchema>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Namespace types
interface FireworksChatCompletionsMethod {
  (
    req: FireworksChatRequest,
    signal?: AbortSignal
  ): Promise<FireworksChatResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksChatNamespace {
  completions: FireworksChatCompletionsMethod;
}

interface FireworksCompletionsMethod {
  (
    req: FireworksCompletionRequest,
    signal?: AbortSignal
  ): Promise<FireworksCompletionResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksEmbeddingsMethod {
  (
    req: FireworksEmbeddingRequest,
    signal?: AbortSignal
  ): Promise<FireworksEmbeddingResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksRerankMethod {
  (
    req: FireworksRerankRequest,
    signal?: AbortSignal
  ): Promise<FireworksRerankResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksMessagesStreamMethod {
  (
    req: AnthropicMessagesRequest,
    signal?: AbortSignal
  ): AsyncIterable<AnthropicStreamEvent>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksMessagesMethod {
  (
    req: AnthropicMessagesRequest,
    signal?: AbortSignal
  ): Promise<AnthropicMessagesResponse>;
  stream: FireworksMessagesStreamMethod;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksTranscriptionsMethod {
  (
    req: FireworksTranscriptionRequest,
    signal?: AbortSignal
  ): Promise<FireworksTranscriptionResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksTranslationsMethod {
  (
    req: FireworksTranslationRequest,
    signal?: AbortSignal
  ): Promise<FireworksTranslationResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksAudioNamespace {
  transcriptions: FireworksTranscriptionsMethod;
  translations: FireworksTranslationsMethod;
}

interface FireworksBatchJobCreateMethod {
  (
    accountId: string,
    req: FireworksBatchJobCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksBatchJob>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

interface FireworksSFTCreateMethod {
  (
    req: FireworksSFTCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksSFTJob>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

interface FireworksSFTDeleteMethod {
  (
    req: FireworksSFTDeleteRequest,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
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

interface FireworksAccountsNamespace {
  batchInferenceJobs: FireworksBatchInferenceJobsNamespace;
  supervisedFineTuningJobs: FireworksSFTNamespace;
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
  v1: FireworksV1Namespace;
}

// Text-to-image request (synchronous FLUX schnell/dev)
export interface FireworksTextToImageRequest {
  prompt: string;
  aspect_ratio?:
    | "1:1"
    | "21:9"
    | "16:9"
    | "3:2"
    | "5:4"
    | "4:5"
    | "2:3"
    | "9:16"
    | "9:21"
    | "4:3"
    | "3:4";
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
}

// Text-to-image JSON response
export interface FireworksTextToImageResponse {
  id: string;
  base64: string[];
  finishReason: "SUCCESS" | "CONTENT_FILTERED";
  seed: number;
}

// Kontext async request (FLUX Kontext Pro/Max)
export interface FireworksKontextRequest {
  prompt: string;
  input_image?: string | null;
  seed?: number | null;
  aspect_ratio?: string | null;
  output_format?: "png" | "jpeg";
  webhook_url?: string | null;
  webhook_secret?: string | null;
  prompt_upsampling?: boolean;
  safety_tolerance?: number;
}

// Kontext async create response
export interface FireworksKontextResponse {
  request_id: string;
}

// Kontext get_result request
export interface FireworksGetResultRequest {
  id: string;
}

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
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksKontextMethod {
  (
    model: string,
    req: FireworksKontextRequest,
    signal?: AbortSignal
  ): Promise<FireworksKontextResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksGetResultMethod {
  (
    model: string,
    req: FireworksGetResultRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetResultResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksWorkflowsNamespace {
  textToImage: FireworksTextToImageMethod;
  kontext: FireworksKontextMethod;
  getResult: FireworksGetResultMethod;
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
  | "EMBEDDING_MODEL"
  | "SNAPSHOT_MODEL";

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
  | "FP4_BLOCKSCALED_MM"
  | "FP4_MX_MOE";

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
  | "UNAVAILABLE"
  | "DATA_LOSS";

export type FireworksCheckpointFormat =
  | "NATIVE"
  | "HUGGINGFACE"
  | "UNINITIALIZED";

export type FireworksDeployedModelState =
  | "UNDEPLOYING"
  | "DEPLOYING"
  | "DEPLOYED"
  | "UPDATING";

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

export interface FireworksCreateModelRequest {
  modelId: string;
  model: FireworksModel;
  cluster?: string;
}

export interface FireworksGetModelRequest {
  readMask?: string;
}

export interface FireworksUpdateModelRequest {
  displayName?: string;
  description?: string;
  kind?: FireworksModelKind;
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
}

export interface FireworksPrepareModelRequest {
  precision: FireworksDeploymentPrecision;
  readMask?: string;
}

export interface FireworksGetUploadEndpointRequest {
  filenameToSize: Record<string, number>;
  enableResumableUpload?: boolean;
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

export interface FireworksValidateUploadRequest {
  skipHfConfigValidation?: boolean;
  trustRemoteCode?: boolean;
  configOnly?: boolean;
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
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksModelsCreateMethod {
  (
    accountId: string,
    req: FireworksCreateModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksModelsGetMethod {
  (
    accountId: string,
    modelId: string,
    req?: FireworksGetModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksModelsUpdateMethod {
  (
    accountId: string,
    modelId: string,
    req: FireworksUpdateModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksModel>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksModelsDeleteMethod {
  (
    accountId: string,
    modelId: string,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksModelsPrepareMethod {
  (
    accountId: string,
    modelId: string,
    req: FireworksPrepareModelRequest,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksModelsGetUploadEndpointMethod {
  (
    accountId: string,
    modelId: string,
    req: FireworksGetUploadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetUploadEndpointResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksModelsGetDownloadEndpointMethod {
  (
    accountId: string,
    modelId: string,
    req?: FireworksGetDownloadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetDownloadEndpointResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksModelsValidateUploadMethod {
  (
    accountId: string,
    modelId: string,
    req?: FireworksValidateUploadRequest,
    signal?: AbortSignal
  ): Promise<FireworksValidateUploadResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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
}

interface FireworksAccountsNamespace {
  models: FireworksModelsNamespace;
  supervisedFineTuningJobs: FireworksSFTNamespace;
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
