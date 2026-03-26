// XAI provider options
export interface XaiOptions {
  apiKey: string;
  baseURL?: string;
  managementApiKey?: string;
  managementBaseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// Chat message
export interface XaiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Tool function definition
export interface XaiToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// Tool definition
export interface XaiTool {
  type: "function";
  function: XaiToolFunction;
}

// Tool call in response
export interface XaiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Usage info (raw API shape)
export interface XaiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Chat request
export interface XaiChatRequest {
  model?: string;
  messages: XaiMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: XaiTool[];
  tool_choice?:
    | "auto"
    | "none"
    | { type: "function"; function: { name: string } };
}

// Chat response (raw API shape)
export interface XaiChatChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: XaiToolCall[];
  };
  finish_reason: string;
}

export interface XaiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: XaiChatChoice[];
  usage?: XaiUsage;
  error?: { message?: string; type?: string };
}

// Image generation request
export interface XaiImageGenerateRequest {
  prompt: string;
  model?: string;
  n?: number;
  response_format?: "url" | "b64_json";
  aspect_ratio?: string;
  resolution?: "1k" | "2k";
}

// Image reference for editing
export interface XaiImageReference {
  url: string;
  type?: "image_url";
}

// Image editing request
export interface XaiImageEditRequest {
  prompt: string;
  model?: string;
  image?: XaiImageReference;
  images?: XaiImageReference[];
  n?: number;
  response_format?: "url" | "b64_json";
  aspect_ratio?: string;
}

// Single generated image data
export interface XaiGeneratedImage {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
  respect_moderation?: boolean;
}

// Image response
export interface XaiImageResponse {
  created?: number;
  model?: string;
  data: XaiGeneratedImage[];
}

// File upload response
export interface XaiFileObject {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

// File list response
export interface XaiFileListResponse {
  data: XaiFileObject[];
  object: string;
}

// Video reference (image-to-video, editing, extension, reference images)
export interface XaiVideoReference {
  url: string;
}

// Video generation request — matches API body for /v1/videos/generations
export interface XaiVideoGenerateRequest {
  prompt: string;
  model?: string;
  duration?: number;
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3";
  resolution?: "480p" | "720p";
  image?: XaiVideoReference;
  video?: XaiVideoReference;
  reference_images?: XaiVideoReference[];
}

// Video edit request — matches API body for /v1/videos/edits
export interface XaiVideoEditRequest {
  prompt: string;
  model?: string;
  video: XaiVideoReference;
  output?: { upload_url: string };
  user?: string;
}

// Video extension request — matches API body for /v1/videos/extensions
export interface XaiVideoExtendRequest {
  prompt: string;
  model?: string;
  duration?: number;
  video: XaiVideoReference;
}

// Video async response (returned from generate/edit)
export interface XaiVideoAsyncResponse {
  request_id: string;
}

// Video data in poll response
export interface XaiVideoData {
  url: string;
  duration: number;
  respect_moderation: boolean;
}

// Video result (returned from polling)
export interface XaiVideoResult {
  status: "pending" | "done" | "expired" | "failed";
  progress?: number;
  request_id?: string;
  video?: XaiVideoData;
  model?: string;
}

// Model info (GET /v1/models)
export interface XaiModel {
  id: string;
  created: number;
  object: string;
  owned_by: string;
}

export interface XaiModelListResponse {
  data: XaiModel[];
  object: string;
}

// Language model (GET /v1/language-models)
export interface XaiLanguageModel {
  id: string;
  fingerprint: string;
  created: number;
  object: string;
  owned_by: string;
  version: string;
  input_modalities: string[];
  output_modalities: string[];
  prompt_text_token_price: number;
  cached_prompt_text_token_price?: number;
  prompt_image_token_price?: number;
  completion_text_token_price: number;
  search_price?: number;
  aliases: string[];
}

export interface XaiLanguageModelListResponse {
  models: XaiLanguageModel[];
}

// Image generation model (GET /v1/image-generation-models)
export interface XaiImageGenerationModel {
  id: string;
  fingerprint: string;
  created: number;
  object: string;
  owned_by: string;
  version: string;
  max_prompt_length: number;
  prompt_text_token_price?: number;
  prompt_image_token_price?: number;
  generated_image_token_price?: number;
  image_price?: number;
  input_modalities?: string[];
  output_modalities?: string[];
  aliases: string[];
}

export interface XaiImageGenerationModelListResponse {
  models: XaiImageGenerationModel[];
}

// Video generation model (GET /v1/video-generation-models)
export interface XaiVideoGenerationModel {
  id: string;
  fingerprint: string;
  created: number;
  object: string;
  owned_by: string;
  version: string;
  input_modalities: string[];
  output_modalities: string[];
  aliases: string[];
}

export interface XaiVideoGenerationModelListResponse {
  models: XaiVideoGenerationModel[];
}

// Batch state (shared across batch responses)
export interface XaiBatchState {
  num_requests: number;
  num_pending: number;
  num_success: number;
  num_error: number;
  num_cancelled: number;
}

// Batch info (used in create, get, list, cancel responses)
export interface XaiBatch {
  batch_id: string;
  name: string;
  create_time: string;
  expire_time: string | null;
  create_api_key_id: string;
  cancel_time: string | null;
  cancel_by_xai_message: string | null;
  state: XaiBatchState;
}

// POST /v1/batches request
export interface XaiBatchCreateRequest {
  name: string;
}

// GET /v1/batches response
export interface XaiBatchListResponse {
  batches: XaiBatch[];
  pagination_token: string | null;
}

// GET /v1/batches query params
export interface XaiBatchListParams {
  limit?: number;
  pagination_token?: string;
}

// Batch request metadata (GET /v1/batches/{batch_id}/requests)
export interface XaiBatchRequestMetadata {
  batch_request_id: string;
  endpoint: string;
  model: string;
  state: "unknown" | "pending" | "succeeded" | "cancelled" | "failed";
  create_time: string;
  finish_time: string | null;
}

export interface XaiBatchRequestListResponse {
  batch_request_metadata: XaiBatchRequestMetadata[];
  pagination_token: string | null;
}

export interface XaiBatchRequestListParams {
  limit?: number;
  pagination_token?: string;
}

// Batch request item (POST /v1/batches/{batch_id}/requests)
export interface XaiBatchRequestItem {
  batch_request_id?: string | null;
  batch_request: {
    chat_get_completion: Record<string, unknown>;
  };
}

export interface XaiBatchAddRequestsBody {
  batch_requests: XaiBatchRequestItem[];
}

// Batch result item (GET /v1/batches/{batch_id}/results)
export interface XaiBatchResultItem {
  batch_request_id: string;
  batch_result: Record<string, unknown>;
}

export interface XaiBatchResultListResponse {
  results: XaiBatchResultItem[];
  pagination_token: string | null;
}

export interface XaiBatchResultListParams {
  limit?: number;
  pagination_token?: string;
}

// Chunk configuration for collections
export interface XaiChunkConfiguration {
  chars_configuration?: {
    max_chunk_size_chars: number;
    chunk_overlap_chars: number;
  };
  tokens_configuration?: {
    max_chunk_size_tokens: number;
    chunk_overlap_tokens: number;
    encoding_name?: string;
  };
  markdown_tokens_configuration?: {
    max_chunk_size_tokens: number;
    chunk_overlap_tokens: number;
    encoding_name?: string;
  };
  markdown_chars_configuration?: {
    max_chunk_size_chars: number;
    chunk_overlap_chars: number;
  };
  code_tokens_configuration?: {
    max_chunk_size_tokens: number;
    chunk_overlap_tokens: number;
    encoding_name?: string;
  };
  code_chars_configuration?: {
    max_chunk_size_chars: number;
    chunk_overlap_chars: number;
  };
  table_configuration?: {
    max_chunk_size_tokens: number;
    encoding_name?: string;
  };
  bytes_configuration?: {
    max_chunk_size_bytes: number;
    chunk_overlap_bytes: number;
  };
  strip_whitespace?: boolean;
  inject_name_into_chunks?: boolean;
}

// Field definition for collection schema
export interface XaiFieldDefinition {
  key: string;
  required?: boolean;
  unique?: boolean;
  inject_into_chunk?: boolean;
  description?: string;
}

// POST /v1/collections request
export interface XaiCollectionCreateRequest {
  collection_name: string;
  collection_description?: string;
  team_id?: string;
  index_configuration?: { model_name: string };
  chunk_configuration?: XaiChunkConfiguration;
  metric_space?:
    | "HNSW_METRIC_UNKNOWN"
    | "HNSW_METRIC_COSINE"
    | "HNSW_METRIC_EUCLIDEAN"
    | "HNSW_METRIC_INNER_PRODUCT";
  field_definitions?: XaiFieldDefinition[];
}

// Collection object (returned from create, get, list, update)
export interface XaiCollection {
  collection_id: string;
  collection_name: string;
  created_at: string;
  index_configuration?: { model_name: string };
  chunk_configuration?: XaiChunkConfiguration;
  documents_count?: number;
  field_definitions?: XaiFieldDefinition[];
  collection_description?: string;
}

// GET /v1/collections query params
export interface XaiCollectionListParams {
  team_id?: string;
  limit?: number;
  order?: "ORDERING_ASCENDING" | "ORDERING_DESCENDING";
  sort_by?: "COLLECTIONS_SORT_BY_NAME" | "COLLECTIONS_SORT_BY_AGE";
  pagination_token?: string;
  filter?: string;
}

// GET /v1/collections response
export interface XaiCollectionListResponse {
  collections: XaiCollection[];
  pagination_token?: string;
}

// PUT /v1/collections/{collection_id} request
export interface XaiCollectionUpdateRequest {
  team_id?: string;
  collection_name?: string;
  collection_description?: string;
  chunk_configuration?: XaiChunkConfiguration;
  field_definition_updates?: {
    field_definition: XaiFieldDefinition;
    operation: "FIELD_DEFINITION_ADD" | "FIELD_DEFINITION_DELETE";
  }[];
}

// Document file metadata
export interface XaiDocumentFileMetadata {
  file_id: string;
  name: string;
  size_bytes: string;
  content_type: string;
  created_at: string;
  expires_at?: string | null;
  hash?: string;
  upload_status?: string;
  upload_error_message?: string;
  processing_status?: string;
  file_path?: string;
}

// Document in a collection
export interface XaiDocument {
  file_metadata: XaiDocumentFileMetadata;
  fields?: Record<string, string>;
  status:
    | "DOCUMENT_STATUS_UNKNOWN"
    | "DOCUMENT_STATUS_PROCESSING"
    | "DOCUMENT_STATUS_PROCESSED"
    | "DOCUMENT_STATUS_FAILED";
  error_message?: string;
  last_indexed_at?: string;
}

// GET /v1/collections/{id}/documents query params
export interface XaiDocumentListParams {
  team_id?: string;
  limit?: number;
  order?: "ORDERING_ASCENDING" | "ORDERING_DESCENDING";
  sort_by?:
    | "DOCUMENTS_SORT_BY_NAME"
    | "DOCUMENTS_SORT_BY_SIZE"
    | "DOCUMENTS_SORT_BY_AGE";
  pagination_token?: string;
  filter?: string;
}

// GET /v1/collections/{id}/documents response
export interface XaiDocumentListResponse {
  documents: XaiDocument[];
  pagination_token?: string;
}

// POST /v1/collections/{id}/documents/{file_id} request
export interface XaiDocumentAddRequest {
  team_id?: string;
  fields?: Record<string, string>;
}

// POST /v1/documents/search request
export interface XaiDocumentSearchRequest {
  query: string;
  source: {
    collection_ids: string[];
    rag_pipeline?: "chroma_db" | "es";
  };
  filter?: string | null;
  instructions?: string | null;
  limit?: number | null;
  ranking_metric?:
    | "RANKING_METRIC_UNKNOWN"
    | "RANKING_METRIC_L2_DISTANCE"
    | "RANKING_METRIC_COSINE_SIMILARITY";
  group_by?: {
    keys: string[];
    aggregate?: Record<string, unknown>;
  };
  retrieval_mode?: {
    type: "hybrid" | "keyword" | "semantic";
  };
}

// Search result match
export interface XaiDocumentSearchMatch {
  file_id: string;
  chunk_id: string;
  chunk_content: string;
  score: number;
  collection_ids: string[];
  fields?: Record<string, string>;
  page_number?: number;
}

// POST /v1/documents/search response
export interface XaiDocumentSearchResponse {
  matches: XaiDocumentSearchMatch[];
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
  method: "POST" | "PUT" | "DELETE";
  path: string;
  contentType: "application/json" | "multipart/form-data";
  fields: Record<string, PayloadFieldSchema>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Namespace types
interface XaiChatCompletionsMethod {
  (req: XaiChatRequest, signal?: AbortSignal): Promise<XaiChatResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiChatNamespace {
  completions: XaiChatCompletionsMethod;
}

interface XaiImageGenerationsMethod {
  (
    req: XaiImageGenerateRequest,
    signal?: AbortSignal
  ): Promise<XaiImageResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiImageEditsMethod {
  (req: XaiImageEditRequest, signal?: AbortSignal): Promise<XaiImageResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiImagesNamespace {
  generations: XaiImageGenerationsMethod;
  edits: XaiImageEditsMethod;
}

interface XaiVideoGenerationsMethod {
  (
    req: XaiVideoGenerateRequest,
    signal?: AbortSignal
  ): Promise<XaiVideoAsyncResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiVideoEditsMethod {
  (
    req: XaiVideoEditRequest,
    signal?: AbortSignal
  ): Promise<XaiVideoAsyncResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiVideoExtensionsMethod {
  (
    req: XaiVideoExtendRequest,
    signal?: AbortSignal
  ): Promise<XaiVideoAsyncResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiVideosNamespace {
  (requestId: string, signal?: AbortSignal): Promise<XaiVideoResult>;
  generations: XaiVideoGenerationsMethod;
  edits: XaiVideoEditsMethod;
  extensions: XaiVideoExtensionsMethod;
}

interface XaiFilesNamespace {
  upload(
    file: Blob,
    filename: string,
    purpose?: string,
    signal?: AbortSignal
  ): Promise<XaiFileObject>;
  list(signal?: AbortSignal): Promise<XaiFileListResponse>;
  get(fileId: string, signal?: AbortSignal): Promise<XaiFileObject>;
  delete(
    fileId: string,
    signal?: AbortSignal
  ): Promise<{ id: string; deleted: boolean }>;
}

interface XaiModelsNamespace {
  (signal?: AbortSignal): Promise<XaiModelListResponse>;
  (modelId: string, signal?: AbortSignal): Promise<XaiModel>;
}

interface XaiLanguageModelsNamespace {
  (signal?: AbortSignal): Promise<XaiLanguageModelListResponse>;
  (modelId: string, signal?: AbortSignal): Promise<XaiLanguageModel>;
}

interface XaiImageGenerationModelsNamespace {
  (signal?: AbortSignal): Promise<XaiImageGenerationModelListResponse>;
  (modelId: string, signal?: AbortSignal): Promise<XaiImageGenerationModel>;
}

interface XaiVideoGenerationModelsNamespace {
  (signal?: AbortSignal): Promise<XaiVideoGenerationModelListResponse>;
  (modelId: string, signal?: AbortSignal): Promise<XaiVideoGenerationModel>;
}

interface XaiBatchCreateMethod {
  (req: XaiBatchCreateRequest, signal?: AbortSignal): Promise<XaiBatch>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiBatchAddRequestsMethod {
  (
    batchId: string,
    req: XaiBatchAddRequestsBody,
    signal?: AbortSignal
  ): Promise<void>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiBatchesNamespace {
  (
    params?: XaiBatchListParams,
    signal?: AbortSignal
  ): Promise<XaiBatchListResponse>;
  create: XaiBatchCreateMethod;
  get(batchId: string, signal?: AbortSignal): Promise<XaiBatch>;
  cancel(batchId: string, signal?: AbortSignal): Promise<XaiBatch>;
  requests: {
    (
      batchId: string,
      params?: XaiBatchRequestListParams,
      signal?: AbortSignal
    ): Promise<XaiBatchRequestListResponse>;
    add: XaiBatchAddRequestsMethod;
  };
  results(
    batchId: string,
    params?: XaiBatchResultListParams,
    signal?: AbortSignal
  ): Promise<XaiBatchResultListResponse>;
}

interface XaiCollectionCreateMethod {
  (
    req: XaiCollectionCreateRequest,
    signal?: AbortSignal
  ): Promise<XaiCollection>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiCollectionUpdateMethod {
  (
    collectionId: string,
    req: XaiCollectionUpdateRequest,
    signal?: AbortSignal
  ): Promise<XaiCollection>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiDocumentAddMethod {
  (
    collectionId: string,
    fileId: string,
    req?: XaiDocumentAddRequest,
    signal?: AbortSignal
  ): Promise<void>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiCollectionDocumentsNamespace {
  (
    collectionId: string,
    params?: XaiDocumentListParams,
    signal?: AbortSignal
  ): Promise<XaiDocumentListResponse>;
  add: XaiDocumentAddMethod;
  get(
    collectionId: string,
    fileId: string,
    signal?: AbortSignal
  ): Promise<XaiDocument>;
  delete(
    collectionId: string,
    fileId: string,
    signal?: AbortSignal
  ): Promise<void>;
  regenerate(
    collectionId: string,
    fileId: string,
    signal?: AbortSignal
  ): Promise<void>;
  batchGet(
    collectionId: string,
    fileIds: string[],
    signal?: AbortSignal
  ): Promise<{ documents: XaiDocument[] }>;
}

interface XaiCollectionsNamespace {
  (
    params?: XaiCollectionListParams,
    signal?: AbortSignal
  ): Promise<XaiCollectionListResponse>;
  create: XaiCollectionCreateMethod;
  get(collectionId: string, signal?: AbortSignal): Promise<XaiCollection>;
  update: XaiCollectionUpdateMethod;
  delete(collectionId: string, signal?: AbortSignal): Promise<void>;
  documents: XaiCollectionDocumentsNamespace;
}

interface XaiDocumentSearchMethod {
  (
    req: XaiDocumentSearchRequest,
    signal?: AbortSignal
  ): Promise<XaiDocumentSearchResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface XaiDocumentsNamespace {
  search: XaiDocumentSearchMethod;
}

interface XaiV1Namespace {
  chat: XaiChatNamespace;
  images: XaiImagesNamespace;
  videos: XaiVideosNamespace;
  files: XaiFilesNamespace;
  batches: XaiBatchesNamespace;
  collections: XaiCollectionsNamespace;
  documents: XaiDocumentsNamespace;
  models: XaiModelsNamespace;
  languageModels: XaiLanguageModelsNamespace;
  imageGenerationModels: XaiImageGenerationModelsNamespace;
  videoGenerationModels: XaiVideoGenerationModelsNamespace;
}

// Provider interface
export interface XaiProvider {
  v1: XaiV1Namespace;
}

// Error class
export class XaiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "XaiError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}
