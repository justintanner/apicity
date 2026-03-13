import {
  XaiOptions,
  XaiChatRequest,
  XaiChatResponse,
  XaiImageGenerateRequest,
  XaiImageEditRequest,
  XaiImageResponse,
  XaiVideoGenerateRequest,
  XaiVideoEditRequest,
  XaiVideoAsyncResponse,
  XaiVideoResult,
  XaiProvider,
  XaiError,
} from "./types";

interface OpenAIChatCompletion {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason?: string;
  }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; type?: string };
}

interface XaiImageGenerationApiResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

export function xai(opts: XaiOptions): XaiProvider {
  const baseURL = opts.baseURL ?? "https://api.x.ai/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<OpenAIChatCompletion> {
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
        let message = `XAI API error: ${res.status}`;
        try {
          const errorData: unknown = await res.json();
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "error" in errorData
          ) {
            const err = (errorData as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status);
      }

      return (await res.json()) as OpenAIChatCompletion;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
  }

  function parseResponse(data: OpenAIChatCompletion): XaiChatResponse {
    if (data.error) {
      throw new XaiError(data.error.message ?? "Unknown API error", 500);
    }

    const choice = data.choices?.[0];
    const message = choice?.message;

    return {
      content: message?.content ?? "",
      model: data.model ?? "grok-4-fast",
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: choice?.finish_reason ?? "stop",
      toolCalls: message?.tool_calls,
    };
  }

  async function makeImageRequest(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<XaiImageGenerationApiResponse> {
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
        let message = `XAI API error: ${res.status}`;
        try {
          const errorData: unknown = await res.json();
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "error" in errorData
          ) {
            const err = (errorData as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status);
      }

      return (await res.json()) as XaiImageGenerationApiResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
  }

  async function makeJsonPostRequest<T>(
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
        let message = `XAI API error: ${res.status}`;
        try {
          const errorData: unknown = await res.json();
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "error" in errorData
          ) {
            const err = (errorData as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
  }

  async function makeGetRequest<T>(
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
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `XAI API error: ${res.status}`;
        try {
          const errorData: unknown = await res.json();
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "error" in errorData
          ) {
            const err = (errorData as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
  }

  const completions = Object.assign(
    async function completions(
      req: XaiChatRequest,
      signal?: AbortSignal
    ): Promise<XaiChatResponse> {
      const body: Record<string, unknown> = {
        model: req.model ?? "grok-4-fast",
        messages: req.messages,
      };
      if (req.temperature !== undefined) body.temperature = req.temperature;
      if (req.max_tokens !== undefined) body.max_tokens = req.max_tokens;
      if (req.tools) body.tools = req.tools;
      if (req.tool_choice) body.tool_choice = req.tool_choice;

      const data = await makeRequest("/chat/completions", body, signal);
      return parseResponse(data);
    },
    {
      async search(
        query: string,
        signal?: AbortSignal
      ): Promise<XaiChatResponse> {
        const body = {
          model: "grok-4-fast",
          messages: [{ role: "user", content: query }],
          tools: [
            {
              type: "function",
              function: {
                name: "x_search",
                description: "Search X for relevant content",
                parameters: {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    enable_video_understanding: { type: "boolean" },
                  },
                },
              },
            },
          ],
          tool_choice: "auto",
          temperature: 0,
        };

        const data = await makeRequest("/chat/completions", body, signal);
        return parseResponse(data);
      },
    }
  );

  const videos = Object.assign(
    async function videos(
      requestId: string,
      signal?: AbortSignal
    ): Promise<XaiVideoResult> {
      return await makeGetRequest(`/videos/${requestId}`, signal);
    },
    {
      async generations(
        req: XaiVideoGenerateRequest,
        signal?: AbortSignal
      ): Promise<XaiVideoAsyncResponse> {
        const body: Record<string, unknown> = {
          model: req.model ?? "grok-imagine-video",
          prompt: req.prompt,
        };
        if (req.duration !== undefined) body.duration = req.duration;

        return await makeJsonPostRequest("/videos/generations", body, signal);
      },

      async edits(
        req: XaiVideoEditRequest,
        signal?: AbortSignal
      ): Promise<XaiVideoAsyncResponse> {
        const body: Record<string, unknown> = {
          model: req.model ?? "grok-imagine-video",
          prompt: req.prompt,
          video: req.video,
        };

        return await makeJsonPostRequest("/videos/edits", body, signal);
      },
    }
  );

  return {
    v1: {
      chat: {
        completions,
      },
      images: {
        async generations(
          req: XaiImageGenerateRequest,
          signal?: AbortSignal
        ): Promise<XaiImageResponse> {
          const body: Record<string, unknown> = {
            model: req.model ?? "grok-imagine-image",
            prompt: req.prompt,
          };
          if (req.n !== undefined) body.n = req.n;
          if (req.response_format !== undefined)
            body.response_format = req.response_format;
          if (req.aspect_ratio !== undefined)
            body.aspect_ratio = req.aspect_ratio;
          if (req.resolution !== undefined) body.resolution = req.resolution;

          return await makeImageRequest("/images/generations", body, signal);
        },

        async edits(
          req: XaiImageEditRequest,
          signal?: AbortSignal
        ): Promise<XaiImageResponse> {
          const body: Record<string, unknown> = {
            model: req.model ?? "grok-imagine-image",
            prompt: req.prompt,
          };
          if (req.image) body.image = req.image;
          if (req.images) body.images = req.images;
          if (req.n !== undefined) body.n = req.n;
          if (req.response_format !== undefined)
            body.response_format = req.response_format;
          if (req.aspect_ratio !== undefined)
            body.aspect_ratio = req.aspect_ratio;

          return await makeImageRequest("/images/edits", body, signal);
        },
      },
      videos,
    },
  };
}
