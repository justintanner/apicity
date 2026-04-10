/**
 * Shared rate-limited xAI provider for integration tests.
 *
 * Uses XAI_RATE_LIMITS.tier1 (60 RPM, 10 concurrent) to prevent 429s
 * during test recording. During replay the limiter is a no-op since
 * Polly responses are instant.
 *
 * The rate limiter does NOT receive the provider's internal AbortSignal
 * so that the provider's 30s timeout doesn't cancel queued requests.
 */
import { xai, createRateLimiter, XAI_RATE_LIMITS } from "@nakedapi/xai";
import type { RateLimiter } from "@nakedapi/xai";

const limiter: RateLimiter & {
  _acquire: (signal?: AbortSignal, maxQueueMs?: number) => Promise<void>;
  _release: () => void;
} = createRateLimiter(XAI_RATE_LIMITS.tier1) as RateLimiter & {
  _acquire: (signal?: AbortSignal, maxQueueMs?: number) => Promise<void>;
  _release: () => void;
};

function rateLimitedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Don't pass the signal to acquire — the provider's internal timeout
  // would cancel queued requests before the rate limit window slides.
  return limiter
    ._acquire()
    .then(() => fetch(input, init).finally(() => limiter._release()));
}

export function createXaiProvider() {
  return xai({
    apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    timeout: 60_000,
    fetch: rateLimitedFetch,
  });
}
