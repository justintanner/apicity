import { computeEstimate } from "./compute";
/**
 * Exact paid-endpoint registry.
 *
 * Only endpoints listed here are considered paid. All unlisted endpoints
 * are assumed free and must preserve current behavior with no caller changes.
 *
 * Matching is exact: provider + method + dotPath. No regex, prefix,
 * wildcard, path-family, generated broad match, or fallback-by-method logic.
 */

export interface PaidEndpointKey {
  provider: string;
  method: string;
  dotPath: string;
}

export interface PaidEndpointInfo {
  /** Human-readable reason why this endpoint is paid. */
  reason: string;
  /** Optional estimator identifier for cost computation. */
  estimatorId?: string;
  /** Optional known cost notes (e.g. per-unit billing details). */
  costNotes?: string;
}

export interface PaidEndpointEntry {
  key: PaidEndpointKey;
  info: PaidEndpointInfo;
}

/**
 * The canonical list of paid endpoints. Add new entries here only after
 * review. Keep the list small and explicit.
 */
export const PAID_ENDPOINTS: readonly PaidEndpointEntry[] = [
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
    },
    info: {
      reason:
        "Media generation task that incurs direct marginal compute cost per job",
      estimatorId: "kie-per-unit",
      costNotes:
        "Billed per unit (seconds/images/songs) based on model and resolution",
    },
  },
];

/**
 * Look up a paid endpoint by exact key match.
 *
 * Returns `PaidEndpointInfo` only when provider, method, and dotPath all match
 * an entry in `PAID_ENDPOINTS` exactly. Returns `undefined` for every
 * unlisted endpoint, which callers must treat as free.
 */
export function lookupPaidEndpoint(
  provider: string,
  method: string,
  dotPath: string
): PaidEndpointInfo | undefined {
  for (const entry of PAID_ENDPOINTS) {
    if (
      entry.key.provider === provider &&
      entry.key.method === method &&
      entry.key.dotPath === dotPath
    ) {
      return entry.info;
    }
  }
  return undefined;
}

/**
 * Predicate: is this exact endpoint paid?
 *
 * Unlisted endpoints return `false` (assumed free).
 */
export function isPaidEndpoint(
  provider: string,
  method: string,
  dotPath: string
): boolean {
  return lookupPaidEndpoint(provider, method, dotPath) !== undefined;
}

/**
 * Error thrown when a paid endpoint is called without an explicit maxSpend.
 */
export class MaxSpendError extends Error {
  readonly provider: string;
  readonly method: string;
  readonly dotPath: string;
  readonly maxSpend: number;
  constructor(
    provider: string,
    method: string,
    dotPath: string,
    maxSpend: number
  ) {
    super(
      `Endpoint ${provider} ${method} ${dotPath} may spend money. ` +
        `maxSpend is ${maxSpend} USD. ` +
        `Pass an explicit maxSpend to proceed.`
    );
    this.name = "MaxSpendError";
    this.provider = provider;
    this.method = method;
    this.dotPath = dotPath;
    this.maxSpend = maxSpend;
  }
}
/**
 * Error thrown when the estimated cost of a paid endpoint exceeds the
 * caller's maxSpend or when the cost cannot be safely estimated.
 */
export class SpendBoundError extends Error {
  readonly provider: string;
  readonly method: string;
  readonly dotPath: string;
  readonly maxSpend: number;
  readonly estimatedUsd: number;
  constructor(
    provider: string,
    method: string,
    dotPath: string,
    maxSpend: number,
    estimatedUsd: number,
    message?: string
  ) {
    super(
      message ??
        `Endpoint ${provider} ${method} ${dotPath} estimated cost ` +
          `(${estimatedUsd} USD) exceeds maxSpend (${maxSpend} USD).`
    );
    this.name = "SpendBoundError";
    this.provider = provider;
    this.method = method;
    this.dotPath = dotPath;
    this.maxSpend = maxSpend;
    this.estimatedUsd = estimatedUsd;
  }
}
/**
 * Preflight check for paid endpoints.
 *
 * For paid endpoints, maxSpend defaults to 0 when omitted. maxSpend=0 blocks
 * before the network request with a MaxSpendError. maxSpend>0 authorizes the
 * call to proceed.
 *
 * Free/unlisted endpoints are always allowed regardless of maxSpend.
 */
export function maxSpendPreflight(
  provider: string,
  method: string,
  dotPath: string,
  maxSpend: number = 0
): void {
  if (!isPaidEndpoint(provider, method, dotPath)) {
    return;
  }
  if (maxSpend <= 0) {
    throw new MaxSpendError(provider, method, dotPath, maxSpend);
  }
}
/**
 * Verify that a cost estimate is within the caller's maxSpend.
 *
 * If the estimate has warnings (could not be computed safely), the spend
 * cannot be bounded and the call is blocked. If the estimated USD exceeds
 * maxSpend, the call is blocked. Otherwise the call proceeds.
 *
 * This must run AFTER maxSpendPreflight, so maxSpend is known to be > 0.
 */
export function spendBoundCheck(
  provider: string,
  method: string,
  dotPath: string,
  maxSpend: number | undefined,
  estimate: { usd: number; warnings: string[] }
): void {
  if (maxSpend === undefined || maxSpend <= 0) {
    return;
  }
  if (estimate.warnings.length > 0) {
    throw new SpendBoundError(
      provider,
      method,
      dotPath,
      maxSpend,
      estimate.usd,
      `Endpoint ${provider} ${method} ${dotPath} spend cannot be bounded ` +
        `from the payload: ${estimate.warnings.join("; ")}. ` +
        `Pass an explicit maxSpend that covers the worst-case cost, ` +
        `or adjust the payload so the cost can be estimated.`
    );
  }
  if (estimate.usd > maxSpend) {
    throw new SpendBoundError(
      provider,
      method,
      dotPath,
      maxSpend,
      estimate.usd
    );
  }
}
/**
 * Wrap a provider network dispatch with the paid-endpoint guard.
 *
 * This is the canonical boundary enforcement: it runs the preflight check
 * and spend-bound check before the actual HTTP request, and only calls the
 * supplied `dispatch` function when the checks pass.
 *
 * Free/unlisted endpoints return `dispatch()` immediately without guard
 * overhead, so callers that omit `maxSpend` on free endpoints see no change.
 *
 * @param provider - Provider identifier (e.g. "kie", "openai")
 * @param method - HTTP method (e.g. "POST", "GET")
 * @param dotPath - Exact endpoint dot-path (e.g. "api.v1.jobs.createTask")
 * @param payload - Request payload for cost estimation
 * @param maxSpend - Maximum spend authorization in USD (undefined for free endpoints)
 * @param dispatch - The actual network dispatch to wrap
 * @returns The result of `dispatch()`
 */
export async function dispatchWithPaidGuard<T>(
  provider: string,
  method: string,
  dotPath: string,
  payload: Record<string, unknown>,
  maxSpend: number | undefined,
  dispatch: () => Promise<T>
): Promise<T> {
  maxSpendPreflight(provider, method, dotPath, maxSpend);
  if (
    isPaidEndpoint(provider, method, dotPath) &&
    maxSpend !== undefined &&
    maxSpend > 0
  ) {
    const estimate = computeEstimate({
      provider: provider as import("./types").EstimateRequest["provider"],
      payload,
    });
    spendBoundCheck(provider, method, dotPath, maxSpend, estimate);
  }
  return dispatch();
}
