import { computeEstimate, evaluateDeclaredUsage } from "./compute";
import { PRICING, type PricedProviderId } from "./pricing/index";
import type {
  ActualBasis,
  ActualUsage,
  CostActual,
  CostEstimate,
  CostHints,
  ProviderExchange,
} from "./types";
import { extractorFor } from "./actual/families";
import {
  NOTHING_REPORTED,
  NO_RATE_FOR_USAGE,
  RESPONSE_NOT_CAPTURED,
  SUBMIT_PENDING,
  TRUNCATED_STREAM,
  type Extracted,
} from "./actual/shared";
import { streamHasFinalUsage } from "./actual/tokens";

// Providers whose reported token usage prices through evaluateDeclaredUsage.
// KIE prices through its own computeEstimate route, which already reads hints.
const DECLARED_USAGE_PROVIDERS: ReadonlySet<string> = new Set([
  "openai",
  "xai",
  "anthropic",
  "alibaba",
  "fireworks",
  "kimicoding",
]);

// computeEstimate keys these per-unit tables by endpoint, not by payload.model.
const PER_UNIT_KEYED_BY_ENDPOINT: ReadonlySet<string> = new Set([
  "kie",
  "elevenlabs",
  "fal",
  "googleflow",
  "wavespeed",
]);

function tokenHints(usage: ActualUsage, serviceTier?: string): CostHints {
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    cacheReadInputTokens: usage.cacheReadInputTokens ?? 0,
    cacheWriteInputTokens: usage.cacheWriteInputTokens ?? 0,
    ...(usage.cacheWrite1hInputTokens !== undefined
      ? { cacheWrite1hInputTokens: usage.cacheWrite1hInputTokens }
      : {}),
    ...(usage.audioInputTokens !== undefined
      ? { audioInputTokens: usage.audioInputTokens }
      : {}),
    ...(usage.imageInputTokens !== undefined
      ? { imageInputTokens: usage.imageInputTokens }
      : {}),
    ...(usage.audioOutputTokens !== undefined
      ? { audioOutputTokens: usage.audioOutputTokens }
      : {}),
    ...(usage.imageOutputTokens !== undefined
      ? { imageOutputTokens: usage.imageOutputTokens }
      : {}),
    ...(serviceTier !== undefined ? { serviceTier } : {}),
  };
}

function isPriced(provider: string): provider is PricedProviderId {
  return Object.prototype.hasOwnProperty.call(PRICING, provider);
}

interface Derived {
  notes?: string[];
  usd: number | null;
  rateAsOf: string | null;
  warnings: string[];
  unitRate?: { usd: number; asOf: string | null };
}

const NOT_DERIVED: Derived = { usd: null, rateAsOf: null, warnings: [] };

// A usable figure, or the reasons there is none. evaluatePerUnit and the token
// routes both say why through warnings, so an unpriced model carries its reason
// into the actual instead of reading as zero.
function fromEstimate(estimate: CostEstimate): Derived {
  return estimate.warnings.length > 0
    ? { ...NOT_DERIVED, warnings: estimate.warnings, notes: estimate.notes }
    : {
        usd: estimate.usd,
        rateAsOf: estimate.rateAsOf,
        warnings: [],
        notes: estimate.notes,
      };
}

function deriveFromTokens(
  provider: PricedProviderId,
  key: string,
  exchange: ProviderExchange,
  extracted: Extracted
): Derived {
  const { usage, serviceTier } = extracted;
  // Anthropic and Kimi call their Standard tier "standard", which OpenAI's
  // declared usage rightly refuses. The response is the record of what ran, so
  // OpenAI and Fireworks also read the requested tier when the response
  // omits it. Fireworks must keep an explicit Standard response authoritative.
  const tier =
    serviceTier === "standard" && provider === "fireworks"
      ? "default"
      : provider !== "openai" && serviceTier === "standard"
        ? undefined
        : serviceTier;
  const hints = tokenHints(usage, tier);
  if (provider === "xai" && new URL(exchange.url).hostname === "us.api.x.ai") {
    hints.regionalProcessing = true;
  }
  if (
    provider === "fireworks" &&
    new URL(exchange.url).hostname === "us.api.fireworks.ai"
  ) {
    hints.regionalProcessing = true;
  }
  if (provider === "google" || provider === "alibaba") {
    return fromEstimate(
      computeEstimate({
        provider,
        payload: {
          ...exchange.requestBody,
          ...(provider === "alibaba" ? { model: key } : {}),
        },
        endpoint: provider === "google" ? key : undefined,
        baseURL: exchange.url,
        costHints: hints,
      })
    );
  }
  if (DECLARED_USAGE_PROVIDERS.has(provider)) {
    return fromEstimate(
      evaluateDeclaredUsage(
        provider,
        key,
        provider === "openai" ||
          provider === "xai" ||
          provider === "fireworks" ||
          provider === "anthropic"
          ? {
              ...exchange.requestBody,
              ...(provider === "xai" ? { service_tier: tier } : {}),
            }
          : {},
        hints
      )
    );
  }
  if (provider !== "kie") return NOT_DERIVED;
  // Keep an explicit diagnostic when KIE publishes no cache rate.
  const entry = PRICING.kie[key];
  if (
    entry?.kind === "tokens" &&
    (((usage.cacheReadInputTokens ?? 0) > 0 &&
      entry.rate.cacheRead === undefined) ||
      ((usage.cacheWriteInputTokens ?? 0) > 0 &&
        entry.rate.cacheWrite === undefined))
  ) {
    return {
      ...NOT_DERIVED,
      warnings: [
        `kie '${key}' publishes no rate for its cached tokens, so no figure is derived`,
      ],
    };
  }
  return fromEstimate(
    computeEstimate({ provider, payload: { model: key }, costHints: hints })
  );
}

// A per-unit row prices the units the response reported, at the rate the
// request selects. A row whose response reports no units derives nothing,
// because an estimate from the request alone would match itself; it keeps the
// rate for mergeActuals instead. A band or an input charge depends on the
// request's own length, so such a row takes the estimate's total.
function deriveFromUnits(
  provider: PricedProviderId,
  key: string,
  exchange: ProviderExchange,
  usage: ActualUsage
): Derived {
  const units = usage.seconds ?? usage.images ?? usage.characters;
  const estimate = computeEstimate({
    provider,
    payload: exchange.requestBody ?? {},
    baseURL: exchange.url,
    endpoint: PER_UNIT_KEYED_BY_ENDPOINT.has(provider) ? key : undefined,
    costHints:
      usage.seconds !== undefined
        ? { durationSeconds: usage.seconds }
        : undefined,
  });
  const perUnit = estimate.breakdown.perUnitUsd;
  const extra = estimate.breakdown.extraUsd;
  if (estimate.warnings.length > 0 || perUnit === undefined) {
    return units === undefined
      ? {
          ...NOT_DERIVED,
          notes: estimate.notes,
          ...(provider === "alibaba" ? { warnings: estimate.warnings } : {}),
        }
      : { ...NOT_DERIVED, warnings: estimate.warnings, notes: estimate.notes };
  }
  if (units === undefined) {
    return extra
      ? { ...NOT_DERIVED, notes: estimate.notes }
      : {
          ...NOT_DERIVED,
          notes: estimate.notes,
          unitRate: { usd: perUnit, asOf: estimate.rateAsOf },
        };
  }
  return {
    usd: extra ? estimate.usd : perUnit * units,
    rateAsOf: estimate.rateAsOf,
    notes: estimate.notes,
    warnings: [],
  };
}

function derive(
  exchange: ProviderExchange,
  model: string | null,
  extracted: Extracted
): Derived {
  const { usage, uncoveredCharge } = extracted;
  const { provider } = exchange;
  // The tables key on what the caller sent; a response may answer with an alias.
  const requested =
    exchange.requestBody?.model ?? exchange.requestBody?.model_id;
  const key =
    provider === "google"
      ? model
      : typeof requested === "string"
        ? requested
        : model;
  if (!key || !isPriced(provider)) return NOT_DERIVED;
  const entry = PRICING[provider][key];
  const hasTokens =
    usage.inputTokens !== undefined || usage.outputTokens !== undefined;
  try {
    if (entry?.kind === "perUnit") {
      // fal's unit header often differs from the table's unit, so fal reports
      // billableUnits and no derived figure.
      if (provider === "fal" || !exchange.requestBody) return NOT_DERIVED;
      return deriveFromUnits(provider, key, exchange, usage);
    }
    if (!hasTokens) return NOT_DERIVED;
    if (uncoveredCharge) {
      return { ...NOT_DERIVED, warnings: [uncoveredCharge] };
    }
    return deriveFromTokens(provider, key, exchange, extracted);
  } catch (error) {
    return {
      ...NOT_DERIVED,
      warnings: [`no figure derived: ${String(error)}`],
    };
  }
}

// Reads provider data of any shape, so a malformed exchange reports "none"
// with the reason rather than throwing into a billing path.
function safeExtract(exchange: ProviderExchange): Extracted {
  try {
    return extractorFor(exchange.provider)(exchange);
  } catch (error) {
    return {
      usage: {},
      evidence: [],
      warnings: [`could not read this exchange: ${String(error)}`],
    };
  }
}

function basisOf(
  usage: ActualUsage,
  statedUsd: number | null,
  derivedUsd: number | null
): ActualBasis {
  if (statedUsd !== null) return "stated";
  if (derivedUsd !== null) return "derived";
  return Object.keys(usage).length > 0 ? "usage-only" : "none";
}

/**
 * Reads what one exchange says the call used and cost. Pure and local: no
 * network, no file access, and it never guesses. A family with nothing to read
 * returns basis "none" and a warning, and an unpriced model returns
 * "usage-only" with the estimator's reason.
 *
 * statedUsd is the provider's figure or a fixed conversion (xAI ticks, MachGen
 * micros, KIE credits at 0.005 USD). ElevenLabs credits are `usage.credits`,
 * never USD, because their value depends on the plan. settled is false on a
 * submit or an in-flight poll; merge those with mergeActuals. A figure on an
 * unsettled part can still move: a KIE poll may read 0 credits until it ends.
 */
export function extractActual(exchange: ProviderExchange): CostActual {
  const extracted = safeExtract(exchange);
  const warnings = [...(extracted.warnings ?? [])];
  let settled = extracted.settled ?? true;
  // A 4xx ends the call: there is no later read to wait for. A 429 or a 5xx may
  // pass, so it keeps what the family said.
  const failedForGood =
    exchange.status >= 400 && exchange.status < 500 && exchange.status !== 429;
  if (exchange.status >= 400) {
    warnings.push(`the provider answered HTTP ${exchange.status}`);
    if (failedForGood && !extracted.stillPending) {
      settled = true;
      removeWarning(warnings, SUBMIT_PENDING);
    }
  }
  // The flag also covers a truncated request, so only a stream that visibly
  // stops short counts as incomplete. Output with no input is a stream that lost
  // its opening frame, and pricing that alone would state a low figure as final.
  const { responseBody, bodyTruncated } = exchange;
  const cutShort =
    bodyTruncated === true &&
    Array.isArray(responseBody) &&
    (!streamHasFinalUsage(responseBody) ||
      (extracted.usage.outputTokens !== undefined &&
        extracted.usage.inputTokens === undefined));
  if (cutShort) {
    settled = false;
    warnings.push(TRUNCATED_STREAM);
  }
  if (bodyTruncated === true && responseBody === null) {
    warnings.push(RESPONSE_NOT_CAPTURED);
  }
  // A body cut before it closed is not a final answer with nothing in it: a poll cut
  // that way must not end its call. Headers arrive whole, so a figure from them stands.
  if (
    exchange.responseCut === true &&
    responseBody === null &&
    !failedForGood &&
    extracted.statedUsd == null &&
    Object.keys(extracted.usage).length === 0
  ) {
    settled = false;
  }
  const model = extracted.model ?? null;
  const derived = cutShort ? NOT_DERIVED : derive(exchange, model, extracted);
  warnings.push(...derived.warnings);
  const statedUsd = extracted.statedUsd ?? null;
  const statedListUsd = extracted.statedListUsd ?? null;
  const basis = basisOf(extracted.usage, statedUsd, derived.usd);
  // Every figure-less result says why.
  if (basis === "none" && statedListUsd === null && warnings.length === 0) {
    warnings.push(NOTHING_REPORTED);
  }
  if (basis === "usage-only" && warnings.length === 0) {
    warnings.push(NO_RATE_FOR_USAGE);
  }
  return {
    provider: exchange.provider,
    dotPath: exchange.dotPath ?? null,
    model,
    usage: extracted.usage,
    evidence: extracted.evidence,
    statedUsd,
    statedListUsd,
    derivedUsd: derived.usd,
    usd: statedUsd ?? derived.usd,
    basis,
    settled,
    rateAsOf: derived.rateAsOf,
    warnings,
    ...(derived.notes ? { notes: derived.notes } : {}),
    ...(extracted.uncoveredCharge
      ? { uncoveredCharge: extracted.uncoveredCharge }
      : {}),
    ...(extracted.serviceTier ? { serviceTier: extracted.serviceTier } : {}),
    ...(derived.unitRate ? { unitRate: derived.unitRate } : {}),
  };
}

function removeWarning(warnings: string[], warning: string): void {
  const at = warnings.indexOf(warning);
  if (at >= 0) warnings.splice(at, 1);
}

function lastNonNull<T>(values: readonly (T | null)[]): T | null {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = values[i];
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

// A finished part with a figure, followed by an unfinished one, means a second
// call began. Its figure would silently replace the first call's.
function looksLikeSeveralCalls(parts: readonly CostActual[]): boolean {
  let finishedWithFigure = false;
  for (const part of parts) {
    if (!part.settled && finishedWithFigure) return true;
    if (
      part.settled &&
      (part.statedUsd !== null ||
        part.statedListUsd !== null ||
        part.derivedUsd !== null ||
        part.usage.billableUnits !== undefined)
    ) {
      finishedWithFigure = true;
    }
  }
  return false;
}

/**
 * Combines the exchanges of ONE call, in the order they happened: a submit, its
 * polls and any receipt. A later figure replaces an earlier one, because the
 * terminal read holds the final bill, and the last part says whether the call
 * is settled. Units a poll reports are priced at the rate the submit's request
 * selected. Parts of more than one call are not summed: split them first. A
 * merge that looks like several calls says so in `warnings`.
 */
export function mergeActuals(parts: readonly CostActual[]): CostActual {
  const head = parts[0];
  const last = parts.at(-1);
  if (!head || !last) {
    return {
      provider: "",
      dotPath: null,
      model: null,
      usage: {},
      evidence: [],
      statedUsd: null,
      statedListUsd: null,
      derivedUsd: null,
      usd: null,
      basis: "none",
      settled: false,
      rateAsOf: null,
      warnings: ["no exchanges to merge"],
    };
  }
  const usage: ActualUsage = {};
  for (const part of parts) Object.assign(usage, part.usage);
  const statedUsd = lastNonNull(parts.map((part) => part.statedUsd));
  const statedListUsd = lastNonNull(parts.map((part) => part.statedListUsd));
  let derivedUsd = lastNonNull(parts.map((part) => part.derivedUsd));
  let rateAsOf = lastNonNull(parts.map((part) => part.rateAsOf));
  const unitRate = lastNonNull(parts.map((part) => part.unitRate ?? null));
  const uncoveredCharge = parts.find(
    (part) => part.uncoveredCharge
  )?.uncoveredCharge;
  const serviceTier = lastNonNull(
    parts.map((part) => part.serviceTier ?? null)
  );
  const units = usage.seconds ?? usage.images ?? usage.characters;
  if (derivedUsd === null && unitRate && units !== undefined) {
    derivedUsd = unitRate.usd * units;
    rateAsOf = unitRate.asOf;
  }
  const settled = last.settled;
  const basis = basisOf(usage, statedUsd, derivedUsd);
  const warnings = [...new Set(parts.flatMap((part) => part.warnings))].filter(
    (warning) =>
      !(settled && warning === SUBMIT_PENDING) &&
      !(basis !== "none" && warning === NOTHING_REPORTED) &&
      !(basis !== "usage-only" && warning === NO_RATE_FOR_USAGE)
  );
  if (looksLikeSeveralCalls(parts)) {
    warnings.push(
      "these parts look like more than one call; only the last figure is kept"
    );
  }
  return {
    provider: head.provider,
    dotPath: head.dotPath,
    // The first model is the one the caller sent; a poll may name an alias.
    model: parts.find((part) => part.model !== null)?.model ?? null,
    usage,
    evidence: [...new Set(parts.flatMap((part) => part.evidence))],
    statedUsd,
    statedListUsd,
    derivedUsd,
    usd: statedUsd ?? derivedUsd,
    basis,
    settled,
    rateAsOf,
    warnings,
    ...(parts.some((p) => p.notes?.length)
      ? { notes: [...new Set(parts.flatMap((p) => p.notes ?? []))] }
      : {}),
    ...(uncoveredCharge ? { uncoveredCharge } : {}),
    ...(serviceTier ? { serviceTier } : {}),
    ...(unitRate ? { unitRate } : {}),
  };
}
