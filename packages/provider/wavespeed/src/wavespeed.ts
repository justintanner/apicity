import { attachExamples } from "./example";
import { WaveSpeedError } from "./types";
import type {
  WaveSpeedOptions,
  WaveSpeedPredictionResponse,
  WaveSpeedProvider,
} from "./types";

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
      },
    },
  });
}
