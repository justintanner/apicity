import type { z } from "zod";
import type { XMediaUploadInitializeRequest } from "./zod";

export type { XOptions, XMediaUploadInitializeRequest } from "./zod";

// -- Error -------------------------------------------------------------------

export class XError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "XError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- Shared response shapes --------------------------------------------------

export interface XMediaProcessingInfo {
  state: "pending" | "in_progress" | "succeeded" | "failed";
  progress_percent?: number;
  check_after_secs?: number;
  error?: { name?: string; message?: string };
}

export interface XMediaUploadInitializeData {
  id: string;
  media_key: string;
  expires_after_secs: number;
  size: number;
  processing_info?: XMediaProcessingInfo;
}

export interface XMediaUploadInitializeResponse {
  data: XMediaUploadInitializeData;
}

// -- Method interfaces -------------------------------------------------------

export interface XMediaUploadInitializeMethod {
  (
    req: XMediaUploadInitializeRequest,
    signal?: AbortSignal
  ): Promise<XMediaUploadInitializeResponse>;
  schema: z.ZodType<XMediaUploadInitializeRequest>;
}

// -- Namespace interfaces ----------------------------------------------------

export interface XMediaUploadNamespace {
  initialize: XMediaUploadInitializeMethod;
}

export interface XMediaNamespace {
  upload: XMediaUploadNamespace;
}

export interface XPostV2Namespace {
  media: XMediaNamespace;
}

export interface XPostNamespace {
  v2: XPostV2Namespace;
}

export interface XProvider {
  post: XPostNamespace;
}
