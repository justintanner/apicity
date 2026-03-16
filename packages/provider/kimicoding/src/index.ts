export { kimicoding, textBlock, imageBase64, imageUrl } from "./kimicoding";

export { KimiCodingError } from "./types";

export {
  withRetry,
  withFallback,
  withStreamRetry,
  withStreamFallback,
} from "./middleware";

export type { RetryOptions, FallbackOptions } from "./middleware";

export { sseToIterable } from "./sse";

export type {
  ChatRequest,
  ChatMessage,
  ChatStreamChunk,
  ChatResponse,
  Provider,
  KimiCodingOptions,
  KimiCodingProvider,
  ContentBlock,
  TextContentBlock,
  ImageContentBlock,
  ImageSource,
  Base64ImageSource,
  UrlImageSource,
  MessageContent,
} from "./types";
