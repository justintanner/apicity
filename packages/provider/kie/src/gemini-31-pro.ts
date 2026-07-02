import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini31ProChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini31ProChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGemini31ProChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini31ProChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGemini31ProChatChoice {
  index?: number;
  message?: KieGemini31ProChatMessage;
  delta?: KieGemini31ProChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGemini31ProCompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGemini31ProChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGemini31ProCompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGemini31ProChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini31ProChatChoice[];
  usage?: KieGemini31ProChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGemini31ProChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGemini31ProChatChoice[];
  usage?: KieGemini31ProChatUsage;
  [key: string]: unknown;
}

export type KieGemini31ProChatCompletionsResult =
  | KieGemini31ProChatCompletionResponse
  | AsyncIterable<KieGemini31ProChatCompletionChunk>;

interface KieGemini31ProChatCompletionsMethod {
  (
    req: KieGemini31ProChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGemini31ProChatCompletionsResult>;
  schema: ApicitySchema<KieGemini31ProChatCompletionsRequest>;
}

interface KieGemini31ProChatNamespace {
  completions: KieGemini31ProChatCompletionsMethod;
}

interface KieGemini31ProV1Namespace {
  chat: KieGemini31ProChatNamespace;
}

interface KieGemini31ProPostNamespace {
  v1: KieGemini31ProV1Namespace;
}

export interface KieGemini31ProProvider {
  gemini31Pro: {
    post: KieGemini31ProPostNamespace;
  };
}

interface KieGemini31ProErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGemini31ProErrorBody(
  value: unknown
): value is KieGemini31ProErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGemini31ProError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGemini31ProErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini 3.1 Pro API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini 3.1 Pro API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini 3.1 Pro API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini 3.1 Pro API error: ${status}` };
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGemini31ProChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini31ProChatCompletionChunk;
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

export function createGemini31ProProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGemini31ProProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGemini31ProError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini 3.1 Pro chat request failed",
  });

  return {
    gemini31Pro: {
      post: {
        v1: {
          chat: {
            // sig-ok: URL segment has a dot; TS namespace uses a valid identifier.
            // POST https://api.kie.ai/gemini-3.1-pro/v1/chat/completions
            // Docs: https://docs.kie.ai/market/gemini/gemini-3-1-pro
            completions: Object.assign(
              async function completions(
                req: KieGemini31ProChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGemini31ProChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gemini-3.1-pro/v1/chat/completions",
                    {
                      method: "POST",
                      body: JSON.stringify(req),
                      signal,
                    }
                  );

                  if (isEventStream(res)) {
                    return parseChatCompletionsStream(res);
                  }

                  return (await res.json()) as KieGemini31ProChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse Gemini 3.1 Pro chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `Gemini 3.1 Pro chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGemini31ProChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
