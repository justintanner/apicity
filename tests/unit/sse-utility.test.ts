import { describe, it, expect } from "vitest";

// SSE utilities
import {
  sseToIterable,
  type SSEEvent,
} from "../../packages/provider/anthropic/src/sse";
import { parseAnthropicStream } from "../../packages/provider/anthropic/src/anthropic-stream";
import { sseToIterable as kimiSseToIterable } from "../../packages/provider/kimicoding/src/sse";
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

describe("SSE utilities", () => {
  describe("sseToIterable (Anthropic)", () => {
    it("should parse simple SSE event", async () => {
      const response = createMockResponse(["data: hello world\n\n"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "message", data: "hello world" });
    });

    it("should parse SSE event with explicit event type", async () => {
      const response = createMockResponse([
        "event: custom\ndata: event data\n\n",
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "custom", data: "event data" });
    });

    it("should parse multiple SSE events", async () => {
      const response = createMockResponse([
        "event: start\ndata: first\n\n",
        "event: middle\ndata: second\n\n",
        "event: end\ndata: third\n\n",
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ event: "start", data: "first" });
      expect(events[1]).toEqual({ event: "middle", data: "second" });
      expect(events[2]).toEqual({ event: "end", data: "third" });
    });

    it("should handle chunked data across multiple reads", async () => {
      const response = createMockResponse(["data: hel", "lo\n\n"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("hello");
    });

    it("should skip events without data", async () => {
      const response = createMockResponse([
        "event: empty\n\n",
        "data: has data\n\n",
      ]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("has data");
    });

    it("should handle empty response body", async () => {
      const response = new Response(null);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(0);
    });

    it("should handle trailing incomplete event", async () => {
      const response = createMockResponse(["data: incomplete"]);
      const events: SSEEvent[] = [];
      for await (const event of sseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe("incomplete");
    });
  });

  describe("sseToIterable (KimiCoding)", () => {
    it("should parse simple SSE event", async () => {
      const response = createMockResponse(["data: hello\n\n"]);
      const events: SSEEvent[] = [];
      for await (const event of kimiSseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: "message", data: "hello" });
    });

    it("should parse event with event type", async () => {
      const response = createMockResponse([
        'event: content_block_delta\ndata: {"type":"delta"}\n\n',
      ]);
      const events: SSEEvent[] = [];
      for await (const event of kimiSseToIterable(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe("content_block_delta");
      expect(events[0].data).toBe('{"type":"delta"}');
    });
  });

  describe("parseAnthropicStream", () => {
    it("should parse Anthropic stream events", async () => {
      const response = createMockResponse([
        'data: {"type":"message_start","message":{"id":"msg_123"}}\n\n',
        'data: {"type":"content_block_delta","delta":{"text":"hello"}}\n\n',
        "data: [DONE]\n\n",
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe("message_start");
      expect(events[1].type).toBe("content_block_delta");
    });

    it("should skip malformed JSON", async () => {
      const response = createMockResponse([
        'data: {"valid": true}\n\n',
        "data: invalid json\n\n",
        'data: {"also_valid": true}\n\n',
      ]);
      const events: AnthropicStreamEvent[] = [];
      for await (const event of parseAnthropicStream(response)) {
        events.push(event);
      }
      expect(events).toHaveLength(2);
    });
  });
});
