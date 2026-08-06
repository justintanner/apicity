/**
 * Flux Kontext callback payload — body kie POSTs to callBackUrl.
 * Docs: https://docs.kie.ai/flux-kontext-api/generate-or-edit-image-callbacks
 */
import { z } from "zod";

export const FluxKontextCallbackInfoSchema = z
  .object({
    originImageUrl: z.string().optional(),
    resultImageUrl: z.string().optional(),
  })
  .passthrough();

export const FluxKontextCallbackDataSchema = z
  .object({
    taskId: z.string(),
    info: FluxKontextCallbackInfoSchema.optional(),
  })
  .passthrough();

export const FluxKontextCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: FluxKontextCallbackDataSchema,
  })
  .passthrough();

export type FluxKontextCallbackInfo = z.infer<
  typeof FluxKontextCallbackInfoSchema
>;
export type FluxKontextCallbackData = z.infer<
  typeof FluxKontextCallbackDataSchema
>;
export type FluxKontextCallbackPayload = z.infer<
  typeof FluxKontextCallbackPayloadSchema
>;
