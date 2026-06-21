import { z } from "zod";

export const SimpleFunctionsOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().url().optional(),
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

export type SimpleFunctionsOptions = z.infer<
  typeof SimpleFunctionsOptionsSchema
>;
export type SimpleFunctionsMode = z.infer<typeof SimpleFunctionsModeSchema>;
export type SimpleFunctionsSource = z.infer<typeof SimpleFunctionsSourceSchema>;
export type SimpleFunctionsModel = z.infer<typeof SimpleFunctionsModelSchema>;
export type SimpleFunctionsNextActions = z.infer<
  typeof SimpleFunctionsNextActionsSchema
>;
export type SimpleFunctionsQueryRequest = z.infer<
  typeof SimpleFunctionsQueryRequestSchema
>;
