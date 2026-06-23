import { z } from "zod";

export const TheSportsDBOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type TheSportsDBOptions = z.infer<typeof TheSportsDBOptionsSchema>;
