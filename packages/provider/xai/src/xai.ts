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
  XaiFileListResponse,
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
  XaiVideoGenerateRequestSchema,
  XaiGrokImagineVideo15ImageToVideoRequestSchema,
  XaiVideoEditRequestSchema,
  XaiVideoExtendRequestSchema,
  XaiBatchCreateRequestSchema,
  XaiCollectionCreateRequestSchema,
  XaiCollectionUpdateRequestSchema,
  XaiDocumentSearchRequestSchema,
  XaiResponseRequestSchema,
  XaiTokenizeTextRequestSchema,
  XaiRealtimeClientSecretRequestSchema,
  XaiTtsRequestSchema,
  XaiSttRequestSchema,
  XaiCustomVoiceCreateRequestSchema,
  XaiBillingUsageRequestSchema,
  XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW,
} from "./zod";
import { attachExamples } from "./example";
import { withPaidGate } from "./with-paid-gate";

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
  return {
    ...req,
    image:
      req.image === undefined ? undefined : normalizeImageReference(req.image),
    images: req.images?.map(normalizeImageReference),
  };
}

function normalizeVideoReference(
  image: XaiVideoReferenceInput
): XaiVideoReference {
  if (typeof image === "string") return { url: image };
  return image;
}

function applyVideoGenerationDefaults(
  req: XaiVideoGenerateRequest
): XaiVideoGenerateRequest {
  if (req.model !== undefined) return req;
  return {
    ...req,
    model: XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW,
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
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${opts.apiKey}`,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `XAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
  }

  async function makeGetTextRequest(
    path: string,
    signal?: AbortSignal
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `XAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status, body);
      }

      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
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
    req: XaiGrokImagineVideo15ImageToVideoRequest,
    signal?: AbortSignal
  ): Promise<XaiGrokImagineVideo15ImageToVideoResponse> {
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
    } = req;
    const generationRequest: XaiVideoGenerateRequest = {
      prompt: req.prompt,
      model: XAI_GROK_IMAGINE_VIDEO_1_5_PREVIEW,
      image: normalizeVideoReference(image),
    };
    if (req.duration !== undefined) generationRequest.duration = req.duration;
    if (req.aspect_ratio !== undefined) {
      generationRequest.aspect_ratio = req.aspect_ratio;
    }
    if (req.resolution !== undefined) {
      generationRequest.resolution = req.resolution;
    }
    const start = await makeRequest<XaiVideoAsyncResponse>(
      "POST",
      "/videos/generations",
      generationRequest,
      signal
    );
    let lastStatus: XaiVideoResult | undefined;

    for (let poll = 0; poll < maxPolls; poll++) {
      const status = await makeRequest<XaiVideoResult>(
        "GET",
        `/videos/${encodeURIComponent(start.request_id)}`,
        undefined,
        signal
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
        await waitForPollInterval(pollIntervalMs, signal);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${managementApiKey}`,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${managementBaseURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `XAI API error: ${res.status}`;
        let errBody: unknown = null;
        try {
          errBody = await res.json();
          if (
            typeof errBody === "object" &&
            errBody !== null &&
            "error" in errBody
          ) {
            const err = (errBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status, errBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
  }

  async function makeManagementRootRequest<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${managementApiKey}`,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${managementRootURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `XAI API error: ${res.status}`;
        let errBody: unknown = null;
        try {
          errBody = await res.json();
          if (
            typeof errBody === "object" &&
            errBody !== null &&
            "error" in errBody
          ) {
            const err = (errBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status, errBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
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
        let message = `XAI API error: ${res.status}`;
        let errBody: unknown = null;
        try {
          errBody = await res.json();
          if (
            typeof errBody === "object" &&
            errBody !== null &&
            "error" in errBody
          ) {
            const err = (errBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status, errBody);
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
  }

  async function makeMultipartRequest<T>(
    path: string,
    form: FormData,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${opts.apiKey}` },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `XAI API error: ${res.status}`;
        let errBody: unknown = null;
        try {
          errBody = await res.json();
          if (
            typeof errBody === "object" &&
            errBody !== null &&
            "error" in errBody
          ) {
            const err = (errBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status, errBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
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

  // GET https://api.x.ai/v1/files/{fileIdOrSignal}
  // Docs: https://docs.x.ai/docs/api-reference
  async function getFiles(
    fileIdOrSignal?: string | AbortSignal,
    signal?: AbortSignal
  ): Promise<XaiFileListResponse | XaiFileObject> {
    if (typeof fileIdOrSignal === "string") {
      return makeRequest<XaiFileObject>(
        "GET",
        `/files/${fileIdOrSignal}`,
        undefined,
        signal
      );
    }
    return makeRequest<XaiFileListResponse>(
      "GET",
      "/files",
      undefined,
      fileIdOrSignal
    );
  }

  const getFilesNamespace = Object.assign(getFiles, {
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
  });

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
                  req: XaiImageGenerateRequest,
                  signal?: AbortSignal
                ): Promise<XaiImageResponse> {
                  return await makeRequest(
                    "POST",
                    "/images/generations",
                    req,
                    signal
                  );
                },
                {
                  schema: XaiImageGenerateRequestSchema,
                }
              ),
              // POST https://api.x.ai/v1/images/edits
              // Docs: https://docs.x.ai/developers/rest-api-reference/inference/images
              edits: Object.assign(
                async function edits(
                  req: XaiImageEditRequest,
                  signal?: AbortSignal
                ): Promise<XaiImageResponse> {
                  return await makeRequest(
                    "POST",
                    "/images/edits",
                    normalizeImageEditRequest(req),
                    signal
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
                  req: XaiVideoGenerateRequest,
                  signal?: AbortSignal
                ): Promise<XaiVideoAsyncResponse> {
                  return await makeRequest(
                    "POST",
                    "/videos/generations",
                    applyVideoGenerationDefaults(req),
                    signal
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
                  req: XaiVideoEditRequest,
                  signal?: AbortSignal
                ): Promise<XaiVideoAsyncResponse> {
                  return await makeRequest(
                    "POST",
                    "/videos/edits",
                    req,
                    signal
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
                  req: XaiVideoExtendRequest,
                  signal?: AbortSignal
                ): Promise<XaiVideoAsyncResponse> {
                  return await makeRequest(
                    "POST",
                    "/videos/extensions",
                    req,
                    signal
                  );
                },
                {
                  schema: XaiVideoExtendRequestSchema,
                }
              ),
            },
            // POST https://api.x.ai/v1/files
            // Docs: https://docs.x.ai/docs/api-reference
            files: Object.assign(async function postFiles(
              file: Blob,
              filename: string,
              purpose?: string,
              signal?: AbortSignal
            ): Promise<XaiFileObject> {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);
              if (signal) {
                attachAbortHandler(signal, controller);
              }

              try {
                const formData = new FormData();
                formData.append("file", file, filename);
                if (purpose !== undefined) formData.append("purpose", purpose);

                const res = await doFetch(`${baseURL}/files`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${opts.apiKey}` },
                  body: formData,
                  signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                  let message = `XAI API error: ${res.status}`;
                  let body: unknown = null;
                  try {
                    body = await res.json();
                    if (
                      typeof body === "object" &&
                      body !== null &&
                      "error" in body
                    ) {
                      const err = (body as { error: { message?: string } })
                        .error;
                      if (err?.message) {
                        message = `XAI API error ${res.status}: ${err.message}`;
                      }
                    }
                  } catch {
                    // ignore parse errors
                  }
                  throw new XaiError(message, res.status, body);
                }

                return (await res.json()) as XaiFileObject;
              } catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof XaiError) throw error;
                throw new XaiError(`XAI request failed: ${error}`, 500);
              }
            }, {}),
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
            // POST https://api.x.ai/v1/custom-voices
            // Docs: https://docs.x.ai/docs/api-reference
            customVoices: Object.assign(
              async function customVoices(
                req: XaiCustomVoiceCreateRequest,
                signal?: AbortSignal
              ): Promise<XaiCustomVoice> {
                const form = new FormData();
                form.append("file", req.file, req.filename ?? "reference");
                form.append("name", req.name);
                form.append("language", req.language);
                return await makeMultipartRequest<XaiCustomVoice>(
                  "/custom-voices",
                  form,
                  signal
                );
              },
              {
                schema: XaiCustomVoiceCreateRequestSchema,
              }
            ),
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
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                if (signal) {
                  attachAbortHandler(signal, controller);
                }

                try {
                  const res = await doFetch(
                    `${baseURL}/chat/deferred-completion/${encodeURIComponent(requestId)}`,
                    {
                      method: "GET",
                      headers: { Authorization: `Bearer ${opts.apiKey}` },
                      signal: controller.signal,
                    }
                  );

                  clearTimeout(timeoutId);

                  if (res.status === 202) {
                    return { ready: false, data: null };
                  }

                  if (!res.ok) {
                    let message = `XAI API error: ${res.status}`;
                    let body: unknown = null;
                    try {
                      body = await res.json();
                      if (
                        typeof body === "object" &&
                        body !== null &&
                        "error" in body
                      ) {
                        const err = (body as { error: { message?: string } })
                          .error;
                        if (err?.message) {
                          message = `XAI API error ${res.status}: ${err.message}`;
                        }
                      }
                    } catch {
                      // ignore parse errors
                    }
                    throw new XaiError(message, res.status, body);
                  }

                  const data = (await res.json()) as XaiChatResponse;
                  return { ready: true, data };
                } catch (error) {
                  clearTimeout(timeoutId);
                  if (error instanceof XaiError) throw error;
                  throw new XaiError(`XAI request failed: ${error}`, 500);
                }
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
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);
              if (signal) {
                attachAbortHandler(signal, controller);
              }

              try {
                const res = await doFetch(`${baseURL}/files/${fileId}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${opts.apiKey}` },
                  signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                  let deleteBody: unknown = null;
                  try {
                    deleteBody = await res.json();
                  } catch {
                    // ignore parse errors
                  }
                  throw new XaiError(
                    `XAI API error: ${res.status}`,
                    res.status,
                    deleteBody
                  );
                }

                return (await res.json()) as { id: string; deleted: boolean };
              } catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof XaiError) throw error;
                throw new XaiError(`XAI request failed: ${error}`, 500);
              }
            },
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
