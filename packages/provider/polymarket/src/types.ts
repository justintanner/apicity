// ---------------------------------------------------------------------------
// @apicity/polymarket — public Polymarket APIs (Gamma, Data, CLOB market-data)
// ---------------------------------------------------------------------------

// -- Request types — derived from Zod schemas (source of truth in zod.ts) ----

export type { PolymarketOptions } from "./zod";

// -- Response types (hand-written) ------------------------------------------

// CLOB /time returns a plain-text Unix timestamp in seconds (e.g. "1778040747"),
// not JSON. The factory parses it to a number before returning so callers
// don't repeat that work.
export type PolymarketServerTime = number;

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

// -- Namespace interfaces ---------------------------------------------------

export interface PolymarketClobGetNamespace {
  time: PolymarketClobTimeMethod;
}

export interface PolymarketGetNamespace {
  clob: PolymarketClobGetNamespace;
}

// PR 1 ships zero POST endpoints; the post namespace is reserved for the
// CLOB batch market-data endpoints (POST /prices, /midpoints, /spreads,
// /last-trades-prices, /books, /batch-prices-history).
export type PolymarketPostNamespace = Record<string, never>;

export interface PolymarketProvider {
  get: PolymarketGetNamespace;
  post: PolymarketPostNamespace;
}
