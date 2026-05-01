import type { z } from "zod";
import type {
  XMediaUploadInitializeRequest,
  XMediaUploadAppendRequest,
} from "./zod";

export type {
  XOptions,
  XMediaUploadInitializeRequest,
  XMediaUploadAppendRequest,
} from "./zod";

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

export interface XMediaUploadAppendResponse {
  data: { expires_at: number };
}

// Finalize returns the same shape as initialize plus a populated
// processing_info — the caller polls processing_info.state until succeeded.
export type XMediaUploadFinalizeResponse = XMediaUploadInitializeResponse;

// Status (GET /2/media/upload?media_id=...) returns the same envelope as
// finalize; processing_info is the field callers poll on.
export type XMediaUploadStatusResponse = XMediaUploadInitializeResponse;

// -- Method interfaces -------------------------------------------------------

export interface XMediaUploadInitializeMethod {
  (
    req: XMediaUploadInitializeRequest,
    signal?: AbortSignal
  ): Promise<XMediaUploadInitializeResponse>;
  schema: z.ZodType<XMediaUploadInitializeRequest>;
}

export interface XMediaUploadAppendMethod {
  (
    id: string,
    req: XMediaUploadAppendRequest,
    signal?: AbortSignal
  ): Promise<XMediaUploadAppendResponse>;
  schema: z.ZodType<XMediaUploadAppendRequest>;
}

export interface XMediaUploadFinalizeMethod {
  (id: string, signal?: AbortSignal): Promise<XMediaUploadFinalizeResponse>;
}

export interface XMediaUploadStatusMethod {
  (mediaId: string, signal?: AbortSignal): Promise<XMediaUploadStatusResponse>;
}

// -- Namespace interfaces ----------------------------------------------------

export interface XMediaUploadNamespace {
  initialize: XMediaUploadInitializeMethod;
  append: XMediaUploadAppendMethod;
  finalize: XMediaUploadFinalizeMethod;
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

export interface XGetMediaNamespace {
  upload: XMediaUploadStatusMethod;
}

export interface XGetV2Namespace {
  media: XGetMediaNamespace;
}

export interface XGetNamespace {
  v2: XGetV2Namespace;
}

export interface XProvider {
  post: XPostNamespace;
  get: XGetNamespace;
}
