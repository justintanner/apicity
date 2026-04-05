import { describe, it, expect, vi } from "vitest";

import {
  withRetry,
  withFallback,
  RetryOptions,
  FallbackOptions,
} from "../../packages/provider/xai/src/middleware";

describe("withRetry", () => {
  it("should return result on successful execution", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const wrapped = withRetry(fn);

    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("request", undefined);
  });

  it("should retry on transient errors (429)", async () => {
    const error = { status: 429 };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });
    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should retry on transient errors (500)", async () => {
    const error = { status: 500 };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should retry on transient errors (503)", async () => {
    const error = { status: 503 };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should not retry on 400 errors", async () => {
    const error = { status: 400, message: "Bad Request" };
    const fn = vi.fn().mockRejectedValue(error);

    const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

    await expect(wrapped("request")).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not retry on 401 errors", async () => {
    const error = { status: 401, message: "Unauthorized" };
    const fn = vi.fn().mockRejectedValue(error);

    const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

    await expect(wrapped("request")).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not retry on 404 errors", async () => {
    const error = { status: 404, message: "Not Found" };
    const fn = vi.fn().mockRejectedValue(error);

    const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });

    await expect(wrapped("request")).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should handle statusCode property instead of status", async () => {
    const error = { statusCode: 429 };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should handle code property instead of status", async () => {
    const error = { code: 500 };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should treat errors without status as transient", async () => {
    const error = new Error("Network error");
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should calculate exponential backoff correctly", async () => {
    const error = { status: 429 };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const startTime = Date.now();
    const wrapped = withRetry(fn, {
      retries: 4,
      baseMs: 100,
      factor: 2,
      jitter: false,
    });
    await wrapped("request");
    const elapsed = Date.now() - startTime;

    // Expected delays: 100ms (attempt 1), 200ms (attempt 2), 400ms (attempt 3)
    // Total: ~700ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(650);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("should apply configurable base delay", async () => {
    const error = { status: 429 };
    const fn = vi.fn().mockRejectedValue(error);

    const startTime = Date.now();
    const wrapped = withRetry(fn, {
      retries: 1,
      baseMs: 50,
      jitter: false,
    });
    await expect(wrapped("request")).rejects.toEqual(error);
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(fn).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });

  it("should apply configurable factor", async () => {
    const error = { status: 429 };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const startTime = Date.now();
    const wrapped = withRetry(fn, {
      retries: 3,
      baseMs: 50,
      factor: 3,
      jitter: false,
    });
    await wrapped("request");
    const elapsed = Date.now() - startTime;

    // Expected delays: 50ms * 3^0 = 50ms, 50ms * 3^1 = 150ms
    // Total: ~200ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(180);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should apply jitter to delay when enabled", async () => {
    const error = { status: 429 };
    const fn = vi.fn().mockRejectedValue(error);

    const delays: number[] = [];
    const mockSleep = (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    };

    // Run multiple times to check jitter variance
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      const wrapped = withRetry(fn, { retries: 1, baseMs: 100, jitter: true });
      await expect(wrapped("request")).rejects.toEqual(error);
      const elapsed = Date.now() - startTime;
      delays.push(elapsed);
    }

    // With jitter, delays should vary (0.8 to 1.2 of base)
    // Check that we have some variance
    const uniqueDelays = [...new Set(delays)];
    expect(uniqueDelays.length).toBeGreaterThan(1);
  });

  it("should respect jitter = false option", async () => {
    const error = { status: 429 };
    const fn = vi.fn().mockRejectedValue(error);

    const delays: number[] = [];

    // Run multiple times without jitter - delays should be consistent
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      const wrapped = withRetry(fn, {
        retries: 1,
        baseMs: 50,
        jitter: false,
      });
      await expect(wrapped("request")).rejects.toEqual(error);
      const elapsed = Date.now() - startTime;
      delays.push(elapsed);
    }

    // Without jitter, all delays should be approximately the same
    const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
    for (const delay of delays) {
      expect(Math.abs(delay - avgDelay)).toBeLessThan(20); // Allow 20ms variance
    }
  });

  it("should abort when signal is triggered", async () => {
    const error = { status: 429 };
    const fn = vi.fn().mockRejectedValue(error);
    const controller = new AbortController();

    const wrapped = withRetry(fn, { retries: 5, baseMs: 100, jitter: false });

    // Abort after a short delay
    setTimeout(() => controller.abort(), 50);

    await expect(wrapped("request", controller.signal)).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should pass signal to wrapped function", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const controller = new AbortController();

    const wrapped = withRetry(fn);
    await wrapped("request", controller.signal);

    expect(fn).toHaveBeenCalledWith("request", controller.signal);
  });

  it("should throw after exhausting all retries", async () => {
    const error = { status: 429, message: "Rate limited" };
    const fn = vi.fn().mockRejectedValue(error);

    const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });

    await expect(wrapped("request")).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should use default options when none provided", async () => {
    const error = { status: 429 };
    const fn = vi.fn().mockRejectedValue(error);

    const wrapped = withRetry(fn);
    await expect(wrapped("request")).rejects.toEqual(error);

    // Default: retries=2, so 3 total calls
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should handle partial options override", async () => {
    const error = { status: 429 };
    const fn = vi.fn().mockRejectedValue(error);

    const wrapped = withRetry(fn, { retries: 1 }); // Only override retries
    await expect(wrapped("request")).rejects.toEqual(error);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("withFallback", () => {
  it("should return result from first function on success", async () => {
    const fn1 = vi.fn().mockResolvedValue("first");
    const fn2 = vi.fn().mockResolvedValue("second");

    const wrapped = withFallback([fn1, fn2]);
    const result = await wrapped("request");

    expect(result).toBe("first");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).not.toHaveBeenCalled();
  });

  it("should try functions sequentially on failure", async () => {
    const fn1 = vi.fn().mockRejectedValue(new Error("First failed"));
    const fn2 = vi.fn().mockRejectedValue(new Error("Second failed"));
    const fn3 = vi.fn().mockResolvedValue("third");

    const wrapped = withFallback([fn1, fn2, fn3]);
    const result = await wrapped("request");

    expect(result).toBe("third");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn3).toHaveBeenCalledTimes(1);
  });

  it("should call onFallback callback when falling back", async () => {
    const onFallback = vi.fn();
    const error1 = new Error("First failed");
    const fn1 = vi.fn().mockRejectedValue(error1);
    const fn2 = vi.fn().mockResolvedValue("second");

    const wrapped = withFallback([fn1, fn2], { onFallback });
    await wrapped("request");

    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith(error1, 0);
  });

  it("should call onFallback for each fallback attempt", async () => {
    const onFallback = vi.fn();
    const error1 = new Error("First failed");
    const error2 = new Error("Second failed");
    const fn1 = vi.fn().mockRejectedValue(error1);
    const fn2 = vi.fn().mockRejectedValue(error2);
    const fn3 = vi.fn().mockResolvedValue("third");

    const wrapped = withFallback([fn1, fn2, fn3], { onFallback });
    await wrapped("request");

    expect(onFallback).toHaveBeenCalledTimes(2);
    expect(onFallback).toHaveBeenNthCalledWith(1, error1, 0);
    expect(onFallback).toHaveBeenNthCalledWith(2, error2, 1);
  });

  it("should not call onFallback when first function succeeds", async () => {
    const onFallback = vi.fn();
    const fn1 = vi.fn().mockResolvedValue("first");
    const fn2 = vi.fn().mockResolvedValue("second");

    const wrapped = withFallback([fn1, fn2], { onFallback });
    await wrapped("request");

    expect(onFallback).not.toHaveBeenCalled();
  });

  it("should throw when all functions fail", async () => {
    const error1 = new Error("First failed");
    const error2 = new Error("Second failed");
    const fn1 = vi.fn().mockRejectedValue(error1);
    const fn2 = vi.fn().mockRejectedValue(error2);

    const wrapped = withFallback([fn1, fn2]);

    await expect(wrapped("request")).rejects.toEqual(error2);
  });

  it("should throw when single function fails", async () => {
    const error = new Error("Failed");
    const fn = vi.fn().mockRejectedValue(error);

    const wrapped = withFallback([fn]);

    await expect(wrapped("request")).rejects.toEqual(error);
  });

  it("should throw error for empty function array", () => {
    expect(() => withFallback([])).toThrow(
      "withFallback requires at least one function"
    );
  });

  it("should pass request and signal to each function", async () => {
    const fn1 = vi.fn().mockRejectedValue(new Error("Failed"));
    const fn2 = vi.fn().mockResolvedValue("success");
    const controller = new AbortController();

    const wrapped = withFallback([fn1, fn2]);
    await wrapped("request", controller.signal);

    expect(fn1).toHaveBeenCalledWith("request", controller.signal);
    expect(fn2).toHaveBeenCalledWith("request", controller.signal);
  });

  it("should work with single successful function", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const wrapped = withFallback([fn]);
    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should handle mixed success and failure correctly", async () => {
    const fn1 = vi.fn().mockRejectedValue(new Error("Failed"));
    const fn2 = vi.fn().mockResolvedValue("second");
    const fn3 = vi.fn().mockResolvedValue("third");

    const wrapped = withFallback([fn1, fn2, fn3]);
    const result = await wrapped("request");

    expect(result).toBe("second");
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn3).not.toHaveBeenCalled();
  });

  it("should work with no options provided", async () => {
    const fn1 = vi.fn().mockRejectedValue(new Error("Failed"));
    const fn2 = vi.fn().mockResolvedValue("success");

    const wrapped = withFallback([fn1, fn2]);
    const result = await wrapped("request");

    expect(result).toBe("success");
  });
});

describe("RetryOptions and FallbackOptions interfaces", () => {
  it("should accept all RetryOptions properties", () => {
    const opts: RetryOptions = {
      retries: 5,
      baseMs: 1000,
      factor: 3,
      jitter: false,
    };

    expect(opts.retries).toBe(5);
    expect(opts.baseMs).toBe(1000);
    expect(opts.factor).toBe(3);
    expect(opts.jitter).toBe(false);
  });

  it("should accept RetryOptions with partial properties", () => {
    const opts: RetryOptions = { retries: 3 };
    expect(opts.retries).toBe(3);
  });

  it("should accept FallbackOptions with onFallback", () => {
    const onFallback = (error: unknown, index: number) => {
      console.log(`Fallback ${index}: ${error}`);
    };
    const opts: FallbackOptions = { onFallback };

    expect(opts.onFallback).toBe(onFallback);
  });

  it("should accept empty FallbackOptions", () => {
    const opts: FallbackOptions = {};
    expect(opts.onFallback).toBeUndefined();
  });
});
