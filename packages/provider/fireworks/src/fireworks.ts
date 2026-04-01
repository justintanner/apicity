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
import type { ValidationResult } from "./types";
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

  return {
    v1: {
      chat: {
        completions: Object.assign(
          async function completions(
            req: FireworksChatRequest,
            signal?: AbortSignal
          ): Promise<FireworksChatResponse> {
            return await makeRequest<FireworksChatResponse>(
              "/chat/completions",
              req,
              signal
            );
          },
          {
            stream: Object.assign(
              function chatCompletionsStream(
                req: FireworksChatRequest,
                signal?: AbortSignal
              ): AsyncIterable<FireworksChatStreamChunk> {
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
        async function completions(
          req: FireworksCompletionRequest,
          signal?: AbortSignal
        ): Promise<FireworksCompletionResponse> {
          return await makeRequest<FireworksCompletionResponse>(
            "/completions",
            req,
            signal
          );
        },
        {
          stream: Object.assign(
            function completionsStream(
              req: FireworksCompletionRequest,
              signal?: AbortSignal
            ): AsyncIterable<FireworksCompletionStreamChunk> {
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
        async function embeddings(
          req: FireworksEmbeddingRequest,
          signal?: AbortSignal
        ): Promise<FireworksEmbeddingResponse> {
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
        async function rerank(
          req: FireworksRerankRequest,
          signal?: AbortSignal
        ): Promise<FireworksRerankResponse> {
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
          async function textToImage(
            model: string,
            req: FireworksTextToImageRequest,
            signal?: AbortSignal
          ): Promise<FireworksTextToImageResponse> {
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
          async function kontext(
            model: string,
            req: FireworksKontextRequest,
            signal?: AbortSignal
          ): Promise<FireworksKontextResponse> {
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
          async function getResult(
            model: string,
            req: FireworksGetResultRequest,
            signal?: AbortSignal
          ): Promise<FireworksGetResultResponse> {
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
          async function transcriptions(
            req: FireworksTranscriptionRequest,
            signal?: AbortSignal
          ): Promise<FireworksTranscriptionResponse> {
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

            return await makeAudioRequest<FireworksTranscriptionResponse>(
              "/audio/transcriptions",
              form,
              req.model,
              signal
            );
          },
          {
            streaming: Object.assign(
              function streaming(
                streamOpts?: FireworksStreamingTranscriptionOptions
              ): FireworksStreamingTranscriptionSession {
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
                    error: new FireworksError(
                      "WebSocket connection error",
                      500
                    ),
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
                  return validatePayload(
                    data,
                    audioStreamingTranscriptionsSchema
                  );
                },
              }
            ),
            payloadSchema: audioTranscriptionsSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, audioTranscriptionsSchema);
            },
          }
        ),
        translations: Object.assign(
          async function translations(
            req: FireworksTranslationRequest,
            signal?: AbortSignal
          ): Promise<FireworksTranslationResponse> {
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
            async function batchTranscriptions(
              req: FireworksAudioBatchTranscriptionRequest,
              signal?: AbortSignal
            ): Promise<FireworksAudioBatchSubmitResponse> {
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
              if (req.diarize !== undefined)
                form.append("diarize", req.diarize);
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
            async function batchTranslations(
              req: FireworksAudioBatchTranslationRequest,
              signal?: AbortSignal
            ): Promise<FireworksAudioBatchSubmitResponse> {
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
          async get(
            accountId: string,
            batchId: string,
            signal?: AbortSignal
          ): Promise<FireworksAudioBatchJob> {
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
      accounts: {
        async list(
          params?: FireworksListAccountsRequest,
          signal?: AbortSignal
        ): Promise<FireworksListAccountsResponse> {
          return await makeModelsRequest<FireworksListAccountsResponse>(
            "GET",
            "/v1/accounts",
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        async get(
          accountId: string,
          params?: FireworksGetAccountRequest,
          signal?: AbortSignal
        ): Promise<FireworksAccount> {
          return await makeModelsRequest<FireworksAccount>(
            "GET",
            `/v1/accounts/${accountId}`,
            undefined,
            params as Record<string, string | number | boolean | undefined>,
            signal
          );
        },
        users: {
          async list(
            accountId: string,
            params?: FireworksListUsersRequest,
            signal?: AbortSignal
          ): Promise<FireworksListUsersResponse> {
            return await makeModelsRequest<FireworksListUsersResponse>(
              "GET",
              `/v1/accounts/${accountId}/users`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          create: Object.assign(
            async function create(
              accountId: string,
              req: FireworksCreateUserRequest,
              options?: FireworksCreateUserOptions,
              signal?: AbortSignal
            ): Promise<FireworksUser> {
              return await makeModelsRequest<FireworksUser>(
                "POST",
                `/v1/accounts/${accountId}/users`,
                req,
                options as Record<
                  string,
                  string | number | boolean | undefined
                >,
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
          async get(
            accountId: string,
            userId: string,
            params?: FireworksGetUserRequest,
            signal?: AbortSignal
          ): Promise<FireworksUser> {
            return await makeModelsRequest<FireworksUser>(
              "GET",
              `/v1/accounts/${accountId}/users/${userId}`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          update: Object.assign(
            async function update(
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
            {
              payloadSchema: updateUserSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, updateUserSchema);
              },
              // Verb accessor for POST on /accounts/:id/users/:uid
              post: async function update(
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
          // Verb accessor for POST on /accounts/:id/users
          post: async function create(
            accountId: string,
            req: FireworksCreateUserRequest,
            options?: FireworksCreateUserOptions,
            signal?: AbortSignal
          ): Promise<FireworksUser> {
            return await makeModelsRequest<FireworksUser>(
              "POST",
              `/v1/accounts/${accountId}/users`,
              req,
              options as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
        },
        apiKeys: {
          async list(
            accountId: string,
            userId: string,
            params?: FireworksListApiKeysRequest,
            signal?: AbortSignal
          ): Promise<FireworksListApiKeysResponse> {
            return await makeModelsRequest<FireworksListApiKeysResponse>(
              "GET",
              `/v1/accounts/${accountId}/users/${userId}/apiKeys`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          create: Object.assign(
            async function create(
              accountId: string,
              userId: string,
              req: FireworksCreateApiKeyRequest,
              signal?: AbortSignal
            ): Promise<FireworksApiKey> {
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
          delete: Object.assign(
            async function deleteFn(
              accountId: string,
              userId: string,
              req: FireworksDeleteApiKeyRequest,
              signal?: AbortSignal
            ): Promise<Record<string, never>> {
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
          async list(
            accountId: string,
            params?: FireworksListSecretsRequest,
            signal?: AbortSignal
          ): Promise<FireworksListSecretsResponse> {
            return await makeModelsRequest<FireworksListSecretsResponse>(
              "GET",
              `/v1/accounts/${accountId}/secrets`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          create: Object.assign(
            async function create(
              accountId: string,
              req: FireworksCreateSecretRequest,
              signal?: AbortSignal
            ): Promise<FireworksSecret> {
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
          async get(
            accountId: string,
            secretId: string,
            params?: { readMask?: string },
            signal?: AbortSignal
          ): Promise<FireworksSecret> {
            return await makeModelsRequest<FireworksSecret>(
              "GET",
              `/v1/accounts/${accountId}/secrets/${secretId}`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          update: Object.assign(
            async function update(
              accountId: string,
              secretId: string,
              req: FireworksUpdateSecretRequest,
              signal?: AbortSignal
            ): Promise<FireworksSecret> {
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
          async delete(
            accountId: string,
            secretId: string,
            signal?: AbortSignal
          ): Promise<Record<string, never>> {
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
          list: Object.assign(
            async function list(
              accountId: string,
              req?: FireworksListModelsRequest,
              signal?: AbortSignal
            ): Promise<FireworksListModelsResponse> {
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
          create: Object.assign(
            async function create(
              accountId: string,
              req: FireworksCreateModelRequest,
              signal?: AbortSignal
            ): Promise<FireworksModel> {
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
          get: Object.assign(
            async function get(
              accountId: string,
              modelId: string,
              req?: FireworksGetModelRequest,
              signal?: AbortSignal
            ): Promise<FireworksModel> {
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
          update: Object.assign(
            async function update(
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
            {
              payloadSchema: modelsUpdateSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, modelsUpdateSchema);
              },
              // Verb accessor for POST on /accounts/:id/models/:mid
              post: async function update(
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
          delete: Object.assign(
            async function deleteFn(
              accountId: string,
              modelId: string,
              signal?: AbortSignal
            ): Promise<Record<string, never>> {
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
          prepare: Object.assign(
            async function prepare(
              accountId: string,
              modelId: string,
              req: FireworksPrepareModelRequest,
              signal?: AbortSignal
            ): Promise<Record<string, never>> {
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
            async function getUploadEndpoint(
              accountId: string,
              modelId: string,
              req: FireworksGetUploadEndpointRequest,
              signal?: AbortSignal
            ): Promise<FireworksGetUploadEndpointResponse> {
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
          getDownloadEndpoint: Object.assign(
            async function getDownloadEndpoint(
              accountId: string,
              modelId: string,
              req?: FireworksGetDownloadEndpointRequest,
              signal?: AbortSignal
            ): Promise<FireworksGetDownloadEndpointResponse> {
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
            async function validateUpload(
              accountId: string,
              modelId: string,
              req?: FireworksValidateUploadRequest,
              signal?: AbortSignal
            ): Promise<FireworksValidateUploadResponse> {
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
          // Verb accessor for POST on /accounts/:id/models
          post: async function create(
            accountId: string,
            req: FireworksCreateModelRequest,
            signal?: AbortSignal
          ): Promise<FireworksModel> {
            return await makeModelsRequest<FireworksModel>(
              "POST",
              `/v1/accounts/${accountId}/models`,
              req,
              undefined,
              signal
            );
          },
        },
        datasets: {
          async list(
            accountId: string,
            params?: FireworksListDatasetsRequest,
            signal?: AbortSignal
          ): Promise<FireworksListDatasetsResponse> {
            return await makeModelsRequest<FireworksListDatasetsResponse>(
              "GET",
              `/v1/accounts/${accountId}/datasets`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          create: Object.assign(
            async function create(
              accountId: string,
              req: FireworksCreateDatasetRequest,
              signal?: AbortSignal
            ): Promise<FireworksDataset> {
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
          async get(
            accountId: string,
            datasetId: string,
            req?: FireworksGetDatasetRequest,
            signal?: AbortSignal
          ): Promise<FireworksDataset> {
            return await makeModelsRequest<FireworksDataset>(
              "GET",
              `/v1/accounts/${accountId}/datasets/${datasetId}`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          update: Object.assign(
            async function update(
              accountId: string,
              datasetId: string,
              req: FireworksUpdateDatasetRequest,
              signal?: AbortSignal
            ): Promise<FireworksDataset> {
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
          async delete(
            accountId: string,
            datasetId: string,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> {
            return await makeModelsRequest<Record<string, unknown>>(
              "DELETE",
              `/v1/accounts/${accountId}/datasets/${datasetId}`,
              undefined,
              undefined,
              signal
            );
          },
          getUploadEndpoint: Object.assign(
            async function getUploadEndpoint(
              accountId: string,
              datasetId: string,
              req: FireworksDatasetGetUploadEndpointRequest,
              signal?: AbortSignal
            ): Promise<FireworksDatasetGetUploadEndpointResponse> {
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
          getDownloadEndpoint: Object.assign(
            async function getDownloadEndpoint(
              accountId: string,
              datasetId: string,
              req?: FireworksDatasetGetDownloadEndpointRequest,
              signal?: AbortSignal
            ): Promise<FireworksDatasetGetDownloadEndpointResponse> {
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
          validateUpload: Object.assign(
            async function validateUpload(
              accountId: string,
              datasetId: string,
              req?: FireworksDatasetValidateUploadRequest,
              signal?: AbortSignal
            ): Promise<Record<string, unknown>> {
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
            async function create(
              accountId: string,
              req: FireworksBatchJobCreateRequest,
              signal?: AbortSignal
            ): Promise<FireworksBatchJob> {
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
          async get(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<FireworksBatchJob> {
            return await makeModelsRequest<FireworksBatchJob>(
              "GET",
              `/v1/accounts/${accountId}/batchInferenceJobs/${jobId}`,
              undefined,
              undefined,
              signal
            );
          },
          async list(
            accountId: string,
            req?: FireworksBatchJobListRequest,
            signal?: AbortSignal
          ): Promise<FireworksBatchJobListResponse> {
            return await makeModelsRequest<FireworksBatchJobListResponse>(
              "GET",
              `/v1/accounts/${accountId}/batchInferenceJobs`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async delete(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<Record<string, never>> {
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
          create: Object.assign(
            async function create(
              req: FireworksSFTCreateRequest,
              signal?: AbortSignal
            ): Promise<FireworksSFTJob> {
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
          async list(
            req: FireworksSFTListRequest,
            signal?: AbortSignal
          ): Promise<FireworksSFTListResponse> {
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
          async get(
            req: FireworksSFTGetRequest,
            signal?: AbortSignal
          ): Promise<FireworksSFTJob> {
            return await makeModelsRequest<FireworksSFTJob>(
              "GET",
              `/v1/accounts/${req.accountId}/supervisedFineTuningJobs/${req.jobId}`,
              undefined,
              undefined,
              signal
            );
          },
          async delete(
            req: FireworksSFTDeleteRequest,
            signal?: AbortSignal
          ): Promise<Record<string, never>> {
            return await makeModelsRequest<Record<string, never>>(
              "DELETE",
              `/v1/accounts/${req.accountId}/supervisedFineTuningJobs/${req.jobId}`,
              undefined,
              undefined,
              signal
            );
          },
          async resume(
            req: FireworksSFTResumeRequest,
            signal?: AbortSignal
          ): Promise<FireworksSFTJob> {
            return await makeModelsRequest<FireworksSFTJob>(
              "POST",
              `/v1/accounts/${req.accountId}/supervisedFineTuningJobs/${req.jobId}:resume`,
              {},
              undefined,
              signal
            );
          },
        },
        deployments: {
          async list(
            accountId: string,
            params?: FireworksListDeploymentsRequest,
            signal?: AbortSignal
          ): Promise<FireworksListDeploymentsResponse> {
            return await makeModelsRequest<FireworksListDeploymentsResponse>(
              "GET",
              `/v1/accounts/${accountId}/deployments`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          create: Object.assign(
            async function create(
              accountId: string,
              req: FireworksCreateDeploymentRequest,
              options?: FireworksCreateDeploymentOptions,
              signal?: AbortSignal
            ): Promise<FireworksDeployment> {
              return await makeModelsRequest<FireworksDeployment>(
                "POST",
                `/v1/accounts/${accountId}/deployments`,
                req,
                options as Record<
                  string,
                  string | number | boolean | undefined
                >,
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
          async get(
            accountId: string,
            deploymentId: string,
            signal?: AbortSignal
          ): Promise<FireworksDeployment> {
            return await makeModelsRequest<FireworksDeployment>(
              "GET",
              `/v1/accounts/${accountId}/deployments/${deploymentId}`,
              undefined,
              undefined,
              signal
            );
          },
          update: Object.assign(
            async function update(
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
            {
              payloadSchema: updateDeploymentSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, updateDeploymentSchema);
              },
              // Verb accessor for POST on /accounts/:id/deployments/:did
              post: async function update(
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
          async delete(
            accountId: string,
            deploymentId: string,
            options?: FireworksDeleteDeploymentOptions,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> {
            return await makeModelsRequest<Record<string, unknown>>(
              "DELETE",
              `/v1/accounts/${accountId}/deployments/${deploymentId}`,
              undefined,
              options as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          scale: Object.assign(
            async function scale(
              accountId: string,
              deploymentId: string,
              req: FireworksScaleDeploymentRequest,
              signal?: AbortSignal
            ): Promise<Record<string, unknown>> {
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
          async undelete(
            accountId: string,
            deploymentId: string,
            signal?: AbortSignal
          ): Promise<FireworksDeployment> {
            return await makeModelsRequest<FireworksDeployment>(
              "POST",
              `/v1/accounts/${accountId}/deployments/${deploymentId}:undelete`,
              {},
              undefined,
              signal
            );
          },
          // Verb accessor for POST on /accounts/:id/deployments
          post: async function create(
            accountId: string,
            req: FireworksCreateDeploymentRequest,
            options?: FireworksCreateDeploymentOptions,
            signal?: AbortSignal
          ): Promise<FireworksDeployment> {
            return await makeModelsRequest<FireworksDeployment>(
              "POST",
              `/v1/accounts/${accountId}/deployments`,
              req,
              options as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
        },
        deployedModels: {
          async list(
            accountId: string,
            params?: FireworksListDeployedModelsRequest,
            signal?: AbortSignal
          ): Promise<FireworksListDeployedModelsResponse> {
            return await makeModelsRequest<FireworksListDeployedModelsResponse>(
              "GET",
              `/v1/accounts/${accountId}/deployedModels`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          create: Object.assign(
            async function create(
              accountId: string,
              req: FireworksCreateDeployedModelRequest,
              options?: FireworksCreateDeployedModelOptions,
              signal?: AbortSignal
            ): Promise<FireworksDeployedModel> {
              return await makeModelsRequest<FireworksDeployedModel>(
                "POST",
                `/v1/accounts/${accountId}/deployedModels`,
                req,
                options as Record<
                  string,
                  string | number | boolean | undefined
                >,
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
          async get(
            accountId: string,
            deployedModelId: string,
            params?: FireworksGetDeployedModelRequest,
            signal?: AbortSignal
          ): Promise<FireworksDeployedModel> {
            return await makeModelsRequest<FireworksDeployedModel>(
              "GET",
              `/v1/accounts/${accountId}/deployedModels/${deployedModelId}`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          update: Object.assign(
            async function update(
              accountId: string,
              deployedModelId: string,
              req: FireworksUpdateDeployedModelRequest,
              signal?: AbortSignal
            ): Promise<FireworksDeployedModel> {
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
          async delete(
            accountId: string,
            deployedModelId: string,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> {
            return await makeModelsRequest<Record<string, unknown>>(
              "DELETE",
              `/v1/accounts/${accountId}/deployedModels/${deployedModelId}`,
              undefined,
              undefined,
              signal
            );
          },
        },
        deploymentShapes: {
          async get(
            accountId: string,
            shapeId: string,
            params?: FireworksGetDeploymentShapeRequest,
            signal?: AbortSignal
          ): Promise<FireworksDeploymentShape> {
            return await makeModelsRequest<FireworksDeploymentShape>(
              "GET",
              `/v1/accounts/${accountId}/deploymentShapes/${shapeId}`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          versions: {
            async list(
              accountId: string,
              shapeId: string,
              params?: FireworksListDeploymentShapeVersionsRequest,
              signal?: AbortSignal
            ): Promise<FireworksListDeploymentShapeVersionsResponse> {
              return await makeModelsRequest<FireworksListDeploymentShapeVersionsResponse>(
                "GET",
                `/v1/accounts/${accountId}/deploymentShapes/${shapeId}/versions`,
                undefined,
                params as Record<string, string | number | boolean | undefined>,
                signal
              );
            },
            async get(
              accountId: string,
              shapeId: string,
              versionId: string,
              params?: FireworksGetDeploymentShapeVersionRequest,
              signal?: AbortSignal
            ): Promise<FireworksDeploymentShapeVersion> {
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
        dpoJobs: {
          create: Object.assign(
            async function create(
              accountId: string,
              req: FireworksDpoJobCreateRequest,
              signal?: AbortSignal
            ): Promise<FireworksDpoJob> {
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
          async get(
            accountId: string,
            jobId: string,
            req?: FireworksDpoJobGetRequest,
            signal?: AbortSignal
          ): Promise<FireworksDpoJob> {
            return await makeModelsRequest<FireworksDpoJob>(
              "GET",
              `/v1/accounts/${accountId}/dpoJobs/${jobId}`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async list(
            accountId: string,
            req?: FireworksDpoJobListRequest,
            signal?: AbortSignal
          ): Promise<FireworksDpoJobListResponse> {
            return await makeModelsRequest<FireworksDpoJobListResponse>(
              "GET",
              `/v1/accounts/${accountId}/dpoJobs`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async delete(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<Record<string, never>> {
            return await makeModelsRequest<Record<string, never>>(
              "DELETE",
              `/v1/accounts/${accountId}/dpoJobs/${jobId}`,
              undefined,
              undefined,
              signal
            );
          },
          async resume(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<FireworksDpoJob> {
            return await makeModelsRequest<FireworksDpoJob>(
              "POST",
              `/v1/accounts/${accountId}/dpoJobs/${jobId}:resume`,
              {},
              undefined,
              signal
            );
          },
          async getMetricsFileEndpoint(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<FireworksMetricsFileEndpointResponse> {
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
            async function create(
              accountId: string,
              req: FireworksCreateEvaluatorRequest,
              signal?: AbortSignal
            ): Promise<FireworksEvaluator> {
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
          async list(
            accountId: string,
            params?: FireworksListEvaluatorsRequest,
            signal?: AbortSignal
          ): Promise<FireworksListEvaluatorsResponse> {
            return await makeModelsRequest<FireworksListEvaluatorsResponse>(
              "GET",
              `/v1/accounts/${accountId}/evaluators`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async get(
            accountId: string,
            evaluatorId: string,
            params?: FireworksGetEvaluatorRequest,
            signal?: AbortSignal
          ): Promise<FireworksEvaluator> {
            return await makeModelsRequest<FireworksEvaluator>(
              "GET",
              `/v1/accounts/${accountId}/evaluators/${evaluatorId}`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          update: Object.assign(
            async function update(
              accountId: string,
              evaluatorId: string,
              req: FireworksUpdateEvaluatorRequest,
              options?: FireworksUpdateEvaluatorOptions,
              signal?: AbortSignal
            ): Promise<FireworksEvaluator> {
              return await makeModelsRequest<FireworksEvaluator>(
                "PATCH",
                `/v1/accounts/${accountId}/evaluators/${evaluatorId}`,
                req,
                options as Record<
                  string,
                  string | number | boolean | undefined
                >,
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
          async delete(
            accountId: string,
            evaluatorId: string,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> {
            return await makeModelsRequest<Record<string, unknown>>(
              "DELETE",
              `/v1/accounts/${accountId}/evaluators/${evaluatorId}`,
              undefined,
              undefined,
              signal
            );
          },
          getUploadEndpoint: Object.assign(
            async function getUploadEndpoint(
              accountId: string,
              evaluatorId: string,
              req: FireworksGetUploadEndpointEvaluatorRequest,
              signal?: AbortSignal
            ): Promise<FireworksGetUploadEndpointEvaluatorResponse> {
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
          async validateUpload(
            accountId: string,
            evaluatorId: string,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> {
            return await makeModelsRequest<Record<string, unknown>>(
              "POST",
              `/v1/accounts/${accountId}/evaluators/${evaluatorId}:validateUpload`,
              {},
              undefined,
              signal
            );
          },
          async getBuildLogEndpoint(
            accountId: string,
            evaluatorId: string,
            params?: FireworksGetBuildLogEndpointRequest,
            signal?: AbortSignal
          ): Promise<FireworksGetBuildLogEndpointResponse> {
            return await makeModelsRequest<FireworksGetBuildLogEndpointResponse>(
              "GET",
              `/v1/accounts/${accountId}/evaluators/${evaluatorId}:getBuildLogEndpoint`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async getSourceCodeSignedUrl(
            accountId: string,
            evaluatorId: string,
            params?: FireworksGetSourceCodeSignedUrlRequest,
            signal?: AbortSignal
          ): Promise<FireworksGetSourceCodeSignedUrlResponse> {
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
          create: Object.assign(
            async function create(
              accountId: string,
              req: FireworksCreateEvaluationJobRequest,
              signal?: AbortSignal
            ): Promise<FireworksEvaluationJob> {
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
          async list(
            accountId: string,
            params?: FireworksListEvaluationJobsRequest,
            signal?: AbortSignal
          ): Promise<FireworksListEvaluationJobsResponse> {
            return await makeModelsRequest<FireworksListEvaluationJobsResponse>(
              "GET",
              `/v1/accounts/${accountId}/evaluationJobs`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async get(
            accountId: string,
            evaluationJobId: string,
            params?: FireworksGetEvaluationJobRequest,
            signal?: AbortSignal
          ): Promise<FireworksEvaluationJob> {
            return await makeModelsRequest<FireworksEvaluationJob>(
              "GET",
              `/v1/accounts/${accountId}/evaluationJobs/${evaluationJobId}`,
              undefined,
              params as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async delete(
            accountId: string,
            evaluationJobId: string,
            signal?: AbortSignal
          ): Promise<Record<string, unknown>> {
            return await makeModelsRequest<Record<string, unknown>>(
              "DELETE",
              `/v1/accounts/${accountId}/evaluationJobs/${evaluationJobId}`,
              undefined,
              undefined,
              signal
            );
          },
          async getExecutionLogEndpoint(
            accountId: string,
            evaluationJobId: string,
            signal?: AbortSignal
          ): Promise<FireworksGetExecutionLogEndpointResponse> {
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
            async function create(
              accountId: string,
              req: FireworksRFTCreateRequest,
              signal?: AbortSignal
            ): Promise<FireworksRFTJob> {
              const { reinforcementFineTuningJobId, ...body } = req;
              const query: Record<string, string> = {};
              if (reinforcementFineTuningJobId) {
                query.reinforcementFineTuningJobId =
                  reinforcementFineTuningJobId;
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
          async get(
            accountId: string,
            jobId: string,
            req?: FireworksRFTGetRequest,
            signal?: AbortSignal
          ): Promise<FireworksRFTJob> {
            return await makeModelsRequest<FireworksRFTJob>(
              "GET",
              `/v1/accounts/${accountId}/reinforcementFineTuningJobs/${jobId}`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async list(
            accountId: string,
            req?: FireworksRFTListRequest,
            signal?: AbortSignal
          ): Promise<FireworksRFTListResponse> {
            return await makeModelsRequest<FireworksRFTListResponse>(
              "GET",
              `/v1/accounts/${accountId}/reinforcementFineTuningJobs`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async delete(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<Record<string, never>> {
            return await makeModelsRequest<Record<string, never>>(
              "DELETE",
              `/v1/accounts/${accountId}/reinforcementFineTuningJobs/${jobId}`,
              undefined,
              undefined,
              signal
            );
          },
          async resume(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<FireworksRFTJob> {
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
            async function create(
              accountId: string,
              req: FireworksRlorTrainerJobCreateRequest,
              signal?: AbortSignal
            ): Promise<FireworksRlorTrainerJob> {
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
          async get(
            accountId: string,
            jobId: string,
            req?: FireworksRlorTrainerJobGetRequest,
            signal?: AbortSignal
          ): Promise<FireworksRlorTrainerJob> {
            return await makeModelsRequest<FireworksRlorTrainerJob>(
              "GET",
              `/v1/accounts/${accountId}/rlorTrainerJobs/${jobId}`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async list(
            accountId: string,
            req?: FireworksRlorTrainerJobListRequest,
            signal?: AbortSignal
          ): Promise<FireworksRlorTrainerJobListResponse> {
            return await makeModelsRequest<FireworksRlorTrainerJobListResponse>(
              "GET",
              `/v1/accounts/${accountId}/rlorTrainerJobs`,
              undefined,
              req as Record<string, string | number | boolean | undefined>,
              signal
            );
          },
          async delete(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<Record<string, never>> {
            return await makeModelsRequest<Record<string, never>>(
              "DELETE",
              `/v1/accounts/${accountId}/rlorTrainerJobs/${jobId}`,
              undefined,
              undefined,
              signal
            );
          },
          executeTrainStep: Object.assign(
            async function executeTrainStep(
              accountId: string,
              jobId: string,
              req: FireworksRlorTrainerJobExecuteStepRequest,
              signal?: AbortSignal
            ): Promise<Record<string, unknown>> {
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
          async resume(
            accountId: string,
            jobId: string,
            signal?: AbortSignal
          ): Promise<FireworksRlorTrainerJob> {
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
    },
  };
}
