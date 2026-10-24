import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHarCapture, type Har, type HarCapture } from "@apicity/har";
import { createKie, KieError } from "@apicity/kie";

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
    const { dir, capture } = await setup({ maxBodyBytes: 12 });
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
