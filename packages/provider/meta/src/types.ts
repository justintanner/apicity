import type { z } from "zod";
import type { MetaMediaCreateRequest, MetaMediaPublishRequest } from "./zod";

export type {
  MetaOptions,
  MetaMediaCreateRequest,
  MetaMediaPublishRequest,
} from "./zod";

// -- Error -------------------------------------------------------------------

export class MetaError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "MetaError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- Response shapes ---------------------------------------------------------

// Container creation returns just the container ID; the actual processing
// state is queryable via GET /{container-id}?fields=status_code,status.
export interface MetaMediaCreateResponse {
  id: string;
}

export type MetaContainerStatusCode =
  | "EXPIRED"
  | "ERROR"
  | "FINISHED"
  | "IN_PROGRESS"
  | "PUBLISHED";

// status_code is what callers poll on; status is a free-text human-readable
// description of the current step. Both fields are only returned when
// requested via the `fields` query param.
export interface MetaContainerStatusResponse {
  id: string;
  status_code?: MetaContainerStatusCode;
  status?: string;
}

export interface MetaContainerStatusQuery {
  /** Comma-separated field list. Default returns only `id`; pass
   *  `"status_code,status"` to read processing state. */
  fields?: string;
}

// -- Method interfaces -------------------------------------------------------

export interface MetaMediaCreateMethod {
  (
    igUserId: string,
    req: MetaMediaCreateRequest,
    signal?: AbortSignal
  ): Promise<MetaMediaCreateResponse>;
  schema: z.ZodType<MetaMediaCreateRequest>;
}

export interface MetaContainerStatusMethod {
  (
    containerId: string,
    query?: MetaContainerStatusQuery,
    signal?: AbortSignal
  ): Promise<MetaContainerStatusResponse>;
}

export interface MetaMediaPublishResponse {
  id: string;
}

export interface MetaMediaPublishMethod {
  (
    igUserId: string,
    req: MetaMediaPublishRequest,
    signal?: AbortSignal
  ): Promise<MetaMediaPublishResponse>;
  schema: z.ZodType<MetaMediaPublishRequest>;
}

// -- Namespace interfaces ----------------------------------------------------

export interface MetaPostV25Namespace {
  media: MetaMediaCreateMethod;
  mediaPublish: MetaMediaPublishMethod;
}

export interface MetaPostNamespace {
  v25: MetaPostV25Namespace;
}

export interface MetaGetV25Namespace {
  container: MetaContainerStatusMethod;
}

export interface MetaGetNamespace {
  v25: MetaGetV25Namespace;
}

export interface MetaProvider {
  post: MetaPostNamespace;
  get: MetaGetNamespace;
}
