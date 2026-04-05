// Tests for SSE parsers — pure stream parsing, no API calls
import { describe, it, expect } from "vitest";
import { sseToIterable as kimiSse } from "../../packages/provider/kimicoding/src/sse";
import { sseToIterable as kieSse } from "../../packages/provider/kie/src/sse";
import {
  sseToIterable as anthropicSse,
  parseAnthropicStream,
} from "../../packages/provider/anthropic/src/sse";
import { sseToIterable as fireworksSse } from "../../packages/provider/fireworks/src/sse";

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

function makeErroringResponse(chunks: string[], error: Error): Response {
  const encoder = new TextEncoder();
  let index = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.error(error);
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("kimicoding sseToIterable", () => {
  it("parses event and data fields", async () => {
    const res = makeResponse([
      'event: content_block_delta\ndata: {"text":"Hello"}\n\n',
    ]);
    const events = [];
    for await (const ev of kimiSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("content_block_delta");
    expect(events[0].data).toBe('{"text":"Hello"}');
  });

  it("defaults event to 'message' when not specified", async () => {
    const res = makeResponse(["data: hello\n\n"]);
    const events = [];
    for await (const ev of kimiSse(res)) {
      events.push(ev);
    }
    expect(events[0].event).toBe("message");
  });

  it("handles multiple events in one chunk", async () => {
    const res = makeResponse([
      "event: a\ndata: first\n\nevent: b\ndata: second\n\n",
    ]);
    const events = [];
    for await (const ev of kimiSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ event: "a", data: "first" });
    expect(events[1]).toEqual({ event: "b", data: "second" });
  });

  it("handles events split across chunks", async () => {
    const res = makeResponse(["event: delta\nda", 'ta: {"split":true}\n\n']);
    const events = [];
    for await (const ev of kimiSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('{"split":true}');
  });

  it("skips events without data", async () => {
    const res = makeResponse(["event: ping\n\ndata: real\n\n"]);
    const events = [];
    for await (const ev of kimiSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("real");
  });

  it("flushes trailing event without final delimiter", async () => {
    const res = makeResponse(["data: trailing"]);
    const events = [];
    for await (const ev of kimiSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("trailing");
  });

  it("returns nothing for null body", async () => {
    const res = new Response(null);
    const events = [];
    for await (const ev of kimiSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(0);
  });

  it("handles CRLF line endings", async () => {
    const res = makeResponse(["event: test\r\ndata: crlf\r\n\r\n"]);
    const events = [];
    for await (const ev of kimiSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "test", data: "crlf" });
  });

  it("propagates stream errors after yielding earlier events", async () => {
    const res = makeErroringResponse(
      ["event: delta\ndata: payload\n\n"],
      new Error("kimicoding stream interrupted")
    );
    const iterator = kimiSse(res)[Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: { event: "delta", data: "payload" },
    });
    await expect(iterator.next()).rejects.toThrow(
      "kimicoding stream interrupted"
    );
  });
});

describe("kie sseToIterable", () => {
  it("yields data strings", async () => {
    const res = makeResponse(["data: payload1\n\ndata: payload2\n\n"]);
    const items = [];
    for await (const data of kieSse(res)) {
      items.push(data);
    }
    expect(items).toEqual(["payload1", "payload2"]);
  });

  it("ignores non-data lines", async () => {
    const res = makeResponse([": comment\nevent: update\ndata: payload\n\n"]);
    const items = [];
    for await (const data of kieSse(res)) {
      items.push(data);
    }
    expect(items).toEqual(["payload"]);
  });

  it("handles split across chunks", async () => {
    const res = makeResponse(["da", "ta: split\n\n"]);
    const items = [];
    for await (const data of kieSse(res)) {
      items.push(data);
    }
    expect(items).toEqual(["split"]);
  });

  it("flushes trailing data", async () => {
    const res = makeResponse(["data: final"]);
    const items = [];
    for await (const data of kieSse(res)) {
      items.push(data);
    }
    expect(items).toEqual(["final"]);
  });

  it("returns nothing for null body", async () => {
    const res = new Response(null);
    const items = [];
    for await (const data of kieSse(res)) {
      items.push(data);
    }
    expect(items).toHaveLength(0);
  });

  it("yields each data line in multi-data events", async () => {
    const res = makeResponse(["data: line1\ndata: line2\n\n"]);
    const items = [];
    for await (const data of kieSse(res)) {
      items.push(data);
    }
    expect(items).toEqual(["line1", "line2"]);
  });

  it("propagates stream errors after yielding earlier payloads", async () => {
    const res = makeErroringResponse(
      ["data: payload\n\n"],
      new Error("kie stream interrupted")
    );
    const iterator = kieSse(res)[Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: "payload",
    });
    await expect(iterator.next()).rejects.toThrow("kie stream interrupted");
  });
});

describe("anthropic sseToIterable", () => {
  it("parses event and data fields", async () => {
    const res = makeResponse([
      'event: content_block_delta\ndata: {"type":"text_delta","text":"Hello"}\n\n',
    ]);
    const events = [];
    for await (const ev of anthropicSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("content_block_delta");
    expect(events[0].data).toBe('{"type":"text_delta","text":"Hello"}');
  });

  it("defaults event to 'message' when not specified", async () => {
    const res = makeResponse(["data: hello\n\n"]);
    const events = [];
    for await (const ev of anthropicSse(res)) {
      events.push(ev);
    }
    expect(events[0].event).toBe("message");
  });

  it("handles multiple events in one chunk", async () => {
    const res = makeResponse([
      "event: a\ndata: first\n\nevent: b\ndata: second\n\n",
    ]);
    const events = [];
    for await (const ev of anthropicSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ event: "a", data: "first" });
    expect(events[1]).toEqual({ event: "b", data: "second" });
  });

  it("handles events split across chunks", async () => {
    const res = makeResponse(["event: delta\nda", 'ta: {"split":true}\n\n']);
    const events = [];
    for await (const ev of anthropicSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('{"split":true}');
  });

  it("skips events without data", async () => {
    const res = makeResponse(["event: ping\n\ndata: real\n\n"]);
    const events = [];
    for await (const ev of anthropicSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("real");
  });

  it("flushes trailing event without final delimiter", async () => {
    const res = makeResponse(["data: trailing"]);
    const events = [];
    for await (const ev of anthropicSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("trailing");
  });

  it("returns nothing for null body", async () => {
    const res = new Response(null);
    const events = [];
    for await (const ev of anthropicSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(0);
  });

  it("handles CRLF line endings", async () => {
    const res = makeResponse(["event: test\r\ndata: crlf\r\n\r\n"]);
    const events = [];
    for await (const ev of anthropicSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "test", data: "crlf" });
  });

  it("propagates stream errors after yielding earlier events", async () => {
    const res = makeErroringResponse(
      ["event: delta\ndata: payload\n\n"],
      new Error("anthropic stream interrupted")
    );
    const iterator = anthropicSse(res)[Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: { event: "delta", data: "payload" },
    });
    await expect(iterator.next()).rejects.toThrow(
      "anthropic stream interrupted"
    );
  });
});

describe("anthropic parseAnthropicStream", () => {
  it("yields parsed JSON events", async () => {
    const res = makeResponse([
      'data: {"type":"message_start","message":{"id":"msg_123"}}\n\n',
    ]);
    const events = [];
    for await (const ev of parseAnthropicStream(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      type: "message_start",
      message: { id: "msg_123" },
    });
  });

  it("handles multiple events", async () => {
    const res = makeResponse([
      'data: {"type":"content_block_start","index":0}\n\ndata: {"type":"content_block_delta","index":0}\n\n',
    ]);
    const events = [];
    for await (const ev of parseAnthropicStream(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("content_block_start");
    expect(events[1].type).toBe("content_block_delta");
  });

  it("stops at [DONE] marker", async () => {
    const res = makeResponse([
      'data: {"type":"message_start"}\n\ndata: [DONE]\n\ndata: {"type":"should_not_appear"}\n\n',
    ]);
    const events = [];
    for await (const ev of parseAnthropicStream(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("message_start");
  });

  it("skips malformed JSON events", async () => {
    const res = makeResponse([
      'data: {"type":"valid"}\n\ndata: {invalid json}\n\ndata: {"type":"also_valid"}\n\n',
    ]);
    const events = [];
    for await (const ev of parseAnthropicStream(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("valid");
    expect(events[1].type).toBe("also_valid");
  });

  it("returns nothing for null body", async () => {
    const res = new Response(null);
    const events = [];
    for await (const ev of parseAnthropicStream(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(0);
  });

  it("propagates stream errors after yielding parsed events", async () => {
    const res = makeErroringResponse(
      ['data: {"type":"message_start"}\n\n'],
      new Error("anthropic parse interrupted")
    );
    const iterator = parseAnthropicStream(res)[Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: expect.objectContaining({ type: "message_start" }),
    });
    await expect(iterator.next()).rejects.toThrow(
      "anthropic parse interrupted"
    );
  });
});

describe("fireworks sseToIterable", () => {
  it("parses event and data fields", async () => {
    const res = makeResponse([
      'event: completion\ndata: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
    ]);
    const events = [];
    for await (const ev of fireworksSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("completion");
    expect(events[0].data).toBe('{"choices":[{"delta":{"content":"Hi"}}]}');
  });

  it("defaults event to 'message' when not specified", async () => {
    const res = makeResponse(["data: hello\n\n"]);
    const events = [];
    for await (const ev of fireworksSse(res)) {
      events.push(ev);
    }
    expect(events[0].event).toBe("message");
  });

  it("handles multiple events in one chunk", async () => {
    const res = makeResponse([
      "event: a\ndata: first\n\nevent: b\ndata: second\n\n",
    ]);
    const events = [];
    for await (const ev of fireworksSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ event: "a", data: "first" });
    expect(events[1]).toEqual({ event: "b", data: "second" });
  });

  it("handles events split across chunks", async () => {
    const res = makeResponse(["event: delta\nda", 'ta: {"split":true}\n\n']);
    const events = [];
    for await (const ev of fireworksSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('{"split":true}');
  });

  it("skips events without data", async () => {
    const res = makeResponse(["event: ping\n\ndata: real\n\n"]);
    const events = [];
    for await (const ev of fireworksSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("real");
  });

  it("flushes trailing event without final delimiter", async () => {
    const res = makeResponse(["data: trailing"]);
    const events = [];
    for await (const ev of fireworksSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("trailing");
  });

  it("returns nothing for null body", async () => {
    const res = new Response(null);
    const events = [];
    for await (const ev of fireworksSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(0);
  });

  it("handles CRLF line endings", async () => {
    const res = makeResponse(["event: test\r\ndata: crlf\r\n\r\n"]);
    const events = [];
    for await (const ev of fireworksSse(res)) {
      events.push(ev);
    }
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "test", data: "crlf" });
  });

  it("propagates stream errors after yielding earlier events", async () => {
    const res = makeErroringResponse(
      ["event: delta\ndata: payload\n\n"],
      new Error("fireworks stream interrupted")
    );
    const iterator = fireworksSse(res)[Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: { event: "delta", data: "payload" },
    });
    await expect(iterator.next()).rejects.toThrow(
      "fireworks stream interrupted"
    );
  });
});
