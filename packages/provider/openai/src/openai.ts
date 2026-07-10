import {
  OpenAiOptions,
  OpenAiChatRequest,
  OpenAiChatResponse,
  OpenAiCompletionRequest,
  OpenAiCompletionResponse,
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
  OpenAiImageVariationRequest,
  OpenAiFileListRequest,
  OpenAiFileListResponse,
  OpenAiFile,
  OpenAiFileUploadRequest,
  OpenAiFileDeleteResponse,
  OpenAiContainer,
  OpenAiContainerCreateRequest,
  OpenAiUploadCreateRequest,
  OpenAiUpload,
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
  OpenAiEvalCreateRequest,
  OpenAiEval,
  OpenAiConversationCreateRequest,
  OpenAiConversation,
  OpenAiConversationRetrieveResponse,
  OpenAiRealtimeClientSecretRequest,
  OpenAiRealtimeClientSecretResponse,
  OpenAiVectorStoreCreateRequest,
  OpenAiVectorStore,
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
  OpenAiOrganizationUsageQuery,
  OpenAiOrganizationUsageResponse,
  OpenAiOrganizationCostsQuery,
  OpenAiOrganizationCostsResponse,
  OpenAiOrganizationProjectListQuery,
  OpenAiOrganizationProjectListResponse,
  OpenAiOrganizationProject,
  OpenAiOrganizationProjectRateLimitListQuery,
  OpenAiProjectRateLimitListResponse,
  OpenAiStoredCompletionListOptions,
  OpenAiStoredCompletionListResponse,
  OpenAiStoredCompletionDeleteResponse,
  OpenAiStoredCompletionUpdateRequest,
  OpenAiStoredCompletionMessageListOptions,
  OpenAiStoredCompletionMessageListResponse,
  OpenAiCodexUsageResponse,
  OpenAiProvider,
  OpenAiError,
  OpenAiTextPart,
  OpenAiImageUrlPart,
} from "./types";
import {
  OpenAiChatRequestSchema,
  OpenAiCompletionRequestSchema,
  OpenAiEmbeddingRequestSchema,
  OpenAiFileUploadRequestSchema,
  OpenAiContainerCreateRequestSchema,
  OpenAiUploadCreateRequestSchema,
  OpenAiImageEditRequestSchema,
  OpenAiImageGenerationRequestSchema,
  OpenAiImageVariationRequestSchema,
  OpenAiModerationRequestSchema,
  OpenAiSpeechRequestSchema,
  OpenAiTranscribeRequestSchema,
  OpenAiTranslateRequestSchema,
  OpenAiBatchCreateRequestSchema,
  OpenAiResponseRequestSchema,
  OpenAiResponseCompactRequestSchema,
  OpenAiResponseInputTokensRequestSchema,
  OpenAiEvalCreateRequestSchema,
  OpenAiConversationCreateRequestSchema,
  OpenAiRealtimeClientSecretRequestSchema,
  OpenAiVectorStoreCreateRequestSchema,
  OpenAiFineTuningJobCreateRequestSchema,
  OpenAiCheckpointPermissionCreateRequestSchema,
  OpenAiOrganizationUsageQuerySchema,
  OpenAiOrganizationCostsQuerySchema,
  OpenAiOrganizationProjectListQuerySchema,
  OpenAiOrganizationProjectRateLimitListQuerySchema,
} from "./zod";
import { attachExamples } from "./example";
import { createTransport } from "./transport";

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

function parseOpenAiErrorBody(
  status: number,
  body: unknown
): { message: string } {
  if (typeof body === "object" && body !== null && "error" in body) {
    const err = (body as { error: { message?: unknown } }).error;
    if (err?.message) {
      return { message: `OpenAI API error ${status}: ${err.message}` };
    }
  }

  return { message: `OpenAI API error: ${status}` };
}

async function wrapOpenAiTransportFailure<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof OpenAiError) throw error;
    throw new OpenAiError(`OpenAI request failed: ${error}`, 500);
  }
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  return await wrapOpenAiTransportFailure(async () => (await res.json()) as T);
}

async function readArrayBufferResponse(res: Response): Promise<ArrayBuffer> {
  return await wrapOpenAiTransportFailure(async () => await res.arrayBuffer());
}

export function firstContent(response: OpenAiChatResponse): string {
  return response.choices[0]?.message?.content ?? "";
}

export function createOpenAi(opts: OpenAiOptions): OpenAiProvider {
  const baseURL = opts.baseURL ?? "https://api.openai.com/v1";
  // Codex usage is served by the ChatGPT backend, not the API platform.
  const codexBaseURL = (
    opts.codexBaseURL ?? "https://chatgpt.com/backend-api"
  ).replace(/\/$/, "");
  const timeout = opts.timeout ?? 30000;

  const transport = createTransport({
    baseUrl: baseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => ({ Authorization: `Bearer ${opts.apiKey}` }),
    parseErrorBody: parseOpenAiErrorBody,
    errorClass: OpenAiError,
    requestFailedPrefix: "OpenAI request failed",
  });

  const codexTransport = createTransport({
    baseUrl: codexBaseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${opts.apiKey}`,
        "User-Agent": "codex-cli",
      };
      if (opts.chatgptAccountId) {
        headers["ChatGPT-Account-Id"] = opts.chatgptAccountId;
      }
      return headers;
    },
    parseErrorBody: parseOpenAiErrorBody,
    errorClass: OpenAiError,
    requestFailedPrefix: "OpenAI request failed",
  });

  async function makeRequest<T>(
    path: string,
    init: { headers: Record<string, string>; body: BodyInit },
    signal?: AbortSignal
  ): Promise<T> {
    const res = await transport.raw(path, {
      method: "POST",
      headers: init.headers,
      body: init.body,
      signal,
    });
    return await readJsonResponse<T>(res);
  }

  function jsonRequest(
    body: unknown,
    extraHeaders?: Record<string, string>
  ): {
    headers: Record<string, string>;
    body: string;
  } {
    return {
      headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
      body: JSON.stringify(body),
    };
  }

  async function makeBinaryRequest(
    path: string,
    init: { headers: Record<string, string>; body: BodyInit },
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const res = await transport.raw(path, {
      method: "POST",
      headers: init.headers,
      body: init.body,
      signal,
    });
    return await readArrayBufferResponse(res);
  }

  async function makeGetRequest<T>(
    path: string,
    query?: Record<string, string | string[] | boolean | number | undefined>,
    signal?: AbortSignal
  ): Promise<T> {
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
    return await transport.getJson<T>(`${path}${qs ? `?${qs}` : ""}`, {
      signal,
    });
  }

  // GET against the Codex/ChatGPT backend (codexBaseURL) rather than the API
  // platform baseURL. Mirrors the headers the Codex CLI sends for `/status`.
  async function makeCodexGetRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    return await codexTransport.getJson<T>(path, { signal });
  }

  async function makeEmptyPostRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    const res = await transport.raw(path, { method: "POST", signal });
    return await readJsonResponse<T>(res);
  }

  async function makeDeleteRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    return await transport.del<T>(path, { signal });
  }

  async function makeGetTextRequest(
    path: string,
    signal?: AbortSignal
  ): Promise<string> {
    return await transport.getText(path, { signal });
  }

  // POST v1 namespace
  const postV1 = {
    // POST https://api.openai.com/v1/completions
    // Docs: https://platform.openai.com/docs/api-reference/completions/create
    completions: Object.assign(
      async (
        req: OpenAiCompletionRequest,
        signal?: AbortSignal
      ): Promise<OpenAiCompletionResponse> => {
        return makeRequest<OpenAiCompletionResponse>(
          "/completions",
          jsonRequest(req),
          signal
        );
      },
      {
        schema: OpenAiCompletionRequestSchema,
      }
    ),
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
      // POST https://api.openai.com/v1/images/variations
      // Docs: https://platform.openai.com/docs/api-reference
      variations: Object.assign(
        async (
          req: OpenAiImageVariationRequest,
          signal?: AbortSignal
        ): Promise<OpenAiImageGenerationResponse> => {
          const form = new FormData();
          form.append("image", req.image);
          if (req.model !== undefined) form.append("model", req.model);
          if (req.n !== undefined) form.append("n", String(req.n));
          if (req.response_format !== undefined)
            form.append("response_format", req.response_format);
          if (req.size !== undefined) form.append("size", req.size);
          if (req.user !== undefined) form.append("user", req.user);

          return makeRequest<OpenAiImageGenerationResponse>(
            "/images/variations",
            { headers: {}, body: form },
            signal
          );
        },
        {
          schema: OpenAiImageVariationRequestSchema,
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
    // POST https://api.openai.com/v1/containers
    // Docs: https://platform.openai.com/docs/api-reference/containers/createContainers
    containers: Object.assign(
      async (
        req: OpenAiContainerCreateRequest,
        signal?: AbortSignal
      ): Promise<OpenAiContainer> => {
        return makeRequest<OpenAiContainer>(
          "/containers",
          jsonRequest(req),
          signal
        );
      },
      {
        schema: OpenAiContainerCreateRequestSchema,
      }
    ),
    // POST https://api.openai.com/v1/uploads
    // Docs: https://platform.openai.com/docs/api-reference/uploads/create
    uploads: Object.assign(
      async (
        req: OpenAiUploadCreateRequest,
        signal?: AbortSignal
      ): Promise<OpenAiUpload> => {
        return makeRequest<OpenAiUpload>("/uploads", jsonRequest(req), signal);
      },
      {
        schema: OpenAiUploadCreateRequestSchema,
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
        // schema-ok: body-less POST (no request payload)
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
    // POST https://api.openai.com/v1/evals
    // Docs: https://platform.openai.com/docs/api-reference/evals/create
    evals: Object.assign(
      async (
        req: OpenAiEvalCreateRequest,
        signal?: AbortSignal
      ): Promise<OpenAiEval> => {
        return makeRequest<OpenAiEval>("/evals", jsonRequest(req), signal);
      },
      {
        schema: OpenAiEvalCreateRequestSchema,
      }
    ),
    // POST https://api.openai.com/v1/conversations
    // Docs: https://platform.openai.com/docs/api-reference
    conversations: Object.assign(
      async (
        req: OpenAiConversationCreateRequest,
        signal?: AbortSignal
      ): Promise<OpenAiConversation> => {
        return makeRequest<OpenAiConversation>(
          "/conversations",
          jsonRequest(req),
          signal
        );
      },
      {
        schema: OpenAiConversationCreateRequestSchema,
      }
    ),
    realtime: {
      // POST https://api.openai.com/v1/realtime/client_secrets
      // Docs: https://platform.openai.com/docs/api-reference/realtime-sessions/create-client-secret
      clientSecrets: Object.assign(
        async (
          req: OpenAiRealtimeClientSecretRequest,
          signal?: AbortSignal
        ): Promise<OpenAiRealtimeClientSecretResponse> => {
          return makeRequest<OpenAiRealtimeClientSecretResponse>(
            "/realtime/client_secrets",
            jsonRequest(req),
            signal
          );
        },
        {
          schema: OpenAiRealtimeClientSecretRequestSchema,
        }
      ),
    },
    // POST https://api.openai.com/v1/vector_stores
    // Docs: https://platform.openai.com/docs/api-reference/vector-stores/create
    vectorStores: Object.assign(
      async (
        req: OpenAiVectorStoreCreateRequest,
        signal?: AbortSignal
      ): Promise<OpenAiVectorStore> => {
        return makeRequest<OpenAiVectorStore>(
          "/vector_stores",
          jsonRequest(req, { "OpenAI-Beta": "assistants=v2" }),
          signal
        );
      },
      {
        schema: OpenAiVectorStoreCreateRequestSchema,
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
        // schema-ok: body-less POST (no request payload)
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
          // schema-ok: body-less POST (no request payload)
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
          // schema-ok: body-less POST (no request payload)
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
          // schema-ok: body-less POST (no request payload)
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
    conversations: {
      // GET https://api.openai.com/v1/conversations/{conversationId}
      // Docs: https://platform.openai.com/docs/api-reference/conversations/retrieve
      retrieve: async (
        conversationId: string,
        signal?: AbortSignal
      ): Promise<OpenAiConversationRetrieveResponse> => {
        return makeGetRequest<OpenAiConversationRetrieveResponse>(
          `/conversations/${encodeURIComponent(conversationId)}`,
          undefined,
          signal
        );
      },
    },
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
    organization: {
      usage: {
        // GET https://api.openai.com/v1/organization/usage/completions
        // Docs: https://platform.openai.com/docs/api-reference/usage
        completions: Object.assign(
          async (
            opts: OpenAiOrganizationUsageQuery,
            signal?: AbortSignal
          ): Promise<OpenAiOrganizationUsageResponse> => {
            return makeGetRequest<OpenAiOrganizationUsageResponse>(
              "/organization/usage/completions",
              opts,
              signal
            );
          },
          {
            schema: OpenAiOrganizationUsageQuerySchema,
          }
        ),
        // GET https://api.openai.com/v1/organization/usage/embeddings
        // Docs: https://platform.openai.com/docs/api-reference/usage
        embeddings: Object.assign(
          async (
            opts: OpenAiOrganizationUsageQuery,
            signal?: AbortSignal
          ): Promise<OpenAiOrganizationUsageResponse> => {
            return makeGetRequest<OpenAiOrganizationUsageResponse>(
              "/organization/usage/embeddings",
              opts,
              signal
            );
          },
          {
            schema: OpenAiOrganizationUsageQuerySchema,
          }
        ),
        // GET https://api.openai.com/v1/organization/usage/moderations
        // Docs: https://platform.openai.com/docs/api-reference/usage
        moderations: Object.assign(
          async (
            opts: OpenAiOrganizationUsageQuery,
            signal?: AbortSignal
          ): Promise<OpenAiOrganizationUsageResponse> => {
            return makeGetRequest<OpenAiOrganizationUsageResponse>(
              "/organization/usage/moderations",
              opts,
              signal
            );
          },
          {
            schema: OpenAiOrganizationUsageQuerySchema,
          }
        ),
        // GET https://api.openai.com/v1/organization/usage/images
        // Docs: https://platform.openai.com/docs/api-reference/usage
        images: Object.assign(
          async (
            opts: OpenAiOrganizationUsageQuery,
            signal?: AbortSignal
          ): Promise<OpenAiOrganizationUsageResponse> => {
            return makeGetRequest<OpenAiOrganizationUsageResponse>(
              "/organization/usage/images",
              opts,
              signal
            );
          },
          {
            schema: OpenAiOrganizationUsageQuerySchema,
          }
        ),
        // GET https://api.openai.com/v1/organization/usage/audio_speeches
        // Docs: https://platform.openai.com/docs/api-reference/usage
        audioSpeeches: Object.assign(
          async (
            opts: OpenAiOrganizationUsageQuery,
            signal?: AbortSignal
          ): Promise<OpenAiOrganizationUsageResponse> => {
            return makeGetRequest<OpenAiOrganizationUsageResponse>(
              "/organization/usage/audio_speeches",
              opts,
              signal
            );
          },
          {
            schema: OpenAiOrganizationUsageQuerySchema,
          }
        ),
        // GET https://api.openai.com/v1/organization/usage/audio_transcriptions
        // Docs: https://platform.openai.com/docs/api-reference/usage
        audioTranscriptions: Object.assign(
          async (
            opts: OpenAiOrganizationUsageQuery,
            signal?: AbortSignal
          ): Promise<OpenAiOrganizationUsageResponse> => {
            return makeGetRequest<OpenAiOrganizationUsageResponse>(
              "/organization/usage/audio_transcriptions",
              opts,
              signal
            );
          },
          {
            schema: OpenAiOrganizationUsageQuerySchema,
          }
        ),
        // GET https://api.openai.com/v1/organization/usage/vector_stores
        // Docs: https://platform.openai.com/docs/api-reference/usage
        vectorStores: Object.assign(
          async (
            opts: OpenAiOrganizationUsageQuery,
            signal?: AbortSignal
          ): Promise<OpenAiOrganizationUsageResponse> => {
            return makeGetRequest<OpenAiOrganizationUsageResponse>(
              "/organization/usage/vector_stores",
              opts,
              signal
            );
          },
          {
            schema: OpenAiOrganizationUsageQuerySchema,
          }
        ),
        // GET https://api.openai.com/v1/organization/usage/code_interpreter_sessions
        // Docs: https://platform.openai.com/docs/api-reference/usage
        codeInterpreterSessions: Object.assign(
          async (
            opts: OpenAiOrganizationUsageQuery,
            signal?: AbortSignal
          ): Promise<OpenAiOrganizationUsageResponse> => {
            return makeGetRequest<OpenAiOrganizationUsageResponse>(
              "/organization/usage/code_interpreter_sessions",
              opts,
              signal
            );
          },
          {
            schema: OpenAiOrganizationUsageQuerySchema,
          }
        ),
      },
      // GET https://api.openai.com/v1/organization/costs
      // Docs: https://platform.openai.com/docs/api-reference/usage
      costs: Object.assign(
        async (
          opts: OpenAiOrganizationCostsQuery,
          signal?: AbortSignal
        ): Promise<OpenAiOrganizationCostsResponse> => {
          return makeGetRequest<OpenAiOrganizationCostsResponse>(
            "/organization/costs",
            opts,
            signal
          );
        },
        {
          schema: OpenAiOrganizationCostsQuerySchema,
        }
      ),
      // GET https://api.openai.com/v1/organization/projects/{idOrOpts}
      // Docs: https://platform.openai.com/docs/api-reference/projects
      projects: Object.assign(
        async (
          idOrOpts?: string | OpenAiOrganizationProjectListQuery,
          signal?: AbortSignal
        ): Promise<
          OpenAiOrganizationProject | OpenAiOrganizationProjectListResponse
        > => {
          if (typeof idOrOpts === "string") {
            return makeGetRequest<OpenAiOrganizationProject>(
              `/organization/projects/${encodeURIComponent(idOrOpts)}`,
              undefined,
              signal
            );
          }
          return makeGetRequest<OpenAiOrganizationProjectListResponse>(
            "/organization/projects",
            idOrOpts,
            signal
          );
        },
        {
          schema: OpenAiOrganizationProjectListQuerySchema,
          // GET https://api.openai.com/v1/organization/projects/{projectId}/rate_limits
          // Docs: https://platform.openai.com/docs/api-reference/project-rate-limits
          rateLimits: Object.assign(
            async (
              projectId: string,
              opts?: OpenAiOrganizationProjectRateLimitListQuery,
              signal?: AbortSignal
            ): Promise<OpenAiProjectRateLimitListResponse> => {
              return makeGetRequest<OpenAiProjectRateLimitListResponse>(
                `/organization/projects/${encodeURIComponent(projectId)}/rate_limits`,
                opts,
                signal
              );
            },
            {
              schema: OpenAiOrganizationProjectRateLimitListQuerySchema,
            }
          ),
        }
      ) as import("./types").OpenAiGetV1OrganizationProjects,
    },
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

  // GET codex namespace — ChatGPT-plan usage, served by the Codex backend
  // (codexBaseURL) rather than the api.openai.com platform.
  const getCodex = {
    // sig-ok: intentional
    // GET https://chatgpt.com/backend-api/wham/usage
    // Docs: https://developers.openai.com/codex/pricing
    usage: async (signal?: AbortSignal): Promise<OpenAiCodexUsageResponse> => {
      return makeCodexGetRequest<OpenAiCodexUsageResponse>(
        "/wham/usage",
        signal
      );
    },
  };

  return attachExamples({
    post: { v1: postV1 },
    get: { v1: getV1, codex: getCodex },
    delete: { v1: deleteV1 },
  });
}
