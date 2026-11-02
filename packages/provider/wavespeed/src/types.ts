import type { z } from "zod";
import type {
  WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0TextToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0VideoEditRequestSchema,
  WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema,
  WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0TextToVideoRequestSchema,
  WaveSpeedMinimaxH3ImageToVideoRequestSchema,
  WaveSpeedMinimaxH3TextToVideoRequestSchema,
  WaveSpeedPredictionStatusSchema,
  WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema,
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
export type WaveSpeedAlibabaWan3p0ImageToVideoRequest = z.input<
  typeof WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedAlibabaWan3p0ImageToVideoMethod {
  (
    request: WaveSpeedAlibabaWan3p0ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema;
}
export type WaveSpeedAlibabaWan3p0VideoEditRequest = z.input<
  typeof WaveSpeedAlibabaWan3p0VideoEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedAlibabaWan3p0VideoEditMethod {
  (
    request: WaveSpeedAlibabaWan3p0VideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedAlibabaWan3p0VideoEditRequestSchema;
}
export type WaveSpeedAlibabaWan3p0ReferenceToVideoRequest = z.input<
  typeof WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedAlibabaWan3p0ReferenceToVideoMethod {
  (
    request: WaveSpeedAlibabaWan3p0ReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema;
}
export interface WaveSpeedAlibabaWan3p0Namespace {
  textToVideo: WaveSpeedAlibabaWan3p0TextToVideoMethod;
  imageToVideo: WaveSpeedAlibabaWan3p0ImageToVideoMethod;
  videoEdit: WaveSpeedAlibabaWan3p0VideoEditMethod;
  referenceToVideo: WaveSpeedAlibabaWan3p0ReferenceToVideoMethod;
}
export type WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequest = z.input<
  typeof WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedAlibabaHappyhorse1p1ImageToVideoMethod {
  (
    request: WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema;
}
export interface WaveSpeedAlibabaHappyhorse1p1Namespace {
  imageToVideo: WaveSpeedAlibabaHappyhorse1p1ImageToVideoMethod;
}
export interface WaveSpeedAlibabaNamespace {
  wan3p0: WaveSpeedAlibabaWan3p0Namespace;
  happyhorse1p1: WaveSpeedAlibabaHappyhorse1p1Namespace;
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

export type WaveSpeedMinimaxH3TextToVideoRequest = z.input<
  typeof WaveSpeedMinimaxH3TextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedMinimaxH3TextToVideoMethod {
  (
    request: WaveSpeedMinimaxH3TextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedMinimaxH3TextToVideoRequestSchema;
}
export type WaveSpeedMinimaxH3ImageToVideoRequest = z.input<
  typeof WaveSpeedMinimaxH3ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedMinimaxH3ImageToVideoMethod {
  (
    request: WaveSpeedMinimaxH3ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedMinimaxH3ImageToVideoRequestSchema;
}
export interface WaveSpeedMinimaxH3Namespace {
  textToVideo: WaveSpeedMinimaxH3TextToVideoMethod;
  imageToVideo: WaveSpeedMinimaxH3ImageToVideoMethod;
}
export interface WaveSpeedMinimaxNamespace {
  h3: WaveSpeedMinimaxH3Namespace;
}

export type WaveSpeedBytedanceSeedance2p5TextToVideoRequest = z.input<
  typeof WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedance2p5TextToVideoMethod {
  (
    request: WaveSpeedBytedanceSeedance2p5TextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema;
}
export type WaveSpeedBytedanceSeedance2p5ImageToVideoRequest = z.input<
  typeof WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedance2p5ImageToVideoMethod {
  (
    request: WaveSpeedBytedanceSeedance2p5ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema;
}
export type WaveSpeedBytedanceSeedance2p5VideoEditRequest = z.input<
  typeof WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedance2p5VideoEditMethod {
  (
    request: WaveSpeedBytedanceSeedance2p5VideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema;
}
export interface WaveSpeedBytedanceSeedance2p5Namespace {
  textToVideo: WaveSpeedBytedanceSeedance2p5TextToVideoMethod;
  imageToVideo: WaveSpeedBytedanceSeedance2p5ImageToVideoMethod;
  videoEdit: WaveSpeedBytedanceSeedance2p5VideoEditMethod;
}
export type WaveSpeedBytedanceSeedance2p0TextToVideoRequest = z.input<
  typeof WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedance2p0TextToVideoMethod {
  (
    request: WaveSpeedBytedanceSeedance2p0TextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema;
}
export type WaveSpeedBytedanceSeedance2p0ImageToVideoRequest = z.input<
  typeof WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedance2p0ImageToVideoMethod {
  (
    request: WaveSpeedBytedanceSeedance2p0ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema;
}
export interface WaveSpeedBytedanceSeedance2p0Namespace {
  textToVideo: WaveSpeedBytedanceSeedance2p0TextToVideoMethod;
  imageToVideo: WaveSpeedBytedanceSeedance2p0ImageToVideoMethod;
}
export interface WaveSpeedBytedanceNamespace {
  seedance2p5: WaveSpeedBytedanceSeedance2p5Namespace;
  seedance2p0: WaveSpeedBytedanceSeedance2p0Namespace;
}

export type WaveSpeedBlackForestLabsFlux3TextToVideoRequest = z.input<
  typeof WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBlackForestLabsFlux3TextToVideoMethod {
  (
    request: WaveSpeedBlackForestLabsFlux3TextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema;
}
export type WaveSpeedBlackForestLabsFlux3ImageToVideoRequest = z.input<
  typeof WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBlackForestLabsFlux3ImageToVideoMethod {
  (
    request: WaveSpeedBlackForestLabsFlux3ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema;
}
export interface WaveSpeedBlackForestLabsFlux3Namespace {
  textToVideo: WaveSpeedBlackForestLabsFlux3TextToVideoMethod;
  imageToVideo: WaveSpeedBlackForestLabsFlux3ImageToVideoMethod;
}
export interface WaveSpeedBlackForestLabsNamespace {
  flux3: WaveSpeedBlackForestLabsFlux3Namespace;
}

export type WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequest = z.input<
  typeof WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoMethod {
  (
    request: WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema;
}
export type WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequest = z.input<
  typeof WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoMethod {
  (
    request: WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema;
}
export interface WaveSpeedGoogleGeminiOmni1p1FlashNamespace {
  textToVideo: WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoMethod;
  imageToVideo: WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoMethod;
}
export interface WaveSpeedGoogleNamespace {
  geminiOmni1p1Flash: WaveSpeedGoogleGeminiOmni1p1FlashNamespace;
}

export type WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequest = z.input<
  typeof WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoMethod {
  (
    request: WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema;
}
export interface WaveSpeedXAiGrokImagineVideoV1p5Namespace {
  imageToVideo: WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoMethod;
}
export interface WaveSpeedXAiNamespace {
  grokImagineVideoV1p5: WaveSpeedXAiGrokImagineVideoV1p5Namespace;
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
  minimax: WaveSpeedMinimaxNamespace;
  bytedance: WaveSpeedBytedanceNamespace;
  blackForestLabs: WaveSpeedBlackForestLabsNamespace;
  google: WaveSpeedGoogleNamespace;
  xAi: WaveSpeedXAiNamespace;
}
export interface WaveSpeedApiNamespace {
  v3: WaveSpeedV3Namespace;
}
export interface WaveSpeedProvider {
  api: WaveSpeedApiNamespace;
}
