import { createTransport, type Transport } from "./transport";
import { KieError } from "./types";

type KieRequestMethod = "GET" | "POST";

interface KieTransportOptions {
  baseURL: string;
  apiKey: string;
  timeout: number;
  doFetch?: typeof fetch;
  errorPrefix?: string;
  requestFailedPrefix?: string;
  jsonContentType?: boolean;
  defaultHeaders?: () => Record<string, string>;
}

interface KieRequestOptions {
  method: KieRequestMethod;
  path: string;
  body?: unknown;
  signal?: AbortSignal;
}

interface LegacyKieRequestOptions {
  method: KieRequestMethod;
  apiKey: string;
  body?: unknown;
  timeout: number;
  doFetch: typeof fetch;
  signal?: AbortSignal;
}

function codeToString(code: unknown): string | undefined {
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

function withTextFallback(fetchImpl: typeof fetch): typeof fetch {
  return (async (input, init) => {
    const res = await fetchImpl(input, init);
    const maybeJsonResponse = res as Response & {
      json?: () => Promise<unknown>;
      text?: () => Promise<string>;
    };

    if (
      typeof maybeJsonResponse.text === "function" ||
      typeof maybeJsonResponse.json !== "function"
    ) {
      return res;
    }

    return {
      ...maybeJsonResponse,
      text: async () => {
        try {
          return JSON.stringify(await maybeJsonResponse.json!());
        } catch {
          return "";
        }
      },
    } as Response;
  }) as typeof fetch;
}

export function parseKieErrorBody(
  errorPrefix: string = "Kie API error"
): (status: number, body: unknown) => { message: string; code?: string } {
  return (status, body) => {
    if (typeof body === "object" && body !== null) {
      const envelope = body as { msg?: unknown; code?: unknown };
      if (typeof envelope.msg === "string") {
        return {
          message: `${errorPrefix} ${status}: ${envelope.msg}`,
          code: codeToString(envelope.code),
        };
      }
    }

    return { message: `${errorPrefix}: ${status}` };
  };
}

export function parseKieAnthropicErrorBody(
  errorPrefix: string
): (status: number, body: unknown) => { message: string; code?: string } {
  return (status, body) => {
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "object" &&
      (body as { error?: unknown }).error !== null
    ) {
      const err = (body as { error: { message?: unknown; type?: unknown } })
        .error;
      if (typeof err.message === "string") {
        return {
          message: `${errorPrefix} ${status}: ${err.message}`,
          code: codeToString(err.type),
        };
      }
    }

    return { message: `${errorPrefix}: ${status}` };
  };
}

export function createKieTransport(opts: KieTransportOptions): Transport {
  const jsonContentType = opts.jsonContentType ?? true;
  const defaultHeaders =
    opts.defaultHeaders ??
    (() => ({
      Authorization: `Bearer ${opts.apiKey}`,
      ...(jsonContentType ? { "Content-Type": "application/json" } : {}),
    }));

  return createTransport({
    baseUrl: opts.baseURL.replace(/\/$/, ""),
    timeoutMs: opts.timeout,
    fetchImpl: opts.doFetch,
    defaultHeaders,
    parseErrorBody: parseKieErrorBody(opts.errorPrefix),
    errorClass: KieError,
    requestFailedPrefix: opts.requestFailedPrefix ?? "Request failed",
  });
}

async function requestWithTransport<T>(
  transport: Transport,
  opts: KieRequestOptions
): Promise<T> {
  if (opts.method === "GET") {
    return await transport.getJson<T>(opts.path, { signal: opts.signal });
  }

  return await transport.postJson<T>(opts.path, opts.body, {
    signal: opts.signal,
  });
}

export function kieRequest<T>(
  transport: Transport,
  opts: KieRequestOptions
): Promise<T>;
export function kieRequest<T>(
  url: string,
  opts: LegacyKieRequestOptions
): Promise<T>;
export async function kieRequest<T>(
  target: string | Transport,
  opts: KieRequestOptions | LegacyKieRequestOptions
): Promise<T> {
  if (typeof target !== "string") {
    return await requestWithTransport<T>(target, opts as KieRequestOptions);
  }

  const url = new URL(target);
  const legacyOpts = opts as LegacyKieRequestOptions;
  const transport = createKieTransport({
    baseURL: url.origin,
    apiKey: legacyOpts.apiKey,
    timeout: legacyOpts.timeout,
    doFetch: withTextFallback(legacyOpts.doFetch),
    requestFailedPrefix: "Request failed",
  });

  return await requestWithTransport<T>(transport, {
    method: legacyOpts.method,
    path: `${url.pathname}${url.search}`,
    body: legacyOpts.body,
    signal: legacyOpts.signal,
  });
}
