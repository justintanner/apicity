// Export main provider function
export { xai } from "./xai";

// Export error class
export { XaiError } from "./types";

// Export middleware
export { withRetry, withFallback } from "./middleware";
export type { RetryOptions, FallbackOptions } from "./middleware";

// Export all types
export type {
  XaiOptions,
  XaiMessage,
  XaiToolFunction,
  XaiTool,
  XaiToolCall,
  XaiUsage,
  XaiChatRequest,
  XaiChatResponse,
  XaiImageGenerateRequest,
  XaiImageEditRequest,
  XaiImageReference,
  XaiGeneratedImage,
  XaiImageResponse,
  XaiVideoGenerateRequest,
  XaiVideoEditRequest,
  XaiVideoReference,
  XaiVideoAsyncResponse,
  XaiVideoResult,
  XaiProvider,
} from "./types";
