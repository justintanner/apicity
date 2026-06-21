import { attachExamples } from "./example";
import { SimpleFunctionsError } from "./types";
import type {
  SimpleFunctionsProvider,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsQueryResponse,
  SimpleFunctionsOptions,
} from "./types";
import { SimpleFunctionsQueryRequestSchema } from "./zod";

interface SimpleFunctionsErrorBody {
  error?: string;
  message?: string;
}

function isErrorBody(value: unknown): value is SimpleFunctionsErrorBody {
  return typeof value === "object" && value !== null;
}

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
  if (isErrorBody(body)) {
    const error = body.error ?? body.message;
    if (error) {
      return `SimpleFunctions API error ${status}: ${error}`;
    }
  }
  return `SimpleFunctions API error: ${status}`;
}

function createLocalError(
  status: number,
  message: string
): SimpleFunctionsError {
  return new SimpleFunctionsError(
    formatErrorMessage(status, { error: message }),
    status,
    {
      error: message,
    }
  );
}

function parseRequest(
  req: SimpleFunctionsQueryRequest,
  apiKey?: string
): SimpleFunctionsQueryRequest {
  const parsed = SimpleFunctionsQueryRequestSchema.safeParse(req);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message =
      issue?.message ?? 'Query parameter "q" is required (min 2 chars)';
    throw createLocalError(400, message);
  }

  if (parsed.data.model && parsed.data.model !== "cheap" && !apiKey) {
    throw createLocalError(
      401,
      "Custom model tier requires a valid API key. Add header: Authorization: Bearer sf_live_xxx"
    );
  }

  return { ...parsed.data, q: parsed.data.q.trim() };
}

function buildQuery(req: SimpleFunctionsQueryRequest): string {
  const qs = new URLSearchParams();
  qs.set("q", req.q);
  if (req.mode) qs.set("mode", req.mode);
  if (req.sources) qs.set("sources", req.sources.join(","));
  if (req.limit !== undefined) qs.set("limit", String(req.limit));
  if (req.model) qs.set("model", req.model);
  if (req.depth !== undefined) qs.set("depth", String(req.depth));
  if (req.nextActions) qs.set("nextActions", req.nextActions);
  return `?${qs.toString()}`;
}

export function createSimpleFunctions(
  opts: SimpleFunctionsOptions = {}
): SimpleFunctionsProvider {
  const baseURL = (opts.baseURL ?? "https://simplefunctions.dev").replace(
    /\/+$/,
    ""
  );
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {};
      if (opts.apiKey) {
        headers.Authorization = `Bearer ${opts.apiKey}`;
      }

      const res = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new SimpleFunctionsError(
          formatErrorMessage(res.status, body),
          res.status,
          body
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof SimpleFunctionsError) throw error;
      throw new SimpleFunctionsError(
        `SimpleFunctions request failed: ${error}`,
        500
      );
    }
  }

  // GET https://simplefunctions.dev/api/public/query{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/query
  const query = Object.assign(
    async (
      req: SimpleFunctionsQueryRequest,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsQueryResponse> => {
      const parsed = parseRequest(req, opts.apiKey);
      const query = buildQuery(parsed);
      return makeGetRequest<SimpleFunctionsQueryResponse>(
        `/api/public/query${query}`,
        signal
      );
    },
    { schema: SimpleFunctionsQueryRequestSchema }
  );

  const api = {
    public: {
      query,
    },
  };

  return attachExamples({
    api,
    get: {
      api,
    },
  });
}
