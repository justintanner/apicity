import {
  OpenAiOptions,
  OpenAiChatRequest,
  OpenAiChatResponse,
  OpenAiTranscribeRequest,
  OpenAiTranscribeResponse,
  OpenAiProvider,
  OpenAiError,
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
        try {
          const errorData: unknown = await res.json();
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "error" in errorData
          ) {
            const err = (errorData as { error: { message?: string } }).error;
            if (err?.message) {
              message = `OpenAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new OpenAiError(message, res.status);
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

  function parseResponse(data: OpenAIChatCompletion): OpenAiChatResponse {
    if (data.error) {
      throw new OpenAiError(data.error.message ?? "Unknown API error", 500);
    }

    const choice = data.choices?.[0];
    const message = choice?.message;

    return {
      content: message?.content ?? "",
      model: data.model ?? "gpt-5.4-2026-03-05",
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: choice?.finish_reason ?? "stop",
      toolCalls: message?.tool_calls,
    };
  }

  return {
    v1: {
      chat: {
        async completions(
          req: OpenAiChatRequest,
          signal?: AbortSignal
        ): Promise<OpenAiChatResponse> {
          const body: Record<string, unknown> = {
            model: req.model ?? "gpt-5.4-2026-03-05",
            messages: req.messages,
          };
          if (req.temperature !== undefined) body.temperature = req.temperature;
          if (req.max_completion_tokens !== undefined)
            body.max_completion_tokens = req.max_completion_tokens;
          else if (req.max_tokens !== undefined)
            body.max_tokens = req.max_tokens;
          if (req.tools) body.tools = req.tools;
          if (req.tool_choice) body.tool_choice = req.tool_choice;
          if (req.response_format) body.response_format = req.response_format;

          const data = await makeRequest<OpenAIChatCompletion>(
            "/chat/completions",
            jsonRequest(body),
            signal
          );
          return parseResponse(data);
        },
      },
      audio: {
        async transcriptions(
          req: OpenAiTranscribeRequest,
          signal?: AbortSignal
        ): Promise<OpenAiTranscribeResponse> {
          const form = new FormData();
          form.append("file", req.file);
          form.append("model", req.model ?? "gpt-4o-mini-transcribe");
          form.append("response_format", "json");
          if (req.language !== undefined) form.append("language", req.language);
          if (req.prompt !== undefined) form.append("prompt", req.prompt);
          if (req.temperature !== undefined)
            form.append("temperature", String(req.temperature));

          const data = await makeRequest<{ text: string }>(
            "/audio/transcriptions",
            { headers: {}, body: form },
            signal
          );
          return { text: data.text };
        },
      },
    },
  };
}
