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
      "happyhorse-1.0-video-edit",
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
        "Omit for text-to-video. A first frame and a reference set cannot be combined. Wan 3.0 and Prime accept up to 10 reference images, reference_video clips with up to 15 billable input seconds (30 seconds maximum including output), and up to 5 reference audio items totaling 15 seconds. Wan 2.7 accepts up to 5 reference images or reference clips. Wan 2.7 Video Edit takes a 2–10 second source clip."
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

const NunchuxSeedanceModelAliasSchema = z
  .string()
  .regex(/^(dreamina-)?seedance-\d+-\d+(-[a-z]+)*-\d{6}$/);
const seedanceWebUrl = z
  .httpUrl()
  .describe("A public HTTP or HTTPS URL the provider can fetch.");

export const NunchuxBytedanceGenerationTasksRequestSchema = z.object({
  model: z
    .enum(["dreamina-seedance-2-5-260628", "dreamina-seedance-2-0-260128"])
    .or(NunchuxSeedanceModelAliasSchema),
  content: z
    .array(
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("text"), text: z.string() }),
        z.object({
          type: z.literal("image_url"),
          role: z
            .enum(["first_frame", "last_frame", "reference_image"])
            .optional(),
          image_url: z.object({ url: seedanceWebUrl }),
        }),
        z.object({
          type: z.literal("video_url"),
          role: z.literal("reference_video"),
          video_url: z.object({ url: seedanceWebUrl }),
        }),
        z.object({
          type: z.literal("audio_url"),
          role: z.literal("reference_audio"),
          audio_url: z.object({
            url: seedanceWebUrl.describe(
              "Public audio clip, up to 30 seconds."
            ),
          }),
        }),
      ])
    )
    .min(1)
    .refine(
      (items) => items[0]?.type === "text",
      "The first content item must be the text prompt."
    )
    .describe(
      "Start with the text prompt. Add a first frame for image-to-video or reference media for reference-to-video. Frame items and reference items cannot be combined."
    ),
  duration: z
    .number()
    .int()
    .min(4)
    .optional()
    .describe("Output length in whole seconds, at least 4."),
  resolution: z.enum(["480p", "720p"]).optional().describe("Defaults to 720p."),
  generate_audio: z
    .boolean()
    .optional()
    .describe(
      "Defaults to true. The provider lists generated audio as a billing dimension."
    ),
});
export type NunchuxBytedanceGenerationTasksRequest = z.input<
  typeof NunchuxBytedanceGenerationTasksRequestSchema
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

const NunchuxMinimaxVideoModelAliasSchema = z
  .string()
  .regex(/^MiniMax-[A-Za-z0-9.-]+$/);
const minimaxMediaUrl = z.object({
  url: z.url().describe("Public URL the provider can fetch."),
});

export const NunchuxMinimaxVideoGenerationRequestSchema = z.object({
  model: z
    .enum(["MiniMax-H3"])
    .or(NunchuxMinimaxVideoModelAliasSchema)
    .describe(
      "MiniMax video model. MiniMax-H3 serves text-to-video, image-to-video and reference-to-video; the content items pick the task."
    ),
  content: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("text"),
          text: z
            .string()
            .max(7000)
            .describe("The prompt, up to 7,000 characters."),
        }),
        z.object({
          type: z.literal("image_url"),
          role: z.enum(["first_frame", "last_frame", "reference_image"]),
          image_url: minimaxMediaUrl,
        }),
        z.object({
          type: z.literal("video_url"),
          role: z.literal("reference_video"),
          video_url: minimaxMediaUrl,
        }),
        z.object({
          type: z.literal("audio_url"),
          role: z.literal("reference_audio"),
          audio_url: minimaxMediaUrl,
        }),
      ])
    )
    .describe(
      "Put the text item first. A first_frame (and optional last_frame) image gives image-to-video; reference_image, reference_video and reference_audio items give reference-to-video, and the two role sets never mix in one body. Up to 9 reference images, 3 reference clips (2–15 s each, 15 s in total) and 1 reference track, 12 files in all. Upstream accepts a role on the wrong container and then ignores it, so keep each role on its own container."
    ),
  resolution: z
    .enum(["768P", "2K"])
    .optional()
    .describe(
      "Output tier. 2K costs more per second. The docs state no default."
    ),
  duration: z
    .number()
    .int()
    .min(4)
    .max(15)
    .describe("Clip length in whole seconds, 4–15, billed per second."),
  ratio: z
    .enum(["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
    .optional()
    .describe(
      "Required on a text-only body, where adaptive is rejected. Omit it when the body carries media: the output then follows the source."
    ),
});
export type NunchuxMinimaxVideoGenerationRequest = z.input<
  typeof NunchuxMinimaxVideoGenerationRequestSchema
>;
