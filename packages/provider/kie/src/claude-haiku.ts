import { KieError } from "./types";
import type { PayloadSchema, ValidationResult } from "./types";
import { claudeHaikuMessagesSchema } from "./schemas";
import { validatePayload } from "./validate";

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface KieClaudeHaikuToolInputSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface KieClaudeHaikuTool {
  name: string;
  description: string;
  input_schema: KieClaudeHaikuToolInputSchema;
}

export interface KieClaudeHaikuContentPart {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface KieClaudeHaikuMessage {
  role: "user" | "assistant";
  content: string | KieClaudeHaikuContentPart[];
}

export interface KieClaudeHaikuRequest {
  model: "claude-haiku-4-5";
  messages: KieClaudeHaikuMessage[];
  tools?: KieClaudeHaikuTool[];
  stream?: boolean;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface KieClaudeHaikuUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  service_tier?: string;
}

export interface KieClaudeHaikuToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
  caller?: { type: string };
}

export interface KieClaudeHaikuTextContent {
  type: "text";
  text: string;
}

export type KieClaudeHaikuContentBlock =
  | KieClaudeHaikuTextContent
  | KieClaudeHaikuToolUseContent;

export interface KieClaudeHaikuResponse {
  id?: string;
  type?: string;
  role?: string;
  model?: string;
  content?: KieClaudeHaikuContentBlock[];
  stop_reason?: string;
  usage?: KieClaudeHaikuUsage;
  credits_consumed?: number;
}

// ---------------------------------------------------------------------------
// Namespace types
// ---------------------------------------------------------------------------

interface KieClaudeHaikuMessagesMethod {
  (
    req: KieClaudeHaikuRequest,
    signal?: AbortSignal
  ): Promise<KieClaudeHaikuResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface KieClaudeHaikuV1Namespace {
  messages: KieClaudeHaikuMessagesMethod;
}

export interface KieClaudeHaikuProvider {
  claudeHaiku: {
    v1: KieClaudeHaikuV1Namespace;
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createClaudeHaikuProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieClaudeHaikuProvider {
  return {
    claudeHaiku: {
      v1: {
        messages: Object.assign(
          async function messages(
            req: KieClaudeHaikuRequest,
            signal?: AbortSignal
          ): Promise<KieClaudeHaikuResponse> {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            if (signal) {
              signal.addEventListener("abort", () => controller.abort());
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
                let message = `Kie Claude Haiku API error: ${res.status}`;
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
                      message = `Kie Claude Haiku API error ${res.status}: ${err.message}`;
                    }
                    code = err.type;
                  }
                } catch {
                  // ignore parse errors
                }
                throw new KieError(message, res.status, body, code);
              }

              return (await res.json()) as KieClaudeHaikuResponse;
            } catch (error) {
              clearTimeout(timeoutId);
              if (error instanceof KieError) throw error;
              if (error instanceof SyntaxError) {
                throw new KieError(
                  "Failed to parse Claude Haiku response",
                  500
                );
              }
              throw new KieError(`Claude Haiku request failed: ${error}`, 500);
            }
          },
          {
            payloadSchema: claudeHaikuMessagesSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, claudeHaikuMessagesSchema);
            },
          }
        ),
      },
    },
  };
}
