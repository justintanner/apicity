import { ElevenLabsError, ElevenLabsDocsRedirectResponse } from "./types";

export interface ElevenLabsContextConfig {
  apiKey: string;
  baseURL: string;
  doFetch: typeof fetch;
  timeout: number;
}

// Shared request/transport helpers for every ElevenLabs endpoint module. The
// factory closes over the resolved config and returns the helper surface each
// per-area module destructures. Error/abort formatting stays private here.
export function createElevenLabsContext(cfg: ElevenLabsContextConfig) {
  const { apiKey, baseURL, doFetch, timeout } = cfg;

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
      return;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  // ElevenLabs returns either FastAPI 422 `{ detail: [{loc,msg,type}, ...] }` or
  // the wider `{ detail: { status, message } }` shape. Surface whichever the
  // server sent so the caller sees the real reason.
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string };
        if (first?.msg) {
          return `ElevenLabs API error ${status}: ${first.msg}`;
        }
      }
      if (typeof detail === "object" && detail !== null) {
        const d = detail as { message?: string; status?: string };
        if (d.message) {
          return `ElevenLabs API error ${status}: ${d.message}`;
        }
      }
      if (typeof detail === "string") {
        return `ElevenLabs API error ${status}: ${detail}`;
      }
    }
    return `ElevenLabs API error: ${status}`;
  }

  function extractErrorCode(body: unknown): string | undefined {
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "object" && detail !== null) {
        const d = detail as { status?: string };
        if (typeof d.status === "string") return d.status;
      }
    }
    return undefined;
  }

  async function makeBinaryRequest(
    path: string,
    body: unknown,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

    try {
      const res = await doFetch(`${baseURL}${path}${qs}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  // GET variant of makeBinaryRequest: fetches an endpoint that responds with
  // raw bytes (e.g. the conversation audio recording) and returns the buffer.
  async function makeGetBinaryRequest(
    path: string,
    queryString = "",
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}${queryString}`, {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeTextRequest(
    method: "GET",
    path: string,
    signal?: AbortSignal,
    queryString = ""
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}${queryString}`, {
        method,
        headers: {
          "xi-api-key": apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeTextBodyRequest(
    method: "POST",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        "xi-api-key": apiKey,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeJsonRequest<T>(
    method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT",
    path: string,
    body?: unknown,
    signal?: AbortSignal,
    queryString = ""
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        "xi-api-key": apiKey,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}${queryString}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  // Like makeJsonRequest, but tolerates an empty success body (HTTP 204 / 200
  // with no content), which the agent DELETE endpoint returns. Parses JSON when
  // present, otherwise resolves to an empty object.
  async function makeJsonRequestAllowEmpty<T>(
    method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT",
    path: string,
    body?: unknown,
    signal?: AbortSignal,
    queryString = ""
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        "xi-api-key": apiKey,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}${queryString}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      const text = await res.text();
      return (text ? JSON.parse(text) : {}) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeMultipartJsonRequest<T>(
    path: string,
    form: FormData,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<T> {
    return makeMultipartJsonRequestWithMethod(
      "POST",
      path,
      form,
      query,
      signal
    );
  }

  async function makeMultipartJsonRequestWithMethod<T>(
    method: "POST" | "PATCH",
    path: string,
    form: FormData,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

    try {
      const res = await doFetch(`${baseURL}${path}${qs}`, {
        method,
        headers: {
          "xi-api-key": apiKey,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  // Like makeMultipartJsonRequest, but for endpoints that respond with raw
  // audio bytes (e.g. the speech-to-speech voice changer) — uploads a multipart
  // form and returns the response buffer.
  async function makeMultipartBinaryRequest(
    path: string,
    form: FormData,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

    try {
      const res = await doFetch(`${baseURL}${path}${qs}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeRedirectRequest(
    method: "GET",
    path: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDocsRedirectResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method,
        headers: {
          "xi-api-key": apiKey,
        },
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok && (res.status < 300 || res.status >= 400)) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return {
        status: res.status,
        location: res.headers.get("location"),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  function appendFormField(form: FormData, key: string, value: unknown): void {
    if (value === undefined || value === null) return;
    if (value instanceof Blob) {
      form.append(key, value);
      return;
    }
    if (typeof value === "string") {
      form.append(key, value);
      return;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      form.append(key, String(value));
      return;
    }
    form.append(key, JSON.stringify(value));
  }

  function optionalQuery(
    pairs: Record<string, string | undefined>
  ): Record<string, string> | undefined {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(pairs)) {
      if (value !== undefined) {
        query[key] = value;
      }
    }
    return Object.keys(query).length > 0 ? query : undefined;
  }

  // Parse a newline-delimited JSON (NDJSON) response body into an array of
  // chunk objects. The streaming text-to-speech-with-timestamps endpoint emits
  // one JSON object per line as audio is generated.
  function decodeNdjson<T>(buffer: ArrayBuffer): T[] {
    const text = new TextDecoder().decode(buffer);
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as T);
  }

  function buildQueryString(params: object): string {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null) {
            query.append(key, String(item));
          }
        }
        continue;
      }
      query.append(key, String(value));
    }

    const serialized = query.toString();
    return serialized ? `?${serialized}` : "";
  }

  return {
    makeBinaryRequest,
    makeGetBinaryRequest,
    makeTextRequest,
    makeTextBodyRequest,
    makeJsonRequest,
    makeJsonRequestAllowEmpty,
    makeMultipartJsonRequest,
    makeMultipartJsonRequestWithMethod,
    makeMultipartBinaryRequest,
    makeRedirectRequest,
    appendFormField,
    optionalQuery,
    decodeNdjson,
    buildQueryString,
  };
}

export type ElevenLabsContext = ReturnType<typeof createElevenLabsContext>;
