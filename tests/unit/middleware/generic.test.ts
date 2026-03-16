import { describe, it, expect, vi } from "vitest";
import { withRetry, withFallback } from "../../../packages/provider/openai/src";

interface Req {
  prompt: string;
}

interface Res {
  text: string;
}

function makeFn(
  impl: (req: Req, signal?: AbortSignal) => Promise<Res>
): (req: Req, signal?: AbortSignal) => Promise<Res> {
  return vi.fn(impl);
}

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = makeFn(async (req) => ({ text: req.prompt }));
    const wrapped = withRetry(fn);

    const result = await wrapped({ prompt: "hello" });

    expect(result).toEqual({ text: "hello" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient error and succeeds", async () => {
    let calls = 0;
    const fn = makeFn(async (req) => {
      calls += 1;
      if (calls < 3) {
        const err = new Error("rate limited") as Error & { status: number };
        err.status = 429;
        throw err;
      }
      return { text: req.prompt };
    });

    const wrapped = withRetry(fn, {
      retries: 3,
      baseMs: 1,
      jitter: false,
    });

    const result = await wrapped({ prompt: "retry me" });

    expect(result).toEqual({ text: "retry me" });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const fn = makeFn(async () => {
      const err = new Error("server error") as Error & { status: number };
      err.status = 500;
      throw err;
    });

    const wrapped = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });

    await expect(wrapped({ prompt: "fail" })).rejects.toThrow("server error");
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("does not retry on non-transient error (4xx)", async () => {
    const fn = makeFn(async () => {
      const err = new Error("bad request") as Error & { status: number };
      err.status = 400;
      throw err;
    });

    const wrapped = withRetry(fn, { retries: 3, baseMs: 1 });

    await expect(wrapped({ prompt: "fail" })).rejects.toThrow("bad request");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stops retrying when signal is aborted", async () => {
    const controller = new AbortController();
    let calls = 0;
    const fn = makeFn(async () => {
      calls += 1;
      if (calls === 1) {
        controller.abort();
        const err = new Error("error") as Error & { status: number };
        err.status = 500;
        throw err;
      }
      return { text: "ok" };
    });

    const wrapped = withRetry(fn, { retries: 3, baseMs: 1 });

    await expect(
      wrapped({ prompt: "abort" }, controller.signal)
    ).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes signal through to wrapped function", async () => {
    const controller = new AbortController();
    const fn = makeFn(async (_req, signal) => {
      return { text: signal?.aborted ? "aborted" : "active" };
    });

    const wrapped = withRetry(fn);
    const result = await wrapped({ prompt: "test" }, controller.signal);

    expect(result).toEqual({ text: "active" });
    expect(fn).toHaveBeenCalledWith({ prompt: "test" }, controller.signal);
  });

  it("retries errors without a status code", async () => {
    let calls = 0;
    const fn = makeFn(async (req) => {
      calls += 1;
      if (calls === 1) throw new Error("network failure");
      return { text: req.prompt };
    });

    const wrapped = withRetry(fn, { retries: 1, baseMs: 1, jitter: false });
    const result = await wrapped({ prompt: "recover" });

    expect(result).toEqual({ text: "recover" });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("withFallback", () => {
  it("returns result from first function", async () => {
    const fn1 = makeFn(async (req) => ({ text: `fn1:${req.prompt}` }));
    const fn2 = makeFn(async (req) => ({ text: `fn2:${req.prompt}` }));

    const wrapped = withFallback([fn1, fn2]);
    const result = await wrapped({ prompt: "hello" });

    expect(result).toEqual({ text: "fn1:hello" });
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(0);
  });

  it("falls back to second function on failure", async () => {
    const fn1 = makeFn(async () => {
      throw new Error("fn1 failed");
    });
    const fn2 = makeFn(async (req) => ({ text: `fn2:${req.prompt}` }));

    const wrapped = withFallback([fn1, fn2]);
    const result = await wrapped({ prompt: "fallback" });

    expect(result).toEqual({ text: "fn2:fallback" });
  });

  it("throws last error when all functions fail", async () => {
    const fn1 = makeFn(async () => {
      throw new Error("fn1 failed");
    });
    const fn2 = makeFn(async () => {
      throw new Error("fn2 failed");
    });

    const wrapped = withFallback([fn1, fn2]);

    await expect(wrapped({ prompt: "fail" })).rejects.toThrow("fn2 failed");
  });

  it("calls onFallback callback", async () => {
    const fn1 = makeFn(async () => {
      throw new Error("fn1 failed");
    });
    const fn2 = makeFn(async (req) => ({ text: req.prompt }));
    const onFallback = vi.fn();

    const wrapped = withFallback([fn1, fn2], { onFallback });
    await wrapped({ prompt: "test" });

    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith(expect.any(Error), 0);
  });

  it("throws when given empty array", () => {
    expect(() => withFallback([])).toThrow(
      "withFallback requires at least one function"
    );
  });

  it("passes signal through to functions", async () => {
    const controller = new AbortController();
    const fn1 = makeFn(async () => {
      throw new Error("fn1 failed");
    });
    const fn2 = makeFn(async (_req, signal) => ({
      text: signal?.aborted ? "aborted" : "active",
    }));

    const wrapped = withFallback([fn1, fn2]);
    const result = await wrapped({ prompt: "test" }, controller.signal);

    expect(result).toEqual({ text: "active" });
    expect(fn2).toHaveBeenCalledWith({ prompt: "test" }, controller.signal);
  });
});
