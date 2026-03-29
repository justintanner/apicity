// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

export interface CohereOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

// ---------------------------------------------------------------------------
// Shared / Meta
// ---------------------------------------------------------------------------

export interface CohereMeta {
  api_version?: { version: string; is_deprecated?: boolean };
  billed_units?: Record<string, number>;
  tokens?: { input_tokens?: number; output_tokens?: number };
  warnings?: string[];
}

// ---------------------------------------------------------------------------
// Chat v2 (POST /v2/chat)
// ---------------------------------------------------------------------------

export interface CohereChatV2Message {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | CohereChatV2ContentBlock[];
  tool_call_id?: string;
  tool_calls?: CohereChatV2ToolCall[];
  citations?: CohereChatV2Citation[];
}

export interface CohereChatV2ContentBlock {
  type: "text" | "thinking";
  text: string;
}

export interface CohereChatV2ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface CohereChatV2Citation {
  start: number;
  end: number;
  text: string;
  sources: Record<string, unknown>[];
}

export interface CohereChatV2Tool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export interface CohereChatV2Document {
  id?: string;
  data: Record<string, string>;
}

export interface CohereChatV2ResponseFormat {
  type: "text" | "json_object";
  json_schema?: Record<string, unknown>;
}

export interface CohereChatV2Request {
  model: string;
  messages: CohereChatV2Message[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  seed?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  k?: number;
  p?: number;
  stop_sequences?: string[];
  logprobs?: boolean;
  tools?: CohereChatV2Tool[];
  strict_tools?: boolean;
  tool_choice?: "REQUIRED" | "NONE";
  documents?: CohereChatV2Document[];
  citation_options?: {
    mode?: "ENABLED" | "DISABLED" | "FAST" | "ACCURATE" | "OFF";
  };
  response_format?: CohereChatV2ResponseFormat;
  safety_mode?: "CONTEXTUAL" | "STRICT" | "OFF";
  thinking?: { enabled: boolean; budget_tokens?: number };
  priority?: number;
}

export interface CohereChatV2Usage {
  input_tokens: number;
  output_tokens: number;
  cached_tokens?: number;
}

export interface CohereLogprobItem {
  token: string;
  logprob: number;
  top_logprobs?: { token: string; logprob: number }[];
}

export interface CohereChatV2ResponseMessage {
  role: "assistant";
  content?: CohereChatV2ContentBlock[];
  tool_calls?: CohereChatV2ToolCall[];
  citations?: CohereChatV2Citation[];
}

export interface CohereChatV2Response {
  id: string;
  finish_reason:
    | "COMPLETE"
    | "STOP_SEQUENCE"
    | "MAX_TOKENS"
    | "TOOL_CALL"
    | "ERROR"
    | "TIMEOUT";
  message: CohereChatV2ResponseMessage;
  usage: CohereChatV2Usage;
  logprobs?: CohereLogprobItem[];
}

// ---------------------------------------------------------------------------
// Chat v1 (POST /v1/chat) — legacy
// ---------------------------------------------------------------------------

export interface CohereChatV1HistoryMessage {
  role: "USER" | "CHATBOT" | "SYSTEM";
  message: string;
}

export interface CohereChatV1Connector {
  id: string;
  user_access_token?: string;
  continue_on_failure?: boolean;
  options?: Record<string, unknown>;
}

export interface CohereChatV1ToolFunction {
  name: string;
  description?: string;
  parameter_definitions?: Record<
    string,
    {
      type: string;
      description?: string;
      required?: boolean;
    }
  >;
}

export interface CohereChatV1ToolResult {
  call: { name: string; parameters: Record<string, unknown> };
  outputs: Record<string, unknown>[];
}

export interface CohereChatV1Request {
  message: string;
  stream?: boolean;
  model?: string;
  preamble?: string;
  chat_history?: CohereChatV1HistoryMessage[];
  conversation_id?: string;
  temperature?: number;
  max_tokens?: number;
  max_input_tokens?: number;
  k?: number;
  p?: number;
  seed?: number;
  stop_sequences?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  documents?: Record<string, string>[];
  connectors?: CohereChatV1Connector[];
  prompt_truncation?: "OFF" | "AUTO" | "AUTO_PRESERVE_ORDER";
  citation_quality?: "ENABLED" | "DISABLED" | "FAST" | "ACCURATE";
  tools?: CohereChatV1ToolFunction[];
  tool_results?: CohereChatV1ToolResult[];
  force_single_step?: boolean;
  response_format?: {
    type: "text" | "json_object";
    schema?: Record<string, unknown>;
  };
  safety_mode?: "CONTEXTUAL" | "STRICT" | "NONE";
  raw_prompting?: boolean;
  search_queries_only?: boolean;
}

export interface CohereChatV1Citation {
  start: number;
  end: number;
  text: string;
  document_ids: string[];
}

export interface CohereChatV1SearchQuery {
  text: string;
  generation_id: string;
}

export interface CohereChatV1SearchResult {
  search_query: CohereChatV1SearchQuery;
  connector: { id: string };
  document_ids: string[];
}

export interface CohereChatV1ToolCallV1 {
  name: string;
  parameters: Record<string, unknown>;
}

export interface CohereChatV1Response {
  text: string;
  generation_id: string;
  response_id?: string;
  citations?: CohereChatV1Citation[];
  documents?: Record<string, string>[];
  search_queries?: CohereChatV1SearchQuery[];
  search_results?: CohereChatV1SearchResult[];
  tool_calls?: CohereChatV1ToolCallV1[];
  chat_history?: CohereChatV1HistoryMessage[];
  finish_reason?: string;
  meta?: CohereMeta;
}

// ---------------------------------------------------------------------------
// Embed v2 (POST /v2/embed)
// ---------------------------------------------------------------------------

export interface CohereEmbedInput {
  text?: string;
  image?: string;
}

export interface CohereEmbedRequest {
  model: string;
  input_type:
    | "search_document"
    | "search_query"
    | "classification"
    | "clustering"
    | "image";
  texts?: string[];
  images?: string[];
  inputs?: CohereEmbedInput[];
  max_tokens?: number;
  output_dimension?: number;
  embedding_types?: (
    | "float"
    | "int8"
    | "uint8"
    | "binary"
    | "ubinary"
    | "base64"
  )[];
  truncate?: "NONE" | "START" | "END";
  priority?: number;
}

export interface CohereEmbedImageMeta {
  width: number;
  height: number;
  format: string;
  bit_depth: number;
}

export interface CohereEmbedResponse {
  id: string;
  embeddings: {
    float?: number[][];
    int8?: number[][];
    uint8?: number[][];
    binary?: number[][];
    ubinary?: number[][];
    base64?: string[];
  };
  texts?: string[];
  images?: CohereEmbedImageMeta[];
  meta?: CohereMeta;
}

// ---------------------------------------------------------------------------
// Rerank (POST /v2/rerank)
// ---------------------------------------------------------------------------

export interface CohereRerankRequest {
  model: string;
  query: string;
  documents: string[];
  top_n?: number;
  max_tokens_per_doc?: number;
  priority?: number;
}

export interface CohereRerankResult {
  index: number;
  relevance_score: number;
}

export interface CohereRerankResponse {
  id: string;
  results: CohereRerankResult[];
  meta?: CohereMeta;
}

// ---------------------------------------------------------------------------
// Classify (POST /v1/classify)
// ---------------------------------------------------------------------------

export interface CohereClassifyExample {
  text: string;
  label: string;
}

export interface CohereClassifyRequest {
  inputs: string[];
  examples?: CohereClassifyExample[];
  model?: string;
  preset?: string;
  truncate?: "NONE" | "START" | "END";
}

export interface CohereClassifyLabelConfidence {
  confidence: number;
}

export interface CohereClassification {
  id: string;
  input: string;
  prediction: string;
  predictions: string[];
  confidence: number;
  confidences: number[];
  labels: Record<string, CohereClassifyLabelConfidence>;
  classification_type: "single-label" | "multi-label";
}

export interface CohereClassifyResponse {
  id: string;
  classifications: CohereClassification[];
  meta?: CohereMeta;
}

// ---------------------------------------------------------------------------
// Summarize (POST /v1/summarize) — deprecated
// ---------------------------------------------------------------------------

export interface CohereSummarizeRequest {
  text: string;
  length?: "short" | "medium" | "long";
  format?: "paragraph" | "bullets";
  model?: string;
  extractiveness?: "low" | "medium" | "high";
  temperature?: number;
  additional_command?: string;
}

export interface CohereSummarizeResponse {
  id: string;
  summary: string;
  meta?: CohereMeta;
}

// ---------------------------------------------------------------------------
// Models (GET /v1/models, GET /v1/models/{model})
// ---------------------------------------------------------------------------

export interface CohereModelsListParams {
  page_size?: number;
  page_token?: string;
  endpoint?: string;
  default_only?: boolean;
}

export interface CohereModel {
  name: string;
  is_deprecated?: boolean;
  endpoints?: string[];
  finetuned?: boolean;
  context_length?: number;
  tokenizer_url?: string;
  default_endpoints?: string[];
  features?: string[];
}

export interface CohereModelsListResponse {
  models: CohereModel[];
  next_page_token?: string;
}

// ---------------------------------------------------------------------------
// Tokenize (POST /v1/tokenize)
// ---------------------------------------------------------------------------

export interface CohereTokenizeRequest {
  text: string;
  model: string;
}

export interface CohereTokenizeResponse {
  tokens: number[];
  token_strings: string[];
  meta?: CohereMeta;
}

// ---------------------------------------------------------------------------
// Detokenize (POST /v1/detokenize)
// ---------------------------------------------------------------------------

export interface CohereDetokenizeRequest {
  tokens: number[];
  model: string;
}

export interface CohereDetokenizeResponse {
  text: string;
  meta?: CohereMeta;
}

// ---------------------------------------------------------------------------
// Check API Key (POST /v1/check-api-key)
// ---------------------------------------------------------------------------

export interface CohereCheckApiKeyResponse {
  valid: boolean;
  organization_id?: string;
  owner_id?: string;
}

// ---------------------------------------------------------------------------
// Datasets (GET/POST/DELETE /v1/datasets)
// ---------------------------------------------------------------------------

export interface CohereDatasetListParams {
  datasetType?: string;
  before?: string;
  after?: string;
  limit?: number;
  offset?: number;
  validationStatus?: string;
}

export interface CohereDatasetPart {
  id: string;
  name: string;
  num_rows?: number;
  original_url?: string;
}

export interface CohereDataset {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  dataset_type: string;
  validation_status: string;
  validation_error?: string;
  schema?: string;
  required_fields?: string[];
  preserve_fields?: string[];
  dataset_parts?: CohereDatasetPart[];
  validation_warnings?: string[];
  parse_info?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export interface CohereDatasetListResponse {
  datasets: CohereDataset[];
}

export interface CohereDatasetCreateParams {
  name: string;
  type: string;
  keep_original_file?: boolean;
  skip_malformed_input?: boolean;
  keep_fields?: string[];
  optional_fields?: string[];
  text_separator?: string;
  csv_delimiter?: string;
}

export interface CohereDatasetCreateResponse {
  id: string;
}

export interface CohereDatasetGetResponse {
  dataset: CohereDataset;
}

export interface CohereDatasetUsageResponse {
  organization_usage: number;
}

// ---------------------------------------------------------------------------
// Connectors (GET/POST/PATCH/DELETE /v1/connectors)
// ---------------------------------------------------------------------------

export interface CohereConnectorListParams {
  limit?: number;
  offset?: number;
}

export interface CohereConnectorOAuth {
  client_id?: string;
  client_secret?: string;
  authorize_url?: string;
  token_url?: string;
  scope?: string;
}

export interface CohereConnectorServiceAuth {
  type: "bearer" | "basic" | "noscheme";
  token: string;
}

export interface CohereConnector {
  id: string;
  name: string;
  description?: string;
  url: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
  excludes?: string[];
  auth_type?: "oauth" | "service_auth";
  oauth?: CohereConnectorOAuth;
  auth_status?: "valid" | "expired";
  active?: boolean;
  continue_on_failure?: boolean;
}

export interface CohereConnectorListResponse {
  connectors: CohereConnector[];
  total_count: number;
}

export interface CohereConnectorCreateRequest {
  name: string;
  url: string;
  description?: string;
  excludes?: string[];
  active?: boolean;
  continue_on_failure?: boolean;
  oauth?: CohereConnectorOAuth;
  service_auth?: CohereConnectorServiceAuth;
}

export interface CohereConnectorCreateResponse {
  connector: CohereConnector;
}

export interface CohereConnectorUpdateRequest {
  name?: string;
  url?: string;
  excludes?: string[];
  active?: boolean;
  continue_on_failure?: boolean;
  oauth?: CohereConnectorOAuth;
  service_auth?: CohereConnectorServiceAuth;
}

export interface CohereConnectorGetResponse {
  connector: CohereConnector;
}

export interface CohereConnectorUpdateResponse {
  connector: CohereConnector;
}

// ---------------------------------------------------------------------------
// Embed Jobs (GET/POST /v1/embed-jobs)
// ---------------------------------------------------------------------------

export interface CohereEmbedJob {
  job_id: string;
  name?: string;
  status: "processing" | "complete" | "cancelling" | "cancelled" | "failed";
  created_at: string;
  input_dataset_id?: string;
  output_dataset_id?: string;
  model?: string;
  truncate?: "START" | "END";
  meta?: CohereMeta;
}

export interface CohereEmbedJobListResponse {
  embed_jobs: CohereEmbedJob[];
}

export interface CohereEmbedJobCreateRequest {
  model: string;
  dataset_id: string;
  input_type:
    | "search_document"
    | "search_query"
    | "classification"
    | "clustering"
    | "image";
  name?: string;
  embedding_types?: (
    | "float"
    | "int8"
    | "uint8"
    | "binary"
    | "ubinary"
    | "base64"
  )[];
  truncate?: "START" | "END";
}

export interface CohereEmbedJobCreateResponse {
  job_id: string;
  meta?: CohereMeta;
}

// ---------------------------------------------------------------------------
// Fine-Tuning (GET/POST/PATCH/DELETE /v1/finetuning/finetuned-models)
// ---------------------------------------------------------------------------

export interface CohereFineTunedModelSettings {
  base_model: {
    base_type?:
      | "BASE_TYPE_UNSPECIFIED"
      | "BASE_TYPE_GENERATIVE"
      | "BASE_TYPE_CLASSIFICATION"
      | "BASE_TYPE_RERANK"
      | "BASE_TYPE_CHAT";
    name?: string;
    version?: string;
    strategy?: string;
  };
  dataset_id: string;
  hyperparameters?: {
    early_stopping_patience?: number;
    early_stopping_threshold?: number;
    train_batch_size?: number;
    train_epochs?: number;
    learning_rate?: number;
    lora_alpha?: number;
    lora_rank?: number;
    lora_target_modules?: string;
  };
  wandb?: {
    project?: string;
    api_key?: string;
    entity?: string;
  };
}

export interface CohereFineTunedModel {
  id: string;
  name: string;
  creator_id?: string;
  organization_id?: string;
  settings: CohereFineTunedModelSettings;
  status:
    | "QUEUED"
    | "FINETUNING"
    | "READY"
    | "FAILED"
    | "DELETED"
    | "TEMPORARILY_OFFLINE"
    | "PAUSED"
    | "QUEUED_FOR_DELETION";
  created_at: string;
  updated_at: string;
  completed_at?: string;
  last_used?: string;
}

export interface CohereFineTunedModelListParams {
  page_size?: number;
  page_token?: string;
  order_by?: string;
}

export interface CohereFineTunedModelListResponse {
  finetuned_models: CohereFineTunedModel[];
  next_page_token?: string;
  total_size?: number;
}

export interface CohereFineTunedModelCreateRequest {
  name: string;
  settings: CohereFineTunedModelSettings;
}

export interface CohereFineTunedModelCreateResponse {
  finetuned_model: CohereFineTunedModel;
}

export interface CohereFineTunedModelGetResponse {
  finetuned_model: CohereFineTunedModel;
}

export interface CohereFineTunedModelUpdateRequest {
  name: string;
  settings: CohereFineTunedModelSettings;
}

export interface CohereFineTunedModelUpdateResponse {
  finetuned_model: CohereFineTunedModel;
}

export interface CohereFineTuneEventListParams {
  page_size?: number;
  page_token?: string;
  order_by?: string;
}

export interface CohereFineTuneEvent {
  user_id?: string;
  status: string;
  created_at: string;
}

export interface CohereFineTuneEventListResponse {
  events: CohereFineTuneEvent[];
  next_page_token?: string;
  total_size?: number;
}

export interface CohereTrainingStepMetricListParams {
  page_size?: number;
  page_token?: string;
}

export interface CohereTrainingStepMetric {
  created_at?: string;
  step_number: number;
  metrics: Record<string, number>;
}

export interface CohereTrainingStepMetricListResponse {
  step_metrics: CohereTrainingStepMetric[];
  next_page_token?: string;
}

// ---------------------------------------------------------------------------
// Payload schema types (shared across @nakedapi providers)
// ---------------------------------------------------------------------------

export interface PayloadFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
  items?: PayloadFieldSchema;
  properties?: Record<string, PayloadFieldSchema>;
}

export interface PayloadSchema {
  method: "POST" | "DELETE" | "PATCH";
  path: string;
  contentType: "application/json" | "multipart/form-data";
  fields: Record<string, PayloadFieldSchema>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Namespace method types (internal — not exported)
// ---------------------------------------------------------------------------

interface CohereChatV2Method {
  (
    req: CohereChatV2Request,
    signal?: AbortSignal
  ): Promise<CohereChatV2Response>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereChatV1Method {
  (
    req: CohereChatV1Request,
    signal?: AbortSignal
  ): Promise<CohereChatV1Response>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereEmbedMethod {
  (req: CohereEmbedRequest, signal?: AbortSignal): Promise<CohereEmbedResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereRerankMethod {
  (
    req: CohereRerankRequest,
    signal?: AbortSignal
  ): Promise<CohereRerankResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereV2Namespace {
  chat: CohereChatV2Method;
  embed: CohereEmbedMethod;
  rerank: CohereRerankMethod;
}

interface CohereClassifyMethod {
  (
    req: CohereClassifyRequest,
    signal?: AbortSignal
  ): Promise<CohereClassifyResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereSummarizeMethod {
  (
    req: CohereSummarizeRequest,
    signal?: AbortSignal
  ): Promise<CohereSummarizeResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereModelsListMethod {
  (
    params?: CohereModelsListParams,
    signal?: AbortSignal
  ): Promise<CohereModelsListResponse>;
  retrieve(model: string, signal?: AbortSignal): Promise<CohereModel>;
}

interface CohereTokenizeMethod {
  (
    req: CohereTokenizeRequest,
    signal?: AbortSignal
  ): Promise<CohereTokenizeResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereDetokenizeMethod {
  (
    req: CohereDetokenizeRequest,
    signal?: AbortSignal
  ): Promise<CohereDetokenizeResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereCheckApiKeyMethod {
  (signal?: AbortSignal): Promise<CohereCheckApiKeyResponse>;
}

interface CohereDatasetsMethod {
  (
    params?: CohereDatasetListParams,
    signal?: AbortSignal
  ): Promise<CohereDatasetListResponse>;
  create(
    data: Blob | File,
    params: CohereDatasetCreateParams,
    evalData?: Blob | File,
    signal?: AbortSignal
  ): Promise<CohereDatasetCreateResponse>;
  retrieve(id: string, signal?: AbortSignal): Promise<CohereDatasetGetResponse>;
  del(id: string, signal?: AbortSignal): Promise<Record<string, never>>;
  usage(signal?: AbortSignal): Promise<CohereDatasetUsageResponse>;
}

interface CohereConnectorsMethod {
  (
    params?: CohereConnectorListParams,
    signal?: AbortSignal
  ): Promise<CohereConnectorListResponse>;
  create: CohereConnectorCreateMethod;
  retrieve(
    id: string,
    signal?: AbortSignal
  ): Promise<CohereConnectorGetResponse>;
  update: CohereConnectorUpdateMethod;
  del(id: string, signal?: AbortSignal): Promise<Record<string, never>>;
}

interface CohereConnectorCreateMethod {
  (
    req: CohereConnectorCreateRequest,
    signal?: AbortSignal
  ): Promise<CohereConnectorCreateResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereConnectorUpdateMethod {
  (
    id: string,
    req: CohereConnectorUpdateRequest,
    signal?: AbortSignal
  ): Promise<CohereConnectorUpdateResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereEmbedJobsMethod {
  (signal?: AbortSignal): Promise<CohereEmbedJobListResponse>;
  create: CohereEmbedJobCreateMethod;
  retrieve(id: string, signal?: AbortSignal): Promise<CohereEmbedJob>;
  cancel(id: string, signal?: AbortSignal): Promise<Record<string, never>>;
}

interface CohereEmbedJobCreateMethod {
  (
    req: CohereEmbedJobCreateRequest,
    signal?: AbortSignal
  ): Promise<CohereEmbedJobCreateResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereFineTunedModelsMethod {
  (
    params?: CohereFineTunedModelListParams,
    signal?: AbortSignal
  ): Promise<CohereFineTunedModelListResponse>;
  create: CohereFineTunedModelCreateMethod;
  retrieve(
    id: string,
    signal?: AbortSignal
  ): Promise<CohereFineTunedModelGetResponse>;
  update: CohereFineTunedModelUpdateMethod;
  del(id: string, signal?: AbortSignal): Promise<Record<string, never>>;
  events(
    id: string,
    params?: CohereFineTuneEventListParams,
    signal?: AbortSignal
  ): Promise<CohereFineTuneEventListResponse>;
  trainingStepMetrics(
    id: string,
    params?: CohereTrainingStepMetricListParams,
    signal?: AbortSignal
  ): Promise<CohereTrainingStepMetricListResponse>;
}

interface CohereFineTunedModelCreateMethod {
  (
    req: CohereFineTunedModelCreateRequest,
    signal?: AbortSignal
  ): Promise<CohereFineTunedModelCreateResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereFineTunedModelUpdateMethod {
  (
    id: string,
    req: CohereFineTunedModelUpdateRequest,
    signal?: AbortSignal
  ): Promise<CohereFineTunedModelUpdateResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface CohereFineTuningNamespace {
  "finetuned-models": CohereFineTunedModelsMethod;
}

interface CohereV1Namespace {
  chat: CohereChatV1Method;
  classify: CohereClassifyMethod;
  summarize: CohereSummarizeMethod;
  models: CohereModelsListMethod;
  tokenize: CohereTokenizeMethod;
  detokenize: CohereDetokenizeMethod;
  "check-api-key": CohereCheckApiKeyMethod;
  datasets: CohereDatasetsMethod;
  connectors: CohereConnectorsMethod;
  "embed-jobs": CohereEmbedJobsMethod;
  finetuning: CohereFineTuningNamespace;
}

// ---------------------------------------------------------------------------
// Provider interface (public)
// ---------------------------------------------------------------------------

export interface CohereProvider {
  v1: CohereV1Namespace;
  v2: CohereV2Namespace;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class CohereError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "CohereError";
    this.status = status;
    this.body = body;
    this.code = code;
  }
}
