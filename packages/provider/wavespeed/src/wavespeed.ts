import { attachExamples } from "./example";
import { WaveSpeedError } from "./types";
import type {
  WaveSpeedAlibabaWan3p0TextToVideoRequest,
  WaveSpeedBlackForestLabsFlux3TextToVideoRequest,
  WaveSpeedBytedanceSeedance2p0TextToVideoRequest,
  WaveSpeedBytedanceSeedance2p5ImageToVideoRequest,
  WaveSpeedBytedanceSeedance2p5TextToVideoRequest,
  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequest,
  WaveSpeedHeygenVideo1p0TextToVideoRequest,
  WaveSpeedMinimaxH3ImageToVideoRequest,
  WaveSpeedMinimaxH3TextToVideoRequest,
  WaveSpeedOptions,
  WaveSpeedPredictionResponse,
  WaveSpeedProvider,
} from "./types";
import {
  WaveSpeedAlibabaWan3p0TextToVideoRequestSchema,
  WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0TextToVideoRequestSchema,
  WaveSpeedMinimaxH3ImageToVideoRequestSchema,
  WaveSpeedMinimaxH3TextToVideoRequestSchema,
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
          },
        },
      },
    },
  });
}
