import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini4ArgonOpenaiChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini4ArgonOpenaiChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini4ArgonOpenaiChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini4ArgonOpenaiChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini4ArgonOpenaiChatChoice {
  index?: number;
  message?: KieGemini4ArgonOpenaiChatMessage;
  delta?: KieGemini4ArgonOpenaiChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini4ArgonOpenaiCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini4ArgonOpenaiChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini4ArgonOpenaiCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini4ArgonOpenaiChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini4ArgonOpenaiChatChoice[];
  usage?: KieGemini4ArgonOpenaiChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini4ArgonOpenaiChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini4ArgonOpenaiChatChoice[];
  usage?: KieGemini4ArgonOpenaiChatUsage;
  // The docs say the last chunk before [DONE] carries usage and credits.
  credits_consumed?: number;
  [key: string]: unknown;
}

export type KieGemini4ArgonOpenaiChatCompletionsResult =
  | KieGemini4ArgonOpenaiChatCompletionResponse
  | AsyncIterable<KieGemini4ArgonOpenaiChatCompletionChunk>;

interface KieGemini4ArgonOpenaiChatCompletionsMethod {
  (
    req: KieGemini4ArgonOpenaiChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini4ArgonOpenaiChatCompletionsResult>;
  schema: ApicitySchema<KieGemini4ArgonOpenaiChatCompletionsRequest>;
}

interface KieGemini4ArgonOpenaiChatNamespace {
  completions: KieGemini4ArgonOpenaiChatCompletionsMethod;
}

interface KieGemini4ArgonOpenaiV1Namespace {
  chat: KieGemini4ArgonOpenaiChatNamespace;
}

interface KieGemini4ArgonOpenaiPostNamespace {
  v1: KieGemini4ArgonOpenaiV1Namespace;
}

export interface KieGemini4ArgonOpenaiProvider {
  gemini4ArgonOpenai: {
    post: KieGemini4ArgonOpenaiPostNamespace;
  };
}

interface KieGemini4ArgonOpenaiErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini4ArgonOpenaiErrorBody(
  value: unknown
): value is KieGemini4ArgonOpenaiErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini4ArgonOpenaiError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini4ArgonOpenaiErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 4 Argon OpenAI API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 4 Argon OpenAI API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 4 Argon OpenAI API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 4 Argon OpenAI API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini4ArgonOpenaiErrorBody(body)) return;
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

  const formatted = formatGemini4ArgonOpenaiError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini4ArgonOpenaiChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini4ArgonOpenaiChatCompletionChunk;
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

export function createGemini4ArgonOpenaiProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini4ArgonOpenaiProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini4ArgonOpenaiError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 4 Argon OpenAI chat request failed",
  });

  return {
    gemini4ArgonOpenai: {
      post: {
        v1: {
          chat: {
            // POST https://api.kie.ai/gemini-4-argon-openai/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-4-argon-openai
            completions: Object.assign(
              async function completions(
                req: KieGemini4ArgonOpenaiChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini4ArgonOpenaiChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-4-argon-openai/v1/chat/completions",
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
                  return data as KieGemini4ArgonOpenaiChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 4 Argon OpenAI chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 4 Argon OpenAI chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini4ArgonOpenaiChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
