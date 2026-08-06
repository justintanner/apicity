/**
 * 4o Image callback payload — body kie POSTs to callBackUrl.
 * Docs: https://docs.kie.ai/4o-image-api/generate-4-o-image-callbacks
 */
import { z } from "zod";

export const Gpt4oImageCallbackInfoSchema = z
  .object({
    result_urls: z.array(z.string()).optional(),
  })
  .passthrough();

export const Gpt4oImageCallbackDataSchema = z
  .object({
    taskId: z.string(),
    info: Gpt4oImageCallbackInfoSchema.nullable().optional(),
  })
  .passthrough();

export const Gpt4oImageCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: Gpt4oImageCallbackDataSchema,
  })
  .passthrough();

export type Gpt4oImageCallbackInfo = z.infer<
  typeof Gpt4oImageCallbackInfoSchema
>;
export type Gpt4oImageCallbackData = z.infer<
  typeof Gpt4oImageCallbackDataSchema
>;
export type Gpt4oImageCallbackPayload = z.infer<
  typeof Gpt4oImageCallbackPayloadSchema
>;
