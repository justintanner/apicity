import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini37FlashOpenaiChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini37FlashOpenaiChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini37FlashOpenaiChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini37FlashOpenaiChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini37FlashOpenaiChatChoice {
  index?: number;
  message?: KieGemini37FlashOpenaiChatMessage;
  delta?: KieGemini37FlashOpenaiChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini37FlashOpenaiCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini37FlashOpenaiChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini37FlashOpenaiCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini37FlashOpenaiChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini37FlashOpenaiChatChoice[];
  usage?: KieGemini37FlashOpenaiChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini37FlashOpenaiChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini37FlashOpenaiChatChoice[];
  usage?: KieGemini37FlashOpenaiChatUsage;
  [key: string]: unknown;
}

export type KieGemini37FlashOpenaiChatCompletionsResult =
  | KieGemini37FlashOpenaiChatCompletionResponse
  | AsyncIterable<KieGemini37FlashOpenaiChatCompletionChunk>;

interface KieGemini37FlashOpenaiChatCompletionsMethod {
  (
    req: KieGemini37FlashOpenaiChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini37FlashOpenaiChatCompletionsResult>;
  schema: ApicitySchema<KieGemini37FlashOpenaiChatCompletionsRequest>;
}

interface KieGemini37FlashOpenaiChatNamespace {
  completions: KieGemini37FlashOpenaiChatCompletionsMethod;
}

interface KieGemini37FlashOpenaiV1Namespace {
  chat: KieGemini37FlashOpenaiChatNamespace;
}

interface KieGemini37FlashOpenaiPostNamespace {
  v1: KieGemini37FlashOpenaiV1Namespace;
}

export interface KieGemini37FlashOpenaiProvider {
  gemini37FlashOpenai: {
    post: KieGemini37FlashOpenaiPostNamespace;
  };
}

interface KieGemini37FlashOpenaiErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini37FlashOpenaiErrorBody(
  value: unknown
): value is KieGemini37FlashOpenaiErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini37FlashOpenaiError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini37FlashOpenaiErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 3.7 Flash OpenAI API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 3.7 Flash OpenAI API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 3.7 Flash OpenAI API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 3.7 Flash OpenAI API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini37FlashOpenaiErrorBody(body)) return;
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

  const formatted = formatGemini37FlashOpenaiError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini37FlashOpenaiChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini37FlashOpenaiChatCompletionChunk;
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

export function createGemini37FlashOpenaiProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini37FlashOpenaiProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini37FlashOpenaiError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 3.7 Flash OpenAI chat request failed",
  });

  return {
    gemini37FlashOpenai: {
      post: {
        v1: {
          chat: {
            // POST https://api.kie.ai/gemini-3-7-flash-openai/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-3-7-flash-openai
            completions: Object.assign(
              async function completions(
                req: KieGemini37FlashOpenaiChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini37FlashOpenaiChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-3-7-flash-openai/v1/chat/completions",
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
                  return data as KieGemini37FlashOpenaiChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 3.7 Flash OpenAI chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 3.7 Flash OpenAI chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini37FlashOpenaiChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
