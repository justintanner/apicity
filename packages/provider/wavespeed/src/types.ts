import type { z } from "zod";
import type {
  WaveSpeedAlibabaWan3p0TextToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0TextToVideoRequestSchema,
  WaveSpeedPredictionStatusSchema,
} from "./zod";

/**
 * `status` is the HTTP status, or 408 on timeout, 499 when the caller aborts
 * and 500 when no response arrived. `code` is the `code` of WaveSpeed's
 * `{ code, message }` error envelope, such as 404 for an unknown prediction
 * or 4005-4007 when a price cannot be calculated.
 */
export class WaveSpeedError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
    public readonly code?: number
  ) {
    super(message);
    this.name = "WaveSpeedError";
  }
}

export interface WaveSpeedOptions {
  /** Sent as `Authorization: Bearer`; defaults to `WAVESPEED_API_KEY`. */
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export type WaveSpeedPredictionStatus = z.infer<
  typeof WaveSpeedPredictionStatusSchema
>;

export interface WaveSpeedPredictionUrls {
  /** This prediction's `api.v3.predictions.result` URL. */
  get: string;
  [key: string]: unknown;
}

export interface WaveSpeedPredictionTimings {
  /** Inference time in milliseconds. */
  inference?: number;
  [key: string]: unknown;
}

export interface WaveSpeedPrediction {
  id: string;
  model: string;
  status: WaveSpeedPredictionStatus;
  /**
   * Media URLs for the media models, text or structured values for others.
   * Empty until the prediction completes; absent once it is deleted.
   * Generated media URLs are temporary.
   */
  outputs?: unknown[];
  urls?: WaveSpeedPredictionUrls;
  created_at?: string;
  timings?: WaveSpeedPredictionTimings;
  /** Why a prediction failed; empty on success. */
  error?: string;
  /** WaveSpeed's task error code: 0 on success, 1xxx or 5xxx on failure. */
  code?: number;
  [key: string]: unknown;
}

export interface WaveSpeedPredictionResponse {
  code: number;
  message: string;
  data: WaveSpeedPrediction;
  [key: string]: unknown;
}

export type WaveSpeedAlibabaWan3p0TextToVideoRequest = z.input<
  typeof WaveSpeedAlibabaWan3p0TextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedAlibabaWan3p0TextToVideoMethod {
  (
    request: WaveSpeedAlibabaWan3p0TextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedAlibabaWan3p0TextToVideoRequestSchema;
}
export interface WaveSpeedAlibabaWan3p0Namespace {
  textToVideo: WaveSpeedAlibabaWan3p0TextToVideoMethod;
}
export interface WaveSpeedAlibabaNamespace {
  wan3p0: WaveSpeedAlibabaWan3p0Namespace;
}

export type WaveSpeedHeygenVideo1p0TextToVideoRequest = z.input<
  typeof WaveSpeedHeygenVideo1p0TextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedHeygenVideo1p0TextToVideoMethod {
  (
    request: WaveSpeedHeygenVideo1p0TextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedHeygenVideo1p0TextToVideoRequestSchema;
}
export interface WaveSpeedHeygenVideo1p0Namespace {
  textToVideo: WaveSpeedHeygenVideo1p0TextToVideoMethod;
}
export interface WaveSpeedHeygenNamespace {
  video1p0: WaveSpeedHeygenVideo1p0Namespace;
}

export interface WaveSpeedPredictionsNamespace {
  /** Poll at least 2 s apart until `data.status` is terminal. */
  result(
    id: string,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
}
export interface WaveSpeedV3Namespace {
  predictions: WaveSpeedPredictionsNamespace;
  alibaba: WaveSpeedAlibabaNamespace;
  heygen: WaveSpeedHeygenNamespace;
}
export interface WaveSpeedApiNamespace {
  v3: WaveSpeedV3Namespace;
}
export interface WaveSpeedProvider {
  api: WaveSpeedApiNamespace;
}
