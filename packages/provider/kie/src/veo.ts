import { kieRequest } from "./request";
import type { PayloadSchema, ValidationResult } from "./types";
import { veoGenerateSchema, veoExtendSchema } from "./schemas";
import { validatePayload } from "./validate";

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
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface VeoExtendMethod {
  (req: VeoExtendRequest): Promise<VeoSubmitResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

  async function submitGenerate(
    req: VeoGenerateRequest
  ): Promise<VeoSubmitResponse> {
    return kieRequest<VeoSubmitResponse>(`${baseURL}/api/v1/veo/generate`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

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
              payloadSchema: veoGenerateSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, veoGenerateSchema);
              },
            }),
            extend: Object.assign(submitExtend, {
              payloadSchema: veoExtendSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, veoExtendSchema);
              },
            }),
          },
        },
      },
    },
  };
}
