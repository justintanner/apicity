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

// The regions Endless publishes X trends for, as its OpenAPI document listed
// them on 2026-10-28, in that order: `worldwide`, then countries by continent.
export const EndlessTrendsRegionSchema = z.enum([
  "worldwide",
  "argentina",
  "brazil",
  "canada",
  "chile",
  "colombia",
  "dominican-republic",
  "ecuador",
  "guatemala",
  "mexico",
  "panama",
  "peru",
  "puerto-rico",
  "united-states",
  "venezuela",
  "austria",
  "belarus",
  "belgium",
  "denmark",
  "france",
  "germany",
  "greece",
  "ireland",
  "italy",
  "latvia",
  "netherlands",
  "norway",
  "poland",
  "portugal",
  "russia",
  "spain",
  "sweden",
  "switzerland",
  "turkey",
  "ukraine",
  "united-kingdom",
  "india",
  "indonesia",
  "japan",
  "malaysia",
  "pakistan",
  "philippines",
  "singapore",
  "south-korea",
  "thailand",
  "vietnam",
  "bahrain",
  "israel",
  "jordan",
  "kuwait",
  "lebanon",
  "oman",
  "qatar",
  "saudi-arabia",
  "united-arab-emirates",
  "algeria",
  "egypt",
  "ghana",
  "kenya",
  "nigeria",
  "south-africa",
  "australia",
  "new-zealand",
]);

export const EndlessTrendsPublicRequestSchema = z.object({
  region: EndlessTrendsRegionSchema.describe(
    "Region slug, e.g. `worldwide` or `argentina`."
  ),
});
