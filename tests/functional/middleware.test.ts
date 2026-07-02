// Tests for middleware functions — pure HOFs, no API calls
// Uses simple async functions (not real providers) to test retry/fallback logic
import { afterEach, describe, it, expect, vi } from "vitest";
import * as fireworksMiddleware from "../../packages/provider/fireworks/src/middleware";
import * as kimiCodingMiddleware from "../../packages/provider/kimicoding/src/middleware";

describe.each([
  ["kimicoding", kimiCodingMiddleware],
  ["fireworks", fireworksMiddleware],
] as const)("%s middleware", (_provider, middleware) => {
  const {
    withRetry,
    withFallback,
    withStreamRetry,
    withStreamFallback,
    createRateLimiter,
    withRateLimit,
  } = middleware;

  describe("withRetry", () => {
    it("returns result on first success", async () => {
      const fn = async (x: number) => x * 2;
      const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
      expect(await retried(5)).toBe(10);
    });

    it("retries on transient error and succeeds", async () => {
      let calls = 0;
      const fn = async () => {
        calls++;
        if (calls < 3) throw Object.assign(new Error("fail"), { status: 500 });
        return "ok";
      };
      const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
      expect(await retried(null)).toBe("ok");
      expect(calls).toBe(3);
    });

    it("throws after exhausting retries", async () => {
      const fn = async () => {
        throw Object.assign(new Error("always fail"), { status: 500 });
      };
      const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
      await expect(retried(null)).rejects.toThrow("always fail");
    });

    it("does not retry non-transient errors (4xx)", async () => {
      let calls = 0;
      const fn = async () => {
        calls++;
        throw Object.assign(new Error("bad request"), { status: 400 });
      };
      const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
      await expect(retried(null)).rejects.toThrow("bad request");
      expect(calls).toBe(1);
    });

    it.each([408, 418, 429])("treats %i as transient", async (status) => {
      let calls = 0;
      const fn = async () => {
        calls++;
        if (calls < 2) throw Object.assign(new Error("rate"), { status });
        return "ok";
      };
      const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
      expect(await retried(null)).toBe("ok");
      expect(calls).toBe(2);
    });

    it("passes request and signal through", async () => {
      const fn = async (req: string, signal?: AbortSignal) => {
        return `${req}-${signal ? "has-signal" : "no-signal"}`;
      };
      const retried = withRetry(fn);
      const controller = new AbortController();
      expect(await retried("hello", controller.signal)).toBe(
        "hello-has-signal"
      );
    });
  });
  describe("withFallback", () => {
    it("returns result from first function on success", async () => {
      const fn1 = async () => "primary";
      const fn2 = async () => "secondary";
      const fb = withFallback([fn1, fn2]);
      expect(await fb(null)).toBe("primary");
    });

    it("falls back to second function on first failure", async () => {
      const fn1 = async () => {
        throw new Error("primary down");
      };
      const fn2 = async () => "secondary";
      const fb = withFallback([fn1, fn2]);
      expect(await fb(null)).toBe("secondary");
    });

    it("throws last error when all functions fail", async () => {
      const fn1 = async () => {
        throw new Error("first");
      };
      const fn2 = async () => {
        throw new Error("second");
      };
      const fb = withFallback([fn1, fn2]);
      await expect(fb(null)).rejects.toThrow("second");
    });

    it("calls onFallback callback on each failure", async () => {
      const errors: Array<{ error: unknown; index: number }> = [];
      const fn1 = async () => {
        throw new Error("fail1");
      };
      const fn2 = async () => "ok";
      const fb = withFallback([fn1, fn2], {
        onFallback: (error, index) => errors.push({ error, index }),
      });
      await fb(null);
      expect(errors).toHaveLength(1);
      expect(errors[0].index).toBe(0);
    });

    it("throws if given empty array", () => {
      expect(() => withFallback([])).toThrow(
        "withFallback requires at least one function"
      );
    });
  });
  describe("withStreamRetry", () => {
    it("yields chunks on success", async () => {
      async function* gen() {
        yield "a";
        yield "b";
      }
      const retried = withStreamRetry(gen, {
        retries: 2,
        baseMs: 1,
        jitter: false,
      });
      const chunks: string[] = [];
      for await (const c of retried(null)) {
        chunks.push(c);
      }
      expect(chunks).toEqual(["a", "b"]);
    });

    it("retries generator on transient error", async () => {
      let calls = 0;
      async function* gen() {
        calls++;
        if (calls < 2) throw Object.assign(new Error("fail"), { status: 500 });
        yield "recovered";
      }
      const retried = withStreamRetry(gen, {
        retries: 2,
        baseMs: 1,
        jitter: false,
      });
      const chunks: string[] = [];
      for await (const c of retried(null)) {
        chunks.push(c);
      }
      expect(chunks).toEqual(["recovered"]);
      expect(calls).toBe(2);
    });

    it("throws after exhausting retries", async () => {
      // eslint-disable-next-line require-yield
      async function* gen(): AsyncGenerator<string> {
        throw Object.assign(new Error("fail"), { status: 500 });
      }
      const retried = withStreamRetry(gen, {
        retries: 1,
        baseMs: 1,
        jitter: false,
      });
      const chunks: string[] = [];
      await expect(async () => {
        for await (const c of retried(null)) {
          chunks.push(c);
        }
      }).rejects.toThrow("fail");
    });
  });

  describe("withStreamFallback", () => {
    it("yields from first generator on success", async () => {
      async function* gen1() {
        yield "primary";
      }
      async function* gen2() {
        yield "secondary";
      }
      const fb = withStreamFallback([gen1, gen2]);
      const chunks: string[] = [];
      for await (const c of fb(null)) {
        chunks.push(c);
      }
      expect(chunks).toEqual(["primary"]);
    });

    it("falls back to second generator", async () => {
      // eslint-disable-next-line require-yield
      async function* gen1(): AsyncGenerator<string> {
        throw new Error("fail");
      }
      async function* gen2() {
        yield "fallback";
      }
      const fb = withStreamFallback([gen1, gen2]);
      const chunks: string[] = [];
      for await (const c of fb(null)) {
        chunks.push(c);
      }
      expect(chunks).toEqual(["fallback"]);
    });

    it("throws the last stream error when all generators fail", async () => {
      // eslint-disable-next-line require-yield
      async function* gen1(): AsyncGenerator<string> {
        throw new Error("first");
      }
      // eslint-disable-next-line require-yield
      async function* gen2(): AsyncGenerator<string> {
        throw new Error("second");
      }
      const fb = withStreamFallback([gen1, gen2]);
      const iterator = fb(null)[Symbol.asyncIterator]();

      await expect(iterator.next()).rejects.toThrow("second");
    });

    it("throws if given empty array", () => {
      expect(() => withStreamFallback([])).toThrow(
        "withStreamFallback requires at least one function"
      );
    });
  });

  describe("rate limiting", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("passes through and releases after success or failure", async () => {
      const limiter = createRateLimiter();
      const ok = vi.fn().mockResolvedValue("ok");
      const failing = vi.fn().mockRejectedValue(new Error("fail"));

      await expect(withRateLimit(ok, limiter)("req")).resolves.toBe("ok");
      expect(limiter.active).toBe(0);
      expect(ok).toHaveBeenCalledWith("req", undefined);

      await expect(withRateLimit(failing, limiter)("req")).rejects.toThrow(
        "fail"
      );
      expect(limiter.active).toBe(0);
    });

    it("rejects after dispose", async () => {
      const limiter = createRateLimiter({ rpm: 1 });
      const wrapped = withRateLimit(vi.fn().mockResolvedValue("ok"), limiter);

      limiter.dispose();

      await expect(wrapped("req")).rejects.toThrow("RateLimiter is disposed");
    });

    it("queues behind concurrency and drains on release", async () => {
      vi.useFakeTimers();

      const limiter = createRateLimiter({ concurrent: 1 });
      let resolveFirst: (value: string) => void;
      const firstCall = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const fn = vi
        .fn()
        .mockReturnValueOnce(firstCall)
        .mockResolvedValue("next");
      const wrapped = withRateLimit(fn, limiter);

      const p1 = wrapped("first");
      await vi.advanceTimersByTimeAsync(1);

      const controller = new AbortController();
      const p2 = wrapped("second", controller.signal);
      await vi.advanceTimersByTimeAsync(1);

      expect(limiter.active).toBe(1);
      expect(limiter.queued).toBe(1);

      resolveFirst!("first");
      await expect(p1).resolves.toBe("first");
      await vi.advanceTimersByTimeAsync(1);

      await expect(p2).resolves.toBe("next");
      expect(limiter.active).toBe(0);
      expect(limiter.queued).toBe(0);
    });

    it("times out queued requests using the wrapper override", async () => {
      vi.useFakeTimers();

      const limiter = createRateLimiter({ concurrent: 1, maxQueueMs: 5_000 });
      const blocker = new Promise<string>(() => {});
      const fn = vi.fn().mockReturnValueOnce(blocker).mockResolvedValue("ok");
      const wrapped = withRateLimit(fn, limiter, { maxQueueMs: 50 });

      wrapped("first");
      await vi.advanceTimersByTimeAsync(1);

      const controller = new AbortController();
      const p2 = wrapped("second", controller.signal);
      const assertion = expect(p2).rejects.toThrow(
        "Rate limit queue timeout after 50ms"
      );

      await vi.advanceTimersByTimeAsync(50);
      await assertion;

      const p3 = wrapped("third");
      const noSignalAssertion = expect(p3).rejects.toThrow(
        "Rate limit queue timeout after 50ms"
      );

      await vi.advanceTimersByTimeAsync(50);
      await noSignalAssertion;

      limiter.dispose();
    });

    it("rejects aborted queued requests", async () => {
      vi.useFakeTimers();

      const limiter = createRateLimiter({ concurrent: 1 });
      const blocker = new Promise<string>(() => {});
      const fn = vi.fn().mockReturnValueOnce(blocker).mockResolvedValue("ok");
      const wrapped = withRateLimit(fn, limiter);

      wrapped("first");
      await vi.advanceTimersByTimeAsync(1);

      const alreadyAborted = new AbortController();
      alreadyAborted.abort();
      await expect(wrapped("second", alreadyAborted.signal)).rejects.toThrow(
        "Rate limit queue aborted"
      );

      const queuedController = new AbortController();
      const queued = wrapped("third", queuedController.signal);
      await vi.advanceTimersByTimeAsync(1);

      expect(limiter.queued).toBe(1);
      queuedController.abort();

      await expect(queued).rejects.toThrow("Rate limit queue aborted");
      expect(limiter.queued).toBe(0);

      limiter.dispose();
    });

    it("clears drain timers and rejects queued work on dispose", async () => {
      vi.useFakeTimers();

      const limiter = createRateLimiter({
        rpm: 1,
        concurrent: 1,
        maxQueueMs: 120_000,
      });
      let resolveFirst: (value: string) => void;
      const firstCall = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const fn = vi
        .fn()
        .mockReturnValueOnce(firstCall)
        .mockResolvedValue("next");
      const wrapped = withRateLimit(fn, limiter);

      const p1 = wrapped("first");
      await vi.advanceTimersByTimeAsync(1);
      const controller = new AbortController();
      const p2 = wrapped("second", controller.signal);
      const p3 = wrapped("third");
      await vi.advanceTimersByTimeAsync(1);

      expect(limiter.queued).toBe(2);

      resolveFirst!("first");
      await expect(p1).resolves.toBe("first");
      await vi.advanceTimersByTimeAsync(1);
      expect(limiter.queued).toBe(2);

      limiter.dispose();
      await expect(p2).rejects.toThrow("RateLimiter disposed");
      await expect(p3).rejects.toThrow("RateLimiter disposed");
    });

    it("reschedules rpm drain after a concurrency release", async () => {
      vi.useFakeTimers();

      const limiter = createRateLimiter({
        rpm: 1,
        concurrent: 1,
        maxQueueMs: 120_000,
      });
      let resolveFirst: (value: string) => void;
      const firstCall = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const fn = vi
        .fn()
        .mockReturnValueOnce(firstCall)
        .mockResolvedValue("next");
      const wrapped = withRateLimit(fn, limiter);

      const p1 = wrapped("first");
      await vi.advanceTimersByTimeAsync(1);
      const p2 = wrapped("second");
      await vi.advanceTimersByTimeAsync(1);

      resolveFirst!("first");
      await expect(p1).resolves.toBe("first");
      await vi.advanceTimersByTimeAsync(1);
      expect(limiter.queued).toBe(1);

      await vi.advanceTimersByTimeAsync(60_000);
      await expect(p2).resolves.toBe("next");
      expect(limiter.queued).toBe(0);
    });

    it("drains queued requests after the rpm window slides", async () => {
      vi.useFakeTimers();

      const limiter = createRateLimiter({ rpm: 1, maxQueueMs: 180_000 });
      const fn = vi.fn().mockResolvedValue("ok");
      const wrapped = withRateLimit(fn, limiter);

      await wrapped("first");
      const p2 = wrapped("second");
      const p3 = wrapped("third");
      await vi.advanceTimersByTimeAsync(1);
      expect(limiter.queued).toBe(2);

      await vi.advanceTimersByTimeAsync(60_000);
      await expect(p2).resolves.toBe("ok");
      expect(limiter.queued).toBe(1);

      await vi.advanceTimersByTimeAsync(60_000);
      await expect(p3).resolves.toBe("ok");
      expect(limiter.queued).toBe(0);
    });
  });
});
