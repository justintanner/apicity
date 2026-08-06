import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini25ProChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini25ProChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini25ProChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini25ProChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini25ProChatChoice {
  index?: number;
  message?: KieGemini25ProChatMessage;
  delta?: KieGemini25ProChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini25ProCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini25ProChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini25ProCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini25ProChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini25ProChatChoice[];
  usage?: KieGemini25ProChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini25ProChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini25ProChatChoice[];
  usage?: KieGemini25ProChatUsage;
  [key: string]: unknown;
}

export type KieGemini25ProChatCompletionsResult =
  | KieGemini25ProChatCompletionResponse
  | AsyncIterable<KieGemini25ProChatCompletionChunk>;

interface KieGemini25ProChatCompletionsMethod {
  (
    req: KieGemini25ProChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini25ProChatCompletionsResult>;
  schema: ApicitySchema<KieGemini25ProChatCompletionsRequest>;
}

interface KieGemini25ProChatNamespace {
  completions: KieGemini25ProChatCompletionsMethod;
}

interface KieGemini25ProV1Namespace {
  chat: KieGemini25ProChatNamespace;
}

interface KieGemini25ProPostNamespace {
  v1: KieGemini25ProV1Namespace;
}

export interface KieGemini25ProProvider {
  gemini25Pro: {
    post: KieGemini25ProPostNamespace;
  };
}

interface KieGemini25ProErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini25ProErrorBody(
  value: unknown
): value is KieGemini25ProErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini25ProError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini25ProErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 2.5 Pro API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 2.5 Pro API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 2.5 Pro API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 2.5 Pro API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGemini25ProErrorBody(body)) return;
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

  const formatted = formatGemini25ProError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini25ProChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini25ProChatCompletionChunk;
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

export function createGemini25ProProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini25ProProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini25ProError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 2.5 Pro chat request failed",
  });

  return {
    gemini25Pro: {
      post: {
        v1: {
          chat: {
            // sig-ok: URL segment has a dot; TS namespace uses a valid identifier.
            // POST https://api.kie.ai/gemini-2.5-pro/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-2-5-pro
            completions: Object.assign(
              async function completions(
                req: KieGemini25ProChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini25ProChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-2.5-pro/v1/chat/completions",
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
                  return data as KieGemini25ProChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 2.5 Pro chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 2.5 Pro chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini25ProChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
