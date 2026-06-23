import type { KieMediaModel } from "./zod";

export interface ApicitySchemaIssue {
  path: readonly PropertyKey[];
  message: string;
  code?: string;
}

export interface ApicitySchemaError {
  issues: readonly ApicitySchemaIssue[];
}

export type ApicitySafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApicitySchemaError };

export interface ApicitySchema<T = unknown> {
  parse(data: unknown): T;
  safeParse(data: unknown): ApicitySafeParseResult<T>;
  description?: string;
}

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  KieMediaModel,
  MediaType,
  KlingElement,
  MultiShotPrompt,
  KlingVideoRequest,
  KlingVideoParsedRequest,
  KlingMotionControlRequest,
  KlingMotionControlParsedRequest,
  KlingV3TurboImageToVideoRequest,
  KlingV3TurboImageToVideoParsedRequest,
  KlingV3TurboTextToVideoRequest,
  KlingV3TurboTextToVideoParsedRequest,
  GrokTextToImageRequest,
  GrokTextToImageParsedRequest,
  GrokImageToImageRequest,
  GrokImageToImageParsedRequest,
  GrokTextToVideoRequest,
  GrokTextToVideoParsedRequest,
  GrokImageToVideoRequest,
  GrokImageToVideoParsedRequest,
  GrokVideo15PreviewRequest,
  GrokVideo15PreviewParsedRequest,
  GrokVideoExtendRequest,
  GrokVideoExtendParsedRequest,
  GrokVideoUpscaleRequest,
  GrokVideoUpscaleParsedRequest,
  NanoBananaProRequest,
  NanoBananaProParsedRequest,
  NanoBanana2Request,
  NanoBanana2ParsedRequest,
  GptImageToImageRequest,
  GptImageToImageParsedRequest,
  GptImage2ImageToImageRequest,
  GptImage2ImageToImageParsedRequest,
  GptImage2TextToImageRequest,
  GptImage2TextToImageParsedRequest,
  SeedreamImageToImageRequest,
  SeedreamImageToImageParsedRequest,
  SeedreamTextToImageRequest,
  SeedreamTextToImageParsedRequest,
  Qwen2TextToImageRequest,
  Qwen2TextToImageParsedRequest,
  Qwen2ImageEditRequest,
  Qwen2ImageEditParsedRequest,
  Seedance2FastRequest,
  Seedance2FastParsedRequest,
  Seedance2Request,
  Seedance2ParsedRequest,
  Wan27ImageToVideoRequest,
  Wan27ImageToVideoParsedRequest,
  Wan27TextToVideoRequest,
  Wan27TextToVideoParsedRequest,
  Wan27RefToVideoRequest,
  Wan27RefToVideoParsedRequest,
  Wan27VideoEditRequest,
  Wan27VideoEditParsedRequest,
  Wan27ImageColorPalette,
  Wan27ImageRequest,
  Wan27ImageParsedRequest,
  Wan27ImageProRequest,
  Wan27ImageProParsedRequest,
  Wan27TaskResultJson,
  Wan27VideoResult,
  Wan27ImageResult,
  SoraWatermarkRequest,
  SoraWatermarkParsedRequest,
  MediaGenerationRequest,
  MediaGenerationParsedRequest,
  UploadMediaRequest,
  UploadMediaParsedRequest,
  FileUrlUploadRequest,
  FileUrlUploadParsedRequest,
  FileBase64UploadRequest,
  FileBase64UploadParsedRequest,
  DownloadUrlRequest,
  DownloadUrlParsedRequest,
  KieOptions,
  // Standalone parameter union types
  KlingDuration,
  KlingAspectRatio,
  KlingMode,
  KlingV3TurboDuration,
  KlingV3TurboResolution,
  KlingV3TurboAspectRatio,
  GrokImagineMode,
  GrokTextToVideoMode,
  GrokImageToVideoMode,
  GrokTextToVideoAspectRatio,
  GrokImageToVideoAspectRatio,
  GrokTextToVideoDuration,
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
  Wan27VideoEditDuration,
  HappyHorseResolution,
  HappyHorseAspectRatio,
  HappyHorseAudioSetting,
  HappyHorseDuration,
  Omnihuman15OutputResolution,
  VolcengineVideoToVideoLipSyncMode,
  HappyHorseTextToVideoRequest,
  HappyHorseTextToVideoParsedRequest,
  HappyHorseImageToVideoRequest,
  HappyHorseImageToVideoParsedRequest,
  HappyHorseReferenceToVideoRequest,
  HappyHorseReferenceToVideoParsedRequest,
  HappyHorseVideoEditRequest,
  HappyHorseVideoEditParsedRequest,
  Omnihuman15Request,
  Omnihuman15ParsedRequest,
  VolcengineVideoToVideoLipSyncRequest,
  VolcengineVideoToVideoLipSyncParsedRequest,
  ElevenLabsAudioIsolationRequest,
  ElevenLabsAudioIsolationParsedRequest,
  ElevenLabsTextToDialogueV3Request,
  ElevenLabsTextToDialogueV3ParsedRequest,
  ElevenLabsTextToSpeechMultilingualV2Request,
  ElevenLabsTextToSpeechMultilingualV2ParsedRequest,
  ElevenLabsTextToSpeechTurbo25Request,
  ElevenLabsTextToSpeechTurbo25ParsedRequest,
  ElevenLabsSoundEffectV2Request,
  ElevenLabsSoundEffectV2ParsedRequest,
  GeminiOmniAudioCreateRequest,
  GeminiOmniAudioCreateParsedRequest,
} from "./zod";

// ---------------------------------------------------------------------------
// Response types (hand-written — not schema-ified yet)
// ---------------------------------------------------------------------------

export interface KieApiEnvelope<T = Record<string, unknown>> {
  code: number;
  msg: string;
  data?: T;
}

export type TaskResponse = KieApiEnvelope<{ taskId: string }>;

export interface UploadFileData {
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface UploadMediaResponse {
  success: boolean;
  code: number;
  msg: string;
  data?: UploadFileData;
}

export type DownloadUrlResponse = KieApiEnvelope<string>;

export type KieTaskState =
  | "waiting"
  | "queuing"
  | "generating"
  | "success"
  | "fail";

export interface KieTaskInfoData {
  taskId?: string;
  model?: string;
  state?: string;
  param?: string;
  resultJson?: string;
  failCode?: string;
  failMsg?: string;
  costTime?: number;
  completeTime?: number;
  createTime?: number;
  updateTime?: number;
  progress?: number;
}

export type KieTaskInfo = KieApiEnvelope<KieTaskInfoData>;
export type KieCreditsResponse = KieApiEnvelope<number>;

export interface GeminiOmniAudioCreateData {
  audioId: string;
  name: string;
}

export type GeminiOmniAudioCreateResponse =
  KieApiEnvelope<GeminiOmniAudioCreateData>;

// ---------------------------------------------------------------------------
// Model input schema types (for parameter discovery / UI generation)
// ---------------------------------------------------------------------------

export interface PayloadFieldSchema {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  default?: string | number | boolean | null | readonly unknown[];
  items?: PayloadFieldSchema;
  properties?: Record<string, PayloadFieldSchema>;
}

export interface ModelInputSchema {
  type: "image" | "video" | "audio" | "transcription";
  fields: Record<string, PayloadFieldSchema>;
}

// ---------------------------------------------------------------------------
// Method interface types (endpoint shapes with .schema)
// ---------------------------------------------------------------------------

import type {
  MediaGenerationRequest,
  DownloadUrlRequest,
  UploadMediaRequest,
  FileUrlUploadRequest,
  FileBase64UploadRequest,
  GeminiOmniAudioCreateRequest,
} from "./zod";

export type { PayGateApproval as KieApproval } from "./paygate";
import type { PayGateApproval as KieApproval } from "./paygate";

interface KieCreateTaskMethod {
  (req: MediaGenerationRequest, approval?: KieApproval): Promise<TaskResponse>;
  schema: ApicitySchema<MediaGenerationRequest>;
}

interface KieDownloadUrlMethod {
  (req: DownloadUrlRequest): Promise<DownloadUrlResponse>;
  schema: ApicitySchema<DownloadUrlRequest>;
}

interface KieFileStreamUploadMethod {
  (req: UploadMediaRequest): Promise<UploadMediaResponse>;
  schema: ApicitySchema<UploadMediaRequest>;
}

interface KieFileUrlUploadMethod {
  (req: FileUrlUploadRequest): Promise<UploadMediaResponse>;
  schema: ApicitySchema<FileUrlUploadRequest>;
}

interface KieFileBase64UploadMethod {
  (req: FileBase64UploadRequest): Promise<UploadMediaResponse>;
  schema: ApicitySchema<FileBase64UploadRequest>;
}

interface KieGeminiOmniAudioCreateMethod {
  (req: GeminiOmniAudioCreateRequest): Promise<GeminiOmniAudioCreateResponse>;
  schema: ApicitySchema<GeminiOmniAudioCreateRequest>;
}

// POST namespace
interface KiePostApiNamespace {
  v1: {
    jobs: { createTask: KieCreateTaskMethod };
    common: { downloadUrl: KieDownloadUrlMethod };
    omni: {
      audio: {
        create: KieGeminiOmniAudioCreateMethod;
      };
    };
  };
  fileStreamUpload: KieFileStreamUploadMethod;
  fileUrlUpload: KieFileUrlUploadMethod;
  fileBase64Upload: KieFileBase64UploadMethod;
}

// GET namespace
interface KieGetApiNamespace {
  v1: {
    jobs: { recordInfo(taskId: string): Promise<KieTaskInfo> };
    chat: { credit(): Promise<KieCreditsResponse> };
  };
}

// Provider interface (sub-provider types imported in index.ts)
export interface KieProvider {
  post: { api: KiePostApiNamespace };
  get: { api: KieGetApiNamespace };
  modelInputSchemas: Record<KieMediaModel, ModelInputSchema>;
  veo: import("./veo").VeoProvider;
  suno: import("./suno").SunoProvider;
  chat: import("./chat").KieChatProvider;
  claude: import("./claude").KieClaudeProvider["claude"];
}

// Error class
export class KieError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "KieError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}
