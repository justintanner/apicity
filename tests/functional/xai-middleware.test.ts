// Unit tests for xAI middleware.ts — pure HOFs, no API calls
import { describe, it, expect } from "vitest";
import {
  withRetry,
  withFallback,
} from "../../packages/provider/xai/src/middleware";

describe("xAI withRetry", () => {
  it("returns result on first success", async () => {
    const fn = async (x: number) => x * 2;
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(5)).toBe(10);
  });

  it("retries on transient error (5xx) and succeeds", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 3)
        throw Object.assign(new Error("Server error"), { status: 500 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(3);
  });

  it("retries on rate limit (429) and succeeds", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("Rate limited"), { status: 429 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("throws after exhausting retries", async () => {
    const fn = async () => {
      throw Object.assign(new Error("Always fails"), { status: 500 });
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("Always fails");
  });

  it("does not retry non-transient 4xx errors", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("Bad request"), { status: 400 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("Bad request");
    expect(calls).toBe(1);
  });

  it("does not retry 401 unauthorized", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("Unauthorized"), { status: 401 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("Unauthorized");
    expect(calls).toBe(1);
  });

  it("does not retry 403 forbidden", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("Forbidden");
    expect(calls).toBe(1);
  });

  it("does not retry 404 not found", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("Not found"), { status: 404 });
    };
    const retried = withRetry(fn, { retries: 3, baseMs: 1, jitter: false });
    await expect(retried(null)).rejects.toThrow("Not found");
    expect(calls).toBe(1);
  });

  it("passes request and signal through on success", async () => {
    const fn = async (req: string, signal?: AbortSignal) => {
      return `${req}-${signal ? "has-signal" : "no-signal"}`;
    };
    const retried = withRetry(fn);
    const controller = new AbortController();
    expect(await retried("hello", controller.signal)).toBe("hello-has-signal");
  });

  it("stops retrying when signal is aborted", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw Object.assign(new Error("Error"), { status: 500 });
    };
    const retried = withRetry(fn, { retries: 5, baseMs: 1, jitter: false });
    const controller = new AbortController();
    controller.abort();
    await expect(retried(null, controller.signal)).rejects.toThrow("Error");
    expect(calls).toBe(1);
  });

  it("uses default options when none provided", async () => {
    const fn = async () => "success";
    const retried = withRetry(fn);
    expect(await retried(null)).toBe("success");
  });

  it("handles statusCode property instead of status", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2)
        throw Object.assign(new Error("Error"), { statusCode: 503 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
  });

  it("handles code property for status", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("Error"), { code: 502 });
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
  });

  it("treats errors without status as transient", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw new Error("Network error");
      return "ok";
    };
    const retried = withRetry(fn, { retries: 2, baseMs: 1, jitter: false });
    expect(await retried(null)).toBe("ok");
    expect(calls).toBe(2);
  });
});

describe("xAI withFallback", () => {
  it("returns result from first function on success", async () => {
    const fn1 = async () => "primary";
    const fn2 = async () => "secondary";
    const fb = withFallback([fn1, fn2]);
    expect(await fb(null)).toBe("primary");
  });

  it("falls back to second function on first failure", async () => {
    const fn1 = async () => {
      throw new Error("Primary down");
    };
    const fn2 = async () => "secondary";
    const fb = withFallback([fn1, fn2]);
    expect(await fb(null)).toBe("secondary");
  });

  it("falls back through multiple failures", async () => {
    const fn1 = async () => {
      throw new Error("First");
    };
    const fn2 = async () => {
      throw new Error("Second");
    };
    const fn3 = async () => "third";
    const fb = withFallback([fn1, fn2, fn3]);
    expect(await fb(null)).toBe("third");
  });

  it("throws last error when all functions fail", async () => {
    const fn1 = async () => {
      throw new Error("First");
    };
    const fn2 = async () => {
      throw new Error("Second");
    };
    const fb = withFallback([fn1, fn2]);
    await expect(fb(null)).rejects.toThrow("Second");
  });

  it("calls onFallback callback on each failure", async () => {
    const errors: Array<{ error: unknown; index: number }> = [];
    const fn1 = async () => {
      throw new Error("Fail1");
    };
    const fn2 = async () => {
      throw new Error("Fail2");
    };
    const fn3 = async () => "ok";
    const fb = withFallback([fn1, fn2, fn3], {
      onFallback: (error, index) => errors.push({ error, index }),
    });
    await fb(null);
    expect(errors).toHaveLength(2);
    expect(errors[0].index).toBe(0);
    expect(errors[1].index).toBe(1);
  });

  it("throws if given empty array", () => {
    expect(() => withFallback([])).toThrow(
      "withFallback requires at least one function"
    );
  });

  it("works with single function in array", async () => {
    const fn = async () => "only";
    const fb = withFallback([fn]);
    expect(await fb(null)).toBe("only");
  });

  it("passes request and signal through", async () => {
    const fn1 = async (_req: string, _signal?: AbortSignal) => {
      throw new Error("Fail");
    };
    const fn2 = async (req: string, signal?: AbortSignal) => {
      return `${req}-${signal ? "has-signal" : "no-signal"}`;
    };
    const fb = withFallback([fn1, fn2]);
    const controller = new AbortController();
    expect(await fb("hello", controller.signal)).toBe("hello-has-signal");
  });
});
