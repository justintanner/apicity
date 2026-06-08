export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  factor?: number;
  jitter?: boolean;
}

export interface FallbackOptions {
  onFallback?: (error: unknown, index: number) => void;
}

function isTransientError(error: unknown): boolean {
  const status: number | null =
    (typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number" &&
      (error as { status: number }).status) ||
    (typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number" &&
      (error as { statusCode: number }).statusCode) ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "number" &&
      (error as { code: number }).code) ||
    null;

  if (typeof status === "number") {
    return status === 429 || status === 418 || status >= 500;
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
      } catch (error) {
        attempt += 1;
        if (attempt > retries || !isTransientError(error) || signal?.aborted) {
          throw error;
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
      } catch (error) {
        lastError = error;
        opts.onFallback?.(error, i);
      }
    }
    throw lastError;
  };
}
