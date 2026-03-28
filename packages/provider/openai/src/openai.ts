import {
  OpenAiOptions,
  OpenAiChatRequest,
  OpenAiChatResponse,
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
  OpenAiModelListResponse,
  OpenAiModel,
  OpenAiModelDeleteResponse,
  OpenAiResponseRequest,
  OpenAiResponseResponse,
  OpenAiResponseDeleteResponse,
  OpenAiResponseGetOptions,
  OpenAiProvider,
  OpenAiError,
} from "./types";
import type { ValidationResult } from "./types";
import {
  chatCompletionsSchema,
  embeddingsSchema,
  imageEditsSchema,
  imageGenerationsSchema,
  modelsDeleteSchema,
  audioTranscriptionsSchema,
  audioTranslationsSchema,
  responsesSchema,
  responsesDeleteSchema,
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
            return validatePayload(data, embeddingsSchema);
          },
        }
      ),
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
          }
        ),
      },
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
            }
          ),
        }
      ),
      audio: {
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
    },
  };
}
