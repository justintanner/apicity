export interface WorkflowAsyncConfig {
  pollUrl: string;
  pollMethod: "GET";
  completionField: string;
  completionValues: string[];
  failureValues: string[];
  progressField?: string;
  outputExtractors: Record<string, string>;
}

export interface WorkflowStepDefinition {
  name: string;
  description: string;
  apiProvider: "xai" | "kie";
  request: {
    method: "POST" | "GET";
    url: string;
    body?: Record<string, unknown>;
  };
  outputExtractors: Record<string, string>;
  async?: WorkflowAsyncConfig;
}

export interface WorkflowSetup {
  uploads?: Record<string, string>;
  fromWorkflows?: Record<
    string,
    { workflowId: string; stepIndex: number; outputKey: string }
  >;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  layout?: "sequential" | "compare";
  setup?: WorkflowSetup;
  steps: WorkflowStepDefinition[];
}

export interface StepState {
  status: "locked" | "ready" | "running" | "completed" | "failed";
  request?: { method: string; url: string; body: unknown };
  response?: { status: number; body: unknown };
  outputs?: Record<string, string>;
  error?: string;
  completedAt?: string;
}

export interface WorkflowState {
  [workflowId: string]: {
    steps: Record<string, StepState>;
    setupOutputs?: Record<string, string>;
  };
}

// --- Template resolution ---

export function resolveTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in vars))
      throw new Error(`Missing workflow variable: {{${key}}}`);
    return vars[key];
  });
}

export function resolveBody(
  body: unknown,
  vars: Record<string, string>
): unknown {
  if (typeof body === "string") return resolveTemplate(body, vars);
  if (Array.isArray(body)) return body.map((item) => resolveBody(item, vars));
  if (typeof body === "object" && body !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      result[k] = resolveBody(v, vars);
    }
    return result;
  }
  return body;
}

// --- Output extraction ---

export function extractByPath(obj: unknown, dotPath: string): string | null {
  const parts = dotPath.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current: unknown = obj;
  for (const part of parts) {
    // Auto-parse JSON strings so paths can traverse into encoded values
    // (e.g. KIE's resultJson field which is a JSON-encoded string)
    if (typeof current === "string") {
      try {
        current = JSON.parse(current);
      } catch {
        return null;
      }
    }
    if (current == null || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string"
    ? current
    : current != null
      ? String(current)
      : null;
}

export function extractOutputs(
  body: unknown,
  extractors: Record<string, string>
): Record<string, string> {
  const outputs: Record<string, string> = {};
  for (const [key, path] of Object.entries(extractors)) {
    const value = extractByPath(body, path);
    if (value) outputs[key] = value;
  }
  return outputs;
}

// --- Collect all outputs from completed preceding steps ---

export function collectVars(
  state: Record<string, StepState>,
  upToStep: number
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < upToStep; i++) {
    const step = state[String(i)];
    if (step?.outputs) Object.assign(vars, step.outputs);
  }
  return vars;
}

// --- API key lookup ---

export function getApiKey(provider: "xai" | "kie"): string | undefined {
  if (provider === "xai") return process.env.XAI_API_KEY;
  if (provider === "kie") return process.env.KIE_API_KEY;
  return undefined;
}

// --- Workflow definitions ---

const KIE_ASYNC: Omit<WorkflowAsyncConfig, "outputExtractors"> = {
  pollUrl: "https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{task_id}}",
  pollMethod: "GET",
  completionField: "data.state",
  completionValues: ["success"],
  failureValues: ["fail"],
  progressField: "data.progress",
};

export const workflows: WorkflowDefinition[] = [
  {
    id: "kie-motion-control-pipeline",
    name: "KIE: character motion-control pipeline",
    steps: [
      {
        name: "Generate character image",
        description:
          "Create a 9:16 character portrait with nano-banana-pro (1K)",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "nano-banana-pro",
            input: {
              prompt:
                "A young woman in a bright red hoodie and dark jeans, " +
                "standing upright facing the camera, full body visible " +
                "from head to feet, friendly expression, simple solid " +
                "light gray background, clean studio lighting, sharp " +
                "details, character design, portrait photography",
              aspect_ratio: "9:16",
              resolution: "1K",
              output_format: "png",
            },
          },
        },
        outputExtractors: { task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          outputExtractors: {
            character_image_url: "data.resultJson.resultUrls.0",
          },
        },
      },
      {
        name: "Panoramic character video",
        description:
          "360-degree panoramic orbit around the character (image-to-video)",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "grok-imagine/image-to-video",
            input: {
              prompt:
                "Slow 360-degree camera orbit around the character, " +
                "smooth cinematic rotation, the character remains still " +
                "while the camera circles them, studio lighting",
              image_urls: ["{{character_image_url}}"],
              mode: "normal",
              duration: "6",
              resolution: "480p",
            },
          },
        },
        outputExtractors: { panoramic_task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          pollUrl:
            "https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{panoramic_task_id}}",
          outputExtractors: {
            panoramic_video_url: "data.resultJson.resultUrls.0",
          },
        },
      },
      {
        name: "Motion reference video",
        description:
          "Generate a video of a regular man dancing (text-to-video)",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "grok-imagine/text-to-video",
            input: {
              prompt:
                "A regular man in casual clothes dancing energetically " +
                "in a studio with a plain white background, full body " +
                "visible, smooth movements, well-lit",
              duration: "6",
            },
          },
        },
        outputExtractors: { motion_task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          pollUrl:
            "https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{motion_task_id}}",
          outputExtractors: {
            motion_video_url: "data.resultJson.resultUrls.0",
          },
        },
      },
      {
        name: "Apply motion control",
        description:
          "Transfer dancing motion onto the character with kling-3.0/motion-control",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "kling-3.0/motion-control",
            input: {
              prompt: "The character is dancing energetically.",
              input_urls: ["{{character_image_url}}"],
              video_urls: ["{{motion_video_url}}"],
              mode: "720p",
              character_orientation: "video",
              background_source: "input_video",
            },
          },
        },
        outputExtractors: { final_task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          pollUrl:
            "https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{final_task_id}}",
          outputExtractors: {
            final_video_url: "data.resultJson.resultUrls.0",
          },
        },
      },
    ],
  },
  {
    id: "kie-t2i-compare",
    name: "KIE: text-to-image model comparison",
    layout: "compare",
    steps: [
      {
        name: "grok-imagine",
        description: "Grok Imagine text-to-image (16:9)",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "grok-imagine/text-to-image",
            input: {
              prompt:
                "A detailed movie set for a science fiction film, " +
                "practical props and set pieces, volumetric lighting, " +
                "1920x1080 cinematic widescreen, high detail photography",
              aspect_ratio: "16:9",
            },
          },
        },
        outputExtractors: { task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          outputExtractors: {
            image_url: "data.resultJson.resultUrls.0",
          },
        },
      },
      {
        name: "nano-banana-pro",
        description: "Nano Banana Pro (16:9, 2K, PNG)",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "nano-banana-pro",
            input: {
              prompt:
                "A detailed movie set for a science fiction film, " +
                "practical props and set pieces, volumetric lighting, " +
                "1920x1080 cinematic widescreen, high detail photography",
              aspect_ratio: "16:9",
              resolution: "2K",
              output_format: "png",
            },
          },
        },
        outputExtractors: { task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          outputExtractors: {
            image_url: "data.resultJson.resultUrls.0",
          },
        },
      },
      {
        name: "nano-banana-2",
        description: "Nano Banana 2 (16:9, 2K, PNG)",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "nano-banana-2",
            input: {
              prompt:
                "A detailed movie set for a science fiction film, " +
                "practical props and set pieces, volumetric lighting, " +
                "1920x1080 cinematic widescreen, high detail photography",
              aspect_ratio: "16:9",
              resolution: "2K",
              output_format: "png",
            },
          },
        },
        outputExtractors: { task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          outputExtractors: {
            image_url: "data.resultJson.resultUrls.0",
          },
        },
      },
      {
        name: "qwen2",
        description: "Qwen2 text-to-image (16:9)",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "qwen2/text-to-image",
            input: {
              prompt:
                "A detailed movie set for a science fiction film, " +
                "practical props and set pieces, volumetric lighting, " +
                "1920x1080 cinematic widescreen, high detail photography",
              image_size: "16:9",
            },
          },
        },
        outputExtractors: { task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          outputExtractors: {
            image_url: "data.resultJson.resultUrls.0",
          },
        },
      },
    ],
  },
];
