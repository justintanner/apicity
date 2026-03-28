import {
  FireworksOptions,
  FireworksChatRequest,
  FireworksChatResponse,
  FireworksCompletionRequest,
  FireworksCompletionResponse,
  FireworksEmbeddingRequest,
  FireworksEmbeddingResponse,
  FireworksRerankRequest,
  FireworksRerankResponse,
  FireworksProvider,
  FireworksError,
} from "./types";
import type { ValidationResult } from "./types";
import {
  chatCompletionsSchema,
  completionsSchema,
  embeddingsSchema,
  rerankSchema,
} from "./schemas";
import { validatePayload } from "./validate";

export function fireworks(opts: FireworksOptions): FireworksProvider {
  const baseURL = opts.baseURL ?? "https://api.fireworks.ai/inference/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
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
        let message = `Fireworks API error: ${res.status}`;
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
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FireworksError) throw error;
      throw new FireworksError(`Fireworks request failed: ${error}`, 500);
    }
  }

  return {
    v1: {
      chat: {
        completions: Object.assign(
          async function completions(
            req: FireworksChatRequest,
            signal?: AbortSignal
          ): Promise<FireworksChatResponse> {
            return await makeRequest<FireworksChatResponse>(
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
      completions: Object.assign(
        async function completions(
          req: FireworksCompletionRequest,
          signal?: AbortSignal
        ): Promise<FireworksCompletionResponse> {
          return await makeRequest<FireworksCompletionResponse>(
            "/completions",
            req,
            signal
          );
        },
        {
          payloadSchema: completionsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, completionsSchema);
          },
        }
      ),
      embeddings: Object.assign(
        async function embeddings(
          req: FireworksEmbeddingRequest,
          signal?: AbortSignal
        ): Promise<FireworksEmbeddingResponse> {
          return await makeRequest<FireworksEmbeddingResponse>(
            "/embeddings",
            req,
            signal
          );
        },
        {
          payloadSchema: embeddingsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, embeddingsSchema);
          },
        }
      ),
      rerank: Object.assign(
        async function rerank(
          req: FireworksRerankRequest,
          signal?: AbortSignal
        ): Promise<FireworksRerankResponse> {
          return await makeRequest<FireworksRerankResponse>(
            "/rerank",
            req,
            signal
          );
        },
        {
          payloadSchema: rerankSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, rerankSchema);
          },
        }
      ),
    },
  };
}
