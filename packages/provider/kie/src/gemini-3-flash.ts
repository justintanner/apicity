import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini3FlashChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini3FlashChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini3FlashChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini3FlashChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini3FlashChatChoice {
  index?: number;
  message?: KieGemini3FlashChatMessage;
  delta?: KieGemini3FlashChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini3FlashCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini3FlashChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini3FlashCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini3FlashChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini3FlashChatChoice[];
  usage?: KieGemini3FlashChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini3FlashChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini3FlashChatChoice[];
  usage?: KieGemini3FlashChatUsage;
  [key: string]: unknown;
}

export type KieGemini3FlashChatCompletionsResult =
  | KieGemini3FlashChatCompletionResponse
  | AsyncIterable<KieGemini3FlashChatCompletionChunk>;

interface KieGemini3FlashChatCompletionsMethod {
  (
    req: KieGemini3FlashChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini3FlashChatCompletionsResult>;
  schema: ApicitySchema<KieGemini3FlashChatCompletionsRequest>;
}

interface KieGemini3FlashChatNamespace {
  completions: KieGemini3FlashChatCompletionsMethod;
}

interface KieGemini3FlashV1Namespace {
  chat: KieGemini3FlashChatNamespace;
}

interface KieGemini3FlashPostNamespace {
  v1: KieGemini3FlashV1Namespace;
}

export interface KieGemini3FlashProvider {
  gemini3Flash: {
    post: KieGemini3FlashPostNamespace;
  };
}

interface KieGemini3FlashErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini3FlashErrorBody(
  value: unknown
): value is KieGemini3FlashErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini3FlashError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini3FlashErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 3 Flash API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 3 Flash API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 3 Flash API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 3 Flash API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini3FlashErrorBody(body)) return;
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

  const formatted = formatGemini3FlashError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini3FlashChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini3FlashChatCompletionChunk;
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

export function createGemini3FlashProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini3FlashProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini3FlashError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 3 Flash chat request failed",
  });

  return {
    gemini3Flash: {
      post: {
        v1: {
          chat: {
            // POST https://api.kie.ai/gemini-3-flash/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-3-flash
            completions: Object.assign(
              async function completions(
                req: KieGemini3FlashChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini3FlashChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-3-flash/v1/chat/completions",
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
                  return data as KieGemini3FlashChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 3 Flash chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 3 Flash chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini3FlashChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
