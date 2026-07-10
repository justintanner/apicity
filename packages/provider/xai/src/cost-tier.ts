// AUTO-GENERATED from packages/provider/cost/src/cost-tier.ts; do not edit.
// Edit the canonical file and run `pnpm run gen:shared`.
/**
 * Canonical cost-tier policy for the whole monorepo.
 *
 * There is exactly ONE cost-tier classification, and it lives here. Every
 * consumer (provider classification, example/doc gating, tooling) must key off
 * these tiers and boundary constants rather than re-deriving thresholds.
 *
 * Tiers key off the per-call USD estimate produced by `computeEstimate` /
 * `createCost`:
 *
 *   • cheap       — estimated cost <= USD 0.01 (includes $0 free endpoints)
 *   • expensive   — USD 0.01 < cost <= USD 1.00
 *   • prohibitive — cost > USD 1.00, OR the endpoint has no known/derivable
 *                   cost policy (unknown => prohibitive, fail-safe)
 *
 * Boundaries are inclusive at the top of each finite tier: exactly 0.01 is
 * cheap, exactly 1.00 is expensive, and anything strictly above 1.00 is
 * prohibitive.
 *
 * This module is additive, pure, and self-contained: it never mutates or
 * re-shapes an estimate, introduces no new dependencies, and imports no other
 * module — so it can be vendored verbatim into provider packages that already
 * carry the pay-gate source.
 */

/**
 * The subset of a cost estimate that the tier policy reads. The `CostEstimate`
 * produced by `computeEstimate` / `createCost` is structurally assignable to
 * this type, so callers pass estimates directly.
 */
export interface TierEstimate {
  /** Estimated per-call cost in USD. */
  usd: number;
  /** Estimate source; `"free"` marks a genuinely free endpoint. */
  source: string;
  /** Rate breakdown; the presence of a rate field marks a resolved policy. */
  breakdown: {
    inputUsdPerMillion?: number;
    outputUsdPerMillion?: number;
    perUnitUsd?: number;
  };
}

/** The canonical cost tiers, cheapest to most costly. */
export type CostTier = "cheap" | "expensive" | "prohibitive";

/** All canonical tiers in ascending cost order. */
export const COST_TIERS = ["cheap", "expensive", "prohibitive"] as const;

/**
 * Inclusive upper bound (USD) of the `cheap` tier.
 * A cost `usd` is cheap when `usd <= CHEAP_MAX_USD`.
 */
export const CHEAP_MAX_USD = 0.01;

/**
 * Inclusive upper bound (USD) of the `expensive` tier.
 * A cost `usd` is expensive when `CHEAP_MAX_USD < usd <= EXPENSIVE_MAX_USD`.
 */
export const EXPENSIVE_MAX_USD = 1.0;

/**
 * Classify a concrete USD cost into a tier.
 *
 * A missing, non-finite, or negative cost is treated as an unknown/underivable
 * policy and classified as `prohibitive` (fail-safe). Otherwise:
 *
 *   • `usd <= 0.01`               → `cheap`
 *   • `0.01 < usd <= 1.00`        → `expensive`
 *   • `usd > 1.00`                → `prohibitive`
 */
export function classifyCostUsd(usd: number | null | undefined): CostTier {
  if (usd === null || usd === undefined || !Number.isFinite(usd) || usd < 0) {
    return "prohibitive";
  }
  if (usd <= CHEAP_MAX_USD) return "cheap";
  if (usd <= EXPENSIVE_MAX_USD) return "expensive";
  return "prohibitive";
}

/**
 * Whether a cost estimate carries a known/derivable cost policy.
 *
 * `true` only when the estimate resolved a concrete rate: a genuinely free
 * endpoint (`source === "free"`), or an estimate whose breakdown applied a
 * token rate (`inputUsdPerMillion` / `outputUsdPerMillion`) or a per-unit rate
 * (`perUnitUsd`). A `usd: 0` estimate produced by a pricing-table miss carries
 * none of these fields and is therefore reported as unknown.
 *
 * A `null`/`undefined` estimate (a paid endpoint with no estimate at all) is
 * unknown.
 */
export function isCostPolicyKnown(
  estimate: TierEstimate | null | undefined
): boolean {
  if (!estimate) return false;
  if (estimate.source === "free") return true;
  const { breakdown } = estimate;
  return (
    breakdown.inputUsdPerMillion !== undefined ||
    breakdown.outputUsdPerMillion !== undefined ||
    breakdown.perUnitUsd !== undefined
  );
}

/**
 * Classify a cost estimate into a tier.
 *
 * An estimate with an unknown/underivable cost policy — including a
 * `null`/`undefined` estimate for a paid endpoint with no estimate — is
 * classified as `prohibitive` (fail-safe). Otherwise the estimate's derived
 * `usd` is passed to {@link classifyCostUsd}.
 */
export function classifyEstimate(
  estimate: TierEstimate | null | undefined
): CostTier {
  if (!isCostPolicyKnown(estimate)) return "prohibitive";
  return classifyCostUsd((estimate as TierEstimate).usd);
}
