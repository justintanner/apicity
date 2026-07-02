import { KieError } from "./types";
import { KieClaudeRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import { parseKieAnthropicErrorBody } from "./request";
import { createTransport } from "./transport";

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
  schema: ApicitySchema<KieClaudeRequest>;
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
  const transport = createTransport({
    baseUrl: baseURL.replace(/\/$/, ""),
    timeoutMs: timeout,
    fetchImpl: doFetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    parseErrorBody: parseKieAnthropicErrorBody("Kie Claude API error"),
    errorClass: KieError,
    requestFailedPrefix: "Claude request failed",
  });

  return {
    claude: {
      post: {
        v1: {
          // POST https://api.kie.ai/claude/v1/messages
          // Docs: https://docs.kie.ai/market/claude/claude-sonnet-4-6
          messages: Object.assign(
            async function messages(
              req: KieClaudeRequest,
              signal?: AbortSignal
            ): Promise<KieClaudeResponse> {
              try {
                return await transport.postJson<KieClaudeResponse>(
                  "/claude/v1/messages",
                  req,
                  { signal }
                );
              } catch (error) {
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
