/**
 * Runway callback payloads — bodies kie POSTs to callBackUrl.
 * Docs:
 * - https://docs.kie.ai/runway-api/generate-ai-video-callbacks
 * - https://docs.kie.ai/runway-api/extend-ai-video-callbacks
 * Aleph (video-to-video) uses the same generation callback family.
 */
import { z } from "zod";

export const RunwayGenerateCallbackDataSchema = z
  .object({
    task_id: z.string(),
    video_id: z.string().optional(),
    video_url: z.string().optional(),
    image_url: z.string().optional(),
  })
  .passthrough();

export const RunwayGenerateCallbackPayloadSchema = z
  .object({
    code: z.number().int(),
    msg: z.string(),
    data: RunwayGenerateCallbackDataSchema,
  })
  .passthrough();

/** Extend callbacks share the generate shape in current docs. */
export const RunwayExtendCallbackDataSchema = RunwayGenerateCallbackDataSchema;
export const RunwayExtendCallbackPayloadSchema =
  RunwayGenerateCallbackPayloadSchema;

/** Aleph (video-to-video) uses the generation callback family. */
export const RunwayAlephCallbackDataSchema = RunwayGenerateCallbackDataSchema;
export const RunwayAlephCallbackPayloadSchema =
  RunwayGenerateCallbackPayloadSchema;

export type RunwayGenerateCallbackData = z.infer<
  typeof RunwayGenerateCallbackDataSchema
>;
export type RunwayGenerateCallbackPayload = z.infer<
  typeof RunwayGenerateCallbackPayloadSchema
>;
export type RunwayExtendCallbackData = RunwayGenerateCallbackData;
export type RunwayExtendCallbackPayload = RunwayGenerateCallbackPayload;
export type RunwayAlephCallbackData = RunwayGenerateCallbackData;
export type RunwayAlephCallbackPayload = RunwayGenerateCallbackPayload;
