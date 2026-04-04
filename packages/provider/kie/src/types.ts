// Supported Kie media models
export type KieMediaModel =
  | "kling-3.0/video"
  | "kling-3.0/motion-control"
  | "grok-imagine/text-to-image"
  | "grok-imagine/image-to-image"
  | "grok-imagine/text-to-video"
  | "grok-imagine/image-to-video"
  | "nano-banana-pro"
  | "bytedance/seedance-1.5-pro"
  | "nano-banana-2"
  | "gpt-image/1.5-image-to-image"
  | "seedream/5-lite-image-to-image"
  | "elevenlabs/text-to-dialogue-v3"
  | "elevenlabs/sound-effect-v2"
  | "elevenlabs/speech-to-text"
  | "grok-imagine/extend"
  | "grok-imagine/upscale"
  | "qwen2/text-to-image"
  | "qwen2/image-edit"
  | "sora-watermark-remover";

// Media generation types
export type MediaType = "image" | "video" | "audio" | "transcription";

// Kling element for video generation
export interface KlingElement {
  name: string;
  description: string;
  element_input_urls?: string[];
  element_input_video_urls?: string[];
}

// Multi-shot prompt for Kling
export interface MultiShotPrompt {
  prompt: string;
  duration: number;
}

// Base media request
export interface MediaRequest {
  model: KieMediaModel;
  callBackUrl?: string;
}

// Kling 3.0 video request
export interface KlingVideoRequest extends MediaRequest {
  model: "kling-3.0/video";
  input: {
    prompt?: string;
    image_urls?: string[];
    sound: boolean;
    duration:
      | "3"
      | "4"
      | "5"
      | "6"
      | "7"
      | "8"
      | "9"
      | "10"
      | "11"
      | "12"
      | "13"
      | "14"
      | "15";
    aspect_ratio?: "16:9" | "9:16" | "1:1";
    mode: "std" | "pro";
    multi_shots: boolean;
    multi_prompt?: MultiShotPrompt[];
    kling_elements?: KlingElement[];
  };
}

// Kling 3.0 motion control request
export interface KlingMotionControlRequest extends MediaRequest {
  model: "kling-3.0/motion-control";
  input: {
    prompt?: string;
    input_urls: string[];
    video_urls: string[];
    mode?: "720p" | "1080p";
    character_orientation?: "video" | "image";
    background_source?: "input_video" | "input_image";
  };
}

// Grok Imagine text to image request
export interface GrokTextToImageRequest extends MediaRequest {
  model: "grok-imagine/text-to-image";
  input: {
    prompt: string;
    aspect_ratio?: "2:3" | "3:2" | "1:1" | "16:9" | "9:16";
  };
}

// Qwen2 text to image request
export interface Qwen2TextToImageRequest extends MediaRequest {
  model: "qwen2/text-to-image";
  input: {
    prompt: string;
    image_size?: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
    output_format?: "png" | "jpeg";
    seed?: number;
  };
}

// Qwen2 image edit request
export interface Qwen2ImageEditRequest extends MediaRequest {
  model: "qwen2/image-edit";
  input: {
    prompt: string;
    image_url: string[];
    image_size:
      | "1:1"
      | "2:3"
      | "3:2"
      | "3:4"
      | "4:3"
      | "9:16"
      | "16:9"
      | "21:9";
    output_format: "png" | "jpeg";
    seed?: number;
  };
}

// Grok Imagine image to image request
export interface GrokImageToImageRequest extends MediaRequest {
  model: "grok-imagine/image-to-image";
  input: {
    prompt?: string;
    image_urls: [string];
    aspect_ratio?: "2:3" | "3:2" | "1:1" | "16:9" | "9:16";
  };
}

// Grok Imagine text to video request
export interface GrokTextToVideoRequest extends MediaRequest {
  model: "grok-imagine/text-to-video";
  input: {
    prompt: string;
    aspect_ratio?: "16:9" | "9:16" | "1:1";
    duration?: "6" | "10";
  };
}

// Grok Imagine image to video request
export interface GrokImageToVideoRequest extends MediaRequest {
  model: "grok-imagine/image-to-video";
  input: {
    prompt?: string;
    image_urls?: string[];
    task_id?: string;
    index?: number;
    mode?: "fun" | "normal" | "spicy";
    duration?: "6" | "10";
    resolution?: "480p" | "720p";
  };
}

// Grok Imagine video extend request
export interface GrokVideoExtendRequest extends MediaRequest {
  model: "grok-imagine/extend";
  input: {
    task_id: string;
    prompt: string;
    extend_at: number;
    extend_times: "6" | "10";
  };
}

// Grok Imagine video upscale request
export interface GrokVideoUpscaleRequest extends MediaRequest {
  model: "grok-imagine/upscale";
  input: {
    task_id: string;
  };
}

// Nano Banana Pro request
export interface NanoBananaProRequest extends MediaRequest {
  model: "nano-banana-pro";
  input: {
    prompt: string;
    image_input?: string[];
    aspect_ratio?:
      | "1:1"
      | "2:3"
      | "3:2"
      | "3:4"
      | "4:3"
      | "4:5"
      | "5:4"
      | "9:16"
      | "16:9"
      | "21:9"
      | "auto";
    resolution?: "1K" | "2K" | "4K";
    output_format?: "png" | "jpg";
  };
}

// Seedance 1.5 Pro video request
export interface SeedanceVideoRequest extends MediaRequest {
  model: "bytedance/seedance-1.5-pro";
  input: {
    prompt: string;
    input_urls?: string[];
    aspect_ratio?: "1:1" | "21:9" | "4:3" | "3:4" | "16:9" | "9:16";
    resolution?: "480p" | "720p" | "1080p";
    duration?: "4" | "8" | "12";
    fixed_lens?: boolean;
    generate_audio?: boolean;
  };
}

// Nano Banana 2 image request
export interface NanoBanana2Request extends MediaRequest {
  model: "nano-banana-2";
  input: {
    prompt: string;
    image_input?: string[];
    aspect_ratio?:
      | "1:1"
      | "2:3"
      | "3:2"
      | "3:4"
      | "4:3"
      | "4:5"
      | "5:4"
      | "9:16"
      | "16:9"
      | "21:9"
      | "1:4"
      | "1:8"
      | "4:1"
      | "8:1"
      | "auto";
    resolution?: "1K" | "2K" | "4K";
    output_format?: "png" | "jpg";
    google_search?: boolean;
  };
}

// GPT Image 1.5 image-to-image request
export interface GptImageToImageRequest extends MediaRequest {
  model: "gpt-image/1.5-image-to-image";
  input: {
    input_urls: string[];
    prompt: string;
    aspect_ratio?: "1:1" | "2:3" | "3:2";
    quality?: "medium" | "high";
  };
}

// Seedream 5 Lite image-to-image request
export interface SeedreamImageToImageRequest extends MediaRequest {
  model: "seedream/5-lite-image-to-image";
  input: {
    image_urls: string[];
    prompt: string;
    aspect_ratio?:
      | "1:1"
      | "4:3"
      | "3:4"
      | "16:9"
      | "9:16"
      | "2:3"
      | "3:2"
      | "21:9";
    quality?: "basic" | "high";
  };
}

// ElevenLabs voice names
export type ElevenLabsVoice =
  | "Adam"
  | "Alice"
  | "Bill"
  | "Brian"
  | "Callum"
  | "Charlie"
  | "Chris"
  | "Daniel"
  | "Eric"
  | "George"
  | "Harry"
  | "Jessica"
  | "Laura"
  | "Liam"
  | "Lily"
  | "Matilda"
  | "River"
  | "Roger"
  | "Sarah"
  | "Will";

// Dialogue line for ElevenLabs text-to-dialogue
export interface DialogueLine {
  text: string;
  voice: ElevenLabsVoice;
}

// ElevenLabs text-to-dialogue v3 request
export interface ElevenLabsDialogueRequest extends MediaRequest {
  model: "elevenlabs/text-to-dialogue-v3";
  input: {
    dialogue: DialogueLine[];
    stability?: 0 | 0.5 | 1.0;
    language_code?: string;
  };
}

// ElevenLabs sound effect v2 request
export interface ElevenLabsSfxRequest extends MediaRequest {
  model: "elevenlabs/sound-effect-v2";
  input: {
    text: string;
    output_format?: string;
    prompt_influence?: number;
    loop?: boolean;
    duration_seconds?: number;
  };
}

// ElevenLabs speech-to-text request
export interface ElevenLabsSttRequest extends MediaRequest {
  model: "elevenlabs/speech-to-text";
  input: {
    audio_url: string;
    tag_audio_events?: boolean;
    diarize?: boolean;
    language_code?: string;
  };
}

// Sora watermark remover request
export interface SoraWatermarkRequest extends MediaRequest {
  model: "sora-watermark-remover";
  input: {
    video_url: string;
  };
}

// Union type for all media requests
export type MediaGenerationRequest =
  | KlingVideoRequest
  | KlingMotionControlRequest
  | GrokTextToImageRequest
  | GrokImageToImageRequest
  | GrokTextToVideoRequest
  | GrokImageToVideoRequest
  | GrokVideoExtendRequest
  | GrokVideoUpscaleRequest
  | NanoBananaProRequest
  | SeedanceVideoRequest
  | NanoBanana2Request
  | GptImageToImageRequest
  | SeedreamImageToImageRequest
  | ElevenLabsDialogueRequest
  | ElevenLabsSfxRequest
  | ElevenLabsSttRequest
  | Qwen2TextToImageRequest
  | Qwen2ImageEditRequest
  | SoraWatermarkRequest;

// Standalone parameter union types (avoids verbose indexed-access types in consumers)
export type KlingDuration = KlingVideoRequest["input"]["duration"];
export type KlingAspectRatio = "16:9" | "9:16" | "1:1";
export type KlingMode = "std" | "pro";
export type GrokImagineMode = "fun" | "normal" | "spicy";
export type GrokImagineDuration = "6" | "10";
export type GrokImagineResolution = "480p" | "720p";
export type SeedanceDuration = "4" | "8" | "12";
export type SeedanceResolution = "480p" | "720p" | "1080p";
export type NanoBananaResolution = "1K" | "2K" | "4K";
export type NanoBananaOutputFormat = "png" | "jpg";
export type GptImageQuality = "medium" | "high";

// Raw API envelope response
export interface KieApiEnvelope<T = Record<string, unknown>> {
  code: number;
  msg: string;
  data?: T;
}

// Task creation response (raw envelope)
export type TaskResponse = KieApiEnvelope<{ taskId: string }>;

// Upload media request (file-stream-upload, multipart)
export interface UploadMediaRequest {
  file: Blob;
  filename: string;
  mimeType?: string;
}

// Upload file from URL request (file-url-upload)
export interface FileUrlUploadRequest {
  url: string;
  uploadPath?: string;
}

// Upload file as base64 request (file-base64-upload)
export interface FileBase64UploadRequest {
  base64: string;
  filename: string;
  mimeType?: string;
}

// Upload media response (raw envelope, shared by all upload endpoints)
export interface UploadMediaResponse {
  success: boolean;
  code: number;
  data?: { downloadUrl: string };
}

// Provider options
export interface KieOptions {
  apiKey: string;
  baseURL?: string;
  uploadBaseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
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

// Download URL request
export interface DownloadUrlRequest {
  url: string;
}

// Download URL response (raw envelope)
export type DownloadUrlResponse = KieApiEnvelope<string>;

// Task states
export type KieTaskState =
  | "waiting"
  | "queuing"
  | "generating"
  | "success"
  | "fail";

// Raw task info from GET /api/v1/jobs/recordInfo (raw envelope)
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

// Credits response (raw envelope)
export type KieCreditsResponse = KieApiEnvelope<number>;

// Payload schema types
export interface PayloadFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
  items?: PayloadFieldSchema;
  properties?: Record<string, PayloadFieldSchema>;
}

export interface PayloadSchema {
  method: "POST" | "DELETE";
  path: string;
  contentType: "application/json" | "multipart/form-data";
  fields: Record<string, PayloadFieldSchema>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ModelInputSchema {
  type: MediaType;
  fields: Record<string, PayloadFieldSchema>;
}

// Method types with schema validation
interface KieCreateTaskMethod {
  (req: MediaGenerationRequest): Promise<TaskResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface KieDownloadUrlMethod {
  (req: DownloadUrlRequest): Promise<DownloadUrlResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface KieFileStreamUploadMethod {
  (req: UploadMediaRequest): Promise<UploadMediaResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface KieFileUrlUploadMethod {
  (req: FileUrlUploadRequest): Promise<UploadMediaResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface KieFileBase64UploadMethod {
  (req: FileBase64UploadRequest): Promise<UploadMediaResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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
