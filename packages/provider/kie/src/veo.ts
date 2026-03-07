import { KieError } from "./types";
import { kieRequest } from "./request";

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

export interface VeoProvider {
  generate(req: VeoGenerateRequest): Promise<{ taskId: string }>;
  extend(req: VeoExtendRequest): Promise<{ taskId: string }>;
  createTask(req: VeoGenerateRequest): Promise<{ taskId: string }>;
}

interface VeoSubmitResponse {
  code: number;
  data?: {
    taskId?: string;
  };
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
  ): Promise<{ taskId: string }> {
    const body: Record<string, unknown> = { prompt: req.prompt };
    if (req.model) body.model = req.model;
    if (req.aspectRatio) body.aspectRatio = req.aspectRatio;
    if (req.generationType) body.generationType = req.generationType;
    if (req.imageUrls) body.imageUrls = req.imageUrls;
    if (req.seeds !== undefined) body.seeds = req.seeds;
    if (req.watermark) body.watermark = req.watermark;
    if (req.enableTranslation !== undefined)
      body.enableTranslation = req.enableTranslation;

    const res = await kieRequest<VeoSubmitResponse>(
      `${baseURL}/api/v1/veo/generate`,
      { method: "POST", body, ...requestOpts }
    );

    if (!res.data?.taskId) {
      throw new KieError("No taskId in Veo generate response", 500);
    }

    return { taskId: res.data.taskId };
  }

  async function submitExtend(
    req: VeoExtendRequest
  ): Promise<{ taskId: string }> {
    const body: Record<string, unknown> = {
      taskId: req.taskId,
      prompt: req.prompt,
    };
    if (req.model) body.model = req.model;
    if (req.seeds !== undefined) body.seeds = req.seeds;
    if (req.watermark) body.watermark = req.watermark;

    const res = await kieRequest<VeoSubmitResponse>(
      `${baseURL}/api/v1/veo/extend`,
      { method: "POST", body, ...requestOpts }
    );

    if (!res.data?.taskId) {
      throw new KieError("No taskId in Veo extend response", 500);
    }

    return { taskId: res.data.taskId };
  }

  return {
    generate: submitGenerate,
    extend: submitExtend,
    createTask: submitGenerate,
  };
}
