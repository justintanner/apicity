import { z } from "zod";

// The country slugs Endless publishes TikTok trends for, as its OpenAPI
// document (https://api.endless.app/openapi.json) listed them on 2026-10-28.
// Any other value, including an ISO code like `TH`, is a 404
// `invalid_path_parameter`.
export const EndlessTikTokTrendsRegionSchema = z.enum([
  "argentina",
  "brazil",
  "canada",
  "chile",
  "colombia",
  "dominican-republic",
  "egypt",
  "indonesia",
  "japan",
  "malaysia",
  "mexico",
  "peru",
  "philippines",
  "saudi-arabia",
  "thailand",
  "turkey",
  "united-kingdom",
  "united-states",
  "venezuela",
  "vietnam",
]);

export const EndlessTikTokTrendsPublicRequestSchema = z.object({
  region: EndlessTikTokTrendsRegionSchema.describe(
    "Country slug, e.g. `thailand`."
  ),
});
