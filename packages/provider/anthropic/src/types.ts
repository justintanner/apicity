// Anthropic provider options
export interface AnthropicOptions {
  apiKey: string;
  baseURL?: string;
  adminApiKey?: string;
  timeout?: number;
  defaultVersion?: string;
  defaultBeta?: string[];
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// ---------- Shared pagination ----------

export interface AnthropicListParams {
  after_id?: string;
  before_id?: string;
  limit?: number;
}

export interface AnthropicListResponse<T> {
  data: T[];
  first_id: string | null;
  last_id: string | null;
  has_more: boolean;
}

// ---------- Messages API ----------

export interface AnthropicTextBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl?: "5m" | "1h" };
}

export interface AnthropicImageSource {
  type: "base64";
  media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string;
}

export interface AnthropicImageBlock {
  type: "image";
  source: AnthropicImageSource;
  cache_control?: { type: "ephemeral"; ttl?: "5m" | "1h" };
}

export interface AnthropicDocumentSource {
  type: "base64";
  media_type: "application/pdf";
  data: string;
}

export interface AnthropicDocumentBlock {
  type: "document";
  source: AnthropicDocumentSource;
  cache_control?: { type: "ephemeral"; ttl?: "5m" | "1h" };
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
  content?: string | AnthropicContentBlock[];
  is_error?: boolean;
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

export interface AnthropicServerToolUseBlock {
  type: "server_tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AnthropicServerToolResultBlock {
  type: "server_tool_result";
  tool_use_id: string;
  content: AnthropicContentBlock[];
}

export interface AnthropicFileBlock {
  type: "file";
  source: {
    type: "file";
    file_id: string;
  };
}

export type AnthropicContentBlock =
  | AnthropicTextBlock
  | AnthropicImageBlock
  | AnthropicDocumentBlock
  | AnthropicToolUseBlock
  | AnthropicToolResultBlock
  | AnthropicThinkingBlock
  | AnthropicRedactedThinkingBlock
  | AnthropicServerToolUseBlock
  | AnthropicServerToolResultBlock
  | AnthropicFileBlock;

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

export interface AnthropicToolInputSchema {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface AnthropicCustomTool {
  type?: "custom";
  name: string;
  description?: string;
  input_schema: AnthropicToolInputSchema;
  cache_control?: { type: "ephemeral" };
}

export interface AnthropicBashTool {
  type: "bash_20250124";
  name?: "bash";
  cache_control?: { type: "ephemeral" };
}

export interface AnthropicTextEditorTool {
  type: "text_editor_20250124";
  name?: "str_replace_editor";
  cache_control?: { type: "ephemeral" };
}

export interface AnthropicWebSearchTool {
  type: "web_search_20250305";
  name?: "web_search";
  max_uses?: number;
  allowed_domains?: string[];
  blocked_domains?: string[];
  user_location?: {
    type: "approximate";
    city?: string;
    region?: string;
    country?: string;
    timezone?: string;
  };
  cache_control?: { type: "ephemeral" };
}

export interface AnthropicCodeExecutionTool {
  type: "code_execution_20250522";
  name?: "code_execution";
  cache_control?: { type: "ephemeral" };
}

export type AnthropicTool =
  | AnthropicCustomTool
  | AnthropicBashTool
  | AnthropicTextEditorTool
  | AnthropicWebSearchTool
  | AnthropicCodeExecutionTool;

export interface AnthropicToolChoice {
  type: "auto" | "any" | "tool" | "none";
  name?: string;
  disable_parallel_tool_use?: boolean;
}

export interface AnthropicThinkingConfig {
  type: "enabled" | "disabled" | "adaptive";
  budget_tokens?: number;
  display?: "summarized" | "omitted";
}

export interface AnthropicMetadata {
  user_id?: string;
}

export interface AnthropicMessageRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string | AnthropicTextBlock[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  metadata?: AnthropicMetadata;
  tools?: AnthropicTool[];
  tool_choice?: AnthropicToolChoice;
  thinking?: AnthropicThinkingConfig;
  service_tier?: "auto" | "standard_only";
  container?: string;
}

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: {
    ephemeral_1h_input_tokens?: number;
    ephemeral_5m_input_tokens?: number;
  };
  server_tool_use?: {
    web_search_requests?: number;
    web_fetch_requests?: number;
  };
  service_tier?: "standard" | "priority" | "batch";
}

export interface AnthropicMessageResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason:
    | "end_turn"
    | "max_tokens"
    | "stop_sequence"
    | "tool_use"
    | "pause_turn"
    | "refusal"
    | null;
  stop_sequence: string | null;
  usage: AnthropicUsage;
  container?: { id: string; expires_at: string };
}

// ---------- SSE streaming types ----------

export interface AnthropicStreamMessageStart {
  type: "message_start";
  message: AnthropicMessageResponse;
}

export interface AnthropicStreamContentBlockStart {
  type: "content_block_start";
  index: number;
  content_block: AnthropicContentBlock;
}

export interface AnthropicStreamTextDelta {
  type: "text_delta";
  text: string;
}

export interface AnthropicStreamInputJsonDelta {
  type: "input_json_delta";
  partial_json: string;
}

export interface AnthropicStreamThinkingDelta {
  type: "thinking_delta";
  thinking: string;
}

export interface AnthropicStreamSignatureDelta {
  type: "signature_delta";
  signature: string;
}

export type AnthropicStreamDelta =
  | AnthropicStreamTextDelta
  | AnthropicStreamInputJsonDelta
  | AnthropicStreamThinkingDelta
  | AnthropicStreamSignatureDelta;

export interface AnthropicStreamContentBlockDelta {
  type: "content_block_delta";
  index: number;
  delta: AnthropicStreamDelta;
}

export interface AnthropicStreamContentBlockStop {
  type: "content_block_stop";
  index: number;
}

export interface AnthropicStreamMessageDelta {
  type: "message_delta";
  delta: {
    stop_reason: string | null;
    stop_sequence: string | null;
  };
  usage: { output_tokens: number };
}

export interface AnthropicStreamMessageStop {
  type: "message_stop";
}

export interface AnthropicStreamPing {
  type: "ping";
}

export interface AnthropicStreamError {
  type: "error";
  error: { type: string; message: string };
}

export type AnthropicStreamEvent =
  | AnthropicStreamMessageStart
  | AnthropicStreamContentBlockStart
  | AnthropicStreamContentBlockDelta
  | AnthropicStreamContentBlockStop
  | AnthropicStreamMessageDelta
  | AnthropicStreamMessageStop
  | AnthropicStreamPing
  | AnthropicStreamError;

// ---------- Token counting ----------

export interface AnthropicCountTokensRequest {
  model: string;
  messages: AnthropicMessage[];
  system?: string | AnthropicTextBlock[];
  tools?: AnthropicTool[];
  tool_choice?: AnthropicToolChoice;
  thinking?: AnthropicThinkingConfig;
}

export interface AnthropicCountTokensResponse {
  input_tokens: number;
}

// ---------- Models API ----------

export interface AnthropicModelCapabilities {
  batch?: { supported: boolean };
  citations?: { supported: boolean };
  code_execution?: { supported: boolean };
  image_input?: { supported: boolean };
  pdf_input?: { supported: boolean };
  structured_outputs?: { supported: boolean };
  thinking?: {
    supported: boolean;
    types?: { adaptive?: boolean; enabled?: boolean };
  };
}

export interface AnthropicModel {
  id: string;
  type: "model";
  display_name: string;
  created_at: string;
  max_input_tokens: number;
  max_tokens: number;
  capabilities?: AnthropicModelCapabilities;
}

export type AnthropicModelListResponse = AnthropicListResponse<AnthropicModel>;

// ---------- Message Batches API ----------

export interface AnthropicBatchRequest {
  custom_id: string;
  params: AnthropicMessageRequest;
}

export interface AnthropicBatchCreateRequest {
  requests: AnthropicBatchRequest[];
}

export interface AnthropicBatchRequestCounts {
  processing: number;
  succeeded: number;
  errored: number;
  canceled: number;
  expired: number;
}

export interface AnthropicBatch {
  id: string;
  type: "message_batch";
  processing_status: "in_progress" | "canceling" | "ended";
  request_counts: AnthropicBatchRequestCounts;
  results_url: string | null;
  archived_at: string | null;
  cancel_initiated_at: string | null;
  created_at: string;
  ended_at: string | null;
  expires_at: string;
}

export type AnthropicBatchListResponse = AnthropicListResponse<AnthropicBatch>;

export interface AnthropicBatchResultSuccess {
  type: "succeeded";
  message: AnthropicMessageResponse;
}

export interface AnthropicBatchResultErrored {
  type: "errored";
  error: { type: string; message: string };
}

export interface AnthropicBatchResultCanceled {
  type: "canceled";
}

export interface AnthropicBatchResultExpired {
  type: "expired";
}

export type AnthropicBatchResultType =
  | AnthropicBatchResultSuccess
  | AnthropicBatchResultErrored
  | AnthropicBatchResultCanceled
  | AnthropicBatchResultExpired;

export interface AnthropicBatchResultEntry {
  custom_id: string;
  result: AnthropicBatchResultType;
}

export interface AnthropicBatchDeleteResponse {
  id: string;
  type: "message_batch_deleted";
}

// ---------- Files API (Beta) ----------

export interface AnthropicFile {
  id: string;
  type: "file";
  filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  downloadable?: boolean;
}

export type AnthropicFileListResponse = AnthropicListResponse<AnthropicFile>;

export interface AnthropicFileDeleteResponse {
  id: string;
  type: "file_deleted";
}

// ---------- Admin API ----------

export interface AnthropicOrganization {
  id: string;
  type: "organization";
  name: string;
}

// Users

export interface AnthropicUser {
  id: string;
  type: "user";
  name: string;
  email: string;
  role:
    | "user"
    | "developer"
    | "billing"
    | "admin"
    | "claude_code_user"
    | "managed";
  added_at: string;
}

export type AnthropicUserListResponse = AnthropicListResponse<AnthropicUser>;

export interface AnthropicUserUpdateRequest {
  role: "user" | "developer" | "billing" | "claude_code_user" | "managed";
}

export interface AnthropicUserDeleteResponse {
  id: string;
  type: "user_deleted";
}

// Invites

export interface AnthropicInvite {
  id: string;
  type: "invite";
  email: string;
  role: string;
  status: "accepted" | "expired" | "deleted" | "pending";
  invited_at: string;
  expires_at: string;
}

export type AnthropicInviteListResponse =
  AnthropicListResponse<AnthropicInvite>;

export interface AnthropicInviteCreateRequest {
  email: string;
  role: "user" | "developer" | "billing" | "claude_code_user" | "managed";
}

export interface AnthropicInviteDeleteResponse {
  id: string;
  type: "invite_deleted";
}

// Workspaces

export interface AnthropicDataResidency {
  workspace_geo?: string;
  allowed_inference_geos?: string[];
  default_inference_geo?: string;
}

export interface AnthropicWorkspace {
  id: string;
  type: "workspace";
  name: string;
  display_color: string;
  created_at: string;
  archived_at: string | null;
  data_residency?: AnthropicDataResidency;
}

export type AnthropicWorkspaceListResponse =
  AnthropicListResponse<AnthropicWorkspace>;

export interface AnthropicWorkspaceListParams extends AnthropicListParams {
  include_archived?: boolean;
}

export interface AnthropicWorkspaceCreateRequest {
  name: string;
  data_residency?: AnthropicDataResidency;
}

export interface AnthropicWorkspaceUpdateRequest {
  name: string;
  data_residency?: {
    allowed_inference_geos?: string[];
    default_inference_geo?: string;
  };
}

// Workspace Members

export interface AnthropicWorkspaceMember {
  type: "workspace_member";
  user_id: string;
  workspace_id: string;
  workspace_role:
    | "workspace_user"
    | "workspace_developer"
    | "workspace_admin"
    | "workspace_billing";
}

export type AnthropicWorkspaceMemberListResponse =
  AnthropicListResponse<AnthropicWorkspaceMember>;

export interface AnthropicWorkspaceMemberAddRequest {
  user_id: string;
  workspace_role: "workspace_user" | "workspace_developer" | "workspace_admin";
}

export interface AnthropicWorkspaceMemberUpdateRequest {
  workspace_role:
    | "workspace_user"
    | "workspace_developer"
    | "workspace_admin"
    | "workspace_billing";
}

export interface AnthropicWorkspaceMemberDeleteResponse {
  type: "workspace_member_deleted";
  user_id: string;
  workspace_id: string;
}

// ---------- Skills API (Beta) ----------

export interface AnthropicSkillFile {
  data: Blob;
  path: string;
}

export interface AnthropicSkill {
  id: string;
  type: "skill";
  display_title: string;
  source: "custom" | "anthropic";
  latest_version: string;
  created_at: string;
  updated_at: string;
}

export interface AnthropicSkillsListParams {
  limit?: number;
  page?: string;
  source?: "custom" | "anthropic";
}

export interface AnthropicSkillsListResponse {
  data: AnthropicSkill[];
  has_more: boolean;
  next_page: string | null;
}

export interface AnthropicSkillDeleteResponse {
  id: string;
  type: "skill_deleted";
}

export interface AnthropicSkillVersion {
  id: string;
  type: "skill_version";
  skill_id: string;
  version: string;
  name: string;
  description: string;
  directory: string;
  created_at: string;
}

export interface AnthropicSkillVersionsListParams {
  limit?: number;
  page?: string;
}

export interface AnthropicSkillVersionsListResponse {
  data: AnthropicSkillVersion[];
  has_more: boolean;
  next_page: string | null;
}

export interface AnthropicSkillVersionDeleteResponse {
  id: string;
  type: "skill_version_deleted";
}

// API Keys

export interface AnthropicApiKey {
  id: string;
  type: "api_key";
  name: string;
  status: "active" | "inactive" | "archived";
  partial_key_hint: string;
  workspace_id: string | null;
  created_at: string;
  created_by: { id: string; type: string };
}

export type AnthropicApiKeyListResponse =
  AnthropicListResponse<AnthropicApiKey>;

export interface AnthropicApiKeyListParams extends AnthropicListParams {
  status?: "active" | "inactive" | "archived";
  workspace_id?: string;
  created_by_user_id?: string;
}

export interface AnthropicApiKeyUpdateRequest {
  name?: string;
  status?: "active" | "inactive" | "archived";
}

// ---------- Schema types ----------

export interface PayloadFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
  items?: PayloadFieldSchema;
  properties?: Record<string, PayloadFieldSchema>;
}

export interface PayloadSchema {
  method: "POST" | "DELETE" | "GET";
  path: string;
  contentType: "application/json" | "multipart/form-data";
  fields: Record<string, PayloadFieldSchema>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------- Provider interface ----------

// POST namespace types
export interface AnthropicPostMessagesMethod {
  (
    req: AnthropicMessageRequest,
    signal?: AbortSignal
  ): Promise<AnthropicMessageResponse>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
  stream: (
    req: AnthropicMessageRequest,
    signal?: AbortSignal
  ) => Promise<AsyncIterable<AnthropicStreamEvent>>;
  countTokens: AnthropicPostCountTokensMethod;
  batches: AnthropicPostBatchesMethod;
}

export interface AnthropicPostCountTokensMethod {
  (
    req: AnthropicCountTokensRequest,
    signal?: AbortSignal
  ): Promise<AnthropicCountTokensResponse>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
}

export interface AnthropicPostBatchesMethod {
  (
    req: AnthropicBatchCreateRequest,
    signal?: AbortSignal
  ): Promise<AnthropicBatch>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
  cancel: (batchId: string, signal?: AbortSignal) => Promise<AnthropicBatch>;
}

export interface AnthropicPostFilesMethod {
  (file: Blob, signal?: AbortSignal): Promise<AnthropicFile>;
  payloadSchema: PayloadSchema;
}

export interface AnthropicPostSkillsCreateMethod {
  (
    displayTitle: string,
    files: AnthropicSkillFile[],
    signal?: AbortSignal
  ): Promise<AnthropicSkill>;
  payloadSchema: PayloadSchema;
}

export interface AnthropicPostSkillVersionsCreateMethod {
  (
    skillId: string,
    files: AnthropicSkillFile[],
    signal?: AbortSignal
  ): Promise<AnthropicSkillVersion>;
  payloadSchema: PayloadSchema;
}

export interface AnthropicPostInvitesCreateMethod {
  (
    req: AnthropicInviteCreateRequest,
    signal?: AbortSignal
  ): Promise<AnthropicInvite>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
}

export interface AnthropicPostWorkspacesCreateMethod {
  (
    req: AnthropicWorkspaceCreateRequest,
    signal?: AbortSignal
  ): Promise<AnthropicWorkspace>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
}

export interface AnthropicPostWorkspaceMembersAddMethod {
  (
    workspaceId: string,
    req: AnthropicWorkspaceMemberAddRequest,
    signal?: AbortSignal
  ): Promise<AnthropicWorkspaceMember>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
}

export interface AnthropicPostV1Namespace {
  messages: AnthropicPostMessagesMethod;
  files: AnthropicPostFilesMethod;
  skills: {
    create: AnthropicPostSkillsCreateMethod;
    versions: {
      create: AnthropicPostSkillVersionsCreateMethod;
    };
  };
  organizations: {
    invites: {
      create: AnthropicPostInvitesCreateMethod;
    };
    workspaces: {
      create: AnthropicPostWorkspacesCreateMethod;
      members: {
        add: AnthropicPostWorkspaceMembersAddMethod;
      };
    };
    apiKeys: {
      update: (
        apiKeyId: string,
        req: AnthropicApiKeyUpdateRequest,
        signal?: AbortSignal
      ) => Promise<AnthropicApiKey>;
    };
  };
}

// GET namespace types
export interface AnthropicGetV1Namespace {
  messages: {
    batches: {
      list: (
        params?: AnthropicListParams,
        signal?: AbortSignal
      ) => Promise<AnthropicBatchListResponse>;
      retrieve: (
        batchId: string,
        signal?: AbortSignal
      ) => Promise<AnthropicBatch>;
      results: (batchId: string, signal?: AbortSignal) => Promise<string>;
    };
  };
  models: {
    list: (
      params?: AnthropicListParams,
      signal?: AbortSignal
    ) => Promise<AnthropicModelListResponse>;
    retrieve: (
      modelId: string,
      signal?: AbortSignal
    ) => Promise<AnthropicModel>;
  };
  files: {
    list: (
      params?: AnthropicListParams,
      signal?: AbortSignal
    ) => Promise<AnthropicFileListResponse>;
    retrieve: (fileId: string, signal?: AbortSignal) => Promise<AnthropicFile>;
    content: (fileId: string, signal?: AbortSignal) => Promise<ArrayBuffer>;
  };
  skills: {
    list: (
      params?: AnthropicSkillsListParams,
      signal?: AbortSignal
    ) => Promise<AnthropicSkillsListResponse>;
    retrieve: (
      skillId: string,
      signal?: AbortSignal
    ) => Promise<AnthropicSkill>;
    versions: {
      list: (
        skillId: string,
        params?: AnthropicSkillVersionsListParams,
        signal?: AbortSignal
      ) => Promise<AnthropicSkillVersionsListResponse>;
    };
  };
  organizations: {
    me: (signal?: AbortSignal) => Promise<AnthropicOrganization>;
    users: {
      list: (
        params?: AnthropicListParams & { email?: string },
        signal?: AbortSignal
      ) => Promise<AnthropicUserListResponse>;
      retrieve: (
        userId: string,
        signal?: AbortSignal
      ) => Promise<AnthropicUser>;
    };
    invites: {
      list: (
        params?: AnthropicListParams,
        signal?: AbortSignal
      ) => Promise<AnthropicInviteListResponse>;
      retrieve: (
        inviteId: string,
        signal?: AbortSignal
      ) => Promise<AnthropicInvite>;
    };
    workspaces: {
      list: (
        params?: AnthropicWorkspaceListParams,
        signal?: AbortSignal
      ) => Promise<AnthropicWorkspaceListResponse>;
      retrieve: (
        workspaceId: string,
        signal?: AbortSignal
      ) => Promise<AnthropicWorkspace>;
      members: {
        list: (
          workspaceId: string,
          params?: AnthropicListParams,
          signal?: AbortSignal
        ) => Promise<AnthropicWorkspaceMemberListResponse>;
        retrieve: (
          workspaceId: string,
          userId: string,
          signal?: AbortSignal
        ) => Promise<AnthropicWorkspaceMember>;
      };
    };
    apiKeys: {
      list: (
        params?: AnthropicApiKeyListParams,
        signal?: AbortSignal
      ) => Promise<AnthropicApiKeyListResponse>;
      retrieve: (
        apiKeyId: string,
        signal?: AbortSignal
      ) => Promise<AnthropicApiKey>;
    };
  };
}

// DELETE namespace types
export interface AnthropicDeleteV1Namespace {
  messages: {
    batches: {
      del: (
        batchId: string,
        signal?: AbortSignal
      ) => Promise<AnthropicBatchDeleteResponse>;
    };
  };
  files: {
    del: (
      fileId: string,
      signal?: AbortSignal
    ) => Promise<AnthropicFileDeleteResponse>;
  };
  skills: {
    del: (
      skillId: string,
      signal?: AbortSignal
    ) => Promise<AnthropicSkillDeleteResponse>;
    versions: {
      del: (
        skillId: string,
        version: string,
        signal?: AbortSignal
      ) => Promise<AnthropicSkillVersionDeleteResponse>;
    };
  };
  organizations: {
    users: {
      del: (
        userId: string,
        signal?: AbortSignal
      ) => Promise<AnthropicUserDeleteResponse>;
    };
    invites: {
      del: (
        inviteId: string,
        signal?: AbortSignal
      ) => Promise<AnthropicInviteDeleteResponse>;
    };
    workspaces: {
      members: {
        del: (
          workspaceId: string,
          userId: string,
          signal?: AbortSignal
        ) => Promise<AnthropicWorkspaceMemberDeleteResponse>;
      };
    };
  };
}

// Legacy namespace types (backward compatibility)
export interface AnthropicMessagesMethod {
  (
    req: AnthropicMessageRequest,
    signal?: AbortSignal
  ): Promise<AnthropicMessageResponse>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
  stream: (
    req: AnthropicMessageRequest,
    signal?: AbortSignal
  ) => Promise<AsyncIterable<AnthropicStreamEvent>>;
  countTokens: AnthropicCountTokensMethod;
  batches: AnthropicBatchesMethod;
}

export interface AnthropicCountTokensMethod {
  (
    req: AnthropicCountTokensRequest,
    signal?: AbortSignal
  ): Promise<AnthropicCountTokensResponse>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
}

export interface AnthropicBatchesMethod {
  (
    req: AnthropicBatchCreateRequest,
    signal?: AbortSignal
  ): Promise<AnthropicBatch>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
  list: (
    params?: AnthropicListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicBatchListResponse>;
  retrieve: (batchId: string, signal?: AbortSignal) => Promise<AnthropicBatch>;
  cancel: (batchId: string, signal?: AbortSignal) => Promise<AnthropicBatch>;
  results: (batchId: string, signal?: AbortSignal) => Promise<string>;
  del: (
    batchId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicBatchDeleteResponse>;
}

export interface AnthropicModelsNamespace {
  list: (
    params?: AnthropicListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicModelListResponse>;
  retrieve: (modelId: string, signal?: AbortSignal) => Promise<AnthropicModel>;
}

export interface AnthropicFilesNamespace {
  upload: AnthropicFilesUploadMethod;
  list: (
    params?: AnthropicListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicFileListResponse>;
  retrieve: (fileId: string, signal?: AbortSignal) => Promise<AnthropicFile>;
  content: (fileId: string, signal?: AbortSignal) => Promise<ArrayBuffer>;
  del: (
    fileId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicFileDeleteResponse>;
}

export interface AnthropicFilesUploadMethod {
  (file: Blob, signal?: AbortSignal): Promise<AnthropicFile>;
  payloadSchema: PayloadSchema;
}

// Admin sub-namespaces

export interface AnthropicUsersNamespace {
  list: (
    params?: AnthropicListParams & { email?: string },
    signal?: AbortSignal
  ) => Promise<AnthropicUserListResponse>;
  retrieve: (userId: string, signal?: AbortSignal) => Promise<AnthropicUser>;
  update: (
    userId: string,
    req: AnthropicUserUpdateRequest,
    signal?: AbortSignal
  ) => Promise<AnthropicUser>;
  del: (
    userId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicUserDeleteResponse>;
}

export interface AnthropicInvitesNamespace {
  create: AnthropicInvitesCreateMethod;
  list: (
    params?: AnthropicListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicInviteListResponse>;
  retrieve: (
    inviteId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicInvite>;
  del: (
    inviteId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicInviteDeleteResponse>;
}

export interface AnthropicInvitesCreateMethod {
  (
    req: AnthropicInviteCreateRequest,
    signal?: AbortSignal
  ): Promise<AnthropicInvite>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
}

export interface AnthropicWorkspacesNamespace {
  create: AnthropicWorkspacesCreateMethod;
  list: (
    params?: AnthropicWorkspaceListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicWorkspaceListResponse>;
  retrieve: (
    workspaceId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicWorkspace>;
  update: (
    workspaceId: string,
    req: AnthropicWorkspaceUpdateRequest,
    signal?: AbortSignal
  ) => Promise<AnthropicWorkspace>;
  archive: (
    workspaceId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicWorkspace>;
  members: AnthropicWorkspaceMembersNamespace;
}

export interface AnthropicWorkspacesCreateMethod {
  (
    req: AnthropicWorkspaceCreateRequest,
    signal?: AbortSignal
  ): Promise<AnthropicWorkspace>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
}

export interface AnthropicWorkspaceMembersNamespace {
  add: AnthropicWorkspaceMembersAddMethod;
  list: (
    workspaceId: string,
    params?: AnthropicListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicWorkspaceMemberListResponse>;
  retrieve: (
    workspaceId: string,
    userId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicWorkspaceMember>;
  update: (
    workspaceId: string,
    userId: string,
    req: AnthropicWorkspaceMemberUpdateRequest,
    signal?: AbortSignal
  ) => Promise<AnthropicWorkspaceMember>;
  del: (
    workspaceId: string,
    userId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicWorkspaceMemberDeleteResponse>;
}

export interface AnthropicWorkspaceMembersAddMethod {
  (
    workspaceId: string,
    req: AnthropicWorkspaceMemberAddRequest,
    signal?: AbortSignal
  ): Promise<AnthropicWorkspaceMember>;
  payloadSchema: PayloadSchema;
  validatePayload: (data: unknown) => ValidationResult;
}

export interface AnthropicApiKeysNamespace {
  list: (
    params?: AnthropicApiKeyListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicApiKeyListResponse>;
  retrieve: (
    apiKeyId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicApiKey>;
  update: (
    apiKeyId: string,
    req: AnthropicApiKeyUpdateRequest,
    signal?: AbortSignal
  ) => Promise<AnthropicApiKey>;
}

// Skills namespaces

export interface AnthropicSkillsCreateMethod {
  (
    displayTitle: string,
    files: AnthropicSkillFile[],
    signal?: AbortSignal
  ): Promise<AnthropicSkill>;
  payloadSchema: PayloadSchema;
}

export interface AnthropicSkillVersionsCreateMethod {
  (
    skillId: string,
    files: AnthropicSkillFile[],
    signal?: AbortSignal
  ): Promise<AnthropicSkillVersion>;
  payloadSchema: PayloadSchema;
}

export interface AnthropicSkillVersionsNamespace {
  create: AnthropicSkillVersionsCreateMethod;
  list: (
    skillId: string,
    params?: AnthropicSkillVersionsListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicSkillVersionsListResponse>;
  del: (
    skillId: string,
    version: string,
    signal?: AbortSignal
  ) => Promise<AnthropicSkillVersionDeleteResponse>;
}

export interface AnthropicSkillsNamespace {
  create: AnthropicSkillsCreateMethod;
  list: (
    params?: AnthropicSkillsListParams,
    signal?: AbortSignal
  ) => Promise<AnthropicSkillsListResponse>;
  retrieve: (skillId: string, signal?: AbortSignal) => Promise<AnthropicSkill>;
  del: (
    skillId: string,
    signal?: AbortSignal
  ) => Promise<AnthropicSkillDeleteResponse>;
  versions: AnthropicSkillVersionsNamespace;
}

export interface AnthropicOrganizationsNamespace {
  me: (signal?: AbortSignal) => Promise<AnthropicOrganization>;
  users: AnthropicUsersNamespace;
  invites: AnthropicInvitesNamespace;
  workspaces: AnthropicWorkspacesNamespace;
  api_keys: AnthropicApiKeysNamespace;
}

export interface AnthropicV1Namespace {
  messages: AnthropicMessagesMethod;
  models: AnthropicModelsNamespace;
  files: AnthropicFilesNamespace;
  skills: AnthropicSkillsNamespace;
  organizations: AnthropicOrganizationsNamespace;
}

export interface AnthropicProvider {
  post: { v1: AnthropicPostV1Namespace };
  get: { v1: AnthropicGetV1Namespace };
  delete: { v1: AnthropicDeleteV1Namespace };
  // Legacy namespace (backward compatibility)
  v1: AnthropicV1Namespace;
}

// ---------- Error class ----------

export class AnthropicError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly errorType?: string;

  constructor(
    message: string,
    status: number,
    body?: unknown,
    errorType?: string
  ) {
    super(message);
    this.name = "AnthropicError";
    this.status = status;
    this.body = body ?? null;
    this.errorType = errorType;
  }
}
