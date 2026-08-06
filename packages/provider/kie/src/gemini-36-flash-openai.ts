import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini36FlashOpenaiChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini36FlashOpenaiChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini36FlashOpenaiChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini36FlashOpenaiChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini36FlashOpenaiChatChoice {
  index?: number;
  message?: KieGemini36FlashOpenaiChatMessage;
  delta?: KieGemini36FlashOpenaiChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini36FlashOpenaiCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini36FlashOpenaiChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini36FlashOpenaiCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini36FlashOpenaiChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini36FlashOpenaiChatChoice[];
  usage?: KieGemini36FlashOpenaiChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini36FlashOpenaiChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini36FlashOpenaiChatChoice[];
  usage?: KieGemini36FlashOpenaiChatUsage;
  [key: string]: unknown;
}

export type KieGemini36FlashOpenaiChatCompletionsResult =
  | KieGemini36FlashOpenaiChatCompletionResponse
  | AsyncIterable<KieGemini36FlashOpenaiChatCompletionChunk>;

interface KieGemini36FlashOpenaiChatCompletionsMethod {
  (
    req: KieGemini36FlashOpenaiChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini36FlashOpenaiChatCompletionsResult>;
  schema: ApicitySchema<KieGemini36FlashOpenaiChatCompletionsRequest>;
}

interface KieGemini36FlashOpenaiChatNamespace {
  completions: KieGemini36FlashOpenaiChatCompletionsMethod;
}

interface KieGemini36FlashOpenaiV1Namespace {
  chat: KieGemini36FlashOpenaiChatNamespace;
}

interface KieGemini36FlashOpenaiPostNamespace {
  v1: KieGemini36FlashOpenaiV1Namespace;
}

export interface KieGemini36FlashOpenaiProvider {
  gemini36FlashOpenai: {
    post: KieGemini36FlashOpenaiPostNamespace;
  };
}

interface KieGemini36FlashOpenaiErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini36FlashOpenaiErrorBody(
  value: unknown
): value is KieGemini36FlashOpenaiErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini36FlashOpenaiError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini36FlashOpenaiErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 3.6 Flash OpenAI API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 3.6 Flash OpenAI API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 3.6 Flash OpenAI API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 3.6 Flash OpenAI API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini36FlashOpenaiErrorBody(body)) return;
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

  const formatted = formatGemini36FlashOpenaiError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini36FlashOpenaiChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini36FlashOpenaiChatCompletionChunk;
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

export function createGemini36FlashOpenaiProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini36FlashOpenaiProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini36FlashOpenaiError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 3.6 Flash OpenAI chat request failed",
  });

  return {
    gemini36FlashOpenai: {
      post: {
        v1: {
          chat: {
            // POST https://api.kie.ai/gemini-3-6-flash-openai/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-3-6-flash-openai
            completions: Object.assign(
              async function completions(
                req: KieGemini36FlashOpenaiChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini36FlashOpenaiChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-3-6-flash-openai/v1/chat/completions",
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
                  return data as KieGemini36FlashOpenaiChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 3.6 Flash OpenAI chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 3.6 Flash OpenAI chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini36FlashOpenaiChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
