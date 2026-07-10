import {
  ZaiCodingError,
  ZaiCodingOptions,
  ZaiCodingProvider,
  ZaiCodingCallOptions,
  ZaiCodingChatRequest,
  ZaiCodingChatResponse,
  ZaiCodingQuotaLimitResponse,
  ZaiCodingModelUsageResponse,
  ZaiCodingToolUsageResponse,
} from "./types";
import { ZaiCodingChatRequestSchema } from "./zod";
import { attachExamples } from "./example";

/**
 * Z.ai GLM Coding Plan provider.
 *
 * Wraps the coding-plan chat endpoint (OpenAI-compatible) plus the account
 * usage/quota monitoring endpoints. The coding endpoint is metered against the
 * GLM Coding Plan subscription; the monitor endpoints report how much of that
 * quota has been consumed.
 */
export function createZaiCoding(
  options: ZaiCodingOptions = {}
): ZaiCodingProvider {
  const apiKey = options.apiKey ?? process.env.ZAI_CODING_PLAN_API_KEY ?? "";
  if (!apiKey) {
    throw new ZaiCodingError("ZAI_CODING_PLAN_API_KEY is required");
  }
  const baseURL = options.baseUrl ?? "https://api.z.ai";
  const fetchImpl = options.fetch ?? fetch;
  const timeout = options.timeout ?? 30000;

  async function send(
    path: string,
    init: RequestInit,
    auth: "bearer" | "raw"
  ): Promise<Response> {
    const url = new URL(path, baseURL);
    const headers = new Headers(init.headers);
    if (!headers.has("Authorization")) {
      // Chat uses a Bearer token; the monitor endpoints take the raw key.
      headers.set(
        "Authorization",
        auth === "bearer" ? `Bearer ${apiKey}` : apiKey
      );
    }
    if (init.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Fall back to a client-side timeout when the caller doesn't pass a signal.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const requestSignal = init.signal ?? controller.signal;

    let response: Response;
    try {
      response = await fetchImpl(url.toString(), {
        ...init,
        headers,
        signal: requestSignal,
      });
    } catch (error) {
      throw new ZaiCodingError(
        `Failed to reach ${url.toString()}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        undefined,
        error
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let body: unknown;
      let detail = response.statusText;
      try {
        body = await response.json();
        detail = JSON.stringify(body);
      } catch {
        // Non-JSON error body — fall back to the status text.
      }
      throw new ZaiCodingError(
        `HTTP ${response.status}: ${detail}`,
        response.status,
        body
      );
    }
    return response;
  }

  // POST helper (Bearer auth). The `make*Request` name drives both the runtime
  // method and the HTTP method the endpoint-walk lint derives for each leaf.
  async function makeJsonRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const res = await send(
      path,
      { method: "POST", body: JSON.stringify(body), signal },
      "bearer"
    );
    return (await res.json()) as T;
  }

  // GET helper for the coding-plan monitor reads. These endpoints authenticate
  // with the raw API key in `Authorization` (no `Bearer` prefix).
  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    const res = await send(
      path,
      { method: "GET", headers: { "Accept-Language": "en-US,en" }, signal },
      "raw"
    );
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  return attachExamples({
    post: {
      api: {
        coding: {
          paas: {
            v4: {
              chat: {
                // POST https://api.z.ai/api/coding/paas/v4/chat/completions
                // Docs: https://docs.z.ai/api-reference/llm/chat-completion
                completions: Object.assign(
                  async (
                    params: ZaiCodingChatRequest,
                    opts?: ZaiCodingCallOptions
                  ): Promise<ZaiCodingChatResponse> => {
                    if (params.stream) {
                      throw new ZaiCodingError(
                        "Streaming is not supported by this client; set stream:false or omit it."
                      );
                    }
                    return makeJsonRequest<ZaiCodingChatResponse>(
                      "/api/coding/paas/v4/chat/completions",
                      params,
                      opts?.signal
                    );
                  },
                  { schema: ZaiCodingChatRequestSchema }
                ),
              },
            },
          },
        },
      },
    },
    get: {
      api: {
        monitor: {
          usage: {
            quota: {
              // GET https://api.z.ai/api/monitor/usage/quota/limit
              // Docs: https://docs.z.ai/api-reference/introduction
              limit: async (
                opts?: ZaiCodingCallOptions
              ): Promise<ZaiCodingQuotaLimitResponse> => {
                return makeGetRequest<ZaiCodingQuotaLimitResponse>(
                  "/api/monitor/usage/quota/limit",
                  opts?.signal
                );
              },
            },
            // GET https://api.z.ai/api/monitor/usage/model-usage
            // Docs: https://docs.z.ai/api-reference/introduction
            modelUsage: async (
              opts?: ZaiCodingCallOptions
            ): Promise<ZaiCodingModelUsageResponse> => {
              return makeGetRequest<ZaiCodingModelUsageResponse>(
                "/api/monitor/usage/model-usage",
                opts?.signal
              );
            },
            // GET https://api.z.ai/api/monitor/usage/tool-usage
            // Docs: https://docs.z.ai/api-reference/introduction
            toolUsage: async (
              opts?: ZaiCodingCallOptions
            ): Promise<ZaiCodingToolUsageResponse> => {
              return makeGetRequest<ZaiCodingToolUsageResponse>(
                "/api/monitor/usage/tool-usage",
                opts?.signal
              );
            },
          },
        },
      },
    },
  });
}
