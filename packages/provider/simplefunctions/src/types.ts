import type { z } from "zod";
import type {
  SimpleFunctionsAgentFeedRequest,
  SimpleFunctionsBillRequest,
  SimpleFunctionsBriefingRequest,
  SimpleFunctionsCalendarRequest,
  SimpleFunctionsCalibrationRequest,
  SimpleFunctionsBodyRequest,
  SimpleFunctionsCandlesRequest,
  SimpleFunctionsChangesRequest,
  SimpleFunctionsCongressMemberRequest,
  SimpleFunctionsCongressMembersRequest,
  SimpleFunctionsContextRequest,
  SimpleFunctionsContagionRequest,
  SimpleFunctionsCrossVenueRequest,
  SimpleFunctionsDiscussRequest,
  SimpleFunctionsEconQueryRequest,
  SimpleFunctionsEdgesRequest,
  SimpleFunctionsEmptyRequest,
  SimpleFunctionsFeaturedMarketsRequest,
  SimpleFunctionsFredRequest,
  SimpleFunctionsGovQueryRequest,
  SimpleFunctionsIdRequest,
  SimpleFunctionsIdeaRequest,
  SimpleFunctionsIndexHistoryRequest,
  SimpleFunctionsInspectRequest,
  SimpleFunctionsLegislationRequest,
  SimpleFunctionsMarketCandlesRequest,
  SimpleFunctionsMarketDetailRequest,
  SimpleFunctionsMarketsRequest,
  SimpleFunctionsMicrostructureHistoryRequest,
  SimpleFunctionsMoversRequest,
  SimpleFunctionsNoRequest,
  SimpleFunctionsOptionalQueryRequest,
  SimpleFunctionsOddsRequest,
  SimpleFunctionsPositionRequest,
  SimpleFunctionsPublicListRequest,
  SimpleFunctionsPublicSearchRequest,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsRecordRequest,
  SimpleFunctionsRegimeScanRequest,
  SimpleFunctionsScanRequest,
  SimpleFunctionsScreenByTickersRequest,
  SimpleFunctionsScreenRequest,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsSlugRequest,
  SimpleFunctionsStrategyRequest,
  SimpleFunctionsTicker,
  SimpleFunctionsTickerPathRequest,
  SimpleFunctionsTickerRequest,
  SimpleFunctionsTokenRequest,
  SimpleFunctionsTradesRequest,
  SimpleFunctionsTransportRequest,
  SimpleFunctionsWorldDeltaRequest,
  SimpleFunctionsWorldPathRequest,
  SimpleFunctionsWorldRequest,
  SimpleFunctionsYieldCurveRequest,
} from "./zod";

export type {
  SimpleFunctionsAgentFeedRequest,
  SimpleFunctionsAgentFeedParsedRequest,
  SimpleFunctionsBillRequest,
  SimpleFunctionsBillParsedRequest,
  SimpleFunctionsBriefingRequest,
  SimpleFunctionsBriefingParsedRequest,
  SimpleFunctionsCalendarRequest,
  SimpleFunctionsCalendarParsedRequest,
  SimpleFunctionsCalibrationPeriod,
  SimpleFunctionsCalibrationRequest,
  SimpleFunctionsCalibrationParsedRequest,
  SimpleFunctionsCalibrationSource,
  SimpleFunctionsBodyRequest,
  SimpleFunctionsBodyParsedRequest,
  SimpleFunctionsCandlesRequest,
  SimpleFunctionsCandlesParsedRequest,
  SimpleFunctionsChangesRequest,
  SimpleFunctionsChangesParsedRequest,
  SimpleFunctionsCongressMemberRequest,
  SimpleFunctionsCongressMemberParsedRequest,
  SimpleFunctionsCongressMembersRequest,
  SimpleFunctionsCongressMembersParsedRequest,
  SimpleFunctionsContextRequest,
  SimpleFunctionsContextParsedRequest,
  SimpleFunctionsContagionRequest,
  SimpleFunctionsContagionParsedRequest,
  SimpleFunctionsCrossVenueRequest,
  SimpleFunctionsCrossVenueParsedRequest,
  SimpleFunctionsDiscussRequest,
  SimpleFunctionsDiscussParsedRequest,
  SimpleFunctionsEconQueryRequest,
  SimpleFunctionsEconQueryParsedRequest,
  SimpleFunctionsEdgesRequest,
  SimpleFunctionsEdgesParsedRequest,
  SimpleFunctionsEmptyRequest,
  SimpleFunctionsEmptyParsedRequest,
  SimpleFunctionsFeaturedMarketsRequest,
  SimpleFunctionsFeaturedMarketsParsedRequest,
  SimpleFunctionsFormat,
  SimpleFunctionsFredRequest,
  SimpleFunctionsFredParsedRequest,
  SimpleFunctionsGovQueryRequest,
  SimpleFunctionsGovQueryParsedRequest,
  SimpleFunctionsGovSource,
  SimpleFunctionsIdRequest,
  SimpleFunctionsIdParsedRequest,
  SimpleFunctionsIdeaRequest,
  SimpleFunctionsIdeaParsedRequest,
  SimpleFunctionsIndexHistoryRequest,
  SimpleFunctionsIndexHistoryParsedRequest,
  SimpleFunctionsInspectRequest,
  SimpleFunctionsInspectParsedRequest,
  SimpleFunctionsLegislationRequest,
  SimpleFunctionsLegislationParsedRequest,
  SimpleFunctionsMarketCandlesRequest,
  SimpleFunctionsMarketCandlesParsedRequest,
  SimpleFunctionsMarketDetailRequest,
  SimpleFunctionsMarketDetailParsedRequest,
  SimpleFunctionsMarketTimeframe,
  SimpleFunctionsMarketsRequest,
  SimpleFunctionsMarketsParsedRequest,
  SimpleFunctionsMicrostructureHistoryRequest,
  SimpleFunctionsMicrostructureHistoryParsedRequest,
  SimpleFunctionsModel,
  SimpleFunctionsMode,
  SimpleFunctionsMoverDirection,
  SimpleFunctionsMoverWindow,
  SimpleFunctionsMoversRequest,
  SimpleFunctionsMoversParsedRequest,
  SimpleFunctionsNextActions,
  SimpleFunctionsNoRequest,
  SimpleFunctionsNoParsedRequest,
  SimpleFunctionsOptionalQueryRequest,
  SimpleFunctionsOptionalQueryParsedRequest,
  SimpleFunctionsOddsBand,
  SimpleFunctionsOddsRequest,
  SimpleFunctionsOddsParsedRequest,
  SimpleFunctionsOptions,
  SimpleFunctionsPositionRequest,
  SimpleFunctionsPositionParsedRequest,
  SimpleFunctionsPublicListRequest,
  SimpleFunctionsPublicListParsedRequest,
  SimpleFunctionsPublicSearchRequest,
  SimpleFunctionsPublicSearchParsedRequest,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsQueryParsedRequest,
  SimpleFunctionsRecordRequest,
  SimpleFunctionsRecordParsedRequest,
  SimpleFunctionsRegimeScanRequest,
  SimpleFunctionsRegimeScanParsedRequest,
  SimpleFunctionsScanRequest,
  SimpleFunctionsScanParsedRequest,
  SimpleFunctionsScreenByTickersRequest,
  SimpleFunctionsScreenByTickersParsedRequest,
  SimpleFunctionsScreenRequest,
  SimpleFunctionsScreenParsedRequest,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsSearchParsedRequest,
  SimpleFunctionsSource,
  SimpleFunctionsStrict,
  SimpleFunctionsSlugRequest,
  SimpleFunctionsSlugParsedRequest,
  SimpleFunctionsStrategyRequest,
  SimpleFunctionsStrategyParsedRequest,
  SimpleFunctionsTicker,
  SimpleFunctionsTickerPathRequest,
  SimpleFunctionsTickerPathParsedRequest,
  SimpleFunctionsTickerRequest,
  SimpleFunctionsTickerParsedRequest,
  SimpleFunctionsTokenRequest,
  SimpleFunctionsTokenParsedRequest,
  SimpleFunctionsTradesRequest,
  SimpleFunctionsTradesParsedRequest,
  SimpleFunctionsTransportRequest,
  SimpleFunctionsTransportParsedRequest,
  SimpleFunctionsVenue,
  SimpleFunctionsWorldDeltaRequest,
  SimpleFunctionsWorldDeltaParsedRequest,
  SimpleFunctionsWorldOperation,
  SimpleFunctionsWorldPathRequest,
  SimpleFunctionsWorldPathParsedRequest,
  SimpleFunctionsWorldRequest,
  SimpleFunctionsWorldParsedRequest,
  SimpleFunctionsYieldCurveRequest,
  SimpleFunctionsYieldCurveParsedRequest,
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

export interface SimpleFunctionsWorldSnapshotResponse {
  region?: Record<string, unknown>;
  regime?: Record<string, unknown>;
  salient?: Array<Record<string, unknown>>;
  index?: Record<string, unknown>;
  traditional?: Array<Record<string, unknown>>;
  movers?: Array<Record<string, unknown>>;
  opportunities?: Array<Record<string, unknown>>;
  stableAnchors?: Array<Record<string, unknown>>;
  divergences?: Array<Record<string, unknown>>;
  regimeSummary?: Record<string, unknown>;
  portfolio?: Record<string, unknown>;
  marketCount?: number;
  servedAt?: string;
  [key: string]: unknown;
}

export interface SimpleFunctionsWorldDeltaResponse {
  from?: string;
  to?: string;
  changes?: Array<Record<string, unknown>>;
  markdown?: string;
  latencyMs?: number;
  indexDelta?: Record<string, unknown>;
  movers?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SimpleFunctionsInspectResponse {
  ticker?: string;
  venue?: string;
  title?: string;
  price?: number;
  bestBid?: number;
  bestAsk?: number;
  volume24h?: number;
  openInterest?: number;
  status?: string;
  suggestion?: Record<string, unknown>;
  regime?: Record<string, unknown>;
  indicators?: Record<string, unknown>;
  edges?: Array<Record<string, unknown>>;
  crossVenue?: Array<Record<string, unknown>>;
  contagion?: Array<Record<string, unknown>>;
  diff24h?: Record<string, unknown>;
  trend7d?: Record<string, unknown> | Array<Record<string, unknown>>;
  legislation?: Record<string, unknown> | Array<Record<string, unknown>>;
  nextActions?: Record<string, unknown>;
  latencyMs?: number;
  [key: string]: unknown;
}

export interface SimpleFunctionsTopicFeedResponse {
  topic?: string;
  items?: Array<Record<string, unknown>>;
  markdown?: string;
  [key: string]: unknown;
}

export type SimpleFunctionsWorldResponse =
  | SimpleFunctionsWorldSnapshotResponse
  | string;

export type SimpleFunctionsWorldDeltaResult =
  | SimpleFunctionsWorldDeltaResponse
  | string;

export type SimpleFunctionsInspectResult =
  | SimpleFunctionsInspectResponse
  | string;

export type SimpleFunctionsTopicFeedResult =
  | SimpleFunctionsTopicFeedResponse
  | string;

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

export interface SimpleFunctionsMarketDepthLevelObject {
  price: number;
  size: number;
  [key: string]: unknown;
}

export type SimpleFunctionsMarketDepthLevel =
  | [price: number, size: number]
  | SimpleFunctionsMarketDepthLevelObject;

export interface SimpleFunctionsMarketIndicators {
  tauDays?: number | null;
  iyYes?: number | null;
  iyNo?: number | null;
  cri?: number | null;
  ee?: number | null;
  eeSource?: string | null;
  las?: number | null;
  cvr?: number | null;
  overround?: number | null;
  rv?: number | null;
  vr?: number | null;
  iar?: number | null;
  adjIy?: number | null;
  daysToEvent?: number | null;
  expectedVr?: number | null;
  residualVr?: number | null;
  hasThesis?: boolean | null;
  hasOrderbook?: boolean | null;
  lastComputedAt?: string | null;
  [key: string]: unknown;
}

export interface SimpleFunctionsMarketRegime {
  label?: "maker" | "taker" | "neutral";
  score?: number | null;
  adverseSelection?: number | null;
  adverseSelectionScore?: number | null;
  signals?: Record<string, unknown>;
  freshness?: string | number | Record<string, unknown> | null;
  fresh?: boolean | null;
  computedAt?: string | null;
  lastComputedAt?: string | null;
  [key: string]: unknown;
}

export interface SimpleFunctionsMarketDetailResponse {
  ticker: string;
  venue?: string;
  title?: string;
  description?: string | null;
  price?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  volume?: number;
  volume24h?: number;
  openInterest?: number;
  status?: string;
  closeTime?: string | number;
  category?: string;
  liquidityScore?: number | string;
  slug?: string;
  bidLevels?: SimpleFunctionsMarketDepthLevel[];
  askLevels?: SimpleFunctionsMarketDepthLevel[];
  edges?: Array<Record<string, unknown>>;
  indicators?: SimpleFunctionsMarketIndicators | null;
  crossVenue?: Array<Record<string, unknown>> | Record<string, unknown> | null;
  regime?: SimpleFunctionsMarketRegime | null;
  pageUrl?: string;
  apiUrl?: string;
  inspectUrl?: string;
  fetchedAt?: string;
  nextActions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SimpleFunctionsMarketIndicatorHistoryRow extends SimpleFunctionsMarketIndicators {
  at?: string | number;
  ts?: string | number;
  t?: string | number;
  timestamp?: string | number;
  fetchedAt?: string;
  price?: number;
  delta?: number;
  iy?: number | null;
}

export interface SimpleFunctionsMarketRegimeHistoryRow extends SimpleFunctionsMarketRegime {
  at?: string | number;
  ts?: string | number;
  t?: string | number;
  timestamp?: string | number;
  fetchedAt?: string;
  spreadCents?: number;
  bidDepthUsd?: number | null;
  askDepthUsd?: number | null;
  volume24h?: number | null;
}

export interface SimpleFunctionsMarketHistoryResponse {
  ticker?: string;
  windowDays?: number;
  indicatorHistory: SimpleFunctionsMarketIndicatorHistoryRow[];
  regimeHistory: SimpleFunctionsMarketRegimeHistoryRow[];
  indicatorCount?: number;
  regimeCount?: number;
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

export interface SimpleFunctionsWorldPathMethod {
  (
    req: SimpleFunctionsWorldPathRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsWorldResponse>;
  schema: z.ZodType<SimpleFunctionsWorldPathRequest>;
}

export interface SimpleFunctionsWorldDeltaMethod {
  (
    req: SimpleFunctionsWorldDeltaRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsWorldDeltaResult>;
  schema: z.ZodType<SimpleFunctionsWorldDeltaRequest>;
}

export interface SimpleFunctionsWorldFeedMethod {
  (signal?: AbortSignal): Promise<string>;
  schema: z.ZodType<SimpleFunctionsNoRequest>;
}

export interface SimpleFunctionsWorldMethod {
  (
    req?: SimpleFunctionsWorldRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsWorldResponse>;
  schema: z.ZodType<SimpleFunctionsWorldRequest>;
  path: SimpleFunctionsWorldPathMethod;
  delta: SimpleFunctionsWorldDeltaMethod;
  feed: SimpleFunctionsWorldFeedMethod;
}

export interface SimpleFunctionsInspectMethod {
  (
    req: SimpleFunctionsInspectRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsInspectResult>;
  schema: z.ZodType<SimpleFunctionsInspectRequest>;
}

export interface SimpleFunctionsAgentFeedMethod {
  (
    req: SimpleFunctionsAgentFeedRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsTopicFeedResult>;
  schema: z.ZodType<SimpleFunctionsAgentFeedRequest>;
}

export type SimpleFunctionsJsonResponse = Record<string, unknown>;

export interface SimpleFunctionsMarketDetailMethod {
  (
    req: SimpleFunctionsMarketDetailRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsMarketDetailResponse>;
  schema: z.ZodType<SimpleFunctionsMarketDetailRequest>;
  responseSchema: z.ZodType<SimpleFunctionsMarketDetailResponse>;
}

export interface SimpleFunctionsMarketHistoryMethod {
  (
    req: SimpleFunctionsTickerRequest,
    signal?: AbortSignal
  ): Promise<SimpleFunctionsMarketHistoryResponse>;
  schema: z.ZodType<SimpleFunctionsTickerRequest>;
  responseSchema: z.ZodType<SimpleFunctionsMarketHistoryResponse>;
}

export interface SimpleFunctionsMethod<
  TRequest,
  TResponse = SimpleFunctionsJsonResponse,
> {
  (req: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
}

export interface SimpleFunctionsOptionalMethod<
  TRequest,
  TResponse = SimpleFunctionsJsonResponse,
> {
  (req?: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
}

export interface SimpleFunctionsTextMethod<TRequest> {
  (req: TRequest, signal?: AbortSignal): Promise<string>;
  schema: z.ZodType<TRequest>;
}

export interface SimpleFunctionsOptionalTextMethod<TRequest> {
  (req?: TRequest, signal?: AbortSignal): Promise<string>;
  schema: z.ZodType<TRequest>;
}

export interface SimpleFunctionsRawMethod<TRequest> {
  (req: TRequest, signal?: AbortSignal): Promise<Response>;
  schema: z.ZodType<TRequest>;
}

export interface SimpleFunctionsKeysMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  create: SimpleFunctionsMethod<SimpleFunctionsBodyRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsAuthCliMethod extends SimpleFunctionsMethod<SimpleFunctionsBodyRequest> {
  poll: SimpleFunctionsMethod<SimpleFunctionsTokenRequest>;
  complete: SimpleFunctionsMethod<SimpleFunctionsBodyRequest>;
}

export interface SimpleFunctionsThesisPositionsNamespace {
  list: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  create: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsPositionRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsPositionRequest>;
}

export interface SimpleFunctionsThesisStrategiesNamespace {
  list: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  create: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsStrategyRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsStrategyRequest>;
}

export interface SimpleFunctionsThesisHeartbeatNamespace {
  get: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsThesisVideosNamespace {
  list: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  create: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsThesisMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  create: SimpleFunctionsMethod<SimpleFunctionsBodyRequest>;
  retrieve: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  byTicker: SimpleFunctionsMethod<SimpleFunctionsTickerPathRequest>;
  signal: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  evaluate: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  augment: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  nodes: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  fork: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  whatif: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  context: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  changes: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  prompt: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  evaluations: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  heartbeat: SimpleFunctionsThesisHeartbeatNamespace;
  positions: SimpleFunctionsThesisPositionsNamespace;
  strategies: SimpleFunctionsThesisStrategiesNamespace;
  publish: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  unpublish: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  videos: SimpleFunctionsThesisVideosNamespace;
  videoData: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsPortfolioResourceMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  update: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
}

export interface SimpleFunctionsPortfolioRowsMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  retrieve: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
}

export interface SimpleFunctionsPortfolioLedgerImportNamespace {
  kalshi: SimpleFunctionsMethod<SimpleFunctionsRecordRequest> & {
    pull: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  };
  polymarket: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
}

export interface SimpleFunctionsPortfolioLedgerMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  import: SimpleFunctionsPortfolioLedgerImportNamespace;
}

export interface SimpleFunctionsPortfolioCrudBodyMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
}

export interface SimpleFunctionsPortfolioSecretsMethod {
  create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  delete: SimpleFunctionsOptionalMethod<SimpleFunctionsRecordRequest>;
}

export interface SimpleFunctionsPortfolioNamespace {
  state: SimpleFunctionsPortfolioResourceMethod;
  config: SimpleFunctionsPortfolioResourceMethod;
  ticks: SimpleFunctionsPortfolioRowsMethod;
  trades: SimpleFunctionsPortfolioRowsMethod;
  ledger: SimpleFunctionsPortfolioLedgerMethod;
  fills: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  positions: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  activity: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  attribution: {
    daily: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
    grouped: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  };
  risk: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  views: SimpleFunctionsPortfolioCrudBodyMethod;
  strategy: SimpleFunctionsPortfolioCrudBodyMethod;
  secrets: SimpleFunctionsPortfolioSecretsMethod;
  trigger: SimpleFunctionsOptionalMethod<SimpleFunctionsRecordRequest>;
}

export interface SimpleFunctionsIntentsMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  retrieve: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsRuntimeExecMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  trigger: SimpleFunctionsOptionalMethod<SimpleFunctionsRecordRequest>;
}

export interface SimpleFunctionsWatchedObjectsMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  identify: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  retrieve: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  refresh: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsAlertRulesMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  retrieve: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  test: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsWebhookEndpointsMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest> {
  create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  test: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsMcpMethod extends SimpleFunctionsTextMethod<SimpleFunctionsTransportRequest> {
  call: SimpleFunctionsMethod<SimpleFunctionsTransportRequest>;
}

export interface SimpleFunctionsProxyNamespace {
  tts: SimpleFunctionsRawMethod<SimpleFunctionsBodyRequest>;
  stt: SimpleFunctionsRawMethod<SimpleFunctionsBodyRequest>;
}

export interface SimpleFunctionsXNamespace {
  search: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  volume: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  news: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  account: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
}

export interface SimpleFunctionsMarketWatchPanelsMethod {
  create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
  reorder: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  run: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
}

export interface SimpleFunctionsDashboard2Namespace {
  marketWatchV2: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  marketWatch: {
    panels: SimpleFunctionsMarketWatchPanelsMethod;
  };
}

export interface SimpleFunctionsMarketMethod extends SimpleFunctionsMarketDetailMethod {
  history: SimpleFunctionsMarketHistoryMethod;
  candles: SimpleFunctionsMethod<SimpleFunctionsMarketCandlesRequest>;
}

export interface SimpleFunctionsIndexMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsEmptyRequest> {
  history: SimpleFunctionsOptionalMethod<SimpleFunctionsIndexHistoryRequest>;
}

export interface SimpleFunctionsYieldCurvesMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsEmptyRequest> {
  event: SimpleFunctionsMethod<SimpleFunctionsYieldCurveRequest>;
}

export interface SimpleFunctionsLegislationMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsLegislationRequest> {
  byBillId: SimpleFunctionsMethod<SimpleFunctionsBillRequest>;
}

export interface SimpleFunctionsGlossaryMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest> {
  entry: SimpleFunctionsMethod<SimpleFunctionsSlugRequest>;
}

export interface SimpleFunctionsOpinionsMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest> {
  entry: SimpleFunctionsMethod<SimpleFunctionsSlugRequest>;
}

export interface SimpleFunctionsTechnicalsMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest> {
  entry: SimpleFunctionsMethod<SimpleFunctionsSlugRequest>;
}

export interface SimpleFunctionsIdeasMethod extends SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest> {
  byId: SimpleFunctionsMethod<SimpleFunctionsIdeaRequest>;
}

export interface SimpleFunctionsApiPublicNamespace {
  query: SimpleFunctionsQueryMethod;
  market: SimpleFunctionsMarketMethod;
  markets: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  newmarkets: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  scan: SimpleFunctionsOptionalMethod<SimpleFunctionsScanRequest>;
  screen: SimpleFunctionsOptionalMethod<SimpleFunctionsScreenRequest>;
  screenByTickers: SimpleFunctionsMethod<SimpleFunctionsScreenByTickersRequest>;
  search: SimpleFunctionsMethod<SimpleFunctionsPublicSearchRequest>;
  liveTickers: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  marketMicrostructureHistory: SimpleFunctionsMethod<SimpleFunctionsMicrostructureHistoryRequest>;
  crossVenue: {
    pairs: SimpleFunctionsOptionalMethod<SimpleFunctionsCrossVenueRequest>;
    stats: SimpleFunctionsOptionalMethod<SimpleFunctionsCrossVenueRequest>;
  };
  index: SimpleFunctionsIndexMethod;
  regime: {
    scan: SimpleFunctionsOptionalMethod<SimpleFunctionsRegimeScanRequest>;
  };
  odds: SimpleFunctionsOptionalMethod<SimpleFunctionsOddsRequest>;
  oddsMd: SimpleFunctionsOptionalMethod<SimpleFunctionsOddsRequest, string>;
  calendar: SimpleFunctionsOptionalMethod<SimpleFunctionsCalendarRequest>;
  yieldCurves: SimpleFunctionsYieldCurvesMethod;
  liquidityByTheme: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  contagion: SimpleFunctionsOptionalMethod<SimpleFunctionsContagionRequest>;
  queryGov: SimpleFunctionsMethod<SimpleFunctionsGovQueryRequest>;
  legislation: SimpleFunctionsLegislationMethod;
  congress: {
    members: SimpleFunctionsOptionalMethod<SimpleFunctionsCongressMembersRequest>;
    member: SimpleFunctionsMethod<SimpleFunctionsCongressMemberRequest>;
  };
  queryEcon: SimpleFunctionsMethod<SimpleFunctionsEconQueryRequest>;
  fred: SimpleFunctionsMethod<SimpleFunctionsFredRequest>;
  databento: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  tradMarkets: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  context: SimpleFunctionsOptionalMethod<SimpleFunctionsContextRequest>;
  briefing: SimpleFunctionsOptionalMethod<SimpleFunctionsBriefingRequest>;
  topic: SimpleFunctionsMethod<SimpleFunctionsSlugRequest>;
  answer: SimpleFunctionsMethod<SimpleFunctionsSlugRequest>;
  glossary: SimpleFunctionsGlossaryMethod;
  guide: SimpleFunctionsOptionalMethod<SimpleFunctionsEmptyRequest>;
  highlights: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  diff: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  discuss: SimpleFunctionsMethod<SimpleFunctionsDiscussRequest>;
  skills: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  skill: SimpleFunctionsMethod<SimpleFunctionsSlugRequest>;
  theses: SimpleFunctionsOptionalMethod<SimpleFunctionsPublicListRequest>;
  thesis: SimpleFunctionsMethod<SimpleFunctionsSlugRequest>;
  opinions: SimpleFunctionsOpinionsMethod;
  technicals: SimpleFunctionsTechnicalsMethod;
  ideas: SimpleFunctionsIdeasMethod;
  calibration: SimpleFunctionsOptionalMethod<SimpleFunctionsCalibrationRequest>;
}

export interface SimpleFunctionsApiAgentNamespace {
  world: SimpleFunctionsWorldMethod;
  inspect: SimpleFunctionsInspectMethod;
  feed: SimpleFunctionsAgentFeedMethod;
}

export interface SimpleFunctionsApiNamespace {
  agent: SimpleFunctionsApiAgentNamespace;
  auth: {
    cli: SimpleFunctionsAuthCliMethod;
  };
  calibration: SimpleFunctionsOptionalMethod<SimpleFunctionsCalibrationRequest>;
  changes: SimpleFunctionsOptionalMethod<SimpleFunctionsChangesRequest>;
  contracts: {
    tools: SimpleFunctionsOptionalMethod<SimpleFunctionsEmptyRequest>;
  };
  dashboard: {
    usage: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  };
  dashboard2: SimpleFunctionsDashboard2Namespace;
  edges: SimpleFunctionsOptionalMethod<SimpleFunctionsEdgesRequest>;
  feed: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  intents: SimpleFunctionsIntentsMethod;
  keys: SimpleFunctionsKeysMethod;
  mcp: SimpleFunctionsMcpMethod;
  portfolio: SimpleFunctionsPortfolioNamespace;
  prompt: SimpleFunctionsOptionalMethod<SimpleFunctionsEmptyRequest>;
  proxy: SimpleFunctionsProxyNamespace;
  public: SimpleFunctionsApiPublicNamespace;
  runtime: {
    exec: SimpleFunctionsRuntimeExecMethod;
  };
  signup: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
  skills: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  thesis: SimpleFunctionsThesisMethod;
  tools: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  watch: SimpleFunctionsWatchedObjectsMethod;
  alertRules: SimpleFunctionsAlertRulesMethod;
  webhookEndpoints: SimpleFunctionsWebhookEndpointsMethod;
  alertDeliveries: SimpleFunctionsOptionalMethod<SimpleFunctionsOptionalQueryRequest>;
  x: SimpleFunctionsXNamespace;
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

export interface SimpleFunctionsPostNamespace {
  api: {
    auth: {
      cli: SimpleFunctionsAuthCliMethod;
    };
    dashboard2: {
      marketWatch: {
        panels: {
          create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
          reorder: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
          run: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
        };
      };
    };
    intents: {
      create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
    };
    keys: {
      create: SimpleFunctionsMethod<SimpleFunctionsBodyRequest>;
    };
    mcp: {
      call: SimpleFunctionsMethod<SimpleFunctionsTransportRequest>;
    };
    portfolio: {
      ledger: {
        import: SimpleFunctionsPortfolioLedgerImportNamespace;
      };
      secrets: {
        create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
      strategy: {
        create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
      ticks: {
        create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
      trades: {
        create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
      trigger: SimpleFunctionsOptionalMethod<SimpleFunctionsRecordRequest>;
      views: {
        create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
    };
    proxy: SimpleFunctionsProxyNamespace;
    public: {
      discuss: SimpleFunctionsMethod<SimpleFunctionsDiscussRequest>;
    };
    runtime: {
      exec: {
        trigger: SimpleFunctionsOptionalMethod<SimpleFunctionsRecordRequest>;
      };
    };
    signup: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
    thesis: {
      create: SimpleFunctionsMethod<SimpleFunctionsBodyRequest>;
      signal: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      evaluate: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      augment: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      nodes: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      fork: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      whatif: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      positions: {
        create: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      };
      strategies: {
        create: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      };
      publish: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      videos: {
        create: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      };
    };
    watch: {
      create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      identify: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      refresh: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    alertRules: {
      create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      test: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    webhookEndpoints: {
      create: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      test: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
  };
}

export interface SimpleFunctionsPutNamespace {
  api: {
    portfolio: {
      config: {
        update: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
      state: {
        update: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
      strategy: {
        update: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
      views: {
        update: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
    };
  };
}

export interface SimpleFunctionsPatchNamespace {
  api: {
    dashboard2: {
      marketWatch: {
        panels: {
          update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
        };
      };
    };
    intents: {
      update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    thesis: {
      update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      heartbeat: {
        update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      };
      positions: {
        update: SimpleFunctionsMethod<SimpleFunctionsPositionRequest>;
      };
      strategies: {
        update: SimpleFunctionsMethod<SimpleFunctionsStrategyRequest>;
      };
    };
    watch: {
      update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    alertRules: {
      update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    webhookEndpoints: {
      update: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
  };
}

export interface SimpleFunctionsDeleteNamespace {
  api: {
    dashboard2: {
      marketWatch: {
        panels: {
          delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
        };
      };
    };
    intents: {
      delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    keys: {
      delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    portfolio: {
      secrets: {
        delete: SimpleFunctionsOptionalMethod<SimpleFunctionsRecordRequest>;
      };
      strategy: {
        delete: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
      views: {
        delete: SimpleFunctionsMethod<SimpleFunctionsRecordRequest>;
      };
    };
    thesis: {
      delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      unpublish: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
      positions: {
        delete: SimpleFunctionsMethod<SimpleFunctionsPositionRequest>;
      };
      strategies: {
        delete: SimpleFunctionsMethod<SimpleFunctionsStrategyRequest>;
      };
    };
    watch: {
      delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    alertRules: {
      delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
    webhookEndpoints: {
      delete: SimpleFunctionsMethod<SimpleFunctionsIdRequest>;
    };
  };
}

export interface SimpleFunctionsProvider {
  api: SimpleFunctionsApiNamespace;
  data: SimpleFunctionsDataNamespace;
  get: SimpleFunctionsGetNamespace;
  post: SimpleFunctionsPostNamespace;
  put: SimpleFunctionsPutNamespace;
  patch: SimpleFunctionsPatchNamespace;
  delete: SimpleFunctionsDeleteNamespace;
}
