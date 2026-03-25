import { KieError } from "./types";

export interface KieChatContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface KieChatMessage {
  role: "user" | "assistant" | "system";
  content: string | KieChatContentPart[];
}

export interface KieChatRequest {
  messages: KieChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: {
    type: "text" | "json_object" | "json_schema";
    json_schema?: Record<string, unknown>;
  };
}

// Raw OpenAI-compatible chat response
export interface KieChatChoice {
  index?: number;
  message?: {
    role?: string;
    content?: string;
  };
  finish_reason?: string;
}

export interface KieChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface KieChatResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieChatChoice[];
  usage?: KieChatUsage;
  error?: string;
  code?: number;
}

interface KieChatCompletionsNamespace {
  completions(
    req: KieChatRequest,
    signal?: AbortSignal
  ): Promise<KieChatResponse>;
}

interface KieChatV1Namespace {
  chat: KieChatCompletionsNamespace;
}

interface KieChatGpt52Namespace {
  v1: KieChatV1Namespace;
}

export interface KieChatProvider {
  gpt52: KieChatGpt52Namespace;
}

export function createChatProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieChatProvider {
  return {
    gpt52: {
      v1: {
        chat: {
          async completions(
            req: KieChatRequest,
            signal?: AbortSignal
          ): Promise<KieChatResponse> {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // Forward external signal to our controller
            if (signal) {
              signal.addEventListener("abort", () => controller.abort());
            }

            try {
              const res = await doFetch(
                `${baseURL}/gpt-5-2/v1/chat/completions`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(req),
                  signal: controller.signal,
                }
              );

              clearTimeout(timeoutId);

              if (!res.ok) {
                let message = `Kie Chat API error: ${res.status}`;
                let body: unknown = null;
                try {
                  body = await res.json();
                  if (
                    typeof body === "object" &&
                    body !== null &&
                    "msg" in body &&
                    typeof (body as { msg?: string }).msg === "string"
                  ) {
                    message = `Kie Chat API error ${res.status}: ${(body as { msg: string }).msg}`;
                  }
                } catch {
                  // ignore parse errors
                }
                throw new KieError(message, res.status, body);
              }

              return (await res.json()) as KieChatResponse;
            } catch (error) {
              clearTimeout(timeoutId);
              if (error instanceof KieError) throw error;
              if (error instanceof SyntaxError) {
                throw new KieError("Failed to parse chat response", 500);
              }
              throw new KieError(`Chat request failed: ${error}`, 500);
            }
          },
        },
      },
    },
  };
}
