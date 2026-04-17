import type { z } from "zod";

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

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
  GrokVideoExtendRequest,
  GrokVideoUpscaleRequest,
  NanoBananaProRequest,
  NanoBanana2Request,
  GptImageToImageRequest,
  SeedreamImageToImageRequest,
  ElevenLabsVoice,
  DialogueLine,
  ElevenLabsDialogueRequest,
  ElevenLabsSfxRequest,
  ElevenLabsSttRequest,
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
  UploadMediaRequest,
  FileUrlUploadRequest,
  FileBase64UploadRequest,
  DownloadUrlRequest,
  KieOptions,
  // Standalone parameter union types
  KlingDuration,
  KlingAspectRatio,
  KlingMode,
  GrokImagineMode,
  GrokImagineDuration,
  GrokImageToVideoDuration,
  GrokImagineResolution,
  NanoBananaResolution,
  NanoBananaOutputFormat,
  GptImageQuality,
  Wan27Resolution,
  Wan27AspectRatio,
  Wan27AudioSetting,
  Wan27ImageResolution,
  Wan27ImageAspectRatio,
} from "./zod";

// ---------------------------------------------------------------------------
// Base type (kept for backward compat — consumers may reference it)
// ---------------------------------------------------------------------------

import type { KieMediaModel } from "./zod";

export interface MediaRequest {
  model: KieMediaModel;
  callBackUrl?: string;
}

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

// ---------------------------------------------------------------------------
// Model input schema types (for parameter discovery / UI generation)
// ---------------------------------------------------------------------------

export interface PayloadFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
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
} from "./zod";

interface KieCreateTaskMethod {
  (req: MediaGenerationRequest): Promise<TaskResponse>;
  schema: z.ZodType;
}

interface KieDownloadUrlMethod {
  (req: DownloadUrlRequest): Promise<DownloadUrlResponse>;
  schema: z.ZodType<DownloadUrlRequest>;
}

interface KieFileStreamUploadMethod {
  (req: UploadMediaRequest): Promise<UploadMediaResponse>;
  schema: z.ZodType<UploadMediaRequest>;
}

interface KieFileUrlUploadMethod {
  (req: FileUrlUploadRequest): Promise<UploadMediaResponse>;
  schema: z.ZodType<FileUrlUploadRequest>;
}

interface KieFileBase64UploadMethod {
  (req: FileBase64UploadRequest): Promise<UploadMediaResponse>;
  schema: z.ZodType<FileBase64UploadRequest>;
}

// POST namespace
interface KiePostApiNamespace {
  v1: {
    jobs: { createTask: KieCreateTaskMethod };
    common: { downloadUrl: KieDownloadUrlMethod };
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
