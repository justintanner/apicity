// ---------------------------------------------------------------------------
// @apicity/polymarket — public Polymarket APIs (Gamma, Data, CLOB market-data)
// ---------------------------------------------------------------------------

import type { z } from "zod";
import type {
  PolymarketClobTokenBatchRequest,
  PolymarketClobPricesBatchRequest,
  PolymarketClobBatchPricesHistoryRequest,
} from "./zod";

// -- Request types — derived from Zod schemas (source of truth in zod.ts) ----

export type {
  PolymarketOptions,
  PolymarketClobTokenBatchRequest,
  PolymarketClobPricesBatchRequest,
  PolymarketClobBatchPricesHistoryRequest,
} from "./zod";

// -- Shared scalars ---------------------------------------------------------

// Polymarket CLOB returns prices and sizes as decimal strings (e.g. "0.16",
// "1116.34") to preserve precision over the wire — callers convert to Number
// when arithmetic is needed.
export type PolymarketClobSide = "BUY" | "SELL";

// -- Response types (hand-written) ------------------------------------------

// CLOB /time returns a plain-text Unix timestamp in seconds (e.g. "1778040747"),
// not JSON. The factory parses it to a number before returning so callers
// don't repeat that work.
export type PolymarketServerTime = number;

export interface PolymarketClobBookLevel {
  price: string;
  size: string;
}

export interface PolymarketClobBook {
  market: string;
  asset_id: string;
  timestamp: string;
  hash: string;
  bids: PolymarketClobBookLevel[];
  asks: PolymarketClobBookLevel[];
}

export interface PolymarketClobPriceResponse {
  price: string;
}

export interface PolymarketClobMidpointResponse {
  mid: string;
}

export interface PolymarketClobSpreadResponse {
  spread: string;
}

export interface PolymarketClobLastTradePriceResponse {
  price: string;
  side: PolymarketClobSide;
}

// CLOB tick-size and fee-rate return numeric primitives, not decimal strings —
// the server represents these as JSON numbers because they fit float64 cleanly.
export interface PolymarketClobTickSizeResponse {
  minimum_tick_size: number;
}

export interface PolymarketClobFeeRateResponse {
  base_fee: number;
}

// Each history point is { t: unix-seconds, p: decimal-price-as-number }. The
// server returns numeric primitives here, not decimal strings — series shape
// differs from the singular price endpoints.
export interface PolymarketClobPriceHistoryPoint {
  t: number;
  p: number;
}

export interface PolymarketClobPriceHistoryResponse {
  history: PolymarketClobPriceHistoryPoint[];
}

// -- Market metadata (C3) ---------------------------------------------------

export interface PolymarketClobMarketToken {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface PolymarketClobMarketRewardRate {
  asset_address: string;
  rewards_daily_rate: number;
}

export interface PolymarketClobMarketRewards {
  rates: PolymarketClobMarketRewardRate[] | null;
  min_size: number;
  max_spread: number;
}

export interface PolymarketClobMarket {
  enable_order_book: boolean;
  active: boolean;
  closed: boolean;
  archived: boolean;
  accepting_orders: boolean;
  accepting_order_timestamp: string | null;
  minimum_order_size: number;
  minimum_tick_size: number;
  condition_id: string;
  question_id: string;
  question: string;
  description: string;
  market_slug: string;
  end_date_iso: string | null;
  game_start_time: string | null;
  seconds_delay: number;
  fpmm: string;
  maker_base_fee: number;
  taker_base_fee: number;
  notifications_enabled: boolean;
  neg_risk: boolean;
  neg_risk_market_id: string;
  neg_risk_request_id: string;
  icon: string;
  image: string;
  rewards: PolymarketClobMarketRewards;
  is_50_50_outcome: boolean;
  tokens: PolymarketClobMarketToken[];
  tags: string[];
}

// /simplified-markets and /sampling-simplified-markets return a leaner shape
// without question text or pricing metadata — useful when you only need
// condition_id + token_ids in bulk.
export interface PolymarketClobSimplifiedMarket {
  condition_id: string;
  rewards: PolymarketClobMarketRewards;
  tokens: PolymarketClobMarketToken[];
  active: boolean;
  closed: boolean;
  archived: boolean;
  accepting_orders: boolean;
}

// Cursor-based pagination envelope shared by /markets, /sampling-markets,
// /simplified-markets, /sampling-simplified-markets.
export interface PolymarketClobPaginationQuery {
  next_cursor?: string;
}

export interface PolymarketClobPaginatedResponse<T> {
  data: T[];
  next_cursor: string;
  limit: number;
  count: number;
}

export type PolymarketClobMarketListResponse =
  PolymarketClobPaginatedResponse<PolymarketClobMarket>;

export type PolymarketClobSimplifiedMarketListResponse =
  PolymarketClobPaginatedResponse<PolymarketClobSimplifiedMarket>;

export interface PolymarketClobMarketsByTokenResponse {
  condition_id: string;
  primary_token_id: string;
  secondary_token_id: string;
}

// /clob-markets/{condition_id} returns a single-letter-keyed compact form
// optimized for hot-path market discovery: c=condition_id, t=tokens, r=rewards,
// mos=minimum_order_size, mts=minimum_tick_size, mbf=maker_base_fee,
// tbf=taker_base_fee, ao=accepting_orders, aot=accepting_order_timestamp.
// Field semantics for `cbos`, `ibce`, and the nested `fd` object are not
// documented upstream — preserved as-is for callers that need them.
export interface PolymarketClobMarketCompactToken {
  t: string;
  o: string;
}

export interface PolymarketClobMarketCompactRewards {
  mi: number;
  ma: number;
  e: boolean;
  moas: number;
}

export interface PolymarketClobMarketCompactFundingDetails {
  r: number;
  e: number;
  to: boolean;
}

export interface PolymarketClobMarketCompact {
  c: string;
  t: PolymarketClobMarketCompactToken[];
  r: PolymarketClobMarketCompactRewards;
  mos: number;
  mts: number;
  mbf: number;
  tbf: number;
  ao: boolean;
  cbos: boolean;
  aot: string;
  ibce: boolean;
  fd: PolymarketClobMarketCompactFundingDetails;
}

// -- Batch POST responses (C5) ----------------------------------------------

// /books returns an array of full Book objects, parallel to the request array
// but ordered by the server (asset_id is the source of truth, not array index).
export type PolymarketClobBooksBatchResponse = PolymarketClobBook[];

// /prices returns a 2-level map: token_id → { BUY: price, SELL: price }. Only
// the sides actually requested for that token are present.
export type PolymarketClobPricesBatchResponse = Record<
  string,
  Partial<Record<PolymarketClobSide, string>>
>;

// /midpoints and /spreads return a flat map: token_id → decimal-string value.
export type PolymarketClobMidpointsBatchResponse = Record<string, string>;
export type PolymarketClobSpreadsBatchResponse = Record<string, string>;

// /last-trades-prices returns an array of last-trade entries — same shape as
// the singular /last-trade-price plus a token_id discriminator.
export interface PolymarketClobLastTradesPricesEntry {
  price: string;
  side: PolymarketClobSide;
  token_id: string;
}

export type PolymarketClobLastTradesPricesBatchResponse =
  PolymarketClobLastTradesPricesEntry[];

// /batch-prices-history returns a series-per-market map; series shape matches
// the singular /prices-history endpoint.
export interface PolymarketClobBatchPricesHistoryResponse {
  history: Record<string, PolymarketClobPriceHistoryPoint[]>;
}

// -- Query types ------------------------------------------------------------

export interface PolymarketClobTokenQuery {
  token_id: string;
}

export interface PolymarketClobPriceQuery extends PolymarketClobTokenQuery {
  side: PolymarketClobSide;
}

// Polymarket accepts either an `interval` shorthand ("1m", "1h", "1d", "max")
// OR an explicit `startTs` / `endTs` Unix-seconds window. `fidelity` controls
// the sampling rate; the server enforces a per-range minimum (e.g. 5 for
// `1w`). `market` is the token_id, despite the field name.
export type PolymarketClobPriceHistoryInterval =
  | "1m"
  | "1h"
  | "6h"
  | "1d"
  | "1w"
  | "max";

export interface PolymarketClobPriceHistoryQuery {
  market: string;
  interval?: PolymarketClobPriceHistoryInterval;
  startTs?: number;
  endTs?: number;
  fidelity?: number;
}

// -- Error ------------------------------------------------------------------

export class PolymarketError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "PolymarketError";
    this.status = status;
    this.body = body ?? null;
  }
}

// -- Method interfaces ------------------------------------------------------

export interface PolymarketClobTimeMethod {
  (signal?: AbortSignal): Promise<PolymarketServerTime>;
}

export interface PolymarketClobBookMethod {
  (
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBook>;
}

export interface PolymarketClobPriceMethod {
  (
    params: PolymarketClobPriceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobPriceResponse>;
}

export interface PolymarketClobMidpointMethod {
  (
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobMidpointResponse>;
}

export interface PolymarketClobSpreadMethod {
  (
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobSpreadResponse>;
}

export interface PolymarketClobLastTradePriceMethod {
  (
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobLastTradePriceResponse>;
}

// Polymarket exposes both /tick-size?token_id=X and /tick-size/{token_id} for
// the same operation. We surface the path-var form only — the query form
// returns identical data and would just clutter the namespace.
export interface PolymarketClobTickSizeMethod {
  (
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobTickSizeResponse>;
}

export interface PolymarketClobFeeRateMethod {
  (
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobFeeRateResponse>;
}

export interface PolymarketClobPricesHistoryMethod {
  (
    params: PolymarketClobPriceHistoryQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobPriceHistoryResponse>;
}

// `markets` is overloaded — pass a string condition_id to retrieve a single
// market, or no args / a pagination query to list. Mirrors openai's
// `v1.models(id?)` callable pattern.
export interface PolymarketClobMarketsMethod {
  (signal?: AbortSignal): Promise<PolymarketClobMarketListResponse>;
  (
    params: PolymarketClobPaginationQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarketListResponse>;
  (conditionId: string, signal?: AbortSignal): Promise<PolymarketClobMarket>;
}

export interface PolymarketClobSamplingMarketsMethod {
  (
    params?: PolymarketClobPaginationQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarketListResponse>;
}

export interface PolymarketClobSimplifiedMarketsMethod {
  (
    params?: PolymarketClobPaginationQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobSimplifiedMarketListResponse>;
}

export interface PolymarketClobSamplingSimplifiedMarketsMethod {
  (
    params?: PolymarketClobPaginationQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobSimplifiedMarketListResponse>;
}

export interface PolymarketClobMarketsByTokenMethod {
  (
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarketsByTokenResponse>;
}

export interface PolymarketClobMarketsCompactMethod {
  (
    conditionId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarketCompact>;
}

// -- Namespace interfaces ---------------------------------------------------

export interface PolymarketClobGetNamespace {
  time: PolymarketClobTimeMethod;
  book: PolymarketClobBookMethod;
  price: PolymarketClobPriceMethod;
  midpoint: PolymarketClobMidpointMethod;
  spread: PolymarketClobSpreadMethod;
  lastTradePrice: PolymarketClobLastTradePriceMethod;
  tickSize: PolymarketClobTickSizeMethod;
  feeRate: PolymarketClobFeeRateMethod;
  pricesHistory: PolymarketClobPricesHistoryMethod;
  markets: PolymarketClobMarketsMethod;
  samplingMarkets: PolymarketClobSamplingMarketsMethod;
  simplifiedMarkets: PolymarketClobSimplifiedMarketsMethod;
  samplingSimplifiedMarkets: PolymarketClobSamplingSimplifiedMarketsMethod;
  marketsByToken: PolymarketClobMarketsByTokenMethod;
  clobMarkets: PolymarketClobMarketsCompactMethod;
}

// -- POST method interfaces (C5) --------------------------------------------

export interface PolymarketClobBooksBatchMethod {
  (
    req: PolymarketClobTokenBatchRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobBooksBatchResponse>;
  schema: z.ZodType<PolymarketClobTokenBatchRequest>;
}

export interface PolymarketClobPricesBatchMethod {
  (
    req: PolymarketClobPricesBatchRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobPricesBatchResponse>;
  schema: z.ZodType<PolymarketClobPricesBatchRequest>;
}

export interface PolymarketClobMidpointsBatchMethod {
  (
    req: PolymarketClobTokenBatchRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobMidpointsBatchResponse>;
  schema: z.ZodType<PolymarketClobTokenBatchRequest>;
}

export interface PolymarketClobSpreadsBatchMethod {
  (
    req: PolymarketClobTokenBatchRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobSpreadsBatchResponse>;
  schema: z.ZodType<PolymarketClobTokenBatchRequest>;
}

export interface PolymarketClobLastTradesPricesBatchMethod {
  (
    req: PolymarketClobTokenBatchRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobLastTradesPricesBatchResponse>;
  schema: z.ZodType<PolymarketClobTokenBatchRequest>;
}

export interface PolymarketClobBatchPricesHistoryMethod {
  (
    req: PolymarketClobBatchPricesHistoryRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobBatchPricesHistoryResponse>;
  schema: z.ZodType<PolymarketClobBatchPricesHistoryRequest>;
}

export interface PolymarketClobPostNamespace {
  books: PolymarketClobBooksBatchMethod;
  prices: PolymarketClobPricesBatchMethod;
  midpoints: PolymarketClobMidpointsBatchMethod;
  spreads: PolymarketClobSpreadsBatchMethod;
  lastTradesPrices: PolymarketClobLastTradesPricesBatchMethod;
  batchPricesHistory: PolymarketClobBatchPricesHistoryMethod;
}

export interface PolymarketPostNamespace {
  clob: PolymarketClobPostNamespace;
}

// ===========================================================================
// Gamma API (https://gamma-api.polymarket.com) — public events/markets/tags/...
// ===========================================================================

// Event markets are nested inside Event objects with the same shape as the
// CLOB Market — but Gamma adds extra display/derivation fields (price arrays,
// 24h/7d/30d volume) that aren't on the CLOB shape. We treat the Gamma
// market as a loose superset, indexed only by the fields callers reliably
// reference; unknown keys come through via the `[k]: unknown` index sig.
export interface PolymarketGammaMarket {
  id: string;
  conditionId?: string;
  questionID?: string;
  question: string;
  description: string;
  slug: string;
  endDate?: string;
  startDate?: string;
  outcomes?: string;
  outcomePrices?: string;
  volume?: string;
  liquidity?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  acceptingOrders?: boolean;
  enableOrderBook?: boolean;
  negRisk?: boolean;
  clobTokenIds?: string;
  [key: string]: unknown;
}

// Gamma's Event envelope wraps a list of related Markets that all settle
// together (e.g. an election with a market per candidate). The full shape
// has 50+ fields; we surface the most-referenced ones explicitly and let
// callers drop into [key: string]: unknown for the rest.
export interface PolymarketGammaEvent {
  id: string;
  ticker?: string;
  slug: string;
  title: string;
  description: string;
  startDate?: string;
  creationDate?: string;
  endDate?: string;
  image?: string;
  icon?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  new?: boolean;
  featured?: boolean;
  restricted?: boolean;
  liquidity?: number;
  volume?: number;
  openInterest?: number;
  competitive?: number;
  volume24hr?: number;
  volume1wk?: number;
  volume1mo?: number;
  volume1yr?: number;
  enableOrderBook?: boolean;
  liquidityClob?: number;
  negRisk?: boolean;
  commentCount?: number;
  markets: PolymarketGammaMarket[];
  tags?: PolymarketGammaTag[];
  [key: string]: unknown;
}

export interface PolymarketGammaTag {
  id: string;
  label: string;
  slug: string;
  forceShow?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isCarousel?: boolean;
  requiresTranslation?: boolean;
  [key: string]: unknown;
}

// /events returns a bare JSON array (no envelope) — we represent the list
// shape directly.
export type PolymarketGammaEventListResponse = PolymarketGammaEvent[];

// /events/keyset uses a different envelope: { events, next_cursor }. The
// pagination cursor is a base64-encoded offset string, opaque to callers.
export interface PolymarketGammaEventKeysetResponse {
  events: PolymarketGammaEvent[];
  next_cursor: string;
}

// /events query parameters — Gamma accepts a deep set of filters (limit,
// offset, order, ascending, ID lists, tag filters, time-window filters,
// boolean state filters). Fully enumerated for type safety; all optional.
export interface PolymarketGammaEventListQuery {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  id?: number | number[];
  slug?: string | string[];
  archived?: boolean;
  active?: boolean;
  closed?: boolean;
  liquidity_min?: number;
  liquidity_max?: number;
  volume_min?: number;
  volume_max?: number;
  start_date_min?: string;
  start_date_max?: string;
  end_date_min?: string;
  end_date_max?: string;
  tag?: string;
  tag_id?: number;
  related_tags?: boolean;
  tag_slug?: string;
  featured?: boolean;
  restricted?: boolean;
  cyom?: boolean;
  recurrence?: string;
}

// Cursor pagination uses opaque next_cursor strings — pass undefined / empty
// for the first page.
export interface PolymarketGammaKeysetQuery extends PolymarketGammaEventListQuery {
  next_cursor?: string;
}

// -- Gamma method interfaces ------------------------------------------------

export interface PolymarketGammaEventsMethod {
  (signal?: AbortSignal): Promise<PolymarketGammaEventListResponse>;
  (
    params: PolymarketGammaEventListQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaEventListResponse>;
  (id: string, signal?: AbortSignal): Promise<PolymarketGammaEvent>;
  keyset(
    params?: PolymarketGammaKeysetQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaEventKeysetResponse>;
  slug(slug: string, signal?: AbortSignal): Promise<PolymarketGammaEvent>;
  tags(id: string, signal?: AbortSignal): Promise<PolymarketGammaTag[]>;
}

export interface PolymarketGammaGetNamespace {
  events: PolymarketGammaEventsMethod;
}

// -- Top-level provider shape (multi-host) ----------------------------------

export interface PolymarketGetNamespace {
  clob: PolymarketClobGetNamespace;
  gamma: PolymarketGammaGetNamespace;
}

export interface PolymarketProvider {
  get: PolymarketGetNamespace;
  post: PolymarketPostNamespace;
}
