// Export main provider function and helpers
export { createKie, submitMediaJob, uploadFile } from "./kie";

// Export error class
export { KieError } from "./types";

// Export middleware
export {
  withRetry,
  withFallback,
  withRateLimit,
  createRateLimiter,
} from "./middleware";
export type {
  RetryOptions,
  FallbackOptions,
  RateLimiterOptions,
  RateLimiter,
  RateLimitOptions,
} from "./middleware";

// Export sub-provider factory functions
export { createVeoProvider } from "./veo";
export { createSunoProvider } from "./suno";
export { createChatProvider } from "./chat";
export { createClaudeProvider } from "./claude";

// Export SSE utility
export { sseToIterable } from "./sse";

// Export all types
export type {
  KieMediaModel,
  MediaType,
  KlingElement,
  MultiShotPrompt,
  KlingVideoRequest,
  KlingMotionControlRequest,
  GrokTextToImageRequest,
  GrokImageToImageRequest,
  GrokTextToVideoRequest,
  GrokImageToVideoRequest,
  GrokVideo15PreviewRequest,
  GrokVideoExtendRequest,
  GrokVideoUpscaleRequest,
  NanoBananaProRequest,
  NanoBanana2Request,
  GptImageToImageRequest,
  GptImage2ImageToImageRequest,
  GptImage2TextToImageRequest,
  SeedreamImageToImageRequest,
  SeedreamTextToImageRequest,
  Qwen2TextToImageRequest,
  Qwen2ImageEditRequest,
  Seedance2FastRequest,
  Seedance2Request,
  Wan27ImageToVideoRequest,
  Wan27TextToVideoRequest,
  Wan27RefToVideoRequest,
  Wan27VideoEditRequest,
  Wan27ImageColorPalette,
  Wan27ImageRequest,
  Wan27ImageProRequest,
  SoraWatermarkRequest,
  MediaGenerationRequest,
  KieOptions,
  KieApproval,
  KieProvider,
  KieApiEnvelope,
  KieTaskState,
  KieTaskInfoData,
  KieTaskInfo,
  KieCreditsResponse,
  DownloadUrlRequest,
  DownloadUrlResponse,
  UploadMediaRequest,
  UploadMediaResponse,
  UploadFileData,
  FileUrlUploadRequest,
  FileBase64UploadRequest,
  PayloadFieldSchema,
  ModelInputSchema,
  // Standalone parameter union types
  KlingDuration,
  KlingAspectRatio,
  KlingMode,
  GrokImagineMode,
  GrokImagineDuration,
  GrokImageToVideoDuration,
  GrokImagineResolution,
  GrokVideo15AspectRatio,
  NanoBananaResolution,
  NanoBananaOutputFormat,
  GptImageQuality,
  GptImage2ImageToImageAspectRatio,
  GptImage2ImageToImageResolution,
  GptImage2TextToImageAspectRatio,
  GptImage2TextToImageResolution,
  Wan27Resolution,
  Wan27AspectRatio,
  Wan27AudioSetting,
  Wan27ImageResolution,
  Wan27ImageAspectRatio,
  HappyHorseResolution,
  HappyHorseAspectRatio,
  HappyHorseAudioSetting,
  HappyHorseTextToVideoRequest,
  HappyHorseImageToVideoRequest,
  HappyHorseReferenceToVideoRequest,
  HappyHorseVideoEditRequest,
} from "./types";

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
  SunoExtendRequest,
  SunoWavRequest,
  SunoVocalRemovalRequest,
  SunoMp4Request,
  SunoLyricsRequest,
  SunoBoostStyleRequest,
  SunoUploadCoverRequest,
  SunoUploadExtendRequest,
  SunoMidiRequest,
  SunoMashupModel,
  SunoMashupRequest,
  SunoReplaceSectionRequest,
  SunoSoundsModel,
  SunoSoundsKey,
  SunoSoundsRequest,
  SunoAddInstrumentalRequest,
  SunoAddVocalsRequest,
  SunoProvider,
} from "./suno";

export type {
  KieChatContentPart,
  KieChatMessage,
  KieChatRequest,
  KieChatChoice,
  KieChatUsage,
  KieChatResponse,
  KieChatProvider,
} from "./chat";

export type {
  KieClaudeToolInputSchema,
  KieClaudeTool,
  KieClaudeContentPart,
  KieClaudeMessage,
  KieClaudeRequest,
  KieClaudeUsage,
  KieClaudeToolUseContent,
  KieClaudeTextContent,
  KieClaudeContentBlock,
  KieClaudeResponse,
  KieClaudeProvider,
} from "./claude";
