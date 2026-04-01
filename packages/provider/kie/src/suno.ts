import { kieRequest } from "./request";
import type { PayloadSchema, ValidationResult } from "./types";
import { sunoGenerateSchema } from "./schemas";
import { validatePayload } from "./validate";

export type SunoModel = "V4" | "V4_5" | "V4_5PLUS" | "V4_5ALL" | "V5";

export interface SunoGenerateRequest {
  prompt: string;
  model: SunoModel;
  instrumental: boolean;
  customMode: boolean;
  style?: string;
  negativeTags?: string;
  title?: string;
}

interface SunoSubmitResponse {
  code: number;
  msg?: string;
  data?: {
    taskId?: string;
  };
}

interface SunoGenerateMethod {
  (req: SunoGenerateRequest): Promise<SunoSubmitResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

interface SunoV1Namespace {
  generate: SunoGenerateMethod;
}

interface SunoPostApiNamespace {
  v1: SunoV1Namespace;
}

export interface SunoProvider {
  post: { api: SunoPostApiNamespace };
}

export function createSunoProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): SunoProvider {
  const requestOpts = { apiKey, doFetch, timeout };

  async function createTask(
    req: SunoGenerateRequest
  ): Promise<SunoSubmitResponse> {
    return kieRequest<SunoSubmitResponse>(`${baseURL}/api/v1/generate`, {
      method: "POST",
      body: req,
      ...requestOpts,
    });
  }

  return {
    post: {
      api: {
        v1: {
          generate: Object.assign(createTask, {
            payloadSchema: sunoGenerateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, sunoGenerateSchema);
            },
          }),
        },
      },
    },
  };
}
