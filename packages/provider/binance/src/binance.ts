import { BinanceError } from "./types";
import type {
  BinanceOptions,
  BinancePingResponse,
  BinanceProvider,
} from "./types";

export function createBinance(opts?: BinanceOptions): BinanceProvider {
  const baseURL = (opts?.baseURL ?? "https://api.binance.com").replace(
    /\/+$/,
    ""
  );
  const doFetch = opts?.fetch ?? fetch;
  const timeout = opts?.timeout ?? 30000;

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

  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      const b = body as { msg?: string; message?: string; code?: number };
      if (b.msg) {
        return `Binance API error ${status}: ${b.msg}`;
      }
      if (b.message) {
        return `Binance API error ${status}: ${b.message}`;
      }
    }
    return `Binance API error: ${status}`;
  }

  function errorCode(body: unknown): string | undefined {
    if (typeof body === "object" && body !== null) {
      const code = (body as { code?: number | string }).code;
      if (typeof code === "number" || typeof code === "string") {
        return String(code);
      }
    }
    return undefined;
  }

  async function makeJsonRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {};
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (opts?.apiKey) {
        headers["X-MBX-APIKEY"] = opts.apiKey;
      }

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
        throw new BinanceError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          errorCode(resBody)
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof BinanceError) throw error;
      throw new BinanceError(`Binance request failed: ${error}`, 500);
    }
  }

  // GET https://api.binance.com/api/v3/ping
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#test-connectivity
  const ping = Object.assign(
    async (signal?: AbortSignal): Promise<BinancePingResponse> => {
      return makeJsonRequest<BinancePingResponse>(
        "GET",
        "/api/v3/ping",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const api = {
    v3: {
      ping,
    },
  };

  return {
    api,
    get: {
      api,
    },
  };
}
