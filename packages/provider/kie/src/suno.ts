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
  callBackUrl: string;
  style?: string;
  negativeTags?: string;
  title?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export interface SunoExtendRequest {
  defaultParamFlag: boolean;
  audioId: string;
  prompt: string;
  model: SunoModel;
  callBackUrl: string;
  style?: string;
  title?: string;
  continueAt?: number;
  negativeTags?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export type SunoTaskStatus =
  | "PENDING"
  | "TEXT_SUCCESS"
  | "FIRST_SUCCESS"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_AUDIO_FAILED"
  | "CALLBACK_EXCEPTION"
  | "SENSITIVE_WORD_ERROR";

export type SunoOperationType =
  | "generate"
  | "extend"
  | "upload_cover"
  | "upload_extend";

export interface SunoTrack {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number;
}

export interface SunoRecordInfoResponse {
  code: number;
  msg?: string;
  // Kie returns `data: null` (not a 4xx) when the taskId doesn't exist.
  data?: {
    taskId: string;
    parentMusicId?: string;
    param?: string;
    response?: {
      taskId: string;
      sunoData?: SunoTrack[];
    };
    status?: SunoTaskStatus;
    type?: "chirp-v3-5" | "chirp-v4";
    operationType?: SunoOperationType;
    errorCode?: number | null;
    errorMessage?: string | null;
  } | null;
}

export interface SunoWavRequest {
  taskId: string;
  audioId: string;
  callBackUrl: string;
}

export interface SunoVocalRemovalRequest {
  taskId: string;
  audioId: string;
  callBackUrl: string;
  type?: "separate_vocal" | "split_stem";
}

export interface SunoMp4Request {
  taskId: string;
  audioId: string;
  callBackUrl: string;
  author?: string;
  domainName?: string;
}

export interface SunoLyricsRequest {
  prompt: string;
  callBackUrl: string;
}

export interface SunoBoostStyleRequest {
  content: string;
}

export interface SunoUploadCoverRequest {
  uploadUrl: string;
  prompt: string;
  customMode: boolean;
  instrumental: boolean;
  model: SunoModel;
  callBackUrl: string;
  style?: string;
  title?: string;
  negativeTags?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export interface SunoUploadExtendRequest {
  uploadUrl: string;
  defaultParamFlag: boolean;
  instrumental: boolean;
  continueAt: number;
  model: SunoModel;
  callBackUrl: string;
  prompt?: string;
  style?: string;
  title?: string;
  negativeTags?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  personaId?: string;
}

export interface SunoMidiRequest {
  taskId: string;
  callBackUrl: string;
  audioId?: string;
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
const SunoExtendRequestSchema = z.object({
  defaultParamFlag: z.boolean(),
  audioId: z.string().min(1),
  prompt: z.string().min(1),
  model: z.enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"]),
  callBackUrl: z.string().min(1),
  style: z.string().optional(),
  title: z.string().optional(),
  continueAt: z.number().optional(),
  negativeTags: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
  personaId: z.string().optional(),
});

const SunoWavRequestSchema = z.object({
  taskId: z.string().min(1),
  audioId: z.string().min(1),
  callBackUrl: z.string().min(1),
});

const SunoVocalRemovalRequestSchema = z.object({
  taskId: z.string().min(1),
  audioId: z.string().min(1),
  callBackUrl: z.string().min(1),
  type: z.enum(["separate_vocal", "split_stem"]).optional(),
});

const SunoMp4RequestSchema = z.object({
  taskId: z.string().min(1),
  audioId: z.string().min(1),
  callBackUrl: z.string().min(1),
  author: z.string().max(50).optional(),
  domainName: z.string().max(50).optional(),
});

const SunoLyricsRequestSchema = z.object({
  prompt: z.string().min(1).max(200),
  callBackUrl: z.string().min(1),
});

const SunoBoostStyleRequestSchema = z.object({
  content: z.string().min(1),
});

const SunoUploadCoverRequestSchema = z.object({
  uploadUrl: z.string().min(1),
  prompt: z.string().min(1),
  customMode: z.boolean(),
  instrumental: z.boolean(),
  model: z.enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"]),
  callBackUrl: z.string().min(1),
  style: z.string().optional(),
  title: z.string().optional(),
  negativeTags: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
  personaId: z.string().optional(),
});

const SunoUploadExtendRequestSchema = z.object({
  uploadUrl: z.string().min(1),
  defaultParamFlag: z.boolean(),
  instrumental: z.boolean(),
  continueAt: z.number(),
  model: z.enum(["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"]),
  callBackUrl: z.string().min(1),
  prompt: z.string().optional(),
  style: z.string().optional(),
  title: z.string().optional(),
  negativeTags: z.string().optional(),
  vocalGender: z.enum(["m", "f"]).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
  personaId: z.string().optional(),
});

const SunoMidiRequestSchema = z.object({
  taskId: z.string().min(1),
  callBackUrl: z.string().min(1),
  audioId: z.string().optional(),
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
