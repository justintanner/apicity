import type { Provider, ChatRequest, ChatStreamChunk } from "./types";

// Retry middleware
export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  factor?: number;
  jitter?: boolean;
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
    return status === 429 || status >= 500;
  }
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function withRetry(
  provider: Provider,
  opts: RetryOptions = {}
): Provider {
  const retries = opts.retries ?? 2;
  const baseMs = opts.baseMs ?? 300;
  const factor = opts.factor ?? 2;
  const jitter = opts.jitter ?? true;

  async function* retryStream(
    req: ChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<ChatStreamChunk> {
    let attempt = 0;

    while (true) {
      try {
        for await (const chunk of provider.coding.v1.messages.stream(
          req,
          signal
        )) {
          yield chunk;
        }
        return;
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
  }

  const messages = Object.assign(
    async (req: ChatRequest, signal?: AbortSignal) => {
      return provider.coding.v1.messages(req, signal);
    },
    { stream: retryStream }
  );

  return {
    coding: {
      v1: {
        messages,
      },
    },

    async getModels() {
      return provider.getModels();
    },

    validateModel(modelId: string) {
      return provider.validateModel(modelId);
    },

    getMaxTokens(modelId: string) {
      return provider.getMaxTokens(modelId);
    },
  };
}

// Fallback middleware
export interface FallbackOptions {
  onFallback?: (error: unknown, index: number) => void;
}

export function withFallback(
  providers: Provider[],
  opts: FallbackOptions = {}
): Provider {
  if (providers.length === 0) {
    throw new Error("withFallback requires at least one provider");
  }

  async function* fallbackStream(
    req: ChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<ChatStreamChunk> {
    let lastError: unknown;
    for (let i = 0; i < providers.length; i++) {
      try {
        for await (const chunk of providers[i].coding.v1.messages.stream(
          req,
          signal
        )) {
          yield chunk;
        }
        return;
      } catch (e) {
        lastError = e;
        opts.onFallback?.(e, i);
        // continue to next provider
      }
    }
    throw lastError;
  }

  const messages = Object.assign(
    async (req: ChatRequest, signal?: AbortSignal) => {
      return providers[0].coding.v1.messages(req, signal);
    },
    { stream: fallbackStream }
  );

  return {
    coding: {
      v1: {
        messages,
      },
    },

    async getModels() {
      return providers[0].getModels();
    },

    validateModel(modelId: string) {
      return providers[0].validateModel(modelId);
    },

    getMaxTokens(modelId: string) {
      return providers[0].getMaxTokens(modelId);
    },
  };
}
