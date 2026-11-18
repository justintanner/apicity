import { z } from "zod";

const NunchuxGeminiImageModelAliasSchema = z
  .string()
  .regex(/^gemini-[a-z0-9.-]+$/);

export const NunchuxGoogleInteractionsRequestSchema = z.object({
  model: z
    .enum([
      "gemini-3.1-flash-image",
      "gemini-nano-banana-2.1",
      "gemini-3-pro-image",
    ])
    .or(NunchuxGeminiImageModelAliasSchema)
    .describe(
      "Gemini image model. Nunchux lists gemini-3.1-flash-image as the default."
    ),
  input: z
    .array(
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("text"), text: z.string() }),
        z.object({
          type: z.literal("image"),
          data: z.base64().describe("Raw base64 image bytes."),
          mime_type: z.string(),
        }),
      ])
    )
    .min(1)
    .refine(
      (parts) => parts.filter((part) => part.type === "image").length <= 14,
      "At most 14 reference images"
    )
    .describe(
      "Start with the text prompt. Add up to 14 image parts for an edit."
    ),
  response_format: z.object({
    type: z.literal("image"),
    image_size: z
      .enum(["512", "1K", "2K", "4K"])
      .optional()
      .describe(
        "Omitting image_size on Nano Banana 2.1 bills at 4K, the most expensive tier. Only gemini-3.1-flash-image accepts 512."
      ),
    aspect_ratio: z
      .enum([
        "1:1",
        "2:3",
        "3:2",
        "3:4",
        "4:3",
        "4:5",
        "5:4",
        "9:16",
        "16:9",
        "21:9",
        "1:8",
        "8:1",
        "1:4",
        "4:1",
      ])
      .optional()
      .describe(
        "On an edit, omitting the ratio keeps the first input image's shape."
      ),
  }),
});
export type NunchuxGoogleInteractionsRequest = z.input<
  typeof NunchuxGoogleInteractionsRequestSchema
>;
