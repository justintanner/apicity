import { z } from "zod";

export const GoogleFlowOptionsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string().url().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

// captchaToken/captchaRetry/captchaOrder are mutually exclusive upstream:
// token is a user-provided reCAPTCHA v3 Enterprise token (min 20 chars,
// single attempt), retry is the number of provider attempts (1-10, default
// 5), order is an explicit comma-separated provider sequence (max 10).
const GoogleFlowCaptchaFieldsSchema = {
  captchaToken: z.string().min(20).optional(),
  captchaRetry: z.number().int().min(1).max(10).optional(),
  captchaOrder: z.string().optional(),
};

export const GoogleFlowNoRequestSchema = z.object({}).passthrough();

export const GoogleFlowEmailRequestSchema = z
  .object({
    email: z.string().min(1),
  })
  .passthrough();

export const GoogleFlowMediaGenerationIdRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
  })
  .passthrough();

export const GoogleFlowRefRequestSchema = z
  .object({
    ref: z.string().min(1),
  })
  .passthrough();

export const GoogleFlowJobIdRequestSchema = z
  .object({
    jobId: z.string().min(1),
  })
  .passthrough();

export const GoogleFlowAccountsCreateRequestSchema = z
  .object({
    cookies: z.string().min(1),
    // dryRun: true validates the cookies without adding the account (the
    // setup page's verify flow).
    dryRun: z.boolean().optional(),
  })
  .passthrough();

export const GoogleFlowCaptchaProvidersRequestSchema = z
  .object({
    CapSolver: z.string().optional(),
    AntiCaptcha: z.string().optional(),
    YesCaptcha: z.string().optional(),
    SolveCaptcha: z.string().optional(),
    "2Captcha": z.string().optional(),
    EzCaptcha: z.string().optional(),
    CapMonster: z.string().optional(),
  })
  .passthrough();

export const GoogleFlowCaptchaStatsRequestSchema = z
  .object({
    date: z.string().optional(),
    limit: z.number().int().positive().max(50000).optional(),
    provider: z
      .enum([
        "CapSolver",
        "AntiCaptcha",
        "YesCaptcha",
        "CapMonster",
        "SolveCaptcha",
        "2Captcha",
        "EzCaptcha",
        "UserProvided",
      ])
      .optional(),
    anonymized: z.boolean().optional(),
  })
  .passthrough();

export const GoogleFlowAssetUploadRequestSchema = z
  .object({
    body: z.custom<BodyInit>(),
    contentType: z.string().min(1),
    email: z.string().optional(),
  })
  .passthrough();

export const GoogleFlowCharactersCreateRequestSchema = z
  .object({
    displayName: z.string().min(1).max(200),
    imageReference_1: z.string().min(1),
    imageReference_2: z.string().optional(),
    personalityNotes: z.string().max(2000).optional(),
    voice: z.string().optional(),
  })
  .passthrough();

export const GoogleFlowCharactersListRequestSchema =
  GoogleFlowEmailRequestSchema;

// The 30 system voice presets accepted by POST /voices (case-sensitive).
export const GoogleFlowVoicePresetSchema = z.enum([
  "Achernar",
  "Achird",
  "Algenib",
  "Algieba",
  "Alnilam",
  "Aoede",
  "Autonoe",
  "Callirrhoe",
  "Charon",
  "Despina",
  "Enceladus",
  "Erinome",
  "Fenrir",
  "Gacrux",
  "Iapetus",
  "Kore",
  "Laomedeia",
  "Leda",
  "Orus",
  "Puck",
  "Pulcherrima",
  "Rasalgethi",
  "Sadachbia",
  "Sadaltager",
  "Schedar",
  "Sulafat",
  "Umbriel",
  "Vindemiatrix",
  "Zephyr",
  "Zubenelgenubi",
]);

export const GoogleFlowVoicesCreateRequestSchema = z
  .object({
    email: z.string().min(1),
    voice: GoogleFlowVoicePresetSchema,
    displayName: z.string().min(1).max(200),
    dialog: z.string().min(1).max(120),
    voicePerformance: z.string().min(1).max(120),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVoicesListRequestSchema = z
  .object({
    email: z.string().min(1),
    source: z.enum(["system", "user"]).optional(),
  })
  .passthrough();

export const GoogleFlowImagesRequestSchema = z
  .object({
    prompt: z.string().min(1),
    email: z.string().optional(),
    // Docs enumerate nano-banana-2-lite | nano-banana-2 | nano-banana-pro,
    // but deprecated aliases (nano-banana, imagen-4) are still accepted, so
    // the enum is unioned with string to stay resilient to upstream changes.
    model: z
      .enum(["nano-banana-2-lite", "nano-banana-2", "nano-banana-pro"])
      .or(z.string())
      .optional(),
    // Legacy aliases landscape (16:9) and portrait (9:16) are still accepted.
    aspectRatio: z
      .enum([
        "16:9",
        "4:3",
        "1:1",
        "3:4",
        "9:16",
        "auto",
        "landscape",
        "portrait",
      ])
      .optional(),
    count: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().optional(),
    reference_1: z.string().optional(),
    reference_2: z.string().optional(),
    reference_3: z.string().optional(),
    reference_4: z.string().optional(),
    reference_5: z.string().optional(),
    reference_6: z.string().optional(),
    reference_7: z.string().optional(),
    reference_8: z.string().optional(),
    reference_9: z.string().optional(),
    reference_10: z.string().optional(),
    character_1: z.string().optional(),
    character_2: z.string().optional(),
    character_3: z.string().optional(),
    character_4: z.string().optional(),
    character_5: z.string().optional(),
    character_6: z.string().optional(),
    character_7: z.string().optional(),
    replyUrl: z.string().url().optional(),
    replyRef: z.string().optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowImagesUpscaleRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
    resolution: z.enum(["2k", "4k"]).optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVideosRequestSchema = z
  .object({
    prompt: z.string().min(1),
    email: z.string().optional(),
    model: z
      .enum([
        "veo-3.1-quality",
        "veo-3.1-fast",
        "veo-3.1-lite",
        "veo-3.1-lite-low-priority",
        "omni-flash",
      ])
      .or(z.string())
      .optional(),
    // landscape/portrait for all models; Veo also accepts 1:1, 4:3, 3:4.
    // Unioned with string: upstream also accepts undocumented ratio aliases
    // (e.g. 16:9, exercised by the recorded i2v test).
    aspectRatio: z
      .enum(["landscape", "portrait", "1:1", "4:3", "3:4"])
      .or(z.string())
      .optional(),
    duration: z
      .union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)])
      .optional(),
    count: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().optional(),
    startImage: z.string().optional(),
    endImage: z.string().optional(),
    referenceImage_1: z.string().optional(),
    referenceImage_2: z.string().optional(),
    referenceImage_3: z.string().optional(),
    referenceImage_4: z.string().optional(),
    referenceImage_5: z.string().optional(),
    referenceImage_6: z.string().optional(),
    referenceImage_7: z.string().optional(),
    character_1: z.string().optional(),
    character_2: z.string().optional(),
    character_3: z.string().optional(),
    character_4: z.string().optional(),
    character_5: z.string().optional(),
    character_6: z.string().optional(),
    character_7: z.string().optional(),
    referenceAudio_1: z.string().optional(),
    referenceAudio_2: z.string().optional(),
    referenceAudio_3: z.string().optional(),
    referenceAudio_4: z.string().optional(),
    referenceAudio_5: z.string().optional(),
    referenceVideo_1: z.string().optional(),
    // Omni Flash V2V trim window on a 24 fps virtual timeline.
    startFrameIndex_1: z.number().int().min(0).max(239).optional(),
    endFrameIndex_1: z.number().int().min(1).max(240).optional(),
    async: z.boolean().optional(),
    replyUrl: z.string().url().optional(),
    replyRef: z.string().optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVideosUpscaleRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
    resolution: z.enum(["1080p", "4K"]).optional(),
    async: z.boolean().optional(),
    replyUrl: z.string().url().optional(),
    replyRef: z.string().optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVideosGifRequestSchema =
  GoogleFlowMediaGenerationIdRequestSchema;

export const GoogleFlowVideosExtendRequestSchema = z
  .object({
    mediaGenerationId: z.string().min(1),
    prompt: z.string().min(1),
    // Extend supports the Veo variants only (no omni-flash).
    model: z
      .enum([
        "veo-3.1-fast",
        "veo-3.1-quality",
        "veo-3.1-lite",
        "veo-3.1-lite-low-priority",
      ])
      .or(z.string())
      .optional(),
    count: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().optional(),
    async: z.boolean().optional(),
    replyUrl: z.string().url().optional(),
    replyRef: z.string().optional(),
    ...GoogleFlowCaptchaFieldsSchema,
  })
  .passthrough();

export const GoogleFlowVideosConcatenateRequestSchema = z
  .object({
    media: z
      .array(
        z
          .object({
            mediaGenerationId: z.string().min(1),
            trimStart: z.number().min(0).max(8).optional(),
            trimEnd: z.number().min(0).max(8).optional(),
          })
          .passthrough()
      )
      .min(2)
      .max(10),
  })
  .passthrough();

export const GoogleFlowJobsRequestSchema = z
  .object({
    options: z.enum(["summary", "executing", "history"]).optional(),
  })
  .passthrough();

export type GoogleFlowOptions = z.infer<typeof GoogleFlowOptionsSchema>;
export type GoogleFlowNoRequest = z.input<typeof GoogleFlowNoRequestSchema>;
export type GoogleFlowEmailRequest = z.input<
  typeof GoogleFlowEmailRequestSchema
>;
export type GoogleFlowMediaGenerationIdRequest = z.input<
  typeof GoogleFlowMediaGenerationIdRequestSchema
>;
export type GoogleFlowRefRequest = z.input<typeof GoogleFlowRefRequestSchema>;
export type GoogleFlowJobIdRequest = z.input<
  typeof GoogleFlowJobIdRequestSchema
>;
export type GoogleFlowAccountsCreateRequest = z.input<
  typeof GoogleFlowAccountsCreateRequestSchema
>;
export type GoogleFlowCaptchaProvidersRequest = z.input<
  typeof GoogleFlowCaptchaProvidersRequestSchema
>;
export type GoogleFlowCaptchaStatsRequest = z.input<
  typeof GoogleFlowCaptchaStatsRequestSchema
>;
export type GoogleFlowAssetUploadRequest = z.input<
  typeof GoogleFlowAssetUploadRequestSchema
>;
export type GoogleFlowCharactersCreateRequest = z.input<
  typeof GoogleFlowCharactersCreateRequestSchema
>;
export type GoogleFlowCharactersListRequest = z.input<
  typeof GoogleFlowCharactersListRequestSchema
>;
export type GoogleFlowVoicesCreateRequest = z.input<
  typeof GoogleFlowVoicesCreateRequestSchema
>;
export type GoogleFlowVoicesListRequest = z.input<
  typeof GoogleFlowVoicesListRequestSchema
>;
export type GoogleFlowImagesRequest = z.input<
  typeof GoogleFlowImagesRequestSchema
>;
export type GoogleFlowImagesUpscaleRequest = z.input<
  typeof GoogleFlowImagesUpscaleRequestSchema
>;
export type GoogleFlowVideosRequest = z.input<
  typeof GoogleFlowVideosRequestSchema
>;
export type GoogleFlowVideosUpscaleRequest = z.input<
  typeof GoogleFlowVideosUpscaleRequestSchema
>;
export type GoogleFlowVideosGifRequest = z.input<
  typeof GoogleFlowVideosGifRequestSchema
>;
export type GoogleFlowVideosExtendRequest = z.input<
  typeof GoogleFlowVideosExtendRequestSchema
>;
export type GoogleFlowVideosConcatenateRequest = z.input<
  typeof GoogleFlowVideosConcatenateRequestSchema
>;
export type GoogleFlowJobsRequest = z.input<typeof GoogleFlowJobsRequestSchema>;
