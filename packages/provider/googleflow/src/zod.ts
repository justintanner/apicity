import { z } from "zod";

export const GoogleFlowOptionsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string().url().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

// Request body for v1internal:retrieveUserQuota. The endpoint requires an
// empty JSON object — sending `metadata`/`clientMetadata` 400s — so the schema
// is a strict empty object kept only as MCP/consumer metadata.

const GoogleFlowCaptchaFieldsSchema = {
  captchaToken: z.string().optional(),
  captchaRetry: z.boolean().optional(),
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
    provider: z.string().optional(),
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

export const GoogleFlowVoicesCreateRequestSchema = z
  .object({
    email: z.string().min(1),
    voice: z.string().min(1),
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
    model: z.string().optional(),
    aspectRatio: z.string().optional(),
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
    model: z.string().optional(),
    aspectRatio: z.string().optional(),
    duration: z.number().optional(),
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
    trimStart: z.number().optional(),
    trimEnd: z.number().optional(),
    startFrameIndex_1: z.number().optional(),
    endFrameIndex_1: z.number().optional(),
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
    model: z.string().optional(),
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
