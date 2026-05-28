import { describe, it, expect } from "vitest";

import {
  sseToIterable,
  type SSEEvent,
} from "../../packages/provider/alibaba/src/sse";

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

describe("alibaba sse", () => {
  describe("sseToIterable edge cases", () => {
    it("should handle chunked data across reads", async () => {
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
        "event: ping\n\n",
        "data: has data\n\n",
        "event: empty\n\n",
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

    it("should handle multiline events (last data line wins)", async () => {
      const response = createMockResponse([
        'event: delta\ndata: {"type":"text"}\ndata: extra data\n\n',
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        event: "delta",
        data: "extra data",
      });
    });

    it("should handle events with CRLF line endings", async () => {
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
        "data: third\r\n\n",
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

    it("should handle SSE events with JSON data", async () => {
      const response = createMockResponse([
        'data: {"output": {"text": "hello"}}\n\n',
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        event: "message",
        data: '{"output": {"text": "hello"}}',
      });
    });

    it("should handle unicode in data", async () => {
      const response = createMockResponse(["data: Hello 世界 🌍\n\n"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("Hello 世界 🌍");
    });

    it("should handle special characters in data", async () => {
      const response = createMockResponse(['data: Tabbed\t"Quoted"\n\n']);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('Tabbed\t"Quoted"');
    });

    it("should preserve tool call event order across arbitrarily chunked streams", async () => {
      const expectedEvents: SSEEvent[] = [
        { event: "message_start", data: '{"id":"msg_123"}' },
        {
          event: "content_block_delta",
          data: '{"type":"text_delta","text":"hello"}',
        },
        { event: "content_block_stop", data: "" },
        { event: "message_stop", data: "" },
      ];

      const serialized = expectedEvents
        .map((event) => {
          const lines = [];
          if (event.event !== "message") lines.push(`event: ${event.event}`);
          if (event.data) lines.push(`data: ${event.data}`);
          return lines.join("\n") + "\n\n";
        })
        .join("");

      const response = createMockResponse(chunkString(serialized, 17));
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({
        event: "message_start",
        data: '{"id":"msg_123"}',
      });
      expect(events[1]).toEqual({
        event: "content_block_delta",
        data: '{"type":"text_delta","text":"hello"}',
      });
    });
  });
});
