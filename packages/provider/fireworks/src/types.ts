// Fireworks AI provider options
export interface FireworksOptions {
  apiKey: string;
  baseURL?: string;
  audioBaseURL?: string;
  audioStreamingBaseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  WebSocket?: new (
    url: string | URL,
    protocols?: string | string[]
  ) => WebSocket;
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

// Audio streaming transcription (WebSocket)

export interface FireworksStreamingTranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
  response_format?: "verbose_json";
  timestamp_granularities?: string[];
  baseURL?: string;
}

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
  | FireworksStreamingOutputTraceEvent
  | FireworksStreamingCheckpointEvent;

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

// Audio batch processing types

export interface FireworksAudioBatchTranscriptionRequest {
  file: Blob | string;
  endpoint_id: string;
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

export interface FireworksAudioBatchTranslationRequest {
  file: Blob | string;
  endpoint_id: string;
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

export interface FireworksAudioBatchSubmitResponse {
  batch_id: string;
}

export type FireworksAudioBatchJobStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

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
  | "US_OHIO_1"
  | "US_NEWYORK_1";

// Base training config (shared across SFT, DPO, RFT)
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
  | "ORPO"
  | "GSPO_TOKEN";

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

export interface FireworksDpoJobCreateRequest {
  dataset: string;
  displayName?: string;
  trainingConfig?: FireworksBaseTrainingConfig;
  lossConfig?: FireworksRLLossConfig;
  wandbConfig?: FireworksWandbConfig;
  awsS3Config?: FireworksAwsS3Config;
  azureBlobStorageConfig?: FireworksAzureBlobStorageConfig;
}

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
  | "BUILDING"
  | "BUILD_FAILED";

export type FireworksEvaluatorSourceType =
  | "TYPE_UNSPECIFIED"
  | "TYPE_UPLOAD"
  | "TYPE_GITHUB"
  | "TYPE_TEMPORARY";

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

export interface FireworksCreateEvaluatorRequest {
  evaluatorId?: string;
  evaluator: {
    displayName?: string;
    description?: string;
    requirements?: string;
    entryPoint?: string;
    commitHash?: string;
    defaultDataset?: string;
    criteria?: FireworksCriterion[];
    source?: FireworksEvaluatorSource;
  };
}

export interface FireworksUpdateEvaluatorRequest {
  displayName?: string;
  description?: string;
  requirements?: string;
  entryPoint?: string;
  commitHash?: string;
  defaultDataset?: string;
  criteria?: FireworksCriterion[];
  source?: FireworksEvaluatorSource;
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

export interface FireworksGetUploadEndpointEvaluatorRequest {
  filenameToSize: Record<string, string>;
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
  | "JOB_STATE_EARLY_STOPPED"
  | "JOB_STATE_PAUSED";

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

export interface FireworksCreateEvaluationJobRequest {
  evaluationJobId?: string;
  leaderboardIds?: string[];
  evaluationJob: {
    displayName?: string;
    evaluator: string;
    inputDataset: string;
    outputDataset: string;
    outputStats?: string;
    awsS3Config?: FireworksAwsS3Config;
  };
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

export interface FireworksRFTCreateRequest {
  dataset: string;
  evaluator: string;
  displayName?: string;
  trainingConfig?: FireworksBaseTrainingConfig;
  inferenceParams?: FireworksRFTInferenceParams;
  lossConfig?: FireworksRLLossConfig;
  wandbConfig?: FireworksWandbConfig;
  awsS3Config?: FireworksAwsS3Config;
  azureBlobStorageConfig?: FireworksAzureBlobStorageConfig;
  reinforcementFineTuningJobId?: string;
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

export interface FireworksRlorTrainerJobCreateRequest {
  dataset: string;
  evaluator: string;
  displayName?: string;
  trainingConfig?: FireworksBaseTrainingConfig;
  inferenceParams?: FireworksRFTInferenceParams;
  lossConfig?: FireworksRLLossConfig;
  rewardWeights?: FireworksRlorRewardWeight[];
  wandbConfig?: FireworksWandbConfig;
  awsS3Config?: FireworksAwsS3Config;
  azureBlobStorageConfig?: FireworksAzureBlobStorageConfig;
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

export interface FireworksRlorTrainerJobExecuteStepRequest {
  dataset: string;
  outputModel: string;
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
interface FireworksChatCompletionsStreamMethod {
  (
    req: FireworksChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<FireworksChatStreamChunk>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksChatCompletionsMethod {
  (
    req: FireworksChatRequest,
    signal?: AbortSignal
  ): Promise<FireworksChatResponse>;
  stream: FireworksChatCompletionsStreamMethod;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksChatNamespace {
  completions: FireworksChatCompletionsMethod;
}

interface FireworksCompletionsStreamMethod {
  (
    req: FireworksCompletionRequest,
    signal?: AbortSignal
  ): AsyncIterable<FireworksCompletionStreamChunk>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksCompletionsMethod {
  (
    req: FireworksCompletionRequest,
    signal?: AbortSignal
  ): Promise<FireworksCompletionResponse>;
  stream: FireworksCompletionsStreamMethod;
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

interface FireworksStreamingTranscriptionsMethod {
  (
    opts?: FireworksStreamingTranscriptionOptions
  ): FireworksStreamingTranscriptionSession;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksTranscriptionsMethod {
  (
    req: FireworksTranscriptionRequest,
    signal?: AbortSignal
  ): Promise<FireworksTranscriptionResponse>;
  streaming: FireworksStreamingTranscriptionsMethod;
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
  batch: FireworksAudioBatchNamespace;
}

interface FireworksAudioBatchTranscriptionsMethod {
  (
    req: FireworksAudioBatchTranscriptionRequest,
    signal?: AbortSignal
  ): Promise<FireworksAudioBatchSubmitResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksAudioBatchTranslationsMethod {
  (
    req: FireworksAudioBatchTranslationRequest,
    signal?: AbortSignal
  ): Promise<FireworksAudioBatchSubmitResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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
  | "STATE_UNSPECIFIED"
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

export type FireworksDeploymentState =
  | "STATE_UNSPECIFIED"
  | "CREATING"
  | "READY"
  | "DELETING"
  | "FAILED"
  | "UPDATING"
  | "DELETED";

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
  | "AMD_MI325X_256GB"
  | "AMD_MI350X_288GB";

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

export interface FireworksCreateDeploymentRequest {
  baseModel: string;
  displayName?: string;
  description?: string;
  minReplicaCount?: number;
  maxReplicaCount?: number;
  maxWithRevocableReplicaCount?: number;
  autoscalingPolicy?: FireworksAutoscalingPolicy;
  acceleratorCount?: number;
  acceleratorType?: FireworksAcceleratorType;
  precision?: FireworksDeploymentPrecision;
  enableAddons?: boolean;
  draftTokenCount?: number;
  draftModel?: string;
  ngramSpeculationLength?: number;
  enableSessionAffinity?: boolean;
  maxContextLength?: number;
  deploymentShape?: string;
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

export interface FireworksUpdateDeploymentRequest {
  baseModel?: string;
  displayName?: string;
  description?: string;
  minReplicaCount?: number;
  maxReplicaCount?: number;
  maxWithRevocableReplicaCount?: number;
  autoscalingPolicy?: FireworksAutoscalingPolicy;
  acceleratorCount?: number;
  acceleratorType?: FireworksAcceleratorType;
  precision?: FireworksDeploymentPrecision;
  enableAddons?: boolean;
  maxContextLength?: number;
  deploymentShape?: string;
}

export interface FireworksScaleDeploymentRequest {
  replicaCount: number;
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

export interface FireworksCreateDeployedModelRequest {
  displayName?: string;
  description?: string;
  model: string;
  deployment: string;
  default?: boolean;
  serverless?: boolean;
  public?: boolean;
}

export interface FireworksCreateDeployedModelOptions {
  replaceMergedAddon?: boolean;
}

export interface FireworksUpdateDeployedModelRequest {
  displayName?: string;
  description?: string;
  model?: string;
  deployment?: string;
  default?: boolean;
  serverless?: boolean;
  public?: boolean;
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
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksUpdateDeploymentMethod {
  (
    accountId: string,
    deploymentId: string,
    req: FireworksUpdateDeploymentRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeployment>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksScaleDeploymentMethod {
  (
    accountId: string,
    deploymentId: string,
    req: FireworksScaleDeploymentRequest,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

// Dataset types

export type FireworksDatasetState = "STATE_UNSPECIFIED" | "UPLOADING" | "READY";

export type FireworksDatasetFormat =
  | "FORMAT_UNSPECIFIED"
  | "CHAT"
  | "COMPLETION"
  | "RL";

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

export interface FireworksCreateDatasetRequest {
  dataset: Partial<FireworksDataset>;
  datasetId: string;
  sourceDatasetId?: string;
  filter?: string;
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

export interface FireworksUpdateDatasetRequest {
  displayName?: string;
  exampleCount?: number;
  userUploaded?: Record<string, unknown>;
  evaluationResult?: FireworksDatasetEvaluationResult;
  transformed?: FireworksDatasetTransformed;
  splitted?: FireworksDatasetSplitted;
  evalProtocol?: Record<string, unknown>;
  externalUrl?: string;
  format?: FireworksDatasetFormat;
  sourceJobName?: string;
}

export interface FireworksDatasetGetUploadEndpointRequest {
  filenameToSize: Record<string, number>;
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

export interface FireworksDatasetValidateUploadRequest {
  [key: string]: unknown;
}

// Dataset namespace types

interface FireworksDatasetCreateMethod {
  (
    accountId: string,
    req: FireworksCreateDatasetRequest,
    signal?: AbortSignal
  ): Promise<FireworksDataset>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksDatasetUpdateMethod {
  (
    accountId: string,
    datasetId: string,
    req: FireworksUpdateDatasetRequest,
    signal?: AbortSignal
  ): Promise<FireworksDataset>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksDatasetGetUploadEndpointMethod {
  (
    accountId: string,
    datasetId: string,
    req: FireworksDatasetGetUploadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksDatasetGetUploadEndpointResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksDatasetGetDownloadEndpointMethod {
  (
    accountId: string,
    datasetId: string,
    req?: FireworksDatasetGetDownloadEndpointRequest,
    signal?: AbortSignal
  ): Promise<FireworksDatasetGetDownloadEndpointResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksDatasetValidateUploadMethod {
  (
    accountId: string,
    datasetId: string,
    req?: FireworksDatasetValidateUploadRequest,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

// Deployed Models namespace types
interface FireworksCreateDeployedModelMethod {
  (
    accountId: string,
    req: FireworksCreateDeployedModelRequest,
    options?: FireworksCreateDeployedModelOptions,
    signal?: AbortSignal
  ): Promise<FireworksDeployedModel>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksUpdateDeployedModelMethod {
  (
    accountId: string,
    deployedModelId: string,
    req: FireworksUpdateDeployedModelRequest,
    signal?: AbortSignal
  ): Promise<FireworksDeployedModel>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

// DPO Jobs namespace types
interface FireworksDpoJobCreateMethod {
  (
    accountId: string,
    req: FireworksDpoJobCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksDpoJob>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

// Account types

export type FireworksAccountType = "ACCOUNT_TYPE_UNSPECIFIED" | "ENTERPRISE";

export type FireworksAccountState =
  | "STATE_UNSPECIFIED"
  | "CREATING"
  | "READY"
  | "UPDATING"
  | "DELETING";

export type FireworksAccountSuspendState =
  | "UNSUSPENDED"
  | "FAILED_PAYMENTS"
  | "CREDIT_DEPLETED"
  | "MONTHLY_SPEND_LIMIT_EXCEEDED"
  | "BLOCKED_BY_ABUSE_RULE";

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

export type FireworksUserRole =
  | "admin"
  | "user"
  | "contributor"
  | "inference-user";

export type FireworksUserState =
  | "STATE_UNSPECIFIED"
  | "CREATING"
  | "READY"
  | "UPDATING"
  | "DELETING";

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

export interface FireworksCreateUserRequest {
  displayName?: string;
  email?: string;
  role: FireworksUserRole;
  serviceAccount?: boolean;
}

export interface FireworksCreateUserOptions {
  userId?: string;
}

export interface FireworksGetUserRequest {
  readMask?: string;
}

export interface FireworksUpdateUserRequest {
  role: FireworksUserRole;
  displayName?: string;
  email?: string;
  serviceAccount?: boolean;
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

export interface FireworksCreateApiKeyRequest {
  apiKey: {
    displayName?: string;
    expireTime?: string;
  };
}

export interface FireworksDeleteApiKeyRequest {
  keyId: string;
}

// Secret types

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

export interface FireworksCreateSecretRequest {
  name?: string;
  keyName: string;
  value: string;
}

export interface FireworksUpdateSecretRequest {
  keyName: string;
  value?: string;
}

// Account management namespace types

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
}

interface FireworksCreateUserMethod {
  (
    accountId: string,
    req: FireworksCreateUserRequest,
    options?: FireworksCreateUserOptions,
    signal?: AbortSignal
  ): Promise<FireworksUser>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksUpdateUserMethod {
  (
    accountId: string,
    userId: string,
    req: FireworksUpdateUserRequest,
    signal?: AbortSignal
  ): Promise<FireworksUser>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

interface FireworksCreateApiKeyMethod {
  (
    accountId: string,
    userId: string,
    req: FireworksCreateApiKeyRequest,
    signal?: AbortSignal
  ): Promise<FireworksApiKey>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksDeleteApiKeyMethod {
  (
    accountId: string,
    userId: string,
    req: FireworksDeleteApiKeyRequest,
    signal?: AbortSignal
  ): Promise<Record<string, never>>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

interface FireworksCreateSecretMethod {
  (
    accountId: string,
    req: FireworksCreateSecretRequest,
    signal?: AbortSignal
  ): Promise<FireworksSecret>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

// Evaluators namespace types
interface FireworksCreateEvaluatorMethod {
  (
    accountId: string,
    req: FireworksCreateEvaluatorRequest,
    signal?: AbortSignal
  ): Promise<FireworksEvaluator>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksUpdateEvaluatorMethod {
  (
    accountId: string,
    evaluatorId: string,
    req: FireworksUpdateEvaluatorRequest,
    options?: FireworksUpdateEvaluatorOptions,
    signal?: AbortSignal
  ): Promise<FireworksEvaluator>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksGetUploadEndpointEvaluatorMethod {
  (
    accountId: string,
    evaluatorId: string,
    req: FireworksGetUploadEndpointEvaluatorRequest,
    signal?: AbortSignal
  ): Promise<FireworksGetUploadEndpointEvaluatorResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

// Evaluation Jobs namespace types
interface FireworksCreateEvaluationJobMethod {
  (
    accountId: string,
    req: FireworksCreateEvaluationJobRequest,
    signal?: AbortSignal
  ): Promise<FireworksEvaluationJob>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksUpdateSecretMethod {
  (
    accountId: string,
    secretId: string,
    req: FireworksUpdateSecretRequest,
    signal?: AbortSignal
  ): Promise<FireworksSecret>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

// RFT Jobs namespace types
interface FireworksRFTCreateMethod {
  (
    accountId: string,
    req: FireworksRFTCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksRFTJob>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

// RLOR Trainer Jobs namespace types
interface FireworksRlorTrainerJobCreateMethod {
  (
    accountId: string,
    req: FireworksRlorTrainerJobCreateRequest,
    signal?: AbortSignal
  ): Promise<FireworksRlorTrainerJob>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FireworksRlorTrainerJobExecuteStepMethod {
  (
    accountId: string,
    jobId: string,
    req: FireworksRlorTrainerJobExecuteStepRequest,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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
  models: FireworksModelsNamespace;
  datasets: FireworksDatasetsNamespace;
  supervisedFineTuningJobs: FireworksSFTNamespace;
  deployments: FireworksDeploymentsNamespace;
  deployedModels: FireworksDeployedModelsNamespace;
  deploymentShapes: FireworksDeploymentShapesNamespace;
  dpoJobs: FireworksDpoJobsNamespace;
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
  evaluators: FireworksEvaluatorsNamespace;
  evaluationJobs: FireworksEvaluationJobsNamespace;
  reinforcementFineTuningJobs: FireworksRFTNamespace;
  rlorTrainerJobs: FireworksRlorTrainerJobsNamespace;
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
