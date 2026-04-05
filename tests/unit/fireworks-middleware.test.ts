import { describe, it, expect, vi } from "vitest";

import {
  withRetry,
  withFallback,
  type RetryOptions,
  type FallbackOptions,
} from "../../packages/provider/fireworks/src/middleware";

describe("withRetry", () => {
  it("should retry on transient errors (429, 500, 529)", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("rate limited"), { status: 429 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should retry on 500 errors", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("server error"), { status: 500 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should retry on 529 errors", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("overloaded"), { status: 529 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should not retry on 400 errors", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      throw Object.assign(new Error("bad request"), { status: 400 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("bad request");
    expect(calls).toBe(1);
  });

  it("should not retry on 401 errors", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      throw Object.assign(new Error("unauthorized"), { status: 401 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("unauthorized");
    expect(calls).toBe(1);
  });

  it("should not retry on 403 errors", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      throw Object.assign(new Error("forbidden"), { status: 403 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("forbidden");
    expect(calls).toBe(1);
  });

  it("should not retry on 404 errors", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      throw Object.assign(new Error("not found"), { status: 404 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("not found");
    expect(calls).toBe(1);
  });

  it("should not retry on 422 errors", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      throw Object.assign(new Error("unprocessable"), { status: 422 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("unprocessable");
    expect(calls).toBe(1);
  });

  it("should calculate exponential backoff", async () => {
    const delays: number[] = [];
    let lastTime = Date.now();
    const fn = async (_req: null) => {
      const now = Date.now();
      if (delays.length > 0) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      if (delays.length < 2) {
        throw Object.assign(new Error("fail"), { status: 500 });
      }
      return "ok";
    };
    const retried = withRetry(fn, {
      retries: 3,
      baseMs: 10,
      factor: 2,
      jitter: false,
    });
    await retried(null);
    expect(delays.length).toBe(2);
    // Second delay should be roughly 2x the first (with some tolerance)
    expect(delays[1]).toBeGreaterThanOrEqual(delays[0] * 1.5);
  });

  it("should apply jitter to delay when enabled", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 10, jitter: true });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should not apply jitter when disabled", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should abort when signal is triggered", async () => {
    let calls = 0;
    const fn = async (_req: null, signal?: AbortSignal) => {
      calls++;
      if (signal?.aborted) throw new Error("aborted");
      throw Object.assign(new Error("fail"), { status: 500 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    const controller = new AbortController();
    controller.abort();
    await expect(retried(null, controller.signal)).rejects.toThrow();
    expect(calls).toBe(1);
  });

  it("should return result on first success without retry", async () => {
    const fn = async (x: number) => x * 2;
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(5)).toBe(10);
  });

  it("should throw after exhausting retries", async () => {
    const fn = async (_req: null) => {
      throw Object.assign(new Error("always fail"), { status: 500 });
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("always fail");
  });

  it("should use default retry options when not specified", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };
    const retried = withRetry(fn); // uses defaults
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat errors without status as transient", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2) throw new Error("network error");
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat statusCode property as status", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("server error"), { statusCode: 500 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat code property as status", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("server error"), { code: 500 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should pass request and signal through to function", async () => {
    const fn = async (req: string, signal?: AbortSignal) => {
      return `${req}-${signal ? "has-signal" : "no-signal"}`;
    };
    const retried = withRetry(fn);
    const controller = new AbortController();
    expect(await retried("hello", controller.signal)).toBe("hello-has-signal");
  });

  it("should handle 502 as transient", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("bad gateway"), { status: 502 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should handle 503 as transient", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("service unavailable"), { status: 503 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should handle 504 as transient", async () => {
    let calls = 0;
    const fn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("gateway timeout"), { status: 504 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });
});

describe("withFallback", () => {
  it("should try functions sequentially", async () => {
    const fn1 = async (_req: null) => {
      throw new Error("first down");
    };
    const fn2 = async (_req: null) => {
      throw new Error("second down");
    };
    const fn3 = async (_req: null) => "third";
    const fb = withFallback([fn1, fn2, fn3]);
    expect(await fb(null)).toBe("third");
  });

  it("should return result from first function on success", async () => {
    const fn1 = async (_req: null) => "primary";
    const fn2 = async (_req: null) => "secondary";
    const fb = withFallback([fn1, fn2]);
    expect(await fb(null)).toBe("primary");
  });

  it("should call onFallback callback", async () => {
    const errors: Array<{ error: unknown; index: number }> = [];
    const fn1 = async (_req: null) => {
      throw new Error("fail1");
    };
    const fn2 = async (_req: null) => {
      throw new Error("fail2");
    };
    const fn3 = async (_req: null) => "ok";
    const opts: FallbackOptions = {
      onFallback: (error, index) => errors.push({ error, index }),
    };
    const fb = withFallback([fn1, fn2, fn3], opts);
    await fb(null);
    expect(errors).toHaveLength(2);
    expect(errors[0].index).toBe(0);
    expect(errors[1].index).toBe(1);
  });

  it("should throw when all functions fail", async () => {
    const fn1 = async (_req: null) => {
      throw new Error("first");
    };
    const fn2 = async (_req: null) => {
      throw new Error("second");
    };
    const fb = withFallback([fn1, fn2]);
    await expect(fb(null)).rejects.toThrow("second");
  });

  it("should throw if given empty array", () => {
    expect(() => withFallback([])).toThrow(
      "withFallback requires at least one function"
    );
  });

  it("should work with single function array", async () => {
    const fn = async (_req: null) => "only";
    const fb = withFallback([fn]);
    expect(await fb(null)).toBe("only");
  });

  it("should throw from single function array on failure", async () => {
    const fn = async (_req: null) => {
      throw new Error("only fails");
    };
    const fb = withFallback([fn]);
    await expect(fb(null)).rejects.toThrow("only fails");
  });

  it("should pass request and signal through", async () => {
    const fn1 = async (req: string | null, signal?: AbortSignal) => {
      return `fn1-${req}-${signal ? "signal" : "no-signal"}`;
    };
    const fn2 = async (req: string | null, signal?: AbortSignal) => {
      return `fn2-${req}-${signal ? "signal" : "no-signal"}`;
    };
    const fb = withFallback([fn1, fn2]);
    const controller = new AbortController();
    expect(await fb("test", controller.signal)).toBe("fn1-test-signal");
  });

  it("should pass request and signal to fallback function", async () => {
    const fn1 = async (_req: string | null) => {
      throw new Error("fail");
    };
    const fn2 = async (req: string | null, signal?: AbortSignal) => {
      return `fn2-${req}-${signal ? "signal" : "no-signal"}`;
    };
    const fb = withFallback([fn1, fn2]);
    const controller = new AbortController();
    expect(await fb("test", controller.signal)).toBe("fn2-test-signal");
  });

  it("should preserve error type in callback", async () => {
    let capturedError: unknown;
    const fn1 = async (_req: null) => {
      throw Object.assign(new Error("typed error"), {
        status: 503,
        code: "E503",
      });
    };
    const fn2 = async (_req: null) => "ok";
    const opts: FallbackOptions = {
      onFallback: (error) => {
        capturedError = error;
      },
    };
    const fb = withFallback([fn1, fn2], opts);
    await fb(null);
    expect(capturedError).toBeInstanceOf(Error);
    expect((capturedError as Error).message).toBe("typed error");
  });
});

describe("RetryOptions type", () => {
  it("accepts all retry options", () => {
    const opts: RetryOptions = {
      retries: 5,
      baseMs: 100,
      factor: 3,
      jitter: true,
    };
    expect(opts.retries).toBe(5);
    expect(opts.baseMs).toBe(100);
    expect(opts.factor).toBe(3);
    expect(opts.jitter).toBe(true);
  });

  it("accepts partial retry options", () => {
    const opts: RetryOptions = {
      retries: 3,
    };
    expect(opts.retries).toBe(3);
  });

  it("accepts empty retry options", () => {
    const opts: RetryOptions = {};
    expect(opts).toEqual({});
  });
});

describe("FallbackOptions type", () => {
  it("accepts onFallback callback", () => {
    const opts: FallbackOptions = {
      onFallback: (error, index) => {
        console.log(`Fallback ${index}: ${error}`);
      },
    };
    expect(opts.onFallback).toBeDefined();
  });

  it("accepts empty fallback options", () => {
    const opts: FallbackOptions = {};
    expect(opts).toEqual({});
  });
});

describe("middleware integration", () => {
  it("withRetry can be combined with withFallback", async () => {
    let calls = 0;
    const unreliableFn = async (_req: null) => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("transient"), { status: 500 });
      return "success";
    };
    const retriedFn = withRetry(unreliableFn, {
      retries: 2,
      baseMs: 1,
      jitter: false,
    });

    const fn1 = async (_req: null) => {
      throw new Error("always fails");
    };

    const fb = withFallback([fn1, retriedFn]);
    expect(await fb(null)).toBe("success");
    expect(calls).toBe(2);
  });

  it("withFallback preserves return type", async () => {
    interface MyResponse {
      data: string;
      status: number;
    }
    const fn = async (_req: null): Promise<MyResponse> => {
      return { data: "test", status: 200 };
    };
    const fb = withFallback([fn]);
    const result = await fb(null);
    expect(result.data).toBe("test");
    expect(result.status).toBe(200);
  });

  it("withRetry preserves return type", async () => {
    interface MyResponse {
      value: number;
    }
    const fn = async (_req: null): Promise<MyResponse> => {
      return { value: 42 };
    };
    const retried = withRetry(fn);
    const result = await retried(null);
    expect(result.value).toBe(42);
  });
});
