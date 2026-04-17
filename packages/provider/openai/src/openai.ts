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
  OpenAiTextPart,
  OpenAiImageUrlPart,
} from "./types";
import {
  OpenAiChatRequestSchema,
  OpenAiEmbeddingRequestSchema,
  OpenAiFileUploadRequestSchema,
  OpenAiImageEditRequestSchema,
  OpenAiImageGenerationRequestSchema,
  OpenAiModerationRequestSchema,
  OpenAiSpeechRequestSchema,
  OpenAiTranscribeRequestSchema,
  OpenAiTranslateRequestSchema,
  OpenAiBatchCreateRequestSchema,
  OpenAiResponseRequestSchema,
  OpenAiResponseCompactRequestSchema,
  OpenAiResponseInputTokensRequestSchema,
  OpenAiFineTuningJobCreateRequestSchema,
  OpenAiCheckpointPermissionCreateRequestSchema,
} from "./zod";

export function textPart(text: string): OpenAiTextPart {
  return { type: "text", text };
}

export function imageUrlPart(
  url: string,
  detail?: "auto" | "low" | "high"
): OpenAiImageUrlPart {
  return {
    type: "image_url",
    image_url: { url, ...(detail ? { detail } : {}) },
  };
}

export function imageBase64Part(
  base64: string,
  mediaType: string,
  detail?: "auto" | "low" | "high"
): OpenAiImageUrlPart {
  return imageUrlPart(`data:${mediaType};base64,${base64}`, detail);
}

export function firstContent(response: OpenAiChatResponse): string {
  return response.choices[0]?.message?.content ?? "";
}

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

  // POST v1 namespace
  const postV1 = {
    chat: {
      // POST https://api.openai.com/v1/chat/completions/{id}
      // Docs: https://platform.openai.com/docs/api-reference
      completions: Object.assign(
        async (
          reqOrId: OpenAiChatRequest | string,
          reqOrSignal?: OpenAiStoredCompletionUpdateRequest | AbortSignal,
          signal?: AbortSignal
        ): Promise<OpenAiChatResponse> => {
          // Overload: update stored completion (POST /chat/completions/{id})
          if (typeof reqOrId === "string") {
            const id = reqOrId;
            const req = reqOrSignal as OpenAiStoredCompletionUpdateRequest;
            const actualSignal = signal;
            return makeRequest<OpenAiChatResponse>(
              `/chat/completions/${encodeURIComponent(id)}`,
              jsonRequest(req),
              actualSignal
            );
          }
          // Default: create chat completion (POST /chat/completions)
          return makeRequest<OpenAiChatResponse>(
            "/chat/completions",
            jsonRequest(reqOrId),
            reqOrSignal as AbortSignal
          );
        },
        {
          schema: OpenAiChatRequestSchema,
        }
      ),
    },
    audio: {
      // POST https://api.openai.com/v1/audio/speech
      // Docs: https://platform.openai.com/docs/api-reference
      speech: Object.assign(
        async (
          req: OpenAiSpeechRequest,
          signal?: AbortSignal
        ): Promise<ArrayBuffer> => {
          return makeBinaryRequest("/audio/speech", jsonRequest(req), signal);
        },
        {
          schema: OpenAiSpeechRequestSchema,
        }
      ),
      // POST https://api.openai.com/v1/audio/transcriptions
      // Docs: https://platform.openai.com/docs/api-reference
      transcriptions: Object.assign(
        async (
          req: OpenAiTranscribeRequest,
          signal?: AbortSignal
        ): Promise<OpenAiTranscribeResponse> => {
          const form = new FormData();
          form.append("file", req.file);
          form.append("model", req.model);
          if (req.response_format !== undefined)
            form.append("response_format", req.response_format);
          if (req.language !== undefined) form.append("language", req.language);
          if (req.prompt !== undefined) form.append("prompt", req.prompt);
          if (req.temperature !== undefined)
            form.append("temperature", String(req.temperature));

          return makeRequest<OpenAiTranscribeResponse>(
            "/audio/transcriptions",
            { headers: {}, body: form },
            signal
          );
        },
        {
          schema: OpenAiTranscribeRequestSchema,
        }
      ),
      // POST https://api.openai.com/v1/audio/translations
      // Docs: https://platform.openai.com/docs/api-reference
      translations: Object.assign(
        async (
          req: OpenAiTranslateRequest,
          signal?: AbortSignal
        ): Promise<OpenAiTranslateResponse> => {
          const form = new FormData();
          form.append("file", req.file);
          form.append("model", req.model);
          if (req.response_format !== undefined)
            form.append("response_format", req.response_format);
          if (req.prompt !== undefined) form.append("prompt", req.prompt);
          if (req.temperature !== undefined)
            form.append("temperature", String(req.temperature));

          return makeRequest<OpenAiTranslateResponse>(
            "/audio/translations",
            { headers: {}, body: form },
            signal
          );
        },
        {
          schema: OpenAiTranslateRequestSchema,
        }
      ),
    },
    // POST https://api.openai.com/v1/embeddings
    // Docs: https://platform.openai.com/docs/api-reference
    embeddings: Object.assign(
      async (
        req: OpenAiEmbeddingRequest,
        signal?: AbortSignal
      ): Promise<OpenAiEmbeddingResponse> => {
        return makeRequest<OpenAiEmbeddingResponse>(
          "/embeddings",
          jsonRequest(req),
          signal
        );
      },
      {
        schema: OpenAiEmbeddingRequestSchema,
      }
    ),
    images: {
      // POST https://api.openai.com/v1/images/generations
      // Docs: https://platform.openai.com/docs/api-reference
      generations: Object.assign(
        async (
          req: OpenAiImageGenerationRequest,
          signal?: AbortSignal
        ): Promise<OpenAiImageGenerationResponse> => {
          return makeRequest<OpenAiImageGenerationResponse>(
            "/images/generations",
            jsonRequest({ moderation: "low", ...req }),
            signal
          );
        },
        {
          schema: OpenAiImageGenerationRequestSchema,
        }
      ),
      // POST https://api.openai.com/v1/images/edits
      // Docs: https://platform.openai.com/docs/api-reference
      edits: Object.assign(
        async (
          req: OpenAiImageEditRequest,
          signal?: AbortSignal
        ): Promise<OpenAiImageEditResponse> => {
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

          return makeRequest<OpenAiImageEditResponse>(
            "/images/edits",
            { headers: {}, body: form },
            signal
          );
        },
        {
          schema: OpenAiImageEditRequestSchema,
        }
      ),
    },
    // POST https://api.openai.com/v1/files
    // Docs: https://platform.openai.com/docs/api-reference
    files: Object.assign(
      async (
        req: OpenAiFileUploadRequest,
        signal?: AbortSignal
      ): Promise<OpenAiFile> => {
        const form = new FormData();
        form.append("file", req.file);
        form.append("purpose", req.purpose);
        if (req.expires_after !== undefined) {
          form.append("expires_after", JSON.stringify(req.expires_after));
        }

        return makeRequest<OpenAiFile>(
          "/files",
          { headers: {}, body: form },
          signal
        );
      },
      {
        schema: OpenAiFileUploadRequestSchema,
      }
    ),
    // POST https://api.openai.com/v1/moderations
    // Docs: https://platform.openai.com/docs/api-reference
    moderations: Object.assign(
      async (
        req: OpenAiModerationRequest,
        signal?: AbortSignal
      ): Promise<OpenAiModerationResponse> => {
        return makeRequest<OpenAiModerationResponse>(
          "/moderations",
          jsonRequest(req),
          signal
        );
      },
      {
        schema: OpenAiModerationRequestSchema,
      }
    ),
    // POST https://api.openai.com/v1/responses
    // Docs: https://platform.openai.com/docs/api-reference
    responses: Object.assign(
      async (
        req: OpenAiResponseRequest,
        signal?: AbortSignal
      ): Promise<OpenAiResponseResponse> => {
        return makeRequest<OpenAiResponseResponse>(
          "/responses",
          jsonRequest(req),
          signal
        );
      },
      {
        schema: OpenAiResponseRequestSchema,
        // POST https://api.openai.com/v1/responses/compact
        // Docs: https://platform.openai.com/docs/api-reference
        compact: Object.assign(
          async (
            req: OpenAiResponseCompactRequest,
            signal?: AbortSignal
          ): Promise<OpenAiResponseCompactResponse> => {
            return makeRequest<OpenAiResponseCompactResponse>(
              "/responses/compact",
              jsonRequest(req),
              signal
            );
          },
          {
            schema: OpenAiResponseCompactRequestSchema,
          }
        ),
        // POST https://api.openai.com/v1/responses/input_tokens
        // Docs: https://platform.openai.com/docs/api-reference
        inputTokens: Object.assign(
          async (
            req: OpenAiResponseInputTokensRequest,
            signal?: AbortSignal
          ): Promise<OpenAiResponseInputTokensResponse> => {
            return makeRequest<OpenAiResponseInputTokensResponse>(
              "/responses/input_tokens",
              jsonRequest(req),
              signal
            );
          },
          {
            schema: OpenAiResponseInputTokensRequestSchema,
          }
        ),
        // POST https://api.openai.com/v1/responses/{id}/cancel
        // Docs: https://platform.openai.com/docs/api-reference
        cancel: Object.assign(
          async (
            id: string,
            signal?: AbortSignal
          ): Promise<OpenAiResponseResponse> => {
            return makeEmptyPostRequest<OpenAiResponseResponse>(
              `/responses/${encodeURIComponent(id)}/cancel`,
              signal
            );
          },
          {}
        ),
      }
    ),
    // POST https://api.openai.com/v1/batches
    // Docs: https://platform.openai.com/docs/api-reference
    batches: Object.assign(
      async (
        req: OpenAiBatchCreateRequest,
        signal?: AbortSignal
      ): Promise<OpenAiBatch> => {
        return makeRequest<OpenAiBatch>("/batches", jsonRequest(req), signal);
      },
      {
        schema: OpenAiBatchCreateRequestSchema,
        // POST https://api.openai.com/v1/batches/{id}/cancel
        // Docs: https://platform.openai.com/docs/api-reference
        cancel: Object.assign(
          async (id: string, signal?: AbortSignal): Promise<OpenAiBatch> => {
            return makeEmptyPostRequest<OpenAiBatch>(
              `/batches/${encodeURIComponent(id)}/cancel`,
              signal
            );
          },
          {}
        ),
      }
    ),
    fineTuning: {
      // POST https://api.openai.com/v1/fine_tuning/jobs
      // Docs: https://platform.openai.com/docs/api-reference
      jobs: Object.assign(
        async (
          req: OpenAiFineTuningJobCreateRequest,
          signal?: AbortSignal
        ): Promise<OpenAiFineTuningJob> => {
          return makeRequest<OpenAiFineTuningJob>(
            "/fine_tuning/jobs",
            jsonRequest(req),
            signal
          );
        },
        {
          schema: OpenAiFineTuningJobCreateRequestSchema,
          // POST https://api.openai.com/v1/fine_tuning/jobs/{id}/cancel
          // Docs: https://platform.openai.com/docs/api-reference
          cancel: Object.assign(
            async (
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJob> => {
              return makeEmptyPostRequest<OpenAiFineTuningJob>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}/cancel`,
                signal
              );
            },
            {}
          ),
          // POST https://api.openai.com/v1/fine_tuning/jobs/{id}/pause
          // Docs: https://platform.openai.com/docs/api-reference
          pause: Object.assign(
            async (
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJob> => {
              return makeEmptyPostRequest<OpenAiFineTuningJob>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}/pause`,
                signal
              );
            },
            {}
          ),
          // POST https://api.openai.com/v1/fine_tuning/jobs/{id}/resume
          // Docs: https://platform.openai.com/docs/api-reference
          resume: Object.assign(
            async (
              id: string,
              signal?: AbortSignal
            ): Promise<OpenAiFineTuningJob> => {
              return makeEmptyPostRequest<OpenAiFineTuningJob>(
                `/fine_tuning/jobs/${encodeURIComponent(id)}/resume`,
                signal
              );
            },
            {}
          ),
        }
      ),
      checkpoints: {
        // POST https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions
        // Docs: https://platform.openai.com/docs/api-reference
        permissions: Object.assign(
          async (
            checkpoint: string,
            req: OpenAiCheckpointPermissionCreateRequest,
            signal?: AbortSignal
          ): Promise<OpenAiCheckpointPermissionCreateResponse> => {
            return makeRequest<OpenAiCheckpointPermissionCreateResponse>(
              `/fine_tuning/checkpoints/${encodeURIComponent(checkpoint)}/permissions`,
              jsonRequest(req),
              signal
            );
          },
          {
            schema: OpenAiCheckpointPermissionCreateRequestSchema,
          }
        ),
      },
    },
  };

  // GET v1 namespace
  const getV1 = {
    chat: {
      // GET https://api.openai.com/v1/chat/completions/{idOrOpts}
      // Docs: https://platform.openai.com/docs/api-reference
      completions: Object.assign(
        async (
          idOrOpts?: string | OpenAiStoredCompletionListOptions,
          signal?: AbortSignal
        ): Promise<OpenAiChatResponse | OpenAiStoredCompletionListResponse> => {
          if (typeof idOrOpts === "string") {
            // GET /chat/completions/{id}
            return makeGetRequest<OpenAiChatResponse>(
              `/chat/completions/${encodeURIComponent(idOrOpts)}`,
              undefined,
              signal
            );
          }
          // GET /chat/completions (list)
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
          return makeGetRequest<OpenAiStoredCompletionListResponse>(
            "/chat/completions",
            query,
            signal
          );
        },
        {
          // GET https://api.openai.com/v1/chat/completions/{id}/messages
          // Docs: https://platform.openai.com/docs/api-reference
          messages: async (
            id: string,
            opts?: OpenAiStoredCompletionMessageListOptions,
            signal?: AbortSignal
          ): Promise<OpenAiStoredCompletionMessageListResponse> => {
            const query: Record<string, string | undefined> = {};
            if (opts?.after) query.after = opts.after;
            if (opts?.limit !== undefined) query.limit = String(opts.limit);
            if (opts?.order) query.order = opts.order;
            return makeGetRequest<OpenAiStoredCompletionMessageListResponse>(
              `/chat/completions/${encodeURIComponent(id)}/messages`,
              query,
              signal
            );
          },
        }
      ) as import("./types").OpenAiGetV1ChatCompletions,
    },
    // GET https://api.openai.com/v1/files/{idOrOpts}
    // Docs: https://platform.openai.com/docs/api-reference
    files: Object.assign(
      async (
        idOrOpts?: string | OpenAiFileListRequest,
        signal?: AbortSignal
      ): Promise<OpenAiFile | OpenAiFileListResponse> => {
        if (typeof idOrOpts === "string") {
          // GET /files/{id}
          return makeGetRequest<OpenAiFile>(
            `/files/${encodeURIComponent(idOrOpts)}`,
            undefined,
            signal
          );
        }
        // GET /files (list)
        const query: Record<string, string | undefined> = {};
        if (idOrOpts?.purpose !== undefined) query.purpose = idOrOpts.purpose;
        if (idOrOpts?.limit !== undefined) query.limit = String(idOrOpts.limit);
        if (idOrOpts?.order !== undefined) query.order = idOrOpts.order;
        if (idOrOpts?.after !== undefined) query.after = idOrOpts.after;
        return makeGetRequest<OpenAiFileListResponse>("/files", query, signal);
      },
      {
        // GET https://api.openai.com/v1/files/{id}/content
        // Docs: https://platform.openai.com/docs/api-reference
        content: async (id: string, signal?: AbortSignal): Promise<string> => {
          return makeGetTextRequest(
            `/files/${encodeURIComponent(id)}/content`,
            signal
          );
        },
      }
    ) as import("./types").OpenAiGetV1FilesNamespace,
    // GET https://api.openai.com/v1/models/{id}
    // Docs: https://platform.openai.com/docs/api-reference
    models: Object.assign(
      async (
        id?: string | AbortSignal,
        signal?: AbortSignal
      ): Promise<OpenAiModelListResponse | OpenAiModel> => {
        if (typeof id === "string") {
          // GET /models/{id}
          return makeGetRequest<OpenAiModel>(
            `/models/${encodeURIComponent(id)}`,
            undefined,
            signal
          );
        }
        // GET /models (list)
        return makeGetRequest<OpenAiModelListResponse>(
          "/models",
          undefined,
          typeof id === "object" ? id : signal // Handle signal as first param
        );
      },
      {}
    ) as import("./types").OpenAiGetV1ModelsNamespace,
    // GET https://api.openai.com/v1/responses/{id}
    // Docs: https://platform.openai.com/docs/api-reference
    responses: Object.assign(
      async (
        id: string,
        opts?: OpenAiResponseGetOptions,
        signal?: AbortSignal
      ): Promise<OpenAiResponseResponse> => {
        return makeGetRequest<OpenAiResponseResponse>(
          `/responses/${encodeURIComponent(id)}`,
          {
            include: opts?.include,
            stream: opts?.stream,
          },
          signal
        );
      },
      {
        // GET https://api.openai.com/v1/responses/{id}/input_items
        // Docs: https://platform.openai.com/docs/api-reference
        inputItems: async (
          id: string,
          opts?: OpenAiResponseInputItemsOptions,
          signal?: AbortSignal
        ): Promise<OpenAiResponseInputItemsResponse> => {
          return makeGetRequest<OpenAiResponseInputItemsResponse>(
            `/responses/${encodeURIComponent(id)}/input_items`,
            {
              after: opts?.after,
              limit: opts?.limit !== undefined ? String(opts.limit) : undefined,
              order: opts?.order,
              include: opts?.include,
            },
            signal
          );
        },
      }
    ),
    // GET https://api.openai.com/v1/batches/{idOrOpts}
    // Docs: https://platform.openai.com/docs/api-reference
    batches: Object.assign(
      async (
        idOrOpts?: string | OpenAiBatchListParams,
        signal?: AbortSignal
      ): Promise<OpenAiBatch | OpenAiBatchListResponse> => {
        if (typeof idOrOpts === "string") {
          // GET /batches/{id}
          return makeGetRequest<OpenAiBatch>(
            `/batches/${encodeURIComponent(idOrOpts)}`,
            undefined,
            signal
          );
        }
        // GET /batches (list)
        return makeGetRequest<OpenAiBatchListResponse>(
          "/batches",
          {
            after: (idOrOpts as OpenAiBatchListParams)?.after,
            limit:
              (idOrOpts as OpenAiBatchListParams)?.limit !== undefined
                ? String((idOrOpts as OpenAiBatchListParams).limit)
                : undefined,
          },
          signal
        );
      },
      {}
    ) as import("./types").OpenAiGetV1BatchesNamespace,
    fineTuning: {
      // GET https://api.openai.com/v1/fine_tuning/jobs/{idOrOpts}
      // Docs: https://platform.openai.com/docs/api-reference
      jobs: Object.assign(
        async (
          idOrOpts?: string | OpenAiFineTuningJobListOptions,
          signal?: AbortSignal
        ): Promise<OpenAiFineTuningJob | OpenAiFineTuningJobListResponse> => {
          if (typeof idOrOpts === "string") {
            // GET /fine_tuning/jobs/{id}
            return makeGetRequest<OpenAiFineTuningJob>(
              `/fine_tuning/jobs/${encodeURIComponent(idOrOpts)}`,
              undefined,
              signal
            );
          }
          // GET /fine_tuning/jobs (list)
          const query: Record<string, string | undefined> = {};
          const opts = idOrOpts as OpenAiFineTuningJobListOptions;
          if (opts?.after) query.after = opts.after;
          if (opts?.limit !== undefined) query.limit = String(opts.limit);
          if (opts?.metadata) {
            for (const [k, v] of Object.entries(opts.metadata)) {
              query[`metadata[${k}]`] = v;
            }
          }
          return makeGetRequest<OpenAiFineTuningJobListResponse>(
            "/fine_tuning/jobs",
            query,
            signal
          );
        },
        {
          // GET https://api.openai.com/v1/fine_tuning/jobs/{id}/events
          // Docs: https://platform.openai.com/docs/api-reference
          events: async (
            id: string,
            opts?: OpenAiFineTuningJobEventListOptions,
            signal?: AbortSignal
          ): Promise<OpenAiFineTuningJobEventListResponse> => {
            const query: Record<string, string | undefined> = {};
            if (opts?.after) query.after = opts.after;
            if (opts?.limit !== undefined) query.limit = String(opts.limit);
            return makeGetRequest<OpenAiFineTuningJobEventListResponse>(
              `/fine_tuning/jobs/${encodeURIComponent(id)}/events`,
              query,
              signal
            );
          },
          // GET https://api.openai.com/v1/fine_tuning/jobs/{id}/checkpoints
          // Docs: https://platform.openai.com/docs/api-reference
          checkpoints: async (
            id: string,
            opts?: OpenAiFineTuningJobCheckpointListOptions,
            signal?: AbortSignal
          ): Promise<OpenAiFineTuningJobCheckpointListResponse> => {
            const query: Record<string, string | undefined> = {};
            if (opts?.after) query.after = opts.after;
            if (opts?.limit !== undefined) query.limit = String(opts.limit);
            return makeGetRequest<OpenAiFineTuningJobCheckpointListResponse>(
              `/fine_tuning/jobs/${encodeURIComponent(id)}/checkpoints`,
              query,
              signal
            );
          },
        }
      ) as import("./types").OpenAiGetV1FineTuningJobs & {
        events: import("./types").OpenAiGetV1FineTuningJobsEvents;
        checkpoints: import("./types").OpenAiGetV1FineTuningJobsCheckpoints;
      },
      checkpoints: {
        // GET https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions
        // Docs: https://platform.openai.com/docs/api-reference
        permissions: async (
          checkpoint: string,
          opts?: OpenAiCheckpointPermissionListOptions,
          signal?: AbortSignal
        ): Promise<OpenAiCheckpointPermissionListResponse> => {
          const query: Record<string, string | undefined> = {};
          if (opts?.after) query.after = opts.after;
          if (opts?.limit !== undefined) query.limit = String(opts.limit);
          if (opts?.order) query.order = opts.order;
          if (opts?.project_id) query.project_id = opts.project_id;
          return makeGetRequest<OpenAiCheckpointPermissionListResponse>(
            `/fine_tuning/checkpoints/${encodeURIComponent(checkpoint)}/permissions`,
            query,
            signal
          );
        },
      },
    },
  };

  // DELETE v1 namespace
  const deleteV1 = {
    chat: {
      // DELETE https://api.openai.com/v1/chat/completions/{id}
      // Docs: https://platform.openai.com/docs/api-reference
      completions: async (
        id: string,
        signal?: AbortSignal
      ): Promise<OpenAiStoredCompletionDeleteResponse> => {
        return makeDeleteRequest<OpenAiStoredCompletionDeleteResponse>(
          `/chat/completions/${encodeURIComponent(id)}`,
          signal
        );
      },
    },
    // DELETE https://api.openai.com/v1/files/{id}
    // Docs: https://platform.openai.com/docs/api-reference
    files: async (
      id: string,
      signal?: AbortSignal
    ): Promise<OpenAiFileDeleteResponse> => {
      return makeDeleteRequest<OpenAiFileDeleteResponse>(
        `/files/${encodeURIComponent(id)}`,
        signal
      );
    },
    // DELETE https://api.openai.com/v1/models/{id}
    // Docs: https://platform.openai.com/docs/api-reference
    models: async (
      id: string,
      signal?: AbortSignal
    ): Promise<OpenAiModelDeleteResponse> => {
      return makeDeleteRequest<OpenAiModelDeleteResponse>(
        `/models/${encodeURIComponent(id)}`,
        signal
      );
    },
    // DELETE https://api.openai.com/v1/responses/{id}
    // Docs: https://platform.openai.com/docs/api-reference
    responses: async (
      id: string,
      signal?: AbortSignal
    ): Promise<OpenAiResponseDeleteResponse> => {
      return makeDeleteRequest<OpenAiResponseDeleteResponse>(
        `/responses/${encodeURIComponent(id)}`,
        signal
      );
    },
    fineTuning: {
      checkpoints: {
        // DELETE https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions/{permissionId}
        // Docs: https://platform.openai.com/docs/api-reference
        permissions: async (
          checkpoint: string,
          permissionId: string,
          signal?: AbortSignal
        ): Promise<OpenAiCheckpointPermissionDeleteResponse> => {
          return makeDeleteRequest<OpenAiCheckpointPermissionDeleteResponse>(
            `/fine_tuning/checkpoints/${encodeURIComponent(checkpoint)}/permissions/${encodeURIComponent(permissionId)}`,
            signal
          );
        },
      },
    },
  };

  return {
    post: { v1: postV1 },
    get: { v1: getV1 },
    delete: { v1: deleteV1 },
  };
}
