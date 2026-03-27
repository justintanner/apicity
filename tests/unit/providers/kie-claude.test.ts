// Tests for the KIE Claude Sonnet 4.6 sub-provider
import { describe, it, expect, vi } from "vitest";
import {
  createClaudeProvider,
  KieError,
} from "../../../packages/provider/kie/src";

describe("kie claude provider", () => {
  interface KieClaudeMessage {
    role: "user" | "assistant";
    content:
      | string
      | Array<{ type: string; text?: string; [key: string]: unknown }>;
  }

  interface KieClaudeToolInputSchema {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  }

  interface KieClaudeTool {
    name: string;
    description: string;
    input_schema: KieClaudeToolInputSchema;
  }

  interface KieClaudeRequest {
    model: "claude-sonnet-4-6";
    messages: KieClaudeMessage[];
    tools?: KieClaudeTool[];
    thinkingFlag?: boolean;
    stream?: boolean;
  }

  interface KieClaudeContentBlock {
    type: "text" | "tool_use";
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }

  interface KieClaudeResponse {
    id?: string;
    type?: string;
    role?: string;
    model?: string;
    content?: KieClaudeContentBlock[];
    stop_reason?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      service_tier?: string;
    };
    credits_consumed?: number;
  }

  interface KieClaudeProvider {
    claude: {
      v1: {
        messages(
          req: KieClaudeRequest,
          signal?: AbortSignal
        ): Promise<KieClaudeResponse>;
      };
    };
  }

  function createMockClaudeProvider(): KieClaudeProvider {
    return {
      claude: {
        v1: {
          messages: vi.fn().mockResolvedValue({
            id: "msg_01Test123",
            type: "message",
            role: "assistant",
            model: "claude-sonnet-4-6",
            content: [
              { type: "text", text: "Hello! How can I help you today?" },
            ],
            stop_reason: "end_turn",
            usage: {
              input_tokens: 12,
              output_tokens: 10,
              cache_creation_input_tokens: 0,
              cache_read_input_tokens: 0,
              service_tier: "standard",
            },
            credits_consumed: 0.1,
          }),
        },
      },
    };
  }

  it("should send a simple text message", async () => {
    const provider = createMockClaudeProvider();
    const result = await provider.claude.v1.messages({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.content?.[0].text).toBe("Hello! How can I help you today?");
    expect(result.role).toBe("assistant");
    expect(result.stop_reason).toBe("end_turn");
  });

  it("should track usage tokens", async () => {
    const provider = createMockClaudeProvider();
    const result = await provider.claude.v1.messages({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.usage?.input_tokens).toBe(12);
    expect(result.usage?.output_tokens).toBe(10);
    expect(result.credits_consumed).toBe(0.1);
  });

  it("should support tool calling", async () => {
    const provider = createMockClaudeProvider();
    (provider.claude.v1.messages as ReturnType<typeof vi.fn>).mockResolvedValue(
      {
        id: "msg_02Tool456",
        type: "message",
        role: "assistant",
        model: "claude-sonnet-4-6",
        content: [
          {
            type: "tool_use",
            id: "toolu_01abc",
            name: "get_weather",
            input: { location: "Boston, MA" },
          },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 600, output_tokens: 57 },
        credits_consumed: 0.25,
      }
    );

    const result = await provider.claude.v1.messages({
      model: "claude-sonnet-4-6",
      messages: [
        { role: "user", content: "What is the weather like in Boston?" },
      ],
      tools: [
        {
          name: "get_weather",
          description: "Get current weather",
          input_schema: {
            type: "object",
            properties: {
              location: { type: "string" },
            },
            required: ["location"],
          },
        },
      ],
    });

    expect(result.stop_reason).toBe("tool_use");
    expect(result.content?.[0].type).toBe("tool_use");
    expect(result.content?.[0].name).toBe("get_weather");
    expect(result.content?.[0].input).toEqual({ location: "Boston, MA" });
  });

  it("should support thinkingFlag", async () => {
    const provider = createMockClaudeProvider();
    await provider.claude.v1.messages({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Think about this" }],
      thinkingFlag: true,
    });
    expect(provider.claude.v1.messages).toHaveBeenCalledWith({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Think about this" }],
      thinkingFlag: true,
    });
  });

  it("should support multi-turn conversations", async () => {
    const provider = createMockClaudeProvider();
    await provider.claude.v1.messages({
      model: "claude-sonnet-4-6",
      messages: [
        { role: "user", content: "What is 2+2?" },
        { role: "assistant", content: "4" },
        { role: "user", content: "And 3+3?" },
      ],
    });
    expect(provider.claude.v1.messages).toHaveBeenCalled();
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
        .mockResolvedValue(new Response('{"id":"msg_1"}', { status: 200 }));
      const provider = createClaudeProvider(
        "https://api.kie.ai",
        "sk-test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      await provider.claude.v1.messages({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.kie.ai/claude/v1/messages");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer sk-test-key",
          "Content-Type": "application/json",
        })
      );
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe("claude-sonnet-4-6");
      expect(body.messages).toEqual([{ role: "user", content: "Hi" }]);
    });

    it("should return full response", async () => {
      const responseBody = {
        id: "msg_abc",
        type: "message",
        role: "assistant",
        model: "claude-sonnet-4-6",
        content: [{ type: "text", text: "Hello!" }],
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 5 },
        credits_consumed: 0.1,
      };
      const provider = createClaudeProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetchOk(responseBody),
        30000
      );

      const result = await provider.claude.v1.messages({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.id).toBe("msg_abc");
      expect(result.content?.[0]).toEqual({ type: "text", text: "Hello!" });
      expect(result.usage?.input_tokens).toBe(10);
      expect(result.credits_consumed).toBe(0.1);
    });

    it("should support tool use", async () => {
      const responseBody = {
        id: "msg_tool",
        type: "message",
        role: "assistant",
        model: "claude-sonnet-4-6",
        content: [
          {
            type: "tool_use",
            id: "toolu_1",
            name: "get_weather",
            input: { location: "London" },
          },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 20, output_tokens: 15 },
      };
      const provider = createClaudeProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetchOk(responseBody),
        30000
      );

      const result = await provider.claude.v1.messages({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "What's the weather?" }],
        tools: [
          {
            name: "get_weather",
            description: "Get current weather",
            input_schema: {
              type: "object",
              properties: { location: { type: "string" } },
              required: ["location"],
            },
          },
        ],
      });

      expect(result.stop_reason).toBe("tool_use");
      expect(result.content?.[0].type).toBe("tool_use");
    });
  });

  describe("error handling (real factory)", () => {
    it("should throw KieError on HTTP error with error body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "Invalid key", type: "auth_error" },
          }),
          { status: 401 }
        )
      );
      const provider = createClaudeProvider(
        "https://api.kie.ai",
        "bad-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.claude.v1.messages({
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(401);
        expect((err as KieError).message).toContain("Invalid key");
        expect((err as KieError).code).toBe("auth_error");
      }
    });

    it("should throw KieError on non-parseable error body", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response("Not JSON", { status: 500 }));
      const provider = createClaudeProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.claude.v1.messages({
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).status).toBe(500);
      }
    });

    it("should throw KieError on network failure", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      const provider = createClaudeProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.claude.v1.messages({
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).message).toContain("Claude request failed");
      }
    });

    it("should throw KieError on malformed JSON response", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response("{{invalid json", { status: 200 }));
      const provider = createClaudeProvider(
        "https://api.kie.ai",
        "test-key",
        mockFetch as unknown as typeof fetch,
        30000
      );

      try {
        await provider.claude.v1.messages({
          model: "claude-sonnet-4-6",
          messages: [{ role: "user", content: "hi" }],
        });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(KieError);
        expect((err as KieError).message).toContain(
          "Failed to parse Claude response"
        );
      }
    });
  });

  describe("payloadSchema", () => {
    const provider = createClaudeProvider(
      "https://api.kie.ai",
      "test-key",
      fetch,
      30000
    );

    it("should have method POST and correct path", () => {
      expect(provider.claude.v1.messages.payloadSchema.method).toBe("POST");
      expect(provider.claude.v1.messages.payloadSchema.path).toContain(
        "claude"
      );
    });

    it("should have required model and messages fields", () => {
      const { fields } = provider.claude.v1.messages.payloadSchema;
      expect(fields.model.required).toBe(true);
      expect(fields.messages.required).toBe(true);
    });

    it("should accept valid request", () => {
      const result = provider.claude.v1.messages.validatePayload({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty object", () => {
      const result = provider.claude.v1.messages.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject missing model", () => {
      const result = provider.claude.v1.messages.validatePayload({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.valid).toBe(false);
    });

    it("should reject missing messages", () => {
      const result = provider.claude.v1.messages.validatePayload({
        model: "claude-sonnet-4-6",
      });
      expect(result.valid).toBe(false);
    });
  });
});
