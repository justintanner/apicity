import type {
  CostActual,
  CostComparison,
  CostEstimate,
  EndpointEstimate,
} from "./types";

const DEFAULT_TOLERANCE = 0.02;

/**
 * Compares a quoted estimate with what a call actually cost.
 *
 * `tolerance` is the share of the actual that still counts as a match. The
 * default is 0.02 (2%). The actual side is `statedListUsd ?? usd`, so a credit
 * or promotion that lowers what was paid is not reported as a rate error.
 * `deltaUsd` is estimate minus actual and `ratio` is estimate over actual, so a
 * ratio above 1 means the estimate ran high.
 *
 * Verdicts, in the order they are decided:
 * - "free": the estimate names a free call and the actual is zero or absent, or
 *   both sides are zero. A free estimate with a positive actual is "under",
 *   because that row is not free after all.
 * - "no-actual": the exchange reported no figure (`usage-only` or `none`).
 * - "no-estimate": none was quoted, or the estimator failed closed.
 * - "match", "over", "under": both figures exist, and the estimate is within
 *   tolerance of, above, or below the actual.
 */
export function compareCost(
  estimate: CostEstimate | null,
  actual: CostActual,
  options?: { tolerance?: number }
): CostComparison {
  const tolerance = options?.tolerance ?? DEFAULT_TOLERANCE;
  const actualUsd = actual.statedListUsd ?? actual.usd;
  const failedClosed =
    estimate !== null &&
    estimate.usd === 0 &&
    !namesAFreeCall(estimate) &&
    estimate.warnings.length > 0;
  const estimateUsd = estimate === null || failedClosed ? null : estimate.usd;
  const base = { estimateUsd, actualUsd, basis: actual.basis };

  const freeEstimate = estimate !== null && namesAFreeCall(estimate);
  if (
    (freeEstimate && (actualUsd === null || actualUsd === 0)) ||
    (estimateUsd === 0 && actualUsd === 0)
  ) {
    return { ...base, deltaUsd: 0, ratio: null, verdict: "free" };
  }
  if (actualUsd === null) {
    return { ...base, deltaUsd: null, ratio: null, verdict: "no-actual" };
  }
  if (estimateUsd === null) {
    return { ...base, deltaUsd: null, ratio: null, verdict: "no-estimate" };
  }
  const deltaUsd = estimateUsd - actualUsd;
  const ratio = actualUsd === 0 ? null : estimateUsd / actualUsd;
  const allowed = Math.abs(actualUsd) * tolerance;
  const verdict =
    Math.abs(deltaUsd) <= allowed ? "match" : deltaUsd > 0 ? "over" : "under";
  return { ...base, deltaUsd, ratio, verdict };
}

// EndpointEstimate marks a free, followup or subscription row with status "zero".
function namesAFreeCall(estimate: CostEstimate): boolean {
  return (
    estimate.source === "free" ||
    (estimate as Partial<EndpointEstimate>).status === "zero"
  );
}
