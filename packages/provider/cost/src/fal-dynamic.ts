import { PRICING_AS_OF } from "./pricing/index";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "./pricing/fal";
import { computeEstimate } from "./compute";
import type { CostEstimate, CostHints } from "./types";

/**
 * Resolving a real number for fal's dynamically-priced endpoints.
 *
 * `FAL_DYNAMIC_PRICING_ENDPOINTS` lists endpoints whose price cannot be derived
 * from the request payload — compute seconds, delivered output metadata, or
 * tokens with no published per-image constant. `computeEstimate` reports those
 * as `usd: 0` and names the call that would answer, which is honest but not a
 * number (ac-nz65nc).
 *
 * The call it names is `POST /v1/models/pricing/estimate`, already exposed as
 * `fal.v1.models.pricing.estimate`. The open question this module settles is
 * WHERE that call belongs.
 *
 * It does not belong inside `computeEstimate`. `@apicity/cost` is
 * dependency-free and its estimation is pure local computation; importing a
 * provider or reaching the network from it would invert the contract every
 * other caller relies on, and would make a synchronous function async for the
 * ninety-odd endpoints that never needed it.
 *
 * So the network stays with the caller and this module takes the estimator as
 * an argument. `@apicity/cost` still imports nothing, still performs no I/O,
 * and still has no knowledge of fal's transport or credentials — it only knows
 * the SHAPE of an answer it can convert into a `CostEstimate`. A caller wires
 * in the provider it already has:
 *
 *     import { createFal } from "@apicity/fal";
 *     import { resolveFalDynamicEstimate } from "@apicity/cost";
 *
 *     const fal = createFal({ apiKey: process.env.FAL_ADMIN_API_KEY });
 *     const estimate = await resolveFalDynamicEstimate(
 *       "alibaba/wan-3.0/text-to-video",
 *       { prompt: "a red panda", duration: 5 },
 *       fal.v1.models.pricing.estimate
 *     );
 *
 * Note the credential: the pricing API lives on `api.fal.ai` and needs
 * `FAL_ADMIN_API_KEY`, not the generation-scoped `FAL_API_KEY`.
 */

/** The subset of fal's estimate response this module reads. */
export interface FalEstimateLike {
  total_cost: number;
  currency: string;
  estimate_type?: string;
}

/**
 * Any function shaped like `fal.v1.models.pricing.estimate`.
 *
 * Declared structurally rather than imported so this module has no dependency
 * on `@apicity/fal`; the provider's own function satisfies it as-is.
 */
export type FalEstimator = (request: {
  estimate_type: "historical_api_price" | "unit_price";
  endpoints: Record<string, unknown>;
}) => Promise<FalEstimateLike>;

/** Whether an endpoint is deliberately unpriced rather than unknown. */
export function isFalDynamicPricingEndpoint(endpoint: string): boolean {
  return (FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).includes(
    endpoint
  );
}

/**
 * A cache `resolveFalDynamicEstimate` can consult, supplied by the caller.
 *
 * Deliberately an argument rather than a module-level map. `@apicity/cost` is
 * otherwise stateless, and a built-in cache would make two unrelated callers in
 * one process share a store neither asked for, with a lifetime neither
 * controls. The caller owns the policy; this package only reads and writes
 * through the two methods (ac-ehulwa).
 *
 * `get` returns `undefined` for a miss. Implementations may be async.
 */
export interface FalEstimateCache {
  get(
    key: string
  ): FalEstimateLike | undefined | Promise<FalEstimateLike | undefined>;
  set(key: string, value: FalEstimateLike): void | Promise<void>;
}

export interface FalEstimateCacheOptions {
  /**
   * How long an entry stays fresh, in milliseconds.
   *
   * Required, with no default. fal moves these rates on fal's cadence, and how
   * stale an advisory number may be is a decision about the caller's product,
   * not one this package can make for it. A short TTL collapses a burst (a
   * cost preview re-estimating per keystroke) while still picking up a rate
   * change within minutes; a long one trades that for staleness.
   */
  ttlMs: number;
  /**
   * Hard cap on retained entries; the oldest insert is evicted at the cap.
   *
   * An unbounded map in a long-lived process is a leak — the key includes the
   * payload, so a service estimating varied requests would grow without limit.
   */
  maxEntries?: number;
}

/**
 * A bounded, TTL'd in-memory cache satisfying `FalEstimateCache`.
 *
 * Provided so callers do not have to hand-roll one, not because this policy is
 * the right one for everybody — a caller with different needs passes its own
 * object instead. Dependency-free and synchronous; eviction is
 * oldest-insert-first, which is enough for a cache whose entries expire anyway.
 */
export function createFalEstimateCache(
  options: FalEstimateCacheOptions
): FalEstimateCache {
  const { ttlMs, maxEntries = 256 } = options;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error("createFalEstimateCache: ttlMs must be a positive number");
  }
  if (!Number.isFinite(maxEntries) || maxEntries <= 0) {
    throw new Error(
      "createFalEstimateCache: maxEntries must be a positive number"
    );
  }
  const entries = new Map<
    string,
    { value: FalEstimateLike; expires: number }
  >();
  return {
    get(key) {
      const hit = entries.get(key);
      if (!hit) return undefined;
      if (hit.expires <= Date.now()) {
        entries.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      if (entries.size >= maxEntries && !entries.has(key)) {
        const oldest = entries.keys().next();
        if (!oldest.done) entries.delete(oldest.value);
      }
      entries.set(key, { value, expires: Date.now() + ttlMs });
    },
  };
}

/**
 * The default cache key: the endpoint plus a canonical form of the payload.
 *
 * Keys on the WHOLE payload rather than a guessed set of pricing-relevant
 * fields. That is deliberately conservative — changing a `seed` misses the
 * cache and costs one extra request — because the failure modes are not
 * symmetric: an unnecessary request is cheap, and a payload field wrongly
 * assumed price-irrelevant returns a wrong number for money. A caller that
 * knows its own payloads can narrow this through `keyFor`.
 *
 * Object keys are sorted so key order in the payload does not fragment the
 * cache.
 */
export function falEstimateCacheKey(
  endpoint: string,
  payload: Record<string, unknown>
): string {
  return `${endpoint}\u0000${canonical(payload)}`;
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}

/** Options for `resolveFalDynamicEstimate`. */
export interface ResolveFalDynamicEstimateOptions {
  /** Cost-only hints, forwarded to the local path. */
  hints?: CostHints;
  /** Optional cache; omitted means every dynamic call reaches the estimator. */
  cache?: FalEstimateCache;
  /** Override the default whole-payload cache key. */
  keyFor?: (endpoint: string, payload: Record<string, unknown>) => string;
}

/**
 * Resolve a fal estimate, using the remote pricing API only where the local
 * table deliberately has no rate.
 *
 * Statically-priced endpoints never reach the network: they fall through to
 * `computeEstimate` unchanged, so wiring this in does not turn every estimate
 * into a request.
 *
 * A failed or malformed remote answer degrades to exactly today's behaviour —
 * `usd: 0` plus a warning naming the call — rather than throwing. An estimate
 * is advisory; making a caller's cost preview fail because a pricing lookup
 * timed out would be the wrong trade.
 *
 * Pass `options.cache` to collapse repeat lookups. Only successful answers are
 * cached: a transient outage must not pin a `usd: 0` for the whole TTL.
 *
 * @param endpoint - fal endpoint id, e.g. `alibaba/wan-3.0/text-to-video`
 * @param payload - the request body the caller intends to send
 * @param estimate - fal's estimator, e.g. `fal.v1.models.pricing.estimate`
 * @param options - hints, cache, and cache-key overrides
 */
export async function resolveFalDynamicEstimate(
  endpoint: string,
  payload: Record<string, unknown>,
  estimate: FalEstimator,
  options: ResolveFalDynamicEstimateOptions = {}
): Promise<CostEstimate> {
  const { hints, cache, keyFor = falEstimateCacheKey } = options;

  if (!isFalDynamicPricingEndpoint(endpoint)) {
    return computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      ...(hints ? { costHints: hints } : {}),
    });
  }

  const local = computeEstimate({
    provider: "fal",
    endpoint,
    payload,
    ...(hints ? { costHints: hints } : {}),
  });

  const cacheKey = cache ? keyFor(endpoint, payload) : undefined;
  if (cache && cacheKey !== undefined) {
    const cached = await cache.get(cacheKey);
    if (cached) return fromAnswer(cached, endpoint, local);
  }

  let answer: FalEstimateLike;
  try {
    answer = await estimate({
      estimate_type: "unit_price",
      endpoints: { [endpoint]: payload },
    });
  } catch (error) {
    return withWarning(
      local,
      `fal pricing estimate failed for '${endpoint}': ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const resolved = fromAnswer(answer, endpoint, local);
  // Cache only a usable answer. A throw, a missing total, or a non-USD quote
  // all degrade to the local warning, and pinning that for the TTL would turn
  // a blip into minutes of silently unpriced estimates.
  if (cache && cacheKey !== undefined && resolved.warnings.length === 0) {
    await cache.set(cacheKey, answer);
  }
  return resolved;
}

/** Convert a remote answer into a `CostEstimate`, or degrade to the local one. */
function fromAnswer(
  answer: FalEstimateLike,
  endpoint: string,
  local: CostEstimate
): CostEstimate {
  if (
    typeof answer?.total_cost !== "number" ||
    !Number.isFinite(answer.total_cost)
  ) {
    return withWarning(
      local,
      `fal pricing estimate for '${endpoint}' returned no usable total_cost`
    );
  }
  if (answer.currency && answer.currency.toUpperCase() !== "USD") {
    return withWarning(
      local,
      `fal pricing estimate for '${endpoint}' quoted ${answer.currency}, not USD`
    );
  }

  return {
    usd: answer.total_cost,
    currency: "USD",
    source: "per-unit-table",
    breakdown: {},
    // The remote answer is priced as of now, not as of a table pull.
    rateAsOf: null,
    warnings: [],
  };
}

function withWarning(estimate: CostEstimate, warning: string): CostEstimate {
  return {
    ...estimate,
    rateAsOf: estimate.rateAsOf ?? PRICING_AS_OF,
    warnings: [...estimate.warnings, warning],
  };
}
