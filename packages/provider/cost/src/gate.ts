import type { CostTier } from "./tiers";

// Policy action for each cost tier.
// - allow:      request proceeds
// - warn:      request proceeds but a warning is logged
// - block:     request is rejected with a GateError
// - requireToken: request consumes a budget token; if none remain, block
export type PolicyAction = "allow" | "warn" | "block" | "requireToken";

export interface CostPolicy {
  // Default action for each tier when no explicit override exists.
  free: PolicyAction;
  cheap: PolicyAction;
  expensive: PolicyAction;
  prohibitive: PolicyAction;
  // Optional: per-provider overrides. Deeper wins.
  // e.g., { openai: { expensive: "requireToken" } }
  providers?: Record<string, Partial<Record<CostTier, PolicyAction>>>;
  // Optional: per-endpoint overrides. Deepest wins.
  // Key: "provider.dotPath.method"
  endpoints?: Record<string, PolicyAction>;
}

// Default policy: safe by default.
// - free/cheap: allow
// - expensive: require token (human/budget approval)
// - prohibitive: block
export const DEFAULT_POLICY: CostPolicy = {
  free: "allow",
  cheap: "allow",
  expensive: "requireToken",
  prohibitive: "block",
};

// Strict policy: block everything above cheap.
export const STRICT_POLICY: CostPolicy = {
  free: "allow",
  cheap: "allow",
  expensive: "block",
  prohibitive: "block",
};

// Permissive policy: allow everything, warn on expensive.
export const PERMISSIVE_POLICY: CostPolicy = {
  free: "allow",
  cheap: "allow",
  expensive: "warn",
  prohibitive: "warn",
};

export class GateError extends Error {
  status: number;
  provider: string;
  dotPath: string;
  method: string;
  tier: CostTier;
  action: PolicyAction;

  constructor(
    provider: string,
    dotPath: string,
    method: string,
    tier: CostTier,
    action: PolicyAction,
    message: string
  ) {
    super(message);
    this.name = "GateError";
    this.status = 403;
    this.provider = provider;
    this.dotPath = dotPath;
    this.method = method;
    this.tier = tier;
    this.action = action;
  }
}

export interface GateResult {
  allowed: boolean;
  action: PolicyAction;
  tier: CostTier;
  // Only set when allowed === false
  error?: GateError;
  // Only set when action === "warn"
  warning?: string;
  // Only set when action === "requireToken" and a token was consumed
  tokenConsumed?: boolean;
}

// Resolve the effective action for a given endpoint.
// Resolution order: endpoint override > provider override > global default.
export function resolveAction(
  policy: CostPolicy,
  provider: string,
  dotPath: string,
  method: string,
  tier: CostTier
): PolicyAction {
  const endpointKey = `${provider}.${dotPath}.${method}`;
  if (policy.endpoints?.[endpointKey]) {
    return policy.endpoints[endpointKey];
  }
  if (policy.providers?.[provider]?.[tier]) {
    return policy.providers[provider][tier]!;
  }
  return policy[tier];
}

// Budget token interface. Implementations track token balance.
export interface TokenBucket {
  // Attempt to consume one token. Returns true if successful.
  consume(): boolean;
  // Current balance.
  balance(): number;
}

// Simple in-memory token bucket.
export function createTokenBucket(initialTokens: number): TokenBucket {
  let tokens = initialTokens;
  return {
    consume(): boolean {
      if (tokens > 0) {
        tokens -= 1;
        return true;
      }
      return false;
    },
    balance(): number {
      return tokens;
    },
  };
}

// Main gate function. Returns a GateResult without side effects.
// The caller is responsible for consuming tokens and acting on the result.
export function checkGate(
  policy: CostPolicy,
  provider: string,
  dotPath: string,
  method: string,
  tier: CostTier,
  bucket?: TokenBucket
): GateResult {
  const action = resolveAction(policy, provider, dotPath, method, tier);

  if (action === "allow") {
    return { allowed: true, action, tier };
  }

  if (action === "warn") {
    return {
      allowed: true,
      action,
      tier,
      warning: `Cost warning: ${provider}.${dotPath} (${method}) is tier "${tier}"`,
    };
  }

  if (action === "requireToken") {
    if (bucket) {
      const consumed = bucket.consume();
      if (consumed) {
        return { allowed: true, action, tier, tokenConsumed: true };
      }
    }
    return {
      allowed: false,
      action,
      tier,
      error: new GateError(
        provider,
        dotPath,
        method,
        tier,
        action,
        `Blocked: ${provider}.${dotPath} (${method}) requires a budget token, but none remain.`
      ),
    };
  }

  // action === "block"
  return {
    allowed: false,
    action,
    tier,
    error: new GateError(
      provider,
      dotPath,
      method,
      tier,
      action,
      `Blocked: ${provider}.${dotPath} (${method}) is tier "${tier}" and is blocked by policy.`
    ),
  };
}
