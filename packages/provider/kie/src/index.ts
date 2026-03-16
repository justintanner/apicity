// Export main provider function
export { kie } from "./kie";

// Export error class
export { KieError } from "./types";

// Export middleware
export { withRetry, withFallback } from "./middleware";
export type { RetryOptions, FallbackOptions } from "./middleware";

// Export sub-provider factory functions
export { createVeoProvider } from "./veo";
export { createSunoProvider } from "./suno";
export { createChatProvider } from "./chat";

// Export SSE utility
export { sseToIterable } from "./sse";

// Export all types
export type {
  KieMediaModel,
  MediaType,
  KlingElement,
  MultiShotPrompt,
  MediaRequest,
  KlingVideoRequest,
  GrokTextToImageRequest,
  GrokImageToImageRequest,
  GrokTextToVideoRequest,
  GrokImageToVideoRequest,
  NanoBananaProRequest,
  SeedanceVideoRequest,
  NanoBanana2Request,
  GptImageToImageRequest,
  SeedreamImageToImageRequest,
  ElevenLabsVoice,
  DialogueLine,
  ElevenLabsDialogueRequest,
  ElevenLabsSfxRequest,
  ElevenLabsSttRequest,
  SoraWatermarkRequest,
  MediaGenerationRequest,
  TaskResponse,
  KieOptions,
  KieProvider,
  KieTaskState,
  KieTaskResult,
  KieTaskInfo,
  KieCreditsResponse,
  DownloadUrlResponse,
  UploadMediaRequest,
  UploadMediaResponse,
} from "./types";

// Export sub-provider types
export type {
  VeoModel,
  VeoGenerationType,
  VeoGenerateRequest,
  VeoExtendRequest,
  VeoProvider,
} from "./veo";

export type { SunoModel, SunoGenerateRequest, SunoProvider } from "./suno";

export type {
  KieChatContentPart,
  KieChatMessage,
  KieChatRequest,
  KieChatResponse,
  KieChatProvider,
} from "./chat";
