/**
 * Committed frontier registry.
 *
 * `FRONTIER` and `FRONTIER_TYPES` are generated from `scripts/frontier`.
 * This module adds the lookup. It reads no files and makes no network calls.
 */
import { FRONTIER as FRONTIER_DATA, FRONTIER_TYPES as TYPE_DATA } from "./data";
import { frontierPrice, type FrontierPrice } from "./price";

export type {
  FrontierDynamicPrice,
  FrontierPrice,
  FrontierRatePrice,
} from "./price";
export { formatFrontierPrice } from "./price";

export const FRONTIER_TYPE_CODES = [
  "t2i",
  "i2i",
  "t2v",
  "i2v",
  "v2v",
  "r2v",
] as const;

export type FrontierType = (typeof FRONTIER_TYPE_CODES)[number];

export interface FrontierEndpoint {
  provider: string;
  dotPath: string;
  modelId?: string;
  /**
   * Key into `PRICING[provider]`, or `"unpriced"`.
   * Omitted on a shared callable whose `modelId` is that key.
   */
  pricingKey?: string;
}

export interface FrontierEntry {
  rank: number;
  model: string;
  creator: string;
  elo: number;
  endpoints: readonly FrontierEndpoint[];
}

export interface FrontierSnapshot {
  leaderboardId: string;
  sourceUrl: string;
  capturedOn: string;
  methodology: string;
  entries: readonly FrontierEntry[];
}

export interface FrontierTypeInfo {
  type: FrontierType;
  name: string;
  aliases: readonly string[];
  leaderboardId: string;
  sourceUrl: string;
  capturedOn: string;
  methodology: string;
  derived: boolean;
}

/** One mapped endpoint, in leaderboard order. */
export interface FrontierRow {
  type: FrontierType;
  rank: number;
  model: string;
  creator: string;
  elo: number;
  provider: string;
  dotPath: string;
  modelId?: string;
  /** Bundled per-unit range, `{ unit: "dynamic" }`, or null. */
  price: FrontierPrice | null;
}

export interface FrontierOptions {
  /** Keep only this provider's endpoints. */
  provider?: string;
}

export const FRONTIER_TYPES: readonly FrontierTypeInfo[] =
  TYPE_DATA as readonly FrontierTypeInfo[];

export const FRONTIER: Record<FrontierType, FrontierSnapshot> =
  FRONTIER_DATA as Record<FrontierType, FrontierSnapshot>;

const CODES = FRONTIER_TYPE_CODES.join(", ");

/**
 * The task-type code for a code, long name, or alias.
 * Anything else is `undefined`.
 */
export function frontierType(input: string): FrontierType | undefined {
  const match = FRONTIER_TYPES.find(
    (info) =>
      info.type === input || info.name === input || info.aliases.includes(input)
  );
  return match?.type;
}

/**
 * Mapped endpoints for one task type, in rank order.
 *
 * An unknown type throws a `RangeError` that names the six codes. Models
 * with an empty endpoint list are omitted. `modelId` is set only for a
 * shared callable. `price` comes from the bundled tables.
 */
export function frontier(
  type: string,
  options: FrontierOptions = {}
): FrontierRow[] {
  const resolved = frontierType(type);
  if (resolved === undefined) {
    throw new RangeError(
      `unknown frontier type ${JSON.stringify(type)}; expected one of ${CODES}`
    );
  }
  const snapshot = FRONTIER[resolved];
  const provider = options.provider;
  const rows: FrontierRow[] = [];
  for (const entry of snapshot.entries) {
    for (const endpoint of entry.endpoints) {
      if (provider !== undefined && endpoint.provider !== provider) continue;
      const row: FrontierRow = {
        type: resolved,
        rank: entry.rank,
        model: entry.model,
        creator: entry.creator,
        elo: entry.elo,
        provider: endpoint.provider,
        dotPath: endpoint.dotPath,
        price: frontierPrice(endpoint),
      };
      if (endpoint.modelId !== undefined) row.modelId = endpoint.modelId;
      rows.push(row);
    }
  }
  return rows;
}
