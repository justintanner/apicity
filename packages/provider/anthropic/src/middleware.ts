export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  factor?: number;
  jitter?: boolean;
}

export interface FallbackOptions {
  onFallback?: (error: unknown, index: number) => void;
}

function isTransientError(e: unknown): boolean {
  const status: number | null =
    (typeof e === "object" &&
      e !== null &&
      "status" in e &&
      typeof (e as { status?: unknown }).status === "number" &&
      (e as { status: number }).status) ||
    (typeof e === "object" &&
      e !== null &&
      "statusCode" in e &&
      typeof (e as { statusCode?: unknown }).statusCode === "number" &&
      (e as { statusCode: number }).statusCode) ||
    (typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code?: unknown }).code === "number" &&
      (e as { code: number }).code) ||
    null;

  if (typeof status === "number") {
    return status === 429 || status === 529 || status >= 500;
  }
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function withRetry<TReq, TRes>(
  fn: (req: TReq, signal?: AbortSignal) => Promise<TRes>,
  opts: RetryOptions = {}
): (req: TReq, signal?: AbortSignal) => Promise<TRes> {
  const retries = opts.retries ?? 2;
  const baseMs = opts.baseMs ?? 300;
  const factor = opts.factor ?? 2;
  const jitter = opts.jitter ?? true;

  return async (req: TReq, signal?: AbortSignal): Promise<TRes> => {
    let attempt = 0;

    while (true) {
      try {
        return await fn(req, signal);
      } catch (e) {
        attempt += 1;
        if (attempt > retries || !isTransientError(e) || signal?.aborted) {
          throw e;
        }

        const delay = baseMs * Math.pow(factor, attempt - 1);
        const wait = jitter
          ? Math.floor(delay * (0.8 + Math.random() * 0.4))
          : delay;

        await sleep(wait);
      }
    }
  };
}

export function withFallback<TReq, TRes>(
  fns: Array<(req: TReq, signal?: AbortSignal) => Promise<TRes>>,
  opts: FallbackOptions = {}
): (req: TReq, signal?: AbortSignal) => Promise<TRes> {
  if (fns.length === 0) {
    throw new Error("withFallback requires at least one function");
  }

  return async (req: TReq, signal?: AbortSignal): Promise<TRes> => {
    let lastError: unknown;
    for (let i = 0; i < fns.length; i++) {
      try {
        return await fns[i](req, signal);
      } catch (e) {
        lastError = e;
        opts.onFallback?.(e, i);
      }
    }
    throw lastError;
  };
}

export interface RateLimiterOptions {
  /** Maximum requests per minute (sliding window). Default: Infinity */
  rpm?: number;
  /** Maximum concurrent in-flight requests. Default: Infinity */
  concurrent?: number;
  /** Maximum time (ms) a request will wait in queue. Default: 60000 */
  maxQueueMs?: number;
}

export interface RateLimiter {
  /** Current number of in-flight requests */
  readonly active: number;
  /** Current number of queued requests waiting for a slot */
  readonly queued: number;
  /** Reject all queued requests and clean up timers */
  dispose(): void;
}

export interface RateLimitOptions {
  /** Override maxQueueMs for this particular wrapped function */
  maxQueueMs?: number;
}

interface QueueEntry {
  resolve: () => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  abortHandler: (() => void) | null;
  signal?: AbortSignal;
}

interface RateLimiterState {
  rpm: number;
  concurrent: number;
  maxQueueMs: number;
  timestamps: number[];
  activeCount: number;
  queue: QueueEntry[];
  drainTimerId: ReturnType<typeof setTimeout> | null;
  disposed: boolean;
}

function pruneTimestamps(state: RateLimiterState, now: number): void {
  const cutoff = now - 60_000;
  while (state.timestamps.length > 0 && state.timestamps[0] <= cutoff) {
    state.timestamps.shift();
  }
}

function tryDrain(state: RateLimiterState): void {
  const now = Date.now();
  pruneTimestamps(state, now);

  while (state.queue.length > 0) {
    if (state.timestamps.length >= state.rpm) break;
    if (state.activeCount >= state.concurrent) break;

    const entry = state.queue.shift()!;
    clearTimeout(entry.timeoutId);
    if (entry.signal && entry.abortHandler) {
      entry.signal.removeEventListener("abort", entry.abortHandler);
    }

    state.timestamps.push(now);
    state.activeCount++;
    entry.resolve();
  }

  if (state.drainTimerId !== null) {
    clearTimeout(state.drainTimerId);
    state.drainTimerId = null;
  }

  if (
    state.queue.length > 0 &&
    state.timestamps.length >= state.rpm &&
    state.timestamps.length > 0
  ) {
    const oldestExpiry = state.timestamps[0] + 60_000;
    const delay = Math.max(1, oldestExpiry - now);
    state.drainTimerId = setTimeout(() => {
      state.drainTimerId = null;
      tryDrain(state);
    }, delay);
  }
}

export function createRateLimiter(opts: RateLimiterOptions = {}): RateLimiter {
  const state: RateLimiterState = {
    rpm: opts.rpm ?? Infinity,
    concurrent: opts.concurrent ?? Infinity,
    maxQueueMs: opts.maxQueueMs ?? 60_000,
    timestamps: [],
    activeCount: 0,
    queue: [],
    drainTimerId: null,
    disposed: false,
  };

  function acquire(signal?: AbortSignal, maxQueueMs?: number): Promise<void> {
    if (state.disposed) {
      return Promise.reject(new Error("RateLimiter is disposed"));
    }

    const now = Date.now();
    pruneTimestamps(state, now);

    if (
      state.timestamps.length < state.rpm &&
      state.activeCount < state.concurrent
    ) {
      state.timestamps.push(now);
      state.activeCount++;
      return Promise.resolve();
    }

    if (signal?.aborted) {
      return Promise.reject(
        new DOMException("Rate limit queue aborted", "AbortError")
      );
    }

    const queueTimeout = maxQueueMs ?? state.maxQueueMs;

    return new Promise<void>((resolve, reject) => {
      const entry: QueueEntry = {
        resolve,
        reject,
        timeoutId: setTimeout(() => {
          const idx = state.queue.indexOf(entry);
          if (idx !== -1) {
            state.queue.splice(idx, 1);
            if (entry.signal && entry.abortHandler) {
              entry.signal.removeEventListener("abort", entry.abortHandler);
            }
            reject(
              new Error(`Rate limit queue timeout after ${queueTimeout}ms`)
            );
          }
        }, queueTimeout),
        abortHandler: null,
        signal,
      };

      if (signal) {
        const abortHandler = (): void => {
          const idx = state.queue.indexOf(entry);
          if (idx !== -1) {
            state.queue.splice(idx, 1);
            clearTimeout(entry.timeoutId);
            reject(new DOMException("Rate limit queue aborted", "AbortError"));
          }
        };
        signal.addEventListener("abort", abortHandler, { once: true });
        entry.abortHandler = abortHandler;
      }

      state.queue.push(entry);

      if (state.timestamps.length >= state.rpm && state.timestamps.length > 0) {
        if (state.drainTimerId === null) {
          const oldestExpiry = state.timestamps[0] + 60_000;
          const delay = Math.max(1, oldestExpiry - now);
          state.drainTimerId = setTimeout(() => {
            state.drainTimerId = null;
            tryDrain(state);
          }, delay);
        }
      }
    });
  }

  function release(): void {
    state.activeCount--;
    tryDrain(state);
  }

  const limiter = {
    get active(): number {
      return state.activeCount;
    },
    get queued(): number {
      return state.queue.length;
    },
    dispose(): void {
      state.disposed = true;
      if (state.drainTimerId !== null) {
        clearTimeout(state.drainTimerId);
        state.drainTimerId = null;
      }
      for (const entry of state.queue) {
        clearTimeout(entry.timeoutId);
        if (entry.signal && entry.abortHandler) {
          entry.signal.removeEventListener("abort", entry.abortHandler);
        }
        entry.reject(new Error("RateLimiter disposed"));
      }
      state.queue.length = 0;
    },
    _acquire: acquire,
    _release: release,
  };

  return limiter;
}

export function withRateLimit<TReq, TRes>(
  fn: (req: TReq, signal?: AbortSignal) => Promise<TRes>,
  limiter: RateLimiter,
  opts: RateLimitOptions = {}
): (req: TReq, signal?: AbortSignal) => Promise<TRes> {
  const internal = limiter as RateLimiter & {
    _acquire: (signal?: AbortSignal, maxQueueMs?: number) => Promise<void>;
    _release: () => void;
  };

  return async (req: TReq, signal?: AbortSignal): Promise<TRes> => {
    await internal._acquire(signal, opts.maxQueueMs);
    try {
      return await fn(req, signal);
    } finally {
      internal._release();
    }
  };
}
