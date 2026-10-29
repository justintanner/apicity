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
 * `fal.v1.models.pricing.estimate`. That API prices a QUANTITY, never a request
 * payload: `unit_price` multiplies the endpoint's unit price by a caller-supplied
 * `unit_quantity`, and `historical_api_price` multiplies fal's historical
 * average per call by a `call_quantity` (fal's documented oneOf; a payload in
 * its place is a 400). So a number needs a quantity the caller supplies —
 * typically the billed units fal reports after a call in the
 * `x-fal-billable-units` response header. Without one, nothing is asked
 * (ac-ytg1l1). The open question this module settles is WHERE that call
 * belongs.
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
 *       "google/gemini-omni-flash/v1.1/text-to-video",
 *       { prompt: "a red panda", duration: 5 },
 *       fal.v1.models.pricing.estimate,
 *       { unitQuantity: 5 } // e.g. a prior call's x-fal-billable-units
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
 * on `@apicity/fal`; the provider's own function satisfies it as-is. The
 * request is fal's documented oneOf — one quantity per endpoint, matching the
 * estimate type — so a request payload in an `endpoints` value does not
 * type-check (ac-ytg1l1).
 */
export type FalEstimator = (
  request:
    | {
        estimate_type: "unit_price";
        endpoints: Record<string, { unit_quantity: number }>;
      }
    | {
        estimate_type: "historical_api_price";
        endpoints: Record<string, { call_quantity: number }>;
      }
) => Promise<FalEstimateLike>;

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
 * A payload-sensitive cache key: the endpoint plus a canonical form of the
 * payload, for a caller whose `keyFor` wants one.
 *
 * It is no longer the resolver's default. fal's answer depends on the endpoint,
 * the estimate type and the quantity, never on the payload, so the default key
 * is exactly those three; whatever `keyFor` returns gets the estimate type and
 * quantity appended, so a cached answer is never served for another quantity
 * (ac-ytg1l1).
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
  /**
   * Billed units to price with fal's unit price (`estimate_type: "unit_price"`),
   * in the endpoint's own unit — seconds, megapixels, images or 1000-token
   * units — for example a finished call's `x-fal-billable-units` header.
   * Finite and at least 0.000001, as fal requires. The answer is that exact
   * quantity priced, with no warning. Exclusive with `callQuantity`.
   */
  unitQuantity?: number;
  /**
   * Calls to price with fal's historical average per call
   * (`estimate_type: "historical_api_price"`). An integer of at least 1. The
   * average comes from fal's past usage of the endpoint, not from this
   * request, so the answer always carries a warning that it ignores the
   * payload. Exclusive with `unitQuantity`.
   */
  callQuantity?: number;
  /** Optional cache; omitted means every priced lookup reaches the estimator. */
  cache?: FalEstimateCache;
  /**
   * Prefix for the cache key, replacing the endpoint. The estimate type and
   * quantity are always appended.
   */
  keyFor?: (endpoint: string, payload: Record<string, unknown>) => string;
}

type FalEstimateBasis =
  | { estimate_type: "unit_price"; quantity: number }
  | { estimate_type: "historical_api_price"; quantity: number };

// Which estimate the caller asked for, or why none can be asked. undefined
// means neither quantity was given: no remote call, by design.
function pickBasis(
  endpoint: string,
  { unitQuantity, callQuantity }: ResolveFalDynamicEstimateOptions
): FalEstimateBasis | string | undefined {
  if (unitQuantity !== undefined && callQuantity !== undefined) {
    return `fal pricing estimate for '${endpoint}' not requested: pass unitQuantity or callQuantity, not both`;
  }
  if (unitQuantity !== undefined) {
    return Number.isFinite(unitQuantity) && unitQuantity >= 0.000001
      ? { estimate_type: "unit_price", quantity: unitQuantity }
      : `fal pricing estimate for '${endpoint}' not requested: unitQuantity ${String(unitQuantity)} must be a finite number of at least 0.000001`;
  }
  if (callQuantity !== undefined) {
    return Number.isInteger(callQuantity) && callQuantity >= 1
      ? { estimate_type: "historical_api_price", quantity: callQuantity }
      : `fal pricing estimate for '${endpoint}' not requested: callQuantity ${String(callQuantity)} must be an integer of at least 1`;
  }
  return undefined;
}

/**
 * Resolve a fal estimate, using the remote pricing API only where the local
 * table deliberately has no rate.
 *
 * Statically-priced endpoints never reach the network: they fall through to
 * `computeEstimate` unchanged, so wiring this in does not turn every estimate
 * into a request.
 *
 * A dynamic endpoint reaches fal only with a quantity: `options.unitQuantity`
 * prices those billed units exactly, and `options.callQuantity` asks for fal's
 * historical average per call, which ignores the payload and says so in a
 * warning. With neither, nothing is called and the local `usd: 0` comes back
 * with a warning naming both options (ac-ytg1l1).
 *
 * A failed or malformed remote answer degrades to the local estimate —
 * `usd: 0` plus a warning naming the call — rather than throwing. An estimate
 * is advisory; making a caller's cost preview fail because a pricing lookup
 * timed out would be the wrong trade.
 *
 * Pass `options.cache` to collapse repeat lookups. Only usable answers are
 * cached: a transient outage must not pin a `usd: 0` for the whole TTL.
 *
 * @param endpoint - fal endpoint id, e.g. `google/gemini-omni-flash/v1.1/text-to-video`
 * @param payload - the request body the caller intends to send
 * @param estimate - fal's estimator, e.g. `fal.v1.models.pricing.estimate`
 * @param options - hints, the quantity to price, cache, and cache-key prefix
 */
export async function resolveFalDynamicEstimate(
  endpoint: string,
  payload: Record<string, unknown>,
  estimate: FalEstimator,
  options: ResolveFalDynamicEstimateOptions = {}
): Promise<CostEstimate> {
  const { hints, cache, keyFor } = options;

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

  const basis = pickBasis(endpoint, options);
  if (basis === undefined) {
    return withWarning(
      local,
      `fal pricing estimate for '${endpoint}' not requested: pass options.unitQuantity (the billed units, e.g. a finished call's x-fal-billable-units header) for an exact number, or options.callQuantity for fal's historical average per call, which ignores the payload`
    );
  }
  if (typeof basis === "string") return withWarning(local, basis);

  // fal's answer depends on the endpoint, the estimate type and the quantity,
  // never on the payload; the quantity discriminator is always part of the key.
  const cacheKey = cache
    ? `${keyFor ? keyFor(endpoint, payload) : endpoint}\u0000${basis.estimate_type}\u0000${basis.quantity}`
    : undefined;
  if (cache && cacheKey !== undefined) {
    const cached = await cache.get(cacheKey);
    if (cached) return fromAnswer(cached, endpoint, local, basis).estimate;
  }

  let answer: FalEstimateLike;
  try {
    answer = await estimate(
      basis.estimate_type === "unit_price"
        ? {
            estimate_type: "unit_price",
            endpoints: { [endpoint]: { unit_quantity: basis.quantity } },
          }
        : {
            estimate_type: "historical_api_price",
            endpoints: { [endpoint]: { call_quantity: basis.quantity } },
          }
    );
  } catch (error) {
    return withWarning(
      local,
      `fal pricing estimate failed for '${endpoint}': ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const resolved = fromAnswer(answer, endpoint, local, basis);
  // Cache only a usable answer. A throw, a missing total, or a non-USD quote
  // all degrade to the local warning, and pinning that for the TTL would turn
  // a blip into minutes of silently unpriced estimates. A historical answer is
  // usable even though it always carries its payload-ignored warning.
  if (cache && cacheKey !== undefined && resolved.usable) {
    await cache.set(cacheKey, answer);
  }
  return resolved.estimate;
}

/** Convert a remote answer into a `CostEstimate`, or degrade to the local one. */
function fromAnswer(
  answer: FalEstimateLike,
  endpoint: string,
  local: CostEstimate,
  basis: FalEstimateBasis
): { estimate: CostEstimate; usable: boolean } {
  if (
    typeof answer?.total_cost !== "number" ||
    !Number.isFinite(answer.total_cost)
  ) {
    return {
      estimate: withWarning(
        local,
        `fal pricing estimate for '${endpoint}' returned no usable total_cost`
      ),
      usable: false,
    };
  }
  if (answer.currency && answer.currency.toUpperCase() !== "USD") {
    return {
      estimate: withWarning(
        local,
        `fal pricing estimate for '${endpoint}' quoted ${answer.currency}, not USD`
      ),
      usable: false,
    };
  }

  return {
    estimate: {
      usd: answer.total_cost,
      currency: "USD",
      source: "per-unit-table",
      breakdown: {},
      // The remote answer is priced as of now, not as of a table pull.
      rateAsOf: null,
      warnings:
        basis.estimate_type === "historical_api_price"
          ? [
              `fal pricing estimate for '${endpoint}' is fal's historical average per call x ${basis.quantity}; it ignores this request's payload`,
            ]
          : [],
    },
    usable: true,
  };
}

function withWarning(estimate: CostEstimate, warning: string): CostEstimate {
  return {
    ...estimate,
    rateAsOf: estimate.rateAsOf ?? PRICING_AS_OF,
    warnings: [...estimate.warnings, warning],
  };
}
