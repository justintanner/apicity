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
import {
  CreateTaskRequestSchema,
  DownloadUrlRequestSchema,
  UploadMediaRequestSchema,
  FileUrlUploadRequestSchema,
  FileBase64UploadRequestSchema,
} from "./zod";
import { modelInputSchemas } from "./model-schemas";
import { createVeoProvider } from "./veo";
import { createSunoProvider } from "./suno";
import { createChatProvider } from "./chat";
import { createClaudeProvider } from "./claude";
import { createElevenLabsProvider } from "./elevenlabs";

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
  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai
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

  // GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}
  // Docs: https://docs.kie.ai
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

  // POST https://api.kie.ai/api/file-stream-upload
  // Docs: https://docs.kie.ai
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

      const formData = new FormData();
      const file = new File([req.file], req.filename, { type: mimeType });
      formData.append("file", file);
      formData.append("uploadPath", req.uploadPath);
      if (req.fileName) {
        formData.append("fileName", req.fileName);
      }

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

  // POST https://api.kie.ai/api/file-url-upload
  // Docs: https://docs.kie.ai
  async function fileUrlUpload(
    req: FileUrlUploadRequest
  ): Promise<UploadMediaResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${uploadBaseURL}/api/file-url-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: req.fileUrl,
          uploadPath: req.uploadPath,
          ...(req.fileName ? { fileName: req.fileName } : {}),
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
      throw new KieError(`Failed to upload from URL: ${error}`, 500);
    }
  }

  // POST https://api.kie.ai/api/file-base64-upload
  // Docs: https://docs.kie.ai
  async function fileBase64Upload(
    req: FileBase64UploadRequest
  ): Promise<UploadMediaResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${uploadBaseURL}/api/file-base64-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Data: req.base64Data,
          uploadPath: req.uploadPath,
          ...(req.fileName ? { fileName: req.fileName } : {}),
          ...(req.mimeType ? { mimeType: req.mimeType } : {}),
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

  // POST https://api.kie.ai/api/v1/common/download-url
  // Docs: https://docs.kie.ai
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

  // GET https://api.kie.ai/api/v1/chat/credit
  // Docs: https://docs.kie.ai
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
    elevenlabs: createElevenLabsProvider(
      baseURL,
      opts.apiKey,
      doFetch,
      timeout
    ),
    chat: createChatProvider(baseURL, opts.apiKey, doFetch, timeout),
    ...createClaudeProvider(baseURL, opts.apiKey, doFetch, timeout),
    modelInputSchemas,
    post: {
      api: {
        v1: {
          jobs: {
            createTask: Object.assign(createTask, {
              schema: CreateTaskRequestSchema,
            }),
          },
          common: {
            downloadUrl: Object.assign(downloadUrl, {
              schema: DownloadUrlRequestSchema,
            }),
          },
        },
        fileStreamUpload: Object.assign(fileStreamUpload, {
          schema: UploadMediaRequestSchema,
        }),
        fileUrlUpload: Object.assign(fileUrlUpload, {
          schema: FileUrlUploadRequestSchema,
        }),
        fileBase64Upload: Object.assign(fileBase64Upload, {
          schema: FileBase64UploadRequestSchema,
        }),
      },
    },
    get: {
      api: {
        v1: {
          jobs: { recordInfo },
          chat: { credit },
        },
      },
    },
  };
}

export async function submitMediaJob(
  provider: KieProvider,
  request: MediaGenerationRequest
): Promise<string> {
  const result = await provider.post.api.v1.jobs.createTask(request);
  if (!result.data?.taskId) {
    throw new KieError(
      `createTask failed: ${result.msg ?? "no taskId in response"}`,
      result.code
    );
  }
  return result.data.taskId;
}

export async function uploadFile(
  provider: KieProvider,
  file: Blob,
  filename: string,
  uploadPath: string = "uploads"
): Promise<string> {
  const result = await provider.post.api.fileStreamUpload({
    file,
    filename,
    uploadPath,
  });
  if (!result.data?.downloadUrl) {
    throw new KieError(
      `upload failed: no downloadUrl in response`,
      result.code
    );
  }
  return result.data.downloadUrl;
}

// Backward compatibility aliases
export const createTaskOrThrow = submitMediaJob;
export const uploadOrThrow = uploadFile;
