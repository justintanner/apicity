import type { z } from "zod";
import type { ElevenLabsSoundGenerationRequest } from "./zod";

export type {
  ElevenLabsOptions,
  ElevenLabsSoundGenerationRequest,
} from "./zod";

// -- Error -------------------------------------------------------------------

export class ElevenLabsError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "ElevenLabsError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- Method interfaces -------------------------------------------------------

export interface ElevenLabsSoundGenerationMethod {
  (
    req: ElevenLabsSoundGenerationRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsSoundGenerationRequest>;
}

// -- Namespace interfaces ----------------------------------------------------

export interface ElevenLabsV1Namespace {
  soundGeneration: ElevenLabsSoundGenerationMethod;
}

export interface ElevenLabsPostNamespace {
  v1: ElevenLabsV1Namespace;
}

export interface ElevenLabsProvider {
  v1: ElevenLabsV1Namespace;
  post: ElevenLabsPostNamespace;
}
