import { z } from "zod";

export const BinancePublicBaseURLsSchema = z.object({
  spot: z.string().optional(),
  spotData: z.string().optional(),
  fapi: z.string().optional(),
  dapi: z.string().optional(),
  eapi: z.string().optional(),
});

export const BinanceOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  spotBaseURL: z.string().optional(),
  spotDataBaseURL: z.string().optional(),
  fapiBaseURL: z.string().optional(),
  futuresDataBaseURL: z.string().optional(),
  dapiBaseURL: z.string().optional(),
  eapiBaseURL: z.string().optional(),
  coinMBaseURL: z.string().optional(),
  publicBaseURLs: BinancePublicBaseURLsSchema.optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type BinancePublicBaseURLs = z.infer<typeof BinancePublicBaseURLsSchema>;
export type BinanceOptions = z.infer<typeof BinanceOptionsSchema>;

export const BinanceExchangeInfoRequestSchema = z.object({
  symbol: z.string().optional(),
  symbols: z.array(z.string()).optional(),
  permissions: z.union([z.string(), z.array(z.string())]).optional(),
  showPermissionSets: z.boolean().optional(),
  symbolStatus: z.enum(["TRADING", "HALT", "BREAK"]).optional(),
});

export const BinanceDepthRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z.number().int().positive().max(5000).optional(),
  symbolStatus: z.enum(["TRADING", "HALT", "BREAK"]).optional(),
});

export const BinanceAvgPriceRequestSchema = z.object({
  symbol: z.string().min(1),
});

export const BinanceReferencePriceRequestSchema = z.object({
  symbol: z.string().min(1),
});

export const BinanceReferencePriceCalculationRequestSchema = z.object({
  symbol: z.string().min(1),
  symbolStatus: z.enum(["TRADING", "HALT", "BREAK"]).optional(),
});

export const BinanceAggTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  fromId: z.number().int().nonnegative().optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceKlineIntervalSchema = z.enum([
  "1s",
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
]);

export const BinanceKlinesRequestSchema = z.object({
  symbol: z.string().min(1),
  interval: BinanceKlineIntervalSchema,
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  timeZone: z.string().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceUiKlinesRequestSchema = BinanceKlinesRequestSchema;

export const BinanceTicker24hrRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  symbols: z.array(z.string().min(1)).optional(),
  type: z.enum(["FULL", "MINI"]).optional(),
});

export const BinanceTickerTradingDayRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  symbols: z.array(z.string().min(1)).max(100).optional(),
  timeZone: z.string().optional(),
  type: z.enum(["FULL", "MINI"]).optional(),
  symbolStatus: z.enum(["TRADING", "HALT", "BREAK"]).optional(),
});

export const BinanceTickerPriceRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  symbols: z.array(z.string().min(1)).optional(),
  symbolStatus: z.enum(["TRADING", "HALT", "BREAK"]).optional(),
});

export const BinanceTickerBookTickerRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  symbols: z.array(z.string().min(1)).optional(),
  symbolStatus: z.enum(["TRADING", "HALT", "BREAK"]).optional(),
});

export const BinanceTickerRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  symbols: z.array(z.string().min(1)).max(100).optional(),
  windowSize: z
    .string()
    .regex(/^(?:[1-9]|[1-5][0-9])m$|^(?:[1-9]|1[0-9]|2[0-3])h$|^[1-7]d$/)
    .optional(),
  type: z.enum(["FULL", "MINI"]).optional(),
  symbolStatus: z.enum(["TRADING", "HALT", "BREAK"]).optional(),
});

export const BinanceTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceHistoricalTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z.number().int().positive().max(1000).optional(),
  fromId: z.number().int().nonnegative().optional(),
});

export const BinanceHistoricalBlockTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  fromId: z.number().int().nonnegative(),
  limit: z.number().int().positive().max(1000).optional(),
});

const BinanceFapiDepthLimitSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(20),
  z.literal(50),
  z.literal(100),
  z.literal(500),
  z.literal(1000),
]);

export const BinanceFapiDepthRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: BinanceFapiDepthLimitSchema.optional(),
});

export const BinanceFapiRpiDepthRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z.literal(1000).optional(),
});

export const BinanceFapiTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceFapiAggTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  fromId: z.number().int().nonnegative().optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceFapiKlineIntervalSchema = z.enum([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
]);

export const BinanceFapiKlinesRequestSchema = z.object({
  symbol: z.string().min(1),
  interval: BinanceFapiKlineIntervalSchema,
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1500).optional(),
});

export const BinanceFapiContinuousKlinesRequestSchema = z.object({
  pair: z.string().min(1),
  contractType: z.enum([
    "PERPETUAL",
    "CURRENT_QUARTER",
    "NEXT_QUARTER",
    "TRADIFI_PERPETUAL",
  ]),
  interval: BinanceFapiKlineIntervalSchema,
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1500).optional(),
});

export const BinanceFapiIndexPriceKlinesRequestSchema = z.object({
  pair: z.string().min(1),
  interval: BinanceFapiKlineIntervalSchema,
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1500).optional(),
});

export const BinanceFapiMarkPriceKlinesRequestSchema =
  BinanceFapiKlinesRequestSchema;

export const BinanceFapiPremiumIndexKlinesRequestSchema =
  BinanceFapiKlinesRequestSchema;

export const BinanceFapiPremiumIndexRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceFapiFundingRateRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceFapiTicker24hrRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceFapiTickerBookTickerRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceFapiV2TickerPriceRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceFapiOpenInterestRequestSchema = z.object({
  symbol: z.string().min(1),
});

export const BinanceFapiIndexInfoRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceFapiAssetIndexRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceFapiConstituentsRequestSchema = z.object({
  symbol: z.string().min(1),
});

export const BinanceFapiInsuranceBalanceRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceFapiSymbolAdlRiskRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceFuturesDataPeriodSchema = z.enum([
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "12h",
  "1d",
]);

export const BinanceFuturesDataDeliveryPriceRequestSchema = z.object({
  pair: z.string().min(1),
});

export const BinanceFuturesDataOpenInterestHistRequestSchema = z.object({
  symbol: z.string().min(1),
  period: BinanceFuturesDataPeriodSchema,
  limit: z.number().int().positive().max(500).optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
});

export const BinanceFuturesDataLongShortRatioRequestSchema = z.object({
  symbol: z.string().min(1),
  period: BinanceFuturesDataPeriodSchema,
  limit: z.number().int().positive().max(500).optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
});

export const BinanceFuturesDataTakerlongshortRatioRequestSchema =
  BinanceFuturesDataLongShortRatioRequestSchema;

export const BinanceFuturesDataBasisRequestSchema = z.object({
  pair: z.string().min(1),
  contractType: z.enum(["CURRENT_QUARTER", "NEXT_QUARTER", "PERPETUAL"]),
  period: BinanceFuturesDataPeriodSchema,
  limit: z.number().int().positive().max(500).optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
});

export const BinanceOptionTickerRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceOptionExerciseHistoryRequestSchema = z.object({
  underlying: z.string().min(1).optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const BinanceOptionOpenInterestRequestSchema = z.object({
  underlyingAsset: z.string().min(1),
  expiration: z.string().min(1),
});

export const BinanceOptionDepthRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z
    .union([
      z.literal(10),
      z.literal(20),
      z.literal(50),
      z.literal(100),
      z.literal(500),
      z.literal(1000),
    ])
    .optional(),
});

export const BinanceOptionTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z.number().int().positive().max(500).optional(),
});

export const BinanceOptionBlockTradesRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  limit: z.number().int().positive().max(500).optional(),
});

export const BinanceOptionIndexRequestSchema = z.object({
  underlying: z.string().min(1),
});

export const BinanceOptionKlineIntervalSchema = z.enum([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
]);

export const BinanceOptionKlinesRequestSchema = z.object({
  symbol: z.string().min(1),
  interval: BinanceOptionKlineIntervalSchema,
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1500).optional(),
});

export const BinanceOptionMarkPriceRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
});

export const BinanceCoinMContractTypeSchema = z.enum([
  "PERPETUAL",
  "CURRENT_QUARTER",
  "NEXT_QUARTER",
]);

export const BinanceCoinMStatsContractTypeSchema = z.enum([
  "ALL",
  "PERPETUAL",
  "CURRENT_QUARTER",
  "NEXT_QUARTER",
]);

export const BinanceCoinMKlineIntervalSchema = z.enum([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
]);

export const BinanceCoinMStatsPeriodSchema = z.enum([
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "12h",
  "1d",
]);

export const BinanceCoinMDepthRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceCoinMTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceCoinMAggTradesRequestSchema = z.object({
  symbol: z.string().min(1),
  fromId: z.number().int().nonnegative().optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceCoinMPremiumIndexRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  pair: z.string().min(1).optional(),
});

export const BinanceCoinMFundingRateRequestSchema = z.object({
  symbol: z.string().min(1),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const BinanceCoinMKlinesRequestSchema = z.object({
  symbol: z.string().min(1),
  interval: BinanceCoinMKlineIntervalSchema,
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1500).optional(),
});

export const BinanceCoinMContinuousKlinesRequestSchema = z.object({
  pair: z.string().min(1),
  contractType: BinanceCoinMContractTypeSchema,
  interval: BinanceCoinMKlineIntervalSchema,
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1500).optional(),
});

export const BinanceCoinMIndexPriceKlinesRequestSchema = z.object({
  pair: z.string().min(1),
  interval: BinanceCoinMKlineIntervalSchema,
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1500).optional(),
});

export const BinanceCoinMMarkPriceKlinesRequestSchema =
  BinanceCoinMKlinesRequestSchema;

export const BinanceCoinMPremiumIndexKlinesRequestSchema =
  BinanceCoinMKlinesRequestSchema;

export const BinanceCoinMTickerRequestSchema = z.object({
  symbol: z.string().min(1).optional(),
  pair: z.string().min(1).optional(),
});

export const BinanceCoinMOpenInterestRequestSchema = z.object({
  symbol: z.string().min(1),
});

export const BinanceCoinMConstituentsRequestSchema = z.object({
  symbol: z.string().min(1),
});

export const BinanceCoinMDeliveryPriceRequestSchema = z.object({
  pair: z.string().min(1),
});

export const BinanceCoinMStatsBaseRequestSchema = z.object({
  pair: z.string().min(1),
  period: BinanceCoinMStatsPeriodSchema,
  limit: z.number().int().positive().max(500).optional(),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
});

export const BinanceCoinMOpenInterestHistRequestSchema =
  BinanceCoinMStatsBaseRequestSchema.extend({
    contractType: BinanceCoinMStatsContractTypeSchema,
  });

export const BinanceCoinMTopLongShortPositionRatioRequestSchema =
  BinanceCoinMStatsBaseRequestSchema;

export const BinanceCoinMTopLongShortAccountRatioRequestSchema =
  BinanceCoinMStatsBaseRequestSchema;

export const BinanceCoinMGlobalLongShortAccountRatioRequestSchema =
  BinanceCoinMStatsBaseRequestSchema;

export const BinanceCoinMTakerBuySellVolRequestSchema =
  BinanceCoinMStatsBaseRequestSchema.extend({
    contractType: BinanceCoinMStatsContractTypeSchema,
  });

export const BinanceCoinMBasisRequestSchema =
  BinanceCoinMStatsBaseRequestSchema.extend({
    contractType: BinanceCoinMContractTypeSchema,
  });
