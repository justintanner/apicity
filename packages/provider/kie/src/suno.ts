import { kieRequest } from "./request";
import { SunoGenerateRequestSchema } from "./zod";
import type { z } from "zod";

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
  schema: z.ZodType<SunoGenerateRequest>;
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

  return {
    post: {
      api: {
        v1: {
          generate: Object.assign(createTask, {
            schema: SunoGenerateRequestSchema,
          }),
        },
      },
    },
  };
}
