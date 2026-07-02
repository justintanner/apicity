import type { RateLimiterOptions } from "./middleware";

export const ZAICODING_RATE_LIMITS = {
  free: { rpm: 5, concurrent: 2 },
  tier1: { rpm: 60, concurrent: 10 },
  tier2: { rpm: 200, concurrent: 25 },
  tier3: { rpm: 500, concurrent: 50 },
  tier4: { rpm: 1000, concurrent: 100 },
} as const satisfies Record<string, RateLimiterOptions>;
