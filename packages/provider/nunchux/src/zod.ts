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

// Published ids: gpt-image-2, gpt-image-2.5-sunburst, gpt-image-2.5-flare,
// gpt-image-2.6-sunburst, gpt-image-2.6-flare, plus a -YYYY-MM-DD snapshot.
// Re-read 2026-11-19 from the model list and the GPT Image page.
const NunchuxGptImageModelAliasSchema = z
  .string()
  .regex(
    /^gpt-image-\d+(?:\.\d+)?(?:-(?:sunburst|flare))?(?:-\d{4}-\d{2}-\d{2})?$/
  );

const GPT_IMAGE_MIN_PIXELS = 655_360;
const GPT_IMAGE_MAX_PIXELS = 8_294_400;
const GPT_IMAGE_MAX_EDGE = 3840;
const GPT_IMAGE_MAX_BATCH_PIXELS = 24_000_000;

function gptImageSizeProblem(size: string, n: number): string | undefined {
  if (size === "auto") return undefined;
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) return "size must be auto or WIDTHxHEIGHT";
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width % 16 !== 0 || height % 16 !== 0) {
    return "size edges must be multiples of 16";
  }
  if (width > GPT_IMAGE_MAX_EDGE || height > GPT_IMAGE_MAX_EDGE) {
    return "size edges must be at most 3840";
  }
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  if (short === 0 || long > short * 3) {
    return "the long edge can be at most three times the short edge";
  }
  const pixels = width * height;
  if (pixels < GPT_IMAGE_MIN_PIXELS || pixels > GPT_IMAGE_MAX_PIXELS) {
    return "size must have between 655360 and 8294400 pixels";
  }
  if (n * pixels > GPT_IMAGE_MAX_BATCH_PIXELS) {
    return "n times the image size must be at most 24000000 pixels";
  }
  return undefined;
}

export const NunchuxOpenAiImagesGenerationsRequestSchema = z
  .object({
    model: z
      .enum(["gpt-image-2.6-sunburst", "gpt-image-2.6-flare"])
      .or(NunchuxGptImageModelAliasSchema)
      .describe(
        "GPT Image 2.6 model. Nunchux serves gpt-image-2.6-sunburst and gpt-image-2.6-flare. OpenAI's xhigh and max qualities are not offered, so the Artificial Analysis (max) setting cannot be reproduced; the highest quality is high."
      ),
    prompt: z
      .string()
      .min(1)
      .max(32_000)
      .describe("What to generate, up to 32,000 characters."),
    n: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe(
        "How many images to return. Defaults to 1. Each image is billed."
      ),
    size: z
      .string()
      .optional()
      .describe(
        "auto, or WIDTHxHEIGHT such as 1024x1024. Defaults to auto, which Nunchux holds as 1536x1024. Both edges must be multiples of 16 and at most 3840, the long edge at most three times the short edge, and the image between 655360 and 8294400 pixels."
      ),
    quality: z
      .enum(["low", "medium", "high", "auto"])
      .optional()
      .describe(
        "Defaults to auto, which renders and bills at high. low, medium and high are the only explicit settings. OpenAI's xhigh and max are not offered."
      ),
    complexity: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe(
        "How much effort the model spends planning the image. Leave it out for OpenAI's default. Separate from quality."
      ),
    output_format: z
      .enum(["png", "jpeg", "webp"])
      .optional()
      .describe("Defaults to png. svg and gif are not offered."),
    output_compression: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe("Compression for jpeg and webp output, 0 to 100."),
    background: z
      .enum(["transparent", "opaque", "auto"])
      .optional()
      .describe(
        "Defaults to auto. A transparent background needs png or webp output."
      ),
    moderation: z
      .enum(["auto", "low"])
      .optional()
      .describe(
        "Defaults to auto. low is available only on accounts Nunchux has approved; any other account gets 400."
      ),
  })
  .strict()
  .superRefine((body, ctx) => {
    const problem = gptImageSizeProblem(body.size ?? "auto", body.n ?? 1);
    if (problem !== undefined) {
      ctx.addIssue({ code: "custom", path: ["size"], message: problem });
    }
    if (body.background === "transparent" && body.output_format === "jpeg") {
      ctx.addIssue({
        code: "custom",
        path: ["background"],
        message: "A transparent background needs png or webp output.",
      });
    }
  });
export type NunchuxOpenAiImagesGenerationsRequest = z.input<
  typeof NunchuxOpenAiImagesGenerationsRequestSchema
>;

const gptImageInputUrl = z
  .string()
  .min(1)
  .refine(
    (value) => value.startsWith("https://") || value.startsWith("data:image/"),
    "An input image must be an https URL or a data:image URI."
  );

const gptImageInputImage = z
  .object({
    image_url: gptImageInputUrl.describe(
      "A public https URL or a base64 data:image URI. OpenAI's file_id form is not accepted."
    ),
  })
  .strict();

export const NunchuxOpenAiImagesEditsRequestSchema = z
  .object({
    model: z
      .enum(["gpt-image-2.6-sunburst", "gpt-image-2.6-flare"])
      .or(NunchuxGptImageModelAliasSchema)
      .describe(
        "GPT Image 2.6 model. Nunchux serves gpt-image-2.6-sunburst and gpt-image-2.6-flare. OpenAI's xhigh and max qualities are not offered, so the Artificial Analysis (max) setting cannot be reproduced; the highest quality is high."
      ),
    prompt: z
      .string()
      .min(1)
      .max(32_000)
      .describe("How to change the input images, up to 32,000 characters."),
    images: z
      .array(gptImageInputImage)
      .min(1)
      .max(16)
      .describe(
        "The input images, 1 to 16. Each image_url is a public https URL or a base64 data:image URI."
      ),
    mask: gptImageInputImage
      .optional()
      .describe(
        "A mask over the first input image. Transparent areas mark where the model may change the image. Send mask or markup, not both."
      ),
    markup: gptImageInputImage
      .optional()
      .describe(
        "A PNG with transparent areas, laid over the first input image, with the same dimensions. Send mask or markup, not both."
      ),
    n: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe(
        "How many images to return. Defaults to 1. Each image is billed."
      ),
    size: z
      .string()
      .optional()
      .describe(
        "auto, or WIDTHxHEIGHT such as 1024x1024. Defaults to auto, which Nunchux holds as 1536x1024. Both edges must be multiples of 16 and at most 3840, the long edge at most three times the short edge, and the image between 655360 and 8294400 pixels."
      ),
    quality: z
      .enum(["low", "medium", "high", "auto"])
      .optional()
      .describe(
        "Defaults to auto, which renders and bills at high. low, medium and high are the only explicit settings. OpenAI's xhigh and max are not offered."
      ),
    complexity: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe(
        "How much effort the model spends planning the image. Leave it out for OpenAI's default. Separate from quality."
      ),
    output_format: z
      .enum(["png", "jpeg", "webp"])
      .optional()
      .describe("Defaults to png. svg and gif are not offered."),
    output_compression: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional()
      .describe("Compression for jpeg and webp output, 0 to 100."),
    background: z
      .enum(["transparent", "opaque", "auto"])
      .optional()
      .describe(
        "Defaults to auto. A transparent background needs png or webp output."
      ),
    moderation: z
      .enum(["auto", "low"])
      .optional()
      .describe(
        "Defaults to auto. low is available only on accounts Nunchux has approved; any other account gets 400."
      ),
  })
  .strict()
  .superRefine((body, ctx) => {
    const problem = gptImageSizeProblem(body.size ?? "auto", body.n ?? 1);
    if (problem !== undefined) {
      ctx.addIssue({ code: "custom", path: ["size"], message: problem });
    }
    if (body.background === "transparent" && body.output_format === "jpeg") {
      ctx.addIssue({
        code: "custom",
        path: ["background"],
        message: "A transparent background needs png or webp output.",
      });
    }
    if (body.mask !== undefined && body.markup !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["markup"],
        message: "Send mask or markup, not both.",
      });
    }
  });
export type NunchuxOpenAiImagesEditsRequest = z.input<
  typeof NunchuxOpenAiImagesEditsRequestSchema
>;
