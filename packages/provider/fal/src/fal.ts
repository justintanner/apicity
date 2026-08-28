import {
  ApicitySchema,
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
  FalQueueResultParams,
  FalQueueResultResponse,
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
  FalSeedance2p0ImageToVideoRequest,
  FalSeedance2p0ImageToVideoResponse,
  FalSeedance2p0TextToVideoRequest,
  FalSeedance2p0TextToVideoResponse,
  FalSeedance2p0FastImageToVideoRequest,
  FalSeedance2p0FastImageToVideoResponse,
  FalSeedance2p0FastTextToVideoRequest,
  FalSeedance2p0FastTextToVideoResponse,
  FalSeedance2p0ReferenceToVideoRequest,
  FalSeedance2p0ReferenceToVideoResponse,
  FalSeedance2p0FastReferenceToVideoRequest,
  FalSeedance2p0FastReferenceToVideoResponse,
  FalSeedance2p5TextToVideoRequest,
  FalSeedance2p5TextToVideoResponse,
  FalSeedance2p5ImageToVideoRequest,
  FalSeedance2p5ImageToVideoResponse,
  FalSeedance2p5ReferenceToVideoRequest,
  FalSeedance2p5ReferenceToVideoResponse,
  FalLtx2p5ImageToVideoProRequest,
  FalLtx2p5ImageToVideoProResponse,
  FalLtx2p5ImageToVideoFastRequest,
  FalLtx2p5ImageToVideoFastResponse,
  FalNanoBananaProTextToImageRequest,
  FalNanoBananaProTextToImageResponse,
  FalNanoBananaProEditRequest,
  FalNanoBananaProEditResponse,
  FalNanoBanana2TextToImageRequest,
  FalNanoBanana2TextToImageResponse,
  FalNanoBanana2EditRequest,
  FalNanoBanana2EditResponse,
  FalNanoBanana2LiteTextToImageRequest,
  FalNanoBanana2LiteTextToImageResponse,
  FalNanoBanana2LiteEditRequest,
  FalNanoBanana2LiteEditResponse,
  FalVirtualTryOnRequest,
  FalVirtualTryOnResponse,
  FalTopazUpscaleImagePrecisionRequest,
  FalTopazUpscaleImagePrecisionResponse,
  FalTopazUpscaleVideoPrecisionRequest,
  FalTopazUpscaleVideoPrecisionResponse,
  FalMeshyV7ImageTo3dRequest,
  FalMeshyV7ImageTo3dResponse,
  FalSeedreamV5LiteEditRequest,
  FalSeedreamV5LiteEditResponse,
  FalSeedreamV5LiteTextToImageRequest,
  FalSeedreamV5LiteTextToImageResponse,
  FalSeedreamV5ProLayerizeRequest,
  FalSeedreamV5ProLayerizeResponse,
  FalMinimaxH3TextToVideoRequest,
  FalMinimaxH3TextToVideoResponse,
  FalMinimaxH3ImageToVideoRequest,
  FalMinimaxH3ImageToVideoResponse,
  FalSeedSpeechTtsV2Request,
  FalSeedSpeechTtsV2Response,
  FalMinimaxMusic3Request,
  FalMinimaxMusic3Response,
  FalElevenlabsSpeechToTextScribeV2Request,
  FalElevenlabsSpeechToTextScribeV2Response,
  FalAlibabaQwenImage3TextToImageRequest,
  FalAlibabaQwenImage3EditRequest,
  FalAlibabaQwenImage3EditResponse,
  FalWan3p0TextToVideoRequest,
  FalWan3p0TextToVideoResponse,
  FalWan3p0ImageToVideoRequest,
  FalWan3p0ImageToVideoResponse,
  FalWan3p0ReferenceToVideoRequest,
  FalWan3p0ReferenceToVideoResponse,
  FalMinimaxH3ReferenceToVideoRequest,
  FalMinimaxH3ReferenceToVideoResponse,
  FalAlibabaQwenImage3TextToImageResponse,
  FalWanV2p7TextToImageRequest,
  FalWanV2p7TextToImageResponse,
  FalWanV2p7EditRequest,
  FalWanV2p7EditResponse,
  FalWanV2p7TextToVideoRequest,
  FalWanV2p7TextToVideoResponse,
  FalWanV2p7ImageToVideoRequest,
  FalWanV2p7ImageToVideoResponse,
  FalWanV2p7ReferenceToVideoRequest,
  FalWanV2p7ReferenceToVideoResponse,
  FalWanV2p7EditVideoRequest,
  FalWanV2p7EditVideoResponse,
  FalFlux3TextToVideoRequest,
  FalFlux3ImageToVideoRequest,
  FalFlux3FirstLastFrameToVideoRequest,
  FalFlux3KeyframesToVideoRequest,
  FalFlux3ExtendVideoRequest,
  FalFlux3VideoResponse,
  FalFluxVideoUpscaleRequest,
  FalFluxVideoUpscaleResponse,
  FalXaiGrokImagineImageRequest,
  FalXaiGrokImagineImageResponse,
  FalXaiGrokImagineImageV2p0TextToImageRequest,
  FalXaiGrokImagineImageV2p0TextToImageResponse,
  FalXaiGrokImagineImageV2p0EditRequest,
  FalXaiGrokImagineImageV2p0EditResponse,
  FalXaiGrokImagineImageEditRequest,
  FalXaiGrokImagineImageEditResponse,
  FalQwenImageRequest,
  FalQwenImageResponse,
  FalQwenImageEditRequest,
  FalQwenImageEditResponse,
  FalGptImage1p5Request,
  FalGptImage1p5Response,
  FalGptImage1p5EditRequest,
  FalGptImage1p5EditResponse,
  FalNanoBananaTextToImageRequest,
  FalNanoBananaTextToImageResponse,
  FalNanoBananaEditRequest,
  FalNanoBananaEditResponse,
  FalXaiGrokImagineVideoImageToVideoRequest,
  FalXaiGrokImagineVideoImageToVideoResponse,
  FalXaiGrokImagineVideoReferenceToVideoRequest,
  FalXaiGrokImagineVideoReferenceToVideoResponse,
  FalXaiGrokImagineVideoExtendVideoRequest,
  FalXaiGrokImagineVideoExtendVideoResponse,
  FalXaiGrokImagineVideoEditVideoRequest,
  FalXaiGrokImagineVideoEditVideoResponse,
  FalVeo3p1TextToVideoRequest,
  FalVeo3p1TextToVideoResponse,
  FalVeo3p1ImageToVideoRequest,
  FalVeo3p1ImageToVideoResponse,
  FalStorageLifecycle,
  FalStorageUploadInitiateParams,
  FalStorageUploadInitiateMultipartParams,
  FalStorageUploadCompleteMultipartParams,
  FalStorageUploadInitiateResponse,
  FalStorageNamespace,
  FalKlingVideoV3ProImageToVideoRequest,
  FalKlingVideoV3ProImageToVideoResponse,
  FalKlingVideoV3ProTextToVideoRequest,
  FalKlingVideoV3ProTextToVideoResponse,
  FalKlingVideoV3StandardImageToVideoRequest,
  FalKlingVideoV3StandardImageToVideoResponse,
  FalKlingVideoV3StandardTextToVideoRequest,
  FalKlingVideoV3StandardTextToVideoResponse,
  FalKlingVideoO3p4kImageToVideoRequest,
  FalKlingVideoO3p4kImageToVideoResponse,
  FalKlingVideoO3p4kReferenceToVideoRequest,
  FalKlingVideoO3p4kReferenceToVideoResponse,
  FalKlingVideoO3p4kTextToVideoRequest,
  FalKlingVideoO3p4kTextToVideoResponse,
  FalSora2TextToVideoRequest,
  FalSora2TextToVideoResponse,
  FalSora2ImageToVideoRequest,
  FalSora2ImageToVideoResponse,
  FalHunyuanImageV3InstructEditRequest,
  FalHunyuanImageV3InstructEditResponse,
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
  FalSeedance2p5TextToVideoRequestSchema,
  FalSeedance2p5ImageToVideoRequestSchema,
  FalSeedance2p5ReferenceToVideoRequestSchema,
  FalLtx2p5ImageToVideoProRequestSchema,
  FalLtx2p5ImageToVideoFastRequestSchema,
  FalNanoBananaProTextToImageRequestSchema,
  FalNanoBananaProEditRequestSchema,
  FalNanoBanana2TextToImageRequestSchema,
  FalNanoBanana2EditRequestSchema,
  FalNanoBanana2LiteTextToImageRequestSchema,
  FalNanoBanana2LiteEditRequestSchema,
  FalVirtualTryOnRequestSchema,
  FalTopazUpscaleImagePrecisionRequestSchema,
  FalTopazUpscaleVideoPrecisionRequestSchema,
  FalMeshyV7ImageTo3dRequestSchema,
  FalSeedreamV5LiteEditRequestSchema,
  FalSeedreamV5LiteTextToImageRequestSchema,
  FalSeedreamV5ProLayerizeRequestSchema,
  FalMinimaxH3TextToVideoRequestSchema,
  FalMinimaxH3ImageToVideoRequestSchema,
  FalSeedSpeechTtsV2RequestSchema,
  FalMinimaxMusic3RequestSchema,
  FalElevenlabsSpeechToTextScribeV2RequestSchema,
  FalAlibabaQwenImage3TextToImageRequestSchema,
  FalAlibabaQwenImage3EditRequestSchema,
  FalWan3p0TextToVideoRequestSchema,
  FalWan3p0ImageToVideoRequestSchema,
  FalWan3p0ReferenceToVideoRequestSchema,
  FalMinimaxH3ReferenceToVideoRequestSchema,
  FalWanV2p7TextToImageRequestSchema,
  FalWanV2p7EditRequestSchema,
  FalWanV2p7TextToVideoRequestSchema,
  FalWanV2p7ImageToVideoRequestSchema,
  FalWanV2p7ReferenceToVideoRequestSchema,
  FalWanV2p7EditVideoRequestSchema,
  FalFlux3TextToVideoRequestSchema,
  FalFlux3ImageToVideoRequestSchema,
  FalFlux3FirstLastFrameToVideoRequestSchema,
  FalFlux3KeyframesToVideoRequestSchema,
  FalFlux3ExtendVideoRequestSchema,
  FalFluxVideoUpscaleRequestSchema,
  FalXaiGrokImagineImageRequestSchema,
  FalXaiGrokImagineImageV2p0TextToImageRequestSchema,
  FalXaiGrokImagineImageV2p0EditRequestSchema,
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
  FalKlingVideoO3p4kImageToVideoRequestSchema,
  FalKlingVideoO3p4kReferenceToVideoRequestSchema,
  FalKlingVideoO3p4kTextToVideoRequestSchema,
  FalSora2TextToVideoRequestSchema,
  FalSora2ImageToVideoRequestSchema,
  FalHunyuanImageV3InstructEditRequestSchema,
} from "./zod";
import { attachExamples } from "./example";

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

export function createFal(opts: FalOptions): FalProvider {
  const baseURL = opts.baseURL ?? "https://api.fal.ai/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    method: "GET" | "POST" | "DELETE" | "PUT",
    path: string,
    // Accept any typed request/params object directly — callers no longer
    // launder their interface through `as unknown as Record<string, unknown>`.
    paramsOrBody?: object,
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
        ? `${base}${path}${buildQueryString(paramsOrBody as Record<string, unknown>)}`
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

  // Schema-attached endpoint builder. Collapses the repeated
  // `Object.assign(async fn, { schema })` run wrappers: each endpoint declares
  // only its HTTP method, path, request/response types, and zod `.schema`. The
  // typed request object flows straight into makeRequest (no
  // `Record<string, unknown>` laundering); `opts.defaults` are merged under the
  // request and `opts.base` routes to an alternate host (e.g. fal.run).
  function jsonBody<TReq extends object, TResp>(
    method: "POST" | "DELETE" | "PUT",
    path: string,
    schema: ApicitySchema<TReq>,
    opts?: { base?: string; defaults?: Partial<TReq> }
  ): {
    (params: TReq, signal?: AbortSignal): Promise<TResp>;
    schema: ApicitySchema<TReq>;
  } {
    return Object.assign(
      (params: TReq, signal?: AbortSignal): Promise<TResp> =>
        makeRequest<TResp>(
          method,
          path,
          opts?.defaults ? { ...opts.defaults, ...params } : params,
          signal,
          undefined,
          opts?.base
        ),
      { schema }
    );
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
        params,
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
            req,
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
    // GET https://api.fal.ai/v1/models/requests/by-endpoint
    // Docs: https://docs.fal.ai
    byEndpoint: async function byEndpoint(
      params: FalRequestsParams,
      signal?: AbortSignal
    ): Promise<FalRequestsResponse> {
      return makeRequest<FalRequestsResponse>(
        "GET",
        "/models/requests/by-endpoint",
        params,
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
        params,
        signal
      );
    },
    {
      pricing,

      // GET https://api.fal.ai/v1/models/usage
      // Docs: https://docs.fal.ai
      async usage(
        params?: FalUsageParams,
        signal?: AbortSignal
      ): Promise<FalUsageResponse> {
        return makeRequest<FalUsageResponse>(
          "GET",
          "/models/usage",
          params,
          signal
        );
      },

      // GET https://api.fal.ai/v1/models/analytics
      // Docs: https://docs.fal.ai
      async analytics(
        params: FalAnalyticsParams,
        signal?: AbortSignal
      ): Promise<FalAnalyticsResponse> {
        return makeRequest<FalAnalyticsResponse>(
          "GET",
          "/models/analytics",
          params,
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
  // POST https://fal.run/alibaba/qwen-image-3/text-to-image
  // Docs: https://fal.ai/models/alibaba/qwen-image-3/text-to-image/api
  const alibabaQwenImage3TextToImage = jsonBody<
    FalAlibabaQwenImage3TextToImageRequest,
    FalAlibabaQwenImage3TextToImageResponse
  >(
    "POST",
    "/alibaba/qwen-image-3/text-to-image",
    FalAlibabaQwenImage3TextToImageRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/alibaba/qwen-image-3/edit
  // Docs: https://fal.ai/models/alibaba/qwen-image-3/edit/api
  const alibabaQwenImage3Edit = jsonBody<
    FalAlibabaQwenImage3EditRequest,
    FalAlibabaQwenImage3EditResponse
  >(
    "POST",
    "/alibaba/qwen-image-3/edit",
    FalAlibabaQwenImage3EditRequestSchema,
    {
      base: runBaseURL,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/alibaba/wan-3.0/text-to-video
  // Docs: https://fal.ai/models/alibaba/wan-3.0/text-to-video/api
  const alibabaWan3p0TextToVideo = jsonBody<
    FalWan3p0TextToVideoRequest,
    FalWan3p0TextToVideoResponse
  >(
    "POST",
    "/alibaba/wan-3.0/text-to-video",
    FalWan3p0TextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/alibaba/wan-3.0/image-to-video
  // Docs: https://fal.ai/models/alibaba/wan-3.0/image-to-video/api
  const alibabaWan3p0ImageToVideo = jsonBody<
    FalWan3p0ImageToVideoRequest,
    FalWan3p0ImageToVideoResponse
  >(
    "POST",
    "/alibaba/wan-3.0/image-to-video",
    FalWan3p0ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/alibaba/wan-3.0/reference-to-video
  // Docs: https://fal.ai/models/alibaba/wan-3.0/reference-to-video/api
  const alibabaWan3p0ReferenceToVideo = jsonBody<
    FalWan3p0ReferenceToVideoRequest,
    FalWan3p0ReferenceToVideoResponse
  >(
    "POST",
    "/alibaba/wan-3.0/reference-to-video",
    FalWan3p0ReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/alibaba/wan-3.0-prime/text-to-video
  // Docs: https://fal.ai/models/alibaba/wan-3.0-prime/text-to-video/api
  const alibabaWan3p0PrimeTextToVideo = jsonBody<
    FalWan3p0TextToVideoRequest,
    FalWan3p0TextToVideoResponse
  >(
    "POST",
    "/alibaba/wan-3.0-prime/text-to-video",
    FalWan3p0TextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/alibaba/wan-3.0-prime/image-to-video
  // Docs: https://fal.ai/models/alibaba/wan-3.0-prime/image-to-video/api
  const alibabaWan3p0PrimeImageToVideo = jsonBody<
    FalWan3p0ImageToVideoRequest,
    FalWan3p0ImageToVideoResponse
  >(
    "POST",
    "/alibaba/wan-3.0-prime/image-to-video",
    FalWan3p0ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/alibaba/wan-3.0-prime/reference-to-video
  // Docs: https://fal.ai/models/alibaba/wan-3.0-prime/reference-to-video/api
  const alibabaWan3p0PrimeReferenceToVideo = jsonBody<
    FalWan3p0ReferenceToVideoRequest,
    FalWan3p0ReferenceToVideoResponse
  >(
    "POST",
    "/alibaba/wan-3.0-prime/reference-to-video",
    FalWan3p0ReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/blackforestlabs/flux-3/text-to-video
  // Docs: https://fal.ai/models/blackforestlabs/flux-3/text-to-video/api
  const blackforestlabsFlux3TextToVideo = jsonBody<
    FalFlux3TextToVideoRequest,
    FalFlux3VideoResponse
  >(
    "POST",
    "/blackforestlabs/flux-3/text-to-video",
    FalFlux3TextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/blackforestlabs/flux-3/image-to-video
  // Docs: https://fal.ai/models/blackforestlabs/flux-3/image-to-video/api
  const blackforestlabsFlux3ImageToVideo = jsonBody<
    FalFlux3ImageToVideoRequest,
    FalFlux3VideoResponse
  >(
    "POST",
    "/blackforestlabs/flux-3/image-to-video",
    FalFlux3ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/blackforestlabs/flux-3/first-last-frame-to-video
  // Docs: https://fal.ai/models/blackforestlabs/flux-3/first-last-frame-to-video/api
  const blackforestlabsFlux3FirstLastFrameToVideo = jsonBody<
    FalFlux3FirstLastFrameToVideoRequest,
    FalFlux3VideoResponse
  >(
    "POST",
    "/blackforestlabs/flux-3/first-last-frame-to-video",
    FalFlux3FirstLastFrameToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/blackforestlabs/flux-3/keyframes-to-video
  // Docs: https://fal.ai/models/blackforestlabs/flux-3/keyframes-to-video/api
  const blackforestlabsFlux3KeyframesToVideo = jsonBody<
    FalFlux3KeyframesToVideoRequest,
    FalFlux3VideoResponse
  >(
    "POST",
    "/blackforestlabs/flux-3/keyframes-to-video",
    FalFlux3KeyframesToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/blackforestlabs/flux-3/extend-video
  // Docs: https://fal.ai/models/blackforestlabs/flux-3/extend-video/api
  const blackforestlabsFlux3ExtendVideo = jsonBody<
    FalFlux3ExtendVideoRequest,
    FalFlux3VideoResponse
  >(
    "POST",
    "/blackforestlabs/flux-3/extend-video",
    FalFlux3ExtendVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/blackforestlabs/flux-video-upscale
  // Docs: https://fal.ai/models/blackforestlabs/flux-video-upscale/api
  const blackforestlabsFluxVideoUpscale = jsonBody<
    FalFluxVideoUpscaleRequest,
    FalFluxVideoUpscaleResponse
  >(
    "POST",
    "/blackforestlabs/flux-video-upscale",
    FalFluxVideoUpscaleRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.0/image-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0ImageToVideo = jsonBody<
    FalSeedance2p0ImageToVideoRequest,
    FalSeedance2p0ImageToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.0/image-to-video",
    FalSeedance2p0ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.0/text-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0TextToVideo = jsonBody<
    FalSeedance2p0TextToVideoRequest,
    FalSeedance2p0TextToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.0/text-to-video",
    FalSeedance2p0TextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.0/fast/image-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0FastImageToVideo = jsonBody<
    FalSeedance2p0FastImageToVideoRequest,
    FalSeedance2p0FastImageToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.0/fast/image-to-video",
    FalSeedance2p0FastImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.0/fast/text-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0FastTextToVideo = jsonBody<
    FalSeedance2p0FastTextToVideoRequest,
    FalSeedance2p0FastTextToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.0/fast/text-to-video",
    FalSeedance2p0FastTextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.0/reference-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0ReferenceToVideo = jsonBody<
    FalSeedance2p0ReferenceToVideoRequest,
    FalSeedance2p0ReferenceToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.0/reference-to-video",
    FalSeedance2p0ReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.0/fast/reference-to-video
  // Docs: https://docs.fal.ai
  const bytedanceSeedance2p0FastReferenceToVideo = jsonBody<
    FalSeedance2p0FastReferenceToVideoRequest,
    FalSeedance2p0FastReferenceToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.0/fast/reference-to-video",
    FalSeedance2p0FastReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.5/text-to-video
  // Docs: https://fal.ai/models/bytedance/seedance-2.5/text-to-video/api
  const bytedanceSeedance2p5TextToVideo = jsonBody<
    FalSeedance2p5TextToVideoRequest,
    FalSeedance2p5TextToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.5/text-to-video",
    FalSeedance2p5TextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.5/image-to-video
  // Docs: https://fal.ai/models/bytedance/seedance-2.5/image-to-video/api
  const bytedanceSeedance2p5ImageToVideo = jsonBody<
    FalSeedance2p5ImageToVideoRequest,
    FalSeedance2p5ImageToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.5/image-to-video",
    FalSeedance2p5ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/bytedance/seedance-2.5/reference-to-video
  // Docs: https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api
  const bytedanceSeedance2p5ReferenceToVideo = jsonBody<
    FalSeedance2p5ReferenceToVideoRequest,
    FalSeedance2p5ReferenceToVideoResponse
  >(
    "POST",
    "/bytedance/seedance-2.5/reference-to-video",
    FalSeedance2p5ReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // POST https://fal.run/lightricks/ltx-2.5/image-to-video/pro
  // Docs: https://fal.ai/models/lightricks/ltx-2.5/image-to-video/pro/api
  const lightricksLtx2p5ImageToVideoPro = jsonBody<
    FalLtx2p5ImageToVideoProRequest,
    FalLtx2p5ImageToVideoProResponse
  >(
    "POST",
    "/lightricks/ltx-2.5/image-to-video/pro",
    FalLtx2p5ImageToVideoProRequestSchema,
    { base: runBaseURL }
  );
  // POST https://fal.run/lightricks/ltx-2.5/image-to-video/fast
  // Docs: https://fal.ai/models/lightricks/ltx-2.5/image-to-video/fast/api
  const lightricksLtx2p5ImageToVideoFast = jsonBody<
    FalLtx2p5ImageToVideoFastRequest,
    FalLtx2p5ImageToVideoFastResponse
  >(
    "POST",
    "/lightricks/ltx-2.5/image-to-video/fast",
    FalLtx2p5ImageToVideoFastRequestSchema,
    { base: runBaseURL }
  );
  // POST https://fal.run/minimax/h3/text-to-video
  // Docs: https://fal.ai/models/minimax/h3/text-to-video/api
  const minimaxH3TextToVideo = jsonBody<
    FalMinimaxH3TextToVideoRequest,
    FalMinimaxH3TextToVideoResponse
  >("POST", "/minimax/h3/text-to-video", FalMinimaxH3TextToVideoRequestSchema, {
    base: runBaseURL,
  });
  // POST https://fal.run/minimax/h3/image-to-video
  // Docs: https://fal.ai/models/minimax/h3/image-to-video/api
  const minimaxH3ImageToVideo = jsonBody<
    FalMinimaxH3ImageToVideoRequest,
    FalMinimaxH3ImageToVideoResponse
  >(
    "POST",
    "/minimax/h3/image-to-video",
    FalMinimaxH3ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/nano-banana-pro/edit
  // Docs: https://docs.fal.ai
  const nanoBananaProEdit = jsonBody<
    FalNanoBananaProEditRequest,
    FalNanoBananaProEditResponse
  >("POST", "/fal-ai/nano-banana-pro/edit", FalNanoBananaProEditRequestSchema, {
    base: runBaseURL,
    defaults: { safety_tolerance: "6" },
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/nano-banana-pro
  // Docs: https://docs.fal.ai
  const nanoBananaProTextToImage = jsonBody<
    FalNanoBananaProTextToImageRequest,
    FalNanoBananaProTextToImageResponse
  >(
    "POST",
    "/fal-ai/nano-banana-pro",
    FalNanoBananaProTextToImageRequestSchema,
    { base: runBaseURL, defaults: { safety_tolerance: "6" } }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/nano-banana
  // Docs: https://docs.fal.ai
  const nanoBananaTextToImage = jsonBody<
    FalNanoBananaTextToImageRequest,
    FalNanoBananaTextToImageResponse
  >("POST", "/fal-ai/nano-banana", FalNanoBananaTextToImageRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/nano-banana/edit
  // Docs: https://docs.fal.ai
  const nanoBananaEdit = jsonBody<
    FalNanoBananaEditRequest,
    FalNanoBananaEditResponse
  >("POST", "/fal-ai/nano-banana/edit", FalNanoBananaEditRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/nano-banana-2
  // Docs: https://docs.fal.ai
  const nanoBanana2TextToImage = jsonBody<
    FalNanoBanana2TextToImageRequest,
    FalNanoBanana2TextToImageResponse
  >("POST", "/fal-ai/nano-banana-2", FalNanoBanana2TextToImageRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/nano-banana-2/edit
  // Docs: https://docs.fal.ai
  const nanoBanana2Edit = jsonBody<
    FalNanoBanana2EditRequest,
    FalNanoBanana2EditResponse
  >("POST", "/fal-ai/nano-banana-2/edit", FalNanoBanana2EditRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/google/nano-banana-2-lite
  // Docs: https://fal.ai/models/google/nano-banana-2-lite/api
  const nanoBanana2LiteTextToImage = jsonBody<
    FalNanoBanana2LiteTextToImageRequest,
    FalNanoBanana2LiteTextToImageResponse
  >(
    "POST",
    "/google/nano-banana-2-lite",
    FalNanoBanana2LiteTextToImageRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/google/nano-banana-lite/edit
  // Docs: https://fal.ai/models/google/nano-banana-lite/edit/api
  const nanoBanana2LiteEdit = jsonBody<
    FalNanoBanana2LiteEditRequest,
    FalNanoBanana2LiteEditResponse
  >(
    "POST",
    "/google/nano-banana-lite/edit",
    FalNanoBanana2LiteEditRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/google/virtual-try-on
  // Docs: https://fal.ai/models/google/virtual-try-on/api
  const virtualTryOn = jsonBody<
    FalVirtualTryOnRequest,
    FalVirtualTryOnResponse
  >("POST", "/google/virtual-try-on", FalVirtualTryOnRequestSchema, {
    base: runBaseURL,
  });

  // POST https://fal.run/topaz/upscale/image/precision
  // Docs: https://fal.ai/models/topaz/upscale/image/precision/api
  const topazUpscaleImagePrecision = jsonBody<
    FalTopazUpscaleImagePrecisionRequest,
    FalTopazUpscaleImagePrecisionResponse
  >(
    "POST",
    "/topaz/upscale/image/precision",
    FalTopazUpscaleImagePrecisionRequestSchema,
    { base: runBaseURL }
  );
  // POST https://fal.run/topaz/upscale/video/precision
  // Docs: https://fal.ai/models/topaz/upscale/video/precision/api
  const topazUpscaleVideoPrecision = jsonBody<
    FalTopazUpscaleVideoPrecisionRequest,
    FalTopazUpscaleVideoPrecisionResponse
  >(
    "POST",
    "/topaz/upscale/video/precision",
    FalTopazUpscaleVideoPrecisionRequestSchema,
    { base: runBaseURL }
  );
  // POST https://fal.run/meshy/v7/image-to-3d
  // Docs: https://fal.ai/models/meshy/v7/image-to-3d/api
  const meshyV7ImageTo3d = jsonBody<
    FalMeshyV7ImageTo3dRequest,
    FalMeshyV7ImageTo3dResponse
  >("POST", "/meshy/v7/image-to-3d", FalMeshyV7ImageTo3dRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/bytedance/seedream/v5/lite/edit
  // Docs: https://docs.fal.ai
  const seedreamV5LiteEdit = jsonBody<
    FalSeedreamV5LiteEditRequest,
    FalSeedreamV5LiteEditResponse
  >(
    "POST",
    "/fal-ai/bytedance/seedream/v5/lite/edit",
    FalSeedreamV5LiteEditRequestSchema,
    { base: runBaseURL, defaults: { enable_safety_checker: false } }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/bytedance/seedream/v5/lite/text-to-image
  // Docs: https://docs.fal.ai
  const seedreamV5LiteTextToImage = jsonBody<
    FalSeedreamV5LiteTextToImageRequest,
    FalSeedreamV5LiteTextToImageResponse
  >(
    "POST",
    "/fal-ai/bytedance/seedream/v5/lite/text-to-image",
    FalSeedreamV5LiteTextToImageRequestSchema,
    { base: runBaseURL, defaults: { enable_safety_checker: false } }
  );

  // POST https://fal.run/bytedance/seedream/v5/pro/layerize
  // Docs: https://fal.ai/models/bytedance/seedream/v5/pro/layerize/api
  const seedreamV5ProLayerize = jsonBody<
    FalSeedreamV5ProLayerizeRequest,
    FalSeedreamV5ProLayerizeResponse
  >(
    "POST",
    "/bytedance/seedream/v5/pro/layerize",
    FalSeedreamV5ProLayerizeRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/bytedance/seed-speech/tts/v2
  // Docs: https://fal.ai/models/fal-ai/bytedance/seed-speech/tts/v2/api
  const seedSpeechTtsV2 = jsonBody<
    FalSeedSpeechTtsV2Request,
    FalSeedSpeechTtsV2Response
  >(
    "POST",
    "/fal-ai/bytedance/seed-speech/tts/v2",
    FalSeedSpeechTtsV2RequestSchema,
    { base: runBaseURL }
  );

  // POST https://fal.run/minimax/music-3
  // Docs: https://fal.ai/models/minimax/music-3/api
  const minimaxMusic3 = jsonBody<
    FalMinimaxMusic3Request,
    FalMinimaxMusic3Response
  >("POST", "/minimax/music-3", FalMinimaxMusic3RequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/elevenlabs/speech-to-text/scribe-v2
  // Docs: https://docs.fal.ai
  const elevenlabsSpeechToTextScribeV2 = jsonBody<
    FalElevenlabsSpeechToTextScribeV2Request,
    FalElevenlabsSpeechToTextScribeV2Response
  >(
    "POST",
    "/fal-ai/elevenlabs/speech-to-text/scribe-v2",
    FalElevenlabsSpeechToTextScribeV2RequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/wan/v2.7/text-to-image
  // Docs: https://docs.fal.ai
  const wanV2p7TextToImage = jsonBody<
    FalWanV2p7TextToImageRequest,
    FalWanV2p7TextToImageResponse
  >(
    "POST",
    "/fal-ai/wan/v2.7/text-to-image",
    FalWanV2p7TextToImageRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/wan/v2.7/edit
  // Docs: https://docs.fal.ai
  const wanV2p7Edit = jsonBody<FalWanV2p7EditRequest, FalWanV2p7EditResponse>(
    "POST",
    "/fal-ai/wan/v2.7/edit",
    FalWanV2p7EditRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/wan/v2.7/pro/text-to-image
  // Docs: https://docs.fal.ai
  const wanV2p7ProTextToImage = jsonBody<
    FalWanV2p7TextToImageRequest,
    FalWanV2p7TextToImageResponse
  >(
    "POST",
    "/fal-ai/wan/v2.7/pro/text-to-image",
    FalWanV2p7TextToImageRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/wan/v2.7/pro/edit
  // Docs: https://docs.fal.ai
  const wanV2p7ProEdit = jsonBody<
    FalWanV2p7EditRequest,
    FalWanV2p7EditResponse
  >("POST", "/fal-ai/wan/v2.7/pro/edit", FalWanV2p7EditRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/wan/v2.7/text-to-video
  // Docs: https://docs.fal.ai
  const wanV2p7TextToVideo = jsonBody<
    FalWanV2p7TextToVideoRequest,
    FalWanV2p7TextToVideoResponse
  >(
    "POST",
    "/fal-ai/wan/v2.7/text-to-video",
    FalWanV2p7TextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/wan/v2.7/image-to-video
  // Docs: https://docs.fal.ai
  const wanV2p7ImageToVideo = jsonBody<
    FalWanV2p7ImageToVideoRequest,
    FalWanV2p7ImageToVideoResponse
  >(
    "POST",
    "/fal-ai/wan/v2.7/image-to-video",
    FalWanV2p7ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/wan/v2.7/reference-to-video
  // Docs: https://docs.fal.ai
  const wanV2p7ReferenceToVideo = jsonBody<
    FalWanV2p7ReferenceToVideoRequest,
    FalWanV2p7ReferenceToVideoResponse
  >(
    "POST",
    "/fal-ai/wan/v2.7/reference-to-video",
    FalWanV2p7ReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // POST https://fal.run/minimax/h3/reference-to-video
  // Docs: https://fal.ai/models/minimax/h3/reference-to-video/api
  const minimaxH3ReferenceToVideo = jsonBody<
    FalMinimaxH3ReferenceToVideoRequest,
    FalMinimaxH3ReferenceToVideoResponse
  >(
    "POST",
    "/minimax/h3/reference-to-video",
    FalMinimaxH3ReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/wan/v2.7/edit-video
  // Docs: https://docs.fal.ai
  const wanV2p7EditVideo = jsonBody<
    FalWanV2p7EditVideoRequest,
    FalWanV2p7EditVideoResponse
  >("POST", "/fal-ai/wan/v2.7/edit-video", FalWanV2p7EditVideoRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/xai/grok-imagine-image/edit
  // Docs: https://docs.fal.ai
  const xaiGrokImagineImageEdit = jsonBody<
    FalXaiGrokImagineImageEditRequest,
    FalXaiGrokImagineImageEditResponse
  >(
    "POST",
    "/xai/grok-imagine-image/edit",
    FalXaiGrokImagineImageEditRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/xai/grok-imagine-image/v2.0/text-to-image
  // Docs: https://fal.ai/models/xai/grok-imagine-image/v2.0/text-to-image/api
  const xaiGrokImagineImageV2p0TextToImage = jsonBody<
    FalXaiGrokImagineImageV2p0TextToImageRequest,
    FalXaiGrokImagineImageV2p0TextToImageResponse
  >(
    "POST",
    "/xai/grok-imagine-image/v2.0/text-to-image",
    FalXaiGrokImagineImageV2p0TextToImageRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/xai/grok-imagine-image/v2.0/edit
  // Docs: https://fal.ai/models/xai/grok-imagine-image/v2.0/edit/api
  const xaiGrokImagineImageV2p0Edit = jsonBody<
    FalXaiGrokImagineImageV2p0EditRequest,
    FalXaiGrokImagineImageV2p0EditResponse
  >(
    "POST",
    "/xai/grok-imagine-image/v2.0/edit",
    FalXaiGrokImagineImageV2p0EditRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/sora-2/text-to-video
  // Docs: https://docs.fal.ai
  const sora2TextToVideo = jsonBody<
    FalSora2TextToVideoRequest,
    FalSora2TextToVideoResponse
  >("POST", "/fal-ai/sora-2/text-to-video", FalSora2TextToVideoRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/sora-2/image-to-video
  // Docs: https://docs.fal.ai
  const sora2ImageToVideo = jsonBody<
    FalSora2ImageToVideoRequest,
    FalSora2ImageToVideoResponse
  >(
    "POST",
    "/fal-ai/sora-2/image-to-video",
    FalSora2ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/hunyuan-image/v3/instruct/edit
  // Docs: https://docs.fal.ai
  const hunyuanImageV3InstructEdit = jsonBody<
    FalHunyuanImageV3InstructEditRequest,
    FalHunyuanImageV3InstructEditResponse
  >(
    "POST",
    "/fal-ai/hunyuan-image/v3/instruct/edit",
    FalHunyuanImageV3InstructEditRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/kling-video/v3/pro/image-to-video
  // Docs: https://docs.fal.ai
  const klingVideoV3ProImageToVideo = jsonBody<
    FalKlingVideoV3ProImageToVideoRequest,
    FalKlingVideoV3ProImageToVideoResponse
  >(
    "POST",
    "/fal-ai/kling-video/v3/pro/image-to-video",
    FalKlingVideoV3ProImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/kling-video/v3/pro/text-to-video
  // Docs: https://docs.fal.ai
  const klingVideoV3ProTextToVideo = jsonBody<
    FalKlingVideoV3ProTextToVideoRequest,
    FalKlingVideoV3ProTextToVideoResponse
  >(
    "POST",
    "/fal-ai/kling-video/v3/pro/text-to-video",
    FalKlingVideoV3ProTextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/kling-video/v3/standard/image-to-video
  // Docs: https://docs.fal.ai
  const klingVideoV3StandardImageToVideo = jsonBody<
    FalKlingVideoV3StandardImageToVideoRequest,
    FalKlingVideoV3StandardImageToVideoResponse
  >(
    "POST",
    "/fal-ai/kling-video/v3/standard/image-to-video",
    FalKlingVideoV3StandardImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/kling-video/v3/standard/text-to-video
  // Docs: https://docs.fal.ai
  const klingVideoV3StandardTextToVideo = jsonBody<
    FalKlingVideoV3StandardTextToVideoRequest,
    FalKlingVideoV3StandardTextToVideoResponse
  >(
    "POST",
    "/fal-ai/kling-video/v3/standard/text-to-video",
    FalKlingVideoV3StandardTextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/kling-video/o3/4k/image-to-video
  // Docs: https://docs.fal.ai
  const klingVideoO3p4kImageToVideo = jsonBody<
    FalKlingVideoO3p4kImageToVideoRequest,
    FalKlingVideoO3p4kImageToVideoResponse
  >(
    "POST",
    "/fal-ai/kling-video/o3/4k/image-to-video",
    FalKlingVideoO3p4kImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/kling-video/o3/4k/reference-to-video
  // Docs: https://docs.fal.ai
  const klingVideoO3p4kReferenceToVideo = jsonBody<
    FalKlingVideoO3p4kReferenceToVideoRequest,
    FalKlingVideoO3p4kReferenceToVideoResponse
  >(
    "POST",
    "/fal-ai/kling-video/o3/4k/reference-to-video",
    FalKlingVideoO3p4kReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/kling-video/o3/4k/text-to-video
  // Docs: https://docs.fal.ai
  const klingVideoO3p4kTextToVideo = jsonBody<
    FalKlingVideoO3p4kTextToVideoRequest,
    FalKlingVideoO3p4kTextToVideoResponse
  >(
    "POST",
    "/fal-ai/kling-video/o3/4k/text-to-video",
    FalKlingVideoO3p4kTextToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/veo3.1
  // Docs: https://docs.fal.ai
  const veo3p1TextToVideo = jsonBody<
    FalVeo3p1TextToVideoRequest,
    FalVeo3p1TextToVideoResponse
  >("POST", "/fal-ai/veo3.1", FalVeo3p1TextToVideoRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/veo3.1/image-to-video
  // Docs: https://docs.fal.ai
  const veo3p1ImageToVideo = jsonBody<
    FalVeo3p1ImageToVideoRequest,
    FalVeo3p1ImageToVideoResponse
  >(
    "POST",
    "/fal-ai/veo3.1/image-to-video",
    FalVeo3p1ImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/xai/grok-imagine-video/image-to-video
  // Docs: https://docs.fal.ai
  const xaiGrokImagineVideoImageToVideo = jsonBody<
    FalXaiGrokImagineVideoImageToVideoRequest,
    FalXaiGrokImagineVideoImageToVideoResponse
  >(
    "POST",
    "/xai/grok-imagine-video/image-to-video",
    FalXaiGrokImagineVideoImageToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/xai/grok-imagine-video/reference-to-video
  // Docs: https://docs.fal.ai
  const xaiGrokImagineVideoReferenceToVideo = jsonBody<
    FalXaiGrokImagineVideoReferenceToVideoRequest,
    FalXaiGrokImagineVideoReferenceToVideoResponse
  >(
    "POST",
    "/xai/grok-imagine-video/reference-to-video",
    FalXaiGrokImagineVideoReferenceToVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/xai/grok-imagine-video/extend-video
  // Docs: https://docs.fal.ai
  const xaiGrokImagineVideoExtendVideo = jsonBody<
    FalXaiGrokImagineVideoExtendVideoRequest,
    FalXaiGrokImagineVideoExtendVideoResponse
  >(
    "POST",
    "/xai/grok-imagine-video/extend-video",
    FalXaiGrokImagineVideoExtendVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/xai/grok-imagine-video/edit-video
  // Docs: https://docs.fal.ai
  const xaiGrokImagineVideoEditVideo = jsonBody<
    FalXaiGrokImagineVideoEditVideoRequest,
    FalXaiGrokImagineVideoEditVideoResponse
  >(
    "POST",
    "/xai/grok-imagine-video/edit-video",
    FalXaiGrokImagineVideoEditVideoRequestSchema,
    { base: runBaseURL }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/xai/grok-imagine-image
  // Docs: https://docs.fal.ai
  const xaiGrokImagineImage = Object.assign(
    jsonBody<FalXaiGrokImagineImageRequest, FalXaiGrokImagineImageResponse>(
      "POST",
      "/xai/grok-imagine-image",
      FalXaiGrokImagineImageRequestSchema,
      { base: runBaseURL }
    ),
    {
      edit: xaiGrokImagineImageEdit,
      v2p0: {
        textToImage: xaiGrokImagineImageV2p0TextToImage,
        edit: xaiGrokImagineImageV2p0Edit,
      },
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/qwen-image-edit
  // Docs: https://docs.fal.ai
  const qwenImageEdit = jsonBody<
    FalQwenImageEditRequest,
    FalQwenImageEditResponse
  >("POST", "/fal-ai/qwen-image-edit", FalQwenImageEditRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://fal.run/fal-ai/gpt-image-1.5/edit
  // Docs: https://docs.fal.ai
  const gptImage1p5Edit = jsonBody<
    FalGptImage1p5EditRequest,
    FalGptImage1p5EditResponse
  >("POST", "/fal-ai/gpt-image-1.5/edit", FalGptImage1p5EditRequestSchema, {
    base: runBaseURL,
  });

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/gpt-image-1.5
  // Docs: https://docs.fal.ai
  const gptImage1p5 = Object.assign(
    jsonBody<FalGptImage1p5Request, FalGptImage1p5Response>(
      "POST",
      "/fal-ai/gpt-image-1.5",
      FalGptImage1p5RequestSchema,
      { base: runBaseURL }
    ),
    {
      edit: gptImage1p5Edit,
    }
  );

  // sig-ok: stylistic dotPath divergence from URL
  // POST https://api.fal.ai/v1/fal-ai/qwen-image
  // Docs: https://docs.fal.ai
  const qwenImage = Object.assign(
    jsonBody<FalQwenImageRequest, FalQwenImageResponse>(
      "POST",
      "/fal-ai/qwen-image",
      FalQwenImageRequestSchema,
      { base: runBaseURL }
    ),
    {
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
    alibaba: {
      wan3p0: {
        textToVideo: alibabaWan3p0TextToVideo,
        imageToVideo: alibabaWan3p0ImageToVideo,
        referenceToVideo: alibabaWan3p0ReferenceToVideo,
      },
      wan3p0Prime: {
        textToVideo: alibabaWan3p0PrimeTextToVideo,
        imageToVideo: alibabaWan3p0PrimeImageToVideo,
        referenceToVideo: alibabaWan3p0PrimeReferenceToVideo,
      },
      qwenImage3: {
        textToImage: alibabaQwenImage3TextToImage,
        edit: alibabaQwenImage3Edit,
      },
    },
    blackforestlabs: {
      flux3: {
        extendVideo: blackforestlabsFlux3ExtendVideo,
        firstLastFrameToVideo: blackforestlabsFlux3FirstLastFrameToVideo,
        imageToVideo: blackforestlabsFlux3ImageToVideo,
        keyframesToVideo: blackforestlabsFlux3KeyframesToVideo,
        textToVideo: blackforestlabsFlux3TextToVideo,
      },
      fluxVideoUpscale: blackforestlabsFluxVideoUpscale,
    },
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
      seedance2p5: {
        imageToVideo: bytedanceSeedance2p5ImageToVideo,
        referenceToVideo: bytedanceSeedance2p5ReferenceToVideo,
        textToVideo: bytedanceSeedance2p5TextToVideo,
      },
      seedSpeech: {
        tts: {
          v2: seedSpeechTtsV2,
        },
      },
      seedream: {
        v5: {
          lite: {
            edit: seedreamV5LiteEdit,
            textToImage: seedreamV5LiteTextToImage,
          },
          pro: {
            layerize: seedreamV5ProLayerize,
          },
        },
      },
    },
    minimax: {
      h3: {
        textToVideo: minimaxH3TextToVideo,
        imageToVideo: minimaxH3ImageToVideo,
        referenceToVideo: minimaxH3ReferenceToVideo,
      },
      music3: minimaxMusic3,
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
    nanoBanana2Lite: {
      textToImage: nanoBanana2LiteTextToImage,
      edit: nanoBanana2LiteEdit,
    },
    virtualTryOn,
    topaz: {
      upscale: {
        image: {
          precision: topazUpscaleImagePrecision,
        },
        video: {
          precision: topazUpscaleVideoPrecision,
        },
      },
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
      o3p4k: {
        imageToVideo: klingVideoO3p4kImageToVideo,
        referenceToVideo: klingVideoO3p4kReferenceToVideo,
        textToVideo: klingVideoO3p4kTextToVideo,
      },
    },
    meshy: {
      v7: {
        imageTo3d: meshyV7ImageTo3d,
      },
    },
    lightricks: {
      ltx2p5: {
        imageToVideo: {
          pro: lightricksLtx2p5ImageToVideoPro,
          fast: lightricksLtx2p5ImageToVideoFast,
        },
      },
    },
    gptImage1p5,
    sora2: {
      textToVideo: sora2TextToVideo,
      imageToVideo: sora2ImageToVideo,
    },
    hunyuan: {
      v3: {
        instructEdit: hunyuanImageV3InstructEdit,
      },
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

    async result(
      params: FalQueueResultParams,
      signal?: AbortSignal
    ): Promise<FalQueueResultResponse> {
      return makeRequest<FalQueueResultResponse>(
        "GET",
        `/${params.endpoint_id}/requests/${params.request_id}`,
        undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },
  };

  function buildLogsQueryParams(params?: object): Record<string, unknown> {
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
            buildLogsQueryParams(params),
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
        params,
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
  const getV1ModelsPricing = async function pricing(
    params: FalPricingParams,
    signal?: AbortSignal
  ): Promise<FalPricingResponse> {
    return makeRequest<FalPricingResponse>(
      "GET",
      "/models/pricing",
      params,
      signal
    );
  };

  const getV1ModelsRequests = {
    // GET https://api.fal.ai/v1/models/requests/by-endpoint
    // Docs: https://docs.fal.ai
    byEndpoint: async function byEndpoint(
      params: FalRequestsParams,
      signal?: AbortSignal
    ): Promise<FalRequestsResponse> {
      return makeRequest<FalRequestsResponse>(
        "GET",
        "/models/requests/by-endpoint",
        params,
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
        params,
        signal
      );
    },
    {
      pricing: getV1ModelsPricing,

      // GET https://api.fal.ai/v1/models/usage
      // Docs: https://docs.fal.ai
      async usage(
        params?: FalUsageParams,
        signal?: AbortSignal
      ): Promise<FalUsageResponse> {
        return makeRequest<FalUsageResponse>(
          "GET",
          "/models/usage",
          params,
          signal
        );
      },

      // GET https://api.fal.ai/v1/models/analytics
      // Docs: https://docs.fal.ai
      async analytics(
        params: FalAnalyticsParams,
        signal?: AbortSignal
      ): Promise<FalAnalyticsResponse> {
        return makeRequest<FalAnalyticsResponse>(
          "GET",
          "/models/analytics",
          params,
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

    async result(
      params: FalQueueResultParams,
      signal?: AbortSignal
    ): Promise<FalQueueResultResponse> {
      return makeRequest<FalQueueResultResponse>(
        "GET",
        `/${params.endpoint_id}/requests/${params.request_id}`,
        undefined,
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
        params,
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
          req,
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
          buildLogsQueryParams(params),
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

  return attachExamples({
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
  });
}

// Upload bytes to fal's CDN via the `storage.upload.initiate` + signed PUT
// flow. Returns a stable `https://v3.fal.media/...` URL that fal model
// endpoints can fetch directly — no third-party host dependency.
export async function uploadFile(
  provider: FalProvider,
  args: {
    data: Uint8Array | Buffer | Blob;
    filename: string;
    contentType: string;
    storage_type?: "fal-cdn-v3";
    lifecycle?: FalStorageLifecycle;
  },
  signal?: AbortSignal
): Promise<string> {
  const initiateParams: FalStorageUploadInitiateParams = {
    file_name: args.filename,
    content_type: args.contentType,
    ...(args.storage_type ? { storage_type: args.storage_type } : {}),
    ...(args.lifecycle ? { lifecycle: args.lifecycle } : {}),
  };
  const { file_url, upload_url } = await provider.storage.upload.initiate(
    initiateParams,
    signal
  );

  const body =
    args.data instanceof Blob
      ? args.data
      : new Blob([new Uint8Array(args.data)], { type: args.contentType });

  const res = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": args.contentType },
    body,
    signal,
  });
  if (!res.ok) {
    throw new FalError(
      `Fal storage PUT failed: ${res.status} ${res.statusText}`,
      res.status,
      "server_error"
    );
  }

  return file_url;
}
