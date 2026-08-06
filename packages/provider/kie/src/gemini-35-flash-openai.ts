import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini35FlashOpenaiChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini35FlashOpenaiChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini35FlashOpenaiChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini35FlashOpenaiChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini35FlashOpenaiChatChoice {
  index?: number;
  message?: KieGemini35FlashOpenaiChatMessage;
  delta?: KieGemini35FlashOpenaiChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini35FlashOpenaiCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini35FlashOpenaiChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini35FlashOpenaiCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini35FlashOpenaiChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini35FlashOpenaiChatChoice[];
  usage?: KieGemini35FlashOpenaiChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini35FlashOpenaiChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini35FlashOpenaiChatChoice[];
  usage?: KieGemini35FlashOpenaiChatUsage;
  [key: string]: unknown;
}

export type KieGemini35FlashOpenaiChatCompletionsResult =
  | KieGemini35FlashOpenaiChatCompletionResponse
  | AsyncIterable<KieGemini35FlashOpenaiChatCompletionChunk>;

interface KieGemini35FlashOpenaiChatCompletionsMethod {
  (
    req: KieGemini35FlashOpenaiChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini35FlashOpenaiChatCompletionsResult>;
  schema: ApicitySchema<KieGemini35FlashOpenaiChatCompletionsRequest>;
}

interface KieGemini35FlashOpenaiChatNamespace {
  completions: KieGemini35FlashOpenaiChatCompletionsMethod;
}

interface KieGemini35FlashOpenaiV1Namespace {
  chat: KieGemini35FlashOpenaiChatNamespace;
}

interface KieGemini35FlashOpenaiPostNamespace {
  v1: KieGemini35FlashOpenaiV1Namespace;
}

export interface KieGemini35FlashOpenaiProvider {
  gemini35FlashOpenai: {
    post: KieGemini35FlashOpenaiPostNamespace;
  };
}

interface KieGemini35FlashOpenaiErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini35FlashOpenaiErrorBody(
  value: unknown
): value is KieGemini35FlashOpenaiErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini35FlashOpenaiError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini35FlashOpenaiErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 3.5 Flash OpenAI API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 3.5 Flash OpenAI API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 3.5 Flash OpenAI API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 3.5 Flash OpenAI API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini35FlashOpenaiErrorBody(body)) return;
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

  const formatted = formatGemini35FlashOpenaiError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini35FlashOpenaiChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini35FlashOpenaiChatCompletionChunk;
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

export function createGemini35FlashOpenaiProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini35FlashOpenaiProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini35FlashOpenaiError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 3.5 Flash OpenAI chat request failed",
  });

  return {
    gemini35FlashOpenai: {
      post: {
        v1: {
          chat: {
            // POST https://api.kie.ai/gemini-3-5-flash-openai/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-3-5-flash-openai
            completions: Object.assign(
              async function completions(
                req: KieGemini35FlashOpenaiChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini35FlashOpenaiChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-3-5-flash-openai/v1/chat/completions",
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
                  return data as KieGemini35FlashOpenaiChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 3.5 Flash OpenAI chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 3.5 Flash OpenAI chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini35FlashOpenaiChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
