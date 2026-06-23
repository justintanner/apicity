import type { z } from "zod";
import type {
  XMediaUploadInitializeRequest,
  XMediaUploadAppendRequest,
  XUsersMeRequest,
  XTweetCreateRequest,
  XOAuthTokenRequest,
} from "./zod";

export type {
  XOptions,
  XOAuthOptions,
  XMediaUploadInitializeRequest,
  XMediaUploadInitializeParsedRequest,
  XMediaUploadAppendRequest,
  XMediaUploadAppendParsedRequest,
  XUsersMeRequest,
  XTweetCreateRequest,
  XTweetCreateParsedRequest,
  XOAuthTokenRequest,
  XOAuthTokenParsedRequest,
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
  type: string;
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

export interface XTweetCreateResponse {
  data: {
    id: string;
    text: string;
  };
}

export interface XUser {
  [key: string]: unknown;
  id: string;
  name: string;
  username: string;
}

export interface XTweet {
  [key: string]: unknown;
  id: string;
  text?: string;
}

export interface XApiProblem {
  [key: string]: unknown;
  title?: string;
  type?: string;
  detail?: string;
  status?: number;
}

export interface XUsersMeIncludes {
  [key: string]: unknown;
  media?: Array<Record<string, unknown>>;
  places?: Array<Record<string, unknown>>;
  polls?: Array<Record<string, unknown>>;
  topics?: Array<Record<string, unknown>>;
  tweets?: XTweet[];
  users?: XUser[];
}

export interface XUsersMeResponse {
  data: XUser;
  errors?: XApiProblem[];
  includes?: XUsersMeIncludes;
}

// refresh_token is present on authorization_code grants that requested the
// offline.access scope; refresh grants may rotate it or omit it (keep the
// old one when omitted).
export interface XOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

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

export interface XUsersMeMethod {
  (req?: XUsersMeRequest, signal?: AbortSignal): Promise<XUsersMeResponse>;
  schema: z.ZodType<XUsersMeRequest>;
}

export interface XTweetCreateMethod {
  (
    req: XTweetCreateRequest,
    signal?: AbortSignal
  ): Promise<XTweetCreateResponse>;
  schema: z.ZodType<XTweetCreateRequest>;
}

export interface XOAuthTokenMethod {
  (req: XOAuthTokenRequest, signal?: AbortSignal): Promise<XOAuthTokenResponse>;
  schema: z.ZodType<XOAuthTokenRequest>;
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
  tweets: XTweetCreateMethod;
}

export interface XPostNamespace {
  v2: XPostV2Namespace;
}

export interface XGetMediaNamespace {
  upload: XMediaUploadStatusMethod;
}

export interface XGetUsersNamespace {
  me: XUsersMeMethod;
}

export interface XGetV2Namespace {
  media: XGetMediaNamespace;
  users: XGetUsersNamespace;
}

export interface XGetNamespace {
  v2: XGetV2Namespace;
}

export interface XProvider {
  post: XPostNamespace;
  get: XGetNamespace;
}

export interface XOAuth2Namespace {
  token: XOAuthTokenMethod;
}

export interface XOAuthPostV2Namespace {
  oauth2: XOAuth2Namespace;
}

export interface XOAuthPostNamespace {
  v2: XOAuthPostV2Namespace;
}

export interface XOAuthProvider {
  post: XOAuthPostNamespace;
}
