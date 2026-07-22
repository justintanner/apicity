import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Middleware functions
import {
  withRetry,
  withFallback,
  withStreamRetry,
  withStreamFallback,
} from "../../packages/provider/kimicoding/src/middleware";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Drives an async action forward under fake timers without burning wall-clock.
// Kick off the action (its retry/backoff `setTimeout` calls queue on the fake
// clock), flush every scheduled timer and the microtasks they gate — including
// those an async generator yields between — then settle the result. Mirrors the
// fal/xai test-speedup pattern (ac-6lf6); real backoff math is still exercised,
// only the wait is virtualized.
async function runWithFakeTimers<T>(action: () => Promise<T>): Promise<T> {
  const result = action();
  result.catch(() => {});
  await vi.runAllTimersAsync();
  await Promise.resolve();
  return await result;
}

describe("middleware", () => {
  describe("withRetry", () => {
    it("should return result on first successful call", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const wrapped = withRetry(fn);

      const result = await runWithFakeTimers(() => wrapped("request"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("request", undefined);
    });

    it("should retry on transient error and eventually succeed", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Server error"))
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("request"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw after max retries", async () => {
      const error = new Error("Persistent failure");
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });

      await expect(runWithFakeTimers(() => wrapped("request"))).rejects.toThrow(
        "Persistent failure"
      );
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("should not retry on non-transient errors (4xx)", async () => {
      const error = { status: 400 };
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withRetry(fn);

      await expect(runWithFakeTimers(() => wrapped("request"))).rejects.toEqual(
        error
      );
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on 429 rate limit", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("request"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry on 5xx errors", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ statusCode: 503 })
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("request"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry when error has code property", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ code: 500 })
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("request"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry on unknown errors (no status)", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
      const result = await runWithFakeTimers(() => wrapped("request"));

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should respect abort signal", async () => {
      // fn rejects with a transient error; withRetry rethrows without retrying
      // because the signal is already aborted (checked on error).
      const fn = vi.fn().mockRejectedValue(new Error("transient"));

      const controller = new AbortController();
      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

      // Abort immediately
      controller.abort();

      await expect(
        runWithFakeTimers(() => wrapped("request", controller.signal))
      ).rejects.toThrow("transient");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should use custom retry options", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockRejectedValueOnce(new Error("Error 3"))
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, {
        retries: 4,
        baseMs: 20,
        factor: 3,
        jitter: false,
      });

      const result = await runWithFakeTimers(() => wrapped("request"));
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it("should apply jitter to delay", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Error"))
        .mockResolvedValue("success");

      const wrapped = withRetry(fn, { retries: 2, baseMs: 100, jitter: true });

      // Assert the SCHEDULED delay (jittered to 0.8–1.2 × baseMs) rather than
      // burning ~100ms of wall-clock. The fake clock virtualizes the wait; the
      // spy captures the real ms handed to setTimeout.
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      await runWithFakeTimers(() => wrapped("request"));
      const delay = setTimeoutSpy.mock.calls.at(-1)?.[1];
      setTimeoutSpy.mockRestore();

      expect(delay).toBeGreaterThanOrEqual(80);
      expect(delay).toBeLessThanOrEqual(120);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should pass signal to wrapped function", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const wrapped = withRetry(fn);

      const controller = new AbortController();
      await runWithFakeTimers(() => wrapped("request", controller.signal));

      expect(fn).toHaveBeenCalledWith("request", controller.signal);
    });
  });

  describe("withFallback", () => {
    it("should return result from first function if successful", async () => {
      const fn1 = vi.fn().mockResolvedValue("first");
      const fn2 = vi.fn().mockResolvedValue("second");

      const wrapped = withFallback([fn1, fn2]);
      const result = await wrapped("request");

      expect(result).toBe("first");
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();
    });

    it("should fallback to second function on first failure", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("First failed"));
      const fn2 = vi.fn().mockResolvedValue("second");

      const wrapped = withFallback([fn1, fn2]);
      const result = await wrapped("request");

      expect(result).toBe("second");
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("should throw last error when all functions fail", async () => {
      const error1 = new Error("First failed");
      const error2 = new Error("Second failed");
      const fn1 = vi.fn().mockRejectedValue(error1);
      const fn2 = vi.fn().mockRejectedValue(error2);

      const wrapped = withFallback([fn1, fn2]);

      await expect(wrapped("request")).rejects.toThrow("Second failed");
    });

    it("should throw error when empty array provided", () => {
      expect(() => withFallback([])).toThrow(
        "withFallback requires at least one function"
      );
    });

    it("should call onFallback callback when falling back", async () => {
      const onFallback = vi.fn();
      const error = new Error("Failed");
      const fn1 = vi.fn().mockRejectedValue(error);
      const fn2 = vi.fn().mockResolvedValue("success");

      const wrapped = withFallback([fn1, fn2], { onFallback });
      await wrapped("request");

      expect(onFallback).toHaveBeenCalledTimes(1);
      expect(onFallback).toHaveBeenCalledWith(error, 0);
    });

    it("should pass request and signal to all functions", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("fail"));
      const fn2 = vi.fn().mockResolvedValue("success");

      const wrapped = withFallback([fn1, fn2]);
      const controller = new AbortController();
      await wrapped("request", controller.signal);

      expect(fn1).toHaveBeenCalledWith("request", controller.signal);
      expect(fn2).toHaveBeenCalledWith("request", controller.signal);
    });

    it("should work with single function", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      const wrapped = withFallback([fn]);
      const result = await wrapped("request");

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should try all functions in order", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("1"));
      const fn2 = vi.fn().mockRejectedValue(new Error("2"));
      const fn3 = vi.fn().mockResolvedValue("success");

      const wrapped = withFallback([fn1, fn2, fn3]);
      const result = await wrapped("request");

      expect(result).toBe("success");
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(1);
    });
  });

  describe("withStreamRetry", () => {
    async function* createSuccessfulStream(
      values: string[]
    ): AsyncIterable<string> {
      for (const value of values) {
        yield value;
      }
    }

    async function* createFailingStream(
      values: string[],
      failAtIndex: number
    ): AsyncIterable<string> {
      for (let i = 0; i < values.length; i++) {
        if (i === failAtIndex) {
          throw new Error(`Stream error at ${i}`);
        }
        yield values[i];
      }
    }

    it("should yield all values from successful stream", async () => {
      const fn = vi
        .fn()
        .mockImplementation(() => createSuccessfulStream(["a", "b", "c"]));
      const wrapped = withStreamRetry<string, string>(fn);

      const results = await runWithFakeTimers(async () => {
        const out: string[] = [];
        for await (const value of wrapped("request")) {
          out.push(value);
        }
        return out;
      });

      expect(results).toEqual(["a", "b", "c"]);
    });

    it("should retry stream on transient error", async () => {
      const fn = vi
        .fn()
        .mockImplementationOnce(() => createFailingStream(["a", "b"], 1))
        .mockImplementationOnce(() => createSuccessfulStream(["a", "b", "c"]));

      const wrapped = withStreamRetry<string, string>(fn, {
        retries: 2,
        baseMs: 10,
        jitter: false,
      });

      const results = await runWithFakeTimers(async () => {
        const out: string[] = [];
        for await (const value of wrapped("request")) {
          out.push(value);
        }
        return out;
      });

      // Stream restarts fresh on retry, so 'a' is yielded twice (once from each attempt)
      expect(results).toEqual(["a", "a", "b", "c"]);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should throw after max stream retries", async () => {
      const fn = vi
        .fn()
        .mockImplementation(() => createFailingStream(["a"], 0));

      const wrapped = withStreamRetry(fn, {
        retries: 2,
        baseMs: 10,
        jitter: false,
      });

      await expect(
        runWithFakeTimers(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for await (const _ of wrapped("request")) {
            // consume
          }
        })
      ).rejects.toThrow("Stream error at 0");

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should not retry on non-transient stream errors", async () => {
      // eslint-disable-next-line require-yield
      async function* failingStream(): AsyncIterable<string> {
        throw Object.assign(new Error("Client error"), { status: 400 });
      }

      const fn = vi.fn().mockImplementation(() => failingStream());
      const wrapped = withStreamRetry(fn);

      await expect(
        runWithFakeTimers(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for await (const _ of wrapped("request")) {
            // consume
          }
        })
      ).rejects.toThrow("Client error");

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should respect abort signal during stream", async () => {
      async function* slowStream(): AsyncIterable<string> {
        yield "a";
        // A microtask hop stands in for the old 50ms real sleep — enough to let
        // the consumer observe the first yield and abort before requesting the
        // next, without burning wall-clock or blocking the fake clock.
        await Promise.resolve();
        yield "b";
      }

      const fn = vi.fn().mockImplementation(() => slowStream());
      const wrapped = withStreamRetry<string, string>(fn, {
        retries: 2,
        baseMs: 10,
      });

      const controller = new AbortController();

      const results = await runWithFakeTimers(async () => {
        const out: string[] = [];
        // Abort after first yield - but stream continues since no error occurred
        // Abort signal is only checked on error during retry logic
        for await (const value of wrapped("request", controller.signal)) {
          out.push(value);
          if (out.length === 1) {
            controller.abort();
          }
        }
        return out;
      });

      // The abort signal prevents retries but doesn't stop an active stream
      // since values are already buffered/in-flight
      expect(results).toEqual(["a", "b"]);
    });

    it("should handle empty stream", async () => {
      const fn = vi.fn().mockImplementation(() => createSuccessfulStream([]));
      const wrapped = withStreamRetry<string, string>(fn);

      const results = await runWithFakeTimers(async () => {
        const out: string[] = [];
        for await (const value of wrapped("request")) {
          out.push(value);
        }
        return out;
      });

      expect(results).toEqual([]);
    });
  });

  describe("withStreamFallback", () => {
    async function* createStream(values: string[]): AsyncIterable<string> {
      for (const value of values) {
        yield value;
      }
    }

    // eslint-disable-next-line require-yield
    async function* createFailingStream(
      errorMsg: string
    ): AsyncIterable<string> {
      throw new Error(errorMsg);
    }

    it("should yield from first stream if successful", async () => {
      const fn1 = vi.fn().mockImplementation(() => createStream(["a", "b"]));
      const fn2 = vi.fn().mockImplementation(() => createStream(["c", "d"]));

      const wrapped = withStreamFallback<string, string>([fn1, fn2]);
      const results = await runWithFakeTimers(async () => {
        const out: string[] = [];
        for await (const value of wrapped("request")) {
          out.push(value);
        }
        return out;
      });

      expect(results).toEqual(["a", "b"]);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();
    });

    it("should fallback to second stream on first failure", async () => {
      const fn1 = vi.fn().mockImplementation(() => createFailingStream("fail"));
      const fn2 = vi.fn().mockImplementation(() => createStream(["c", "d"]));

      const wrapped = withStreamFallback<string, string>([fn1, fn2]);
      const results = await runWithFakeTimers(async () => {
        const out: string[] = [];
        for await (const value of wrapped("request")) {
          out.push(value);
        }
        return out;
      });

      expect(results).toEqual(["c", "d"]);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("should throw when all streams fail", async () => {
      const fn1 = vi
        .fn()
        .mockImplementation(() => createFailingStream("error1"));
      const fn2 = vi
        .fn()
        .mockImplementation(() => createFailingStream("error2"));

      const wrapped = withStreamFallback([fn1, fn2]);

      await expect(
        runWithFakeTimers(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for await (const _ of wrapped("request")) {
            // consume
          }
        })
      ).rejects.toThrow("error2");
    });

    it("should throw on empty array", () => {
      expect(() => withStreamFallback([])).toThrow(
        "withStreamFallback requires at least one function"
      );
    });

    it("should call onFallback callback", async () => {
      const onFallback = vi.fn();
      const fn1 = vi.fn().mockImplementation(() => createFailingStream("fail"));
      const fn2 = vi.fn().mockImplementation(() => createStream(["a"]));

      const wrapped = withStreamFallback<string, string>([fn1, fn2], {
        onFallback,
      });
      await runWithFakeTimers(async () => {
        const out: string[] = [];
        for await (const value of wrapped("request")) {
          out.push(value);
        }
        return out;
      });

      expect(onFallback).toHaveBeenCalledTimes(1);
      expect(onFallback).toHaveBeenCalledWith(expect.any(Error), 0);
    });

    it("should pass request and signal to all stream functions", async () => {
      const fn1 = vi.fn().mockImplementation(() => createFailingStream("fail"));
      const fn2 = vi.fn().mockImplementation(() => createStream(["a"]));

      const wrapped = withStreamFallback([fn1, fn2]);
      const controller = new AbortController();

      await runWithFakeTimers(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of wrapped("request", controller.signal)) {
          // consume
        }
      });

      expect(fn1).toHaveBeenCalledWith("request", controller.signal);
      expect(fn2).toHaveBeenCalledWith("request", controller.signal);
    });

    it("should work with single stream function", async () => {
      const fn = vi.fn().mockImplementation(() => createStream(["a", "b"]));

      const wrapped = withStreamFallback<string, string>([fn]);
      const results = await runWithFakeTimers(async () => {
        const out: string[] = [];
        for await (const value of wrapped("request")) {
          out.push(value);
        }
        return out;
      });

      expect(results).toEqual(["a", "b"]);
    });

    it("should try all streams in order until success", async () => {
      const fn1 = vi.fn().mockImplementation(() => createFailingStream("1"));
      const fn2 = vi.fn().mockImplementation(() => createFailingStream("2"));
      const fn3 = vi.fn().mockImplementation(() => createStream(["success"]));

      const wrapped = withStreamFallback<string, string>([fn1, fn2, fn3]);
      const results = await runWithFakeTimers(async () => {
        const out: string[] = [];
        for await (const value of wrapped("request")) {
          out.push(value);
        }
        return out;
      });

      expect(results).toEqual(["success"]);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(1);
    });
  });
});
