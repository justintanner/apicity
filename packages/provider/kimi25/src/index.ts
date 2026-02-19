// Export main provider function
export { kimi25 } from "./kimi25";

// Export error class
export { Kimi25Error } from "./types";

// Export middleware
export { withRetry, withFallback } from "./middleware";

// Export SSE utility
export { sseToIterable } from "./sse";

// Export all types
export type {
  ChatRequest,
  ChatMessage,
  ChatStreamChunk,
  ChatResponse,
  Provider,
  Kimi25Options,
} from "./types";
