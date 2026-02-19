import {
  ChatRequest,
  ChatStreamChunk,
  ChatResponse,
  MoonshotOptions,
  MoonshotError,
  MoonshotProvider,
  FileObject,
  EmbeddingResponse,
} from "./types";
import { sseToIterable } from "./sse";

interface MoonshotErrorBody {
  error?: { message?: string };
}

function isMoonshotErrorBody(x: unknown): x is MoonshotErrorBody {
  return (
    typeof x === "object" &&
    x !== null &&
    "error" in x &&
    typeof (x as { error?: unknown }).error === "object"
  );
}

interface MoonshotStreamJSON {
  choices?: Array<{
    delta?: { content?: string };
  }>;
}

function getDeltaContent(x: unknown): string {
  if (
    typeof x === "object" &&
    x !== null &&
    "choices" in x &&
    Array.isArray((x as { choices: unknown }).choices)
  ) {
    const choices = (x as MoonshotStreamJSON).choices;
    const delta = choices?.[0]?.delta?.content;
    return typeof delta === "string" ? delta : "";
  }
  return "";
}

function createFormData(
  file: File | Blob | Buffer,
  purpose: string,
  filename?: string
): FormData {
  const formData = new FormData();

  let finalFilename = filename;
  if (!finalFilename) {
    if (file instanceof File) {
      finalFilename = file.name;
    } else {
      finalFilename = "file";
    }
  }

  if (typeof Buffer !== "undefined" && file instanceof Buffer) {
    const arrayBuffer = file.buffer.slice(
      file.byteOffset,
      file.byteOffset + file.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer]);
    formData.append("file", blob, finalFilename);
  }

  formData.append("purpose", purpose);
  return formData;
}

export function moonshot(opts: MoonshotOptions): MoonshotProvider {
  const baseURL = opts.baseURL ?? "https://api.moonshot.cn/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest(
    url: string,
    options: RequestInit,
    requiresAuth = true
  ): Promise<Response> {
    const headers: Record<string, string> = {};

    if (requiresAuth) {
      headers.Authorization = `Bearer ${opts.apiKey}`;
    }

    if (options.headers) {
      const optsHeaders = options.headers as Record<string, string>;
      Object.assign(headers, optsHeaders);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  return {
    async *streamChat(
      req: ChatRequest,
      signal?: AbortSignal
    ): AsyncIterable<ChatStreamChunk> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const requestBody: Record<string, unknown> = {
          model: req.model,
          messages: req.messages,
          stream: true,
        };

        if (req.temperature !== undefined)
          requestBody.temperature = req.temperature;
        if (req.maxTokens !== undefined) requestBody.max_tokens = req.maxTokens;
        if (req.topP !== undefined) requestBody.top_p = req.topP;
        if (req.frequencyPenalty !== undefined)
          requestBody.frequency_penalty = req.frequencyPenalty;
        if (req.presencePenalty !== undefined)
          requestBody.presence_penalty = req.presencePenalty;
        if (req.stop !== undefined) requestBody.stop = req.stop;
        if (req.seed !== undefined) requestBody.seed = req.seed;
        if (req.logprobs !== undefined) requestBody.logprobs = req.logprobs;
        if (req.logitBias !== undefined) requestBody.logit_bias = req.logitBias;
        if (req.responseFormat !== undefined)
          requestBody.response_format = { type: req.responseFormat };
        if (req.user !== undefined) requestBody.user = req.user;

        if (
          req.systemPrompt &&
          !req.messages.some((m) => m.role === "system")
        ) {
          requestBody.messages = [
            { role: "system", content: req.systemPrompt },
            ...req.messages,
          ];
        }

        const res = await doFetch(`${baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: signal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let message = `Moonshot error: ${res.status}`;
          try {
            const raw: unknown = await res.json();
            if (
              isMoonshotErrorBody(raw) &&
              typeof raw.error?.message === "string"
            ) {
              message = `Moonshot error ${res.status}: ${raw.error.message}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new MoonshotError(message, res.status);
        }

        for await (const data of sseToIterable(res)) {
          if (data === "[DONE]") {
            yield { delta: "", done: true };
            break;
          }
          try {
            const json: unknown = JSON.parse(data);
            const delta = getDeltaContent(json);
            if (delta) {
              yield { delta };
            }
          } catch {
            // ignore keep-alive or non-JSON lines
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }
    },

    async chat(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const requestBody: Record<string, unknown> = {
          model: req.model,
          messages: req.messages,
        };

        if (req.temperature !== undefined)
          requestBody.temperature = req.temperature;
        if (req.maxTokens !== undefined) requestBody.max_tokens = req.maxTokens;
        if (req.topP !== undefined) requestBody.top_p = req.topP;
        if (req.frequencyPenalty !== undefined)
          requestBody.frequency_penalty = req.frequencyPenalty;
        if (req.presencePenalty !== undefined)
          requestBody.presence_penalty = req.presencePenalty;
        if (req.stop !== undefined) requestBody.stop = req.stop;
        if (req.seed !== undefined) requestBody.seed = req.seed;
        if (req.logprobs !== undefined) requestBody.logprobs = req.logprobs;
        if (req.logitBias !== undefined) requestBody.logit_bias = req.logitBias;
        if (req.responseFormat !== undefined)
          requestBody.response_format = { type: req.responseFormat };
        if (req.user !== undefined) requestBody.user = req.user;

        if (
          req.systemPrompt &&
          !req.messages.some((m) => m.role === "system")
        ) {
          requestBody.messages = [
            { role: "system", content: req.systemPrompt },
            ...req.messages,
          ];
        }

        const res = await doFetch(`${baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: signal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let message = `Moonshot error: ${res.status}`;
          try {
            const raw: unknown = await res.json();
            if (
              isMoonshotErrorBody(raw) &&
              typeof raw.error?.message === "string"
            ) {
              message = `Moonshot error ${res.status}: ${raw.error.message}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new MoonshotError(message, res.status);
        }

        const data = await res.json();
        const choice = data.choices?.[0];

        return {
          content: choice?.message?.content || "",
          model: data.model || req.model,
          usage: data.usage
            ? {
                promptTokens: data.usage.prompt_tokens || 0,
                completionTokens: data.usage.completion_tokens || 0,
                totalTokens: data.usage.total_tokens || 0,
              }
            : {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
              },
          finishReason: choice?.finish_reason || "stop",
          metadata: { id: data.id, created: data.created },
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },

    async getModels(): Promise<string[]> {
      try {
        const res = await doFetch(`${baseURL}/models`, {
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
          },
          signal: AbortSignal.timeout(timeout),
        });

        if (!res.ok) {
          throw new MoonshotError(
            `Failed to fetch models: ${res.status}`,
            res.status
          );
        }

        const data = await res.json();
        return data.data?.map((model: { id: string }) => model.id) || [];
      } catch (error) {
        if (error instanceof MoonshotError) throw error;
        throw new MoonshotError(`Failed to fetch models: ${error}`, 500);
      }
    },

    validateModel(modelId: string): boolean {
      const validModels = ["kimi-k2-5", "moonshot-v1"];
      return validModels.some((model) => modelId.startsWith(model));
    },

    getMaxTokens(modelId: string): number {
      if (modelId.startsWith("kimi-k2-5")) return 131072;
      if (modelId.startsWith("moonshot-v1-128k")) return 131072;
      if (modelId.startsWith("moonshot-v1-32k")) return 32768;
      if (modelId.startsWith("moonshot-v1-8k")) return 8192;
      return 8192;
    },

    // Files API
    async listFiles(): Promise<FileObject[]> {
      const res = await makeRequest(`${baseURL}/files`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new MoonshotError(
          `Failed to list files: ${res.status}`,
          res.status
        );
      }

      const data = await res.json();
      return data.data || [];
    },

    async uploadFile(
      file: File | Blob | Buffer,
      purpose: string,
      filename?: string
    ): Promise<FileObject> {
      const formData = createFormData(file, purpose, filename);

      const res = await makeRequest(`${baseURL}/files`, {
        method: "POST",
        body: formData,
        headers: {},
      });

      if (!res.ok) {
        throw new MoonshotError(
          `Failed to upload file: ${res.status}`,
          res.status
        );
      }

      return res.json();
    },

    async deleteFile(fileId: string): Promise<void> {
      const res = await makeRequest(`${baseURL}/files/${fileId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new MoonshotError(
          `Failed to delete file: ${res.status}`,
          res.status
        );
      }
    },

    async retrieveFile(fileId: string): Promise<FileObject> {
      const res = await makeRequest(`${baseURL}/files/${fileId}`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new MoonshotError(
          `Failed to retrieve file: ${res.status}`,
          res.status
        );
      }

      return res.json();
    },

    async retrieveFileContent(fileId: string): Promise<string> {
      const res = await makeRequest(`${baseURL}/files/${fileId}/content`, {
        method: "GET",
      });

      if (!res.ok) {
        throw new MoonshotError(
          `Failed to retrieve file content: ${res.status}`,
          res.status
        );
      }

      return res.text();
    },

    // Embeddings API
    async createEmbedding(
      input: string | string[],
      model?: string,
      options?: {
        encoding_format?: "float" | "base64";
        dimensions?: number;
      }
    ): Promise<EmbeddingResponse> {
      const requestBody: Record<string, unknown> = {
        input,
        model: model ?? "moonshot-embedding-1",
      };

      if (options?.encoding_format) {
        requestBody.encoding_format = options.encoding_format;
      }
      if (options?.dimensions) {
        requestBody.dimensions = options.dimensions;
      }

      const res = await makeRequest(`${baseURL}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new MoonshotError(
          `Failed to create embedding: ${res.status}`,
          res.status
        );
      }

      return res.json();
    },
  };
}
