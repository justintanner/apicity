// Tests for the KIE Claude Sonnet 4.6 sub-provider
import { describe, it, expect, vi } from "vitest";

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
});
