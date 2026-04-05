import { describe, it, expect, vi } from "vitest";

import {
  withRetry,
  withFallback,
} from "../../packages/provider/kie/src/middleware";

describe("KIE middleware", () => {
  describe("withRetry", () => {
    it("should return result on success without retry", async () => {
      const fn = vi.fn().mockResolvedValue({ success: true });
      const wrapped = withRetry(fn, { retries: 2, baseMs: 10 });

      const result = await wrapped({ test: "data" });

      expect(result).toEqual({ success: true });
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith({ test: "data" }, undefined);
    });

    it("should retry on transient errors and eventually succeed", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("500 error"))
        .mockRejectedValueOnce({ status: 503 })
        .mockResolvedValue({ success: true });

      const wrapped = withRetry(fn, { retries: 3, baseMs: 10, jitter: false });
      const result = await wrapped({ test: "data" });

      expect(result).toEqual({ success: true });
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should not retry on 400 errors", async () => {
      const error = { status: 400, message: "Bad request" };
      const fn = vi.fn().mockRejectedValue(error);
      const wrapped = withRetry(fn, { retries: 2, baseMs: 10 });

      await expect(wrapped({})).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on 429 errors", async () => {
      // 429 is a transient error (rate limiting), so it should be retried
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ statusCode: 429 })
        .mockResolvedValue({ success: true });
      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });

      const result = await wrapped({});
      expect(result).toEqual({ success: true });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry on 500+ errors", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce({ code: 500 })
        .mockResolvedValue({ success: true });

      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });
      const result = await wrapped({});

      expect(result).toEqual({ success: true });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should throw after max retries exceeded", async () => {
      const error = new Error("Persistent failure");
      const fn = vi.fn().mockRejectedValue(error);
      const wrapped = withRetry(fn, { retries: 2, baseMs: 10, jitter: false });

      await expect(wrapped({})).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("should respect abort signal", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("500"));
      const wrapped = withRetry(fn, { retries: 5, baseMs: 10 });

      const controller = new AbortController();
      controller.abort();

      await expect(wrapped({}, controller.signal)).rejects.toEqual(
        new Error("500")
      );
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should pass signal to wrapped function", async () => {
      const fn = vi.fn().mockResolvedValue({ success: true });
      const wrapped = withRetry(fn, { retries: 1, baseMs: 10 });

      const controller = new AbortController();
      await wrapped({ test: "data" }, controller.signal);

      expect(fn).toHaveBeenCalledWith({ test: "data" }, controller.signal);
    });

    it("should use default options when none provided", async () => {
      const fn = vi.fn().mockResolvedValue({ success: true });
      const wrapped = withRetry(fn);

      const result = await wrapped({});

      expect(result).toEqual({ success: true });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should treat unknown errors as transient", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce("string error")
        .mockResolvedValue({ success: true });

      const wrapped = withRetry(fn, { retries: 1, baseMs: 10, jitter: false });
      const result = await wrapped({});

      expect(result).toEqual({ success: true });
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("withFallback", () => {
    it("should return result from first successful function", async () => {
      const fn1 = vi.fn().mockResolvedValue({ from: "first" });
      const fn2 = vi.fn().mockResolvedValue({ from: "second" });

      const wrapped = withFallback([fn1, fn2]);
      const result = await wrapped({ test: "data" });

      expect(result).toEqual({ from: "first" });
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();
    });

    it("should fallback to second function when first fails", async () => {
      const error = new Error("First failed");
      const fn1 = vi.fn().mockRejectedValue(error);
      const fn2 = vi.fn().mockResolvedValue({ from: "second" });

      const wrapped = withFallback([fn1, fn2]);
      const result = await wrapped({ test: "data" });

      expect(result).toEqual({ from: "second" });
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("should try all functions until one succeeds", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("First"));
      const fn2 = vi.fn().mockRejectedValue(new Error("Second"));
      const fn3 = vi.fn().mockResolvedValue({ from: "third" });

      const wrapped = withFallback([fn1, fn2, fn3]);
      const result = await wrapped({ test: "data" });

      expect(result).toEqual({ from: "third" });
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(1);
    });

    it("should throw last error when all functions fail", async () => {
      const error1 = new Error("First");
      const error2 = new Error("Second");
      const error3 = new Error("Third");

      const fn1 = vi.fn().mockRejectedValue(error1);
      const fn2 = vi.fn().mockRejectedValue(error2);
      const fn3 = vi.fn().mockRejectedValue(error3);

      const wrapped = withFallback([fn1, fn2, fn3]);

      await expect(wrapped({})).rejects.toEqual(error3);
    });

    it("should throw error when no functions provided", async () => {
      expect(() => withFallback([])).toThrow(
        "withFallback requires at least one function"
      );
    });

    it("should call onFallback callback when falling back", async () => {
      const error = new Error("Failed");
      const fn1 = vi.fn().mockRejectedValue(error);
      const fn2 = vi.fn().mockResolvedValue({ success: true });
      const onFallback = vi.fn();

      const wrapped = withFallback([fn1, fn2], { onFallback });
      await wrapped({ test: "data" });

      expect(onFallback).toHaveBeenCalledTimes(1);
      expect(onFallback).toHaveBeenCalledWith(error, 0);
    });

    it("should pass signal to all functions", async () => {
      const fn1 = vi.fn().mockRejectedValue(new Error("Fail"));
      const fn2 = vi.fn().mockResolvedValue({ success: true });

      const wrapped = withFallback([fn1, fn2]);
      const controller = new AbortController();

      await wrapped({ test: "data" }, controller.signal);

      expect(fn1).toHaveBeenCalledWith({ test: "data" }, controller.signal);
      expect(fn2).toHaveBeenCalledWith({ test: "data" }, controller.signal);
    });

    it("should work with single function", async () => {
      const fn = vi.fn().mockResolvedValue({ success: true });

      const wrapped = withFallback([fn]);
      const result = await wrapped({ test: "data" });

      expect(result).toEqual({ success: true });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should throw when single function fails", async () => {
      const error = new Error("Failed");
      const fn = vi.fn().mockRejectedValue(error);

      const wrapped = withFallback([fn]);

      await expect(wrapped({})).rejects.toEqual(error);
    });
  });
});
