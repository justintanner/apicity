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

// -- Method interfaces -------------------------------------------------------

export interface IgMediaCreateMethod {
  (
    igUserId: string,
    req: IgMediaCreateRequest,
    signal?: AbortSignal
  ): Promise<IgMediaCreateResponse>;
  schema: z.ZodType<IgMediaCreateRequest>;
}

// -- Namespace interfaces ----------------------------------------------------

export interface IgPostV25Namespace {
  media: IgMediaCreateMethod;
}

export interface IgPostNamespace {
  v25: IgPostV25Namespace;
}

export interface IgProvider {
  post: IgPostNamespace;
}
