import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini38FlashOpenaiChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini38FlashOpenaiChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini38FlashOpenaiChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini38FlashOpenaiChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini38FlashOpenaiChatChoice {
  index?: number;
  message?: KieGemini38FlashOpenaiChatMessage;
  delta?: KieGemini38FlashOpenaiChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini38FlashOpenaiCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini38FlashOpenaiChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini38FlashOpenaiCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini38FlashOpenaiChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini38FlashOpenaiChatChoice[];
  usage?: KieGemini38FlashOpenaiChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini38FlashOpenaiChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini38FlashOpenaiChatChoice[];
  usage?: KieGemini38FlashOpenaiChatUsage;
  [key: string]: unknown;
}

export type KieGemini38FlashOpenaiChatCompletionsResult =
  | KieGemini38FlashOpenaiChatCompletionResponse
  | AsyncIterable<KieGemini38FlashOpenaiChatCompletionChunk>;

interface KieGemini38FlashOpenaiChatCompletionsMethod {
  (
    req: KieGemini38FlashOpenaiChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini38FlashOpenaiChatCompletionsResult>;
  schema: ApicitySchema<KieGemini38FlashOpenaiChatCompletionsRequest>;
}

interface KieGemini38FlashOpenaiChatNamespace {
  completions: KieGemini38FlashOpenaiChatCompletionsMethod;
}

interface KieGemini38FlashOpenaiV1Namespace {
  chat: KieGemini38FlashOpenaiChatNamespace;
}

interface KieGemini38FlashOpenaiPostNamespace {
  v1: KieGemini38FlashOpenaiV1Namespace;
}

export interface KieGemini38FlashOpenaiProvider {
  gemini38FlashOpenai: {
    post: KieGemini38FlashOpenaiPostNamespace;
  };
}

interface KieGemini38FlashOpenaiErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini38FlashOpenaiErrorBody(
  value: unknown
): value is KieGemini38FlashOpenaiErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini38FlashOpenaiError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini38FlashOpenaiErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 3.8 Flash OpenAI API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 3.8 Flash OpenAI API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 3.8 Flash OpenAI API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 3.8 Flash OpenAI API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini38FlashOpenaiErrorBody(body)) return;
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

  const formatted = formatGemini38FlashOpenaiError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini38FlashOpenaiChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini38FlashOpenaiChatCompletionChunk;
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

export function createGemini38FlashOpenaiProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini38FlashOpenaiProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini38FlashOpenaiError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 3.8 Flash OpenAI chat request failed",
  });

  return {
    gemini38FlashOpenai: {
      post: {
        v1: {
          chat: {
            // POST https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-3-8-flash-openai
            completions: Object.assign(
              async function completions(
                req: KieGemini38FlashOpenaiChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini38FlashOpenaiChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-3-8-flash-openai/v1/chat/completions",
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
                  return data as KieGemini38FlashOpenaiChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 3.8 Flash OpenAI chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 3.8 Flash OpenAI chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini38FlashOpenaiChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
