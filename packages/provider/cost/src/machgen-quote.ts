import { computeEstimate } from "./compute";
import { PRICING } from "./pricing/index";
import type { CostEstimate, CostHints } from "./types";

/**
 * Pricing a MachGen upscale with MachGen's own quote.
 *
 * A Topaz upscale bills vendor credits that depend on its source's frames and
 * resolution, not on anything in the request: one 4 s source quoted 149000
 * micros at 1080p for a `duration_secs` of 1, 2 and 8 (2026-10-25). The bundled
 * table therefore has no Topaz rate, and `computeEstimate` fails closed.
 *
 * MachGen prices the exact request with `POST /api/v0/upscale/quote`, exposed as
 * `machgen.api.v0.upscale.quote`. The quote is free and creates no task, and
 * the recorded Topaz upscale billed exactly its quote (ac-ks4no2). MachGen's
 * REST docs do not list the endpoint (read 2026-10-26), so MachGen may change
 * it without notice.
 *
 * As with `resolveFalDynamicEstimate`, the network stays with the caller. This
 * module takes the quote function as an argument and imports nothing from
 * `@apicity/machgen`:
 *
 *     import { createMachGen } from "@apicity/machgen";
 *     import { resolveMachGenUpscaleEstimate } from "@apicity/cost";
 *
 *     const machgen = createMachGen({ apiKey: process.env.MACHGEN_API_KEY });
 *     const estimate = await resolveMachGenUpscaleEstimate(
 *       {
 *         model: "Topaz-Video-Precision",
 *         task_type: "UPSCALE",
 *         prompt: "",
 *         src_task_ids: [sourceTaskId],
 *         video_config: { height: 1080, duration_secs: 4 },
 *       },
 *       machgen.api.v0.upscale.quote
 *     );
 */

/** The part of MachGen's quote response this module reads. */
export interface MachGenUpscaleQuoteLike {
  cost_micros: number;
}

/**
 * Any function shaped like `machgen.api.v0.upscale.quote`, declared
 * structurally so this package does not depend on `@apicity/machgen`.
 */
export type MachGenUpscaleQuoter<P> = (
  request: P
) => Promise<MachGenUpscaleQuoteLike>;

/** Options for `resolveMachGenUpscaleEstimate`. */
export interface ResolveMachGenUpscaleEstimateOptions {
  /** Cost-only hints, forwarded to the local path. */
  hints?: CostHints;
}

/**
 * Whether MachGen's quote, rather than the bundled table, prices a request:
 * an UPSCALE on a model the table has no rates for, such as the Topaz
 * upscalers. MiniMax-H3's upscale is priced locally.
 */
export function isMachGenQuotePriced(
  payload: Record<string, unknown>
): boolean {
  return (
    payload.task_type === "UPSCALE" &&
    !Object.hasOwn(PRICING.machgen, String(payload.model))
  );
}

/**
 * Resolve a MachGen estimate, asking MachGen's quote only where the bundled
 * table has no rate (`isMachGenQuotePriced`). Every other request falls through
 * to `computeEstimate` unchanged and never reaches the network.
 *
 * The quote's `cost_micros` becomes the estimate, in USD, with no warning. A
 * failed or malformed answer degrades to the local `usd: 0` plus a warning that
 * names it, rather than throwing: an estimate is advisory.
 *
 * @param payload - the UPSCALE request the caller intends to send
 * @param quote - MachGen's quote, e.g. `machgen.api.v0.upscale.quote`
 * @param options - hints for the local path
 */
export async function resolveMachGenUpscaleEstimate<
  P extends Record<string, unknown>,
>(
  payload: P,
  quote: MachGenUpscaleQuoter<P>,
  options: ResolveMachGenUpscaleEstimateOptions = {}
): Promise<CostEstimate> {
  const { hints } = options;
  const local = computeEstimate({
    provider: "machgen",
    payload,
    ...(hints ? { costHints: hints } : {}),
  });
  if (!isMachGenQuotePriced(payload)) return local;

  const model = String(payload.model);
  let answer: MachGenUpscaleQuoteLike;
  try {
    answer = await quote(payload);
  } catch (error) {
    return withWarning(
      local,
      `MachGen upscale quote failed for '${model}': ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  const micros = answer?.cost_micros;
  if (typeof micros !== "number" || !Number.isFinite(micros) || micros < 0) {
    return withWarning(
      local,
      `MachGen upscale quote for '${model}' returned no usable cost_micros`
    );
  }
  return {
    usd: micros / 1e6,
    currency: "USD",
    source: "per-unit-table",
    breakdown: {},
    // MachGen priced this request now, not as of a table pull.
    rateAsOf: null,
    warnings: [],
  };
}

function withWarning(estimate: CostEstimate, warning: string): CostEstimate {
  return { ...estimate, warnings: [...estimate.warnings, warning] };
}
