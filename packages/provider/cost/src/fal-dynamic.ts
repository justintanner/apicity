import { PRICING_AS_OF } from "./pricing/index";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "./pricing/fal";
import { computeEstimate } from "./compute";
import type { CostEstimate, CostHints } from "./types";

/**
 * Resolving a real number for fal's dynamically-priced endpoints.
 *
 * `FAL_DYNAMIC_PRICING_ENDPOINTS` lists endpoints whose price cannot be derived
 * from the request payload — compute seconds, delivered output metadata, or
 * tokens with no published per-image constant. `computeEstimate` reports those
 * as `usd: 0` and names the call that would answer, which is honest but not a
 * number (ac-nz65nc).
 *
 * The call it names is `POST /v1/models/pricing/estimate`, already exposed as
 * `fal.v1.models.pricing.estimate`. The open question this module settles is
 * WHERE that call belongs.
 *
 * It does not belong inside `computeEstimate`. `@apicity/cost` is
 * dependency-free and its estimation is pure local computation; importing a
 * provider or reaching the network from it would invert the contract every
 * other caller relies on, and would make a synchronous function async for the
 * ninety-odd endpoints that never needed it.
 *
 * So the network stays with the caller and this module takes the estimator as
 * an argument. `@apicity/cost` still imports nothing, still performs no I/O,
 * and still has no knowledge of fal's transport or credentials — it only knows
 * the SHAPE of an answer it can convert into a `CostEstimate`. A caller wires
 * in the provider it already has:
 *
 *     import { createFal } from "@apicity/fal";
 *     import { resolveFalDynamicEstimate } from "@apicity/cost";
 *
 *     const fal = createFal({ apiKey: process.env.FAL_ADMIN_API_KEY });
 *     const estimate = await resolveFalDynamicEstimate(
 *       "alibaba/wan-3.0/text-to-video",
 *       { prompt: "a red panda", duration: 5 },
 *       fal.v1.models.pricing.estimate
 *     );
 *
 * Note the credential: the pricing API lives on `api.fal.ai` and needs
 * `FAL_ADMIN_API_KEY`, not the generation-scoped `FAL_API_KEY`.
 */

/** The subset of fal's estimate response this module reads. */
export interface FalEstimateLike {
  total_cost: number;
  currency: string;
  estimate_type?: string;
}

/**
 * Any function shaped like `fal.v1.models.pricing.estimate`.
 *
 * Declared structurally rather than imported so this module has no dependency
 * on `@apicity/fal`; the provider's own function satisfies it as-is.
 */
export type FalEstimator = (request: {
  estimate_type: "historical_api_price" | "unit_price";
  endpoints: Record<string, unknown>;
}) => Promise<FalEstimateLike>;

/** Whether an endpoint is deliberately unpriced rather than unknown. */
export function isFalDynamicPricingEndpoint(endpoint: string): boolean {
  return (FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).includes(
    endpoint
  );
}

/**
 * Resolve a fal estimate, using the remote pricing API only where the local
 * table deliberately has no rate.
 *
 * Statically-priced endpoints never reach the network: they fall through to
 * `computeEstimate` unchanged, so wiring this in does not turn every estimate
 * into a request.
 *
 * A failed or malformed remote answer degrades to exactly today's behaviour —
 * `usd: 0` plus a warning naming the call — rather than throwing. An estimate
 * is advisory; making a caller's cost preview fail because a pricing lookup
 * timed out would be the wrong trade.
 *
 * @param endpoint - fal endpoint id, e.g. `alibaba/wan-3.0/text-to-video`
 * @param payload - the request body the caller intends to send
 * @param estimate - fal's estimator, e.g. `fal.v1.models.pricing.estimate`
 * @param hints - cost-only hints, forwarded to the local path
 */
export async function resolveFalDynamicEstimate(
  endpoint: string,
  payload: Record<string, unknown>,
  estimate: FalEstimator,
  hints?: CostHints
): Promise<CostEstimate> {
  if (!isFalDynamicPricingEndpoint(endpoint)) {
    return computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      ...(hints ? { costHints: hints } : {}),
    });
  }

  const local = computeEstimate({
    provider: "fal",
    endpoint,
    payload,
    ...(hints ? { costHints: hints } : {}),
  });

  let answer: FalEstimateLike;
  try {
    answer = await estimate({
      estimate_type: "unit_price",
      endpoints: { [endpoint]: payload },
    });
  } catch (error) {
    return withWarning(
      local,
      `fal pricing estimate failed for '${endpoint}': ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (
    typeof answer?.total_cost !== "number" ||
    !Number.isFinite(answer.total_cost)
  ) {
    return withWarning(
      local,
      `fal pricing estimate for '${endpoint}' returned no usable total_cost`
    );
  }
  if (answer.currency && answer.currency.toUpperCase() !== "USD") {
    return withWarning(
      local,
      `fal pricing estimate for '${endpoint}' quoted ${answer.currency}, not USD`
    );
  }

  return {
    usd: answer.total_cost,
    currency: "USD",
    source: "per-unit-table",
    breakdown: {},
    // The remote answer is priced as of now, not as of a table pull.
    rateAsOf: null,
    warnings: [],
  };
}

function withWarning(estimate: CostEstimate, warning: string): CostEstimate {
  return {
    ...estimate,
    rateAsOf: estimate.rateAsOf ?? PRICING_AS_OF,
    warnings: [...estimate.warnings, warning],
  };
}
