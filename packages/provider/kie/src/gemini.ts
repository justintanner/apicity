import { sseToIterable } from "./sse";
import { KieError } from "./types";
import { KieGemini35FlashStreamGenerateContentRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import type { KieGemini35FlashStreamGenerateContentRequest } from "./zod";

function attachAbortHandler(
  signal: AbortSignal | undefined,
  controller: AbortController
): void {
  if (!signal) return;

  if (signal.aborted) {
    controller.abort();
    return;
  }

  signal.addEventListener("abort", () => controller.abort(), { once: true });
}

export interface KieGeminiFunctionCall {
  args?: Record<string, unknown>;
  name?: string;
  id?: string;
}

export interface KieGeminiResponsePart {
  text?: string;
  functionCall?: KieGeminiFunctionCall;
  thoughtSignature?: string;
  [key: string]: unknown;
}

export interface KieGeminiResponseContent {
  role?: "model" | "user" | string;
  parts?: KieGeminiResponsePart[];
  [key: string]: unknown;
}

export interface KieGeminiCandidate {
  content?: KieGeminiResponseContent;
  finishReason?: string;
  index?: number;
  safetyRatings?: Array<Record<string, unknown>>;
  groundingMetadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface KieGeminiUsageMetadata {
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
  promptTokenCount?: number;
  [key: string]: unknown;
}

export interface KieGemini35FlashGenerateContentResponse {
  candidates?: KieGeminiCandidate[];
  modelVersion?: string;
  usageMetadata?: KieGeminiUsageMetadata;
  credits_consumed?: number;
  responseId?: string;
  [key: string]: unknown;
}

export type KieGemini35FlashStreamGenerateContentChunk =
  KieGemini35FlashGenerateContentResponse;

export type KieGemini35FlashStreamGenerateContentResult =
  | KieGemini35FlashGenerateContentResponse
  | AsyncIterable<KieGemini35FlashStreamGenerateContentChunk>;

interface KieGemini35FlashStreamGenerateContentMethod {
  (
    req: KieGemini35FlashStreamGenerateContentRequest,
    signal?: AbortSignal
  ): Promise<KieGemini35FlashStreamGenerateContentResult>;
  schema: ApicitySchema<KieGemini35FlashStreamGenerateContentRequest>;
}

interface KieGeminiModelsNamespace {
  gemini35Flash: {
    streamGenerateContent: KieGemini35FlashStreamGenerateContentMethod;
  };
}

interface KieGeminiPostV1Namespace {
  models: KieGeminiModelsNamespace;
}

interface KieGeminiPostNamespace {
  v1: KieGeminiPostV1Namespace;
}

export interface KieGeminiProvider {
  gemini: {
    post: KieGeminiPostNamespace;
  };
}

interface KieGeminiErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
  message?: string;
  type?: string;
}

function isGeminiErrorBody(value: unknown): value is KieGeminiErrorBody {
  return typeof value === "object" && value !== null;
}

function formatGeminiError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (isGeminiErrorBody(body)) {
    if (body.error?.message) {
      return {
        message: `Kie Gemini API error ${status}: ${body.error.message}`,
        code: body.error.type,
      };
    }
    if (typeof body.message === "string") {
      return {
        message: `Kie Gemini API error ${status}: ${body.message}`,
        code: body.type,
      };
    }
  }

  return { message: `Kie Gemini API error: ${status}` };
}

async function parseErrorResponse(res: Response): Promise<KieError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // ignore parse errors
  }

  const formatted = formatGeminiError(res.status, body);
  return new KieError(formatted.message, res.status, body, formatted.code);
}

async function* parseGeminiStream(
  res: Response
): AsyncIterable<KieGemini35FlashStreamGenerateContentChunk> {
  for await (const data of sseToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as KieGemini35FlashStreamGenerateContentChunk;
    } catch {
      // Ignore provider keep-alive or non-JSON stream lines.
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

export function createGeminiProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieGeminiProvider {
  return {
    gemini: {
      post: {
        v1: {
          models: {
            gemini35Flash: {
              // POST https://api.kie.ai/gemini/v1/models/gemini-3-5-flash:streamGenerateContent
              // Docs: https://docs.kie.ai/market/gemini/gemini-3-5-flash
              streamGenerateContent: Object.assign(
                async function streamGenerateContent(
                  req: KieGemini35FlashStreamGenerateContentRequest,
                  signal?: AbortSignal
                ): Promise<KieGemini35FlashStreamGenerateContentResult> {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(
                    () => controller.abort(),
                    timeout
                  );

                  attachAbortHandler(signal, controller);

                  try {
                    const res = await doFetch(
                      `${baseURL}/gemini/v1/models/gemini-3-5-flash:streamGenerateContent`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-Goog-Api-Key": apiKey,
                        },
                        body: JSON.stringify(req),
                        signal: controller.signal,
                      }
                    );

                    clearTimeout(timeoutId);

                    if (!res.ok) {
                      throw await parseErrorResponse(res);
                    }

                    if (isEventStream(res)) {
                      return parseGeminiStream(res);
                    }

                    return (await res.json()) as KieGemini35FlashGenerateContentResponse;
                  } catch (error) {
                    clearTimeout(timeoutId);
                    if (error instanceof KieError) throw error;
                    if (error instanceof SyntaxError) {
                      throw new KieError(
                        "Failed to parse Gemini response",
                        500
                      );
                    }
                    throw new KieError(`Gemini request failed: ${error}`, 500);
                  }
                },
                {
                  schema: KieGemini35FlashStreamGenerateContentRequestSchema,
                }
              ),
            },
          },
        },
      },
    },
  };
}
