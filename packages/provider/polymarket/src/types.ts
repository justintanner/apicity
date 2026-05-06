// ---------------------------------------------------------------------------
// @apicity/polymarket — public Polymarket APIs (Gamma, Data, CLOB market-data)
// ---------------------------------------------------------------------------

// -- Request types — derived from Zod schemas (source of truth in zod.ts) ----

export type { PolymarketOptions } from "./zod";

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

// -- Query types ------------------------------------------------------------

export interface PolymarketClobTokenQuery {
  token_id: string;
}

export interface PolymarketClobPriceQuery extends PolymarketClobTokenQuery {
  side: PolymarketClobSide;
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
}

export interface PolymarketGetNamespace {
  clob: PolymarketClobGetNamespace;
}

// PR 1 + C1 ship zero POST endpoints; the post namespace is reserved for the
// CLOB batch market-data endpoints (POST /prices, /midpoints, /spreads,
// /last-trades-prices, /books, /batch-prices-history) coming in C5.
export type PolymarketPostNamespace = Record<string, never>;

export interface PolymarketProvider {
  get: PolymarketGetNamespace;
  post: PolymarketPostNamespace;
}
