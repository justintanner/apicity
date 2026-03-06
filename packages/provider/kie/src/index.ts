// Export main provider function
export { kie } from "./kie";

// Export error class
export { KieError } from "./types";

// Export polling utilities
export { TaskPoller } from "./polling";

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
  TaskStatus,
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
  TaskStatusDetails,
  TaskResult,
  KieOptions,
  PollingOptions,
  WaitOptions,
  KieProvider,
  KieCreditsResponse,
  UploadMediaRequest,
  UploadMediaResponse,
} from "./types";

// Export polling endpoint types
export type { PollerEndpoints } from "./polling";

// Export sub-provider types
export type {
  VeoModel,
  VeoGenerationType,
  VeoGenerateRequest,
  VeoExtendRequest,
  VeoProvider,
} from "./veo";

export type {
  SunoModel,
  SunoGenerateRequest,
  SunoResult,
  SunoProvider,
} from "./suno";

export type {
  KieChatContentPart,
  KieChatMessage,
  KieChatRequest,
  KieChatResponse,
  KieChatProvider,
} from "./chat";
