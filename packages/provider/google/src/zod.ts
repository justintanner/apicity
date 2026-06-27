import { z } from "zod";

export const GoogleOptionsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string().url().optional(),
  flowApiKey: z.string().optional(),
  flowBaseURL: z.string().url().optional(),
  // OAuth bearer token for the Antigravity / Cloud Code surface
  // (cloudcode-pa.googleapis.com). Falls back to `apiKey` when unset.
  oauthToken: z.string().optional(),
  cloudCodeBaseURL: z.string().url().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

// Request body for v1internal:retrieveUserQuota. The endpoint requires an
// empty JSON object — sending `metadata`/`clientMetadata` 400s — so the schema
// is a strict empty object kept only as MCP/consumer metadata.
export const GoogleRetrieveUserQuotaRequestSchema = z.object({}).strict();

export const GoogleBlobSchema = z.object({
  mimeType: z.string(),
  data: z.string(),
});

export const GoogleFileDataSchema = z.object({
  mimeType: z.string().optional(),
  fileUri: z.string(),
});

export const GoogleFunctionCallSchema = z.object({
  name: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
});

export const GoogleFunctionResponseSchema = z.object({
  name: z.string(),
  response: z.record(z.string(), z.unknown()),
});

export const GooglePartSchema = z
  .object({
    text: z.string().optional(),
    inlineData: GoogleBlobSchema.optional(),
    fileData: GoogleFileDataSchema.optional(),
    functionCall: GoogleFunctionCallSchema.optional(),
    functionResponse: GoogleFunctionResponseSchema.optional(),
  })
  .passthrough();

export const GoogleContentSchema = z.object({
  role: z.string().optional(),
  parts: z.array(GooglePartSchema).min(1),
});

export const GoogleSafetySettingSchema = z
  .object({
    category: z.string(),
    threshold: z.string(),
  })
  .passthrough();

export const GoogleGenerationConfigSchema = z
  .object({
    temperature: z.number().optional(),
    topP: z.number().optional(),
    topK: z.number().optional(),
    candidateCount: z.number().int().optional(),
    maxOutputTokens: z.number().int().optional(),
    stopSequences: z.array(z.string()).optional(),
    responseMimeType: z.string().optional(),
    responseSchema: z.unknown().optional(),
    thinkingConfig: z.record(z.string(), z.unknown()).optional(),
    seed: z.number().int().optional(),
  })
  .passthrough();

export const GoogleFunctionDeclarationSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    parameters: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const GoogleToolSchema = z
  .object({
    functionDeclarations: z.array(GoogleFunctionDeclarationSchema).optional(),
    googleSearch: z.record(z.string(), z.unknown()).optional(),
    retrieval: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const GoogleToolConfigSchema = z.record(z.string(), z.unknown());

export const GoogleGenerateContentRequestSchema = z
  .object({
    contents: z.array(GoogleContentSchema).min(1),
    systemInstruction: GoogleContentSchema.optional(),
    tools: z.array(GoogleToolSchema).optional(),
    toolConfig: GoogleToolConfigSchema.optional(),
    safetySettings: z.array(GoogleSafetySettingSchema).optional(),
    generationConfig: GoogleGenerationConfigSchema.optional(),
    labels: z.record(z.string(), z.string()).optional(),
    cachedContent: z.string().optional(),
  })
  .passthrough();

export const GoogleCountTokensRequestSchema = z
  .object({
    model: z.string().optional(),
    instances: z.array(z.unknown()).optional(),
    contents: z.array(GoogleContentSchema).optional(),
    tools: z.array(GoogleToolSchema).optional(),
    systemInstruction: GoogleContentSchema.optional(),
    generationConfig: GoogleGenerationConfigSchema.optional(),
  })
  .passthrough();

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

export type GoogleOptions = z.infer<typeof GoogleOptionsSchema>;
export type GoogleRetrieveUserQuotaRequest = z.input<
  typeof GoogleRetrieveUserQuotaRequestSchema
>;
export type GoogleBlob = z.infer<typeof GoogleBlobSchema>;
export type GoogleFileData = z.infer<typeof GoogleFileDataSchema>;
export type GoogleFunctionCall = z.infer<typeof GoogleFunctionCallSchema>;
export type GoogleFunctionResponse = z.infer<
  typeof GoogleFunctionResponseSchema
>;
export type GooglePart = z.infer<typeof GooglePartSchema>;
export type GoogleContent = z.infer<typeof GoogleContentSchema>;
export type GoogleSafetySetting = z.infer<typeof GoogleSafetySettingSchema>;
export type GoogleGenerationConfig = z.infer<
  typeof GoogleGenerationConfigSchema
>;
export type GoogleFunctionDeclaration = z.infer<
  typeof GoogleFunctionDeclarationSchema
>;
export type GoogleTool = z.infer<typeof GoogleToolSchema>;
export type GoogleToolConfig = z.infer<typeof GoogleToolConfigSchema>;
export type GoogleGenerateContentRequest = z.input<
  typeof GoogleGenerateContentRequestSchema
>;
export type GoogleGenerateContentRequestInput = GoogleGenerateContentRequest;
export type GoogleGenerateContentParsedRequest = z.output<
  typeof GoogleGenerateContentRequestSchema
>;
export type GoogleCountTokensRequest = z.input<
  typeof GoogleCountTokensRequestSchema
>;
export type GoogleCountTokensRequestInput = GoogleCountTokensRequest;
export type GoogleCountTokensParsedRequest = z.output<
  typeof GoogleCountTokensRequestSchema
>;
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
