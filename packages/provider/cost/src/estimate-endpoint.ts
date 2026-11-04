import { anthropicCacheTtl } from "./anthropic-cache";
import { S3_EXCLUSIONS } from "./pricing/s3";
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
    ...(provider === "anthropic" ? { cacheWrite1hInputTokens: 0 } : {}),
  };
  const low = evaluateDeclaredUsage(provider, ext.data.model, payload, base);
  const high = evaluateDeclaredUsage(provider, ext.data.model, payload, {
    ...base,
    outputTokens: ext.data.maxOutputTokens,
    cacheReadInputTokens: 0,
    cacheWriteInputTokens: input,
    ...(provider === "anthropic"
      ? {
          cacheWrite1hInputTokens:
            anthropicCacheTtl(payload) === "1h" ? input : 0,
        }
      : {}),
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
      ...(provider === "anthropic"
        ? [
            "Anthropic newer tokenizers can produce approximately 30% more tokens for the same text; use model-specific token counting for precision.",
          ]
        : []),
      "Forecast: input tokens use chars/4; low assumes all input is cached and no output, high assumes all input is cache-written and the full output limit. This is not measured usage or a guaranteed bound.",
    ],
  };
}

function anthropicBatch(req: EndpointEstimateRequest): EndpointEstimate {
  const billing = endpointBilling(req.provider, req.method, req.dotPath);
  const unavailable = (warning: string): EndpointEstimate => ({
    usd: 0,
    currency: "USD",
    source: "tokens-heuristic+table",
    breakdown: {},
    rateAsOf: "2026-11-04",
    warnings: [warning],
    billing,
    status: "unavailable",
  });
  if (req.mode !== "forecast" || req.costHints !== undefined) {
    return unavailable(
      "anthropic batch: per-item usage is required in strict mode; global costHints cannot price a batch. Use forecast mode without hints."
    );
  }
  const items = req.payload?.requests;
  if (!Array.isArray(items) || items.length === 0)
    return unavailable("anthropic batch: requests must be a non-empty array");
  let low = 0;
  let high = 0;
  const warnings = new Set<string>();
  for (const [index, item] of items.entries()) {
    const params: unknown =
      item && typeof item === "object" ? item.params : undefined;
    if (!params || typeof params !== "object" || Array.isArray(params))
      return unavailable(
        `anthropic batch: requests[${index}].params is required`
      );
    const payload = params as Record<string, unknown>;
    if (
      typeof payload.model !== "string" ||
      !Object.hasOwn(PRICING.anthropic, payload.model)
    )
      return unavailable(
        `anthropic batch: requests[${index}].params.model is missing or not bundled`
      );
    const result = forecast({ ...req, dotPath: "v1.messages", payload });
    if (!result?.range)
      return unavailable(
        `anthropic batch: requests[${index}] cannot be forecast; check model, messages, max_tokens, cache_control.ttl, tier and modalities`
      );
    low += result.range.low * 0.5;
    high += result.range.high * 0.5;
    result.warnings.forEach((warning) => warnings.add(warning));
  }
  return {
    usd: high,
    currency: "USD",
    source: "tokens-heuristic+table",
    breakdown: {},
    rateAsOf: "2026-11-04",
    warnings: [...warnings],
    billing,
    status: "priced",
    range: { low, high },
    notes: [
      `Batch forecast: 50% of each item's model/TTL rate; range USD ${low}–${high}. Failed, canceled and expired items are not billed.`,
    ],
  };
}

/** Endpoint-aware estimation; computeEstimate and the paygate stay unchanged. */
function estimateEndpointInternal(
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
  if (
    req.provider === "anthropic" &&
    req.method === "POST" &&
    req.dotPath === "v1.messages.batches"
  )
    return anthropicBatch(req);
  if (req.mode === "forecast") {
    const predicted = forecast(req);
    if (predicted) return predicted;
  }
  const estimate =
    req.provider === "anthropic"
      ? evaluateDeclaredUsage(
          "anthropic",
          typeof req.payload?.model === "string" ? req.payload.model : "",
          req.payload ?? {},
          req.costHints
        )
      : computeEstimate({
          provider: req.provider,
          payload: req.payload ?? {},
          costHints: req.costHints,
          endpoint:
            req.endpoint ??
            ENDPOINT_PRICING_KEYS[
              `${req.provider} ${req.method} ${req.dotPath}`
            ],
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

/** Every S3 result, including free and unavailable routes, names exclusions. */
export function estimateEndpoint(
  req: EndpointEstimateRequest
): EndpointEstimate {
  const result = estimateEndpointInternal(req);
  if (req.provider === "s3" && !result.warnings.includes(S3_EXCLUSIONS)) {
    result.warnings.push(S3_EXCLUSIONS);
  }
  return result;
}
