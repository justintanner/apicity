import {
  MediaGenerationRequest,
  TaskResponse,
  KieOptions,
  KieProvider,
  KieError,
  KieCreditsResponse,
  KieApiEnvelope,
  DownloadUrlRequest,
  DownloadUrlResponse,
  UploadMediaRequest,
  UploadMediaResponse,
  FileUrlUploadRequest,
  FileBase64UploadRequest,
  KieTaskInfo,
  Gpt4oImageRecordInfo,
  MjRecordInfoResponse,
  GeminiOmniAudioCreateRequest,
  GeminiOmniAudioCreateResponse,
  GeminiOmniCharacterCreateRequest,
  GeminiOmniCharacterCreateResponse,
  FluxKontextGenerateRequest,
  Gpt4oImageGenerateRequest,
  MjGenerateRequest,
  RunwayGenerateRequest,
  RunwayExtendRequest,
  RunwayRecordDetail,
} from "./types";
import type { FluxKontextRecordInfoResponse } from "./zod";
import {
  CreateTaskRequestSchema,
  DownloadUrlRequestSchema,
  UploadMediaRequestSchema,
  FileUrlUploadRequestSchema,
  FileBase64UploadRequestSchema,
  GeminiOmniVideoRequestSchema,
  GeminiOmniAudioCreateRequestSchema,
  GeminiOmniCharacterCreateRequestSchema,
  GeminiOmniCharacterCreateResponseSchema,
  FluxKontextGenerateRequestSchema,
  Gpt4oImageGenerateRequestSchema,
  MjGenerateRequestSchema,
  MjRecordInfoRequestSchema,
  MjRecordInfoResponseSchema,
  RunwayGenerateRequestSchema,
  RunwayExtendRequestSchema,
  RunwayRecordDetailResponseSchema,
  FluxKontextRecordInfoRequestSchema,
  FluxKontextRecordInfoResponseSchema,
  GrokImageToVideoRequestSchema,
  RecordInfoRequestSchema,
  Gpt4oImageRecordInfoResponseSchema,
  Seedance2MiniRecordInfoResponseSchema,
  Seedance2MiniRequestSchema,
  PixverseV6TextToVideoRequestSchema,
} from "./zod";
import { modelInputSchemas } from "./model-schemas";
import { createVeoProvider } from "./veo";
import { createSunoProvider } from "./suno";
import { createChatProvider } from "./chat";
import { createClaudeProvider } from "./claude";
import { createGeminiProvider } from "./gemini";
import { createResponsesProvider } from "./responses";
import { createGemini31ProProvider } from "./gemini-31-pro";
import { attachExamples } from "./example";
import { createReplayStore } from "./paygate";
import { withPaidGate } from "./with-paid-gate";
import { createKieTransport, kieRequest } from "./request";

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

function validateGrokImageToVideoRequest(req: MediaGenerationRequest): void {
  if (req.model !== "grok-imagine/image-to-video") {
    return;
  }

  const parsed = GrokImageToVideoRequestSchema.safeParse(req);
  if (parsed.success) {
    return;
  }

  const message = parsed.error.issues
    .map((issue) => {
      const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");

  throw new KieError(`Invalid Kie createTask request: ${message}`, 400, {
    issues: parsed.error.issues,
  });
}

function validateSeedance2MiniRequest(req: MediaGenerationRequest): void {
  if (req.model !== "bytedance/seedance-2-mini") {
    return;
  }

  const parsed = Seedance2MiniRequestSchema.safeParse(req);
  if (parsed.success) {
    return;
  }

  const message = parsed.error.issues
    .map((issue) => {
      const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");

  throw new KieError(`Invalid Kie createTask request: ${message}`, 400, {
    issues: parsed.error.issues,
  });
}

function validateGeminiOmniVideoRequest(req: MediaGenerationRequest): void {
  if (req.model !== "gemini-omni-video") {
    return;
  }

  const parsed = GeminiOmniVideoRequestSchema.safeParse(req);
  if (parsed.success) {
    return;
  }

  const message = parsed.error.issues
    .map((issue) => {
      const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");

  throw new KieError(`Invalid Kie createTask request: ${message}`, 400, {
    issues: parsed.error.issues,
  });
}

function validatePixverseV6TextToVideoRequest(
  req: MediaGenerationRequest
): void {
  if (req.model !== "pixverse-v6/text-to-video") {
    return;
  }

  const parsed = PixverseV6TextToVideoRequestSchema.safeParse(req);
  if (parsed.success) {
    return;
  }

  const message = parsed.error.issues
    .map((issue) => {
      const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");

  throw new KieError(`Invalid Kie createTask request: ${message}`, 400, {
    issues: parsed.error.issues,
  });
}

function inferMimeType(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? MIME_TYPES[ext] : undefined;
}

export function createKie(opts: KieOptions): KieProvider {
  const baseURL = opts.baseURL ?? "https://api.kie.ai";
  const uploadBaseURL = opts.uploadBaseURL ?? "https://kieai.redpandaai.co";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const transport = createKieTransport({
    baseURL,
    apiKey: opts.apiKey,
    doFetch,
    timeout,
    requestFailedPrefix: "Kie request failed",
  });
  const uploadTransport = createKieTransport({
    baseURL: uploadBaseURL,
    apiKey: opts.apiKey,
    doFetch,
    timeout,
    errorPrefix: "Kie upload error",
    requestFailedPrefix: "Kie upload failed",
    jsonContentType: false,
  });
  const paygate = opts.paygate
    ? {
        ...opts.paygate,
        replayStore: opts.paygate.replayStore ?? createReplayStore(),
      }
    : undefined;
  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai/market/quickstart
  async function createTask(
    req: MediaGenerationRequest
  ): Promise<TaskResponse> {
    validateGrokImageToVideoRequest(req);
    validateSeedance2MiniRequest(req);
    validateGeminiOmniVideoRequest(req);
    validatePixverseV6TextToVideoRequest(req);

    return await transport.postJson<TaskResponse>(
      "/api/v1/jobs/createTask",
      req
    );
  }

  // GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}
  // Docs: https://docs.kie.ai/market/common/get-task-detail
  async function recordInfo(taskId: string): Promise<KieTaskInfo> {
    return await transport.getJson<KieTaskInfo>(
      `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // GET https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/4o-image-api/get-4-o-image-details
  async function gpt4oImageRecordInfo(
    taskId: string
  ): Promise<Gpt4oImageRecordInfo> {
    return await transport.getJson<Gpt4oImageRecordInfo>(
      `/api/v1/gpt4o-image/record-info?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // POST https://kieai.redpandaai.co/api/file-stream-upload
  // Docs: https://docs.kie.ai/file-upload-api/upload-file-stream
  async function fileStreamUpload(
    req: UploadMediaRequest
  ): Promise<UploadMediaResponse> {
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

    return await uploadTransport.postForm<UploadMediaResponse>(
      "/api/file-stream-upload",
      formData
    );
  }

  // POST https://kieai.redpandaai.co/api/file-url-upload
  // Docs: https://docs.kie.ai/file-upload-api/upload-file-url
  async function fileUrlUpload(
    req: FileUrlUploadRequest
  ): Promise<UploadMediaResponse> {
    return await uploadTransport.postJson<UploadMediaResponse>(
      "/api/file-url-upload",
      {
        fileUrl: req.fileUrl,
        uploadPath: req.uploadPath,
        ...(req.fileName ? { fileName: req.fileName } : {}),
      }
    );
  }

  // POST https://kieai.redpandaai.co/api/file-base64-upload
  // Docs: https://docs.kie.ai/file-upload-api/upload-file-base-64
  async function fileBase64Upload(
    req: FileBase64UploadRequest
  ): Promise<UploadMediaResponse> {
    return await uploadTransport.postJson<UploadMediaResponse>(
      "/api/file-base64-upload",
      {
        base64Data: req.base64Data,
        uploadPath: req.uploadPath,
        ...(req.fileName ? { fileName: req.fileName } : {}),
        ...(req.mimeType ? { mimeType: req.mimeType } : {}),
      }
    );
  }

  // POST https://api.kie.ai/api/v1/common/download-url
  // Docs: https://docs.kie.ai/common-api/download-url
  async function downloadUrl(
    req: DownloadUrlRequest
  ): Promise<DownloadUrlResponse> {
    return await transport.postJson<DownloadUrlResponse>(
      "/api/v1/common/download-url",
      req
    );
  }

  // POST https://api.kie.ai/api/v1/omni/audio/create
  // Docs: https://docs.kie.ai/market/gemini-omni-audio
  async function omniAudioCreate(
    req: GeminiOmniAudioCreateRequest
  ): Promise<GeminiOmniAudioCreateResponse> {
    const response = await kieRequest<
      KieApiEnvelope<{
        audioId?: string;
        kieAudioId?: string;
        name: string;
      }>
    >(transport, {
      method: "POST",
      path: "/api/v1/omni/audio/create",
      body: req,
    });

    if (!response.data) {
      return response as GeminiOmniAudioCreateResponse;
    }

    const id = response.data.audioId ?? response.data.kieAudioId;

    if (!id) {
      return response as GeminiOmniAudioCreateResponse;
    }

    return {
      ...response,
      data: {
        ...response.data,
        audioId: response.data.audioId ?? id,
        kieAudioId: response.data.kieAudioId ?? id,
      },
    };
  }

  // POST https://api.kie.ai/api/v1/omni/character/create
  // Docs: https://docs.kie.ai/market/gemini-omni-character
  async function omniCharacterCreate(
    req: GeminiOmniCharacterCreateRequest
  ): Promise<GeminiOmniCharacterCreateResponse> {
    return kieRequest<GeminiOmniCharacterCreateResponse>(transport, {
      method: "POST",
      path: "/api/v1/omni/character/create",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/flux/kontext/generate
  // Docs: https://docs.kie.ai/flux-kontext-api/generate-or-edit-image
  async function fluxKontextGenerate(
    req: FluxKontextGenerateRequest
  ): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/flux/kontext/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/gpt4o-image/generate
  // Docs: https://docs.kie.ai/4o-image-api/generate-4-o-image
  async function gpt4oImageGenerate(
    req: Gpt4oImageGenerateRequest
  ): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/gpt4o-image/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/mj/generate
  // Docs: https://docs.kie.ai/mj-api/generate-mj-image
  async function mjGenerate(req: MjGenerateRequest): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/mj/generate",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/mj/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/mj-api/get-mj-task-details
  async function mjRecordInfo(taskId: string): Promise<MjRecordInfoResponse> {
    return kieRequest<MjRecordInfoResponse>(
      `${baseURL}/api/v1/mj/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        apiKey: opts.apiKey,
        doFetch,
        timeout,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/runway/generate
  // Docs: https://docs.kie.ai/runway-api/generate-ai-video
  async function runwayGenerate(
    req: RunwayGenerateRequest
  ): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/runway/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/runway/extend
  // Docs: https://docs.kie.ai/runway-api/extend-ai-video
  async function runwayExtend(req: RunwayExtendRequest): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/runway/extend",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/runway/record-detail?taskId={taskId}
  // Docs: https://docs.kie.ai/runway-api/get-ai-video-details
  async function runwayRecordDetail(
    taskId: string
  ): Promise<RunwayRecordDetail> {
    return await transport.getJson<RunwayRecordDetail>(
      `/api/v1/runway/record-detail?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // GET https://api.kie.ai/api/v1/flux/kontext/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/flux-kontext-api/get-image-details
  async function fluxKontextRecordInfo(
    taskId: string
  ): Promise<FluxKontextRecordInfoResponse> {
    return await transport.getJson<FluxKontextRecordInfoResponse>(
      `/api/v1/flux/kontext/record-info?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // GET https://api.kie.ai/api/v1/chat/credit
  // Docs: https://docs.kie.ai/common-api/get-account-credits
  async function credit(): Promise<KieCreditsResponse> {
    try {
      return await transport.getJson<KieCreditsResponse>("/api/v1/chat/credit");
    } catch (error) {
      if (error instanceof KieError) {
        throw new KieError(
          `Failed to get credits: ${error.status}`,
          error.status,
          error.body,
          error.code
        );
      }
      throw error;
    }
  }

  return attachExamples(
    withPaidGate(
      "kie",
      {
        veo: withPaidGate(
          "kie",
          createVeoProvider(baseURL, opts.apiKey, doFetch, timeout),
          { config: paygate }
        ),
        suno: createSunoProvider(baseURL, opts.apiKey, doFetch, timeout),
        chat: createChatProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createClaudeProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGeminiProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGemini31ProProvider(baseURL, opts.apiKey, doFetch, timeout),
        modelInputSchemas,
        post: {
          ...createResponsesProvider(baseURL, opts.apiKey, doFetch, timeout),
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
              omni: {
                audio: {
                  create: Object.assign(omniAudioCreate, {
                    schema: GeminiOmniAudioCreateRequestSchema,
                  }),
                },
                character: {
                  create: Object.assign(omniCharacterCreate, {
                    schema: GeminiOmniCharacterCreateRequestSchema,
                    responseSchema: GeminiOmniCharacterCreateResponseSchema,
                  }),
                },
              },
              flux: {
                kontext: {
                  generate: Object.assign(fluxKontextGenerate, {
                    schema: FluxKontextGenerateRequestSchema,
                  }),
                },
              },
              gpt4oImage: {
                generate: Object.assign(gpt4oImageGenerate, {
                  schema: Gpt4oImageGenerateRequestSchema,
                }),
              },
              mj: {
                generate: Object.assign(mjGenerate, {
                  schema: MjGenerateRequestSchema,
                }),
              },
              runway: {
                generate: Object.assign(runwayGenerate, {
                  schema: RunwayGenerateRequestSchema,
                }),
                extend: Object.assign(runwayExtend, {
                  schema: RunwayExtendRequestSchema,
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
              jobs: {
                recordInfo: Object.assign(recordInfo, {
                  schema: RecordInfoRequestSchema,
                  seedance2MiniResponseSchema:
                    Seedance2MiniRecordInfoResponseSchema,
                }),
              },
              gpt4oImage: {
                recordInfo: Object.assign(gpt4oImageRecordInfo, {
                  schema: RecordInfoRequestSchema,
                  responseSchema: Gpt4oImageRecordInfoResponseSchema,
                }),
              },
              mj: {
                recordInfo: Object.assign(mjRecordInfo, {
                  schema: MjRecordInfoRequestSchema,
                  responseSchema: MjRecordInfoResponseSchema,
                }),
              },
              runway: {
                recordDetail: Object.assign(runwayRecordDetail, {
                  schema: RecordInfoRequestSchema,
                  responseSchema: RunwayRecordDetailResponseSchema,
                }),
              },
              flux: {
                kontext: {
                  recordInfo: Object.assign(fluxKontextRecordInfo, {
                    schema: FluxKontextRecordInfoRequestSchema,
                    responseSchema: FluxKontextRecordInfoResponseSchema,
                  }),
                },
              },
              chat: { credit },
            },
          },
        },
      },
      { config: paygate }
    )
  );
}

export async function submitMediaJob(
  provider: KieProvider,
  request: MediaGenerationRequest,
  approval?: import("./types").KieApproval
): Promise<string> {
  const result = await provider.post.api.v1.jobs.createTask(request, approval);
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
