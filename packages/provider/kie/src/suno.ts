import { kieRequest } from "./request";
import { SunoGenerateRequestSchema } from "./zod";
import { z } from "zod";
import type { ZodType } from "zod";

export type SunoModel =
  | "V3_5"
  | "V4"
  | "V4_5"
  | "V4_5PLUS"
  | "V4_5ALL"
  | "V5"
  | "V5_5";

export interface SunoGenerateRequest {
  prompt: string;
  model: SunoModel;
  instrumental: boolean;
  customMode: boolean;
  style?: string;
  negativeTags?: string;
  title?: string;
}

export interface SunoExtendRequest {
  taskId: string;
  prompt: string;
  model?: SunoModel;
  continueAt?: number;
  style?: string;
  title?: string;
}

export interface SunoRecordInfoResponse {
  code: number;
  msg?: string;
  data?: {
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
  };
}

export interface SunoWavRequest {
  audioId: string;
}

export interface SunoVocalRemovalRequest {
  audioId: string;
}

export interface SunoMp4Request {
  audioId: string;
}

export interface SunoLyricsRequest {
  prompt: string;
}

export interface SunoBoostStyleRequest {
  style: string;
  audioId?: string;
}

export interface SunoUploadCoverRequest {
  audioId: string;
  coverImageUrl: string;
}

export interface SunoUploadExtendRequest {
  audioId: string;
  extendAudioUrl: string;
}

export interface SunoMidiRequest {
  audioId: string;
}

interface SunoSubmitResponse {
  code: number;
  msg?: string;
  data?: {
    taskId?: string;
    audioId?: string;
  };
}

interface SunoGenerateCallable {
  (req: SunoGenerateRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoGenerateRequest>;
  extend: SunoExtendMethod;
  uploadCover: SunoUploadCoverMethod;
  uploadExtend: SunoUploadExtendMethod;
}

interface SunoExtendMethod {
  (req: SunoExtendRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoExtendRequest>;
}

interface SunoWavMethod {
  (req: SunoWavRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoWavRequest>;
}

interface SunoVocalRemovalMethod {
  (req: SunoVocalRemovalRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoVocalRemovalRequest>;
}

interface SunoMp4Method {
  (req: SunoMp4Request): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoMp4Request>;
}

interface SunoLyricsMethod {
  (req: SunoLyricsRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoLyricsRequest>;
}

interface SunoBoostStyleMethod {
  (req: SunoBoostStyleRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoBoostStyleRequest>;
}

interface SunoUploadCoverMethod {
  (req: SunoUploadCoverRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoUploadCoverRequest>;
}

interface SunoUploadExtendMethod {
  (req: SunoUploadExtendRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoUploadExtendRequest>;
}

interface SunoMidiMethod {
  (req: SunoMidiRequest): Promise<SunoSubmitResponse>;
  schema: ZodType<SunoMidiRequest>;
}

interface SunoWavNamespace {
  generate: SunoWavMethod;
}

interface SunoVocalRemovalNamespace {
  generate: SunoVocalRemovalMethod;
}

interface SunoMp4Namespace {
  generate: SunoMp4Method;
}

interface SunoStyleNamespace {
  generate: SunoBoostStyleMethod;
}

interface SunoMidiNamespace {
  generate: SunoMidiMethod;
}

interface SunoV1PostNamespace {
  generate: SunoGenerateCallable;
  wav: SunoWavNamespace;
  vocalRemoval: SunoVocalRemovalNamespace;
  mp4: SunoMp4Namespace;
  lyrics: SunoLyricsMethod;
  style: SunoStyleNamespace;
  midi: SunoMidiNamespace;
}

interface SunoV1GetNamespace {
  generate: {
    recordInfo: (taskId: string) => Promise<SunoRecordInfoResponse>;
  };
}

interface SunoPostApiNamespace {
  v1: SunoV1PostNamespace;
}

interface SunoGetApiNamespace {
  v1: SunoV1GetNamespace;
}

export interface SunoProvider {
  post: { api: SunoPostApiNamespace };
  get: { api: SunoGetApiNamespace };
}

// Zod schemas for new request types (hardcoded inline for simplicity)
const SunoExtendRequestSchema = SunoGenerateRequestSchema.omit({
  instrumental: true,
  customMode: true,
  negativeTags: true,
}).extend({
  taskId: z.string().min(1),
  continueAt: z.number().optional(),
});

const SunoWavRequestSchema = z.object({
  audioId: z.string().min(1),
});

const SunoVocalRemovalRequestSchema = z.object({
  audioId: z.string().min(1),
});

const SunoMp4RequestSchema = z.object({
  audioId: z.string().min(1),
});

const SunoLyricsRequestSchema = z.object({
  prompt: z.string().min(1),
});

const SunoBoostStyleRequestSchema = z.object({
  style: z.string().min(1),
  audioId: z.string().optional(),
});

const SunoUploadCoverRequestSchema = z.object({
  audioId: z.string().min(1),
  coverImageUrl: z.string().min(1),
});

const SunoUploadExtendRequestSchema = z.object({
  audioId: z.string().min(1),
  extendAudioUrl: z.string().min(1),
});

const SunoMidiRequestSchema = z.object({
  audioId: z.string().min(1),
});

export function createSunoProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): SunoProvider {
  const requestOpts = { apiKey, doFetch, timeout };

  // POST https://api.kie.ai/api/v1/generate
  // Docs: https://docs.kie.ai
  async function createTask(
    req: SunoGenerateRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(`${baseURL}/api/v1/generate`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/extend
  // Docs: https://docs.kie.ai
  async function extendTask(
    req: SunoExtendRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(`${baseURL}/api/v1/generate/extend`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  // GET https://api.kie.ai/api/v1/generate/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai
  async function recordInfo(taskId: string): Promise<SunoRecordInfoResponse> {
    return kieRequest<SunoRecordInfoResponse>(
      `${baseURL}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/wav/generate
  // Docs: https://docs.kie.ai
  async function wavGenerate(req: SunoWavRequest): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(`${baseURL}/api/v1/wav/generate`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  // POST https://api.kie.ai/api/v1/vocal-removal/generate
  // Docs: https://docs.kie.ai
  async function vocalRemovalGenerate(
    req: SunoVocalRemovalRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(
      `${baseURL}/api/v1/vocal-removal/generate`,
      {
        method: "POST",
        body: req,
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/mp4/generate
  // Docs: https://docs.kie.ai
  async function mp4Generate(req: SunoMp4Request): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(`${baseURL}/api/v1/mp4/generate`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  // POST https://api.kie.ai/api/v1/lyrics
  // Docs: https://docs.kie.ai
  async function lyricsGenerate(
    req: SunoLyricsRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(`${baseURL}/api/v1/lyrics`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  // POST https://api.kie.ai/api/v1/style/generate
  // Docs: https://docs.kie.ai
  async function boostStyle(
    req: SunoBoostStyleRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(`${baseURL}/api/v1/style/generate`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  // POST https://api.kie.ai/api/v1/generate/upload-cover
  // Docs: https://docs.kie.ai
  async function uploadCover(
    req: SunoUploadCoverRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(
      `${baseURL}/api/v1/generate/upload-cover`,
      {
        method: "POST",
        body: req,
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/generate/upload-extend
  // Docs: https://docs.kie.ai
  async function uploadExtend(
    req: SunoUploadExtendRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(
      `${baseURL}/api/v1/generate/upload-extend`,
      {
        method: "POST",
        body: req,
        ...requestOpts,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/midi/generate
  // Docs: https://docs.kie.ai
  async function midiGenerate(
    req: SunoMidiRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(`${baseURL}/api/v1/midi/generate`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  const extendMethod = Object.assign(extendTask, {
    schema: SunoExtendRequestSchema,
  });

  const generateCallable = Object.assign(createTask, {
    schema: SunoGenerateRequestSchema,
    extend: extendMethod,
    uploadCover: Object.assign(uploadCover, {
      schema: SunoUploadCoverRequestSchema,
    }),
    uploadExtend: Object.assign(uploadExtend, {
      schema: SunoUploadExtendRequestSchema,
    }),
  });

  return {
    post: {
      api: {
        v1: {
          generate: generateCallable,
          wav: {
            generate: Object.assign(wavGenerate, {
              schema: SunoWavRequestSchema,
            }),
          },
          vocalRemoval: {
            generate: Object.assign(vocalRemovalGenerate, {
              schema: SunoVocalRemovalRequestSchema,
            }),
          },
          mp4: {
            generate: Object.assign(mp4Generate, {
              schema: SunoMp4RequestSchema,
            }),
          },
          lyrics: Object.assign(lyricsGenerate, {
            schema: SunoLyricsRequestSchema,
          }),
          style: {
            generate: Object.assign(boostStyle, {
              schema: SunoBoostStyleRequestSchema,
            }),
          },
          midi: {
            generate: Object.assign(midiGenerate, {
              schema: SunoMidiRequestSchema,
            }),
          },
        },
      },
    },
    get: {
      api: {
        v1: {
          generate: {
            recordInfo,
          },
        },
      },
    },
  };
}
