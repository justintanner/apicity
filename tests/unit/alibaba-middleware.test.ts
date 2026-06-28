// Tests for Alibaba middleware functions — pure HOFs, no API calls
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  withRetry,
  withFallback,
  createRateLimiter,
  withRateLimit,
} from "../../packages/provider/alibaba/src/middleware";

// Drives an async action to completion under fake timers without burning
// wall-clock. Mirrors the fal/xai test-speedup pattern (ac-6lf6): real backoff
// math is exercised, only the wait is virtualized.
async function runWithFakeTimers<T>(action: () => Promise<T>): Promise<T> {
  const result = action();
  result.catch(() => {});
  await vi.runAllTimersAsync();
  await Promise.resolve();
  return await result;
}
describe("withRetry", () => {
  // Fake timers for the whole describe: withRetry's backoff uses setTimeout
  // internally, so without this every retry test pays real baseMs (default
  // 300ms) of wall-clock. Scoped here so the rate-limiter describes below —
  // which genuinely test wall-clock timeouts — keep the real clock.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return result on first success", async () => {
    const fn = async (x: number) => x * 2;
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await runWithFakeTimers(() => retried(5))).toBe(10);
  });

  it("should retry on transient error and succeed", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 3) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    expect(await runWithFakeTimers(() => retried(null))).toBe("ok");
    expect(calls).toBe(3);
  });

  it("should throw after exhausting retries", async () => {
    const fn = async () => {
      throw Object.assign(new Error("always fail"), { status: 500 });
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    await expect(runWithFakeTimers(() => retried(null))).rejects.toThrow(
      "always fail"
    );
  });

  it("should not retry on 400 errors (non-transient)", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("bad request"), { status: 400 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(runWithFakeTimers(() => retried(null))).rejects.toThrow(
      "bad request"
    );
    expect(calls).toBe(1);
  });

  it("should treat 429 as transient (rate limit)", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("rate"), { status: 429 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await runWithFakeTimers(() => retried(null))).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat 500+ errors as transient", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("server"), { status: 502 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await runWithFakeTimers(() => retried(null))).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should pass request and signal through to wrapped function", async () => {
    const fn = async (req: string, signal?: AbortSignal) => {
      return `${req}-${signal ? "has-signal" : "no-signal"}`;
    };
    const retried = withRetry(fn);
    const controller = new AbortController();
    expect(
      await runWithFakeTimers(() => retried("hello", controller.signal))
    ).toBe("hello-has-signal");
  });

  it("should stop retrying when aborted", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("fail"), { status: 500 });
    };
    const retried = withRetry(fn, { retries: 5, baseMs: 1, jitter: false });

    const controller = new AbortController();
    controller.abort();

    await expect(
      runWithFakeTimers(() => retried(null, controller.signal))
    ).rejects.toThrow("fail");
    expect(calls).toBe(1);
  });

  it("should use default retry options when not specified", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };
    // Defaults (baseMs=300, retries=2, jitter=true) still drive the real delay
    // math; the fake clock just skips the ~300ms wait it used to burn.
    const retried = withRetry(fn);
    expect(await runWithFakeTimers(() => retried(null))).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should calculate exponential backoff without jitter", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 3) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };

    const retried = withRetry(fn, {
      retries: 3,
      baseMs: 100,
      factor: 2,
      jitter: false,
    });

    // Assert the SCHEDULED delays (100, 200) rather than burning them as
    // wall-clock; the fake clock virtualizes the wait, the spy captures the
    // real ms handed to setTimeout.
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    await runWithFakeTimers(() => retried(null));
    const delays = setTimeoutSpy.mock.calls.map(
      ([, timeout]) => timeout as number
    );
    expect(delays).toEqual([100, 200]);
    setTimeoutSpy.mockRestore();
    expect(calls).toBe(3);
  });

  it("should handle errors with statusCode property", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("fail"), { statusCode: 503 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await runWithFakeTimers(() => retried(null))).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should handle errors with code property", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("fail"), { code: 500 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await runWithFakeTimers(() => retried(null))).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat unknown errors without status as transient", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw new Error("network error");
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await runWithFakeTimers(() => retried(null))).toBe("ok");
    expect(calls).toBe(2);
  });
});

describe("withFallback", () => {
  it("should return result from first function on success", async () => {
    const fn1 = async () => "primary";
    const fn2 = async () => "secondary";
    const fb = withFallback([fn1, fn2]);
    expect(await fb(null)).toBe("primary");
  });

  it("should fall back to second function on first failure", async () => {
    const fn1 = async () => {
      throw new Error("primary down");
    };
    const fn2 = async () => "secondary";
    const fb = withFallback([fn1, fn2]);
    expect(await fb(null)).toBe("secondary");
  });

  it("should try third function when first two fail", async () => {
    const fn1 = async () => {
      throw new Error("first");
    };
    const fn2 = async () => {
      throw new Error("second");
    };
    const fn3 = async () => "third";
    const fb = withFallback([fn1, fn2, fn3]);
    expect(await fb(null)).toBe("third");
  });

  it("should throw last error when all functions fail", async () => {
    const fn1 = async () => {
      throw new Error("first");
    };
    const fn2 = async () => {
      throw new Error("second");
    };
    const fb = withFallback([fn1, fn2]);
    await expect(fb(null)).rejects.toThrow("second");
  });

  it("should call onFallback callback on each failure", async () => {
    const errors: Array<{ error: unknown; index: number }> = [];
    const fn1 = async () => {
      throw new Error("fail1");
    };
    const fn2 = async () => {
      throw new Error("fail2");
    };
    const fn3 = async () => "ok";
    const fb = withFallback([fn1, fn2, fn3], {
      onFallback: (error, index) => errors.push({ error, index }),
    });
    await fb(null);
    expect(errors).toHaveLength(2);
    expect(errors[0].index).toBe(0);
    expect(errors[1].index).toBe(1);
    expect((errors[0].error as Error).message).toBe("fail1");
    expect((errors[1].error as Error).message).toBe("fail2");
  });

  it("should throw if given empty array", () => {
    expect(() => withFallback([])).toThrow(
      "withFallback requires at least one function"
    );
  });

  it("should work with single function that succeeds", async () => {
    const fn1 = async () => "only";
    const fb = withFallback([fn1]);
    expect(await fb(null)).toBe("only");
  });

  it("should throw from single function when it fails", async () => {
    const fn1 = async () => {
      throw new Error("only fail");
    };
    const fb = withFallback([fn1]);
    await expect(fb(null)).rejects.toThrow("only fail");
  });

  it("should pass request and signal through to all functions", async () => {
    const fn1 = async (req: string, _signal?: AbortSignal) => {
      throw new Error(`fail-${req}`);
    };
    const fn2 = async (req: string, signal?: AbortSignal) => {
      return `${req}-${signal ? "has-signal" : "no-signal"}`;
    };
    const fb = withFallback([fn1, fn2]);
    const controller = new AbortController();
    expect(await fb("test", controller.signal)).toBe("test-has-signal");
  });

  it("should work with complex return types", async () => {
    interface Result {
      data: string;
      count: number;
    }
    const fn1 = async (): Promise<Result> => {
      throw new Error("fail");
    };
    const fn2 = async (): Promise<Result> => ({ data: "success", count: 42 });
    const fb = withFallback<Result, string>([fn1, fn2]);
    const result = await fb("ignored");
    expect(result).toEqual({ data: "success", count: 42 });
  });
});

describe("createRateLimiter", () => {
  it("should create a limiter with default options", () => {
    const limiter = createRateLimiter();
    expect(limiter.active).toBe(0);
    expect(limiter.queued).toBe(0);
  });

  it("should allow immediate acquire when unconstrained", async () => {
    const limiter = createRateLimiter();
    await expect(
      (limiter as unknown as { _acquire: () => Promise<void> })._acquire()
    ).resolves.toBeUndefined();
  });

  it("should track active count after acquire", async () => {
    const limiter = createRateLimiter();
    const internal = limiter as unknown as {
      _acquire: () => Promise<void>;
      _release: () => void;
    };
    await internal._acquire();
    expect(limiter.active).toBe(1);
    internal._release();
    expect(limiter.active).toBe(0);
  });

  it("should enforce concurrent limit", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    const internal = limiter as unknown as {
      _acquire: () => Promise<void>;
      _release: () => void;
    };
    await internal._acquire();
    const second = internal._acquire();
    // second should be queued, not resolved yet
    expect(limiter.queued).toBe(1);
    internal._release();
    await second;
    expect(limiter.queued).toBe(0);
  });

  it("should enforce rpm limit", async () => {
    const limiter = createRateLimiter({ rpm: 1 });
    const internal = limiter as unknown as {
      _acquire: () => Promise<void>;
      _release: () => void;
    };
    await internal._acquire();
    internal._release();
    // Next acquire should be queued because rpm window is 60s
    const second = internal._acquire();
    expect(limiter.queued).toBe(1);
    limiter.dispose();
    await expect(second).rejects.toThrow("disposed");
  });

  it("should reject queued requests on dispose", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    const internal = limiter as unknown as {
      _acquire: () => Promise<void>;
    };
    await internal._acquire();
    const second = internal._acquire();
    limiter.dispose();
    await expect(second).rejects.toThrow("disposed");
  });

  it("should reject acquire after dispose", async () => {
    const limiter = createRateLimiter();
    limiter.dispose();
    const internal = limiter as unknown as { _acquire: () => Promise<void> };
    await expect(internal._acquire()).rejects.toThrow("disposed");
  });

  it("should handle abort signal while queued", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    const internal = limiter as unknown as {
      _acquire: (signal?: AbortSignal) => Promise<void>;
    };
    await internal._acquire();
    const controller = new AbortController();
    const second = internal._acquire(controller.signal);
    controller.abort();
    await expect(second).rejects.toThrow("Rate limit queue aborted");
  });

  it("should reject immediately if signal already aborted", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    const internal = limiter as unknown as {
      _acquire: (signal?: AbortSignal) => Promise<void>;
    };
    await internal._acquire();
    const controller = new AbortController();
    controller.abort();
    await expect(internal._acquire(controller.signal)).rejects.toThrow(
      "Rate limit queue aborted"
    );
  });

  it("should timeout queued requests", async () => {
    const limiter = createRateLimiter({ concurrent: 1, maxQueueMs: 10 });
    const internal = limiter as unknown as {
      _acquire: () => Promise<void>;
      _release: () => void;
    };
    await internal._acquire();
    await expect(internal._acquire()).rejects.toThrow("timeout");
    internal._release();
  });

  it("should allow custom maxQueueMs per acquire", async () => {
    const limiter = createRateLimiter({ concurrent: 1, maxQueueMs: 10000 });
    const internal = limiter as unknown as {
      _acquire: (_signal?: AbortSignal, maxQueueMs?: number) => Promise<void>;
    };
    await (limiter as unknown as { _acquire: () => Promise<void> })._acquire();
    await expect(internal._acquire(undefined, 10)).rejects.toThrow("timeout");
  });
});

describe("withRateLimit", () => {
  it("should execute function when limiter allows", async () => {
    const limiter = createRateLimiter();
    const fn = async () => "result";
    const limited = withRateLimit(fn, limiter);
    expect(await limited(null)).toBe("result");
  });

  it("should release slot after function completes", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    const fn = async () => "result";
    const limited = withRateLimit(fn, limiter);
    await limited(null);
    expect(limiter.active).toBe(0);
  });

  it("should release slot even when function throws", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    const fn = async () => {
      throw new Error("fail");
    };
    const limited = withRateLimit(fn, limiter);
    await expect(limited(null)).rejects.toThrow("fail");
    expect(limiter.active).toBe(0);
  });

  it("should pass request and signal through", async () => {
    const limiter = createRateLimiter();
    const fn = async (req: string, signal?: AbortSignal) => {
      return `${req}-${signal ? "has-signal" : "no-signal"}`;
    };
    const limited = withRateLimit(fn, limiter);
    const controller = new AbortController();
    expect(await limited("hello", controller.signal)).toBe("hello-has-signal");
  });

  it("should respect maxQueueMs option", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    // Genuine wall-clock test: the slow call must hold the lone concurrency
    // slot long enough for the second call's 10ms queue timeout to fire, so
    // the two real timers must race on the platform clock. Deterministic fake
    // timers won't reproduce the "slot still held while timeout elapses" race.
    const slow = withRateLimit(async () => {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 100);
      await promise;
      return "slow";
    }, limiter);
    // Start slow call without awaiting
    const slowPromise = slow(null);
    // Second call should timeout because concurrent=1 and first hasn't finished
    const limited = withRateLimit(async () => "fast", limiter, {
      maxQueueMs: 10,
    });
    await expect(limited(null)).rejects.toThrow("timeout");
    await slowPromise;
  });
});
