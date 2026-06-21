import { attachExamples } from "./example";
import { SimpleFunctionsError } from "./types";
import type { z } from "zod";
import type {
  SimpleFunctionsCandlesRequest,
  SimpleFunctionsCandlesResponse,
  SimpleFunctionsDataMarket,
  SimpleFunctionsDataNamespace,
  SimpleFunctionsFeaturedMarketsRequest,
  SimpleFunctionsHeartbeatResponse,
  SimpleFunctionsMarketsRequest,
  SimpleFunctionsMarketsResponse,
  SimpleFunctionsMoversRequest,
  SimpleFunctionsMoversResponse,
  SimpleFunctionsOrderbookResponse,
  SimpleFunctionsProvider,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsQueryResponse,
  SimpleFunctionsOptions,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsSearchResponse,
  SimpleFunctionsSnapshotResponse,
  SimpleFunctionsStrict,
  SimpleFunctionsTradesRequest,
  SimpleFunctionsTradesResponse,
} from "./types";
import {
  SimpleFunctionsCandlesRequestSchema,
  SimpleFunctionsFeaturedMarketsRequestSchema,
  SimpleFunctionsMarketsRequestSchema,
  SimpleFunctionsMoversRequestSchema,
  SimpleFunctionsNoRequestSchema,
  SimpleFunctionsQueryRequestSchema,
  SimpleFunctionsSearchRequestSchema,
  SimpleFunctionsTickerSchema,
  SimpleFunctionsTradesRequestSchema,
} from "./zod";

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

function parseDataRequest<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw createLocalError(400, issue?.message ?? "Invalid request");
  }
  return parsed.data;
}

function parseTicker(ticker: string): string {
  return parseDataRequest(SimpleFunctionsTickerSchema, ticker).trim();
}

type QueryValue = string | number | boolean | undefined;

function buildQueryParams(params: Record<string, QueryValue>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const query = qs.toString();
  return query ? `?${query}` : "";
}

function strictToQueryValue(value: SimpleFunctionsStrict | undefined): string {
  if (value === undefined) return "";
  if (typeof value === "boolean") return value ? "1" : "0";
  return String(value);
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
  const dataBaseURL = (
    opts.dataBaseURL ?? "https://data.simplefunctions.dev"
  ).replace(/\/+$/, "");
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal,
    requestBaseURL = baseURL
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

      const res = await doFetch(`${requestBaseURL}${path}`, {
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

  // GET https://data.simplefunctions.dev/v1/heartbeat
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const heartbeat = Object.assign(
    async (signal?: AbortSignal): Promise<SimpleFunctionsHeartbeatResponse> => {
      return makeGetRequest<SimpleFunctionsHeartbeatResponse>(
        "/v1/heartbeat",
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsNoRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/markets{query}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const marketsList = Object.assign(
    async (
      req: SimpleFunctionsMarketsRequest = {},
      signal?: AbortSignal
    ): Promise<SimpleFunctionsMarketsResponse> => {
      const parsed = parseDataRequest(SimpleFunctionsMarketsRequestSchema, req);
      const query = buildQueryParams({
        q: parsed.q?.trim(),
        venue: parsed.venue,
      });
      return makeGetRequest<SimpleFunctionsMarketsResponse>(
        `/v1/markets${query}`,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsMarketsRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/markets/featured{query}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const featured = Object.assign(
    async (
      req: SimpleFunctionsFeaturedMarketsRequest = {},
      signal?: AbortSignal
    ): Promise<SimpleFunctionsMarketsResponse> => {
      const parsed = parseDataRequest(
        SimpleFunctionsFeaturedMarketsRequestSchema,
        req
      );
      const query = buildQueryParams({
        n: parsed.n,
      });
      return makeGetRequest<SimpleFunctionsMarketsResponse>(
        `/v1/markets/featured${query}`,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsFeaturedMarketsRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/markets/{ticker}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const marketRetrieve = Object.assign(
    async (
      ticker: string,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsDataMarket> => {
      ticker = parseTicker(ticker);
      return makeGetRequest<SimpleFunctionsDataMarket>(
        `/v1/markets/${encodeURIComponent(ticker)}`,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsTickerSchema }
  );

  const markets = Object.assign(marketsList, {
    featured,
    retrieve: marketRetrieve,
  });

  // GET https://data.simplefunctions.dev/v1/search{query}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const search = Object.assign(
    async (
      req: SimpleFunctionsSearchRequest,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsSearchResponse> => {
      const parsed = parseDataRequest(SimpleFunctionsSearchRequestSchema, req);
      const query = buildQueryParams({
        q: parsed.q.trim(),
        limit: parsed.limit,
        venue: parsed.venue,
        strict: strictToQueryValue(parsed.strict),
      });
      return makeGetRequest<SimpleFunctionsSearchResponse>(
        `/v1/search${query}`,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsSearchRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/snapshot
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const snapshot = Object.assign(
    async (signal?: AbortSignal): Promise<SimpleFunctionsSnapshotResponse> => {
      return makeGetRequest<SimpleFunctionsSnapshotResponse>(
        "/v1/snapshot",
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsNoRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/movers{query}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const movers = Object.assign(
    async (
      req: SimpleFunctionsMoversRequest = {},
      signal?: AbortSignal
    ): Promise<SimpleFunctionsMoversResponse> => {
      const parsed = parseDataRequest(SimpleFunctionsMoversRequestSchema, req);
      const query = buildQueryParams({
        window: parsed.window,
        n: parsed.n,
        minVol: parsed.minVol,
        dir: parsed.dir,
      });
      return makeGetRequest<SimpleFunctionsMoversResponse>(
        `/v1/movers${query}`,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsMoversRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/orderbook/{ticker}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const orderbook = Object.assign(
    async (
      ticker: string,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsOrderbookResponse> => {
      ticker = parseTicker(ticker);
      return makeGetRequest<SimpleFunctionsOrderbookResponse>(
        `/v1/orderbook/${encodeURIComponent(ticker)}`,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsTickerSchema }
  );

  // GET https://data.simplefunctions.dev/v1/candles/{ticker}{query}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const candles = Object.assign(
    async (
      ticker: string,
      req: SimpleFunctionsCandlesRequest = {},
      signal?: AbortSignal
    ): Promise<SimpleFunctionsCandlesResponse> => {
      ticker = parseTicker(ticker);
      const parsed = parseDataRequest(SimpleFunctionsCandlesRequestSchema, req);
      const query = buildQueryParams({
        tf: parsed.tf,
        limit: parsed.limit,
      });
      return makeGetRequest<SimpleFunctionsCandlesResponse>(
        `/v1/candles/${encodeURIComponent(ticker)}${query}`,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsCandlesRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/trades/{ticker}{query}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const trades = Object.assign(
    async (
      ticker: string,
      req: SimpleFunctionsTradesRequest = {},
      signal?: AbortSignal
    ): Promise<SimpleFunctionsTradesResponse> => {
      ticker = parseTicker(ticker);
      const parsed = parseDataRequest(SimpleFunctionsTradesRequestSchema, req);
      const query = buildQueryParams({
        limit: parsed.limit,
      });
      return makeGetRequest<SimpleFunctionsTradesResponse>(
        `/v1/trades/${encodeURIComponent(ticker)}${query}`,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsTradesRequestSchema }
  );

  const api = {
    public: {
      query,
    },
  };
  const data: SimpleFunctionsDataNamespace = {
    v1: {
      heartbeat,
      markets,
      search,
      snapshot,
      movers,
      orderbook,
      candles,
      trades,
    },
  };

  return attachExamples({
    api,
    data,
    get: {
      api,
      data,
    },
  });
}
