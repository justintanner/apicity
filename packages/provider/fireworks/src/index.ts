// Export main provider function
export { fireworks } from "./fireworks";

// Export error class
export { FireworksError } from "./types";

// Export middleware
export { withRetry, withFallback } from "./middleware";
export type { RetryOptions, FallbackOptions } from "./middleware";

// Export all types
export type {
  FireworksOptions,
  FireworksMessage,
  FireworksToolFunction,
  FireworksTool,
  FireworksToolCall,
  FireworksUsage,
  FireworksChatChoice,
  FireworksChatRequest,
  FireworksChatResponse,
  FireworksCompletionRequest,
  FireworksCompletionChoice,
  FireworksCompletionResponse,
  FireworksEmbeddingRequest,
  FireworksEmbeddingData,
  FireworksEmbeddingUsage,
  FireworksEmbeddingResponse,
  FireworksRerankRequest,
  FireworksRerankResult,
  FireworksRerankUsage,
  FireworksRerankResponse,
  FireworksProvider,
  PayloadFieldSchema,
  PayloadSchema,
  ValidationResult,
} from "./types";
