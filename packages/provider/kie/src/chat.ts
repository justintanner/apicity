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
  response_format?: {
    type: "text" | "json_object" | "json_schema";
    json_schema?: Record<string, unknown>;
  };
}

export interface KieChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
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

interface OpenAIChatCompletion {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
  code?: number;
}

function cleanResponse(text: string): string {
  // Handle concatenated JSON bug: strip leading {} if present
  if (text.startsWith("{}")) {
    return text.slice(2);
  }
  return text;
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
            const chatTimeout = timeout > 30000 ? timeout : 90000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), chatTimeout);

            // Forward external signal to our controller
            if (signal) {
              signal.addEventListener("abort", () => controller.abort());
            }

            try {
              const body: Record<string, unknown> = {
                messages: req.messages,
                stream: false,
              };
              if (req.temperature !== undefined)
                body.temperature = req.temperature;
              if (req.max_tokens !== undefined)
                body.max_tokens = req.max_tokens;
              if (req.response_format)
                body.response_format = req.response_format;

              const res = await doFetch(
                `${baseURL}/gpt-5-2/v1/chat/completions`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(body),
                  signal: controller.signal,
                }
              );

              clearTimeout(timeoutId);

              if (!res.ok) {
                let message = `Kie Chat API error: ${res.status}`;
                try {
                  const errorData: unknown = await res.json();
                  if (
                    typeof errorData === "object" &&
                    errorData !== null &&
                    "msg" in errorData &&
                    typeof (errorData as { msg?: string }).msg === "string"
                  ) {
                    message = `Kie Chat API error ${res.status}: ${(errorData as { msg: string }).msg}`;
                  }
                } catch {
                  // ignore parse errors
                }
                throw new KieError(message, res.status);
              }

              const rawText = await res.text();
              const cleaned = cleanResponse(rawText);
              const data: OpenAIChatCompletion = JSON.parse(cleaned);

              if (data.error) {
                throw new KieError(data.error, data.code ?? 500);
              }

              if (data.code && data.code !== 200) {
                if (data.code === 402) {
                  throw new KieError("Insufficient balance", 402);
                }
                throw new KieError(`API error: ${data.code}`, data.code);
              }

              const choice = data.choices?.[0];
              if (!choice?.message?.content) {
                throw new KieError("No content in chat response", 500);
              }

              return {
                content: choice.message.content,
                model: data.model ?? "gpt-5.2",
                usage: {
                  promptTokens: data.usage?.prompt_tokens ?? 0,
                  completionTokens: data.usage?.completion_tokens ?? 0,
                  totalTokens: data.usage?.total_tokens ?? 0,
                },
                finishReason: choice.finish_reason ?? "stop",
              };
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
