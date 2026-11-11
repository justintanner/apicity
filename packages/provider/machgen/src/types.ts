import type { z } from "zod";
import type {
  MachGenAdapterConfigSchema,
  MachGenAdapterCreateRequestSchema,
  MachGenAdapterInferenceConfigSchema,
  MachGenUploadRequestSchema,
  MachGenGenerateRequestSchema,
  MachGenImageConfigSchema,
  MachGenUpscaleConfigSchema,
  MachGenUpscaleQuoteRequestSchema,
  MachGenVideoConfigSchema,
} from "./zod";

export class MachGenError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "MachGenError";
  }
}

export interface MachGenOptions {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export type MachGenGenerateRequest = z.infer<
  typeof MachGenGenerateRequestSchema
>;
export type MachGenImageConfig = z.infer<typeof MachGenImageConfigSchema>;
export type MachGenVideoConfig = z.infer<typeof MachGenVideoConfigSchema>;
export type MachGenUpscaleConfig = z.infer<typeof MachGenUpscaleConfigSchema>;
export type MachGenUpscaleQuoteRequest = z.infer<
  typeof MachGenUpscaleQuoteRequestSchema
>;
export type MachGenAdapterCreateRequest = z.infer<
  typeof MachGenAdapterCreateRequestSchema
>;
export type MachGenAdapterConfig = z.infer<typeof MachGenAdapterConfigSchema>;
export type MachGenAdapterInferenceConfig = z.infer<
  typeof MachGenAdapterInferenceConfigSchema
>;

export interface MachGenUploadRequest {
  file: Blob;
  filename: string;
}

export interface MachGenUploadResponse {
  artifact_path: string;
  duration_secs?: number | null;
  fps?: number | null;
  frame_count?: number | null;
  [key: string]: unknown;
}

export interface MachGenUploadMethod {
  (
    request: MachGenUploadRequest,
    signal?: AbortSignal
  ): Promise<MachGenUploadResponse>;
  schema: typeof MachGenUploadRequestSchema;
}

export interface MachGenGenerateResponse {
  task_id: string;
  [key: string]: unknown;
}

export interface MachGenTaskStatusResponse {
  task_id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  metadata: Record<string, unknown>;
  task_output?: {
    image?: string;
    video?: string;
    [key: string]: unknown;
  } | null;
  error_msg?: string | null;
  moderation?: Record<string, unknown> | null;
  generation_time_secs?: number | null;
  active_generation_time_secs?: number | null;
  upload_time_secs?: number | null;
  queue_time_secs?: number | null;
  execution_provider?: string | null;
  overflow_converted?: boolean;
  [key: string]: unknown;
}

/** The price an upscale would bill, in micro-USD. */
export interface MachGenUpscaleQuoteResponse {
  cost_micros: number;
  [key: string]: unknown;
}

/** Micro-USD amounts; a failed or cancelled task is refunded and reports 0. */
export interface MachGenTaskBillingResponse {
  task_id: string;
  generation_cost_micros: number;
  generation_credit_micros: number;
  net_cost_micros: number;
  [key: string]: unknown;
}

/** A custom-LoRA upload, as the reserve call answers it. */
export interface MachGenAdapterUpload {
  /** The LoRA's id: `up-` and hex, derived from the file and both configs. */
  adapter: string;
  model: string;
  /** `pending` until committed; a pending upload expires after 7 days. */
  status: "pending" | "ready";
  size_bytes: number;
  /** Unix seconds. */
  created_at: number;
  /** Unix seconds; when a pending upload expires. */
  expires_at?: number | null;
  /** Resumable uploads send pieces in multiples of this many bytes. */
  chunk_size?: number;
  /**
   * One-time URL that takes the weights by PUT for 7 days. Anyone holding it
   * can write the file. `null` once the file has arrived.
   */
  upload_url?: string | null;
  [key: string]: unknown;
}

export interface MachGenGenerateMethod {
  (
    request: MachGenGenerateRequest,
    signal?: AbortSignal
  ): Promise<MachGenGenerateResponse>;
  schema: typeof MachGenGenerateRequestSchema;
}
export interface MachGenTasksMethod {
  (taskId: string, signal?: AbortSignal): Promise<MachGenTaskStatusResponse>;
  /** Final once the task is COMPLETED or FAILED; earlier calls get HTTP 409. */
  billing(
    taskId: string,
    signal?: AbortSignal
  ): Promise<MachGenTaskBillingResponse>;
}
export interface MachGenUpscaleQuoteMethod {
  (
    request: MachGenUpscaleQuoteRequest,
    signal?: AbortSignal
  ): Promise<MachGenUpscaleQuoteResponse>;
  schema: typeof MachGenUpscaleQuoteRequestSchema;
}
export interface MachGenUpscaleNamespace {
  /** Free and creates no task; not in MachGen's REST docs. */
  quote: MachGenUpscaleQuoteMethod;
}
export interface MachGenAdapterCreateMethod {
  (
    request: MachGenAdapterCreateRequest,
    signal?: AbortSignal
  ): Promise<MachGenAdapterUpload>;
  schema: typeof MachGenAdapterCreateRequestSchema;
}
/** Custom LoRAs: https://www.machgen.ai/docs/rest_api/custom-loras */
export interface MachGenAdaptersNamespace {
  /** Reserve an upload (free); `model` is sent as the `?model=` query. */
  create: MachGenAdapterCreateMethod;
}
export interface MachGenV0Namespace {
  upload: MachGenUploadMethod;
  generate: MachGenGenerateMethod;
  tasks: MachGenTasksMethod;
  assets(taskId: string, signal?: AbortSignal): Promise<ArrayBuffer>;
  upscale: MachGenUpscaleNamespace;
  adapters: MachGenAdaptersNamespace;
}
export interface MachGenApiNamespace {
  v0: MachGenV0Namespace;
}
export interface MachGenProvider {
  api: MachGenApiNamespace;
}
