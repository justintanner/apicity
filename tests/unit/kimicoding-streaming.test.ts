import { describe, expect, it, vi } from "vitest";

import { createKimiCoding } from "../../packages/provider/kimicoding/src/kimicoding";
import type {
  AnthropicStreamEvent,
  ChatRequest,
} from "../../packages/provider/kimicoding/src/types";

function createSseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream);
}

function chunkString(value: string, size: number): string[] {
  const chunks: string[] = [];

  for (let i = 0; i < value.length; i += size) {
    chunks.push(value.slice(i, i + size));
  }

  return chunks;
}

function serializeEvent(
  event: string,
  payload: AnthropicStreamEvent,
  separator = "\n\n"
): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}${separator}`;
}

describe("kimicoding streaming", () => {
  const request: ChatRequest = {
    model: "k2p5",
    max_tokens: 256,
    messages: [{ role: "user", content: "Say hello" }],
    stream: true,
  };

  it("should parse chunked streaming events split across reads", async () => {
    const expectedEvents: AnthropicStreamEvent[] = [
      {
        type: "message_start",
        message: {
          id: "msg_123",
          type: "message",
          role: "assistant",
          content: [],
          model: request.model,
          stop_reason: null,
          usage: {
            input_tokens: 12,
            output_tokens: 0,
          },
        },
      },
      {
        type: "content_block_start",
        index: 0,
        content_block: {
          type: "text",
          text: "",
        },
      },
      {
        type: "content_block_delta",
        index: 0,
        delta: {
          type: "text_delta",
          text: "Hel",
        },
      },
      {
        type: "content_block_delta",
        index: 0,
        delta: {
          type: "text_delta",
          text: "lo",
        },
      },
      {
        type: "message_delta",
        delta: {
          stop_reason: "end_turn",
        },
        usage: {
          output_tokens: 2,
        },
      },
    ];
    const rawStream = [
      ...expectedEvents.map((event) =>
        serializeEvent(event.type, event, "\r\n\r\n")
      ),
      serializeEvent(
        "message_stop",
        {
          type: "message_stop",
        },
        "\r\n\r\n"
      ),
    ].join("");
    const mockFetch = vi
      .fn()
      .mockResolvedValue(createSseResponse(chunkString(rawStream, 11)));
    const provider = createKimiCoding({ apiKey: "test-key", fetch: mockFetch });

    const receivedEvents: AnthropicStreamEvent[] = [];
    for await (const event of provider.post.stream.coding.v1.messages(
      request
    )) {
      receivedEvents.push(event);
    }

    const text = receivedEvents
      .filter((event) => event.delta?.type === "text_delta")
      .map((event) => event.delta?.text ?? "")
      .join("");
    const [url, init] = mockFetch.mock.calls[0];

    expect(receivedEvents).toEqual(expectedEvents);
    expect(text).toBe("Hello");
    expect(url).toBe("https://api.kimi.com/coding/v1/messages");
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

  it("should ignore invalid JSON events and stop at message_stop", async () => {
    const validEvent: AnthropicStreamEvent = {
      type: "content_block_delta",
      index: 0,
      delta: {
        type: "text_delta",
        text: "Hello",
      },
    };
    const trailingEvent: AnthropicStreamEvent = {
      type: "content_block_delta",
      index: 0,
      delta: {
        type: "text_delta",
        text: " ignored",
      },
    };
    const rawStream = [
      "event: ping\ndata: not-json\n\n",
      serializeEvent(validEvent.type, validEvent),
      serializeEvent("message_stop", { type: "message_stop" }),
      serializeEvent(trailingEvent.type, trailingEvent),
    ].join("");
    const mockFetch = vi
      .fn()
      .mockResolvedValue(createSseResponse(chunkString(rawStream, 7)));
    const provider = createKimiCoding({ apiKey: "test-key", fetch: mockFetch });

    const receivedEvents: AnthropicStreamEvent[] = [];
    for await (const event of provider.post.stream.coding.v1.messages(
      request
    )) {
      receivedEvents.push(event);
    }

    expect(receivedEvents).toEqual([validEvent]);
  });
});
