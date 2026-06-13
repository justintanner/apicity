import {
  dispatchWithPaidGate,
  createReplayStore,
  type PayGateApproval,
  type PayGateConfig,
} from "./paygate";
import { isPaidEndpoint } from "./paid-endpoints";

/**
 * HTTP-method roots that the walker will descend into. Properties outside
 * this allowlist (sub-providers like `kie.veo`, schema collections like
 * `kie.modelInputSchemas`, attached helpers like `kie.examples`) are
 * returned by reference and never wrapped.
 */
const DEFAULT_ROOTS = ["post", "get", "delete", "patch", "put"] as const;

export interface WithPaidGateOptions {
  /**
   * Top-level keys to recurse into. Default: HTTP-method buckets.
   */
  roots?: readonly string[];
  /**
   * Pay-gate configuration (shared HMAC secret + optional replay store/clock)
   * forwarded to every gated dispatch. When omitted, paid endpoints fail closed
   * with `paygate-not-configured`.
   */
  config?: PayGateConfig;
}

// Endpoint leaves may be called with any positional shape — the walker only
// needs to preserve "is a function" and route paid calls through the gate.
type AnyAsyncFn = (...args: unknown[]) => Promise<unknown>;

/**
 * Walk a provider tree once and route every paid-endpoint leaf through
 * `dispatchWithPaidGate`. Free leaves are returned untouched. Callable
 * namespaces (functions with child properties — e.g. `xai.v1.models` is a
 * function with `.languageModels` children) preserve all children and their
 * `.schema` attachments.
 *
 * @param providerName  Provider identifier matching `PAID_ENDPOINTS`.
 * @param tree          The provider object returned by the factory.
 * @param opts          Optional roots allowlist and IO injection.
 * @returns A new tree of the same shape; paid leaves accept `(req, approval?)`.
 */
export function withPaidGate<T extends object>(
  providerName: string,
  tree: T,
  opts?: WithPaidGateOptions
): T {
  const roots = opts?.roots ?? DEFAULT_ROOTS;
  // Normalize the config once so every gated dispatch on this provider instance
  // shares a single replay store (single-use OTPs must be remembered across
  // calls). A custom store passed by the code client is preserved.
  const config: PayGateConfig | undefined = opts?.config
    ? {
        ...opts.config,
        replayStore: opts.config.replayStore ?? createReplayStore(),
      }
    : undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (roots.includes(key) && value && typeof value === "object") {
      out[key] = walk(providerName, [key], value, config);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

function walk(
  providerName: string,
  path: string[],
  node: unknown,
  config: PayGateConfig | undefined
): unknown {
  if (typeof node === "function") {
    return wrapCallable(providerName, path, node as AnyAsyncFn, config);
  }
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = walk(providerName, [...path, k], v, config);
    }
    return out;
  }
  return node;
}

/**
 * Wrap a callable leaf. If the path resolves to a paid endpoint, the returned
 * function routes through `dispatchWithPaidGate`. Otherwise the original
 * function is returned. Either way, any properties hanging off the function
 * (`.schema`, callable-namespace children) are preserved and recursively
 * walked so nested paid leaves are also gated.
 */
function wrapCallable(
  providerName: string,
  path: string[],
  fn: AnyAsyncFn,
  config: PayGateConfig | undefined
): AnyAsyncFn {
  const method = path[0]!.toUpperCase();
  const dotPath = path.slice(1).join(".");
  const paid =
    dotPath.length > 0 && isPaidEndpoint(providerName, method, dotPath);

  const base: AnyAsyncFn = paid
    ? (...args: unknown[]) => {
        const [req, approval] = args as [unknown, PayGateApproval | undefined];
        return dispatchWithPaidGate(
          providerName,
          method,
          dotPath,
          req as Record<string, unknown>,
          approval,
          () => fn(req),
          config
        );
      }
    : fn;

  // For callable namespaces (functions with own properties), only recurse into
  // function-typed children — those are sub-endpoints that may themselves be
  // paid. Non-function props (`.schema`, other metadata) are preserved by
  // reference so test assertions and runtime callers can compare by identity.
  const children: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fn)) {
    if (typeof v === "function") {
      children[k] = walk(providerName, [...path, k], v, config);
    } else {
      children[k] = v;
    }
  }
  // If `base === fn` we still merge children, but they're already attached;
  // the assignment is a no-op for own enumerable keys.
  return Object.assign(base, children);
}
