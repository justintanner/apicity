import { describe, it, expect, vi } from "vitest";

import {
  createRateLimiter,
  withRateLimit,
  withRetry,
  XAI_RATE_LIMITS,
} from "../../packages/provider/xai/src/middleware";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("createRateLimiter", () => {
  it("should create a limiter with default options", () => {
    const limiter = createRateLimiter();
    expect(limiter.active).toBe(0);
    expect(limiter.queued).toBe(0);
  });

  it("should create a limiter with custom options", () => {
    const limiter = createRateLimiter({ rpm: 10, concurrent: 5 });
    expect(limiter.active).toBe(0);
    expect(limiter.queued).toBe(0);
  });

  it("should reject after dispose", async () => {
    const limiter = createRateLimiter({ rpm: 1 });
    const fn = vi.fn().mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter);

    limiter.dispose();

    await expect(wrapped("req")).rejects.toThrow("RateLimiter is disposed");
  });

  it("should reject all queued requests on dispose", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    let resolveFirst: () => void;
    const firstCall = new Promise<string>((resolve) => {
      resolveFirst = () => resolve("first");
    });
    const fn = vi.fn().mockReturnValueOnce(firstCall).mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter);

    // First call acquires the slot
    const p1 = wrapped("req1");

    // Wait for the first call to be in-flight
    await delay(5);

    // Second call queues
    const p2 = wrapped("req2");

    expect(limiter.active).toBe(1);
    expect(limiter.queued).toBe(1);

    limiter.dispose();

    await expect(p2).rejects.toThrow("RateLimiter disposed");

    // Resolve the first to clean up
    resolveFirst!();
    await expect(p1).resolves.toBe("first");
  });
});

describe("withRateLimit", () => {
  it("should pass through when no limits are hit", async () => {
    const limiter = createRateLimiter();
    const fn = vi.fn().mockResolvedValue("success");
    const wrapped = withRateLimit(fn, limiter);

    const result = await wrapped("request");

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledWith("request", undefined);
  });

  it("should pass signal to wrapped function", async () => {
    const limiter = createRateLimiter();
    const fn = vi.fn().mockResolvedValue("ok");
    const controller = new AbortController();
    const wrapped = withRateLimit(fn, limiter);

    await wrapped("req", controller.signal);

    expect(fn).toHaveBeenCalledWith("req", controller.signal);
  });

  it("should track active count correctly", async () => {
    const limiter = createRateLimiter();
    let resolveCall: () => void;
    const pending = new Promise<string>((resolve) => {
      resolveCall = () => resolve("done");
    });
    const fn = vi.fn().mockReturnValue(pending);
    const wrapped = withRateLimit(fn, limiter);

    const p = wrapped("req");

    expect(limiter.active).toBe(1);

    resolveCall!();
    await p;

    expect(limiter.active).toBe(0);
  });

  it("should release slot on error", async () => {
    const limiter = createRateLimiter();
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const wrapped = withRateLimit(fn, limiter);

    await expect(wrapped("req")).rejects.toThrow("fail");

    expect(limiter.active).toBe(0);
  });
});

describe("concurrency limiting", () => {
  it("should queue when concurrent limit is reached", async () => {
    const limiter = createRateLimiter({ concurrent: 2 });
    const resolvers: Array<(v: string) => void> = [];
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve);
        })
    );
    const wrapped = withRateLimit(fn, limiter);

    // Start 3 calls - only 2 should be in-flight
    const p1 = wrapped("req1");
    const p2 = wrapped("req2");

    await delay(5);

    const p3 = wrapped("req3");

    await delay(5);

    expect(limiter.active).toBe(2);
    expect(limiter.queued).toBe(1);
    expect(fn).toHaveBeenCalledTimes(2);

    // Complete first call - third should start
    resolvers[0]("result1");
    await p1;

    await delay(5);

    expect(limiter.active).toBe(2);
    expect(limiter.queued).toBe(0);
    expect(fn).toHaveBeenCalledTimes(3);

    // Complete remaining
    resolvers[1]("result2");
    resolvers[2]("result3");
    await Promise.all([p2, p3]);

    expect(limiter.active).toBe(0);
  });
});

describe("RPM limiting", () => {
  it("should allow requests within RPM limit", async () => {
    const limiter = createRateLimiter({ rpm: 5 });
    const fn = vi.fn().mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter);

    for (let i = 0; i < 5; i++) {
      await wrapped("req");
    }

    expect(fn).toHaveBeenCalledTimes(5);
  });

  it("should queue requests beyond RPM limit", async () => {
    const limiter = createRateLimiter({ rpm: 2, maxQueueMs: 100 });
    const fn = vi.fn().mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter);

    // First 2 go through immediately
    await wrapped("req1");
    await wrapped("req2");

    expect(fn).toHaveBeenCalledTimes(2);

    // Third should queue and timeout since window won't slide in 100ms
    await expect(wrapped("req3")).rejects.toThrow("Rate limit queue timeout");
  });
});

describe("combined RPM + concurrency", () => {
  it("should respect both limits", async () => {
    const limiter = createRateLimiter({ rpm: 10, concurrent: 1 });
    const resolvers: Array<(v: string) => void> = [];
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve);
        })
    );
    const wrapped = withRateLimit(fn, limiter);

    const p1 = wrapped("req1");

    await delay(5);

    const p2 = wrapped("req2");

    await delay(5);

    // Concurrency=1 means only 1 active
    expect(limiter.active).toBe(1);
    expect(limiter.queued).toBe(1);

    resolvers[0]("done1");
    await p1;

    await delay(5);

    expect(limiter.active).toBe(1);
    expect(limiter.queued).toBe(0);

    resolvers[1]("done2");
    await p2;
  });
});

describe("AbortSignal", () => {
  it("should reject immediately if signal already aborted", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    const blocker = new Promise<string>(() => {});
    const fn = vi.fn().mockReturnValueOnce(blocker).mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter);

    // Fill the slot
    wrapped("req1");

    await delay(5);

    const controller = new AbortController();
    controller.abort();

    await expect(wrapped("req2", controller.signal)).rejects.toThrow(
      "Rate limit queue aborted"
    );

    limiter.dispose();
  });

  it("should cancel queued request when signal aborts", async () => {
    const limiter = createRateLimiter({ concurrent: 1 });
    let resolveFirst: (v: string) => void;
    const firstCall = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const fn = vi.fn().mockReturnValueOnce(firstCall).mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter);

    const p1 = wrapped("req1");

    await delay(5);

    const controller = new AbortController();
    const p2 = wrapped("req2", controller.signal);

    await delay(5);
    expect(limiter.queued).toBe(1);

    controller.abort();

    await expect(p2).rejects.toThrow("Rate limit queue aborted");
    expect(limiter.queued).toBe(0);

    resolveFirst!("done");
    await p1;
  });
});

describe("maxQueueMs", () => {
  it("should reject after queue timeout", async () => {
    const limiter = createRateLimiter({ concurrent: 1, maxQueueMs: 50 });
    const blocker = new Promise<string>(() => {});
    const fn = vi.fn().mockReturnValueOnce(blocker).mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter);

    wrapped("req1");

    await delay(5);

    await expect(wrapped("req2")).rejects.toThrow(
      "Rate limit queue timeout after 50ms"
    );

    limiter.dispose();
  });

  it("should allow per-wrap maxQueueMs override", async () => {
    const limiter = createRateLimiter({ concurrent: 1, maxQueueMs: 5000 });
    const blocker = new Promise<string>(() => {});
    const fn = vi.fn().mockReturnValueOnce(blocker).mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter, { maxQueueMs: 50 });

    wrapped("req1");

    await delay(5);

    await expect(wrapped("req2")).rejects.toThrow(
      "Rate limit queue timeout after 50ms"
    );

    limiter.dispose();
  });
});

describe("shared limiter", () => {
  it("should share state across multiple wrapped functions", async () => {
    const limiter = createRateLimiter({ concurrent: 2 });
    const resolvers: Array<(v: string) => void> = [];
    const fn1 = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve);
        })
    );
    const fn2 = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve);
        })
    );
    const wrapped1 = withRateLimit(fn1, limiter);
    const wrapped2 = withRateLimit(fn2, limiter);

    const p1 = wrapped1("a");
    const p2 = wrapped2("b");

    await delay(5);

    expect(limiter.active).toBe(2);

    // Third call on either wrapper should queue
    const p3 = wrapped1("c");

    await delay(5);
    expect(limiter.queued).toBe(1);

    resolvers[0]("done");
    await p1;

    await delay(5);
    expect(limiter.queued).toBe(0);
    expect(limiter.active).toBe(2);

    resolvers[1]("done");
    resolvers[2]("done");
    await Promise.all([p2, p3]);
  });
});

describe("composition with withRetry", () => {
  it("should compose withRetry(withRateLimit(fn))", async () => {
    const limiter = createRateLimiter({ concurrent: 10 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValue("success");

    const wrapped = withRetry(withRateLimit(fn, limiter), {
      retries: 2,
      baseMs: 10,
      jitter: false,
    });

    const result = await wrapped("req");

    expect(result).toBe("success");
    // withRetry retries, each retry goes through withRateLimit
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("XAI_RATE_LIMITS", () => {
  it("should have correct tier presets", () => {
    expect(XAI_RATE_LIMITS.free).toEqual({ rpm: 5, concurrent: 2 });
    expect(XAI_RATE_LIMITS.tier1).toEqual({ rpm: 60, concurrent: 10 });
    expect(XAI_RATE_LIMITS.tier2).toEqual({ rpm: 200, concurrent: 25 });
    expect(XAI_RATE_LIMITS.tier3).toEqual({ rpm: 500, concurrent: 50 });
    expect(XAI_RATE_LIMITS.tier4).toEqual({ rpm: 1000, concurrent: 100 });
  });

  it("should be usable with createRateLimiter", () => {
    const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);
    expect(limiter.active).toBe(0);
    expect(limiter.queued).toBe(0);
  });
});

describe("no-op with infinite limits", () => {
  it("should not limit when rpm and concurrent are Infinity", async () => {
    const limiter = createRateLimiter();
    const fn = vi.fn().mockResolvedValue("ok");
    const wrapped = withRateLimit(fn, limiter);

    const results = await Promise.all(
      Array.from({ length: 100 }, (_, i) => wrapped(`req${i}`))
    );

    expect(results).toHaveLength(100);
    expect(fn).toHaveBeenCalledTimes(100);
  });
});
