import { z } from "zod";

export const BinanceOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  eapiBaseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

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
