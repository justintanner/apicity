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
