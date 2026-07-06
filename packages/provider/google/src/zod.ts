import { z } from "zod";

export const GoogleOptionsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string().url().optional(),
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

// Request body for v1internal:retrieveUserQuotaSummary. The endpoint also
// requires a strict empty JSON object; callers cannot pass metadata fields.
export const GoogleRetrieveUserQuotaSummaryRequestSchema = z
  .object({})
  .strict();

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


export type GoogleOptions = z.infer<typeof GoogleOptionsSchema>;
export type GoogleRetrieveUserQuotaRequest = z.input<
  typeof GoogleRetrieveUserQuotaRequestSchema
>;
export type GoogleRetrieveUserQuotaSummaryRequest = z.input<
  typeof GoogleRetrieveUserQuotaSummaryRequestSchema
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
