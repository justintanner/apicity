import {
  MediaGenerationRequest,
  TaskResponse,
  KieOptions,
  KieProvider,
  KieError,
  KieCreditsResponse,
  DownloadUrlRequest,
  DownloadUrlResponse,
  UploadMediaRequest,
  UploadMediaResponse,
  FileUrlUploadRequest,
  FileBase64UploadRequest,
  KieTaskInfo,
} from "./types";
import type { ValidationResult } from "./types";
import {
  createTaskSchema,
  downloadUrlSchema,
  fileStreamUploadSchema,
  fileUrlUploadSchema,
  fileBase64UploadSchema,
  modelInputSchemas,
} from "./schemas";
import { validatePayload } from "./validate";
import { createVeoProvider } from "./veo";
import { createSunoProvider } from "./suno";
import { createChatProvider } from "./chat";
import { createClaudeProvider } from "./claude";

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

export function kie(opts: KieOptions): KieProvider {
  const baseURL = opts.baseURL ?? "https://api.kie.ai";
  const uploadBaseURL = opts.uploadBaseURL ?? "https://kieai.redpandaai.co";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
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

  async function fileUrlUpload(
    req: FileUrlUploadRequest
  ): Promise<UploadMediaResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const uploadPath =
        req.uploadPath ??
        `uploads/${Date.now()}_${req.url.split("/").pop() ?? "file"}`;

      const res = await doFetch(`${uploadBaseURL}/api/file-url-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: req.url, uploadPath }),
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
      throw new KieError(`Failed to upload from URL: ${error}`, 500);
    }
  }

  async function fileBase64Upload(
    req: FileBase64UploadRequest
  ): Promise<UploadMediaResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const mimeType = req.mimeType ?? inferMimeType(req.filename);
      const uploadPath = `uploads/${Date.now()}_${req.filename}`;

      const res = await doFetch(`${uploadBaseURL}/api/file-base64-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64: req.base64,
          filename: req.filename,
          uploadPath,
          ...(mimeType ? { mimeType } : {}),
        }),
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
      throw new KieError(`Failed to upload base64 file: ${error}`, 500);
    }
  }

  async function downloadUrl(
    req: DownloadUrlRequest
  ): Promise<DownloadUrlResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${baseURL}/api/v1/common/download-url`, {
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
    ...createClaudeProvider(baseURL, opts.apiKey, doFetch, timeout),
    modelInputSchemas,
    api: {
      v1: {
        jobs: {
          createTask: Object.assign(createTask, {
            payloadSchema: createTaskSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, createTaskSchema);
            },
          }),
          recordInfo,
        },
        common: {
          "download-url": Object.assign(downloadUrl, {
            payloadSchema: downloadUrlSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, downloadUrlSchema);
            },
          }),
        },
        chat: { credit },
      },
      "file-stream-upload": Object.assign(fileStreamUpload, {
        payloadSchema: fileStreamUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, fileStreamUploadSchema);
        },
      }),
      "file-url-upload": Object.assign(fileUrlUpload, {
        payloadSchema: fileUrlUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, fileUrlUploadSchema);
        },
      }),
      "file-base64-upload": Object.assign(fileBase64Upload, {
        payloadSchema: fileBase64UploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, fileBase64UploadSchema);
        },
      }),
    },
  };
}
