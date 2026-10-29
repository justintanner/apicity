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

export const OmkarExploreCategorySchema = z
  .enum([
    "all",
    "singing-dancing",
    "comedy",
    "sports",
    "anime-comics",
    "relationship",
    "shows",
    "lipsync",
    "daily-life",
    "beauty-care",
    "games",
    "society",
    "outfit",
    "cars",
    "food",
    "animals",
    "family",
    "drama",
    "fitness-health",
    "education",
    "technology",
  ])
  .describe(
    "Explore tab to read; `/feed/explore/categories` lists them. Omitted, Omkar uses `all`."
  );

export const OmkarFeedExploreRequestSchema = z.object({
  country: OmkarCountrySchema.optional(),
  category: OmkarExploreCategorySchema.optional(),
});
