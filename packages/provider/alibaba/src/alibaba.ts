import {
  AlibabaOptions,
  AlibabaChatRequest,
  AlibabaChatResponse,
  AlibabaChatStreamChunk,
  AlibabaModelListResponse,
  AlibabaProvider,
  AlibabaError,
  AlibabaVideoSynthesisRequest,
  AlibabaVideoSynthesisSubmitResponse,
  AlibabaTaskStatusResponse,
  AlibabaImageGenerationRequest,
  AlibabaImageGenerationSubmitResponse,
  AlibabaMultimodalGenerationRequest,
  AlibabaMultimodalGenerationResponse,
  AlibabaUploadPolicyParams,
  AlibabaUploadPolicyResponse,
} from "./types";
import {
  AlibabaChatRequestSchema,
  AlibabaVideoSynthesisRequestSchema,
  AlibabaImageGenerationRequestSchema,
  AlibabaMultimodalGenerationRequestSchema,
} from "./zod";
import { sseToIterable } from "./sse";

export function alibaba(opts: AlibabaOptions): AlibabaProvider {
  const baseURL =
    opts.baseURL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const nativeBaseURL = (() => {
    const u = new URL(baseURL);
    return `${u.origin}/api/v1`;
  })();
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  // DashScope returns either OpenAI-compat `{error: {message}}` (compatible-mode
  // endpoints) or the native shape `{code, message, request_id}` (aigc/*
  // endpoints). Surface whichever the server actually returned so callers see
  // the real reason (e.g. `DataInspectionFailed`) instead of a bare status.
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      if ("error" in body) {
        const err = (body as { error: { message?: string } }).error;
        if (err?.message) return `Alibaba API error ${status}: ${err.message}`;
      }
      const native = body as { code?: string; message?: string };
      if (native.code && native.message) {
        return `Alibaba API error ${status}: ${native.code}: ${native.message}`;
      }
      if (native.message)
        return `Alibaba API error ${status}: ${native.message}`;
    }
    return `Alibaba API error: ${status}`;
  }

  async function makeRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal,
    options: {
      baseOverride?: string;
      extraHeaders?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${options.baseOverride ?? baseURL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
          ...(options.extraHeaders ?? {}),
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
        throw new AlibabaError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AlibabaError) throw error;
      throw new AlibabaError(`Alibaba request failed: ${error}`, 500);
    }
  }

  async function* makeStreamRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): AsyncIterable<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
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
        throw new AlibabaError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      for await (const { data } of sseToIterable(res)) {
        if (data === "[DONE]") {
          break;
        }

        try {
          yield JSON.parse(data) as T;
        } catch {
          // ignore non-JSON lines
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal,
    options: {
      baseOverride?: string;
      query?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = options.query
      ? `?${new URLSearchParams(options.query).toString()}`
      : "";

    try {
      const res = await doFetch(
        `${options.baseOverride ?? baseURL}${path}${qs}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new AlibabaError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AlibabaError) throw error;
      throw new AlibabaError(`Alibaba request failed: ${error}`, 500);
    }
  }

  // -- Namespace construction -----------------------------------------------

  const postV1 = {
    chat: {
      // sig-ok: dashscope subdomain hoisted by walker
      // POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
      // Docs: https://help.aliyun.com/zh/model-studio
      completions: Object.assign(
        async (
          req: AlibabaChatRequest,
          signal?: AbortSignal
        ): Promise<AlibabaChatResponse> => {
          return makeRequest<AlibabaChatResponse>(
            "/chat/completions",
            req,
            signal
          );
        },
        {
          schema: AlibabaChatRequestSchema,
        }
      ),
    },
  };

  const postStreamV1 = {
    chat: {
      completions: Object.assign(
        (
          req: AlibabaChatRequest,
          signal?: AbortSignal
        ): AsyncIterable<AlibabaChatStreamChunk> => {
          return makeStreamRequest<AlibabaChatStreamChunk>(
            "/chat/completions",
            { ...req, stream: true },
            signal
          );
        },
        {
          schema: AlibabaChatRequestSchema,
        }
      ),
    },
  };

  const getV1 = {
    // sig-ok: dashscope subdomain hoisted by walker
    // GET https://dashscope.aliyuncs.com/compatible-mode/v1/models
    // Docs: https://help.aliyun.com/zh/model-studio
    models: async (signal?: AbortSignal): Promise<AlibabaModelListResponse> => {
      return makeGetRequest<AlibabaModelListResponse>("/models", signal);
    },
  };

  const postApiV1 = {
    services: {
      aigc: {
        videoGeneration: {
          // sig-ok: dashscope subdomain hoisted by walker
          // POST https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis
          // Docs: https://help.aliyun.com/zh/model-studio
          videoSynthesis: Object.assign(
            async (
              req: AlibabaVideoSynthesisRequest,
              signal?: AbortSignal
            ): Promise<AlibabaVideoSynthesisSubmitResponse> => {
              return makeRequest<AlibabaVideoSynthesisSubmitResponse>(
                "/services/aigc/video-generation/video-synthesis",
                req,
                signal,
                {
                  baseOverride: nativeBaseURL,
                  extraHeaders: {
                    "X-DashScope-Async": "enable",
                    // Required for any oss:// URI in the body to be resolved
                    // server-side. Harmless when no oss:// URIs are present.
                    "X-DashScope-OssResourceResolve": "enable",
                  },
                }
              );
            },
            {
              schema: AlibabaVideoSynthesisRequestSchema,
            }
          ),
        },
        imageGeneration: {
          // sig-ok: dashscope subdomain hoisted by walker
          // POST https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation
          // Docs: https://www.alibabacloud.com/help/en/model-studio/image-generation
          generation: Object.assign(
            async (
              req: AlibabaImageGenerationRequest,
              signal?: AbortSignal
            ): Promise<AlibabaImageGenerationSubmitResponse> => {
              return makeRequest<AlibabaImageGenerationSubmitResponse>(
                "/services/aigc/image-generation/generation",
                req,
                signal,
                {
                  baseOverride: nativeBaseURL,
                  extraHeaders: { "X-DashScope-Async": "enable" },
                }
              );
            },
            {
              schema: AlibabaImageGenerationRequestSchema,
            }
          ),
        },
        multimodalGeneration: {
          // sig-ok: dashscope subdomain hoisted by walker
          // POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
          // Docs: https://www.alibabacloud.com/help/en/model-studio/qwen-image-edit
          generation: Object.assign(
            async (
              req: AlibabaMultimodalGenerationRequest,
              signal?: AbortSignal
            ): Promise<AlibabaMultimodalGenerationResponse> => {
              return makeRequest<AlibabaMultimodalGenerationResponse>(
                "/services/aigc/multimodal-generation/generation",
                req,
                signal,
                { baseOverride: nativeBaseURL }
              );
            },
            {
              schema: AlibabaMultimodalGenerationRequestSchema,
            }
          ),
        },
      },
    },
  };

  const getApiV1 = {
    // sig-ok: dashscope subdomain hoisted by walker
    // GET https://dashscope.aliyuncs.com/api/v1/tasks/{taskId}
    // Docs: https://help.aliyun.com/zh/model-studio
    tasks: async (
      taskId: string,
      signal?: AbortSignal
    ): Promise<AlibabaTaskStatusResponse> => {
      return makeGetRequest<AlibabaTaskStatusResponse>(
        `/tasks/${encodeURIComponent(taskId)}`,
        signal,
        { baseOverride: nativeBaseURL }
      );
    },
    // sig-ok: dashscope subdomain hoisted by walker
    // GET https://dashscope.aliyuncs.com/api/v1/uploads
    // Docs: https://help.aliyun.com/zh/model-studio
    uploads: async (
      params: AlibabaUploadPolicyParams,
      signal?: AbortSignal
    ): Promise<AlibabaUploadPolicyResponse> => {
      return makeGetRequest<AlibabaUploadPolicyResponse>("/uploads", signal, {
        baseOverride: nativeBaseURL,
        query: { action: params.action, model: params.model },
      });
    },
  };

  return {
    post: {
      compatibleMode: { v1: postV1 },
      stream: { compatibleMode: { v1: postStreamV1 } },
      api: { v1: postApiV1 },
    },
    get: {
      compatibleMode: { v1: getV1 },
      api: { v1: getApiV1 },
    },
  };
}

// Upload a file to DashScope's model-scoped OSS bucket via the
// `getPolicy` + OSS PostObject flow. Returns an `oss://{key}` URI that the
// matching aigc/* endpoints (e.g. video-synthesis) can resolve server-side.
// Falls through whatever fetch implementation `provider` was constructed with.
export async function uploadFile(
  provider: AlibabaProvider,
  args: {
    model: string;
    data: Uint8Array | Buffer;
    filename: string;
    contentType: string;
  }
): Promise<string> {
  const policyRes = await provider.get.api.v1.uploads({
    action: "getPolicy",
    model: args.model,
  });
  const p = policyRes.data;

  const uploadDir = p.upload_dir.replace(/^\/+|\/+$/g, "");
  const key = `${uploadDir}/${args.filename}`;

  const form = new FormData();
  form.append("key", key);
  form.append("OSSAccessKeyId", p.oss_access_key_id);
  form.append("policy", p.policy);
  form.append("Signature", p.signature);
  form.append("x-oss-object-acl", p.x_oss_object_acl);
  form.append("x-oss-forbid-overwrite", p.x_oss_forbid_overwrite);
  form.append("Content-Type", args.contentType);
  form.append("success_action_status", "200");
  // `file` MUST be last — OSS PostObject spec.
  form.append(
    "file",
    new Blob([new Uint8Array(args.data)], { type: args.contentType }),
    args.filename
  );

  const endpoint = p.upload_host.startsWith("http")
    ? p.upload_host
    : `https://${p.upload_host}`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AlibabaError(
      `OSS PostObject failed: ${res.status} ${res.statusText} ${body}`,
      res.status,
      body
    );
  }

  return `oss://${key}`;
}
