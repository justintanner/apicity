import { describe, expect, it, vi } from "vitest";

import { createKimiCoding } from "../../packages/provider/kimicoding/src/kimicoding";
import { KimiCodingError } from "../../packages/provider/kimicoding/src/types";
import type {
  AnthropicMessage,
  ChatRequest,
  CountTokensRequest,
} from "../../packages/provider/kimicoding/src/types";

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
}

describe("kimicoding token handling", () => {
  it("should preserve input and output token usage from message responses", async () => {
    const request: ChatRequest = {
      model: "k2p5",
      max_tokens: 256,
      messages: [{ role: "user", content: "Count the tokens in this reply" }],
    };
    const response: AnthropicMessage = {
      id: "msg_123",
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: "Token accounting response" }],
      model: "k2p5",
      stop_reason: "end_turn",
      usage: {
        input_tokens: 18,
        output_tokens: 7,
      },
    };
    const mockFetch = vi.fn().mockResolvedValue(createJsonResponse(response));
    const provider = createKimiCoding({ apiKey: "test-key", fetch: mockFetch });

    const result = await provider.post.coding.v1.messages(request);
    const [url, init] = mockFetch.mock.calls[0];

    expect(result.usage).toEqual({
      input_tokens: 18,
      output_tokens: 7,
    });
    expect(result.usage.input_tokens + result.usage.output_tokens).toBe(25);
    expect(url).toBe("https://api.kimi.com/coding/v1/messages");
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify(request),
    });
  });

  it("should send countTokens requests to /v1/tokens/count", async () => {
    const request: CountTokensRequest = {
      model: "k2p5",
      messages: [{ role: "user", content: "Count me" }],
      system: "Return only the count.",
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ input_tokens: 42 }));
    const provider = createKimiCoding({ apiKey: "test-key", fetch: mockFetch });

    const result = await provider.post.coding.v1.countTokens(request);
    const [url, init] = mockFetch.mock.calls[0];

    expect(result).toEqual({ input_tokens: 42 });
    expect(url).toBe("https://api.kimi.com/coding/v1/tokens/count");
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        Authorization: "Bearer test-key",
        "x-api-key": "test-key",
        "Content-Type": "application/json",
      },
    });
  });

  it("should surface parsed count token API errors", async () => {
    const request: CountTokensRequest = {
      model: "k2p5",
      messages: [{ role: "user", content: "Count me" }],
    };
    const errorBody = {
      error: {
        message: "rate limited",
        type: "rate_limit_error",
      },
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse(errorBody, { status: 429 }));
    const provider = createKimiCoding({ apiKey: "test-key", fetch: mockFetch });

    const promise = provider.post.coding.v1.countTokens(request);

    await expect(promise).rejects.toBeInstanceOf(KimiCodingError);
    await expect(promise).rejects.toMatchObject({
      message: "KimiCoding error 429: rate limited",
      status: 429,
      body: errorBody,
    });
  });
});
