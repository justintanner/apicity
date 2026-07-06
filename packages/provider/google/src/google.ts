import { GoogleError } from "./types";
import type { z } from "zod";
import type {
  GoogleCountTokensRequest,
  GoogleCountTokensResponse,
  GoogleGenerateContentRequest,
  GoogleGenerateContentResponse,
  GoogleOptions,
  GoogleProvider,
  GoogleRetrieveUserQuotaRequest,
  GoogleRetrieveUserQuotaResponse,
  GoogleRetrieveUserQuotaSummaryRequest,
  GoogleRetrieveUserQuotaSummaryResponse,
} from "./types";
import {
  GoogleCountTokensRequestSchema,
  GoogleRetrieveUserQuotaRequestSchema,
  GoogleRetrieveUserQuotaSummaryRequestSchema,
  GoogleGenerateContentRequestSchema,
} from "./zod";
import { attachExamples } from "./example";

interface GoogleErrorBody {
  error?:
    | {
        code?: number;
        message?: string;
        status?: string;
      }
    | string;
  message?: string;
}

function isGoogleErrorBody(value: unknown): value is GoogleErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    ("error" in value || "message" in value)
  );
}

function attachAbortHandler(
  signal: AbortSignal,
  controller: AbortController
): void {
  if (signal.aborted) {
    controller.abort();
    return;
  }
  signal.addEventListener("abort", () => controller.abort(), { once: true });
}

function formatErrorMessage(status: number, body: unknown): string {
  if (isGoogleErrorBody(body)) {
    if (typeof body.error === "string") {
      return `Google API error ${status}: ${body.error}`;
    }
    if (body.error?.message) {
      return `Google API error ${status}: ${body.error.message}`;
    }
    if (body.message) {
      return `Google API error ${status}: ${body.message}`;
    }
  }
  return `Google API error: ${status}`;
}

function bodyFromRequest<TReq extends Record<string, unknown>>(
  req: TReq,
  omitKeys: readonly string[] = []
): Record<string, unknown> | undefined {
  const omit = new Set(omitKeys);
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(req)) {
    if (omit.has(key) || value === undefined) continue;
    body[key] = value;
  }
  return Object.keys(body).length > 0 ? body : undefined;
}

function queryFromRequest<TReq extends Record<string, unknown>>(
  req: TReq
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) params.append(key, String(item));
      }
      continue;
    }
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function parseWithSchema<TReq>(schema: z.ZodType<TReq>, req: TReq): TReq {
  const result = schema.safeParse(req);
  if (result.success) return result.data;
  const message = result.error.issues
    .map((issue) => {
      const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");
  throw new GoogleError(`Invalid Google request: ${message}`, 400, {
    issues: result.error.issues,
  });
}

export function createGoogle(opts: GoogleOptions): GoogleProvider {
  const baseURL = opts.baseURL ?? "https://aiplatform.googleapis.com/v1";
  const normalizedBaseURL = baseURL.replace(/\/+$/, "");
  // Antigravity / Cloud Code usage surface (un-versioned, OAuth-authed).
  const cloudCodeBaseURL = (
    opts.cloudCodeBaseURL ?? "https://cloudcode-pa.googleapis.com"
  ).replace(/\/+$/, "");
  const oauthToken = opts.oauthToken ?? opts.apiKey;
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  // POST against the Cloud Code backend (cloudcode-pa.googleapis.com). Unlike
  // the rest of the factory this authenticates with an OAuth bearer token (the
  // Antigravity login), not the x-goog-api-key header.
  async function makeCloudCodeRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${cloudCodeBaseURL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${oauthToken}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        const code =
          isGoogleErrorBody(resBody) &&
          typeof resBody.error === "object" &&
          resBody.error !== null
            ? resBody.error.status
            : undefined;
        throw new GoogleError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          code
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof GoogleError) throw error;
      throw new GoogleError(`Google request failed: ${error}`, 500);
    }
  }

  async function makeRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${normalizedBaseURL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": opts.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        const code =
          isGoogleErrorBody(resBody) &&
          typeof resBody.error === "object" &&
          resBody.error !== null
            ? resBody.error.status
            : undefined;
        throw new GoogleError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          code
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof GoogleError) throw error;
      throw new GoogleError(`Google request failed: ${error}`, 500);
    }
  }



  const postV1 = {
    publishers: {
      google: {
        models: {
          // sig-ok: aiplatform service host omitted from provider namespace
          // POST https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:countTokens
          // Docs: https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/express-mode/rest/v1/publishers.models/countTokens
          countTokens: Object.assign(
            async (
              model: string,
              req: GoogleCountTokensRequest,
              signal?: AbortSignal
            ): Promise<GoogleCountTokensResponse> => {
              return makeRequest<GoogleCountTokensResponse>(
                `/publishers/google/models/${encodeURIComponent(model)}:countTokens`,
                req,
                signal
              );
            },
            {
              schema: GoogleCountTokensRequestSchema,
            }
          ),
          // sig-ok: aiplatform service host omitted from provider namespace
          // POST https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent
          // Docs: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/express-mode/rest/v1/publishers.models/generateContent
          generateContent: Object.assign(
            async (
              model: string,
              req: GoogleGenerateContentRequest,
              signal?: AbortSignal
            ): Promise<GoogleGenerateContentResponse> => {
              return makeRequest<GoogleGenerateContentResponse>(
                `/publishers/google/models/${encodeURIComponent(model)}:generateContent`,
                req,
                signal
              );
            },
            {
              schema: GoogleGenerateContentRequestSchema,
            }
          ),
        },
      },
    },
  };

  const v1internal = {
    // sig-ok: cloudcode-pa service host omitted from provider namespace
    // POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota
    // Docs: https://cloud.google.com/gemini/docs/quotas
    retrieveUserQuota: Object.assign(
      async (
        _req: GoogleRetrieveUserQuotaRequest = {},
        signal?: AbortSignal
      ): Promise<GoogleRetrieveUserQuotaResponse> => {
        // The endpoint requires a strictly empty JSON body — sending any keys
        // 400s — so the validated request is ignored and `{}` is always sent.
        parseWithSchema(GoogleRetrieveUserQuotaRequestSchema, _req ?? {});
        return makeCloudCodeRequest<GoogleRetrieveUserQuotaResponse>(
          "/v1internal:retrieveUserQuota",
          {},
          signal
        );
      },
      { schema: GoogleRetrieveUserQuotaRequestSchema }
    ),
    // sig-ok: cloudcode-pa service host omitted from provider namespace
    // POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary
    // Docs: https://cloud.google.com/gemini/docs/quotas
    retrieveUserQuotaSummary: Object.assign(
      async (
        _req: GoogleRetrieveUserQuotaSummaryRequest = {},
        signal?: AbortSignal
      ): Promise<GoogleRetrieveUserQuotaSummaryResponse> => {
        // Like retrieveUserQuota, this RPC requires a strictly empty JSON body.
        parseWithSchema(
          GoogleRetrieveUserQuotaSummaryRequestSchema,
          _req ?? {}
        );
        return makeCloudCodeRequest<GoogleRetrieveUserQuotaSummaryResponse>(
          "/v1internal:retrieveUserQuotaSummary",
          {},
          signal
        );
      },
      { schema: GoogleRetrieveUserQuotaSummaryRequestSchema }
    ),
  };

  const getV1 = {};

  const deleteV1 = {};

  return attachExamples({
    v1: postV1,
    v1internal,
    post: {
      v1: postV1,
    },
    get: {
      v1: getV1,
    },
    delete: {
      v1: deleteV1,
    },
  });
}
