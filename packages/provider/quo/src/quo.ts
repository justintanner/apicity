import { attachExamples } from "./example";
import { QuoError } from "./types";
import type {
  QuoOptions,
  QuoProvider,
  QuoSendMessageRequest,
  QuoSendMessageResponse,
} from "./types";
import { QuoSendMessageRequestSchema } from "./zod";

interface QuoErrorDetails {
  code?: string;
  message?: string;
}

function errorDetails(body: unknown): QuoErrorDetails {
  if (body === null || typeof body !== "object") return {};
  const record = body as Record<string, unknown>;
  const nested =
    record.error !== null && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : undefined;
  const code =
    typeof record.code === "string"
      ? record.code
      : typeof nested?.code === "string"
        ? nested.code
        : undefined;
  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.error === "string"
        ? record.error
        : typeof nested?.message === "string"
          ? nested.message
          : undefined;
  return { code, message };
}

function redact(value: string, secrets: string[]): string {
  return secrets.reduce(
    (safe, secret) => (secret ? safe.replaceAll(secret, "[REDACTED]") : safe),
    value
  );
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function createQuo(options: QuoOptions = {}): QuoProvider {
  const baseURL = (options.baseURL ?? "https://api.openphone.com").replace(
    /\/+$/,
    ""
  );
  const doFetch = options.fetch ?? fetch;
  const timeout = options.timeout ?? 30000;

  function apiKey(): string {
    const key = options.apiKey ?? process.env.QUO_API_KEY;
    if (!key) {
      throw new QuoError(
        "Quo API key is required. Pass apiKey or set QUO_API_KEY.",
        401
      );
    }
    return key;
  }

  // POST https://api.openphone.com/v1/messages
  // Docs: https://www.quo.com/docs/mdx/api-reference/messages/send-a-text-message
  async function sendMessage(
    request: QuoSendMessageRequest,
    signal?: AbortSignal
  ): Promise<QuoSendMessageResponse> {
    const key = apiKey();
    const controller = new AbortController();
    const relayAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", relayAbort, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await doFetch(`${baseURL}/v1/messages`, {
        method: "POST",
        headers: {
          Authorization: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      const body = await parseBody(response);

      if (!response.ok) {
        const details = errorDetails(body);
        const privateValues = [key, request.from, ...request.to];
        const suffix = details.message
          ? `: ${redact(details.message, privateValues)}`
          : details.code
            ? `: ${redact(details.code, privateValues)}`
            : "";
        throw new QuoError(
          `Quo API error ${response.status}${suffix}`,
          response.status,
          body,
          details.code
        );
      }

      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new QuoError("Quo API returned invalid JSON", 500, body);
      }
      return body as QuoSendMessageResponse;
    } catch (error) {
      if (error instanceof QuoError) throw error;
      if (signal?.aborted) {
        throw new QuoError("Quo request aborted by caller", 499);
      }
      if (controller.signal.aborted) {
        throw new QuoError("Quo request timed out", 408);
      }
      throw new QuoError("Quo request failed", 500);
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", relayAbort);
    }
  }

  return attachExamples({
    v1: {
      messages: Object.assign(sendMessage, {
        schema: QuoSendMessageRequestSchema,
      }),
    },
  });
}
