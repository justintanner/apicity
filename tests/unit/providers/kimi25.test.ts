// Tests for the kimi25 provider
import { describe, it, expect, vi } from "vitest";

describe("kimi25 provider", () => {
  interface ChatRequest {
    model: string;
    messages: Array<{ role: string; content: string }>;
  }

  interface ChatStreamChunk {
    delta: string;
    done?: boolean;
  }

  interface ChatResponse {
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
  }

  interface Provider {
    streamChat(req: ChatRequest): AsyncIterable<ChatStreamChunk>;
    chat(req: ChatRequest): Promise<ChatResponse>;
    getModels(): Promise<string[]>;
    validateModel(modelId: string): boolean;
    getMaxTokens(modelId: string): number;
  }

  function createMockProvider(): Provider {
    return {
      streamChat: vi.fn().mockImplementation(async function* (
        _req: ChatRequest
      ) {
        yield { delta: "Hello", done: false };
        yield { delta: " world", done: false };
        yield { delta: "", done: true };
      }),
      chat: vi.fn().mockResolvedValue({
        content: "Hello! How can I help you today?",
        model: "kimi-k2-5",
        usage: { promptTokens: 10, completionTokens: 8, totalTokens: 18 },
        finishReason: "stop",
      }),
      getModels: vi.fn().mockResolvedValue(["kimi-k2-5"]),
      validateModel: vi
        .fn()
        .mockImplementation((modelId: string) =>
          modelId.startsWith("kimi-k2-5")
        ),
      getMaxTokens: vi
        .fn()
        .mockImplementation((modelId: string) =>
          modelId.startsWith("kimi-k2-5") ? 131072 : 8192
        ),
    };
  }

  it("should validate model IDs correctly", () => {
    const provider = createMockProvider();
    expect(provider.validateModel("kimi-k2-5")).toBe(true);
    expect(provider.validateModel("kimi-k2-5-latest")).toBe(true);
    expect(provider.validateModel("gpt-4")).toBe(false);
  });

  it("should return max tokens based on model", () => {
    const provider = createMockProvider();
    expect(provider.getMaxTokens("kimi-k2-5")).toBe(131072);
    expect(provider.getMaxTokens("kimi-k2-5-latest")).toBe(131072);
    expect(provider.getMaxTokens("unknown-model")).toBe(8192);
  });

  it("should stream chat responses", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "kimi-k2-5",
      messages: [{ role: "user", content: "Hello!" }],
    };

    const chunks: ChatStreamChunk[] = [];
    for await (const chunk of provider.streamChat(req)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0].delta).toBe("Hello");
    expect(chunks[1].delta).toBe(" world");
    expect(chunks[2].done).toBe(true);
  });

  it("should return non-streaming chat response", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "kimi-k2-5",
      messages: [{ role: "user", content: "Hello!" }],
    };

    const response = await provider.chat(req);

    expect(response.content).toBe("Hello! How can I help you today?");
    expect(response.model).toBe("kimi-k2-5");
    expect(response.usage.totalTokens).toBe(18);
  });
});
