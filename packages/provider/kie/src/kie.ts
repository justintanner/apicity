import {
  MediaGenerationRequest,
  TaskResponse,
  TaskStatusDetails,
  TaskResult,
  WaitOptions,
  KieOptions,
  KieProvider,
  MediaType,
  KieError,
  KieCreditsResponse,
  UploadMediaRequest,
  UploadMediaResponse,
} from "./types";
import { TaskPoller } from "./polling";
import { createVeoProvider } from "./veo";
import { createSunoProvider } from "./suno";
import { createChatProvider } from "./chat";

interface KieApiResponse {
  code: number;
  msg: string;
  data?: {
    taskId?: string;
    [key: string]: unknown;
  };
}

interface KieUploadApiResponse {
  success: boolean;
  code: number;
  data?: {
    downloadUrl?: string;
  };
}

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  m4a: "audio/mp4",
};

function inferMimeType(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? MIME_TYPES[ext] : undefined;
}

// Supported models configuration
const SUPPORTED_MODELS: Record<
  string,
  { type: MediaType; supported: boolean }
> = {
  "kling-3.0/video": { type: "video", supported: true },
  "grok-imagine/text-to-image": { type: "image", supported: true },
  "grok-imagine/image-to-image": { type: "image", supported: true },
  "grok-imagine/text-to-video": { type: "video", supported: true },
  "grok-imagine/image-to-video": { type: "video", supported: true },
  "nano-banana-pro": { type: "image", supported: true },
  "bytedance/seedance-1.5-pro": { type: "video", supported: true },
  "nano-banana-2": { type: "image", supported: true },
  "gpt-image/1.5-image-to-image": { type: "image", supported: true },
  "seedream/5-lite-image-to-image": { type: "image", supported: true },
  "elevenlabs/text-to-dialogue-v3": { type: "audio", supported: true },
  "elevenlabs/sound-effect-v2": { type: "audio", supported: true },
  "elevenlabs/speech-to-text": { type: "transcription", supported: true },
  "sora-watermark-remover": { type: "video", supported: true },
};

export function kie(opts: KieOptions): KieProvider {
  const baseURL = opts.baseURL ?? "https://api.kie.ai";
  const uploadBaseURL = opts.uploadBaseURL ?? "https://kieai.redpandaai.co";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const poller = new TaskPoller(baseURL, opts.apiKey, doFetch);

  return {
    veo: createVeoProvider(baseURL, opts.apiKey, doFetch, timeout),
    suno: createSunoProvider(baseURL, opts.apiKey, doFetch, timeout),
    chat: createChatProvider(baseURL, opts.apiKey, doFetch, timeout),
    async createTask(req: MediaGenerationRequest): Promise<TaskResponse> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        if (!this.validateModel(req.model)) {
          throw new KieError(`Unsupported model: ${req.model}`, 400);
        }

        const res = await doFetch(`${baseURL}/api/v1/jobs/createTask`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let message = `Kie API error: ${res.status}`;
          try {
            const errorData: unknown = await res.json();
            if (
              typeof errorData === "object" &&
              errorData !== null &&
              "msg" in errorData &&
              typeof (errorData as { msg?: string }).msg === "string"
            ) {
              message = `Kie API error ${res.status}: ${(errorData as { msg: string }).msg}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new KieError(message, res.status);
        }

        const data: KieApiResponse = await res.json();

        if (data.code !== 200 || !data.data?.taskId) {
          throw new KieError(data.msg || `API error: ${data.code}`, data.code);
        }

        return { taskId: data.data.taskId };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof KieError) throw error;
        throw new KieError(`Failed to create task: ${error}`, 500);
      }
    },

    async getTaskStatus(taskId: string): Promise<TaskStatusDetails> {
      return poller.getTaskStatus(taskId);
    },

    async waitForTask(
      taskId: string,
      options?: WaitOptions
    ): Promise<TaskResult> {
      return poller.waitForTask(taskId, options);
    },

    async generate(
      req: MediaGenerationRequest,
      options?: WaitOptions
    ): Promise<TaskResult> {
      const { taskId } = await this.createTask(req);
      return this.waitForTask(taskId, options);
    },

    async uploadMedia(req: UploadMediaRequest): Promise<UploadMediaResponse> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const mimeType = req.mimeType ?? inferMimeType(req.filename);
        if (!mimeType) {
          throw new KieError(
            `Cannot determine MIME type for: ${req.filename}`,
            400
          );
        }

        if (
          !mimeType.startsWith("image/") &&
          !mimeType.startsWith("video/") &&
          !mimeType.startsWith("audio/")
        ) {
          throw new KieError(
            `Unsupported MIME type: ${mimeType}. Must be image/*, video/*, or audio/*`,
            400
          );
        }

        const timestamp = Date.now();
        const uploadPath = `uploads/${timestamp}_${req.filename}`;

        const formData = new FormData();
        const file = new File([req.file], req.filename, { type: mimeType });
        formData.append("file", file);
        formData.append("uploadPath", uploadPath);

        const res = await doFetch(`${uploadBaseURL}/api/file-stream-upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let message = `Kie upload error: ${res.status}`;
          try {
            const errorData: unknown = await res.json();
            if (
              typeof errorData === "object" &&
              errorData !== null &&
              "msg" in errorData &&
              typeof (errorData as { msg?: string }).msg === "string"
            ) {
              message = `Kie upload error ${res.status}: ${(errorData as { msg: string }).msg}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new KieError(message, res.status);
        }

        const data: KieUploadApiResponse = await res.json();

        if (!data.success || !data.data?.downloadUrl) {
          throw new KieError(`Upload failed: code ${data.code}`, data.code);
        }

        return { downloadUrl: data.data.downloadUrl };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof KieError) throw error;
        throw new KieError(`Failed to upload media: ${error}`, 500);
      }
    },

    validateModel(modelId: string): boolean {
      return SUPPORTED_MODELS[modelId]?.supported === true;
    },

    getModels(): string[] {
      return Object.keys(SUPPORTED_MODELS).filter(
        (model) => SUPPORTED_MODELS[model].supported
      );
    },

    getModelType(modelId: string): MediaType | null {
      return SUPPORTED_MODELS[modelId]?.type || null;
    },

    async getCredits(): Promise<KieCreditsResponse> {
      const res = await doFetch(`${baseURL}/api/v1/chat/credit`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new KieError(`Failed to get credits: ${res.status}`, res.status);
      }

      interface CreditsApiResponse {
        code: number;
        msg: string;
        data?: number;
      }

      const response: CreditsApiResponse = await res.json();

      if (response.code !== 200 || response.data === undefined) {
        throw new KieError(
          response.msg || `API error: ${response.code}`,
          response.code
        );
      }

      return {
        balance: response.data,
        totalUsed: 0,
        currency: "credits",
      };
    },
  };
}
