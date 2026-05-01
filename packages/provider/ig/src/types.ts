import type { z } from "zod";
import type { IgMediaCreateRequest } from "./zod";

export type { IgOptions, IgMediaCreateRequest } from "./zod";

// -- Error -------------------------------------------------------------------

export class IgError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "IgError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- Response shapes ---------------------------------------------------------

// Container creation returns just the container ID; the actual processing
// state is queryable via GET /{container-id}?fields=status_code,status.
export interface IgMediaCreateResponse {
  id: string;
}

export type IgContainerStatusCode =
  | "EXPIRED"
  | "ERROR"
  | "FINISHED"
  | "IN_PROGRESS"
  | "PUBLISHED";

// status_code is what callers poll on; status is a free-text human-readable
// description of the current step. Both fields are only returned when
// requested via the `fields` query param.
export interface IgContainerStatusResponse {
  id: string;
  status_code?: IgContainerStatusCode;
  status?: string;
}

export interface IgContainerStatusQuery {
  /** Comma-separated field list. Default returns only `id`; pass
   *  `"status_code,status"` to read processing state. */
  fields?: string;
}

// -- Method interfaces -------------------------------------------------------

export interface IgMediaCreateMethod {
  (
    igUserId: string,
    req: IgMediaCreateRequest,
    signal?: AbortSignal
  ): Promise<IgMediaCreateResponse>;
  schema: z.ZodType<IgMediaCreateRequest>;
}

export interface IgContainerStatusMethod {
  (
    containerId: string,
    query?: IgContainerStatusQuery,
    signal?: AbortSignal
  ): Promise<IgContainerStatusResponse>;
}

// -- Namespace interfaces ----------------------------------------------------

export interface IgPostV25Namespace {
  media: IgMediaCreateMethod;
}

export interface IgPostNamespace {
  v25: IgPostV25Namespace;
}

export interface IgGetV25Namespace {
  container: IgContainerStatusMethod;
}

export interface IgGetNamespace {
  v25: IgGetV25Namespace;
}

export interface IgProvider {
  post: IgPostNamespace;
  get: IgGetNamespace;
}
