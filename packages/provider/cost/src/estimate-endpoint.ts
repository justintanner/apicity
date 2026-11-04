import { computeEstimate, evaluateDeclaredUsage } from "./compute";
import { isCostPolicyKnown } from "./cost-tier";
import { endpointBilling } from "./endpoint-billing";
import { ENDPOINT_PRICING_KEYS } from "./endpoint-pricing-keys";
import { extractOpenAi } from "./extract/openai";
import { extractAnthropic } from "./extract/anthropic";
import { extractXai } from "./extract/xai";
import { extractChat } from "./extract/chat";
import { PRICING } from "./pricing/index";
import type { CostHints, EndpointEstimate, EstimateRequest } from "./types";

export interface EndpointEstimateRequest {
  provider: string;
  method: string;
  dotPath: string;
  payload?: Record<string, unknown>;
  endpoint?: string;
  costHints?: CostHints;
  mode?: "strict" | "forecast";
}

type RoutedProvider = Exclude<EstimateRequest["provider"], "free-media-upload">;
function isRoutedProvider(provider: string): provider is RoutedProvider {
  return Object.hasOwn(PRICING, provider);
}

function hasNonTextInput(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasNonTextInput);
  if (value === null || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (
    typeof record.type === "string" &&
    !["message", "text", "input_text", "output_text"].includes(record.type)
  )
    return true;
  return Object.entries(record).some(
    ([key, child]) =>
      key !== "cache_control" &&
      ([
        "image_url",
        "input_audio",
        "audio",
        "file_id",
        "file_data",
        "tools",
        "attachments",
      ].includes(key) ||
        hasNonTextInput(child))
  );
}

// Forecast cache-writing text routes using their existing payload extractors.
// Declared usage, service tiers,
// regional uplifts and multimodal input must retain strict validation.
function forecast(req: EndpointEstimateRequest): EndpointEstimate | undefined {
  if (req.costHints !== undefined) return;
  const { provider } = req;
  const payload = req.payload ?? {};
  const ext =
    provider === "openai"
      ? extractOpenAi(payload)
      : provider === "anthropic"
        ? extractAnthropic(payload)
        : provider === "xai"
          ? extractXai(payload)
          : provider === "alibaba" ||
              provider === "fireworks" ||
              provider === "kimicoding"
            ? extractChat(provider, payload)
            : undefined;
  if (!ext || !isRoutedProvider(provider)) return;
  if (!ext.ok) return;
  const entry = PRICING[provider][ext.data.model];
  if (
    entry?.kind !== "tokens" ||
    (entry.rate.cacheWrite === undefined &&
      entry.rate.cacheWrite5m === undefined) ||
    entry.modalityRates
  )
    return;
  const input = Math.ceil(ext.data.text.length / 4);
  if (
    input === 0 ||
    ext.data.maxOutputTokens === undefined ||
    !Number.isSafeInteger(ext.data.maxOutputTokens) ||
    ext.data.maxOutputTokens <= 0
  )
    return;
  // The chars/4 forecast cannot bound image/audio/tool usage.
  if (
    hasNonTextInput(payload.input) ||
    hasNonTextInput(payload.messages) ||
    hasNonTextInput(payload.system) ||
    payload.tools !== undefined ||
    payload.audio !== undefined ||
    payload.modalities !== undefined
  )
    return;
  const base = {
    inputTokens: input,
    outputTokens: 0,
    cacheReadInputTokens: input,
    cacheWriteInputTokens: 0,
  };
  const low = evaluateDeclaredUsage(provider, ext.data.model, payload, base);
  const high = evaluateDeclaredUsage(provider, ext.data.model, payload, {
    ...base,
    outputTokens: ext.data.maxOutputTokens,
    cacheReadInputTokens: 0,
    cacheWriteInputTokens: input,
  });
  if (!isCostPolicyKnown(low) || !isCostPolicyKnown(high)) return;
  return {
    ...high,
    source: "tokens-heuristic+table",
    status: "priced",
    billing: endpointBilling(req.provider, req.method, req.dotPath),
    range: { low: low.usd, high: high.usd },
    warnings: [
      ...high.warnings,
      "Forecast: input tokens use chars/4; low assumes all input is cached and no output, high assumes all input is cache-written and the full output limit. This is not measured usage or a guaranteed bound.",
    ],
  };
}

/** Endpoint-aware estimation; computeEstimate and the paygate stay unchanged. */
export function estimateEndpoint(
  req: EndpointEstimateRequest
): EndpointEstimate {
  const billing = endpointBilling(req.provider, req.method, req.dotPath);
  const zero =
    billing.kind === "free" ||
    billing.kind === "followup" ||
    billing.kind === "subscription";
  if (billing.kind !== "metered") {
    const reason = billing.reason ?? "No per-call USD estimate is available";
    return {
      usd: 0,
      currency: "USD",
      source: zero ? "free" : "per-unit-table",
      breakdown: {},
      rateAsOf: billing.source?.asOf ?? null,
      warnings: zero ? [] : [reason],
      billing,
      status: zero ? "zero" : "unavailable",
      ...(zero ? { zeroReason: reason } : {}),
    };
  }
  if (!isRoutedProvider(req.provider)) {
    return {
      usd: 0,
      currency: "USD",
      source: "per-unit-table",
      breakdown: {},
      rateAsOf: null,
      warnings: [`No estimator route for provider '${req.provider}'`],
      billing,
      status: "unavailable",
    };
  }
  if (req.mode === "forecast") {
    const predicted = forecast(req);
    if (predicted) return predicted;
  }
  const estimate = computeEstimate({
    provider: req.provider,
    payload: req.payload ?? {},
    costHints: req.costHints,
    endpoint:
      req.endpoint ??
      ENDPOINT_PRICING_KEYS[`${req.provider} ${req.method} ${req.dotPath}`],
  });
  return {
    ...estimate,
    billing,
    status: estimate.zeroReason
      ? "zero"
      : isCostPolicyKnown(estimate) &&
          Number.isFinite(estimate.usd) &&
          estimate.usd >= 0
        ? "priced"
        : "unavailable",
  };
}
