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
    id: "grok-imagine-astronaut-cliff",
    name: "Grok Imagine: astronaut cliff",
    steps: [
      {
        name: "Generate image",
        description:
          "Establish the scene — astronaut at an alien cliff edge at sunset",
        apiProvider: "xai",
        request: {
          method: "POST",
          url: "https://api.x.ai/v1/images/generations",
          body: {
            model: "grok-imagine-image",
            prompt:
              "A lone astronaut in a white spacesuit standing at the edge " +
              "of a towering basalt cliff, overlooking a vast bioluminescent " +
              "alien ocean at sunset. Two pale moons hang low on the horizon, " +
              "casting long purple shadows across the rock. Cinematic wide " +
              "shot, 4K, sci-fi concept art style.",
            n: 1,
            response_format: "url",
          },
        },
        outputExtractors: { image_url: "data[0].url" },
      },
      {
        name: "Image to video",
        description: "Animate the scene — astronaut approaches the cliff edge",
        apiProvider: "xai",
        request: {
          method: "POST",
          url: "https://api.x.ai/v1/videos/generations",
          body: {
            model: "grok-imagine-video",
            prompt:
              "The astronaut takes a cautious step toward the cliff edge " +
              "and looks down. Bioluminescent waves crash against the rocks " +
              "far below, sending up faint glowing spray. The two moons " +
              "drift higher, their light intensifying. Camera slowly pushes " +
              "in toward the astronaut from behind. Cinematic, slow motion.",
            image_url: "{{image_url}}",
          },
        },
        outputExtractors: { request_id: "request_id" },
        async: {
          pollUrl: "https://api.x.ai/v1/videos/{{request_id}}",
          pollMethod: "GET",
          completionField: "status",
          completionValues: ["done"],
          failureValues: ["failed", "expired"],
          progressField: "progress",
          outputExtractors: { video_url: "video.url" },
        },
      },
      {
        name: "Extend video",
        description: "The leap — astronaut jumps off the cliff with a jetpack",
        apiProvider: "xai",
        request: {
          method: "POST",
          url: "https://api.x.ai/v1/videos/generations",
          body: {
            model: "grok-imagine-video",
            prompt:
              "The astronaut crouches and leaps off the cliff into the void. " +
              "A jetpack ignites with a bright blue flame and the astronaut " +
              "soars out over the glowing ocean, banking left between the " +
              "two moons. The bioluminescent water below ripples in response " +
              "to the engine wash. Camera follows in a sweeping aerial " +
              "tracking shot. Cinematic, epic scale.",
            video_url: "{{video_url}}",
          },
        },
        outputExtractors: { request_id: "request_id" },
        async: {
          pollUrl: "https://api.x.ai/v1/videos/{{request_id}}",
          pollMethod: "GET",
          completionField: "status",
          completionValues: ["done"],
          failureValues: ["failed", "expired"],
          progressField: "progress",
          outputExtractors: { video_url: "video.url" },
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
  {
    id: "ref-character-compare",
    name: "Reference character: Grok Imagine (xAI) vs Kling 3.0 (KIE)",
    layout: "compare",
    setup: {
      uploads: {
        cat_url: "public/cat.png",
        background_url: "public/studio-bg.jpg",
      },
    },
    steps: [
      {
        name: "grok-imagine-video",
        description: "Grok Imagine video (xAI, reference images, 720p, 6s)",
        apiProvider: "xai",
        request: {
          method: "POST",
          url: "https://api.x.ai/v1/videos/generations",
          body: {
            model: "grok-imagine-video",
            prompt:
              "The orange tabby cat from <IMAGE_1> jumps onto a " +
              "monitor on the science fiction movie set from " +
              "<IMAGE_2>, fixed camera, cinematic lighting",
            reference_images: [
              { url: "{{cat_url}}" },
              { url: "{{background_url}}" },
            ],
            duration: 6,
            aspect_ratio: "16:9",
            resolution: "720p",
          },
        },
        outputExtractors: { request_id: "request_id" },
        async: {
          pollUrl: "https://api.x.ai/v1/videos/{{request_id}}",
          pollMethod: "GET",
          completionField: "status",
          completionValues: ["done"],
          failureValues: ["failed", "expired"],
          progressField: "progress",
          outputExtractors: { video_url: "video.url" },
        },
      },
      {
        name: "kling-3.0",
        description: "Kling 3.0 Video Pro (KIE, elements, 16:9, 5s)",
        apiProvider: "kie",
        request: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/jobs/createTask",
          body: {
            model: "kling-3.0/video",
            input: {
              prompt:
                "An orange cat jumps onto a monitor on a science " +
                "fiction movie set, fixed camera, " +
                "cinematic lighting@element_cat",
              image_urls: ["{{background_url}}"],
              kling_elements: [
                {
                  name: "element_cat",
                  description: "orange tabby cat",
                  element_input_urls: ["{{cat_url}}", "{{cat_url}}"],
                },
              ],
              mode: "pro",
              duration: "3",
              aspect_ratio: "16:9",
              sound: false,
              multi_shots: false,
              multi_prompt: [],
            },
          },
        },
        outputExtractors: { task_id: "data.taskId" },
        async: {
          ...KIE_ASYNC,
          outputExtractors: {
            video_url: "data.resultJson.resultUrls.0",
          },
        },
      },
    ],
  },
];
