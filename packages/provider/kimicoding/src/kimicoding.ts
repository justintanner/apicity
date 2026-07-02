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
import { attachExamples } from "./example";
import { createTransport } from "./transport";

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

export function createKimiCoding(opts: KimiCodingOptions): KimiCodingProvider {
  const baseURL = opts.baseURL ?? "https://api.kimi.com/coding/";
  const timeout = opts.timeout ?? 30000;

  function buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${opts.apiKey}`,
      "x-api-key": opts.apiKey,
    };
  }

  const transport = createTransport({
    baseUrl: baseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: buildHeaders,
    parseErrorBody: (status, body) => {
      let message = `KimiCoding error: ${status}`;
      if (
        isAnthropicErrorBody(body) &&
        typeof body.error?.message === "string"
      ) {
        message = `KimiCoding error ${status}: ${body.error.message}`;
      }
      return { message };
    },
    errorClass: KimiCodingError,
  });

  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    return await transport.getJson<T>(path, { signal });
  }

  // POST https://api.kimi.com/coding/v1/messages
  // Docs: https://platform.moonshot.ai/docs
  async function* streamImpl(
    req: ChatRequest,
    signal?: AbortSignal
  ): AsyncIterable<AnthropicStreamEvent> {
    const res = await transport.raw("v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });

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
  }

  // POST https://api.kimi.com/coding/v1/messages
  // Docs: https://platform.moonshot.ai/docs
  async function chatImpl(
    req: ChatRequest,
    signal?: AbortSignal
  ): Promise<AnthropicMessage> {
    return await transport.postJson<AnthropicMessage>("v1/messages", req, {
      signal,
    });
  }

  // POST https://api.kimi.com/coding/v1/embeddings
  // Docs: https://platform.moonshot.ai/docs
  async function embeddingsImpl(
    req: EmbeddingRequest,
    signal?: AbortSignal
  ): Promise<EmbeddingResponse> {
    return await transport.postJson<EmbeddingResponse>("v1/embeddings", req, {
      signal,
    });
  }

  // sig-ok: ergonomic name (URL is /tokens/count)
  // POST https://api.kimi.com/coding/v1/tokens/count
  // Docs: https://platform.moonshot.ai/docs
  async function countTokensImpl(
    req: CountTokensRequest,
    signal?: AbortSignal
  ): Promise<CountTokensResponse> {
    return await transport.postJson<CountTokensResponse>(
      "v1/tokens/count",
      req,
      { signal }
    );
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

  return attachExamples({
    post: {
      coding: { v1: { messages, embeddings, countTokens } },
      stream: { coding: { v1: { messages: streamMessages } } },
    },
    get: { coding: { v1: { models: listModelsFn } } },
  });
}
