import {
  ChatRequest,
  TextContentBlock,
  ImageContentBlock,
  KimiCodingOptions,
  KimiCodingError,
  KimiCodingProvider,
  KimiCodingModelListResponse,
  AnthropicMessage,
  AnthropicStreamEvent,
  EmbeddingRequest,
  EmbeddingResponse,
  CountTokensRequest,
  CountTokensResponse,
} from "./types";
import { sseToIterable } from "./sse";
import {
  ChatRequestSchema,
  EmbeddingRequestSchema,
  CountTokensRequestSchema,
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

interface AnthropicErrorBody {
  error?: { message?: string; type?: string };
}

function isAnthropicErrorBody(x: unknown): x is AnthropicErrorBody {
  return (
    typeof x === "object" &&
    x !== null &&
    "error" in x &&
    typeof (x as { error?: unknown }).error === "object"
  );
}

export function textBlock(text: string): TextContentBlock {
  return { type: "text", text };
}

export function imageBase64(
  data: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): ImageContentBlock {
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data },
  };
}

export function imageUrl(url: string): ImageContentBlock {
  return { type: "image", source: { type: "url", url } };
}

export function kimicoding(opts: KimiCodingOptions): KimiCodingProvider {
  const baseURL = opts.baseURL ?? "https://api.kimi.com/coding/";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${opts.apiKey}`,
      "x-api-key": opts.apiKey,
      "Content-Type": "application/json",
    };
  }

  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "x-api-key": opts.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `KimiCoding error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            isAnthropicErrorBody(body) &&
            typeof body.error?.message === "string"
          ) {
            message = `KimiCoding error ${res.status}: ${body.error.message}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KimiCodingError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof KimiCodingError) throw error;
      throw new KimiCodingError(`KimiCoding request failed: ${error}`, 500);
    }
  }

  // POST https://api.kimi.com/coding/v1/messages
  // Docs: https://platform.moonshot.ai/docs
  async function* streamImpl(
    req: ChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<AnthropicStreamEvent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${baseURL}v1/messages`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(req),
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `KimiCoding error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            isAnthropicErrorBody(body) &&
            typeof body.error?.message === "string"
          ) {
            message = `KimiCoding error ${res.status}: ${body.error.message}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KimiCodingError(message, res.status, body);
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

  // POST https://api.kimi.com/coding/v1/messages
  // Docs: https://platform.moonshot.ai/docs
  async function chatImpl(
    req: ChatRequest,
    signal?: AbortSignal
  ): Promise<AnthropicMessage> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${baseURL}v1/messages`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(req),
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `KimiCoding error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            isAnthropicErrorBody(body) &&
            typeof body.error?.message === "string"
          ) {
            message = `KimiCoding error ${res.status}: ${body.error.message}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KimiCodingError(message, res.status, body);
      }

      return (await res.json()) as AnthropicMessage;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // POST https://api.kimi.com/coding/v1/embeddings
  // Docs: https://platform.moonshot.ai/docs
  async function embeddingsImpl(
    req: EmbeddingRequest,
    signal?: AbortSignal
  ): Promise<EmbeddingResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${baseURL}v1/embeddings`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(req),
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `KimiCoding error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            isAnthropicErrorBody(body) &&
            typeof body.error?.message === "string"
          ) {
            message = `KimiCoding error ${res.status}: ${body.error.message}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KimiCodingError(message, res.status, body);
      }

      return (await res.json()) as EmbeddingResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // sig-ok: ergonomic name (URL is /tokens/count)
  // POST https://api.kimi.com/coding/v1/tokens/count
  // Docs: https://platform.moonshot.ai/docs
  async function countTokensImpl(
    req: CountTokensRequest,
    signal?: AbortSignal
  ): Promise<CountTokensResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await doFetch(`${baseURL}v1/tokens/count`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(req),
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `KimiCoding error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (
            isAnthropicErrorBody(body) &&
            typeof body.error?.message === "string"
          ) {
            message = `KimiCoding error ${res.status}: ${body.error.message}`;
          }
        } catch {
          // ignore parse errors
        }
        throw new KimiCodingError(message, res.status, body);
      }

      return (await res.json()) as CountTokensResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const messages = Object.assign(chatImpl, {
    schema: ChatRequestSchema,
  });

  const streamMessages = Object.assign(streamImpl, {
    schema: ChatRequestSchema,
  });

  const embeddings = Object.assign(embeddingsImpl, {
    schema: EmbeddingRequestSchema,
  });

  const countTokens = Object.assign(countTokensImpl, {
    schema: CountTokensRequestSchema,
  });

  // GET https://api.kimi.com/coding/v1/models
  // Docs: https://platform.moonshot.ai/docs
  async function listModelsFn(
    signal?: AbortSignal
  ): Promise<KimiCodingModelListResponse> {
    return await makeGetRequest<KimiCodingModelListResponse>(
      "v1/models",
      signal
    );
  }

  return {
    post: {
      coding: { v1: { messages, embeddings, countTokens } },
      stream: { coding: { v1: { messages: streamMessages } } },
    },
    get: { coding: { v1: { models: listModelsFn } } },
  };
}
