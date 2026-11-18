import { z } from "zod";

const NunchuxAlibabaVideoModelAliasSchema = z
  .string()
  .regex(
    /^(wan\d+\.\d+-(t2v|i2v|r2v|video|videoedit)|happyhorse-\d+\.\d+-(t2v|i2v|r2v|video-edit))(-[a-z]+)?$/
  );

export const NunchuxAlibabaVideoSynthesisRequestSchema = z.object({
  model: z
    .enum([
      "wan3.0-video",
      "wan3.0-video-prime",
      "wan2.7-t2v",
      "wan2.7-i2v",
      "wan2.7-r2v",
      "wan2.7-videoedit",
      "happyhorse-1.1-t2v",
      "happyhorse-1.1-i2v",
      "happyhorse-1.1-r2v",
      "happyhorse-1.0-t2v",
      "happyhorse-1.0-i2v",
      "happyhorse-1.0-r2v",
    ])
    .or(NunchuxAlibabaVideoModelAliasSchema),
  input: z.object({
    prompt: z
      .string()
      .describe(
        "Name references by kind and position, for example Image 1, Video 1 or Audio 1."
      ),
    media: z
      .array(
        z.object({
          type: z.enum([
            "first_frame",
            "last_frame",
            "driving_audio",
            "reference_image",
            "reference_video",
            "reference_audio",
            "video",
          ]),
          url: z.url().describe("Public URL the provider can fetch."),
        })
      )
      .optional()
      .describe(
        "Omit for text-to-video. A first frame and a reference set cannot be combined. Wan 3.0 accepts up to 10 reference images and 5 reference audio items totaling 15 seconds. Wan 2.7 accepts up to 5 reference images or a 2–10 second edit source clip."
      ),
  }),
  parameters: z
    .object({
      resolution: z
        .enum(["480P", "720P", "1080P"])
        .optional()
        .describe(
          "Defaults to 1080P, the most expensive tier. 480P is available on Wan 3.0, Wan 3.0 Prime and HappyHorse 1.1."
        ),
      duration: z
        .number()
        .int()
        .min(2)
        .max(30)
        .optional()
        .describe(
          "Output seconds, default 5. Wan 3.0 accepts 2–30, Wan 2.7 accepts 2–15 (2–10 for edits), and HappyHorse accepts 3–15."
        ),
      watermark: z.boolean().optional().describe("Defaults to false."),
    })
    .optional(),
});
export type NunchuxAlibabaVideoSynthesisRequest = z.input<
  typeof NunchuxAlibabaVideoSynthesisRequestSchema
>;

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
