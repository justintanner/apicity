export class ZaiCodingError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ZaiCodingError";
  }
}

export interface ZaiCodingOptions {
  /** Z.ai GLM Coding Plan API key. Falls back to `process.env.ZAI_CODING_PLAN_API_KEY`. */
  apiKey?: string;
  /** Override the API origin. Defaults to `https://api.z.ai`. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Defaults to 30000. */
  timeout?: number;
  /** Custom fetch implementation (e.g. for testing). Defaults to global `fetch`. */
  fetch?: typeof fetch;
}

/* ------------------------------------------------------------------ *
 * Chat completions (GLM Coding Plan, OpenAI-compatible)
 * POST https://api.z.ai/api/coding/paas/v4/chat/completions
 * ------------------------------------------------------------------ */

export interface ZaiCodingMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ZaiCodingChatRequest {
  /** GLM model id, e.g. "glm-4.6" or "glm-4.5-air". */
  model: string;
  messages: ZaiCodingMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ZaiCodingChatChoice {
  index: number;
  message: ZaiCodingMessage;
  finish_reason: string;
}

export interface ZaiCodingChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ZaiCodingChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/* ------------------------------------------------------------------ *
 * Coding-plan usage / quota monitoring
 * GET https://api.z.ai/api/monitor/usage/quota/limit
 * GET https://api.z.ai/api/monitor/usage/model-usage
 * GET https://api.z.ai/api/monitor/usage/tool-usage
 *
 * These report the GLM Coding Plan's quota consumption for the calling
 * account. They are free, account-scoped reads.
 * ------------------------------------------------------------------ */

/** A single quota line item (a token budget, a time window, etc.). */
export interface ZaiCodingQuotaLimitItem {
  /** Limit type discriminator, e.g. "TOKENS_LIMIT" or "TIME_LIMIT". */
  type?: string;
  /**
   * Unit code for the limit's window, paired with `number` to describe the
   * span (e.g. the rolling 5h window and the weekly 1w window). The live API
   * returns a numeric code; older/string responses are tolerated.
   */
  unit?: number | string;
  /** The window length in `unit`s (e.g. 5 for the 5h window, 1 for the 1w). */
  number?: number;
  /** Consumed fraction of the limit, 0–100. */
  percentage?: number;
  /** Amount consumed so far in `unit`s. */
  currentValue?: number;
  /** Alias some responses use for the consumed amount. */
  usage?: number;
  /** Optional per-source breakdown of usage. */
  usageDetails?: unknown;
  /** Epoch-ms (or ISO string) when this limit resets. */
  nextResetTime?: number | string;
}

export interface ZaiCodingQuotaLimitData {
  /** Plan tier, e.g. "Lite" / "Pro" / "Max". */
  level?: string;
  limits?: ZaiCodingQuotaLimitItem[];
}

/** Response envelope shared by the monitor endpoints. */
export interface ZaiCodingEnvelope<T> {
  code?: number;
  msg?: string;
  success?: boolean;
  data?: T;
}

export type ZaiCodingQuotaLimitResponse =
  ZaiCodingEnvelope<ZaiCodingQuotaLimitData>;

export interface ZaiCodingModelUsageData {
  totalUsage?: {
    totalTokensUsage?: number;
    totalModelCallCount?: number;
  };
  /** Optional per-model rows; left loose since the shape varies by plan. */
  modelUsageList?: unknown[];
}

export type ZaiCodingModelUsageResponse =
  ZaiCodingEnvelope<ZaiCodingModelUsageData>;

export interface ZaiCodingToolUsageData {
  totalUsage?: {
    totalNetworkSearchCount?: number;
    totalWebReadMcpCount?: number;
    totalZreadMcpCount?: number;
  };
  toolUsageList?: unknown[];
}

export type ZaiCodingToolUsageResponse =
  ZaiCodingEnvelope<ZaiCodingToolUsageData>;

/* ------------------------------------------------------------------ *
 * Endpoint + provider tree shapes
 * ------------------------------------------------------------------ */

export interface ZaiCodingCallOptions {
  signal?: AbortSignal;
}

/** A POST endpoint leaf: callable, with an attached zod `schema`. */
export type ZaiCodingPostEndpoint<Req, Res> = ((
  params: Req,
  options?: ZaiCodingCallOptions
) => Promise<Res>) & {
  schema: unknown;
  example?: unknown;
};

/** A GET endpoint leaf: callable with no body. */
export type ZaiCodingGetEndpoint<Res> = ((
  options?: ZaiCodingCallOptions
) => Promise<Res>) & {
  example?: unknown;
};

/**
 * Method-first provider tree, matching the Apicity convention
 * (`provider.<method>.<dotPath>`). dotPaths mirror the URL path under
 * `https://api.z.ai`.
 */
export interface ZaiCodingProvider {
  post: {
    api: {
      coding: {
        paas: {
          v4: {
            chat: {
              completions: ZaiCodingPostEndpoint<
                ZaiCodingChatRequest,
                ZaiCodingChatResponse
              >;
            };
          };
        };
      };
    };
  };
  get: {
    api: {
      monitor: {
        usage: {
          quota: {
            limit: ZaiCodingGetEndpoint<ZaiCodingQuotaLimitResponse>;
          };
          modelUsage: ZaiCodingGetEndpoint<ZaiCodingModelUsageResponse>;
          toolUsage: ZaiCodingGetEndpoint<ZaiCodingToolUsageResponse>;
        };
      };
    };
  };
}
