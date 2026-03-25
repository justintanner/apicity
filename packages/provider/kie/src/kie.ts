import {
  MediaGenerationRequest,
  TaskResponse,
  KieOptions,
  KieProvider,
  MediaType,
  KieError,
  KieCreditsResponse,
  DownloadUrlResponse,
  UploadMediaRequest,
  UploadMediaResponse,
  KieTaskInfo,
} from "./types";
import { createVeoProvider } from "./veo";
import { createSunoProvider } from "./suno";
import { createChatProvider } from "./chat";

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
  "kling-3.0/motion-control": { type: "video", supported: true },
  "grok-imagine/text-to-image": { type: "image", supported: true },
  "grok-imagine/image-to-image": { type: "image", supported: true },
  "grok-imagine/text-to-video": { type: "video", supported: true },
  "grok-imagine/image-to-video": { type: "video", supported: true },
  "grok-imagine/extend": { type: "video", supported: true },
  "grok-imagine/upscale": { type: "video", supported: true },
  "nano-banana-pro": { type: "image", supported: true },
  "bytedance/seedance-1.5-pro": { type: "video", supported: true },
  "nano-banana-2": { type: "image", supported: true },
  "gpt-image/1.5-image-to-image": { type: "image", supported: true },
  "seedream/5-lite-image-to-image": { type: "image", supported: true },
  "elevenlabs/text-to-dialogue-v3": { type: "audio", supported: true },
  "elevenlabs/sound-effect-v2": { type: "audio", supported: true },
  "elevenlabs/speech-to-text": { type: "transcription", supported: true },
  "qwen2/text-to-image": { type: "image", supported: true },
  "sora-watermark-remover": { type: "video", supported: true },
};

export function kie(opts: KieOptions): KieProvider {
  const baseURL = opts.baseURL ?? "https://api.kie.ai";
  const uploadBaseURL = opts.uploadBaseURL ?? "https://kieai.redpandaai.co";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  function validateModel(modelId: string): boolean {
    return SUPPORTED_MODELS[modelId]?.supported === true;
  }

  function getModels(): string[] {
    return Object.keys(SUPPORTED_MODELS).filter(
      (model) => SUPPORTED_MODELS[model].supported
    );
  }

  function getModelType(modelId: string): MediaType | null {
    return SUPPORTED_MODELS[modelId]?.type || null;
  }

  async function createTask(
    req: MediaGenerationRequest
  ): Promise<TaskResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
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
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            typeof body === "object" &&
            body !== null &&
            "msg" in body &&
            typeof (body as { msg?: string }).msg === "string"
          ) {
            message = `Kie API error ${res.status}: ${(body as { msg: string }).msg}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KieError(message, res.status, body);
      }

      return (await res.json()) as TaskResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof KieError) throw error;
      throw new KieError(`Failed to create task: ${error}`, 500);
    }
  }

  async function recordInfo(taskId: string): Promise<KieTaskInfo> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(
        `${baseURL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Kie API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            typeof body === "object" &&
            body !== null &&
            "msg" in body &&
            typeof (body as { msg?: string }).msg === "string"
          ) {
            message = `Kie API error ${res.status}: ${(body as { msg: string }).msg}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KieError(message, res.status, body);
      }

      return (await res.json()) as KieTaskInfo;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof KieError) throw error;
      throw new KieError(`Failed to get task: ${error}`, 500);
    }
  }

  async function fileStreamUpload(
    req: UploadMediaRequest
  ): Promise<UploadMediaResponse> {
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
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            typeof body === "object" &&
            body !== null &&
            "msg" in body &&
            typeof (body as { msg?: string }).msg === "string"
          ) {
            message = `Kie upload error ${res.status}: ${(body as { msg: string }).msg}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KieError(message, res.status, body);
      }

      return (await res.json()) as UploadMediaResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof KieError) throw error;
      throw new KieError(`Failed to upload media: ${error}`, 500);
    }
  }

  async function downloadUrl(url: string): Promise<DownloadUrlResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${baseURL}/api/v1/common/download-url`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Kie API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            typeof body === "object" &&
            body !== null &&
            "msg" in body &&
            typeof (body as { msg?: string }).msg === "string"
          ) {
            message = `Kie API error ${res.status}: ${(body as { msg: string }).msg}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KieError(message, res.status, body);
      }

      return (await res.json()) as DownloadUrlResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof KieError) throw error;
      throw new KieError(`Failed to get download URL: ${error}`, 500);
    }
  }

  async function credit(): Promise<KieCreditsResponse> {
    const res = await doFetch(`${baseURL}/api/v1/chat/credit`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        // ignore parse errors
      }
      throw new KieError(
        `Failed to get credits: ${res.status}`,
        res.status,
        body
      );
    }

    return (await res.json()) as KieCreditsResponse;
  }

  return {
    veo: createVeoProvider(baseURL, opts.apiKey, doFetch, timeout),
    suno: createSunoProvider(baseURL, opts.apiKey, doFetch, timeout),
    chat: createChatProvider(baseURL, opts.apiKey, doFetch, timeout),
    api: {
      v1: {
        jobs: { createTask, recordInfo },
        common: { downloadUrl },
        chat: { credit },
      },
      fileStreamUpload,
    },
    validateModel,
    getModels,
    getModelType,
  };
}
