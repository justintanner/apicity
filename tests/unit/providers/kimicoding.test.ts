import { describe, it, expect, vi } from "vitest";
import {
  textBlock,
  imageBase64,
  imageUrl,
} from "../../../packages/provider/kimicoding/src";
import type {
  ChatRequest,
  ChatStreamChunk,
  KimiCodingProvider,
} from "../../../packages/provider/kimicoding/src";

function createMockProvider(): KimiCodingProvider {
  const messages = Object.assign(
    vi.fn().mockResolvedValue({
      content: "Hello! How can I help you today?",
      model: "k2p5",
      usage: { promptTokens: 10, completionTokens: 8, totalTokens: 18 },
      finishReason: "stop",
    }),
    {
      stream: vi.fn().mockImplementation(async function* (_req: ChatRequest) {
        yield { delta: "Hello", done: false };
        yield { delta: " world", done: false };
        yield { delta: "", done: true };
      }),
    }
  );
  return {
    coding: {
      v1: {
        messages,
      },
    },
    getModels: vi.fn().mockResolvedValue(["k2p5"]),
    validateModel: vi
      .fn()
      .mockImplementation(
        (modelId: string) => modelId === "k2p5" || modelId.startsWith("k2")
      ),
    getMaxTokens: vi.fn().mockReturnValue(32768),
  };
}

describe("kimicoding provider", () => {
  it("should validate model IDs correctly", () => {
    const provider = createMockProvider();
    expect(provider.validateModel("k2p5")).toBe(true);
    expect(provider.validateModel("k2-next")).toBe(true);
    expect(provider.validateModel("gpt-4")).toBe(false);
  });

  it("should return max tokens for k2p5", () => {
    const provider = createMockProvider();
    expect(provider.getMaxTokens("k2p5")).toBe(32768);
  });

  it("should stream chat responses", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "k2p5",
      messages: [{ role: "user", content: "Hello!" }],
    };

    const chunks: ChatStreamChunk[] = [];
    for await (const chunk of provider.coding.v1.messages.stream(req)) {
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
      model: "k2p5",
      messages: [{ role: "user", content: "Hello!" }],
    };

    const response = await provider.coding.v1.messages(req);

    expect(response.content).toBe("Hello! How can I help you today?");
    expect(response.model).toBe("k2p5");
    expect(response.usage.totalTokens).toBe(18);
  });

  it("should return available models", async () => {
    const provider = createMockProvider();
    const models = await provider.getModels();
    expect(models).toEqual(["k2p5"]);
  });

  it("should accept content block array with image in chat request", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "k2p5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: "abc123",
              },
            },
            { type: "text", text: "Describe this image" },
          ],
        },
      ],
    };
    const response = await provider.coding.v1.messages(req);
    expect(response.content).toBeTruthy();
  });

  it("should accept string content for backward compatibility", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "k2p5",
      messages: [{ role: "user", content: "Hello!" }],
    };
    const response = await provider.coding.v1.messages(req);
    expect(response.content).toBe("Hello! How can I help you today?");
  });

  it("textBlock should return a text content block", () => {
    const block = textBlock("hello");
    expect(block).toEqual({ type: "text", text: "hello" });
  });

  it("imageBase64 should return an image content block with base64 source", () => {
    const block = imageBase64("abc123", "image/png");
    expect(block).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: "abc123" },
    });
  });

  it("imageUrl should return an image content block with url source", () => {
    const block = imageUrl("https://example.com/img.png");
    expect(block).toEqual({
      type: "image",
      source: { type: "url", url: "https://example.com/img.png" },
    });
  });
});
