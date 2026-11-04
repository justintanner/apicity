import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compareCost,
  computeEstimate,
  extractActual,
  type CostActual,
  type CostEstimate,
  type EndpointEstimate,
} from "@apicity/cost";
import {
  createHarCapture,
  entryToProviderExchange,
  exchangeToEntry,
  type Har,
  type HarCapture,
} from "@apicity/har";
import { runHarCommand } from "../../packages/cli/src/har";
import { main as promote } from "../../scripts/har-promote.mjs";

const dirs: string[] = [];
const captures: HarCapture[] = [];
const meta = {
  provider: "openai",
  endpoint: "v1.responses",
  input: { model: "gpt-5.6-sol" },
};

async function setup(
  options: Partial<Parameters<typeof createHarCapture>[0]> = {}
) {
  const dir = await mkdtemp(join(tmpdir(), "apicity-cost-evidence-"));
  dirs.push(dir);
  let id = 0;
  const capture = createHarCapture({
    dir,
    mode: "all",
    clock: () => Date.UTC(2026, 10, 4),
    idFactory: () => `call-${++id}`,
    ...options,
  });
  captures.push(capture);
  return { dir, capture };
}

async function read(dir: string) {
  const lines = (await readFile(join(dir, "index.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const hars: Har[] = await Promise.all(
    lines.map(async (line) =>
      JSON.parse(await readFile(join(dir, line.file), "utf8"))
    )
  );
  return { lines, hars };
}

afterEach(async () => {
  await Promise.all(captures.splice(0).map((capture) => capture.close()));
  vi.unstubAllGlobals();
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
  );
});

function echoFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      await (input as Request).text();
      return new Response('{"ok":true}', {
        headers: { "content-type": "application/json" },
      });
    })
  );
}

const post = (capture: HarCapture, body: string) =>
  capture.call(meta, () =>
    capture.fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
    })
  );

const timing = { startedAt: new Date(0), durationMs: 1 };
const okResponse = () =>
  new Response("{}", { headers: { "content-type": "application/json" } });
const postJson = (body: string, url = "https://api.openai.com/v1/responses") =>
  new Request(url, {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
function streamOf(
  text: string,
  chunkSize = 4096,
  contentType = "text/event-stream"
): Response {
  const bytes = new TextEncoder().encode(text);
  let at = 0;
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        if (at >= bytes.length) {
          controller.close();
          return;
        }
        controller.enqueue(bytes.slice(at, at + chunkSize));
        at += chunkSize;
      },
    }),
    { headers: { "content-type": contentType } }
  );
}

const dataUrl = (bytes: number) => `data:image/png;base64,${"A".repeat(bytes)}`;

describe("an oversized JSON request", () => {
  it("keeps the model and limits when summarizing its media brings it under the cap", async () => {
    echoFetch();
    const body = JSON.stringify({
      model: "gpt-5.6-sol",
      max_output_tokens: 900,
      input: [{ type: "input_image", image_url: dataUrl(1_000_000) }],
    });
    const { dir, capture } = await setup();
    await post(capture, body);
    await capture.flush();
    const { hars } = await read(dir);
    const entry = hars[0]!.log.entries[0]!;
    const stored = JSON.parse(entry.request.postData!.text!);
    expect(stored).toMatchObject({
      model: "gpt-5.6-sol",
      max_output_tokens: 900,
    });
    expect(entry.request.postData!.text!).not.toContain("AAAAAAAAAA");
    expect(entry.request.postData!.text!.length).toBeLessThan(262144);
    expect(entry.request.bodySize).toBe(Buffer.byteLength(body));
    expect(entry._apicity?.bodyTruncated).toBeUndefined();

    const exchange = entryToProviderExchange(entry, { provider: "openai" });
    expect(exchange.requestBody?.model).toBe("gpt-5.6-sol");
  });

  it.each([
    [
      "with media",
      {
        model: "gpt-5.6-sol",
        input: dataUrl(100_000),
        text: "plain words, with punctuation. ".repeat(12_000),
      },
    ],
    [
      "without media",
      {
        model: "gpt-5.6-sol",
        text: "plain words, with punctuation. ".repeat(12_000),
      },
    ],
  ])(
    "keeps today's placeholder when it is still over the cap after summarizing (%s)",
    async (_, payload) => {
      echoFetch();
      const body = JSON.stringify(payload);
      const { dir, capture } = await setup();
      await post(capture, body);
      await capture.flush();
      const { hars } = await read(dir);
      const entry = hars[0]!.log.entries[0]!;
      expect(JSON.parse(entry.request.postData!.text!)).toEqual({
        _apicity_placeholder: {
          sha256: expect.any(String),
          bytes: Buffer.byteLength(body),
          contentType: "application/json",
        },
      });
      expect(entry.request.bodySize).toBe(Buffer.byteLength(body));
      expect(entry._apicity?.bodyTruncated).toBe(true);
    }
  );

  it("does not parse a body summarizing could not bring under the cap", async () => {
    const body = JSON.stringify({
      items: Array.from({ length: 60_000 }, (_, i) => ({ i })),
    });
    const parse = vi.spyOn(JSON, "parse");
    const entry = await exchangeToEntry(postJson(body), okResponse(), timing);
    const longest = Math.max(
      ...parse.mock.calls.map(([text]) => String(text).length)
    );
    parse.mockRestore();
    expect(longest).toBeLessThan(Buffer.byteLength(body));
    expect(JSON.parse(entry.request.postData!.text!)).toHaveProperty(
      "_apicity_placeholder"
    );
  });

  it("reads a body with a byte order mark as the under-cap path does", async () => {
    const body = `\uFEFF${JSON.stringify({ model: "m", input: dataUrl(400_000) })}`;
    const entry = await exchangeToEntry(postJson(body), okResponse(), timing);
    expect(JSON.parse(entry.request.postData!.text!).model).toBe("m");
  });

  it.each([
    ["with a media string", dataUrl(400_000)],
    ["under the cap", "short"],
  ])(
    "does not hang on a run of semicolons after data: (%s)",
    async (_, input) => {
      const body = JSON.stringify({
        model: "m",
        prompt: `data:${"1;".repeat(34)}`,
        input,
      });
      const started = performance.now();
      const entry = await exchangeToEntry(postJson(body), okResponse(), timing);
      expect(performance.now() - started).toBeLessThan(5000);
      expect(entry.request.postData!.text!).toContain("1;1;1;");
    }
  );

  it.each([
    [
      "a scrub rule rewrites Telegram's text",
      "https://api.telegram.org/botTOKEN/sendPhoto",
      { payload: "x" },
    ],
    [
      "a scrub rule rewrites Polymarket's text",
      "https://clob.polymarket.com/order",
      { signature: "0xabc" },
    ],
  ])("keeps bodySize at the wire count when %s", async (_, url, extra) => {
    for (const input of [dataUrl(1_000_000), "short"]) {
      const body = JSON.stringify({ model: "m", input, ...extra });
      const entry = await exchangeToEntry(
        postJson(body, url),
        okResponse(),
        timing
      );
      expect(entry.request.bodySize).toBe(Buffer.byteLength(body));
    }
  });

  it("keeps today's placeholder over maxSummarizeBytes", async () => {
    echoFetch();
    const body = JSON.stringify({
      model: "gpt-5.6-sol",
      input: dataUrl(1_000_000),
    });
    const { dir, capture } = await setup({ maxSummarizeBytes: 500_000 });
    await post(capture, body);
    await capture.flush();
    const { hars } = await read(dir);
    const entry = hars[0]!.log.entries[0]!;
    expect(JSON.parse(entry.request.postData!.text!)).toMatchObject({
      _apicity_placeholder: { bytes: Buffer.byteLength(body) },
    });
    expect(entry._apicity?.bodyTruncated).toBe(true);
    expect(
      entryToProviderExchange(entry, { provider: "openai" }).requestBody
    ).toBeNull();
  });

  it("does not hold a text request to summarize it", async () => {
    echoFetch();
    const { dir, capture } = await setup();
    await capture.call(meta, () =>
      capture.fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        body: "x".repeat(300_000),
        headers: { "content-type": "text/plain" },
      })
    );
    await capture.flush();
    const { hars } = await read(dir);
    const entry = hars[0]!.log.entries[0]!;
    expect(JSON.parse(entry.request.postData!.text!)).toMatchObject({
      _apicity_placeholder: { bytes: 300_000 },
    });
  });

  it("does not summarize a response into the capture", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ image: dataUrl(1_000_000) }), {
            headers: { "content-type": "application/json" },
          })
      )
    );
    const { dir, capture } = await setup();
    await capture.call(meta, () =>
      capture.fetch("https://api.openai.com/v1/images")
    );
    await capture.flush();
    const { hars } = await read(dir);
    const text = hars[0]!.log.entries[0]!.response.content.text!;
    expect(JSON.parse(text)).toHaveProperty("_apicity_placeholder");
  });
});

describe("an oversized SSE response", () => {
  const usageFrame =
    'data: {"type":"response.completed","response":{"model":"gpt-5.6-sol","status":"completed","service_tier":"default","usage":{"input_tokens":1000,"input_tokens_details":{"cached_tokens":200,"cache_write_tokens":300},"output_tokens":50}}}\n\n';

  function streamFetch(chunks: string[]) {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                for (const chunk of chunks) {
                  controller.enqueue(new TextEncoder().encode(chunk));
                }
                controller.close();
              },
            }),
            { headers: { "content-type": "text/event-stream" } }
          )
      )
    );
  }

  const deltas = (count: number) =>
    Array.from(
      { length: count },
      (_, i) => `data: {"type":"response.output_text.delta","delta":"${i}"}\n\n`
    );

  async function capturedStream(
    chunks: string[],
    options: Partial<Parameters<typeof createHarCapture>[0]> = {}
  ) {
    streamFetch(chunks);
    const { dir, capture } = await setup(options);
    const response = await capture.call(meta, () =>
      capture.fetch("https://api.openai.com/v1/responses")
    );
    expect(await response.text()).toBe(chunks.join(""));
    await capture.flush();
    const { hars } = await read(dir);
    return hars[0]!.log.entries[0]!;
  }

  it("keeps the last frame, where the usage is", async () => {
    const chunks = [...deltas(10_000), usageFrame];
    const wire = Buffer.byteLength(chunks.join(""));
    expect(wire).toBeGreaterThan(262144 + 65536);
    const entry = await capturedStream(chunks);
    const text = entry.response.content.text!;
    expect(text).toContain(usageFrame.trim());
    expect(text).toMatch(/\n: apicity-gap \d+ bytes dropped\n/);
    expect(entry.response.bodySize).toBe(wire);
    expect(entry._apicity).toMatchObject({
      streamed: true,
      bodyTruncated: true,
    });

    const exchange = entryToProviderExchange(entry, {
      provider: "openai",
    });
    expect(exchange.bodyTruncated).toBe(true);
    const frames = exchange.responseBody as Array<{ type?: string }>;
    // Every parsed frame is a real one: the marker reads as none.
    expect(frames.every((frame) => typeof frame.type === "string")).toBe(true);
    expect(frames.at(-1)?.type).toBe("response.completed");

    const actual: CostActual = extractActual(exchange);
    expect(actual.settled).toBe(true);
    expect(actual.usage).toMatchObject({
      inputTokens: 1000,
      cacheWriteInputTokens: 300,
      outputTokens: 50,
    });
  });

  it.each([
    ["ascii", '"delta":"words"'],
    ["multi-byte", '"delta":"日本語のテキスト"'],
  ])(
    "states how many bytes it dropped, and the parts add up (%s)",
    async (_, field) => {
      const chunks = [
        ...Array.from({ length: 20_000 }, () => `data: {${field}}\n\n`),
        usageFrame,
      ];
      const wire = Buffer.byteLength(chunks.join(""));
      const entry = await capturedStream(chunks);
      const text = entry.response.content.text!;
      const marker = /\n\n: apicity-gap (\d+) bytes dropped\n\n/.exec(text)!;
      const kept = Buffer.byteLength(text) - Buffer.byteLength(marker[0]);
      expect(kept + Number(marker[1])).toBe(wire);
    }
  );

  it("starts the tail on a whole line", async () => {
    const entry = await capturedStream([...deltas(10_000), usageFrame]);
    const text = entry.response.content.text!;
    const after = text.split(/: apicity-gap \d+ bytes dropped\n\n/)[1]!;
    expect(after.startsWith("data: {")).toBe(true);
  });

  it("keeps a stream whole, with no marker, when the tail covers the overflow", async () => {
    const chunks = [...deltas(10), usageFrame];
    const wire = chunks.join("");
    const entry = await capturedStream(chunks, { maxBodyBytes: 100 });
    expect(entry.response.content.text).toBe(wire);
    expect(entry._apicity?.bodyTruncated).toBe(true);
  });

  it("survives a chunk larger than the tail", async () => {
    const huge = `data: {"delta":"${"x".repeat(500_000)}"}\n\n`;
    const entry = await capturedStream([huge, usageFrame]);
    expect(entry.response.content.text).toContain(usageFrame.trim());
  });

  it("does not split a multi-byte character at the head or the tail", async () => {
    const wide = (count: number) =>
      Array.from({ length: count }, () => `data: {"delta":"日本語"}\n\n`);
    const entry = await capturedStream([...wide(20_000), usageFrame]);
    const text = entry.response.content.text!;
    expect(text).not.toContain("�");
    expect(text).toContain(usageFrame.trim());
  });

  it("keeps the head only with sseTailBytes 0", async () => {
    const chunks = [...deltas(10_000), usageFrame];
    const entry = await capturedStream(chunks, { sseTailBytes: 0 });
    const text = entry.response.content.text!;
    expect(text).not.toContain("response.completed");
    expect(text).not.toContain("apicity-gap");
    expect(Buffer.byteLength(text)).toBeLessThanOrEqual(262144);
    const actual = extractActual(
      entryToProviderExchange(entry, { provider: "openai" })
    );
    expect(actual.settled).toBe(false);
  });

  it("scrubs secrets in the tail like the head", async () => {
    const secret = 'data: {"api_key":"sk-live-secret-in-tail","type":"x"}\n\n';
    const entry = await capturedStream([...deltas(10_000), secret, usageFrame]);
    expect(entry.response.content.text).not.toContain("sk-live-secret-in-tail");
  });

  // The scrubber matches JSON strings across line ends, so a string left open at
  // the join runs on to the next quote, the one opening the tail's first field,
  // and that field is no longer seen as a key. Each cut lands inside a string.
  it.each(Array.from({ length: 12 }, (_, offset) => offset))(
    "scrubs the first tail line when the head is cut %i bytes into a string",
    async (offset) => {
      const frame = 'data: {"delta":"some words in a string"}\n\n';
      const secret = 'data: {"api_key":"sk-live-after-open-string"}\n\n';
      const tail = `${secret}${usageFrame}`;
      const entry = await capturedStream([frame.repeat(204), tail], {
        maxBodyBytes: 3 * frame.length + 16 + offset,
        sseTailBytes: Buffer.byteLength(tail) + 1,
      });
      const text = entry.response.content.text!;
      expect(text).toContain("apicity-gap");
      expect(text).not.toContain("sk-live-after-open-string");
      expect(text).toContain('"api_key":"***"');
      expect(text).toContain(usageFrame.trim());
    }
  );

  it("keeps a head secret cut in half out of the join", async () => {
    const opening = 'data: {"api_key":"sk-live-cut-in-half-by-the-cap"}\n\n';
    const entry = await capturedStream(
      [opening, ...deltas(10_000), usageFrame],
      { maxBodyBytes: 30, sseTailBytes: 1000 }
    );
    const text = entry.response.content.text!;
    expect(text).not.toContain("sk-live");
    expect(text).toContain(usageFrame.trim());
  });

  it("settles nothing, and states no figure, when the last frame outgrows the tail", async () => {
    const big = `data: {"type":"response.completed","response":{"model":"gpt-5.6-sol","status":"completed","output":"${"x".repeat(100_000)}","usage":{"input_tokens":1000,"output_tokens":50}}}\n\n`;
    const entry = await capturedStream([...deltas(10_000), big]);
    const text = entry.response.content.text!;
    expect(text).toContain("apicity-gap");
    expect(text).not.toContain("response.completed");
    const actual = extractActual(
      entryToProviderExchange(entry, { provider: "openai" })
    );
    expect(actual.settled).toBe(false);
    expect(actual.usage).toEqual({});
    expect(actual.usd).toBeNull();
  });

  it("does not let a string left open in raw text hide the tail's first field", async () => {
    const words = "data: words\n\n";
    const open = 'data: {"name":"Jo\n';
    const secret = 'data: {"api_key":"LIVE-raw-secret"}\n\n';
    const head = words.repeat(20) + open;
    const text = `${head}data: hn","z":1}\n\n${words.repeat(200)}${secret}`;
    const entry = await exchangeToEntry(
      new Request("https://api.openai.com/v1/responses"),
      streamOf(text),
      timing,
      {
        maxBodyBytes: Buffer.byteLength(head) + 3,
        sseTailBytes: Buffer.byteLength(secret) + 1,
      }
    );
    expect(entry.response.content.text).not.toContain("LIVE-raw-secret");
  });

  it("keeps a last frame that exactly fits the tail", async () => {
    const entry = await capturedStream([...deltas(1000), usageFrame], {
      maxBodyBytes: 1000,
      sseTailBytes: Buffer.byteLength(usageFrame),
    });
    expect(entry.response.content.text).toContain(usageFrame.trim());
    expect(
      extractActual(entryToProviderExchange(entry, { provider: "openai" }))
        .settled
    ).toBe(true);
  });

  it("discards an unframed head rather than persisting a cut field", async () => {
    for (const [text, contentType] of [
      ["x".repeat(400_000), "text/plain"],
      ['data: {"delta":"word"}\r\r'.repeat(20_000), "text/event-stream"],
    ] as const) {
      const entry = await exchangeToEntry(
        new Request("https://api.openai.com/v1/responses"),
        streamOf(text, 4096, contentType),
        timing,
        { streamed: true }
      );
      const stored = entry.response.content.text!;
      expect(stored).toMatch(/^\n\n: apicity-gap \d+ bytes dropped\n\n$/);
    }
  });

  it("keeps the tail when only the first line outruns the head", async () => {
    const entry = await capturedStream([
      `data: {"delta":"${"x".repeat(400_000)}"}\n\n`,
      ...deltas(10),
      usageFrame,
    ]);
    const text = entry.response.content.text!;
    expect(text.startsWith("\n\n: apicity-gap")).toBe(true);
    expect(text).toContain(usageFrame.trim());
  });

  it("recognizes the content type in any case", async () => {
    const chunks = [...deltas(10_000), usageFrame];
    const entry = await exchangeToEntry(
      new Request("https://api.openai.com/v1/responses"),
      streamOf(chunks.join(""), 4096, "Text/Event-Stream"),
      timing
    );
    expect(entry._apicity?.streamed).toBe(true);
    expect(entry.response.content.text).toContain(usageFrame.trim());
  });

  // The join is what these exercise, across limits and chunkings at once.
  it("stores the same text however the stream is chunked, and the parts add up", async () => {
    const stream = [
      ...Array.from({ length: 120 }, (_, i) =>
        i % 3 === 0
          ? `data: {"delta":"日本語 ${i}"}\r\n\r\n`
          : `data: {"delta":"${i}"}\n\n`
      ),
      usageFrame,
    ].join("");
    const wire = Buffer.byteLength(stream);
    for (const maxBodyBytes of [0, 1, 100, 1000]) {
      for (const sseTailBytes of [1, 2, 50, 500, 100_000]) {
        const stored = new Set<string>();
        for (const size of [2, 7, wire]) {
          const entry = await exchangeToEntry(
            new Request("https://api.openai.com/v1/responses"),
            streamOf(stream, size),
            timing,
            { maxBodyBytes, sseTailBytes }
          );
          stored.add(entry.response.content.text!);
          expect(entry.response.bodySize).toBe(wire);
        }
        expect(stored.size).toBe(1);
        const [text] = [...stored] as [string];
        const marker = /\n\n: apicity-gap (\d+) bytes dropped\n\n/.exec(text);
        if (marker) {
          const kept = Buffer.byteLength(text) - Buffer.byteLength(marker[0]);
          expect(kept + Number(marker[1])).toBe(wire);
        } else {
          expect(text).toBe(stream);
        }
      }
    }
  });

  it("rejects a bad limit", async () => {
    streamFetch(["data: {}\n\n"]);
    const errors: unknown[] = [];
    const { capture } = await setup({
      sseTailBytes: -1,
      onError: (error) => errors.push(error),
    });
    await capture.call(meta, () =>
      capture.fetch("https://api.openai.com/v1/responses")
    );
    await capture.flush();
    expect(String(errors[0])).toContain("sseTailBytes");
  });
});

describe("what a cut stream settles", () => {
  const start =
    'event: message_start\ndata: {"type":"message_start","message":{"id":"m","type":"message","role":"assistant","model":"claude-sonnet-4-5","content":[],"usage":{"input_tokens":100000,"output_tokens":1}}}\n\n';
  const delta =
    'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"word"}}\n\n';
  const messageDelta = (padding: string) =>
    `event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"${padding ? `,"pad":"${padding}"` : ""}},"usage":{"output_tokens":50000}}\n\n`;
  const stop = 'event: message_stop\ndata: {"type":"message_stop"}\n\n';

  async function anthropic(options: object, padding = "") {
    const entry = await exchangeToEntry(
      postJson(
        JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 60_000,
          messages: [],
        }),
        "https://api.anthropic.com/v1/messages"
      ),
      streamOf(start + delta.repeat(6000) + messageDelta(padding) + stop),
      timing,
      options
    );
    return extractActual(
      entryToProviderExchange(entry, { provider: "anthropic" })
    );
  }

  it("settles the true figure when both ends survive", async () => {
    const actual = await anthropic({});
    expect(actual.settled).toBe(true);
    expect(actual.usd).toBeCloseTo(1.05, 6);
  });

  it.each([
    [
      "the tail keeps message_stop but not message_delta",
      { sseTailBytes: 64 },
      "",
    ],
    ["message_delta outgrows the tail", {}, "x".repeat(70_000)],
    ["the head loses message_start", { maxBodyBytes: 100 }, ""],
  ])("states no figure when %s", async (_, options, padding) => {
    const actual = await anthropic(options, padding);
    expect(actual.settled).toBe(false);
    expect(actual.usd).toBeNull();
    expect(actual.warnings.length).toBeGreaterThan(0);
  });

  const running = (output: number, finish: string | null, pad = "") =>
    `data: {"id":"c","model":"gpt-5","choices":[{"index":0,"delta":{"content":"w${pad}"},"finish_reason":${JSON.stringify(finish)}}],"usage":{"prompt_tokens":1000,"completion_tokens":${output},"total_tokens":${1000 + output}}}\n\n`;
  async function chat(last: string) {
    const entry = await exchangeToEntry(
      new Request("https://api.openai.com/v1/chat/completions"),
      streamOf(
        Array.from({ length: 2000 }, (_, i) => running(i + 1, null)).join("") +
          last
      ),
      timing
    );
    return extractActual(
      entryToProviderExchange(entry, { provider: "openai" })
    );
  }

  it("settles a running count that reached its finish reason", async () => {
    const actual = await chat(running(46_000, "stop"));
    expect(actual.settled).toBe(true);
    expect(actual.usage.outputTokens).toBe(46_000);
  });

  it("does not take the last surviving running count as final", async () => {
    const actual = await chat(running(46_000, "stop", "x".repeat(70_000)));
    expect(actual.settled).toBe(false);
    expect(actual.usd).toBeNull();
  });
});

describe("what a body that dies mid-read settles", () => {
  function dying(chunks: string[], contentType = "text/event-stream") {
    const queue = chunks.map((chunk) => new TextEncoder().encode(chunk));
    return new Response(
      new ReadableStream<Uint8Array>({
        async pull(controller) {
          await new Promise((resolve) => setImmediate(resolve));
          const next = queue.shift();
          if (next) controller.enqueue(next);
          else controller.error(new Error("socket hang up"));
        },
      }),
      { headers: { "content-type": contentType } }
    );
  }
  async function actualOf(
    response: Response,
    provider = "openai",
    url = "https://api.openai.com/v1/responses"
  ) {
    const entry = await exchangeToEntry(postJson("{}", url), response, timing);
    expect(entry._apicity?.bodyTruncated).toBe(true);
    return extractActual(entryToProviderExchange(entry, { provider }));
  }
  const delta = 'data: {"type":"response.output_text.delta","delta":"w"}\n\n';
  const completed =
    'data: {"type":"response.completed","response":{"model":"gpt-5","status":"completed","usage":{"input_tokens":1000,"output_tokens":50}}}\n\n';
  const chunk = (finish: string | null) =>
    `data: {"id":"c","model":"gpt-5","choices":[{"index":0,"delta":{"content":"w"},"finish_reason":${JSON.stringify(finish)}}],"usage":{"prompt_tokens":1000,"completion_tokens":7,"total_tokens":1007}}\n\n`;
  const start =
    'event: message_start\ndata: {"type":"message_start","message":{"id":"m","type":"message","role":"assistant","model":"claude-sonnet-4-5","content":[],"usage":{"input_tokens":100000,"output_tokens":1}}}\n\n';

  it.each([
    ["before its final frame", [delta, delta], "openai", undefined],
    [
      "inside its final frame",
      [delta, completed.slice(0, 60)],
      "openai",
      undefined,
    ],
    [
      "on a running count",
      [chunk(null)],
      "openai",
      "https://api.openai.com/v1/chat/completions",
    ],
    [
      "after Anthropic's opening frame",
      [start],
      "anthropic",
      "https://api.anthropic.com/v1/messages",
    ],
    ["before its first byte", [], "openai", undefined],
  ])("a stream cut %s is unsettled", async (_, chunks, provider, url) => {
    const actual = await actualOf(dying(chunks), provider, url);
    expect(actual.settled).toBe(false);
    expect(actual.usd).toBeNull();
    expect(actual.warnings.join(" ")).toContain("stops before");
  });

  it.each([
    ["the Responses API's last frame", [delta, completed], undefined],
    [
      "a chat stream's finish",
      [chunk(null), chunk("stop")],
      "https://api.openai.com/v1/chat/completions",
    ],
  ])("a stream cut after %s keeps its figure", async (_, chunks, url) => {
    const actual = await actualOf(dying(chunks), "openai", url);
    expect(actual.settled).toBe(true);
    expect(actual.usd).toBeGreaterThan(0);
  });

  it("a JSON body cut before it closes states no figure", async () => {
    const actual = await actualOf(
      dying(['{"usage":{"cost_in_usd_ticks":2000'], "application/json"),
      "xai",
      "https://api.x.ai/v1/images/edits"
    );
    expect(actual.usd).toBeNull();
    expect(actual.statedUsd).toBeNull();
    expect(actual.settled).toBe(false);
    expect(actual.warnings.join(" ")).toContain("not captured");
  });

  it("a JSON body whose connection dies after its last byte keeps its figure", async () => {
    const actual = await actualOf(
      dying(['{"usage":{"cost_in_usd_ticks":200000000}}'], "application/json"),
      "xai",
      "https://api.x.ai/v1/images/edits"
    );
    expect(actual.statedUsd).toBe(0.02);
  });
});

describe("scrubbing a stream frame by frame", () => {
  const filler = 'data: {"type":"delta","delta":"word"}\n\n'.repeat(10_000);
  const rules = [
    [
      "a fal checkpoint signature",
      'data: {"checkpoint":{"url":"https://v3.fal.media/x.safetensors","signature":"LIVE-SECRET-fal"}}\n\n',
      "https://queue.fal.run/x/stream",
    ],
    [
      "a guest token",
      'data: {"guestToken":"LIVE-SECRET-guest"}\n\n',
      "https://api.openai.com/v1/responses",
    ],
    [
      "an account key id",
      'data: {"usage":{"create_api_key_id":"LIVE-SECRET-acct"}}\n\n',
      "https://api.openai.com/v1/responses",
    ],
    [
      "Fireworks API keys",
      'data: {"apiKeys":[{"key":"LIVE-SECRET-fw","keyId":"LIVE-SECRET-fwid"}]}\n\n',
      "https://api.openai.com/v1/responses",
    ],
    [
      "a key after a string that shifts the text match",
      'data: {"tokens":["x",":"],"api_key":"LIVE-SECRET-desync"}\n\n',
      "https://api.openai.com/v1/responses",
    ],
  ] as const;

  it.each(rules)("scrubs %s, under and over the cap", async (_, frame, url) => {
    for (const text of [frame, filler + frame]) {
      const entry = await exchangeToEntry(
        new Request(url),
        streamOf(text),
        timing
      );
      expect(entry.response.content.text).toContain("data:");
      expect(entry.response.content.text).not.toContain("LIVE-SECRET");
    }
  });

  it("leaves frames with nothing to scrub byte for byte", async () => {
    const text =
      'data:{"a": 1}\r\n\r\nevent: x\ndata: {"b":2}\n\n: ping\n\ndata: [DONE]\n\ndata: not json\n\n';
    const entry = await exchangeToEntry(
      new Request("https://api.openai.com/v1/responses"),
      streamOf(text),
      timing
    );
    expect(entry.response.content.text).toBe(text);
  });

  it("keeps a frame's line ending when it scrubs one", async () => {
    const entry = await exchangeToEntry(
      new Request("https://api.openai.com/v1/responses"),
      streamOf('data: {"guestToken":"LIVE-SECRET"}\r\n\r\ndata: {"a":1}\r\n'),
      timing
    );
    const text = entry.response.content.text!;
    expect(text).not.toContain("LIVE-SECRET");
    expect(text.endsWith('}\r\n\r\ndata: {"a":1}\r\n')).toBe(true);
  });

  it("does not go quadratic on a long string of escaped quotes", async () => {
    const started = performance.now();
    const entry = await exchangeToEntry(
      new Request("https://api.openai.com/v1/responses"),
      streamOf(`data: ["${'\\"'.repeat(80_000)}"]\n\n`),
      timing,
      { maxBodyBytes: 10_000_000 }
    );
    expect(performance.now() - started).toBeLessThan(5000);
    expect(entry.response.content.text!.length).toBeGreaterThan(160_000);
  });

  it("passes har scrub --check once captured", async () => {
    const dir = await mkdtemp(join(tmpdir(), "apicity-cost-evidence-scrub-"));
    dirs.push(dir);
    let n = 0;
    for (const [, frame, url] of rules) {
      for (const text of [frame, filler + frame]) {
        const entry = await exchangeToEntry(
          new Request(url),
          streamOf(text),
          timing
        );
        const file = join(dir, `${++n}.har`);
        await writeFile(
          file,
          JSON.stringify({
            log: {
              version: "1.2",
              creator: { name: "apicity", version: "0" },
              entries: [entry],
            },
          })
        );
        const errors: string[] = [];
        const exit = await runHarCommand(["scrub", "--check", file], {
          out: () => {},
          err: (line: string) => errors.push(line),
        });
        expect(exit, errors.join("")).toBe(0);
      }
    }
  });
});

describe("compareCost from a stored estimate", () => {
  const actual = (usd: number | null): CostActual => ({
    provider: "openai",
    dotPath: null,
    model: null,
    usage: {},
    evidence: [],
    statedUsd: null,
    statedListUsd: null,
    derivedUsd: usd,
    usd,
    basis: usd === null ? "none" : "derived",
    settled: usd !== null,
    rateAsOf: null,
    warnings: [],
  });
  const priced = computeEstimate({
    provider: "openai",
    payload: { model: "gpt-5", input: "hello", max_output_tokens: 10 },
  });
  const failedClosed = computeEstimate({
    provider: "openai",
    payload: { model: "not-a-model", input: "hello" },
  });
  const free: CostEstimate = {
    ...priced,
    usd: 0,
    source: "free",
    warnings: [],
  };
  const zeroRow: EndpointEstimate = {
    ...priced,
    usd: 0,
    warnings: [],
    status: "zero",
    billing: {
      provider: "openai",
      method: "GET",
      dotPath: "v1.models",
      kind: "free",
      reason: "a read",
    },
  };

  it("gives the verdict the live estimate gives", async () => {
    expect(priced.usd).toBeGreaterThan(0);
    expect(failedClosed.usd).toBe(0);
    expect(failedClosed.warnings.length).toBeGreaterThan(0);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse())
    );
    const { dir, capture } = await setup();
    const estimates = [priced, failedClosed, free, zeroRow];
    for (const estimate of estimates) {
      await capture.call({ ...meta, estimate }, () =>
        capture.fetch("https://api.openai.com/v1/responses")
      );
    }
    await capture.flush();
    const { hars } = await read(dir);
    estimates.forEach((estimate, index) => {
      const stored = hars[index]!.log._apicity!.estimate!;
      for (const usd of [null, 0, 0.0001, 5]) {
        expect(compareCost(stored, actual(usd))).toEqual(
          compareCost(estimate, actual(usd))
        );
      }
    });
  });

  it("reads an estimate with no warnings", () => {
    expect(
      compareCost({ usd: 0, source: "per-unit-table" }, actual(1)).verdict
    ).toBe("under");
  });
});

describe("meta.estimate", () => {
  const ok = () =>
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{}", {
            headers: { "content-type": "application/json" },
          })
      )
    );

  it("round-trips to log._apicity.estimate and estimateUsd", async () => {
    ok();
    const { dir, capture } = await setup();
    const estimate = {
      usd: 0.25,
      source: "per-unit-table",
      rateAsOf: "2026-11-04",
      warnings: ["a warning"],
      breakdown: { units: 5, unit: "seconds" },
    };
    await capture.call({ ...meta, estimate }, () =>
      capture.fetch("https://api.openai.com/v1/responses")
    );
    await capture.flush();
    const { lines, hars } = await read(dir);
    expect(hars[0]!.log._apicity?.estimate).toEqual(estimate);
    expect(lines[0]!.estimateUsd).toBe(0.25);
  });

  it("writes neither key on a call without it", async () => {
    ok();
    const { dir, capture } = await setup();
    await capture.call(meta, () =>
      capture.fetch("https://api.openai.com/v1/responses")
    );
    await capture.flush();
    const { lines, hars } = await read(dir);
    expect(hars[0]!.log._apicity).not.toHaveProperty("estimate");
    expect(lines[0]).not.toHaveProperty("estimateUsd");
  });

  it("records a zero estimate", async () => {
    ok();
    const { dir, capture } = await setup();
    await capture.call({ ...meta, estimate: { usd: 0 } }, () =>
      capture.fetch("https://api.openai.com/v1/responses")
    );
    await capture.flush();
    const { lines } = await read(dir);
    expect(lines[0]!.estimateUsd).toBe(0);
  });

  it("takes computeEstimate's result as is, keeping only the listed fields", async () => {
    ok();
    const { dir, capture } = await setup();
    const estimate: CostEstimate = computeEstimate({
      provider: "openai",
      payload: { model: "gpt-5", input: "hello", max_output_tokens: 10 },
    });
    await capture.call({ ...meta, estimate }, () =>
      capture.fetch("https://api.openai.com/v1/responses")
    );
    await capture.flush();
    const { hars } = await read(dir);
    const stored = hars[0]!.log._apicity?.estimate;
    expect(estimate.usd).toBeGreaterThan(0);
    expect(stored?.usd).toBe(estimate.usd);
    expect(stored).not.toHaveProperty("currency");
    expect(stored?.breakdown).toEqual(estimate.breakdown);
  });

  it("scrubs the estimate like input", async () => {
    ok();
    const { dir, capture } = await setup();
    await capture.call(
      {
        ...meta,
        estimate: {
          usd: 1,
          warnings: ["see https://x.example/a?X-Amz-Signature=abc123"],
          breakdown: { api_key: "sk-live-secret-in-estimate" },
        },
      },
      () => capture.fetch("https://api.openai.com/v1/responses")
    );
    await capture.flush();
    const text = await readFile(
      join(dir, (await read(dir)).lines[0]!.file),
      "utf8"
    );
    expect(text).not.toContain("sk-live-secret-in-estimate");
  });

  it.each([
    ["no figure", { usd: Number.NaN }],
    ["a missing figure", { source: "free" } as never],
    [
      "a cycle",
      (() => {
        const breakdown: Record<string, unknown> = {};
        breakdown.self = breakdown;
        return { usd: 1, breakdown };
      })(),
    ],
  ])("drops an estimate with %s, and keeps capturing", async (_, estimate) => {
    ok();
    const errors: unknown[] = [];
    const { dir, capture } = await setup({
      onError: (error) => errors.push(error),
    });
    const response = await capture.call({ ...meta, estimate }, () =>
      capture.fetch("https://api.openai.com/v1/responses")
    );
    expect(response.status).toBe(200);
    await capture.call(meta, () =>
      capture.fetch("https://api.openai.com/v1/responses")
    );
    await capture.flush();
    expect(errors).toEqual([]);
    const { lines, hars } = await read(dir);
    expect(lines).toHaveLength(2);
    expect(hars[0]!.log._apicity).not.toHaveProperty("estimate");
    expect(lines[0]).not.toHaveProperty("estimateUsd");
  });

  it("copies the estimate when the call starts", async () => {
    ok();
    const { dir, capture } = await setup();
    const estimate = { usd: 1, warnings: ["first"] };
    await capture.call({ ...meta, estimate }, async () => {
      estimate.usd = 2;
      estimate.warnings.push("second");
      return capture.fetch("https://api.openai.com/v1/responses");
    });
    await capture.flush();
    const { lines, hars } = await read(dir);
    expect(hars[0]!.log._apicity?.estimate).toEqual({
      usd: 1,
      warnings: ["first"],
    });
    expect(lines[0]!.estimateUsd).toBe(1);
  });

  it("does not change what the provider receives or returns", async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      expect(await (input as Request).text()).toBe('{"model":"m"}');
      return new Response('{"a":1}', {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchSpy);
    const { capture } = await setup();
    const response = await capture.call({ ...meta, estimate: { usd: 9 } }, () =>
      capture.fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        body: '{"model":"m"}',
      })
    );
    expect(await response.json()).toEqual({ a: 1 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe("the CLI reads old and new captures", () => {
  const writer = () => {
    const out: string[] = [];
    const err: string[] = [];
    return {
      out,
      err,
      writer: {
        out: (s: string) => out.push(s),
        err: (s: string) => err.push(s),
      },
    };
  };

  async function capturedFiles() {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = input as Request;
        await request.text();
        return request.url.endsWith("/stream")
          ? new Response(
              `${'data: {"type":"response.output_text.delta"}\n\n'.repeat(10_000)}data: {"type":"response.completed","response":{"usage":{"input_tokens":1,"output_tokens":2}}}\n\n`,
              { headers: { "content-type": "text/event-stream" } }
            )
          : new Response("{}", {
              headers: { "content-type": "application/json" },
            });
      })
    );
    // New shapes, then the old ones: a placeholder and a head-only stream.
    const shapes = [{}, { maxSummarizeBytes: 0, sseTailBytes: 0 }] as const;
    const out: string[] = [];
    for (const options of shapes) {
      const { dir, capture } = await setup(options);
      await capture.call(
        { ...meta, estimate: { usd: 0.1, source: "free" } },
        () =>
          capture.fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            body: JSON.stringify({
              model: "gpt-5.6-sol",
              input: dataUrl(1_000_000),
            }),
            headers: { "content-type": "application/json" },
          })
      );
      await capture.call(meta, () =>
        capture.fetch("https://api.openai.com/v1/stream")
      );
      await capture.flush();
      for (const line of (await readFile(join(dir, "index.jsonl"), "utf8"))
        .trim()
        .split("\n")) {
        out.push(join(dir, JSON.parse(line).file));
      }
    }
    return out;
  }

  it("har scrub --check passes on every shape", async () => {
    const files = await capturedFiles();
    expect(files).toHaveLength(4);
    for (const file of files) {
      const { writer: w, err } = writer();
      const exit = await runHarCommand(["scrub", "--check", file], w, {
        env: {},
      } as never);
      expect(exit, `${file}: ${err.join("")}`).toBe(0);
    }
  });

  // Both used to refuse as a placeholder or as cut. They hold less than was sent.
  it.each([
    ["media-summary", 0],
    ["streamed", 1],
  ])("har promote refuses a new capture with %s", async (code, index) => {
    const files = await capturedFiles();
    const dir = await mkdtemp(join(tmpdir(), "apicity-cost-evidence-promote-"));
    dirs.push(dir);
    const lines: string[] = [];
    const write = (line: string) => lines.push(line);
    const exit = await promote(
      [files[index]!, "--name", "openai/refused", "--root", dir],
      { log: write, error: write }
    );
    expect(exit).toBe(2);
    expect(lines.join("")).toContain(`(${code})`);
    expect(await readdir(dir)).toEqual([]);
  });

  it("har promote refuses a capture whose input lost its media", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse())
    );
    const { dir, capture } = await setup();
    await capture.call(
      { ...meta, input: { model: "gpt-5.6-sol", image: dataUrl(4000) } },
      () =>
        capture.fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          body: JSON.stringify({ model: "gpt-5.6-sol" }),
          headers: { "content-type": "application/json" },
        })
    );
    await capture.flush();
    const { lines: rows } = await read(dir);
    const root = await mkdtemp(
      join(tmpdir(), "apicity-cost-evidence-promote-")
    );
    dirs.push(root);
    const lines: string[] = [];
    const write = (line: string) => lines.push(line);
    const exit = await promote(
      [join(dir, rows[0]!.file), "--name", "openai/refused", "--root", root],
      { log: write, error: write }
    );
    expect(exit).toBe(2);
    expect(lines.join("")).toContain("(media-summary)");
    expect(await readdir(root)).toEqual([]);
  });

  it("har report reads every shape", async () => {
    const files = await capturedFiles();
    const dir = await mkdtemp(join(tmpdir(), "apicity-cost-evidence-report-"));
    dirs.push(dir);
    let n = 0;
    for (const file of files) {
      await writeFile(join(dir, `${++n}.har`), await readFile(file));
    }
    expect(await readdir(dir)).toHaveLength(4);
    const { writer: w, out, err } = writer();
    const exit = await runHarCommand(["report", dir, "--json"], w, {
      env: {},
    } as never);
    expect(exit, err.join("")).toBe(0);
    const report = JSON.parse(out.join(""));
    expect(report.ok).toBe(true);
    expect(report.data.inputs).toMatchObject({ files: 4, annotatedFiles: 4 });
  }, 120_000);
});
