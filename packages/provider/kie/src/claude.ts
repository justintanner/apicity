import { KieError } from "./types";
import { KieClaudeRequestSchema } from "./zod";
import type { z } from "zod";

// Helper function to safely handle AbortSignal across different environments
function attachAbortHandler(
  signal: AbortSignal | undefined,
  controller: AbortController
): void {
  if (!signal) return;

  // Handle both standard AbortSignal and node-fetch's AbortSignal
  if (typeof signal.addEventListener === "function") {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  } else if (signal.aborted) {
    // Already aborted, abort our controller too
    controller.abort();
  }
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface KieClaudeToolInputSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface KieClaudeTool {
  name: string;
  description: string;
  input_schema: KieClaudeToolInputSchema;
}

export interface KieClaudeContentPart {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface KieClaudeMessage {
  role: "user" | "assistant";
  content: string | KieClaudeContentPart[];
}

export interface KieClaudeRequest {
  model: "claude-sonnet-4-6" | "claude-haiku-4-5";
  messages: KieClaudeMessage[];
  tools?: KieClaudeTool[];
  thinkingFlag?: boolean;
  stream?: boolean;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface KieClaudeUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  service_tier?: string;
}

export interface KieClaudeToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
  caller?: { type: string };
}

export interface KieClaudeTextContent {
  type: "text";
  text: string;
}

export type KieClaudeContentBlock =
  | KieClaudeTextContent
  | KieClaudeToolUseContent;

export interface KieClaudeResponse {
  id?: string;
  type?: string;
  role?: string;
  model?: string;
  content?: KieClaudeContentBlock[];
  stop_reason?: string;
  usage?: KieClaudeUsage;
  credits_consumed?: number;
}

// ---------------------------------------------------------------------------
// Namespace types
// ---------------------------------------------------------------------------

interface KieClaudeMessagesMethod {
  (req: KieClaudeRequest, signal?: AbortSignal): Promise<KieClaudeResponse>;
  schema: z.ZodType<KieClaudeRequest>;
}

interface KieClaudeV1Namespace {
  messages: KieClaudeMessagesMethod;
}

interface KieClaudePostNamespace {
  v1: KieClaudeV1Namespace;
}

export interface KieClaudeProvider {
  claude: {
    post: KieClaudePostNamespace;
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createClaudeProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieClaudeProvider {
  return {
    claude: {
      post: {
        v1: {
          // POST https://api.kie.ai/claude/v1/messages
          // Docs: https://docs.kie.ai
          messages: Object.assign(
            async function messages(
              req: KieClaudeRequest,
              signal?: AbortSignal
            ): Promise<KieClaudeResponse> {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);

              if (signal) {
                attachAbortHandler(signal, controller);
              }

              try {
                const res = await doFetch(`${baseURL}/claude/v1/messages`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(req),
                  signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                  let message = `Kie Claude API error: ${res.status}`;
                  let body: unknown = null;
                  let code: string | undefined;
                  try {
                    body = await res.json();
                    if (
                      typeof body === "object" &&
                      body !== null &&
                      "error" in body
                    ) {
                      const err = (
                        body as { error: { message?: string; type?: string } }
                      ).error;
                      if (typeof err.message === "string") {
                        message = `Kie Claude API error ${res.status}: ${err.message}`;
                      }
                      code = err.type;
                    }
                  } catch {
                    // ignore parse errors
                  }
                  throw new KieError(message, res.status, body, code);
                }

                return (await res.json()) as KieClaudeResponse;
              } catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof KieError) throw error;
                if (error instanceof SyntaxError) {
                  throw new KieError("Failed to parse Claude response", 500);
                }
                throw new KieError(`Claude request failed: ${error}`, 500);
              }
            },
            {
              schema: KieClaudeRequestSchema,
            }
          ),
        },
      },
    },
  };
}
