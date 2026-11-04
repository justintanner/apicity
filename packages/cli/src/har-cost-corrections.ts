import type {
  CostHelperActual,
  CostHelperHints,
  CostHelperTokenPricing,
  CostHelperUnitPricing,
} from "./cost.js";

export interface HarCostProposal {
  provider: string;
  pricingKey: string;
  field: string;
  unit: string;
  current: number | null;
  implied: number;
  calls: number;
  files: string[];
}

/** One call's answer to "what would this rate have to be?". */
export interface RateVote {
  provider: string;
  pricingKey: string;
  field: string;
  unit: string;
  current: number | null;
  implied: number;
  file: string;
}

/** A vote, or word that this rate's row cannot be trusted, or neither. */
export interface Solved {
  vote?: RateVote;
  contradicted?: boolean;
}

type Base = Pick<RateVote, "provider" | "pricingKey" | "file">;

const AGREEMENT = 0.01;
const PER_MILLION = 1_000_000;
// One call can be a promotion or a hand-written fixture. It can fill an empty
// rate, where nothing is overwritten, but it cannot overturn a published one.
const CALLS_TO_CHANGE_A_RATE = 2;
// KIE rounds a chat charge to 0.01 credit (0.00005 USD), so a solved part under
// 100 of those steps moves by over 1% on rounding alone.
const KIE_SMALLEST_SOLVED_USD = 0.005;
// A cached read never costs more than the input it replaces, and the dearest
// published write is 2x input. Beyond these, the known rates or a fee are off.
const MOST_OF_INPUT_RATE: Record<string, number> = {
  cacheRead: 1,
  cacheWrite: 2,
  cacheWrite5m: 2,
  cacheWrite1h: 2,
};
const STANDARD_TIERS: ReadonlySet<string> = new Set([
  "default",
  "auto",
  "standard",
]);

// The charge to solve from, or null if the call cannot speak for a rate. A zero
// charge is a failed task or a promotion. A fee or a non-standard tier bills
// more than the rates in the equation, and solving would absorb the difference.
function statedOf(actual: CostHelperActual): number | null {
  if (actual.uncoveredCharge) return null;
  if (actual.serviceTier && !STANDARD_TIERS.has(actual.serviceTier)) {
    return null;
  }
  const stated = actual.statedListUsd ?? actual.statedUsd;
  return stated !== null && stated > 0 ? stated : null;
}

/**
 * Solves (stated - known parts) / count when one token rate is unknown. A call
 * with no unknown rate proves nothing, but if its known rates miss the stated
 * charge one of them is wrong, so nothing solved against them can be trusted.
 */
export function tokenVote(
  actual: CostHelperActual,
  entry: CostHelperTokenPricing,
  base: Base
): Solved {
  const stated = statedOf(actual);
  const { usage } = actual;
  const { inputTokens: input, outputTokens: output } = usage;
  if (stated === null || input === undefined || output === undefined) return {};
  // These bill at a rate this equation does not hold, so it has several unknowns.
  if (
    entry.longContext ||
    entry.modalityRates ||
    usage.audioInputTokens ||
    usage.imageInputTokens ||
    usage.audioOutputTokens ||
    usage.imageOutputTokens
  ) {
    return {};
  }
  const cached = usage.cacheReadInputTokens ?? 0;
  const written = usage.cacheWriteInputTokens ?? 0;
  // Input counts its cached and written subsets, so less than those is unreadable.
  const oneHour = usage.cacheWrite1hInputTokens ?? 0;
  if (input < cached + written || oneHour < 0 || oneHour > written) return {};
  const { rate } = entry;
  const parts: { field: string; count: number; rate: number | undefined }[] = [
    { field: "input", count: input - cached - written, rate: rate.input },
    { field: "output", count: output, rate: rate.output },
    { field: "cacheRead", count: cached, rate: rate.cacheRead },
    {
      field: rate.cacheWrite5m === undefined ? "cacheWrite" : "cacheWrite5m",
      count: written - oneHour,
      rate: rate.cacheWrite ?? rate.cacheWrite5m,
    },
  ];
  parts.push({
    field: "cacheWrite1h",
    count: oneHour,
    rate: rate.cacheWrite1h,
  });
  const counted = parts.filter((part) => part.count > 0);
  const unknown = counted.filter((part) => part.rate === undefined);
  const known = counted.reduce(
    (usd, part) => usd + (part.count * (part.rate ?? 0)) / PER_MILLION,
    0
  );
  if (unknown.length === 0) {
    return { contradicted: Math.abs(stated - known) > stated * AGREEMENT };
  }
  if (unknown.length > 1) return {};
  const [part] = unknown;
  const solved = stated - known;
  if (base.provider === "kie" && solved < KIE_SMALLEST_SOLVED_USD) return {};
  const implied = (solved / part.count) * PER_MILLION;
  if (implied < 0 || implied > rate.input * MOST_OF_INPUT_RATE[part.field]) {
    return { contradicted: true };
  }
  return {
    vote: {
      ...base,
      field: part.field,
      unit: "USD per 1M tokens",
      current: null,
      implied,
    },
  };
}

/**
 * A per-unit row has one rate per variant, so that rate is the only unknown. The
 * table counts the units: only it knows that a reference video bills its read
 * seconds, and it refuses a request it cannot count. Reported seconds reach it as
 * the same hint the estimator takes.
 */
export function unitVote(
  actual: CostHelperActual,
  entry: CostHelperUnitPricing,
  payload: Record<string, unknown> | null,
  base: Base
): Solved {
  const stated = statedOf(actual);
  if (stated === null || !payload) return {};
  const { seconds } = actual.usage;
  const hints: CostHelperHints | undefined =
    seconds === undefined ? undefined : { durationSeconds: seconds };
  const count = entry.units(payload, hints);
  if (count === undefined || !(count > 0)) return {};
  // The row says this figure is a floor, so a solve would misread what is above it.
  if (entry.warn?.(payload, hints).length) return {};
  const picks = entry.select.map((selector) => ({
    selector,
    value: selector.pick(payload, hints),
  }));
  if (
    picks.some(
      ({ selector, value }) => selector.required && value === undefined
    )
  ) {
    return {};
  }
  // As evaluatePerUnit builds it: an empty selector value joins no key.
  const variant = picks
    .map(({ value }) => value)
    .filter(Boolean)
    .join("|");
  const extra = entry.extra ? entry.extra(payload, hints) : 0;
  if (extra === undefined || !Number.isFinite(extra) || extra < 0) return {};
  const implied = (stated - extra) / count;
  if (implied < 0) return { contradicted: true };
  return {
    vote: {
      ...base,
      field: `rates[${JSON.stringify(variant)}]`,
      unit: `USD per ${entry.unit.replace(/s$/, "")}`,
      current: entry.rates[variant] ?? null,
      implied,
    },
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** A proposal needs every call that solved for the rate to agree within 1%. */
export function proposalsFrom(votes: RateVote[]): HarCostProposal[] {
  const byRate = new Map<string, RateVote[]>();
  for (const vote of votes) {
    const key = JSON.stringify([vote.provider, vote.pricingKey, vote.field]);
    byRate.set(key, [...(byRate.get(key) ?? []), vote]);
  }
  const proposals: HarCostProposal[] = [];
  for (const group of byRate.values()) {
    const solved = group.map((vote) => vote.implied);
    const lowest = Math.min(...solved);
    if (Math.max(...solved) - lowest > lowest * AGREEMENT) continue;
    const implied = median(solved);
    const { provider, pricingKey, field, unit, current } = group[0];
    if (current !== null) {
      if (Math.abs(implied - current) <= current * AGREEMENT) continue;
      if (group.length < CALLS_TO_CHANGE_A_RATE) continue;
    }
    proposals.push({
      provider,
      pricingKey,
      field,
      unit,
      current,
      implied: Number(implied.toPrecision(6)),
      calls: group.length,
      files: [...new Set(group.map((vote) => vote.file))].sort(),
    });
  }
  return proposals;
}
