// Export main provider function
export { openai } from "./openai";

// Export error class
export { OpenAiError } from "./types";

// Export middleware
export { withRetry, withFallback } from "./middleware";
export type { RetryOptions, FallbackOptions } from "./middleware";

// Export all types
export type {
  OpenAiOptions,
  OpenAiMessage,
  OpenAiTextPart,
  OpenAiImageUrlPart,
  OpenAiContentPart,
  OpenAiToolFunction,
  OpenAiTool,
  OpenAiToolCall,
  OpenAiUsage,
  OpenAiChatChoice,
  OpenAiChatRequest,
  OpenAiChatResponse,
  OpenAiTranscribeRequest,
  OpenAiTranscribeResponse,
  OpenAiTranslateRequest,
  OpenAiTranslateResponse,
  OpenAiEmbeddingRequest,
  OpenAiEmbeddingData,
  OpenAiEmbeddingUsage,
  OpenAiEmbeddingResponse,
  OpenAiImageEditRequest,
  OpenAiImageData,
  OpenAiImageEditUsage,
  OpenAiImageEditResponse,
  OpenAiImageGenerationRequest,
  OpenAiGeneratedImage,
  OpenAiImageGenerationUsage,
  OpenAiImageGenerationResponse,
  OpenAiProvider,
  PayloadFieldSchema,
  PayloadSchema,
  ValidationResult,
} from "./types";
