import { KieError } from "./types";
import {
  KieResponsesRequestSchema,
  KieGrokResponsesRequestSchema,
  KieApiResponsesRequestSchema,
} from "./zod";
import type { ApicitySchema } from "./types";
import { sseDataToIterable } from "./sse";
import { createTransport } from "./transport";

export type KieResponsesModel = "gpt-5-5";
export type KieResponsesReasoningEffort = "low" | "medium" | "high" | "xhigh";
export type KieResponsesMessageRole =
  | "user"
  | "assistant"
  | "system"
  | "developer"
  | "tool";
export type KieResponsesInputContentType =
  | "input_text"
  | "input_image"
  | "input_file";
export type KieResponsesToolType = "web_search" | "function";
export type KieResponsesToolChoice = string;

export interface KieResponsesInputText {
  type: "input_text";
  text: string;
}

export interface KieResponsesInputImage {
  type: "input_image";
  image_url: string;
}

export interface KieResponsesInputFile {
  type: "input_file";
  file_url: string;
}

export type KieResponsesInputContent =
  | KieResponsesInputText
  | KieResponsesInputImage
  | KieResponsesInputFile;

export interface KieResponsesInputMessage {
  role: KieResponsesMessageRole;
  content: KieResponsesInputContent[];
}

export interface KieResponsesReasoning {
  effort?: KieResponsesReasoningEffort;
}

export interface KieResponsesWebSearchTool {
  type: "web_search";
}

export interface KieResponsesFunctionTool {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export type KieResponsesTool =
  | KieResponsesWebSearchTool
  | KieResponsesFunctionTool;

export interface KieResponsesRequest {
  // Open enum: KieResponsesRequestSchema unions the listed ids with
  // KieOpenAiModelAliasSchema (zod.ts), so a not-yet-listed versioned GPT id
  // such as `gpt-6` validates. `string & {}` mirrors that hatch here without
  // collapsing the union, so editors still autocomplete the listed ids.
  model: KieResponsesModel | (string & {});
  input: string | KieResponsesInputMessage[];
  stream?: boolean;
  reasoning?: KieResponsesReasoning;
  tools?: KieResponsesTool[];
  tool_choice?: KieResponsesToolChoice;
}

export type KieGrokResponsesModel = "grok-4-5" | "grok-4-6";

// Identical to KieResponsesRequest apart from the model literal — Grok 4.5 is
// served through the same Kie Responses machinery as codex/gpt-5-5.
export interface KieGrokResponsesRequest {
  // Open enum: KieGrokResponsesRequestSchema unions the listed ids with
  // KieGrokModelAliasSchema (zod.ts), so a not-yet-listed versioned Grok id
  // such as `grok-5` validates. `string & {}` mirrors that hatch here without
  // collapsing the union, so editors still autocomplete the listed ids.
  model: KieGrokResponsesModel | (string & {});
  input: string | KieResponsesInputMessage[];
  stream?: boolean;
  reasoning?: KieResponsesReasoning;
  tools?: KieResponsesTool[];
  tool_choice?: KieResponsesToolChoice;
}

export type KieApiResponsesModel =
  | "gpt-5-codex"
  | "gpt-5.1-codex"
  | "gpt-5.2-codex"
  | "gpt-5.3-codex"
  | "gpt-5.4-codex";

// Identical to KieResponsesRequest apart from the model literal — the unified
// GPT Codex surface (`POST /api/v1/responses`) shares the same Kie Responses
// machinery as codex/gpt-5-5 and grok/grok-4-5.
export interface KieApiResponsesRequest {
  // Open enum: KieApiResponsesRequestSchema unions the listed ids with
  // KieApiCodexModelAliasSchema (zod.ts), so a not-yet-listed versioned codex
  // id such as `gpt-5.5-codex` validates. `string & {}` mirrors that hatch
  // here without collapsing the union, so editors still autocomplete the
  // listed ids.
  model: KieApiResponsesModel | (string & {});
  input: string | KieResponsesInputMessage[];
  stream?: boolean;
  reasoning?: KieResponsesReasoning;
  tools?: KieResponsesTool[];
  tool_choice?: KieResponsesToolChoice;
}

type AssertTrue<T extends true> = T;

// Compile-level pin for the `| (string & {})` hatches above. Request schemas
// accept an unlisted versioned id, so these interfaces must too. Drop a hatch
// and the matching line below stops extending its interface, `AssertTrue` sees
// `false` and errors here. No test can catch that on its own: these are erased
// before any test runs, and the listed ids keep working either way. Mirrors
// KieMediaModelStaysLiteral in zod.ts.
export type KieResponsesRequestTakesUnlistedModel = AssertTrue<
  { model: "gpt-6"; input: string } extends KieResponsesRequest ? true : false
>;
export type KieGrokResponsesRequestTakesUnlistedModel = AssertTrue<
  { model: "grok-5"; input: string } extends KieGrokResponsesRequest
    ? true
    : false
>;
export type KieApiResponsesRequestTakesUnlistedModel = AssertTrue<
  { model: "gpt-5.5-codex"; input: string } extends KieApiResponsesRequest
    ? true
    : false
>;

export interface KieResponsesUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  [key: string]: unknown;
}

export interface KieResponsesOutputTextContent {
  type: "output_text";
  text: string;
  annotations?: unknown[];
  [key: string]: unknown;
}

export interface KieResponsesOutputMessage {
  id?: string;
  type: "message";
  role?: string;
  status?: string;
  content?: KieResponsesOutputTextContent[];
  [key: string]: unknown;
}

export interface KieResponsesFunctionCallOutput {
  id?: string;
  type: "function_call";
  call_id?: string;
  name?: string;
  arguments?: string;
  status?: string;
  [key: string]: unknown;
}

export interface KieResponsesReasoningOutput {
  id?: string;
  type: "reasoning";
  summary?: unknown[];
  [key: string]: unknown;
}

export type KieResponsesOutput =
  | KieResponsesOutputMessage
  | KieResponsesFunctionCallOutput
  | KieResponsesReasoningOutput
  | ({ type: string } & Record<string, unknown>);

export interface KieResponsesResponse {
  id?: string;
  object?: string;
  created_at?: number;
  model?: string;
  status?: string;
  output?: KieResponsesOutput[];
  usage?: KieResponsesUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export type KieResponsesStreamEvent =
  | ({ type: "response.output_text.delta"; delta?: string } & Record<
      string,
      unknown
    >)
  | ({
      type: "response.function_call_arguments.delta";
      delta?: string;
    } & Record<string, unknown>)
  | ({ type: "response.completed"; response?: KieResponsesResponse } & Record<
      string,
      unknown
    >)
  | { type: "done" }
  | ({ type: string } & Record<string, unknown>);

export interface KieResponsesMethod {
  (
    req: KieResponsesRequest & { stream: true },
    signal?: AbortSignal
  ): Promise<AsyncIterable<KieResponsesStreamEvent>>;
  (
    req: KieResponsesRequest & { stream?: false },
    signal?: AbortSignal
  ): Promise<KieResponsesResponse>;
  (
    req: KieResponsesRequest,
    signal?: AbortSignal
  ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>>;
  schema: ApicitySchema<KieResponsesRequest>;
}

export interface KieResponsesV1Namespace {
  responses: KieResponsesMethod;
}

export interface KieGrokResponsesMethod {
  (
    req: KieGrokResponsesRequest & { stream: true },
    signal?: AbortSignal
  ): Promise<AsyncIterable<KieResponsesStreamEvent>>;
  (
    req: KieGrokResponsesRequest & { stream?: false },
    signal?: AbortSignal
  ): Promise<KieResponsesResponse>;
  (
    req: KieGrokResponsesRequest,
    signal?: AbortSignal
  ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>>;
  schema: ApicitySchema<KieGrokResponsesRequest>;
}

export interface KieGrokResponsesV1Namespace {
  responses: KieGrokResponsesMethod;
}

export interface KieApiResponsesMethod {
  (
    req: KieApiResponsesRequest & { stream: true },
    signal?: AbortSignal
  ): Promise<AsyncIterable<KieResponsesStreamEvent>>;
  (
    req: KieApiResponsesRequest & { stream?: false },
    signal?: AbortSignal
  ): Promise<KieResponsesResponse>;
  (
    req: KieApiResponsesRequest,
    signal?: AbortSignal
  ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>>;
  schema: ApicitySchema<KieApiResponsesRequest>;
}

export interface KieApiResponsesV1Namespace {
  responses: KieApiResponsesMethod;
}

export interface KieResponsesProvider {
  codex: {
    v1: KieResponsesV1Namespace;
  };
  grok: {
    v1: KieGrokResponsesV1Namespace;
  };
  api: {
    v1: KieApiResponsesV1Namespace;
  };
}

async function* parseResponsesStream(
  res: Response
): AsyncIterable<KieResponsesStreamEvent> {
  for await (const payload of sseDataToIterable(res)) {
    if (payload === "[DONE]") {
      yield { type: "done" };
      continue;
    }

    try {
      yield JSON.parse(payload) as KieResponsesStreamEvent;
    } catch {
      yield { type: "raw", data: payload };
    }
  }
}

function codeToString(code: string | number | undefined): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function formatResponsesError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (typeof body === "object" && body !== null) {
    if ("error" in body) {
      const err = (body as { error?: { message?: unknown; type?: unknown } })
        .error;
      if (typeof err?.message === "string") {
        return {
          message: `Kie Responses API error ${status}: ${err.message}`,
          code: typeof err.type === "string" ? err.type : undefined,
        };
      }
    }

    // Kie business-error envelope (often delivered as HTTP 200):
    // `{ code: 401, msg: "Unauthorized …" }`.
    const envelope = body as { msg?: unknown; code?: unknown };
    if (typeof envelope.msg === "string") {
      return {
        message: `Kie Responses API error ${status}: ${envelope.msg}`,
        code: codeToString(
          typeof envelope.code === "string" || typeof envelope.code === "number"
            ? envelope.code
            : undefined
        ),
      };
    }
  }

  return { message: `Kie Responses API error: ${status}` };
}

/**
 * Upstream sometimes returns HTTP 200 with a Kie envelope:
 * `{ code: 401, msg: "..." }` (no response payload). Surface those as KieError.
 */
function throwIfKieErrorEnvelope(body: unknown): void {
  if (typeof body !== "object" || body === null) return;
  const record = body as {
    code?: unknown;
    output?: unknown;
    status?: unknown;
  };
  if (typeof record.code !== "number") return;
  if (record.code === 200) return;
  // Real Responses payloads include `output` and/or a string `status`
  // (e.g. "completed"); do not treat those as business-error envelopes.
  if (Array.isArray(record.output)) return;
  if (typeof record.status === "string") return;

  const formatted = formatResponsesError(record.code, body);
  throw new KieError(
    formatted.message,
    record.code,
    body,
    formatted.code ?? codeToString(record.code)
  );
}

export function createResponsesProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieResponsesProvider {
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: formatResponsesError,
    errorClass: KieError,
    requestFailedPrefix: "Responses request failed",
  });

  // Shared transport-bound request body for every Kie Responses model. The
  // codex (gpt-5-5), grok (grok-4-5), and unified api (gpt-*-codex) endpoints
  // differ only in their upstream path and model family, so keep the
  // fetch/stream/error handling in one place.
  async function sendResponsesRequest(
    path: string,
    req: KieResponsesRequest | KieGrokResponsesRequest | KieApiResponsesRequest,
    signal?: AbortSignal
  ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>> {
    try {
      const headers = req.stream ? { Accept: "text/event-stream" } : undefined;
      const res = await transport.raw(path, {
        method: "POST",
        headers,
        body: JSON.stringify(req),
        signal,
      });

      if (req.stream) {
        return parseResponsesStream(res);
      }

      const json = (await res.json()) as KieResponsesResponse;
      throwIfKieErrorEnvelope(json);
      return json;
    } catch (error) {
      if (error instanceof KieError) throw error;
      if (error instanceof SyntaxError) {
        throw new KieError("Failed to parse responses response", 500);
      }
      throw new KieError(`Responses request failed: ${error}`, 500);
    }
  }

  // POST https://api.kie.ai/codex/v1/responses
  // Docs: https://docs.kie.ai/market/chat/gpt-5-5
  const codexResponses = Object.assign(
    async function responses(
      req: KieResponsesRequest,
      signal?: AbortSignal
    ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>> {
      return sendResponsesRequest("/codex/v1/responses", req, signal);
    },
    {
      schema: KieResponsesRequestSchema,
    }
  ) as KieResponsesMethod;

  // POST https://api.kie.ai/grok/v1/responses
  // Docs: https://docs.kie.ai/market/grok/grok-4-6
  const grokResponses = Object.assign(
    async function responses(
      req: KieGrokResponsesRequest,
      signal?: AbortSignal
    ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>> {
      return sendResponsesRequest("/grok/v1/responses", req, signal);
    },
    {
      schema: KieGrokResponsesRequestSchema,
    }
  ) as KieGrokResponsesMethod;

  // POST https://api.kie.ai/api/v1/responses
  // Docs: https://docs.kie.ai/market/codex/gpt-codex
  const apiResponses = Object.assign(
    async function responses(
      req: KieApiResponsesRequest,
      signal?: AbortSignal
    ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>> {
      return sendResponsesRequest("/api/v1/responses", req, signal);
    },
    {
      schema: KieApiResponsesRequestSchema,
    }
  ) as KieApiResponsesMethod;

  return {
    codex: {
      v1: {
        responses: codexResponses,
      },
    },
    grok: {
      v1: {
        responses: grokResponses,
      },
    },
    api: {
      v1: {
        responses: apiResponses,
      },
    },
  };
}
