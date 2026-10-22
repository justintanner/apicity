/**
 * Price summary for one frontier endpoint, from the bundled tables.
 *
 * Reads no files and makes no network call. A missing rate is the explicit
 * pricingKey "unpriced", not a guessed number.
 */
import { PRICING, PRICING_AS_OF } from "../pricing/index";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../pricing/fal";
import type { CostUnit, ModelPricing } from "../pricing/types";

/** Min and max of a per-unit table, plus where the rates came from. */
export interface FrontierRatePrice {
  unit: CostUnit;
  min: number;
  max: number;
  asOf: string;
  url: string;
}

/** Fal bills this endpoint from delivered units, not a bundled rate. */
export interface FrontierDynamicPrice {
  unit: "dynamic";
}

export type FrontierPrice = FrontierRatePrice | FrontierDynamicPrice;

export interface FrontierPricedEndpoint {
  provider: string;
  dotPath: string;
  modelId?: string;
  pricingKey?: string;
}

const DYNAMIC = new Set<string>(FAL_DYNAMIC_PRICING_ENDPOINTS);

const UNIT_LABEL: Record<CostUnit, string> = {
  seconds: "s",
  images: "image",
  generations: "generation",
  megapixels: "megapixel",
  songs: "song",
  characters: "character",
  tokens: "token",
};

const tables = PRICING as unknown as Record<
  string,
  Record<string, ModelPricing>
>;

/** Drop binary noise past the decimals the rate tables use. */
export function cleanFrontierRate(value: number): number {
  return Number(value.toFixed(10));
}

export function formatFrontierRate(value: number): string {
  const text = cleanFrontierRate(value)
    .toFixed(10)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
  return text === "" ? "0" : text;
}

/** "0.04-0.16 USD/s", "0.08 USD/image", "dynamic", or "-". */
export function formatFrontierPrice(price: FrontierPrice | null): string {
  if (price === null) return "-";
  if (price.unit === "dynamic") return "dynamic";
  const min = formatFrontierRate(price.min);
  const max = formatFrontierRate(price.max);
  const amount = min === max ? min : `${min}-${max}`;
  return `${amount} USD/${UNIT_LABEL[price.unit]}`;
}

/**
 * The price for one endpoint.
 *
 * `pricingKey` wins. Otherwise a shared callable uses `modelId`. A dedicated
 * leaf with neither throws. `"unpriced"` and a token-priced model are null.
 * A fal id on the dynamic list is `{ unit: "dynamic" }`.
 */
export function frontierPrice(
  entry: FrontierPricedEndpoint
): FrontierPrice | null {
  const key = entry.pricingKey ?? entry.modelId;
  const where = `${entry.provider} ${entry.dotPath}`;
  if (key === undefined) {
    throw new Error(
      `frontier price: ${where} needs a pricingKey (dedicated leaf)`
    );
  }
  if (key === "unpriced") return null;
  if (entry.provider === "fal" && DYNAMIC.has(key)) {
    return { unit: "dynamic" };
  }
  const priced = tables[entry.provider]?.[key];
  if (priced === undefined) {
    throw new Error(
      `frontier price: ${where} key ${JSON.stringify(key)} ` +
        `is not in PRICING or "unpriced"`
    );
  }
  // Token tables have no per-unit range. Image and video rows are per-unit.
  if (priced.kind === "tokens") return null;
  const values = Object.values(priced.rates);
  if (values.length === 0) {
    throw new Error(
      `frontier price: ${where} key ${JSON.stringify(key)} has no rates`
    );
  }
  return {
    unit: priced.unit,
    min: cleanFrontierRate(Math.min(...values)),
    max: cleanFrontierRate(Math.max(...values)),
    asOf: priced.source.asOf ?? PRICING_AS_OF,
    url: priced.source.url,
  };
}
