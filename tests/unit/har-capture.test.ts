import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import v8 from "node:v8";
import { runInNewContext } from "node:vm";
import {
  createHarCapture,
  exchangeToEntry,
  type Har,
  type HarCapture,
} from "@apicity/har";
import { createKie, KieError } from "@apicity/kie";
import { runHarCommand } from "../../packages/cli/src/har";

const dirs: string[] = [];
const captures: HarCapture[] = [];
const meta = {
  provider: "kie",
  endpoint: "api.v1.jobs.recordInfo",
  input: { prompt: "hello" },
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
async function setup(
  options: Partial<Parameters<typeof createHarCapture>[0]> = {}
) {
  const dir = await mkdtemp(join(tmpdir(), "apicity-capture-"));
  dirs.push(dir);
  let id = 0;
  const capture = createHarCapture({
    dir,
    mode: "all",
    clock: () => Date.UTC(2026, 9, 24),
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

describe("HAR capture runtime", () => {
  it("writes one scrubbed file per call, collapses repeated polls and preserves the result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ state: "pending" }))
    );
    const { dir, capture } = await setup({
      context: { attemptId: "attempt-1", signature: "context-secret" },
    });
    const result = await capture.call(meta, async () => {
      for (let i = 0; i < 3; i++) {
        const response = await capture.fetch(
          "https://api.kie.ai/task?X-Amz-Signature=fake-presign",
          {
            headers: {
              Authorization: "Bearer fake-token",
              Cookie: "secret=cookie",
            },
          }
        );
        expect(await response.json()).toEqual({ state: "pending" });
      }
      return 42;
    });
    expect(result).toBe(42);
    await capture.flush();
    const { lines, hars } = await read(dir);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      callId: "call-1",
      provider: "kie",
      outcome: "ok",
      status: 200,
      context: { attemptId: "attempt-1", signature: "***" },
      file: "kie/api.v1.jobs.recordInfo/2026-10-24T00-00-00.000Z-call-1.har",
    });
    expect(hars[0].log.entries).toHaveLength(1);
    expect(hars[0].log.entries[0]._apicity?.pollRepeat).toBe(2);
    const bytes = JSON.stringify(hars);
    expect(bytes).not.toContain("fake-token");
    expect(JSON.stringify(lines)).not.toContain("context-secret");
    expect(bytes).not.toContain("context-secret");
    expect(bytes).not.toContain("fake-presign");
    expect(bytes).not.toContain("secret=cookie");
    expect(hars[0].log._apicity).toMatchObject({
      input: meta.input,
      outcome: "ok",
      durationMs: 0,
    });
  });
  it("install ignores app traffic and filters hostnames, while injection and install can be combined", async () => {
    const base = vi.fn(async () => json({ ok: true }));
    vi.stubGlobal("fetch", base);
    const { dir, capture } = await setup({ providers: ["kie"] });
    const uninstall = capture.install();
    await fetch("https://api.kie.ai/outside");
    await capture.call(meta, async () => {
      await fetch("https://app.example/private");
      await fetch("https://api.kie.ai.evil.example/private");
      await fetch("https://api.kie.ai/installed");
      await capture.fetch("https://api.kie.ai/injected");
    });
    uninstall();
    expect(globalThis.fetch).toBe(base);
    await capture.flush();
    const { hars } = await read(dir);
    expect(hars).toHaveLength(1);
    expect(hars[0].log.entries.map((e) => e.request.url)).toEqual([
      "https://api.kie.ai/installed",
      "https://api.kie.ai/injected",
    ]);
    expect(base).toHaveBeenCalledTimes(5);
  });
  it("does not retry or disable capture for a rejected filtered request", async () => {
    const error = new Error("app failure");
    const base = vi.fn(async () => {
      throw error;
    });
    vi.stubGlobal("fetch", base);
    const onError = vi.fn();
    const { capture } = await setup({ providers: ["kie"], onError });
    capture.install();
    await expect(
      capture.call(meta, () => fetch("https://app.example/"))
    ).rejects.toBe(error);
    await capture.flush();
    expect(base).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });
  it("discards successful calls in failures mode even on HTTP 500", async () => {
    vi.stubGlobal("fetch", async () => json({ error: "handled" }, 500));
    const { dir, capture } = await setup({ mode: "failures" });
    await capture.call(meta, () => capture.fetch("https://api.kie.ai/task"));
    await capture.flush();
    expect(await readdir(dir)).toEqual([]);
  });
  it("records an actual KIE HTTP 200 envelope error and retains its exchange", async () => {
    vi.stubGlobal("fetch", async () =>
      json({ code: 422, msg: "invalid task" })
    );
    const { dir, capture } = await setup({ mode: "failures" });
    const kie = createKie({ apiKey: "fake", fetch: capture.fetch });
    await expect(
      capture.call(meta, () => kie.get.anthropic.v1.models())
    ).rejects.toBeInstanceOf(KieError);
    await capture.flush();
    const { hars } = await read(dir);
    expect(hars[0].log._apicity).toMatchObject({
      outcome: "provider_error",
      error: { status: 422 },
    });
    expect(hars[0].log.entries[0].response.status).toBe(200);
  });
  it("writes local validation errors as synthetic status-zero entries", async () => {
    const base = vi.fn();
    vi.stubGlobal("fetch", base);
    const { dir, capture } = await setup();
    const failure = new KieError("missing prompt", 400);
    await expect(
      capture.call(meta, () => {
        throw failure;
      })
    ).rejects.toBe(failure);
    await capture.flush();
    const { hars } = await read(dir);
    expect(base).not.toHaveBeenCalled();
    expect(hars[0].log._apicity?.outcome).toBe("local_error");
    expect(hars[0].log.entries[0]).toMatchObject({
      response: { status: 0 },
      _apicity: { kind: "local", error: { message: "missing prompt" } },
    });
    expect(hars[0].log.entries[0].request.url).toContain(meta.endpoint);
  });
  it("records network rejection and preserves the original thrown value", async () => {
    const error = new TypeError("offline");
    vi.stubGlobal("fetch", async () => {
      throw error;
    });
    const { dir, capture } = await setup();
    await expect(
      capture.call(meta, () => capture.fetch("https://api.kie.ai/task"))
    ).rejects.toBe(error);
    await capture.flush();
    const { hars } = await read(dir);
    expect(hars[0].log._apicity?.outcome).toBe("network_error");
    expect(hars[0].log.entries[0].response.status).toBe(0);
  });
  it("tees SSE without delaying headers or consuming the caller's body", async () => {
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              stream = controller;
            },
          }),
          { headers: { "content-type": "text/event-stream" } }
        )
    );
    const { dir, capture } = await setup({ maxBodyBytes: 12, sseTailBytes: 0 });
    const response = await capture.call(meta, () =>
      capture.fetch("https://api.kie.ai/stream")
    );
    stream.enqueue(new TextEncoder().encode("data: hello\n\ndata: world\n\n"));
    stream.close();
    expect(await response.text()).toBe("data: hello\n\ndata: world\n\n");
    await capture.flush();
    const { hars } = await read(dir);
    expect(hars[0].log.entries[0]._apicity).toMatchObject({
      streamed: true,
      bodyTruncated: true,
    });
    expect(hars[0].log.entries[0].response.content.text).toBe("data: hello\n");
  });
  it.each(["text/plain", "application/octet-stream"])(
    "replaces capped %s bodies with placeholders",
    async (contentType) => {
      vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
        expect(await (input as Request).text()).toBe("request body");
        return new Response("response body", {
          headers: { "content-type": contentType },
        });
      });
      const { dir, capture } = await setup({ maxBodyBytes: 2 });
      const response = await capture.fetch("https://api.kie.ai/body", {
        method: "POST",
        body: "request body",
        headers: { "content-type": contentType },
      });
      expect(await response.text()).toBe("response body");
      await capture.flush();
      const { hars } = await read(dir);
      expect(hars[0].log._apicity?.endpoint).toBe("unscoped");
      expect(
        JSON.parse(hars[0].log.entries[0].response.content.text!)
      ).toMatchObject({ _apicity_placeholder: { bytes: 13, contentType } });
      expect(
        JSON.parse(hars[0].log.entries[0].request.postData!.text!)
      ).toMatchObject({ _apicity_placeholder: { bytes: 12 } });
    }
  );
  it("does not collapse different wire bodies that scrub to the same text", async () => {
    let id = 0;
    vi.stubGlobal("fetch", async () =>
      json({ checkpoint: { signature: `secret-${++id}` } })
    );
    const { dir, capture } = await setup();
    await capture.call(meta, async () => {
      await capture.fetch("https://fal.run/task");
      await capture.fetch("https://fal.run/task");
    });
    await capture.flush();
    const { hars } = await read(dir);
    expect(hars[0].log.entries).toHaveLength(2);
    expect(hars[0].log.entries[0].response.content.text).toBe(
      hars[0].log.entries[1].response.content.text
    );
    expect(JSON.stringify(hars)).not.toContain("secret-");
  });
  it("repeated installation does not duplicate exchanges and close restores fetch", async () => {
    const base = vi.fn(async () => json({ ok: true }));
    vi.stubGlobal("fetch", base);
    const { dir, capture } = await setup();
    capture.install();
    capture.install();
    await capture.call(meta, () => fetch("https://api.kie.ai/task"));
    await capture.close();
    expect(globalThis.fetch).toBe(base);
    const { hars } = await read(dir);
    expect(hars[0].log.entries).toHaveLength(1);
    expect(base).toHaveBeenCalledTimes(1);
    await capture.fetch("https://api.kie.ai/after-close");
    expect((await read(dir)).hars).toHaveLength(1);
  });
  it("isolates concurrent calls, joins nested calls and preserves request order", async () => {
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const { dir, capture } = await setup();
    await Promise.all(
      [1, 2].map((id) =>
        capture.call({ ...meta, input: id }, () =>
          capture.call({ ...meta, endpoint: "inner" }, () =>
            capture.fetch(`https://api.kie.ai/${id}`)
          )
        )
      )
    );
    await capture.flush();
    const { hars } = await read(dir);
    expect(hars).toHaveLength(2);
    for (const har of hars) {
      expect(har.log._apicity?.endpoint).toBe(meta.endpoint);
      expect(har.log.entries).toHaveLength(1);
      expect(har.log.entries[0].request.url).toBe(
        `https://api.kie.ai/${har.log._apicity?.input}`
      );
    }
  });
  it("merges each concurrent call's own context over the capture context", async () => {
    let release!: () => void;
    const bothActive = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = 0;
    vi.stubGlobal("fetch", async () => {
      // Hold every exchange until both call scopes are in flight.
      if (++started === 2) release();
      await bothActive;
      return json({ ok: true });
    });
    const context = { app: "videobook", attemptId: "default" };
    const { dir, capture } = await setup({ context });
    await Promise.all(
      ["book-1", "book-2"].map((book) =>
        capture.call(
          {
            ...meta,
            input: book,
            context: {
              book,
              attemptId: `${book}-attempt`,
              api_key: "per-call-secret",
            },
          },
          () =>
            capture.call(
              { ...meta, endpoint: "inner", context: { book: "nested" } },
              () => capture.fetch(`https://api.kie.ai/${book}`)
            )
        )
      )
    );
    await capture.call({ ...meta, input: "default" }, () =>
      capture.fetch("https://api.kie.ai/default")
    );
    await capture.flush();
    const { lines, hars } = await read(dir);
    const expected: Record<string, Record<string, unknown>> = {
      "book-1": {
        app: "videobook",
        attemptId: "book-1-attempt",
        book: "book-1",
        api_key: "***",
      },
      "book-2": {
        app: "videobook",
        attemptId: "book-2-attempt",
        book: "book-2",
        api_key: "***",
      },
      default: context,
    };
    expect(hars).toHaveLength(3);
    for (const [i, har] of hars.entries()) {
      const call = har.log._apicity!;
      const input = call.input as string;
      expect(har.log.entries.map((e) => e.request.url)).toEqual([
        `https://api.kie.ai/${input}`,
      ]);
      expect(call.context).toEqual(expected[input]);
      expect(lines[i].callId).toBe(call.callId);
      expect(lines[i].context).toEqual(expected[input]);
    }
    expect(hars.map((har) => har.log._apicity?.input).sort()).toEqual([
      "book-1",
      "book-2",
      "default",
    ]);
    expect(context).toEqual({ app: "videobook", attemptId: "default" });
    expect(JSON.stringify({ lines, hars })).not.toContain("per-call-secret");
  });
  it("disables on write failure and calls onError once, even if the callback throws", async () => {
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const onError = vi.fn(() => {
      throw new Error("diagnostics failed");
    });
    const root = await mkdtemp(join(tmpdir(), "apicity-capture-fail-"));
    dirs.push(root);
    const file = join(root, "not-a-directory");
    await writeFile(file, "existing");
    const { capture } = await setup({ dir: file, onError });
    await expect(
      capture.call(meta, async () => {
        await capture.fetch("https://api.kie.ai/task");
        return 42;
      })
    ).resolves.toBe(42);
    await capture.flush();
    await expect(
      capture.call(meta, async () => {
        await capture.fetch("https://api.kie.ai/task");
        return 43;
      })
    ).resolves.toBe(43);
    await capture.flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(await readFile(file, "utf8")).toBe("existing");
  });
});

// One chunk per pull, each on a later tick as a socket's events are, then an error. A
// stream drops what nobody has read when it errors, so that tick is what a real
// connection gives a reader to keep up.
function dyingBody(
  chunks: Array<string | Uint8Array>,
  error: unknown = new Error("socket hang up")
) {
  const queue = chunks.map((chunk) =>
    typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk
  );
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      await new Promise((resolve) => setImmediate(resolve));
      const next = queue.shift();
      if (next) controller.enqueue(next);
      else controller.error(error);
    },
  });
}
const sha256 = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");

describe("a body that fails mid-read", () => {
  // The first call's body dies, and the second call is a normal one.
  async function firstDies(
    body: ReadableStream<Uint8Array>,
    contentType: string,
    options: Partial<Parameters<typeof createHarCapture>[0]> = {}
  ) {
    let calls = 0;
    vi.stubGlobal("fetch", async () =>
      ++calls === 1
        ? new Response(body, { headers: { "content-type": contentType } })
        : json({ ok: true })
    );
    const onError = vi.fn();
    const { dir, capture } = await setup({ onError, ...options });
    await capture.call(meta, async () => {
      const response = await capture.fetch("https://api.kie.ai/task");
      await response.text().catch(() => undefined);
    });
    await capture.call(meta, () =>
      capture.fetch("https://api.kie.ai/task").then((r) => r.text())
    );
    await capture.flush();
    const { lines, hars } = await read(dir);
    expect(onError).not.toHaveBeenCalled();
    expect(lines).toHaveLength(2);
    expect(hars[1]!.log.entries[0]!.response.content.text).toBe('{"ok":true}');
    return { line: lines[0], har: hars[0]!, entry: hars[0]!.log.entries[0]! };
  }

  it("keeps a stream's whole lines, flags it, and keeps capturing", async () => {
    const arrived = 'data: {"a":1}\n\ndata: {"a":2}\n\n';
    const half = Math.floor(arrived.length / 2);
    const { line, har, entry } = await firstDies(
      dyingBody([arrived.slice(0, half), arrived.slice(half)]),
      "text/event-stream"
    );
    expect(entry.response.content.text).toBe(arrived);
    expect(entry.response.status).toBe(200);
    expect(entry.response.bodySize).toBe(Buffer.byteLength(arrived));
    expect(entry._apicity).toMatchObject({
      bodyTruncated: true,
      responseCut: true,
    });
    expect(line.outcome).toBe("network_error");
    expect(har.log._apicity?.outcome).toBe("network_error");
  });

  // Scrub rules read whole documents and frames, whatever the type says.
  it.each([
    [
      "a plain JSON body on a timeout abort",
      "application/json",
      new DOMException("The operation timed out", "TimeoutError"),
      '{"model":"m","usage":{"input_tokens":1',
    ],
    [
      "JSON under another type",
      "text/plain",
      new Error("socket hang up"),
      '  {"model":"m","usage":{"input_tokens":1',
    ],
    [
      "a JSON array",
      "application/vnd.api+json",
      new Error("socket hang up"),
      '[{"model":"m"},{"mod',
    ],
    ["plain text", "text/plain", new Error("cut"), "some words"],
    ["frames under another type", "text/plain", new Error("cut"), 'data: {"a'],
    ["HTML", "text/html", new Error("cut"), '<pre>{"a":1'],
    ["XML", "application/xml", new Error("cut"), "<a>word"],
    [
      "text that will not parse under JSON",
      "application/json",
      new Error("cut"),
      "x",
    ],
    ["nothing", "application/json", new Error("cut"), ""],
  ])(
    "keeps %s as a placeholder of what arrived, and keeps capturing",
    async (_, contentType, error, arrived) => {
      const { line, entry } = await firstDies(
        dyingBody(arrived ? [arrived] : [], error),
        contentType
      );
      expect(JSON.parse(entry.response.content.text!)).toEqual({
        _apicity_placeholder: {
          sha256: sha256(arrived),
          bytes: Buffer.byteLength(arrived),
          contentType,
        },
      });
      expect(entry.response.bodySize).toBe(Buffer.byteLength(arrived));
      expect(entry._apicity).toMatchObject({
        bodyTruncated: true,
        responseCut: true,
      });
      expect(line.outcome).toBe("network_error");
    }
  );

  it("keeps a binary body as a placeholder of what arrived", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const { entry } = await firstDies(dyingBody([bytes]), "image/png");
    expect(JSON.parse(entry.response.content.text!)).toEqual({
      _apicity_placeholder: {
        sha256: sha256(bytes),
        bytes: 3,
        contentType: "image/png",
      },
    });
    expect(entry._apicity?.bodyTruncated).toBe(true);
  });

  it("keeps a multipart body as a placeholder of what arrived", async () => {
    const contentType = "multipart/form-data; boundary=X";
    const arrived =
      '--X\r\nContent-Disposition: form-data; name="model"\r\n\r\nm\r\n--X\r\nContent-Dis';
    const { entry } = await firstDies(dyingBody([arrived]), contentType);
    expect(JSON.parse(entry.response.content.text!)).toEqual({
      _apicity_placeholder: {
        sha256: sha256(arrived),
        bytes: Buffer.byteLength(arrived),
        contentType,
      },
    });
    expect(entry._apicity?.bodyTruncated).toBe(true);
  });

  it.each(["xmlX", "jsonX", "textX"])(
    "reads a cut form as a form, with %s for a boundary",
    async (boundary) => {
      const contentType = `multipart/form-data; boundary=${boundary}`;
      const arrived = `--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\nLIVE-SECRET\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.png"\r\nContent-Type: image/png\r\n\r\nRAWFILEBYTES`;
      const { entry } = await firstDies(dyingBody([arrived]), contentType);
      expect(entry.response.content.text).not.toMatch(
        /LIVE-SECRET|RAWFILEBYTES/
      );
      expect(JSON.parse(entry.response.content.text!)).toHaveProperty(
        "_apicity_placeholder"
      );
    }
  );

  it.each(["multipart/form-data; boundary=xmlX", "image/png; name=a.json"])(
    "does not take a type from a parameter, whole or cut: %s",
    async (contentType) => {
      vi.stubGlobal("fetch", async () => json({ ok: true }));
      const { dir, capture } = await setup();
      await capture.call(meta, () =>
        capture.fetch("https://api.kie.ai/task", {
          method: "POST",
          headers: { "content-type": contentType },
          body: "LIVE-SECRET not a form",
        })
      );
      await capture.flush();
      const { hars } = await read(dir);
      const text = hars[0]!.log.entries[0]!.request.postData!.text!;
      expect(text).not.toContain("LIVE-SECRET");
      expect(JSON.parse(text)).toHaveProperty("_apicity_placeholder");
    }
  );

  it("flags a whole form whose connection dies after its last byte", async () => {
    const contentType = "multipart/form-data; boundary=X";
    const arrived =
      '--X\r\nContent-Disposition: form-data; name="model"\r\n\r\nm\r\n--X--\r\n';
    const { line, entry } = await firstDies(dyingBody([arrived]), contentType);
    expect(JSON.parse(entry.response.content.text!)).toMatchObject({
      _apicity_placeholder: { bytes: Buffer.byteLength(arrived) },
    });
    expect(entry._apicity?.bodyTruncated).toBe(true);
    expect(line.outcome).toBe("network_error");
  });

  it("does not disable the capture for a form that will not parse", async () => {
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const onError = vi.fn();
    const { dir, capture } = await setup({ onError });
    const send = () =>
      capture.call(meta, () =>
        capture.fetch("https://api.kie.ai/task", {
          method: "POST",
          headers: { "content-type": "multipart/form-data; boundary=X" },
          body: "not a form",
        })
      );
    await send();
    await send();
    await capture.flush();
    expect(onError).not.toHaveBeenCalled();
    const { lines, hars } = await read(dir);
    expect(lines).toHaveLength(2);
    const entry = hars[0]!.log.entries[0]!;
    expect(JSON.parse(entry.request.postData!.text!)).toMatchObject({
      _apicity_placeholder: { bytes: "not a form".length },
    });
    expect(entry._apicity?.bodyTruncated).toBeUndefined();
    expect(lines[0].outcome).toBe("ok");
  });

  it("still summarizes a form that does parse", async () => {
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const { dir, capture } = await setup();
    const form = new FormData();
    form.append("model", "m");
    form.append("file", new Blob(["bytes"], { type: "image/png" }), "a.png");
    await capture.call(meta, () =>
      capture.fetch("https://api.kie.ai/task", { method: "POST", body: form })
    );
    await capture.flush();
    const { hars } = await read(dir);
    expect(
      JSON.parse(hars[0]!.log.entries[0]!.request.postData!.text!)
    ).toEqual({
      _multipart: true,
      model: "m",
      file: {
        _file: true,
        filename: "a.png",
        contentType: "image/png",
        size: 5,
      },
    });
  });

  it.each([
    ["under the cap", {}, 0],
    ["past the cap", { maxBodyBytes: 20, sseTailBytes: 40 }, 200],
    ["with no tail", { maxBodyBytes: 20, sseTailBytes: 0 }, 200],
  ])(
    "keeps a stream's whole lines, not the one the read ended inside (%s)",
    async (_, options, lines) => {
      const whole = new TextEncoder().encode(
        `${'data: {"a":1}\n\n'.repeat(lines + 1)}data: {"delta":"日本語"}`
      );
      const { entry } = await firstDies(
        dyingBody([whole.slice(0, whole.length - 4)]),
        "text/event-stream",
        options
      );
      const text = entry.response.content.text!;
      expect(text.endsWith("\n")).toBe(true);
      expect(text).not.toContain("delta");
      expect(text).not.toContain("\uFFFD");
    }
  );

  it("keeps nothing of a stream cut inside its first line", async () => {
    const { entry } = await firstDies(
      dyingBody(['data: {"a":1']),
      "text/event-stream"
    );
    expect(entry.response.content.text).toBe("");
    expect(entry.response.bodySize).toBe(12);
    expect(entry._apicity?.bodyTruncated).toBe(true);
  });

  it("keeps the head and tail of a stream that dies past the cap", async () => {
    const frame = 'data: {"delta":"word"}\n\n';
    const { entry } = await firstDies(
      dyingBody(Array.from({ length: 400 }, () => frame)),
      "text/event-stream",
      { maxBodyBytes: 1000, sseTailBytes: 1000 }
    );
    const text = entry.response.content.text!;
    expect(text).toMatch(/\n: apicity-gap \d+ bytes dropped\n/);
    expect(text.startsWith(frame)).toBe(true);
    expect(text.endsWith(frame)).toBe(true);
    expect(entry.response.bodySize).toBe(400 * frame.length);
    expect(entry._apicity).toMatchObject({
      streamed: true,
      bodyTruncated: true,
    });
  });

  // Each of these rules reads a whole document, so a cut one would pass them all.
  it.each([
    ["a credential", '"api_key":"LIVE-SECRET-cut-in-tw'],
    ["a credential after a backslash", '"api_key":"LIVE-SECRET\\'],
    ["a guest token", '"guestToken":"LIVE-SECRET-cut-in-tw'],
    ["an account key id", '"create_api_key_id":"LIVE-SECRET-cut-in-tw'],
    [
      "a checkpoint signature",
      '"checkpoint":{"url":"https://v3.fal.media/x.safetensors","signature":"LIVE-SECRET-cut-in-tw',
    ],
    ["a Fireworks key", '"apiKeys":[{"key":"LIVE-SECRET-cut-in-tw'],
    ["a whole field before the cut", '"guestToken":"LIVE-SECRET","a":"b'],
  ])("does not store %s from the frame or body it cut", async (_, field) => {
    for (const [type, arrived] of [
      ["text/event-stream", `data: {"a":1}\n\ndata: {${field}`],
      ["application/json", `{${field}`],
      ["text/plain", `{${field}`],
      ["text/plain", `data: {"a":1}\n\ndata: {${field}`],
      ["text/plain", `event: x\ndata: {${field}`],
      ["text/plain", `)]}'\n{${field}`],
      ["text/plain", `{"a":1}\n{${field}`],
      ["text/html", `<pre>{${field}`],
      ["application/xml", `<a>{${field}`],
    ] as const) {
      const { entry } = await firstDies(dyingBody([arrived]), type);
      expect(entry.response.content.text).not.toContain("LIVE-SECRET");
    }
  });

  it("stores no media from a JSON body it cut", async () => {
    const { entry } = await firstDies(
      dyingBody([`{"model":"m","data":[{"b64_json":"${"A".repeat(200_000)}`]),
      "application/json"
    );
    expect(entry.response.content.text).not.toContain("AAAAAAAA");
  });

  it("states a whole JSON body whose connection dies after its last byte", async () => {
    const { entry } = await firstDies(
      dyingBody(['{"usage":{"total_tokens":3}}']),
      "application/json"
    );
    expect(entry.response.content.text).toBe('{"usage":{"total_tokens":3}}');
    expect(entry._apicity?.bodyTruncated).toBe(true);
  });

  describe("the call's outcome", () => {
    const dying = () =>
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response(dyingBody(["partial"]), {
            headers: { "content-type": "text/plain" },
          })
      );

    it("is a network error when the callback throws it", async () => {
      dying();
      const { dir, capture } = await setup();
      await expect(
        capture.call(meta, async () =>
          (await capture.fetch("https://api.kie.ai/task")).text()
        )
      ).rejects.toThrow();
      await capture.flush();
      const { lines, hars } = await read(dir);
      expect(lines[0].outcome).toBe("network_error");
      expect(lines[0].status).toBe(0);
      expect(hars[0]!.log._apicity?.error).toBeDefined();
    });

    it("is a network error when the body dies after the callback returned", async () => {
      dying();
      const { dir, capture } = await setup();
      const response = await capture.call(meta, () =>
        capture.fetch("https://api.kie.ai/task")
      );
      await expect(response.text()).rejects.toThrow("socket hang up");
      await capture.flush();
      const { lines } = await read(dir);
      expect(lines[0].outcome).toBe("network_error");
      expect(lines[0].status).toBe(200);
    });

    it("is kept in failures mode", async () => {
      dying();
      const { dir, capture } = await setup({ mode: "failures" });
      const response = await capture.call(meta, () =>
        capture.fetch("https://api.kie.ai/task")
      );
      await expect(response.text()).rejects.toThrow("socket hang up");
      await capture.flush();
      const { lines, hars } = await read(dir);
      expect(lines).toHaveLength(1);
      expect(
        JSON.parse(hars[0]!.log.entries[0]!.response.content.text!)
      ).toMatchObject({ _apicity_placeholder: { bytes: 7 } });
    });
  });

  it("follows the request's own abort signal to the reason it gives", async () => {
    vi.stubGlobal("fetch", async (input: Request) => {
      const { signal } = input;
      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"partial":'));
            signal.addEventListener("abort", () =>
              controller.error(signal.reason)
            );
          },
        }),
        { headers: { "content-type": "application/json" } }
      );
    });
    const onError = vi.fn();
    const { dir, capture } = await setup({ onError });
    await expect(
      capture.call(meta, async () => {
        const response = await capture.fetch("https://api.kie.ai/task", {
          signal: AbortSignal.timeout(20),
        });
        return response.json();
      })
    ).rejects.toThrow();
    await capture.flush();
    expect(onError).not.toHaveBeenCalled();
    const { lines, hars } = await read(dir);
    expect(lines[0].outcome).toBe("network_error");
    expect(
      JSON.parse(hars[0]!.log.entries[0]!.response.content.text!)
    ).toMatchObject({ _apicity_placeholder: { bytes: 11 } });
    expect(hars[0]!.log._apicity?.error?.name).toBe("TimeoutError");
  });

  it("passes the caller's abort to a body once its Request copies could be collected", async () => {
    const server = createServer((_, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.write('{"partial":'); // and never finishes
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve)
    );
    v8.setFlagsFromString("--expose-gc");
    const gc = runInNewContext("gc") as () => void;
    v8.setFlagsFromString("--no-expose-gc");
    try {
      const { port } = server.address() as AddressInfo;
      const url = `http://127.0.0.1:${port}/`;
      for (const input of [url, new Request(url)]) {
        const controller = new AbortController();
        const { capture } = await setup();
        const response = await capture.call(meta, () =>
          input instanceof Request
            ? capture.fetch(new Request(input, { signal: controller.signal }))
            : capture.fetch(input, { signal: controller.signal })
        );
        for (let i = 0; i < 4; i += 1) {
          gc();
          await new Promise((resolve) => setImmediate(resolve));
        }
        const reading = response.text().then(
          () => "finished",
          (error: Error) => error.name
        );
        controller.abort();
        const outcome = await Promise.race([
          reading,
          new Promise((resolve) => setTimeout(() => resolve("pending"), 3000)),
        ]);
        expect(outcome).toBe("AbortError");
        await capture.flush();
      }
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  }, 30_000);

  // Its copy is read once the fetch has settled, and a stream drops what nobody has
  // read when it errors, so this one may keep nothing. It is still flagged and saved.
  it("flags a request body that dies on the way out", async () => {
    vi.stubGlobal("fetch", async (input: Request) => {
      await input.text();
      return json({ ok: true });
    });
    const onError = vi.fn();
    const { dir, capture } = await setup({ onError });
    await expect(
      capture.call(meta, () =>
        capture.fetch("https://api.kie.ai/task", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: dyingBody(['{"model":"m",']),
          duplex: "half",
        } as RequestInit)
      )
    ).rejects.toThrow("socket hang up");
    await capture.flush();
    expect(onError).not.toHaveBeenCalled();
    const { lines, hars } = await read(dir);
    expect(hars[0]!.log.entries[0]!._apicity?.bodyTruncated).toBe(true);
    expect(lines[0].outcome).toBe("network_error");
  });

  it("flags a held request whose stream dies after its last byte", async () => {
    const body = JSON.stringify({
      model: "m",
      image: `data:image/png;base64,${"A".repeat(400_000)}`,
    });
    const { request, _apicity } = await exchangeToEntry(
      new Request("https://api.kie.ai/task", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: dyingBody([body]),
        duplex: "half",
      } as RequestInit),
      json({ ok: true }),
      { startedAt: new Date(0), durationMs: 1 }
    );
    expect(JSON.parse(request.postData!.text!).model).toBe("m");
    expect(request.postData!.text!).not.toContain("AAAAAAAA");
    expect(_apicity?.bodyTruncated).toBe(true);
  });

  it("does not lose a response that dies while the request is still being read", async () => {
    let releaseRequest!: () => void;
    const held = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    const slowRequest = new Request("https://api.kie.ai/task", {
      method: "POST",
      body: new ReadableStream<Uint8Array>({
        async pull(controller) {
          await held;
          controller.close();
        },
      }),
      duplex: "half",
    } as RequestInit);
    let queued!: () => void;
    const arrived = new Promise<void>((resolve) => {
      queued = resolve;
    });
    const response = new Response(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode("data: partial\n\n"));
          await new Promise((resolve) => setTimeout(resolve, 20));
          controller.error(new Error("socket hang up"));
          queued();
        },
      }),
      { headers: { "content-type": "text/event-stream" } }
    );
    const entry = exchangeToEntry(slowRequest, response, {
      startedAt: new Date(0),
      durationMs: 1,
    });
    await arrived;
    releaseRequest();
    const { response: stored } = await entry;
    expect(stored.content.text).toBe("data: partial\n\n");
  });

  it("survives a real socket dropped mid-body", async () => {
    const server = createServer((_, res) => {
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write('data: {"delta":"one"}\n\n');
      setTimeout(() => res.destroy(), 20);
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve)
    );
    try {
      const { port } = server.address() as AddressInfo;
      const onError = vi.fn();
      const { dir, capture } = await setup({ onError });
      const url = `http://127.0.0.1:${port}/`;
      await capture.call(meta, async () => {
        const response = await capture.fetch(url);
        await response.text().catch(() => undefined);
      });
      await capture.flush();
      expect(onError).not.toHaveBeenCalled();
      const { lines, hars } = await read(dir);
      const entry = hars[0]!.log.entries[0]!;
      expect(entry.response.content.text).toBe('data: {"delta":"one"}\n\n');
      expect(entry._apicity?.bodyTruncated).toBe(true);
      expect(lines[0].outcome).toBe("network_error");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("leaves captures the CLI reads, whichever body died", async () => {
    let call = 0;
    const bodies: Array<[string, string]> = [
      [
        "text/event-stream",
        'data: {"type":"response.output_text.delta"}\n\nda',
      ],
      ["application/json", '{"model":"gpt-5","usage":{"input_tokens":1'],
      ["text/plain", "words"],
      ["image/png", "bytes"],
      ["multipart/form-data; boundary=X", "--X\r\ncut"],
      ["text/event-stream", ""],
    ];
    vi.stubGlobal("fetch", async () => {
      const [contentType, arrived] = bodies[call++]!;
      return new Response(dyingBody(arrived ? [arrived] : []), {
        headers: { "content-type": contentType },
      });
    });
    const { dir, capture } = await setup();
    for (let i = 0; i < bodies.length; i += 1) {
      await capture.call(
        { provider: "openai", endpoint: "v1.responses", input: {} },
        async () => {
          const response = await capture.fetch(
            "https://api.openai.com/v1/responses",
            { method: "POST", body: "{}" }
          );
          await response.text().catch(() => undefined);
        }
      );
    }
    await capture.flush();
    const { lines } = await read(dir);
    expect(lines).toHaveLength(bodies.length);
    const out: string[] = [];
    const writer = {
      out: (line: string) => out.push(line),
      err: (line: string) => out.push(line),
    };
    for (const line of lines) {
      const file = join(dir, line.file);
      expect(await runHarCommand(["scrub", "--check", file], writer)).toBe(0);
    }
    expect(await runHarCommand(["report", dir, "--json"], writer)).toBe(0);
    expect(JSON.parse(out.at(-1)!).data.inputs.files).toBe(bodies.length);
    expect(await runHarCommand(["cost", dir, "--json"], writer)).toBe(0);
  }, 120_000);

  it("still disables the capture for a failure of its own", async () => {
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const onError = vi.fn();
    const { capture } = await setup({ onError, sseTailBytes: -1 });
    await capture.call(meta, () => capture.fetch("https://api.kie.ai/task"));
    await capture.flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(String(onError.mock.calls[0]![0])).toContain("sseTailBytes");
  });
});

describe("media in a call's input", () => {
  async function captured(
    input: unknown,
    options: Partial<Parameters<typeof createHarCapture>[0]> = {}
  ) {
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const onError = vi.fn();
    const { dir, capture } = await setup({ onError, ...options });
    await capture.call({ ...meta, input }, () =>
      capture.fetch("https://api.kie.ai/task")
    );
    await capture.flush();
    expect(onError).not.toHaveBeenCalled();
    const { lines, hars } = await read(dir);
    return {
      file: join(dir, lines[0].file),
      stored: hars[0]!.log._apicity?.input,
    };
  }
  const placeholder = (bytes: Uint8Array, contentType: string) => ({
    _apicity_placeholder: {
      sha256: sha256(bytes),
      bytes: bytes.byteLength,
      contentType,
    },
  });
  const OCTETS = "application/octet-stream";

  it("replaces a large image and keeps what a cost report reads", async () => {
    const image = randomBytes(1_200_000);
    const dataUrl = `data:image/jpeg;base64,${image.toString("base64")}`;
    const input = {
      model: "gpt-5.6-sol",
      max_output_tokens: 900,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "what is in this frame?" },
            { type: "input_image", image_url: dataUrl, detail: "low" },
          ],
        },
      ],
    };
    const before = JSON.stringify(input);
    const { file, stored } = await captured(input);
    expect(stored).toEqual({
      model: "gpt-5.6-sol",
      max_output_tokens: 900,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "what is in this frame?" },
            {
              type: "input_image",
              image_url: placeholder(image, "image/jpeg"),
              detail: "low",
            },
          ],
        },
      ],
    });
    expect((await stat(file)).size).toBeLessThan(10_000);
    // The caller's value is left as it was.
    expect(JSON.stringify(input)).toBe(before);
    const errors: string[] = [];
    const exit = await runHarCommand(["scrub", "--check", file], {
      out: () => {},
      err: (line: string) => errors.push(line),
    });
    expect(exit, errors.join("")).toBe(0);
  });

  it("still sends the media to the provider", async () => {
    const dataUrl = `data:image/png;base64,${"A".repeat(4000)}`;
    let sent = "";
    vi.stubGlobal("fetch", async (request: Request) => {
      sent = await request.text();
      return json({ ok: true });
    });
    const { capture } = await setup();
    const input = { image: dataUrl };
    await capture.call({ ...meta, input }, () =>
      capture.fetch("https://api.kie.ai/task", {
        method: "POST",
        body: JSON.stringify(input),
      })
    );
    await capture.flush();
    expect(JSON.parse(sent)).toEqual(input);
  });

  const words = "cat dog tree house ";
  it.each<[string, string]>([
    ["a short data URL", `data:image/png;base64,${"A".repeat(100)}`],
    ["a data URL at the cap", `data:,${"a".repeat(1018)}`],
    ["base64 at the cap", "A".repeat(1024)],
    ["unpunctuated prose", words.repeat(100)],
    ["prose after data:", `data: ${words.repeat(100)}`],
    ["prose shaped like a data URL", `data:note, ${words.repeat(100)}`],
    ["prose with a slash and a comma", `data: a/b, ${words.repeat(100)}`],
    ["a word before a comma", `data:note,${"a".repeat(2000)}`],
    ["a long URL", `https://example.com/${"a/".repeat(1000)}`],
    ["words one to a line", "cat\ndog\ntree\nhouse\n".repeat(100)],
    [
      "ids one to a line",
      `${"123e4567-e89b-12d3-a456-426614174000\n".repeat(60)}`,
    ],
    ["paths one to a line", "packages/provider/har/src/capture\n".repeat(60)],
    [
      "lines of one width too short for a wrap",
      `${"A".repeat(59)}\n`.repeat(40),
    ],
    [
      "lines of uneven width",
      `${"A".repeat(76)}\n${"A".repeat(40)}\n`.repeat(20),
    ],
    [
      "a last line longer than the rest",
      `${`${"A".repeat(76)}\n`.repeat(20)}${"A".repeat(80)}`,
    ],
    ["base64 wrapped on spaces", `${"A".repeat(76)} `.repeat(20)],
  ])("keeps %s", async (_, value) => {
    const { stored } = await captured({ value });
    expect(stored).toEqual({ value });
  });

  const fileBytes = Buffer.from(
    Array.from({ length: 3000 }, (_, i) => i % 256)
  );
  const base64 = fileBytes.toString("base64");
  it.each<[string, string, Uint8Array, string]>([
    ["a data URL", `data:image/png;base64,${base64}`, fileBytes, "image/png"],
    ["bare base64", base64, fileBytes, OCTETS],
    [
      "base64 wrapped on line feeds",
      base64.replace(/(.{76})/g, "$1\n"),
      fileBytes,
      OCTETS,
    ],
    [
      "base64 wrapped on CRLF",
      base64.replace(/(.{76})/g, "$1\r\n"),
      fileBytes,
      OCTETS,
    ],
    ["base64 with a space after it", `${base64} `, fileBytes, OCTETS],
    ["base64 with a line end after it", `${base64}\r\n`, fileBytes, OCTETS],
    [
      "a data URL with a space in its parameters",
      `data:audio/webm; codecs=opus;base64,${base64}`,
      fileBytes,
      "audio/webm",
    ],
    [
      "a data URL with only its flag",
      `data:base64,${base64}`,
      fileBytes,
      "base64",
    ],
    [
      "a data URL with a space before its flag",
      `data:audio/mpeg; base64,${base64}`,
      fileBytes,
      "audio/mpeg",
    ],
    [
      "a data URL with a space before its type",
      `data: image/png;base64,${base64}`,
      fileBytes,
      "image/png",
    ],
    [
      "a data URL with a space before it",
      ` data:image/png;base64,${base64}`,
      fileBytes,
      "image/png",
    ],
    [
      "a data URL with a long header",
      `data:image/png;name=${"a".repeat(1100)};base64,${base64}`,
      fileBytes,
      "image/png",
    ],
    [
      "URL-safe base64",
      base64.replace(/\+/g, "-").replace(/\//g, "_"),
      fileBytes,
      OCTETS,
    ],
    [
      "a data URL with parameters",
      `DATA:audio/mpeg;name=a.mp3;BASE64,${base64}`,
      fileBytes,
      "audio/mpeg",
    ],
    [
      "a data URL with no media type",
      `data:;base64,${base64}`,
      fileBytes,
      OCTETS,
    ],
    [
      "a data URL that is not base64",
      `data:image/svg+xml,${"%3Csvg%3E".repeat(200)}`,
      Buffer.from("%3Csvg%3E".repeat(200)),
      "image/svg+xml",
    ],
    [
      "text in a data URL with no media type",
      `data:,${"a".repeat(2000)}`,
      Buffer.from("a".repeat(2000)),
      OCTETS,
    ],
  ])("replaces %s", async (_, value, bytes, contentType) => {
    const { stored } = await captured({ deep: [{ value }] });
    expect(stored).toEqual({
      deep: [{ value: placeholder(bytes, contentType) }],
    });
  });

  it("replaces a string that is the whole input", async () => {
    const { stored } = await captured(`data:image/png;base64,${base64}`);
    expect(stored).toEqual(placeholder(fileBytes, "image/png"));
  });

  it("replaces bytes, counting only what a view covers", async () => {
    const all = Uint8Array.from({ length: 2000 }, (_, i) => i % 256);
    const view = all.subarray(100, 1100);
    const { stored } = await captured({
      buffer: Buffer.from(all),
      view,
      arrayBuffer: all.buffer,
      words: new Uint16Array(all.buffer, 0, 10),
    });
    expect(stored).toEqual({
      buffer: placeholder(all, OCTETS),
      view: placeholder(view, OCTETS),
      arrayBuffer: placeholder(all, OCTETS),
      words: placeholder(all.subarray(0, 20), OCTETS),
    });
  });

  it("keeps a buffer transferred away during the call, as JSON reads it", async () => {
    const buffer = new ArrayBuffer(4000);
    const views = {
      typed: new Uint8Array(buffer),
      data: new DataView(buffer),
    };
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const onError = vi.fn();
    const { dir, capture } = await setup({ onError });
    await capture.call({ ...meta, input: { buffer, ...views } }, async () => {
      structuredClone(buffer, { transfer: [buffer] });
      return capture.fetch("https://api.kie.ai/task");
    });
    await capture.flush();
    expect(onError).not.toHaveBeenCalled();
    const { hars } = await read(dir);
    expect(hars[0]!.log._apicity?.input).toEqual({
      buffer: {},
      typed: {},
      data: {},
    });
  });

  it("reads a getter once", async () => {
    let reads = 0;
    const { stored } = await captured({
      get once() {
        reads += 1;
        if (reads > 1) throw new Error("read twice");
        return "value";
      },
    });
    expect(stored).toEqual({ once: "value" });
    expect(reads).toBe(1);
  });

  it("keeps what serializes to something else, and an old placeholder", async () => {
    const earlier = { _apicity_placeholder: { sha256: "ab", bytes: 3 } };
    const { stored } = await captured({
      at: new Date(Date.UTC(2026, 10, 4)),
      earlier,
      count: 3,
      on: true,
      none: null,
      dropped: undefined,
    });
    expect(stored).toEqual({
      at: "2026-11-04T00:00:00.000Z",
      earlier,
      count: 3,
      on: true,
      none: null,
    });
  });

  it("keeps a credential field redacted, not hashed", async () => {
    const { stored } = await captured({ api_key: "A".repeat(2000) });
    expect(stored).toEqual({ api_key: "***" });
  });

  // Past about 8 million of them a regex overflows its stack, not merely slows down.
  it("does not fail on a run of semicolons after data:", async () => {
    const value = `data:${"1;".repeat(8_000_000)}`;
    const { stored } = await captured({ value });
    expect(stored).toEqual({ value });
  }, 30_000);

  it("writes nothing for a call failures mode discards", async () => {
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const { dir, capture } = await setup({ mode: "failures" });
    await capture.call(
      { ...meta, input: { image: `data:image/png;base64,${base64}` } },
      () => capture.fetch("https://api.kie.ai/task")
    );
    await capture.flush();
    expect(await readdir(dir)).toEqual([]);
  });

  it("disables the capture for input that will not serialize, as before", async () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    vi.stubGlobal("fetch", async () => json({ ok: true }));
    const onError = vi.fn();
    const { capture } = await setup({ onError });
    await capture.call({ ...meta, input: cycle }, () =>
      capture.fetch("https://api.kie.ai/task")
    );
    await capture.flush();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
