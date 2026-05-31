import {
  checkGate,
  DEFAULT_POLICY,
  type CostPolicy,
  type GateResult,
  type TokenBucket,
} from "./gate";
import { lookupTier, type CostTier } from "./tiers";

// Re-export core types for consumers.
export type { CostPolicy, PolicyAction, GateResult, TokenBucket } from "./gate";
export {
  GateError,
  DEFAULT_POLICY,
  STRICT_POLICY,
  PERMISSIVE_POLICY,
  createTokenBucket,
  resolveAction,
} from "./gate";
export type { CostTier, TieredEndpoint } from "./tiers";
export { TIERED_ENDPOINTS, lookupTier, providerTiers } from "./tiers";

// High-level convenience: check a provider+endpoint against the default policy.
// No token bucket = block on "requireToken".
export function gateCheck(
  provider: string,
  dotPath: string,
  method: string,
  policy: CostPolicy = DEFAULT_POLICY,
  bucket?: TokenBucket
): GateResult {
  const tier = lookupTier(provider, dotPath, method);
  return checkGate(policy, provider, dotPath, method, tier, bucket);
}

// Return the tier for a given endpoint without checking the gate.
export function getTier(
  provider: string,
  dotPath: string,
  method: string
): CostTier {
  return lookupTier(provider, dotPath, method);
}

// Batch gate check: returns all blocked results for a list of requests.
export interface BatchGateRequest {
  provider: string;
  dotPath: string;
  method: string;
}

export function gateCheckBatch(
  requests: BatchGateRequest[],
  policy: CostPolicy = DEFAULT_POLICY,
  bucket?: TokenBucket
): GateResult[] {
  const results: GateResult[] = [];
  for (const req of requests) {
    results.push(
      gateCheck(req.provider, req.dotPath, req.method, policy, bucket)
    );
  }
  return results;
}
