// Export main provider function
export { deepseek } from "./deepseek";

// Export error class
export { DeepSeekError } from "./types";

// Export middleware
export { withRetry, withFallback } from "./middleware";
export type { RetryOptions, FallbackOptions } from "./middleware";

// Export all types
export type {
  DeepSeekOptions,
  DeepSeekSystemMessage,
  DeepSeekUserMessage,
  DeepSeekAssistantMessage,
  DeepSeekToolMessage,
  DeepSeekMessage,
  DeepSeekToolFunction,
  DeepSeekTool,
  DeepSeekToolCall,
  DeepSeekTokenLogprob,
  DeepSeekLogprobs,
  DeepSeekUsage,
  DeepSeekChatRequest,
  DeepSeekChatChoice,
  DeepSeekChatResponse,
  DeepSeekChatChunkDelta,
  DeepSeekChatChunkChoice,
  DeepSeekChatChunk,
  DeepSeekFimRequest,
  DeepSeekFimLogprobs,
  DeepSeekFimChoice,
  DeepSeekFimResponse,
  DeepSeekModel,
  DeepSeekModelListResponse,
  DeepSeekBalanceInfo,
  DeepSeekBalanceResponse,
  DeepSeekProvider,
  PayloadFieldSchema,
  PayloadSchema,
  ValidationResult,
} from "./types";
