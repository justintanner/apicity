export type { BinanceOptions, BinancePublicBaseURLs } from "./zod";

export type BinanceQueryArrayFormat = "json" | "repeat" | "csv";

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

export type BinanceFapiPingResponse = BinancePingResponse;
export type BinanceFapiTimeResponse = BinanceTimeResponse;

export interface BinanceFapiExchangeInfoAsset {
  asset: string;
  marginAvailable?: boolean;
  autoAssetExchange?: string | null;
  [key: string]: unknown;
}

export interface BinanceFapiSymbolInfo {
  symbol: string;
  pair: string;
  contractType: string;
  deliveryDate: number;
  onboardDate: number;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  marginAsset: string;
  pricePrecision: number;
  quantityPrecision: number;
  baseAssetPrecision: number;
  quotePrecision: number;
  filters: BinanceExchangeFilter[];
  orderTypes: string[];
  timeInForce?: string[];
  [key: string]: unknown;
}

export interface BinanceFapiExchangeInfoResponse {
  timezone: string;
  serverTime: number;
  rateLimits: BinanceRateLimit[];
  exchangeFilters: BinanceExchangeFilter[];
  assets?: BinanceFapiExchangeInfoAsset[];
  symbols: BinanceFapiSymbolInfo[];
  [key: string]: unknown;
}

export type BinanceFapiDepthLimit = 5 | 10 | 20 | 50 | 100 | 500 | 1000;

export interface BinanceFapiDepthRequest {
  symbol: string;
  limit?: BinanceFapiDepthLimit;
}

export interface BinanceFapiDepthResponse {
  lastUpdateId: number;
  E: number;
  T: number;
  bids: BinanceOrderBookLevel[];
  asks: BinanceOrderBookLevel[];
  [key: string]: unknown;
}

export interface BinanceFapiRpiDepthRequest {
  symbol: string;
  limit?: 1000;
}

export type BinanceFapiRpiDepthResponse = BinanceFapiDepthResponse;

export interface BinanceFapiTradesRequest {
  symbol: string;
  limit?: number;
}

export interface BinanceFapiTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isRPITrade?: boolean;
  [key: string]: unknown;
}

export type BinanceFapiTradesResponse = BinanceFapiTrade[];

export interface BinanceFapiAggTradesRequest {
  symbol: string;
  fromId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface BinanceFapiAggregateTrade {
  a: number;
  p: string;
  q: string;
  nq?: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
  [key: string]: unknown;
}

export type BinanceFapiAggTradesResponse = BinanceFapiAggregateTrade[];

export type BinanceFapiKlineInterval =
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

export interface BinanceFapiKlinesRequest {
  symbol: string;
  interval: BinanceFapiKlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export type BinanceFapiKline = [
  openTime: number,
  open: string,
  high: string,
  low: string,
  close: string,
  volume: string,
  closeTime: number,
  quoteAssetVolume: string,
  numberOfTrades: number,
  takerBuyVolume: string,
  takerBuyQuoteAssetVolume: string,
  unused: string,
];

export type BinanceFapiKlinesResponse = BinanceFapiKline[];

export type BinanceFapiContractType =
  | "PERPETUAL"
  | "CURRENT_QUARTER"
  | "NEXT_QUARTER"
  | "TRADIFI_PERPETUAL";

export interface BinanceFapiContinuousKlinesRequest {
  pair: string;
  contractType: BinanceFapiContractType;
  interval: BinanceFapiKlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export type BinanceFapiContinuousKlinesResponse = BinanceFapiKlinesResponse;

export interface BinanceFapiIndexPriceKlinesRequest {
  pair: string;
  interval: BinanceFapiKlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export type BinanceFapiIndexPriceKlinesResponse = BinanceFapiKlinesResponse;
export type BinanceFapiMarkPriceKlinesRequest = BinanceFapiKlinesRequest;
export type BinanceFapiMarkPriceKlinesResponse = BinanceFapiKlinesResponse;
export type BinanceFapiPremiumIndexKlinesRequest = BinanceFapiKlinesRequest;
export type BinanceFapiPremiumIndexKlinesResponse = BinanceFapiKlinesResponse;

export interface BinanceFapiPremiumIndexRequest {
  symbol?: string;
}

export interface BinanceFapiPremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice?: string;
  lastFundingRate?: string;
  interestRate?: string;
  nextFundingTime?: number;
  time: number;
  [key: string]: unknown;
}

export type BinanceFapiPremiumIndexResponse =
  | BinanceFapiPremiumIndex
  | BinanceFapiPremiumIndex[];

export interface BinanceFapiFundingRateRequest {
  symbol?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface BinanceFapiFundingRate {
  symbol: string;
  fundingTime: number;
  fundingRate: string;
  markPrice?: string;
  [key: string]: unknown;
}

export type BinanceFapiFundingRateResponse = BinanceFapiFundingRate[];

export interface BinanceFapiFundingInfo {
  symbol: string;
  adjustedFundingRateCap: string;
  adjustedFundingRateFloor: string;
  fundingIntervalHours: number;
  disclaimer?: boolean;
  [key: string]: unknown;
}

export type BinanceFapiFundingInfoResponse = BinanceFapiFundingInfo[];

export interface BinanceFapiTicker24hrRequest {
  symbol?: string;
}

export interface BinanceFapiTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  lastQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
  [key: string]: unknown;
}

export type BinanceFapiTicker24hrResponse =
  | BinanceFapiTicker24hr
  | BinanceFapiTicker24hr[];

export interface BinanceFapiTickerBookTickerRequest {
  symbol?: string;
}

export interface BinanceFapiTickerBookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  time: number;
  lastUpdateId?: number;
  [key: string]: unknown;
}

export type BinanceFapiTickerBookTickerResponse =
  | BinanceFapiTickerBookTicker
  | BinanceFapiTickerBookTicker[];

export interface BinanceFapiV2TickerPriceRequest {
  symbol?: string;
}

export interface BinanceFapiTickerPrice {
  symbol: string;
  price: string;
  time: number;
  [key: string]: unknown;
}

export type BinanceFapiV2TickerPriceResponse =
  | BinanceFapiTickerPrice
  | BinanceFapiTickerPrice[];

export interface BinanceFapiOpenInterestRequest {
  symbol: string;
}

export interface BinanceFapiOpenInterestResponse {
  symbol: string;
  openInterest: string;
  time: number;
  [key: string]: unknown;
}

export interface BinanceFapiIndexInfoRequest {
  symbol?: string;
}

export interface BinanceFapiIndexInfoBaseAsset {
  baseAsset: string;
  quoteAsset: string;
  weightInQuantity: string;
  weightInPercentage: string;
  [key: string]: unknown;
}

export interface BinanceFapiIndexInfo {
  symbol: string;
  time: number;
  component: string;
  baseAssetList: BinanceFapiIndexInfoBaseAsset[];
  [key: string]: unknown;
}

export type BinanceFapiIndexInfoResponse = BinanceFapiIndexInfo[];

export interface BinanceFapiAssetIndexRequest {
  symbol?: string;
}

export interface BinanceFapiAssetIndex {
  symbol: string;
  time: number;
  index: string;
  bidBuffer?: string;
  askBuffer?: string;
  bidRate?: string;
  askRate?: string;
  autoExchangeBidBuffer?: string;
  autoExchangeAskBuffer?: string;
  autoExchangeBidRate?: string;
  autoExchangeAskRate?: string;
  [key: string]: unknown;
}

export type BinanceFapiAssetIndexResponse =
  | BinanceFapiAssetIndex
  | BinanceFapiAssetIndex[];

export interface BinanceFapiConstituentsRequest {
  symbol: string;
}

export interface BinanceFapiIndexConstituent {
  exchange: string;
  symbol: string;
  price: string;
  weight: string;
  [key: string]: unknown;
}

export interface BinanceFapiConstituentsResponse {
  symbol: string;
  time: number;
  constituents: BinanceFapiIndexConstituent[];
  [key: string]: unknown;
}

export interface BinanceFapiInsuranceBalanceRequest {
  symbol?: string;
}

export interface BinanceFapiInsuranceBalanceAsset {
  asset: string;
  marginBalance: string;
  updateTime: number;
  [key: string]: unknown;
}

export interface BinanceFapiInsuranceBalance {
  symbols: string[];
  assets: BinanceFapiInsuranceBalanceAsset[];
  [key: string]: unknown;
}

export type BinanceFapiInsuranceBalanceResponse =
  | BinanceFapiInsuranceBalance
  | BinanceFapiInsuranceBalance[];

export interface BinanceFapiSymbolAdlRiskRequest {
  symbol?: string;
}

export interface BinanceFapiSymbolAdlRisk {
  symbol: string;
  adlRisk: string;
  updateTime: number;
  [key: string]: unknown;
}

export type BinanceFapiSymbolAdlRiskResponse =
  | BinanceFapiSymbolAdlRisk
  | BinanceFapiSymbolAdlRisk[];

export interface BinanceFapiTradingScheduleSession {
  startTime: number;
  endTime: number;
  type: string;
  [key: string]: unknown;
}

export interface BinanceFapiTradingScheduleMarket {
  sessions: BinanceFapiTradingScheduleSession[];
  [key: string]: unknown;
}

export interface BinanceFapiTradingScheduleResponse {
  updateTime: number;
  marketSchedules: Record<string, BinanceFapiTradingScheduleMarket>;
  [key: string]: unknown;
}

export type BinanceFuturesDataPeriod =
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "12h"
  | "1d";

export interface BinanceFuturesDataDeliveryPriceRequest {
  pair: string;
}

export interface BinanceFuturesDataDeliveryPrice {
  deliveryTime: number;
  deliveryPrice: number;
  [key: string]: unknown;
}

export type BinanceFuturesDataDeliveryPriceResponse =
  BinanceFuturesDataDeliveryPrice[];

export interface BinanceFuturesDataOpenInterestHistRequest {
  symbol: string;
  period: BinanceFuturesDataPeriod;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export interface BinanceFuturesDataOpenInterestHist {
  symbol: string;
  sumOpenInterest: string;
  sumOpenInterestValue: string;
  CMCCirculatingSupply?: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceFuturesDataOpenInterestHistResponse =
  BinanceFuturesDataOpenInterestHist[];

export interface BinanceFuturesDataLongShortRatioRequest {
  symbol: string;
  period: BinanceFuturesDataPeriod;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export interface BinanceFuturesDataLongShortRatio {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceFuturesDataLongShortRatioResponse =
  BinanceFuturesDataLongShortRatio[];

export type BinanceFuturesDataTakerlongshortRatioRequest =
  BinanceFuturesDataLongShortRatioRequest;

export interface BinanceFuturesDataTakerlongshortRatio {
  buySellRatio: string;
  buyVol: string;
  sellVol: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceFuturesDataTakerlongshortRatioResponse =
  BinanceFuturesDataTakerlongshortRatio[];

export interface BinanceFuturesDataBasisRequest {
  pair: string;
  contractType: "CURRENT_QUARTER" | "NEXT_QUARTER" | "PERPETUAL";
  period: BinanceFuturesDataPeriod;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export interface BinanceFuturesDataBasis {
  pair: string;
  contractType: string;
  indexPrice: string;
  futuresPrice: string;
  basis: string;
  basisRate: string;
  annualizedBasisRate: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceFuturesDataBasisResponse = BinanceFuturesDataBasis[];

export type BinanceCoinMContractType =
  | "PERPETUAL"
  | "CURRENT_QUARTER"
  | "NEXT_QUARTER";

export type BinanceCoinMStatsContractType = BinanceCoinMContractType | "ALL";

export type BinanceCoinMKlineInterval =
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

export type BinanceCoinMStatsPeriod =
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "12h"
  | "1d";

export interface BinanceCoinMExchangeInfoSymbol {
  symbol: string;
  pair: string;
  contractType: BinanceCoinMContractType | string;
  contractStatus: string;
  baseAsset: string;
  quoteAsset: string;
  marginAsset: string;
  contractSize: number;
  deliveryDate: number;
  onboardDate: number;
  filters: BinanceExchangeFilter[];
  orderTypes: string[];
  timeInForce?: string[];
  [key: string]: unknown;
}

export interface BinanceCoinMExchangeInfoResponse {
  timezone: string;
  serverTime: number;
  rateLimits: BinanceRateLimit[];
  exchangeFilters: BinanceExchangeFilter[];
  symbols: BinanceCoinMExchangeInfoSymbol[];
  [key: string]: unknown;
}

export interface BinanceCoinMDepthRequest {
  symbol: string;
  limit?: number;
}

export interface BinanceCoinMDepthResponse {
  lastUpdateId: number;
  symbol: string;
  pair: string;
  E: number;
  T: number;
  bids: BinanceOrderBookLevel[];
  asks: BinanceOrderBookLevel[];
}

export interface BinanceCoinMTradesRequest {
  symbol: string;
  limit?: number;
}

export interface BinanceCoinMTrade {
  id: number;
  price: string;
  qty: string;
  baseQty: string;
  time: number;
  isBuyerMaker: boolean;
  [key: string]: unknown;
}

export type BinanceCoinMTradesResponse = BinanceCoinMTrade[];

export interface BinanceCoinMAggTradesRequest {
  symbol: string;
  fromId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface BinanceCoinMAggregateTrade {
  a: number;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
  [key: string]: unknown;
}

export type BinanceCoinMAggTradesResponse = BinanceCoinMAggregateTrade[];

export interface BinanceCoinMPremiumIndexRequest {
  symbol?: string;
  pair?: string;
}

export interface BinanceCoinMPremiumIndex {
  symbol: string;
  pair: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice?: string;
  lastFundingRate?: string;
  interestRate?: string;
  nextFundingTime?: number;
  time: number;
  [key: string]: unknown;
}

export type BinanceCoinMPremiumIndexResponse = BinanceCoinMPremiumIndex[];

export interface BinanceCoinMFundingRateRequest {
  symbol: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface BinanceCoinMFundingRate {
  symbol: string;
  fundingTime: number;
  fundingRate: string;
  [key: string]: unknown;
}

export type BinanceCoinMFundingRateResponse = BinanceCoinMFundingRate[];

export interface BinanceCoinMFundingInfo {
  symbol: string;
  adjustedFundingRateCap: string;
  adjustedFundingRateFloor: string;
  fundingIntervalHours: number;
  disclaimer?: boolean;
  [key: string]: unknown;
}

export type BinanceCoinMFundingInfoResponse = BinanceCoinMFundingInfo[];

export interface BinanceCoinMKlinesRequest {
  symbol: string;
  interval: BinanceCoinMKlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export type BinanceCoinMKline = [
  openTime: number,
  open: string,
  high: string,
  low: string,
  close: string,
  volume: string,
  closeTime: number,
  baseAssetVolume: string,
  numberOfTrades: number,
  takerBuyVolume: string,
  takerBuyBaseAssetVolume: string,
  unused: string,
];

export type BinanceCoinMKlinesResponse = BinanceCoinMKline[];

export interface BinanceCoinMContinuousKlinesRequest {
  pair: string;
  contractType: BinanceCoinMContractType;
  interval: BinanceCoinMKlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export type BinanceCoinMContinuousKlinesResponse = BinanceCoinMKlinesResponse;

export interface BinanceCoinMIndexPriceKlinesRequest {
  pair: string;
  interval: BinanceCoinMKlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export type BinanceCoinMIndexPriceKlinesResponse = BinanceCoinMKlinesResponse;

export type BinanceCoinMMarkPriceKlinesRequest = BinanceCoinMKlinesRequest;
export type BinanceCoinMMarkPriceKlinesResponse = BinanceCoinMKlinesResponse;

export type BinanceCoinMPremiumIndexKlinesRequest = BinanceCoinMKlinesRequest;
export type BinanceCoinMPremiumIndexKlinesResponse = BinanceCoinMKlinesResponse;

export interface BinanceCoinMTickerRequest {
  symbol?: string;
  pair?: string;
}

export interface BinanceCoinMTicker24hr {
  symbol: string;
  pair: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  lastQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  baseVolume?: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
  [key: string]: unknown;
}

export type BinanceCoinMTicker24hrResponse = BinanceCoinMTicker24hr[];

export interface BinanceCoinMTickerPrice {
  symbol: string;
  ps?: string;
  pair?: string;
  price: string;
  time: number;
  [key: string]: unknown;
}

export type BinanceCoinMTickerPriceResponse = BinanceCoinMTickerPrice[];

export interface BinanceCoinMTickerBookTicker {
  symbol: string;
  pair: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  time: number;
  lastUpdateId?: number;
  [key: string]: unknown;
}

export type BinanceCoinMTickerBookTickerResponse =
  BinanceCoinMTickerBookTicker[];

export interface BinanceCoinMOpenInterestRequest {
  symbol: string;
}

export interface BinanceCoinMOpenInterestResponse {
  symbol: string;
  pair: string;
  openInterest: string;
  contractType: BinanceCoinMContractType | string;
  time: number;
  [key: string]: unknown;
}

export interface BinanceCoinMConstituentsRequest {
  symbol: string;
}

export interface BinanceCoinMIndexConstituent {
  exchange: string;
  symbol: string;
  [key: string]: unknown;
}

export interface BinanceCoinMConstituentsResponse {
  symbol: string;
  time: number;
  constituents: BinanceCoinMIndexConstituent[];
  [key: string]: unknown;
}

export interface BinanceCoinMStatsBaseRequest {
  pair: string;
  period: BinanceCoinMStatsPeriod;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export interface BinanceCoinMOpenInterestHistRequest extends BinanceCoinMStatsBaseRequest {
  contractType: BinanceCoinMStatsContractType;
}

export interface BinanceCoinMOpenInterestHist {
  pair: string;
  contractType: BinanceCoinMStatsContractType | string;
  sumOpenInterest: string;
  sumOpenInterestValue: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceCoinMOpenInterestHistResponse =
  BinanceCoinMOpenInterestHist[];

export type BinanceCoinMTopLongShortPositionRatioRequest =
  BinanceCoinMStatsBaseRequest;

export interface BinanceCoinMTopLongShortPositionRatio {
  pair: string;
  longShortRatio: string;
  longPosition: string;
  shortPosition: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceCoinMTopLongShortPositionRatioResponse =
  BinanceCoinMTopLongShortPositionRatio[];

export type BinanceCoinMTopLongShortAccountRatioRequest =
  BinanceCoinMStatsBaseRequest;

export interface BinanceCoinMLongShortAccountRatio {
  pair: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceCoinMTopLongShortAccountRatioResponse =
  BinanceCoinMLongShortAccountRatio[];

export type BinanceCoinMGlobalLongShortAccountRatioRequest =
  BinanceCoinMStatsBaseRequest;

export type BinanceCoinMGlobalLongShortAccountRatioResponse =
  BinanceCoinMLongShortAccountRatio[];

export interface BinanceCoinMTakerBuySellVolRequest extends BinanceCoinMStatsBaseRequest {
  contractType: BinanceCoinMStatsContractType;
}

export interface BinanceCoinMTakerBuySellVol {
  pair: string;
  contractType: BinanceCoinMStatsContractType | string;
  takerBuyVol: string;
  takerSellVol: string;
  takerBuyVolValue: string;
  takerSellVolValue: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceCoinMTakerBuySellVolResponse = BinanceCoinMTakerBuySellVol[];

export interface BinanceCoinMDeliveryPriceRequest {
  pair: string;
}

export interface BinanceCoinMDeliveryPrice {
  deliveryTime: number;
  deliveryPrice: number;
  [key: string]: unknown;
}

export type BinanceCoinMDeliveryPriceResponse = BinanceCoinMDeliveryPrice[];

export interface BinanceCoinMBasisRequest extends BinanceCoinMStatsBaseRequest {
  contractType: BinanceCoinMContractType;
}

export interface BinanceCoinMBasis {
  pair: string;
  contractType: BinanceCoinMContractType | string;
  indexPrice: string;
  futuresPrice: string;
  basis: string;
  basisRate: string;
  annualizedBasisRate: string;
  timestamp: number;
  [key: string]: unknown;
}

export type BinanceCoinMBasisResponse = BinanceCoinMBasis[];

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

export interface BinanceFapiPingMethod {
  (signal?: AbortSignal): Promise<BinanceFapiPingResponse>;
  schema: undefined;
}

export interface BinanceFapiTimeMethod {
  (signal?: AbortSignal): Promise<BinanceFapiTimeResponse>;
  schema: undefined;
}

export interface BinanceFapiExchangeInfoMethod {
  (signal?: AbortSignal): Promise<BinanceFapiExchangeInfoResponse>;
  schema: undefined;
}

export interface BinanceFapiDepthMethod {
  (
    req: BinanceFapiDepthRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiDepthResponse>;
  schema: typeof import("./zod").BinanceFapiDepthRequestSchema;
}

export interface BinanceFapiRpiDepthMethod {
  (
    req: BinanceFapiRpiDepthRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiRpiDepthResponse>;
  schema: typeof import("./zod").BinanceFapiRpiDepthRequestSchema;
}

export interface BinanceFapiTradesMethod {
  (
    req: BinanceFapiTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiTradesResponse>;
  schema: typeof import("./zod").BinanceFapiTradesRequestSchema;
}

export interface BinanceFapiAggTradesMethod {
  (
    req: BinanceFapiAggTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiAggTradesResponse>;
  schema: typeof import("./zod").BinanceFapiAggTradesRequestSchema;
}

export interface BinanceFapiKlinesMethod {
  (
    req: BinanceFapiKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiKlinesResponse>;
  schema: typeof import("./zod").BinanceFapiKlinesRequestSchema;
}

export interface BinanceFapiContinuousKlinesMethod {
  (
    req: BinanceFapiContinuousKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiContinuousKlinesResponse>;
  schema: typeof import("./zod").BinanceFapiContinuousKlinesRequestSchema;
}

export interface BinanceFapiIndexPriceKlinesMethod {
  (
    req: BinanceFapiIndexPriceKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiIndexPriceKlinesResponse>;
  schema: typeof import("./zod").BinanceFapiIndexPriceKlinesRequestSchema;
}

export interface BinanceFapiMarkPriceKlinesMethod {
  (
    req: BinanceFapiMarkPriceKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiMarkPriceKlinesResponse>;
  schema: typeof import("./zod").BinanceFapiMarkPriceKlinesRequestSchema;
}

export interface BinanceFapiPremiumIndexKlinesMethod {
  (
    req: BinanceFapiPremiumIndexKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiPremiumIndexKlinesResponse>;
  schema: typeof import("./zod").BinanceFapiPremiumIndexKlinesRequestSchema;
}

export interface BinanceFapiPremiumIndexMethod {
  (
    req?: BinanceFapiPremiumIndexRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiPremiumIndexResponse>;
  schema: typeof import("./zod").BinanceFapiPremiumIndexRequestSchema;
}

export interface BinanceFapiFundingRateMethod {
  (
    req?: BinanceFapiFundingRateRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiFundingRateResponse>;
  schema: typeof import("./zod").BinanceFapiFundingRateRequestSchema;
}

export interface BinanceFapiFundingInfoMethod {
  (signal?: AbortSignal): Promise<BinanceFapiFundingInfoResponse>;
  schema: undefined;
}

export interface BinanceFapiTicker24hrMethod {
  (
    req?: BinanceFapiTicker24hrRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiTicker24hrResponse>;
  schema: typeof import("./zod").BinanceFapiTicker24hrRequestSchema;
}

export interface BinanceFapiTickerBookTickerMethod {
  (
    req?: BinanceFapiTickerBookTickerRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiTickerBookTickerResponse>;
  schema: typeof import("./zod").BinanceFapiTickerBookTickerRequestSchema;
}

export interface BinanceFapiV2TickerPriceMethod {
  (
    req?: BinanceFapiV2TickerPriceRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiV2TickerPriceResponse>;
  schema: typeof import("./zod").BinanceFapiV2TickerPriceRequestSchema;
}

export interface BinanceFapiOpenInterestMethod {
  (
    req: BinanceFapiOpenInterestRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiOpenInterestResponse>;
  schema: typeof import("./zod").BinanceFapiOpenInterestRequestSchema;
}

export interface BinanceFapiIndexInfoMethod {
  (
    req?: BinanceFapiIndexInfoRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiIndexInfoResponse>;
  schema: typeof import("./zod").BinanceFapiIndexInfoRequestSchema;
}

export interface BinanceFapiAssetIndexMethod {
  (
    req?: BinanceFapiAssetIndexRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiAssetIndexResponse>;
  schema: typeof import("./zod").BinanceFapiAssetIndexRequestSchema;
}

export interface BinanceFapiConstituentsMethod {
  (
    req: BinanceFapiConstituentsRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiConstituentsResponse>;
  schema: typeof import("./zod").BinanceFapiConstituentsRequestSchema;
}

export interface BinanceFapiInsuranceBalanceMethod {
  (
    req?: BinanceFapiInsuranceBalanceRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiInsuranceBalanceResponse>;
  schema: typeof import("./zod").BinanceFapiInsuranceBalanceRequestSchema;
}

export interface BinanceFapiSymbolAdlRiskMethod {
  (
    req?: BinanceFapiSymbolAdlRiskRequest,
    signal?: AbortSignal
  ): Promise<BinanceFapiSymbolAdlRiskResponse>;
  schema: typeof import("./zod").BinanceFapiSymbolAdlRiskRequestSchema;
}

export interface BinanceFapiTradingScheduleMethod {
  (signal?: AbortSignal): Promise<BinanceFapiTradingScheduleResponse>;
  schema: undefined;
}

export interface BinanceFuturesDataDeliveryPriceMethod {
  (
    req: BinanceFuturesDataDeliveryPriceRequest,
    signal?: AbortSignal
  ): Promise<BinanceFuturesDataDeliveryPriceResponse>;
  schema: typeof import("./zod").BinanceFuturesDataDeliveryPriceRequestSchema;
}

export interface BinanceFuturesDataOpenInterestHistMethod {
  (
    req: BinanceFuturesDataOpenInterestHistRequest,
    signal?: AbortSignal
  ): Promise<BinanceFuturesDataOpenInterestHistResponse>;
  schema: typeof import("./zod").BinanceFuturesDataOpenInterestHistRequestSchema;
}

export interface BinanceFuturesDataTopLongShortPositionRatioMethod {
  (
    req: BinanceFuturesDataLongShortRatioRequest,
    signal?: AbortSignal
  ): Promise<BinanceFuturesDataLongShortRatioResponse>;
  schema: typeof import("./zod").BinanceFuturesDataLongShortRatioRequestSchema;
}

export interface BinanceFuturesDataTopLongShortAccountRatioMethod {
  (
    req: BinanceFuturesDataLongShortRatioRequest,
    signal?: AbortSignal
  ): Promise<BinanceFuturesDataLongShortRatioResponse>;
  schema: typeof import("./zod").BinanceFuturesDataLongShortRatioRequestSchema;
}

export interface BinanceFuturesDataGlobalLongShortAccountRatioMethod {
  (
    req: BinanceFuturesDataLongShortRatioRequest,
    signal?: AbortSignal
  ): Promise<BinanceFuturesDataLongShortRatioResponse>;
  schema: typeof import("./zod").BinanceFuturesDataLongShortRatioRequestSchema;
}

export interface BinanceFuturesDataTakerlongshortRatioMethod {
  (
    req: BinanceFuturesDataTakerlongshortRatioRequest,
    signal?: AbortSignal
  ): Promise<BinanceFuturesDataTakerlongshortRatioResponse>;
  schema: typeof import("./zod").BinanceFuturesDataTakerlongshortRatioRequestSchema;
}

export interface BinanceFuturesDataBasisMethod {
  (
    req: BinanceFuturesDataBasisRequest,
    signal?: AbortSignal
  ): Promise<BinanceFuturesDataBasisResponse>;
  schema: typeof import("./zod").BinanceFuturesDataBasisRequestSchema;
}

export interface BinanceCoinMPingMethod {
  (signal?: AbortSignal): Promise<BinancePingResponse>;
  schema: undefined;
}

export interface BinanceCoinMTimeMethod {
  (signal?: AbortSignal): Promise<BinanceTimeResponse>;
  schema: undefined;
}

export interface BinanceCoinMExchangeInfoMethod {
  (signal?: AbortSignal): Promise<BinanceCoinMExchangeInfoResponse>;
  schema: undefined;
}

export interface BinanceCoinMDepthMethod {
  (
    req: BinanceCoinMDepthRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMDepthResponse>;
  schema: typeof import("./zod").BinanceCoinMDepthRequestSchema;
}

export interface BinanceCoinMTradesMethod {
  (
    req: BinanceCoinMTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMTradesResponse>;
  schema: typeof import("./zod").BinanceCoinMTradesRequestSchema;
}

export interface BinanceCoinMAggTradesMethod {
  (
    req: BinanceCoinMAggTradesRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMAggTradesResponse>;
  schema: typeof import("./zod").BinanceCoinMAggTradesRequestSchema;
}

export interface BinanceCoinMPremiumIndexMethod {
  (
    req?: BinanceCoinMPremiumIndexRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMPremiumIndexResponse>;
  schema: typeof import("./zod").BinanceCoinMPremiumIndexRequestSchema;
}

export interface BinanceCoinMFundingRateMethod {
  (
    req: BinanceCoinMFundingRateRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMFundingRateResponse>;
  schema: typeof import("./zod").BinanceCoinMFundingRateRequestSchema;
}

export interface BinanceCoinMFundingInfoMethod {
  (signal?: AbortSignal): Promise<BinanceCoinMFundingInfoResponse>;
  schema: undefined;
}

export interface BinanceCoinMKlinesMethod {
  (
    req: BinanceCoinMKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMKlinesResponse>;
  schema: typeof import("./zod").BinanceCoinMKlinesRequestSchema;
}

export interface BinanceCoinMContinuousKlinesMethod {
  (
    req: BinanceCoinMContinuousKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMContinuousKlinesResponse>;
  schema: typeof import("./zod").BinanceCoinMContinuousKlinesRequestSchema;
}

export interface BinanceCoinMIndexPriceKlinesMethod {
  (
    req: BinanceCoinMIndexPriceKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMIndexPriceKlinesResponse>;
  schema: typeof import("./zod").BinanceCoinMIndexPriceKlinesRequestSchema;
}

export interface BinanceCoinMMarkPriceKlinesMethod {
  (
    req: BinanceCoinMMarkPriceKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMMarkPriceKlinesResponse>;
  schema: typeof import("./zod").BinanceCoinMMarkPriceKlinesRequestSchema;
}

export interface BinanceCoinMPremiumIndexKlinesMethod {
  (
    req: BinanceCoinMPremiumIndexKlinesRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMPremiumIndexKlinesResponse>;
  schema: typeof import("./zod").BinanceCoinMPremiumIndexKlinesRequestSchema;
}

export interface BinanceCoinMTicker24hrMethod {
  (
    req?: BinanceCoinMTickerRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMTicker24hrResponse>;
  schema: typeof import("./zod").BinanceCoinMTickerRequestSchema;
}

export interface BinanceCoinMTickerPriceMethod {
  (
    req?: BinanceCoinMTickerRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMTickerPriceResponse>;
  schema: typeof import("./zod").BinanceCoinMTickerRequestSchema;
}

export interface BinanceCoinMTickerBookTickerMethod {
  (
    req?: BinanceCoinMTickerRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMTickerBookTickerResponse>;
  schema: typeof import("./zod").BinanceCoinMTickerRequestSchema;
}

export interface BinanceCoinMOpenInterestMethod {
  (
    req: BinanceCoinMOpenInterestRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMOpenInterestResponse>;
  schema: typeof import("./zod").BinanceCoinMOpenInterestRequestSchema;
}

export interface BinanceCoinMConstituentsMethod {
  (
    req: BinanceCoinMConstituentsRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMConstituentsResponse>;
  schema: typeof import("./zod").BinanceCoinMConstituentsRequestSchema;
}

export interface BinanceCoinMOpenInterestHistMethod {
  (
    req: BinanceCoinMOpenInterestHistRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMOpenInterestHistResponse>;
  schema: typeof import("./zod").BinanceCoinMOpenInterestHistRequestSchema;
}

export interface BinanceCoinMTopLongShortPositionRatioMethod {
  (
    req: BinanceCoinMTopLongShortPositionRatioRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMTopLongShortPositionRatioResponse>;
  schema: typeof import("./zod").BinanceCoinMTopLongShortPositionRatioRequestSchema;
}

export interface BinanceCoinMTopLongShortAccountRatioMethod {
  (
    req: BinanceCoinMTopLongShortAccountRatioRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMTopLongShortAccountRatioResponse>;
  schema: typeof import("./zod").BinanceCoinMTopLongShortAccountRatioRequestSchema;
}

export interface BinanceCoinMGlobalLongShortAccountRatioMethod {
  (
    req: BinanceCoinMGlobalLongShortAccountRatioRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMGlobalLongShortAccountRatioResponse>;
  schema: typeof import("./zod").BinanceCoinMGlobalLongShortAccountRatioRequestSchema;
}

export interface BinanceCoinMTakerBuySellVolMethod {
  (
    req: BinanceCoinMTakerBuySellVolRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMTakerBuySellVolResponse>;
  schema: typeof import("./zod").BinanceCoinMTakerBuySellVolRequestSchema;
}

export interface BinanceCoinMDeliveryPriceMethod {
  (
    req: BinanceCoinMDeliveryPriceRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMDeliveryPriceResponse>;
  schema: typeof import("./zod").BinanceCoinMDeliveryPriceRequestSchema;
}

export interface BinanceCoinMBasisMethod {
  (
    req: BinanceCoinMBasisRequest,
    signal?: AbortSignal
  ): Promise<BinanceCoinMBasisResponse>;
  schema: typeof import("./zod").BinanceCoinMBasisRequestSchema;
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

export interface BinanceCoinMTickerNamespace {
  bookTicker: BinanceCoinMTickerBookTickerMethod;
  price: BinanceCoinMTickerPriceMethod;
  twentyFourHr: BinanceCoinMTicker24hrMethod;
}

export interface BinanceDapiV1Namespace {
  aggTrades: BinanceCoinMAggTradesMethod;
  constituents: BinanceCoinMConstituentsMethod;
  continuousKlines: BinanceCoinMContinuousKlinesMethod;
  depth: BinanceCoinMDepthMethod;
  exchangeInfo: BinanceCoinMExchangeInfoMethod;
  fundingInfo: BinanceCoinMFundingInfoMethod;
  fundingRate: BinanceCoinMFundingRateMethod;
  indexPriceKlines: BinanceCoinMIndexPriceKlinesMethod;
  klines: BinanceCoinMKlinesMethod;
  markPriceKlines: BinanceCoinMMarkPriceKlinesMethod;
  openInterest: BinanceCoinMOpenInterestMethod;
  ping: BinanceCoinMPingMethod;
  premiumIndex: BinanceCoinMPremiumIndexMethod;
  premiumIndexKlines: BinanceCoinMPremiumIndexKlinesMethod;
  ticker: BinanceCoinMTickerNamespace;
  time: BinanceCoinMTimeMethod;
  trades: BinanceCoinMTradesMethod;
}

export interface BinanceDapiNamespace {
  v1: BinanceDapiV1Namespace;
}

export interface BinanceCoinMFuturesDataNamespace {
  basis: BinanceCoinMBasisMethod;
  deliveryPrice: BinanceCoinMDeliveryPriceMethod;
  globalLongShortAccountRatio: BinanceCoinMGlobalLongShortAccountRatioMethod;
  openInterestHist: BinanceCoinMOpenInterestHistMethod;
  takerBuySellVol: BinanceCoinMTakerBuySellVolMethod;
  topLongShortAccountRatio: BinanceCoinMTopLongShortAccountRatioMethod;
  topLongShortPositionRatio: BinanceCoinMTopLongShortPositionRatioMethod;
}

export interface BinanceCoinMFuturesNamespace {
  data: BinanceCoinMFuturesDataNamespace;
}

export interface BinancePublicSpotApiV3Namespace {
  ping: BinancePingMethod;
}

export interface BinancePublicSpotNamespace {
  api: {
    v3: BinancePublicSpotApiV3Namespace;
  };
}

export interface BinancePublicUsdMFuturesNamespace {
  fapi: {
    v1: {
      ping: BinancePingMethod;
    };
  };
}

export interface BinancePublicCoinMFuturesNamespace {
  dapi: BinanceDapiNamespace;
  futures: BinanceCoinMFuturesNamespace;
}

export interface BinancePublicOptionsNamespace {
  eapi: {
    v1: {
      ping: BinancePingMethod;
    };
  };
}

export interface BinancePublicNamespace {
  spot: BinancePublicSpotNamespace;
  spotData: BinancePublicSpotNamespace;
  usdMFutures: BinancePublicUsdMFuturesNamespace;
  coinMFutures: BinancePublicCoinMFuturesNamespace;
  options: BinancePublicOptionsNamespace;
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

export interface BinanceFapiV1TickerNamespace {
  bookTicker: BinanceFapiTickerBookTickerMethod;
  twentyFourHr: BinanceFapiTicker24hrMethod;
}

export interface BinanceFapiV1Namespace {
  aggTrades: BinanceFapiAggTradesMethod;
  assetIndex: BinanceFapiAssetIndexMethod;
  constituents: BinanceFapiConstituentsMethod;
  continuousKlines: BinanceFapiContinuousKlinesMethod;
  depth: BinanceFapiDepthMethod;
  exchangeInfo: BinanceFapiExchangeInfoMethod;
  fundingInfo: BinanceFapiFundingInfoMethod;
  fundingRate: BinanceFapiFundingRateMethod;
  indexInfo: BinanceFapiIndexInfoMethod;
  indexPriceKlines: BinanceFapiIndexPriceKlinesMethod;
  insuranceBalance: BinanceFapiInsuranceBalanceMethod;
  klines: BinanceFapiKlinesMethod;
  markPriceKlines: BinanceFapiMarkPriceKlinesMethod;
  openInterest: BinanceFapiOpenInterestMethod;
  ping: BinanceFapiPingMethod;
  premiumIndex: BinanceFapiPremiumIndexMethod;
  premiumIndexKlines: BinanceFapiPremiumIndexKlinesMethod;
  rpiDepth: BinanceFapiRpiDepthMethod;
  symbolAdlRisk: BinanceFapiSymbolAdlRiskMethod;
  ticker: BinanceFapiV1TickerNamespace;
  time: BinanceFapiTimeMethod;
  trades: BinanceFapiTradesMethod;
  tradingSchedule: BinanceFapiTradingScheduleMethod;
}

export interface BinanceFapiV2TickerNamespace {
  price: BinanceFapiV2TickerPriceMethod;
}

export interface BinanceFapiV2Namespace {
  ticker: BinanceFapiV2TickerNamespace;
}

export interface BinanceFapiNamespace {
  v1: BinanceFapiV1Namespace;
  v2: BinanceFapiV2Namespace;
}

export interface BinanceFuturesDataNamespace {
  basis: BinanceFuturesDataBasisMethod;
  deliveryPrice: BinanceFuturesDataDeliveryPriceMethod;
  globalLongShortAccountRatio: BinanceFuturesDataGlobalLongShortAccountRatioMethod;
  openInterestHist: BinanceFuturesDataOpenInterestHistMethod;
  takerlongshortRatio: BinanceFuturesDataTakerlongshortRatioMethod;
  topLongShortAccountRatio: BinanceFuturesDataTopLongShortAccountRatioMethod;
  topLongShortPositionRatio: BinanceFuturesDataTopLongShortPositionRatioMethod;
}

export interface BinanceFuturesNamespace {
  data: BinanceFuturesDataNamespace;
}

export interface BinanceGetNamespace {
  api: BinanceApiNamespace;
  eapi: BinanceEapiNamespace;
  fapi: BinanceFapiNamespace;
  dapi: BinanceDapiNamespace;
  futures: BinanceFuturesNamespace;
  coinMFutures: BinanceCoinMFuturesNamespace;
  public: BinancePublicNamespace;
}

export interface BinanceProvider {
  api: BinanceApiNamespace;
  eapi: BinanceEapiNamespace;
  fapi: BinanceFapiNamespace;
  dapi: BinanceDapiNamespace;
  futures: BinanceFuturesNamespace;
  coinMFutures: BinanceCoinMFuturesNamespace;
  public: BinancePublicNamespace;
  get: BinanceGetNamespace;
}
