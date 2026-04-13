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
import { sseToIterable } from "./sse";
import {
  FireworksChatRequestSchema,
  FireworksCompletionRequestSchema,
  FireworksEmbeddingRequestSchema,
  FireworksRerankRequestSchema,
  AnthropicMessagesRequestSchema,
  FireworksTextToImageRequestSchema,
  FireworksKontextRequestSchema,
  FireworksGetResultRequestSchema,
  FireworksTranscriptionRequestSchema,
  FireworksTranslationRequestSchema,
  FireworksStreamingTranscriptionOptionsSchema,
  FireworksAudioBatchTranscriptionRequestSchema,
  FireworksAudioBatchTranslationRequestSchema,
  FireworksCreateModelRequestSchema,
  FireworksPrepareModelRequestSchema,
  FireworksGetUploadEndpointRequestSchema,
  FireworksUpdateModelRequestSchema,
  FireworksValidateUploadRequestSchema,
  FireworksBatchJobCreateRequestSchema,
  FireworksSFTCreateRequestSchema,
  FireworksCreateDeploymentRequestSchema,
  FireworksUpdateDeploymentRequestSchema,
  FireworksScaleDeploymentRequestSchema,
  FireworksDpoJobCreateRequestSchema,
  FireworksCreateDeployedModelRequestSchema,
  FireworksUpdateDeployedModelRequestSchema,
  FireworksCreateUserRequestSchema,
  FireworksUpdateUserRequestSchema,
  FireworksCreateApiKeyRequestSchema,
  FireworksDeleteApiKeyRequestSchema,
  FireworksCreateSecretRequestSchema,
  FireworksUpdateSecretRequestSchema,
  FireworksCreateDatasetRequestSchema,
  FireworksUpdateDatasetRequestSchema,
  FireworksDatasetGetUploadEndpointRequestSchema,
  FireworksDatasetValidateUploadRequestSchema,
  FireworksCreateEvaluatorRequestSchema,
  FireworksUpdateEvaluatorRequestSchema,
  FireworksGetUploadEndpointEvaluatorRequestSchema,
  FireworksCreateEvaluationJobRequestSchema,
  FireworksRFTCreateRequestSchema,
  FireworksRlorTrainerJobCreateRequestSchema,
  FireworksRlorTrainerJobExecuteStepRequestSchema,
  FireworksEmptySchema,
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

  // POST https://api.fireworks.ai/inference/v1/messages
  // Docs: https://docs.fireworks.ai/api-reference
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

  // POST https://api.fireworks.ai/inference/v1/messages
  // Docs: https://docs.fireworks.ai/api-reference
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
      attachAbortHandler(signal, controller);
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
      attachAbortHandler(signal, controller);
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
      attachAbortHandler(signal, controller);
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
      attachAbortHandler(signal, controller);
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
      // POST https://api.fireworks.ai/inference/v1/chat/completions
      // Docs: https://docs.fireworks.ai/api-reference
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
          schema: FireworksChatRequestSchema,
        }
      ),
    },
    // POST https://api.fireworks.ai/inference/v1/completions
    // Docs: https://docs.fireworks.ai/api-reference
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
        schema: FireworksCompletionRequestSchema,
      }
    ),
    // POST https://api.fireworks.ai/inference/v1/embeddings
    // Docs: https://docs.fireworks.ai/api-reference
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
        schema: FireworksEmbeddingRequestSchema,
      }
    ),
    // POST https://api.fireworks.ai/inference/v1/rerank
    // Docs: https://docs.fireworks.ai/api-reference
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
        schema: FireworksRerankRequestSchema,
      }
    ),
    messages: Object.assign(messagesImpl, {
      schema: AnthropicMessagesRequestSchema,
    }),
    workflows: {
      // POST https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/{model}/text_to_image
      // Docs: https://docs.fireworks.ai/api-reference
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
          schema: FireworksTextToImageRequestSchema,
        }
      ),
      // POST https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/{model}
      // Docs: https://docs.fireworks.ai/api-reference
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
          schema: FireworksKontextRequestSchema,
        }
      ),
      // POST https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/{model}/get_result
      // Docs: https://docs.fireworks.ai/api-reference
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
          schema: FireworksGetResultRequestSchema,
        }
      ),
    },
    audio: {
      // POST https://api.fireworks.ai/inference/v1/audio/transcriptions
      // Docs: https://docs.fireworks.ai/api-reference
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
          schema: FireworksTranscriptionRequestSchema,
        }
      ),
      // POST https://api.fireworks.ai/inference/v1/audio/translations
      // Docs: https://docs.fireworks.ai/api-reference
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
          schema: FireworksTranslationRequestSchema,
        }
      ),
      batch: {
        // POST https://api.fireworks.ai/inference/v1/audio/transcriptions
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksAudioBatchTranscriptionRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/audio/translations
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksAudioBatchTranslationRequestSchema,
          }
        ),
      },
    },
    accounts: {
      users: {
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateUserRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksUpdateUserRequestSchema,
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
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateModelRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}:prepare
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksPrepareModelRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}:getUploadEndpoint
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksGetUploadEndpointRequestSchema,
          }
        ),
      },
      deployments: {
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateDeploymentRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}:undelete
        // Docs: https://docs.fireworks.ai/api-reference
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
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateDeployedModelRequestSchema,
          }
        ),
      },
      apiKeys: {
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}/apiKeys
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateApiKeyRequestSchema,
          }
        ),
      },
      secrets: {
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateSecretRequestSchema,
          }
        ),
      },
      datasets: {
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateDatasetRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}:getUploadEndpoint
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksDatasetGetUploadEndpointRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}:validateUpload
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksDatasetValidateUploadRequestSchema,
          }
        ),
      },
      batchInferenceJobs: {
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batchInferenceJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksBatchJobCreateRequestSchema,
          }
        ),
      },
      supervisedFineTuningJobs: {
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/supervisedFineTuningJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksSFTCreateRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{param}/supervisedFineTuningJobs/{param}:resume
        // Docs: https://docs.fireworks.ai/api-reference
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
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksDpoJobCreateRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs/{jobId}:resume
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs/{jobId}:getMetricsFileEndpoint
        // Docs: https://docs.fireworks.ai/api-reference
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
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluatorsV2
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateEvaluatorRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}:getUploadEndpoint
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksGetUploadEndpointEvaluatorRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}:validateUpload
        // Docs: https://docs.fireworks.ai/api-reference
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
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksCreateEvaluationJobRequestSchema,
          }
        ),
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}:getExecutionLogEndpoint
        // Docs: https://docs.fireworks.ai/api-reference
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
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksRFTCreateRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}:resume
        // Docs: https://docs.fireworks.ai/api-reference
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
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksRlorTrainerJobCreateRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}:executeTrainStep
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksRlorTrainerJobExecuteStepRequestSchema,
          }
        ),
        // POST https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}:resume
        // Docs: https://docs.fireworks.ai/api-reference
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

  // POST stream namespace - streaming methods
  const postStreamV1 = {
    chat: {
      completions: Object.assign(
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
          schema: FireworksChatRequestSchema,
        }
      ),
    },
    completions: Object.assign(
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
        schema: FireworksCompletionRequestSchema,
      }
    ),
    messages: Object.assign(messagesStreamImpl, {
      schema: AnthropicMessagesRequestSchema,
    }),
  };

  // GET namespace - methods that use HTTP GET
  const getV1 = {
    accounts: {
      // GET https://api.fireworks.ai/inference/v1/v1/accounts
      // Docs: https://docs.fireworks.ai/api-reference
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
      // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}
      // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}/apiKeys
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets/{secretId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksEmptySchema,
          }
        ),
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksEmptySchema,
          }
        ),
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}:getDownloadEndpoint
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksEmptySchema,
          }
        ),
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}:validateUpload
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksValidateUploadRequestSchema,
          }
        ),
      },
      datasets: {
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}:getDownloadEndpoint
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksEmptySchema,
          }
        ),
      },
      batchInferenceJobs: {
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batchInferenceJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batchInferenceJobs/{jobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/supervisedFineTuningJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{param}/supervisedFineTuningJobs/{param}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deploymentShapes/{shapeId}
        // Docs: https://docs.fireworks.ai/api-reference
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
          // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deploymentShapes/{shapeId}/versions
          // Docs: https://docs.fireworks.ai/api-reference
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
          // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deploymentShapes/{shapeId}/versions/{versionId}
          // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels/{deployedModelId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs/{jobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}:getBuildLogEndpoint
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}:getSourceCodeSignedUrl
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // GET https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batch_job/{batchId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksUpdateUserRequestSchema,
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
        // PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksUpdateModelRequestSchema,
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
        // PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksUpdateDatasetRequestSchema,
          }
        ),
      },
      deployments: {
        // PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksUpdateDeploymentRequestSchema,
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
        // PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}:scale
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksScaleDeploymentRequestSchema,
          }
        ),
      },
      deployedModels: {
        // PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels/{deployedModelId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksUpdateDeployedModelRequestSchema,
          }
        ),
      },
      secrets: {
        // PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets/{secretId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksUpdateSecretRequestSchema,
          }
        ),
      },
      evaluators: {
        // PATCH https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksUpdateEvaluatorRequestSchema,
          }
        ),
      },
    },
  };

  // DELETE namespace - methods that use HTTP DELETE
  const deleteV1 = {
    accounts: {
      apiKeys: {
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/users/{userId}/apiKeys:delete
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksDeleteApiKeyRequestSchema,
          }
        ),
      },
      secrets: {
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/secrets/{secretId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/models/{modelId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksEmptySchema,
          }
        ),
      },
      datasets: {
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/datasets/{datasetId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/batchInferenceJobs/{jobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{param}/supervisedFineTuningJobs/{param}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksEmptySchema,
          }
        ),
      },
      deployments: {
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployments/{deploymentId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/deployedModels/{deployedModelId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/dpoJobs/{jobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluators/{evaluatorId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
        // DELETE https://api.fireworks.ai/inference/v1/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}
        // Docs: https://docs.fireworks.ai/api-reference
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
            schema: FireworksStreamingTranscriptionOptionsSchema,
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
      stream: {
        v1: postStreamV1,
      },
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
