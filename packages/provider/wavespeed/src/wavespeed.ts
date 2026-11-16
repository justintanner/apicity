import { attachExamples } from "./example";
import { WaveSpeedError } from "./types";
import type {
  WaveSpeedAlibabaHappyhorse1p0VideoEditRequest,
  WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequest,
  WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequest,
  WaveSpeedAlibabaWan2p7VideoEditRequest,
  WaveSpeedAlibabaWan3p0ImageToVideoRequest,
  WaveSpeedAlibabaWan3p0ReferenceToVideoRequest,
  WaveSpeedAlibabaWan3p0TextToVideoRequest,
  WaveSpeedAlibabaWan3p0VideoEditRequest,
  WaveSpeedBlackForestLabsFlux3ImageToVideoRequest,
  WaveSpeedBlackForestLabsFlux3TextToVideoRequest,
  WaveSpeedBytedanceSeedance2p0ImageToVideoRequest,
  WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequest,
  WaveSpeedBytedanceSeedance2p0TextToVideoRequest,
  WaveSpeedBytedanceSeedance2p0VideoEditRequest,
  WaveSpeedBytedanceSeedance2p5ImageToVideoRequest,
  WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequest,
  WaveSpeedBytedanceSeedance2p5TextToVideoRequest,
  WaveSpeedBytedanceSeedance2p5VideoEditRequest,
  WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequest,
  WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequest,
  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequest,
  WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequest,
  WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequest,
  WaveSpeedGoogleNanoBanana2p1EditRequest,
  WaveSpeedGoogleNanoBanana2p1TextToImageRequest,
  WaveSpeedHeygenVideo1p0ReferenceToVideoRequest,
  WaveSpeedHeygenVideo1p0TextToVideoRequest,
  WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequest,
  WaveSpeedMinimaxH3ImageToVideoRequest,
  WaveSpeedMinimaxH3ReferenceToVideoRequest,
  WaveSpeedMinimaxH3TextToVideoRequest,
  WaveSpeedOpenaiGptImage2TextToImageRequest,
  WaveSpeedOpenaiGptImage2p5FlareTextToImageRequest,
  WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequest,
  WaveSpeedOpenaiGptImage2p6FlareEditRequest,
  WaveSpeedOpenaiGptImage2p6FlareTextToImageRequest,
  WaveSpeedOpenaiGptImage2p6SunburstEditRequest,
  WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequest,
  WaveSpeedOptions,
  WaveSpeedPredictionResponse,
  WaveSpeedProvider,
  WaveSpeedPrunaAiPVideo2ProImageToVideoRequest,
  WaveSpeedRunwaymlAleph2Request,
  WaveSpeedWavespeedAiMinimaxH3VideoEditRequest,
  WaveSpeedXAiGrokImagineImageV2p0TextToImageRequest,
  WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequest,
  WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequest,
} from "./types";
import {
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
  WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema,
  WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema,
  WaveSpeedGoogleNanoBanana2p1EditRequestSchema,
  WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema,
  WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0TextToVideoRequestSchema,
  WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema,
  WaveSpeedMinimaxH3ImageToVideoRequestSchema,
  WaveSpeedMinimaxH3ReferenceToVideoRequestSchema,
  WaveSpeedMinimaxH3TextToVideoRequestSchema,
  WaveSpeedOpenaiGptImage2TextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema,
  WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema,
  WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema,
  WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema,
  WaveSpeedRunwaymlAleph2RequestSchema,
  WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema,
  WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema,
  WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema,
  WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema,
} from "./zod";

interface WaveSpeedErrorEnvelope {
  code?: number;
  message?: string;
}

// API errors answer `{ code, message }`; `code` is the HTTP status or, for a
// failed price calculation, 4005-4007.
function errorEnvelope(body: unknown): WaveSpeedErrorEnvelope {
  if (body === null || typeof body !== "object") return {};
  const record = body as Record<string, unknown>;
  return {
    code: typeof record.code === "number" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

export function createWaveSpeed(
  options: WaveSpeedOptions = {}
): WaveSpeedProvider {
  const baseURL = (options.baseURL ?? "https://api.wavespeed.ai").replace(
    /\/+$/,
    ""
  );
  const doFetch = options.fetch ?? fetch;
  const timeout = options.timeout ?? 60000;

  async function request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const key = options.apiKey ?? process.env.WAVESPEED_API_KEY;
    if (!key)
      throw new WaveSpeedError(
        "WaveSpeed API key is required. Pass apiKey or set WAVESPEED_API_KEY.",
        401
      );
    const controller = new AbortController();
    const relayAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", relayAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await doFetch(`${baseURL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const raw = (await response.text()).replaceAll(key, "[REDACTED]");
        let errorBody: unknown = raw;
        try {
          errorBody = JSON.parse(raw) as unknown;
        } catch {
          /* Keep non-JSON upstream errors. */
        }
        const { code, message } = errorEnvelope(errorBody);
        throw new WaveSpeedError(
          `WaveSpeed API error ${response.status}: ${message ?? raw.slice(0, 200)}`,
          response.status,
          errorBody,
          code
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof WaveSpeedError) throw error;
      if (signal?.aborted)
        throw new WaveSpeedError("WaveSpeed request aborted by caller", 499);
      if (controller.signal.aborted)
        throw new WaveSpeedError("WaveSpeed request timed out", 408);
      throw new WaveSpeedError(
        `WaveSpeed request failed: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", relayAbort);
    }
  }

  return attachExamples({
    api: {
      v3: {
        predictions: {
          // GET https://api.wavespeed.ai/api/v3/predictions/{id}/result
          // Docs: https://wavespeed.ai/docs/get-result
          result: async (id: string, signal?: AbortSignal) => {
            return request<WaveSpeedPredictionResponse>(
              "GET",
              `/api/v3/predictions/${encodeURIComponent(id)}/result`,
              undefined,
              signal
            );
          },
        },
        alibaba: {
          wan3p0: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/text-to-video
            // Docs: https://wavespeed.ai/models/alibaba/wan-3.0/text-to-video
            textToVideo: Object.assign(
              async (
                body: WaveSpeedAlibabaWan3p0TextToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/alibaba/wan-3.0/text-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedAlibabaWan3p0TextToVideoRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/image-to-video
            // Docs: https://wavespeed.ai/models/alibaba/wan-3.0/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedAlibabaWan3p0ImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/alibaba/wan-3.0/image-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/video-edit
            // Docs: https://wavespeed.ai/models/alibaba/wan-3.0/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedAlibabaWan3p0VideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/alibaba/wan-3.0/video-edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedAlibabaWan3p0VideoEditRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/reference-to-video
            // Docs: https://wavespeed.ai/models/alibaba/wan-3.0/reference-to-video
            referenceToVideo: Object.assign(
              async (
                body: WaveSpeedAlibabaWan3p0ReferenceToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/alibaba/wan-3.0/reference-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema }
            ),
          },
          happyhorse1p1: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/alibaba/happyhorse-1.1/image-to-video
            // Docs: https://wavespeed.ai/models/alibaba/happyhorse-1.1/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/alibaba/happyhorse-1.1/image-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/alibaba/happyhorse-1.1/reference-to-video
            // Docs: https://wavespeed.ai/models/alibaba/happyhorse-1.1/reference-to-video
            referenceToVideo: Object.assign(
              async (
                body: WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/alibaba/happyhorse-1.1/reference-to-video",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema,
              }
            ),
          },
          happyhorse1p0: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/alibaba/happyhorse-1.0/video-edit
            // Docs: https://wavespeed.ai/models/alibaba/happyhorse-1.0/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedAlibabaHappyhorse1p0VideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/alibaba/happyhorse-1.0/video-edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema }
            ),
          },
          wan2p7: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/alibaba/wan-2.7/video-edit
            // Docs: https://wavespeed.ai/models/alibaba/wan-2.7/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedAlibabaWan2p7VideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/alibaba/wan-2.7/video-edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedAlibabaWan2p7VideoEditRequestSchema }
            ),
          },
        },
        heygen: {
          video1p0: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/heygen/video-1.0/text-to-video
            // Docs: https://wavespeed.ai/models/heygen/video-1.0/text-to-video
            textToVideo: Object.assign(
              async (
                body: WaveSpeedHeygenVideo1p0TextToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/heygen/video-1.0/text-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedHeygenVideo1p0TextToVideoRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/heygen/video-1.0/reference-to-video
            // Docs: https://wavespeed.ai/models/heygen/video-1.0/reference-to-video
            referenceToVideo: Object.assign(
              async (
                body: WaveSpeedHeygenVideo1p0ReferenceToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/heygen/video-1.0/reference-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema }
            ),
          },
        },
        minimax: {
          h3: {
            // POST https://api.wavespeed.ai/api/v3/minimax/h3/text-to-video
            // Docs: https://wavespeed.ai/models/minimax/h3/text-to-video
            textToVideo: Object.assign(
              async (
                body: WaveSpeedMinimaxH3TextToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/minimax/h3/text-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedMinimaxH3TextToVideoRequestSchema }
            ),
            // POST https://api.wavespeed.ai/api/v3/minimax/h3/image-to-video
            // Docs: https://wavespeed.ai/models/minimax/h3/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedMinimaxH3ImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/minimax/h3/image-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedMinimaxH3ImageToVideoRequestSchema }
            ),
            // POST https://api.wavespeed.ai/api/v3/minimax/h3/reference-to-video
            // Docs: https://wavespeed.ai/models/minimax/h3/reference-to-video
            referenceToVideo: Object.assign(
              async (
                body: WaveSpeedMinimaxH3ReferenceToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/minimax/h3/reference-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedMinimaxH3ReferenceToVideoRequestSchema }
            ),
          },
        },
        bytedance: {
          seedance2p5: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/text-to-video
            // Docs: https://wavespeed.ai/models/bytedance/seedance-2.5/text-to-video
            textToVideo: Object.assign(
              async (
                body: WaveSpeedBytedanceSeedance2p5TextToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/bytedance/seedance-2.5/text-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/image-to-video
            // Docs: https://wavespeed.ai/models/bytedance/seedance-2.5/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedBytedanceSeedance2p5ImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/bytedance/seedance-2.5/image-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/video-edit
            // Docs: https://wavespeed.ai/models/bytedance/seedance-2.5/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedBytedanceSeedance2p5VideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/bytedance/seedance-2.5/video-edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/reference-to-video
            // Docs: https://wavespeed.ai/models/bytedance/seedance-2.5/reference-to-video
            referenceToVideo: Object.assign(
              async (
                body: WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/bytedance/seedance-2.5/reference-to-video",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema,
              }
            ),
          },
          seedance2p0: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/text-to-video
            // Docs: https://wavespeed.ai/models/bytedance/seedance-2.0/text-to-video
            textToVideo: Object.assign(
              async (
                body: WaveSpeedBytedanceSeedance2p0TextToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/bytedance/seedance-2.0/text-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/image-to-video
            // Docs: https://wavespeed.ai/models/bytedance/seedance-2.0/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedBytedanceSeedance2p0ImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/bytedance/seedance-2.0/image-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/video-edit
            // Docs: https://wavespeed.ai/models/bytedance/seedance-2.0/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedBytedanceSeedance2p0VideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/bytedance/seedance-2.0/video-edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/reference-to-video
            // Docs: https://wavespeed.ai/models/bytedance/seedance-2.0/reference-to-video
            referenceToVideo: Object.assign(
              async (
                body: WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/bytedance/seedance-2.0/reference-to-video",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema,
              }
            ),
          },
        },
        blackForestLabs: {
          flux3: {
            // POST https://api.wavespeed.ai/api/v3/black-forest-labs/flux-3/text-to-video
            // Docs: https://wavespeed.ai/models/black-forest-labs/flux-3/text-to-video
            textToVideo: Object.assign(
              async (
                body: WaveSpeedBlackForestLabsFlux3TextToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/black-forest-labs/flux-3/text-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema }
            ),
            // POST https://api.wavespeed.ai/api/v3/black-forest-labs/flux-3/image-to-video
            // Docs: https://wavespeed.ai/models/black-forest-labs/flux-3/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedBlackForestLabsFlux3ImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/black-forest-labs/flux-3/image-to-video",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema }
            ),
          },
        },
        google: {
          geminiOmni1p1Flash: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/google/gemini-omni-1.1-flash/text-to-video
            // Docs: https://wavespeed.ai/models/google/gemini-omni-1.1-flash/text-to-video
            textToVideo: Object.assign(
              async (
                body: WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/google/gemini-omni-1.1-flash/text-to-video",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema,
              }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/google/gemini-omni-1.1-flash/image-to-video
            // Docs: https://wavespeed.ai/models/google/gemini-omni-1.1-flash/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/google/gemini-omni-1.1-flash/image-to-video",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema,
              }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/google/gemini-omni-1.1-flash/video-edit
            // Docs: https://wavespeed.ai/models/google/gemini-omni-1.1-flash/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/google/gemini-omni-1.1-flash/video-edit",
                  body,
                  signal
                );
              },
              {
                schema: WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema,
              }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/google/gemini-omni-1.1-flash/reference-to-video
            // Docs: https://wavespeed.ai/models/google/gemini-omni-1.1-flash/reference-to-video
            referenceToVideo: Object.assign(
              async (
                body: WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/google/gemini-omni-1.1-flash/reference-to-video",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema,
              }
            ),
          },
          geminiOmni1p2Flash: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/google/gemini-omni-1.2-flash/video-edit
            // Docs: https://wavespeed.ai/models/google/gemini-omni-1.2-flash/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/google/gemini-omni-1.2-flash/video-edit",
                  body,
                  signal
                );
              },
              {
                schema: WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema,
              }
            ),
          },
          nanoBanana2p1: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/text-to-image
            // Docs: https://wavespeed.ai/models/google/nano-banana-2.1/text-to-image
            textToImage: Object.assign(
              async (
                body: WaveSpeedGoogleNanoBanana2p1TextToImageRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/google/nano-banana-2.1/text-to-image",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/edit
            // Docs: https://wavespeed.ai/models/google/nano-banana-2.1/edit
            edit: Object.assign(
              async (
                body: WaveSpeedGoogleNanoBanana2p1EditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/google/nano-banana-2.1/edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedGoogleNanoBanana2p1EditRequestSchema }
            ),
          },
        },
        xAi: {
          grokImagineVideoV1p5: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/x-ai/grok-imagine-video-v1.5/image-to-video
            // Docs: https://wavespeed.ai/models/x-ai/grok-imagine-video-v1.5/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/x-ai/grok-imagine-video-v1.5/image-to-video",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema,
              }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/x-ai/grok-imagine-video-v1.5/reference-to-video
            // Docs: https://wavespeed.ai/models/x-ai/grok-imagine-video-v1.5/reference-to-video
            referenceToVideo: Object.assign(
              async (
                body: WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/x-ai/grok-imagine-video-v1.5/reference-to-video",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema,
              }
            ),
          },
          grokImagineImageV2p0: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/x-ai/grok-imagine-image-v2.0/text-to-image
            // Docs: https://wavespeed.ai/models/x-ai/grok-imagine-image-v2.0/text-to-image
            textToImage: Object.assign(
              async (
                body: WaveSpeedXAiGrokImagineImageV2p0TextToImageRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/x-ai/grok-imagine-image-v2.0/text-to-image",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema,
              }
            ),
          },
        },
        wavespeedAi: {
          minimaxH3: {
            // POST https://api.wavespeed.ai/api/v3/wavespeed-ai/minimax-h3/video-edit
            // Docs: https://wavespeed.ai/models/wavespeed-ai/minimax-h3/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedWavespeedAiMinimaxH3VideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/wavespeed-ai/minimax-h3/video-edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema }
            ),
          },
        },
        runwayml: {
          // POST https://api.wavespeed.ai/api/v3/runwayml/aleph-2
          // Docs: https://wavespeed.ai/models/runwayml/aleph-2
          aleph2: Object.assign(
            async (
              body: WaveSpeedRunwaymlAleph2Request,
              signal?: AbortSignal
            ) => {
              return request<WaveSpeedPredictionResponse>(
                "POST",
                "/api/v3/runwayml/aleph-2",
                body,
                signal
              );
            },
            { schema: WaveSpeedRunwaymlAleph2RequestSchema }
          ),
        },
        kwaivgi: {
          klingVideoO3Pro: {
            // POST https://api.wavespeed.ai/api/v3/kwaivgi/kling-video-o3-pro/video-edit
            // Docs: https://wavespeed.ai/models/kwaivgi/kling-video-o3-pro/video-edit
            videoEdit: Object.assign(
              async (
                body: WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/kwaivgi/kling-video-o3-pro/video-edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema }
            ),
          },
        },
        openai: {
          gptImage2p6Flare: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2.6-flare/text-to-image
            // Docs: https://wavespeed.ai/models/openai/gpt-image-2.6-flare/text-to-image
            textToImage: Object.assign(
              async (
                body: WaveSpeedOpenaiGptImage2p6FlareTextToImageRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/openai/gpt-image-2.6-flare/text-to-image",
                  body,
                  signal
                );
              },
              {
                schema: WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema,
              }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2.6-flare/edit
            // Docs: https://wavespeed.ai/models/openai/gpt-image-2.6-flare/edit
            edit: Object.assign(
              async (
                body: WaveSpeedOpenaiGptImage2p6FlareEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/openai/gpt-image-2.6-flare/edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema }
            ),
          },
          gptImage2p6Sunburst: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2.6-sunburst/text-to-image
            // Docs: https://wavespeed.ai/models/openai/gpt-image-2.6-sunburst/text-to-image
            textToImage: Object.assign(
              async (
                body: WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/openai/gpt-image-2.6-sunburst/text-to-image",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema,
              }
            ),
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2.6-sunburst/edit
            // Docs: https://wavespeed.ai/models/openai/gpt-image-2.6-sunburst/edit
            edit: Object.assign(
              async (
                body: WaveSpeedOpenaiGptImage2p6SunburstEditRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/openai/gpt-image-2.6-sunburst/edit",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema }
            ),
          },
          gptImage2p5Sunburst: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2.5-sunburst/text-to-image
            // Docs: https://wavespeed.ai/models/openai/gpt-image-2.5-sunburst/text-to-image
            textToImage: Object.assign(
              async (
                body: WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/openai/gpt-image-2.5-sunburst/text-to-image",
                  body,
                  signal
                );
              },
              {
                schema:
                  WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema,
              }
            ),
          },
          gptImage2p5Flare: {
            // sig-ok: version dots become "p" (fal dot rule)
            // POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2.5-flare/text-to-image
            // Docs: https://wavespeed.ai/models/openai/gpt-image-2.5-flare/text-to-image
            textToImage: Object.assign(
              async (
                body: WaveSpeedOpenaiGptImage2p5FlareTextToImageRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/openai/gpt-image-2.5-flare/text-to-image",
                  body,
                  signal
                );
              },
              {
                schema: WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema,
              }
            ),
          },
          gptImage2: {
            // POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2/text-to-image
            // Docs: https://wavespeed.ai/models/openai/gpt-image-2/text-to-image
            textToImage: Object.assign(
              async (
                body: WaveSpeedOpenaiGptImage2TextToImageRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/openai/gpt-image-2/text-to-image",
                  body,
                  signal
                );
              },
              { schema: WaveSpeedOpenaiGptImage2TextToImageRequestSchema }
            ),
          },
        },
        prunaAi: {
          pVideo2Pro: {
            // POST https://api.wavespeed.ai/api/v3/pruna-ai/p-video-2-pro/image-to-video
            // Docs: https://wavespeed.ai/models/pruna-ai/p-video-2-pro/image-to-video
            imageToVideo: Object.assign(
              async (
                body: WaveSpeedPrunaAiPVideo2ProImageToVideoRequest,
                signal?: AbortSignal
              ) => {
                return request<WaveSpeedPredictionResponse>(
                  "POST",
                  "/api/v3/pruna-ai/p-video-2-pro/image-to-video",
                  body,
                  signal
                );
              },
              {
                schema: WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema,
              }
            ),
          },
        },
      },
    },
  });
}
