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
  XaiChatChoice,
  XaiChatRequest,
  XaiChatResponse,
  XaiImageGenerateRequest,
  XaiImageEditRequest,
  XaiImageReference,
  XaiGeneratedImage,
  XaiImageResponse,
  XaiVideoGenerateRequest,
  XaiVideoExtendRequest,
  XaiVideoReference,
  XaiVideoAsyncResponse,
  XaiVideoData,
  XaiVideoResult,
  XaiFileObject,
  XaiFileListResponse,
  XaiProvider,
} from "./types";
