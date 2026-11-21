import type { CatalogEntry } from "./catalog.js";
import { loadCostHelpers, type CostHelpers } from "./cost.js";

/** Everything `dispatchThroughGate` needs to enforce the CLI pay gate. */
export interface GatedCall {
  entry: Pick<CatalogEntry, "provider" | "method" | "dotPath" | "gate">;
  /** Request shape produced by `gateRequest` and hashed into the OTP. */
  request: unknown;
  otp?: string;
  secret?: string;
  dispatch: () => Promise<unknown>;
  now?: () => number;
}

/**
 * Build the value hashed and bound into an OTP for a catalog invocation.
 *
 * A `cli`-gated endpoint with URL path parameters hashes `{ path, body }`
 * (keyed by `entry.pathParams`) so distinct target IDs never share a token.
 * Every other row hashes the merged request object alone, matching what
 * `withPaidGate` hashes inside the `sdk`-gated provider packages.
 */
export function gateRequest(
  entry: Pick<CatalogEntry, "gate" | "pathParams">,
  positional: Record<string, string>,
  body: unknown
): unknown {
  const requestBody = body ?? {};
  if (entry.gate !== "cli" || entry.pathParams.length === 0) {
    return requestBody;
  }
  const path: Record<string, string> = {};
  for (const param of entry.pathParams) {
    const value = positional[param];
    if (value !== undefined) {
      path[param] = value;
    }
  }
  return { path, body: requestBody };
}

/**
 * Apply the CLI's pay gate immediately before calling a provider function.
 *
 * Only `gate: "cli"` rows are enforced here: `gate: "sdk"` rows are enforced
 * inside the provider package via `withPaidGate`, and `gate: "none"` rows do
 * not bill.
 */
export async function dispatchThroughGate(
  call: GatedCall,
  helpers?: Pick<CostHelpers, "dispatchGated">
): Promise<unknown> {
  if (call.entry.gate !== "cli") {
    return call.dispatch();
  }
  const { dispatchGated } = helpers ?? (await loadCostHelpers());
  return dispatchGated(
    call.entry.provider,
    call.entry.method,
    call.entry.dotPath,
    call.request,
    call.otp === undefined ? undefined : { otp: call.otp },
    call.dispatch,
    call.secret !== undefined
      ? { secret: call.secret, ...(call.now ? { now: call.now } : {}) }
      : undefined
  );
}
