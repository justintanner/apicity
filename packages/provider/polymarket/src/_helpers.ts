// ---------------------------------------------------------------------------
// Internal request helpers shared between per-host sub-factories.
// Each per-host factory (clob.ts, gamma.ts, ...) declares its own `baseURL`
// and constructs full URLs locally; the helpers here only handle the
// timeout / abort / error / parse pipeline so they don't need to know the
// host. Keeping helpers pure also lets the endpoint-walker correctly resolve
// each sub-factory's baseURL via its own factory body.
// ---------------------------------------------------------------------------

import { PolymarketError } from "./types";

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

export interface PolymarketRequestHelpers {
  makeGetRequest<T>(url: string, signal?: AbortSignal): Promise<T>;
  makeGetTextRequest(url: string, signal?: AbortSignal): Promise<string>;
  makeJsonRequest<T>(
    url: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T>;
}

export function createRequestHelpers(
  doFetch: typeof fetch,
  timeout: number
): PolymarketRequestHelpers {
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
      return (await res.json()) as T;
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
      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PolymarketError) throw error;
      throw new PolymarketError(`Polymarket request failed: ${error}`, 500);
    }
  }

  return { makeGetRequest, makeGetTextRequest, makeJsonRequest };
}
