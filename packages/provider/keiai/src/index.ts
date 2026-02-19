// Export main provider function
export { keiai } from "./keiai";

// Export error class
export { KeiAIError } from "./types";

// Export polling utilities
export { TaskPoller } from "./polling";

// Export all types
export type {
  KeiAIMediaModel,
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
  MediaGenerationRequest,
  TaskResponse,
  TaskStatusDetails,
  TaskResult,
  KeiAIOptions,
  PollingOptions,
  WaitOptions,
  KeiAIProvider,
} from "./types";
