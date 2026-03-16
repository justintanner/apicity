import { describe, it, expect, vi } from "vitest";
import {
  withStreamRetry,
  withStreamFallback,
} from "../../../packages/provider/kimicoding/src";

interface Req {
  prompt: string;
}

interface Chunk {
  delta: string;
  done: boolean;
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iter) {
    items.push(item);
  }
  return items;
}

function makeStreamFn(
  impl: (req: Req, signal?: AbortSignal) => AsyncIterable<Chunk>
): (req: Req, signal?: AbortSignal) => AsyncIterable<Chunk> {
  return vi.fn(impl);
}

describe("withStreamRetry", () => {
  it("returns all chunks on first success", async () => {
    const fn = makeStreamFn(async function* () {
      yield { delta: "hello", done: false };
      yield { delta: " world", done: true };
    });

    const wrapped = withStreamRetry(fn);
    const chunks = await collect(wrapped({ prompt: "test" }));

    expect(chunks).toEqual([
      { delta: "hello", done: false },
      { delta: " world", done: true },
    ]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient error and succeeds", async () => {
    let calls = 0;
    const fn = makeStreamFn(async function* (req) {
      calls += 1;
      if (calls < 3) {
        const err = new Error("rate limited") as Error & { status: number };
        err.status = 429;
        throw err;
      }
      yield { delta: req.prompt, done: true };
    });

    const wrapped = withStreamRetry(fn, {
      retries: 3,
      baseMs: 1,
      jitter: false,
    });
    const chunks = await collect(wrapped({ prompt: "retry" }));

    expect(chunks).toEqual([{ delta: "retry", done: true }]);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    // eslint-disable-next-line require-yield
    const fn = makeStreamFn(async function* () {
      const err = new Error("server error") as Error & { status: number };
      err.status = 500;
      throw err;
    });

    const wrapped = withStreamRetry(fn, {
      retries: 2,
      baseMs: 1,
      jitter: false,
    });

    await expect(collect(wrapped({ prompt: "fail" }))).rejects.toThrow(
      "server error"
    );
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("does not retry on non-transient error", async () => {
    // eslint-disable-next-line require-yield
    const fn = makeStreamFn(async function* () {
      const err = new Error("bad request") as Error & { status: number };
      err.status = 400;
      throw err;
    });

    const wrapped = withStreamRetry(fn, { retries: 3, baseMs: 1 });

    await expect(collect(wrapped({ prompt: "fail" }))).rejects.toThrow(
      "bad request"
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries mid-stream failure", async () => {
    let calls = 0;
    const fn = makeStreamFn(async function* () {
      calls += 1;
      yield { delta: "partial", done: false };
      if (calls === 1) {
        const err = new Error("mid-stream") as Error & { status: number };
        err.status = 500;
        throw err;
      }
      yield { delta: " complete", done: true };
    });

    const wrapped = withStreamRetry(fn, {
      retries: 1,
      baseMs: 1,
      jitter: false,
    });
    const chunks = await collect(wrapped({ prompt: "test" }));

    // First attempt yields "partial" then fails; retry restarts the stream
    expect(chunks).toEqual([
      { delta: "partial", done: false },
      { delta: "partial", done: false },
      { delta: " complete", done: true },
    ]);
  });
});

describe("withStreamFallback", () => {
  it("returns chunks from first function", async () => {
    const fn1 = makeStreamFn(async function* () {
      yield { delta: "fn1", done: true };
    });
    const fn2 = makeStreamFn(async function* () {
      yield { delta: "fn2", done: true };
    });

    const wrapped = withStreamFallback([fn1, fn2]);
    const chunks = await collect(wrapped({ prompt: "test" }));

    expect(chunks).toEqual([{ delta: "fn1", done: true }]);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(0);
  });

  it("falls back to second function on failure", async () => {
    // eslint-disable-next-line require-yield
    const fn1 = makeStreamFn(async function* () {
      throw new Error("fn1 failed");
    });
    const fn2 = makeStreamFn(async function* (req) {
      yield { delta: `fn2:${req.prompt}`, done: true };
    });

    const wrapped = withStreamFallback([fn1, fn2]);
    const chunks = await collect(wrapped({ prompt: "fallback" }));

    expect(chunks).toEqual([{ delta: "fn2:fallback", done: true }]);
  });

  it("throws last error when all functions fail", async () => {
    // eslint-disable-next-line require-yield
    const fn1 = makeStreamFn(async function* () {
      throw new Error("fn1 failed");
    });
    // eslint-disable-next-line require-yield
    const fn2 = makeStreamFn(async function* () {
      throw new Error("fn2 failed");
    });

    const wrapped = withStreamFallback([fn1, fn2]);

    await expect(collect(wrapped({ prompt: "fail" }))).rejects.toThrow(
      "fn2 failed"
    );
  });

  it("calls onFallback callback", async () => {
    // eslint-disable-next-line require-yield
    const fn1 = makeStreamFn(async function* () {
      throw new Error("fn1 failed");
    });
    const fn2 = makeStreamFn(async function* () {
      yield { delta: "ok", done: true };
    });
    const onFallback = vi.fn();

    const wrapped = withStreamFallback([fn1, fn2], { onFallback });
    await collect(wrapped({ prompt: "test" }));

    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith(expect.any(Error), 0);
  });

  it("throws when given empty array", () => {
    expect(() => withStreamFallback([])).toThrow(
      "withStreamFallback requires at least one function"
    );
  });

  it("falls back on mid-stream failure", async () => {
    const fn1 = makeStreamFn(async function* () {
      yield { delta: "partial", done: false };
      throw new Error("fn1 mid-stream");
    });
    const fn2 = makeStreamFn(async function* () {
      yield { delta: "fn2-complete", done: true };
    });

    const wrapped = withStreamFallback([fn1, fn2]);
    const chunks = await collect(wrapped({ prompt: "test" }));

    // First chunk from fn1, then fallback to fn2
    expect(chunks).toEqual([
      { delta: "partial", done: false },
      { delta: "fn2-complete", done: true },
    ]);
  });
});
