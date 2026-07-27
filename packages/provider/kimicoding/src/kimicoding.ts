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
  OpenAiChatCompletionRequest,
  OpenAiChatCompletion,
  OpenAiChatCompletionChunk,
} from "./types";
import { sseToIterable } from "./sse";
import {
  ChatRequestSchema,
  EmbeddingRequestSchema,
  CountTokensRequestSchema,
  OpenAiChatCompletionRequestSchema,
} from "./zod";
import { attachExamples } from "./example";
import { createTransport } from "./transport";

// Covers the Anthropic envelope {error:{message,type}} and the OpenAI
// envelope {error:{message,type,code}}; both map error.message.
interface ErrorEnvelopeBody {
  error?: { message?: string; type?: string; code?: string };
}

function isErrorEnvelopeBody(x: unknown): x is ErrorEnvelopeBody {
  if (typeof x !== "object" || x === null || !("error" in x)) {
    return false;
  }
  return typeof x.error === "object";
}

// Plain-text upstream errors look like "error, status code: 429 ...".
const STATUS_TEXT_ERROR_RE = /^error, status code: \d+/;

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

  // Dual Base URL support (REQ-005): the transport joins
  // `${baseUrl}${path}` with no separator handling, and every request
  // path below is the literal `v1/...` form. For the OpenAI-compatible
  // Base URL (pathname ends in `/v1`), strip that trailing `/v1`
  // segment before handing the base to the transport so absolute
  // upstream URLs keep a single `v1` segment with no duplication and no
  // missing separator. Any other base passes through unchanged (legacy
  // behavior: the base is expected to end with `/`), so default
  // `https://api.kimi.com/coding/` handling stays byte-identical.
  const trimmed = baseURL.replace(/\/+$/, "");
  const openAIBase = new URL(trimmed).pathname.endsWith("/v1");
  const transportBaseUrl = openAIBase ? `${trimmed.slice(0, -3)}/` : baseURL;

  function buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${opts.apiKey}`,
      "x-api-key": opts.apiKey,
    };
  }

  const transport = createTransport({
    baseUrl: transportBaseUrl,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: buildHeaders,
    parseErrorBody: (status, body, text) => {
      if (
        isErrorEnvelopeBody(body) &&
        typeof body.error?.message === "string"
      ) {
        return {
          message: `KimiCoding error ${status}: ${body.error.message}`,
        };
      }
      const trimmed = text.trim();
      if (STATUS_TEXT_ERROR_RE.test(trimmed)) {
        return { message: `KimiCoding error ${status}: ${trimmed}` };
      }
      return { message: `KimiCoding error: ${status}` };
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

  // POST https://api.kimi.com/coding/v1/chat/completions
  // Docs: https://www.kimi.com/code/docs/en/
  async function chatCompletionsImpl(
    req: OpenAiChatCompletionRequest,
    signal?: AbortSignal
  ): Promise<OpenAiChatCompletion> {
    return await transport.postJson<OpenAiChatCompletion>(
      "v1/chat/completions",
      req,
      { signal }
    );
  }

  // POST https://api.kimi.com/coding/v1/chat/completions
  // Docs: https://www.kimi.com/code/docs/en/
  async function* streamChatCompletionsImpl(
    req: OpenAiChatCompletionRequest,
    signal?: AbortSignal
  ): AsyncIterable<OpenAiChatCompletionChunk> {
    const res = await transport.raw("v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req, stream: true }),
      signal,
    });

    for await (const { data } of sseToIterable(res)) {
      if (data === "[DONE]") {
        break;
      }

      try {
        const parsed: OpenAiChatCompletionChunk = JSON.parse(data);
        yield parsed;
      } catch {
        // ignore non-JSON lines
      }
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

  const chatCompletions = Object.assign(chatCompletionsImpl, {
    schema: OpenAiChatCompletionRequestSchema,
  });

  const streamChatCompletions = Object.assign(streamChatCompletionsImpl, {
    schema: OpenAiChatCompletionRequestSchema,
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
      coding: {
        v1: {
          messages,
          embeddings,
          countTokens,
          chat: { completions: chatCompletions },
        },
      },
      stream: {
        coding: {
          v1: {
            messages: streamMessages,
            chat: { completions: streamChatCompletions },
          },
        },
      },
    },
    get: { coding: { v1: { models: listModelsFn } } },
  });
}
