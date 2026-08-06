import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini25FlashChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini25FlashChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini25FlashChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini25FlashChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini25FlashChatChoice {
  index?: number;
  message?: KieGemini25FlashChatMessage;
  delta?: KieGemini25FlashChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini25FlashCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini25FlashChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini25FlashCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini25FlashChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini25FlashChatChoice[];
  usage?: KieGemini25FlashChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini25FlashChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini25FlashChatChoice[];
  usage?: KieGemini25FlashChatUsage;
  [key: string]: unknown;
}

export type KieGemini25FlashChatCompletionsResult =
  | KieGemini25FlashChatCompletionResponse
  | AsyncIterable<KieGemini25FlashChatCompletionChunk>;

interface KieGemini25FlashChatCompletionsMethod {
  (
    req: KieGemini25FlashChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini25FlashChatCompletionsResult>;
  schema: ApicitySchema<KieGemini25FlashChatCompletionsRequest>;
}

interface KieGemini25FlashChatNamespace {
  completions: KieGemini25FlashChatCompletionsMethod;
}

interface KieGemini25FlashV1Namespace {
  chat: KieGemini25FlashChatNamespace;
}

interface KieGemini25FlashPostNamespace {
  v1: KieGemini25FlashV1Namespace;
}

export interface KieGemini25FlashProvider {
  gemini25Flash: {
    post: KieGemini25FlashPostNamespace;
  };
}

interface KieGemini25FlashErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini25FlashErrorBody(
  value: unknown
): value is KieGemini25FlashErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini25FlashError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini25FlashErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 2.5 Flash API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 2.5 Flash API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 2.5 Flash API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 2.5 Flash API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini25FlashErrorBody(body)) return;
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

  const formatted = formatGemini25FlashError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini25FlashChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini25FlashChatCompletionChunk;
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

export function createGemini25FlashProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini25FlashProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini25FlashError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 2.5 Flash chat request failed",
  });

  return {
    gemini25Flash: {
      post: {
        v1: {
          chat: {
            // sig-ok: URL segment has a dot; TS namespace uses a valid identifier.
            // POST https://api.kie.ai/gemini-2.5-flash/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-2-5-flash
            completions: Object.assign(
              async function completions(
                req: KieGemini25FlashChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini25FlashChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-2.5-flash/v1/chat/completions",
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
                  return data as KieGemini25FlashChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 2.5 Flash chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 2.5 Flash chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini25FlashChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
