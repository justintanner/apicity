import { KieError } from "./types";
import { KieChatRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import { withFallback } from "./middleware";

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

export interface KieChatContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface KieChatMessage {
  role: "user" | "assistant" | "system";
  content: string | KieChatContentPart[];
}

export interface KieChatRequest {
  model: string;
  messages: KieChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: {
    type: "text" | "json_object" | "json_schema";
    json_schema?: Record<string, unknown>;
  };
}

// Raw OpenAI-compatible chat response
export interface KieChatChoice {
  index?: number;
  message?: {
    role?: string;
    content?: string;
  };
  finish_reason?: string;
}

export interface KieChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface KieChatResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: KieChatChoice[];
  usage?: KieChatUsage;
  error?: string;
  code?: number;
}

interface KieChatCompletionsMethod {
  (req: KieChatRequest, signal?: AbortSignal): Promise<KieChatResponse>;
  schema: ApicitySchema<KieChatRequest>;
}

export interface KieChatProvider {
  completions: KieChatCompletionsMethod;
}

const PATH_PREFIXES = ["gpt-5.5", "gpt-5-2"];

function buildEndpoint(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number,
  pathPrefix: string
): (req: KieChatRequest, signal?: AbortSignal) => Promise<KieChatResponse> {
  return async function completions(
    req: KieChatRequest,
    signal?: AbortSignal
  ): Promise<KieChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(
        `${baseURL}/${pathPrefix}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Kie Chat API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            typeof body === "object" &&
            body !== null &&
            "msg" in body &&
            typeof (body as { msg?: string }).msg === "string"
          ) {
            message = `Kie Chat API error ${res.status}: ${(body as { msg: string }).msg}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KieError(message, res.status, body);
      }

      return (await res.json()) as KieChatResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof KieError) throw error;
      if (error instanceof SyntaxError) {
        throw new KieError("Failed to parse chat response", 500);
      }
      throw new KieError(`Chat request failed: ${error}`, 500);
    }
  };
}

export function createChatProvider(
  baseURL: string,
  apiKey: string,
  doFetch: typeof fetch,
  timeout: number
): KieChatProvider {
  const endpoints = PATH_PREFIXES.map((prefix) =>
    buildEndpoint(baseURL, apiKey, doFetch, timeout, prefix)
  );

  const fallback = withFallback<KieChatRequest, KieChatResponse>(endpoints);

  return {
    completions: Object.assign(fallback, {
      schema: KieChatRequestSchema,
    }),
  };
}
