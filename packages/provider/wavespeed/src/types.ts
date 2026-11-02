import type { z } from "zod";
import type { WaveSpeedPredictionStatusSchema } from "./zod";

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

export interface WaveSpeedPredictionsNamespace {
  /** Poll at least 2 s apart until `data.status` is terminal. */
  result(
    id: string,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
}
export interface WaveSpeedV3Namespace {
  predictions: WaveSpeedPredictionsNamespace;
}
export interface WaveSpeedApiNamespace {
  v3: WaveSpeedV3Namespace;
}
export interface WaveSpeedProvider {
  api: WaveSpeedApiNamespace;
}
