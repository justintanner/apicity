import type { z } from "zod";
import type {
  SimpleFunctionsAgentFeedRequest,
  SimpleFunctionsBillRequest,
  SimpleFunctionsBriefingRequest,
  SimpleFunctionsCalendarRequest,
  SimpleFunctionsCalibrationRequest,
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
  SimpleFunctionsOddsRequest,
  SimpleFunctionsPublicListRequest,
  SimpleFunctionsPublicSearchRequest,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsRegimeScanRequest,
  SimpleFunctionsScanRequest,
  SimpleFunctionsScreenByTickersRequest,
  SimpleFunctionsScreenRequest,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsSlugRequest,
  SimpleFunctionsTicker,
  SimpleFunctionsTickerRequest,
  SimpleFunctionsTradesRequest,
  SimpleFunctionsWorldDeltaRequest,
  SimpleFunctionsWorldPathRequest,
  SimpleFunctionsWorldRequest,
  SimpleFunctionsYieldCurveRequest,
} from "./zod";

export type {
  SimpleFunctionsAgentFeedRequest,
  SimpleFunctionsBillRequest,
  SimpleFunctionsBriefingRequest,
  SimpleFunctionsCalendarRequest,
  SimpleFunctionsCalibrationPeriod,
  SimpleFunctionsCalibrationRequest,
  SimpleFunctionsCalibrationSource,
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
  SimpleFunctionsFormat,
  SimpleFunctionsFredRequest,
  SimpleFunctionsGovQueryRequest,
  SimpleFunctionsGovSource,
  SimpleFunctionsIdeaRequest,
  SimpleFunctionsIndexHistoryRequest,
  SimpleFunctionsInspectRequest,
  SimpleFunctionsLegislationRequest,
  SimpleFunctionsMarketCandlesRequest,
  SimpleFunctionsMarketDetailRequest,
  SimpleFunctionsMarketTimeframe,
  SimpleFunctionsMarketsRequest,
  SimpleFunctionsMicrostructureHistoryRequest,
  SimpleFunctionsModel,
  SimpleFunctionsMode,
  SimpleFunctionsMoverDirection,
  SimpleFunctionsMoverWindow,
  SimpleFunctionsMoversRequest,
  SimpleFunctionsNextActions,
  SimpleFunctionsNoRequest,
  SimpleFunctionsOddsBand,
  SimpleFunctionsOddsRequest,
  SimpleFunctionsOptions,
  SimpleFunctionsPublicListRequest,
  SimpleFunctionsPublicSearchRequest,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsRegimeScanRequest,
  SimpleFunctionsScanRequest,
  SimpleFunctionsScreenByTickersRequest,
  SimpleFunctionsScreenRequest,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsSource,
  SimpleFunctionsStrict,
  SimpleFunctionsSlugRequest,
  SimpleFunctionsTicker,
  SimpleFunctionsTickerRequest,
  SimpleFunctionsTradesRequest,
  SimpleFunctionsVenue,
  SimpleFunctionsWorldDeltaRequest,
  SimpleFunctionsWorldOperation,
  SimpleFunctionsWorldPathRequest,
  SimpleFunctionsWorldRequest,
  SimpleFunctionsYieldCurveRequest,
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
  calibration: SimpleFunctionsOptionalMethod<SimpleFunctionsCalibrationRequest>;
  changes: SimpleFunctionsOptionalMethod<SimpleFunctionsChangesRequest>;
  edges: SimpleFunctionsOptionalMethod<SimpleFunctionsEdgesRequest>;
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

export interface SimpleFunctionsPostNamespace {
  api: {
    public: {
      discuss: SimpleFunctionsMethod<SimpleFunctionsDiscussRequest>;
    };
  };
}

export interface SimpleFunctionsProvider {
  api: SimpleFunctionsApiNamespace;
  data: SimpleFunctionsDataNamespace;
  get: SimpleFunctionsGetNamespace;
  post: SimpleFunctionsPostNamespace;
}
