import { describe, expect, it, vi } from "vitest";

import { anthropic } from "../../packages/provider/anthropic/src/anthropic";
import type {
  AnthropicMessageRequest,
  AnthropicStreamEvent,
} from "../../packages/provider/anthropic/src/types";

interface AssembledToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface AssembledStreamMessage {
  text: string;
  toolUses: AssembledToolUse[];
}

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

function createInterruptedSseResponse(chunk: string, error: Error): Response {
  const encoder = new TextEncoder();
  let sent = false;
  const stream = new ReadableStream({
    pull(controller) {
      if (!sent) {
        sent = true;
        controller.enqueue(encoder.encode(chunk));
        return;
      }
      throw error;
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

function serializeEvents(events: AnthropicStreamEvent[]): string {
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
}

function assembleStreamMessage(
  events: AnthropicStreamEvent[]
): AssembledStreamMessage {
  const textBlocks = new Map<number, string>();
  const toolBlocks = new Map<
    number,
    {
      id: string;
      name: string;
      input: Record<string, unknown>;
      partialJson: string;
    }
  >();

  for (const event of events) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "text") {
        textBlocks.set(event.index, event.content_block.text);
      }

      if (event.content_block.type === "tool_use") {
        toolBlocks.set(event.index, {
          id: event.content_block.id,
          name: event.content_block.name,
          input: event.content_block.input,
          partialJson: "",
        });
      }
    }

    if (event.type !== "content_block_delta") {
      continue;
    }

    if (event.delta.type === "text_delta") {
      textBlocks.set(
        event.index,
        `${textBlocks.get(event.index) ?? ""}${event.delta.text}`
      );
    }

    if (event.delta.type === "input_json_delta") {
      const toolBlock = toolBlocks.get(event.index);
      if (!toolBlock) continue;
      toolBlock.partialJson += event.delta.partial_json;
    }
  }

  const text = [...textBlocks.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, value]) => value)
    .join("");
  const toolUses = [...toolBlocks.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, toolBlock]) => ({
      id: toolBlock.id,
      name: toolBlock.name,
      input: toolBlock.partialJson
        ? (JSON.parse(toolBlock.partialJson) as Record<string, unknown>)
        : toolBlock.input,
    }));

  return { text, toolUses };
}

describe("anthropic streaming", () => {
  const request: AnthropicMessageRequest = {
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: "What's the weather in San Francisco?",
      },
    ],
  };

  it("should assemble chunked streaming text and tool call deltas", async () => {
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
          stop_sequence: null,
          usage: {
            input_tokens: 18,
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
          text: "Hello ",
        },
      },
      {
        type: "content_block_delta",
        index: 0,
        delta: {
          type: "text_delta",
          text: "world",
        },
      },
      {
        type: "content_block_stop",
        index: 0,
      },
      {
        type: "content_block_start",
        index: 1,
        content_block: {
          type: "tool_use",
          id: "toolu_123",
          name: "get_weather",
          input: {},
        },
      },
      {
        type: "content_block_delta",
        index: 1,
        delta: {
          type: "input_json_delta",
          partial_json: '{"location":"San',
        },
      },
      {
        type: "content_block_delta",
        index: 1,
        delta: {
          type: "input_json_delta",
          partial_json: ' Francisco, CA","unit":"celsius"}',
        },
      },
      {
        type: "content_block_stop",
        index: 1,
      },
      {
        type: "message_delta",
        delta: {
          stop_reason: "tool_use",
          stop_sequence: null,
        },
        usage: {
          output_tokens: 9,
        },
      },
      {
        type: "message_stop",
      },
    ];
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        createSseResponse(chunkString(serializeEvents(expectedEvents), 19))
      );
    const client = anthropic({ apiKey: "test-key", fetch: mockFetch });

    const stream = await client.v1.messages.stream(request);
    const receivedEvents: AnthropicStreamEvent[] = [];

    for await (const event of stream) {
      receivedEvents.push(event);
    }

    const assembled = assembleStreamMessage(receivedEvents);
    const [, init] = mockFetch.mock.calls[0];

    expect(receivedEvents).toEqual(expectedEvents);
    expect(assembled).toEqual({
      text: "Hello world",
      toolUses: [
        {
          id: "toolu_123",
          name: "get_weather",
          input: {
            location: "San Francisco, CA",
            unit: "celsius",
          },
        },
      ],
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      ...request,
      stream: true,
    });
  });

  it("should surface a connection drop after yielding completed events", async () => {
    const firstEvent: AnthropicStreamEvent = {
      type: "message_start",
      message: {
        id: "msg_456",
        type: "message",
        role: "assistant",
        content: [],
        model: request.model,
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 0,
        },
      },
    };
    const connectionError = new Error("connection dropped");
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        createInterruptedSseResponse(
          `data: ${JSON.stringify(firstEvent)}\n\n`,
          connectionError
        )
      );
    const client = anthropic({ apiKey: "test-key", fetch: mockFetch });
    const stream = await client.v1.messages.stream(request);
    const receivedEvents: AnthropicStreamEvent[] = [];

    await expect(
      (async () => {
        for await (const event of stream) {
          receivedEvents.push(event);
        }
      })()
    ).rejects.toThrow("connection dropped");

    expect(receivedEvents).toEqual([firstEvent]);
  });
});
