import { KieError } from "./types";
import { KieResponsesRequestSchema } from "./zod";
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
  model: KieResponsesModel;
  input: string | KieResponsesInputMessage[];
  stream?: boolean;
  reasoning?: KieResponsesReasoning;
  tools?: KieResponsesTool[];
  tool_choice?: KieResponsesToolChoice;
}

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

export interface KieResponsesProvider {
  codex: {
    v1: KieResponsesV1Namespace;
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

function formatResponsesError(
  status: number,
  body: unknown
): { message: string; code?: string } {
  if (typeof body === "object" && body !== null && "error" in body) {
    const err = (body as { error?: { message?: unknown; type?: unknown } })
      .error;
    if (typeof err?.message === "string") {
      return {
        message: `Kie Responses API error ${status}: ${err.message}`,
        code: typeof err.type === "string" ? err.type : undefined,
      };
    }
  }

  return { message: `Kie Responses API error: ${status}` };
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

  // POST https://api.kie.ai/codex/v1/responses
  // Docs: https://docs.kie.ai/market/chat/gpt-5-5
  const responses = Object.assign(
    async function responses(
      req: KieResponsesRequest,
      signal?: AbortSignal
    ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>> {
      try {
        const headers = req.stream
          ? { Accept: "text/event-stream" }
          : undefined;
        const res = await transport.raw("/codex/v1/responses", {
          method: "POST",
          headers,
          body: JSON.stringify(req),
          signal,
        });

        if (req.stream) {
          return parseResponsesStream(res);
        }

        return (await res.json()) as KieResponsesResponse;
      } catch (error) {
        if (error instanceof KieError) throw error;
        if (error instanceof SyntaxError) {
          throw new KieError("Failed to parse responses response", 500);
        }
        throw new KieError(`Responses request failed: ${error}`, 500);
      }
    },
    {
      schema: KieResponsesRequestSchema,
    }
  ) as KieResponsesMethod;

  return {
    codex: {
      v1: {
        responses,
      },
    },
  };
}
