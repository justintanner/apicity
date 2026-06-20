// ---------------------------------------------------------------------------
// @apicity/polymarket — Polymarket APIs (Gamma, Data, CLOB trading/market-data)
// ---------------------------------------------------------------------------

import type { z } from "zod";
import type {
  PolymarketClobL1Headers,
  PolymarketClobTokenIdsQuery,
  PolymarketClobPricesQuery,
  PolymarketClobLiveActivityRequest,
  PolymarketClobTokenBatchRequest,
  PolymarketClobPricesBatchRequest,
  PolymarketClobBatchPricesHistoryRequest,
  PolymarketClobPostOrderRequest,
  PolymarketClobPlaceOrderRequest,
  PolymarketClobPostOrdersRequest,
  PolymarketClobCancelOrderRequest,
  PolymarketClobCancelOrdersRequest,
  PolymarketClobCancelMarketOrdersRequest,
  PolymarketClobBalanceAllowanceQuery,
  PolymarketClobUserOrdersQuery,
  PolymarketClobUserTradesQuery,
  PolymarketClobNotificationsQuery,
  PolymarketClobDropNotificationsQuery,
  PolymarketClobOrderScoringQuery,
  PolymarketClobOrdersScoringQuery,
  PolymarketClobOrdersScoringRequest,
  PolymarketClobHeartbeatRequest,
  PolymarketClobRewardsUserQuery,
  PolymarketClobRewardsUserTotalQuery,
  PolymarketClobRewardPercentagesQuery,
  PolymarketClobRewardsUserMarketsQuery,
  PolymarketClobRewardsCurrentQuery,
  PolymarketClobRewardsMarketQuery,
  PolymarketClobRewardsMultiMarketsQuery,
  PolymarketClobRebatesCurrentQuery,
  PolymarketClobBuilderTradesQuery,
} from "./zod";

// -- Request types — derived from Zod schemas (source of truth in zod.ts) ----

export type {
  PolymarketOptions,
  PolymarketClobApiCredentials,
  PolymarketClobL1Headers,
  PolymarketClobL2HeaderArgs,
  PolymarketClobL2Headers,
  PolymarketClobL2HeaderSigner,
  PolymarketClobTokenIdsQuery,
  PolymarketClobPricesQuery,
  PolymarketClobLiveActivityRequest,
  PolymarketClobTokenBatchRequest,
  PolymarketClobPricesBatchRequest,
  PolymarketClobBatchPricesHistoryRequest,
  PolymarketClobSignedOrder,
  PolymarketClobPostOrderRequest,
  PolymarketClobPlaceOrderRequest,
  PolymarketClobPostOrdersRequest,
  PolymarketClobCancelOrderRequest,
  PolymarketClobCancelOrdersRequest,
  PolymarketClobCancelMarketOrdersRequest,
  PolymarketClobBalanceAllowanceQuery,
  PolymarketClobUserOrdersQuery,
  PolymarketClobUserTradesQuery,
  PolymarketClobNotificationsQuery,
  PolymarketClobDropNotificationsQuery,
  PolymarketClobOrderScoringQuery,
  PolymarketClobOrdersScoringQuery,
  PolymarketClobOrdersScoringRequest,
  PolymarketClobHeartbeatRequest,
  PolymarketClobRewardsUserQuery,
  PolymarketClobRewardsUserTotalQuery,
  PolymarketClobRewardPercentagesQuery,
  PolymarketClobRewardsUserMarketsQuery,
  PolymarketClobRewardsCurrentQuery,
  PolymarketClobRewardsMarketQuery,
  PolymarketClobRewardsMultiMarketsQuery,
  PolymarketClobRebatesCurrentQuery,
  PolymarketClobBuilderTradesQuery,
} from "./zod";

// -- Shared scalars ---------------------------------------------------------

// Polymarket CLOB returns prices and sizes as decimal strings (e.g. "0.16",
// "1116.34") to preserve precision over the wire — callers convert to Number
// when arithmetic is needed.
export type PolymarketClobSide = "BUY" | "SELL";
export type PolymarketClobSignatureType = 0 | 1 | 2 | 3;
export type PolymarketClobOrderType = "GTC" | "FOK" | "GTD" | "FAK";
export type PolymarketClobTradeStatus =
  | "TRADE_STATUS_CONFIRMED"
  | "TRADE_STATUS_FAILED"
  | "TRADE_STATUS_RETRYING"
  | "TRADE_STATUS_MATCHED"
  | "TRADE_STATUS_MINED"
  | string;
export type PolymarketClobTraderSide = "TAKER" | "MAKER";

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
  min_order_size?: string;
  tick_size?: string;
  neg_risk?: boolean;
  last_trade_price?: string;
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
  side: PolymarketClobSide | "";
}

// CLOB tick-size and fee-rate return numeric primitives, not decimal strings —
// the server represents these as JSON numbers because they fit float64 cleanly.
export interface PolymarketClobTickSizeResponse {
  minimum_tick_size: number;
}

export interface PolymarketClobFeeRateResponse {
  base_fee: number;
}

export interface PolymarketClobNegRiskResponse {
  neg_risk: boolean;
}

export type PolymarketClobBooksResponse = PolymarketClobBook[];
export type PolymarketClobPricesResponse = Record<
  string,
  Partial<Record<PolymarketClobSide, string | number>>
>;
export type PolymarketClobMidpointsResponse = Record<string, string | number>;
export type PolymarketClobLastTradesPricesResponse =
  PolymarketClobLastTradesPricesEntry[];

export interface PolymarketClobLiveActivityMarket {
  condition_id?: string;
  market?: string;
  active?: boolean;
  accepting_orders?: boolean;
  [key: string]: unknown;
}

export type PolymarketClobLiveActivityResponse =
  PolymarketClobLiveActivityMarket[];

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

// -- Authenticated CLOB account/trading responses ---------------------------

export interface PolymarketClobApiKeyResponse {
  apiKey: string;
  secret: string;
  passphrase: string;
}

export interface PolymarketClobApiKeysResponse {
  apiKeys: string[];
}

export interface PolymarketClobBuilderApiKeyResponse {
  key: string;
  secret: string;
  passphrase: string;
}

export type PolymarketClobBuilderApiKeysResponse = string[];

export interface PolymarketClobPostOrderResponse {
  success: boolean;
  orderID: string;
  status: "live" | "matched" | "delayed" | string;
  makingAmount?: string;
  takingAmount?: string;
  transactionsHashes?: string[];
  tradeIDs?: string[];
  errorMsg?: string;
  [key: string]: unknown;
}

export type PolymarketClobPostOrdersResponse =
  PolymarketClobPostOrderResponse[];

export interface PolymarketClobCancelOrdersResponse {
  canceled: string[];
  not_canceled: Record<string, string>;
}

export interface PolymarketClobOpenOrder {
  id: string;
  status: string;
  owner: string;
  maker_address: string;
  market: string;
  asset_id: string;
  side: PolymarketClobSide;
  original_size: string;
  size_matched: string;
  price: string;
  outcome: string;
  expiration: string;
  order_type: PolymarketClobOrderType | string;
  associate_trades?: string[];
  created_at: number;
  [key: string]: unknown;
}

export type PolymarketClobOpenOrderResponse = PolymarketClobOpenOrder;

export interface PolymarketClobOpenOrdersResponse {
  limit: number;
  next_cursor: string;
  count: number;
  data: PolymarketClobOpenOrder[];
}

export interface PolymarketClobBalanceAllowanceResponse {
  balance: string;
  allowances: Record<string, string>;
}

export interface PolymarketClobClosedOnlyResponse {
  closed_only: boolean;
}

export interface PolymarketClobNotification {
  id: number;
  owner: string;
  type: number;
  payload: Record<string, unknown>;
  timestamp: number;
  [key: string]: unknown;
}

export type PolymarketClobNotificationsResponse = PolymarketClobNotification[];

export interface PolymarketClobHeartbeatResponse {
  status: string;
}

export interface PolymarketClobHeartbeatV1Response {
  heartbeat_id: string;
}

export interface PolymarketClobOrderScoringResponse {
  scoring: boolean;
}

export type PolymarketClobOrdersScoringResponse = Record<string, boolean>;

export interface PolymarketClobTradeMakerOrder {
  order_id?: string;
  owner?: string;
  maker_address?: string;
  matched_amount?: string;
  price?: string;
  fee_rate_bps?: string;
  asset_id?: string;
  outcome?: string;
  side?: PolymarketClobSide;
  [key: string]: unknown;
}

export interface PolymarketClobTrade {
  id: string;
  taker_order_id: string;
  market: string;
  asset_id: string;
  side: PolymarketClobSide;
  size: string;
  price: string;
  status: PolymarketClobTradeStatus;
  match_time: string;
  match_time_nano?: string;
  last_update: string;
  outcome: string;
  bucket_index: number;
  owner: string;
  maker_address: string;
  transaction_hash?: string;
  err_msg?: string | null;
  maker_orders?: PolymarketClobTradeMakerOrder[];
  trader_side: PolymarketClobTraderSide;
  [key: string]: unknown;
}

export interface PolymarketClobTradesResponse {
  limit: number;
  next_cursor: string;
  count: number;
  data: PolymarketClobTrade[];
}

export interface PolymarketClobRewardToken {
  asset_address?: string;
  rewards_daily_rate?: number;
  [key: string]: unknown;
}

export interface PolymarketClobRewardConfig {
  condition_id?: string;
  rewards?: PolymarketClobRewardToken[];
  min_size?: number;
  max_spread?: number;
  event_start_date?: string;
  event_end_date?: string;
  [key: string]: unknown;
}

export interface PolymarketClobUserReward {
  condition_id?: string;
  asset_address?: string;
  amount?: number | string;
  maker_address?: string;
  [key: string]: unknown;
}

export interface PolymarketClobUserRewardTotal {
  amount?: number | string;
  maker_address?: string;
  [key: string]: unknown;
}

export type PolymarketClobRewardPercentagesResponse = Record<string, number>;

export interface PolymarketClobRewardsUserMarket {
  condition_id?: string;
  question?: string;
  market_slug?: string;
  rewards?: PolymarketClobRewardConfig[];
  [key: string]: unknown;
}

export interface PolymarketClobCurrentRewardsMarket {
  condition_id?: string;
  rewards?: PolymarketClobRewardConfig[];
  [key: string]: unknown;
}

export interface PolymarketClobMultiRewardsMarket {
  condition_id?: string;
  question?: string;
  rewards?: PolymarketClobRewardConfig[];
  [key: string]: unknown;
}

export type PolymarketClobRewardsUserResponse =
  PolymarketClobPaginatedResponse<PolymarketClobUserReward>;
export type PolymarketClobRewardsUserTotalResponse =
  PolymarketClobUserRewardTotal;
export type PolymarketClobRewardsUserMarketsResponse =
  PolymarketClobPaginatedResponse<PolymarketClobRewardsUserMarket>;
export type PolymarketClobRewardsCurrentResponse =
  PolymarketClobPaginatedResponse<PolymarketClobCurrentRewardsMarket>;
export type PolymarketClobRewardsMarketResponse =
  PolymarketClobPaginatedResponse<PolymarketClobRewardConfig>;
export type PolymarketClobRewardsMultiMarketsResponse =
  PolymarketClobPaginatedResponse<PolymarketClobMultiRewardsMarket>;

export interface PolymarketClobRebatedFee {
  condition_id?: string;
  asset_address?: string;
  amount?: number | string;
  maker_address?: string;
  [key: string]: unknown;
}

export type PolymarketClobRebatesCurrentResponse = PolymarketClobRebatedFee[];

export interface PolymarketClobBuilderTrade {
  id: string;
  market?: string;
  asset_id?: string;
  side?: PolymarketClobSide;
  size?: string;
  price?: string;
  builder_code?: string;
  [key: string]: unknown;
}

export interface PolymarketClobBuilderTradesResponse {
  limit: number;
  next_cursor: string;
  count: number;
  data: PolymarketClobBuilderTrade[];
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

export interface PolymarketClobBooksMethod {
  (
    params: PolymarketClobTokenIdsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBooksResponse>;
}

export interface PolymarketClobPricesMethod {
  (
    params: PolymarketClobPricesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobPricesResponse>;
}

export interface PolymarketClobMidpointsMethod {
  (
    params: PolymarketClobTokenIdsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobMidpointsResponse>;
}

export interface PolymarketClobLastTradesPricesMethod {
  (
    params: PolymarketClobTokenIdsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobLastTradesPricesResponse>;
}

// Polymarket exposes both /tick-size?token_id=X and /tick-size/{token_id} for
// the same operation. The path-var form stays on `tickSize`; the query form is
// available as `tickSizeByQuery` for parity with the current OpenAPI.
export interface PolymarketClobTickSizeMethod {
  (
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobTickSizeResponse>;
}

export interface PolymarketClobTickSizeQueryMethod {
  (
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobTickSizeResponse>;
}

export interface PolymarketClobFeeRateMethod {
  (
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobFeeRateResponse>;
}

export interface PolymarketClobFeeRateQueryMethod {
  (
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobFeeRateResponse>;
}

export interface PolymarketClobNegRiskMethod {
  (
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobNegRiskResponse>;
}

export interface PolymarketClobNegRiskQueryMethod {
  (
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobNegRiskResponse>;
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

export interface PolymarketClobMarketLiveActivityMethod {
  (
    conditionId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobLiveActivityResponse>;
}

export interface PolymarketClobRewardsGetNamespace {
  user(
    params: PolymarketClobRewardsUserQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsUserResponse>;
  userTotal(
    params: PolymarketClobRewardsUserTotalQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsUserTotalResponse>;
  userPercentages(
    params?: PolymarketClobRewardPercentagesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardPercentagesResponse>;
  userMarkets(
    params?: PolymarketClobRewardsUserMarketsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsUserMarketsResponse>;
  markets: {
    current(
      params?: PolymarketClobRewardsCurrentQuery,
      signal?: AbortSignal
    ): Promise<PolymarketClobRewardsCurrentResponse>;
    byCondition(
      conditionId: string,
      params?: PolymarketClobRewardsMarketQuery,
      signal?: AbortSignal
    ): Promise<PolymarketClobRewardsMarketResponse>;
    multi(
      params?: PolymarketClobRewardsMultiMarketsQuery,
      signal?: AbortSignal
    ): Promise<PolymarketClobRewardsMultiMarketsResponse>;
  };
}

export interface PolymarketClobRebatesGetNamespace {
  current(
    params: PolymarketClobRebatesCurrentQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRebatesCurrentResponse>;
}

export interface PolymarketClobBuilderTradesMethod {
  (
    params: PolymarketClobBuilderTradesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBuilderTradesResponse>;
}

// -- Namespace interfaces ---------------------------------------------------

export interface PolymarketClobGetNamespace {
  auth: PolymarketClobAuthGetNamespace;
  time: PolymarketClobTimeMethod;
  book: PolymarketClobBookMethod;
  price: PolymarketClobPriceMethod;
  midpoint: PolymarketClobMidpointMethod;
  spread: PolymarketClobSpreadMethod;
  lastTradePrice: PolymarketClobLastTradePriceMethod;
  books: PolymarketClobBooksMethod;
  prices: PolymarketClobPricesMethod;
  midpoints: PolymarketClobMidpointsMethod;
  lastTradesPrices: PolymarketClobLastTradesPricesMethod;
  tickSize: PolymarketClobTickSizeMethod;
  tickSizeByQuery: PolymarketClobTickSizeQueryMethod;
  feeRate: PolymarketClobFeeRateMethod;
  feeRateByQuery: PolymarketClobFeeRateQueryMethod;
  negRisk: PolymarketClobNegRiskMethod;
  negRiskByQuery: PolymarketClobNegRiskQueryMethod;
  pricesHistory: PolymarketClobPricesHistoryMethod;
  markets: PolymarketClobMarketsMethod;
  samplingMarkets: PolymarketClobSamplingMarketsMethod;
  simplifiedMarkets: PolymarketClobSimplifiedMarketsMethod;
  samplingSimplifiedMarkets: PolymarketClobSamplingSimplifiedMarketsMethod;
  marketsByToken: PolymarketClobMarketsByTokenMethod;
  clobMarkets: PolymarketClobMarketsCompactMethod;
  marketLiveActivity: PolymarketClobMarketLiveActivityMethod;
  rewards: PolymarketClobRewardsGetNamespace;
  rebates: PolymarketClobRebatesGetNamespace;
  builderTrades: PolymarketClobBuilderTradesMethod;
  data: PolymarketClobDataGetNamespace;
  balanceAllowance: PolymarketClobBalanceAllowanceMethod;
  notifications: PolymarketClobNotificationsMethod;
  orderScoring: PolymarketClobOrderScoringMethod;
  ordersScoring: PolymarketClobOrdersScoringMethod;
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

export interface PolymarketClobMarketsLiveActivityMethod {
  (
    req: PolymarketClobLiveActivityRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobLiveActivityResponse>;
  schema: z.ZodType<PolymarketClobLiveActivityRequest>;
}

export interface PolymarketClobL1AuthMethod<T> {
  (signal?: AbortSignal): Promise<T>;
  (headers: PolymarketClobL1Headers, signal?: AbortSignal): Promise<T>;
}

export interface PolymarketClobAuthGetNamespace {
  apiKeys: PolymarketClobL1AuthMethod<PolymarketClobApiKeysResponse>;
  deriveApiKey: PolymarketClobL1AuthMethod<PolymarketClobApiKeyResponse>;
  builderApiKey(
    signal?: AbortSignal
  ): Promise<PolymarketClobBuilderApiKeysResponse>;
  banStatus: {
    closedOnly(signal?: AbortSignal): Promise<PolymarketClobClosedOnlyResponse>;
  };
}

export interface PolymarketClobAuthPostNamespace {
  apiKey: PolymarketClobL1AuthMethod<PolymarketClobApiKeyResponse>;
  builderApiKey(
    signal?: AbortSignal
  ): Promise<PolymarketClobBuilderApiKeyResponse>;
}

export interface PolymarketClobAuthDeleteNamespace {
  apiKey(signal?: AbortSignal): Promise<string>;
  builderApiKey(signal?: AbortSignal): Promise<string>;
}

export interface PolymarketClobPostOrderMethod {
  (
    req: PolymarketClobPostOrderRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobPostOrderResponse>;
  schema: z.ZodType<PolymarketClobPostOrderRequest>;
}

// Sign-and-submit a limit order from plain price/size — the provider builds and
// EIP-712-signs the order locally using the configured wallet, then POSTs it.
export interface PolymarketClobPlaceOrderMethod {
  (
    req: PolymarketClobPlaceOrderRequest,
    signal?: AbortSignal
  ): Promise<unknown>;
  schema: z.ZodType<PolymarketClobPlaceOrderRequest>;
}

export interface PolymarketClobPostOrdersMethod {
  (
    req: PolymarketClobPostOrdersRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobPostOrdersResponse>;
  schema: z.ZodType<PolymarketClobPostOrdersRequest>;
}

export interface PolymarketClobCancelOrderMethod {
  (
    req: PolymarketClobCancelOrderRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobCancelOrdersResponse>;
  schema: z.ZodType<PolymarketClobCancelOrderRequest>;
}

export interface PolymarketClobCancelOrdersMethod {
  (
    req: PolymarketClobCancelOrdersRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobCancelOrdersResponse>;
  schema: z.ZodType<PolymarketClobCancelOrdersRequest>;
}

export interface PolymarketClobCancelAllMethod {
  (signal?: AbortSignal): Promise<PolymarketClobCancelOrdersResponse>;
}

export interface PolymarketClobCancelMarketOrdersMethod {
  (
    req: PolymarketClobCancelMarketOrdersRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobCancelOrdersResponse>;
  schema: z.ZodType<PolymarketClobCancelMarketOrdersRequest>;
}

export interface PolymarketClobDataOrdersMethod {
  (
    params?: PolymarketClobUserOrdersQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobOpenOrdersResponse>;
}

export interface PolymarketClobDataOrderMethod {
  (
    orderID: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobOpenOrderResponse>;
}

export interface PolymarketClobDataTradesMethod {
  (
    params?: PolymarketClobUserTradesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobTradesResponse>;
}

export interface PolymarketClobDataGetNamespace {
  orders: PolymarketClobDataOrdersMethod;
  order: PolymarketClobDataOrderMethod;
  trades: PolymarketClobDataTradesMethod;
}

export interface PolymarketClobBalanceAllowanceMethod {
  (
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBalanceAllowanceResponse>;
  update(
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBalanceAllowanceResponse>;
}

export interface PolymarketClobBalanceAllowancePutMethod {
  (
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}

export interface PolymarketClobNotificationsMethod {
  (
    params: PolymarketClobNotificationsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobNotificationsResponse>;
}

export interface PolymarketClobDropNotificationsMethod {
  (
    params: PolymarketClobDropNotificationsQuery,
    signal?: AbortSignal
  ): Promise<string>;
}

export interface PolymarketClobHeartbeatMethod {
  (signal?: AbortSignal): Promise<PolymarketClobHeartbeatResponse>;
}

export interface PolymarketClobHeartbeatV1Method {
  (
    req: PolymarketClobHeartbeatRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobHeartbeatV1Response>;
  schema: z.ZodType<PolymarketClobHeartbeatRequest>;
}

export interface PolymarketClobOrderScoringMethod {
  (
    params: PolymarketClobOrderScoringQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobOrderScoringResponse>;
}

export interface PolymarketClobOrdersScoringMethod {
  (
    params: PolymarketClobOrdersScoringQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobOrdersScoringResponse>;
}

export interface PolymarketClobOrdersScoringPostMethod {
  (
    req: PolymarketClobOrdersScoringRequest,
    signal?: AbortSignal
  ): Promise<PolymarketClobOrdersScoringResponse>;
  schema: z.ZodType<PolymarketClobOrdersScoringRequest>;
}

export interface PolymarketClobPostNamespace {
  auth: PolymarketClobAuthPostNamespace;
  order: PolymarketClobPostOrderMethod;
  placeOrder: PolymarketClobPlaceOrderMethod;
  orders: PolymarketClobPostOrdersMethod;
  books: PolymarketClobBooksBatchMethod;
  prices: PolymarketClobPricesBatchMethod;
  midpoints: PolymarketClobMidpointsBatchMethod;
  spreads: PolymarketClobSpreadsBatchMethod;
  lastTradesPrices: PolymarketClobLastTradesPricesBatchMethod;
  batchPricesHistory: PolymarketClobBatchPricesHistoryMethod;
  marketsLiveActivity: PolymarketClobMarketsLiveActivityMethod;
  heartbeats: PolymarketClobHeartbeatMethod;
  v1: {
    heartbeats: PolymarketClobHeartbeatV1Method;
  };
  ordersScoring: PolymarketClobOrdersScoringPostMethod;
}

export interface PolymarketPostNamespace {
  clob: PolymarketClobPostNamespace;
}

export interface PolymarketClobDeleteNamespace {
  auth: PolymarketClobAuthDeleteNamespace;
  order: PolymarketClobCancelOrderMethod;
  orders: PolymarketClobCancelOrdersMethod;
  cancelAll: PolymarketClobCancelAllMethod;
  cancelMarketOrders: PolymarketClobCancelMarketOrdersMethod;
  notifications: PolymarketClobDropNotificationsMethod;
}

export interface PolymarketDeleteNamespace {
  clob: PolymarketClobDeleteNamespace;
}

export interface PolymarketClobPutNamespace {
  balanceAllowance: PolymarketClobBalanceAllowancePutMethod;
}

export interface PolymarketPutNamespace {
  clob: PolymarketClobPutNamespace;
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

// Series wrap a recurring/related set of events (e.g. monthly economic data
// releases, weekly NFL games). Fields parallel Event but add seriesType +
// recurrence; markets/events lists are nested.
export interface PolymarketGammaSeries {
  id: string;
  ticker?: string;
  slug: string;
  title: string;
  seriesType?: string;
  recurrence?: string;
  description?: string;
  image?: string;
  icon?: string;
  layout?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  new?: boolean;
  featured?: boolean;
  restricted?: boolean;
  commentsEnabled?: boolean;
  publishedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  events?: PolymarketGammaEvent[];
  [key: string]: unknown;
}

// /tags/{id}/related-tags returns relationship rows, not full Tag objects —
// each row links a parent tag (tagID) to a related tag (relatedTagID) with
// a numeric `rank` for display ordering.
export interface PolymarketGammaRelatedTag {
  id: string;
  tagID: number;
  relatedTagID: number;
  rank: number;
}

export interface PolymarketGammaRelatedTagsQuery {
  omit_empty?: boolean;
  status?: "active" | "closed" | "all";
}

// Comments anchor to either an Event or a Market via parentEntityType +
// parentEntityID. The wire format is verbose (nested profile, reactions,
// replies, attachments); we type the load-bearing fields and let callers
// drop into [k]: unknown for the rest.
export interface PolymarketGammaCommentProfile {
  name?: string;
  pseudonym?: string;
  displayUsernamePublic?: boolean;
  bio?: string;
  proxyWallet?: string;
  baseAddress?: string;
  profileImage?: string;
  [key: string]: unknown;
}

export interface PolymarketGammaComment {
  id: string;
  body: string;
  parentEntityType: "Event" | "Market" | string;
  parentEntityID: number;
  userAddress: string;
  createdAt: string;
  updatedAt?: string;
  profile?: PolymarketGammaCommentProfile;
  [key: string]: unknown;
}

export interface PolymarketGammaCommentListQuery {
  parent_entity_type: "Event" | "Series" | "Market" | "market";
  parent_entity_id: number | string;
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  get_positions?: boolean;
  holders_only?: boolean;
}

export interface PolymarketGammaCommentByUserQuery {
  limit?: number;
  offset?: number;
}

// /public-search returns events plus a pagination envelope. Narrow text
// queries may omit markets and profiles entirely. Note that the protected
// /search endpoint returns a richer shape but requires session cookies — we
// surface the public variant only.
export interface PolymarketGammaSearchProfile {
  proxyWallet?: string;
  name?: string;
  pseudonym?: string;
  bio?: string;
  profileImage?: string;
  baseAddress?: string;
  [key: string]: unknown;
}

export interface PolymarketGammaSearchPagination {
  hasMore: boolean;
  totalResults: number;
  [key: string]: unknown;
}

export interface PolymarketGammaSearchResponse {
  events: PolymarketGammaEvent[];
  markets?: PolymarketGammaMarket[];
  profiles?: PolymarketGammaSearchProfile[];
  pagination: PolymarketGammaSearchPagination;
}

export interface PolymarketGammaSearchQuery {
  q: string;
  limit_per_type?: number;
  events_status?: string;
}

// /sports returns a flat list of supported sports; the schema is light
// (id, sport name, image, resolution URL, ordering hint, tag IDs as a
// comma-separated string).
export interface PolymarketGammaSport {
  id: number;
  sport: string;
  image?: string;
  resolution?: string;
  ordering?: string;
  tags?: string;
  [key: string]: unknown;
}

// /sports/market-types returns just the catalog of supported market-type
// identifiers — these are stable string constants used elsewhere in
// sports-market metadata.
export interface PolymarketGammaSportsMarketTypesResponse {
  marketTypes: string[];
}

export type PolymarketGammaStatusResponse = string;

export interface PolymarketGammaTeam {
  id: number;
  name?: string | null;
  league?: string | null;
  record?: string | null;
  logo?: string | null;
  abbreviation?: string | null;
  alias?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface PolymarketGammaTeamsQuery {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  league?: string | string[];
  name?: string | string[];
  abbreviation?: string | string[];
}

export interface PolymarketGammaPublicProfileUser {
  id: string;
  creator?: boolean;
  mod?: boolean;
  [key: string]: unknown;
}

export interface PolymarketGammaPublicProfileResponse {
  createdAt?: string | null;
  proxyWallet?: string | null;
  profileImage?: string | null;
  displayUsernamePublic?: boolean | null;
  bio?: string | null;
  pseudonym?: string | null;
  name?: string | null;
  users?: PolymarketGammaPublicProfileUser[] | null;
  xUsername?: string | null;
  verifiedBadge?: boolean | null;
  [key: string]: unknown;
}

export interface PolymarketGammaPublicProfileQuery {
  address: string;
}

// /events returns a bare JSON array (no envelope) for compatibility. Upstream
// marks the list form deprecated and recommends /events/keyset for pagination.
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
  exclude_tag_id?: number | number[];
  archived?: boolean;
  active?: boolean;
  closed?: boolean;
  live?: boolean;
  liquidity_min?: number;
  liquidity_max?: number;
  volume_min?: number;
  volume_max?: number;
  start_date_min?: string;
  start_date_max?: string;
  end_date_min?: string;
  end_date_max?: string;
  start_time_min?: string;
  start_time_max?: string;
  tag?: string;
  tag_id?: number | number[];
  related_tags?: boolean;
  tag_match?: string;
  tag_slug?: string;
  featured?: boolean;
  title_search?: string;
  restricted?: boolean;
  cyom?: boolean;
  series_id?: number | number[];
  game_id?: number | number[] | string;
  event_date?: string;
  event_week?: number;
  featured_order?: boolean;
  recurrence?: string;
  created_by?: string | string[];
  parent_event_id?: number;
  include_children?: boolean;
  partner_slug?: string;
  include_chat?: boolean;
  include_template?: boolean;
  include_best_lines?: boolean;
  locale?: string;
}

// Cursor pagination responses expose `next_cursor`; current requests pass that
// value back as `after_cursor`. The deprecated `next_cursor` request alias is
// kept for old callers and serialized as after_cursor.
export interface PolymarketGammaKeysetQuery extends PolymarketGammaEventListQuery {
  after_cursor?: string;
  /** @deprecated Use after_cursor for requests; responses still use next_cursor. */
  next_cursor?: string;
}

// /markets uses the same query DSL as /events with a market-specific filter
// added (clob_token_ids for direct token lookup).
export interface PolymarketGammaMarketListQuery extends PolymarketGammaEventListQuery {
  clob_token_ids?: string | string[];
  condition_ids?: string | string[];
  market_maker_address?: string | string[];
  liquidity_num_min?: number;
  liquidity_num_max?: number;
  volume_num_min?: number;
  volume_num_max?: number;
  uma_resolution_status?: string;
  sports_market_types?: string | string[];
  rewards_min_size?: number;
  question_ids?: string | string[];
  include_tag?: boolean;
  decimalized?: boolean;
  rfq_enabled?: boolean;
}

export interface PolymarketGammaMarketKeysetQuery extends PolymarketGammaMarketListQuery {
  after_cursor?: string;
  /** @deprecated Use after_cursor for requests; responses still use next_cursor. */
  next_cursor?: string;
}

export type PolymarketGammaMarketListResponse = PolymarketGammaMarket[];

export interface PolymarketGammaMarketKeysetResponse {
  markets: PolymarketGammaMarket[];
  next_cursor: string;
}

// -- Gamma method interfaces ------------------------------------------------

export interface PolymarketGammaEventsMethod {
  /**
   * @deprecated Upstream marked the list form of GET /events deprecated and
   * recommends /events/keyset. Use events.keyset() for new paginated event
   * list callers.
   */
  (signal?: AbortSignal): Promise<PolymarketGammaEventListResponse>;
  /**
   * @deprecated Upstream marked the list form of GET /events deprecated and
   * recommends /events/keyset. Use events.keyset() for new paginated event
   * list callers.
   */
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

export interface PolymarketGammaMarketsMethod {
  (signal?: AbortSignal): Promise<PolymarketGammaMarketListResponse>;
  (
    params: PolymarketGammaMarketListQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaMarketListResponse>;
  (id: string, signal?: AbortSignal): Promise<PolymarketGammaMarket>;
  keyset(
    params?: PolymarketGammaMarketKeysetQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaMarketKeysetResponse>;
  slug(slug: string, signal?: AbortSignal): Promise<PolymarketGammaMarket>;
  tags(id: string, signal?: AbortSignal): Promise<PolymarketGammaTag[]>;
}

export interface PolymarketGammaSeriesMethod {
  (signal?: AbortSignal): Promise<PolymarketGammaSeries[]>;
  (
    params: PolymarketGammaEventListQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaSeries[]>;
  (id: string, signal?: AbortSignal): Promise<PolymarketGammaSeries>;
}

export interface PolymarketGammaTagsMethod {
  (signal?: AbortSignal): Promise<PolymarketGammaTag[]>;
  (
    params: PolymarketGammaEventListQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag[]>;
  (id: string, signal?: AbortSignal): Promise<PolymarketGammaTag>;
  slug(slug: string, signal?: AbortSignal): Promise<PolymarketGammaTag>;
  relatedTags: PolymarketGammaTagsRelatedMethod;
}

export interface PolymarketGammaTagsRelatedMethod {
  (id: string, signal?: AbortSignal): Promise<PolymarketGammaRelatedTag[]>;
  (
    id: string,
    params: PolymarketGammaRelatedTagsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaRelatedTag[]>;
  slug(
    slug: string,
    signal?: AbortSignal
  ): Promise<PolymarketGammaRelatedTag[]>;
  slug(
    slug: string,
    params: PolymarketGammaRelatedTagsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaRelatedTag[]>;
  tags: PolymarketGammaTagsRelatedTagsMethod;
}

export interface PolymarketGammaTagsRelatedTagsMethod {
  (id: string, signal?: AbortSignal): Promise<PolymarketGammaTag[]>;
  (
    id: string,
    params: PolymarketGammaRelatedTagsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag[]>;
  slug(slug: string, signal?: AbortSignal): Promise<PolymarketGammaTag[]>;
  slug(
    slug: string,
    params: PolymarketGammaRelatedTagsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag[]>;
}

export interface PolymarketGammaCommentsByUserMethod {
  (
    address: string,
    params?: PolymarketGammaCommentByUserQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaComment[]>;
}

export interface PolymarketGammaCommentsMethod {
  (
    params: PolymarketGammaCommentListQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaComment[]>;
  (id: string, signal?: AbortSignal): Promise<PolymarketGammaComment[]>;
  byUser: PolymarketGammaCommentsByUserMethod;
}

export interface PolymarketGammaSearchMethod {
  (
    params: PolymarketGammaSearchQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaSearchResponse>;
}

export interface PolymarketGammaSportsMarketTypesMethod {
  (signal?: AbortSignal): Promise<PolymarketGammaSportsMarketTypesResponse>;
}

export interface PolymarketGammaSportsMethod {
  (signal?: AbortSignal): Promise<PolymarketGammaSport[]>;
  marketTypes: PolymarketGammaSportsMarketTypesMethod;
}

export interface PolymarketGammaStatusMethod {
  (signal?: AbortSignal): Promise<PolymarketGammaStatusResponse>;
}

export interface PolymarketGammaTeamsMethod {
  (signal?: AbortSignal): Promise<PolymarketGammaTeam[]>;
  (
    params: PolymarketGammaTeamsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTeam[]>;
}

export interface PolymarketGammaPublicProfileMethod {
  (
    params: PolymarketGammaPublicProfileQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaPublicProfileResponse>;
}

export interface PolymarketGammaGetNamespace {
  status: PolymarketGammaStatusMethod;
  events: PolymarketGammaEventsMethod;
  markets: PolymarketGammaMarketsMethod;
  series: PolymarketGammaSeriesMethod;
  tags: PolymarketGammaTagsMethod;
  comments: PolymarketGammaCommentsMethod;
  search: PolymarketGammaSearchMethod;
  sports: PolymarketGammaSportsMethod;
  teams: PolymarketGammaTeamsMethod;
  publicProfile: PolymarketGammaPublicProfileMethod;
}

// -- Top-level provider shape (multi-host) ----------------------------------

// ===========================================================================
// Data API (https://data-api.polymarket.com) — public positions/value/...
// ===========================================================================

// Position rows are wallet+asset-keyed snapshots: a user's holding in a
// specific outcome token, plus the derived PnL / size fields the dashboards
// surface. Fully-typed for the load-bearing fields, [k]: unknown for the
// rest (the wire format adds product-specific extras like `eventCategory`,
// `negativeRiskMarketId`, etc.).
export interface PolymarketDataPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable?: boolean;
  title?: string;
  slug?: string;
  icon?: string;
  eventId?: string;
  eventSlug?: string;
  outcome?: string;
  outcomeIndex?: number;
  endDate?: string;
  [key: string]: unknown;
}

export interface PolymarketDataPositionsQuery {
  user: string;
  market?: string | string[];
  eventId?: string;
  sizeThreshold?: number;
  redeemable?: boolean;
  mergeable?: boolean;
  title?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

// /value returns one row per user (or the user's wallet sums collapsed) with
// just `{ user, value }` — net portfolio value as a Number.
export interface PolymarketDataValueEntry {
  user: string;
  value: number;
}

export type PolymarketDataValueResponse = PolymarketDataValueEntry[];

export interface PolymarketDataValueQuery {
  user: string;
}

// -- Data method interfaces -------------------------------------------------

export interface PolymarketDataPositionsMethod {
  (
    params: PolymarketDataPositionsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataPosition[]>;
}

export interface PolymarketDataValueMethod {
  (
    params: PolymarketDataValueQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataValueResponse>;
}

// /holders is keyed by token (not condition), returning per-token leaderboard
// rows. The wire shape groups holders into a wrapping `{ token, holders }`
// object — when a query includes multiple tokens, you get multiple groups.
export interface PolymarketDataHolderEntry {
  proxyWallet: string;
  asset: string;
  amount: number;
  outcomeIndex?: number;
  bio?: string;
  pseudonym?: string;
  name?: string;
  displayUsernamePublic?: boolean;
  profileImage?: string;
  profileImageOptimized?: string;
  verified?: boolean;
  [key: string]: unknown;
}

export interface PolymarketDataHoldersGroup {
  token: string;
  holders: PolymarketDataHolderEntry[];
}

export interface PolymarketDataHoldersQuery {
  market: string | string[];
  limit?: number;
}

// /activity returns the user's recent on-chain actions (trades, redemptions,
// merges, splits). `type` discriminates the action kind; the rest of the
// fields apply contextually.
export type PolymarketDataActivityType =
  | "TRADE"
  | "REDEEM"
  | "MERGE"
  | "SPLIT"
  | "REWARD"
  | string;

export interface PolymarketDataActivityEntry {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: PolymarketDataActivityType;
  size: number;
  usdcSize?: number;
  transactionHash: string;
  asset?: string;
  price?: number;
  side?: "BUY" | "SELL";
  outcomeIndex?: number;
  title?: string;
  slug?: string;
  [key: string]: unknown;
}

export interface PolymarketDataActivityQuery {
  user: string;
  limit?: number;
  offset?: number;
  market?: string | string[];
  type?: PolymarketDataActivityType | PolymarketDataActivityType[];
  start?: number;
  end?: number;
  side?: "BUY" | "SELL";
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface PolymarketDataTradeEntry {
  proxyWallet: string;
  side: "BUY" | "SELL";
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title?: string;
  slug?: string;
  icon?: string;
  eventSlug?: string;
  [key: string]: unknown;
}

export interface PolymarketDataTradesQuery {
  user?: string;
  market?: string | string[];
  limit?: number;
  offset?: number;
  takerOnly?: boolean;
  filterType?: string;
}

// /oi returns a flat list of open-interest entries; default response is a
// single-row "GLOBAL" aggregate, but per-market filtering is possible.
export interface PolymarketDataOpenInterestEntry {
  market: string;
  value: number;
}

export type PolymarketDataOpenInterestResponse =
  PolymarketDataOpenInterestEntry[];

export interface PolymarketDataOpenInterestQuery {
  market?: string | string[];
}

// /live-volume returns a per-event volume rollup; markets[] enumerates
// per-market contribution to the total.
export interface PolymarketDataLiveVolumeMarket {
  market: string;
  value: number;
}

export interface PolymarketDataLiveVolumeEntry {
  total: number;
  markets: PolymarketDataLiveVolumeMarket[];
}

export type PolymarketDataLiveVolumeResponse = PolymarketDataLiveVolumeEntry[];

export interface PolymarketDataLiveVolumeQuery {
  id: string | number;
}

export interface PolymarketDataHoldersMethod {
  (
    params: PolymarketDataHoldersQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataHoldersGroup[]>;
}

export interface PolymarketDataActivityMethod {
  (
    params: PolymarketDataActivityQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataActivityEntry[]>;
}

export interface PolymarketDataTradesMethod {
  (
    params: PolymarketDataTradesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataTradeEntry[]>;
}

export interface PolymarketDataOpenInterestMethod {
  (
    params?: PolymarketDataOpenInterestQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataOpenInterestResponse>;
}

export interface PolymarketDataLiveVolumeMethod {
  (
    params: PolymarketDataLiveVolumeQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataLiveVolumeResponse>;
}

export interface PolymarketDataGetNamespace {
  positions: PolymarketDataPositionsMethod;
  value: PolymarketDataValueMethod;
  holders: PolymarketDataHoldersMethod;
  activity: PolymarketDataActivityMethod;
  trades: PolymarketDataTradesMethod;
  oi: PolymarketDataOpenInterestMethod;
  liveVolume: PolymarketDataLiveVolumeMethod;
}

// -- Top-level provider shape (multi-host) ----------------------------------

export interface PolymarketGetNamespace {
  clob: PolymarketClobGetNamespace;
  gamma: PolymarketGammaGetNamespace;
  data: PolymarketDataGetNamespace;
}

export interface PolymarketProvider {
  get: PolymarketGetNamespace;
  post: PolymarketPostNamespace;
  put: PolymarketPutNamespace;
  delete: PolymarketDeleteNamespace;
}
