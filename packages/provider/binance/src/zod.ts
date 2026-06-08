import { z } from "zod";

export const BinanceOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type BinanceOptions = z.infer<typeof BinanceOptionsSchema>;
