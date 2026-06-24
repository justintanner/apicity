import { KieError } from "./types";
import { KieResponsesRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import { sseToIterable } from "./sse";

function attachAbortHandler(
  signal: AbortSignal | undefined,
  controller: AbortController
): void {
  if (!signal) return;

  if (signal.aborted) {
    controller.abort();
    return;
  }

  if (typeof signal.addEventListener === "function") {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
}

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
  for await (const payload of sseToIterable(res)) {
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

async function readError(
  res: Response
): Promise<{ message: string; body: unknown; code?: string }> {
  let message = `Kie Responses API error: ${res.status}`;
  let body: unknown = null;
  let code: string | undefined;

  try {
    body = await res.json();
    if (typeof body === "object" && body !== null && "error" in body) {
      const err = (body as { error?: { message?: string; type?: string } })
        .error;
      if (typeof err?.message === "string") {
        message = `Kie Responses API error ${res.status}: ${err.message}`;
      }
      if (typeof err?.type === "string") {
        code = err.type;
      }
    }
  } catch {
    // Keep the default status-only error if the body is not JSON.
  }

  return { message, body, code };
}

export function createResponsesProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieResponsesProvider {
  // POST https://api.kie.ai/codex/v1/responses
  // Docs: https://docs.kie.ai/market/chat/gpt-5-5
  const responses = Object.assign(
    async function responses(
      req: KieResponsesRequest,
      signal?: AbortSignal
    ): Promise<KieResponsesResponse | AsyncIterable<KieResponsesStreamEvent>> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        attachAbortHandler(signal, controller);
      }

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        if (req.stream) {
          headers.Accept = "text/event-stream";
        }

        const res = await doFetch(`${baseURL}/codex/v1/responses`, {
          method: "POST",
          headers,
          body: JSON.stringify(req),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const { message, body, code } = await readError(res);
          throw new KieError(message, res.status, body, code);
        }

        if (req.stream) {
          return parseResponsesStream(res);
        }

        return (await res.json()) as KieResponsesResponse;
      } catch (error) {
        clearTimeout(timeoutId);
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
