import type { z } from "zod";
import type {
  SimpleFunctionsCandlesRequest,
  SimpleFunctionsFeaturedMarketsRequest,
  SimpleFunctionsMarketsRequest,
  SimpleFunctionsMoversRequest,
  SimpleFunctionsNoRequest,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsTicker,
  SimpleFunctionsTradesRequest,
} from "./zod";

export type {
  SimpleFunctionsModel,
  SimpleFunctionsMode,
  SimpleFunctionsMoverDirection,
  SimpleFunctionsMoverWindow,
  SimpleFunctionsNextActions,
  SimpleFunctionsNoRequest,
  SimpleFunctionsOptions,
  SimpleFunctionsCandlesRequest,
  SimpleFunctionsFeaturedMarketsRequest,
  SimpleFunctionsMarketsRequest,
  SimpleFunctionsMoversRequest,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsSource,
  SimpleFunctionsStrict,
  SimpleFunctionsTicker,
  SimpleFunctionsTradesRequest,
  SimpleFunctionsVenue,
} from "./zod";

export class SimpleFunctionsError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "SimpleFunctionsError";
    this.status = status;
    this.body = body ?? null;
  }
}

export interface SimpleFunctionsMarketMatch {
  title?: string;
  ticker?: string;
  slug?: string;
  price?: number;
  volume?: number;
  pageUrl?: string;
  apiUrl?: string;
  inspectUrl?: string;
  [key: string]: unknown;
}

export interface SimpleFunctionsAction {
  method?: string;
  url?: string;
  [key: string]: unknown;
}

export interface SimpleFunctionsNextActionsBlock {
  inspect?: SimpleFunctionsAction[];
  related?: SimpleFunctionsAction[];
  [key: string]: unknown;
}

export interface SimpleFunctionsQueryMeta {
  sources?: string[];
  mode?: string;
  latencyMs?: number;
  ts?: string;
  [key: string]: unknown;
}

export interface SimpleFunctionsQueryResponse {
  query: string;
  contextSuggestion?: string;
  answer?: string;
  keyFactors?: string[];
  kalshi?: SimpleFunctionsMarketMatch[];
  polymarket?: SimpleFunctionsMarketMatch[];
  traditional?: Array<Record<string, unknown>>;
  x?: Array<Record<string, unknown>>;
  content?: Array<Record<string, unknown>>;
  theses?: Array<Record<string, unknown>>;
  legislation?: Array<Record<string, unknown>>;
  meta?: SimpleFunctionsQueryMeta;
  nextActions?: SimpleFunctionsNextActionsBlock;
  [key: string]: unknown;
}

export interface SimpleFunctionsQueryMethod {
  (
    req: SimpleFunctionsQueryRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsQueryResponse>;
  schema: z.ZodType<SimpleFunctionsQueryRequest>;
}

export interface SimpleFunctionsHeartbeatResponse {
  markets_tracked: number;
  ws_clients: number;
  top_volume_market?: string;
  uptime_s: number;
  generated_at: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsDataMarket {
  ticker: string;
  venue?: string;
  title?: string;
  lastPrice?: number;
  volume24h?: number;
  closeTime?: number;
  bestBid?: number;
  bestAsk?: number;
  heat?: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsMarketsResponse {
  markets?: SimpleFunctionsDataMarket[];
  count?: number;
  generated_at?: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsSearchResult {
  ticker: string;
  venue?: string;
  title?: string;
  lastPrice?: number;
  volume24h?: number;
  score?: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsSearchResponse {
  query: string;
  results: SimpleFunctionsSearchResult[];
  [key: string]: unknown;
}

export interface SimpleFunctionsSnapshotMarket {
  ticker: string;
  venue?: string;
  last?: number;
  bid?: number;
  ask?: number;
  vol24h?: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsSnapshotResponse {
  generated_at: number;
  count: number;
  markets: SimpleFunctionsSnapshotMarket[];
  [key: string]: unknown;
}

export interface SimpleFunctionsMover extends SimpleFunctionsDataMarket {
  change?: number;
  changeAbs?: number;
  window?: string;
}

export interface SimpleFunctionsMoversResponse {
  window?: string;
  count?: number;
  movers?: SimpleFunctionsMover[];
  markets?: SimpleFunctionsMover[];
  generated_at?: number;
  [key: string]: unknown;
}

export type SimpleFunctionsBookLevel = [price: number, size: number];

export interface SimpleFunctionsOrderbookResponse {
  ticker: string;
  bids: SimpleFunctionsBookLevel[];
  asks: SimpleFunctionsBookLevel[];
  ts: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsCandlesResponse {
  ticker: string;
  timeframe: string;
  candles: SimpleFunctionsCandle[];
  [key: string]: unknown;
}

export interface SimpleFunctionsTrade {
  ticker: string;
  venue?: string;
  price: number;
  size: number;
  side?: string;
  ts: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsTradesResponse {
  ticker: string;
  trades: SimpleFunctionsTrade[];
  [key: string]: unknown;
}

export interface SimpleFunctionsHeartbeatMethod {
  (signal?: AbortSignal): Promise<SimpleFunctionsHeartbeatResponse>;
  schema: z.ZodType<SimpleFunctionsNoRequest>;
}

export interface SimpleFunctionsMarketsMethod {
  (
    req?: SimpleFunctionsMarketsRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsMarketsResponse>;
  featured: SimpleFunctionsFeaturedMarketsMethod;
  retrieve: SimpleFunctionsMarketRetrieveMethod;
  schema: z.ZodType<SimpleFunctionsMarketsRequest>;
}

export interface SimpleFunctionsFeaturedMarketsMethod {
  (
    req?: SimpleFunctionsFeaturedMarketsRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsMarketsResponse>;
  schema: z.ZodType<SimpleFunctionsFeaturedMarketsRequest>;
}

export interface SimpleFunctionsMarketRetrieveMethod {
  (
    ticker: SimpleFunctionsTicker,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsDataMarket>;
  schema: z.ZodType<SimpleFunctionsTicker>;
}

export interface SimpleFunctionsSearchMethod {
  (
    req: SimpleFunctionsSearchRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsSearchResponse>;
  schema: z.ZodType<SimpleFunctionsSearchRequest>;
}

export interface SimpleFunctionsSnapshotMethod {
  (signal?: AbortSignal): Promise<SimpleFunctionsSnapshotResponse>;
  schema: z.ZodType<SimpleFunctionsNoRequest>;
}

export interface SimpleFunctionsMoversMethod {
  (
    req?: SimpleFunctionsMoversRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsMoversResponse>;
  schema: z.ZodType<SimpleFunctionsMoversRequest>;
}

export interface SimpleFunctionsOrderbookMethod {
  (
    ticker: SimpleFunctionsTicker,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsOrderbookResponse>;
  schema: z.ZodType<SimpleFunctionsTicker>;
}

export interface SimpleFunctionsCandlesMethod {
  (
    ticker: SimpleFunctionsTicker,
    req?: SimpleFunctionsCandlesRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsCandlesResponse>;
  schema: z.ZodType<SimpleFunctionsCandlesRequest>;
}

export interface SimpleFunctionsTradesMethod {
  (
    ticker: SimpleFunctionsTicker,
    req?: SimpleFunctionsTradesRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsTradesResponse>;
  schema: z.ZodType<SimpleFunctionsTradesRequest>;
}

export interface SimpleFunctionsApiPublicNamespace {
  query: SimpleFunctionsQueryMethod;
}

export interface SimpleFunctionsApiNamespace {
  public: SimpleFunctionsApiPublicNamespace;
}

export interface SimpleFunctionsDataV1Namespace {
  heartbeat: SimpleFunctionsHeartbeatMethod;
  markets: SimpleFunctionsMarketsMethod;
  search: SimpleFunctionsSearchMethod;
  snapshot: SimpleFunctionsSnapshotMethod;
  movers: SimpleFunctionsMoversMethod;
  orderbook: SimpleFunctionsOrderbookMethod;
  candles: SimpleFunctionsCandlesMethod;
  trades: SimpleFunctionsTradesMethod;
}

export interface SimpleFunctionsDataNamespace {
  v1: SimpleFunctionsDataV1Namespace;
}

export interface SimpleFunctionsGetNamespace {
  api: SimpleFunctionsApiNamespace;
  data: SimpleFunctionsDataNamespace;
}

export interface SimpleFunctionsProvider {
  api: SimpleFunctionsApiNamespace;
  data: SimpleFunctionsDataNamespace;
  get: SimpleFunctionsGetNamespace;
}
