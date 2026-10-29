import { z } from "zod";

export const OmkarCountrySchema = z
  .string()
  .regex(/^[A-Z]{2}$/)
  .describe(
    "ISO 3166-1 alpha-2 country code whose TikTok edition answers (the request leaves from that country), e.g. `TH`. Omitted, Omkar uses `US`."
  );

export const OmkarFeedTrendingRequestSchema = z.object({
  country: OmkarCountrySchema.optional(),
});
