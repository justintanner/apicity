// Tests for Fal middleware functions — pure HOFs, no API calls
// Tests withRetry and withFallback from the Fal provider middleware
import { describe, it, expect } from "vitest";
import {
  withRetry,
  withFallback,
} from "../../packages/provider/fal/src/middleware";

describe("withRetry", () => {
  it("should return result on first success", async () => {
    const fn = async (x: number) => x * 2;
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(5)).toBe(10);
  });

  it("should retry on transient error (500) and succeed", async () => {
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

  it("should retry on transient error (429 rate limit) and succeed", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("rate limit"), { status: 429 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should not retry on 400 errors (non-transient)", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("bad request"), { status: 400 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("bad request");
    expect(calls).toBe(1);
  });

  it("should not retry on 401 errors (non-transient)", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("unauthorized"), { status: 401 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("unauthorized");
    expect(calls).toBe(1);
  });

  it("should not retry on 403 errors (non-transient)", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("forbidden"), { status: 403 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("forbidden");
    expect(calls).toBe(1);
  });

  it("should not retry on 404 errors (non-transient)", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("not found"), { status: 404 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("not found");
    expect(calls).toBe(1);
  });

  it("should treat 500+ errors as transient", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("server"), { status: 502 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat 503 errors as transient", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("unavailable"), { status: 503 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat 504 errors as transient", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("gateway timeout"), { status: 504 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should throw after exhausting retries", async () => {
    const fn = async () => {
      throw Object.assign(new Error("always fail"), { status: 500 });
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("always fail");
  });

  it("should pass request and signal through to wrapped function", async () => {
    const fn = async (req: string, signal?: AbortSignal) => {
      return `${req}-${signal ? "has-signal" : "no-signal"}`;
    };
    const retried = withRetry(fn);
    const controller = new AbortController();
    expect(await retried("hello", controller.signal)).toBe("hello-has-signal");
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

    await expect(retried(null, controller.signal)).rejects.toThrow("fail");
    expect(calls).toBe(1);
  });

  it("should use default retry options when not specified", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };
    // Default: retries=2, baseMs=300, factor=2, jitter=true
    const retried = withRetry(fn);
    expect(await retried(null)).toBe("ok");
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
    await retried(null);

    // We can't directly observe the delays, but we can verify the function succeeds after retries
    expect(calls).toBe(3);
  });

  it("should apply jitter when enabled", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };

    // Jitter is enabled by default - test that it works without error
    const retried = withRetry(fn, {
      retries: 2,
      baseMs: 1,
      jitter: true, // default
    });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should calculate exponential backoff with custom factor", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 3) throw Object.assign(new Error("fail"), { status: 500 });
      return "ok";
    };

    const retried = withRetry(fn, {
      retries: 3,
      baseMs: 10,
      factor: 3,
      jitter: false,
    });
    await retried(null);

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
    expect(await retried(null)).toBe("ok");
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
    expect(await retried(null)).toBe("ok");
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
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat errors with null status as transient", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("fail"), { status: null });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("should treat errors with undefined status as transient", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("fail"), { status: undefined });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
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
    const fn1 = async (
      _req: string,
      _signal?: AbortSignal
    ): Promise<Result> => {
      throw new Error("fail");
    };
    const fn2 = async (
      _req: string,
      _signal?: AbortSignal
    ): Promise<Result> => ({ data: "success", count: 42 });
    const fb = withFallback<string, Result>([fn1, fn2]);
    const result = await fb("ignored");
    expect(result).toEqual({ data: "success", count: 42 });
  });

  it("should handle async errors correctly", async () => {
    const fn1 = async () => {
      throw Object.assign(new Error("async fail"), { status: 500 });
    };
    const fn2 = async () => "recovered";
    const fb = withFallback([fn1, fn2]);
    expect(await fb(null)).toBe("recovered");
  });

  it("should not call onFallback when first function succeeds", async () => {
    const errors: Array<{ error: unknown; index: number }> = [];
    const fn1 = async () => "success";
    const fn2 = async () => "backup";
    const fb = withFallback([fn1, fn2], {
      onFallback: (error, index) => errors.push({ error, index }),
    });
    expect(await fb(null)).toBe("success");
    expect(errors).toHaveLength(0);
  });
});
