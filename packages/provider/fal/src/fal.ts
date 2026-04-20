import {
  FalOptions,
  FalProvider,
  FalError,
  FalErrorType,
  FalModelSearchParams,
  FalModelSearchResponse,
  FalPricingParams,
  FalPricingResponse,
  FalEstimateRequest,
  FalEstimateResponse,
  FalUsageParams,
  FalUsageResponse,
  FalAnalyticsParams,
  FalAnalyticsResponse,
  FalRequestsParams,
  FalRequestsResponse,
  FalDeletePayloadsParams,
  FalDeletePayloadsResponse,
  FalQueueSubmitParams,
  FalQueueSubmitResponse,
  FalQueueStatusParams,
  FalQueueStatusResponse,
  FalLogsStreamParams,
  FalLabelFilter,
  FalLogEntry,
  FalFileItem,
  FalFilesListParams,
  FalFilesUploadUrlParams,
  FalFilesUploadLocalParams,
  FalWorkflowListParams,
  FalWorkflowListResponse,
  FalWorkflowGetParams,
  FalWorkflowGetResponse,
  FalAppsQueueParams,
  FalAppsQueueResponse,
  FalSeedance2p0ImageToVideoParams,
  FalSeedance2p0ImageToVideoResponse,
  FalSeedance2p0TextToVideoParams,
  FalSeedance2p0TextToVideoResponse,
  FalSeedance2p0FastImageToVideoParams,
  FalSeedance2p0FastImageToVideoResponse,
  FalSeedance2p0FastTextToVideoParams,
  FalSeedance2p0FastTextToVideoResponse,
  FalSeedance2p0ReferenceToVideoParams,
  FalSeedance2p0ReferenceToVideoResponse,
  FalSeedance2p0FastReferenceToVideoParams,
  FalSeedance2p0FastReferenceToVideoResponse,
  FalNanoBananaProTextToImageParams,
  FalNanoBananaProTextToImageResponse,
  FalNanoBananaProEditParams,
  FalNanoBananaProEditResponse,
  FalNanoBanana2TextToImageParams,
  FalNanoBanana2TextToImageResponse,
  FalNanoBanana2EditParams,
  FalNanoBanana2EditResponse,
  FalSeedreamV5LiteEditParams,
  FalSeedreamV5LiteEditResponse,
  FalSeedreamV5LiteTextToImageParams,
  FalSeedreamV5LiteTextToImageResponse,
  FalElevenlabsSpeechToTextScribeV2Params,
  FalElevenlabsSpeechToTextScribeV2Response,
  FalWanV2p7TextToImageParams,
  FalWanV2p7TextToImageResponse,
  FalWanV2p7EditParams,
  FalWanV2p7EditResponse,
  FalWanV2p7TextToVideoParams,
  FalWanV2p7TextToVideoResponse,
  FalWanV2p7ImageToVideoParams,
  FalWanV2p7ImageToVideoResponse,
  FalWanV2p7ReferenceToVideoParams,
  FalWanV2p7ReferenceToVideoResponse,
  FalWanV2p7EditVideoParams,
  FalWanV2p7EditVideoResponse,
  FalXaiGrokImagineImageParams,
  FalXaiGrokImagineImageResponse,
  FalXaiGrokImagineImageEditParams,
  FalXaiGrokImagineImageEditResponse,
  FalQwenImageParams,
  FalQwenImageResponse,
  FalQwenImageEditParams,
  FalQwenImageEditResponse,
  FalGptImage1p5Params,
  FalGptImage1p5Response,
  FalGptImage1p5EditParams,
  FalGptImage1p5EditResponse,
  FalNanoBananaTextToImageParams,
  FalNanoBananaTextToImageResponse,
  FalNanoBananaEditParams,
  FalNanoBananaEditResponse,
  FalXaiGrokImagineVideoImageToVideoParams,
  FalXaiGrokImagineVideoImageToVideoResponse,
  FalXaiGrokImagineVideoReferenceToVideoParams,
  FalXaiGrokImagineVideoReferenceToVideoResponse,
  FalXaiGrokImagineVideoExtendVideoParams,
  FalXaiGrokImagineVideoExtendVideoResponse,
  FalXaiGrokImagineVideoEditVideoParams,
  FalXaiGrokImagineVideoEditVideoResponse,
  FalVeo3p1TextToVideoParams,
  FalVeo3p1TextToVideoResponse,
  FalVeo3p1ImageToVideoParams,
  FalVeo3p1ImageToVideoResponse,
  FalStorageUploadInitiateParams,
  FalStorageUploadInitiateMultipartParams,
  FalStorageUploadCompleteMultipartParams,
  FalStorageUploadInitiateResponse,
  FalStorageNamespace,
  FalKlingVideoV3ProImageToVideoParams,
  FalKlingVideoV3ProImageToVideoResponse,
  FalKlingVideoV3ProTextToVideoParams,
  FalKlingVideoV3ProTextToVideoResponse,
  FalKlingVideoV3StandardImageToVideoParams,
  FalKlingVideoV3StandardImageToVideoResponse,
  FalKlingVideoV3StandardTextToVideoParams,
  FalKlingVideoV3StandardTextToVideoResponse,
  FalSora2TextToVideoParams,
  FalSora2TextToVideoResponse,
  FalSora2ImageToVideoParams,
  FalSora2ImageToVideoResponse,
  FalRunNamespace,
} from "./types";
import {
  FalPricingEstimateRequestSchema,
  FalDeletePayloadsRequestSchema,
  FalQueueSubmitRequestSchema,
  FalLogsStreamRequestSchema,
  FalFilesUploadUrlRequestSchema,
  FalFilesUploadLocalRequestSchema,
  FalSeedance2p0ImageToVideoRequestSchema,
  FalSeedance2p0TextToVideoRequestSchema,
  FalSeedance2p0FastImageToVideoRequestSchema,
  FalSeedance2p0FastTextToVideoRequestSchema,
  FalSeedance2p0ReferenceToVideoRequestSchema,
  FalSeedance2p0FastReferenceToVideoRequestSchema,
  FalNanoBananaProTextToImageRequestSchema,
  FalNanoBananaProEditRequestSchema,
  FalNanoBanana2TextToImageRequestSchema,
  FalNanoBanana2EditRequestSchema,
  FalSeedreamV5LiteEditRequestSchema,
  FalSeedreamV5LiteTextToImageRequestSchema,
  FalElevenlabsSpeechToTextScribeV2RequestSchema,
  FalWanV2p7TextToImageRequestSchema,
  FalWanV2p7EditRequestSchema,
  FalWanV2p7TextToVideoRequestSchema,
  FalWanV2p7ImageToVideoRequestSchema,
  FalWanV2p7ReferenceToVideoRequestSchema,
  FalWanV2p7EditVideoRequestSchema,
  FalXaiGrokImagineImageRequestSchema,
  FalXaiGrokImagineImageEditRequestSchema,
  FalQwenImageRequestSchema,
  FalQwenImageEditRequestSchema,
  FalGptImage1p5RequestSchema,
  FalGptImage1p5EditRequestSchema,
  FalNanoBananaTextToImageRequestSchema,
  FalNanoBananaEditRequestSchema,
  FalXaiGrokImagineVideoImageToVideoRequestSchema,
  FalXaiGrokImagineVideoReferenceToVideoRequestSchema,
  FalXaiGrokImagineVideoExtendVideoRequestSchema,
  FalXaiGrokImagineVideoEditVideoRequestSchema,
  FalVeo3p1TextToVideoRequestSchema,
  FalVeo3p1ImageToVideoRequestSchema,
  FalStorageUploadInitiateRequestSchema,
  FalStorageUploadInitiateMultipartRequestSchema,
  FalStorageUploadCompleteMultipartRequestSchema,
  FalKlingVideoV3ProImageToVideoRequestSchema,
  FalKlingVideoV3ProTextToVideoRequestSchema,
  FalKlingVideoV3StandardImageToVideoRequestSchema,
  FalKlingVideoV3StandardTextToVideoRequestSchema,
  FalSora2TextToVideoRequestSchema,
  FalSora2ImageToVideoRequestSchema,
} from "./zod";

// Helper function to safely handle AbortSignal across different environments
function attachAbortHandler(
  signal: AbortSignal | undefined,
  controller: AbortController
): void {
  if (!signal) return;

  // Handle both standard AbortSignal and node-fetch's AbortSignal
  if (typeof signal.addEventListener === "function") {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  } else if (signal.aborted) {
    // Already aborted, abort our controller too
    controller.abort();
  }
}

// Build query string from parameters (no case conversion)
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// Error response from fal API
interface FalApiErrorResponse {
  error: {
    type: FalErrorType;
    message: string;
    docs_url?: string;
    request_id?: string;
  };
}

function isFalApiErrorResponse(data: unknown): data is FalApiErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as Record<string, unknown>).error === "object" &&
    (data as Record<string, unknown>).error !== null
  );
}

// SSE stream parser: yields parsed data payloads from an SSE Response
async function* sseToIterable<T>(res: Response): AsyncIterable<T> {
  if (!res.body) return;
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split(/\r?\n\r?\n/);
    for (let i = 0; i < parts.length - 1; i++) {
      const chunk = parts[i];
      const lines = chunk.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("data:")) {
          const payload = trimmed.slice(5).trim();
          if (payload) {
            yield JSON.parse(payload) as T;
          }
        }
      }
    }
    buffer = parts[parts.length - 1];
  }

  const trailing = buffer.trim();
  if (trailing.length) {
    const lines = trailing.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("data:")) {
        const payload = trimmed.slice(5).trim();
        if (payload) {
          yield JSON.parse(payload) as T;
        }
      }
    }
  }
}

export function fal(opts: FalOptions): FalProvider {
  const baseURL = opts.baseURL ?? "https://api.fal.ai/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    method: "GET" | "POST" | "DELETE" | "PUT",
    path: string,
    paramsOrBody?: Record<string, unknown>,
    signal?: AbortSignal,
    headers?: Record<string, string>,
    customBaseURL?: string
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const base = customBaseURL ?? baseURL;
    const url =
      method === "GET" && paramsOrBody
        ? `${base}${path}${buildQueryString(paramsOrBody)}`
        : `${base}${path}`;

    const requestInit: RequestInit = {
      method,
      headers: {
        Authorization: `Key ${opts.apiKey}`,
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
    };

    if (method !== "GET" && paramsOrBody) {
      requestInit.body = JSON.stringify(paramsOrBody);
    }

    try {
      const res = await doFetch(url, requestInit);
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorData: unknown;
        try {
          errorData = await res.json();
        } catch {
          errorData = null;
        }

        if (isFalApiErrorResponse(errorData)) {
          throw new FalError(
            errorData.error.message,
            res.status,
            errorData.error.type,
            errorData.error.request_id,
            errorData.error.docs_url,
            errorData
          );
        }

        throw new FalError(
          `Fal API error: ${res.status}`,
          res.status,
          "server_error",
          undefined,
          undefined,
          errorData
        );
      }

      if (res.status === 204) {
        return undefined as T;
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FalError) throw error;
      throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
    }
  }

  async function makeStreamPostWithQuery(
    path: string,
    queryParams: Record<string, unknown>,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<Response> {
    const qs = buildQueryString(queryParams);
    const url = `${baseURL}${path}${qs}`;

    const controller = new AbortController();
    // No timeout for stream — connections are long-lived

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const requestInit: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Key ${opts.apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      signal: controller.signal,
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    const res = await doFetch(url, requestInit);

    if (!res.ok) {
      let errorData: unknown;
      try {
        errorData = await res.json();
      } catch {
        errorData = null;
      }

      if (isFalApiErrorResponse(errorData)) {
        throw new FalError(
          errorData.error.message,
          res.status,
          errorData.error.type,
          errorData.error.request_id,
          errorData.error.docs_url,
          errorData
        );
      }

      throw new FalError(
        `Fal API error: ${res.status}`,
        res.status,
        "server_error",
        undefined,
        undefined,
        errorData
      );
    }

    return res;
  }

  async function makeRawRequest(
    method: "GET" | "POST",
    path: string,
    body?: FormData,
    signal?: AbortSignal,
    queryParams?: Record<string, unknown>
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    let url = `${baseURL}${path}`;
    if (queryParams) {
      url += buildQueryString(queryParams);
    }

    const requestInit: RequestInit = {
      method,
      headers: {
        Authorization: `Key ${opts.apiKey}`,
      },
      signal: controller.signal,
    };

    if (body) {
      requestInit.body = body;
    }

    try {
      const res = await doFetch(url, requestInit);
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorData: unknown;
        try {
          errorData = await res.json();
        } catch {
          errorData = null;
        }

        if (isFalApiErrorResponse(errorData)) {
          throw new FalError(
            errorData.error.message,
            res.status,
            errorData.error.type,
            errorData.error.request_id,
            errorData.error.docs_url,
            errorData
          );
        }

        throw new FalError(
          `Fal API error: ${res.status}`,
          res.status,
          "server_error",
          undefined,
          undefined,
          errorData
        );
      }

      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FalError) throw error;
      throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
    }
  }

  // GET https://api.fal.ai/v1/models/pricing
  // Docs: https://docs.fal.ai
  const pricing = Object.assign(
    async function pricing(
      params: FalPricingParams,
      signal?: AbortSignal
    ): Promise<FalPricingResponse> {
      return makeRequest<FalPricingResponse>(
        "GET",
        "/models/pricing",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      // POST https://api.fal.ai/v1/models/pricing/estimate
      // Docs: https://docs.fal.ai
      estimate: Object.assign(
        async function estimate(
          req: FalEstimateRequest,
          signal?: AbortSignal
        ): Promise<FalEstimateResponse> {
          return makeRequest<FalEstimateResponse>(
            "POST",
            "/models/pricing/estimate",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          schema: FalPricingEstimateRequestSchema,
        }
      ),
    }
  );

  const requests = {
    async byEndpoint(
      params: FalRequestsParams,
      signal?: AbortSignal
    ): Promise<FalRequestsResponse> {
      return makeRequest<FalRequestsResponse>(
        "GET",
        "/models/requests/by-endpoint",
        params as unknown as Record<string, unknown>,
        signal
      );
    },

    // DELETE https://api.fal.ai/v1/models/requests/{param}/payloads
    // Docs: https://docs.fal.ai
    payloads: Object.assign(
      async function payloads(
        params: FalDeletePayloadsParams,
        signal?: AbortSignal
      ): Promise<FalDeletePayloadsResponse> {
        const headers: Record<string, string> = {};
        if (params.idempotency_key) {
          headers["Idempotency-Key"] = params.idempotency_key;
        }
        return makeRequest<FalDeletePayloadsResponse>(
          "DELETE",
          `/models/requests/${params.request_id}/payloads`,
          undefined,
          signal,
          headers
        );
      },
      {
        schema: FalDeletePayloadsRequestSchema,
      }
    ),
  };

  // GET https://api.fal.ai/v1/models
  // Docs: https://docs.fal.ai
  const models = Object.assign(
    async function models(
      params?: FalModelSearchParams,
      signal?: AbortSignal
    ): Promise<FalModelSearchResponse> {
      return makeRequest<FalModelSearchResponse>(
        "GET",
        "/models",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      pricing,

      async usage(
        params?: FalUsageParams,
        signal?: AbortSignal
      ): Promise<FalUsageResponse> {
        return makeRequest<FalUsageResponse>(
          "GET",
          "/models/usage",
          params as unknown as Record<string, unknown>,
          signal
        );
      },

      async analytics(
        params: FalAnalyticsParams,
        signal?: AbortSignal
      ): Promise<FalAnalyticsResponse> {
        return makeRequest<FalAnalyticsResponse>(
          "GET",
          "/models/analytics",
          params as unknown as Record<string, unknown>,
          signal
        );
      },

      requests,
    }
  );

  const queueBaseURL = opts.queueBaseURL ?? "https://queue.fal.run";
  const runBaseURL = opts.runBaseURL ?? "https://fal.run";
  const restBaseURL = opts.restBaseURL ?? "https://rest.fal.ai";

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/bytedance/seedance-2.0/image-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0ImageToVideo = Object.assign(
    async function imageToVideo(
      params: FalSeedance2p0ImageToVideoParams,
      signal?: AbortSignal
    ): Promise<FalSeedance2p0ImageToVideoResponse> {
      return makeRequest<FalSeedance2p0ImageToVideoResponse>(
        "POST",
        "/bytedance/seedance-2.0/image-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSeedance2p0ImageToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/bytedance/seedance-2.0/text-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0TextToVideo = Object.assign(
    async function textToVideo(
      params: FalSeedance2p0TextToVideoParams,
      signal?: AbortSignal
    ): Promise<FalSeedance2p0TextToVideoResponse> {
      return makeRequest<FalSeedance2p0TextToVideoResponse>(
        "POST",
        "/bytedance/seedance-2.0/text-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSeedance2p0TextToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/bytedance/seedance-2.0/fast/image-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0FastImageToVideo = Object.assign(
    async function imageToVideo(
      params: FalSeedance2p0FastImageToVideoParams,
      signal?: AbortSignal
    ): Promise<FalSeedance2p0FastImageToVideoResponse> {
      return makeRequest<FalSeedance2p0FastImageToVideoResponse>(
        "POST",
        "/bytedance/seedance-2.0/fast/image-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSeedance2p0FastImageToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/bytedance/seedance-2.0/fast/text-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0FastTextToVideo = Object.assign(
    async function textToVideo(
      params: FalSeedance2p0FastTextToVideoParams,
      signal?: AbortSignal
    ): Promise<FalSeedance2p0FastTextToVideoResponse> {
      return makeRequest<FalSeedance2p0FastTextToVideoResponse>(
        "POST",
        "/bytedance/seedance-2.0/fast/text-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSeedance2p0FastTextToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/bytedance/seedance-2.0/reference-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0ReferenceToVideo = Object.assign(
    async function referenceToVideo(
      params: FalSeedance2p0ReferenceToVideoParams,
      signal?: AbortSignal
    ): Promise<FalSeedance2p0ReferenceToVideoResponse> {
      return makeRequest<FalSeedance2p0ReferenceToVideoResponse>(
        "POST",
        "/bytedance/seedance-2.0/reference-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSeedance2p0ReferenceToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/bytedance/seedance-2.0/fast/reference-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0FastReferenceToVideo = Object.assign(
    async function referenceToVideo(
      params: FalSeedance2p0FastReferenceToVideoParams,
      signal?: AbortSignal
    ): Promise<FalSeedance2p0FastReferenceToVideoResponse> {
      return makeRequest<FalSeedance2p0FastReferenceToVideoResponse>(
        "POST",
        "/bytedance/seedance-2.0/fast/reference-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSeedance2p0FastReferenceToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/nano-banana-pro/edit
  // Docs: https://docs.fal.ai
  const nanoBananaProEdit = Object.assign(
    async function edit(
      params: FalNanoBananaProEditParams,
      signal?: AbortSignal
    ): Promise<FalNanoBananaProEditResponse> {
      return makeRequest<FalNanoBananaProEditResponse>(
        "POST",
        "/fal-ai/nano-banana-pro/edit",
        { safety_tolerance: "6", ...params } as unknown as Record<
          string,
          unknown
        >,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalNanoBananaProEditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/nano-banana-pro
  // Docs: https://docs.fal.ai
  const nanoBananaProTextToImage = Object.assign(
    async function textToImage(
      params: FalNanoBananaProTextToImageParams,
      signal?: AbortSignal
    ): Promise<FalNanoBananaProTextToImageResponse> {
      return makeRequest<FalNanoBananaProTextToImageResponse>(
        "POST",
        "/fal-ai/nano-banana-pro",
        { safety_tolerance: "6", ...params } as unknown as Record<
          string,
          unknown
        >,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalNanoBananaProTextToImageRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/nano-banana
  // Docs: https://docs.fal.ai
  const nanoBananaTextToImage = Object.assign(
    async function textToImage(
      params: FalNanoBananaTextToImageParams,
      signal?: AbortSignal
    ): Promise<FalNanoBananaTextToImageResponse> {
      return makeRequest<FalNanoBananaTextToImageResponse>(
        "POST",
        "/fal-ai/nano-banana",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalNanoBananaTextToImageRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/nano-banana/edit
  // Docs: https://docs.fal.ai
  const nanoBananaEdit = Object.assign(
    async function edit(
      params: FalNanoBananaEditParams,
      signal?: AbortSignal
    ): Promise<FalNanoBananaEditResponse> {
      return makeRequest<FalNanoBananaEditResponse>(
        "POST",
        "/fal-ai/nano-banana/edit",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalNanoBananaEditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/nano-banana-2
  // Docs: https://docs.fal.ai
  const nanoBanana2TextToImage = Object.assign(
    async function textToImage(
      params: FalNanoBanana2TextToImageParams,
      signal?: AbortSignal
    ): Promise<FalNanoBanana2TextToImageResponse> {
      return makeRequest<FalNanoBanana2TextToImageResponse>(
        "POST",
        "/fal-ai/nano-banana-2",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalNanoBanana2TextToImageRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/nano-banana-2/edit
  // Docs: https://docs.fal.ai
  const nanoBanana2Edit = Object.assign(
    async function edit(
      params: FalNanoBanana2EditParams,
      signal?: AbortSignal
    ): Promise<FalNanoBanana2EditResponse> {
      return makeRequest<FalNanoBanana2EditResponse>(
        "POST",
        "/fal-ai/nano-banana-2/edit",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalNanoBanana2EditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/bytedance/seedream/v5/lite/edit
  // Docs: https://docs.fal.ai
  const seedreamV5LiteEdit = Object.assign(
    async function edit(
      params: FalSeedreamV5LiteEditParams,
      signal?: AbortSignal
    ): Promise<FalSeedreamV5LiteEditResponse> {
      return makeRequest<FalSeedreamV5LiteEditResponse>(
        "POST",
        "/fal-ai/bytedance/seedream/v5/lite/edit",
        { enable_safety_checker: false, ...params } as unknown as Record<
          string,
          unknown
        >,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSeedreamV5LiteEditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/bytedance/seedream/v5/lite/text-to-image
  // Docs: https://docs.fal.ai
  const seedreamV5LiteTextToImage = Object.assign(
    async function textToImage(
      params: FalSeedreamV5LiteTextToImageParams,
      signal?: AbortSignal
    ): Promise<FalSeedreamV5LiteTextToImageResponse> {
      return makeRequest<FalSeedreamV5LiteTextToImageResponse>(
        "POST",
        "/fal-ai/bytedance/seedream/v5/lite/text-to-image",
        { enable_safety_checker: false, ...params } as unknown as Record<
          string,
          unknown
        >,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSeedreamV5LiteTextToImageRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/elevenlabs/speech-to-text/scribe-v2
  // Docs: https://docs.fal.ai
  const elevenlabsSpeechToTextScribeV2 = Object.assign(
    async function scribeV2(
      params: FalElevenlabsSpeechToTextScribeV2Params,
      signal?: AbortSignal
    ): Promise<FalElevenlabsSpeechToTextScribeV2Response> {
      return makeRequest<FalElevenlabsSpeechToTextScribeV2Response>(
        "POST",
        "/fal-ai/elevenlabs/speech-to-text/scribe-v2",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalElevenlabsSpeechToTextScribeV2RequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/wan/v2.7/text-to-image
  // Docs: https://docs.fal.ai
  const wanV2p7TextToImage = Object.assign(
    async function textToImage(
      params: FalWanV2p7TextToImageParams,
      signal?: AbortSignal
    ): Promise<FalWanV2p7TextToImageResponse> {
      return makeRequest<FalWanV2p7TextToImageResponse>(
        "POST",
        "/fal-ai/wan/v2.7/text-to-image",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalWanV2p7TextToImageRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/wan/v2.7/edit
  // Docs: https://docs.fal.ai
  const wanV2p7Edit = Object.assign(
    async function edit(
      params: FalWanV2p7EditParams,
      signal?: AbortSignal
    ): Promise<FalWanV2p7EditResponse> {
      return makeRequest<FalWanV2p7EditResponse>(
        "POST",
        "/fal-ai/wan/v2.7/edit",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalWanV2p7EditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/wan/v2.7/pro/text-to-image
  // Docs: https://docs.fal.ai
  const wanV2p7ProTextToImage = Object.assign(
    async function textToImage(
      params: FalWanV2p7TextToImageParams,
      signal?: AbortSignal
    ): Promise<FalWanV2p7TextToImageResponse> {
      return makeRequest<FalWanV2p7TextToImageResponse>(
        "POST",
        "/fal-ai/wan/v2.7/pro/text-to-image",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalWanV2p7TextToImageRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/wan/v2.7/pro/edit
  // Docs: https://docs.fal.ai
  const wanV2p7ProEdit = Object.assign(
    async function edit(
      params: FalWanV2p7EditParams,
      signal?: AbortSignal
    ): Promise<FalWanV2p7EditResponse> {
      return makeRequest<FalWanV2p7EditResponse>(
        "POST",
        "/fal-ai/wan/v2.7/pro/edit",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalWanV2p7EditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/wan/v2.7/text-to-video
  // Docs: https://docs.fal.ai
  const wanV2p7TextToVideo = Object.assign(
    async function textToVideo(
      params: FalWanV2p7TextToVideoParams,
      signal?: AbortSignal
    ): Promise<FalWanV2p7TextToVideoResponse> {
      return makeRequest<FalWanV2p7TextToVideoResponse>(
        "POST",
        "/fal-ai/wan/v2.7/text-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalWanV2p7TextToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/wan/v2.7/image-to-video
  // Docs: https://docs.fal.ai
  const wanV2p7ImageToVideo = Object.assign(
    async function imageToVideo(
      params: FalWanV2p7ImageToVideoParams,
      signal?: AbortSignal
    ): Promise<FalWanV2p7ImageToVideoResponse> {
      return makeRequest<FalWanV2p7ImageToVideoResponse>(
        "POST",
        "/fal-ai/wan/v2.7/image-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalWanV2p7ImageToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/wan/v2.7/reference-to-video
  // Docs: https://docs.fal.ai
  const wanV2p7ReferenceToVideo = Object.assign(
    async function referenceToVideo(
      params: FalWanV2p7ReferenceToVideoParams,
      signal?: AbortSignal
    ): Promise<FalWanV2p7ReferenceToVideoResponse> {
      return makeRequest<FalWanV2p7ReferenceToVideoResponse>(
        "POST",
        "/fal-ai/wan/v2.7/reference-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalWanV2p7ReferenceToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/wan/v2.7/edit-video
  // Docs: https://docs.fal.ai
  const wanV2p7EditVideo = Object.assign(
    async function editVideo(
      params: FalWanV2p7EditVideoParams,
      signal?: AbortSignal
    ): Promise<FalWanV2p7EditVideoResponse> {
      return makeRequest<FalWanV2p7EditVideoResponse>(
        "POST",
        "/fal-ai/wan/v2.7/edit-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalWanV2p7EditVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/xai/grok-imagine-image/edit
  // Docs: https://docs.fal.ai
  const xaiGrokImagineImageEdit = Object.assign(
    async function edit(
      params: FalXaiGrokImagineImageEditParams,
      signal?: AbortSignal
    ): Promise<FalXaiGrokImagineImageEditResponse> {
      return makeRequest<FalXaiGrokImagineImageEditResponse>(
        "POST",
        "/xai/grok-imagine-image/edit",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalXaiGrokImagineImageEditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/sora-2/text-to-video
  // Docs: https://docs.fal.ai
  const sora2TextToVideo = Object.assign(
    async function textToVideo(
      params: FalSora2TextToVideoParams,
      signal?: AbortSignal
    ): Promise<FalSora2TextToVideoResponse> {
      return makeRequest<FalSora2TextToVideoResponse>(
        "POST",
        "/fal-ai/sora-2/text-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSora2TextToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/sora-2/image-to-video
  // Docs: https://docs.fal.ai
  const sora2ImageToVideo = Object.assign(
    async function imageToVideo(
      params: FalSora2ImageToVideoParams,
      signal?: AbortSignal
    ): Promise<FalSora2ImageToVideoResponse> {
      return makeRequest<FalSora2ImageToVideoResponse>(
        "POST",
        "/fal-ai/sora-2/image-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalSora2ImageToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/kling-video/v3/pro/image-to-video
  // Docs: https://docs.fal.ai
  const klingVideoV3ProImageToVideo = Object.assign(
    async function imageToVideo(
      params: FalKlingVideoV3ProImageToVideoParams,
      signal?: AbortSignal
    ): Promise<FalKlingVideoV3ProImageToVideoResponse> {
      return makeRequest<FalKlingVideoV3ProImageToVideoResponse>(
        "POST",
        "/fal-ai/kling-video/v3/pro/image-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalKlingVideoV3ProImageToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/kling-video/v3/pro/text-to-video
  // Docs: https://docs.fal.ai
  const klingVideoV3ProTextToVideo = Object.assign(
    async function textToVideo(
      params: FalKlingVideoV3ProTextToVideoParams,
      signal?: AbortSignal
    ): Promise<FalKlingVideoV3ProTextToVideoResponse> {
      return makeRequest<FalKlingVideoV3ProTextToVideoResponse>(
        "POST",
        "/fal-ai/kling-video/v3/pro/text-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalKlingVideoV3ProTextToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/kling-video/v3/standard/image-to-video
  // Docs: https://docs.fal.ai
  const klingVideoV3StandardImageToVideo = Object.assign(
    async function imageToVideo(
      params: FalKlingVideoV3StandardImageToVideoParams,
      signal?: AbortSignal
    ): Promise<FalKlingVideoV3StandardImageToVideoResponse> {
      return makeRequest<FalKlingVideoV3StandardImageToVideoResponse>(
        "POST",
        "/fal-ai/kling-video/v3/standard/image-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalKlingVideoV3StandardImageToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/kling-video/v3/standard/text-to-video
  // Docs: https://docs.fal.ai
  const klingVideoV3StandardTextToVideo = Object.assign(
    async function textToVideo(
      params: FalKlingVideoV3StandardTextToVideoParams,
      signal?: AbortSignal
    ): Promise<FalKlingVideoV3StandardTextToVideoResponse> {
      return makeRequest<FalKlingVideoV3StandardTextToVideoResponse>(
        "POST",
        "/fal-ai/kling-video/v3/standard/text-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalKlingVideoV3StandardTextToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/veo3.1
  // Docs: https://docs.fal.ai
  const veo3p1TextToVideo = Object.assign(
    async function textToVideo(
      params: FalVeo3p1TextToVideoParams,
      signal?: AbortSignal
    ): Promise<FalVeo3p1TextToVideoResponse> {
      return makeRequest<FalVeo3p1TextToVideoResponse>(
        "POST",
        "/fal-ai/veo3.1",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalVeo3p1TextToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/veo3.1/image-to-video
  // Docs: https://docs.fal.ai
  const veo3p1ImageToVideo = Object.assign(
    async function imageToVideo(
      params: FalVeo3p1ImageToVideoParams,
      signal?: AbortSignal
    ): Promise<FalVeo3p1ImageToVideoResponse> {
      return makeRequest<FalVeo3p1ImageToVideoResponse>(
        "POST",
        "/fal-ai/veo3.1/image-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalVeo3p1ImageToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/xai/grok-imagine-video/image-to-video
  // Docs: https://docs.fal.ai
  const xaiGrokImagineVideoImageToVideo = Object.assign(
    async function imageToVideo(
      params: FalXaiGrokImagineVideoImageToVideoParams,
      signal?: AbortSignal
    ): Promise<FalXaiGrokImagineVideoImageToVideoResponse> {
      return makeRequest<FalXaiGrokImagineVideoImageToVideoResponse>(
        "POST",
        "/xai/grok-imagine-video/image-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalXaiGrokImagineVideoImageToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/xai/grok-imagine-video/reference-to-video
  // Docs: https://docs.fal.ai
  const xaiGrokImagineVideoReferenceToVideo = Object.assign(
    async function referenceToVideo(
      params: FalXaiGrokImagineVideoReferenceToVideoParams,
      signal?: AbortSignal
    ): Promise<FalXaiGrokImagineVideoReferenceToVideoResponse> {
      return makeRequest<FalXaiGrokImagineVideoReferenceToVideoResponse>(
        "POST",
        "/xai/grok-imagine-video/reference-to-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalXaiGrokImagineVideoReferenceToVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/xai/grok-imagine-video/extend-video
  // Docs: https://docs.fal.ai
  const xaiGrokImagineVideoExtendVideo = Object.assign(
    async function extendVideo(
      params: FalXaiGrokImagineVideoExtendVideoParams,
      signal?: AbortSignal
    ): Promise<FalXaiGrokImagineVideoExtendVideoResponse> {
      return makeRequest<FalXaiGrokImagineVideoExtendVideoResponse>(
        "POST",
        "/xai/grok-imagine-video/extend-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalXaiGrokImagineVideoExtendVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/xai/grok-imagine-video/edit-video
  // Docs: https://docs.fal.ai
  const xaiGrokImagineVideoEditVideo = Object.assign(
    async function editVideo(
      params: FalXaiGrokImagineVideoEditVideoParams,
      signal?: AbortSignal
    ): Promise<FalXaiGrokImagineVideoEditVideoResponse> {
      return makeRequest<FalXaiGrokImagineVideoEditVideoResponse>(
        "POST",
        "/xai/grok-imagine-video/edit-video",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalXaiGrokImagineVideoEditVideoRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/xai/grok-imagine-image
  // Docs: https://docs.fal.ai
  const xaiGrokImagineImage = Object.assign(
    async function grokImagineImage(
      params: FalXaiGrokImagineImageParams,
      signal?: AbortSignal
    ): Promise<FalXaiGrokImagineImageResponse> {
      return makeRequest<FalXaiGrokImagineImageResponse>(
        "POST",
        "/xai/grok-imagine-image",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalXaiGrokImagineImageRequestSchema,
      edit: xaiGrokImagineImageEdit,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/qwen-image-edit
  // Docs: https://docs.fal.ai
  const qwenImageEdit = Object.assign(
    async function edit(
      params: FalQwenImageEditParams,
      signal?: AbortSignal
    ): Promise<FalQwenImageEditResponse> {
      return makeRequest<FalQwenImageEditResponse>(
        "POST",
        "/fal-ai/qwen-image-edit",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalQwenImageEditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/gpt-image-1.5/edit
  // Docs: https://docs.fal.ai
  const gptImage1p5Edit = Object.assign(
    async function edit(
      params: FalGptImage1p5EditParams,
      signal?: AbortSignal
    ): Promise<FalGptImage1p5EditResponse> {
      return makeRequest<FalGptImage1p5EditResponse>(
        "POST",
        "/fal-ai/gpt-image-1.5/edit",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalGptImage1p5EditRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/gpt-image-1.5
  // Docs: https://docs.fal.ai
  const gptImage1p5 = Object.assign(
    async function gptImage1p5(
      params: FalGptImage1p5Params,
      signal?: AbortSignal
    ): Promise<FalGptImage1p5Response> {
      return makeRequest<FalGptImage1p5Response>(
        "POST",
        "/fal-ai/gpt-image-1.5",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalGptImage1p5RequestSchema,
      edit: gptImage1p5Edit,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/qwen-image
  // Docs: https://docs.fal.ai
  const qwenImage = Object.assign(
    async function qwenImage(
      params: FalQwenImageParams,
      signal?: AbortSignal
    ): Promise<FalQwenImageResponse> {
      return makeRequest<FalQwenImageResponse>(
        "POST",
        "/fal-ai/qwen-image",
        params as unknown as Record<string, unknown>,
        signal,
        undefined,
        runBaseURL
      );
    },
    {
      schema: FalQwenImageRequestSchema,
      edit: qwenImageEdit,
    }
  );

  async function storageInitiateCall(
    path: string,
    params:
      | FalStorageUploadInitiateParams
      | FalStorageUploadInitiateMultipartParams,
    signal?: AbortSignal
  ): Promise<FalStorageUploadInitiateResponse> {
    const {
      file_name,
      content_type,
      storage_type = "fal-cdn-v3",
      lifecycle,
    } = params;
    const url = `${restBaseURL}${path}?storage_type=${encodeURIComponent(storage_type)}`;
    const headers: Record<string, string> = {
      Authorization: `Key ${opts.apiKey}`,
      "Content-Type": "application/json",
    };
    if (lifecycle) {
      headers["X-Fal-Object-Lifecycle"] = JSON.stringify(lifecycle);
    }
    const res = await doFetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ file_name, content_type }),
      signal,
    });
    if (!res.ok) {
      throw new FalError(
        `Fal storage error: ${res.status}`,
        res.status,
        "server_error"
      );
    }
    return (await res.json()) as FalStorageUploadInitiateResponse;
  }

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://rest.fal.ai/storage/upload/initiate
  // Docs: https://docs.fal.ai
  const storageUploadInitiate = Object.assign(
    async function initiate(
      params: FalStorageUploadInitiateParams,
      signal?: AbortSignal
    ): Promise<FalStorageUploadInitiateResponse> {
      return storageInitiateCall("/storage/upload/initiate", params, signal);
    },
    {
      schema: FalStorageUploadInitiateRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://rest.fal.ai/storage/upload/initiate-multipart
  // Docs: https://docs.fal.ai
  const storageUploadInitiateMultipart = Object.assign(
    async function initiateMultipart(
      params: FalStorageUploadInitiateMultipartParams,
      signal?: AbortSignal
    ): Promise<FalStorageUploadInitiateResponse> {
      return storageInitiateCall(
        "/storage/upload/initiate-multipart",
        params,
        signal
      );
    },
    {
      schema: FalStorageUploadInitiateMultipartRequestSchema,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://rest.fal.ai/storage/upload/complete-multipart
  // Docs: https://docs.fal.ai
  const storageUploadCompleteMultipart = Object.assign(
    async function completeMultipart(
      params: FalStorageUploadCompleteMultipartParams,
      signal?: AbortSignal
    ): Promise<Response> {
      const upload = new URL(params.upload_url);
      const completeUrl = `${upload.origin}${upload.pathname}/complete${upload.search}`;
      return doFetch(completeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts: params.parts }),
        signal,
      });
    },
    {
      schema: FalStorageUploadCompleteMultipartRequestSchema,
    }
  );

  const storage: FalStorageNamespace = {
    upload: {
      initiate: storageUploadInitiate,
      initiateMultipart: storageUploadInitiateMultipart,
      completeMultipart: storageUploadCompleteMultipart,
    },
  };

  const run: FalRunNamespace = {
    bytedance: {
      seedance2p0: {
        imageToVideo: bytedanceSeedance2p0ImageToVideo,
        textToVideo: bytedanceSeedance2p0TextToVideo,
        referenceToVideo: bytedanceSeedance2p0ReferenceToVideo,
        fast: {
          imageToVideo: bytedanceSeedance2p0FastImageToVideo,
          textToVideo: bytedanceSeedance2p0FastTextToVideo,
          referenceToVideo: bytedanceSeedance2p0FastReferenceToVideo,
        },
      },
      seedream: {
        v5: {
          lite: {
            edit: seedreamV5LiteEdit,
            textToImage: seedreamV5LiteTextToImage,
          },
        },
      },
    },
    nanoBananaPro: {
      textToImage: nanoBananaProTextToImage,
      edit: nanoBananaProEdit,
    },
    nanoBanana: {
      textToImage: nanoBananaTextToImage,
      edit: nanoBananaEdit,
    },
    nanoBanana2: {
      textToImage: nanoBanana2TextToImage,
      edit: nanoBanana2Edit,
    },
    qwenImage,
    klingVideo: {
      v3: {
        pro: {
          imageToVideo: klingVideoV3ProImageToVideo,
          textToVideo: klingVideoV3ProTextToVideo,
        },
        standard: {
          imageToVideo: klingVideoV3StandardImageToVideo,
          textToVideo: klingVideoV3StandardTextToVideo,
        },
      },
    },
    gptImage1p5,
    sora2: {
      textToVideo: sora2TextToVideo,
      imageToVideo: sora2ImageToVideo,
    },
    veo3p1: {
      textToVideo: veo3p1TextToVideo,
      imageToVideo: veo3p1ImageToVideo,
    },
    falAi: {
      elevenlabs: {
        speechToText: {
          scribeV2: elevenlabsSpeechToTextScribeV2,
        },
      },
    },
    wan: {
      v2p7: {
        textToImage: wanV2p7TextToImage,
        edit: wanV2p7Edit,
        textToVideo: wanV2p7TextToVideo,
        imageToVideo: wanV2p7ImageToVideo,
        referenceToVideo: wanV2p7ReferenceToVideo,
        editVideo: wanV2p7EditVideo,
        pro: {
          textToImage: wanV2p7ProTextToImage,
          edit: wanV2p7ProEdit,
        },
      },
    },
    xai: {
      grokImagineImage: xaiGrokImagineImage,
      grokImagineVideo: {
        imageToVideo: xaiGrokImagineVideoImageToVideo,
        referenceToVideo: xaiGrokImagineVideoReferenceToVideo,
        extendVideo: xaiGrokImagineVideoExtendVideo,
        editVideo: xaiGrokImagineVideoEditVideo,
      },
    },
  };

  const queue = {
    // sig-ok: stylistic dotPath divergence from URL
    // POST https://api.fal.ai/v1/POST
    // Docs: https://docs.fal.ai
    submit: Object.assign(
      async function submit(
        params: FalQueueSubmitParams,
        signal?: AbortSignal
      ): Promise<FalQueueSubmitResponse> {
        const headers: Record<string, string> = {};
        if (params.priority) {
          headers["X-Fal-Queue-Priority"] = params.priority;
        }
        if (params.timeout !== undefined) {
          headers["X-Fal-Request-Timeout"] = String(params.timeout);
        }
        if (params.no_retry) {
          headers["X-Fal-No-Retry"] = "1";
        }
        if (params.runner_hint) {
          headers["X-Fal-Runner-Hint"] = params.runner_hint;
        }
        if (params.store_io) {
          headers["X-Fal-Store-IO"] = params.store_io;
        }
        if (params.object_lifecycle_preference) {
          headers["X-Fal-Object-Lifecycle-Preference"] =
            params.object_lifecycle_preference;
        }

        const path = params.webhook
          ? `/${params.endpoint_id}?fal_webhook=${encodeURIComponent(params.webhook)}`
          : `/${params.endpoint_id}`;

        return makeRequest<FalQueueSubmitResponse>(
          "POST",
          path,
          params.input,
          signal,
          headers,
          queueBaseURL
        );
      },
      {
        schema: FalQueueSubmitRequestSchema,
      }
    ),

    async status(
      params: FalQueueStatusParams,
      signal?: AbortSignal
    ): Promise<FalQueueStatusResponse> {
      const queryParams: Record<string, unknown> = {};
      if (params.logs) {
        queryParams.logs = "1";
      }
      return makeRequest<FalQueueStatusResponse>(
        "GET",
        `/${params.endpoint_id}/requests/${params.request_id}/status`,
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },
  };

  function buildLogsQueryParams(
    params?: Record<string, unknown>
  ): Record<string, unknown> {
    if (!params) return {};
    const query: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        query[key] = value;
      }
    }
    return query;
  }

  const serverless = {
    logs: {
      // sig-ok: stylistic dotPath divergence from URL
      // POST https://api.fal.ai/v1/serverless/logs/stream
      // Docs: https://docs.fal.ai
      stream: Object.assign(
        async function stream(
          params?: FalLogsStreamParams,
          body?: FalLabelFilter[],
          signal?: AbortSignal
        ): Promise<AsyncIterable<FalLogEntry>> {
          const res = await makeStreamPostWithQuery(
            "/serverless/logs/stream",
            buildLogsQueryParams(params as unknown as Record<string, unknown>),
            body,
            signal
          );
          return sseToIterable<FalLogEntry>(res);
        },
        {
          schema: FalLogsStreamRequestSchema,
        }
      ),
    },

    files: {
      async list(
        params?: FalFilesListParams,
        signal?: AbortSignal
      ): Promise<FalFileItem[]> {
        const path = params?.dir
          ? `/serverless/files/list/${params.dir}`
          : "/serverless/files/list";
        return makeRequest<FalFileItem[]>("GET", path, undefined, signal);
      },

      // sig-ok: stylistic dotPath divergence from URL
      // POST https://api.fal.ai/v1/serverless/files/file/url/{param}
      // Docs: https://docs.fal.ai
      uploadUrl: Object.assign(
        async function uploadUrl(
          params: FalFilesUploadUrlParams,
          signal?: AbortSignal
        ): Promise<boolean> {
          return makeRequest<boolean>(
            "POST",
            `/serverless/files/file/url/${params.file}`,
            { url: params.url },
            signal
          );
        },
        {
          schema: FalFilesUploadUrlRequestSchema,
        }
      ),

      // sig-ok: stylistic dotPath divergence from URL
      // POST https://api.fal.ai/v1/serverless/files/file/local/{param}
      // Docs: https://docs.fal.ai
      uploadLocal: Object.assign(
        async function uploadLocal(
          params: FalFilesUploadLocalParams,
          signal?: AbortSignal
        ): Promise<boolean> {
          const formData = new FormData();
          formData.append(
            "file_upload",
            params.file,
            params.filename ?? "upload"
          );

          const queryParams: Record<string, unknown> = {};
          if (params.unzip) {
            queryParams.unzip = "true";
          }

          const res = await makeRawRequest(
            "POST",
            `/serverless/files/file/local/${params.target_path}`,
            formData,
            signal,
            Object.keys(queryParams).length > 0 ? queryParams : undefined
          );
          return (await res.json()) as boolean;
        },
        {
          schema: FalFilesUploadLocalRequestSchema,
        }
      ),
    },

    apps: {
      async queue(
        params: FalAppsQueueParams,
        signal?: AbortSignal
      ): Promise<FalAppsQueueResponse> {
        return makeRequest<FalAppsQueueResponse>(
          "GET",
          `/serverless/apps/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.name)}/queue`,
          undefined,
          signal
        );
      },
    },

    async metrics(signal?: AbortSignal): Promise<string> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        attachAbortHandler(signal, controller);
      }

      const url = `${baseURL}/serverless/metrics`;

      try {
        const res = await doFetch(url, {
          method: "GET",
          headers: {
            Authorization: `Key ${opts.apiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorData: unknown;
          try {
            errorData = await res.json();
          } catch {
            errorData = null;
          }

          if (isFalApiErrorResponse(errorData)) {
            throw new FalError(
              errorData.error.message,
              res.status,
              errorData.error.type,
              errorData.error.request_id,
              errorData.error.docs_url,
              errorData
            );
          }

          throw new FalError(
            `Fal API error: ${res.status}`,
            res.status,
            "server_error",
            undefined,
            undefined,
            errorData
          );
        }

        return await res.text();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof FalError) throw error;
        throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
      }
    },
  };
  // GET https://api.fal.ai/v1/workflows
  // Docs: https://docs.fal.ai
  const workflows = Object.assign(
    async function workflows(
      params?: FalWorkflowListParams,
      signal?: AbortSignal
    ): Promise<FalWorkflowListResponse> {
      return makeRequest<FalWorkflowListResponse>(
        "GET",
        "/workflows",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      async get(
        params: FalWorkflowGetParams,
        signal?: AbortSignal
      ): Promise<FalWorkflowGetResponse> {
        return makeRequest<FalWorkflowGetResponse>(
          "GET",
          `/workflows/${encodeURIComponent(params.username)}/${encodeURIComponent(params.workflow_name)}`,
          undefined,
          signal
        );
      },
    }
  );

  // ==================== Verb-Prefixed API Surface ====================

  // GET https://api.fal.ai/v1/models/pricing
  // Docs: https://docs.fal.ai
  const getV1ModelsPricing = Object.assign(
    async function pricing(
      params: FalPricingParams,
      signal?: AbortSignal
    ): Promise<FalPricingResponse> {
      return makeRequest<FalPricingResponse>(
        "GET",
        "/models/pricing",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      // GET https://api.fal.ai/v1/models/pricing/estimate
      // Docs: https://docs.fal.ai
      estimate: Object.assign(
        async function estimate(
          req: FalEstimateRequest,
          signal?: AbortSignal
        ): Promise<FalEstimateResponse> {
          return makeRequest<FalEstimateResponse>(
            "POST",
            "/models/pricing/estimate",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          schema: FalPricingEstimateRequestSchema,
        }
      ),
    }
  );

  const getV1ModelsRequests = {
    async byEndpoint(
      params: FalRequestsParams,
      signal?: AbortSignal
    ): Promise<FalRequestsResponse> {
      return makeRequest<FalRequestsResponse>(
        "GET",
        "/models/requests/by-endpoint",
        params as unknown as Record<string, unknown>,
        signal
      );
    },

    // GET https://api.fal.ai/v1/models/requests/{param}/payloads
    // Docs: https://docs.fal.ai
    payloads: Object.assign(
      async function payloads(
        params: FalDeletePayloadsParams,
        signal?: AbortSignal
      ): Promise<FalDeletePayloadsResponse> {
        const headers: Record<string, string> = {};
        if (params.idempotency_key) {
          headers["Idempotency-Key"] = params.idempotency_key;
        }
        return makeRequest<FalDeletePayloadsResponse>(
          "DELETE",
          `/models/requests/${params.request_id}/payloads`,
          undefined,
          signal,
          headers
        );
      },
      {
        schema: FalDeletePayloadsRequestSchema,
      }
    ),
  };

  // GET https://api.fal.ai/v1/models
  // Docs: https://docs.fal.ai
  const getV1Models = Object.assign(
    async function models(
      params?: FalModelSearchParams,
      signal?: AbortSignal
    ): Promise<FalModelSearchResponse> {
      return makeRequest<FalModelSearchResponse>(
        "GET",
        "/models",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      pricing: getV1ModelsPricing,

      async usage(
        params?: FalUsageParams,
        signal?: AbortSignal
      ): Promise<FalUsageResponse> {
        return makeRequest<FalUsageResponse>(
          "GET",
          "/models/usage",
          params as unknown as Record<string, unknown>,
          signal
        );
      },

      async analytics(
        params: FalAnalyticsParams,
        signal?: AbortSignal
      ): Promise<FalAnalyticsResponse> {
        return makeRequest<FalAnalyticsResponse>(
          "GET",
          "/models/analytics",
          params as unknown as Record<string, unknown>,
          signal
        );
      },

      requests: getV1ModelsRequests,
    }
  );

  const getV1Queue = {
    async status(
      params: FalQueueStatusParams,
      signal?: AbortSignal
    ): Promise<FalQueueStatusResponse> {
      const queryParams: Record<string, unknown> = {};
      if (params.logs) {
        queryParams.logs = "1";
      }
      return makeRequest<FalQueueStatusResponse>(
        "GET",
        `/${params.endpoint_id}/requests/${params.request_id}/status`,
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },
  };

  const getV1ServerlessFiles = {
    async list(
      params?: FalFilesListParams,
      signal?: AbortSignal
    ): Promise<FalFileItem[]> {
      const path = params?.dir
        ? `/serverless/files/list/${params.dir}`
        : "/serverless/files/list";
      return makeRequest<FalFileItem[]>("GET", path, undefined, signal);
    },
  };

  const getV1ServerlessApps = {
    async queue(
      params: FalAppsQueueParams,
      signal?: AbortSignal
    ): Promise<FalAppsQueueResponse> {
      return makeRequest<FalAppsQueueResponse>(
        "GET",
        `/serverless/apps/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.name)}/queue`,
        undefined,
        signal
      );
    },
  };

  const getV1Serverless = {
    files: getV1ServerlessFiles,
    apps: getV1ServerlessApps,

    async metrics(signal?: AbortSignal): Promise<string> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        attachAbortHandler(signal, controller);
      }

      const url = `${baseURL}/serverless/metrics`;

      try {
        const res = await doFetch(url, {
          method: "GET",
          headers: {
            Authorization: `Key ${opts.apiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorData: unknown;
          try {
            errorData = await res.json();
          } catch {
            errorData = null;
          }

          if (isFalApiErrorResponse(errorData)) {
            throw new FalError(
              errorData.error.message,
              res.status,
              errorData.error.type,
              errorData.error.request_id,
              errorData.error.docs_url,
              errorData
            );
          }

          throw new FalError(
            `Fal API error: ${res.status}`,
            res.status,
            "server_error",
            undefined,
            undefined,
            errorData
          );
        }

        return await res.text();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof FalError) throw error;
        throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
      }
    },
  };

  // GET https://api.fal.ai/v1/workflows
  // Docs: https://docs.fal.ai
  const getV1Workflows = Object.assign(
    async function workflows(
      params?: FalWorkflowListParams,
      signal?: AbortSignal
    ): Promise<FalWorkflowListResponse> {
      return makeRequest<FalWorkflowListResponse>(
        "GET",
        "/workflows",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      async get(
        params: FalWorkflowGetParams,
        signal?: AbortSignal
      ): Promise<FalWorkflowGetResponse> {
        return makeRequest<FalWorkflowGetResponse>(
          "GET",
          `/workflows/${encodeURIComponent(params.username)}/${encodeURIComponent(params.workflow_name)}`,
          undefined,
          signal
        );
      },
    }
  );

  const getV1 = {
    models: getV1Models,
    queue: getV1Queue,
    serverless: getV1Serverless,
    workflows: getV1Workflows,
  };

  // POST v1 namespace
  const postV1ModelsPricing = {
    // POST https://api.fal.ai/v1/models/pricing/estimate
    // Docs: https://docs.fal.ai
    estimate: Object.assign(
      async function estimate(
        req: FalEstimateRequest,
        signal?: AbortSignal
      ): Promise<FalEstimateResponse> {
        return makeRequest<FalEstimateResponse>(
          "POST",
          "/models/pricing/estimate",
          req as unknown as Record<string, unknown>,
          signal
        );
      },
      {
        schema: FalPricingEstimateRequestSchema,
      }
    ),
  };

  const postV1Models = {
    pricing: postV1ModelsPricing,
  };

  const postV1Queue = {
    // sig-ok: stylistic dotPath divergence from URL
    // POST https://api.fal.ai/v1/POST
    // Docs: https://docs.fal.ai
    submit: Object.assign(
      async function submit(
        params: FalQueueSubmitParams,
        signal?: AbortSignal
      ): Promise<FalQueueSubmitResponse> {
        const headers: Record<string, string> = {};
        if (params.priority) {
          headers["X-Fal-Queue-Priority"] = params.priority;
        }
        if (params.timeout !== undefined) {
          headers["X-Fal-Request-Timeout"] = String(params.timeout);
        }
        if (params.no_retry) {
          headers["X-Fal-No-Retry"] = "1";
        }
        if (params.runner_hint) {
          headers["X-Fal-Runner-Hint"] = params.runner_hint;
        }
        if (params.store_io) {
          headers["X-Fal-Store-IO"] = params.store_io;
        }
        if (params.object_lifecycle_preference) {
          headers["X-Fal-Object-Lifecycle-Preference"] =
            params.object_lifecycle_preference;
        }

        const path = params.webhook
          ? `/${params.endpoint_id}?fal_webhook=${encodeURIComponent(params.webhook)}`
          : `/${params.endpoint_id}`;

        return makeRequest<FalQueueSubmitResponse>(
          "POST",
          path,
          params.input,
          signal,
          headers,
          queueBaseURL
        );
      },
      {
        schema: FalQueueSubmitRequestSchema,
      }
    ),
  };

  const postV1ServerlessFiles = {
    // sig-ok: stylistic dotPath divergence from URL
    // POST https://api.fal.ai/v1/serverless/files/file/url/{param}
    // Docs: https://docs.fal.ai
    uploadUrl: Object.assign(
      async function uploadUrl(
        params: FalFilesUploadUrlParams,
        signal?: AbortSignal
      ): Promise<boolean> {
        return makeRequest<boolean>(
          "POST",
          `/serverless/files/file/url/${params.file}`,
          { url: params.url },
          signal
        );
      },
      {
        schema: FalFilesUploadUrlRequestSchema,
      }
    ),

    // sig-ok: stylistic dotPath divergence from URL
    // POST https://api.fal.ai/v1/serverless/files/file/local/{param}
    // Docs: https://docs.fal.ai
    uploadLocal: Object.assign(
      async function uploadLocal(
        params: FalFilesUploadLocalParams,
        signal?: AbortSignal
      ): Promise<boolean> {
        const formData = new FormData();
        formData.append(
          "file_upload",
          params.file,
          params.filename ?? "upload"
        );

        const queryParams: Record<string, unknown> = {};
        if (params.unzip) {
          queryParams.unzip = "true";
        }

        const res = await makeRawRequest(
          "POST",
          `/serverless/files/file/local/${params.target_path}`,
          formData,
          signal,
          Object.keys(queryParams).length > 0 ? queryParams : undefined
        );
        return (await res.json()) as boolean;
      },
      {
        schema: FalFilesUploadLocalRequestSchema,
      }
    ),
  };

  const postV1Serverless = {
    files: postV1ServerlessFiles,
  };

  const postV1 = {
    models: postV1Models,
    queue: postV1Queue,
    serverless: postV1Serverless,
  };

  // POST stream v1 namespace
  const postStreamV1ServerlessLogs = {
    // sig-ok: stylistic dotPath divergence from URL
    // POST https://api.fal.ai/v1/serverless/logs/stream
    // Docs: https://docs.fal.ai
    stream: Object.assign(
      async function stream(
        params?: FalLogsStreamParams,
        body?: FalLabelFilter[],
        signal?: AbortSignal
      ): Promise<AsyncIterable<FalLogEntry>> {
        const res = await makeStreamPostWithQuery(
          "/serverless/logs/stream",
          buildLogsQueryParams(params as unknown as Record<string, unknown>),
          body,
          signal
        );
        return sseToIterable<FalLogEntry>(res);
      },
      {
        schema: FalLogsStreamRequestSchema,
      }
    ),
  };

  const postStreamV1Serverless = {
    logs: postStreamV1ServerlessLogs,
  };

  const postStreamV1 = {
    serverless: postStreamV1Serverless,
  };

  const postStream = {
    v1: postStreamV1,
  };

  // DELETE v1 namespace
  const deleteV1ModelsRequests = {
    // DELETE https://api.fal.ai/v1/models/requests/{param}/payloads
    // Docs: https://docs.fal.ai
    payloads: Object.assign(
      async function payloads(
        params: FalDeletePayloadsParams,
        signal?: AbortSignal
      ): Promise<FalDeletePayloadsResponse> {
        const headers: Record<string, string> = {};
        if (params.idempotency_key) {
          headers["Idempotency-Key"] = params.idempotency_key;
        }
        return makeRequest<FalDeletePayloadsResponse>(
          "DELETE",
          `/models/requests/${params.request_id}/payloads`,
          undefined,
          signal,
          headers
        );
      },
      {
        schema: FalDeletePayloadsRequestSchema,
      }
    ),
  };

  const deleteV1Models = {
    requests: deleteV1ModelsRequests,
  };

  const deleteV1 = {
    models: deleteV1Models,
  };

  const aiV1 = {
    models,
    queue,
    serverless,
    workflows,
  };

  return {
    // api.fal.ai/v1/* — management API
    v1: aiV1,
    // fal.run/* — synchronous inference
    run,
    // rest.fal.ai/* — CDN storage uploads
    storage,
    // Verb-prefixed API surface
    get: { v1: getV1 },
    post: { v1: postV1, run, stream: postStream },
    delete: { v1: deleteV1 },
  };
}
