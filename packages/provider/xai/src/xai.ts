import {
  XaiOptions,
  XaiChatRequest,
  XaiChatResponse,
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
  XaiProvider,
  XaiError,
} from "./types";
import type { ValidationResult } from "./types";
import {
  chatCompletionsSchema,
  responsesSchema,
  imageGenerationsSchema,
  imageEditsSchema,
  videoGenerationsSchema,
  videoEditsSchema,
  videoExtensionsSchema,
  batchCreateSchema,
  batchAddRequestsSchema,
  collectionCreateSchema,
  collectionUpdateSchema,
  documentAddSchema,
  documentSearchSchema,
} from "./schemas";
import { validatePayload } from "./validate";

export function xai(opts: XaiOptions): XaiProvider {
  const baseURL = opts.baseURL ?? "https://api.x.ai/v1";
  const managementBaseURL =
    opts.managementBaseURL ?? "https://management-api.x.ai/v1";
  const managementApiKey = opts.managementApiKey ?? opts.apiKey;
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
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

  const videos = Object.assign(
    async function videos(
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
    {
      generations: Object.assign(
        async function generations(
          req: XaiVideoGenerateRequest,
          signal?: AbortSignal
        ): Promise<XaiVideoAsyncResponse> {
          return await makeRequest("POST", "/videos/generations", req, signal);
        },
        {
          payloadSchema: videoGenerationsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, videoGenerationsSchema);
          },
        }
      ),

      edits: Object.assign(
        async function edits(
          req: XaiVideoEditRequest,
          signal?: AbortSignal
        ): Promise<XaiVideoAsyncResponse> {
          return await makeRequest("POST", "/videos/edits", req, signal);
        },
        {
          payloadSchema: videoEditsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, videoEditsSchema);
          },
        }
      ),

      extensions: Object.assign(
        async function extensions(
          req: XaiVideoExtendRequest,
          signal?: AbortSignal
        ): Promise<XaiVideoAsyncResponse> {
          return await makeRequest("POST", "/videos/extensions", req, signal);
        },
        {
          payloadSchema: videoExtensionsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, videoExtensionsSchema);
          },
        }
      ),
    }
  );

  const files = {
    async upload(
      file: Blob,
      filename: string,
      purpose?: string,
      signal?: AbortSignal
    ): Promise<XaiFileObject> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
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

        return (await res.json()) as XaiFileObject;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof XaiError) throw error;
        throw new XaiError(`XAI request failed: ${error}`, 500);
      }
    },

    async list(signal?: AbortSignal): Promise<XaiFileListResponse> {
      return await makeRequest("GET", "/files", undefined, signal);
    },

    async get(fileId: string, signal?: AbortSignal): Promise<XaiFileObject> {
      return await makeRequest("GET", `/files/${fileId}`, undefined, signal);
    },

    async delete(
      fileId: string,
      signal?: AbortSignal
    ): Promise<{ id: string; deleted: boolean }> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
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
  };

  async function models(
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

  async function languageModels(
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

  async function imageGenerationModels(
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

  async function videoGenerationModels(
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

  const batchRequests = Object.assign(
    async function listRequests(
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
    {
      add: Object.assign(
        async function addRequests(
          batchId: string,
          req: XaiBatchAddRequestsBody,
          signal?: AbortSignal
        ): Promise<void> {
          await makeRequest(
            "POST",
            `/batches/${batchId}/requests`,
            req,
            signal
          );
        },
        {
          payloadSchema: batchAddRequestsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, batchAddRequestsSchema);
          },
        }
      ),
    }
  );

  const batches = Object.assign(
    async function listBatches(
      params?: XaiBatchListParams,
      signal?: AbortSignal
    ): Promise<XaiBatchListResponse> {
      const query = buildQuery(params ?? {});
      return await makeRequest("GET", `/batches${query}`, undefined, signal);
    },
    {
      create: Object.assign(
        async function createBatch(
          req: XaiBatchCreateRequest,
          signal?: AbortSignal
        ): Promise<XaiBatch> {
          return await makeRequest("POST", "/batches", req, signal);
        },
        {
          payloadSchema: batchCreateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, batchCreateSchema);
          },
        }
      ),

      async get(batchId: string, signal?: AbortSignal): Promise<XaiBatch> {
        return await makeRequest(
          "GET",
          `/batches/${batchId}`,
          undefined,
          signal
        );
      },

      async cancel(batchId: string, signal?: AbortSignal): Promise<XaiBatch> {
        return await makeRequest(
          "POST",
          `/batches/${batchId}:cancel`,
          {},
          signal
        );
      },

      requests: batchRequests,

      async results(
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
    }
  );

  async function makeManagementRequest<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
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

  const collectionDocuments = Object.assign(
    async function listDocuments(
      collectionId: string,
      params?: XaiDocumentListParams,
      signal?: AbortSignal
    ): Promise<XaiDocumentListResponse> {
      const query = buildQuery(params ?? {});
      return await makeManagementRequest(
        "GET",
        `/collections/${collectionId}/documents${query}`,
        undefined,
        signal
      );
    },
    {
      add: Object.assign(
        async function addDocument(
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
        {
          payloadSchema: documentAddSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, documentAddSchema);
          },
        }
      ),

      async get(
        collectionId: string,
        fileId: string,
        signal?: AbortSignal
      ): Promise<XaiDocument> {
        return await makeManagementRequest(
          "GET",
          `/collections/${collectionId}/documents/${fileId}`,
          undefined,
          signal
        );
      },

      async delete(
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

      async regenerate(
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

      async batchGet(
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

  const collections = Object.assign(
    async function listCollections(
      params?: XaiCollectionListParams,
      signal?: AbortSignal
    ): Promise<XaiCollectionListResponse> {
      const query = buildQuery(params ?? {});
      return await makeManagementRequest(
        "GET",
        `/collections${query}`,
        undefined,
        signal
      );
    },
    {
      create: Object.assign(
        async function createCollection(
          req: XaiCollectionCreateRequest,
          signal?: AbortSignal
        ): Promise<XaiCollection> {
          return await makeManagementRequest(
            "POST",
            "/collections",
            req,
            signal
          );
        },
        {
          payloadSchema: collectionCreateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, collectionCreateSchema);
          },
        }
      ),

      async get(
        collectionId: string,
        signal?: AbortSignal
      ): Promise<XaiCollection> {
        return await makeManagementRequest(
          "GET",
          `/collections/${collectionId}`,
          undefined,
          signal
        );
      },

      update: Object.assign(
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
          payloadSchema: collectionUpdateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, collectionUpdateSchema);
          },
        }
      ),

      async delete(collectionId: string, signal?: AbortSignal): Promise<void> {
        await makeManagementRequest(
          "DELETE",
          `/collections/${collectionId}`,
          undefined,
          signal
        );
      },

      documents: collectionDocuments,
    }
  );

  return {
    v1: {
      chat: {
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
            payloadSchema: chatCompletionsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, chatCompletionsSchema);
            },
          }
        ),
      },
      images: {
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
            payloadSchema: imageGenerationsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, imageGenerationsSchema);
            },
          }
        ),

        edits: Object.assign(
          async function edits(
            req: XaiImageEditRequest,
            signal?: AbortSignal
          ): Promise<XaiImageResponse> {
            return await makeRequest("POST", "/images/edits", req, signal);
          },
          {
            payloadSchema: imageEditsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, imageEditsSchema);
            },
          }
        ),
      },
      responses: Object.assign(
        async function responses(
          reqOrId: XaiResponseRequest | string,
          signal?: AbortSignal
        ): Promise<XaiResponseResponse> {
          if (typeof reqOrId === "string") {
            return await makeRequest<XaiResponseResponse>(
              "GET",
              `/responses/${encodeURIComponent(reqOrId)}`,
              undefined,
              signal
            );
          }
          return await makeRequest<XaiResponseResponse>(
            "POST",
            "/responses",
            reqOrId,
            signal
          );
        },
        {
          payloadSchema: responsesSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, responsesSchema);
          },
        }
      ),
      videos,
      files,
      batches: batches as XaiProvider["v1"]["batches"],
      collections: collections as XaiProvider["v1"]["collections"],
      documents: {
        search: Object.assign(
          async function search(
            req: XaiDocumentSearchRequest,
            signal?: AbortSignal
          ): Promise<XaiDocumentSearchResponse> {
            return await makeRequest("POST", "/documents/search", req, signal);
          },
          {
            payloadSchema: documentSearchSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, documentSearchSchema);
            },
          }
        ),
      },
      models: models as XaiProvider["v1"]["models"],
      "language-models": languageModels as XaiProvider["v1"]["language-models"],
      "image-generation-models":
        imageGenerationModels as XaiProvider["v1"]["image-generation-models"],
      "video-generation-models":
        videoGenerationModels as XaiProvider["v1"]["video-generation-models"],
    },
  };
}
