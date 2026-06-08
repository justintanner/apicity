export type { BinanceOptions } from "./zod";

export class BinanceError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "BinanceError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

export type BinancePingResponse = Record<string, never>;

export interface BinancePingMethod {
  (signal?: AbortSignal): Promise<BinancePingResponse>;
  schema: undefined;
}

export interface BinanceApiV3Namespace {
  ping: BinancePingMethod;
}

export interface BinanceApiNamespace {
  v3: BinanceApiV3Namespace;
}

export interface BinanceGetNamespace {
  api: BinanceApiNamespace;
}

export interface BinanceProvider {
  api: BinanceApiNamespace;
  get: BinanceGetNamespace;
}
