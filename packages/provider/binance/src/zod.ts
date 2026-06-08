import { z } from "zod";

export const BinanceOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
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
