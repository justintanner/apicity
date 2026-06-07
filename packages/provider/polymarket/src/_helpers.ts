// ---------------------------------------------------------------------------
// Internal request helpers shared between per-host sub-factories.
// Each per-host factory (clob.ts, gamma.ts, ...) declares its own `baseURL`
// and constructs full URLs locally; the helpers here only handle the
// timeout / abort / error / parse pipeline so they don't need to know the
// host. Keeping helpers pure also lets the endpoint-walker correctly resolve
// each sub-factory's baseURL via its own factory body.
// ---------------------------------------------------------------------------

import { PolymarketError } from "./types";
import type {
  PolymarketClobApiCredentials,
  PolymarketClobL1Headers,
  PolymarketClobL2Headers,
  PolymarketOptions,
} from "./zod";

type AuthenticatedMethod = "GET" | "POST" | "PUT" | "DELETE";

export function attachAbortHandler(
  signal: AbortSignal,
  controller: AbortController
): void {
  if (signal.aborted) {
    controller.abort();
    return;
  }
  signal.addEventListener("abort", () => controller.abort(), { once: true });
}

// Polymarket's APIs return errors with several shapes — Gamma typically
// returns `{ error }` or `{ message }`, CLOB returns `{ error }` or a plain
// string, Data API returns `{ message }`. Surface whatever string the
// server provided rather than a generic "Polymarket API error: 500".
export function formatErrorMessage(status: number, body: unknown): string {
  if (typeof body === "string" && body.length > 0) {
    return `Polymarket API error ${status}: ${body}`;
  }
  if (typeof body === "object" && body !== null) {
    const b = body as { error?: string; message?: string };
    if (typeof b.error === "string" && b.error.length > 0) {
      return `Polymarket API error ${status}: ${b.error}`;
    }
    if (typeof b.message === "string" && b.message.length > 0) {
      return `Polymarket API error ${status}: ${b.message}`;
    }
  }
  return `Polymarket API error: ${status}`;
}

export async function readErrorBody(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      return await res.json();
    }
    return await res.text();
  } catch {
    return null;
  }
}

async function readSuccessBody<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (text.length === 0) {
    return undefined as T;
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return JSON.parse(text) as T;
  }
  return text as T;
}

export interface PolymarketRequestHelpers {
  makeGetRequest<T>(url: string, signal?: AbortSignal): Promise<T>;
  makeGetTextRequest(url: string, signal?: AbortSignal): Promise<string>;
  makeJsonRequest<T>(
    url: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T>;
  makeAuthenticatedRequest<T>(
    method: AuthenticatedMethod,
    url: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T>;
  makeL1Request<T>(
    method: "GET" | "POST",
    url: string,
    headers?: PolymarketClobL1Headers,
    signal?: AbortSignal
  ): Promise<T>;
}

export function createRequestHelpers(
  doFetch: typeof fetch,
  timeout: number,
  opts: PolymarketOptions = {}
): PolymarketRequestHelpers {
  function credentialsFromOptions(): PolymarketClobApiCredentials | null {
    if (opts.clobApiCredentials) return opts.clobApiCredentials;
    if (opts.clobApiKey && opts.clobApiSecret && opts.clobApiPassphrase) {
      return {
        key: opts.clobApiKey,
        secret: opts.clobApiSecret,
        passphrase: opts.clobApiPassphrase,
      };
    }
    return null;
  }

  function requestPath(url: string): string {
    const u = new URL(url);
    return u.pathname;
  }

  function normalizeL1Headers(
    headers?: PolymarketClobL1Headers
  ): Record<string, string> {
    const h = headers ?? opts.clobL1Headers;
    if (!h) {
      throw new PolymarketError(
        "Polymarket CLOB L1 headers are required for this endpoint",
        401
      );
    }
    return {
      POLY_ADDRESS: h.address,
      POLY_SIGNATURE: h.signature,
      POLY_TIMESTAMP: String(h.timestamp),
      POLY_NONCE: String(h.nonce ?? 0),
    };
  }

  function normalizeL2Headers(
    headers: PolymarketClobL2Headers
  ): Record<string, string> {
    return {
      POLY_ADDRESS: headers.address,
      POLY_SIGNATURE: headers.signature,
      POLY_TIMESTAMP: String(headers.timestamp),
      POLY_API_KEY: headers.apiKey,
      POLY_PASSPHRASE: headers.passphrase,
    };
  }

  async function l2HeadersFor(
    method: AuthenticatedMethod,
    url: string,
    body?: string
  ): Promise<Record<string, string>> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = requestPath(url);
    if (opts.clobL2HeaderSigner) {
      return normalizeL2Headers(
        await opts.clobL2HeaderSigner({
          method,
          requestPath: path,
          body,
          timestamp,
        })
      );
    }

    const creds = credentialsFromOptions();
    if (!creds || !opts.clobAddress) {
      throw new PolymarketError(
        "Polymarket CLOB L2 credentials and clobAddress are required",
        401
      );
    }

    const signature = await buildPolyHmacSignature(
      creds.secret,
      timestamp,
      method,
      path,
      body
    );
    return {
      POLY_ADDRESS: opts.clobAddress,
      POLY_SIGNATURE: signature,
      POLY_TIMESTAMP: String(timestamp),
      POLY_API_KEY: creds.key,
      POLY_PASSPHRASE: creds.passphrase,
    };
  }

  async function makeRawRequest<T>(
    url: string,
    init: RequestInit,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) attachAbortHandler(signal, controller);

    try {
      const res = await doFetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const resBody = await readErrorBody(res);
        throw new PolymarketError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }
      return await readSuccessBody<T>(res);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PolymarketError) throw error;
      throw new PolymarketError(`Polymarket request failed: ${error}`, 500);
    }
  }

  async function makeGetRequest<T>(
    url: string,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) attachAbortHandler(signal, controller);

    try {
      const res = await doFetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const resBody = await readErrorBody(res);
        throw new PolymarketError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }
      return await readSuccessBody<T>(res);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PolymarketError) throw error;
      throw new PolymarketError(`Polymarket request failed: ${error}`, 500);
    }
  }

  async function makeGetTextRequest(
    url: string,
    signal?: AbortSignal
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) attachAbortHandler(signal, controller);

    try {
      const res = await doFetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const resBody = await readErrorBody(res);
        throw new PolymarketError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }
      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PolymarketError) throw error;
      throw new PolymarketError(`Polymarket request failed: ${error}`, 500);
    }
  }

  // Walker hint: this function is named `makeJsonRequest` so the
  // endpoint-walker resolves it as POST (per the HELPER_METHOD_HINTS map in
  // scripts/lib/endpoint-walk.mjs).
  async function makeJsonRequest<T>(
    url: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) attachAbortHandler(signal, controller);

    try {
      const res = await doFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const resBody = await readErrorBody(res);
        throw new PolymarketError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }
      return await readSuccessBody<T>(res);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PolymarketError) throw error;
      throw new PolymarketError(`Polymarket request failed: ${error}`, 500);
    }
  }

  async function makeAuthenticatedRequest<T>(
    method: AuthenticatedMethod,
    url: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const bodyText = body === undefined ? undefined : JSON.stringify(body);
    const authHeaders = await l2HeadersFor(method, url, bodyText);
    return makeRawRequest<T>(
      url,
      {
        method,
        headers: {
          ...authHeaders,
          ...(bodyText ? { "Content-Type": "application/json" } : {}),
        },
        ...(bodyText ? { body: bodyText } : {}),
      },
      signal
    );
  }

  async function makeL1Request<T>(
    method: "GET" | "POST",
    url: string,
    headers?: PolymarketClobL1Headers,
    signal?: AbortSignal
  ): Promise<T> {
    return makeRawRequest<T>(
      url,
      {
        method,
        headers: normalizeL1Headers(headers),
      },
      signal
    );
  }

  return {
    makeGetRequest,
    makeGetTextRequest,
    makeJsonRequest,
    makeAuthenticatedRequest,
    makeL1Request,
  };
}

function replaceAll(s: string, search: string, replacement: string): string {
  return s.split(search).join(replacement);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/[^A-Za-z0-9+/=]/g, "");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function buildPolyHmacSignature(
  secret: string,
  timestamp: number,
  method: string,
  requestPath: string,
  body?: string
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new PolymarketError(
      "Polymarket CLOB HMAC signing requires Web Crypto",
      500
    );
  }

  const keyData = base64ToArrayBuffer(secret);
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const message = `${timestamp}${method}${requestPath}${body ?? ""}`;
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  const base64 = arrayBufferToBase64(signature);
  return replaceAll(replaceAll(base64, "+", "-"), "/", "_");
}
