// Tests for the openai provider
import { describe, it, expect, vi } from "vitest";

describe("openai provider", () => {
  interface OpenAiMessage {
    role: "user" | "assistant" | "system";
    content: string;
  }

  interface OpenAiToolCall {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }

  interface OpenAiChatResponse {
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
    toolCalls?: OpenAiToolCall[];
  }

  interface OpenAiChatRequest {
    model?: string;
    messages: OpenAiMessage[];
    temperature?: number;
    max_tokens?: number;
    tools?: Array<{
      type: "function";
      function: {
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
      };
    }>;
    tool_choice?:
      | "auto"
      | "none"
      | { type: "function"; function: { name: string } };
  }

  interface OpenAiTranscribeResponse {
    text: string;
  }

  interface OpenAiProvider {
    v1: {
      chat: {
        completions(
          req: OpenAiChatRequest,
          signal?: AbortSignal
        ): Promise<OpenAiChatResponse>;
      };
      audio: {
        transcriptions(
          req: { file: Blob; model?: string; language?: string },
          signal?: AbortSignal
        ): Promise<OpenAiTranscribeResponse>;
      };
    };
  }

  function createMockProvider(): OpenAiProvider {
    return {
      v1: {
        chat: {
          completions: vi.fn().mockResolvedValue({
            content: "Hello! How can I help you today?",
            model: "gpt-5.4-2026-03-05",
            usage: {
              promptTokens: 12,
              completionTokens: 8,
              totalTokens: 20,
            },
            finishReason: "stop",
          }),
        },
        audio: {
          transcriptions: vi.fn().mockResolvedValue({
            text: "Hello world, this is a test transcription.",
          }),
        },
      },
    };
  }

  it("should send a chat message", async () => {
    const provider = createMockProvider();
    const result = await provider.v1.chat.completions({
      messages: [{ role: "user", content: "Hello!" }],
    });
    expect(result.content).toBe("Hello! How can I help you today?");
    expect(result.model).toBe("gpt-5.4-2026-03-05");
  });

  it("should track usage tokens", async () => {
    const provider = createMockProvider();
    const result = await provider.v1.chat.completions({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.usage.promptTokens).toBe(12);
    expect(result.usage.completionTokens).toBe(8);
    expect(result.usage.totalTokens).toBe(20);
  });

  it("should support custom model selection", async () => {
    const provider = createMockProvider();
    await provider.v1.chat.completions({
      model: "gpt-5.4-2026-03-05",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(provider.v1.chat.completions).toHaveBeenCalledWith({
      model: "gpt-5.4-2026-03-05",
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("should support temperature and max_tokens", async () => {
    const provider = createMockProvider();
    await provider.v1.chat.completions({
      messages: [{ role: "user", content: "Be creative" }],
      temperature: 0.8,
      max_tokens: 1000,
    });
    expect(provider.v1.chat.completions).toHaveBeenCalledWith({
      messages: [{ role: "user", content: "Be creative" }],
      temperature: 0.8,
      max_tokens: 1000,
    });
  });

  it("should support tool calls in response", async () => {
    const provider = createMockProvider();
    (
      provider.v1.chat.completions as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      content: "",
      model: "gpt-5.4-2026-03-05",
      usage: { promptTokens: 20, completionTokens: 15, totalTokens: 35 },
      finishReason: "tool_calls",
      toolCalls: [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location": "San Francisco"}',
          },
        },
      ],
    });

    const result = await provider.v1.chat.completions({
      messages: [{ role: "user", content: "What's the weather in SF?" }],
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get weather for a location",
            parameters: {
              type: "object",
              properties: { location: { type: "string" } },
            },
          },
        },
      ],
    });
    expect(result.finishReason).toBe("tool_calls");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls?.[0].function.name).toBe("get_weather");
  });

  it("should support system messages", async () => {
    const provider = createMockProvider();
    await provider.v1.chat.completions({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello" },
      ],
    });
    expect(provider.v1.chat.completions).toHaveBeenCalled();
  });

  it("should transcribe audio", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-audio"], { type: "audio/mp3" });
    const result = await provider.v1.audio.transcriptions({ file });
    expect(result.text).toBe("Hello world, this is a test transcription.");
  });

  it("should pass model and language to transcribe", async () => {
    const provider = createMockProvider();
    const file = new Blob(["fake-audio"], { type: "audio/mp3" });
    await provider.v1.audio.transcriptions({
      file,
      model: "gpt-4o-mini-transcribe",
      language: "en",
    });
    expect(provider.v1.audio.transcriptions).toHaveBeenCalledWith({
      file,
      model: "gpt-4o-mini-transcribe",
      language: "en",
    });
  });
});
