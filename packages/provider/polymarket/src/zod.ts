import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

// Polymarket exposes three separate hosts, all of which serve a public,
// no-auth surface for read-only data. Each host can be overridden
// independently for testing/proxying. There is no apiKey field — the
// authenticated CLOB trading surface is intentionally not implemented here.
export const PolymarketOptionsSchema = z.object({
  gammaBaseURL: z.string().optional(),
  dataBaseURL: z.string().optional(),
  clobBaseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type PolymarketOptions = z.infer<typeof PolymarketOptionsSchema>;
