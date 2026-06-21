import { z } from "zod";

export const SimpleFunctionsOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().url().optional(),
  dataBaseURL: z.string().url().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export const SimpleFunctionsModeSchema = z.enum(["full", "raw"]);
export const SimpleFunctionsSourceSchema = z.enum([
  "kalshi",
  "polymarket",
  "x",
  "content",
  "traditional",
]);
export const SimpleFunctionsModelSchema = z.enum(["cheap", "medium", "heavy"]);
export const SimpleFunctionsNextActionsSchema = z.literal("off");
export const SimpleFunctionsNoRequestSchema = z.undefined();
export const SimpleFunctionsVenueSchema = z.enum(["kalshi", "polymarket"]);
export const SimpleFunctionsStrictSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.boolean(),
]);
export const SimpleFunctionsMoverWindowSchema = z.enum([
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
  "24h",
  "1d",
]);
export const SimpleFunctionsMoverDirectionSchema = z.enum([
  "up",
  "down",
  "both",
]);
export const SimpleFunctionsFormatSchema = z.enum(["json", "markdown"]);
export const SimpleFunctionsWorldOperationSchema = z.enum([
  "snapshot",
  "catalyst",
  "dispersion",
  "history",
  "trail",
  "explain",
]);

const nonEmptyString = (name: string) =>
  z.string().refine((value) => value.trim().length > 0, {
    message: `${name} is required`,
  });

export const SimpleFunctionsQueryRequestSchema = z.object({
  q: z.string().refine((value) => value.trim().length >= 2, {
    message: 'Query parameter "q" is required (min 2 chars)',
  }),
  mode: SimpleFunctionsModeSchema.optional(),
  sources: z.array(SimpleFunctionsSourceSchema).min(1).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  model: SimpleFunctionsModelSchema.optional(),
  depth: z.boolean().optional(),
  nextActions: SimpleFunctionsNextActionsSchema.optional(),
});

export const SimpleFunctionsWorldRequestSchema = z.object({
  format: SimpleFunctionsFormatSchema.optional(),
  compact: z.boolean().optional(),
  limit: z.number().int().min(1).max(30).optional(),
  depth: z.number().int().min(0).max(3).optional(),
  since: nonEmptyString("since").optional(),
  focus: nonEmptyString("focus").optional(),
  op: SimpleFunctionsWorldOperationSchema.optional(),
  window: nonEmptyString("window").optional(),
  dt: nonEmptyString("dt").optional(),
  from: nonEmptyString("from").optional(),
  item: nonEmptyString("item").optional(),
});

export const SimpleFunctionsWorldPathRequestSchema =
  SimpleFunctionsWorldRequestSchema.extend({
    path: z.union([
      nonEmptyString("path"),
      z.array(nonEmptyString("path segment")).min(1),
    ]),
  });

export const SimpleFunctionsWorldDeltaRequestSchema = z.object({
  since: nonEmptyString("since"),
  format: SimpleFunctionsFormatSchema.optional(),
});

export const SimpleFunctionsInspectRequestSchema = z.object({
  ticker: nonEmptyString("ticker"),
  format: SimpleFunctionsFormatSchema.optional(),
  contagion: z.boolean().optional(),
  diff: z.boolean().optional(),
  trend: z.boolean().optional(),
  nextActions: SimpleFunctionsNextActionsSchema.optional(),
});

export const SimpleFunctionsAgentFeedRequestSchema = z.object({
  topic: nonEmptyString("topic"),
  since: nonEmptyString("since").optional(),
  limit: z.number().int().min(1).optional(),
  format: SimpleFunctionsFormatSchema.optional(),
});

export const SimpleFunctionsMarketsRequestSchema = z.object({
  q: z.string().optional(),
  venue: SimpleFunctionsVenueSchema.optional(),
});

export const SimpleFunctionsFeaturedMarketsRequestSchema = z.object({
  n: z.number().int().positive().optional(),
});

export const SimpleFunctionsSearchRequestSchema = z.object({
  q: z.string().refine((value) => value.trim().length > 0, {
    message: 'Query parameter "q" is required',
  }),
  limit: z.number().int().min(1).max(50).optional(),
  venue: SimpleFunctionsVenueSchema.optional(),
  strict: SimpleFunctionsStrictSchema.optional(),
});

export const SimpleFunctionsMoversRequestSchema = z.object({
  window: SimpleFunctionsMoverWindowSchema.optional(),
  n: z.number().int().min(10).max(200).optional(),
  minVol: z.number().nonnegative().optional(),
  dir: SimpleFunctionsMoverDirectionSchema.optional(),
});

export const SimpleFunctionsCandlesRequestSchema = z.object({
  tf: z.string().min(1).optional(),
  limit: z.number().int().positive().optional(),
});

export const SimpleFunctionsTradesRequestSchema = z.object({
  limit: z.number().int().positive().optional(),
});

export const SimpleFunctionsTickerSchema = z
  .string()
  .refine((value) => value.trim().length > 0, {
    message: "Ticker is required",
  });

export type SimpleFunctionsOptions = z.infer<
  typeof SimpleFunctionsOptionsSchema
>;
export type SimpleFunctionsMode = z.infer<typeof SimpleFunctionsModeSchema>;
export type SimpleFunctionsSource = z.infer<typeof SimpleFunctionsSourceSchema>;
export type SimpleFunctionsModel = z.infer<typeof SimpleFunctionsModelSchema>;
export type SimpleFunctionsNextActions = z.infer<
  typeof SimpleFunctionsNextActionsSchema
>;
export type SimpleFunctionsNoRequest = z.infer<
  typeof SimpleFunctionsNoRequestSchema
>;
export type SimpleFunctionsVenue = z.infer<typeof SimpleFunctionsVenueSchema>;
export type SimpleFunctionsStrict = z.infer<typeof SimpleFunctionsStrictSchema>;
export type SimpleFunctionsMoverWindow = z.infer<
  typeof SimpleFunctionsMoverWindowSchema
>;
export type SimpleFunctionsMoverDirection = z.infer<
  typeof SimpleFunctionsMoverDirectionSchema
>;
export type SimpleFunctionsFormat = z.infer<typeof SimpleFunctionsFormatSchema>;
export type SimpleFunctionsWorldOperation = z.infer<
  typeof SimpleFunctionsWorldOperationSchema
>;
export type SimpleFunctionsQueryRequest = z.infer<
  typeof SimpleFunctionsQueryRequestSchema
>;
export type SimpleFunctionsWorldRequest = z.infer<
  typeof SimpleFunctionsWorldRequestSchema
>;
export type SimpleFunctionsWorldPathRequest = z.infer<
  typeof SimpleFunctionsWorldPathRequestSchema
>;
export type SimpleFunctionsWorldDeltaRequest = z.infer<
  typeof SimpleFunctionsWorldDeltaRequestSchema
>;
export type SimpleFunctionsInspectRequest = z.infer<
  typeof SimpleFunctionsInspectRequestSchema
>;
export type SimpleFunctionsAgentFeedRequest = z.infer<
  typeof SimpleFunctionsAgentFeedRequestSchema
>;
export type SimpleFunctionsMarketsRequest = z.infer<
  typeof SimpleFunctionsMarketsRequestSchema
>;
export type SimpleFunctionsFeaturedMarketsRequest = z.infer<
  typeof SimpleFunctionsFeaturedMarketsRequestSchema
>;
export type SimpleFunctionsSearchRequest = z.infer<
  typeof SimpleFunctionsSearchRequestSchema
>;
export type SimpleFunctionsMoversRequest = z.infer<
  typeof SimpleFunctionsMoversRequestSchema
>;
export type SimpleFunctionsCandlesRequest = z.infer<
  typeof SimpleFunctionsCandlesRequestSchema
>;
export type SimpleFunctionsTradesRequest = z.infer<
  typeof SimpleFunctionsTradesRequestSchema
>;
export type SimpleFunctionsTicker = z.infer<typeof SimpleFunctionsTickerSchema>;
