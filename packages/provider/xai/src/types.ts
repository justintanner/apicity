import type { z } from "zod";
import type { XaiGrokImagineVideo15ImageToVideoRequest } from "./zod";

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  XaiOptions,
  XaiMessage,
  XaiToolFunction,
  XaiTool,
  XaiImageReference,
  XaiVideoReference,
  XaiVideoReferenceInput,
  XaiChunkConfiguration,
  XaiFieldDefinition,
  XaiChatRequest,
  XaiImageGenerateRequest,
  XaiImageEditRequest,
  XaiVideoGenerateRequest,
  XaiGrokImagineVideo15ImageToVideoRequest,
  XaiVideoEditRequest,
  XaiVideoExtendRequest,
  XaiBatchCreateRequest,
  XaiBatchAddRequestsBody,
  XaiCollectionCreateRequest,
  XaiCollectionUpdateRequest,
  XaiDocumentAddRequest,
  XaiDocumentSearchRequest,
  XaiResponseInputTextContent,
  XaiResponseInputImageContent,
  XaiResponseInputContent,
  XaiResponseInputMessage,
  XaiResponseFunctionCallOutput,
  XaiResponseItemReference,
  XaiResponseInputItem,
  XaiResponseFunctionTool,
  XaiResponseWebSearchTool,
  XaiResponseFileSearchTool,
  XaiResponseTool,
  XaiResponseTextFormat,
  XaiResponseReasoning,
  XaiResponseSearchParameters,
  XaiResponseRequest,
  XaiTokenizeTextRequest,
  XaiRealtimeClientSecretRequest,
  XaiTtsRequest,
  XaiSttRequest,
  XaiCustomVoiceCreateRequest,
  XaiBillingUsageRequest,
} from "./zod";

// ---------------------------------------------------------------------------
// Response types (hand-written — not schema-ified yet)
// ---------------------------------------------------------------------------

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

// Deferred chat completion result
// GET /v1/chat/deferred-completion/{request_id}
// Returns null when pending (HTTP 202), or the full chat response when complete (HTTP 200)
export interface XaiDeferredChatCompletionResult {
  ready: boolean;
  data: XaiChatResponse | null;
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

export interface XaiVideoUsage {
  cost_in_usd_ticks?: number;
  [key: string]: unknown;
}

// Video result (returned from polling)
export interface XaiVideoResult {
  status: "pending" | "done" | "expired" | "failed";
  progress?: number;
  request_id?: string;
  video?: XaiVideoData;
  model?: string;
  usage?: XaiVideoUsage;
}

export interface XaiGrokImagineVideo15ImageToVideoResponse extends XaiVideoResult {
  status: "done";
  request_id: string;
  video: XaiVideoData;
  model: string;
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

// Collection object (returned from create, get, list, update)
import type { XaiChunkConfiguration, XaiFieldDefinition } from "./zod";

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

// Response output types
export interface XaiResponseAnnotation {
  type: "url_citation" | "file_citation" | "file_path";
  start_index: number;
  end_index: number;
  url?: string;
  title?: string;
  file_id?: string;
  filename?: string;
}

export interface XaiResponseOutputText {
  type: "output_text";
  text: string;
  annotations: XaiResponseAnnotation[];
}

export interface XaiResponseRefusal {
  type: "refusal";
  refusal: string;
}

export type XaiResponseOutputContent =
  | XaiResponseOutputText
  | XaiResponseRefusal;

export interface XaiResponseOutputMessage {
  type: "message";
  id: string;
  role: "assistant";
  status: "completed" | "in_progress" | "incomplete";
  content: XaiResponseOutputContent[];
}

export interface XaiResponseFunctionCallItem {
  type: "function_call";
  id: string;
  call_id: string;
  name: string;
  arguments: string;
  status: "completed" | "in_progress" | "incomplete";
}

export interface XaiResponseWebSearchCallItem {
  type: "web_search_call";
  id: string;
  status: "completed";
}

export interface XaiResponseFileSearchCallItem {
  type: "file_search_call";
  id: string;
  status: "completed";
  results?: { file_id: string; text: string; score: number }[];
}

export type XaiResponseOutputItem =
  | XaiResponseOutputMessage
  | XaiResponseFunctionCallItem
  | XaiResponseWebSearchCallItem
  | XaiResponseFileSearchCallItem;

export interface XaiResponseUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_details?: { cached_tokens: number };
  output_tokens_details?: { reasoning_tokens: number };
}

import type {
  XaiResponseRequest,
  XaiResponseReasoning,
  XaiResponseTextFormat,
  XaiResponseTool,
} from "./zod";

export interface XaiResponseResponse {
  id: string;
  object: "response";
  created_at: number;
  completed_at: number | null;
  status: "completed" | "in_progress" | "incomplete";
  model: string;
  output: XaiResponseOutputItem[];
  instructions: string | null;
  previous_response_id: string | null;
  temperature: number | null;
  top_p: number | null;
  max_output_tokens: number | null;
  store: boolean;
  tools: XaiResponseTool[];
  reasoning: XaiResponseReasoning | null;
  text: XaiResponseTextFormat;
  usage: XaiResponseUsage;
  error: { code: string; message: string } | null;
  incomplete_details: { reason: string } | null;
  metadata: Record<string, string>;
}

export interface XaiResponseDeleteResponse {
  id: string;
  object: "response";
  deleted: boolean;
}

// Single token in tokenize-text response
export interface XaiToken {
  token_id: number;
  string_token: string;
  token_bytes: number[];
}

// POST /v1/tokenize-text response
export interface XaiTokenizeTextResponse {
  token_ids: XaiToken[];
}

// POST /v1/realtime/client_secrets response
export interface XaiRealtimeClientSecretResponse {
  value: string;
  expires_at: number;
}

// Realtime session configuration (used in session.update)
export interface XaiRealtimeTurnDetection {
  type: "server_vad" | null;
  threshold?: number;
  silence_duration_ms?: number;
  prefix_padding_ms?: number;
}

export interface XaiRealtimeAudioFormat {
  type?: "audio/pcm" | "audio/pcmu" | "audio/pcma";
  rate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000;
}

export interface XaiRealtimeAudioConfig {
  input?: { format?: XaiRealtimeAudioFormat };
  output?: { format?: XaiRealtimeAudioFormat };
}

export interface XaiRealtimeFunctionTool {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface XaiRealtimeWebSearchTool {
  type: "web_search";
}

export interface XaiRealtimeXSearchTool {
  type: "x_search";
  allowed_x_handles?: string[];
}

export interface XaiRealtimeFileSearchTool {
  type: "file_search";
  vector_store_ids: string[];
  max_num_results?: number;
}

export interface XaiRealtimeMcpTool {
  type: "mcp";
  server_url: string;
  server_label: string;
  server_description?: string;
  allowed_tools?: string[];
  authorization?: string;
  headers?: Record<string, string>;
}

export type XaiRealtimeTool =
  | XaiRealtimeFunctionTool
  | XaiRealtimeWebSearchTool
  | XaiRealtimeXSearchTool
  | XaiRealtimeFileSearchTool
  | XaiRealtimeMcpTool;

export interface XaiRealtimeSession {
  instructions?: string;
  voice?: string;
  turn_detection?: XaiRealtimeTurnDetection;
  audio?: XaiRealtimeAudioConfig;
  tools?: XaiRealtimeTool[];
}

// Client-to-server events
export interface XaiRealtimeSessionUpdate {
  type: "session.update";
  session: XaiRealtimeSession;
}

export interface XaiRealtimeInputAudioBufferAppend {
  type: "input_audio_buffer.append";
  audio: string;
}

export interface XaiRealtimeInputAudioBufferCommit {
  type: "input_audio_buffer.commit";
}

export interface XaiRealtimeConversationItemCreate {
  type: "conversation.item.create";
  previous_item_id?: string;
  item:
    | {
        type: "message";
        role: "user" | "assistant";
        content: { type: "input_text"; text: string }[];
      }
    | {
        type: "function_call_output";
        call_id: string;
        output: string;
      };
}

export interface XaiRealtimeResponseCreate {
  type: "response.create";
  response?: { modalities?: ("text" | "audio")[] };
}

export interface XaiRealtimeResponseCancel {
  type: "response.cancel";
}

export type XaiRealtimeClientEvent =
  | XaiRealtimeSessionUpdate
  | XaiRealtimeInputAudioBufferAppend
  | XaiRealtimeInputAudioBufferCommit
  | XaiRealtimeConversationItemCreate
  | XaiRealtimeResponseCreate
  | XaiRealtimeResponseCancel;

// Server-to-client events
export interface XaiRealtimeServerEventBase {
  event_id: string;
}

export interface XaiRealtimeConversationCreated extends XaiRealtimeServerEventBase {
  type: "conversation.created";
  conversation: { id: string; object: string };
}

export interface XaiRealtimeSessionUpdated extends XaiRealtimeServerEventBase {
  type: "session.updated";
  session: XaiRealtimeSession;
}

export interface XaiRealtimeSpeechStarted extends XaiRealtimeServerEventBase {
  type: "input_audio_buffer.speech_started";
  item_id: string;
  audio_start_ms?: number;
}

export interface XaiRealtimeSpeechStopped extends XaiRealtimeServerEventBase {
  type: "input_audio_buffer.speech_stopped";
  item_id: string;
  audio_end_ms?: number;
}

export interface XaiRealtimeAudioBufferCommitted extends XaiRealtimeServerEventBase {
  type: "input_audio_buffer.committed";
  previous_item_id: string;
  item_id: string;
}

export interface XaiRealtimeConversationItemAdded extends XaiRealtimeServerEventBase {
  type: "conversation.item.added";
  previous_item_id: string;
  item: Record<string, unknown>;
}

export interface XaiRealtimeTranscriptionCompleted extends XaiRealtimeServerEventBase {
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  transcript: string;
}

export interface XaiRealtimeResponseCreated extends XaiRealtimeServerEventBase {
  type: "response.created";
  response: { id: string; object: string; status: string };
}

export interface XaiRealtimeResponseDone extends XaiRealtimeServerEventBase {
  type: "response.done";
  response: { id: string; object: string; status: string };
}

export interface XaiRealtimeOutputItemAdded extends XaiRealtimeServerEventBase {
  type: "response.output_item.added";
  response_id: string;
  output_index: number;
  item: Record<string, unknown>;
}

export interface XaiRealtimeOutputItemDone extends XaiRealtimeServerEventBase {
  type: "response.output_item.done";
  response_id: string;
  output_index: number;
  item: Record<string, unknown>;
}

export interface XaiRealtimeAudioDelta extends XaiRealtimeServerEventBase {
  type: "response.output_audio.delta";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface XaiRealtimeAudioDone extends XaiRealtimeServerEventBase {
  type: "response.output_audio.done";
  response_id: string;
  item_id: string;
}

export interface XaiRealtimeAudioTranscriptDelta extends XaiRealtimeServerEventBase {
  type: "response.output_audio_transcript.delta";
  response_id: string;
  item_id: string;
  delta: string;
}

export interface XaiRealtimeAudioTranscriptDone extends XaiRealtimeServerEventBase {
  type: "response.output_audio_transcript.done";
  response_id: string;
  item_id: string;
}

export interface XaiRealtimeTextDelta extends XaiRealtimeServerEventBase {
  type: "response.text.delta";
  response_id: string;
  item_id: string;
  delta: string;
}

export interface XaiRealtimeTextDone extends XaiRealtimeServerEventBase {
  type: "response.text.done";
  response_id: string;
  item_id: string;
}

export interface XaiRealtimeFunctionCallDelta extends XaiRealtimeServerEventBase {
  type: "response.function_call_arguments.delta";
  response_id: string;
  item_id: string;
  call_id: string;
  delta: string;
}

export interface XaiRealtimeFunctionCallDone extends XaiRealtimeServerEventBase {
  type: "response.function_call_arguments.done";
  response_id: string;
  item_id: string;
  call_id: string;
  name: string;
  arguments: string;
}

export interface XaiRealtimeContentPartAdded extends XaiRealtimeServerEventBase {
  type: "response.content_part.added";
  response_id: string;
  item_id: string;
  content_index: number;
  part: Record<string, unknown>;
}

export interface XaiRealtimeContentPartDone extends XaiRealtimeServerEventBase {
  type: "response.content_part.done";
  response_id: string;
  item_id: string;
  content_index: number;
  part: Record<string, unknown>;
}

export interface XaiRealtimeError extends XaiRealtimeServerEventBase {
  type: "error";
  error?: { type?: string; code?: string; message?: string };
}

export type XaiRealtimeServerEvent =
  | XaiRealtimeConversationCreated
  | XaiRealtimeSessionUpdated
  | XaiRealtimeSpeechStarted
  | XaiRealtimeSpeechStopped
  | XaiRealtimeAudioBufferCommitted
  | XaiRealtimeConversationItemAdded
  | XaiRealtimeTranscriptionCompleted
  | XaiRealtimeResponseCreated
  | XaiRealtimeResponseDone
  | XaiRealtimeOutputItemAdded
  | XaiRealtimeOutputItemDone
  | XaiRealtimeAudioDelta
  | XaiRealtimeAudioDone
  | XaiRealtimeAudioTranscriptDelta
  | XaiRealtimeAudioTranscriptDone
  | XaiRealtimeTextDelta
  | XaiRealtimeTextDone
  | XaiRealtimeFunctionCallDelta
  | XaiRealtimeFunctionCallDone
  | XaiRealtimeContentPartAdded
  | XaiRealtimeContentPartDone
  | XaiRealtimeError;

// Speech-to-text word-level timestamp
export interface XaiSttWord {
  text: string;
  start: number;
  end: number;
}

// Speech-to-text response
export interface XaiSttResponse {
  text: string;
  language?: string;
  duration?: number;
  words?: XaiSttWord[];
}

// Custom voice creation response
export interface XaiCustomVoice {
  voice_id: string;
  name?: string;
  language?: string;
}

// Realtime WebSocket connection options
export interface XaiRealtimeConnectOptions {
  token?: string;
  // When set, the model is sent as a ?model=<value> query parameter and the
  // connection uses Authorization-header bearer auth instead of the
  // OpenAI-compat subprotocols. Required for voice-agent models like
  // "grok-voice-think-fast-1.0".
  model?: string;
}

// Realtime WebSocket connection wrapper
export interface XaiRealtimeConnection {
  send(event: XaiRealtimeClientEvent): void;
  close(): void;
  [Symbol.asyncIterator](): AsyncIterableIterator<XaiRealtimeServerEvent>;
}

// API key information (GET /v1/api-key)
export interface XaiApiKeyInfo {
  redacted_api_key: string;
  user_id: string;
  name: string;
  create_time: string;
  modify_time: string;
  modified_by: string;
  team_id: string;
  acls: string[];
  api_key_id: string;
  team_blocked: boolean;
  api_key_blocked: boolean;
  api_key_disabled: boolean;
}

// Management API key object (GET /auth/teams/{teamId}/api-keys)
export interface XaiManagementApiKey {
  redactedApiKey: string;
  apiKey?: string;
  userId: string;
  name?: string;
  createTime?: string;
  modifyTime?: string;
  teamId: string;
  apiKeyId: string;
  disabled: boolean;
  expireTime?: string;
  qps?: number;
  qpm?: number;
  tpm?: string;
  aclStrings?: string[];
}

export interface XaiManagementApiKeyListParams {
  pageSize?: number;
  paginationToken?: string;
  aclFilters?: string[];
  activeOnly?: boolean;
}

export interface XaiManagementApiKeyListResponse {
  apiKeys: XaiManagementApiKey[];
  paginationToken?: string;
}

// Management billing responses
export interface XaiUsdCents {
  val: string;
}

export type XaiBillingBalanceChangeOrigin =
  | "INVALID_ORIGIN"
  | "PURCHASE"
  | "SPEND"
  | "REFUND"
  | "MANUAL"
  | "AUTO_PURCHASE";

export type XaiBillingTopupStatus =
  | "INVALID_STATUS"
  | "TO_GENERATE_INVOICE"
  | "FAILED_TO_GEMNERATE_INVOICE"
  | "TO_CHARGE"
  | "FAILED_TO_CHARGE"
  | "SUCCEEDED";

export interface XaiBillingPaymentProcessor {
  kind: "UNKNOWN" | "STRIPE" | "CHECKOUT" | "EXTERNAL" | "MANUAL";
  externalParty?: string;
  externalInvoiceId?: string;
}

export interface XaiBillingPrepaidBalanceChange {
  teamId: string;
  changeOrigin: XaiBillingBalanceChangeOrigin;
  topupStatus: XaiBillingTopupStatus;
  amount: XaiUsdCents;
  invoiceId?: string;
  invoiceNumber?: string;
  createTime?: string;
  spendBpKeyYear?: number;
  spendBpKeyMonth?: number;
  createTs?: string;
  paymentProcessor?: XaiBillingPaymentProcessor;
}

export interface XaiBillingPrepaidBalanceResponse {
  changes: XaiBillingPrepaidBalanceChange[];
  total: XaiUsdCents;
}

export interface XaiBillingInvoiceLine {
  clusterName: string;
  description: string;
  unitType: string;
  unitPrice: string;
  numUnits: string;
  amount: string;
}

export interface XaiBillingPostpaidInvoicePreviewResponse {
  coreInvoice: {
    lines: XaiBillingInvoiceLine[];
    amountBeforeVatLimited?: XaiUsdCents;
    amountBeforeVatUnlimited?: XaiUsdCents;
    amountBeforeVatLimitedAndUnlimited?: XaiUsdCents;
    amountBeforeVat: string;
    vatCost: string;
    amountAfterVat: string;
    autoCreditsIssued: string;
    defaultCreditsIssued: string;
    totalWithCorr?: XaiUsdCents;
    prepaidCredits?: XaiUsdCents;
    prepaidCreditsUsed?: XaiUsdCents;
  };
  effectiveSpendingLimit: string;
  defaultCredits: string;
  billingCycle: {
    year: number;
    month: number;
  };
}

export interface XaiBillingPostpaidSpendingLimitsResponse {
  spendingLimits: {
    hardSlOverride?: XaiUsdCents;
    hardSlAuto?: XaiUsdCents;
    effectiveHardSl?: XaiUsdCents;
    softSl?: XaiUsdCents;
    effectiveSl?: XaiUsdCents;
  };
}

export interface XaiBillingUsageDataPoint {
  timestamp: string;
  values: number[];
}

export interface XaiBillingUsageTimeSeries {
  group: string[];
  groupLabels: string[];
  dataPoints: XaiBillingUsageDataPoint[];
}

export interface XaiBillingUsageResponse {
  timeSeries: XaiBillingUsageTimeSeries[];
  limitReached: boolean;
}

// ---------------------------------------------------------------------------
// Method interface types (endpoint shapes with .schema)
// ---------------------------------------------------------------------------

import type {
  XaiChatRequest,
  XaiImageGenerateRequest,
  XaiImageEditRequest,
  XaiVideoGenerateRequest,
  XaiVideoEditRequest,
  XaiVideoExtendRequest,
  XaiBatchCreateRequest,
  XaiBatchAddRequestsBody,
  XaiCollectionCreateRequest,
  XaiCollectionUpdateRequest,
  XaiDocumentAddRequest,
  XaiDocumentSearchRequest,
  XaiTokenizeTextRequest,
  XaiRealtimeClientSecretRequest,
  XaiTtsRequest,
  XaiSttRequest,
  XaiCustomVoiceCreateRequest,
  XaiBillingUsageRequest,
} from "./zod";

interface XaiChatCompletionsMethod {
  (req: XaiChatRequest, signal?: AbortSignal): Promise<XaiChatResponse>;
  schema: z.ZodType<XaiChatRequest>;
}

interface XaiImageGenerationsMethod {
  (
    req: XaiImageGenerateRequest,
    signal?: AbortSignal
  ): Promise<XaiImageResponse>;
  schema: z.ZodType<XaiImageGenerateRequest>;
}

interface XaiImageEditsMethod {
  (req: XaiImageEditRequest, signal?: AbortSignal): Promise<XaiImageResponse>;
  schema: z.ZodType<XaiImageEditRequest>;
}

interface XaiVideoGenerationsMethod {
  (
    req: XaiVideoGenerateRequest,
    signal?: AbortSignal
  ): Promise<XaiVideoAsyncResponse>;
  schema: z.ZodType<XaiVideoGenerateRequest>;
  imageToVideo: XaiGrokImagineVideo15ImageToVideoMethod;
}

interface XaiGrokImagineVideo15ImageToVideoMethod {
  (
    req: XaiGrokImagineVideo15ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<XaiGrokImagineVideo15ImageToVideoResponse>;
  schema: z.ZodType<XaiGrokImagineVideo15ImageToVideoRequest>;
}

interface XaiVideoEditsMethod {
  (
    req: XaiVideoEditRequest,
    signal?: AbortSignal
  ): Promise<XaiVideoAsyncResponse>;
  schema: z.ZodType<XaiVideoEditRequest>;
}

interface XaiVideoExtensionsMethod {
  (
    req: XaiVideoExtendRequest,
    signal?: AbortSignal
  ): Promise<XaiVideoAsyncResponse>;
  schema: z.ZodType<XaiVideoExtendRequest>;
}

interface XaiPostResponsesMethod {
  (req: XaiResponseRequest, signal?: AbortSignal): Promise<XaiResponseResponse>;
  schema: z.ZodType<XaiResponseRequest>;
}

interface XaiBillingUsageMethod {
  (
    teamId: string,
    req: XaiBillingUsageRequest,
    signal?: AbortSignal
  ): Promise<XaiBillingUsageResponse>;
  schema: z.ZodType<XaiBillingUsageRequest>;
}

interface XaiPostFilesMethod {
  (
    file: Blob,
    filename: string,
    purpose?: string,
    signal?: AbortSignal
  ): Promise<XaiFileObject>;
}

interface XaiPostBatchesMethod {
  (req: XaiBatchCreateRequest, signal?: AbortSignal): Promise<XaiBatch>;
  schema: z.ZodType<XaiBatchCreateRequest>;
  cancel(batchId: string, signal?: AbortSignal): Promise<XaiBatch>;
  requests(
    batchId: string,
    req: XaiBatchAddRequestsBody,
    signal?: AbortSignal
  ): Promise<void>;
}

interface XaiPostCollectionsMethod {
  (
    req: XaiCollectionCreateRequest,
    signal?: AbortSignal
  ): Promise<XaiCollection>;
  schema: z.ZodType<XaiCollectionCreateRequest>;
  documents(
    collectionId: string,
    fileId: string,
    req?: XaiDocumentAddRequest,
    signal?: AbortSignal
  ): Promise<void>;
}

interface XaiDocumentSearchMethod {
  (
    req: XaiDocumentSearchRequest,
    signal?: AbortSignal
  ): Promise<XaiDocumentSearchResponse>;
  schema: z.ZodType<XaiDocumentSearchRequest>;
}

interface XaiTokenizeTextMethod {
  (
    req: XaiTokenizeTextRequest,
    signal?: AbortSignal
  ): Promise<XaiTokenizeTextResponse>;
  schema: z.ZodType<XaiTokenizeTextRequest>;
}

interface XaiRealtimeClientSecretsMethod {
  (
    req: XaiRealtimeClientSecretRequest,
    signal?: AbortSignal
  ): Promise<XaiRealtimeClientSecretResponse>;
  schema: z.ZodType<XaiRealtimeClientSecretRequest>;
}

interface XaiTtsMethod {
  (req: XaiTtsRequest, signal?: AbortSignal): Promise<ArrayBuffer>;
  schema: z.ZodType<XaiTtsRequest>;
}

interface XaiSttMethod {
  (req: XaiSttRequest, signal?: AbortSignal): Promise<XaiSttResponse>;
  schema: z.ZodType<XaiSttRequest>;
}

interface XaiCustomVoicesMethod {
  (
    req: XaiCustomVoiceCreateRequest,
    signal?: AbortSignal
  ): Promise<XaiCustomVoice>;
  schema: z.ZodType<XaiCustomVoiceCreateRequest>;
}

// Generic list/get method type for models
interface XaiGetModelsLikeMethod<ListResponse, Item> {
  (
    modelIdOrSignal?: string | AbortSignal,
    signal?: AbortSignal
  ): Promise<ListResponse | Item>;
}

// POST v1 namespace
interface XaiPostV1 {
  responses: XaiPostResponsesMethod;
  chat: { completions: XaiChatCompletionsMethod };
  images: {
    generations: XaiImageGenerationsMethod;
    edits: XaiImageEditsMethod;
  };
  videos: {
    generations: XaiVideoGenerationsMethod;
    edits: XaiVideoEditsMethod;
    extensions: XaiVideoExtensionsMethod;
  };
  files: XaiPostFilesMethod;
  batches: XaiPostBatchesMethod;
  documents: { search: XaiDocumentSearchMethod };
  tokenizeText: XaiTokenizeTextMethod;
  realtime: { clientSecrets: XaiRealtimeClientSecretsMethod };
  tts: XaiTtsMethod;
  stt: XaiSttMethod;
  customVoices: XaiCustomVoicesMethod;
}

interface XaiManagementPostV1 {
  collections: XaiPostCollectionsMethod;
  billing: {
    teams: {
      usage: XaiBillingUsageMethod;
    };
  };
}

// GET v1 namespace
interface XaiGetFilesMethod {
  (
    fileIdOrSignal?: string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiFileListResponse | XaiFileObject>;
}

interface XaiGetBatchesMethod {
  (
    paramsOrIdOrSignal?: XaiBatchListParams | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiBatchListResponse | XaiBatch>;
  requests(
    batchId: string,
    params?: XaiBatchRequestListParams,
    signal?: AbortSignal
  ): Promise<XaiBatchRequestListResponse>;
  results(
    batchId: string,
    params?: XaiBatchResultListParams,
    signal?: AbortSignal
  ): Promise<XaiBatchResultListResponse>;
}

interface XaiGetCollectionsDocumentsMethod {
  (
    collectionId: string,
    paramsOrFileId?: XaiDocumentListParams | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiDocumentListResponse | XaiDocument>;
  batchGet(
    collectionId: string,
    fileIds: string[],
    signal?: AbortSignal
  ): Promise<{ documents: XaiDocument[] }>;
}

interface XaiGetCollectionsMethod {
  (
    paramsOrIdOrSignal?: XaiCollectionListParams | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiCollectionListResponse | XaiCollection>;
  documents: XaiGetCollectionsDocumentsMethod;
}

interface XaiGetApiKeyMethod {
  (signal?: AbortSignal): Promise<XaiApiKeyInfo>;
}

interface XaiGetManagementApiKeysMethod {
  (
    teamId: string,
    params?: XaiManagementApiKeyListParams,
    signal?: AbortSignal
  ): Promise<XaiManagementApiKeyListResponse>;
}

interface XaiGetBillingPrepaidBalanceMethod {
  (
    teamId: string,
    signal?: AbortSignal
  ): Promise<XaiBillingPrepaidBalanceResponse>;
}

interface XaiGetBillingPostpaidInvoicePreviewMethod {
  (
    teamId: string,
    signal?: AbortSignal
  ): Promise<XaiBillingPostpaidInvoicePreviewResponse>;
}

interface XaiGetBillingPostpaidSpendingLimitsMethod {
  (
    teamId: string,
    signal?: AbortSignal
  ): Promise<XaiBillingPostpaidSpendingLimitsResponse>;
}

interface XaiGetV1 {
  apiKey: XaiGetApiKeyMethod;
  responses(id: string, signal?: AbortSignal): Promise<XaiResponseResponse>;
  chat: {
    deferredCompletion(
      requestId: string,
      signal?: AbortSignal
    ): Promise<XaiDeferredChatCompletionResult>;
  };
  videos(requestId: string, signal?: AbortSignal): Promise<XaiVideoResult>;
  files: XaiGetFilesMethod;
  models: XaiGetModelsLikeMethod<XaiModelListResponse, XaiModel>;
  languageModels: XaiGetModelsLikeMethod<
    XaiLanguageModelListResponse,
    XaiLanguageModel
  >;
  imageGenerationModels: XaiGetModelsLikeMethod<
    XaiImageGenerationModelListResponse,
    XaiImageGenerationModel
  >;
  videoGenerationModels: XaiGetModelsLikeMethod<
    XaiVideoGenerationModelListResponse,
    XaiVideoGenerationModel
  >;
  batches: XaiGetBatchesMethod;
}

interface XaiManagementGetV1 {
  collections: XaiGetCollectionsMethod;
  billing: {
    teams: {
      prepaid: {
        balance: XaiGetBillingPrepaidBalanceMethod;
      };
      postpaid: {
        invoice: {
          preview: XaiGetBillingPostpaidInvoicePreviewMethod;
        };
        spendingLimits: XaiGetBillingPostpaidSpendingLimitsMethod;
      };
    };
  };
}

interface XaiManagementAuth {
  teams: {
    apiKeys: XaiGetManagementApiKeysMethod;
  };
}

// DELETE v1 namespace
interface XaiDeleteV1 {
  responses(
    id: string,
    signal?: AbortSignal
  ): Promise<XaiResponseDeleteResponse>;
  files(
    fileId: string,
    signal?: AbortSignal
  ): Promise<{ id: string; deleted: boolean }>;
}

interface XaiManagementDeleteV1 {
  collections: {
    (collectionId: string, signal?: AbortSignal): Promise<void>;
    documents(
      collectionId: string,
      fileId: string,
      signal?: AbortSignal
    ): Promise<void>;
  };
}

interface XaiPutCollectionsMethod {
  (
    collectionId: string,
    req: XaiCollectionUpdateRequest,
    signal?: AbortSignal
  ): Promise<XaiCollection>;
  schema: z.ZodType<XaiCollectionUpdateRequest>;
}

interface XaiManagementPutV1 {
  collections: XaiPutCollectionsMethod;
}

interface XaiManagementPatchV1 {
  collections: {
    documents(
      collectionId: string,
      fileId: string,
      signal?: AbortSignal
    ): Promise<void>;
  };
}

// WebSocket v1 namespace
interface XaiWsV1 {
  realtime(opts?: XaiRealtimeConnectOptions): XaiRealtimeConnection;
}

// Provider interface
export interface XaiProvider {
  post: { v1: XaiPostV1; managementApi: { v1: XaiManagementPostV1 } };
  get: {
    v1: XaiGetV1;
    managementApi: { v1: XaiManagementGetV1; auth: XaiManagementAuth };
  };
  delete: { v1: XaiDeleteV1; managementApi: { v1: XaiManagementDeleteV1 } };
  put: { managementApi: { v1: XaiManagementPutV1 } };
  patch: { managementApi: { v1: XaiManagementPatchV1 } };
  ws: { v1: XaiWsV1 };
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
