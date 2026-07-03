import { KieError } from "./types";
import { KieChatRequestSchema } from "./zod";
import type { ApicitySchema } from "./types";
import { withFallback } from "./middleware";
import { createKieTransport } from "./request";
import type { Transport } from "./transport";

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
  transport: Transport,
  pathPrefix: string
): (req: KieChatRequest, signal?: AbortSignal) => Promise<KieChatResponse> {
  return async function completions(
    req: KieChatRequest,
    signal?: AbortSignal
  ): Promise<KieChatResponse> {
    try {
      return await transport.postJson<KieChatResponse>(
        `/${pathPrefix}/v1/chat/completions`,
        req,
        { signal }
      );
    } catch (error) {
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
  const transport = createKieTransport({
    baseURL,
    apiKey,
    doFetch,
    timeout,
    errorPrefix: "Kie Chat API error",
    requestFailedPrefix: "Chat request failed",
  });
  const endpoints = PATH_PREFIXES.map((prefix) =>
    buildEndpoint(transport, prefix)
  );

  const fallback = withFallback<KieChatRequest, KieChatResponse>(endpoints);

  return {
    completions: Object.assign(fallback, {
      schema: KieChatRequestSchema,
    }),
  };
}
