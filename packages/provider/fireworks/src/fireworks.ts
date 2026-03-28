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
  dpoJobCreateSchema,
} from "./schemas";
import { validatePayload } from "./validate";
import { sseToIterable } from "./sse";

export function fireworks(opts: FireworksOptions): FireworksProvider {
  const baseURL = opts.baseURL ?? "https://api.fireworks.ai/inference/v1";
  const modelsBaseURL = "https://api.fireworks.ai";
  const audioBaseURL =
    opts.audioBaseURL ?? "https://audio-prod.api.fireworks.ai/v1";
  const doFetch = opts.fetch ?? fetch;
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
            async function validateUploadFn(
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
      },
    },
  };
}
