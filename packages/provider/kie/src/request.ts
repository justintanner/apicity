import { KieError } from "./types";

export async function kieRequest<T>(
  url: string,
  opts: {
    method: "GET" | "POST";
    apiKey: string;
    body?: unknown;
    timeout: number;
    doFetch: typeof fetch;
    signal?: AbortSignal;
  }
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    };

    const init: RequestInit = {
      method: opts.method,
      headers,
      signal: controller.signal,
    };

    if (opts.body !== undefined) {
      init.body = JSON.stringify(opts.body);
    }

    const res = await opts.doFetch(url, init);

    clearTimeout(timeoutId);

    if (!res.ok) {
      let message = `Kie API error: ${res.status}`;
      let body: unknown = null;
      try {
        body = await res.json();
        if (
          typeof body === "object" &&
          body !== null &&
          "msg" in body &&
          typeof (body as { msg?: string }).msg === "string"
        ) {
          message = `Kie API error ${res.status}: ${(body as { msg: string }).msg}`;
        }
      } catch {
        // ignore parse errors
      }
      throw new KieError(message, res.status, body);
    }

    return (await res.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof KieError) throw error;
    throw new KieError(`Request failed: ${error}`, 500);
  }
}
