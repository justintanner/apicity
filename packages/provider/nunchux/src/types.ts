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

export interface NunchuxAlibabaTaskResponse {
  request_id?: string;
  output: {
    task_id: string;
    /** PENDING, RUNNING, SUCCEEDED, FAILED, CANCELED, or a new upstream status. */
    task_status: string;
    /** Available on success; task IDs and video URLs expire after 24 hours. */
    video_url?: string;
    code?: string;
    message?: string;
  };
  usage?: {
    input_video_duration?: number;
    output_video_duration?: number;
    [key: string]: unknown;
  };
}

export interface NunchuxAlibabaNamespace {
  /** Free Wan/HappyHorse task status read; takes no job slot. */
  tasks(
    taskId: string,
    signal?: AbortSignal
  ): Promise<NunchuxAlibabaTaskResponse>;
}

export interface NunchuxV1Namespace {
  alibaba: NunchuxAlibabaNamespace;
  /** Free account balance read; counts toward the requests-per-minute cap. */
  credits(signal?: AbortSignal): Promise<NunchuxCreditsResponse>;
}

export interface NunchuxProvider {
  v1: NunchuxV1Namespace;
}
