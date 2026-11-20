import type { z } from "zod";
import type {
  WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema,
  WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema,
  WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema,
  WaveSpeedAlibabaWan2p7VideoEditRequestSchema,
  WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0TextToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0VideoEditRequestSchema,
  WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema,
  WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema,
  WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema,
  WaveSpeedBytedanceSeedreamV5p5EditRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema,
  WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema,
  WaveSpeedGoogleNanoBanana2p1EditRequestSchema,
  WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema,
  WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0ImageToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0TextToVideoRequestSchema,
  WaveSpeedKwaivgiKlingImageV4p0EditRequestSchema,
  WaveSpeedKwaivgiKlingImageV4p0TextToImageRequestSchema,
  WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema,
  WaveSpeedMinimaxH3ImageToVideoRequestSchema,
  WaveSpeedMinimaxH3ReferenceToVideoRequestSchema,
  WaveSpeedMinimaxH3TextToVideoRequestSchema,
  WaveSpeedOpenaiGptImage2TextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p5SunburstEditRequestSchema,
  WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema,
  WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema,
  WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema,
  WaveSpeedPredictionStatusSchema,
  WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema,
  WaveSpeedRunwaymlAleph2RequestSchema,
  WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema,
  WaveSpeedSkyworkAiSkyreelsV4ImageToVideoRequestSchema,
  WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema,
  WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema,
  WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema,
  WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema,
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
export type WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequest = z.input<
  typeof WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoMethod {
  (
    request: WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema;
}
export interface WaveSpeedAlibabaHappyhorse1p1Namespace {
  imageToVideo: WaveSpeedAlibabaHappyhorse1p1ImageToVideoMethod;
  referenceToVideo: WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoMethod;
}
export type WaveSpeedAlibabaHappyhorse1p0VideoEditRequest = z.input<
  typeof WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedAlibabaHappyhorse1p0VideoEditMethod {
  (
    request: WaveSpeedAlibabaHappyhorse1p0VideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema;
}
export interface WaveSpeedAlibabaHappyhorse1p0Namespace {
  videoEdit: WaveSpeedAlibabaHappyhorse1p0VideoEditMethod;
}
export type WaveSpeedAlibabaWan2p7VideoEditRequest = z.input<
  typeof WaveSpeedAlibabaWan2p7VideoEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedAlibabaWan2p7VideoEditMethod {
  (
    request: WaveSpeedAlibabaWan2p7VideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedAlibabaWan2p7VideoEditRequestSchema;
}
export interface WaveSpeedAlibabaWan2p7Namespace {
  videoEdit: WaveSpeedAlibabaWan2p7VideoEditMethod;
}
export interface WaveSpeedAlibabaNamespace {
  wan3p0: WaveSpeedAlibabaWan3p0Namespace;
  happyhorse1p1: WaveSpeedAlibabaHappyhorse1p1Namespace;
  happyhorse1p0: WaveSpeedAlibabaHappyhorse1p0Namespace;
  wan2p7: WaveSpeedAlibabaWan2p7Namespace;
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
export type WaveSpeedHeygenVideo1p0ImageToVideoRequest = z.input<
  typeof WaveSpeedHeygenVideo1p0ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedHeygenVideo1p0ImageToVideoMethod {
  (
    request: WaveSpeedHeygenVideo1p0ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedHeygenVideo1p0ImageToVideoRequestSchema;
}
export type WaveSpeedHeygenVideo1p0ReferenceToVideoRequest = z.input<
  typeof WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedHeygenVideo1p0ReferenceToVideoMethod {
  (
    request: WaveSpeedHeygenVideo1p0ReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema;
}
export interface WaveSpeedHeygenVideo1p0Namespace {
  textToVideo: WaveSpeedHeygenVideo1p0TextToVideoMethod;
  imageToVideo: WaveSpeedHeygenVideo1p0ImageToVideoMethod;
  referenceToVideo: WaveSpeedHeygenVideo1p0ReferenceToVideoMethod;
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
export type WaveSpeedMinimaxH3ReferenceToVideoRequest = z.input<
  typeof WaveSpeedMinimaxH3ReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedMinimaxH3ReferenceToVideoMethod {
  (
    request: WaveSpeedMinimaxH3ReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedMinimaxH3ReferenceToVideoRequestSchema;
}
export interface WaveSpeedMinimaxH3Namespace {
  textToVideo: WaveSpeedMinimaxH3TextToVideoMethod;
  imageToVideo: WaveSpeedMinimaxH3ImageToVideoMethod;
  referenceToVideo: WaveSpeedMinimaxH3ReferenceToVideoMethod;
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
export type WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequest = z.input<
  typeof WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedance2p5ReferenceToVideoMethod {
  (
    request: WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema;
}
export interface WaveSpeedBytedanceSeedance2p5Namespace {
  textToVideo: WaveSpeedBytedanceSeedance2p5TextToVideoMethod;
  imageToVideo: WaveSpeedBytedanceSeedance2p5ImageToVideoMethod;
  videoEdit: WaveSpeedBytedanceSeedance2p5VideoEditMethod;
  referenceToVideo: WaveSpeedBytedanceSeedance2p5ReferenceToVideoMethod;
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
export type WaveSpeedBytedanceSeedance2p0VideoEditRequest = z.input<
  typeof WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedance2p0VideoEditMethod {
  (
    request: WaveSpeedBytedanceSeedance2p0VideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema;
}
export type WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequest = z.input<
  typeof WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedance2p0ReferenceToVideoMethod {
  (
    request: WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema;
}
export interface WaveSpeedBytedanceSeedance2p0Namespace {
  textToVideo: WaveSpeedBytedanceSeedance2p0TextToVideoMethod;
  imageToVideo: WaveSpeedBytedanceSeedance2p0ImageToVideoMethod;
  videoEdit: WaveSpeedBytedanceSeedance2p0VideoEditMethod;
  referenceToVideo: WaveSpeedBytedanceSeedance2p0ReferenceToVideoMethod;
}
export type WaveSpeedBytedanceSeedreamV5p5EditRequest = z.input<
  typeof WaveSpeedBytedanceSeedreamV5p5EditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedBytedanceSeedreamV5p5EditMethod {
  (
    request: WaveSpeedBytedanceSeedreamV5p5EditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedBytedanceSeedreamV5p5EditRequestSchema;
}
export interface WaveSpeedBytedanceSeedreamV5p5Namespace {
  edit: WaveSpeedBytedanceSeedreamV5p5EditMethod;
}
export interface WaveSpeedBytedanceNamespace {
  seedance2p5: WaveSpeedBytedanceSeedance2p5Namespace;
  seedance2p0: WaveSpeedBytedanceSeedance2p0Namespace;
  seedreamV5p5: WaveSpeedBytedanceSeedreamV5p5Namespace;
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
export type WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequest = z.input<
  typeof WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleGeminiOmni1p1FlashVideoEditMethod {
  (
    request: WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema;
}
export type WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequest = z.input<
  typeof WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoMethod {
  (
    request: WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema;
}
export type WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequest = z.input<
  typeof WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleGeminiOmni1p2FlashVideoEditMethod {
  (
    request: WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema;
}
export type WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequest = z.input<
  typeof WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoMethod {
  (
    request: WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema;
}
export interface WaveSpeedGoogleGeminiOmni1p2FlashNamespace {
  textToVideo: WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoMethod;
  videoEdit: WaveSpeedGoogleGeminiOmni1p2FlashVideoEditMethod;
  referenceToVideo: WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoMethod;
}
export type WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequest = z.input<
  typeof WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoMethod {
  (
    request: WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema;
}
export interface WaveSpeedGoogleGeminiOmni1p1FlashNamespace {
  textToVideo: WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoMethod;
  imageToVideo: WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoMethod;
  videoEdit: WaveSpeedGoogleGeminiOmni1p1FlashVideoEditMethod;
  referenceToVideo: WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoMethod;
}
export type WaveSpeedGoogleNanoBanana2p1TextToImageRequest = z.input<
  typeof WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleNanoBanana2p1TextToImageMethod {
  (
    request: WaveSpeedGoogleNanoBanana2p1TextToImageRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema;
}
export type WaveSpeedGoogleNanoBanana2p1EditRequest = z.input<
  typeof WaveSpeedGoogleNanoBanana2p1EditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedGoogleNanoBanana2p1EditMethod {
  (
    request: WaveSpeedGoogleNanoBanana2p1EditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedGoogleNanoBanana2p1EditRequestSchema;
}
export interface WaveSpeedGoogleNanoBanana2p1Namespace {
  edit: WaveSpeedGoogleNanoBanana2p1EditMethod;
  textToImage: WaveSpeedGoogleNanoBanana2p1TextToImageMethod;
}
export interface WaveSpeedGoogleNamespace {
  geminiOmni1p1Flash: WaveSpeedGoogleGeminiOmni1p1FlashNamespace;
  geminiOmni1p2Flash: WaveSpeedGoogleGeminiOmni1p2FlashNamespace;
  nanoBanana2p1: WaveSpeedGoogleNanoBanana2p1Namespace;
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
export type WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequest = z.input<
  typeof WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoMethod {
  (
    request: WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema;
}
export interface WaveSpeedXAiGrokImagineVideoV1p5Namespace {
  imageToVideo: WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoMethod;
  referenceToVideo: WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoMethod;
}
export type WaveSpeedXAiGrokImagineImageV2p0TextToImageRequest = z.input<
  typeof WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedXAiGrokImagineImageV2p0TextToImageMethod {
  (
    request: WaveSpeedXAiGrokImagineImageV2p0TextToImageRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema;
}
export interface WaveSpeedXAiGrokImagineImageV2p0Namespace {
  textToImage: WaveSpeedXAiGrokImagineImageV2p0TextToImageMethod;
}
export interface WaveSpeedXAiNamespace {
  grokImagineVideoV1p5: WaveSpeedXAiGrokImagineVideoV1p5Namespace;
  grokImagineImageV2p0: WaveSpeedXAiGrokImagineImageV2p0Namespace;
}
export type WaveSpeedWavespeedAiMinimaxH3VideoEditRequest = z.input<
  typeof WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema
>;

/**
 * WaveSpeed's open-weights MiniMax H3 (MiniMax's own minimax/h3 has no video
 * edit on WaveSpeed). A model submit answers at once; poll
 * `api.v3.predictions.result`.
 */
export interface WaveSpeedWavespeedAiMinimaxH3VideoEditMethod {
  (
    request: WaveSpeedWavespeedAiMinimaxH3VideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema;
}
export interface WaveSpeedWavespeedAiMinimaxH3Namespace {
  videoEdit: WaveSpeedWavespeedAiMinimaxH3VideoEditMethod;
}
export interface WaveSpeedWavespeedAiNamespace {
  minimaxH3: WaveSpeedWavespeedAiMinimaxH3Namespace;
}

export interface WaveSpeedPredictionsNamespace {
  /** Poll at least 2 s apart until `data.status` is terminal. */
  result(
    id: string,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
}
export type WaveSpeedRunwaymlAleph2Request = z.input<
  typeof WaveSpeedRunwaymlAleph2RequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedRunwaymlAleph2Method {
  (
    request: WaveSpeedRunwaymlAleph2Request,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedRunwaymlAleph2RequestSchema;
}
export interface WaveSpeedRunwaymlNamespace {
  aleph2: WaveSpeedRunwaymlAleph2Method;
}
export type WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequest = z.input<
  typeof WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedKwaivgiKlingVideoO3ProVideoEditMethod {
  (
    request: WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema;
}
export interface WaveSpeedKwaivgiKlingVideoO3ProNamespace {
  videoEdit: WaveSpeedKwaivgiKlingVideoO3ProVideoEditMethod;
}
export type WaveSpeedKwaivgiKlingImageV4p0EditRequest = z.input<
  typeof WaveSpeedKwaivgiKlingImageV4p0EditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedKwaivgiKlingImageV4p0EditMethod {
  (
    request: WaveSpeedKwaivgiKlingImageV4p0EditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedKwaivgiKlingImageV4p0EditRequestSchema;
}
export interface WaveSpeedKwaivgiKlingImageV4p0Namespace {
  edit: WaveSpeedKwaivgiKlingImageV4p0EditMethod;
  textToImage: WaveSpeedKwaivgiKlingImageV4p0TextToImageMethod;
}
export type WaveSpeedKwaivgiKlingImageV4p0TextToImageRequest = z.input<
  typeof WaveSpeedKwaivgiKlingImageV4p0TextToImageRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedKwaivgiKlingImageV4p0TextToImageMethod {
  (
    request: WaveSpeedKwaivgiKlingImageV4p0TextToImageRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedKwaivgiKlingImageV4p0TextToImageRequestSchema;
}
export interface WaveSpeedKwaivgiNamespace {
  klingVideoO3Pro: WaveSpeedKwaivgiKlingVideoO3ProNamespace;
  klingImageV4p0: WaveSpeedKwaivgiKlingImageV4p0Namespace;
}
export type WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequest = z.input<
  typeof WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedOpenaiGptImage2p6SunburstTextToImageMethod {
  (
    request: WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema;
}
export type WaveSpeedOpenaiGptImage2p6SunburstEditRequest = z.input<
  typeof WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedOpenaiGptImage2p6SunburstEditMethod {
  (
    request: WaveSpeedOpenaiGptImage2p6SunburstEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema;
}
export interface WaveSpeedOpenaiGptImage2p6SunburstNamespace {
  edit: WaveSpeedOpenaiGptImage2p6SunburstEditMethod;
  textToImage: WaveSpeedOpenaiGptImage2p6SunburstTextToImageMethod;
}
export type WaveSpeedOpenaiGptImage2p6FlareTextToImageRequest = z.input<
  typeof WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedOpenaiGptImage2p6FlareTextToImageMethod {
  (
    request: WaveSpeedOpenaiGptImage2p6FlareTextToImageRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema;
}
export type WaveSpeedOpenaiGptImage2p6FlareEditRequest = z.input<
  typeof WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedOpenaiGptImage2p6FlareEditMethod {
  (
    request: WaveSpeedOpenaiGptImage2p6FlareEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema;
}
export interface WaveSpeedOpenaiGptImage2p6FlareNamespace {
  edit: WaveSpeedOpenaiGptImage2p6FlareEditMethod;
  textToImage: WaveSpeedOpenaiGptImage2p6FlareTextToImageMethod;
}
export type WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequest = z.input<
  typeof WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedOpenaiGptImage2p5SunburstTextToImageMethod {
  (
    request: WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema;
}
export type WaveSpeedOpenaiGptImage2p5SunburstEditRequest = z.input<
  typeof WaveSpeedOpenaiGptImage2p5SunburstEditRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedOpenaiGptImage2p5SunburstEditMethod {
  (
    request: WaveSpeedOpenaiGptImage2p5SunburstEditRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedOpenaiGptImage2p5SunburstEditRequestSchema;
}
export interface WaveSpeedOpenaiGptImage2p5SunburstNamespace {
  textToImage: WaveSpeedOpenaiGptImage2p5SunburstTextToImageMethod;
  edit: WaveSpeedOpenaiGptImage2p5SunburstEditMethod;
}
export type WaveSpeedOpenaiGptImage2p5FlareTextToImageRequest = z.input<
  typeof WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedOpenaiGptImage2p5FlareTextToImageMethod {
  (
    request: WaveSpeedOpenaiGptImage2p5FlareTextToImageRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema;
}
export interface WaveSpeedOpenaiGptImage2p5FlareNamespace {
  textToImage: WaveSpeedOpenaiGptImage2p5FlareTextToImageMethod;
}
export type WaveSpeedOpenaiGptImage2TextToImageRequest = z.input<
  typeof WaveSpeedOpenaiGptImage2TextToImageRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedOpenaiGptImage2TextToImageMethod {
  (
    request: WaveSpeedOpenaiGptImage2TextToImageRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedOpenaiGptImage2TextToImageRequestSchema;
}
export interface WaveSpeedOpenaiGptImage2Namespace {
  textToImage: WaveSpeedOpenaiGptImage2TextToImageMethod;
}
export interface WaveSpeedOpenaiNamespace {
  gptImage2p6Flare: WaveSpeedOpenaiGptImage2p6FlareNamespace;
  gptImage2p6Sunburst: WaveSpeedOpenaiGptImage2p6SunburstNamespace;
  gptImage2p5Sunburst: WaveSpeedOpenaiGptImage2p5SunburstNamespace;
  gptImage2p5Flare: WaveSpeedOpenaiGptImage2p5FlareNamespace;
  gptImage2: WaveSpeedOpenaiGptImage2Namespace;
}
export type WaveSpeedPrunaAiPVideo2ProImageToVideoRequest = z.input<
  typeof WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedPrunaAiPVideo2ProImageToVideoMethod {
  (
    request: WaveSpeedPrunaAiPVideo2ProImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema;
}
export interface WaveSpeedPrunaAiPVideo2ProNamespace {
  imageToVideo: WaveSpeedPrunaAiPVideo2ProImageToVideoMethod;
}
export interface WaveSpeedPrunaAiNamespace {
  pVideo2Pro: WaveSpeedPrunaAiPVideo2ProNamespace;
}
export type WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequest = z.input<
  typeof WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedSkyworkAiSkyreelsV4TextToVideoMethod {
  (
    request: WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema;
}
export type WaveSpeedSkyworkAiSkyreelsV4ImageToVideoRequest = z.input<
  typeof WaveSpeedSkyworkAiSkyreelsV4ImageToVideoRequestSchema
>;

/** A model submit answers at once; poll `api.v3.predictions.result`. */
export interface WaveSpeedSkyworkAiSkyreelsV4ImageToVideoMethod {
  (
    request: WaveSpeedSkyworkAiSkyreelsV4ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<WaveSpeedPredictionResponse>;
  schema: typeof WaveSpeedSkyworkAiSkyreelsV4ImageToVideoRequestSchema;
}
export interface WaveSpeedSkyworkAiSkyreelsV4Namespace {
  textToVideo: WaveSpeedSkyworkAiSkyreelsV4TextToVideoMethod;
  imageToVideo: WaveSpeedSkyworkAiSkyreelsV4ImageToVideoMethod;
}
export interface WaveSpeedSkyworkAiNamespace {
  skyreelsV4: WaveSpeedSkyworkAiSkyreelsV4Namespace;
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
  wavespeedAi: WaveSpeedWavespeedAiNamespace;
  runwayml: WaveSpeedRunwaymlNamespace;
  kwaivgi: WaveSpeedKwaivgiNamespace;
  openai: WaveSpeedOpenaiNamespace;
  prunaAi: WaveSpeedPrunaAiNamespace;
  skyworkAi: WaveSpeedSkyworkAiNamespace;
}
export interface WaveSpeedApiNamespace {
  v3: WaveSpeedV3Namespace;
}
export interface WaveSpeedProvider {
  api: WaveSpeedApiNamespace;
}
