import {
  ChatRequest,
  ChatStreamChunk,
  ChatResponse,
  ChatMessage,
  MessageContent,
  TextContentBlock,
  ImageContentBlock,
  KimiCodingOptions,
  KimiCodingError,
  KimiCodingProvider,
  AnthropicMessage,
  AnthropicStreamEvent,
  AnthropicContentBlock,
} from "./types";
import { sseToIterable } from "./sse";

interface AnthropicErrorBody {
  error?: { message?: string; type?: string };
}

function isAnthropicErrorBody(x: unknown): x is AnthropicErrorBody {
  return (
    typeof x === "object" &&
    x !== null &&
    "error" in x &&
    typeof (x as { error?: unknown }).error === "object"
  );
}

function mapStopReason(
  reason: string | null
): "stop" | "length" | "content_filter" | "tool_calls" {
  if (reason === "end_turn") return "stop";
  if (reason === "max_tokens") return "length";
  if (reason === "stop_sequence") return "stop";
  return "stop";
}

function extractTextFromContent(content: MessageContent): string {
  if (typeof content === "string") return content;
  return content
    .filter((block): block is TextContentBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function textBlock(text: string): TextContentBlock {
  return { type: "text", text };
}

export function imageBase64(
  data: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): ImageContentBlock {
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data },
  };
}

export function imageUrl(url: string): ImageContentBlock {
  return { type: "image", source: { type: "url", url } };
}

function extractSystem(
  messages: ChatMessage[],
  systemPrompt?: string
): { system: string | undefined; filteredMessages: ChatMessage[] } {
  const systemMessages: string[] = [];
  const filteredMessages: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemMessages.push(extractTextFromContent(msg.content));
    } else {
      filteredMessages.push(msg);
    }
  }

  if (systemPrompt) {
    systemMessages.unshift(systemPrompt);
  }

  const system =
    systemMessages.length > 0 ? systemMessages.join("\n\n") : undefined;

  return { system, filteredMessages };
}

function extractTextContent(content: AnthropicContentBlock[]): string {
  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}

export function kimicoding(opts: KimiCodingOptions): KimiCodingProvider {
  const baseURL = opts.baseURL ?? "https://api.kimi.com/coding/";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function buildRequestBody(
    req: ChatRequest,
    stream: boolean
  ): Record<string, unknown> {
    const { system, filteredMessages } = extractSystem(
      req.messages,
      req.systemPrompt
    );

    const body: Record<string, unknown> = {
      model: req.model,
      messages: filteredMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: req.maxTokens ?? 32768,
    };

    if (stream) body.stream = true;
    if (system !== undefined) body.system = system;
    if (req.temperature !== undefined) body.temperature = req.temperature;
    if (req.topP !== undefined) body.top_p = req.topP;
    if (req.stop !== undefined) {
      body.stop_sequences = Array.isArray(req.stop) ? req.stop : [req.stop];
    }

    return body;
  }

  function buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${opts.apiKey}`,
      "x-api-key": opts.apiKey,
      "Content-Type": "application/json",
    };
  }

  return {
    async *streamChat(
      req: ChatRequest,
      signal?: AbortSignal
    ): AsyncIterable<ChatStreamChunk> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const requestBody = buildRequestBody(req, true);

        const res = await doFetch(`${baseURL}v1/messages`, {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(requestBody),
          signal: signal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let message = `KimiCoding error: ${res.status}`;
          try {
            const raw: unknown = await res.json();
            if (
              isAnthropicErrorBody(raw) &&
              typeof raw.error?.message === "string"
            ) {
              message = `KimiCoding error ${res.status}: ${raw.error.message}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new KimiCodingError(message, res.status);
        }

        for await (const { event, data } of sseToIterable(res)) {
          if (event === "message_stop") {
            yield { delta: "", done: true };
            break;
          }

          if (event === "content_block_delta") {
            try {
              const parsed: AnthropicStreamEvent = JSON.parse(data);
              if (parsed.delta?.type === "text_delta" && parsed.delta.text) {
                yield { delta: parsed.delta.text };
              }
            } catch {
              // ignore non-JSON lines
            }
          }

          if (event === "message_delta") {
            try {
              const parsed: AnthropicStreamEvent = JSON.parse(data);
              if (parsed.delta?.stop_reason) {
                yield {
                  delta: "",
                  done: true,
                  finishReason: mapStopReason(parsed.delta.stop_reason),
                  usage: parsed.usage
                    ? {
                        promptTokens: parsed.usage.input_tokens ?? 0,
                        completionTokens: parsed.usage.output_tokens ?? 0,
                        totalTokens:
                          (parsed.usage.input_tokens ?? 0) +
                          (parsed.usage.output_tokens ?? 0),
                      }
                    : undefined,
                };
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }
    },

    async chat(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const requestBody = buildRequestBody(req, false);

        const res = await doFetch(`${baseURL}v1/messages`, {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(requestBody),
          signal: signal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let message = `KimiCoding error: ${res.status}`;
          try {
            const raw: unknown = await res.json();
            if (
              isAnthropicErrorBody(raw) &&
              typeof raw.error?.message === "string"
            ) {
              message = `KimiCoding error ${res.status}: ${raw.error.message}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new KimiCodingError(message, res.status);
        }

        const data: AnthropicMessage = await res.json();

        return {
          content: extractTextContent(data.content),
          model: data.model || req.model,
          usage: data.usage
            ? {
                promptTokens: data.usage.input_tokens || 0,
                completionTokens: data.usage.output_tokens || 0,
                totalTokens:
                  (data.usage.input_tokens || 0) +
                  (data.usage.output_tokens || 0),
              }
            : {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
              },
          finishReason: mapStopReason(data.stop_reason),
          metadata: { id: data.id },
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },

    async getModels(): Promise<string[]> {
      return ["k2p5"];
    },

    validateModel(modelId: string): boolean {
      return modelId === "k2p5" || modelId.startsWith("k2");
    },

    getMaxTokens(_modelId: string): number {
      return 32768;
    },
  };
}
