import {
  AlibabaOptions,
  AlibabaChatRequest,
  AlibabaChatResponse,
  AlibabaChatStreamChunk,
  AlibabaModelListResponse,
  AlibabaProvider,
  AlibabaError,
  AlibabaVideoSynthesisRequest,
  AlibabaVideoSynthesisSubmitResponse,
  AlibabaTaskStatusResponse,
} from "./types";
import type { ValidationResult } from "./types";
import { chatCompletionsSchema, videoSynthesisSchema } from "./schemas";
import { validatePayload } from "./validate";
import { sseToIterable } from "./sse";

export function alibaba(opts: AlibabaOptions): AlibabaProvider {
  const baseURL =
    opts.baseURL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
  const nativeBaseURL = (() => {
    const u = new URL(baseURL);
    return `${u.origin}/api/v1`;
  })();
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  async function makeRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal,
    options: {
      baseOverride?: string;
      extraHeaders?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${options.baseOverride ?? baseURL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
          ...(options.extraHeaders ?? {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Alibaba API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Alibaba API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new AlibabaError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AlibabaError) throw error;
      throw new AlibabaError(`Alibaba request failed: ${error}`, 500);
    }
  }

  async function* makeStreamRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): AsyncIterable<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Alibaba API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Alibaba API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new AlibabaError(message, res.status, resBody);
      }

      for await (const { data } of sseToIterable(res)) {
        if (data === "[DONE]") {
          break;
        }

        try {
          yield JSON.parse(data) as T;
        } catch {
          // ignore non-JSON lines
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal,
    options: { baseOverride?: string } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${options.baseOverride ?? baseURL}${path}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Alibaba API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Alibaba API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new AlibabaError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AlibabaError) throw error;
      throw new AlibabaError(`Alibaba request failed: ${error}`, 500);
    }
  }

  // -- Namespace construction -----------------------------------------------

  const postV1 = {
    chat: {
      completions: Object.assign(
        async (
          req: AlibabaChatRequest,
          signal?: AbortSignal
        ): Promise<AlibabaChatResponse> => {
          return makeRequest<AlibabaChatResponse>(
            "/chat/completions",
            req,
            signal
          );
        },
        {
          payloadSchema: chatCompletionsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, chatCompletionsSchema);
          },
        }
      ),
    },
  };

  const postStreamV1 = {
    chat: {
      completions: Object.assign(
        (
          req: AlibabaChatRequest,
          signal?: AbortSignal
        ): AsyncIterable<AlibabaChatStreamChunk> => {
          return makeStreamRequest<AlibabaChatStreamChunk>(
            "/chat/completions",
            { ...req, stream: true },
            signal
          );
        },
        {
          payloadSchema: chatCompletionsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, chatCompletionsSchema);
          },
        }
      ),
    },
  };

  const getV1 = {
    models: async (signal?: AbortSignal): Promise<AlibabaModelListResponse> => {
      return makeGetRequest<AlibabaModelListResponse>("/models", signal);
    },
  };

  const postApiV1 = {
    services: {
      aigc: {
        videoGeneration: {
          videoSynthesis: Object.assign(
            async (
              req: AlibabaVideoSynthesisRequest,
              signal?: AbortSignal
            ): Promise<AlibabaVideoSynthesisSubmitResponse> => {
              return makeRequest<AlibabaVideoSynthesisSubmitResponse>(
                "/services/aigc/video-generation/video-synthesis",
                req,
                signal,
                {
                  baseOverride: nativeBaseURL,
                  extraHeaders: { "X-DashScope-Async": "enable" },
                }
              );
            },
            {
              payloadSchema: videoSynthesisSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, videoSynthesisSchema);
              },
            }
          ),
        },
      },
    },
  };

  const getApiV1 = {
    tasks: async (
      taskId: string,
      signal?: AbortSignal
    ): Promise<AlibabaTaskStatusResponse> => {
      return makeGetRequest<AlibabaTaskStatusResponse>(
        `/tasks/${encodeURIComponent(taskId)}`,
        signal,
        { baseOverride: nativeBaseURL }
      );
    },
  };

  return {
    post: {
      v1: postV1,
      stream: { v1: postStreamV1 },
      api: { v1: postApiV1 },
    },
    get: {
      v1: getV1,
      api: { v1: getApiV1 },
    },
  };
}
