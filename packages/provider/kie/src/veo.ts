import { kieRequest } from "./request";
import { VeoGenerateRequestSchema, VeoExtendRequestSchema } from "./zod";
import type { z } from "zod";

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

interface VeoSubmitResponse {
  code: number;
  data?: {
    taskId?: string;
  };
}

interface VeoGenerateMethod {
  (req: VeoGenerateRequest): Promise<VeoSubmitResponse>;
  schema: z.ZodType<VeoGenerateRequest>;
}

interface VeoExtendMethod {
  (req: VeoExtendRequest): Promise<VeoSubmitResponse>;
  schema: z.ZodType<VeoExtendRequest>;
}

interface VeoVeoNamespace {
  generate: VeoGenerateMethod;
  extend: VeoExtendMethod;
}

interface VeoV1Namespace {
  veo: VeoVeoNamespace;
}

interface VeoPostApiNamespace {
  v1: VeoV1Namespace;
}

export interface VeoProvider {
  post: { api: VeoPostApiNamespace };
}

export function createVeoProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): VeoProvider {
  const requestOpts = { apiKey, doFetch, timeout };

  // POST https://api.kie.ai/api/v1/veo/generate
  // Docs: https://docs.kie.ai
  async function submitGenerate(
    req: VeoGenerateRequest
  ): Promise<VeoSubmitResponse> {
    return kieRequest<VeoSubmitResponse>(`${baseURL}/api/v1/veo/generate`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  // POST https://api.kie.ai/api/v1/veo/extend
  // Docs: https://docs.kie.ai
  async function submitExtend(
    req: VeoExtendRequest
  ): Promise<VeoSubmitResponse> {
    return kieRequest<VeoSubmitResponse>(`${baseURL}/api/v1/veo/extend`, {
      method: "POST",
      body: req,
      ...requestOpts,
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
  };
}
