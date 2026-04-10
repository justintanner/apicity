// Fal provider options
export interface FalOptions {
  apiKey: string;
  baseURL?: string;
  queueBaseURL?: string;
  runBaseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// Error types returned by fal API
export type FalErrorType =
  | "authorization_error"
  | "validation_error"
  | "not_found"
  | "rate_limited"
  | "server_error"
  | "not_implemented";

// Error class
export class FalError extends Error {
  readonly status: number;
  readonly type: FalErrorType;
  readonly request_id?: string;
  readonly docs_url?: string;
  readonly body: unknown;

  constructor(
    message: string,
    status: number,
    type: FalErrorType,
    request_id?: string,
    docs_url?: string,
    body?: unknown
  ) {
    super(message);
    this.name = "FalError";
    this.status = status;
    this.type = type;
    this.request_id = request_id;
    this.docs_url = docs_url;
    this.body = body ?? null;
  }
}

// Pagination parameters
export interface FalPaginatedParams {
  limit?: number;
  cursor?: string;
}

// Time range parameters
export interface FalTimeRangeParams {
  start?: string;
  end?: string;
  timezone?: string;
  timeframe?: "minute" | "hour" | "day" | "week" | "month";
  bound_to_timeframe?: boolean;
}

// ==================== Models ====================

// Model search parameters
export interface FalModelSearchParams extends FalPaginatedParams {
  endpoint_id?: string | string[];
  q?: string;
  category?: string;
  status?: "active" | "deprecated";
  expand?: string[];
}

// Model group information
export interface FalModelGroup {
  key: string;
  label: string;
}

// Model metadata
export interface FalModelMetadata {
  display_name: string;
  category: string;
  description: string;
  status: "active" | "deprecated";
  tags: string[];
  updated_at: string;
  is_favorited: boolean | null;
  thumbnail_url: string;
  thumbnail_animated_url?: string;
  model_url: string;
  github_url?: string;
  license_type?: "commercial" | "research" | "private";
  date: string;
  group?: FalModelGroup;
  highlighted: boolean;
  kind?: "inference" | "training";
  training_endpoint_ids?: string[];
  inference_endpoint_ids?: string[];
  stream_url?: string;
  duration_estimate?: number;
  pinned: boolean;
}

// OpenAPI specification or error
export interface FalOpenApiSpec {
  openapi: string;
  [key: string]: unknown;
}

export interface FalOpenApiError {
  error: {
    code: string;
    message: string;
  };
}

// Model information
export interface FalModel {
  endpoint_id: string;
  metadata?: FalModelMetadata;
  openapi?: FalOpenApiSpec | FalOpenApiError;
}

// Model search response
export interface FalModelSearchResponse {
  models: FalModel[];
  next_cursor: string | null;
  has_more: boolean;
}

// ==================== Pricing ====================

// Pricing parameters
export interface FalPricingParams {
  endpoint_id: string | string[];
}

// Price information for a model
export interface FalPrice {
  endpoint_id: string;
  unit_price: number;
  unit: string;
  currency: string;
}

// Pricing response
export interface FalPricingResponse {
  prices: FalPrice[];
  next_cursor: string | null;
  has_more: boolean;
}

// ==================== Cost Estimation ====================

// Historical API price estimate request
export interface FalHistoricalApiPriceEstimate {
  estimate_type: "historical_api_price";
  endpoints: Record<string, { call_quantity: number }>;
}

// Unit price estimate request
export interface FalUnitPriceEstimate {
  estimate_type: "unit_price";
  endpoints: Record<string, { unit_quantity: number }>;
}

// Estimate request (discriminated union)
export type FalEstimateRequest =
  | FalHistoricalApiPriceEstimate
  | FalUnitPriceEstimate;

// Estimate response
export interface FalEstimateResponse {
  estimate_type: "historical_api_price" | "unit_price";
  total_cost: number;
  currency: string;
}

// ==================== Usage ====================

// Usage parameters
export interface FalUsageParams extends FalPaginatedParams, FalTimeRangeParams {
  endpoint_id?: string | string[];
  expand?: string[];
}

// Usage record
export interface FalUsageRecord {
  endpoint_id: string;
  unit: string;
  quantity: number;
  unit_price: number;
  cost: number;
  currency: string;
  auth_method?: string;
}

// Usage time bucket
export interface FalUsageBucket {
  bucket: string;
  results: FalUsageRecord[];
}

// Usage response
export interface FalUsageResponse {
  next_cursor: string | null;
  has_more: boolean;
  time_series?: FalUsageBucket[];
  summary?: FalUsageRecord[];
}

// ==================== Analytics ====================

// Analytics parameters
export interface FalAnalyticsParams
  extends FalPaginatedParams, FalTimeRangeParams {
  endpoint_id: string | string[];
  expand?: string[];
}

// Analytics record
export interface FalAnalyticsRecord {
  endpoint_id: string;
  request_count?: number;
  success_count?: number;
  user_error_count?: number;
  error_count?: number;
  p50_duration?: number;
  p75_duration?: number;
  p90_duration?: number;
  p50_prepare_duration?: number;
  p75_prepare_duration?: number;
  p90_prepare_duration?: number;
}

// Analytics time bucket
export interface FalAnalyticsBucket {
  bucket: string;
  results: FalAnalyticsRecord[];
}

// Analytics response
export interface FalAnalyticsResponse {
  next_cursor: string | null;
  has_more: boolean;
  time_series?: FalAnalyticsBucket[];
  summary?: FalAnalyticsRecord[];
}

// ==================== Requests ====================

// Requests parameters
export interface FalRequestsParams extends FalPaginatedParams {
  endpoint_id: string;
  start?: string;
  end?: string;
  status?: "success" | "error" | "user_error";
  request_id?: string;
  expand?: string[];
  sort_by?: "ended_at" | "duration";
}

// Request item
export interface FalRequestItem {
  request_id: string;
  endpoint_id: string;
  started_at: string;
  sent_at: string;
  ended_at?: string;
  status_code?: number;
  duration?: number;
  json_input?: unknown;
  json_output?: unknown;
}

// Requests response
export interface FalRequestsResponse {
  next_cursor: string | null;
  has_more: boolean;
  items: FalRequestItem[];
}

// ==================== Delete Payloads ====================

// Delete payloads parameters
export interface FalDeletePayloadsParams {
  request_id: string;
  idempotency_key?: string;
}

// CDN delete result
export interface FalCdnDeleteResult {
  link: string;
  exception: string | null;
}

// Delete payloads response
export interface FalDeletePayloadsResponse {
  cdn_delete_results: FalCdnDeleteResult[];
}

// ==================== Workflows ====================

// Workflow list parameters
export interface FalWorkflowListParams extends FalPaginatedParams {
  search?: string;
  used_endpoint_ids?: string | string[];
}

// Workflow list item
export interface FalWorkflowListItem {
  name: string;
  title: string;
  user_nickname: string;
  created_at: string;
  thumbnail_url?: string;
  description?: string;
  tags: string[];
  endpoint_ids: string[];
}

// Workflow list response
export interface FalWorkflowListResponse {
  workflows: FalWorkflowListItem[];
  next_cursor: string | null;
  has_more: boolean;
  total?: number;
}

// Workflow get parameters
export interface FalWorkflowGetParams {
  username: string;
  workflow_name: string;
}

// Workflow detail
export interface FalWorkflowDetail {
  name: string;
  title: string;
  user_nickname: string;
  created_at: string;
  is_public: boolean;
  contents: Record<string, unknown>;
}

// Workflow get response
export interface FalWorkflowGetResponse {
  workflow: FalWorkflowDetail;
}

// Workflow create parameters
export interface FalWorkflowCreateParams {
  name: string;
  title?: string;
  description?: string;
  tags?: string[];
  is_public?: boolean;
  contents: Record<string, unknown>;
}

// Workflow create response
export interface FalWorkflowCreateResponse {
  workflow: FalWorkflowDetail;
}

// ==================== Compute Instances ====================

// Compute instance type
export type FalComputeInstanceType = "gpu_8x_h100_sxm5" | "gpu_1x_h100_sxm5";

// Compute region
export type FalComputeRegion =
  | "us-west"
  | "us-central"
  | "us-east"
  | "eu-north"
  | "eu-west"
  | "other";

// Compute sector
export type FalComputeSector = "sector_1" | "sector_2" | "sector_3";

// Compute instance status
export type FalComputeInstanceStatus =
  | "ready"
  | "init"
  | "pending"
  | "provisioning"
  | "stopped"
  | "unknown";

// Compute instance
export interface FalComputeInstance {
  id: string;
  instance_type: FalComputeInstanceType;
  region: FalComputeRegion;
  sector?: FalComputeSector;
  ip?: string;
  status: FalComputeInstanceStatus;
  creator_user_nickname?: string;
}

// List compute instances parameters
export type FalComputeInstancesListParams = FalPaginatedParams;

// List compute instances response
export interface FalComputeInstancesListResponse {
  instances: FalComputeInstance[];
  next_cursor: string | null;
  has_more: boolean;
}

// Get compute instance parameters
export interface FalComputeInstanceGetParams {
  id: string;
}

// Create compute instance parameters
export interface FalComputeInstanceCreateParams {
  instance_type: FalComputeInstanceType;
  ssh_key: string;
  sector?: FalComputeSector;
}

// Delete compute instance parameters
export interface FalComputeInstanceDeleteParams {
  id: string;
}

// ==================== fal.run inference models ====================

// Generic file output returned by fal.run inference models
export interface FalFile {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

// ByteDance Seedance 2.0 image-to-video
export type FalSeedanceResolution = "480p" | "720p";
export type FalSeedanceDuration =
  | "auto"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15";
export type FalSeedanceAspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "9:16";

export interface FalSeedance2p0ImageToVideoParams {
  prompt: string;
  image_url: string;
  end_image_url?: string;
  resolution?: FalSeedanceResolution;
  duration?: FalSeedanceDuration;
  aspect_ratio?: FalSeedanceAspectRatio;
  generate_audio?: boolean;
  seed?: number;
  end_user_id?: string;
}

export interface FalSeedance2p0ImageToVideoResponse {
  video: FalFile;
  seed: number;
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
  method: "POST" | "DELETE";
  path: string;
  contentType: "application/json" | "multipart/form-data";
  fields: Record<string, PayloadFieldSchema>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ==================== Serverless Logs ====================

// Label filter for log queries
export interface FalLabelFilter {
  key: string;
  value: string | string[];
  condition_type?: "equals" | "in" | "not_equals" | "not_in";
}

// Run source for serverless logs
export type FalRunSource = "grpc-run" | "grpc-register" | "gateway" | "cron";

// Shared filter parameters for both history and stream
export interface FalLogsFilterParams {
  start?: string;
  end?: string;
  app_id?: string[];
  revision?: string;
  run_source?: FalRunSource;
  traceback?: boolean;
  search?: string;
  level?: string;
  job_id?: string;
  request_id?: string;
}

// History-specific parameters (adds pagination)
export interface FalLogsHistoryParams extends FalLogsFilterParams {
  limit?: number;
  cursor?: string;
}

// Stream parameters (same filters, no pagination)
export type FalLogsStreamParams = FalLogsFilterParams;

// Log entry returned by both history items and stream events
export interface FalLogEntry {
  timestamp: string;
  level: string;
  message: string;
  app: string;
  revision: string;
  labels?: Record<string, string>;
}

// History response
export interface FalLogsHistoryResponse {
  next_cursor: string | null;
  has_more: boolean;
  items: FalLogEntry[];
}

// ==================== Serverless Files ====================

// File/directory item in a listing
export interface FalFileItem {
  path: string;
  name: string;
  created_time: string;
  updated_time: string;
  is_file: boolean;
  size: number;
  checksum_sha256?: string;
  checksum_md5?: string;
}

// List files parameters
export interface FalFilesListParams {
  dir?: string;
}

// Download file parameters
export interface FalFilesDownloadParams {
  file: string;
}

// Upload from URL parameters
export interface FalFilesUploadUrlParams {
  file: string;
  url: string;
}

// Upload local file parameters
export interface FalFilesUploadLocalParams {
  target_path: string;
  file: Blob;
  filename?: string;
  unzip?: boolean;
}

// ==================== Queue ====================

// Queue submit options (model-specific input is the body)
export interface FalQueueSubmitParams {
  endpoint_id: string;
  input: Record<string, unknown>;
  webhook?: string;
  priority?: "normal" | "low";
  timeout?: number;
  no_retry?: boolean;
  runner_hint?: string;
  store_io?: string;
  object_lifecycle_preference?: string;
}

// Queue submit response
export interface FalQueueSubmitResponse {
  request_id: string;
  response_url: string;
  status_url: string;
  cancel_url: string;
  queue_position: number;
}

// Queue status parameters
export interface FalQueueStatusParams {
  endpoint_id: string;
  request_id: string;
  logs?: boolean;
}

// Queue log entry
export interface FalQueueLog {
  message: string;
  level: "STDERR" | "STDOUT" | "ERROR" | "INFO" | "WARN" | "DEBUG";
  source: string;
  timestamp: string;
}

// Queue metrics
export interface FalQueueMetrics {
  inference_time: number | null;
}

// Queue status: IN_QUEUE
export interface FalQueueInQueueStatus {
  status: "IN_QUEUE";
  request_id: string;
  response_url: string;
  queue_position: number;
}

// Queue status: IN_PROGRESS
export interface FalQueueInProgressStatus {
  status: "IN_PROGRESS";
  request_id: string;
  response_url: string;
  logs?: FalQueueLog[];
}

// Queue status: COMPLETED
export interface FalQueueCompletedStatus {
  status: "COMPLETED";
  request_id: string;
  response_url: string;
  logs?: FalQueueLog[];
  metrics?: FalQueueMetrics;
  error?: string;
  error_type?: string;
}

// Queue status response (discriminated union)
export type FalQueueStatusResponse =
  | FalQueueInQueueStatus
  | FalQueueInProgressStatus
  | FalQueueCompletedStatus;

// Queue result parameters
export interface FalQueueResultParams {
  endpoint_id: string;
  request_id: string;
}

// Queue result response (model-specific output)
export interface FalQueueResultResponse {
  [key: string]: unknown;
}

// Queue cancel parameters
export interface FalQueueCancelParams {
  endpoint_id: string;
  request_id: string;
}

// Queue cancel response
export interface FalQueueCancelResponse {
  status: string;
}

// ==================== Serverless Apps Queue ====================

// Get queue size parameters
export interface FalAppsQueueParams {
  owner: string;
  name: string;
}

// Get queue size response
export interface FalAppsQueueResponse {
  queue_size: number;
}

// Flush queue parameters
export interface FalAppsFlushQueueParams {
  owner: string;
  name: string;
  idempotency_key?: string;
}

// ==================== Provider ====================

// Namespace types
interface FalPricingEstimateMethod {
  (req: FalEstimateRequest, signal?: AbortSignal): Promise<FalEstimateResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalModelsPricingNamespace {
  (params: FalPricingParams, signal?: AbortSignal): Promise<FalPricingResponse>;
  estimate: FalPricingEstimateMethod;
}

interface FalDeletePayloadsMethod {
  (
    params: FalDeletePayloadsParams,
    signal?: AbortSignal
  ): Promise<FalDeletePayloadsResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalModelsRequestsNamespace {
  byEndpoint(
    params: FalRequestsParams,
    signal?: AbortSignal
  ): Promise<FalRequestsResponse>;
  payloads: FalDeletePayloadsMethod;
}

interface FalModelsNamespace {
  (
    params?: FalModelSearchParams,
    signal?: AbortSignal
  ): Promise<FalModelSearchResponse>;
  pricing: FalModelsPricingNamespace;
  usage(
    params?: FalUsageParams,
    signal?: AbortSignal
  ): Promise<FalUsageResponse>;
  analytics(
    params: FalAnalyticsParams,
    signal?: AbortSignal
  ): Promise<FalAnalyticsResponse>;
  requests: FalModelsRequestsNamespace;
}

interface FalQueueSubmitMethod {
  (
    params: FalQueueSubmitParams,
    signal?: AbortSignal
  ): Promise<FalQueueSubmitResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalQueueNamespace {
  submit: FalQueueSubmitMethod;
  status(
    params: FalQueueStatusParams,
    signal?: AbortSignal
  ): Promise<FalQueueStatusResponse>;
  result(
    params: FalQueueResultParams,
    signal?: AbortSignal
  ): Promise<FalQueueResultResponse>;
  cancel(
    params: FalQueueCancelParams,
    signal?: AbortSignal
  ): Promise<FalQueueCancelResponse>;
}

// Serverless logs namespace types
interface FalLogsHistoryMethod {
  (
    params?: FalLogsHistoryParams,
    body?: FalLabelFilter[],
    signal?: AbortSignal
  ): Promise<FalLogsHistoryResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalLogsStreamMethod {
  (
    params?: FalLogsStreamParams,
    body?: FalLabelFilter[],
    signal?: AbortSignal
  ): Promise<AsyncIterable<FalLogEntry>>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalServerlessLogsNamespace {
  history: FalLogsHistoryMethod;
  stream: FalLogsStreamMethod;
}

// Serverless files namespace types
interface FalFilesUploadUrlMethod {
  (params: FalFilesUploadUrlParams, signal?: AbortSignal): Promise<boolean>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalFilesUploadLocalMethod {
  (params: FalFilesUploadLocalParams, signal?: AbortSignal): Promise<boolean>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalServerlessFilesNamespace {
  list(
    params?: FalFilesListParams,
    signal?: AbortSignal
  ): Promise<FalFileItem[]>;
  download(
    params: FalFilesDownloadParams,
    signal?: AbortSignal
  ): Promise<Response>;
  uploadUrl: FalFilesUploadUrlMethod;
  uploadLocal: FalFilesUploadLocalMethod;
}

interface FalAppsFlushQueueMethod {
  (params: FalAppsFlushQueueParams, signal?: AbortSignal): Promise<void>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalServerlessAppsQueueNamespace {
  (
    params: FalAppsQueueParams,
    signal?: AbortSignal
  ): Promise<FalAppsQueueResponse>;
  flush: FalAppsFlushQueueMethod;
}

interface FalServerlessAppsNamespace {
  queue: FalServerlessAppsQueueNamespace;
}

interface FalServerlessNamespace {
  logs: FalServerlessLogsNamespace;
  files: FalServerlessFilesNamespace;
  apps: FalServerlessAppsNamespace;
  metrics(signal?: AbortSignal): Promise<string>;
}

// Workflow create method type
interface FalWorkflowCreateMethod {
  (
    params: FalWorkflowCreateParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowCreateResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalWorkflowsNamespace {
  (
    params?: FalWorkflowListParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowListResponse>;
  get(
    params: FalWorkflowGetParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowGetResponse>;
  create: FalWorkflowCreateMethod;
}

// Compute instances namespace types
interface FalComputeInstanceCreateMethod {
  (
    params: FalComputeInstanceCreateParams,
    signal?: AbortSignal
  ): Promise<FalComputeInstance>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface FalComputeInstancesNamespace {
  (
    params?: FalComputeInstancesListParams,
    signal?: AbortSignal
  ): Promise<FalComputeInstancesListResponse>;
  get(
    params: FalComputeInstanceGetParams,
    signal?: AbortSignal
  ): Promise<FalComputeInstance>;
  create: FalComputeInstanceCreateMethod;
  terminate(
    params: FalComputeInstanceDeleteParams,
    signal?: AbortSignal
  ): Promise<void>;
  // Verb accessor for POST on /compute/instances
  post(
    params: FalComputeInstanceCreateParams,
    signal?: AbortSignal
  ): Promise<FalComputeInstance>;
}

interface FalComputeNamespace {
  instances: FalComputeInstancesNamespace;
}

interface FalV1Namespace {
  models: FalModelsNamespace;
  queue: FalQueueNamespace;
  serverless: FalServerlessNamespace;
  workflows: FalWorkflowsNamespace;
  compute: FalComputeNamespace;
}

// api.fal.ai wrapper — everything under /v1
interface FalAiNamespace {
  v1: FalV1Namespace;
}

// ==================== fal.run run-namespace ====================

type FalSeedance2p0ImageToVideoFn = ((
  params: FalSeedance2p0ImageToVideoParams,
  signal?: AbortSignal
) => Promise<FalSeedance2p0ImageToVideoResponse>) & {
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
};

export interface FalRunBytedanceSeedance2p0Namespace {
  imageToVideo: FalSeedance2p0ImageToVideoFn;
}

export interface FalRunBytedanceNamespace {
  seedance2p0: FalRunBytedanceSeedance2p0Namespace;
}

export interface FalRunNamespace {
  bytedance: FalRunBytedanceNamespace;
}

// ==================== Verb-Prefixed API Surface ====================

// GET v1 namespace
interface FalGetV1ModelsNamespace {
  (
    params?: FalModelSearchParams,
    signal?: AbortSignal
  ): Promise<FalModelSearchResponse>;
  pricing: FalModelsPricingNamespace;
  usage(
    params?: FalUsageParams,
    signal?: AbortSignal
  ): Promise<FalUsageResponse>;
  analytics(
    params: FalAnalyticsParams,
    signal?: AbortSignal
  ): Promise<FalAnalyticsResponse>;
  requests: FalModelsRequestsNamespace;
}

interface FalGetV1QueueNamespace {
  status(
    params: FalQueueStatusParams,
    signal?: AbortSignal
  ): Promise<FalQueueStatusResponse>;
  result(
    params: FalQueueResultParams,
    signal?: AbortSignal
  ): Promise<FalQueueResultResponse>;
}

interface FalGetV1ServerlessLogsNamespace {
  history: FalLogsHistoryMethod;
}

interface FalGetV1ServerlessFilesNamespace {
  list(
    params?: FalFilesListParams,
    signal?: AbortSignal
  ): Promise<FalFileItem[]>;
  download(
    params: FalFilesDownloadParams,
    signal?: AbortSignal
  ): Promise<Response>;
}

interface FalGetV1ServerlessAppsNamespace {
  queue(
    params: FalAppsQueueParams,
    signal?: AbortSignal
  ): Promise<FalAppsQueueResponse>;
}

interface FalGetV1ServerlessNamespace {
  logs: FalGetV1ServerlessLogsNamespace;
  files: FalGetV1ServerlessFilesNamespace;
  apps: FalGetV1ServerlessAppsNamespace;
  metrics(signal?: AbortSignal): Promise<string>;
}

interface FalGetV1WorkflowsNamespace {
  (
    params?: FalWorkflowListParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowListResponse>;
  get(
    params: FalWorkflowGetParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowGetResponse>;
}

interface FalGetV1ComputeInstancesNamespace {
  (
    params?: FalComputeInstancesListParams,
    signal?: AbortSignal
  ): Promise<FalComputeInstancesListResponse>;
  get(
    params: FalComputeInstanceGetParams,
    signal?: AbortSignal
  ): Promise<FalComputeInstance>;
}

interface FalGetV1ComputeNamespace {
  instances: FalGetV1ComputeInstancesNamespace;
}

interface FalGetV1Namespace {
  models: FalGetV1ModelsNamespace;
  queue: FalGetV1QueueNamespace;
  serverless: FalGetV1ServerlessNamespace;
  workflows: FalGetV1WorkflowsNamespace;
  compute: FalGetV1ComputeNamespace;
}

// POST v1 namespace
interface FalPostV1ModelsPricingNamespace {
  estimate: FalPricingEstimateMethod;
}

interface FalPostV1ModelsNamespace {
  pricing: FalPostV1ModelsPricingNamespace;
}

interface FalPostV1QueueNamespace {
  submit: FalQueueSubmitMethod;
}

interface FalPostV1ServerlessLogsNamespace {
  history: FalLogsHistoryMethod;
}

interface FalPostV1ServerlessFilesNamespace {
  uploadUrl: FalFilesUploadUrlMethod;
  uploadLocal: FalFilesUploadLocalMethod;
}

interface FalPostV1ServerlessNamespace {
  logs: FalPostV1ServerlessLogsNamespace;
  files: FalPostV1ServerlessFilesNamespace;
}

interface FalPostV1ComputeInstancesNamespace {
  (
    params: FalComputeInstanceCreateParams,
    signal?: AbortSignal
  ): Promise<FalComputeInstance>;
  create: FalComputeInstanceCreateMethod;
}

interface FalPostV1ComputeNamespace {
  instances: FalPostV1ComputeInstancesNamespace;
}

interface FalPostV1WorkflowsNamespace {
  create: FalWorkflowCreateMethod;
}

interface FalPostV1Namespace {
  models: FalPostV1ModelsNamespace;
  queue: FalPostV1QueueNamespace;
  serverless: FalPostV1ServerlessNamespace;
  compute: FalPostV1ComputeNamespace;
  workflows: FalPostV1WorkflowsNamespace;
}

// POST stream v1 namespace
interface FalPostStreamV1ServerlessLogsNamespace {
  stream: FalLogsStreamMethod;
}

interface FalPostStreamV1ServerlessNamespace {
  logs: FalPostStreamV1ServerlessLogsNamespace;
}

interface FalPostStreamV1Namespace {
  serverless: FalPostStreamV1ServerlessNamespace;
}

interface FalPostStreamNamespace {
  v1: FalPostStreamV1Namespace;
}

// PUT v1 namespace
interface FalPutV1QueueNamespace {
  cancel(
    params: FalQueueCancelParams,
    signal?: AbortSignal
  ): Promise<FalQueueCancelResponse>;
}

interface FalPutV1Namespace {
  queue: FalPutV1QueueNamespace;
}

// DELETE v1 namespace
interface FalDeleteV1ModelsRequestsNamespace {
  payloads: FalDeletePayloadsMethod;
}

interface FalDeleteV1ModelsNamespace {
  requests: FalDeleteV1ModelsRequestsNamespace;
}

interface FalDeleteV1ServerlessAppsQueueNamespace {
  flush: FalAppsFlushQueueMethod;
}

interface FalDeleteV1ServerlessAppsNamespace {
  queue: FalDeleteV1ServerlessAppsQueueNamespace;
}

interface FalDeleteV1ServerlessNamespace {
  apps: FalDeleteV1ServerlessAppsNamespace;
}

interface FalDeleteV1ComputeInstancesNamespace {
  terminate(
    params: FalComputeInstanceDeleteParams,
    signal?: AbortSignal
  ): Promise<void>;
}

interface FalDeleteV1ComputeNamespace {
  instances: FalDeleteV1ComputeInstancesNamespace;
}

interface FalDeleteV1Namespace {
  models: FalDeleteV1ModelsNamespace;
  serverless: FalDeleteV1ServerlessNamespace;
  compute: FalDeleteV1ComputeNamespace;
}

// Verb-prefixed root namespaces
interface FalGetNamespace {
  ai: { v1: FalGetV1Namespace };
}

interface FalPostNamespace {
  ai: { v1: FalPostV1Namespace };
  run: FalRunNamespace;
  stream: FalPostStreamNamespace;
}

interface FalPutNamespace {
  ai: { v1: FalPutV1Namespace };
}

interface FalDeleteNamespace {
  ai: { v1: FalDeleteV1Namespace };
}

// Provider interface
export interface FalProvider {
  ai: FalAiNamespace;
  run: FalRunNamespace;
  get: FalGetNamespace;
  post: FalPostNamespace;
  put: FalPutNamespace;
  delete: FalDeleteNamespace;
}
