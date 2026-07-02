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
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.veo.generate",
    },
    info: {
      reason:
        "Direct VEO video generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per video generation based on model and duration",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.veo.extend",
    },
    info: {
      reason:
        "Direct VEO video extension task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per video extension based on model and duration",
    },
  },
  {
    key: {
      provider: "kie",
      method: "GET",
      dotPath: "api.v1.veo.get1080pVideo",
    },
    info: {
      reason:
        "Direct VEO 1080p render request that can incur direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per 1080p render request when processing is required",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.flux.kontext.generate",
    },
    info: {
      reason:
        "Flux Kontext image generation/edit task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per image generation based on model (pro/max)",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.gpt4oImage.generate",
    },
    info: {
      reason:
        "4o Image generation/edit task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per image generation based on size and fallback model",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.mj.generate",
    },
    info: {
      reason:
        "Midjourney image/video generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per generation based on task type, speed, and version",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.runway.generate",
    },
    info: {
      reason:
        "Runway video generation task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per video generation based on duration and quality",
    },
  },
  {
    key: {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.runway.extend",
    },
    info: {
      reason:
        "Runway video extension task that incurs direct marginal compute cost",
      estimatorId: "kie-per-unit",
      costNotes: "Billed per video extension based on quality",
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
