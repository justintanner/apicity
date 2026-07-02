export interface ParsedErrorBody {
  message: string;
  code?: string;
}

export interface TransportErrorClass<E extends Error> {
  readonly name: string;
  new (message: string, status: number, body?: unknown, code?: string): E;
}

export interface TransportConfig<E extends Error> {
  baseUrl: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  defaultHeaders: () => Record<string, string>;
  parseErrorBody: (
    status: number,
    body: unknown,
    text: string
  ) => ParsedErrorBody;
  errorClass: TransportErrorClass<E>;
  requestFailedPrefix?: string;
}

export interface TransportCallOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface RawRequestOptions extends TransportCallOptions {
  method?: string;
  body?: BodyInit | null;
}

export interface Transport {
  postJson<T>(
    path: string,
    body: unknown,
    opts?: TransportCallOptions
  ): Promise<T>;
  getJson<T>(path: string, opts?: TransportCallOptions): Promise<T>;
  del<T>(path: string, opts?: TransportCallOptions): Promise<T>;
  emptyPost(path: string, opts?: TransportCallOptions): Promise<void>;
  postForm<T>(
    path: string,
    body: BodyInit,
    opts?: TransportCallOptions
  ): Promise<T>;
  getText(path: string, opts?: TransportCallOptions): Promise<string>;
  getBinary(path: string, opts?: TransportCallOptions): Promise<ArrayBuffer>;
  raw(path: string, opts?: RawRequestOptions): Promise<Response>;
}

// Helper function to safely handle AbortSignal across different environments
export function attachAbortHandler(
  signal: AbortSignal | undefined,
  controller: AbortController
): void {
  if (!signal) return;

  if (signal.aborted) {
    controller.abort();
    return;
  }

  // Handle both standard AbortSignal and node-fetch's AbortSignal
  if (typeof signal.addEventListener === "function") {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
}

function providerName(errorClassName: string): string {
  return errorClassName.endsWith("Error")
    ? errorClassName.slice(0, -"Error".length)
    : errorClassName;
}

function mergeHeaders(
  defaults: Record<string, string>,
  methodHeaders: Record<string, string>,
  callHeaders: Record<string, string> | undefined
): Record<string, string> {
  return {
    ...defaults,
    ...methodHeaders,
    ...(callHeaders ?? {}),
  };
}

function parseJson(text: string): unknown {
  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function createTransport<E extends Error>(
  cfg: TransportConfig<E>
): Transport {
  const doFetch = cfg.fetchImpl ?? fetch;
  const requestFailedPrefix =
    cfg.requestFailedPrefix ??
    `${providerName(cfg.errorClass.name)} request failed`;

  async function parseError(res: Response): Promise<E> {
    const text = await res.text();
    const body = parseJson(text);
    const parsed = cfg.parseErrorBody(res.status, body, text);
    return new cfg.errorClass(parsed.message, res.status, body, parsed.code);
  }

  async function request(
    path: string,
    init: RequestInit,
    opts: TransportCallOptions = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      opts.timeoutMs ?? cfg.timeoutMs
    );
    attachAbortHandler(opts.signal, controller);

    try {
      const res = await doFetch(`${opts.baseUrl ?? cfg.baseUrl}${path}`, {
        ...init,
        headers: mergeHeaders(
          cfg.defaultHeaders(),
          (init.headers ?? {}) as Record<string, string>,
          opts.headers
        ),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw await parseError(res);
      }

      return res;
    } catch (error) {
      if (error instanceof cfg.errorClass) {
        throw error;
      }

      throw new cfg.errorClass(`${requestFailedPrefix}: ${error}`, 500, null);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function wrapFailure<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof cfg.errorClass) {
        throw error;
      }

      throw new cfg.errorClass(`${requestFailedPrefix}: ${error}`, 500, null);
    }
  }

  return {
    async postJson<T>(
      path: string,
      body: unknown,
      opts?: TransportCallOptions
    ): Promise<T> {
      return await wrapFailure(async () => {
        const res = await request(
          path,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
          opts
        );
        return (await res.json()) as T;
      });
    },

    async getJson<T>(path: string, opts?: TransportCallOptions): Promise<T> {
      return await wrapFailure(async () => {
        const res = await request(path, { method: "GET" }, opts);
        return (await res.json()) as T;
      });
    },

    async del<T>(path: string, opts?: TransportCallOptions): Promise<T> {
      return await wrapFailure(async () => {
        const res = await request(path, { method: "DELETE" }, opts);
        return (await res.json()) as T;
      });
    },

    async emptyPost(path: string, opts?: TransportCallOptions): Promise<void> {
      await request(path, { method: "POST" }, opts);
    },

    async postForm<T>(
      path: string,
      body: BodyInit,
      opts?: TransportCallOptions
    ): Promise<T> {
      return await wrapFailure(async () => {
        const res = await request(path, { method: "POST", body }, opts);
        return (await res.json()) as T;
      });
    },

    async getText(path: string, opts?: TransportCallOptions): Promise<string> {
      return await wrapFailure(async () => {
        const res = await request(path, { method: "GET" }, opts);
        return await res.text();
      });
    },

    async getBinary(
      path: string,
      opts?: TransportCallOptions
    ): Promise<ArrayBuffer> {
      return await wrapFailure(async () => {
        const res = await request(path, { method: "GET" }, opts);
        return await res.arrayBuffer();
      });
    },

    async raw(path: string, opts: RawRequestOptions = {}): Promise<Response> {
      return await request(
        path,
        {
          method: opts.method ?? "GET",
          body: opts.body,
          headers: opts.headers,
        },
        opts
      );
    },
  };
}
