import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  withRetry,
  withFallback,
} from "../../packages/provider/anthropic/src/middleware";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Drives an async action forward under fake timers without burning wall-clock.
// Mirrors the pattern established by the fal/xai test-speedup epic (ac-6lf6):
// kick off the action (its retry/backoff `setTimeout` calls are queued on the
// fake clock), flush every scheduled timer + the microtasks they gate, then
// settle the result. Real backoff math is still exercised — only the wait is
// virtualized.
async function runWithFakeTimers<T>(action: () => Promise<T>): Promise<T> {
  const result = action();
  result.catch(() => {});
  await vi.runAllTimersAsync();
  await Promise.resolve();
  return await result;
}

describe("anthropic middleware", () => {
  describe("withRetry", () => {
    it("should succeed on first attempt if no errors", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const wrapped = withRetry(fn);

      const result = await runWithFakeTimers(() => wrapped("req"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("req", undefined);
    });

    it("should retry on transient errors (429, 500, 529)", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ statusCode: 500 })
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("req"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should retry on 529 overloaded error", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ code: 529 })
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("req"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry on server errors (>= 500)", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 502 })
        .mockRejectedValueOnce({ status: 503 })
        .mockRejectedValueOnce({ status: 504 })
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 4, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("req"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it("should not retry on 400 errors", async () => {
      const error = { status: 400, message: "Bad Request" };
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

      await expect(runWithFakeTimers(() => wrapped("req"))).rejects.toEqual(
        error
      );
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not retry on 401 errors", async () => {
      const error = { statusCode: 401 };
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

      await expect(runWithFakeTimers(() => wrapped("req"))).rejects.toEqual(
        error
      );
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not retry on 403 errors", async () => {
      const error = { code: 403 };
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

      await expect(runWithFakeTimers(() => wrapped("req"))).rejects.toEqual(
        error
      );
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not retry on 404 errors", async () => {
      const error = { status: 404 };
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

      await expect(runWithFakeTimers(() => wrapped("req"))).rejects.toEqual(
        error
      );
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should treat errors without status as transient", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("req"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should calculate exponential backoff", async () => {
      const fn = vi.fn().mockImplementation(() => {
        throw { status: 500 };
      });

      const wrapped = withRetry(fn, {
        retries: 3,
        baseMs: 100,
        factor: 2,
        jitter: false,
      });

      // Assert the SCHEDULED delays (baseMs * factor^(attempt-1)) rather than
      // burning 100+200+400ms of wall-clock. The fake clock virtualizes the
      // wait; the spy captures the real ms handed to setTimeout.
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      await runWithFakeTimers(() => wrapped("req").catch(() => {}));
      const delays = setTimeoutSpy.mock.calls.map(
        ([, timeout]) => timeout as number
      );
      expect(delays).toEqual([100, 200, 400]);
      setTimeoutSpy.mockRestore();

      expect(fn).toHaveBeenCalledTimes(4);
    });

    it("should apply jitter to delay when enabled", async () => {
      const fn = vi.fn().mockRejectedValue({ status: 500 });

      const delays: number[] = [];
      // Jitter multiplies each delay by a random 0.8–1.2 factor, so run a few
      // iterations and assert every scheduled delay lands in that window and
      // that the randomization actually produces variance.
      for (let i = 0; i < 5; i++) {
        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
        const wrapped = withRetry(fn, {
          retries: 1,
          baseMs: 100,
          jitter: true,
        });
        await runWithFakeTimers(() => wrapped("req").catch(() => {}));
        const delay = setTimeoutSpy.mock.calls.at(-1)?.[1];
        if (typeof delay === "number") {
          delays.push(delay);
        }
        setTimeoutSpy.mockRestore();
      }

      for (const delay of delays) {
        expect(delay).toBeGreaterThanOrEqual(80);
        expect(delay).toBeLessThanOrEqual(120);
      }
      expect([...new Set(delays)].length).toBeGreaterThan(1);
    });

    it("should respect custom retry options", async () => {
      const fn = vi.fn().mockRejectedValue({ status: 429 });

      const wrapped = withRetry(fn, {
        retries: 1,
        baseMs: 10,
        factor: 3,
        jitter: false,
      });

      await runWithFakeTimers(() => wrapped("req").catch(() => {}));

      // 1 retry means 2 total calls
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should abort when signal is triggered", async () => {
      const fn = vi.fn().mockImplementation((_req, signal) => {
        if (signal?.aborted) {
          throw new Error("Aborted");
        }
        throw { status: 500 };
      });

      const controller = new AbortController();
      const wrapped = withRetry(fn, {
        retries: 5,
        baseMs: 10,
        jitter: false,
      });

      // Abort immediately before calling.
      controller.abort();

      await expect(
        runWithFakeTimers(() => wrapped("req", controller.signal))
      ).rejects.toThrow("Aborted");

      // Should have made only 1 attempt before aborting
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should pass abort signal to wrapped function", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const controller = new AbortController();

      const wrapped = withRetry(fn);
      await runWithFakeTimers(() => wrapped("req", controller.signal));

      expect(fn).toHaveBeenCalledWith("req", controller.signal);
    });

    it("should not retry if signal is already aborted", async () => {
      const error = { status: 500 };
      const fn = vi.fn().mockRejectedValue(error);

      const controller = new AbortController();
      controller.abort();

      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

      await expect(
        runWithFakeTimers(() => wrapped("req", controller.signal))
      ).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should use default values when options not provided", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValue("success");

      // Defaults (baseMs=300, factor=2, retries=2, jitter=true) still drive the
      // real delay math; the fake clock just skips the ~900ms wait it used to
      // burn on every run.
      const wrapped = withRetry(fn, {});
      const result = await runWithFakeTimers(() => wrapped("req"));

      expect(result).toBe("success");
      // Default retries is 2
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw after exhausting all retries", async () => {
      const error = { status: 500, message: "Server Error" };
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });

      await expect(runWithFakeTimers(() => wrapped("req"))).rejects.toEqual(
        error
      );
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe("withFallback", () => {
    it("should call first function and return result", async () => {
      const fn1 = vi.fn().mockResolvedValue("result1");
      const fn2 = vi.fn().mockResolvedValue("result2");

      const wrapped = withFallback([fn1, fn2]);
      const result = await wrapped("req");

      expect(result).toBe("result1");
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(0);
    });

    it("should try functions sequentially when first fails", async () => {
      const error = new Error("fn1 failed");
      const fn1 = vi.fn().mockRejectedValue(error);
      const fn2 = vi.fn().mockResolvedValue("result2");

      const wrapped = withFallback([fn1, fn2]);
      const result = await wrapped("req");

      expect(result).toBe("result2");
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("should try all functions until one succeeds", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("error1"));
      const fn2 = vi.fn().mockRejectedValue(new Error("error2"));
      const fn3 = vi.fn().mockResolvedValue("success");

      const wrapped = withFallback([fn1, fn2, fn3]);
      const result = await wrapped("req");

      expect(result).toBe("success");
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(1);
    });

    it("should call onFallback callback when falling back", async () => {
      const error = new Error("failed");
      const fn1 = vi.fn().mockRejectedValue(error);
      const fn2 = vi.fn().mockResolvedValue("success");
      const onFallback = vi.fn();

      const wrapped = withFallback([fn1, fn2], { onFallback });
      await wrapped("req");

      expect(onFallback).toHaveBeenCalledTimes(1);
      expect(onFallback).toHaveBeenCalledWith(error, 0);
    });

    it("should call onFallback for each fallback", async () => {
      const error1 = new Error("error1");
      const error2 = new Error("error2");
      const fn1 = vi.fn().mockRejectedValue(error1);
      const fn2 = vi.fn().mockRejectedValue(error2);
      const fn3 = vi.fn().mockResolvedValue("success");
      const onFallback = vi.fn();

      const wrapped = withFallback([fn1, fn2, fn3], { onFallback });
      await wrapped("req");

      expect(onFallback).toHaveBeenCalledTimes(2);
      expect(onFallback).toHaveBeenNthCalledWith(1, error1, 0);
      expect(onFallback).toHaveBeenNthCalledWith(2, error2, 1);
    });

    it("should throw when all functions fail", async () => {
      const error1 = new Error("error1");
      const error2 = new Error("error2");
      const fn1 = vi.fn().mockRejectedValue(error1);
      const fn2 = vi.fn().mockRejectedValue(error2);

      const wrapped = withFallback([fn1, fn2]);

      await expect(wrapped("req")).rejects.toBe(error2);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("should pass request and signal to all functions", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("error"));
      const fn2 = vi.fn().mockResolvedValue("success");
      const controller = new AbortController();

      const wrapped = withFallback([fn1, fn2]);
      await wrapped("my-req", controller.signal);

      expect(fn1).toHaveBeenCalledWith("my-req", controller.signal);
      expect(fn2).toHaveBeenCalledWith("my-req", controller.signal);
    });

    it("should throw error when no functions provided", () => {
      expect(() => withFallback([])).toThrow(
        "withFallback requires at least one function"
      );
    });

    it("should work with single function", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      const wrapped = withFallback([fn]);
      const result = await wrapped("req");

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should work with single failing function", async () => {
      const error = new Error("only fn failed");
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withFallback([fn]);

      await expect(wrapped("req")).rejects.toBe(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should handle mixed success and failure patterns", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("always fails"));
      const fn2 = vi.fn().mockResolvedValue("works");
      const fn3 = vi.fn().mockResolvedValue("also works");

      const wrapped = withFallback([fn1, fn2, fn3]);
      const result = await wrapped("req");

      // Should stop at fn2 since it succeeds
      expect(result).toBe("works");
      expect(fn3).toHaveBeenCalledTimes(0);
    });

    it("should work without options", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("error"));
      const fn2 = vi.fn().mockResolvedValue("success");

      const wrapped = withFallback([fn1, fn2]);
      const result = await wrapped("req");

      expect(result).toBe("success");
    });
  });

  describe("combined usage", () => {
    it("should work withRetry wrapping withFallback", async () => {
      const fn1 = vi.fn().mockRejectedValue({ status: 500 });
      const fn2 = vi.fn().mockResolvedValue("fallback-success");

      const fallback = withFallback([fn1, fn2]);
      const retryingFallback = withRetry(fallback, {
        retries: 2,
        baseMs: 10,
        jitter: false,
      });

      const result = await runWithFakeTimers(() => retryingFallback("req"));

      // fn1 always fails, so fallback to fn2
      // withFallback succeeds (fn2 works), so withRetry doesn't retry
      expect(result).toBe("fallback-success");
      expect(fn1).toHaveBeenCalledTimes(1); // fn1 called once, then fallback
      expect(fn2).toHaveBeenCalledTimes(1); // fn2 called once as fallback
    });

    it("should work withFallback wrapping withRetry", async () => {
      const fn1 = withRetry(
        vi.fn().mockRejectedValue({ status: 400 }), // non-transient error
        { retries: 2, baseMs: 10, jitter: false }
      );
      const fn2 = vi.fn().mockResolvedValue("success");

      const wrapped = withFallback([fn1, fn2]);
      const result = await runWithFakeTimers(() => wrapped("req"));

      // fn1 retries but fails on 400, falls back to fn2
      expect(result).toBe("success");
    });
  });
});
