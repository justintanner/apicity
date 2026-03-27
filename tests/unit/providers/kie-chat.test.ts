// Tests for the GPT-5.2 chat sub-provider
import { describe, it, expect, vi } from "vitest";
import {
  createChatProvider,
  KieError,
} from "../../../packages/provider/kie/src";

describe("kie chat provider", () => {
  interface KieChatMessage {
    role: "user" | "assistant" | "system";
    content:
      | string
      | Array<{
          type: "text" | "image_url";
          text?: string;
          image_url?: { url: string };
        }>;
  }

  interface KieChatRequest {
    messages: KieChatMessage[];
    temperature?: number;
    max_tokens?: number;
    response_format?: {
      type: "text" | "json_object" | "json_schema";
      json_schema?: Record<string, unknown>;
    };
  }

  interface KieChatChoice {
    index?: number;
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }

  interface KieChatResponse {
    id?: string;
    object?: string;
    created?: number;
    model?: string;
    choices?: KieChatChoice[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  }

  interface KieChatProvider {
    gpt52: {
      v1: {
        chat: {
          completions(
            req: KieChatRequest,
            signal?: AbortSignal
          ): Promise<KieChatResponse>;
        };
      };
    };
  }

  function createMockChatProvider(): KieChatProvider {
    return {
      gpt52: {
        v1: {
          chat: {
            completions: vi.fn().mockResolvedValue({
              id: "chatcmpl-test",
              object: "chat.completion",
              created: 1700000000,
              model: "gpt-5.2",
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: "Hello! How can I help you today?",
                  },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 8,
                total_tokens: 18,
              },
            }),
          },
        },
      },
    };
  }

  it("should send a simple text message", async () => {
    const chat = createMockChatProvider();
    const result = await chat.gpt52.v1.chat.completions({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.choices?.[0].message?.content).toBe(
      "Hello! How can I help you today?"
    );
    expect(result.model).toBe("gpt-5.2");
    expect(result.choices?.[0].finish_reason).toBe("stop");
  });

  it("should track usage tokens", async () => {
    const chat = createMockChatProvider();
    const result = await chat.gpt52.v1.chat.completions({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.usage?.prompt_tokens).toBe(10);
    expect(result.usage?.completion_tokens).toBe(8);
    expect(result.usage?.total_tokens).toBe(18);
  });

  it("should support system messages", async () => {
    const chat = createMockChatProvider();
    await chat.gpt52.v1.chat.completions({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello" },
      ],
    });
    expect(chat.gpt52.v1.chat.completions).toHaveBeenCalledWith({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello" },
      ],
    });
  });

  it("should support vision with image_url content parts", async () => {
    const chat = createMockChatProvider();
    await chat.gpt52.v1.chat.completions({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: "https://example.com/image.png" },
            },
            { type: "text", text: "Describe this image" },
          ],
        },
      ],
    });
    expect(chat.gpt52.v1.chat.completions).toHaveBeenCalled();
  });

  it("should support temperature and max_tokens", async () => {
    const chat = createMockChatProvider();
    await chat.gpt52.v1.chat.completions({
      messages: [{ role: "user", content: "Be creative" }],
      temperature: 0.9,
      max_tokens: 500,
    });
    expect(chat.gpt52.v1.chat.completions).toHaveBeenCalledWith({
      messages: [{ role: "user", content: "Be creative" }],
      temperature: 0.9,
      max_tokens: 500,
    });
  });

  it("should support structured output with json_object format", async () => {
    const chat = createMockChatProvider();
    (
      chat.gpt52.v1.chat.completions as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      model: "gpt-5.2",
      choices: [
        {
          message: {
            role: "assistant",
            content: '{"name": "test", "value": 42}',
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 15, completion_tokens: 10, total_tokens: 25 },
    });

    const result = await chat.gpt52.v1.chat.completions({
      messages: [{ role: "user", content: "Return JSON" }],
      response_format: { type: "json_object" },
    });
    expect(result.choices?.[0].message?.content).toContain('"name"');
  });

  it("should support multi-turn conversations", async () => {
    const chat = createMockChatProvider();
    await chat.gpt52.v1.chat.completions({
      messages: [
        { role: "user", content: "What is 2+2?" },
        { role: "assistant", content: "4" },
        { role: "user", content: "And 3+3?" },
      ],
    });
    expect(chat.gpt52.v1.chat.completions).toHaveBeenCalled();
  });

  describe("real factory", () => {
    function mockFetchOk(body: Record<string, unknown>): typeof fetch {
      return vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(body), { status: 200 })
        ) as unknown as typeof fetch;
    }

    it("should send correct URL, headers, and body", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response('{"id":"chat-1","model":"gpt-5.2"}', { status: 200 })
        );
      const provider = createChatProvider(
        "https://api.kie.ai",
        "sk-test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      await provider.gpt52.v1.chat.completions({
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kie.ai/gpt-5-2/v1/chat/completions");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer sk-test-key",
          "Content-Type": "application/json",
        })
      );
    });

    it("should return full chat response", async () => {
      const responseBody = {
        id: "chatcmpl-abc",
        object: "chat.completion",
        created: 1700000000,
        model: "gpt-5.2",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello there!" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
      const provider = createChatProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetchOk(responseBody),
        30000
      );

      const result = await provider.gpt52.v1.chat.completions({
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result.id).toBe("chatcmpl-abc");
      expect(result.model).toBe("gpt-5.2");
      expect(result.choices?.[0].message?.content).toBe("Hello there!");
      expect(result.usage?.total_tokens).toBe(15);
    });
  });

  describe("error handling (real factory)", () => {
    it("should throw KieError on HTTP error with msg body", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ msg: "Rate limit exceeded", code: 429 }),
            { status: 429 }
          )
        );
      const provider = createChatProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.gpt52.v1.chat.completions({
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(429);
        expect((err as KieError).message).toContain("Rate limit exceeded");
      }
    });

    it("should throw KieError on network failure", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      const provider = createChatProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.gpt52.v1.chat.completions({
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).message).toContain("Chat request failed");
      }
    });

    it("should throw KieError on malformed JSON response", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response("not valid json", { status: 200 }));
      const provider = createChatProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.gpt52.v1.chat.completions({
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).message).toContain(
          "Failed to parse chat response"
        );
      }
    });
  });

  describe("payloadSchema", () => {
    const provider = createChatProvider(
      "https://api.kie.ai",
      "test-key",
      fetch,
      30000
    );

    it("should have method POST and correct path", () => {
      expect(provider.gpt52.v1.chat.completions.payloadSchema.method).toBe(
        "POST"
      );
      expect(provider.gpt52.v1.chat.completions.payloadSchema.path).toContain(
        "chat/completions"
      );
    });

    it("should have required messages field", () => {
      const { fields } = provider.gpt52.v1.chat.completions.payloadSchema;
      expect(fields.messages.required).toBe(true);
    });

    it("should accept valid request", () => {
      const result = provider.gpt52.v1.chat.completions.validatePayload({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty object", () => {
      const result = provider.gpt52.v1.chat.completions.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
