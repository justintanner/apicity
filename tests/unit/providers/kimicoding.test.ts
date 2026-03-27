import { describe, it, expect, vi } from "vitest";
import {
  textBlock,
  imageBase64,
  imageUrl,
  kimicoding,
  KimiCodingError,
} from "../../../packages/provider/kimicoding/src";
import type {
  ChatRequest,
  AnthropicMessage,
  AnthropicStreamEvent,
  KimiCodingProvider,
} from "../../../packages/provider/kimicoding/src";

function createMockProvider(): KimiCodingProvider {
  const messages = Object.assign(
    vi.fn().mockResolvedValue({
      id: "msg-test",
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: "Hello! How can I help you today?" }],
      model: "k2p5",
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 8 },
    } satisfies AnthropicMessage),
    {
      stream: vi.fn().mockImplementation(async function* (_req: ChatRequest) {
        yield {
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text: "Hello" },
        } satisfies AnthropicStreamEvent;
        yield {
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text: " world" },
        } satisfies AnthropicStreamEvent;
        yield {
          type: "message_delta",
          delta: { stop_reason: "end_turn" },
          usage: { output_tokens: 8 },
        } satisfies AnthropicStreamEvent;
      }),
    }
  );
  return {
    coding: {
      v1: {
        messages,
      },
    },
  };
}

describe("kimicoding provider", () => {
  it("should stream chat responses", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "k2p5",
      max_tokens: 32768,
      messages: [{ role: "user", content: "Hello!" }],
    };

    const chunks: AnthropicStreamEvent[] = [];
    for await (const chunk of provider.coding.v1.messages.stream(req)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0].delta?.text).toBe("Hello");
    expect(chunks[1].delta?.text).toBe(" world");
    expect(chunks[2].delta?.stop_reason).toBe("end_turn");
  });

  it("should return non-streaming chat response", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "k2p5",
      max_tokens: 32768,
      messages: [{ role: "user", content: "Hello!" }],
    };

    const response = await provider.coding.v1.messages(req);

    expect(response.content[0].text).toBe("Hello! How can I help you today?");
    expect(response.model).toBe("k2p5");
    expect(response.usage.input_tokens + response.usage.output_tokens).toBe(18);
  });

  it("should accept content block array with image in chat request", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "k2p5",
      max_tokens: 32768,
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

  it("should accept string content", async () => {
    const provider = createMockProvider();
    const req: ChatRequest = {
      model: "k2p5",
      max_tokens: 32768,
      messages: [{ role: "user", content: "Hello!" }],
    };
    const response = await provider.coding.v1.messages(req);
    expect(response.content[0].text).toBe("Hello! How can I help you today?");
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

  describe("payloadSchema", () => {
    const provider = kimicoding({
      apiKey: "test-key",
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    });

    it("coding.v1.messages.payloadSchema has method POST and path /v1/messages", () => {
      const schema = provider.coding.v1.messages.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/messages");
    });

    it("coding.v1.messages.stream.payloadSchema has method POST and path /v1/messages", () => {
      const schema = provider.coding.v1.messages.stream.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/messages");
    });

    it("coding.v1.messages.validatePayload accepts valid messages request", () => {
      const result = provider.coding.v1.messages.validatePayload({
        model: "k2p5",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1024,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("coding.v1.messages.validatePayload rejects empty object", () => {
      const result = provider.coding.v1.messages.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.join(" ")).toContain("model");
      expect(result.errors.join(" ")).toContain("messages");
      expect(result.errors.join(" ")).toContain("max_tokens");
    });

    it("coding.v1.messages.stream.validatePayload works the same as messages", () => {
      const valid = provider.coding.v1.messages.stream.validatePayload({
        model: "k2p5",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1024,
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);

      const invalid = provider.coding.v1.messages.stream.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });

  describe("real factory", () => {
    it("should send correct URL, headers, and body for messages", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "msg-1",
            type: "message",
            role: "assistant",
            content: [{ type: "text", text: "Hi there!" }],
            model: "k2p5",
            stop_reason: "end_turn",
            usage: { input_tokens: 5, output_tokens: 3 },
          }),
          { status: 200 }
        )
      );
      const provider = kimicoding({
        apiKey: "sk-test-key",
        fetch: mockFetch,
      });

      const result = await provider.coding.v1.messages({
        model: "k2p5",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.id).toBe("msg-1");
      expect(result.content[0].text).toBe("Hi there!");
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kimi.com/coding/v1/messages");
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer sk-test-key"
      );
      expect((init.headers as Record<string, string>)["x-api-key"]).toBe(
        "sk-test-key"
      );
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe("k2p5");
      expect(body.max_tokens).toBe(1024);
    });

    it("should use custom baseURL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "msg-2",
            type: "message",
            role: "assistant",
            content: [{ type: "text", text: "ok" }],
            model: "k2p5",
            stop_reason: "end_turn",
            usage: { input_tokens: 1, output_tokens: 1 },
          }),
          { status: 200 }
        )
      );
      const provider = kimicoding({
        apiKey: "test-key",
        baseURL: "https://custom.kimi.com/coding/",
        fetch: mockFetch,
      });

      await provider.coding.v1.messages({
        model: "k2p5",
        max_tokens: 100,
        messages: [{ role: "user", content: "hi" }],
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://custom.kimi.com/coding/v1/messages");
    });

    it("should stream SSE events from messages.stream", async () => {
      const ssePayload = [
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}\n\n',
        "event: message_stop\ndata: {}\n\n",
      ].join("");

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(ssePayload));
          controller.close();
        },
      });

      const mockFetch = vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        })
      );

      const provider = kimicoding({
        apiKey: "test-key",
        fetch: mockFetch,
      });

      const chunks: AnthropicStreamEvent[] = [];
      for await (const chunk of provider.coding.v1.messages.stream({
        model: "k2p5",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].delta?.text).toBe("Hello");
      expect(chunks[1].delta?.text).toBe(" world");
    });
  });

  describe("error handling (real factory)", () => {
    it("should throw KimiCodingError on HTTP error with error body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "Invalid API key", type: "auth_error" },
          }),
          { status: 401 }
        )
      );
      const provider = kimicoding({
        apiKey: "bad-key",
        fetch: mockFetch,
      });

      try {
        await provider.coding.v1.messages({
          model: "k2p5",
          max_tokens: 100,
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KimiCodingError);
        expect((err as KimiCodingError).status).toBe(401);
        expect((err as KimiCodingError).message).toContain("Invalid API key");
      }
    });

    it("should throw KimiCodingError on non-parseable error body", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response("Server Error", { status: 500 }));
      const provider = kimicoding({
        apiKey: "test-key",
        fetch: mockFetch,
      });

      try {
        await provider.coding.v1.messages({
          model: "k2p5",
          max_tokens: 100,
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KimiCodingError);
        expect((err as KimiCodingError).status).toBe(500);
      }
    });

    it("should throw KimiCodingError on stream HTTP error", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "Rate limit", type: "rate_limit_error" },
          }),
          { status: 429 }
        )
      );
      const provider = kimicoding({
        apiKey: "test-key",
        fetch: mockFetch,
      });

      try {
        const stream = provider.coding.v1.messages.stream({
          model: "k2p5",
          max_tokens: 100,
          messages: [{ role: "user", content: "hi" }],
        });
        // Must iterate to trigger the error
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of stream) {
          // should not reach here
        }
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KimiCodingError);
        expect((err as KimiCodingError).status).toBe(429);
      }
    });

    it("should throw KimiCodingError on network failure", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      const provider = kimicoding({
        apiKey: "test-key",
        fetch: mockFetch,
      });

      try {
        await provider.coding.v1.messages({
          model: "k2p5",
          max_tokens: 100,
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });
});
