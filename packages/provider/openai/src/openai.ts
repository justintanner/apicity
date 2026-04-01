import {
  OpenAiOptions,
  OpenAiChatRequest,
  OpenAiChatResponse,
  OpenAiSpeechRequest,
  OpenAiTranscribeRequest,
  OpenAiTranscribeResponse,
  OpenAiTranslateRequest,
  OpenAiTranslateResponse,
  OpenAiEmbeddingRequest,
  OpenAiEmbeddingResponse,
  OpenAiImageEditRequest,
  OpenAiImageEditResponse,
  OpenAiImageGenerationRequest,
  OpenAiImageGenerationResponse,
  OpenAiFileListRequest,
  OpenAiFileListResponse,
  OpenAiFile,
  OpenAiFileUploadRequest,
  OpenAiFileDeleteResponse,
  OpenAiModelListResponse,
  OpenAiModel,
  OpenAiModelDeleteResponse,
  OpenAiBatchCreateRequest,
  OpenAiBatch,
  OpenAiBatchListParams,
  OpenAiBatchListResponse,
  OpenAiResponseRequest,
  OpenAiResponseResponse,
  OpenAiResponseDeleteResponse,
  OpenAiResponseGetOptions,
  OpenAiResponseInputItemsOptions,
  OpenAiResponseInputItemsResponse,
  OpenAiResponseCompactRequest,
  OpenAiResponseCompactResponse,
  OpenAiResponseInputTokensRequest,
  OpenAiResponseInputTokensResponse,
  OpenAiModerationRequest,
  OpenAiModerationResponse,
  OpenAiFineTuningJobCreateRequest,
  OpenAiFineTuningJob,
  OpenAiFineTuningJobListOptions,
  OpenAiFineTuningJobListResponse,
  OpenAiFineTuningJobEventListOptions,
  OpenAiFineTuningJobEventListResponse,
  OpenAiFineTuningJobCheckpointListOptions,
  OpenAiFineTuningJobCheckpointListResponse,
  OpenAiCheckpointPermissionCreateRequest,
  OpenAiCheckpointPermissionCreateResponse,
  OpenAiCheckpointPermissionListOptions,
  OpenAiCheckpointPermissionListResponse,
  OpenAiCheckpointPermissionDeleteResponse,
  OpenAiStoredCompletionListOptions,
  OpenAiStoredCompletionListResponse,
  OpenAiStoredCompletionDeleteResponse,
  OpenAiStoredCompletionUpdateRequest,
  OpenAiStoredCompletionMessageListOptions,
  OpenAiStoredCompletionMessageListResponse,
  OpenAiProvider,
  OpenAiError,
} from "./types";
import type { ValidationResult } from "./types";
import {
  chatCompletionsSchema,
  embeddingsSchema,
  filesUploadSchema,
  filesDeleteSchema,
  imageEditsSchema,
  imageGenerationsSchema,
  modelsDeleteSchema,
  moderationsSchema,
  audioSpeechSchema,
  batchesCreateSchema,
  batchesCancelSchema,
  audioTranscriptionsSchema,
  audioTranslationsSchema,
  responsesSchema,
  responsesDeleteSchema,
  responsesCancelSchema,
  responsesCompactSchema,
  responsesInputTokensSchema,
  fineTuningJobsCreateSchema,
  checkpointPermissionsCreateSchema,
  storedCompletionsUpdateSchema,
  storedCompletionsDeleteSchema,
} from "./schemas";
import { validatePayload } from "./validate";

export function openai(opts: OpenAiOptions): OpenAiProvider {
  const baseURL = opts.baseURL ?? "https://api.openai.com/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    path: string,
    init: { headers: Record<string, string>; body: BodyInit },
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          ...init.headers,
        },
        body: init.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `OpenAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `OpenAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new OpenAiError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenAiError) throw error;
      throw new OpenAiError(`OpenAI request failed: ${error}`, 500);
    }
  }

  function jsonRequest(body: unknown): {
    headers: Record<string, string>;
    body: string;
  } {
    return {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }

  async function makeBinaryRequest(
    path: string,
    init: { headers: Record<string, string>; body: BodyInit },
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          ...init.headers,
        },
        body: init.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `OpenAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `OpenAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new OpenAiError(message, res.status, body);
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenAiError) throw error;
      throw new OpenAiError(`OpenAI request failed: ${error}`, 500);
    }
  }

  async function makeGetRequest<T>(
    path: string,
    query?: Record<string, string | string[] | boolean | undefined>,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const params = new URLSearchParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            params.append(`${key}[]`, v);
          }
        } else {
          params.append(key, String(value));
        }
      }
    }
    const qs = params.toString();
    const url = `${baseURL}${path}${qs ? `?${qs}` : ""}`;

    try {
      const res = await doFetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `OpenAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `OpenAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new OpenAiError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenAiError) throw error;
      throw new OpenAiError(`OpenAI request failed: ${error}`, 500);
    }
  }

  async function makeEmptyPostRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `OpenAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `OpenAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new OpenAiError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenAiError) throw error;
      throw new OpenAiError(`OpenAI request failed: ${error}`, 500);
    }
  }

  async function makeDeleteRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `OpenAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `OpenAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new OpenAiError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenAiError) throw error;
      throw new OpenAiError(`OpenAI request failed: ${error}`, 500);
    }
  }

  async function makeGetTextRequest(
    path: string,
    signal?: AbortSignal
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const url = `${baseURL}${path}`;

    try {
      const res = await doFetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `OpenAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `OpenAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new OpenAiError(message, res.status, body);
      }

      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenAiError) throw error;
      throw new OpenAiError(`OpenAI request failed: ${error}`, 500);
    }
  }

  return {
    v1: {
      chat: {
        completions: Object.assign(
          async function completions(
            req: OpenAiChatRequest,
            signal?: AbortSignal
          ): Promise<OpenAiChatResponse> {
            return await makeRequest<OpenAiChatResponse>(
              "/chat/completions",
              jsonRequest(req),
              signal
            );
          },
          {
            payloadSchema: chatCompletionsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, chatCompletionsSchema);
            },
            list: async function list(
              listOpts?: OpenAiStoredCompletionListOptions,
              signal?: AbortSignal
            ): Promise<OpenAiStoredCompletionListResponse> {
              const query: Record<string, string | undefined> = {};
              if (listOpts?.after) query.after = listOpts.after;
              if (listOpts?.limit !== undefined)
                query.limit = String(listOpts.limit);
              if (listOpts?.order) query.order = listOpts.order;
              if (listOpts?.metadata) {
                for (const [k, v] of Object.entries(listOpts.metadata)) {
                  query[`metadata[${k}]`] = v;
                }
              }
              return await makeGetRequest<OpenAiStoredCompletionListResponse>(
                "/chat/completions",
                query,
                signal
              );
            },
            retrieve: async function retrieve(
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiChatResponse> {
              return await makeGetRequest<OpenAiChatResponse>(
                `/chat/completions/${encodeURIComponent(id)}`,
                undefined,
                signal
              );
            },
            del: Object.assign(
              async function del(
                id: string,
                signal?: AbortSignal
              ): Promise<OpenAiStoredCompletionDeleteResponse> {
                return await makeDeleteRequest<OpenAiStoredCompletionDeleteResponse>(
                  `/chat/completions/${encodeURIComponent(id)}`,
                  signal
                );
              },
              {
                payloadSchema: storedCompletionsDeleteSchema,
                // Verb accessors for GET + DELETE on /chat/completions/:id
                get: async function retrieve(
                  id: string,
                  signal?: AbortSignal
                ): Promise<OpenAiChatResponse> {
                  return await makeGetRequest<OpenAiChatResponse>(
                    `/chat/completions/${encodeURIComponent(id)}`,
                    undefined,
                    signal
                  );
                },
                delete: async function del(
                  id: string,
                  signal?: AbortSignal
                ): Promise<OpenAiStoredCompletionDeleteResponse> {
                  return await makeDeleteRequest<OpenAiStoredCompletionDeleteResponse>(
                    `/chat/completions/${encodeURIComponent(id)}`,
                    signal
                  );
                },
              }
            ),
            update: Object.assign(
              async function update(
                id: string,
                req: OpenAiStoredCompletionUpdateRequest,
                signal?: AbortSignal
              ): Promise<OpenAiChatResponse> {
                return await makeRequest<OpenAiChatResponse>(
                  `/chat/completions/${encodeURIComponent(id)}`,
                  jsonRequest(req),
                  signal
                );
              },
              {
                payloadSchema: storedCompletionsUpdateSchema,
                validatePayload(data: unknown): ValidationResult {
                  return validatePayload(data, storedCompletionsUpdateSchema);
                },
                // Verb accessors for GET + POST on /chat/completions/:id
                get: async function retrieve(
                  id: string,
                  signal?: AbortSignal
                ): Promise<OpenAiChatResponse> {
                  return await makeGetRequest<OpenAiChatResponse>(
                    `/chat/completions/${encodeURIComponent(id)}`,
                    undefined,
                    signal
                  );
                },
                post: async function update(
                  id: string,
                  req: OpenAiStoredCompletionUpdateRequest,
                  signal?: AbortSignal
                ): Promise<OpenAiChatResponse> {
                  return await makeRequest<OpenAiChatResponse>(
                    `/chat/completions/${encodeURIComponent(id)}`,
                    jsonRequest(req),
                    signal
                  );
                },
              }
            ),
            messages: {
              list: async function list(
                id: string,
                msgOpts?: OpenAiStoredCompletionMessageListOptions,
                signal?: AbortSignal
              ): Promise<OpenAiStoredCompletionMessageListResponse> {
                const query: Record<string, string | undefined> = {};
                if (msgOpts?.after) query.after = msgOpts.after;
                if (msgOpts?.limit !== undefined)
                  query.limit = String(msgOpts.limit);
                if (msgOpts?.order) query.order = msgOpts.order;
                return await makeGetRequest<OpenAiStoredCompletionMessageListResponse>(
                  `/chat/completions/${encodeURIComponent(id)}/messages`,
                  query,
                  signal
                );
              },
            },
            // Verb accessors for POST + GET on /chat/completions
            post: async function completions(
              req: OpenAiChatRequest,
              signal?: AbortSignal
            ): Promise<OpenAiChatResponse> {
              return await makeRequest<OpenAiChatResponse>(
                "/chat/completions",
                jsonRequest(req),
                signal
              );
            },
            get: async function get(
              idOrOpts?: string | OpenAiStoredCompletionListOptions,
              signal?: AbortSignal
            ): Promise<
              OpenAiChatResponse | OpenAiStoredCompletionListResponse
            > {
              if (typeof idOrOpts === "string") {
                return await makeGetRequest<OpenAiChatResponse>(
                  `/chat/completions/${encodeURIComponent(idOrOpts)}`,
                  undefined,
                  signal
                );
              }
              const query: Record<string, string | undefined> = {};
              if (idOrOpts?.after) query.after = idOrOpts.after;
              if (idOrOpts?.limit !== undefined)
                query.limit = String(idOrOpts.limit);
              if (idOrOpts?.order) query.order = idOrOpts.order;
              if (idOrOpts?.metadata) {
                for (const [k, v] of Object.entries(idOrOpts.metadata)) {
                  query[`metadata[${k}]`] = v;
                }
              }
              return await makeGetRequest<OpenAiStoredCompletionListResponse>(
                "/chat/completions",
                query,
                signal
              );
            },
          }
        ),
      },
      embeddings: Object.assign(
        async function embeddings(
          req: OpenAiEmbeddingRequest,
          signal?: AbortSignal
        ): Promise<OpenAiEmbeddingResponse> {
          return await makeRequest<OpenAiEmbeddingResponse>(
            "/embeddings",
            jsonRequest(req),
            signal
          );
        },
        {
          payloadSchema: embeddingsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, chatCompletionsSchema);
          },
        }
      ),
      files: {
        list: async function list(
          listOpts?: OpenAiFileListRequest,
          signal?: AbortSignal
        ): Promise<OpenAiFileListResponse> {
          const query: Record<string, string | undefined> = {};
          if (listOpts?.purpose !== undefined) query.purpose = listOpts.purpose;
          if (listOpts?.limit !== undefined)
            query.limit = String(listOpts.limit);
          if (listOpts?.order !== undefined) query.order = listOpts.order;
          if (listOpts?.after !== undefined) query.after = listOpts.after;
          return await makeGetRequest<OpenAiFileListResponse>(
            "/files",
            query,
            signal
          );
        },
        upload: Object.assign(
          async function upload(
            req: OpenAiFileUploadRequest,
            signal?: AbortSignal
          ): Promise<OpenAiFile> {
            const form = new FormData();
            form.append("file", req.file);
            form.append("purpose", req.purpose);
            if (req.expires_after !== undefined) {
              form.append("expires_after", JSON.stringify(req.expires_after));
            }

            return await makeRequest<OpenAiFile>(
              "/files",
              { headers: {}, body: form },
              signal
            );
          },
          {
            payloadSchema: filesUploadSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, filesUploadSchema);
            },
          }
        ),
        retrieve: async function retrieve(
          fileId: string,
          signal?: AbortSignal
        ): Promise<OpenAiFile> {
          return await makeGetRequest<OpenAiFile>(
            `/files/${encodeURIComponent(fileId)}`,
            undefined,
            signal
          );
        },
        del: Object.assign(
          async function del(
            fileId: string,
            signal?: AbortSignal
          ): Promise<OpenAiFileDeleteResponse> {
            return await makeDeleteRequest<OpenAiFileDeleteResponse>(
              `/files/${encodeURIComponent(fileId)}`,
              signal
            );
          },
          {
            payloadSchema: filesDeleteSchema,
            // Verb accessors for GET + DELETE on /files/:id
            get: async function retrieve(
              fileId: string,
              signal?: AbortSignal
            ): Promise<OpenAiFile> {
              return await makeGetRequest<OpenAiFile>(
                `/files/${encodeURIComponent(fileId)}`,
                undefined,
                signal
              );
            },
            delete: async function del(
              fileId: string,
              signal?: AbortSignal
            ): Promise<OpenAiFileDeleteResponse> {
              return await makeDeleteRequest<OpenAiFileDeleteResponse>(
                `/files/${encodeURIComponent(fileId)}`,
                signal
              );
            },
          }
        ),
        content: async function content(
          fileId: string,
          signal?: AbortSignal
        ): Promise<string> {
          return await makeGetTextRequest(
            `/files/${encodeURIComponent(fileId)}/content`,
            signal
          );
        },
        // Verb accessors for POST + GET on /files
        get: async function list(
          listOpts?: OpenAiFileListRequest,
          signal?: AbortSignal
        ): Promise<OpenAiFileListResponse> {
          const query: Record<string, string | undefined> = {};
          if (listOpts?.purpose !== undefined) query.purpose = listOpts.purpose;
          if (listOpts?.limit !== undefined)
            query.limit = String(listOpts.limit);
          if (listOpts?.order !== undefined) query.order = listOpts.order;
          if (listOpts?.after !== undefined) query.after = listOpts.after;
          return await makeGetRequest<OpenAiFileListResponse>(
            "/files",
            query,
            signal
          );
        },
        post: Object.assign(
          async function upload(
            req: OpenAiFileUploadRequest,
            signal?: AbortSignal
          ): Promise<OpenAiFile> {
            const form = new FormData();
            form.append("file", req.file);
            form.append("purpose", req.purpose);
            if (req.expires_after !== undefined) {
              form.append("expires_after", JSON.stringify(req.expires_after));
            }

            return await makeRequest<OpenAiFile>(
              "/files",
              { headers: {}, body: form },
              signal
            );
          },
          {
            payloadSchema: filesUploadSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, filesUploadSchema);
            },
          }
        ),
      },
      images: {
        edits: Object.assign(
          async function edits(
            req: OpenAiImageEditRequest,
            signal?: AbortSignal
          ): Promise<OpenAiImageEditResponse> {
            const form = new FormData();
            if (Array.isArray(req.image)) {
              for (const img of req.image) {
                form.append("image", img);
              }
            } else {
              form.append("image", req.image);
            }
            form.append("prompt", req.prompt);
            if (req.mask !== undefined) form.append("mask", req.mask);
            if (req.model !== undefined) form.append("model", req.model);
            if (req.n !== undefined) form.append("n", String(req.n));
            if (req.size !== undefined) form.append("size", req.size);
            if (req.quality !== undefined) form.append("quality", req.quality);
            if (req.output_format !== undefined)
              form.append("output_format", req.output_format);
            if (req.response_format !== undefined)
              form.append("response_format", req.response_format);
            if (req.background !== undefined)
              form.append("background", req.background);
            if (req.input_fidelity !== undefined)
              form.append("input_fidelity", req.input_fidelity);
            if (req.output_compression !== undefined)
              form.append("output_compression", String(req.output_compression));
            if (req.user !== undefined) form.append("user", req.user);

            return await makeRequest<OpenAiImageEditResponse>(
              "/images/edits",
              { headers: {}, body: form },
              signal
            );
          },
          {
            payloadSchema: imageEditsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, imageEditsSchema);
            },
          }
        ),
        generations: Object.assign(
          async function generations(
            req: OpenAiImageGenerationRequest,
            signal?: AbortSignal
          ): Promise<OpenAiImageGenerationResponse> {
            return await makeRequest<OpenAiImageGenerationResponse>(
              "/images/generations",
              jsonRequest(req),
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
      },
      models: {
        list: async function list(
          signal?: AbortSignal
        ): Promise<OpenAiModelListResponse> {
          return await makeGetRequest<OpenAiModelListResponse>(
            "/models",
            undefined,
            signal
          );
        },
        retrieve: async function retrieve(
          model: string,
          signal?: AbortSignal
        ): Promise<OpenAiModel> {
          return await makeGetRequest<OpenAiModel>(
            `/models/${encodeURIComponent(model)}`,
            undefined,
            signal
          );
        },
        del: Object.assign(
          async function del(
            model: string,
            signal?: AbortSignal
          ): Promise<OpenAiModelDeleteResponse> {
            return await makeDeleteRequest<OpenAiModelDeleteResponse>(
              `/models/${encodeURIComponent(model)}`,
              signal
            );
          },
          {
            payloadSchema: modelsDeleteSchema,
            // Verb accessors for GET + DELETE on /models/:id
            get: async function retrieve(
              model: string,
              signal?: AbortSignal
            ): Promise<OpenAiModel> {
              return await makeGetRequest<OpenAiModel>(
                `/models/${encodeURIComponent(model)}`,
                undefined,
                signal
              );
            },
            delete: async function del(
              model: string,
              signal?: AbortSignal
            ): Promise<OpenAiModelDeleteResponse> {
              return await makeDeleteRequest<OpenAiModelDeleteResponse>(
                `/models/${encodeURIComponent(model)}`,
                signal
              );
            },
          }
        ),
      },
      moderations: Object.assign(
        async function moderations(
          req: OpenAiModerationRequest,
          signal?: AbortSignal
        ): Promise<OpenAiModerationResponse> {
          return await makeRequest<OpenAiModerationResponse>(
            "/moderations",
            jsonRequest(req),
            signal
          );
        },
        {
          payloadSchema: moderationsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, moderationsSchema);
          },
        }
      ),
      batches: Object.assign(
        async function batches(
          req: OpenAiBatchCreateRequest,
          signal?: AbortSignal
        ): Promise<OpenAiBatch> {
          return await makeRequest<OpenAiBatch>(
            "/batches",
            jsonRequest(req),
            signal
          );
        },
        {
          payloadSchema: batchesCreateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, batchesCreateSchema);
          },
          list: async function list(
            params?: OpenAiBatchListParams,
            signal?: AbortSignal
          ): Promise<OpenAiBatchListResponse> {
            return await makeGetRequest<OpenAiBatchListResponse>(
              "/batches",
              {
                after: params?.after,
                limit:
                  params?.limit !== undefined
                    ? String(params.limit)
                    : undefined,
              },
              signal
            );
          },
          retrieve: async function retrieve(
            batchId: string,
            signal?: AbortSignal
          ): Promise<OpenAiBatch> {
            return await makeGetRequest<OpenAiBatch>(
              `/batches/${encodeURIComponent(batchId)}`,
              undefined,
              signal
            );
          },
          cancel: Object.assign(
            async function cancel(
              batchId: string,
              signal?: AbortSignal
            ): Promise<OpenAiBatch> {
              return await makeRequest<OpenAiBatch>(
                `/batches/${encodeURIComponent(batchId)}/cancel`,
                jsonRequest({}),
                signal
              );
            },
            {
              payloadSchema: batchesCancelSchema,
            }
          ),
          // Verb accessors for POST + GET on /batches
          post: async function batches(
            req: OpenAiBatchCreateRequest,
            signal?: AbortSignal
          ): Promise<OpenAiBatch> {
            return await makeRequest<OpenAiBatch>(
              "/batches",
              jsonRequest(req),
              signal
            );
          },
          get: async function list(
            params?: OpenAiBatchListParams,
            signal?: AbortSignal
          ): Promise<OpenAiBatchListResponse> {
            return await makeGetRequest<OpenAiBatchListResponse>(
              "/batches",
              {
                after: params?.after,
                limit:
                  params?.limit !== undefined
                    ? String(params.limit)
                    : undefined,
              },
              signal
            );
          },
        }
      ),
      responses: Object.assign(
        async function responses(
          req: OpenAiResponseRequest,
          signal?: AbortSignal
        ): Promise<OpenAiResponseResponse> {
          return await makeRequest<OpenAiResponseResponse>(
            "/responses",
            jsonRequest(req),
            signal
          );
        },
        {
          payloadSchema: responsesSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, responsesSchema);
          },
          get: async function get(
            id: string,
            getOpts?: OpenAiResponseGetOptions,
            signal?: AbortSignal
          ): Promise<OpenAiResponseResponse> {
            return await makeGetRequest<OpenAiResponseResponse>(
              `/responses/${encodeURIComponent(id)}`,
              {
                include: getOpts?.include,
                stream: getOpts?.stream,
              },
              signal
            );
          },
          del: Object.assign(
            async function del(
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiResponseDeleteResponse> {
              return await makeDeleteRequest<OpenAiResponseDeleteResponse>(
                `/responses/${encodeURIComponent(id)}`,
                signal
              );
            },
            {
              payloadSchema: responsesDeleteSchema,
              // Verb accessor for DELETE on /responses/:id
              delete: async function del(
                id: string,
                signal?: AbortSignal
              ): Promise<OpenAiResponseDeleteResponse> {
                return await makeDeleteRequest<OpenAiResponseDeleteResponse>(
                  `/responses/${encodeURIComponent(id)}`,
                  signal
                );
              },
            }
          ),
          cancel: Object.assign(
            async function cancel(
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiResponseResponse> {
              return await makeEmptyPostRequest<OpenAiResponseResponse>(
                `/responses/${encodeURIComponent(id)}/cancel`,
                signal
              );
            },
            {
              payloadSchema: responsesCancelSchema,
            }
          ),
          input_items: async function input_items(
            id: string,
            opts?: OpenAiResponseInputItemsOptions,
            signal?: AbortSignal
          ): Promise<OpenAiResponseInputItemsResponse> {
            return await makeGetRequest<OpenAiResponseInputItemsResponse>(
              `/responses/${encodeURIComponent(id)}/input_items`,
              {
                after: opts?.after,
                limit:
                  opts?.limit !== undefined ? String(opts.limit) : undefined,
                order: opts?.order,
                include: opts?.include,
              },
              signal
            );
          },
          compact: Object.assign(
            async function compact(
              req: OpenAiResponseCompactRequest,
              signal?: AbortSignal
            ): Promise<OpenAiResponseCompactResponse> {
              return await makeRequest<OpenAiResponseCompactResponse>(
                "/responses/compact",
                jsonRequest(req),
                signal
              );
            },
            {
              payloadSchema: responsesCompactSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, responsesCompactSchema);
              },
            }
          ),
          input_tokens: Object.assign(
            async function input_tokens(
              req: OpenAiResponseInputTokensRequest,
              signal?: AbortSignal
            ): Promise<OpenAiResponseInputTokensResponse> {
              return await makeRequest<OpenAiResponseInputTokensResponse>(
                "/responses/input_tokens",
                jsonRequest(req),
                signal
              );
            },
            {
              payloadSchema: responsesInputTokensSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, responsesInputTokensSchema);
              },
            }
          ),
        }
      ),
      audio: {
        speech: Object.assign(
          async function speech(
            req: OpenAiSpeechRequest,
            signal?: AbortSignal
          ): Promise<ArrayBuffer> {
            return await makeBinaryRequest(
              "/audio/speech",
              jsonRequest(req),
              signal
            );
          },
          {
            payloadSchema: audioSpeechSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, audioSpeechSchema);
            },
          }
        ),
        transcriptions: Object.assign(
          async function transcriptions(
            req: OpenAiTranscribeRequest,
            signal?: AbortSignal
          ): Promise<OpenAiTranscribeResponse> {
            const form = new FormData();
            form.append("file", req.file);
            form.append("model", req.model);
            if (req.response_format !== undefined)
              form.append("response_format", req.response_format);
            if (req.language !== undefined)
              form.append("language", req.language);
            if (req.prompt !== undefined) form.append("prompt", req.prompt);
            if (req.temperature !== undefined)
              form.append("temperature", String(req.temperature));

            const data = await makeRequest<OpenAiTranscribeResponse>(
              "/audio/transcriptions",
              { headers: {}, body: form },
              signal
            );
            return data;
          },
          {
            payloadSchema: audioTranscriptionsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, audioTranscriptionsSchema);
            },
          }
        ),
        translations: Object.assign(
          async function translations(
            req: OpenAiTranslateRequest,
            signal?: AbortSignal
          ): Promise<OpenAiTranslateResponse> {
            const form = new FormData();
            form.append("file", req.file);
            form.append("model", req.model);
            if (req.response_format !== undefined)
              form.append("response_format", req.response_format);
            if (req.prompt !== undefined) form.append("prompt", req.prompt);
            if (req.temperature !== undefined)
              form.append("temperature", String(req.temperature));

            const data = await makeRequest<OpenAiTranslateResponse>(
              "/audio/translations",
              { headers: {}, body: form },
              signal
            );
            return data;
          },
          {
            payloadSchema: audioTranslationsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, audioTranslationsSchema);
            },
          }
        ),
      },
      fine_tuning: {
        jobs: Object.assign(
          async function jobs(
            req: OpenAiFineTuningJobCreateRequest,
            signal?: AbortSignal
          ): Promise<OpenAiFineTuningJob> {
            return await makeRequest<OpenAiFineTuningJob>(
              "/fine_tuning/jobs",
              jsonRequest(req),
              signal
            );
          },
          {
            payloadSchema: fineTuningJobsCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, fineTuningJobsCreateSchema);
            },
            list: async function list(
              listOpts?: OpenAiFineTuningJobListOptions,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJobListResponse> {
              const query: Record<string, string | undefined> = {};
              if (listOpts?.after) query.after = listOpts.after;
              if (listOpts?.limit !== undefined)
                query.limit = String(listOpts.limit);
              if (listOpts?.metadata) {
                for (const [k, v] of Object.entries(listOpts.metadata)) {
                  query[`metadata[${k}]`] = v;
                }
              }
              return await makeGetRequest<OpenAiFineTuningJobListResponse>(
                "/fine_tuning/jobs",
                query,
                signal
              );
            },
            retrieve: async function retrieve(
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJob> {
              return await makeGetRequest<OpenAiFineTuningJob>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}`,
                undefined,
                signal
              );
            },
            cancel: async function cancel(
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJob> {
              return await makeEmptyPostRequest<OpenAiFineTuningJob>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}/cancel`,
                signal
              );
            },
            pause: async function pause(
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJob> {
              return await makeEmptyPostRequest<OpenAiFineTuningJob>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}/pause`,
                signal
              );
            },
            resume: async function resume(
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJob> {
              return await makeEmptyPostRequest<OpenAiFineTuningJob>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}/resume`,
                signal
              );
            },
            events: async function events(
              id: string,
              evtOpts?: OpenAiFineTuningJobEventListOptions,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJobEventListResponse> {
              const query: Record<string, string | undefined> = {};
              if (evtOpts?.after) query.after = evtOpts.after;
              if (evtOpts?.limit !== undefined)
                query.limit = String(evtOpts.limit);
              return await makeGetRequest<OpenAiFineTuningJobEventListResponse>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}/events`,
                query,
                signal
              );
            },
            checkpoints: async function checkpoints(
              id: string,
              cpOpts?: OpenAiFineTuningJobCheckpointListOptions,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJobCheckpointListResponse> {
              const query: Record<string, string | undefined> = {};
              if (cpOpts?.after) query.after = cpOpts.after;
              if (cpOpts?.limit !== undefined)
                query.limit = String(cpOpts.limit);
              return await makeGetRequest<OpenAiFineTuningJobCheckpointListResponse>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}/checkpoints`,
                query,
                signal
              );
            },
            // Verb accessors for POST + GET on /fine_tuning/jobs
            post: async function jobs(
              req: OpenAiFineTuningJobCreateRequest,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJob> {
              return await makeRequest<OpenAiFineTuningJob>(
                "/fine_tuning/jobs",
                jsonRequest(req),
                signal
              );
            },
            get: async function list(
              listOpts?: OpenAiFineTuningJobListOptions,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJobListResponse> {
              const query: Record<string, string | undefined> = {};
              if (listOpts?.after) query.after = listOpts.after;
              if (listOpts?.limit !== undefined)
                query.limit = String(listOpts.limit);
              if (listOpts?.metadata) {
                for (const [k, v] of Object.entries(listOpts.metadata)) {
                  query[`metadata[${k}]`] = v;
                }
              }
              return await makeGetRequest<OpenAiFineTuningJobListResponse>(
                "/fine_tuning/jobs",
                query,
                signal
              );
            },
          }
        ),
        checkpoints: {
          permissions: Object.assign(
            async function permissions(
              checkpoint: string,
              req: OpenAiCheckpointPermissionCreateRequest,
              signal?: AbortSignal
            ): Promise<OpenAiCheckpointPermissionCreateResponse> {
              return await makeRequest<OpenAiCheckpointPermissionCreateResponse>(
                `/fine_tuning/checkpoints/${encodeURIComponent(checkpoint)}/permissions`,
                jsonRequest(req),
                signal
              );
            },
            {
              payloadSchema: checkpointPermissionsCreateSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, checkpointPermissionsCreateSchema);
              },
              list: async function list(
                checkpoint: string,
                permOpts?: OpenAiCheckpointPermissionListOptions,
                signal?: AbortSignal
              ): Promise<OpenAiCheckpointPermissionListResponse> {
                const query: Record<string, string | undefined> = {};
                if (permOpts?.after) query.after = permOpts.after;
                if (permOpts?.limit !== undefined)
                  query.limit = String(permOpts.limit);
                if (permOpts?.order) query.order = permOpts.order;
                if (permOpts?.project_id)
                  query.project_id = permOpts.project_id;
                return await makeGetRequest<OpenAiCheckpointPermissionListResponse>(
                  `/fine_tuning/checkpoints/${encodeURIComponent(checkpoint)}/permissions`,
                  query,
                  signal
                );
              },
              del: async function del(
                checkpoint: string,
                permissionId: string,
                signal?: AbortSignal
              ): Promise<OpenAiCheckpointPermissionDeleteResponse> {
                return await makeDeleteRequest<OpenAiCheckpointPermissionDeleteResponse>(
                  `/fine_tuning/checkpoints/${encodeURIComponent(checkpoint)}/permissions/${encodeURIComponent(permissionId)}`,
                  signal
                );
              },
              // Verb accessors for POST + GET on /fine_tuning/checkpoints/:id/permissions
              post: async function permissions(
                checkpoint: string,
                req: OpenAiCheckpointPermissionCreateRequest,
                signal?: AbortSignal
              ): Promise<OpenAiCheckpointPermissionCreateResponse> {
                return await makeRequest<OpenAiCheckpointPermissionCreateResponse>(
                  `/fine_tuning/checkpoints/${encodeURIComponent(checkpoint)}/permissions`,
                  jsonRequest(req),
                  signal
                );
              },
              get: async function list(
                checkpoint: string,
                permOpts?: OpenAiCheckpointPermissionListOptions,
                signal?: AbortSignal
              ): Promise<OpenAiCheckpointPermissionListResponse> {
                const query: Record<string, string | undefined> = {};
                if (permOpts?.after) query.after = permOpts.after;
                if (permOpts?.limit !== undefined)
                  query.limit = String(permOpts.limit);
                if (permOpts?.order) query.order = permOpts.order;
                if (permOpts?.project_id)
                  query.project_id = permOpts.project_id;
                return await makeGetRequest<OpenAiCheckpointPermissionListResponse>(
                  `/fine_tuning/checkpoints/${encodeURIComponent(checkpoint)}/permissions`,
                  query,
                  signal
                );
              },
            }
          ),
        },
      },
    },
  };
}
