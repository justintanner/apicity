import {
  XaiOptions,
  XaiChatRequest,
  XaiChatResponse,
  XaiDeferredChatCompletionResult,
  XaiImageGenerateRequest,
  XaiImageEditRequest,
  XaiImageReference,
  XaiImageResponse,
  XaiVideoGenerateRequest,
  XaiGrokImagineVideo15ImageToVideoRequest,
  XaiGrokImagineVideo15ImageToVideoResponse,
  XaiVideoEditRequest,
  XaiVideoExtendRequest,
  XaiVideoReference,
  XaiVideoReferenceInput,
  XaiVideoAsyncResponse,
  XaiVideoResult,
  XaiFileObject,
  XaiFileListParams,
  XaiFileListResponse,
  XaiFilePublicUrlRequest,
  XaiFilePublicUrlResponse,
  XaiFilePublicUrlRevokeResponse,
  XaiModel,
  XaiModelListResponse,
  XaiLanguageModel,
  XaiLanguageModelListResponse,
  XaiImageGenerationModel,
  XaiImageGenerationModelListResponse,
  XaiVideoGenerationModel,
  XaiVideoGenerationModelListResponse,
  XaiBatchCreateRequest,
  XaiBatch,
  XaiBatchListParams,
  XaiBatchListResponse,
  XaiBatchAddRequestsBody,
  XaiBatchRequestListParams,
  XaiBatchRequestListResponse,
  XaiBatchResultListParams,
  XaiBatchResultListResponse,
  XaiCollectionCreateRequest,
  XaiCollection,
  XaiCollectionListParams,
  XaiCollectionListResponse,
  XaiCollectionUpdateRequest,
  XaiDocumentAddRequest,
  XaiDocumentListParams,
  XaiDocumentListResponse,
  XaiDocument,
  XaiDocumentSearchRequest,
  XaiDocumentSearchResponse,
  XaiResponseRequest,
  XaiResponseResponse,
  XaiResponseCompactRequest,
  XaiResponseCompactResponse,
  XaiResponseDeleteResponse,
  XaiRealtimeClientSecretRequest,
  XaiRealtimeClientSecretResponse,
  XaiTokenizeTextRequest,
  XaiTokenizeTextResponse,
  XaiRealtimeConnectOptions,
  XaiRealtimeConnection,
  XaiRealtimeClientEvent,
  XaiRealtimeServerEvent,
  XaiTtsRequest,
  XaiSttRequest,
  XaiSttResponse,
  XaiCustomVoiceCreateRequest,
  XaiCustomVoiceListParams,
  XaiCustomVoiceListResponse,
  XaiCustomVoiceUpdateRequest,
  XaiCustomVoiceDeleteResponse,
  XaiCustomVoice,
  XaiApiKeyInfo,
  XaiManagementApiKeyListParams,
  XaiManagementApiKeyListResponse,
  XaiBillingPrepaidBalanceResponse,
  XaiBillingPostpaidInvoicePreviewResponse,
  XaiBillingPostpaidSpendingLimitsResponse,
  XaiBillingUsageRequest,
  XaiBillingUsageResponse,
  XaiProvider,
  XaiError,
} from "./types";
import {
  XaiChatRequestSchema,
  XaiImageGenerateRequestSchema,
  XaiImageEditRequestSchema,
  XaiFilePublicUrlRequestSchema,
  XaiVideoGenerateRequestSchema,
  XaiGrokImagineVideo15ImageToVideoRequestSchema,
  XaiVideoEditRequestSchema,
  XaiVideoExtendRequestSchema,
  XaiBatchCreateRequestSchema,
  XaiCollectionCreateRequestSchema,
  XaiCollectionUpdateRequestSchema,
  XaiDocumentSearchRequestSchema,
  XaiResponseRequestSchema,
  XaiResponseCompactRequestSchema,
  XaiTokenizeTextRequestSchema,
  XaiRealtimeClientSecretRequestSchema,
  XaiTtsRequestSchema,
  XaiSttRequestSchema,
  XaiCustomVoiceCreateRequestSchema,
  XaiCustomVoiceUpdateRequestSchema,
  XaiBillingUsageRequestSchema,
  XAI_GROK_IMAGINE_VIDEO,
  XAI_GROK_IMAGINE_VIDEO_1_5_PREFIX,
  XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW,
  XAI_VIDEO_REFERENCE_MODE_UNSUPPORTED_MODEL_MESSAGE,
  buildXaiVideoModeExclusivityMessage,
  computeXaiVideoModeGroups,
} from "./zod";
import { attachExamples } from "./example";
import { createTransport, type Transport } from "./transport";
import { withPaidGate } from "./with-paid-gate";

interface XaiErrorEnvelope {
  error?: {
    message?: unknown;
  };
}

function isXaiErrorEnvelope(body: unknown): body is XaiErrorEnvelope {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error?: unknown }).error === "object"
  );
}

function parseXaiErrorBody(status: number, body: unknown): { message: string } {
  if (isXaiErrorEnvelope(body) && typeof body.error?.message === "string") {
    return { message: `XAI API error ${status}: ${body.error.message}` };
  }

  return { message: `XAI API error: ${status}` };
}

async function wrapXaiTransportFailure<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof XaiError) throw error;
    throw new XaiError(`XAI request failed: ${error}`, 500);
  }
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  return await wrapXaiTransportFailure(async () => (await res.json()) as T);
}

async function readArrayBufferResponse(res: Response): Promise<ArrayBuffer> {
  return await wrapXaiTransportFailure(async () => await res.arrayBuffer());
}

async function jsonRequest<T>(
  transport: Transport,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const res = await transport.raw(path, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  return await readJsonResponse<T>(res);
}

function isAbortSignal(value: unknown): value is AbortSignal {
  return (
    typeof value === "object" &&
    value !== null &&
    "aborted" in value &&
    "addEventListener" in value
  );
}

function appendOptionalFormField(
  form: FormData,
  name: string,
  value: string | undefined
): void {
  if (value !== undefined) {
    form.append(name, value);
  }
}

const DEFAULT_VIDEO_POLL_INTERVAL_MS = 5000;
const DEFAULT_VIDEO_MAX_POLLS = 60;

function normalizeImageReference(image: XaiImageReference): XaiImageReference {
  const { image_url, ...rest } = image;
  if (rest.url === undefined && image_url !== undefined) {
    return { ...rest, url: image_url };
  }
  return rest;
}

function normalizeImageEditRequest(
  req: XaiImageEditRequest
): XaiImageEditRequest {
  const { image_file_id, image_file_ids, ...rest } = req;
  const normalized: XaiImageEditRequest = {
    ...rest,
  };
  if (normalized.image === undefined && image_file_id !== undefined) {
    normalized.image = { file_id: image_file_id };
  }
  if (normalized.images === undefined && image_file_ids !== undefined) {
    normalized.images = image_file_ids.map((file_id) => ({ file_id }));
  }
  return {
    ...normalized,
    image:
      normalized.image === undefined
        ? undefined
        : normalizeImageReference(normalized.image),
    images: normalized.images?.map(normalizeImageReference),
  };
}

function normalizeVideoReference(
  image: XaiVideoReferenceInput
): XaiVideoReference {
  if (typeof image === "string") return { url: image };
  return image;
}

function normalizeVideoGenerateRequest(
  req: XaiVideoGenerateRequest
): XaiVideoGenerateRequest {
  const { image_file_id, video_file_id, reference_image_file_ids, ...rest } =
    req;
  const normalized: XaiVideoGenerateRequest = {
    ...rest,
  };
  if (normalized.image === undefined && image_file_id !== undefined) {
    normalized.image = { file_id: image_file_id };
  }
  if (normalized.video === undefined && video_file_id !== undefined) {
    normalized.video = { file_id: video_file_id };
  }
  if (
    normalized.reference_images === undefined &&
    reference_image_file_ids !== undefined
  ) {
    normalized.reference_images = reference_image_file_ids.map((file_id) => ({
      file_id,
    }));
  }
  return normalized;
}

function normalizeVideoEditRequest(
  req: XaiVideoEditRequest
): XaiVideoEditRequest {
  const { video_file_id, ...rest } = req;
  const normalized: XaiVideoEditRequest = {
    ...rest,
  };
  if (normalized.video === undefined && video_file_id !== undefined) {
    normalized.video = { file_id: video_file_id };
  }
  return normalized;
}

function normalizeVideoExtendRequest(
  req: XaiVideoExtendRequest
): XaiVideoExtendRequest {
  const { video_file_id, ...rest } = req;
  const normalized: XaiVideoExtendRequest = {
    ...rest,
  };
  if (normalized.video === undefined && video_file_id !== undefined) {
    normalized.video = { file_id: video_file_id };
  }
  return normalized;
}

function applyVideoGenerationDefaults(
  req: XaiVideoGenerateRequest
): XaiVideoGenerateRequest {
  // Pre-transport guard: this helper runs only in the /v1/videos/generations
  // leaf, so these checks fire before any billed request. They mirror the
  // XaiVideoGenerateRequestSchema refinement (same helper, same messages)
  // because leaf `.schema` attachments are caller-facing metadata that
  // nothing on the paid call path invokes. Verified live 2026-07-28 against
  // xAI's primary reference-to-video doc
  // https://docs.x.ai/developers/model-capabilities/video/reference-to-video:
  // "Reference images cannot be combined with image-to-video or video
  // editing. Only one mode can be active per request, determined by the
  // parameters on the request."
  // "grok-imagine-video-1.5 does not support this mode."
  const groups = computeXaiVideoModeGroups(req);
  const activeGroupCount =
    Number(groups.reference) +
    Number(groups.imageToVideo) +
    Number(groups.videoEdit);
  if (activeGroupCount >= 2) {
    throw new XaiError(buildXaiVideoModeExclusivityMessage(groups), 400);
  }
  // Guard the raw request so defaulting can never mask an explicit 1.5
  // family model paired with reference mode (base, -preview, and dated
  // variants are aliases of the same unsupported model).
  if (
    groups.reference &&
    req.model !== undefined &&
    req.model.startsWith(XAI_GROK_IMAGINE_VIDEO_1_5_PREFIX)
  ) {
    throw new XaiError(XAI_VIDEO_REFERENCE_MODE_UNSUPPORTED_MODEL_MESSAGE, 400);
  }
  const normalized = normalizeVideoGenerateRequest(req);
  if (normalized.model !== undefined) return normalized;
  // Default/supported-model behavior, per the primary reference-to-video
  // doc cited above: every reference-to-video example uses
  // "grok-imagine-video" and the grok-imagine-video-1.5 family does not
  // support reference mode, so model-less reference requests default to
  // XAI_GROK_IMAGINE_VIDEO; all other model-less requests keep the 1.5
  // preview default. The post-fold check is OR'ed with the original
  // file-ids spelling so the degenerate both-spellings input
  // (reference_images: [] plus non-empty reference_image_file_ids) still
  // takes the reference default, matching the schema's group test.
  const referenceActive =
    (normalized.reference_images?.length ?? 0) > 0 ||
    (req.reference_image_file_ids?.length ?? 0) > 0;
  return {
    ...normalized,
    model: referenceActive
      ? XAI_GROK_IMAGINE_VIDEO
      : XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW,
  };
}

function waitForPollInterval(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  if (signal?.aborted) {
    return Promise.reject(new XaiError("XAI request aborted", 499));
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new XaiError("XAI request aborted", 499));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function createXai(opts: XaiOptions): XaiProvider {
  const baseURL = opts.baseURL ?? "https://api.x.ai/v1";
  const managementBaseURL =
    opts.managementBaseURL ?? "https://management-api.x.ai/v1";
  const managementRootURL = managementBaseURL.replace(/\/v1\/?$/, "");
  const managementApiKey = opts.managementApiKey ?? opts.apiKey;
  const timeout = opts.timeout ?? 30000;
  const transport = createTransport({
    baseUrl: baseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => ({ Authorization: `Bearer ${opts.apiKey}` }),
    parseErrorBody: parseXaiErrorBody,
    errorClass: XaiError,
    requestFailedPrefix: "XAI request failed",
  });
  const managementTransport = createTransport({
    baseUrl: managementBaseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => ({ Authorization: `Bearer ${managementApiKey}` }),
    parseErrorBody: parseXaiErrorBody,
    errorClass: XaiError,
    requestFailedPrefix: "XAI request failed",
  });
  const managementRootTransport = createTransport({
    baseUrl: managementRootURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => ({ Authorization: `Bearer ${managementApiKey}` }),
    parseErrorBody: parseXaiErrorBody,
    errorClass: XaiError,
    requestFailedPrefix: "XAI request failed",
  });

  async function makeRequest<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    return await jsonRequest<T>(transport, method, path, body, signal);
  }

  async function makeGetTextRequest(
    path: string,
    signal?: AbortSignal
  ): Promise<string> {
    return await transport.getText(path, { signal });
  }

  function buildQuery(params: object): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        );
      }
    }
    return parts.length > 0 ? `?${parts.join("&")}` : "";
  }

  // sig-ok image-to-video helper polls the same generation endpoint.
  // POST https://api.x.ai/v1/videos/generations
  // Docs: https://docs.x.ai/developers/model-capabilities/video/image-to-video
  async function imageToVideo(
    req: XaiGrokImagineVideo15ImageToVideoRequest
  ): Promise<XaiGrokImagineVideo15ImageToVideoResponse> {
    // Paid endpoint (v1.videos.generations.imageToVideo): withPaidGate invokes
    // this leaf as fn(req), so the caller-facing second argument is the
    // pay-gate approval, not an AbortSignal.
    if (
      req.model !== undefined &&
      req.model !== XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW
    ) {
      throw new XaiError(
        `Grok Imagine image-to-video uses ${XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW}`,
        400,
        { model: req.model }
      );
    }

    const {
      pollIntervalMs = DEFAULT_VIDEO_POLL_INTERVAL_MS,
      maxPolls = DEFAULT_VIDEO_MAX_POLLS,
      image,
      image_file_id,
    } = req;
    const imageReference =
      image !== undefined
        ? normalizeVideoReference(image)
        : image_file_id !== undefined
          ? { file_id: image_file_id }
          : undefined;
    if (imageReference === undefined) {
      throw new XaiError(
        "XAI image-to-video requires image or image_file_id",
        400
      );
    }
    const generationRequest: XaiVideoGenerateRequest = {
      prompt: req.prompt,
      model: XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW,
      image: imageReference,
    };
    if (req.duration !== undefined) generationRequest.duration = req.duration;
    if (req.aspect_ratio !== undefined) {
      generationRequest.aspect_ratio = req.aspect_ratio;
    }
    if (req.resolution !== undefined) {
      generationRequest.resolution = req.resolution;
    }
    if (req.storage_options !== undefined) {
      generationRequest.storage_options = req.storage_options;
    }
    const start = await makeRequest<XaiVideoAsyncResponse>(
      "POST",
      "/videos/generations",
      generationRequest
    );
    let lastStatus: XaiVideoResult | undefined;

    for (let poll = 0; poll < maxPolls; poll++) {
      const status = await makeRequest<XaiVideoResult>(
        "GET",
        `/videos/${encodeURIComponent(start.request_id)}`,
        undefined
      );
      lastStatus = {
        ...status,
        request_id: status.request_id ?? start.request_id,
      };

      if (status.status === "done") {
        if (!status.video?.url) {
          throw new XaiError(
            `XAI video generation completed without a video URL: ${start.request_id}`,
            502,
            lastStatus
          );
        }
        return {
          ...status,
          status: "done",
          request_id: start.request_id,
          video: status.video,
          model: status.model ?? XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW,
        };
      }

      if (status.status === "failed" || status.status === "expired") {
        throw new XaiError(
          `XAI video generation ${status.status}: ${start.request_id}`,
          500,
          lastStatus
        );
      }

      if (poll < maxPolls - 1) {
        await waitForPollInterval(pollIntervalMs);
      }
    }

    throw new XaiError(
      `XAI video generation timed out after ${maxPolls} polls: ${start.request_id}`,
      408,
      lastStatus ?? { request_id: start.request_id }
    );
  }

  async function makeManagementRequest<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    return await jsonRequest<T>(
      managementTransport,
      method,
      path,
      body,
      signal
    );
  }

  async function makeManagementRootRequest<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    return await jsonRequest<T>(
      managementRootTransport,
      method,
      path,
      body,
      signal
    );
  }

  function buildManagementQuery(params: object): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          for (const item of value) {
            parts.push(
              `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`
            );
          }
        } else {
          parts.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
          );
        }
      }
    }
    return parts.length > 0 ? `?${parts.join("&")}` : "";
  }

  async function makeBinaryRequest(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const res = await transport.raw(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    return await readArrayBufferResponse(res);
  }

  async function makeGetBinaryRequest(
    path: string,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    return await transport.getBinary(path, { signal });
  }

  async function makeMultipartRequest<T>(
    path: string,
    form: FormData,
    signal?: AbortSignal
  ): Promise<T> {
    return await transport.postForm<T>(path, form, { signal });
  }

  // POST https://api.x.ai/v1/batches
  // Docs: https://docs.x.ai/docs/api-reference
  const postBatches = Object.assign(
    async function createBatch(
      req: XaiBatchCreateRequest,
      signal?: AbortSignal
    ): Promise<XaiBatch> {
      return await makeRequest("POST", "/batches", req, signal);
    },
    {
      schema: XaiBatchCreateRequestSchema,
      // schema-ok: body-less POST (no request payload)
      // POST https://api.x.ai/v1/batches/{batchId}:cancel
      // Docs: https://docs.x.ai/docs/api-reference
      cancel: async function cancelBatch(
        batchId: string,
        signal?: AbortSignal
      ): Promise<XaiBatch> {
        return await makeRequest(
          "POST",
          `/batches/${batchId}:cancel`,
          {},
          signal
        );
      },
      // schema-ok: no request body to validate
      // POST https://api.x.ai/v1/batches/{batchId}/requests
      // Docs: https://docs.x.ai/docs/api-reference
      requests: async function addRequests(
        batchId: string,
        req: XaiBatchAddRequestsBody,
        signal?: AbortSignal
      ): Promise<void> {
        await makeRequest("POST", `/batches/${batchId}/requests`, req, signal);
      },
    }
  );

  // POST https://management-api.x.ai/v1/collections
  // Docs: https://docs.x.ai/docs/api-reference
  const postCollections = Object.assign(
    async function createCollection(
      req: XaiCollectionCreateRequest,
      signal?: AbortSignal
    ): Promise<XaiCollection> {
      return await makeManagementRequest("POST", "/collections", req, signal);
    },
    {
      schema: XaiCollectionCreateRequestSchema,
      // schema-ok: no request body to validate
      // POST https://management-api.x.ai/v1/collections/{collectionId}/documents/{fileId}
      // Docs: https://docs.x.ai/docs/api-reference
      documents: async function addDocument(
        collectionId: string,
        fileId: string,
        req?: XaiDocumentAddRequest,
        signal?: AbortSignal
      ): Promise<void> {
        await makeManagementRequest(
          "POST",
          `/collections/${collectionId}/documents/${fileId}`,
          req ?? {},
          signal
        );
      },
    }
  );

  // GET https://api.x.ai/v1/files/{paramsOrFileIdOrSignal}
  // Docs: https://docs.x.ai/docs/api-reference
  async function getFiles(
    paramsOrFileIdOrSignal?: XaiFileListParams | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiFileListResponse | XaiFileObject> {
    if (typeof paramsOrFileIdOrSignal === "string") {
      return makeRequest<XaiFileObject>(
        "GET",
        `/files/${encodeURIComponent(paramsOrFileIdOrSignal)}`,
        undefined,
        signal
      );
    }
    const queryParams = isAbortSignal(paramsOrFileIdOrSignal)
      ? {}
      : (paramsOrFileIdOrSignal ?? {});
    const requestSignal = isAbortSignal(paramsOrFileIdOrSignal)
      ? paramsOrFileIdOrSignal
      : signal;
    const query = buildQuery(queryParams);
    return makeRequest<XaiFileListResponse>(
      "GET",
      `/files${query}`,
      undefined,
      requestSignal
    );
  }

  const getFilesNamespace = Object.assign(
    getFiles as {
      (
        params?: XaiFileListParams,
        signal?: AbortSignal
      ): Promise<XaiFileListResponse>;
      (fileId: string, signal?: AbortSignal): Promise<XaiFileObject>;
      (signal: AbortSignal): Promise<XaiFileListResponse>;
    },
    {
      // GET https://api.x.ai/v1/files/{fileId}/content
      // Docs: https://docs.x.ai/docs/api-reference
      content: async function content(
        fileId: string,
        signal?: AbortSignal
      ): Promise<string> {
        return await makeGetTextRequest(
          `/files/${encodeURIComponent(fileId)}/content`,
          signal
        );
      },
    }
  );

  // GET https://api.x.ai/v1/models/{modelIdOrSignal}
  // Docs: https://docs.x.ai/docs/api-reference
  async function getModels(
    modelIdOrSignal?: string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiModelListResponse | XaiModel> {
    if (typeof modelIdOrSignal === "string") {
      return makeRequest<XaiModel>(
        "GET",
        `/models/${modelIdOrSignal}`,
        undefined,
        signal
      );
    }
    return makeRequest<XaiModelListResponse>(
      "GET",
      "/models",
      undefined,
      modelIdOrSignal
    );
  }

  // GET https://api.x.ai/v1/language-models/{modelIdOrSignal}
  // Docs: https://docs.x.ai/docs/api-reference
  async function getLanguageModels(
    modelIdOrSignal?: string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiLanguageModelListResponse | XaiLanguageModel> {
    if (typeof modelIdOrSignal === "string") {
      return makeRequest<XaiLanguageModel>(
        "GET",
        `/language-models/${modelIdOrSignal}`,
        undefined,
        signal
      );
    }
    return makeRequest<XaiLanguageModelListResponse>(
      "GET",
      "/language-models",
      undefined,
      modelIdOrSignal
    );
  }

  // GET https://api.x.ai/v1/image-generation-models/{modelIdOrSignal}
  // Docs: https://docs.x.ai/docs/api-reference
  async function getImageGenerationModels(
    modelIdOrSignal?: string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiImageGenerationModelListResponse | XaiImageGenerationModel> {
    if (typeof modelIdOrSignal === "string") {
      return makeRequest<XaiImageGenerationModel>(
        "GET",
        `/image-generation-models/${modelIdOrSignal}`,
        undefined,
        signal
      );
    }
    return makeRequest<XaiImageGenerationModelListResponse>(
      "GET",
      "/image-generation-models",
      undefined,
      modelIdOrSignal
    );
  }

  // GET https://api.x.ai/v1/video-generation-models/{modelIdOrSignal}
  // Docs: https://docs.x.ai/docs/api-reference
  async function getVideoGenerationModels(
    modelIdOrSignal?: string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiVideoGenerationModelListResponse | XaiVideoGenerationModel> {
    if (typeof modelIdOrSignal === "string") {
      return makeRequest<XaiVideoGenerationModel>(
        "GET",
        `/video-generation-models/${modelIdOrSignal}`,
        undefined,
        signal
      );
    }
    return makeRequest<XaiVideoGenerationModelListResponse>(
      "GET",
      "/video-generation-models",
      undefined,
      modelIdOrSignal
    );
  }

  // GET https://api.x.ai/v1/batches/{paramsOrIdOrSignal}
  // Docs: https://docs.x.ai/docs/api-reference
  async function getBatches(
    paramsOrIdOrSignal?: XaiBatchListParams | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiBatchListResponse | XaiBatch> {
    if (typeof paramsOrIdOrSignal === "string") {
      return makeRequest<XaiBatch>(
        "GET",
        `/batches/${paramsOrIdOrSignal}`,
        undefined,
        signal
      );
    }
    const query = buildQuery(paramsOrIdOrSignal ?? {});
    return makeRequest<XaiBatchListResponse>(
      "GET",
      `/batches${query}`,
      undefined,
      signal
    );
  }

  const getBatchesNamespace = Object.assign(getBatches, {
    // GET https://api.x.ai/v1/batches/{batchId}/requests{query}
    // Docs: https://docs.x.ai/docs/api-reference
    requests: async function listRequests(
      batchId: string,
      params?: XaiBatchRequestListParams,
      signal?: AbortSignal
    ): Promise<XaiBatchRequestListResponse> {
      const query = buildQuery(params ?? {});
      return await makeRequest(
        "GET",
        `/batches/${batchId}/requests${query}`,
        undefined,
        signal
      );
    },
    // GET https://api.x.ai/v1/batches/{batchId}/results{query}
    // Docs: https://docs.x.ai/docs/api-reference
    results: async function listResults(
      batchId: string,
      params?: XaiBatchResultListParams,
      signal?: AbortSignal
    ): Promise<XaiBatchResultListResponse> {
      const query = buildQuery(params ?? {});
      return await makeRequest(
        "GET",
        `/batches/${batchId}/results${query}`,
        undefined,
        signal
      );
    },
  });

  // GET https://management-api.x.ai/v1/collections/{paramsOrIdOrSignal}
  // Docs: https://docs.x.ai/docs/api-reference
  async function getCollections(
    paramsOrIdOrSignal?: XaiCollectionListParams | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiCollectionListResponse | XaiCollection> {
    if (typeof paramsOrIdOrSignal === "string") {
      return makeManagementRequest<XaiCollection>(
        "GET",
        `/collections/${paramsOrIdOrSignal}`,
        undefined,
        signal
      );
    }
    const query = buildManagementQuery(paramsOrIdOrSignal ?? {});
    return makeManagementRequest<XaiCollectionListResponse>(
      "GET",
      `/collections${query}`,
      undefined,
      signal
    );
  }

  // GET https://management-api.x.ai/v1/collections/{collectionId}/documents/{paramsOrFileId}
  // Docs: https://docs.x.ai/docs/api-reference
  const getCollectionsDocuments = Object.assign(
    async function listDocuments(
      collectionId: string,
      paramsOrFileId?: XaiDocumentListParams | string | AbortSignal,
      signal?: AbortSignal
    ): Promise<XaiDocumentListResponse | XaiDocument> {
      if (typeof paramsOrFileId === "string") {
        return makeManagementRequest<XaiDocument>(
          "GET",
          `/collections/${collectionId}/documents/${paramsOrFileId}`,
          undefined,
          signal
        );
      }
      const query = buildManagementQuery(paramsOrFileId ?? {});
      return makeManagementRequest<XaiDocumentListResponse>(
        "GET",
        `/collections/${collectionId}/documents${query}`,
        undefined,
        signal
      );
    },
    {
      // GET https://management-api.x.ai/v1/collections/{collectionId}/documents:batchGet{query}
      // Docs: https://docs.x.ai/docs/api-reference
      batchGet: async function batchGetDocuments(
        collectionId: string,
        fileIds: string[],
        signal?: AbortSignal
      ): Promise<{ documents: XaiDocument[] }> {
        const params = fileIds
          .map((id) => `file_ids=${encodeURIComponent(id)}`)
          .join("&");
        const query = params ? `?${params}` : "";
        return await makeManagementRequest(
          "GET",
          `/collections/${collectionId}/documents:batchGet${query}`,
          undefined,
          signal
        );
      },
    }
  );

  const getCollectionsNamespace = Object.assign(getCollections, {
    documents: getCollectionsDocuments,
  });

  // DELETE https://management-api.x.ai/v1/collections/{collectionId}
  // Docs: https://docs.x.ai/docs/api-reference
  const deleteCollections = Object.assign(
    async function deleteCollection(
      collectionId: string,
      signal?: AbortSignal
    ): Promise<void> {
      await makeManagementRequest(
        "DELETE",
        `/collections/${collectionId}`,
        undefined,
        signal
      );
    },
    {
      // DELETE https://management-api.x.ai/v1/collections/{collectionId}/documents/{fileId}
      // Docs: https://docs.x.ai/docs/api-reference
      documents: async function deleteDocument(
        collectionId: string,
        fileId: string,
        signal?: AbortSignal
      ): Promise<void> {
        await makeManagementRequest(
          "DELETE",
          `/collections/${collectionId}/documents/${fileId}`,
          undefined,
          signal
        );
      },
    }
  );

  // PUT https://management-api.x.ai/v1/collections/{collectionId}
  // Docs: https://docs.x.ai/docs/api-reference
  const putCollections = Object.assign(
    async function updateCollection(
      collectionId: string,
      req: XaiCollectionUpdateRequest,
      signal?: AbortSignal
    ): Promise<XaiCollection> {
      return await makeManagementRequest(
        "PUT",
        `/collections/${collectionId}`,
        req,
        signal
      );
    },
    {
      schema: XaiCollectionUpdateRequestSchema,
    }
  );

  // POST https://api.x.ai/v1/custom-voices
  // Docs: https://docs.x.ai/developers/model-capabilities/audio/custom-voices
  const postCustomVoices = Object.assign(
    async function customVoices(
      req: XaiCustomVoiceCreateRequest,
      signal?: AbortSignal
    ): Promise<XaiCustomVoice> {
      const form = new FormData();
      form.append("file", req.file, req.filename ?? "reference");
      appendOptionalFormField(form, "name", req.name);
      appendOptionalFormField(form, "description", req.description);
      appendOptionalFormField(form, "gender", req.gender);
      appendOptionalFormField(form, "accent", req.accent);
      appendOptionalFormField(form, "age", req.age);
      appendOptionalFormField(form, "language", req.language);
      appendOptionalFormField(form, "use_case", req.use_case);
      appendOptionalFormField(form, "tone", req.tone);
      return await makeMultipartRequest<XaiCustomVoice>(
        "/custom-voices",
        form,
        signal
      );
    },
    {
      schema: XaiCustomVoiceCreateRequestSchema,
    }
  );

  // GET https://api.x.ai/v1/custom-voices/{paramsOrVoiceIdOrSignal}
  // Docs: https://docs.x.ai/developers/model-capabilities/audio/custom-voices
  const getCustomVoices = Object.assign(
    async function listCustomVoices(
      paramsOrVoiceIdOrSignal?: XaiCustomVoiceListParams | string | AbortSignal,
      signal?: AbortSignal
    ): Promise<XaiCustomVoiceListResponse | XaiCustomVoice> {
      if (typeof paramsOrVoiceIdOrSignal === "string") {
        return await makeRequest<XaiCustomVoice>(
          "GET",
          `/custom-voices/${encodeURIComponent(paramsOrVoiceIdOrSignal)}`,
          undefined,
          signal
        );
      }
      const queryParams = isAbortSignal(paramsOrVoiceIdOrSignal)
        ? {}
        : (paramsOrVoiceIdOrSignal ?? {});
      const requestSignal = isAbortSignal(paramsOrVoiceIdOrSignal)
        ? paramsOrVoiceIdOrSignal
        : signal;
      const query = buildQuery(queryParams);
      return await makeRequest<XaiCustomVoiceListResponse>(
        "GET",
        `/custom-voices${query}`,
        undefined,
        requestSignal
      );
    },
    {
      // GET https://api.x.ai/v1/custom-voices/{voiceId}/audio
      // Docs: https://docs.x.ai/developers/model-capabilities/audio/custom-voices
      audio: async function customVoiceAudio(
        voiceId: string,
        signal?: AbortSignal
      ): Promise<ArrayBuffer> {
        return await makeGetBinaryRequest(
          `/custom-voices/${encodeURIComponent(voiceId)}/audio`,
          signal
        );
      },
    }
  );

  // PATCH https://api.x.ai/v1/custom-voices/{voiceId}
  // Docs: https://docs.x.ai/developers/model-capabilities/audio/custom-voices
  const patchCustomVoices = Object.assign(
    async function updateCustomVoice(
      voiceId: string,
      req: XaiCustomVoiceUpdateRequest,
      signal?: AbortSignal
    ): Promise<XaiCustomVoice> {
      return await makeRequest<XaiCustomVoice>(
        "PATCH",
        `/custom-voices/${encodeURIComponent(voiceId)}`,
        req,
        signal
      );
    },
    {
      schema: XaiCustomVoiceUpdateRequestSchema,
    }
  );

  // DELETE https://api.x.ai/v1/custom-voices/{voiceId}
  // Docs: https://docs.x.ai/developers/model-capabilities/audio/custom-voices
  async function deleteCustomVoices(
    voiceId: string,
    signal?: AbortSignal
  ): Promise<XaiCustomVoiceDeleteResponse> {
    return await makeRequest<XaiCustomVoiceDeleteResponse>(
      "DELETE",
      `/custom-voices/${encodeURIComponent(voiceId)}`,
      undefined,
      signal
    );
  }

  return attachExamples(
    withPaidGate(
      "xai",
      {
        post: {
          v1: {
            // POST https://api.x.ai/v1/responses
            // Docs: https://docs.x.ai/docs/api-reference
            responses: Object.assign(
              async function postResponses(
                req: XaiResponseRequest,
                signal?: AbortSignal
              ): Promise<XaiResponseResponse> {
                return await makeRequest<XaiResponseResponse>(
                  "POST",
                  "/responses",
                  req,
                  signal
                );
              },
              {
                schema: XaiResponseRequestSchema,
                // POST https://api.x.ai/v1/responses/compact
                // Docs: https://docs.x.ai/docs/api-reference
                compact: Object.assign(
                  async function compactResponses(
                    req: XaiResponseCompactRequest,
                    signal?: AbortSignal
                  ): Promise<XaiResponseCompactResponse> {
                    return await makeRequest<XaiResponseCompactResponse>(
                      "POST",
                      "/responses/compact",
                      req,
                      signal
                    );
                  },
                  {
                    schema: XaiResponseCompactRequestSchema,
                  }
                ),
              }
            ),
            chat: {
              // POST https://api.x.ai/v1/chat/completions
              // Docs: https://docs.x.ai/docs/api-reference
              completions: Object.assign(
                async function completions(
                  req: XaiChatRequest,
                  signal?: AbortSignal
                ): Promise<XaiChatResponse> {
                  return await makeRequest<XaiChatResponse>(
                    "POST",
                    "/chat/completions",
                    req,
                    signal
                  );
                },
                {
                  schema: XaiChatRequestSchema,
                }
              ),
            },
            images: {
              // POST https://api.x.ai/v1/images/generations
              // Docs: https://docs.x.ai/developers/rest-api-reference/inference/images
              generations: Object.assign(
                async function generations(
                  req: XaiImageGenerateRequest
                ): Promise<XaiImageResponse> {
                  // Paid endpoint: withPaidGate invokes this leaf as fn(req),
                  // so the caller-facing second argument is the pay-gate
                  // approval (handled by the wrapper), not an AbortSignal.
                  return await makeRequest("POST", "/images/generations", req);
                },
                {
                  schema: XaiImageGenerateRequestSchema,
                }
              ),
              // POST https://api.x.ai/v1/images/edits
              // Docs: https://docs.x.ai/developers/rest-api-reference/inference/images
              edits: Object.assign(
                async function edits(
                  req: XaiImageEditRequest
                ): Promise<XaiImageResponse> {
                  // Paid endpoint: withPaidGate invokes this leaf as fn(req);
                  // the caller-facing second argument is the pay-gate approval.
                  return await makeRequest(
                    "POST",
                    "/images/edits",
                    normalizeImageEditRequest(req)
                  );
                },
                {
                  schema: XaiImageEditRequestSchema,
                }
              ),
            },
            videos: {
              // POST https://api.x.ai/v1/videos/generations
              // Docs: https://docs.x.ai/docs/api-reference
              generations: Object.assign(
                async function generations(
                  req: XaiVideoGenerateRequest
                ): Promise<XaiVideoAsyncResponse> {
                  // Paid endpoint: withPaidGate invokes this leaf as fn(req);
                  // the caller-facing second argument is the pay-gate approval.
                  return await makeRequest(
                    "POST",
                    "/videos/generations",
                    applyVideoGenerationDefaults(req)
                  );
                },
                {
                  schema: XaiVideoGenerateRequestSchema,
                  imageToVideo: Object.assign(imageToVideo, {
                    schema: XaiGrokImagineVideo15ImageToVideoRequestSchema,
                  }),
                }
              ),
              // POST https://api.x.ai/v1/videos/edits
              // Docs: https://docs.x.ai/docs/api-reference
              edits: Object.assign(
                async function edits(
                  req: XaiVideoEditRequest
                ): Promise<XaiVideoAsyncResponse> {
                  // Paid endpoint: withPaidGate invokes this leaf as fn(req);
                  // the caller-facing second argument is the pay-gate approval.
                  return await makeRequest(
                    "POST",
                    "/videos/edits",
                    normalizeVideoEditRequest(req)
                  );
                },
                {
                  schema: XaiVideoEditRequestSchema,
                }
              ),
              // POST https://api.x.ai/v1/videos/extensions
              // Docs: https://docs.x.ai/docs/api-reference
              extensions: Object.assign(
                async function extensions(
                  req: XaiVideoExtendRequest
                ): Promise<XaiVideoAsyncResponse> {
                  // Paid endpoint: withPaidGate invokes this leaf as fn(req);
                  // the caller-facing second argument is the pay-gate approval.
                  return await makeRequest(
                    "POST",
                    "/videos/extensions",
                    normalizeVideoExtendRequest(req)
                  );
                },
                {
                  schema: XaiVideoExtendRequestSchema,
                }
              ),
            },
            // schema-ok: multipart/no-JSON-body upload (no request schema)
            // POST https://api.x.ai/v1/files
            // Docs: https://docs.x.ai/docs/api-reference
            files: Object.assign(
              async function postFiles(
                file: Blob,
                filename: string,
                purpose?: string,
                signal?: AbortSignal
              ): Promise<XaiFileObject> {
                const formData = new FormData();
                formData.append("file", file, filename);
                if (purpose !== undefined) formData.append("purpose", purpose);

                return await makeMultipartRequest<XaiFileObject>(
                  "/files",
                  formData,
                  signal
                );
              },
              {
                // POST https://api.x.ai/v1/files/{fileId}/public-url
                // Docs: https://docs.x.ai/developers/files/public-urls
                publicUrl: Object.assign(
                  async function createFilePublicUrl(
                    fileId: string,
                    reqOrSignal?: XaiFilePublicUrlRequest | AbortSignal,
                    signal?: AbortSignal
                  ): Promise<XaiFilePublicUrlResponse> {
                    const req = isAbortSignal(reqOrSignal)
                      ? {}
                      : (reqOrSignal ?? {});
                    const requestSignal = isAbortSignal(reqOrSignal)
                      ? reqOrSignal
                      : signal;
                    return await makeRequest(
                      "POST",
                      `/files/${encodeURIComponent(fileId)}/public-url`,
                      req,
                      requestSignal
                    );
                  },
                  {
                    schema: XaiFilePublicUrlRequestSchema,
                    // schema-ok: body-less POST (no request payload)
                    // POST https://api.x.ai/v1/files/{fileId}/public-url/revoke
                    // Docs: https://docs.x.ai/developers/files/public-urls
                    revoke: async function revokeFilePublicUrl(
                      fileId: string,
                      signal?: AbortSignal
                    ): Promise<XaiFilePublicUrlRevokeResponse> {
                      return await makeRequest(
                        "POST",
                        `/files/${encodeURIComponent(fileId)}/public-url/revoke`,
                        {},
                        signal
                      );
                    },
                  }
                ),
              }
            ),
            batches: postBatches,
            documents: {
              // POST https://api.x.ai/v1/documents/search
              // Docs: https://docs.x.ai/docs/api-reference
              search: Object.assign(
                async function search(
                  req: XaiDocumentSearchRequest,
                  signal?: AbortSignal
                ): Promise<XaiDocumentSearchResponse> {
                  return await makeRequest(
                    "POST",
                    "/documents/search",
                    req,
                    signal
                  );
                },
                {
                  schema: XaiDocumentSearchRequestSchema,
                }
              ),
            },
            // POST https://api.x.ai/v1/tokenize-text
            // Docs: https://docs.x.ai/docs/api-reference
            tokenizeText: Object.assign(
              async function tokenizeText(
                req: XaiTokenizeTextRequest,
                signal?: AbortSignal
              ): Promise<XaiTokenizeTextResponse> {
                return await makeRequest<XaiTokenizeTextResponse>(
                  "POST",
                  "/tokenize-text",
                  req,
                  signal
                );
              },
              {
                schema: XaiTokenizeTextRequestSchema,
              }
            ),
            realtime: {
              // POST https://api.x.ai/v1/realtime/client_secrets
              // Docs: https://docs.x.ai/docs/api-reference
              clientSecrets: Object.assign(
                async function clientSecrets(
                  req: XaiRealtimeClientSecretRequest,
                  signal?: AbortSignal
                ): Promise<XaiRealtimeClientSecretResponse> {
                  return await makeRequest(
                    "POST",
                    "/realtime/client_secrets",
                    req,
                    signal
                  );
                },
                {
                  schema: XaiRealtimeClientSecretRequestSchema,
                }
              ),
            },
            // POST https://api.x.ai/v1/tts
            // Docs: https://docs.x.ai/docs/api-reference
            tts: Object.assign(
              async function tts(
                req: XaiTtsRequest,
                signal?: AbortSignal
              ): Promise<ArrayBuffer> {
                return await makeBinaryRequest("/tts", req, signal);
              },
              {
                schema: XaiTtsRequestSchema,
              }
            ),
            // POST https://api.x.ai/v1/stt
            // Docs: https://docs.x.ai/docs/api-reference
            stt: Object.assign(
              async function stt(
                req: XaiSttRequest,
                signal?: AbortSignal
              ): Promise<XaiSttResponse> {
                const form = new FormData();
                form.append("file", req.file, req.filename ?? "audio");
                if (req.language !== undefined) {
                  form.append("language", req.language);
                }
                return await makeMultipartRequest<XaiSttResponse>(
                  "/stt",
                  form,
                  signal
                );
              },
              {
                schema: XaiSttRequestSchema,
              }
            ),
            customVoices: postCustomVoices,
          },
          managementApi: {
            v1: {
              collections: postCollections,
              billing: {
                teams: {
                  // POST https://management-api.x.ai/v1/billing/teams/{teamId}/usage
                  // Docs: https://docs.x.ai/developers/rest-api-reference/management/billing
                  usage: Object.assign(
                    async function usage(
                      teamId: string,
                      req: XaiBillingUsageRequest,
                      signal?: AbortSignal
                    ): Promise<XaiBillingUsageResponse> {
                      return await makeManagementRequest(
                        "POST",
                        `/billing/teams/${encodeURIComponent(teamId)}/usage`,
                        req,
                        signal
                      );
                    },
                    {
                      schema: XaiBillingUsageRequestSchema,
                    }
                  ),
                },
              },
            },
          },
        },
        get: {
          v1: {
            // GET https://api.x.ai/v1/api-key
            // Docs: https://docs.x.ai/developers/rest-api-reference/inference/other
            apiKey: async function apiKey(
              signal?: AbortSignal
            ): Promise<XaiApiKeyInfo> {
              return await makeRequest<XaiApiKeyInfo>(
                "GET",
                "/api-key",
                undefined,
                signal
              );
            },
            // GET https://api.x.ai/v1/responses/{id}
            // Docs: https://docs.x.ai/docs/api-reference
            responses: async function getResponses(
              id: string,
              signal?: AbortSignal
            ): Promise<XaiResponseResponse> {
              return await makeRequest<XaiResponseResponse>(
                "GET",
                `/responses/${encodeURIComponent(id)}`,
                undefined,
                signal
              );
            },
            chat: {
              // GET https://api.x.ai/v1/chat/deferred-completion/{requestId}
              // Docs: https://docs.x.ai/docs/api-reference
              deferredCompletion: async function deferredCompletion(
                requestId: string,
                signal?: AbortSignal
              ): Promise<XaiDeferredChatCompletionResult> {
                const res = await transport.raw(
                  `/chat/deferred-completion/${encodeURIComponent(requestId)}`,
                  { signal }
                );

                if (res.status === 202) {
                  return { ready: false, data: null };
                }

                const data = await readJsonResponse<XaiChatResponse>(res);
                return { ready: true, data };
              },
            },
            // GET https://api.x.ai/v1/videos/{requestId}
            // Docs: https://docs.x.ai/docs/api-reference
            videos: async function getVideos(
              requestId: string,
              signal?: AbortSignal
            ): Promise<XaiVideoResult> {
              return await makeRequest(
                "GET",
                `/videos/${requestId}`,
                undefined,
                signal
              );
            },
            files: getFilesNamespace,
            models: getModels,
            languageModels: getLanguageModels,
            imageGenerationModels: getImageGenerationModels,
            videoGenerationModels: getVideoGenerationModels,
            batches: getBatchesNamespace,
            customVoices: getCustomVoices,
          },
          managementApi: {
            v1: {
              collections: getCollectionsNamespace,
              billing: {
                teams: {
                  prepaid: {
                    // GET https://management-api.x.ai/v1/billing/teams/{teamId}/prepaid/balance
                    // Docs: https://docs.x.ai/developers/rest-api-reference/management/billing
                    balance: async function balance(
                      teamId: string,
                      signal?: AbortSignal
                    ): Promise<XaiBillingPrepaidBalanceResponse> {
                      return await makeManagementRequest(
                        "GET",
                        `/billing/teams/${encodeURIComponent(teamId)}/prepaid/balance`,
                        undefined,
                        signal
                      );
                    },
                  },
                  postpaid: {
                    invoice: {
                      // GET https://management-api.x.ai/v1/billing/teams/{teamId}/postpaid/invoice/preview
                      // Docs: https://docs.x.ai/developers/rest-api-reference/management/billing
                      preview: async function preview(
                        teamId: string,
                        signal?: AbortSignal
                      ): Promise<XaiBillingPostpaidInvoicePreviewResponse> {
                        return await makeManagementRequest(
                          "GET",
                          `/billing/teams/${encodeURIComponent(teamId)}/postpaid/invoice/preview`,
                          undefined,
                          signal
                        );
                      },
                    },
                    // GET https://management-api.x.ai/v1/billing/teams/{teamId}/postpaid/spending-limits
                    // Docs: https://docs.x.ai/developers/rest-api-reference/management/billing
                    spendingLimits: async function spendingLimits(
                      teamId: string,
                      signal?: AbortSignal
                    ): Promise<XaiBillingPostpaidSpendingLimitsResponse> {
                      return await makeManagementRequest(
                        "GET",
                        `/billing/teams/${encodeURIComponent(teamId)}/postpaid/spending-limits`,
                        undefined,
                        signal
                      );
                    },
                  },
                },
              },
            },
            auth: {
              teams: {
                // GET https://management-api.x.ai/auth/teams/{teamId}/api-keys{query}
                // Docs: https://docs.x.ai/developers/rest-api-reference/management/auth
                apiKeys: async function apiKeys(
                  teamId: string,
                  params?: XaiManagementApiKeyListParams,
                  signal?: AbortSignal
                ): Promise<XaiManagementApiKeyListResponse> {
                  const query = buildManagementQuery(params ?? {});
                  return await makeManagementRootRequest(
                    "GET",
                    `/auth/teams/${encodeURIComponent(teamId)}/api-keys${query}`,
                    undefined,
                    signal
                  );
                },
              },
            },
          },
        },
        delete: {
          v1: {
            // DELETE https://api.x.ai/v1/responses/{id}
            // Docs: https://docs.x.ai/docs/api-reference
            responses: async function deleteResponses(
              id: string,
              signal?: AbortSignal
            ): Promise<XaiResponseDeleteResponse> {
              return await makeRequest<XaiResponseDeleteResponse>(
                "DELETE",
                `/responses/${encodeURIComponent(id)}`,
                undefined,
                signal
              );
            },
            // DELETE https://api.x.ai/v1/files/{fileId}
            // Docs: https://docs.x.ai/docs/api-reference
            files: async function deleteFiles(
              fileId: string,
              signal?: AbortSignal
            ): Promise<{ id: string; deleted: boolean }> {
              return await makeRequest(
                "DELETE",
                `/files/${fileId}`,
                undefined,
                signal
              );
            },
            customVoices: deleteCustomVoices,
          },
          managementApi: {
            v1: {
              collections: deleteCollections,
            },
          },
        },
        put: {
          managementApi: {
            v1: {
              collections: putCollections,
            },
          },
        },
        patch: {
          v1: {
            customVoices: patchCustomVoices,
          },
          managementApi: {
            v1: {
              collections: {
                // PATCH https://management-api.x.ai/v1/collections/{collectionId}/documents/{fileId}
                // Docs: https://docs.x.ai/docs/api-reference
                documents: async function regenerateDocument(
                  collectionId: string,
                  fileId: string,
                  signal?: AbortSignal
                ): Promise<void> {
                  await makeManagementRequest(
                    "PATCH",
                    `/collections/${collectionId}/documents/${fileId}`,
                    undefined,
                    signal
                  );
                },
              },
            },
          },
        },
        ws: {
          v1: {
            realtime: function connectRealtime(
              connectOpts?: XaiRealtimeConnectOptions
            ): XaiRealtimeConnection {
              const wsBaseURL = baseURL.replace(/^http/, "ws");
              const token = connectOpts?.token ?? opts.apiKey;
              const model = connectOpts?.model;

              // Voice-agent connection: ?model= query string + Authorization
              // header (no subprotocols). Otherwise, OpenAI-compat subprotocol auth.
              let ws: WebSocket;
              if (model) {
                const url = `${wsBaseURL}/realtime?model=${encodeURIComponent(model)}`;
                // Node `ws` accepts a third-arg options object with `headers`;
                // browsers ignore it. Cast keeps TS happy across DOM/Node lib defs.
                ws = new (WebSocket as unknown as new (
                  url: string,
                  protocols: string[] | undefined,
                  opts: { headers: Record<string, string> }
                ) => WebSocket)(url, undefined, {
                  headers: { Authorization: `Bearer ${token}` },
                });
              } else {
                ws = new WebSocket(`${wsBaseURL}/realtime`, [
                  "realtime",
                  `openai-insecure-api-key.${token}`,
                  "openai-beta.realtime-v1",
                ]);
              }

              let resolveNext:
                | ((value: IteratorResult<XaiRealtimeServerEvent>) => void)
                | null = null;
              const eventQueue: XaiRealtimeServerEvent[] = [];
              let closed = false;

              ws.onmessage = (ev: MessageEvent) => {
                const event = JSON.parse(
                  typeof ev.data === "string" ? ev.data : String(ev.data)
                ) as XaiRealtimeServerEvent;
                if (resolveNext) {
                  const resolve = resolveNext;
                  resolveNext = null;
                  resolve({ value: event, done: false });
                } else {
                  eventQueue.push(event);
                }
              };

              ws.onclose = () => {
                closed = true;
                if (resolveNext) {
                  const resolve = resolveNext;
                  resolveNext = null;
                  resolve({ value: undefined as never, done: true });
                }
              };

              ws.onerror = () => {
                closed = true;
                if (resolveNext) {
                  const resolve = resolveNext;
                  resolveNext = null;
                  resolve({ value: undefined as never, done: true });
                }
              };

              return {
                send(event: XaiRealtimeClientEvent): void {
                  ws.send(JSON.stringify(event));
                },
                close(): void {
                  closed = true;
                  ws.close();
                },
                [Symbol.asyncIterator](): AsyncIterableIterator<XaiRealtimeServerEvent> {
                  return {
                    next(): Promise<IteratorResult<XaiRealtimeServerEvent>> {
                      if (eventQueue.length > 0) {
                        return Promise.resolve({
                          value: eventQueue.shift()!,
                          done: false,
                        });
                      }
                      if (closed) {
                        return Promise.resolve({
                          value: undefined as never,
                          done: true,
                        });
                      }
                      return new Promise((resolve) => {
                        resolveNext = resolve;
                      });
                    },
                    [Symbol.asyncIterator]() {
                      return this;
                    },
                  };
                },
              };
            },
          },
        },
      },
      { config: opts.paygate }
    )
  );
}
