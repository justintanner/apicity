import { createKieTransport, kieRequest } from "./request";
import {
  VeoGenerateRequestSchema,
  VeoExtendRequestSchema,
  VeoGet1080pVideoRequestSchema,
  VeoGet1080pVideoResponseSchema,
  VeoRecordInfoRequestSchema,
  VeoRecordInfoResponseSchema,
} from "./zod";
import type { PayGateApproval } from "./paygate";
import type { ApicitySchema } from "./types";

export type VeoModel = "veo3" | "veo3_fast";

export type VeoGenerationType =
  | "TEXT_2_VIDEO"
  | "REFERENCE_2_VIDEO"
  | "FIRST_AND_LAST_FRAMES_2_VIDEO";

export interface VeoGenerateRequest {
  prompt: string;
  model?: VeoModel;
  aspectRatio?: "16:9" | "9:16" | "Auto";
  generationType?: VeoGenerationType;
  imageUrls?: string[];
  seeds?: number;
  watermark?: string;
  enableTranslation?: boolean;
}

export interface VeoExtendRequest {
  taskId: string;
  prompt: string;
  model?: "fast" | "quality";
  seeds?: number;
  watermark?: string;
}

export interface VeoGet1080pVideoRequest {
  taskId: string;
  index?: number;
}

export interface VeoRecordInfoRequest {
  taskId: string;
}

export interface VeoRecordInfoResult {
  taskId?: string;
  resultUrls?: string[];
  originUrls?: string[];
  fullResultUrls?: string[];
  resolution?: string;
  mediaIds?: string[];
  [key: string]: unknown;
}

export interface VeoRecordInfoData {
  taskId: string;
  paramJson?: string;
  completeTime?: string | null;
  response?: VeoRecordInfoResult | null;
  successFlag: 0 | 1 | 2 | 3;
  errorCode?: number | string | null;
  errorMessage?: string | null;
  createTime?: string;
  fallbackFlag?: boolean;
}

interface VeoSubmitResponse {
  code: number;
  data?: {
    taskId?: string;
  };
}

export interface VeoRecordInfoResponse {
  code: number;
  msg: string;
  data?: VeoRecordInfoData | null;
}

export interface VeoGet1080pVideoResponse {
  code: number;
  msg?: string;
  data?: {
    resultUrl: string;
  } | null;
}

interface VeoGenerateMethod {
  (
    req: VeoGenerateRequest,
    approval?: PayGateApproval
  ): Promise<VeoSubmitResponse>;
  schema: ApicitySchema<VeoGenerateRequest>;
}

interface VeoExtendMethod {
  (
    req: VeoExtendRequest,
    approval?: PayGateApproval
  ): Promise<VeoSubmitResponse>;
  schema: ApicitySchema<VeoExtendRequest>;
}

interface VeoRecordInfoMethod {
  (taskId: string): Promise<VeoRecordInfoResponse>;
  schema: ApicitySchema<VeoRecordInfoRequest>;
  responseSchema: ApicitySchema<VeoRecordInfoResponse>;
}

interface VeoGet1080pVideoMethod {
  (
    req: VeoGet1080pVideoRequest,
    approval?: PayGateApproval
  ): Promise<VeoGet1080pVideoResponse>;
  schema: ApicitySchema<VeoGet1080pVideoRequest>;
  responseSchema: ApicitySchema<VeoGet1080pVideoResponse>;
}

interface VeoVeoNamespace {
  generate: VeoGenerateMethod;
  extend: VeoExtendMethod;
}

interface VeoGetVeoNamespace {
  recordInfo: VeoRecordInfoMethod;
  get1080pVideo: VeoGet1080pVideoMethod;
}

interface VeoV1Namespace {
  veo: VeoVeoNamespace;
}

interface VeoPostApiNamespace {
  v1: VeoV1Namespace;
}

interface VeoGetV1Namespace {
  veo: VeoGetVeoNamespace;
}

interface VeoGetApiNamespace {
  v1: VeoGetV1Namespace;
}

export interface VeoProvider {
  post: { api: VeoPostApiNamespace };
  get: { api: VeoGetApiNamespace };
}

export function createVeoProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): VeoProvider {
  const transport = createKieTransport({
    baseURL,
    apiKey,
    doFetch,
    timeout,
    requestFailedPrefix: "Kie request failed",
  });

  // POST https://api.kie.ai/api/v1/veo/generate
  // Docs: https://docs.kie.ai/veo3-api/generate-veo-3-video
  async function submitGenerate(
    req: VeoGenerateRequest
  ): Promise<VeoSubmitResponse> {
    return kieRequest<VeoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/veo/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/veo/extend
  // Docs: https://docs.kie.ai/veo3-api/extend-video
  async function submitExtend(
    req: VeoExtendRequest
  ): Promise<VeoSubmitResponse> {
    return kieRequest<VeoSubmitResponse>(transport, {
      method: "POST",
      path: "/api/v1/veo/extend",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/veo/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/veo3-api/get-veo-3-video-details
  async function recordInfo(taskId: string): Promise<VeoRecordInfoResponse> {
    return kieRequest<VeoRecordInfoResponse>(transport, {
      method: "GET",
      path: `/api/v1/veo/record-info?taskId=${encodeURIComponent(taskId)}`,
    });
  }

  // GET https://api.kie.ai/api/v1/veo/get-1080p-video?taskId={taskId}
  // Docs: https://docs.kie.ai/veo3-api/get-veo-3-1080-p-video
  async function get1080pVideo(
    req: VeoGet1080pVideoRequest
  ): Promise<VeoGet1080pVideoResponse> {
    const taskId = encodeURIComponent(req.taskId);
    const index =
      req.index === undefined ? "" : `&index=${encodeURIComponent(req.index)}`;
    return kieRequest<VeoGet1080pVideoResponse>(transport, {
      method: "GET",
      path: `/api/v1/veo/get-1080p-video?taskId=${taskId}${index}`,
    });
  }

  return {
    post: {
      api: {
        v1: {
          veo: {
            generate: Object.assign(submitGenerate, {
              schema: VeoGenerateRequestSchema,
            }),
            extend: Object.assign(submitExtend, {
              schema: VeoExtendRequestSchema,
            }),
          },
        },
      },
    },
    get: {
      api: {
        v1: {
          veo: {
            recordInfo: Object.assign(recordInfo, {
              schema: VeoRecordInfoRequestSchema,
              responseSchema: VeoRecordInfoResponseSchema,
            }),
            get1080pVideo: Object.assign(get1080pVideo, {
              schema: VeoGet1080pVideoRequestSchema,
              responseSchema: VeoGet1080pVideoResponseSchema,
            }),
          },
        },
      },
    },
  };
}
