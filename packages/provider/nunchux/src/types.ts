import type {
  NunchuxAlibabaVideoSynthesisRequest,
  NunchuxAlibabaVideoSynthesisRequestSchema,
  NunchuxBytedanceGenerationTasksRequest,
  NunchuxBytedanceGenerationTasksRequestSchema,
  NunchuxGoogleInteractionsRequest,
  NunchuxGoogleInteractionsRequestSchema,
  NunchuxMinimaxVideoGenerationRequest,
  NunchuxMinimaxVideoGenerationRequestSchema,
  NunchuxOpenAiImagesEditsRequest,
  NunchuxOpenAiImagesEditsRequestSchema,
  NunchuxOpenAiImagesGenerationsRequest,
  NunchuxOpenAiImagesGenerationsRequestSchema,
} from "./zod";

/** HTTP status; 408 for timeout, 499 for caller abort, 500 for transport errors. */
export class NunchuxError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = "NunchuxError";
  }
}

export interface NunchuxOptions {
  /** Sent as Authorization: Bearer; defaults to NUNCHUX_API_KEY. */
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export interface NunchuxErrorDetail {
  code: string;
  message: string;
  [key: string]: unknown;
}

export type NunchuxErrorBody =
  | { error: NunchuxErrorDetail }
  | { detail: string | NunchuxErrorDetail }
  | NunchuxErrorDetail;

function isErrorDetail(value: unknown): value is NunchuxErrorDetail {
  return (
    value !== null &&
    typeof value === "object" &&
    "code" in value &&
    typeof value.code === "string" &&
    "message" in value &&
    typeof value.message === "string"
  );
}

export function isNunchuxErrorBody(value: unknown): value is NunchuxErrorBody {
  if (value === null || typeof value !== "object") return false;
  if ("error" in value) return isErrorDetail(value.error);
  if ("detail" in value)
    return typeof value.detail === "string" || isErrorDetail(value.detail);
  return isErrorDetail(value);
}

export interface NunchuxSpendLimit {
  cap: number;
  spent: number;
  remaining: number;
  /** UTC month, YYYY-MM. */
  period: string;
  limit_reached: boolean;
}

export interface NunchuxCreditsResponse {
  /** One credit is one USD. */
  credits_remaining: number;
  plan_level: string;
  rpm_limit: number;
  concurrent_limit: number;
  period_start: string;
  period_end: string;
  period_gross: number;
  pending_discount_estimate: number;
  net_balance_estimate: number;
  spend_limit: NunchuxSpendLimit | null;
}

export interface NunchuxAlibabaVideoSynthesisResponse {
  request_id?: string;
  output: { task_id: string; task_status: "PENDING" };
}

export interface NunchuxAlibabaVideoGenerationNamespace {
  videoSynthesis: {
    (
      body: NunchuxAlibabaVideoSynthesisRequest,
      signal?: AbortSignal
    ): Promise<NunchuxAlibabaVideoSynthesisResponse>;
    schema: typeof NunchuxAlibabaVideoSynthesisRequestSchema;
  };
}

export interface NunchuxAlibabaAigcNamespace {
  videoGeneration: NunchuxAlibabaVideoGenerationNamespace;
}

export interface NunchuxAlibabaServicesNamespace {
  aigc: NunchuxAlibabaAigcNamespace;
}

export interface NunchuxAlibabaTaskResponse {
  request_id?: string;
  output: {
    task_id: string;
    /** PENDING, RUNNING, SUCCEEDED, FAILED, CANCELED, or a new upstream status. */
    task_status: string;
    model?: string;
    resolution?: string;
    duration?: number;
    /** Available on success; task IDs and video URLs expire after 24 hours. */
    video_url?: string;
    code?: string;
    message?: string;
  };
  usage?: {
    input_video_duration?: number;
    output_video_duration?: number;
    duration?: number;
    video_count?: number;
    [key: string]: unknown;
  };
}

export interface NunchuxAlibabaNamespace {
  services: NunchuxAlibabaServicesNamespace;
  /** Free Wan/HappyHorse task status read; takes no job slot. */
  tasks(
    taskId: string,
    signal?: AbortSignal
  ): Promise<NunchuxAlibabaTaskResponse>;
}

export interface NunchuxBytedanceGenerationTaskCreateResponse {
  id: string;
}

export interface NunchuxBytedanceTaskResponse {
  /** The task ID, an opaque string. */
  id: string;
  model?: string;
  /** queued or running while the task runs; succeeded, failed, cancelled or expired when it ends, or a new upstream status. */
  status: string;
  /** Present only when status is succeeded; the URL expires. */
  content?: { video_url: string };
  /** Present when the task did not succeed. */
  error?: { code?: string; message?: string };
  /** Clip length in seconds. */
  duration?: number;
  ratio?: string;
  resolution?: string;
  usage?: { completion_tokens: number; total_tokens?: number };
  created_at?: number;
  updated_at?: number;
  seed?: number;
  framespersecond?: number;
  service_tier?: string;
  execution_expires_after?: number;
  generate_audio?: boolean;
  draft?: boolean;
  priority?: number;
  output_format?: string;
}

export interface NunchuxBytedanceContentsGenerationsTasksNamespace {
  (
    body: NunchuxBytedanceGenerationTasksRequest,
    signal?: AbortSignal
  ): Promise<NunchuxBytedanceGenerationTaskCreateResponse>;
  schema: typeof NunchuxBytedanceGenerationTasksRequestSchema;
  /** Free Seedance task status read; takes no job slot. */
  retrieve(
    taskId: string,
    signal?: AbortSignal
  ): Promise<NunchuxBytedanceTaskResponse>;
}

export interface NunchuxBytedanceContentsGenerationsNamespace {
  tasks: NunchuxBytedanceContentsGenerationsTasksNamespace;
}

export interface NunchuxBytedanceContentsNamespace {
  generations: NunchuxBytedanceContentsGenerationsNamespace;
}

export interface NunchuxBytedanceNamespace {
  contents: NunchuxBytedanceContentsNamespace;
}

export interface NunchuxV1Namespace {
  alibaba: NunchuxAlibabaNamespace;
  bytedance: NunchuxBytedanceNamespace;
  /** Free account balance read; counts toward the requests-per-minute cap. */
  credits(signal?: AbortSignal): Promise<NunchuxCreditsResponse>;
  google: NunchuxGoogleNamespace;
  minimax: NunchuxMinimaxNamespace;
}

export interface NunchuxProvider {
  v1: NunchuxV1Namespace;
  v2: NunchuxV2Namespace;
}

export interface NunchuxGoogleInteractionsResponse {
  id: string;
  object: string;
  model: string;
  status: string;
  created: number;
  updated: number;
  service_tier: string;
  usage: Record<string, unknown>;
  steps: {
    type?: string;
    signature?: string;
    content?: {
      type?: string;
      data?: string;
      mime_type?: string;
      text?: string;
    }[];
  }[];
}

export interface NunchuxGoogleV1betaNamespace {
  interactions: {
    (
      body: NunchuxGoogleInteractionsRequest,
      signal?: AbortSignal
    ): Promise<NunchuxGoogleInteractionsResponse>;
    schema: typeof NunchuxGoogleInteractionsRequestSchema;
  };
}
export interface NunchuxGoogleNamespace {
  v1beta: NunchuxGoogleV1betaNamespace;
}

export interface NunchuxMinimaxTaskResponse {
  task: {
    /** The task ID, an opaque string. */
    id: string;
    model: string;
    resolution?: string;
    /** Requested output seconds. */
    duration?: number;
    /** generation on the recorded text-to-video task. */
    task_type?: string;
    /** video on the recorded task. */
    modality?: string;
    /** queued or running while the task runs; succeeded, failed or cancelled when it ends, or a new upstream status. */
    status: string;
    /** Present only when status is succeeded. The URL is time-limited; a later poll returns a fresh one, for up to 7 days. */
    content?: { url: string };
    /** The failure detail, present when the task did not succeed. */
    error?: Record<string, unknown>;
    /** The billed quantities, present once the task succeeded. */
    usage?: {
      total_seconds: number;
      /** Reference-video seconds billed at the output rate. */
      input_seconds: number;
      output_seconds: number;
      input_image_count: number;
    };
  };
}

export interface NunchuxMinimaxV2QueryNamespace {
  /** Free MiniMax task status read; takes no job slot. */
  videoGeneration(
    taskId: string,
    signal?: AbortSignal
  ): Promise<NunchuxMinimaxTaskResponse>;
}

export interface NunchuxMinimaxVideoGenerationResponse {
  /** Poll it with v1.minimax.v2.query.videoGeneration. */
  task_id: string;
}

export interface NunchuxMinimaxV2Namespace {
  query: NunchuxMinimaxV2QueryNamespace;
  /** Submits a MiniMax video task; billed per second of output. */
  videoGeneration: {
    (
      body: NunchuxMinimaxVideoGenerationRequest,
      signal?: AbortSignal
    ): Promise<NunchuxMinimaxVideoGenerationResponse>;
    schema: typeof NunchuxMinimaxVideoGenerationRequestSchema;
  };
}

export interface NunchuxMinimaxNamespace {
  v2: NunchuxMinimaxV2Namespace;
}

export interface NunchuxOpenAiImageUsage {
  input_tokens: number;
  input_tokens_details?: {
    image_tokens?: number;
    text_tokens?: number;
  };
  output_tokens: number;
  output_tokens_details?: {
    image_tokens?: number;
    text_tokens?: number;
  };
  total_tokens: number;
}

export interface NunchuxOpenAiImagesGenerationsResponse {
  created: number;
  background?: string;
  output_format?: string;
  quality?: string;
  size?: string;
  data: {
    /** The image, base64-encoded. GPT Image returns no image URL. */
    b64_json: string;
    generation_id?: string;
  }[];
  /** Tokens Nunchux billed. Absent only when the hold is charged in full. */
  usage?: NunchuxOpenAiImageUsage;
}

export interface NunchuxOpenAiImagesNamespace {
  /**
   * Synchronous text-to-image. OpenAI's xhigh and max qualities are not
   * offered; high is the top setting, and auto renders at high.
   */
  generations: {
    (
      body: NunchuxOpenAiImagesGenerationsRequest,
      signal?: AbortSignal
    ): Promise<NunchuxOpenAiImagesGenerationsResponse>;
    schema: typeof NunchuxOpenAiImagesGenerationsRequestSchema;
  };
  /**
   * Synchronous image edit. The response has the same shape as generations.
   * OpenAI's xhigh and max qualities are not offered; high is the top
   * setting, and auto renders at high.
   */
  edits: {
    (
      body: NunchuxOpenAiImagesEditsRequest,
      signal?: AbortSignal
    ): Promise<NunchuxOpenAiImagesGenerationsResponse>;
    schema: typeof NunchuxOpenAiImagesEditsRequestSchema;
  };
}

export interface NunchuxOpenAiNamespace {
  images: NunchuxOpenAiImagesNamespace;
}

export interface NunchuxV2Namespace {
  openai: NunchuxOpenAiNamespace;
}
