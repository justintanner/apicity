import { sseDataToIterable } from "./sse";
import { KieError } from "./types";
import {
  KieGemini35FlashStreamGenerateContentRequestSchema,
  KieGemini36FlashStreamGenerateContentRequestSchema,
  KieGemini3FlashV1betamodelsStreamGenerateContentRequestSchema,
} from "./zod";
import type { ApicitySchema } from "./types";
import type {
  KieGemini35FlashStreamGenerateContentRequest,
  KieGemini36FlashStreamGenerateContentRequest,
  KieGemini3FlashV1betamodelsStreamGenerateContentRequest,
} from "./zod";
import { createTransport } from "./transport";

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

export interface KieGemini36FlashGenerateContentResponse {
  candidates?: KieGeminiCandidate[];
  modelVersion?: string;
  usageMetadata?: KieGeminiUsageMetadata;
  credits_consumed?: number;
  responseId?: string;
  [key: string]: unknown;
}

export type KieGemini36FlashStreamGenerateContentChunk =
  KieGemini36FlashGenerateContentResponse;

export type KieGemini36FlashStreamGenerateContentResult =
  | KieGemini36FlashGenerateContentResponse
  | AsyncIterable<KieGemini36FlashStreamGenerateContentChunk>;

export interface KieGemini3FlashV1betamodelsGenerateContentResponse {
  candidates?: KieGeminiCandidate[];
  modelVersion?: string;
  usageMetadata?: KieGeminiUsageMetadata;
  credits_consumed?: number;
  responseId?: string;
  [key: string]: unknown;
}

export type KieGemini3FlashV1betamodelsStreamGenerateContentChunk =
  KieGemini3FlashV1betamodelsGenerateContentResponse;

export type KieGemini3FlashV1betamodelsStreamGenerateContentResult =
  | KieGemini3FlashV1betamodelsGenerateContentResponse
  | AsyncIterable<KieGemini3FlashV1betamodelsStreamGenerateContentChunk>;

interface KieGemini35FlashStreamGenerateContentMethod {
  (
    req: KieGemini35FlashStreamGenerateContentRequest,
    signal?: AbortSignal
  ): Promise<KieGemini35FlashStreamGenerateContentResult>;
  schema: ApicitySchema<KieGemini35FlashStreamGenerateContentRequest>;
}

interface KieGemini36FlashStreamGenerateContentMethod {
  (
    req: KieGemini36FlashStreamGenerateContentRequest,
    signal?: AbortSignal
  ): Promise<KieGemini36FlashStreamGenerateContentResult>;
  schema: ApicitySchema<KieGemini36FlashStreamGenerateContentRequest>;
}

interface KieGemini3FlashV1betamodelsStreamGenerateContentMethod {
  (
    req: KieGemini3FlashV1betamodelsStreamGenerateContentRequest,
    signal?: AbortSignal
  ): Promise<KieGemini3FlashV1betamodelsStreamGenerateContentResult>;
  schema: ApicitySchema<KieGemini3FlashV1betamodelsStreamGenerateContentRequest>;
}

interface KieGeminiModelsNamespace {
  gemini35Flash: {
    streamGenerateContent: KieGemini35FlashStreamGenerateContentMethod;
  };
  gemini36Flash: {
    streamGenerateContent: KieGemini36FlashStreamGenerateContentMethod;
  };
  gemini3FlashV1betamodels: {
    streamGenerateContent: KieGemini3FlashV1betamodelsStreamGenerateContentMethod;
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
  msg?: string;
  code?: string | number;
}

function isGeminiErrorBody(value: unknown): value is KieGeminiErrorBody {
  return typeof value === "object" && value !== null;
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
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
    if (typeof body.msg === "string") {
      return {
        message: `Kie Gemini API error ${status}: ${body.msg}`,
        code: codeToString(body.code),
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

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no candidates). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (!isGeminiErrorBody(body)) return;
  if (typeof body.code !== "number") return;
  if (body.code === 200) return;
  if (
    typeof body === "object" &&
    body !== null &&
    "candidates" in body &&
    Array.isArray((body as { candidates?: unknown }).candidates)
  ) {
    return;
  }

  const formatted = formatGeminiError(body.code, body);
  throw new KieError(
    formatted.message,
    body.code,
    body,
    formatted.code ?? codeToString(body.code)
  );
}

async function* parseGeminiStream<
  TChunk extends Record<string, unknown> =
    KieGemini35FlashStreamGenerateContentChunk,
>(res: Response): AsyncIterable<TChunk> {
  for await (const data of sseDataToIterable(res)) {
    if (data === "[DONE]") {
      break;
    }

    try {
      yield JSON.parse(data) as TChunk;
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
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    }),
    parseErrorBody: formatGeminiError,
    errorClass: KieError,
    requestFailedPrefix: "Gemini request failed",
  });

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
                  try {
                    const res = await transport.raw(
                      "/gemini/v1/models/gemini-3-5-flash:streamGenerateContent",
                      {
                        method: "POST",
                        body: JSON.stringify(req),
                        signal,
                      }
                    );

                    if (isEventStream(res)) {
                      return parseGeminiStream<KieGemini35FlashStreamGenerateContentChunk>(
                        res
                      );
                    }

                    const data = (await res.json()) as unknown;
                    throwIfKieErrorEnvelope(data);
                    return data as KieGemini35FlashGenerateContentResponse;
                  } catch (error) {
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
            gemini36Flash: {
              // POST https://api.kie.ai/gemini/v1/models/gemini-3-6-flash:streamGenerateContent
              // Docs: https://docs.kie.ai/market/gemini/gemini-3-6-flash
              streamGenerateContent: Object.assign(
                async function streamGenerateContent(
                  req: KieGemini36FlashStreamGenerateContentRequest,
                  signal?: AbortSignal
                ): Promise<KieGemini36FlashStreamGenerateContentResult> {
                  try {
                    const res = await transport.raw(
                      "/gemini/v1/models/gemini-3-6-flash:streamGenerateContent",
                      {
                        method: "POST",
                        body: JSON.stringify(req),
                        signal,
                      }
                    );

                    if (isEventStream(res)) {
                      return parseGeminiStream<KieGemini36FlashStreamGenerateContentChunk>(
                        res
                      );
                    }

                    const data = (await res.json()) as unknown;
                    throwIfKieErrorEnvelope(data);
                    return data as KieGemini36FlashGenerateContentResponse;
                  } catch (error) {
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
                  schema: KieGemini36FlashStreamGenerateContentRequestSchema,
                }
              ),
            },
            gemini3FlashV1betamodels: {
              // POST https://api.kie.ai/gemini/v1/models/gemini-3-flash-v1betamodels:streamGenerateContent
              // Docs: https://docs.kie.ai/market/gemini/gemini-3-flash-v1beta
              streamGenerateContent: Object.assign(
                async function streamGenerateContent(
                  req: KieGemini3FlashV1betamodelsStreamGenerateContentRequest,
                  signal?: AbortSignal
                ): Promise<KieGemini3FlashV1betamodelsStreamGenerateContentResult> {
                  try {
                    const res = await transport.raw(
                      "/gemini/v1/models/gemini-3-flash-v1betamodels:streamGenerateContent",
                      {
                        method: "POST",
                        body: JSON.stringify(req),
                        signal,
                      }
                    );

                    if (isEventStream(res)) {
                      return parseGeminiStream<KieGemini3FlashV1betamodelsStreamGenerateContentChunk>(
                        res
                      );
                    }

                    const data = (await res.json()) as unknown;
                    throwIfKieErrorEnvelope(data);
                    return data as KieGemini3FlashV1betamodelsGenerateContentResponse;
                  } catch (error) {
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
                  schema:
                    KieGemini3FlashV1betamodelsStreamGenerateContentRequestSchema,
                }
              ),
            },
          },
        },
      },
    },
  };
}
