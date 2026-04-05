import { describe, it, expect } from "vitest";

import {
  sseToIterable,
  parseAnthropicStream,
  type SSEEvent,
} from "../../packages/provider/anthropic/src/sse";
import type { AnthropicStreamEvent } from "../../packages/provider/anthropic/src/types";

// Helper to create a mock Response with a ReadableStream
function createMockResponse(chunks: string[]): Response {
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

describe("anthropic sse", () => {
  describe("sseToIterable edge cases", () => {
    it("should handle chunked data across reads", async () => {
      // Split data across multiple chunks
      const response = createMockResponse([
        "data: hel",
        "lo ",
        "wor",
        "ld\n\n",
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "message", data: "hello world" });
    });

    it("should skip events without data", async () => {
      const response = createMockResponse([
        "event: ping\n\n", // no data field
        "data: has data\n\n",
        "event: empty\n\n", // another no-data event
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "message", data: "has data" });
    });

    it("should handle [DONE] marker as data", async () => {
      const response = createMockResponse(["data: [DONE]\n\n"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "message", data: "[DONE]" });
    });

    it("should handle multiline events", async () => {
      const response = createMockResponse([
        'event: content_block_delta\ndata: {"type":"text_delta"}\ndata: extra data\n\n',
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      // Only the last data: line is captured
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        event: "content_block_delta",
        data: "extra data",
      });
    });

    it("should handle events with different line endings (CRLF)", async () => {
      const response = createMockResponse(["data: hello\r\n\r\n"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "message", data: "hello" });
    });

    it("should handle mixed line endings", async () => {
      const response = createMockResponse([
        "data: first\n\n",
        "data: second\r\n\r\n",
        "data: third\r\n\n", // mixed
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(3);
      expect(events[0].data).toBe("first");
      expect(events[1].data).toBe("second");
      expect(events[2].data).toBe("third");
    });

    it("should handle events with leading whitespace in data", async () => {
      const response = createMockResponse(["data:   hello world  \n\n"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      // The spec says to trim the data value
      expect(events[0].data).toBe("hello world");
    });

    it("should handle event type with custom name", async () => {
      const response = createMockResponse([
        'event: message_start\ndata: {"id":"msg_123"}\n\n',
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        event: "message_start",
        data: '{"id":"msg_123"}',
      });
    });

    it("should handle empty data field", async () => {
      const response = createMockResponse(["data:\n\n", "data: real data\n\n"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      // Empty data should be skipped
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("real data");
    });

    it("should handle very long data values", async () => {
      const longData = "x".repeat(10000);
      const response = createMockResponse([`data: ${longData}\n\n`]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe(longData);
    });

    it("should handle events with id and retry fields (ignored)", async () => {
      const response = createMockResponse([
        "id: 123\nretry: 5000\ndata: hello\n\n",
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "message", data: "hello" });
    });

    it("should handle comment lines (ignored)", async () => {
      const response = createMockResponse([
        ": this is a comment\ndata: hello\n\n",
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "message", data: "hello" });
    });

    it("should handle events split across many small chunks", async () => {
      const chunks = "data: hello world\n\n".split("");
      const response = createMockResponse(chunks);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("hello world");
    });

    it("should handle trailing incomplete event", async () => {
      const response = createMockResponse(["data: first\n\ndata: incomple"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(2);
      expect(events[0].data).toBe("first");
      expect(events[1].data).toBe("incomple");
    });

    it("should handle empty response body", async () => {
      const response = new Response(null);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(0);
    });

    it("should handle response body with only whitespace", async () => {
      const response = createMockResponse(["   \n\n   \n\n"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(0);
    });

    it("should handle multiple events in single chunk", async () => {
      const response = createMockResponse([
        "data: first\n\ndata: second\n\ndata: third\n\n",
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(3);
      expect(events[0].data).toBe("first");
      expect(events[1].data).toBe("second");
      expect(events[2].data).toBe("third");
    });
  });

  describe("parseAnthropicStream edge cases", () => {
    it("should stop on [DONE] marker", async () => {
      const response = createMockResponse([
        'data: {"type":"message_start"}\n\n',
        'data: {"type":"content_block_delta"}\n\n',
        "data: [DONE]\n\n",
        'data: {"type":"should_not_parse"}\n\n', // Should not reach here
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe("message_start");
      expect(events[1].type).toBe("content_block_delta");
    });

    it("should skip malformed JSON silently", async () => {
      const response = createMockResponse([
        'data: {"valid": true}\n\n',
        "data: not valid json\n\n",
        'data: {"also_valid": true}\n\n',
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(2);
      expect((events[0] as { valid: boolean }).valid).toBe(true);
      expect((events[1] as { also_valid: boolean }).also_valid).toBe(true);
    });

    it("should handle empty JSON data", async () => {
      const response = createMockResponse([
        "data: {}\n\n",
        'data: {"type":"ping"}\n\n',
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({});
    });

    it("should handle deeply nested JSON", async () => {
      const nested = {
        type: "content_block_delta",
        delta: {
          type: "text_delta",
          text: "hello",
          metadata: {
            source: { name: "test", version: 1 },
          },
        },
        index: 0,
      };
      const response = createMockResponse([
        `data: ${JSON.stringify(nested)}\n\n`,
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(nested);
    });

    it("should handle unicode in JSON data", async () => {
      const data = {
        type: "content_block_delta",
        delta: { text: "Hello 世界 🌍" },
      };
      const response = createMockResponse([
        `data: ${JSON.stringify(data)}\n\n`,
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect((events[0] as { delta: { text: string } }).delta.text).toBe(
        "Hello 世界 🌍"
      );
    });

    it("should handle special characters in JSON", async () => {
      const data = {
        type: "content_block_delta",
        delta: { text: 'Line 1\nLine 2\tTabbed\r\n"Quoted"' },
      };
      const response = createMockResponse([
        `data: ${JSON.stringify(data)}\n\n`,
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect((events[0] as { delta: { text: string } }).delta.text).toBe(
        'Line 1\nLine 2\tTabbed\r\n"Quoted"'
      );
    });

    it("should handle JSON with [DONE] in string value (not as marker)", async () => {
      const data = {
        type: "content_block_delta",
        delta: { text: "This contains [DONE] marker" },
      };
      const response = createMockResponse([
        `data: ${JSON.stringify(data)}\n\n`,
        'data: {"type":"final"}\n\n',
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(2);
      expect((events[0] as { delta: { text: string } }).delta.text).toBe(
        "This contains [DONE] marker"
      );
    });

    it("should handle no events before [DONE]", async () => {
      const response = createMockResponse(["data: [DONE]\n\n"]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(0);
    });

    it("should handle empty stream", async () => {
      const response = createMockResponse([]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(0);
    });

    it("should handle stream with only invalid JSON", async () => {
      const response = createMockResponse([
        "data: not json\n\n",
        "data: also not json\n\n",
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(0);
    });

    it("should handle chunked JSON data", async () => {
      // Split a JSON object across multiple chunks
      const jsonStr = '{"type":"content_block_delta","delta":{"text":"hello"}}';
      const chunks = [
        `data: ${jsonStr.slice(0, 10)}`,
        jsonStr.slice(10, 25),
        `${jsonStr.slice(25)}\n\n`,
      ];
      const response = createMockResponse(chunks);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("content_block_delta");
    });

    it("should handle events with different event types", async () => {
      const response = createMockResponse([
        'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_123"}}\n\n',
        'event: content_block_start\ndata: {"type":"content_block_start"}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta"}\n\n',
        'event: content_block_stop\ndata: {"type":"content_block_stop"}\n\n',
        'event: message_delta\ndata: {"type":"message_delta"}\n\n',
        'event: message_stop\ndata: {"type":"message_stop"}\n\n',
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(6);
    });

    it("should handle SSE event type vs JSON type field", async () => {
      // The JSON "type" field is what matters for the result, not the SSE event type
      const response = createMockResponse([
        'event: ping\ndata: {"type":"pong"}\n\n',
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("pong");
    });

    it("should preserve tool call event order across arbitrarily chunked streams", async () => {
      const expectedEvents: AnthropicStreamEvent[] = [
        {
          type: "message_start",
          message: {
            id: "msg_123",
            type: "message",
            role: "assistant",
            content: [],
            model: "claude-sonnet-4-5-20250929",
            stop_reason: null,
            stop_sequence: null,
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
            type: "tool_use",
            id: "toolu_123",
            name: "get_weather",
            input: {},
          },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: {
            type: "input_json_delta",
            partial_json: '{"location":"San',
          },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: {
            type: "input_json_delta",
            partial_json: ' Francisco","unit":"celsius"}',
          },
        },
        {
          type: "content_block_stop",
          index: 0,
        },
        {
          type: "message_stop",
        },
      ];

      const serialized = expectedEvents
        .map((event) => `data: ${JSON.stringify(event)}\n\n`)
        .join("");
      const response = createMockResponse(chunkString(serialized, 17));
      const events: AnthropicStreamEvent[] = [];

      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }

      expect(events).toEqual(expectedEvents);
    });
  });
});
