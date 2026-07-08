import { GoogleFlowError } from "./types";
import type { z } from "zod";
import type {
  GoogleFlowOptions,
  GoogleFlowProvider,
  GoogleFlowAccountsCreateRequest,
  GoogleFlowAssetUploadRequest,
  GoogleFlowCaptchaProvidersRequest,
  GoogleFlowCaptchaStatsRequest,
  GoogleFlowCharactersCreateRequest,
  GoogleFlowCharactersListRequest,
  GoogleFlowEmailRequest,
  GoogleFlowImagesRequest,
  GoogleFlowImagesUpscaleRequest,
  GoogleFlowJobIdRequest,
  GoogleFlowJobsRequest,
  GoogleFlowMediaGenerationIdRequest,
  GoogleFlowNoRequest,
  GoogleFlowRefRequest,
  GoogleFlowResponse,
  GoogleFlowVideosConcatenateRequest,
  GoogleFlowVideosExtendRequest,
  GoogleFlowVideosGifRequest,
  GoogleFlowVideosRequest,
  GoogleFlowVideosUpscaleRequest,
  GoogleFlowVoicesCreateRequest,
  GoogleFlowVoicesListRequest,
} from "./types";
import {
  GoogleFlowAccountsCreateRequestSchema,
  GoogleFlowAssetUploadRequestSchema,
  GoogleFlowCaptchaProvidersRequestSchema,
  GoogleFlowCaptchaStatsRequestSchema,
  GoogleFlowCharactersCreateRequestSchema,
  GoogleFlowCharactersListRequestSchema,
  GoogleFlowEmailRequestSchema,
  GoogleFlowImagesRequestSchema,
  GoogleFlowImagesUpscaleRequestSchema,
  GoogleFlowJobIdRequestSchema,
  GoogleFlowJobsRequestSchema,
  GoogleFlowMediaGenerationIdRequestSchema,
  GoogleFlowNoRequestSchema,
  GoogleFlowRefRequestSchema,
  GoogleFlowVideosConcatenateRequestSchema,
  GoogleFlowVideosExtendRequestSchema,
  GoogleFlowVideosGifRequestSchema,
  GoogleFlowVideosRequestSchema,
  GoogleFlowVideosUpscaleRequestSchema,
  GoogleFlowVoicesCreateRequestSchema,
  GoogleFlowVoicesListRequestSchema,
} from "./zod";
import { attachExamples } from "./example";

interface GoogleFlowErrorBody {
  error?:
    | {
        code?: number;
        message?: string;
        status?: string;
      }
    | string;
  message?: string;
}

function isGoogleFlowErrorBody(value: unknown): value is GoogleFlowErrorBody {
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
  if (isGoogleFlowErrorBody(body)) {
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
  throw new GoogleFlowError(`Invalid Google request: ${message}`, 400, {
    issues: result.error.issues,
  });
}

export function createGoogleFlow(opts: GoogleFlowOptions): GoogleFlowProvider {
  const baseURL = opts.baseURL ?? "https://api.useapi.net/v1/google-flow";
  const normalizedFlowBaseURL = baseURL.replace(/\/+$/, "");
  const flowApiKey = opts.apiKey;
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeFlowRequest<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body: unknown,
    signal?: AbortSignal,
    options?: {
      contentType?: string;
      pathOverride?: string;
    }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${flowApiKey}`,
      };
      const requestPath = options?.pathOverride ?? path;
      const requestBody =
        body === undefined
          ? undefined
          : typeof body === "string" ||
              (typeof FormData !== "undefined" && body instanceof FormData)
            ? body
            : (typeof Blob !== "undefined" && body instanceof Blob) ||
                body instanceof ArrayBuffer ||
                ArrayBuffer.isView(body)
              ? body
              : JSON.stringify(body);

      if (body !== undefined) {
        headers["Content-Type"] = options?.contentType ?? "application/json";
      }

      const requestBaseURL = normalizedFlowBaseURL.replace(/\/+$/, "");
      const res = await doFetch(`${requestBaseURL}${requestPath}`, {
        method,
        headers,
        body: requestBody as BodyInit | undefined,
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
          isGoogleFlowErrorBody(resBody) &&
          typeof resBody.error === "object" &&
          resBody.error !== null
            ? resBody.error.status
            : undefined;
        throw new GoogleFlowError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          code
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof GoogleFlowError) throw error;
      throw new GoogleFlowError(`Google Flow request failed: ${error}`, 500);
    }
  }

  function jsonGet<TReq extends Record<string, unknown>>(
    schema: z.ZodType<TReq>,
    path: (req: TReq) => string
  ) {
    return Object.assign(
      async (
        req: TReq = {} as TReq,
        signal?: AbortSignal
      ): Promise<GoogleFlowResponse> => {
        const parsed = parseWithSchema(schema, req ?? ({} as TReq));
        return makeFlowRequest<GoogleFlowResponse>(
          "GET",
          path(parsed),
          undefined,
          signal
        );
      },
      { schema }
    );
  }

  function jsonBody<TReq extends Record<string, unknown>>(
    method: "POST" | "DELETE",
    schema: z.ZodType<TReq>,
    path: (req: TReq) => string,
    omitKeys: readonly string[] = []
  ) {
    return Object.assign(
      async (req: TReq, signal?: AbortSignal): Promise<GoogleFlowResponse> => {
        const parsed = parseWithSchema(schema, req ?? ({} as TReq));
        return makeFlowRequest<GoogleFlowResponse>(
          method,
          path(parsed),
          bodyFromRequest(parsed, omitKeys),
          signal
        );
      },
      { schema }
    );
  }

  const postV1 = {
    googleFlow: {
      // POST https://api.useapi.net/v1/google-flow/accounts
      // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-accounts
      accounts: Object.assign(
        jsonBody<GoogleFlowAccountsCreateRequest>(
          "POST",
          GoogleFlowAccountsCreateRequestSchema,
          () => "/accounts"
        ),
        {
          // POST https://api.useapi.net/v1/google-flow/accounts/captcha-providers
          // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-accounts-captcha-providers
          captchaProviders: jsonBody<GoogleFlowCaptchaProvidersRequest>(
            "POST",
            GoogleFlowCaptchaProvidersRequestSchema,
            () => "/accounts/captcha-providers"
          ),
        }
      ),
      // POST https://api.useapi.net/v1/google-flow/assets
      // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-assets-email
      assets: Object.assign(
        async (
          req: GoogleFlowAssetUploadRequest,
          signal?: AbortSignal
        ): Promise<GoogleFlowResponse> => {
          const parsed = parseWithSchema(
            GoogleFlowAssetUploadRequestSchema,
            req
          );
          const path = parsed.email
            ? `/assets/${encodeURIComponent(parsed.email)}`
            : "/assets";
          return makeFlowRequest<GoogleFlowResponse>(
            "POST",
            "/assets",
            parsed.body,
            signal,
            {
              contentType: parsed.contentType,
              pathOverride: path,
            }
          );
        },
        { schema: GoogleFlowAssetUploadRequestSchema }
      ),
      // POST https://api.useapi.net/v1/google-flow/characters
      // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-characters
      characters: jsonBody<GoogleFlowCharactersCreateRequest>(
        "POST",
        GoogleFlowCharactersCreateRequestSchema,
        () => "/characters"
      ),
      // POST https://api.useapi.net/v1/google-flow/voices
      // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-voices
      voices: jsonBody<GoogleFlowVoicesCreateRequest>(
        "POST",
        GoogleFlowVoicesCreateRequestSchema,
        () => "/voices"
      ),
      // POST https://api.useapi.net/v1/google-flow/images
      // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-images
      images: Object.assign(
        jsonBody<GoogleFlowImagesRequest>(
          "POST",
          GoogleFlowImagesRequestSchema,
          () => "/images"
        ),
        {
          // POST https://api.useapi.net/v1/google-flow/images/upscale
          // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-images-upscale
          upscale: jsonBody<GoogleFlowImagesUpscaleRequest>(
            "POST",
            GoogleFlowImagesUpscaleRequestSchema,
            () => "/images/upscale"
          ),
        }
      ),
      // POST https://api.useapi.net/v1/google-flow/videos
      // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos
      videos: Object.assign(
        jsonBody<GoogleFlowVideosRequest>(
          "POST",
          GoogleFlowVideosRequestSchema,
          () => "/videos"
        ),
        {
          // POST https://api.useapi.net/v1/google-flow/videos/upscale
          // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-upscale
          upscale: jsonBody<GoogleFlowVideosUpscaleRequest>(
            "POST",
            GoogleFlowVideosUpscaleRequestSchema,
            () => "/videos/upscale"
          ),
          // POST https://api.useapi.net/v1/google-flow/videos/gif
          // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-gif
          gif: jsonBody<GoogleFlowVideosGifRequest>(
            "POST",
            GoogleFlowVideosGifRequestSchema,
            () => "/videos/gif"
          ),
          // POST https://api.useapi.net/v1/google-flow/videos/extend
          // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-extend
          extend: jsonBody<GoogleFlowVideosExtendRequest>(
            "POST",
            GoogleFlowVideosExtendRequestSchema,
            () => "/videos/extend"
          ),
          // POST https://api.useapi.net/v1/google-flow/videos/concatenate
          // Docs: https://useapi.net/docs/api-google-flow-v1/post-google-flow-videos-concatenate
          concatenate: jsonBody<GoogleFlowVideosConcatenateRequest>(
            "POST",
            GoogleFlowVideosConcatenateRequestSchema,
            () => "/videos/concatenate"
          ),
        }
      ),
    },
  };

  const getV1 = {
    googleFlow: {
      // GET https://api.useapi.net/v1/google-flow/accounts
      // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts
      accounts: Object.assign(
        jsonGet<GoogleFlowNoRequest>(
          GoogleFlowNoRequestSchema,
          () => "/accounts"
        ),
        {
          // GET https://api.useapi.net/v1/google-flow/accounts/{email}
          // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-email
          retrieve: jsonGet<GoogleFlowEmailRequest>(
            GoogleFlowEmailRequestSchema,
            (req) => `/accounts/${encodeURIComponent(req.email)}`
          ),
          // GET https://api.useapi.net/v1/google-flow/accounts/captcha-providers
          // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-captcha-providers
          captchaProviders: jsonGet<GoogleFlowNoRequest>(
            GoogleFlowNoRequestSchema,
            () => "/accounts/captcha-providers"
          ),
          // GET https://api.useapi.net/v1/google-flow/accounts/captcha-stats{query}
          // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-accounts-captcha-stats
          captchaStats: jsonGet<GoogleFlowCaptchaStatsRequest>(
            GoogleFlowCaptchaStatsRequestSchema,
            (req) => `/accounts/captcha-stats${queryFromRequest(req)}`
          ),
        }
      ),
      assets: {
        // GET https://api.useapi.net/v1/google-flow/assets/{mediaGenerationId}
        // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-assets-mediagenerationid
        retrieve: jsonGet<GoogleFlowMediaGenerationIdRequest>(
          GoogleFlowMediaGenerationIdRequestSchema,
          (req) => `/assets/${encodeURIComponent(req.mediaGenerationId)}`
        ),
      },
      // GET https://api.useapi.net/v1/google-flow/characters{query}
      // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-characters
      characters: Object.assign(
        jsonGet<GoogleFlowCharactersListRequest>(
          GoogleFlowCharactersListRequestSchema,
          (req) => `/characters${queryFromRequest(req)}`
        ),
        {
          // GET https://api.useapi.net/v1/google-flow/characters/{ref}
          // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-characters-ref
          retrieve: jsonGet<GoogleFlowRefRequest>(
            GoogleFlowRefRequestSchema,
            (req) => `/characters/${encodeURIComponent(req.ref)}`
          ),
        }
      ),
      // GET https://api.useapi.net/v1/google-flow/voices{query}
      // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-voices
      voices: Object.assign(
        jsonGet<GoogleFlowVoicesListRequest>(
          GoogleFlowVoicesListRequestSchema,
          (req) => `/voices${queryFromRequest(req)}`
        ),
        {
          // GET https://api.useapi.net/v1/google-flow/voices/{ref}
          // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-voices-ref
          retrieve: jsonGet<GoogleFlowRefRequest>(
            GoogleFlowRefRequestSchema,
            (req) => `/voices/${encodeURIComponent(req.ref)}`
          ),
        }
      ),
      // GET https://api.useapi.net/v1/google-flow/jobs{query}
      // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs
      jobs: Object.assign(
        jsonGet<GoogleFlowJobsRequest>(
          GoogleFlowJobsRequestSchema,
          (req) => `/jobs${queryFromRequest(req)}`
        ),
        {
          // GET https://api.useapi.net/v1/google-flow/jobs/{jobId}
          // Docs: https://useapi.net/docs/api-google-flow-v1/get-google-flow-jobs-jobid
          retrieve: jsonGet<GoogleFlowJobIdRequest>(
            GoogleFlowJobIdRequestSchema,
            (req) => `/jobs/${encodeURIComponent(req.jobId)}`
          ),
        }
      ),
    },
  };

  const deleteV1 = {
    googleFlow: {
      // DELETE https://api.useapi.net/v1/google-flow/accounts/{email}
      // Docs: https://useapi.net/docs/api-google-flow-v1/delete-google-flow-accounts-email
      accounts: jsonBody<GoogleFlowEmailRequest>(
        "DELETE",
        GoogleFlowEmailRequestSchema,
        (req) => `/accounts/${encodeURIComponent(req.email)}`,
        ["email"]
      ),
      // DELETE https://api.useapi.net/v1/google-flow/characters/{ref}
      // Docs: https://useapi.net/docs/api-google-flow-v1/delete-google-flow-characters-ref
      characters: jsonBody<GoogleFlowRefRequest>(
        "DELETE",
        GoogleFlowRefRequestSchema,
        (req) => `/characters/${encodeURIComponent(req.ref)}`,
        ["ref"]
      ),
      // DELETE https://api.useapi.net/v1/google-flow/voices/{ref}
      // Docs: https://useapi.net/docs/api-google-flow-v1/delete-google-flow-voices-ref
      voices: jsonBody<GoogleFlowRefRequest>(
        "DELETE",
        GoogleFlowRefRequestSchema,
        (req) => `/voices/${encodeURIComponent(req.ref)}`,
        ["ref"]
      ),
    },
  };

  return attachExamples({
    v1: postV1.googleFlow,
    post: {
      v1: postV1.googleFlow,
    },
    get: {
      v1: getV1.googleFlow,
    },
    delete: {
      v1: deleteV1.googleFlow,
    },
  });
}
