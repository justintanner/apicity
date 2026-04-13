import {
  XaiOptions,
  XaiChatRequest,
  XaiChatResponse,
  XaiDeferredChatCompletionResult,
  XaiImageGenerateRequest,
  XaiImageEditRequest,
  XaiImageResponse,
  XaiVideoGenerateRequest,
  XaiVideoEditRequest,
  XaiVideoExtendRequest,
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
  XaiProvider,
  XaiError,
} from "./types";
import {
  XaiChatRequestSchema,
  XaiImageGenerateRequestSchema,
  XaiImageEditRequestSchema,
  XaiVideoGenerateRequestSchema,
  XaiVideoEditRequestSchema,
  XaiVideoExtendRequestSchema,
  XaiBatchCreateRequestSchema,
  XaiCollectionCreateRequestSchema,
  XaiCollectionUpdateRequestSchema,
  XaiDocumentSearchRequestSchema,
  XaiResponseRequestSchema,
  XaiTokenizeTextRequestSchema,
  XaiRealtimeClientSecretRequestSchema,
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

export function xai(opts: XaiOptions): XaiProvider {
  const baseURL = opts.baseURL ?? "https://api.x.ai/v1";
  const managementBaseURL =
    opts.managementBaseURL ?? "https://management-api.x.ai/v1";
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

  // POST https://api.x.ai/v1/collections
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
      // POST https://api.x.ai/v1/collections/{collectionId}/documents/{fileId}
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

  // GET https://api.x.ai/v1/collections/{paramsOrIdOrSignal}
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

  // GET https://api.x.ai/v1/collections/{collectionId}/documents/{paramsOrFileId}
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
      // GET https://api.x.ai/v1/collections/{collectionId}/documents:batchGet{query}
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

  // DELETE https://api.x.ai/v1/collections/{collectionId}
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
      // DELETE https://api.x.ai/v1/collections/{collectionId}/documents/{fileId}
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

  // PUT https://api.x.ai/v1/collections/{collectionId}
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

  return {
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
          // Docs: https://docs.x.ai/docs/api-reference
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
          // Docs: https://docs.x.ai/docs/api-reference
          edits: Object.assign(
            async function edits(
              req: XaiImageEditRequest,
              signal?: AbortSignal
            ): Promise<XaiImageResponse> {
              return await makeRequest("POST", "/images/edits", req, signal);
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
                req,
                signal
              );
            },
            {
              schema: XaiVideoGenerateRequestSchema,
            }
          ),
          // POST https://api.x.ai/v1/videos/edits
          // Docs: https://docs.x.ai/docs/api-reference
          edits: Object.assign(
            async function edits(
              req: XaiVideoEditRequest,
              signal?: AbortSignal
            ): Promise<XaiVideoAsyncResponse> {
              return await makeRequest("POST", "/videos/edits", req, signal);
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

            return (await res.json()) as XaiFileObject;
          } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof XaiError) throw error;
            throw new XaiError(`XAI request failed: ${error}`, 500);
          }
        }, {}),
        batches: postBatches,
        collections: postCollections,
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
      },
    },
    get: {
      v1: {
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
        files: getFiles,
        models: getModels,
        languageModels: getLanguageModels,
        imageGenerationModels: getImageGenerationModels,
        videoGenerationModels: getVideoGenerationModels,
        batches: getBatchesNamespace,
        collections: getCollectionsNamespace,
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
        collections: deleteCollections,
      },
    },
    put: {
      v1: {
        collections: putCollections,
      },
    },
    patch: {
      v1: {
        collections: {
          // PATCH https://api.x.ai/v1/collections/{collectionId}/documents/{fileId}
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
    ws: {
      v1: {
        realtime: function connectRealtime(
          connectOpts?: XaiRealtimeConnectOptions
        ): XaiRealtimeConnection {
          const wsBaseURL = baseURL.replace(/^http/, "ws");
          const token = connectOpts?.token ?? opts.apiKey;

          const ws = new WebSocket(`${wsBaseURL}/realtime`, [
            "realtime",
            `openai-insecure-api-key.${token}`,
            "openai-beta.realtime-v1",
          ]);

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
  };
}
