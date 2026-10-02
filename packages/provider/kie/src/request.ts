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
  /**
   * Set for an endpoint that speaks an upstream vendor's protocol through KIE
   * (the `/anthropic`, `/openai` and `/xai` agent proxies). KIE can still
   * answer such a call with its own business envelope as HTTP 200,
   * `{ "code": 401, "msg": "…" }`. When `code` is a number other than 200,
   * `msg` is a string and this predicate finds none of the endpoint's success
   * payload, the call rejects with a `KieError` whose status is that `code`.
   */
  hasPayload?: (body: Record<string, unknown>) => boolean;
  /**
   * Set for a native KIE endpoint that answers success and failure alike as
   * HTTP 200 with the envelope `{ code, msg, data }` (the `/api/v1/models`
   * discovery GETs of the kie-models skill). The call resolves only when
   * `code` is 200 and this predicate accepts the object in `data`. Any other
   * numeric `code` rejects with a `KieError` whose status is that `code`,
   * whatever `data` holds, and a success envelope without its payload
   * rejects with status 500.
   */
  envelopeData?: (data: Record<string, unknown>) => boolean;
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

    // Not Anthropic-shaped: fall back to KIE's own `{ code, msg }` envelope.
    return parseKieErrorBody(errorPrefix)(status, body);
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

function throwIfKieEnvelope(
  body: unknown,
  hasPayload: (body: Record<string, unknown>) => boolean
): void {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return;
  const record = body as Record<string, unknown>;
  if (typeof record.code !== "number" || record.code === 200) return;
  if (typeof record.msg !== "string") return;
  if (hasPayload(record)) return;
  throw new KieError(
    `Kie API error ${record.code}: ${record.msg}`,
    record.code,
    body,
    codeToString(record.code)
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function requireKieEnvelopeData(
  body: unknown,
  hasData: (data: Record<string, unknown>) => boolean
): void {
  const envelope = asRecord(body);
  const code = envelope?.code;
  if (typeof code === "number" && code !== 200) {
    const msg = typeof envelope?.msg === "string" ? `: ${envelope.msg}` : "";
    throw new KieError(
      `Kie API error ${code}${msg}`,
      code,
      body,
      codeToString(code)
    );
  }
  const data = asRecord(envelope?.data);
  if (code === 200 && data && hasData(data)) return;
  throw new KieError(
    "Kie API error: the response is missing its payload",
    500,
    body
  );
}

async function requestWithTransport<T>(
  transport: Transport,
  opts: KieRequestOptions
): Promise<T> {
  const body =
    opts.method === "GET"
      ? await transport.getJson<T>(opts.path, { signal: opts.signal })
      : await transport.postJson<T>(opts.path, opts.body, {
          signal: opts.signal,
        });
  if (opts.hasPayload) throwIfKieEnvelope(body, opts.hasPayload);
  if (opts.envelopeData) requireKieEnvelopeData(body, opts.envelopeData);
  return body;
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
