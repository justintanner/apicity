import { describe, expect, it, vi } from "vitest";

import { createAnthropic } from "../../packages/provider/anthropic/src/anthropic";
import {
  AnthropicCountTokensRequestSchema,
  AnthropicMessageRequestSchema,
} from "../../packages/provider/anthropic/src/zod";
import type {
  AnthropicCountTokensRequest,
  AnthropicMessageRequest,
} from "../../packages/provider/anthropic/src/types";

function createJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("anthropic tool calls", () => {
  const messageRequest: AnthropicMessageRequest = {
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: "What's the weather in San Francisco?",
      },
    ],
  };

  it("should return structured tool_use blocks from message responses", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      createJsonResponse({
        id: "msg_123",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "I'll check the weather.",
          },
          {
            type: "tool_use",
            id: "toolu_123",
            name: "get_weather",
            input: {
              location: "San Francisco, CA",
              unit: "celsius",
            },
          },
        ],
        model: "claude-sonnet-4-5-20250929",
        stop_reason: "tool_use",
        stop_sequence: null,
        usage: {
          input_tokens: 19,
          output_tokens: 7,
        },
      })
    );
    const client = createAnthropic({ apiKey: "test-key", fetch: mockFetch });

    const result = await client.v1.messages(messageRequest);
    const [url, init] = mockFetch.mock.calls[0];

    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(messageRequest);
    expect(result.stop_reason).toBe("tool_use");

    const toolUseBlock = result.content.find(
      (block) => block.type === "tool_use"
    );

    expect(toolUseBlock).toBeDefined();
    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      throw new Error("Expected a tool_use block in the response");
    }

    expect(toolUseBlock).toEqual({
      type: "tool_use",
      id: "toolu_123",
      name: "get_weather",
      input: {
        location: "San Francisco, CA",
        unit: "celsius",
      },
    });
  });

  it("should send countTokens requests to /messages/count_tokens", async () => {
    const countRequest: AnthropicCountTokensRequest = {
      model: "claude-sonnet-4-5-20250929",
      messages: messageRequest.messages,
      tools: [
        {
          name: "get_weather",
          description: "Get the weather for a location",
          input_schema: {
            type: "object",
            properties: {
              location: { type: "string" },
            },
            required: ["location"],
          },
        },
      ],
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ input_tokens: 42 }));
    const client = createAnthropic({ apiKey: "test-key", fetch: mockFetch });

    const result = await client.v1.messages.countTokens(countRequest);
    const [url, init] = mockFetch.mock.calls[0];

    expect(url).toBe("https://api.anthropic.com/v1/messages/count_tokens");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(countRequest);
    expect(result).toEqual({ input_tokens: 42 });
  });

  it("should enforce max_tokens for messages but not countTokens via Zod schemas", () => {
    const client = createAnthropic({ apiKey: "test-key" });

    expect(client.v1.messages.schema).toBe(AnthropicMessageRequestSchema);
    expect(client.v1.messages.countTokens.schema).toBe(
      AnthropicCountTokensRequestSchema
    );

    const messageValidation = client.v1.messages.schema.safeParse({
      model: messageRequest.model,
      messages: messageRequest.messages,
    });
    const countValidation = client.v1.messages.countTokens.schema.safeParse({
      model: messageRequest.model,
      messages: messageRequest.messages,
    });

    expect(messageValidation.success).toBe(false);
    expect(
      messageValidation.error?.issues.some((i) => i.path.includes("max_tokens"))
    ).toBe(true);
    expect(countValidation.success).toBe(true);
  });
});
