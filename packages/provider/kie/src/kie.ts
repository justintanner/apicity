import {
  MediaGenerationRequest,
  TaskResponse,
  TaskStatusDetails,
  TaskResult,
  WaitOptions,
  KieOptions,
  KieProvider,
  MediaType,
  KieError,
  KieCreditsResponse,
} from "./types";
import { TaskPoller } from "./polling";

interface KieApiResponse {
  code: number;
  msg: string;
  data?: {
    taskId?: string;
    [key: string]: unknown;
  };
}

// Supported models configuration
const SUPPORTED_MODELS: Record<
  string,
  { type: MediaType; supported: boolean }
> = {
  "kling-3.0/video": { type: "video", supported: true },
  "grok-imagine/text-to-image": { type: "image", supported: true },
  "grok-imagine/image-to-image": { type: "image", supported: true },
  "grok-imagine/text-to-video": { type: "video", supported: true },
  "grok-imagine/image-to-video": { type: "video", supported: true },
  "nano-banana-pro": { type: "image", supported: true },
};

export function kie(opts: KieOptions): KieProvider {
  const baseURL = opts.baseURL ?? "https://api.kei.ai";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const poller = new TaskPoller(baseURL, opts.apiKey, doFetch);

  return {
    async createTask(req: MediaGenerationRequest): Promise<TaskResponse> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        if (!this.validateModel(req.model)) {
          throw new KieError(`Unsupported model: ${req.model}`, 400);
        }

        const res = await doFetch(`${baseURL}/api/v1/jobs/createTask`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let message = `Kie API error: ${res.status}`;
          try {
            const errorData: unknown = await res.json();
            if (
              typeof errorData === "object" &&
              errorData !== null &&
              "msg" in errorData &&
              typeof (errorData as { msg?: string }).msg === "string"
            ) {
              message = `Kie API error ${res.status}: ${(errorData as { msg: string }).msg}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new KieError(message, res.status);
        }

        const data: KieApiResponse = await res.json();

        if (data.code !== 200 || !data.data?.taskId) {
          throw new KieError(data.msg || `API error: ${data.code}`, data.code);
        }

        return { taskId: data.data.taskId };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof KieError) throw error;
        throw new KieError(`Failed to create task: ${error}`, 500);
      }
    },

    async getTaskStatus(taskId: string): Promise<TaskStatusDetails> {
      return poller.getTaskStatus(taskId);
    },

    async waitForTask(
      taskId: string,
      options?: WaitOptions
    ): Promise<TaskResult> {
      return poller.waitForTask(taskId, options);
    },

    async generate(
      req: MediaGenerationRequest,
      options?: WaitOptions
    ): Promise<TaskResult> {
      const { taskId } = await this.createTask(req);
      return this.waitForTask(taskId, options);
    },

    validateModel(modelId: string): boolean {
      return SUPPORTED_MODELS[modelId]?.supported === true;
    },

    getModels(): string[] {
      return Object.keys(SUPPORTED_MODELS).filter(
        (model) => SUPPORTED_MODELS[model].supported
      );
    },

    getModelType(modelId: string): MediaType | null {
      return SUPPORTED_MODELS[modelId]?.type || null;
    },

    async getCredits(): Promise<KieCreditsResponse> {
      const res = await doFetch(`${baseURL}/api/v1/chat/credit`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new KieError(`Failed to get credits: ${res.status}`, res.status);
      }

      interface CreditsApiResponse {
        code: number;
        msg: string;
        data?: number;
      }

      const response: CreditsApiResponse = await res.json();

      if (response.code !== 200 || response.data === undefined) {
        throw new KieError(
          response.msg || `API error: ${response.code}`,
          response.code
        );
      }

      return {
        balance: response.data,
        totalUsed: 0,
        currency: "credits",
      };
    },
  };
}
