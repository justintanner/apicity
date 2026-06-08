export type { BinanceOptions } from "./zod";

export class BinanceError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "BinanceError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

export type BinancePingResponse = Record<string, never>;

export interface BinanceTimeResponse {
  serverTime: number;
}

export interface BinanceExchangeInfoRequest {
  symbol?: string;
  symbols?: string[];
  permissions?: string | string[];
  showPermissionSets?: boolean;
  symbolStatus?: "TRADING" | "HALT" | "BREAK";
}

export interface BinanceRateLimit {
  rateLimitType?: string;
  interval?: string;
  intervalNum?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface BinanceExchangeFilter {
  filterType?: string;
  [key: string]: unknown;
}

export interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision?: number;
  quoteAssetPrecision: number;
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed?: boolean;
  otoAllowed?: boolean;
  opoAllowed?: boolean;
  quoteOrderQtyMarketAllowed?: boolean;
  allowTrailingStop?: boolean;
  cancelReplaceAllowed?: boolean;
  amendAllowed?: boolean;
  pegInstructionsAllowed?: boolean;
  isSpotTradingAllowed?: boolean;
  isMarginTradingAllowed?: boolean;
  filters: BinanceExchangeFilter[];
  permissions?: string[];
  permissionSets?: string[][];
  defaultSelfTradePreventionMode?: string;
  allowedSelfTradePreventionModes?: string[];
  [key: string]: unknown;
}

export interface BinanceSorInfo {
  baseAsset: string;
  symbols: string[];
  [key: string]: unknown;
}

export interface BinanceExchangeInfoResponse {
  timezone: string;
  serverTime: number;
  rateLimits: BinanceRateLimit[];
  exchangeFilters: BinanceExchangeFilter[];
  symbols: BinanceSymbolInfo[];
  sors?: BinanceSorInfo[];
  [key: string]: unknown;
}

export interface BinanceDepthRequest {
  symbol: string;
  limit?: number;
  symbolStatus?: "TRADING" | "HALT" | "BREAK";
}

export type BinanceOrderBookLevel = [price: string, quantity: string];

export interface BinanceDepthResponse {
  lastUpdateId: number;
  bids: BinanceOrderBookLevel[];
  asks: BinanceOrderBookLevel[];
}

export interface BinanceAvgPriceRequest {
  symbol: string;
}

export interface BinanceAvgPriceResponse {
  mins: number;
  price: string;
  closeTime: number;
}

export interface BinanceAggTradesRequest {
  symbol: string;
  fromId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface BinanceAggregateTrade {
  a: number;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
  M: boolean;
}

export type BinanceAggTradesResponse = BinanceAggregateTrade[];

export type BinanceKlineInterval =
  | "1s"
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

export interface BinanceKlinesRequest {
  symbol: string;
  interval: BinanceKlineInterval;
  startTime?: number;
  endTime?: number;
  timeZone?: string;
  limit?: number;
}

export type BinanceKline = [
  openTime: number,
  open: string,
  high: string,
  low: string,
  close: string,
  volume: string,
  closeTime: number,
  quoteAssetVolume: string,
  numberOfTrades: number,
  takerBuyBaseAssetVolume: string,
  takerBuyQuoteAssetVolume: string,
  unused: string,
];

export type BinanceKlinesResponse = BinanceKline[];

export type BinanceUiKlinesRequest = BinanceKlinesRequest;
export type BinanceUiKlinesResponse = BinanceKlinesResponse;

export interface BinanceTicker24hrRequest {
  symbol?: string;
  symbols?: string[];
  type?: "FULL" | "MINI";
}

export interface BinanceTicker24hr {
  symbol: string;
  priceChange?: string;
  priceChangePercent?: string;
  weightedAvgPrice?: string;
  prevClosePrice?: string;
  lastPrice?: string;
  lastQty?: string;
  bidPrice?: string;
  bidQty?: string;
  askPrice?: string;
  askQty?: string;
  openPrice?: string;
  highPrice?: string;
  lowPrice?: string;
  volume?: string;
  quoteVolume?: string;
  openTime?: number;
  closeTime?: number;
  firstId?: number;
  lastId?: number;
  count?: number;
  [key: string]: unknown;
}

export type BinanceTicker24hrResponse = BinanceTicker24hr | BinanceTicker24hr[];

export interface BinanceTradesRequest {
  symbol: string;
  limit?: number;
}

export interface BinanceHistoricalTradesRequest {
  symbol: string;
  limit?: number;
  fromId?: number;
}

export interface BinanceHistoricalBlockTradesRequest {
  symbol: string;
  fromId: number;
  limit?: number;
}

export interface BinanceTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export type BinanceTradesResponse = BinanceTrade[];
export type BinanceHistoricalTradesResponse = BinanceTrade[];

export interface BinanceBlockTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
}

export type BinanceHistoricalBlockTradesResponse = BinanceBlockTrade[];

export interface BinancePingMethod {
  (signal?: AbortSignal): Promise<BinancePingResponse>;
  schema: undefined;
}

export interface BinanceTimeMethod {
  (signal?: AbortSignal): Promise<BinanceTimeResponse>;
  schema: undefined;
}

export interface BinanceExchangeInfoMethod {
  (
    req?: BinanceExchangeInfoRequest,
    signal?: AbortSignal
  ): Promise<BinanceExchangeInfoResponse>;
  schema: typeof import("./zod").BinanceExchangeInfoRequestSchema;
}

export interface BinanceDepthMethod {
  (
    req: BinanceDepthRequest,
    signal?: AbortSignal
  ): Promise<BinanceDepthResponse>;
  schema: typeof import("./zod").BinanceDepthRequestSchema;
}

export interface BinanceAvgPriceMethod {
  (
    req: BinanceAvgPriceRequest,
    signal?: AbortSignal
  ): Promise<BinanceAvgPriceResponse>;
  schema: typeof import("./zod").BinanceAvgPriceRequestSchema;
}

export interface BinanceAggTradesMethod {
  (
    req: BinanceAggTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceAggTradesResponse>;
  schema: typeof import("./zod").BinanceAggTradesRequestSchema;
}

export interface BinanceKlinesMethod {
  (
    req: BinanceKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceKlinesResponse>;
  schema: typeof import("./zod").BinanceKlinesRequestSchema;
}

export interface BinanceUiKlinesMethod {
  (
    req: BinanceUiKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceUiKlinesResponse>;
  schema: typeof import("./zod").BinanceUiKlinesRequestSchema;
}

export interface BinanceTicker24hrMethod {
  (
    req?: BinanceTicker24hrRequest,
    signal?: AbortSignal
  ): Promise<BinanceTicker24hrResponse>;
  schema: typeof import("./zod").BinanceTicker24hrRequestSchema;
}

export interface BinanceTradesMethod {
  (
    req: BinanceTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceTradesResponse>;
  schema: typeof import("./zod").BinanceTradesRequestSchema;
}

export interface BinanceHistoricalTradesMethod {
  (
    req: BinanceHistoricalTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceHistoricalTradesResponse>;
  schema: typeof import("./zod").BinanceHistoricalTradesRequestSchema;
}

export interface BinanceHistoricalBlockTradesMethod {
  (
    req: BinanceHistoricalBlockTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceHistoricalBlockTradesResponse>;
  schema: typeof import("./zod").BinanceHistoricalBlockTradesRequestSchema;
}

export interface BinanceApiV3Namespace {
  aggTrades: BinanceAggTradesMethod;
  avgPrice: BinanceAvgPriceMethod;
  depth: BinanceDepthMethod;
  exchangeInfo: BinanceExchangeInfoMethod;
  historicalBlockTrades: BinanceHistoricalBlockTradesMethod;
  historicalTrades: BinanceHistoricalTradesMethod;
  klines: BinanceKlinesMethod;
  ping: BinancePingMethod;
  time: BinanceTimeMethod;
  ticker: BinanceTickerNamespace;
  trades: BinanceTradesMethod;
  uiKlines: BinanceUiKlinesMethod;
}

export interface BinanceTickerNamespace {
  twentyFourHr: BinanceTicker24hrMethod;
}

export interface BinanceApiNamespace {
  v3: BinanceApiV3Namespace;
}

export interface BinanceGetNamespace {
  api: BinanceApiNamespace;
}

export interface BinanceProvider {
  api: BinanceApiNamespace;
  get: BinanceGetNamespace;
}
