import {
  AlibabaOptions,
  AlibabaChatRequest,
  AlibabaChatResponse,
  AlibabaChatStreamChunk,
  AlibabaModelListResponse,
  AlibabaProvider,
  AlibabaError,
} from "./types";
import type { ValidationResult } from "./types";
import { chatCompletionsSchema } from "./schemas";
import { validatePayload } from "./validate";
import { sseToIterable } from "./sse";

export function alibaba(opts: AlibabaOptions): AlibabaProvider {
  const baseURL =
    opts.baseURL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
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
    signal?: AbortSignal
  ): Promise<T> {
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
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
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

  return {
    post: {
      v1: postV1,
      stream: { v1: postStreamV1 },
    },
    get: {
      v1: getV1,
    },
  };
}
