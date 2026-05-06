import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

// Polymarket exposes three separate hosts, all of which serve a public,
// no-auth surface for read-only data. Each host can be overridden
// independently for testing/proxying. There is no apiKey field — the
// authenticated CLOB trading surface is intentionally not implemented here.
export const PolymarketOptionsSchema = z.object({
  gammaBaseURL: z.string().optional(),
  dataBaseURL: z.string().optional(),
  clobBaseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type PolymarketOptions = z.infer<typeof PolymarketOptionsSchema>;

// ---------------------------------------------------------------------------
// CLOB batch POST schemas (C5)
// ---------------------------------------------------------------------------

export const PolymarketClobSideSchema = z.enum(["BUY", "SELL"]);

// Most batch endpoints (/books, /midpoints, /spreads, /last-trades-prices)
// share the same request shape: an array of { token_id } objects. The server
// rejects empty arrays with "invalid filters" — enforce that locally.
export const PolymarketClobTokenBatchRequestSchema = z
  .array(z.object({ token_id: z.string().min(1) }))
  .min(1);

export type PolymarketClobTokenBatchRequest = z.infer<
  typeof PolymarketClobTokenBatchRequestSchema
>;

// /prices takes an array of { token_id, side } pairs since the same token can
// be queried for both BUY and SELL in one call.
export const PolymarketClobPricesBatchRequestSchema = z
  .array(
    z.object({
      token_id: z.string().min(1),
      side: PolymarketClobSideSchema,
    })
  )
  .min(1);

export type PolymarketClobPricesBatchRequest = z.infer<
  typeof PolymarketClobPricesBatchRequestSchema
>;

// /batch-prices-history takes an object envelope, not an array — `markets` is
// the list of token_ids and the interval / window applies to all of them
// uniformly.
export const PolymarketClobPriceHistoryIntervalSchema = z.enum([
  "1m",
  "1h",
  "6h",
  "1d",
  "1w",
  "max",
]);

export const PolymarketClobBatchPricesHistoryRequestSchema = z.object({
  markets: z.array(z.string().min(1)).min(1),
  interval: PolymarketClobPriceHistoryIntervalSchema.optional(),
  startTs: z.number().optional(),
  endTs: z.number().optional(),
  fidelity: z.number().optional(),
});

export type PolymarketClobBatchPricesHistoryRequest = z.infer<
  typeof PolymarketClobBatchPricesHistoryRequestSchema
>;
