import { z } from "zod";

export const SimpleFunctionsOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().url().optional(),
  dataBaseURL: z.string().url().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export const SimpleFunctionsModeSchema = z.enum(["full", "raw"]);
export const SimpleFunctionsSourceSchema = z.enum([
  "kalshi",
  "polymarket",
  "x",
  "content",
  "traditional",
]);
export const SimpleFunctionsModelSchema = z.enum(["cheap", "medium", "heavy"]);
export const SimpleFunctionsNextActionsSchema = z.literal("off");
export const SimpleFunctionsNoRequestSchema = z.undefined();
export const SimpleFunctionsVenueSchema = z.enum(["kalshi", "polymarket"]);
export const SimpleFunctionsStrictSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.boolean(),
]);
export const SimpleFunctionsMoverWindowSchema = z.enum([
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
  "24h",
  "1d",
]);
export const SimpleFunctionsMoverDirectionSchema = z.enum([
  "up",
  "down",
  "both",
]);
export const SimpleFunctionsFormatSchema = z.enum(["json", "markdown"]);
export const SimpleFunctionsWorldOperationSchema = z.enum([
  "snapshot",
  "catalyst",
  "dispersion",
  "history",
  "trail",
  "explain",
]);
export const SimpleFunctionsMarketTimeframeSchema = z.enum([
  "1m",
  "5m",
  "15m",
  "1h",
  "1d",
]);
export const SimpleFunctionsOddsBandSchema = z.enum(["mid", "moving"]);
export const SimpleFunctionsGovSourceSchema = z.enum([
  "congress",
  "openstates",
  "kalshi",
  "crs",
]);
export const SimpleFunctionsCalibrationSourceSchema = z.enum([
  "kalshi",
  "polymarket",
]);
export const SimpleFunctionsCalibrationPeriodSchema = z.enum([
  "7d",
  "30d",
  "90d",
  "all",
]);

const NonEmptyStringSchema = z
  .string()
  .refine((value) => value.trim().length > 0, {
    message: "Required string parameter must not be empty",
  });

const QueryStringSchema = z
  .string()
  .refine((value) => value.trim().length >= 2, {
    message: 'Query parameter "q" is required (min 2 chars)',
  });

const PositiveLimitSchema = z.number().int().min(1);
const OptionalBooleanSchema = z.boolean().optional();
const OptionalStringSchema = z.string().min(1).optional();
const UnknownRecordSchema = z.record(z.string(), z.unknown());
const QueryParamValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);
const QueryParamSchema = QueryParamValueSchema.optional();
const QueryRecordSchema = z.record(z.string(), QueryParamSchema);
const NullableNumberSchema = z.number().nullable().optional();
const NullableStringSchema = z.string().nullable().optional();
const NullableBooleanSchema = z.boolean().nullable().optional();

export const SimpleFunctionsEmptyRequestSchema = z.object({});
export const SimpleFunctionsRecordRequestSchema = UnknownRecordSchema;
export const SimpleFunctionsOptionalQueryRequestSchema = z
  .object({
    query: QueryRecordSchema.optional(),
  })
  .catchall(QueryParamSchema);
export const SimpleFunctionsIdRequestSchema = z
  .object({
    id: NonEmptyStringSchema,
  })
  .catchall(z.unknown());
export const SimpleFunctionsTickerPathRequestSchema = z
  .object({
    ticker: NonEmptyStringSchema,
  })
  .catchall(z.unknown());
export const SimpleFunctionsTokenRequestSchema = z.object({
  token: NonEmptyStringSchema,
});
export const SimpleFunctionsTransportRequestSchema = z
  .object({
    transport: NonEmptyStringSchema,
  })
  .catchall(z.unknown());
export const SimpleFunctionsPositionRequestSchema = z
  .object({
    id: NonEmptyStringSchema,
    posId: NonEmptyStringSchema,
  })
  .catchall(z.unknown());
export const SimpleFunctionsStrategyRequestSchema = z
  .object({
    id: NonEmptyStringSchema,
    sid: NonEmptyStringSchema,
  })
  .catchall(z.unknown());
export const SimpleFunctionsBodyRequestSchema = z
  .object({
    body: z.unknown().optional(),
    query: QueryRecordSchema.optional(),
  })
  .catchall(z.unknown());
export const SimpleFunctionsOptionalBodyRequestSchema =
  SimpleFunctionsBodyRequestSchema.optional();

export const SimpleFunctionsQueryRequestSchema = z.object({
  q: QueryStringSchema,
  mode: SimpleFunctionsModeSchema.optional(),
  sources: z.array(SimpleFunctionsSourceSchema).min(1).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  model: SimpleFunctionsModelSchema.optional(),
  depth: z.boolean().optional(),
  nextActions: SimpleFunctionsNextActionsSchema.optional(),
});

export const SimpleFunctionsWorldRequestSchema = z.object({
  format: SimpleFunctionsFormatSchema.optional(),
  compact: OptionalBooleanSchema,
  limit: z.number().int().min(1).max(30).optional(),
  depth: z.number().int().min(0).max(3).optional(),
  since: NonEmptyStringSchema.optional(),
  focus: NonEmptyStringSchema.optional(),
  op: SimpleFunctionsWorldOperationSchema.optional(),
  window: NonEmptyStringSchema.optional(),
  dt: NonEmptyStringSchema.optional(),
  from: NonEmptyStringSchema.optional(),
  item: NonEmptyStringSchema.optional(),
});

export const SimpleFunctionsWorldPathRequestSchema =
  SimpleFunctionsWorldRequestSchema.extend({
    path: z.union([NonEmptyStringSchema, z.array(NonEmptyStringSchema).min(1)]),
  });

export const SimpleFunctionsWorldDeltaRequestSchema = z.object({
  since: NonEmptyStringSchema,
  format: SimpleFunctionsFormatSchema.optional(),
});

export const SimpleFunctionsInspectRequestSchema = z.object({
  ticker: NonEmptyStringSchema,
  format: SimpleFunctionsFormatSchema.optional(),
  contagion: OptionalBooleanSchema,
  diff: OptionalBooleanSchema,
  trend: OptionalBooleanSchema,
  nextActions: SimpleFunctionsNextActionsSchema.optional(),
});

export const SimpleFunctionsAgentFeedRequestSchema = z.object({
  topic: NonEmptyStringSchema,
  since: NonEmptyStringSchema.optional(),
  limit: PositiveLimitSchema.optional(),
  format: SimpleFunctionsFormatSchema.optional(),
});

export const SimpleFunctionsMarketsRequestSchema = z.object({
  q: z.string().optional(),
  venue: SimpleFunctionsVenueSchema.optional(),
});

export const SimpleFunctionsFeaturedMarketsRequestSchema = z.object({
  n: z.number().int().positive().optional(),
});

export const SimpleFunctionsSearchRequestSchema = z.object({
  q: z.string().refine((value) => value.trim().length > 0, {
    message: 'Query parameter "q" is required',
  }),
  limit: z.number().int().min(1).max(50).optional(),
  venue: SimpleFunctionsVenueSchema.optional(),
  strict: SimpleFunctionsStrictSchema.optional(),
});

export const SimpleFunctionsMoversRequestSchema = z.object({
  window: SimpleFunctionsMoverWindowSchema.optional(),
  n: z.number().int().min(10).max(200).optional(),
  minVol: z.number().nonnegative().optional(),
  dir: SimpleFunctionsMoverDirectionSchema.optional(),
});

export const SimpleFunctionsCandlesRequestSchema = z.object({
  tf: z.string().min(1).optional(),
  limit: z.number().int().positive().optional(),
});

export const SimpleFunctionsTradesRequestSchema = z.object({
  limit: z.number().int().positive().optional(),
});

export const SimpleFunctionsTickerSchema = z
  .string()
  .refine((value) => value.trim().length > 0, {
    message: "Ticker is required",
  });

export const SimpleFunctionsPublicListRequestSchema = z.object({
  q: OptionalStringSchema,
  category: OptionalStringSchema,
  venue: SimpleFunctionsVenueSchema.optional(),
  limit: PositiveLimitSchema.optional(),
  offset: z.number().int().min(0).optional(),
});

export const SimpleFunctionsMarketDetailRequestSchema = z.object({
  ticker: NonEmptyStringSchema,
  depth: OptionalBooleanSchema,
  refresh: OptionalBooleanSchema,
  cvPreset: OptionalStringSchema,
  cvMinConf: z.number().min(0).max(1).optional(),
  cvMaxDtDays: z.number().min(0).optional(),
  nextActions: SimpleFunctionsNextActionsSchema.optional(),
});

export const SimpleFunctionsTickerRequestSchema = z.object({
  ticker: NonEmptyStringSchema,
});

export const SimpleFunctionsMarketDepthLevelSchema = z.union([
  z.tuple([z.number(), z.number()]),
  z
    .object({
      price: z.number(),
      size: z.number(),
    })
    .catchall(z.unknown()),
]);

export const SimpleFunctionsMarketIndicatorsSchema = z
  .object({
    tauDays: NullableNumberSchema,
    iyYes: NullableNumberSchema,
    iyNo: NullableNumberSchema,
    cri: NullableNumberSchema,
    ee: NullableNumberSchema,
    eeSource: NullableStringSchema,
    las: NullableNumberSchema,
    cvr: NullableNumberSchema,
    overround: NullableNumberSchema,
    rv: NullableNumberSchema,
    vr: NullableNumberSchema,
    iar: NullableNumberSchema,
    adjIy: NullableNumberSchema,
    daysToEvent: NullableNumberSchema,
    expectedVr: NullableNumberSchema,
    residualVr: NullableNumberSchema,
    hasThesis: NullableBooleanSchema,
    hasOrderbook: NullableBooleanSchema,
    lastComputedAt: NullableStringSchema,
  })
  .catchall(z.unknown());

export const SimpleFunctionsMarketRegimeSchema = z
  .object({
    label: z.enum(["maker", "taker", "neutral"]).optional(),
    score: NullableNumberSchema,
    adverseSelection: NullableNumberSchema,
    adverseSelectionScore: NullableNumberSchema,
    signals: UnknownRecordSchema.optional(),
    freshness: z
      .union([z.string(), z.number(), UnknownRecordSchema])
      .nullable()
      .optional(),
    fresh: NullableBooleanSchema,
    computedAt: NullableStringSchema,
    lastComputedAt: NullableStringSchema,
  })
  .catchall(z.unknown());

export const SimpleFunctionsMarketDetailResponseSchema = z
  .object({
    ticker: z.string(),
    venue: z.string().optional(),
    title: z.string().optional(),
    description: NullableStringSchema,
    price: z.number().optional(),
    bestBid: z.number().optional(),
    bestAsk: z.number().optional(),
    spread: z.number().optional(),
    volume: z.number().optional(),
    volume24h: z.number().optional(),
    openInterest: z.number().optional(),
    status: z.string().optional(),
    closeTime: z.union([z.string(), z.number()]).optional(),
    category: z.string().optional(),
    liquidityScore: z.union([z.number(), z.string()]).optional(),
    slug: z.string().optional(),
    bidLevels: z.array(SimpleFunctionsMarketDepthLevelSchema).optional(),
    askLevels: z.array(SimpleFunctionsMarketDepthLevelSchema).optional(),
    edges: z.array(UnknownRecordSchema).optional(),
    indicators: SimpleFunctionsMarketIndicatorsSchema.nullable().optional(),
    crossVenue: z
      .union([z.array(UnknownRecordSchema), UnknownRecordSchema])
      .nullable()
      .optional(),
    regime: SimpleFunctionsMarketRegimeSchema.nullable().optional(),
    pageUrl: z.string().optional(),
    apiUrl: z.string().optional(),
    inspectUrl: z.string().optional(),
    fetchedAt: z.string().optional(),
    nextActions: UnknownRecordSchema.optional(),
  })
  .catchall(z.unknown());

export const SimpleFunctionsMarketIndicatorHistoryRowSchema =
  SimpleFunctionsMarketIndicatorsSchema.extend({
    at: z.union([z.string(), z.number()]).optional(),
    ts: z.union([z.string(), z.number()]).optional(),
    t: z.union([z.string(), z.number()]).optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
    fetchedAt: z.string().optional(),
    price: z.number().optional(),
    delta: z.number().optional(),
    iy: z.number().nullable().optional(),
  }).catchall(z.unknown());

export const SimpleFunctionsMarketRegimeHistoryRowSchema =
  SimpleFunctionsMarketRegimeSchema.extend({
    at: z.union([z.string(), z.number()]).optional(),
    ts: z.union([z.string(), z.number()]).optional(),
    t: z.union([z.string(), z.number()]).optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
    fetchedAt: z.string().optional(),
    spreadCents: z.number().optional(),
    bidDepthUsd: NullableNumberSchema,
    askDepthUsd: NullableNumberSchema,
    volume24h: NullableNumberSchema,
  }).catchall(z.unknown());

export const SimpleFunctionsMarketHistoryResponseSchema = z
  .object({
    ticker: z.string().optional(),
    windowDays: z.number().optional(),
    indicatorHistory: z.array(SimpleFunctionsMarketIndicatorHistoryRowSchema),
    regimeHistory: z.array(SimpleFunctionsMarketRegimeHistoryRowSchema),
    indicatorCount: z.number().int().nonnegative().optional(),
    regimeCount: z.number().int().nonnegative().optional(),
  })
  .catchall(z.unknown());

export const SimpleFunctionsMarketCandlesRequestSchema = z.object({
  ticker: NonEmptyStringSchema,
  venue: SimpleFunctionsVenueSchema.optional(),
  timeframe: SimpleFunctionsMarketTimeframeSchema.optional(),
  tf: SimpleFunctionsMarketTimeframeSchema.optional(),
  limit: z.number().int().min(1).max(2000).optional(),
});

export const SimpleFunctionsScanRequestSchema = z.object({
  q: OptionalStringSchema,
  mode: z.enum(["keyword", "series", "market"]).optional(),
  series: OptionalStringSchema,
  market: OptionalStringSchema,
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsScreenRequestSchema = z.object({
  venue: SimpleFunctionsVenueSchema.optional(),
  category: OptionalStringSchema,
  minPrice: z.number().min(0).max(1).optional(),
  maxPrice: z.number().min(0).max(1).optional(),
  minVolume: z.number().min(0).optional(),
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsScreenByTickersRequestSchema = z.object({
  tickers: z.array(NonEmptyStringSchema).min(1),
  venue: SimpleFunctionsVenueSchema.optional(),
  minVolume: z.number().min(0).optional(),
});

export const SimpleFunctionsPublicSearchRequestSchema = z.object({
  q: QueryStringSchema,
  limit: z.number().int().min(1).max(20).optional(),
});

export const SimpleFunctionsMicrostructureHistoryRequestSchema = z.object({
  ticker: NonEmptyStringSchema,
  venue: SimpleFunctionsVenueSchema.optional(),
  days: z.number().int().min(1).max(365).optional(),
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsCrossVenueRequestSchema = z.object({
  venue: SimpleFunctionsVenueSchema.optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsIndexHistoryRequestSchema = z.object({
  days: z.number().int().min(1).max(365).optional(),
  theme: OptionalStringSchema,
});

export const SimpleFunctionsRegimeScanRequestSchema = z.object({
  label: z.enum(["maker", "taker", "neutral"]).optional(),
  venue: SimpleFunctionsVenueSchema.optional(),
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsOddsRequestSchema = z.object({
  category: OptionalStringSchema,
  band: SimpleFunctionsOddsBandSchema.optional(),
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsCalendarRequestSchema = z.object({
  from: OptionalStringSchema,
  to: OptionalStringSchema,
  category: OptionalStringSchema,
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsYieldCurveRequestSchema = z.object({
  event: NonEmptyStringSchema,
});

export const SimpleFunctionsContagionRequestSchema = z.object({
  ticker: OptionalStringSchema,
  window: OptionalStringSchema,
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsGovQueryRequestSchema = z.object({
  q: QueryStringSchema,
  mode: SimpleFunctionsModeSchema.optional(),
  sources: z.array(SimpleFunctionsGovSourceSchema).min(1).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  depth: OptionalBooleanSchema,
});

export const SimpleFunctionsLegislationRequestSchema = z.object({
  q: OptionalStringSchema,
  congress: z.number().int().min(1).optional(),
  type: OptionalStringSchema,
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsBillRequestSchema = z.object({
  billId: NonEmptyStringSchema,
});

export const SimpleFunctionsCongressMembersRequestSchema = z.object({
  q: OptionalStringSchema,
  state: OptionalStringSchema,
  party: OptionalStringSchema,
  chamber: OptionalStringSchema,
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsCongressMemberRequestSchema = z.object({
  id: NonEmptyStringSchema,
});

export const SimpleFunctionsEconQueryRequestSchema = z.object({
  q: QueryStringSchema,
  mode: SimpleFunctionsModeSchema.optional(),
  limit: z.number().int().min(1).max(10).optional(),
  includeMarkets: OptionalBooleanSchema,
});

export const SimpleFunctionsFredRequestSchema = z.object({
  series: NonEmptyStringSchema,
  start: OptionalStringSchema,
  end: OptionalStringSchema,
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsChangesRequestSchema = z.object({
  since: OptionalStringSchema,
  type: OptionalStringSchema,
  limit: PositiveLimitSchema.optional(),
});

export const SimpleFunctionsContextRequestSchema = z.object({
  compact: OptionalBooleanSchema,
});

export const SimpleFunctionsBriefingRequestSchema = z.object({
  topic: OptionalStringSchema,
  date: OptionalStringSchema,
  compact: OptionalBooleanSchema,
});

export const SimpleFunctionsSlugRequestSchema = z.object({
  slug: NonEmptyStringSchema,
});

export const SimpleFunctionsIdeaRequestSchema = z.object({
  id: z.union([NonEmptyStringSchema, z.number().int().min(1)]),
});

export const SimpleFunctionsDiscussRequestSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => Object.keys(value).length > 0, {
    message: "Request body must not be empty",
  });

export const SimpleFunctionsCalibrationRequestSchema = z.object({
  source: SimpleFunctionsCalibrationSourceSchema.optional(),
  period: SimpleFunctionsCalibrationPeriodSchema.optional(),
  category: OptionalStringSchema,
  topic: OptionalStringSchema,
  minVolume: z.number().min(0).optional(),
});

export const SimpleFunctionsEdgesRequestSchema = z.object({
  limit: PositiveLimitSchema.optional(),
  minStrength: z.number().min(0).optional(),
  theme: OptionalStringSchema,
  venue: SimpleFunctionsVenueSchema.optional(),
});

export type SimpleFunctionsOptions = z.infer<
  typeof SimpleFunctionsOptionsSchema
>;
export type SimpleFunctionsMode = z.infer<typeof SimpleFunctionsModeSchema>;
export type SimpleFunctionsSource = z.infer<typeof SimpleFunctionsSourceSchema>;
export type SimpleFunctionsModel = z.infer<typeof SimpleFunctionsModelSchema>;
export type SimpleFunctionsNextActions = z.infer<
  typeof SimpleFunctionsNextActionsSchema
>;
export type SimpleFunctionsNoRequest = z.input<
  typeof SimpleFunctionsNoRequestSchema
>;
export type SimpleFunctionsNoRequestInput = SimpleFunctionsNoRequest;
export type SimpleFunctionsNoParsedRequest = z.output<
  typeof SimpleFunctionsNoRequestSchema
>;
export type SimpleFunctionsVenue = z.infer<typeof SimpleFunctionsVenueSchema>;
export type SimpleFunctionsStrict = z.infer<typeof SimpleFunctionsStrictSchema>;
export type SimpleFunctionsMoverWindow = z.infer<
  typeof SimpleFunctionsMoverWindowSchema
>;
export type SimpleFunctionsMoverDirection = z.infer<
  typeof SimpleFunctionsMoverDirectionSchema
>;
export type SimpleFunctionsFormat = z.infer<typeof SimpleFunctionsFormatSchema>;
export type SimpleFunctionsWorldOperation = z.infer<
  typeof SimpleFunctionsWorldOperationSchema
>;
export type SimpleFunctionsMarketTimeframe = z.infer<
  typeof SimpleFunctionsMarketTimeframeSchema
>;
export type SimpleFunctionsOddsBand = z.infer<
  typeof SimpleFunctionsOddsBandSchema
>;
export type SimpleFunctionsGovSource = z.infer<
  typeof SimpleFunctionsGovSourceSchema
>;
export type SimpleFunctionsCalibrationSource = z.infer<
  typeof SimpleFunctionsCalibrationSourceSchema
>;
export type SimpleFunctionsCalibrationPeriod = z.infer<
  typeof SimpleFunctionsCalibrationPeriodSchema
>;
export type SimpleFunctionsEmptyRequest = z.input<
  typeof SimpleFunctionsEmptyRequestSchema
>;
export type SimpleFunctionsEmptyRequestInput = SimpleFunctionsEmptyRequest;
export type SimpleFunctionsEmptyParsedRequest = z.output<
  typeof SimpleFunctionsEmptyRequestSchema
>;
export type SimpleFunctionsRecordRequest = z.input<
  typeof SimpleFunctionsRecordRequestSchema
>;
export type SimpleFunctionsRecordRequestInput = SimpleFunctionsRecordRequest;
export type SimpleFunctionsRecordParsedRequest = z.output<
  typeof SimpleFunctionsRecordRequestSchema
>;
export type SimpleFunctionsOptionalQueryRequest = z.input<
  typeof SimpleFunctionsOptionalQueryRequestSchema
>;
export type SimpleFunctionsOptionalQueryRequestInput =
  SimpleFunctionsOptionalQueryRequest;
export type SimpleFunctionsOptionalQueryParsedRequest = z.output<
  typeof SimpleFunctionsOptionalQueryRequestSchema
>;
export type SimpleFunctionsIdRequest = z.input<
  typeof SimpleFunctionsIdRequestSchema
>;
export type SimpleFunctionsIdRequestInput = SimpleFunctionsIdRequest;
export type SimpleFunctionsIdParsedRequest = z.output<
  typeof SimpleFunctionsIdRequestSchema
>;
export type SimpleFunctionsTickerPathRequest = z.input<
  typeof SimpleFunctionsTickerPathRequestSchema
>;
export type SimpleFunctionsTickerPathRequestInput =
  SimpleFunctionsTickerPathRequest;
export type SimpleFunctionsTickerPathParsedRequest = z.output<
  typeof SimpleFunctionsTickerPathRequestSchema
>;
export type SimpleFunctionsTokenRequest = z.input<
  typeof SimpleFunctionsTokenRequestSchema
>;
export type SimpleFunctionsTokenRequestInput = SimpleFunctionsTokenRequest;
export type SimpleFunctionsTokenParsedRequest = z.output<
  typeof SimpleFunctionsTokenRequestSchema
>;
export type SimpleFunctionsTransportRequest = z.input<
  typeof SimpleFunctionsTransportRequestSchema
>;
export type SimpleFunctionsTransportRequestInput =
  SimpleFunctionsTransportRequest;
export type SimpleFunctionsTransportParsedRequest = z.output<
  typeof SimpleFunctionsTransportRequestSchema
>;
export type SimpleFunctionsPositionRequest = z.input<
  typeof SimpleFunctionsPositionRequestSchema
>;
export type SimpleFunctionsPositionRequestInput =
  SimpleFunctionsPositionRequest;
export type SimpleFunctionsPositionParsedRequest = z.output<
  typeof SimpleFunctionsPositionRequestSchema
>;
export type SimpleFunctionsStrategyRequest = z.input<
  typeof SimpleFunctionsStrategyRequestSchema
>;
export type SimpleFunctionsStrategyRequestInput =
  SimpleFunctionsStrategyRequest;
export type SimpleFunctionsStrategyParsedRequest = z.output<
  typeof SimpleFunctionsStrategyRequestSchema
>;
export type SimpleFunctionsBodyRequest = z.input<
  typeof SimpleFunctionsBodyRequestSchema
>;
export type SimpleFunctionsBodyRequestInput = SimpleFunctionsBodyRequest;
export type SimpleFunctionsBodyParsedRequest = z.output<
  typeof SimpleFunctionsBodyRequestSchema
>;
export type SimpleFunctionsOptionalBodyRequest = z.input<
  typeof SimpleFunctionsOptionalBodyRequestSchema
>;
export type SimpleFunctionsOptionalBodyRequestInput =
  SimpleFunctionsOptionalBodyRequest;
export type SimpleFunctionsOptionalBodyParsedRequest = z.output<
  typeof SimpleFunctionsOptionalBodyRequestSchema
>;
export type SimpleFunctionsQueryRequest = z.input<
  typeof SimpleFunctionsQueryRequestSchema
>;
export type SimpleFunctionsQueryRequestInput = SimpleFunctionsQueryRequest;
export type SimpleFunctionsQueryParsedRequest = z.output<
  typeof SimpleFunctionsQueryRequestSchema
>;
export type SimpleFunctionsWorldRequest = z.input<
  typeof SimpleFunctionsWorldRequestSchema
>;
export type SimpleFunctionsWorldRequestInput = SimpleFunctionsWorldRequest;
export type SimpleFunctionsWorldParsedRequest = z.output<
  typeof SimpleFunctionsWorldRequestSchema
>;
export type SimpleFunctionsWorldPathRequest = z.input<
  typeof SimpleFunctionsWorldPathRequestSchema
>;
export type SimpleFunctionsWorldPathRequestInput =
  SimpleFunctionsWorldPathRequest;
export type SimpleFunctionsWorldPathParsedRequest = z.output<
  typeof SimpleFunctionsWorldPathRequestSchema
>;
export type SimpleFunctionsWorldDeltaRequest = z.input<
  typeof SimpleFunctionsWorldDeltaRequestSchema
>;
export type SimpleFunctionsWorldDeltaRequestInput =
  SimpleFunctionsWorldDeltaRequest;
export type SimpleFunctionsWorldDeltaParsedRequest = z.output<
  typeof SimpleFunctionsWorldDeltaRequestSchema
>;
export type SimpleFunctionsInspectRequest = z.input<
  typeof SimpleFunctionsInspectRequestSchema
>;
export type SimpleFunctionsInspectRequestInput = SimpleFunctionsInspectRequest;
export type SimpleFunctionsInspectParsedRequest = z.output<
  typeof SimpleFunctionsInspectRequestSchema
>;
export type SimpleFunctionsAgentFeedRequest = z.input<
  typeof SimpleFunctionsAgentFeedRequestSchema
>;
export type SimpleFunctionsAgentFeedRequestInput =
  SimpleFunctionsAgentFeedRequest;
export type SimpleFunctionsAgentFeedParsedRequest = z.output<
  typeof SimpleFunctionsAgentFeedRequestSchema
>;
export type SimpleFunctionsMarketsRequest = z.input<
  typeof SimpleFunctionsMarketsRequestSchema
>;
export type SimpleFunctionsMarketsRequestInput = SimpleFunctionsMarketsRequest;
export type SimpleFunctionsMarketsParsedRequest = z.output<
  typeof SimpleFunctionsMarketsRequestSchema
>;
export type SimpleFunctionsFeaturedMarketsRequest = z.input<
  typeof SimpleFunctionsFeaturedMarketsRequestSchema
>;
export type SimpleFunctionsFeaturedMarketsRequestInput =
  SimpleFunctionsFeaturedMarketsRequest;
export type SimpleFunctionsFeaturedMarketsParsedRequest = z.output<
  typeof SimpleFunctionsFeaturedMarketsRequestSchema
>;
export type SimpleFunctionsSearchRequest = z.input<
  typeof SimpleFunctionsSearchRequestSchema
>;
export type SimpleFunctionsSearchRequestInput = SimpleFunctionsSearchRequest;
export type SimpleFunctionsSearchParsedRequest = z.output<
  typeof SimpleFunctionsSearchRequestSchema
>;
export type SimpleFunctionsMoversRequest = z.input<
  typeof SimpleFunctionsMoversRequestSchema
>;
export type SimpleFunctionsMoversRequestInput = SimpleFunctionsMoversRequest;
export type SimpleFunctionsMoversParsedRequest = z.output<
  typeof SimpleFunctionsMoversRequestSchema
>;
export type SimpleFunctionsCandlesRequest = z.input<
  typeof SimpleFunctionsCandlesRequestSchema
>;
export type SimpleFunctionsCandlesRequestInput = SimpleFunctionsCandlesRequest;
export type SimpleFunctionsCandlesParsedRequest = z.output<
  typeof SimpleFunctionsCandlesRequestSchema
>;
export type SimpleFunctionsTradesRequest = z.input<
  typeof SimpleFunctionsTradesRequestSchema
>;
export type SimpleFunctionsTradesRequestInput = SimpleFunctionsTradesRequest;
export type SimpleFunctionsTradesParsedRequest = z.output<
  typeof SimpleFunctionsTradesRequestSchema
>;
export type SimpleFunctionsTicker = z.infer<typeof SimpleFunctionsTickerSchema>;
export type SimpleFunctionsPublicListRequest = z.input<
  typeof SimpleFunctionsPublicListRequestSchema
>;
export type SimpleFunctionsPublicListRequestInput =
  SimpleFunctionsPublicListRequest;
export type SimpleFunctionsPublicListParsedRequest = z.output<
  typeof SimpleFunctionsPublicListRequestSchema
>;
export type SimpleFunctionsMarketDetailRequest = z.input<
  typeof SimpleFunctionsMarketDetailRequestSchema
>;
export type SimpleFunctionsMarketDetailRequestInput =
  SimpleFunctionsMarketDetailRequest;
export type SimpleFunctionsMarketDetailParsedRequest = z.output<
  typeof SimpleFunctionsMarketDetailRequestSchema
>;
export type SimpleFunctionsTickerRequest = z.input<
  typeof SimpleFunctionsTickerRequestSchema
>;
export type SimpleFunctionsTickerRequestInput = SimpleFunctionsTickerRequest;
export type SimpleFunctionsTickerParsedRequest = z.output<
  typeof SimpleFunctionsTickerRequestSchema
>;
export type SimpleFunctionsMarketCandlesRequest = z.input<
  typeof SimpleFunctionsMarketCandlesRequestSchema
>;
export type SimpleFunctionsMarketCandlesRequestInput =
  SimpleFunctionsMarketCandlesRequest;
export type SimpleFunctionsMarketCandlesParsedRequest = z.output<
  typeof SimpleFunctionsMarketCandlesRequestSchema
>;
export type SimpleFunctionsScanRequest = z.input<
  typeof SimpleFunctionsScanRequestSchema
>;
export type SimpleFunctionsScanRequestInput = SimpleFunctionsScanRequest;
export type SimpleFunctionsScanParsedRequest = z.output<
  typeof SimpleFunctionsScanRequestSchema
>;
export type SimpleFunctionsScreenRequest = z.input<
  typeof SimpleFunctionsScreenRequestSchema
>;
export type SimpleFunctionsScreenRequestInput = SimpleFunctionsScreenRequest;
export type SimpleFunctionsScreenParsedRequest = z.output<
  typeof SimpleFunctionsScreenRequestSchema
>;
export type SimpleFunctionsScreenByTickersRequest = z.input<
  typeof SimpleFunctionsScreenByTickersRequestSchema
>;
export type SimpleFunctionsScreenByTickersRequestInput =
  SimpleFunctionsScreenByTickersRequest;
export type SimpleFunctionsScreenByTickersParsedRequest = z.output<
  typeof SimpleFunctionsScreenByTickersRequestSchema
>;
export type SimpleFunctionsPublicSearchRequest = z.input<
  typeof SimpleFunctionsPublicSearchRequestSchema
>;
export type SimpleFunctionsPublicSearchRequestInput =
  SimpleFunctionsPublicSearchRequest;
export type SimpleFunctionsPublicSearchParsedRequest = z.output<
  typeof SimpleFunctionsPublicSearchRequestSchema
>;
export type SimpleFunctionsMicrostructureHistoryRequest = z.input<
  typeof SimpleFunctionsMicrostructureHistoryRequestSchema
>;
export type SimpleFunctionsMicrostructureHistoryRequestInput =
  SimpleFunctionsMicrostructureHistoryRequest;
export type SimpleFunctionsMicrostructureHistoryParsedRequest = z.output<
  typeof SimpleFunctionsMicrostructureHistoryRequestSchema
>;
export type SimpleFunctionsCrossVenueRequest = z.input<
  typeof SimpleFunctionsCrossVenueRequestSchema
>;
export type SimpleFunctionsCrossVenueRequestInput =
  SimpleFunctionsCrossVenueRequest;
export type SimpleFunctionsCrossVenueParsedRequest = z.output<
  typeof SimpleFunctionsCrossVenueRequestSchema
>;
export type SimpleFunctionsIndexHistoryRequest = z.input<
  typeof SimpleFunctionsIndexHistoryRequestSchema
>;
export type SimpleFunctionsIndexHistoryRequestInput =
  SimpleFunctionsIndexHistoryRequest;
export type SimpleFunctionsIndexHistoryParsedRequest = z.output<
  typeof SimpleFunctionsIndexHistoryRequestSchema
>;
export type SimpleFunctionsRegimeScanRequest = z.input<
  typeof SimpleFunctionsRegimeScanRequestSchema
>;
export type SimpleFunctionsRegimeScanRequestInput =
  SimpleFunctionsRegimeScanRequest;
export type SimpleFunctionsRegimeScanParsedRequest = z.output<
  typeof SimpleFunctionsRegimeScanRequestSchema
>;
export type SimpleFunctionsOddsRequest = z.input<
  typeof SimpleFunctionsOddsRequestSchema
>;
export type SimpleFunctionsOddsRequestInput = SimpleFunctionsOddsRequest;
export type SimpleFunctionsOddsParsedRequest = z.output<
  typeof SimpleFunctionsOddsRequestSchema
>;
export type SimpleFunctionsCalendarRequest = z.input<
  typeof SimpleFunctionsCalendarRequestSchema
>;
export type SimpleFunctionsCalendarRequestInput =
  SimpleFunctionsCalendarRequest;
export type SimpleFunctionsCalendarParsedRequest = z.output<
  typeof SimpleFunctionsCalendarRequestSchema
>;
export type SimpleFunctionsYieldCurveRequest = z.input<
  typeof SimpleFunctionsYieldCurveRequestSchema
>;
export type SimpleFunctionsYieldCurveRequestInput =
  SimpleFunctionsYieldCurveRequest;
export type SimpleFunctionsYieldCurveParsedRequest = z.output<
  typeof SimpleFunctionsYieldCurveRequestSchema
>;
export type SimpleFunctionsContagionRequest = z.input<
  typeof SimpleFunctionsContagionRequestSchema
>;
export type SimpleFunctionsContagionRequestInput =
  SimpleFunctionsContagionRequest;
export type SimpleFunctionsContagionParsedRequest = z.output<
  typeof SimpleFunctionsContagionRequestSchema
>;
export type SimpleFunctionsGovQueryRequest = z.input<
  typeof SimpleFunctionsGovQueryRequestSchema
>;
export type SimpleFunctionsGovQueryRequestInput =
  SimpleFunctionsGovQueryRequest;
export type SimpleFunctionsGovQueryParsedRequest = z.output<
  typeof SimpleFunctionsGovQueryRequestSchema
>;
export type SimpleFunctionsLegislationRequest = z.input<
  typeof SimpleFunctionsLegislationRequestSchema
>;
export type SimpleFunctionsLegislationRequestInput =
  SimpleFunctionsLegislationRequest;
export type SimpleFunctionsLegislationParsedRequest = z.output<
  typeof SimpleFunctionsLegislationRequestSchema
>;
export type SimpleFunctionsBillRequest = z.input<
  typeof SimpleFunctionsBillRequestSchema
>;
export type SimpleFunctionsBillRequestInput = SimpleFunctionsBillRequest;
export type SimpleFunctionsBillParsedRequest = z.output<
  typeof SimpleFunctionsBillRequestSchema
>;
export type SimpleFunctionsCongressMembersRequest = z.input<
  typeof SimpleFunctionsCongressMembersRequestSchema
>;
export type SimpleFunctionsCongressMembersRequestInput =
  SimpleFunctionsCongressMembersRequest;
export type SimpleFunctionsCongressMembersParsedRequest = z.output<
  typeof SimpleFunctionsCongressMembersRequestSchema
>;
export type SimpleFunctionsCongressMemberRequest = z.input<
  typeof SimpleFunctionsCongressMemberRequestSchema
>;
export type SimpleFunctionsCongressMemberRequestInput =
  SimpleFunctionsCongressMemberRequest;
export type SimpleFunctionsCongressMemberParsedRequest = z.output<
  typeof SimpleFunctionsCongressMemberRequestSchema
>;
export type SimpleFunctionsEconQueryRequest = z.input<
  typeof SimpleFunctionsEconQueryRequestSchema
>;
export type SimpleFunctionsEconQueryRequestInput =
  SimpleFunctionsEconQueryRequest;
export type SimpleFunctionsEconQueryParsedRequest = z.output<
  typeof SimpleFunctionsEconQueryRequestSchema
>;
export type SimpleFunctionsFredRequest = z.input<
  typeof SimpleFunctionsFredRequestSchema
>;
export type SimpleFunctionsFredRequestInput = SimpleFunctionsFredRequest;
export type SimpleFunctionsFredParsedRequest = z.output<
  typeof SimpleFunctionsFredRequestSchema
>;
export type SimpleFunctionsChangesRequest = z.input<
  typeof SimpleFunctionsChangesRequestSchema
>;
export type SimpleFunctionsChangesRequestInput = SimpleFunctionsChangesRequest;
export type SimpleFunctionsChangesParsedRequest = z.output<
  typeof SimpleFunctionsChangesRequestSchema
>;
export type SimpleFunctionsContextRequest = z.input<
  typeof SimpleFunctionsContextRequestSchema
>;
export type SimpleFunctionsContextRequestInput = SimpleFunctionsContextRequest;
export type SimpleFunctionsContextParsedRequest = z.output<
  typeof SimpleFunctionsContextRequestSchema
>;
export type SimpleFunctionsBriefingRequest = z.input<
  typeof SimpleFunctionsBriefingRequestSchema
>;
export type SimpleFunctionsBriefingRequestInput =
  SimpleFunctionsBriefingRequest;
export type SimpleFunctionsBriefingParsedRequest = z.output<
  typeof SimpleFunctionsBriefingRequestSchema
>;
export type SimpleFunctionsSlugRequest = z.input<
  typeof SimpleFunctionsSlugRequestSchema
>;
export type SimpleFunctionsSlugRequestInput = SimpleFunctionsSlugRequest;
export type SimpleFunctionsSlugParsedRequest = z.output<
  typeof SimpleFunctionsSlugRequestSchema
>;
export type SimpleFunctionsIdeaRequest = z.input<
  typeof SimpleFunctionsIdeaRequestSchema
>;
export type SimpleFunctionsIdeaRequestInput = SimpleFunctionsIdeaRequest;
export type SimpleFunctionsIdeaParsedRequest = z.output<
  typeof SimpleFunctionsIdeaRequestSchema
>;
export type SimpleFunctionsDiscussRequest = z.input<
  typeof SimpleFunctionsDiscussRequestSchema
>;
export type SimpleFunctionsDiscussRequestInput = SimpleFunctionsDiscussRequest;
export type SimpleFunctionsDiscussParsedRequest = z.output<
  typeof SimpleFunctionsDiscussRequestSchema
>;
export type SimpleFunctionsCalibrationRequest = z.input<
  typeof SimpleFunctionsCalibrationRequestSchema
>;
export type SimpleFunctionsCalibrationRequestInput =
  SimpleFunctionsCalibrationRequest;
export type SimpleFunctionsCalibrationParsedRequest = z.output<
  typeof SimpleFunctionsCalibrationRequestSchema
>;
export type SimpleFunctionsEdgesRequest = z.input<
  typeof SimpleFunctionsEdgesRequestSchema
>;
export type SimpleFunctionsEdgesRequestInput = SimpleFunctionsEdgesRequest;
export type SimpleFunctionsEdgesParsedRequest = z.output<
  typeof SimpleFunctionsEdgesRequestSchema
>;
