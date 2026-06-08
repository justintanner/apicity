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
