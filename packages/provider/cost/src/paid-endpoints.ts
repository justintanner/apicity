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
 * Error thrown when the estimated cost of a paid endpoint exceeds the
 * OTP's maxSpendUsd or when the cost cannot be safely estimated.
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
