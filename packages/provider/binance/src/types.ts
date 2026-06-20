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

export interface BinanceReferencePriceRequest {
  symbol: string;
}

export interface BinanceReferencePriceResponse {
  symbol: string;
  referencePrice: string | null;
  timestamp: number;
  [key: string]: unknown;
}

export interface BinanceReferencePriceCalculationRequest {
  symbol: string;
  symbolStatus?: "TRADING" | "HALT" | "BREAK";
}

export interface BinanceReferencePriceCalculationResponse {
  symbol: string;
  calculationType: string;
  bucketCount?: number;
  bucketWidthMs?: number;
  externalCalculationId?: number;
  [key: string]: unknown;
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

export interface BinanceTickerTradingDayRequest {
  symbol?: string;
  symbols?: string[];
  timeZone?: string;
  type?: "FULL" | "MINI";
  symbolStatus?: "TRADING" | "HALT" | "BREAK";
}

export interface BinanceTickerTradingDay {
  symbol: string;
  priceChange?: string;
  priceChangePercent?: string;
  weightedAvgPrice?: string;
  openPrice?: string;
  highPrice?: string;
  lowPrice?: string;
  lastPrice?: string;
  volume?: string;
  quoteVolume?: string;
  openTime?: number;
  closeTime?: number;
  firstId?: number;
  lastId?: number;
  count?: number;
  [key: string]: unknown;
}

export type BinanceTickerTradingDayResponse =
  | BinanceTickerTradingDay
  | BinanceTickerTradingDay[];

export interface BinanceTickerPriceRequest {
  symbol?: string;
  symbols?: string[];
  symbolStatus?: "TRADING" | "HALT" | "BREAK";
}

export interface BinanceTickerPrice {
  symbol: string;
  price: string;
  [key: string]: unknown;
}

export type BinanceTickerPriceResponse =
  | BinanceTickerPrice
  | BinanceTickerPrice[];

export interface BinanceTickerBookTickerRequest {
  symbol?: string;
  symbols?: string[];
  symbolStatus?: "TRADING" | "HALT" | "BREAK";
}

export interface BinanceTickerBookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  [key: string]: unknown;
}

export type BinanceTickerBookTickerResponse =
  | BinanceTickerBookTicker
  | BinanceTickerBookTicker[];

export interface BinanceTickerRequest {
  symbol?: string;
  symbols?: string[];
  windowSize?: string;
  type?: "FULL" | "MINI";
  symbolStatus?: "TRADING" | "HALT" | "BREAK";
}

export interface BinanceTicker {
  symbol: string;
  priceChange?: string;
  priceChangePercent?: string;
  weightedAvgPrice?: string;
  openPrice?: string;
  highPrice?: string;
  lowPrice?: string;
  lastPrice?: string;
  volume?: string;
  quoteVolume?: string;
  openTime?: number;
  closeTime?: number;
  firstId?: number;
  lastId?: number;
  count?: number;
  [key: string]: unknown;
}

export type BinanceTickerResponse = BinanceTicker | BinanceTicker[];

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

export type BinanceOptionPingResponse = BinancePingResponse;
export type BinanceOptionTimeResponse = BinanceTimeResponse;

export interface BinanceOptionContract {
  baseAsset: string;
  quoteAsset: string;
  underlying: string;
  settleAsset: string;
  [key: string]: unknown;
}

export interface BinanceOptionAsset {
  name: string;
  [key: string]: unknown;
}

export interface BinanceOptionSymbolInfo {
  symbol: string;
  expiryDate: number;
  filters: BinanceExchangeFilter[];
  side: string;
  strikePrice: string;
  underlying: string;
  unit: number;
  liquidationFeeRate?: string;
  minQty?: string;
  maxQty?: string;
  initialMargin?: string;
  maintenanceMargin?: string;
  minInitialMargin?: string;
  minMaintenanceMargin?: string;
  priceScale?: number;
  quantityScale?: number;
  quoteAsset?: string;
  nakedSell?: boolean;
  status?: string;
  [key: string]: unknown;
}

export interface BinanceOptionExchangeInfoResponse {
  timezone: string;
  serverTime: number;
  optionContracts: BinanceOptionContract[];
  optionAssets: BinanceOptionAsset[];
  optionSymbols: BinanceOptionSymbolInfo[];
  rateLimits: BinanceRateLimit[];
  [key: string]: unknown;
}

export interface BinanceOptionTickerRequest {
  symbol?: string;
}

export interface BinanceOptionTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  lastQty: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  amount: string;
  bidPrice: string;
  askPrice: string;
  openTime: number;
  closeTime: number;
  firstTradeId: number;
  tradeCount: number;
  strikePrice: string;
  exercisePrice: string;
  [key: string]: unknown;
}

export type BinanceOptionTickerResponse = BinanceOptionTicker[];

export interface BinanceOptionExerciseHistoryRequest {
  underlying?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface BinanceOptionExerciseRecord {
  symbol: string;
  strikePrice: string;
  realStrikePrice: string;
  expiryDate: number;
  strikeResult: string;
  [key: string]: unknown;
}

export type BinanceOptionExerciseHistoryResponse =
  BinanceOptionExerciseRecord[];

export interface BinanceOptionOpenInterestRequest {
  underlyingAsset: string;
  expiration: string;
}

export interface BinanceOptionOpenInterest {
  symbol: string;
  sumOpenInterest: string;
  sumOpenInterestUsd: string;
  timestamp: string | number;
  [key: string]: unknown;
}

export type BinanceOptionOpenInterestResponse = BinanceOptionOpenInterest[];

export interface BinanceOptionDepthRequest {
  symbol: string;
  limit?: 10 | 20 | 50 | 100 | 500 | 1000;
}

export interface BinanceOptionDepthResponse {
  lastUpdateId: number;
  T?: number;
  bids: BinanceOrderBookLevel[];
  asks: BinanceOrderBookLevel[];
  [key: string]: unknown;
}

export interface BinanceOptionTradesRequest {
  symbol: string;
  limit?: number;
}

export interface BinanceOptionBlockTradesRequest {
  symbol?: string;
  limit?: number;
}

export interface BinanceOptionTrade {
  id: number;
  tradeId: number;
  symbol: string;
  price: string;
  qty: string;
  quoteQty: string;
  side: number;
  time: number;
  [key: string]: unknown;
}

export type BinanceOptionTradesResponse = BinanceOptionTrade[];
export type BinanceOptionBlockTradesResponse = BinanceOptionTrade[];

export interface BinanceOptionIndexRequest {
  underlying: string;
}

export interface BinanceOptionIndexResponse {
  time: number;
  indexPrice: string;
  [key: string]: unknown;
}

export type BinanceOptionKlineInterval =
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

export interface BinanceOptionKlinesRequest {
  symbol: string;
  interval: BinanceOptionKlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export type BinanceOptionKline = BinanceKline;
export type BinanceOptionKlinesResponse = BinanceOptionKline[];

export interface BinanceOptionMarkPriceRequest {
  symbol?: string;
}

export interface BinanceOptionMarkPrice {
  symbol: string;
  markPrice: string;
  bidIV: string;
  askIV: string;
  markIV: string;
  delta: string;
  theta: string;
  gamma: string;
  vega: string;
  highPriceLimit: string;
  lowPriceLimit: string;
  riskFreeInterest: string;
  [key: string]: unknown;
}

export type BinanceOptionMarkPriceResponse = BinanceOptionMarkPrice[];

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

export interface BinanceReferencePriceMethod {
  (
    req: BinanceReferencePriceRequest,
    signal?: AbortSignal
  ): Promise<BinanceReferencePriceResponse>;
  schema: typeof import("./zod").BinanceReferencePriceRequestSchema;
}

export interface BinanceReferencePriceCalculationMethod {
  (
    req: BinanceReferencePriceCalculationRequest,
    signal?: AbortSignal
  ): Promise<BinanceReferencePriceCalculationResponse>;
  schema: typeof import("./zod").BinanceReferencePriceCalculationRequestSchema;
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

export interface BinanceTickerTradingDayMethod {
  (
    req: BinanceTickerTradingDayRequest,
    signal?: AbortSignal
  ): Promise<BinanceTickerTradingDayResponse>;
  schema: typeof import("./zod").BinanceTickerTradingDayRequestSchema;
}

export interface BinanceTickerPriceMethod {
  (
    req?: BinanceTickerPriceRequest,
    signal?: AbortSignal
  ): Promise<BinanceTickerPriceResponse>;
  schema: typeof import("./zod").BinanceTickerPriceRequestSchema;
}

export interface BinanceTickerBookTickerMethod {
  (
    req?: BinanceTickerBookTickerRequest,
    signal?: AbortSignal
  ): Promise<BinanceTickerBookTickerResponse>;
  schema: typeof import("./zod").BinanceTickerBookTickerRequestSchema;
}

export interface BinanceTickerMethod {
  (
    req: BinanceTickerRequest,
    signal?: AbortSignal
  ): Promise<BinanceTickerResponse>;
  schema: typeof import("./zod").BinanceTickerRequestSchema;
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

export interface BinanceOptionPingMethod {
  (signal?: AbortSignal): Promise<BinanceOptionPingResponse>;
  schema: undefined;
}

export interface BinanceOptionTimeMethod {
  (signal?: AbortSignal): Promise<BinanceOptionTimeResponse>;
  schema: undefined;
}

export interface BinanceOptionExchangeInfoMethod {
  (signal?: AbortSignal): Promise<BinanceOptionExchangeInfoResponse>;
  schema: undefined;
}

export interface BinanceOptionTickerMethod {
  (
    req?: BinanceOptionTickerRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionTickerResponse>;
  schema: typeof import("./zod").BinanceOptionTickerRequestSchema;
}

export interface BinanceOptionExerciseHistoryMethod {
  (
    req?: BinanceOptionExerciseHistoryRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionExerciseHistoryResponse>;
  schema: typeof import("./zod").BinanceOptionExerciseHistoryRequestSchema;
}

export interface BinanceOptionOpenInterestMethod {
  (
    req: BinanceOptionOpenInterestRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionOpenInterestResponse>;
  schema: typeof import("./zod").BinanceOptionOpenInterestRequestSchema;
}

export interface BinanceOptionDepthMethod {
  (
    req: BinanceOptionDepthRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionDepthResponse>;
  schema: typeof import("./zod").BinanceOptionDepthRequestSchema;
}

export interface BinanceOptionTradesMethod {
  (
    req: BinanceOptionTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionTradesResponse>;
  schema: typeof import("./zod").BinanceOptionTradesRequestSchema;
}

export interface BinanceOptionBlockTradesMethod {
  (
    req?: BinanceOptionBlockTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionBlockTradesResponse>;
  schema: typeof import("./zod").BinanceOptionBlockTradesRequestSchema;
}

export interface BinanceOptionIndexMethod {
  (
    req: BinanceOptionIndexRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionIndexResponse>;
  schema: typeof import("./zod").BinanceOptionIndexRequestSchema;
}

export interface BinanceOptionKlinesMethod {
  (
    req: BinanceOptionKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionKlinesResponse>;
  schema: typeof import("./zod").BinanceOptionKlinesRequestSchema;
}

export interface BinanceOptionMarkPriceMethod {
  (
    req?: BinanceOptionMarkPriceRequest,
    signal?: AbortSignal
  ): Promise<BinanceOptionMarkPriceResponse>;
  schema: typeof import("./zod").BinanceOptionMarkPriceRequestSchema;
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
  referencePrice: BinanceReferencePriceNamespace;
  time: BinanceTimeMethod;
  ticker: BinanceTickerNamespace;
  trades: BinanceTradesMethod;
  uiKlines: BinanceUiKlinesMethod;
}

export interface BinanceReferencePriceNamespace extends BinanceReferencePriceMethod {
  calculation: BinanceReferencePriceCalculationMethod;
}

export interface BinanceTickerNamespace extends BinanceTickerMethod {
  bookTicker: BinanceTickerBookTickerMethod;
  price: BinanceTickerPriceMethod;
  tradingDay: BinanceTickerTradingDayMethod;
  twentyFourHr: BinanceTicker24hrMethod;
}

export interface BinanceApiNamespace {
  v3: BinanceApiV3Namespace;
}

export interface BinanceEapiV1Namespace {
  blockTrades: BinanceOptionBlockTradesMethod;
  depth: BinanceOptionDepthMethod;
  exchangeInfo: BinanceOptionExchangeInfoMethod;
  exerciseHistory: BinanceOptionExerciseHistoryMethod;
  index: BinanceOptionIndexMethod;
  klines: BinanceOptionKlinesMethod;
  mark: BinanceOptionMarkPriceMethod;
  openInterest: BinanceOptionOpenInterestMethod;
  ping: BinanceOptionPingMethod;
  ticker: BinanceOptionTickerMethod;
  time: BinanceOptionTimeMethod;
  trades: BinanceOptionTradesMethod;
}

export interface BinanceEapiNamespace {
  v1: BinanceEapiV1Namespace;
}

export interface BinanceGetNamespace {
  api: BinanceApiNamespace;
  eapi: BinanceEapiNamespace;
}

export interface BinanceProvider {
  api: BinanceApiNamespace;
  eapi: BinanceEapiNamespace;
  get: BinanceGetNamespace;
}
