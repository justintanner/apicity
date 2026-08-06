/**
 * Veo callback payload types — bodies kie POSTs to a caller's callBackUrl.
 *
 * Docs (2 dedicated callback pages under veo3-api):
 * - https://docs.kie.ai/veo3-api/generate-veo-3-video-callbacks
 * - https://docs.kie.ai/veo3-api/get-veo-3-4k-video-callbacks
 *
 * Extend reuses the generate callback shape (see extend-video onVideoExtended).
 * These are type-surface only (not request endpoints). Pair with
 * `verifyKieWebhookRequest` for HMAC verification of the inbound POST.
 */

/** Shared info block on successful Veo generate callbacks. */
export interface VeoCallbackInfo {
  /** Generated video URL array (success only). */
  resultUrls?: string[];
  /**
   * Original-size video URLs when aspect ratio is not 16:9
   * (success only; may be absent).
   */
  originUrls?: string[];
  /** Resolution label such as "1080p". */
  resolution?: string;
  [key: string]: unknown;
}

/** data field for a Veo generate completion callback. */
export interface VeoGenerateCallbackData {
  taskId: string;
  /** Serialized request params JSON string (sometimes present). */
  promptJson?: string;
  info?: VeoCallbackInfo;
  /** @deprecated Upstream deprecates fallbackFlag; still appears on wire. */
  fallbackFlag?: boolean;
  [key: string]: unknown;
}

/**
 * Body POSTed to callBackUrl when a Veo generate task completes
 * (success or failure).
 *
 * code: 200 success, 400 client/content policy, 422 fallback failed,
 * 500 internal, 501 generation failed.
 */
export interface VeoGenerateCallbackPayload {
  code: number;
  msg: string;
  data: VeoGenerateCallbackData;
}

/**
 * Extend callbacks reuse the generate shape (onVideoExtended in OpenAPI).
 * Alias kept for callers that want a dedicated name.
 */
export type VeoExtendCallbackData = VeoGenerateCallbackData;
export type VeoExtendCallbackPayload = VeoGenerateCallbackPayload;

/** info block on successful 4K upscale callbacks. */
export interface VeoGet4kVideoCallbackInfo {
  resultUrls?: string[];
  imageUrls?: string[];
  [key: string]: unknown;
}

export interface VeoGet4kVideoCallbackData {
  taskId: string;
  info?: VeoGet4kVideoCallbackInfo;
  [key: string]: unknown;
}

/**
 * Body POSTed to callBackUrl when a 4K video render completes.
 * Docs: https://docs.kie.ai/veo3-api/get-veo-3-4k-video-callbacks
 *
 * code: 200 success, 500 unavailable/failure.
 */
export interface VeoGet4kVideoCallbackPayload {
  code: number;
  msg: string;
  data: VeoGet4kVideoCallbackData;
}
