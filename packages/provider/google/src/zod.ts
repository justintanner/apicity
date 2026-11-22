import { z } from "zod";

export const GoogleOptionsSchema = z.object({
  apiKey: z.string(),
  baseURL: z.string().url().optional(),
  // OAuth bearer token for the Vertex AI Interactions API and the
  // Antigravity / Cloud Code surface (cloudcode-pa.googleapis.com).
  // Falls back to `apiKey` when unset.
  oauthToken: z.string().optional(),
  cloudCodeBaseURL: z.string().url().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

// Request body for v1internal:retrieveUserQuota. The endpoint requires an
// empty JSON object — sending `metadata`/`clientMetadata` 400s — so the schema
// is a strict empty object kept only as consumer metadata.
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

export const GoogleModalitySchema = z.enum([
  "MODALITY_UNSPECIFIED",
  "TEXT",
  "IMAGE",
  "AUDIO",
  "VIDEO",
]);

export const GoogleImageAspectRatioSchema = z
  .enum([
    "1:1",
    "2:3",
    "3:2",
    "3:4",
    "4:3",
    "1:4",
    "4:1",
    "4:5",
    "5:4",
    "1:8",
    "8:1",
    "9:16",
    "16:9",
    "21:9",
  ])
  .describe(
    "Output aspect ratio for generated images. Nano Banana 2.1 supports all 14 ratios."
  );

export const GoogleImageSizeSchema = z
  .enum(["1K", "2K", "4K"])
  .describe(
    "Output resolution tier for Vertex ImageConfig (1K default, 2K, or 4K)."
  );

export const GooglePersonGenerationSchema = z.enum([
  "PERSON_GENERATION_UNSPECIFIED",
  "ALLOW_ALL",
  "ALLOW_ADULT",
  "ALLOW_NONE",
]);

export const GoogleProminentPeopleSchema = z.enum([
  "PROMINENT_PEOPLE_UNSPECIFIED",
  "ALLOW_PROMINENT_PEOPLE",
  "BLOCK_PROMINENT_PEOPLE",
]);

export const GoogleImageOutputOptionsSchema = z
  .object({
    mimeType: z.string().optional(),
    compressionQuality: z.number().int().min(0).max(100).optional(),
  })
  .passthrough();

export const GoogleImageConfigSchema = z
  .object({
    aspectRatio: GoogleImageAspectRatioSchema.optional(),
    imageSize: GoogleImageSizeSchema.optional(),
    personGeneration: GooglePersonGenerationSchema.optional(),
    prominentPeople: GoogleProminentPeopleSchema.optional(),
    imageOutputOptions: GoogleImageOutputOptionsSchema.optional(),
  })
  .passthrough();

export const GoogleThinkingLevelSchema = z.enum([
  "THINKING_LEVEL_UNSPECIFIED",
  "MINIMAL",
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export const GoogleThinkingConfigSchema = z
  .object({
    includeThoughts: z.boolean().optional(),
    thinkingBudget: z.number().int().optional(),
    thinkingLevel: GoogleThinkingLevelSchema.optional(),
  })
  .passthrough();

export const GooglePartSchema = z
  .object({
    text: z.string().optional(),
    inlineData: GoogleBlobSchema.optional(),
    fileData: GoogleFileDataSchema.optional(),
    functionCall: GoogleFunctionCallSchema.optional(),
    functionResponse: GoogleFunctionResponseSchema.optional(),
    thought: z.boolean().optional(),
    thoughtSignature: z.string().optional(),
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
    responseModalities: z.array(GoogleModalitySchema).optional(),
    imageConfig: GoogleImageConfigSchema.optional(),
    thinkingConfig: GoogleThinkingConfigSchema.optional(),
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

// -- Vertex AI Interactions API (global) -------------------------------------
// Docs: https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/interactions-api

export const GOOGLE_INTERACTION_MODELS = [
  "gemini-omni-1.2-flash",
  "gemini-omni-1.1-flash-preview",
  "gemini-omni-flash-preview",
  "gemini-4-hydrogen",
  "gemini-4-carbon",
  "gemini-4-carbon-cyber-permissive",
  "gemini-4-argon",
  "gemini-4-argon-cyber-permissive",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite",
  "lyria-3-clip-preview",
  "lyria-3-pro-preview",
] as const;

export const GoogleInteractionModelSchema = z
  .enum(GOOGLE_INTERACTION_MODELS)
  .or(z.string().min(1));

export const GoogleInteractionResponseModalitySchema = z.enum([
  "text",
  "image",
  "audio",
  "video",
  "document",
]);

export const GoogleInteractionVideoAspectRatioSchema = z
  .enum(["16:9", "9:16"])
  .describe("Output video aspect ratio (16:9 or 9:16).");

export const GoogleInteractionVideoDeliverySchema = z
  .enum(["inline", "uri"])
  .describe(
    'Video delivery mode: "inline" returns base64 bytes in steps[].content[].data (no gcs_uri); "uri" writes to gcs_uri.'
  );

export const GoogleInteractionVideoResolutionSchema = z
  .enum(["360p", "720p", "1080p", "4k"])
  .describe(
    "Output video resolution (default 720p). gemini-omni-1.2-flash and gemini-omni-1.1-flash-preview support 360p/720p/1080p/4k; gemini-omni-flash-preview supports 720p only."
  );

export const GoogleInteractionVideoDurationSchema = z
  .string()
  .regex(
    /^\d+s$/,
    'Expected whole seconds followed by "s" (e.g. "3s", "8s", "15s")'
  )
  .describe(
    'Video duration string (e.g. "3s"). gemini-omni-1.2-flash accepts 3s-15s; preview Omni models accept 3s-10s.'
  );

export const GoogleInteractionVideoResponseFormatSchema = z
  .object({
    type: z.literal("video"),
    aspect_ratio: GoogleInteractionVideoAspectRatioSchema.optional(),
    delivery: GoogleInteractionVideoDeliverySchema.optional(),
    duration: GoogleInteractionVideoDurationSchema.optional(),
    gcs_uri: z.string().min(1).optional(),
    resolution: GoogleInteractionVideoResolutionSchema.optional(),
  })
  .passthrough();

export const GoogleInteractionResponseFormatSchema = z.union([
  GoogleInteractionVideoResponseFormatSchema,
  z.record(z.string(), z.unknown()),
]);

export const GoogleInteractionTextContentSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .passthrough();

export const GoogleInteractionImageContentSchema = z
  .object({
    type: z.literal("image"),
    data: z.string().optional(),
    uri: z.string().optional(),
    mime_type: z
      .enum([
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/heic",
        "image/heif",
      ])
      .or(z.string())
      .optional(),
  })
  .passthrough();

export const GoogleInteractionVideoContentSchema = z
  .object({
    type: z.literal("video"),
    data: z.string().optional(),
    uri: z.string().optional(),
    mime_type: z
      .enum([
        "video/mp4",
        "video/mpeg",
        "video/mpg",
        "video/mov",
        "video/quicktime",
        "video/avi",
        "video/x-flv",
        "video/webm",
        "video/wmv",
        "video/x-ms-wmv",
        "video/3gpp",
      ])
      .or(z.string())
      .optional(),
  })
  .passthrough();

export const GoogleInteractionAudioContentSchema = z
  .object({
    type: z.literal("audio"),
    data: z.string().optional(),
    uri: z.string().optional(),
    mime_type: z.string().optional(),
  })
  .passthrough();

export const GoogleInteractionDocumentContentSchema = z
  .object({
    type: z.literal("document"),
    data: z.string().optional(),
    uri: z.string().optional(),
    mime_type: z.string().optional(),
  })
  .passthrough();

export const GoogleInteractionContentSchema = z.union([
  GoogleInteractionTextContentSchema,
  GoogleInteractionImageContentSchema,
  GoogleInteractionVideoContentSchema,
  GoogleInteractionAudioContentSchema,
  GoogleInteractionDocumentContentSchema,
]);

export const GoogleInteractionUserInputStepSchema = z
  .object({
    type: z.literal("user_input"),
    content: z.array(GoogleInteractionContentSchema).min(1),
  })
  .passthrough();

export const GoogleInteractionModelOutputStepSchema = z
  .object({
    type: z.literal("model_output"),
    content: z.array(GoogleInteractionContentSchema).optional(),
  })
  .passthrough();

const GOOGLE_INTERACTION_STEP_TYPES = [
  "user_input",
  "model_output",
  "thought",
  "function_call",
  "function_result",
  "code_execution_call",
  "code_execution_result",
  "url_context_call",
  "url_context_result",
  "file_search_call",
  "file_search_result",
  "google_search_call",
  "google_search_result",
  "google_maps_call",
  "google_maps_result",
  "mcp_server_tool_call",
  "mcp_server_tool_result",
  "processing_call",
  "processing_result",
] as const;

export const GoogleInteractionStepSchema = z.union([
  GoogleInteractionUserInputStepSchema,
  GoogleInteractionModelOutputStepSchema,
  z
    .object({
      type: z.enum(GOOGLE_INTERACTION_STEP_TYPES),
    })
    .passthrough(),
]);

export const GoogleInteractionVideoConfigSchema = z
  .object({
    task: z
      .enum([
        "text_to_video",
        "image_to_video",
        "reference_to_video",
        "edit",
        "extend",
        "upscale",
      ])
      .or(z.string())
      .optional(),
  })
  .passthrough();

export const GoogleInteractionGenerationConfigSchema = z
  .object({
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    seed: z.number().int().optional(),
    stop_sequences: z.array(z.string()).optional(),
    thinking_level: z.enum(["minimal", "low", "medium", "high"]).optional(),
    thinking_summaries: z.enum(["auto", "none"]).optional(),
    max_output_tokens: z.number().int().optional(),
    speech_config: z
      .object({
        voice: z.string().optional(),
        language: z.string().optional(),
        speaker: z.string().optional(),
      })
      .passthrough()
      .optional(),
    image_config: z
      .object({
        aspect_ratio: GoogleImageAspectRatioSchema.optional(),
        image_size: z.enum(["1K", "2K", "4K", "512"]).optional(),
      })
      .passthrough()
      .optional(),
    video_config: GoogleInteractionVideoConfigSchema.optional(),
    tool_choice: z.unknown().optional(),
  })
  .passthrough();

const GOOGLE_OMNI_VIDEO_MODEL_SET: ReadonlySet<string> = new Set([
  "gemini-omni-1.2-flash",
  "gemini-omni-1.1-flash-preview",
  "gemini-omni-flash-preview",
]);

export const GoogleInteractionCreateRequestSchema = z
  .object({
    model: GoogleInteractionModelSchema.optional(),
    agent: z.string().min(1).optional(),
    // v1 Interactions API accepts a plain string or an array of Step objects
    // (such as `{ type: "user_input", content: [...] }`). Flat Content blocks
    // like `{ type: "text" }` at `input[0]` are rejected by v1 with HTTP 400.
    input: z.union([
      z.string().min(1),
      z.array(GoogleInteractionStepSchema).min(1),
    ]),
    system_instruction: z.string().optional(),
    tools: z.array(z.record(z.string(), z.unknown())).optional(),
    response_format: z
      .union([
        GoogleInteractionResponseFormatSchema,
        z.array(GoogleInteractionResponseFormatSchema).min(1),
      ])
      .optional(),
    response_modalities: z
      .array(GoogleInteractionResponseModalitySchema)
      .optional(),
    stream: z.boolean().optional(),
    store: z.boolean().optional(),
    background: z.boolean().optional(),
    previous_interaction_id: z.string().min(1).optional(),
    generation_config: GoogleInteractionGenerationConfigSchema.optional(),
    agent_config: z.record(z.string(), z.unknown()).optional(),
    labels: z.record(z.string(), z.string()).optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (!value.model && !value.agent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model"],
        message: "Either model or agent is required",
      });
    }
    const formats =
      value.response_format === undefined
        ? []
        : Array.isArray(value.response_format)
          ? value.response_format
          : [value.response_format];
    for (let i = 0; i < formats.length; i++) {
      const fmt = formats[i];
      if (!fmt || typeof fmt !== "object" || fmt.type !== "video") continue;
      const basePath = Array.isArray(value.response_format)
        ? ["response_format", i]
        : ["response_format"];
      if (fmt.delivery === "uri" && !fmt.gcs_uri) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...basePath, "gcs_uri"],
          message: 'gcs_uri is required when delivery is "uri"',
        });
      }
      if (fmt.delivery === "inline" && fmt.gcs_uri !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...basePath, "gcs_uri"],
          message: 'gcs_uri is not supported when delivery is "inline"',
        });
      }
      if (
        value.model === "gemini-omni-flash-preview" &&
        fmt.resolution !== undefined &&
        fmt.resolution !== "720p"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...basePath, "resolution"],
          message: "gemini-omni-flash-preview only supports 720p resolution",
        });
      }
      if (
        typeof fmt.duration === "string" &&
        value.model &&
        GOOGLE_OMNI_VIDEO_MODEL_SET.has(value.model)
      ) {
        const seconds = Number(fmt.duration.slice(0, -1));
        const maxSeconds = value.model === "gemini-omni-1.2-flash" ? 15 : 10;
        if (seconds < 3 || seconds > maxSeconds) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...basePath, "duration"],
            message: `${value.model} supports duration between 3s and ${maxSeconds}s`,
          });
        }
      }
    }
    if (value.model && GOOGLE_OMNI_VIDEO_MODEL_SET.has(value.model)) {
      if (value.system_instruction !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["system_instruction"],
          message: `${value.model} does not support system_instruction`,
        });
      }
      if (value.tools !== undefined && value.tools.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tools"],
          message: `${value.model} does not support tools`,
        });
      }
      if (Array.isArray(value.input)) {
        let images = 0;
        let videos = 0;
        for (const step of value.input) {
          if (step.type === "user_input" && Array.isArray(step.content)) {
            for (const block of step.content) {
              if (block.type === "image") images++;
              if (block.type === "video") videos++;
            }
          }
        }
        if (images > 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["input"],
            message: `${value.model} accepts at most 10 images per prompt (received ${images})`,
          });
        }
        if (videos > 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["input"],
            message: `${value.model} accepts at most 3 videos per prompt (received ${videos})`,
          });
        }
      }
    }
  });

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
export type GoogleModality = z.infer<typeof GoogleModalitySchema>;
export type GoogleImageAspectRatio = z.infer<
  typeof GoogleImageAspectRatioSchema
>;
export type GoogleImageSize = z.infer<typeof GoogleImageSizeSchema>;
export type GooglePersonGeneration = z.infer<
  typeof GooglePersonGenerationSchema
>;
export type GoogleProminentPeople = z.infer<typeof GoogleProminentPeopleSchema>;
export type GoogleImageOutputOptions = z.infer<
  typeof GoogleImageOutputOptionsSchema
>;
export type GoogleImageConfig = z.infer<typeof GoogleImageConfigSchema>;
export type GoogleThinkingLevel = z.infer<typeof GoogleThinkingLevelSchema>;
export type GoogleThinkingConfig = z.infer<typeof GoogleThinkingConfigSchema>;
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
export type GoogleInteractionModel = z.infer<
  typeof GoogleInteractionModelSchema
>;
export type GoogleInteractionResponseModality = z.infer<
  typeof GoogleInteractionResponseModalitySchema
>;
export type GoogleInteractionVideoAspectRatio = z.infer<
  typeof GoogleInteractionVideoAspectRatioSchema
>;
export type GoogleInteractionVideoDelivery = z.infer<
  typeof GoogleInteractionVideoDeliverySchema
>;
export type GoogleInteractionVideoResolution = z.infer<
  typeof GoogleInteractionVideoResolutionSchema
>;
export type GoogleInteractionVideoDuration = z.infer<
  typeof GoogleInteractionVideoDurationSchema
>;
export type GoogleInteractionVideoResponseFormat = z.infer<
  typeof GoogleInteractionVideoResponseFormatSchema
>;
export type GoogleInteractionResponseFormat = z.infer<
  typeof GoogleInteractionResponseFormatSchema
>;
export type GoogleInteractionContent = z.infer<
  typeof GoogleInteractionContentSchema
>;
export type GoogleInteractionStep = z.infer<typeof GoogleInteractionStepSchema>;
export type GoogleInteractionVideoConfig = z.infer<
  typeof GoogleInteractionVideoConfigSchema
>;
export type GoogleInteractionGenerationConfig = z.infer<
  typeof GoogleInteractionGenerationConfigSchema
>;
export type GoogleInteractionCreateRequest = z.input<
  typeof GoogleInteractionCreateRequestSchema
>;
export type GoogleInteractionCreateRequestInput =
  GoogleInteractionCreateRequest;
export type GoogleInteractionCreateParsedRequest = z.output<
  typeof GoogleInteractionCreateRequestSchema
>;
