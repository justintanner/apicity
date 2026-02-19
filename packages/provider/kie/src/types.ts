// Supported Kie media models
export type KieMediaModel =
  | "kling-3.0/video"
  | "grok-imagine/text-to-image"
  | "grok-imagine/image-to-image"
  | "grok-imagine/text-to-video"
  | "grok-imagine/image-to-video"
  | "nano-banana-pro";

// Media generation types
export type MediaType = "image" | "video";

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
    prompt: string;
    image_url: string;
    aspect_ratio?: "2:3" | "3:2" | "1:1" | "16:9" | "9:16";
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
    duration?: "6" | "10";
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

// Union type for all media requests
export type MediaGenerationRequest =
  | KlingVideoRequest
  | GrokTextToImageRequest
  | GrokImageToImageRequest
  | GrokTextToVideoRequest
  | GrokImageToVideoRequest
  | NanoBananaProRequest;

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
  videoUrl?: string;
  imageUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Provider options
export interface KieOptions {
  apiKey: string;
  baseURL?: string;
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

// Provider interface
export interface KieProvider {
  createTask(req: MediaGenerationRequest): Promise<TaskResponse>;
  getTaskStatus(taskId: string): Promise<TaskStatusDetails>;
  waitForTask(taskId: string, options?: WaitOptions): Promise<TaskResult>;
  generate(
    req: MediaGenerationRequest,
    options?: WaitOptions
  ): Promise<TaskResult>;
  getCredits(): Promise<KieCreditsResponse>;
  validateModel(modelId: string): boolean;
  getModels(): string[];
  getModelType(modelId: string): MediaType | null;
}
