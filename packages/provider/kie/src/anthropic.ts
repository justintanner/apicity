import { KieError } from "./types";
import type { ApicitySchema } from "./types";
import { KieAnthropicMessagesRequestSchema } from "./zod";
import { kieRequest, parseKieAnthropicErrorBody } from "./request";
import { createTransport } from "./transport";

// Claude Code's Anthropic-protocol endpoint on KIE
// (https://docs.kie.ai/ai-agent/claude-code). The model listing
// `GET /anthropic/v1/models` is a plain KIE GET and lives in kie.ts beside the
// other listings; this module holds the Messages endpoint, which needs its own
// transport: Anthropic-shaped errors and the protocol version header.

// ---------------------------------------------------------------------------
// Request and response types
// ---------------------------------------------------------------------------

/** A content block a caller sends: a string `type`, other keys kept. */
export interface KieAnthropicContentBlockParam {
  type: string;
  [key: string]: unknown;
}

export interface KieAnthropicMessageParam {
  role: "user" | "assistant";
  content: string | KieAnthropicContentBlockParam[];
}

export interface KieAnthropicTextBlockParam {
  type: "text";
  text: string;
  [key: string]: unknown;
}

export interface KieAnthropicToolParam {
  name: string;
  description?: string;
  input_schema: { type: string; [key: string]: unknown };
  [key: string]: unknown;
}

/** `tool_choice` and `thinking` stay open: Anthropic adds variants. */
export interface KieAnthropicTypedObject {
  type: string;
  [key: string]: unknown;
}

export interface KieAnthropicMessagesRequest {
  // Open enum: KieAnthropicMessagesRequestSchema unions the listed ids with
  // KieClaudeModelAliasSchema (zod.ts), so a not-yet-listed versioned Claude
  // id validates. `string & {}` mirrors that hatch here without collapsing
  // the union, so editors still autocomplete the listed ids.
  model: import("./zod").KieAnthropicMessagesModel | (string & {});
  max_tokens: number;
  messages: KieAnthropicMessageParam[];
  system?: string | KieAnthropicTextBlockParam[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  tools?: KieAnthropicToolParam[];
  tool_choice?: KieAnthropicTypedObject;
  thinking?: KieAnthropicTypedObject;
  metadata?: { user_id?: string; [key: string]: unknown };
  // No streaming on this leaf (ac-wma4p9 OQ-3).
  stream?: false;
}

type AssertTrue<T extends true> = T;

// Compile-level pin for the `| (string & {})` hatch above, as the Responses
// siblings pin theirs in responses.ts: drop the hatch here and in zod.ts's
// KieAnthropicMessagesModel and this stops compiling, which no test could
// notice on its own.
export type KieAnthropicMessagesRequestTakesUnlistedModel = AssertTrue<
  {
    model: "claude-opus-9-9";
    max_tokens: 1;
    messages: [];
  } extends KieAnthropicMessagesRequest
    ? true
    : false
>;

export interface KieAnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  [key: string]: unknown;
}

export interface KieAnthropicTextContent {
  type: "text";
  text: string;
  [key: string]: unknown;
}

export interface KieAnthropicToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
  [key: string]: unknown;
}

export type KieAnthropicContentBlock =
  | KieAnthropicTextContent
  | KieAnthropicToolUseContent
  | ({ type: string } & Record<string, unknown>);

/** An Anthropic Message, open to KIE's extra keys such as `credits_consumed`. */
export interface KieAnthropicMessagesResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: KieAnthropicContentBlock[];
  stop_reason: string | null;
  stop_sequence?: string | null;
  usage: KieAnthropicUsage;
  credits_consumed?: number;
  [key: string]: unknown;
}

export interface KieAnthropicMessagesMethod {
  (
    req: KieAnthropicMessagesRequest,
    signal?: AbortSignal
  ): Promise<KieAnthropicMessagesResponse>;
  schema: ApicitySchema<KieAnthropicMessagesRequest>;
}

export interface KieAnthropicMessagesV1Namespace {
  /**
   * Sends one Anthropic Messages request to KIE's Claude Code proxy
   * (`POST /anthropic/v1/messages`).
   *
   * Latency: this method uses the `createKie` `timeout`, which defaults to
   * 30 s (30000 ms). KIE's agent proxy has answered it more slowly than that:
   * the slowest successful call observed took 108 s (2026-09-30). Pass a
   * larger `timeout` in milliseconds to `createKie`, for example
   * `createKie({ apiKey, timeout: 300_000 })`. The option applies to every
   * method of that client.
   */
  messages: KieAnthropicMessagesMethod;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface KieAnthropicProvider {
  post: {
    anthropic: {
      v1: KieAnthropicMessagesV1Namespace;
    };
  };
}

export function createAnthropicProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieAnthropicProvider {
  // A failure is `{ type: "error", error: { type, message } }`, and every call
  // carries the protocol version Claude Code itself sends (ac-wma4p9 OQ-6).
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    }),
    parseErrorBody: parseKieAnthropicErrorBody("Kie Anthropic API error"),
    errorClass: KieError,
    requestFailedPrefix: "Kie Anthropic request failed",
  });

  return {
    post: {
      anthropic: {
        v1: {
          // POST https://api.kie.ai/anthropic/v1/messages
          // Docs: https://docs.kie.ai/ai-agent/claude-code
          messages: Object.assign(
            async function messages(
              req: KieAnthropicMessagesRequest,
              signal?: AbortSignal
            ): Promise<KieAnthropicMessagesResponse> {
              return kieRequest<KieAnthropicMessagesResponse>(transport, {
                method: "POST",
                path: "/anthropic/v1/messages",
                body: req,
                signal,
                hasPayload: (body) =>
                  body.type === "message" || Array.isArray(body.content),
              });
            },
            {
              schema: KieAnthropicMessagesRequestSchema,
            }
          ),
        },
      },
    },
  };
}
