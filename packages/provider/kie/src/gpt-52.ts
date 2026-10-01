import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import { KieGpt52ChatCompletionsRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGpt52ChatCompletionsRequest } from "./zod";
import { createTransport } from "./transport";

export interface KieGpt52ChatMessage {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGpt52ChatDelta {
  role?: string;
  content?: string | null;
  [key: string]: unknown;
}

export interface KieGpt52ChatChoice {
  index?: number;
  message?: KieGpt52ChatMessage;
  delta?: KieGpt52ChatDelta;
  finish_reason?: string | null;
  [key: string]: unknown;
}

export interface KieGpt52CompletionTokensDetails {
  reasoning_tokens?: number;
  audio_tokens?: number;
  text_tokens?: number;
  [key: string]: unknown;
}

export interface KieGpt52ChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: KieGpt52CompletionTokensDetails;
  [key: string]: unknown;
}

export interface KieGpt52ChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGpt52ChatChoice[];
  usage?: KieGpt52ChatUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieGpt52ChatCompletionChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieGpt52ChatChoice[];
  usage?: KieGpt52ChatUsage;
  [key: string]: unknown;
}

export type KieGpt52ChatCompletionsResult =
  | KieGpt52ChatCompletionResponse
  | AsyncIterable<KieGpt52ChatCompletionChunk>;

interface KieGpt52ChatCompletionsMethod {
  (
    req: KieGpt52ChatCompletionsRequest,
    signal?: AbortSignal
  ): Promise<KieGpt52ChatCompletionsResult>;
  schema: ApicitySchema<KieGpt52ChatCompletionsRequest>;
}

interface KieGpt52ChatNamespace {
  completions: KieGpt52ChatCompletionsMethod;
}

interface KieGpt52V1Namespace {
  chat: KieGpt52ChatNamespace;
}

interface KieGpt52PostNamespace {
  v1: KieGpt52V1Namespace;
}

export interface KieGpt52Provider {
  gpt52: {
    post: KieGpt52PostNamespace;
  };
}

interface KieGpt52ErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
  msg?: string;
  code?: string | number;
}

function isGpt52ErrorBody(value: unknown): value is KieGpt52ErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatGpt52Error(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGpt52ErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie GPT 5.2 API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.msg === "string") {
      return {
        message: `Kie GPT 5.2 API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie GPT 5.2 API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie GPT 5.2 API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no choices). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGpt52ErrorBody(body)) return;
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

  const formatted = formatGpt52Error(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseChatCompletionsStream(
  res: Response
): AsyncIterable<KieGpt52ChatCompletionChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGpt52ChatCompletionChunk;
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

export function createGpt52Provider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGpt52Provider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatGpt52Error,
    errorClass: KieError,
    requestFailedPrefix: "GPT 5.2 chat request failed",
  });

  return {
    gpt52: {
      post: {
        v1: {
          chat: {
            // Measured 2026-10-01: parts-array content gets an empty completion; send a string.
            // POST https://api.kie.ai/gpt-5-2/v1/chat/completions
            // Docs: https://docs.kie.ai/market/chat/gpt-5-2
            completions: Object.assign(
              async function completions(
                req: KieGpt52ChatCompletionsRequest,
                signal?: AbortSignal
              ): Promise<KieGpt52ChatCompletionsResult> {
                try {
                  const res = await transport.raw(
                    "/gpt-5-2/v1/chat/completions",
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
                  return data as KieGpt52ChatCompletionResponse;
                } catch (error) {
                  if (error instanceof KieError) throw error;
                  if (error instanceof SyntaxError) {
                    throw new KieError(
                      "Failed to parse GPT 5.2 chat response",
                      500
                    );
                  }
                  throw new KieError(
                    `GPT 5.2 chat request failed: ${error}`,
                    500
                  );
                }
              },
              {
                schema: KieGpt52ChatCompletionsRequestSchema,
              }
            ),
          },
        },
      },
    },
  };
}
