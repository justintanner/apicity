import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini3ProChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini3ProChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini3ProChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini3ProChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini3ProChatChoice {
  index?: number;
  message?: KieGemini3ProChatMessage;
  delta?: KieGemini3ProChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini3ProCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini3ProChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini3ProCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini3ProChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini3ProChatChoice[];
  usage?: KieGemini3ProChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini3ProChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini3ProChatChoice[];
  usage?: KieGemini3ProChatUsage;
  [key: string]: unknown;
}

export type KieGemini3ProChatCompletionsResult =
  | KieGemini3ProChatCompletionResponse
  | AsyncIterable<KieGemini3ProChatCompletionChunk>;

interface KieGemini3ProChatCompletionsMethod {
  (
    req: KieGemini3ProChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini3ProChatCompletionsResult>;
  schema: ApicitySchema<KieGemini3ProChatCompletionsRequest>;
}

interface KieGemini3ProChatNamespace {
  completions: KieGemini3ProChatCompletionsMethod;
}

interface KieGemini3ProV1Namespace {
  chat: KieGemini3ProChatNamespace;
}

interface KieGemini3ProPostNamespace {
  v1: KieGemini3ProV1Namespace;
}

export interface KieGemini3ProProvider {
  gemini3Pro: {
    post: KieGemini3ProPostNamespace;
  };
}

interface KieGemini3ProErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini3ProErrorBody(
  value: unknown
): value is KieGemini3ProErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini3ProError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini3ProErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 3 Pro API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 3 Pro API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 3 Pro API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 3 Pro API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini3ProErrorBody(body)) return;
  if (typeof body.code !== "number") return;
  if (body.code === 200) return;
  if (
    typeof body === "object" &&
    body !== null &&
    "choices" in body &&
    Array.isArray((body as { choices?: unknown }).choices)
  ) {
    return;
  }

  const formatted = formatGemini3ProError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini3ProChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini3ProChatCompletionChunk;
    } catch {
      // Ignore keep-alive or non-JSON stream lines.
    }
  }
}

function isEventStream(res: Response): boolean {
  return (
    res.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("text/event-stream") ?? false
  );
}

export function createGemini3ProProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini3ProProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini3ProError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 3 Pro chat request failed",
  });

  return {
    gemini3Pro: {
      post: {
        v1: {
          chat: {
            // POST https://api.kie.ai/gemini-3-pro/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-3-pro
            completions: Object.assign(
              async function completions(
                req: KieGemini3ProChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini3ProChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-3-pro/v1/chat/completions",
                    {
                      method: "POST",
                      body: JSON.stringify(req),
                      signal,
                    }
                  );

                  if (isEventStream(res)) {
                    return parseChatCompletionsStream(res);
                  }

                  const data = (await res.json()) as unknown;
                  throwIfKieErrorEnvelope(data);
                  return data as KieGemini3ProChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 3 Pro chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 3 Pro chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini3ProChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
