// Supported Kie media models
export type KieMediaModel =
  | "kling-3.0/video"
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
  | "sora-watermark-remover";

// Media generation types
export type MediaType = "image" | "video" | "audio" | "transcription";

// Task status (internal representation)
export type TaskStatus = "pending" | "processing" | "completed" | "failed";

// Kie API task states (from recordInfo endpoint)
export type KieTaskState =
  | "waiting"
  | "queuing"
  | "generating"
  | "success"
  | "fail";

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

// Grok Imagine text to image request
export interface GrokTextToImageRequest extends MediaRequest {
  model: "grok-imagine/text-to-image";
  input: {
    prompt: string;
    aspect_ratio?: "2:3" | "3:2" | "1:1" | "16:9" | "9:16";
  };
}

// Grok Imagine image to image request
export interface GrokImageToImageRequest extends MediaRequest {
  model: "grok-imagine/image-to-image";
  input: {
    prompt?: string;
    image_urls: [string];
  };
}

// Grok Imagine text to video request
export interface GrokTextToVideoRequest extends MediaRequest {
  model: "grok-imagine/text-to-video";
  input: {
    prompt: string;
    aspect_ratio?: "16:9" | "9:16" | "1:1";
    duration?: "5" | "10";
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
    duration?: "6" | "10" | "15";
    resolution?: "480p" | "720p";
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
  | GrokTextToImageRequest
  | GrokImageToImageRequest
  | GrokTextToVideoRequest
  | GrokImageToVideoRequest
  | NanoBananaProRequest
  | SeedanceVideoRequest
  | NanoBanana2Request
  | GptImageToImageRequest
  | SeedreamImageToImageRequest
  | ElevenLabsDialogueRequest
  | ElevenLabsSfxRequest
  | ElevenLabsSttRequest
  | SoraWatermarkRequest;

// Task creation response
export interface TaskResponse {
  taskId: string;
}

// Task status details (from Kei AI API recordInfo endpoint)
export interface TaskStatusDetails {
  taskId: string;
  status: TaskStatus;
  state?: KieTaskState;
  progress?: number;
  model?: string;
  param?: string;
  result?: {
    urls?: string[];
    resultUrls?: string[];
    resultObject?: Record<string, unknown>;
    video_url?: string;
    image_url?: string;
    [key: string]: unknown;
  };
  error?: string;
  failCode?: string;
  failMsg?: string;
  createTime?: number;
  updateTime?: number;
  completeTime?: number;
  costTime?: number;
}

// Completed task result
export interface TaskResult {
  taskId: string;
  status: "completed" | "failed";
  urls: string[];
  resultObject?: Record<string, unknown>;
  videoUrl?: string;
  imageUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Upload media request
export interface UploadMediaRequest {
  file: Blob;
  filename: string;
  mimeType?: string;
}

// Upload media response
export interface UploadMediaResponse {
  downloadUrl: string;
}

// Provider options
export interface KieOptions {
  apiKey: string;
  baseURL?: string;
  uploadBaseURL?: string;
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// Polling options
export interface PollingOptions {
  intervalMs?: number;
  maxAttempts?: number;
  timeoutMs?: number;
}

// Wait options
export interface WaitOptions extends PollingOptions {
  onProgress?: (status: TaskStatusDetails) => void;
}

// Error class
export class KieError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "KieError";
    this.status = status;
    this.code = code;
  }
}

// Credits response
export interface KieCreditsResponse {
  balance: number;
  totalUsed: number;
  currency: string;
}

// Provider interface (sub-provider types imported in index.ts)
export interface KieProvider {
  createTask(req: MediaGenerationRequest): Promise<TaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusDetails>;
  waitForTask(taskId: string, options?: WaitOptions): Promise<TaskResult>;
  generate(
    req: MediaGenerationRequest,
    options?: WaitOptions
  ): Promise<TaskResult>;
  uploadMedia(req: UploadMediaRequest): Promise<UploadMediaResponse>;
  getCredits(): Promise<KieCreditsResponse>;
  validateModel(modelId: string): boolean;
  getModels(): string[];
  getModelType(modelId: string): MediaType | null;
  veo: import("./veo").VeoProvider;
  suno: import("./suno").SunoProvider;
  chat: import("./chat").KieChatProvider;
}
