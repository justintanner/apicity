import { KieError } from "./types";
import { kieRequest } from "./request";

export type SunoModel = "V4" | "V4_5" | "V4_5PLUS" | "V4_5ALL" | "V5";

export interface SunoGenerateRequest {
  prompt: string;
  style?: string;
  instrumental?: boolean;
  model?: SunoModel;
  customMode?: boolean;
  negativeTags?: string;
  title?: string;
}

export interface SunoProvider {
  generate(req: SunoGenerateRequest): Promise<{ taskId: string }>;
  createTask(req: SunoGenerateRequest): Promise<{ taskId: string }>;
}

interface SunoSubmitResponse {
  code: number;
  msg?: string;
  data?: {
    taskId?: string;
  };
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
  ): Promise<{ taskId: string }> {
    const body: Record<string, unknown> = {
      prompt: req.prompt,
      model: req.model ?? "V4_5",
      instrumental: req.instrumental ?? true,
      customMode: req.customMode ?? true,
    };
    if (req.style !== undefined) body.style = req.style;
    if (req.negativeTags !== undefined) body.negativeTags = req.negativeTags;
    if (req.title !== undefined) body.title = req.title;

    const res = await kieRequest<SunoSubmitResponse>(
      `${baseURL}/api/v1/generate`,
      { method: "POST", body, ...requestOpts }
    );

    if (!res.data?.taskId) {
      throw new KieError("No taskId in Suno generate response", 500);
    }

    return { taskId: res.data.taskId };
  }

  return {
    generate: createTask,
    createTask,
  };
}
