import { z } from "zod";

// Every value below was accepted by live calls on 2026-10-28. Creative Center
// answers any other periodDimension or orderByMetric (0 and 4 were tried), or
// a request without either, with BaseResp.StatusCode 38014004 "not supported
// top contents setting".
export const TiktokCreativeCenterPeriodDimensionSchema = z
  .literal([1, 2, 3])
  .describe(
    "3 for the weekly list, 2 for the monthly list. 1 answered the weekly list on 2026-10-28."
  );

export const TiktokCreativeCenterOrderByMetricSchema = z
  .literal([1, 2, 3])
  .describe(
    "1 ranks by video views, 2 by engagement rate, 3 by six-second view-through rate."
  );

export const TiktokCreativeCenterGetTopContentsListRequestSchema = z.object({
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .describe(
      "ISO 3166-1 alpha-2 country code, e.g. `TH`. A country without a list answers an empty one."
    ),
  periodDimension: TiktokCreativeCenterPeriodDimensionSchema,
  periodEndTimestamp: z
    .number()
    .int()
    .describe(
      "Unix seconds that end the period, such as lastWeeklyEndTimestamp or lastMonthlyEndTimestamp from ads.creativeOne.report.getTopContentsOverview. A value Creative Center has no list for answers an empty one."
    ),
  orderByMetric: TiktokCreativeCenterOrderByMetricSchema,
  organicOnly: z.boolean().optional().describe("true drops sponsored posts."),
  contentLabelIDs: z
    .string()
    .optional()
    .describe("Content category ids; empty or omitted for all categories."),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Ignored without a TikTok One session: every answer is page 1."),
  limit: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      "Ignored without a TikTok One session: every answer holds 4 rows."
    ),
});
