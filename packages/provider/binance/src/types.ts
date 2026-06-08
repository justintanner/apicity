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

export interface BinanceApiV3Namespace {
  exchangeInfo: BinanceExchangeInfoMethod;
  ping: BinancePingMethod;
  time: BinanceTimeMethod;
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
