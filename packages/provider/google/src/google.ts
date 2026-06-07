import { GoogleError } from "./types";
import type {
  GoogleCountTokensRequest,
  GoogleCountTokensResponse,
  GoogleGenerateContentRequest,
  GoogleGenerateContentResponse,
  GoogleOptions,
  GoogleProvider,
} from "./types";
import {
  GoogleCountTokensRequestSchema,
  GoogleGenerateContentRequestSchema,
} from "./zod";
import { attachExamples } from "./example";

interface GoogleErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

function isGoogleErrorBody(value: unknown): value is GoogleErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "object"
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
  if (isGoogleErrorBody(body) && body.error?.message) {
    return `Google API error ${status}: ${body.error.message}`;
  }
  return `Google API error: ${status}`;
}

export function createGoogle(opts: GoogleOptions): GoogleProvider {
  const baseURL = opts.baseURL ?? "https://aiplatform.googleapis.com/v1";
  const normalizedBaseURL = baseURL.replace(/\/+$/, "");
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

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
        throw new GoogleError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          isGoogleErrorBody(resBody) ? resBody.error?.status : undefined
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

  return attachExamples({
    v1: postV1,
    post: {
      v1: postV1,
    },
  });
}
