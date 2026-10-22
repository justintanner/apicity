import type { z } from "zod";
import type {
  MachGenGenerateRequestSchema,
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
export type MachGenVideoConfig = z.infer<typeof MachGenVideoConfigSchema>;

export interface MachGenGenerateResponse {
  task_id: string;
  [key: string]: unknown;
}

export interface MachGenTaskStatusResponse {
  task_id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  metadata: Record<string, unknown>;
  task_output?: { video?: string; [key: string]: unknown } | null;
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

export interface MachGenGenerateMethod {
  (
    request: MachGenGenerateRequest,
    signal?: AbortSignal
  ): Promise<MachGenGenerateResponse>;
  schema: typeof MachGenGenerateRequestSchema;
}
export interface MachGenV0Namespace {
  generate: MachGenGenerateMethod;
  tasks(
    taskId: string,
    signal?: AbortSignal
  ): Promise<MachGenTaskStatusResponse>;
  assets(taskId: string, signal?: AbortSignal): Promise<ArrayBuffer>;
}
export interface MachGenApiNamespace {
  v0: MachGenV0Namespace;
}
export interface MachGenProvider {
  api: MachGenApiNamespace;
}
