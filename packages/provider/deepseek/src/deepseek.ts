import {
  DeepSeekOptions,
  DeepSeekChatRequest,
  DeepSeekChatResponse,
  DeepSeekFimRequest,
  DeepSeekFimResponse,
  DeepSeekModelListResponse,
  DeepSeekBalanceResponse,
  DeepSeekProvider,
  DeepSeekError,
} from "./types";
import type { ValidationResult } from "./types";
import { chatCompletionsSchema, fimCompletionsSchema } from "./schemas";
import { validatePayload } from "./validate";

export function deepseek(opts: DeepSeekOptions): DeepSeekProvider {
  const baseURL = opts.baseURL ?? "https://api.deepseek.com";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    path: string,
    init: { headers: Record<string, string>; body: BodyInit },
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
          ...init.headers,
        },
        body: init.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `DeepSeek API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `DeepSeek API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new DeepSeekError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DeepSeekError) throw error;
      throw new DeepSeekError(`DeepSeek request failed: ${error}`, 500);
    }
  }

  function jsonRequest(body: unknown): {
    headers: Record<string, string>;
    body: string;
  } {
    return {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }

  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const url = `${baseURL}${path}`;

    try {
      const res = await doFetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `DeepSeek API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `DeepSeek API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new DeepSeekError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DeepSeekError) throw error;
      throw new DeepSeekError(`DeepSeek request failed: ${error}`, 500);
    }
  }

  return {
    v1: {
      chat: {
        completions: Object.assign(
          async function completions(
            req: DeepSeekChatRequest,
            signal?: AbortSignal
          ): Promise<DeepSeekChatResponse> {
            return await makeRequest<DeepSeekChatResponse>(
              "/chat/completions",
              jsonRequest(req),
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
      models: {
        list: async function list(
          signal?: AbortSignal
        ): Promise<DeepSeekModelListResponse> {
          return await makeGetRequest<DeepSeekModelListResponse>(
            "/models",
            signal
          );
        },
      },
    },
    beta: {
      completions: Object.assign(
        async function completions(
          req: DeepSeekFimRequest,
          signal?: AbortSignal
        ): Promise<DeepSeekFimResponse> {
          return await makeRequest<DeepSeekFimResponse>(
            "/beta/completions",
            jsonRequest(req),
            signal
          );
        },
        {
          payloadSchema: fimCompletionsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, fimCompletionsSchema);
          },
        }
      ),
    },
    user: {
      balance: async function balance(
        signal?: AbortSignal
      ): Promise<DeepSeekBalanceResponse> {
        return await makeGetRequest<DeepSeekBalanceResponse>(
          "/user/balance",
          signal
        );
      },
    },
  };
}
