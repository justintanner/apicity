/**
 * Canonical per-endpoint cost-tier classification for the whole provider
 * surface.
 *
 * The numeric tiers and their boundaries live in {@link ./cost-tier} — there is
 * exactly ONE cost-tier scale for the monorepo. This module maps every provider
 * endpoint onto that scale so tooling (example gating, docs) can ask a single
 * question: "what tier is this endpoint?".
 *
 * ## Fail-closed by construction
 *
 * {@link classifyEndpoint} is TOTAL: it returns a tier for ANY
 * (provider, method, dotPath), and its default is `prohibitive`. An endpoint is
 * only lifted out of `prohibitive` when an explicit, reviewed policy in
 * {@link ENDPOINT_COST_POLICIES} says so. An unlisted endpoint — a brand-new
 * one, or one whose provider carries no policy — is therefore `prohibitive`,
 * never `cheap`/`expensive` by default.
 *
 * `cheap` is only ever assigned to providers whose ENTIRE surface has no
 * marginal USD compute cost (public data APIs, free file hosts, object-storage
 * request ops, social posting). Any provider that meters tokens/units bills real
 * money and is classified at least `expensive`; media-generation providers
 * (image/video/audio synthesis) are `prohibitive` because a single call is
 * routinely dollars and its exact cost is request-dependent and underivable
 * without the concrete payload.
 *
 * ## Precedence
 *
 * A policy matches an endpoint when its `provider` matches and its optional
 * `method`/`dotPath` (when present) match too. The MOST SPECIFIC matching policy
 * wins: an exact `dotPath` entry overrides a provider-wide default. This lets a
 * mostly-`expensive` provider carve out specific `prohibitive` generation
 * endpoints (e.g. xAI image/video) without listing every sibling.
 *
 * This module is additive and pure: no new dependencies, no mutation of any
 * estimate, no runtime I/O.
 */

import type { CostTier } from "./cost-tier";

/**
 * The tier assigned to an endpoint. Identical to the canonical {@link CostTier}
 * scale — an endpoint tier is just a cost tier applied to an endpoint.
 */
export type EndpointCostTier = CostTier;

/**
 * The matcher half of a cost policy. `provider` is required; `method` and
 * `dotPath` narrow the match. Omitting `method`/`dotPath` makes the policy a
 * provider-wide default.
 */
export interface EndpointCostPolicyMatch {
  provider: string;
  /** Uppercase HTTP method (e.g. "POST"). Omitted = matches any method. */
  method?: string;
  /** Exact dotPath (e.g. "v1.images.generations"). Omitted = any dotPath. */
  dotPath?: string;
}

/** An explicit, reviewed cost-tier assignment for a set of endpoints. */
export interface EndpointCostPolicy {
  match: EndpointCostPolicyMatch;
  tier: EndpointCostTier;
  /** Human-readable justification for the tier. */
  rationale: string;
}

/**
 * The canonical, explicit cost-tier policies.
 *
 * Ordering is for human readability only; {@link resolveEndpointCostPolicy}
 * selects by specificity, not position. Every provider on the endpoint surface
 * MUST appear here (a provider-wide default at minimum); the sync check in
 * `tests/unit/endpoint-cost-tiers.test.ts` fails otherwise.
 */
export const ENDPOINT_COST_POLICIES: readonly EndpointCostPolicy[] = [
  // ── cheap: no marginal USD compute cost ────────────────────────────────
  // Public market-data / sports-data / open-data REST. No per-call USD charge.
  {
    match: { provider: "binance" },
    tier: "cheap",
    rationale: "Public spot market-data REST; no per-call USD compute cost",
  },
  {
    match: { provider: "openligadb" },
    tier: "cheap",
    rationale: "Free public soccer match-data API; no per-call USD cost",
  },
  {
    match: { provider: "thesportsdb" },
    tier: "cheap",
    rationale: "Free public sports-data API; no per-call USD cost",
  },
  {
    match: { provider: "openf1" },
    tier: "cheap",
    rationale: "Free public Formula 1 data API; no per-call USD cost",
  },
  {
    match: { provider: "simplefunctions" },
    tier: "cheap",
    rationale: "Public agent/world data API; no per-call USD compute cost",
  },
  {
    match: { provider: "polymarket" },
    tier: "cheap",
    rationale:
      "Gamma/Data/CLOB market-data + trading REST; the API call itself has " +
      "no USD compute cost (order settlement is on-chain, not an API charge)",
  },
  // Object storage: per-request billing is a small fraction of a cent (<< $0.01).
  {
    match: { provider: "s3" },
    tier: "cheap",
    rationale:
      "S3-compatible object-storage request ops; per-request cost << $0.01",
  },
  {
    match: { provider: "b2" },
    tier: "cheap",
    rationale:
      "Backblaze B2 S3-compatible request ops; per-request cost << $0.01",
  },
  {
    match: { provider: "dolthub" },
    tier: "cheap",
    rationale: "DoltHub SQL/database API; no per-call USD compute cost",
  },
  {
    match: { provider: "dropbox" },
    tier: "cheap",
    rationale: "Dropbox file/metadata operations; no per-call USD compute cost",
  },
  // Free file hosts and free social-posting APIs (no per-call USD charge).
  {
    match: { provider: "free-media-upload" },
    tier: "cheap",
    rationale: "Free file-hosting upload endpoints; no per-call USD cost",
  },
  {
    match: { provider: "telegram" },
    tier: "cheap",
    rationale: "Telegram Bot API; free, no per-call USD compute cost",
  },
  {
    match: { provider: "meta" },
    tier: "cheap",
    rationale:
      "Instagram Graph posting API; free, no per-call USD compute cost",
  },
  {
    match: { provider: "x" },
    tier: "cheap",
    rationale: "X (Twitter) posting API; no per-call USD compute cost",
  },
  {
    match: { provider: "youtube" },
    tier: "cheap",
    rationale:
      "YouTube Data API v3; quota-limited but free (no USD compute cost)",
  },

  // ── expensive: metered token/unit cost, bounded per typical call ────────
  {
    match: { provider: "openai" },
    tier: "expensive",
    rationale:
      "Metered LLM/inference provider; per-call token cost bills real money",
  },
  {
    match: { provider: "anthropic" },
    tier: "expensive",
    rationale: "Metered LLM provider; per-call token cost bills real money",
  },
  {
    match: { provider: "xai" },
    tier: "expensive",
    rationale:
      "Metered LLM/inference provider; per-call token cost bills real money",
  },
  {
    match: { provider: "fireworks" },
    tier: "expensive",
    rationale:
      "Metered LLM/inference provider; per-call token cost bills real money",
  },
  {
    match: { provider: "alibaba" },
    tier: "expensive",
    rationale:
      "Metered Qwen LLM provider; per-call token cost bills real money",
  },
  {
    match: { provider: "kimicoding" },
    tier: "expensive",
    rationale: "Metered LLM provider; per-call token cost bills real money",
  },
  {
    match: { provider: "zaicoding" },
    tier: "expensive",
    rationale:
      "Metered z.ai coding LLM provider; per-call token cost bills real money",
  },
  {
    match: { provider: "google" },
    tier: "expensive",
    rationale:
      "Metered Gemini generateContent; per-call token cost bills real money",
  },
  {
    match: { provider: "elevenlabs" },
    tier: "expensive",
    rationale:
      "Metered text-to-speech / audio provider; per-character billing bills " +
      "real money",
  },

  // ── prohibitive: media generation (dollars per call, request-dependent) ─
  {
    match: { provider: "fal" },
    tier: "prohibitive",
    rationale:
      "Media-generation marketplace (image/video/audio synthesis); per-call " +
      "cost is model-dependent and routinely exceeds $1",
  },
  {
    match: { provider: "kie" },
    tier: "prohibitive",
    rationale:
      "Media-generation provider (video/image/audio); per-unit cost is " +
      "request-dependent and routinely exceeds $1",
  },
  {
    match: { provider: "googleflow" },
    tier: "prohibitive",
    rationale:
      "Third-party proxy for Google Flow (Veo) video generation; per-call " +
      "media-generation cost is high and request-dependent",
  },

  // ── exact prohibitive overrides inside otherwise-`expensive` providers ──
  // xAI image/video generation: these mirror the paid-endpoint registry and
  // incur direct media-generation cost, unlike xAI's metered text endpoints.
  {
    match: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.images.generations",
    },
    tier: "prohibitive",
    rationale: "Image generation; direct media-generation cost per image",
  },
  {
    match: { provider: "xai", method: "POST", dotPath: "v1.images.edits" },
    tier: "prohibitive",
    rationale: "Image edit; direct media-generation cost per image",
  },
  {
    match: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.videos.generations",
    },
    tier: "prohibitive",
    rationale: "Video generation; direct media-generation cost per video",
  },
  {
    match: {
      provider: "xai",
      method: "POST",
      dotPath: "v1.videos.generations.imageToVideo",
    },
    tier: "prohibitive",
    rationale:
      "Image-to-video generation; direct media-generation cost per video",
  },
  {
    match: { provider: "xai", method: "POST", dotPath: "v1.videos.edits" },
    tier: "prohibitive",
    rationale: "Video edit; direct media-generation cost per video",
  },
  {
    match: { provider: "xai", method: "POST", dotPath: "v1.videos.extensions" },
    tier: "prohibitive",
    rationale: "Video extension; direct media-generation cost per video",
  },
];

/** Specificity score: a more specific match (more fixed fields) wins. */
function policySpecificity(match: EndpointCostPolicyMatch): number {
  // dotPath is the strongest signal, then method. Provider alone scores 0.
  return (
    (match.dotPath !== undefined ? 2 : 0) + (match.method !== undefined ? 1 : 0)
  );
}

/**
 * Resolve the most-specific explicit cost policy for an endpoint.
 *
 * Returns `undefined` when no policy matches — meaning the endpoint has no
 * explicit classification and {@link classifyEndpoint} will fail closed to
 * `prohibitive`. The sync check uses this to detect endpoints that lack an
 * explicit tier.
 */
export function resolveEndpointCostPolicy(
  provider: string,
  method: string,
  dotPath: string
): EndpointCostPolicy | undefined {
  let best: EndpointCostPolicy | undefined;
  let bestScore = -1;
  for (const policy of ENDPOINT_COST_POLICIES) {
    const { match } = policy;
    if (match.provider !== provider) continue;
    if (match.method !== undefined && match.method !== method) continue;
    if (match.dotPath !== undefined && match.dotPath !== dotPath) continue;
    const score = policySpecificity(match);
    if (score > bestScore) {
      best = policy;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Classify an endpoint into a cost tier.
 *
 * Total and fail-closed: any endpoint with no explicit policy — unlisted, or
 * belonging to a provider with no policy — is `prohibitive`, never
 * `cheap`/`expensive`.
 */
export function classifyEndpoint(
  provider: string,
  method: string,
  dotPath: string
): EndpointCostTier {
  const policy = resolveEndpointCostPolicy(provider, method, dotPath);
  return policy ? policy.tier : "prohibitive";
}

/**
 * Whether an endpoint carries an explicit cost policy (as opposed to falling
 * through to the fail-closed `prohibitive` default). The sync check requires
 * this to be `true` for every endpoint on the surface.
 */
export function isEndpointExplicitlyClassified(
  provider: string,
  method: string,
  dotPath: string
): boolean {
  return resolveEndpointCostPolicy(provider, method, dotPath) !== undefined;
}
