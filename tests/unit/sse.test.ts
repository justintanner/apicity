// Tests for SSE utility functions
import { describe, it, expect } from "vitest";
import { sseToIterable as kimiSseToIterable } from "../../packages/provider/kimicoding/src/sse";
import { sseToIterable as kieSseToIterable } from "../../packages/provider/kie/src/sse";

function makeResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let index = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("kimicoding sseToIterable", () => {
  it("should parse basic SSE events with event and data fields", async () => {
    const res = makeResponse([
      'event: content_block_delta\ndata: {"type":"delta","text":"Hello"}\n\n',
      "event: message_stop\ndata: {}\n\n",
    ]);

    const events = [];
    for await (const ev of kimiSseToIterable(res)) {
      events.push(ev);
    }

    expect(events).toHaveLength(2);
    expect(events[0].event).toBe("content_block_delta");
    expect(events[0].data).toBe('{"type":"delta","text":"Hello"}');
    expect(events[1].event).toBe("message_stop");
  });

  it("should default event to 'message' when not specified", async () => {
    const res = makeResponse(['data: {"text":"hi"}\n\n']);

    const events = [];
    for await (const ev of kimiSseToIterable(res)) {
      events.push(ev);
    }

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("message");
    expect(events[0].data).toBe('{"text":"hi"}');
  });

  it("should handle multiple events in a single chunk", async () => {
    const res = makeResponse([
      "event: a\ndata: first\n\nevent: b\ndata: second\n\n",
    ]);

    const events = [];
    for await (const ev of kimiSseToIterable(res)) {
      events.push(ev);
    }

    expect(events).toHaveLength(2);
    expect(events[0].event).toBe("a");
    expect(events[0].data).toBe("first");
    expect(events[1].event).toBe("b");
    expect(events[1].data).toBe("second");
  });

  it("should handle events split across chunks", async () => {
    const res = makeResponse(["event: delta\nda", 'ta: {"part":"split"}\n\n']);

    const events = [];
    for await (const ev of kimiSseToIterable(res)) {
      events.push(ev);
    }

    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('{"part":"split"}');
  });

  it("should skip events without data", async () => {
    const res = makeResponse(["event: ping\n\ndata: real\n\n"]);

    const events = [];
    for await (const ev of kimiSseToIterable(res)) {
      events.push(ev);
    }

    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("real");
  });

  it("should handle trailing event without final newline", async () => {
    const res = makeResponse(["data: trailing"]);

    const events = [];
    for await (const ev of kimiSseToIterable(res)) {
      events.push(ev);
    }

    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("trailing");
  });

  it("should return nothing for empty body", async () => {
    const res = new Response(null);

    const events = [];
    for await (const ev of kimiSseToIterable(res)) {
      events.push(ev);
    }

    expect(events).toHaveLength(0);
  });

  it("should handle CRLF line endings", async () => {
    const res = makeResponse(["event: test\r\ndata: crlf\r\n\r\n"]);

    const events = [];
    for await (const ev of kimiSseToIterable(res)) {
      events.push(ev);
    }

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("test");
    expect(events[0].data).toBe("crlf");
  });
});

describe("kie sseToIterable", () => {
  it("should yield data strings from SSE stream", async () => {
    const res = makeResponse([
      'data: {"taskId":"t1"}\n\n',
      'data: {"taskId":"t2"}\n\n',
    ]);

    const items = [];
    for await (const data of kieSseToIterable(res)) {
      items.push(data);
    }

    expect(items).toHaveLength(2);
    expect(items[0]).toBe('{"taskId":"t1"}');
    expect(items[1]).toBe('{"taskId":"t2"}');
  });

  it("should ignore non-data lines (event:, comment, etc.)", async () => {
    const res = makeResponse([
      ": this is a comment\nevent: update\ndata: payload\n\n",
    ]);

    const items = [];
    for await (const data of kieSseToIterable(res)) {
      items.push(data);
    }

    expect(items).toHaveLength(1);
    expect(items[0]).toBe("payload");
  });

  it("should handle events split across chunks", async () => {
    const res = makeResponse(["da", "ta: split-data\n\n"]);

    const items = [];
    for await (const data of kieSseToIterable(res)) {
      items.push(data);
    }

    expect(items).toHaveLength(1);
    expect(items[0]).toBe("split-data");
  });

  it("should flush trailing data without final delimiter", async () => {
    const res = makeResponse(["data: final"]);

    const items = [];
    for await (const data of kieSseToIterable(res)) {
      items.push(data);
    }

    expect(items).toHaveLength(1);
    expect(items[0]).toBe("final");
  });

  it("should return nothing for null body", async () => {
    const res = new Response(null);

    const items = [];
    for await (const data of kieSseToIterable(res)) {
      items.push(data);
    }

    expect(items).toHaveLength(0);
  });

  it("should handle multiple data lines in one event", async () => {
    const res = makeResponse(["data: line1\ndata: line2\n\n"]);

    const items = [];
    for await (const data of kieSseToIterable(res)) {
      items.push(data);
    }

    // KIE sseToIterable yields each data: line individually
    expect(items).toHaveLength(2);
    expect(items[0]).toBe("line1");
    expect(items[1]).toBe("line2");
  });
});
