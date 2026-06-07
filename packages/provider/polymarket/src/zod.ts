import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

export interface PolymarketClobApiCredentials {
  key: string;
  secret: string;
  passphrase: string;
}

export interface PolymarketClobL1Headers {
  address: string;
  signature: string;
  timestamp: string | number;
  nonce?: string | number;
}

export interface PolymarketClobL2HeaderArgs {
  method: "GET" | "POST" | "PUT" | "DELETE";
  requestPath: string;
  body?: string;
  timestamp: number;
}

export interface PolymarketClobL2Headers {
  address: string;
  apiKey: string;
  passphrase: string;
  timestamp: string | number;
  signature: string;
}

export type PolymarketClobL2HeaderSigner = (
  args: PolymarketClobL2HeaderArgs
) => Promise<PolymarketClobL2Headers> | PolymarketClobL2Headers;

// Polymarket exposes three separate hosts for public data and the CLOB host
// also serves authenticated trading/account endpoints. L2 credentials are
// optional so public-read users can keep constructing a no-auth client.
export const PolymarketOptionsSchema = z.object({
  gammaBaseURL: z.string().optional(),
  dataBaseURL: z.string().optional(),
  clobBaseURL: z.string().optional(),
  clobAddress: z.string().optional(),
  clobApiKey: z.string().optional(),
  clobApiSecret: z.string().optional(),
  clobApiPassphrase: z.string().optional(),
  clobApiCredentials: z.custom<PolymarketClobApiCredentials>().optional(),
  clobL1Headers: z.custom<PolymarketClobL1Headers>().optional(),
  clobL2HeaderSigner: z.custom<PolymarketClobL2HeaderSigner>().optional(),
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

// ---------------------------------------------------------------------------
// Authenticated CLOB trading/account schemas
// ---------------------------------------------------------------------------

export const PolymarketClobSignatureTypeSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const PolymarketClobOrderTypeSchema = z.enum([
  "GTC",
  "FOK",
  "GTD",
  "FAK",
]);

export const PolymarketClobSignedOrderSchema = z.object({
  maker: z.string().min(1),
  signer: z.string().min(1),
  tokenId: z.string().min(1),
  makerAmount: z.string().min(1),
  takerAmount: z.string().min(1),
  side: PolymarketClobSideSchema,
  expiration: z.string().min(1),
  timestamp: z.string().min(1),
  metadata: z.string().optional(),
  builder: z.string().min(1),
  signature: z.string().min(1),
  salt: z.number(),
  signatureType: PolymarketClobSignatureTypeSchema,
});

export type PolymarketClobSignedOrder = z.infer<
  typeof PolymarketClobSignedOrderSchema
>;

export const PolymarketClobPostOrderRequestSchema = z.object({
  order: PolymarketClobSignedOrderSchema,
  owner: z.string().min(1),
  orderType: PolymarketClobOrderTypeSchema.optional(),
  deferExec: z.boolean().optional(),
  postOnly: z.boolean().optional(),
});

export type PolymarketClobPostOrderRequest = z.infer<
  typeof PolymarketClobPostOrderRequestSchema
>;

export const PolymarketClobPostOrdersRequestSchema = z
  .array(PolymarketClobPostOrderRequestSchema)
  .min(1)
  .max(15);

export type PolymarketClobPostOrdersRequest = z.infer<
  typeof PolymarketClobPostOrdersRequestSchema
>;

export const PolymarketClobCancelOrderRequestSchema = z.object({
  orderID: z.string().min(1),
});

export type PolymarketClobCancelOrderRequest = z.infer<
  typeof PolymarketClobCancelOrderRequestSchema
>;

export const PolymarketClobCancelOrdersRequestSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(3000);

export type PolymarketClobCancelOrdersRequest = z.infer<
  typeof PolymarketClobCancelOrdersRequestSchema
>;

export const PolymarketClobCancelMarketOrdersRequestSchema = z.object({
  market: z.string().min(1),
  asset_id: z.string().min(1),
});

export type PolymarketClobCancelMarketOrdersRequest = z.infer<
  typeof PolymarketClobCancelMarketOrdersRequestSchema
>;

export const PolymarketClobBalanceAllowanceQuerySchema = z.object({
  asset_type: z.enum(["COLLATERAL", "CONDITIONAL"]),
  token_id: z.string().optional(),
  signature_type: PolymarketClobSignatureTypeSchema.optional(),
});

export type PolymarketClobBalanceAllowanceQuery = z.infer<
  typeof PolymarketClobBalanceAllowanceQuerySchema
>;

export const PolymarketClobUserOrdersQuerySchema = z.object({
  id: z.string().optional(),
  market: z.string().optional(),
  asset_id: z.string().optional(),
  next_cursor: z.string().optional(),
});

export type PolymarketClobUserOrdersQuery = z.infer<
  typeof PolymarketClobUserOrdersQuerySchema
>;

export const PolymarketClobUserTradesQuerySchema = z.object({
  id: z.string().optional(),
  maker_address: z.string().optional(),
  market: z.string().optional(),
  asset_id: z.string().optional(),
  before: z.string().optional(),
  after: z.string().optional(),
  next_cursor: z.string().optional(),
});

export type PolymarketClobUserTradesQuery = z.infer<
  typeof PolymarketClobUserTradesQuerySchema
>;

export const PolymarketClobNotificationsQuerySchema = z.object({
  signature_type: PolymarketClobSignatureTypeSchema,
});

export type PolymarketClobNotificationsQuery = z.infer<
  typeof PolymarketClobNotificationsQuerySchema
>;

export const PolymarketClobDropNotificationsQuerySchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type PolymarketClobDropNotificationsQuery = z.infer<
  typeof PolymarketClobDropNotificationsQuerySchema
>;

export const PolymarketClobOrderScoringQuerySchema = z.object({
  order_id: z.string().min(1),
});

export type PolymarketClobOrderScoringQuery = z.infer<
  typeof PolymarketClobOrderScoringQuerySchema
>;

export const PolymarketClobOrdersScoringQuerySchema = z.object({
  order_ids: z.array(z.string().min(1)).min(1),
});

export type PolymarketClobOrdersScoringQuery = z.infer<
  typeof PolymarketClobOrdersScoringQuerySchema
>;

export const PolymarketClobOrdersScoringRequestSchema = z
  .array(z.string().min(1))
  .min(1);

export type PolymarketClobOrdersScoringRequest = z.infer<
  typeof PolymarketClobOrdersScoringRequestSchema
>;

export const PolymarketClobHeartbeatRequestSchema = z.object({
  heartbeat_id: z.string(),
});

export type PolymarketClobHeartbeatRequest = z.infer<
  typeof PolymarketClobHeartbeatRequestSchema
>;
