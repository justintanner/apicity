import { createServer, type Server, type RequestListener } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import {
  createHarCapture,
  exchangeToEntry,
  entryToProviderExchange,
  scrubHar,
  type Har,
  type HarCapture,
} from "@apicity/har";
import { extractActual } from "@apicity/cost";
import { summarizeInputMedia } from "../../packages/provider/har/src/persist.js";

const servers: Server[] = [];
const captures: HarCapture[] = [];
const dirs: string[] = [];
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const timing = { startedAt: new Date(0), durationMs: 1 };
const meta = {
  provider: "anthropic",
  endpoint: "v1.messages",
  input: { model: "claude-sonnet-4-6" },
};
async function setup(handler: RequestListener) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  const dir = await mkdtemp(join(tmpdir(), "har-leftovers-"));
  dirs.push(dir);
  const capture = createHarCapture({ dir, mode: "all" });
  captures.push(capture);
  return { server, url, dir, capture };
}
async function saved(dir: string) {
  const line = JSON.parse(
    (await readFile(join(dir, "index.jsonl"), "utf8")).trim()
  );
  return JSON.parse(await readFile(join(dir, line.file), "utf8")) as Har;
}
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await Promise.all(captures.splice(0).map((capture) => capture.close()));
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
  );
});

it("delivers queued chunks to a slow caller before the transport error", async () => {
  let drop!: () => void;
  const chunk = 'data: {"text":"hello"}\n\n';
  const { url, dir, capture } = await setup((_req, res) => {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "x-test": "kept",
    });
    res.write(chunk);
    drop = () => {
      res.write(chunk);
      setTimeout(() => res.destroy(), 30);
    };
  });
  await capture.call(meta, async () => {
    const response = await capture.fetch(url);
    expect(response.url).toBe(url);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-test")).toBe("kept");
    const reader = response.body!.getReader();
    let text = new TextDecoder().decode((await reader.read()).value);
    drop();
    await delay(100);
    let error: unknown;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        text += new TextDecoder().decode(value);
      }
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(TypeError);
    expect(text).toBe(chunk.repeat(2));
  });
  await capture.flush();
  expect((await saved(dir)).log._apicity?.outcome).toBe("network_error");
});

it("flushes an aborted upload even when its source stays open", async () => {
  const { url, dir, capture } = await setup((req) => {
    req.resume();
  });
  const controller = new AbortController();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(Buffer.from('{"model":"m",'));
    },
  });
  const pending = capture.call(meta, () =>
    capture.fetch(url, {
      method: "POST",
      body,
      signal: controller.signal,
      duplex: "half",
    } as RequestInit)
  );
  setTimeout(() => controller.abort(), 30);
  await expect(pending).rejects.toThrow();
  await capture.flush();
  const har = await saved(dir);
  expect(har.log._apicity?.outcome).toBe("network_error");
  expect(har.log.entries[0]!._apicity?.bodyTruncated).toBe(true);
});

const start =
  'data: {"type":"message_start","message":{"model":"claude-sonnet-4-6","usage":{"input_tokens":10,"output_tokens":1}}}\n\n';
const final = 'data: {"type":"message_delta","usage":{"output_tokens":5}}\n\n';
it.each([
  start,
  start + 'data: {"guestToken":"LIVE-SECRET',
  start + final + 'data: {"guestToken":"LIVE-SECRET',
])("marks an incomplete close-delimited stream cut", async (wire) => {
  const { url, dir, capture } = await setup((_req, res) => {
    res.useChunkedEncodingByDefault = false;
    res.writeHead(200, {
      "content-type": "text/event-stream",
      connection: "close",
    });
    res.end(wire);
  });
  await capture.call(meta, async () => {
    expect(await (await capture.fetch(url)).text()).toBe(wire);
  });
  await capture.flush();
  const entry = (await saved(dir)).log.entries[0]!;
  expect(entry.response.content.text).not.toContain("LIVE-SECRET");
  expect(entry._apicity).toMatchObject({
    bodyTruncated: true,
    streamIncomplete: true,
  });
  expect(extractActual(entryToProviderExchange(entry, meta)).settled).toBe(
    false
  );
});

it.each([0, 5])(
  "never saves a cap-cut secret with tail %s",
  async (sseTailBytes) => {
    const wire =
      'data: {"guestToken":"LIVE-SECRET-' + "x".repeat(200) + '"}\n\n';
    const entry = await exchangeToEntry(
      new Request("https://example.com"),
      new Response(wire, { headers: { "content-type": "text/event-stream" } }),
      timing,
      { maxBodyBytes: 35, sseTailBytes }
    );
    expect(entry.response.content.text).not.toContain("LIVE-SECRET");
  }
);

it("summarizes a large Buffer before toJSON can allocate its number array", () => {
  const buffer = Buffer.alloc(64 * 1024 * 1024, 7);
  const toJSON = vi.spyOn(buffer, "toJSON").mockImplementation(() => {
    throw new Error("must not expand");
  });
  const value = summarizeInputMedia({ buffer, date: new Date(0) });
  expect(toJSON).not.toHaveBeenCalled();
  expect(value).toMatchObject({
    buffer: { _apicity_placeholder: { bytes: buffer.length } },
    date: "1970-01-01T00:00:00.000Z",
  });
});

it("scrubs signed upload URLs while retaining their host, path and non-secret query", async () => {
  const upload =
    "https://storage.example.com/upload/file?part=1&X-Amz-Signature=LIVE-SECRET&X-Amz-Credential=PRIVATE&signature=LIVE-SECRET-FAL";
  const entry = await exchangeToEntry(
    new Request(upload),
    new Response(JSON.stringify({ upload_url: upload }), {
      headers: { "content-type": "application/json" },
    }),
    timing
  );
  const har = {
    log: {
      version: "1.2",
      creator: { name: "test", version: "1" },
      entries: [entry],
    },
  } as Har;
  scrubHar(har);
  const clean = "https://storage.example.com/upload/file?part=1";
  expect(entry.request.url).toBe(clean);
  expect(entry.request.queryString).toEqual([{ name: "part", value: "1" }]);
  expect(JSON.parse(entry.response.content.text!).upload_url).toBe(clean);
  expect(JSON.stringify(scrubHar(structuredClone(har)))).toBe(
    JSON.stringify(har)
  );
});

it.each([
  ["clean final usage", start + final, false],
  ["missing final usage", start, true],
  ["unterminated extra line", start + final + "data: unfinished", true],
  ["unclassifiable frame", start + "data: not-json\n\n" + final, true],
  ["unclassified JSON", start + 'data: {"unexpected":true}\n\n' + final, true],
  [
    "oversize frame",
    start + 'data: {"text":"' + "x".repeat(1024 * 1024) + '"}\n\n' + final,
    true,
  ],
  ["unknown protocol", 'data: {"text":"hello"}\n\n', false],
  [
    "unknown oversize protocol",
    'data: {"text":"' + "x".repeat(1024 * 1024) + '"}\n\n',
    false,
  ],
])("classifies wire completion: %s", async (_name, wire, incomplete) => {
  const entry = await exchangeToEntry(
    new Request("https://api.anthropic.com/v1/messages"),
    new Response(wire, { headers: { "content-type": "text/event-stream" } }),
    timing
  );
  expect(entry._apicity?.responseCut).toBeUndefined();
  expect(entry._apicity?.streamIncomplete === true).toBe(incomplete);
  const exchange = entryToProviderExchange(entry, meta);
  expect(exchange.streamIncomplete === true).toBe(incomplete);
  if (wire.startsWith(start)) {
    expect(extractActual(exchange).settled).toBe(!incomplete);
  }
});

it("keeps final usage settled after transport failure and for legacy captures", async () => {
  const entry = await exchangeToEntry(
    new Request("https://api.anthropic.com/v1/messages"),
    new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(Buffer.from(start + final));
        },
        async pull(controller) {
          await new Promise<void>((resolve) => setImmediate(resolve));
          controller.error(new Error("dropped"));
        },
      }),
      { headers: { "content-type": "text/event-stream" } }
    ),
    timing
  );
  expect(entry._apicity?.responseCut).toBe(true);
  expect(entry._apicity?.streamIncomplete).toBeUndefined();
  const exchange = entryToProviderExchange(entry, meta);
  expect(extractActual(exchange).settled).toBe(true);
  expect(extractActual({ ...exchange, streamIncomplete: true }).settled).toBe(
    false
  );
  delete exchange.streamIncomplete;
  expect(extractActual(exchange).settled).toBe(true);
});

it("does not confuse a capture cap with wire incompleteness", async () => {
  const wire =
    start +
    'data: {"type":"content_block_delta","delta":{"text":"' +
    "x".repeat(1000) +
    '"}}\n\n' +
    final;
  const entry = await exchangeToEntry(
    new Request("https://api.anthropic.com/v1/messages"),
    new Response(wire, { headers: { "content-type": "text/event-stream" } }),
    timing,
    { maxBodyBytes: 300, sseTailBytes: 100 }
  );
  expect(entry._apicity?.bodyTruncated).toBe(true);
  expect(entry._apicity?.streamIncomplete).toBeUndefined();
});

it("preserves response metadata, clone and body consumption semantics", async () => {
  const { url, capture } = await setup((req, res) => {
    if (req.url === "/") {
      res.writeHead(302, { location: "/final" });
      res.end();
    } else {
      res.setHeader("content-type", "application/json");
      res.end('{"ok":true}');
    }
  });
  await capture.call(meta, async () => {
    const response = await capture.fetch(url);
    const clone = response.clone();
    for (const item of [response, clone, clone.clone()]) {
      expect(item.url).toBe(url + "final");
      expect(item.redirected).toBe(true);
      expect(item.type).toBe("basic");
      expect(item.bodyUsed).toBe(false);
      expect(await item.json()).toEqual({ ok: true });
      expect(item.bodyUsed).toBe(true);
      expect(() => item.clone()).toThrow();
    }
  });
  await capture.flush();
});

it("cancels the caller promptly while capture finishes its sibling", async () => {
  let finish!: () => void;
  const { url, capture } = await setup((_req, res) => {
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.write(start);
    finish = () => res.end(final);
  });
  await capture.call(meta, async () => {
    const response = await capture.fetch(url);
    const reader = response.body!.getReader();
    await reader.read();
    await reader.cancel();
    finish();
  });
  await capture.flush();
});

it("preserves JSON hooks, shared references, sparse arrays and cyclic rejection", () => {
  const hook = vi.fn(function (this: { value: number }) {
    return this;
  });
  const value = { value: 7, toJSON: hook };
  const array: unknown[] = new Array(3);
  array[0] = undefined;
  array[2] = value;
  expect(summarizeInputMedia({ a: value, b: value, array })).toEqual({
    a: { value: 7 },
    b: { value: 7 },
    array: [null, null, { value: 7 }],
  });
  expect(hook).toHaveBeenCalledTimes(3);
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  expect(() => summarizeInputMedia(cycle)).toThrow(TypeError);
});

it.each([
  [
    '{"type":"response.output_text.delta","delta":"hi"}',
    '{"type":"response.completed","response":{"usage":{"input_tokens":10,"output_tokens":2}}}',
  ],
  [
    '{"choices":[{"finish_reason":null}]}',
    '{"choices":[],"usage":{"prompt_tokens":10,"completion_tokens":2}}',
  ],
  [
    '{"candidates":[{"content":{"parts":[{"text":"hi"}]}}]}',
    '{"candidates":[{"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":10,"candidatesTokenCount":2}}',
  ],
])(
  "requires final usage across supported protocols: %s",
  async (first, last) => {
    for (const [wire, incomplete] of [
      [`data: ${first}\n\n`, true],
      [`data: ${first}\n\ndata: ${last}\n\ndata: [DONE]\n\n`, false],
    ] as const) {
      const bytes = Buffer.from(wire);
      let offset = 0;
      const entry = await exchangeToEntry(
        new Request("https://example.com"),
        new Response(
          new ReadableStream<Uint8Array>({
            pull(controller) {
              if (offset === bytes.length) controller.close();
              else controller.enqueue(bytes.subarray(offset, ++offset));
            },
          }),
          { headers: { "content-type": "text/event-stream" } }
        ),
        timing
      );
      expect(entry._apicity?.streamIncomplete === true).toBe(incomplete);
    }
  }
);
