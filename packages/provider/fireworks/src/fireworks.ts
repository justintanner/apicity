import {
  FireworksOptions,
  FireworksChatRequest,
  FireworksChatResponse,
  FireworksChatStreamChunk,
  FireworksCompletionRequest,
  FireworksCompletionResponse,
  FireworksCompletionStreamChunk,
  FireworksEmbeddingRequest,
  FireworksEmbeddingResponse,
  FireworksRerankRequest,
  FireworksRerankResponse,
  AnthropicMessagesRequest,
  AnthropicMessagesResponse,
  AnthropicStreamEvent,
  FireworksTextToImageRequest,
  FireworksTextToImageResponse,
  FireworksKontextRequest,
  FireworksKontextResponse,
  FireworksGetResultRequest,
  FireworksGetResultResponse,
  FireworksTranscriptionRequest,
  FireworksTranscriptionResponse,
  FireworksTranslationRequest,
  FireworksTranslationResponse,
  FireworksListModelsRequest,
  FireworksListModelsResponse,
  FireworksCreateModelRequest,
  FireworksModel,
  FireworksGetModelRequest,
  FireworksUpdateModelRequest,
  FireworksPrepareModelRequest,
  FireworksGetUploadEndpointRequest,
  FireworksGetUploadEndpointResponse,
  FireworksGetDownloadEndpointRequest,
  FireworksGetDownloadEndpointResponse,
  FireworksValidateUploadRequest,
  FireworksValidateUploadResponse,
  FireworksBatchJobCreateRequest,
  FireworksBatchJob,
  FireworksBatchJobListRequest,
  FireworksBatchJobListResponse,
  FireworksSFTCreateRequest,
  FireworksSFTListRequest,
  FireworksSFTListResponse,
  FireworksSFTGetRequest,
  FireworksSFTDeleteRequest,
  FireworksSFTResumeRequest,
  FireworksSFTJob,
  FireworksCreateDatasetRequest,
  FireworksDataset,
  FireworksListDatasetsRequest,
  FireworksListDatasetsResponse,
  FireworksGetDatasetRequest,
  FireworksUpdateDatasetRequest,
  FireworksDatasetGetUploadEndpointRequest,
  FireworksDatasetGetUploadEndpointResponse,
  FireworksDatasetGetDownloadEndpointRequest,
  FireworksDatasetGetDownloadEndpointResponse,
  FireworksDatasetValidateUploadRequest,
  FireworksCreateDeploymentRequest,
  FireworksCreateDeploymentOptions,
  FireworksListDeploymentsRequest,
  FireworksListDeploymentsResponse,
  FireworksDeployment,
  FireworksUpdateDeploymentRequest,
  FireworksScaleDeploymentRequest,
  FireworksDeleteDeploymentOptions,
  FireworksDeploymentShape,
  FireworksDeploymentShapeVersion,
  FireworksGetDeploymentShapeRequest,
  FireworksGetDeploymentShapeVersionRequest,
  FireworksListDeploymentShapeVersionsRequest,
  FireworksListDeploymentShapeVersionsResponse,
  FireworksAudioBatchTranscriptionRequest,
  FireworksAudioBatchTranslationRequest,
  FireworksAudioBatchSubmitResponse,
  FireworksAudioBatchJob,
  FireworksDpoJobCreateRequest,
  FireworksDpoJob,
  FireworksDpoJobListRequest,
  FireworksDpoJobListResponse,
  FireworksDpoJobGetRequest,
  FireworksMetricsFileEndpointResponse,
  FireworksCreateDeployedModelRequest,
  FireworksCreateDeployedModelOptions,
  FireworksListDeployedModelsRequest,
  FireworksListDeployedModelsResponse,
  FireworksDeployedModel,
  FireworksUpdateDeployedModelRequest,
  FireworksGetDeployedModelRequest,
  FireworksStreamingTranscriptionOptions,
  FireworksStreamingTranscriptionMessage,
  FireworksStreamingTranscriptionSession,
  FireworksListAccountsRequest,
  FireworksListAccountsResponse,
  FireworksGetAccountRequest,
  FireworksAccount,
  FireworksListUsersRequest,
  FireworksListUsersResponse,
  FireworksCreateUserRequest,
  FireworksCreateUserOptions,
  FireworksUser,
  FireworksGetUserRequest,
  FireworksUpdateUserRequest,
  FireworksListApiKeysRequest,
  FireworksListApiKeysResponse,
  FireworksCreateApiKeyRequest,
  FireworksApiKey,
  FireworksDeleteApiKeyRequest,
  FireworksListSecretsRequest,
  FireworksListSecretsResponse,
  FireworksCreateSecretRequest,
  FireworksSecret,
  FireworksUpdateSecretRequest,
  FireworksCreateEvaluatorRequest,
  FireworksEvaluator,
  FireworksListEvaluatorsRequest,
  FireworksListEvaluatorsResponse,
  FireworksGetEvaluatorRequest,
  FireworksUpdateEvaluatorRequest,
  FireworksUpdateEvaluatorOptions,
  FireworksGetUploadEndpointEvaluatorRequest,
  FireworksGetUploadEndpointEvaluatorResponse,
  FireworksGetBuildLogEndpointRequest,
  FireworksGetBuildLogEndpointResponse,
  FireworksGetSourceCodeSignedUrlRequest,
  FireworksGetSourceCodeSignedUrlResponse,
  FireworksCreateEvaluationJobRequest,
  FireworksEvaluationJob,
  FireworksListEvaluationJobsRequest,
  FireworksListEvaluationJobsResponse,
  FireworksGetEvaluationJobRequest,
  FireworksGetExecutionLogEndpointResponse,
  FireworksRFTCreateRequest,
  FireworksRFTJob,
  FireworksRFTGetRequest,
  FireworksRFTListRequest,
  FireworksRFTListResponse,
  FireworksRlorTrainerJobCreateRequest,
  FireworksRlorTrainerJob,
  FireworksRlorTrainerJobGetRequest,
  FireworksRlorTrainerJobListRequest,
  FireworksRlorTrainerJobListResponse,
  FireworksRlorTrainerJobExecuteStepRequest,
  FireworksProvider,
  FireworksError,
} from "./types";
import type { ValidationResult, PayloadSchema } from "./types";
import {
  chatCompletionsSchema,
  completionsSchema,
  embeddingsSchema,
  rerankSchema,
  messagesSchema,
  textToImageSchema,
  kontextSchema,
  getResultSchema,
  audioTranscriptionsSchema,
  audioTranslationsSchema,
  modelsListSchema,
  modelsCreateSchema,
  modelsGetSchema,
  modelsUpdateSchema,
  modelsDeleteSchema,
  modelsPrepareSchema,
  modelsGetUploadEndpointSchema,
  modelsGetDownloadEndpointSchema,
  modelsValidateUploadSchema,
  batchInferenceJobCreateSchema,
  sftCreateSchema,
  createDeploymentSchema,
  updateDeploymentSchema,
  scaleDeploymentSchema,
  audioBatchTranscriptionsSchema,
  audioBatchTranslationsSchema,
  audioStreamingTranscriptionsSchema,
  dpoJobCreateSchema,
  createDeployedModelSchema,
  updateDeployedModelSchema,
  createUserSchema,
  updateUserSchema,
  createApiKeySchema,
  deleteApiKeySchema,
  createSecretSchema,
  updateSecretSchema,
  datasetsCreateSchema,
  datasetsUpdateSchema,
  datasetsGetUploadEndpointSchema,
  datasetsGetDownloadEndpointSchema,
  datasetsValidateUploadSchema,
  createEvaluatorSchema,
  updateEvaluatorSchema,
  getUploadEndpointEvaluatorSchema,
  createEvaluationJobSchema,
  rftCreateSchema,
  rlorTrainerJobCreateSchema,
  rlorTrainerJobExecuteStepSchema,
} from "./schemas";
import { validatePayload } from "./validate";
import { sseToIterable } from "./sse";

export function fireworks(opts: FireworksOptions): FireworksProvider {
  const baseURL = opts.baseURL ?? "https://api.fireworks.ai/inference/v1";
  const modelsBaseURL = "https://api.fireworks.ai";
  const audioBaseURL =
    opts.audioBaseURL ?? "https://audio-prod.api.fireworks.ai/v1";
  const audioStreamingBaseURL =
    opts.audioStreamingBaseURL ?? "wss://audio-streaming.api.fireworks.ai";
  const doFetch = opts.fetch ?? fetch;
  const WS = opts.WebSocket ?? globalThis.WebSocket;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    path: string,
    body: unknown,
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Fireworks API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FireworksError) throw error;
      throw new FireworksError(`Fireworks request failed: ${error}`, 500);
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
      signal.addEventListener("abort", () => controller.abort());
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
        let message = `Fireworks API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
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

  async function* messagesStreamImpl(
    req: AnthropicMessagesRequest,
    signal?: AbortSignal
  ): AsyncIterable<AnthropicStreamEvent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${baseURL}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Fireworks API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
      }

      for await (const { event, data } of sseToIterable(res)) {
        if (event === "message_stop") {
          break;
        }

        try {
          const parsed: AnthropicStreamEvent = JSON.parse(data);
          yield parsed;
        } catch {
          // ignore non-JSON lines
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function messagesImpl(
    req: AnthropicMessagesRequest,
    signal?: AbortSignal
  ): Promise<AnthropicMessagesResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${baseURL}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Fireworks API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
      }

      return (await res.json()) as AnthropicMessagesResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function makeWorkflowRequest<T>(
    model: string,
    suffix: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const url = `${baseURL}/workflows/accounts/fireworks/models/${model}${suffix}`;
      const res = await doFetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Fireworks API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error_message" in resBody
          ) {
            message = `Fireworks API error ${res.status}: ${(resBody as { error_message: string }).error_message}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FireworksError) throw error;
      throw new FireworksError(`Fireworks request failed: ${error}`, 500);
    }
  }

  function getAudioBaseURL(model?: string): string {
    if (model === "whisper-v3-turbo") {
      return "https://audio-turbo.api.fireworks.ai/v1";
    }
    return audioBaseURL;
  }

  async function makeAudioRequest<T>(
    path: string,
    form: FormData,
    model: string | undefined,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const url = `${getAudioBaseURL(model)}${path}`;
      const res = await doFetch(url, {
        method: "POST",
        headers: {
          Authorization: opts.apiKey,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Fireworks API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FireworksError) throw error;
      throw new FireworksError(`Fireworks request failed: ${error}`, 500);
    }
  }

  const audioBatchBaseURL = "https://audio-batch.api.fireworks.ai/v1";

  async function makeAudioBatchRequest<T>(
    path: string,
    form: FormData,
    endpointId: string,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const url = `${audioBatchBaseURL}${path}?endpoint_id=${encodeURIComponent(endpointId)}`;
      const res = await doFetch(url, {
        method: "POST",
        headers: {
          Authorization: opts.apiKey,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Fireworks API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FireworksError) throw error;
      throw new FireworksError(`Fireworks request failed: ${error}`, 500);
    }
  }

  async function makeModelsRequest<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      let url = `${modelsBaseURL}${path}`;
      if (query) {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) {
          if (v !== undefined) params.append(k, String(v));
        }
        const qs = params.toString();
        if (qs) url += `?${qs}`;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${opts.apiKey}`,
      };
      if (method !== "GET" && method !== "DELETE") {
        headers["Content-Type"] = "application/json";
      }

      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (body !== undefined && method !== "GET" && method !== "DELETE") {
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(url, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Fireworks API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
          if (
            typeof resBody === "object" &&
            resBody !== null &&
            "error" in resBody
          ) {
            const err = (resBody as { error: { message?: string } }).error;
            if (err?.message) {
              message = `Fireworks API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new FireworksError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FireworksError) throw error;
      throw new FireworksError(`Fireworks request failed: ${error}`, 500);
    }
  }

  // ============================================================
  // Verb-Prefixed API Surface Implementation
  // ============================================================

  // POST namespace - methods that use HTTP POST
  const postV1 = {
    chat: {
      completions: Object.assign(
        async (
          req: FireworksChatRequest,
          signal?: AbortSignal
        ): Promise<FireworksChatResponse> => {
          return await makeRequest<FireworksChatResponse>(
            "/chat/completions",
            req,
            signal
          );
        },
        {
          stream: Object.assign(
            (
              req: FireworksChatRequest,
              signal?: AbortSignal
            ): AsyncIterable<FireworksChatStreamChunk> => {
              return makeStreamRequest<FireworksChatStreamChunk>(
                "/chat/completions",
                { ...req, stream: true },
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
          payloadSchema: chatCompletionsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, chatCompletionsSchema);
          },
        }
      ),
    },
    completions: Object.assign(
      async (
        req: FireworksCompletionRequest,
        signal?: AbortSignal
      ): Promise<FireworksCompletionResponse> => {
        return await makeRequest<FireworksCompletionResponse>(
          "/completions",
          req,
          signal
        );
      },
      {
        stream: Object.assign(
          (
            req: FireworksCompletionRequest,
            signal?: AbortSignal
          ): AsyncIterable<FireworksCompletionStreamChunk> => {
            return makeStreamRequest<FireworksCompletionStreamChunk>(
              "/completions",
              { ...req, stream: true },
              signal
            );
          },
          {
            payloadSchema: completionsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, completionsSchema);
            },
          }
        ),
        payloadSchema: completionsSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, completionsSchema);
        },
      }
    ),
    embeddings: Object.assign(
      async (
        req: FireworksEmbeddingRequest,
        signal?: AbortSignal
      ): Promise<FireworksEmbeddingResponse> => {
        return await makeRequest<FireworksEmbeddingResponse>(
          "/embeddings",
          req,
          signal
        );
      },
      {
        payloadSchema: embeddingsSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, embeddingsSchema);
        },
      }
    ),
    rerank: Object.assign(
      async (
        req: FireworksRerankRequest,
        signal?: AbortSignal
      ): Promise<FireworksRerankResponse> => {
        return await makeRequest<FireworksRerankResponse>(
          "/rerank",
          req,
          signal
        );
      },
      {
        payloadSchema: rerankSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, rerankSchema);
        },
      }
    ),
    messages: Object.assign(messagesImpl, {
      stream: Object.assign(messagesStreamImpl, {
        payloadSchema: messagesSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, messagesSchema);
        },
      }),
      payloadSchema: messagesSchema,
      validatePayload(data: unknown): ValidationResult {
        return validatePayload(data, messagesSchema);
      },
    }),
    workflows: {
      textToImage: Object.assign(
        async (
          model: string,
          req: FireworksTextToImageRequest,
          signal?: AbortSignal
        ): Promise<FireworksTextToImageResponse> => {
          return await makeWorkflowRequest<FireworksTextToImageResponse>(
            model,
            "/text_to_image",
            req,
            signal
          );
        },
        {
          payloadSchema: textToImageSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, textToImageSchema);
          },
        }
      ),
      kontext: Object.assign(
        async (
          model: string,
          req: FireworksKontextRequest,
          signal?: AbortSignal
        ): Promise<FireworksKontextResponse> => {
          return await makeWorkflowRequest<FireworksKontextResponse>(
            model,
            "",
            req,
            signal
          );
        },
        {
          payloadSchema: kontextSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, kontextSchema);
          },
        }
      ),
      getResult: Object.assign(
        async (
          model: string,
          req: FireworksGetResultRequest,
          signal?: AbortSignal
        ): Promise<FireworksGetResultResponse> => {
          return await makeWorkflowRequest<FireworksGetResultResponse>(
            model,
            "/get_result",
            req,
            signal
          );
        },
        {
          payloadSchema: getResultSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, getResultSchema);
          },
        }
      ),
    },
    audio: {
      transcriptions: Object.assign(
        async (
          req: FireworksTranscriptionRequest,
          signal?: AbortSignal
        ): Promise<FireworksTranscriptionResponse> => {
          const form = new FormData();
          if (typeof req.file === "string") {
            form.append("file", req.file);
          } else {
            form.append("file", req.file);
          }
          if (req.model !== undefined) form.append("model", req.model);
          if (req.vad_model !== undefined)
            form.append("vad_model", req.vad_model);
          if (req.alignment_model !== undefined)
            form.append("alignment_model", req.alignment_model);
          if (req.language !== undefined) form.append("language", req.language);
          if (req.prompt !== undefined) form.append("prompt", req.prompt);
          if (req.temperature !== undefined) {
            form.append(
              "temperature",
              Array.isArray(req.temperature)
                ? JSON.stringify(req.temperature)
                : String(req.temperature)
            );
          }
          if (req.response_format !== undefined)
            form.append("response_format", req.response_format);
          if (req.timestamp_granularities !== undefined) {
            form.append(
              "timestamp_granularities",
              Array.isArray(req.timestamp_granularities)
                ? req.timestamp_granularities.join(",")
                : req.timestamp_granularities
            );
          }
          if (req.diarize !== undefined) form.append("diarize", req.diarize);
          if (req.min_speakers !== undefined)
            form.append("min_speakers", String(req.min_speakers));
          if (req.max_speakers !== undefined)
            form.append("max_speakers", String(req.max_speakers));
          if (req.preprocessing !== undefined)
            form.append("preprocessing", req.preprocessing);

          return await makeAudioRequest<FireworksTranscriptionResponse>(
            "/audio/transcriptions",
            form,
            req.model,
            signal
          );
        },
        {
          payloadSchema: audioTranscriptionsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, audioTranscriptionsSchema);
          },
        }
      ),
      translations: Object.assign(
        async (
          req: FireworksTranslationRequest,
          signal?: AbortSignal
        ): Promise<FireworksTranslationResponse> => {
          const form = new FormData();
          if (typeof req.file === "string") {
            form.append("file", req.file);
          } else {
            form.append("file", req.file);
          }
          if (req.model !== undefined) form.append("model", req.model);
          if (req.vad_model !== undefined)
            form.append("vad_model", req.vad_model);
          if (req.alignment_model !== undefined)
            form.append("alignment_model", req.alignment_model);
          if (req.language !== undefined) form.append("language", req.language);
          if (req.prompt !== undefined) form.append("prompt", req.prompt);
          if (req.temperature !== undefined) {
            form.append(
              "temperature",
              Array.isArray(req.temperature)
                ? JSON.stringify(req.temperature)
                : String(req.temperature)
            );
          }
          if (req.response_format !== undefined)
            form.append("response_format", req.response_format);
          if (req.timestamp_granularities !== undefined) {
            form.append(
              "timestamp_granularities",
              Array.isArray(req.timestamp_granularities)
                ? req.timestamp_granularities.join(",")
                : req.timestamp_granularities
            );
          }
          if (req.preprocessing !== undefined)
            form.append("preprocessing", req.preprocessing);

          return await makeAudioRequest<FireworksTranslationResponse>(
            "/audio/translations",
            form,
            req.model,
            signal
          );
        },
        {
          payloadSchema: audioTranslationsSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, audioTranslationsSchema);
          },
        }
      ),
      batch: {
        transcriptions: Object.assign(
          async (
            req: FireworksAudioBatchTranscriptionRequest,
            signal?: AbortSignal
          ): Promise<FireworksAudioBatchSubmitResponse> => {
            const form = new FormData();
            if (typeof req.file === "string") {
              form.append("file", req.file);
            } else {
              form.append("file", req.file);
            }
            if (req.model !== undefined) form.append("model", req.model);
            if (req.vad_model !== undefined)
              form.append("vad_model", req.vad_model);
            if (req.alignment_model !== undefined)
              form.append("alignment_model", req.alignment_model);
            if (req.language !== undefined)
              form.append("language", req.language);
            if (req.prompt !== undefined) form.append("prompt", req.prompt);
            if (req.temperature !== undefined) {
              form.append(
                "temperature",
                Array.isArray(req.temperature)
                  ? JSON.stringify(req.temperature)
                  : String(req.temperature)
              );
            }
            if (req.response_format !== undefined)
              form.append("response_format", req.response_format);
            if (req.timestamp_granularities !== undefined) {
              form.append(
                "timestamp_granularities",
                Array.isArray(req.timestamp_granularities)
                  ? req.timestamp_granularities.join(",")
                  : req.timestamp_granularities
              );
            }
            if (req.diarize !== undefined) form.append("diarize", req.diarize);
            if (req.min_speakers !== undefined)
              form.append("min_speakers", String(req.min_speakers));
            if (req.max_speakers !== undefined)
              form.append("max_speakers", String(req.max_speakers));
            if (req.preprocessing !== undefined)
              form.append("preprocessing", req.preprocessing);

            return await makeAudioBatchRequest<FireworksAudioBatchSubmitResponse>(
              "/audio/transcriptions",
              form,
              req.endpoint_id,
              signal
            );
          },
          {
            payloadSchema: audioBatchTranscriptionsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, audioBatchTranscriptionsSchema);
            },
          }
        ),
        translations: Object.assign(
          async (
            req: FireworksAudioBatchTranslationRequest,
            signal?: AbortSignal
          ): Promise<FireworksAudioBatchSubmitResponse> => {
            const form = new FormData();
            if (typeof req.file === "string") {
              form.append("file", req.file);
            } else {
              form.append("file", req.file);
            }
            if (req.model !== undefined) form.append("model", req.model);
            if (req.vad_model !== undefined)
              form.append("vad_model", req.vad_model);
            if (req.alignment_model !== undefined)
              form.append("alignment_model", req.alignment_model);
            if (req.language !== undefined)
              form.append("language", req.language);
            if (req.prompt !== undefined) form.append("prompt", req.prompt);
            if (req.temperature !== undefined) {
              form.append(
                "temperature",
                Array.isArray(req.temperature)
                  ? JSON.stringify(req.temperature)
                  : String(req.temperature)
              );
            }
            if (req.response_format !== undefined)
              form.append("response_format", req.response_format);
            if (req.timestamp_granularities !== undefined) {
              form.append(
                "timestamp_granularities",
                Array.isArray(req.timestamp_granularities)
                  ? req.timestamp_granularities.join(",")
                  : req.timestamp_granularities
              );
            }
            if (req.preprocessing !== undefined)
              form.append("preprocessing", req.preprocessing);

            return await makeAudioBatchRequest<FireworksAudioBatchSubmitResponse>(
              "/audio/translations",
              form,
              req.endpoint_id,
              signal
            );
          },
          {
            payloadSchema: audioBatchTranslationsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, audioBatchTranslationsSchema);
            },
          }
        ),
      },
    },
    accounts: {
      users: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksCreateUserRequest,
            options?: FireworksCreateUserOptions,
            signal?: AbortSignal
          ): Promise<FireworksUser> => {
            return await makeModelsRequest<FireworksUser>(
              "POST",
              `/v1/accounts/${accountId}/users`,
              req,
              options as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: createUserSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, createUserSchema);
            },
          }
        ),
        update: Object.assign(
          async (
            accountId: string,
            userId: string,
            req: FireworksUpdateUserRequest,
            signal?: AbortSignal
          ): Promise<FireworksUser> => {
            return await makeModelsRequest<FireworksUser>(
              "PATCH",
              `/v1/accounts/${accountId}/users/${userId}`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: updateUserSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, updateUserSchema);
            },
            async post(
              accountId: string,
              userId: string,
              req: FireworksUpdateUserRequest,
              signal?: AbortSignal
            ): Promise<FireworksUser> {
              return await makeModelsRequest<FireworksUser>(
                "PATCH",
                `/v1/accounts/${accountId}/users/${userId}`,
                req,
                undefined,
                signal
              );
            },
          }
        ),
      },
      models: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksCreateModelRequest,
            signal?: AbortSignal
          ): Promise<FireworksModel> => {
            return await makeModelsRequest<FireworksModel>(
              "POST",
              `/v1/accounts/${accountId}/models`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: modelsCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsCreateSchema);
            },
          }
        ),
        prepare: Object.assign(
          async (
            accountId: string,
            modelId: string,
            req: FireworksPrepareModelRequest,
            signal?: AbortSignal
          ): Promise<Record<string, never>> => {
            return await makeModelsRequest<Record<string, never>>(
              "POST",
              `/v1/accounts/${accountId}/models/${modelId}:prepare`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: modelsPrepareSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsPrepareSchema);
            },
          }
        ),
        getUploadEndpoint: Object.assign(
          async (
            accountId: string,
            modelId: string,
            req: FireworksGetUploadEndpointRequest,
            signal?: AbortSignal
          ): Promise<FireworksGetUploadEndpointResponse> => {
            return await makeModelsRequest<FireworksGetUploadEndpointResponse>(
              "POST",
              `/v1/accounts/${accountId}/models/${modelId}:getUploadEndpoint`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: modelsGetUploadEndpointSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsGetUploadEndpointSchema);
            },
          }
        ),
      },
      deployments: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksCreateDeploymentRequest,
            options?: FireworksCreateDeploymentOptions,
            signal?: AbortSignal
          ): Promise<FireworksDeployment> => {
            return await makeModelsRequest<FireworksDeployment>(
              "POST",
              `/v1/accounts/${accountId}/deployments`,
              req,
              options as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: createDeploymentSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, createDeploymentSchema);
            },
          }
        ),
        undelete: async (
          accountId: string,
          deploymentId: string,
          signal?: AbortSignal
        ): Promise<FireworksDeployment> => {
          return await makeModelsRequest<FireworksDeployment>(
            "POST",
            `/v1/accounts/${accountId}/deployments/${deploymentId}:undelete`,
            {},
            undefined,
            signal
          );
        },
      },
      deployedModels: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksCreateDeployedModelRequest,
            options?: FireworksCreateDeployedModelOptions,
            signal?: AbortSignal
          ): Promise<FireworksDeployedModel> => {
            return await makeModelsRequest<FireworksDeployedModel>(
              "POST",
              `/v1/accounts/${accountId}/deployedModels`,
              req,
              options as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: createDeployedModelSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, createDeployedModelSchema);
            },
          }
        ),
      },
      apiKeys: {
        create: Object.assign(
          async (
            accountId: string,
            userId: string,
            req: FireworksCreateApiKeyRequest,
            signal?: AbortSignal
          ): Promise<FireworksApiKey> => {
            return await makeModelsRequest<FireworksApiKey>(
              "POST",
              `/v1/accounts/${accountId}/users/${userId}/apiKeys`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: createApiKeySchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, createApiKeySchema);
            },
          }
        ),
      },
      secrets: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksCreateSecretRequest,
            signal?: AbortSignal
          ): Promise<FireworksSecret> => {
            return await makeModelsRequest<FireworksSecret>(
              "POST",
              `/v1/accounts/${accountId}/secrets`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: createSecretSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, createSecretSchema);
            },
          }
        ),
      },
      datasets: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksCreateDatasetRequest,
            signal?: AbortSignal
          ): Promise<FireworksDataset> => {
            return await makeModelsRequest<FireworksDataset>(
              "POST",
              `/v1/accounts/${accountId}/datasets`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: datasetsCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, datasetsCreateSchema);
            },
          }
        ),
        getUploadEndpoint: Object.assign(
          async (
            accountId: string,
            datasetId: string,
            req: FireworksDatasetGetUploadEndpointRequest,
            signal?: AbortSignal
          ): Promise<FireworksDatasetGetUploadEndpointResponse> => {
            return await makeModelsRequest<FireworksDatasetGetUploadEndpointResponse>(
              "POST",
              `/v1/accounts/${accountId}/datasets/${datasetId}:getUploadEndpoint`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: datasetsGetUploadEndpointSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, datasetsGetUploadEndpointSchema);
            },
          }
        ),
        validateUpload: Object.assign(
          async (
            accountId: string,
            datasetId: string,
            req?: FireworksDatasetValidateUploadRequest,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> => {
            return await makeModelsRequest<Record<string, unknown>>(
              "POST",
              `/v1/accounts/${accountId}/datasets/${datasetId}:validateUpload`,
              req ?? {},
              undefined,
              signal
            );
          },
          {
            payloadSchema: datasetsValidateUploadSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, datasetsValidateUploadSchema);
            },
          }
        ),
      },
      batchInferenceJobs: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksBatchJobCreateRequest,
            signal?: AbortSignal
          ): Promise<FireworksBatchJob> => {
            return await makeModelsRequest<FireworksBatchJob>(
              "POST",
              `/v1/accounts/${accountId}/batchInferenceJobs`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: batchInferenceJobCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, batchInferenceJobCreateSchema);
            },
          }
        ),
      },
      supervisedFineTuningJobs: {
        create: Object.assign(
          async (
            req: FireworksSFTCreateRequest,
            signal?: AbortSignal
          ): Promise<FireworksSFTJob> => {
            const { accountId, supervisedFineTuningJobId, ...body } = req;
            const query: Record<string, string> = {};
            if (supervisedFineTuningJobId) {
              query.supervisedFineTuningJobId = supervisedFineTuningJobId;
            }
            return await makeModelsRequest<FireworksSFTJob>(
              "POST",
              `/v1/accounts/${accountId}/supervisedFineTuningJobs`,
              body,
              Object.keys(query).length > 0 ? query : undefined,
              signal
            );
          },
          {
            payloadSchema: sftCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, sftCreateSchema);
            },
          }
        ),
        resume: async (
          req: FireworksSFTResumeRequest,
          signal?: AbortSignal
        ): Promise<FireworksSFTJob> => {
          return await makeModelsRequest<FireworksSFTJob>(
            "POST",
            `/v1/accounts/${req.accountId}/supervisedFineTuningJobs/${req.jobId}:resume`,
            {},
            undefined,
            signal
          );
        },
      },
      dpoJobs: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksDpoJobCreateRequest,
            signal?: AbortSignal
          ): Promise<FireworksDpoJob> => {
            return await makeModelsRequest<FireworksDpoJob>(
              "POST",
              `/v1/accounts/${accountId}/dpoJobs`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: dpoJobCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, dpoJobCreateSchema);
            },
          }
        ),
        resume: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<FireworksDpoJob> => {
          return await makeModelsRequest<FireworksDpoJob>(
            "POST",
            `/v1/accounts/${accountId}/dpoJobs/${jobId}:resume`,
            {},
            undefined,
            signal
          );
        },
        getMetricsFileEndpoint: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<FireworksMetricsFileEndpointResponse> => {
          return await makeModelsRequest<FireworksMetricsFileEndpointResponse>(
            "GET",
            `/v1/accounts/${accountId}/dpoJobs/${jobId}:getMetricsFileEndpoint`,
            undefined,
            undefined,
            signal
          );
        },
      },
      evaluators: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksCreateEvaluatorRequest,
            signal?: AbortSignal
          ): Promise<FireworksEvaluator> => {
            return await makeModelsRequest<FireworksEvaluator>(
              "POST",
              `/v1/accounts/${accountId}/evaluatorsV2`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: createEvaluatorSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, createEvaluatorSchema);
            },
          }
        ),
        getUploadEndpoint: Object.assign(
          async (
            accountId: string,
            evaluatorId: string,
            req: FireworksGetUploadEndpointEvaluatorRequest,
            signal?: AbortSignal
          ): Promise<FireworksGetUploadEndpointEvaluatorResponse> => {
            return await makeModelsRequest<FireworksGetUploadEndpointEvaluatorResponse>(
              "POST",
              `/v1/accounts/${accountId}/evaluators/${evaluatorId}:getUploadEndpoint`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: getUploadEndpointEvaluatorSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, getUploadEndpointEvaluatorSchema);
            },
          }
        ),
        validateUpload: async (
          accountId: string,
          evaluatorId: string,
          signal?: AbortSignal
        ): Promise<Record<string, unknown>> => {
          return await makeModelsRequest<Record<string, unknown>>(
            "POST",
            `/v1/accounts/${accountId}/evaluators/${evaluatorId}:validateUpload`,
            {},
            undefined,
            signal
          );
        },
      },
      evaluationJobs: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksCreateEvaluationJobRequest,
            signal?: AbortSignal
          ): Promise<FireworksEvaluationJob> => {
            return await makeModelsRequest<FireworksEvaluationJob>(
              "POST",
              `/v1/accounts/${accountId}/evaluationJobs`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: createEvaluationJobSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, createEvaluationJobSchema);
            },
          }
        ),
        getExecutionLogEndpoint: async (
          accountId: string,
          evaluationJobId: string,
          signal?: AbortSignal
        ): Promise<FireworksGetExecutionLogEndpointResponse> => {
          return await makeModelsRequest<FireworksGetExecutionLogEndpointResponse>(
            "GET",
            `/v1/accounts/${accountId}/evaluationJobs/${evaluationJobId}:getExecutionLogEndpoint`,
            undefined,
            undefined,
            signal
          );
        },
      },
      reinforcementFineTuningJobs: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksRFTCreateRequest,
            signal?: AbortSignal
          ): Promise<FireworksRFTJob> => {
            const { reinforcementFineTuningJobId, ...body } = req;
            const query: Record<string, string> = {};
            if (reinforcementFineTuningJobId) {
              query.reinforcementFineTuningJobId = reinforcementFineTuningJobId;
            }
            return await makeModelsRequest<FireworksRFTJob>(
              "POST",
              `/v1/accounts/${accountId}/reinforcementFineTuningJobs`,
              body,
              Object.keys(query).length > 0 ? query : undefined,
              signal
            );
          },
          {
            payloadSchema: rftCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, rftCreateSchema);
            },
          }
        ),
        resume: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<FireworksRFTJob> => {
          return await makeModelsRequest<FireworksRFTJob>(
            "POST",
            `/v1/accounts/${accountId}/reinforcementFineTuningJobs/${jobId}:resume`,
            {},
            undefined,
            signal
          );
        },
      },
      rlorTrainerJobs: {
        create: Object.assign(
          async (
            accountId: string,
            req: FireworksRlorTrainerJobCreateRequest,
            signal?: AbortSignal
          ): Promise<FireworksRlorTrainerJob> => {
            return await makeModelsRequest<FireworksRlorTrainerJob>(
              "POST",
              `/v1/accounts/${accountId}/rlorTrainerJobs`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: rlorTrainerJobCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, rlorTrainerJobCreateSchema);
            },
          }
        ),
        executeTrainStep: Object.assign(
          async (
            accountId: string,
            jobId: string,
            req: FireworksRlorTrainerJobExecuteStepRequest,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> => {
            return await makeModelsRequest<Record<string, unknown>>(
              "POST",
              `/v1/accounts/${accountId}/rlorTrainerJobs/${jobId}:executeTrainStep`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: rlorTrainerJobExecuteStepSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, rlorTrainerJobExecuteStepSchema);
            },
          }
        ),
        resume: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<FireworksRlorTrainerJob> => {
          return await makeModelsRequest<FireworksRlorTrainerJob>(
            "POST",
            `/v1/accounts/${accountId}/rlorTrainerJobs/${jobId}:resume`,
            {},
            undefined,
            signal
          );
        },
      },
    },
  };

  // GET namespace - methods that use HTTP GET
  const getV1 = {
    accounts: {
      list: async (
        params?: FireworksListAccountsRequest,
        signal?: AbortSignal
      ): Promise<FireworksListAccountsResponse> => {
        return await makeModelsRequest<FireworksListAccountsResponse>(
          "GET",
          "/v1/accounts",
          undefined,
          params as Record<string, string | number | boolean | undefined>,
          signal
        );
      },
      get: async (
        accountId: string,
        params?: FireworksGetAccountRequest,
        signal?: AbortSignal
      ): Promise<FireworksAccount> => {
        return await makeModelsRequest<FireworksAccount>(
          "GET",
          `/v1/accounts/${accountId}`,
          undefined,
          params as Record<string, string | number | boolean | undefined>,
          signal
        );
      },
      users: {
        list: async (
          accountId: string,
          params?: FireworksListUsersRequest,
          signal?: AbortSignal
        ): Promise<FireworksListUsersResponse> => {
          return await makeModelsRequest<FireworksListUsersResponse>(
            "GET",
            `/v1/accounts/${accountId}/users`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          userId: string,
          params?: FireworksGetUserRequest,
          signal?: AbortSignal
        ): Promise<FireworksUser> => {
          return await makeModelsRequest<FireworksUser>(
            "GET",
            `/v1/accounts/${accountId}/users/${userId}`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      apiKeys: {
        list: async (
          accountId: string,
          userId: string,
          params?: FireworksListApiKeysRequest,
          signal?: AbortSignal
        ): Promise<FireworksListApiKeysResponse> => {
          return await makeModelsRequest<FireworksListApiKeysResponse>(
            "GET",
            `/v1/accounts/${accountId}/users/${userId}/apiKeys`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      secrets: {
        list: async (
          accountId: string,
          params?: FireworksListSecretsRequest,
          signal?: AbortSignal
        ): Promise<FireworksListSecretsResponse> => {
          return await makeModelsRequest<FireworksListSecretsResponse>(
            "GET",
            `/v1/accounts/${accountId}/secrets`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          secretId: string,
          params?: { readMask?: string },
          signal?: AbortSignal
        ): Promise<FireworksSecret> => {
          return await makeModelsRequest<FireworksSecret>(
            "GET",
            `/v1/accounts/${accountId}/secrets/${secretId}`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      models: {
        list: Object.assign(
          async (
            accountId: string,
            req?: FireworksListModelsRequest,
            signal?: AbortSignal
          ): Promise<FireworksListModelsResponse> => {
            return await makeModelsRequest<FireworksListModelsResponse>(
              "GET",
              `/v1/accounts/${accountId}/models`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: modelsListSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsListSchema);
            },
          }
        ),
        get: Object.assign(
          async (
            accountId: string,
            modelId: string,
            req?: FireworksGetModelRequest,
            signal?: AbortSignal
          ): Promise<FireworksModel> => {
            return await makeModelsRequest<FireworksModel>(
              "GET",
              `/v1/accounts/${accountId}/models/${modelId}`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: modelsGetSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsGetSchema);
            },
          }
        ),
        getDownloadEndpoint: Object.assign(
          async (
            accountId: string,
            modelId: string,
            req?: FireworksGetDownloadEndpointRequest,
            signal?: AbortSignal
          ): Promise<FireworksGetDownloadEndpointResponse> => {
            return await makeModelsRequest<FireworksGetDownloadEndpointResponse>(
              "GET",
              `/v1/accounts/${accountId}/models/${modelId}:getDownloadEndpoint`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: modelsGetDownloadEndpointSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsGetDownloadEndpointSchema);
            },
          }
        ),
        validateUpload: Object.assign(
          async (
            accountId: string,
            modelId: string,
            req?: FireworksValidateUploadRequest,
            signal?: AbortSignal
          ): Promise<FireworksValidateUploadResponse> => {
            return await makeModelsRequest<FireworksValidateUploadResponse>(
              "GET",
              `/v1/accounts/${accountId}/models/${modelId}:validateUpload`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: modelsValidateUploadSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsValidateUploadSchema);
            },
          }
        ),
      },
      datasets: {
        list: async (
          accountId: string,
          params?: FireworksListDatasetsRequest,
          signal?: AbortSignal
        ): Promise<FireworksListDatasetsResponse> => {
          return await makeModelsRequest<FireworksListDatasetsResponse>(
            "GET",
            `/v1/accounts/${accountId}/datasets`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          datasetId: string,
          req?: FireworksGetDatasetRequest,
          signal?: AbortSignal
        ): Promise<FireworksDataset> => {
          return await makeModelsRequest<FireworksDataset>(
            "GET",
            `/v1/accounts/${accountId}/datasets/${datasetId}`,
            undefined,
            req as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        getDownloadEndpoint: Object.assign(
          async (
            accountId: string,
            datasetId: string,
            req?: FireworksDatasetGetDownloadEndpointRequest,
            signal?: AbortSignal
          ): Promise<FireworksDatasetGetDownloadEndpointResponse> => {
            return await makeModelsRequest<FireworksDatasetGetDownloadEndpointResponse>(
              "GET",
              `/v1/accounts/${accountId}/datasets/${datasetId}:getDownloadEndpoint`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: datasetsGetDownloadEndpointSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, datasetsGetDownloadEndpointSchema);
            },
          }
        ),
      },
      batchInferenceJobs: {
        list: async (
          accountId: string,
          req?: FireworksBatchJobListRequest,
          signal?: AbortSignal
        ): Promise<FireworksBatchJobListResponse> => {
          return await makeModelsRequest<FireworksBatchJobListResponse>(
            "GET",
            `/v1/accounts/${accountId}/batchInferenceJobs`,
            undefined,
            req as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<FireworksBatchJob> => {
          return await makeModelsRequest<FireworksBatchJob>(
            "GET",
            `/v1/accounts/${accountId}/batchInferenceJobs/${jobId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      supervisedFineTuningJobs: {
        list: async (
          req: FireworksSFTListRequest,
          signal?: AbortSignal
        ): Promise<FireworksSFTListResponse> => {
          const { accountId, ...params } = req;
          const query: Record<string, string | number | boolean | undefined> =
            {};
          if (params.pageSize !== undefined) query.pageSize = params.pageSize;
          if (params.pageToken) query.pageToken = params.pageToken;
          if (params.filter) query.filter = params.filter;
          if (params.orderBy) query.orderBy = params.orderBy;
          return await makeModelsRequest<FireworksSFTListResponse>(
            "GET",
            `/v1/accounts/${accountId}/supervisedFineTuningJobs`,
            undefined,
            Object.keys(query).length > 0 ? query : undefined,
            signal
          );
        },
        get: async (
          req: FireworksSFTGetRequest,
          signal?: AbortSignal
        ): Promise<FireworksSFTJob> => {
          return await makeModelsRequest<FireworksSFTJob>(
            "GET",
            `/v1/accounts/${req.accountId}/supervisedFineTuningJobs/${req.jobId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      deployments: {
        list: async (
          accountId: string,
          params?: FireworksListDeploymentsRequest,
          signal?: AbortSignal
        ): Promise<FireworksListDeploymentsResponse> => {
          return await makeModelsRequest<FireworksListDeploymentsResponse>(
            "GET",
            `/v1/accounts/${accountId}/deployments`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          deploymentId: string,
          signal?: AbortSignal
        ): Promise<FireworksDeployment> => {
          return await makeModelsRequest<FireworksDeployment>(
            "GET",
            `/v1/accounts/${accountId}/deployments/${deploymentId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      deploymentShapes: {
        get: async (
          accountId: string,
          shapeId: string,
          params?: FireworksGetDeploymentShapeRequest,
          signal?: AbortSignal
        ): Promise<FireworksDeploymentShape> => {
          return await makeModelsRequest<FireworksDeploymentShape>(
            "GET",
            `/v1/accounts/${accountId}/deploymentShapes/${shapeId}`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        versions: {
          list: async (
            accountId: string,
            shapeId: string,
            params?: FireworksListDeploymentShapeVersionsRequest,
            signal?: AbortSignal
          ): Promise<FireworksListDeploymentShapeVersionsResponse> => {
            return await makeModelsRequest<FireworksListDeploymentShapeVersionsResponse>(
              "GET",
              `/v1/accounts/${accountId}/deploymentShapes/${shapeId}/versions`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          get: async (
            accountId: string,
            shapeId: string,
            versionId: string,
            params?: FireworksGetDeploymentShapeVersionRequest,
            signal?: AbortSignal
          ): Promise<FireworksDeploymentShapeVersion> => {
            return await makeModelsRequest<FireworksDeploymentShapeVersion>(
              "GET",
              `/v1/accounts/${accountId}/deploymentShapes/${shapeId}/versions/${versionId}`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
        },
      },
      deployedModels: {
        list: async (
          accountId: string,
          params?: FireworksListDeployedModelsRequest,
          signal?: AbortSignal
        ): Promise<FireworksListDeployedModelsResponse> => {
          return await makeModelsRequest<FireworksListDeployedModelsResponse>(
            "GET",
            `/v1/accounts/${accountId}/deployedModels`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          deployedModelId: string,
          params?: FireworksGetDeployedModelRequest,
          signal?: AbortSignal
        ): Promise<FireworksDeployedModel> => {
          return await makeModelsRequest<FireworksDeployedModel>(
            "GET",
            `/v1/accounts/${accountId}/deployedModels/${deployedModelId}`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      dpoJobs: {
        list: async (
          accountId: string,
          req?: FireworksDpoJobListRequest,
          signal?: AbortSignal
        ): Promise<FireworksDpoJobListResponse> => {
          return await makeModelsRequest<FireworksDpoJobListResponse>(
            "GET",
            `/v1/accounts/${accountId}/dpoJobs`,
            undefined,
            req as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          jobId: string,
          req?: FireworksDpoJobGetRequest,
          signal?: AbortSignal
        ): Promise<FireworksDpoJob> => {
          return await makeModelsRequest<FireworksDpoJob>(
            "GET",
            `/v1/accounts/${accountId}/dpoJobs/${jobId}`,
            undefined,
            req as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      evaluators: {
        list: async (
          accountId: string,
          params?: FireworksListEvaluatorsRequest,
          signal?: AbortSignal
        ): Promise<FireworksListEvaluatorsResponse> => {
          return await makeModelsRequest<FireworksListEvaluatorsResponse>(
            "GET",
            `/v1/accounts/${accountId}/evaluators`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          evaluatorId: string,
          params?: FireworksGetEvaluatorRequest,
          signal?: AbortSignal
        ): Promise<FireworksEvaluator> => {
          return await makeModelsRequest<FireworksEvaluator>(
            "GET",
            `/v1/accounts/${accountId}/evaluators/${evaluatorId}`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        getBuildLogEndpoint: async (
          accountId: string,
          evaluatorId: string,
          params?: FireworksGetBuildLogEndpointRequest,
          signal?: AbortSignal
        ): Promise<FireworksGetBuildLogEndpointResponse> => {
          return await makeModelsRequest<FireworksGetBuildLogEndpointResponse>(
            "GET",
            `/v1/accounts/${accountId}/evaluators/${evaluatorId}:getBuildLogEndpoint`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        getSourceCodeSignedUrl: async (
          accountId: string,
          evaluatorId: string,
          params?: FireworksGetSourceCodeSignedUrlRequest,
          signal?: AbortSignal
        ): Promise<FireworksGetSourceCodeSignedUrlResponse> => {
          return await makeModelsRequest<FireworksGetSourceCodeSignedUrlResponse>(
            "GET",
            `/v1/accounts/${accountId}/evaluators/${evaluatorId}:getSourceCodeSignedUrl`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      evaluationJobs: {
        list: async (
          accountId: string,
          params?: FireworksListEvaluationJobsRequest,
          signal?: AbortSignal
        ): Promise<FireworksListEvaluationJobsResponse> => {
          return await makeModelsRequest<FireworksListEvaluationJobsResponse>(
            "GET",
            `/v1/accounts/${accountId}/evaluationJobs`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          evaluationJobId: string,
          params?: FireworksGetEvaluationJobRequest,
          signal?: AbortSignal
        ): Promise<FireworksEvaluationJob> => {
          return await makeModelsRequest<FireworksEvaluationJob>(
            "GET",
            `/v1/accounts/${accountId}/evaluationJobs/${evaluationJobId}`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      reinforcementFineTuningJobs: {
        list: async (
          accountId: string,
          req?: FireworksRFTListRequest,
          signal?: AbortSignal
        ): Promise<FireworksRFTListResponse> => {
          return await makeModelsRequest<FireworksRFTListResponse>(
            "GET",
            `/v1/accounts/${accountId}/reinforcementFineTuningJobs`,
            undefined,
            req as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          jobId: string,
          req?: FireworksRFTGetRequest,
          signal?: AbortSignal
        ): Promise<FireworksRFTJob> => {
          return await makeModelsRequest<FireworksRFTJob>(
            "GET",
            `/v1/accounts/${accountId}/reinforcementFineTuningJobs/${jobId}`,
            undefined,
            req as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      rlorTrainerJobs: {
        list: async (
          accountId: string,
          req?: FireworksRlorTrainerJobListRequest,
          signal?: AbortSignal
        ): Promise<FireworksRlorTrainerJobListResponse> => {
          return await makeModelsRequest<FireworksRlorTrainerJobListResponse>(
            "GET",
            `/v1/accounts/${accountId}/rlorTrainerJobs`,
            undefined,
            req as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        get: async (
          accountId: string,
          jobId: string,
          req?: FireworksRlorTrainerJobGetRequest,
          signal?: AbortSignal
        ): Promise<FireworksRlorTrainerJob> => {
          return await makeModelsRequest<FireworksRlorTrainerJob>(
            "GET",
            `/v1/accounts/${accountId}/rlorTrainerJobs/${jobId}`,
            undefined,
            req as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
    },
    audio: {
      batch: {
        get: async (
          accountId: string,
          batchId: string,
          signal?: AbortSignal
        ): Promise<FireworksAudioBatchJob> => {
          return await makeModelsRequest<FireworksAudioBatchJob>(
            "GET",
            `/v1/accounts/${accountId}/batch_job/${batchId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
    },
  };

  // PATCH namespace - methods that use HTTP PATCH
  const patchV1 = {
    accounts: {
      users: {
        update: Object.assign(
          async (
            accountId: string,
            userId: string,
            req: FireworksUpdateUserRequest,
            signal?: AbortSignal
          ): Promise<FireworksUser> => {
            return await makeModelsRequest<FireworksUser>(
              "PATCH",
              `/v1/accounts/${accountId}/users/${userId}`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: updateUserSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, updateUserSchema);
            },
            async post(
              accountId: string,
              userId: string,
              req: FireworksUpdateUserRequest,
              signal?: AbortSignal
            ): Promise<FireworksUser> {
              return await makeModelsRequest<FireworksUser>(
                "PATCH",
                `/v1/accounts/${accountId}/users/${userId}`,
                req,
                undefined,
                signal
              );
            },
          }
        ),
      },
      models: {
        update: Object.assign(
          async (
            accountId: string,
            modelId: string,
            req: FireworksUpdateModelRequest,
            signal?: AbortSignal
          ): Promise<FireworksModel> => {
            return await makeModelsRequest<FireworksModel>(
              "PATCH",
              `/v1/accounts/${accountId}/models/${modelId}`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: modelsUpdateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsUpdateSchema);
            },
            async post(
              accountId: string,
              modelId: string,
              req: FireworksUpdateModelRequest,
              signal?: AbortSignal
            ): Promise<FireworksModel> {
              return await makeModelsRequest<FireworksModel>(
                "PATCH",
                `/v1/accounts/${accountId}/models/${modelId}`,
                req,
                undefined,
                signal
              );
            },
          }
        ),
      },
      datasets: {
        update: Object.assign(
          async (
            accountId: string,
            datasetId: string,
            req: FireworksUpdateDatasetRequest,
            signal?: AbortSignal
          ): Promise<FireworksDataset> => {
            return await makeModelsRequest<FireworksDataset>(
              "PATCH",
              `/v1/accounts/${accountId}/datasets/${datasetId}`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: datasetsUpdateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, datasetsUpdateSchema);
            },
          }
        ),
      },
      deployments: {
        update: Object.assign(
          async (
            accountId: string,
            deploymentId: string,
            req: FireworksUpdateDeploymentRequest,
            signal?: AbortSignal
          ): Promise<FireworksDeployment> => {
            return await makeModelsRequest<FireworksDeployment>(
              "PATCH",
              `/v1/accounts/${accountId}/deployments/${deploymentId}`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: updateDeploymentSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, updateDeploymentSchema);
            },
            async post(
              accountId: string,
              deploymentId: string,
              req: FireworksUpdateDeploymentRequest,
              signal?: AbortSignal
            ): Promise<FireworksDeployment> {
              return await makeModelsRequest<FireworksDeployment>(
                "PATCH",
                `/v1/accounts/${accountId}/deployments/${deploymentId}`,
                req,
                undefined,
                signal
              );
            },
          }
        ),
        scale: Object.assign(
          async (
            accountId: string,
            deploymentId: string,
            req: FireworksScaleDeploymentRequest,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> => {
            return await makeModelsRequest<Record<string, unknown>>(
              "PATCH",
              `/v1/accounts/${accountId}/deployments/${deploymentId}:scale`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: scaleDeploymentSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, scaleDeploymentSchema);
            },
          }
        ),
      },
      deployedModels: {
        update: Object.assign(
          async (
            accountId: string,
            deployedModelId: string,
            req: FireworksUpdateDeployedModelRequest,
            signal?: AbortSignal
          ): Promise<FireworksDeployedModel> => {
            return await makeModelsRequest<FireworksDeployedModel>(
              "PATCH",
              `/v1/accounts/${accountId}/deployedModels/${deployedModelId}`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: updateDeployedModelSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, updateDeployedModelSchema);
            },
          }
        ),
      },
      secrets: {
        update: Object.assign(
          async (
            accountId: string,
            secretId: string,
            req: FireworksUpdateSecretRequest,
            signal?: AbortSignal
          ): Promise<FireworksSecret> => {
            return await makeModelsRequest<FireworksSecret>(
              "PATCH",
              `/v1/accounts/${accountId}/secrets/${secretId}`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: updateSecretSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, updateSecretSchema);
            },
          }
        ),
      },
      evaluators: {
        update: Object.assign(
          async (
            accountId: string,
            evaluatorId: string,
            req: FireworksUpdateEvaluatorRequest,
            options?: FireworksUpdateEvaluatorOptions,
            signal?: AbortSignal
          ): Promise<FireworksEvaluator> => {
            return await makeModelsRequest<FireworksEvaluator>(
              "PATCH",
              `/v1/accounts/${accountId}/evaluators/${evaluatorId}`,
              req,
              options as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          {
            payloadSchema: updateEvaluatorSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, updateEvaluatorSchema);
            },
          }
        ),
      },
    },
  };

  // DELETE namespace - methods that use HTTP DELETE
  const deleteV1 = {
    accounts: {
      apiKeys: {
        delete: Object.assign(
          async (
            accountId: string,
            userId: string,
            req: FireworksDeleteApiKeyRequest,
            signal?: AbortSignal
          ): Promise<Record<string, never>> => {
            return await makeModelsRequest<Record<string, never>>(
              "POST",
              `/v1/accounts/${accountId}/users/${userId}/apiKeys:delete`,
              req,
              undefined,
              signal
            );
          },
          {
            payloadSchema: deleteApiKeySchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, deleteApiKeySchema);
            },
          }
        ),
      },
      secrets: {
        delete: async (
          accountId: string,
          secretId: string,
          signal?: AbortSignal
        ): Promise<Record<string, never>> => {
          return await makeModelsRequest<Record<string, never>>(
            "DELETE",
            `/v1/accounts/${accountId}/secrets/${secretId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      models: {
        delete: Object.assign(
          async (
            accountId: string,
            modelId: string,
            signal?: AbortSignal
          ): Promise<Record<string, never>> => {
            return await makeModelsRequest<Record<string, never>>(
              "DELETE",
              `/v1/accounts/${accountId}/models/${modelId}`,
              undefined,
              undefined,
              signal
            );
          },
          {
            payloadSchema: modelsDeleteSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, modelsDeleteSchema);
            },
          }
        ),
      },
      datasets: {
        delete: async (
          accountId: string,
          datasetId: string,
          signal?: AbortSignal
        ): Promise<Record<string, unknown>> => {
          return await makeModelsRequest<Record<string, unknown>>(
            "DELETE",
            `/v1/accounts/${accountId}/datasets/${datasetId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      batchInferenceJobs: {
        delete: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<Record<string, never>> => {
          return await makeModelsRequest<Record<string, never>>(
            "DELETE",
            `/v1/accounts/${accountId}/batchInferenceJobs/${jobId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      supervisedFineTuningJobs: {
        delete: Object.assign(
          async (
            req: FireworksSFTDeleteRequest,
            signal?: AbortSignal
          ): Promise<Record<string, never>> => {
            return await makeModelsRequest<Record<string, never>>(
              "DELETE",
              `/v1/accounts/${req.accountId}/supervisedFineTuningJobs/${req.jobId}`,
              undefined,
              undefined,
              signal
            );
          },
          {
            payloadSchema: undefined as unknown as PayloadSchema,
            validatePayload(): ValidationResult {
              return { valid: true, errors: [] };
            },
          }
        ),
      },
      deployments: {
        delete: async (
          accountId: string,
          deploymentId: string,
          options?: FireworksDeleteDeploymentOptions,
          signal?: AbortSignal
        ): Promise<Record<string, unknown>> => {
          return await makeModelsRequest<Record<string, unknown>>(
            "DELETE",
            `/v1/accounts/${accountId}/deployments/${deploymentId}`,
            undefined,
            options as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
      },
      deployedModels: {
        delete: async (
          accountId: string,
          deployedModelId: string,
          signal?: AbortSignal
        ): Promise<Record<string, unknown>> => {
          return await makeModelsRequest<Record<string, unknown>>(
            "DELETE",
            `/v1/accounts/${accountId}/deployedModels/${deployedModelId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      dpoJobs: {
        delete: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<Record<string, never>> => {
          return await makeModelsRequest<Record<string, never>>(
            "DELETE",
            `/v1/accounts/${accountId}/dpoJobs/${jobId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      evaluators: {
        delete: async (
          accountId: string,
          evaluatorId: string,
          signal?: AbortSignal
        ): Promise<Record<string, unknown>> => {
          return await makeModelsRequest<Record<string, unknown>>(
            "DELETE",
            `/v1/accounts/${accountId}/evaluators/${evaluatorId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      evaluationJobs: {
        delete: async (
          accountId: string,
          evaluationJobId: string,
          signal?: AbortSignal
        ): Promise<Record<string, unknown>> => {
          return await makeModelsRequest<Record<string, unknown>>(
            "DELETE",
            `/v1/accounts/${accountId}/evaluationJobs/${evaluationJobId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      reinforcementFineTuningJobs: {
        delete: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<Record<string, never>> => {
          return await makeModelsRequest<Record<string, never>>(
            "DELETE",
            `/v1/accounts/${accountId}/reinforcementFineTuningJobs/${jobId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
      rlorTrainerJobs: {
        delete: async (
          accountId: string,
          jobId: string,
          signal?: AbortSignal
        ): Promise<Record<string, never>> => {
          return await makeModelsRequest<Record<string, never>>(
            "DELETE",
            `/v1/accounts/${accountId}/rlorTrainerJobs/${jobId}`,
            undefined,
            undefined,
            signal
          );
        },
      },
    },
  };

  // WS (WebSocket) namespace - WebSocket streaming methods
  const wsV1 = {
    audio: {
      transcriptions: {
        streaming: Object.assign(
          (
            streamOpts?: FireworksStreamingTranscriptionOptions
          ): FireworksStreamingTranscriptionSession => {
            const wsBase = streamOpts?.baseURL ?? audioStreamingBaseURL;
            const params = new URLSearchParams();
            params.set("Authorization", opts.apiKey);
            if (streamOpts?.language)
              params.set("language", streamOpts.language);
            if (streamOpts?.prompt) params.set("prompt", streamOpts.prompt);
            if (streamOpts?.temperature !== undefined)
              params.set("temperature", String(streamOpts.temperature));
            if (streamOpts?.response_format)
              params.set("response_format", streamOpts.response_format);
            if (streamOpts?.timestamp_granularities)
              params.set(
                "timestamp_granularities",
                streamOpts.timestamp_granularities.join(",")
              );

            const qs = params.toString();
            const url = `${wsBase}/v1/audio/transcriptions/streaming?${qs}`;

            const ws = new WS(url);

            type Queued =
              | {
                  type: "message";
                  value: FireworksStreamingTranscriptionMessage;
                }
              | { type: "error"; error: Error }
              | { type: "close" };

            const queue: Queued[] = [];
            let resolve:
              | ((
                  v: IteratorResult<FireworksStreamingTranscriptionMessage>
                ) => void)
              | null = null;
            let done = false;

            function enqueue(item: Queued): void {
              if (resolve) {
                const r = resolve;
                resolve = null;
                if (item.type === "message") {
                  r({ value: item.value, done: false });
                } else if (item.type === "error") {
                  r({ value: undefined as never, done: true });
                } else {
                  r({ value: undefined as never, done: true });
                }
              } else {
                queue.push(item);
              }
            }

            ws.addEventListener("message", (event) => {
              try {
                const data =
                  typeof event.data === "string"
                    ? event.data
                    : String(event.data);
                const msg = JSON.parse(
                  data
                ) as FireworksStreamingTranscriptionMessage;
                enqueue({ type: "message", value: msg });
              } catch {
                // ignore unparseable messages
              }
            });

            ws.addEventListener("error", () => {
              done = true;
              enqueue({
                type: "error",
                error: new FireworksError("WebSocket connection error", 500),
              });
            });

            ws.addEventListener("close", () => {
              done = true;
              enqueue({ type: "close" });
            });

            const session: FireworksStreamingTranscriptionSession = {
              send(audio: ArrayBuffer | Uint8Array): void {
                ws.send(audio);
              },

              clearState(resetId?: string): void {
                const id = resetId ?? crypto.randomUUID();
                ws.send(
                  JSON.stringify({
                    event_id: crypto.randomUUID(),
                    object: "stt.state.clear",
                    reset_id: id,
                  })
                );
              },

              trace(traceId: string): void {
                ws.send(
                  JSON.stringify({
                    event_id: crypto.randomUUID(),
                    object: "stt.input.trace",
                    trace_id: traceId,
                  })
                );
              },

              close(): void {
                ws.send(
                  JSON.stringify({
                    checkpoint_id: "final",
                  })
                );
              },

              [Symbol.asyncIterator](): AsyncIterator<FireworksStreamingTranscriptionMessage> {
                return {
                  next(): Promise<
                    IteratorResult<FireworksStreamingTranscriptionMessage>
                  > {
                    const item = queue.shift();
                    if (item) {
                      if (item.type === "message") {
                        return Promise.resolve({
                          value: item.value,
                          done: false,
                        });
                      }
                      return Promise.resolve({
                        value: undefined as never,
                        done: true,
                      });
                    }
                    if (done) {
                      return Promise.resolve({
                        value: undefined as never,
                        done: true,
                      });
                    }
                    return new Promise((r) => {
                      resolve = r;
                    });
                  },
                };
              },
            };

            return session;
          },
          {
            payloadSchema: audioStreamingTranscriptionsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, audioStreamingTranscriptionsSchema);
            },
          }
        ),
      },
    },
  };

  // ============================================================
  // Original v1 namespace for backward compatibility
  // ============================================================

  return {
    v1: {
      chat: {
        completions: postV1.chat.completions,
      },
      completions: postV1.completions,
      embeddings: postV1.embeddings,
      rerank: postV1.rerank,
      messages: postV1.messages,
      workflows: postV1.workflows,
      audio: {
        transcriptions: Object.assign(postV1.audio.transcriptions, {
          streaming: wsV1.audio.transcriptions.streaming,
        }),
        translations: postV1.audio.translations,
        batch: {
          transcriptions: postV1.audio.batch.transcriptions,
          translations: postV1.audio.batch.translations,
          get: getV1.audio.batch.get,
        },
      },
      accounts: {
        list: getV1.accounts.list,
        get: getV1.accounts.get,
        users: {
          list: getV1.accounts.users.list,
          create: postV1.accounts.users.create,
          get: getV1.accounts.users.get,
          update: Object.assign(patchV1.accounts.users.update, {
            post: patchV1.accounts.users.update,
          }),
          post: postV1.accounts.users.create,
        },
        apiKeys: {
          list: getV1.accounts.apiKeys.list,
          create: postV1.accounts.apiKeys.create,
          delete: deleteV1.accounts.apiKeys.delete,
        },
        secrets: {
          list: getV1.accounts.secrets.list,
          create: postV1.accounts.secrets.create,
          get: getV1.accounts.secrets.get,
          update: patchV1.accounts.secrets.update,
          delete: deleteV1.accounts.secrets.delete,
        },
        models: {
          list: getV1.accounts.models.list,
          create: postV1.accounts.models.create,
          get: getV1.accounts.models.get,
          update: Object.assign(patchV1.accounts.models.update, {
            post: patchV1.accounts.models.update,
          }),
          delete: deleteV1.accounts.models.delete,
          prepare: postV1.accounts.models.prepare,
          getUploadEndpoint: postV1.accounts.models.getUploadEndpoint,
          getDownloadEndpoint: getV1.accounts.models.getDownloadEndpoint,
          validateUpload: getV1.accounts.models.validateUpload,
          post: postV1.accounts.models.create,
        },
        datasets: {
          list: getV1.accounts.datasets.list,
          create: postV1.accounts.datasets.create,
          get: getV1.accounts.datasets.get,
          update: patchV1.accounts.datasets.update,
          delete: deleteV1.accounts.datasets.delete,
          getUploadEndpoint: postV1.accounts.datasets.getUploadEndpoint,
          getDownloadEndpoint: getV1.accounts.datasets.getDownloadEndpoint,
          validateUpload: postV1.accounts.datasets.validateUpload,
        },
        batchInferenceJobs: {
          create: postV1.accounts.batchInferenceJobs.create,
          get: getV1.accounts.batchInferenceJobs.get,
          list: getV1.accounts.batchInferenceJobs.list,
          delete: deleteV1.accounts.batchInferenceJobs.delete,
        },
        supervisedFineTuningJobs: {
          create: postV1.accounts.supervisedFineTuningJobs.create,
          list: getV1.accounts.supervisedFineTuningJobs.list,
          get: getV1.accounts.supervisedFineTuningJobs.get,
          delete: deleteV1.accounts.supervisedFineTuningJobs.delete,
          resume: postV1.accounts.supervisedFineTuningJobs.resume,
        },
        deployments: {
          list: getV1.accounts.deployments.list,
          create: Object.assign(postV1.accounts.deployments.create, {
            post: postV1.accounts.deployments.create,
          }),
          get: getV1.accounts.deployments.get,
          update: Object.assign(patchV1.accounts.deployments.update, {
            post: patchV1.accounts.deployments.update,
          }),
          delete: deleteV1.accounts.deployments.delete,
          scale: patchV1.accounts.deployments.scale,
          undelete: postV1.accounts.deployments.undelete,
          post: postV1.accounts.deployments.create,
        },
        deployedModels: {
          list: getV1.accounts.deployedModels.list,
          create: postV1.accounts.deployedModels.create,
          get: getV1.accounts.deployedModels.get,
          update: patchV1.accounts.deployedModels.update,
          delete: deleteV1.accounts.deployedModels.delete,
        },
        deploymentShapes: {
          get: getV1.accounts.deploymentShapes.get,
          versions: {
            list: getV1.accounts.deploymentShapes.versions.list,
            get: getV1.accounts.deploymentShapes.versions.get,
          },
        },
        dpoJobs: {
          create: postV1.accounts.dpoJobs.create,
          get: getV1.accounts.dpoJobs.get,
          list: getV1.accounts.dpoJobs.list,
          delete: deleteV1.accounts.dpoJobs.delete,
          resume: postV1.accounts.dpoJobs.resume,
          getMetricsFileEndpoint:
            postV1.accounts.dpoJobs.getMetricsFileEndpoint,
        },
        evaluators: {
          create: postV1.accounts.evaluators.create,
          list: getV1.accounts.evaluators.list,
          get: getV1.accounts.evaluators.get,
          update: patchV1.accounts.evaluators.update,
          delete: deleteV1.accounts.evaluators.delete,
          getUploadEndpoint: postV1.accounts.evaluators.getUploadEndpoint,
          validateUpload: postV1.accounts.evaluators.validateUpload,
          getBuildLogEndpoint: getV1.accounts.evaluators.getBuildLogEndpoint,
          getSourceCodeSignedUrl:
            getV1.accounts.evaluators.getSourceCodeSignedUrl,
        },
        evaluationJobs: {
          create: postV1.accounts.evaluationJobs.create,
          list: getV1.accounts.evaluationJobs.list,
          get: getV1.accounts.evaluationJobs.get,
          delete: deleteV1.accounts.evaluationJobs.delete,
          getExecutionLogEndpoint:
            postV1.accounts.evaluationJobs.getExecutionLogEndpoint,
        },
        reinforcementFineTuningJobs: {
          create: postV1.accounts.reinforcementFineTuningJobs.create,
          list: getV1.accounts.reinforcementFineTuningJobs.list,
          get: getV1.accounts.reinforcementFineTuningJobs.get,
          delete: deleteV1.accounts.reinforcementFineTuningJobs.delete,
          resume: postV1.accounts.reinforcementFineTuningJobs.resume,
        },
        rlorTrainerJobs: {
          create: postV1.accounts.rlorTrainerJobs.create,
          list: getV1.accounts.rlorTrainerJobs.list,
          get: getV1.accounts.rlorTrainerJobs.get,
          delete: deleteV1.accounts.rlorTrainerJobs.delete,
          executeTrainStep: postV1.accounts.rlorTrainerJobs.executeTrainStep,
          resume: postV1.accounts.rlorTrainerJobs.resume,
        },
      },
    },
    post: {
      v1: postV1,
    },
    get: {
      v1: getV1,
    },
    patch: {
      v1: patchV1,
    },
    delete: {
      v1: deleteV1,
    },
    ws: {
      v1: wsV1,
    },
  };
}
