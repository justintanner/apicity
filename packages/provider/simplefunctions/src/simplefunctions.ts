import type { z } from "zod";
import { attachExamples } from "./example";
import { SimpleFunctionsError } from "./types";
import type {
  SimpleFunctionsAgentFeedRequest,
  SimpleFunctionsBillRequest,
  SimpleFunctionsBriefingRequest,
  SimpleFunctionsCalendarRequest,
  SimpleFunctionsCalibrationRequest,
  SimpleFunctionsCandlesRequest,
  SimpleFunctionsCandlesResponse,
  SimpleFunctionsChangesRequest,
  SimpleFunctionsCongressMemberRequest,
  SimpleFunctionsCongressMembersRequest,
  SimpleFunctionsContextRequest,
  SimpleFunctionsContagionRequest,
  SimpleFunctionsCrossVenueRequest,
  SimpleFunctionsDataMarket,
  SimpleFunctionsDataNamespace,
  SimpleFunctionsDiscussRequest,
  SimpleFunctionsEconQueryRequest,
  SimpleFunctionsEdgesRequest,
  SimpleFunctionsEmptyRequest,
  SimpleFunctionsFeaturedMarketsRequest,
  SimpleFunctionsFredRequest,
  SimpleFunctionsGovQueryRequest,
  SimpleFunctionsHeartbeatResponse,
  SimpleFunctionsIdeaRequest,
  SimpleFunctionsIndexHistoryRequest,
  SimpleFunctionsInspectRequest,
  SimpleFunctionsInspectResponse,
  SimpleFunctionsInspectResult,
  SimpleFunctionsLegislationRequest,
  SimpleFunctionsMarketCandlesRequest,
  SimpleFunctionsMarketDetailRequest,
  SimpleFunctionsMarketsRequest,
  SimpleFunctionsMarketsResponse,
  SimpleFunctionsMicrostructureHistoryRequest,
  SimpleFunctionsMoversRequest,
  SimpleFunctionsMoversResponse,
  SimpleFunctionsOddsRequest,
  SimpleFunctionsOptions,
  SimpleFunctionsOrderbookResponse,
  SimpleFunctionsProvider,
  SimpleFunctionsPublicListRequest,
  SimpleFunctionsPublicSearchRequest,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsQueryResponse,
  SimpleFunctionsRegimeScanRequest,
  SimpleFunctionsScanRequest,
  SimpleFunctionsScreenByTickersRequest,
  SimpleFunctionsScreenRequest,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsSearchResponse,
  SimpleFunctionsSlugRequest,
  SimpleFunctionsSnapshotResponse,
  SimpleFunctionsStrict,
  SimpleFunctionsTickerRequest,
  SimpleFunctionsTradesRequest,
  SimpleFunctionsTradesResponse,
  SimpleFunctionsTopicFeedResponse,
  SimpleFunctionsTopicFeedResult,
  SimpleFunctionsWorldDeltaRequest,
  SimpleFunctionsWorldDeltaResponse,
  SimpleFunctionsWorldDeltaResult,
  SimpleFunctionsWorldPathRequest,
  SimpleFunctionsWorldRequest,
  SimpleFunctionsWorldResponse,
  SimpleFunctionsWorldSnapshotResponse,
  SimpleFunctionsYieldCurveRequest,
} from "./types";
import {
  SimpleFunctionsAgentFeedRequestSchema,
  SimpleFunctionsBillRequestSchema,
  SimpleFunctionsBriefingRequestSchema,
  SimpleFunctionsCalendarRequestSchema,
  SimpleFunctionsCalibrationRequestSchema,
  SimpleFunctionsCandlesRequestSchema,
  SimpleFunctionsChangesRequestSchema,
  SimpleFunctionsCongressMemberRequestSchema,
  SimpleFunctionsCongressMembersRequestSchema,
  SimpleFunctionsContextRequestSchema,
  SimpleFunctionsContagionRequestSchema,
  SimpleFunctionsCrossVenueRequestSchema,
  SimpleFunctionsDiscussRequestSchema,
  SimpleFunctionsEconQueryRequestSchema,
  SimpleFunctionsEdgesRequestSchema,
  SimpleFunctionsEmptyRequestSchema,
  SimpleFunctionsFeaturedMarketsRequestSchema,
  SimpleFunctionsFredRequestSchema,
  SimpleFunctionsGovQueryRequestSchema,
  SimpleFunctionsIdeaRequestSchema,
  SimpleFunctionsIndexHistoryRequestSchema,
  SimpleFunctionsInspectRequestSchema,
  SimpleFunctionsLegislationRequestSchema,
  SimpleFunctionsMarketCandlesRequestSchema,
  SimpleFunctionsMarketDetailRequestSchema,
  SimpleFunctionsMarketsRequestSchema,
  SimpleFunctionsMicrostructureHistoryRequestSchema,
  SimpleFunctionsMoversRequestSchema,
  SimpleFunctionsNoRequestSchema,
  SimpleFunctionsOddsRequestSchema,
  SimpleFunctionsPublicListRequestSchema,
  SimpleFunctionsPublicSearchRequestSchema,
  SimpleFunctionsQueryRequestSchema,
  SimpleFunctionsRegimeScanRequestSchema,
  SimpleFunctionsScanRequestSchema,
  SimpleFunctionsScreenByTickersRequestSchema,
  SimpleFunctionsScreenRequestSchema,
  SimpleFunctionsSearchRequestSchema,
  SimpleFunctionsSlugRequestSchema,
  SimpleFunctionsTickerRequestSchema,
  SimpleFunctionsTickerSchema,
  SimpleFunctionsTradesRequestSchema,
  SimpleFunctionsWorldDeltaRequestSchema,
  SimpleFunctionsWorldPathRequestSchema,
  SimpleFunctionsWorldRequestSchema,
  SimpleFunctionsYieldCurveRequestSchema,
} from "./zod";

interface SimpleFunctionsErrorBody {
  error?: string;
  message?: string;
}

type QueryValue = string | number | boolean | readonly string[] | undefined;

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

function parseWithSchema<T>(schema: z.ZodType<T>, req: unknown): T {
  const parsed = schema.safeParse(req);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message = issue?.message ?? "Invalid SimpleFunctions request";
    throw createLocalError(400, message);
  }
  return parsed.data;
}

function parseOptionalWithSchema<T>(schema: z.ZodType<T>, req: unknown): T {
  return parseWithSchema(schema, req ?? {});
}

function parseRequest(
  req: SimpleFunctionsQueryRequest,
  apiKey?: string
): SimpleFunctionsQueryRequest {
  const parsed = parseWithSchema(SimpleFunctionsQueryRequestSchema, req);

  if (parsed.model && parsed.model !== "cheap" && !apiKey) {
    throw createLocalError(
      401,
      "Custom model tier requires a valid API key. Add header: Authorization: Bearer sf_live_xxx"
    );
  }

  return { ...parsed, q: parsed.q.trim() };
}

function requireApiKey(apiKey: string | undefined, endpoint: string): void {
  if (!apiKey) {
    throw createLocalError(
      401,
      `${endpoint} requires a valid API key. Add header: Authorization: Bearer sf_live_xxx`
    );
  }
}

function addQueryParam(
  qs: URLSearchParams,
  key: string,
  value: QueryValue
): void {
  if (value === undefined || value === "") return;
  if (Array.isArray(value)) {
    if (value.length > 0) qs.set(key, value.join(","));
    return;
  }
  qs.set(key, String(value));
}

function buildQuery(params: Record<string, QueryValue>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    addQueryParam(qs, key, value);
  }
  const query = qs.toString();
  return query ? `?${query}` : "";
}

function buildQueryForQuery(req: SimpleFunctionsQueryRequest): string {
  return buildQuery({
    q: req.q,
    mode: req.mode,
    sources: req.sources,
    limit: req.limit,
    model: req.model,
    depth: req.depth,
    nextActions: req.nextActions,
  });
}

function pathSegments(path: string | string[]): string[] {
  const rawSegments = Array.isArray(path) ? path : path.split("/");
  return rawSegments.map((segment) => segment.trim()).filter(Boolean);
}

function encodePath(path: string | string[]): string {
  const segments = pathSegments(path);
  if (segments.length === 0) {
    throw createLocalError(400, "path is required");
  }
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

function buildListQuery(req: SimpleFunctionsPublicListRequest): string {
  return buildQuery({
    q: req.q,
    category: req.category,
    venue: req.venue,
    limit: req.limit,
    offset: req.offset,
  });
}

function pathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

function parseTicker(ticker: string): string {
  return parseWithSchema(SimpleFunctionsTickerSchema, ticker).trim();
}

function trimWorldRequest(
  req: SimpleFunctionsWorldRequest
): SimpleFunctionsWorldRequest {
  return {
    ...req,
    dt: req.dt?.trim(),
    focus: req.focus?.trim(),
    from: req.from?.trim(),
    item: req.item?.trim(),
    since: req.since?.trim(),
    window: req.window?.trim(),
  };
}

function parseWorldRequest(
  req: SimpleFunctionsWorldRequest = {}
): SimpleFunctionsWorldRequest {
  return trimWorldRequest(
    parseOptionalWithSchema(SimpleFunctionsWorldRequestSchema, req)
  );
}

function parseWorldPathRequest(
  req: SimpleFunctionsWorldPathRequest
): SimpleFunctionsWorldPathRequest {
  const parsed = parseWithSchema(SimpleFunctionsWorldPathRequestSchema, req);
  return {
    ...trimWorldRequest(parsed),
    path: parsed.path,
  };
}

function parseAgentFeedRequest(
  req: SimpleFunctionsAgentFeedRequest
): SimpleFunctionsAgentFeedRequest {
  const parsed = parseWithSchema(SimpleFunctionsAgentFeedRequestSchema, req);
  return {
    ...parsed,
    since: parsed.since?.trim(),
    topic: parsed.topic.trim(),
  };
}

function strictToQueryValue(
  value: SimpleFunctionsStrict | undefined
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value ? "1" : "0";
  return String(value);
}

function buildWorldQuery(req: SimpleFunctionsWorldRequest): string {
  return buildQuery({
    format: req.format,
    compact: req.compact,
    limit: req.limit,
    depth: req.depth,
    since: req.since,
    focus: req.focus,
    op: req.op,
    window: req.window,
    dt: req.dt,
    from: req.from,
    item: req.item,
  });
}

function buildWorldDeltaQuery(req: SimpleFunctionsWorldDeltaRequest): string {
  return buildQuery({
    since: req.since,
    format: req.format,
  });
}

function buildInspectQuery(req: SimpleFunctionsInspectRequest): string {
  return buildQuery({
    format: req.format,
    contagion: req.contagion,
    diff: req.diff,
    trend: req.trend,
    nextActions: req.nextActions,
  });
}

function buildAgentFeedQuery(req: SimpleFunctionsAgentFeedRequest): string {
  return buildQuery({
    since: req.since,
    limit: req.limit,
    format: req.format,
  });
}

function wantsJson(
  format: "json" | "markdown" | undefined,
  defaultJson: boolean
): boolean {
  return format === "json" || (format === undefined && defaultJson);
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

  async function makeJsonRequest<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
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

      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${requestBaseURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new SimpleFunctionsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
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

  async function makeGetTextRequest(
    path: string,
    signal?: AbortSignal,
    requestBaseURL = baseURL
  ): Promise<string> {
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
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new SimpleFunctionsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return await res.text();
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
      const query = buildQueryForQuery(parsed);
      return makeJsonRequest<SimpleFunctionsQueryResponse>(
        "GET",
        `/api/public/query${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsQueryRequestSchema }
  );

  // GET https://simplefunctions.dev/api/agent/world/delta{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/world-state
  const worldDelta = Object.assign(
    async (
      req: SimpleFunctionsWorldDeltaRequest,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsWorldDeltaResult> => {
      const parsed = parseWithSchema(
        SimpleFunctionsWorldDeltaRequestSchema,
        req
      );
      const query = buildWorldDeltaQuery({
        ...parsed,
        since: parsed.since.trim(),
      });
      if (wantsJson(parsed.format, false)) {
        return makeJsonRequest<SimpleFunctionsWorldDeltaResponse>(
          "GET",
          `/api/agent/world/delta${query}`,
          undefined,
          signal
        );
      }
      return makeGetTextRequest(`/api/agent/world/delta${query}`, signal);
    },
    { schema: SimpleFunctionsWorldDeltaRequestSchema }
  );

  // GET https://simplefunctions.dev/api/agent/world/feed
  // Docs: https://docs.simplefunctions.dev/api-reference/world-state
  const worldFeed = Object.assign(
    async (signal?: AbortSignal): Promise<string> => {
      return makeGetTextRequest("/api/agent/world/feed", signal);
    },
    { schema: SimpleFunctionsNoRequestSchema }
  );

  // sig-ok: path helper represents the catch-all /world/{...path} route.
  // GET https://simplefunctions.dev/api/agent/world/{path}{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/world-state
  const worldPath = Object.assign(
    async (
      req: SimpleFunctionsWorldPathRequest,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsWorldResponse> => {
      const parsed = parseWorldPathRequest(req);
      const query = buildWorldQuery(parsed);
      const path = encodePath(parsed.path);
      if (wantsJson(parsed.format, false)) {
        return makeJsonRequest<SimpleFunctionsWorldSnapshotResponse>(
          "GET",
          `/api/agent/world/${path}${query}`,
          undefined,
          signal
        );
      }
      return makeGetTextRequest(`/api/agent/world/${path}${query}`, signal);
    },
    { schema: SimpleFunctionsWorldPathRequestSchema }
  );

  // GET https://simplefunctions.dev/api/agent/world{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/world-state
  const world = Object.assign(
    async (
      req: SimpleFunctionsWorldRequest = {},
      signal?: AbortSignal
    ): Promise<SimpleFunctionsWorldResponse> => {
      const parsed = parseWorldRequest(req);
      const query = buildWorldQuery(parsed);
      if (wantsJson(parsed.format, false)) {
        return makeJsonRequest<SimpleFunctionsWorldSnapshotResponse>(
          "GET",
          `/api/agent/world${query}`,
          undefined,
          signal
        );
      }
      return makeGetTextRequest(`/api/agent/world${query}`, signal);
    },
    {
      schema: SimpleFunctionsWorldRequestSchema,
      delta: worldDelta,
      feed: worldFeed,
      path: worldPath,
    }
  );

  // GET https://simplefunctions.dev/api/agent/inspect/{ticker}{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/agent
  const inspect = Object.assign(
    async (
      req: SimpleFunctionsInspectRequest,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsInspectResult> => {
      const parsed = parseWithSchema(SimpleFunctionsInspectRequestSchema, req);
      const query = buildInspectQuery(parsed);
      const ticker = pathSegment(parsed.ticker.trim());
      if (wantsJson(parsed.format, true)) {
        return makeJsonRequest<SimpleFunctionsInspectResponse>(
          "GET",
          `/api/agent/inspect/${ticker}${query}`,
          undefined,
          signal
        );
      }
      return makeGetTextRequest(`/api/agent/inspect/${ticker}${query}`, signal);
    },
    { schema: SimpleFunctionsInspectRequestSchema }
  );

  // GET https://simplefunctions.dev/api/agent/feed/{topic}{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/agent
  const agentFeed = Object.assign(
    async (
      req: SimpleFunctionsAgentFeedRequest,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsTopicFeedResult> => {
      const parsed = parseAgentFeedRequest(req);
      const query = buildAgentFeedQuery(parsed);
      const topic = parsed.topic;
      if (wantsJson(parsed.format, false)) {
        return makeJsonRequest<SimpleFunctionsTopicFeedResponse>(
          "GET",
          `/api/agent/feed/${encodeURIComponent(topic)}${query}`,
          undefined,
          signal
        );
      }
      return makeGetTextRequest(
        `/api/agent/feed/${encodeURIComponent(topic)}${query}`,
        signal
      );
    },
    { schema: SimpleFunctionsAgentFeedRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/heartbeat
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const heartbeat = Object.assign(
    async (signal?: AbortSignal): Promise<SimpleFunctionsHeartbeatResponse> => {
      return makeJsonRequest<SimpleFunctionsHeartbeatResponse>(
        "GET",
        "/v1/heartbeat",
        undefined,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsNoRequestSchema }
  );

  // GET https://data.simplefunctions.dev/v1/markets{query}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const dataMarketsList = Object.assign(
    async (
      req: SimpleFunctionsMarketsRequest = {},
      signal?: AbortSignal
    ): Promise<SimpleFunctionsMarketsResponse> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsMarketsRequestSchema,
        req
      );
      const query = buildQuery({
        q: parsed.q?.trim(),
        venue: parsed.venue,
      });
      return makeJsonRequest<SimpleFunctionsMarketsResponse>(
        "GET",
        `/v1/markets${query}`,
        undefined,
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
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsFeaturedMarketsRequestSchema,
        req
      );
      const query = buildQuery({
        n: parsed.n,
      });
      return makeJsonRequest<SimpleFunctionsMarketsResponse>(
        "GET",
        `/v1/markets/featured${query}`,
        undefined,
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
      return makeJsonRequest<SimpleFunctionsDataMarket>(
        "GET",
        `/v1/markets/${encodeURIComponent(ticker)}`,
        undefined,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsTickerSchema }
  );

  const dataMarkets = Object.assign(dataMarketsList, {
    featured,
    retrieve: marketRetrieve,
  });

  // GET https://data.simplefunctions.dev/v1/search{query}
  // Docs: https://docs.simplefunctions.dev/reference/realtime-data
  const dataSearch = Object.assign(
    async (
      req: SimpleFunctionsSearchRequest,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsSearchResponse> => {
      const parsed = parseWithSchema(SimpleFunctionsSearchRequestSchema, req);
      const query = buildQuery({
        q: parsed.q.trim(),
        limit: parsed.limit,
        venue: parsed.venue,
        strict: strictToQueryValue(parsed.strict),
      });
      return makeJsonRequest<SimpleFunctionsSearchResponse>(
        "GET",
        `/v1/search${query}`,
        undefined,
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
      return makeJsonRequest<SimpleFunctionsSnapshotResponse>(
        "GET",
        "/v1/snapshot",
        undefined,
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
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsMoversRequestSchema,
        req
      );
      const query = buildQuery({
        window: parsed.window,
        n: parsed.n,
        minVol: parsed.minVol,
        dir: parsed.dir,
      });
      return makeJsonRequest<SimpleFunctionsMoversResponse>(
        "GET",
        `/v1/movers${query}`,
        undefined,
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
      return makeJsonRequest<SimpleFunctionsOrderbookResponse>(
        "GET",
        `/v1/orderbook/${encodeURIComponent(ticker)}`,
        undefined,
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
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsCandlesRequestSchema,
        req
      );
      const query = buildQuery({
        tf: parsed.tf,
        limit: parsed.limit,
      });
      return makeJsonRequest<SimpleFunctionsCandlesResponse>(
        "GET",
        `/v1/candles/${encodeURIComponent(ticker)}${query}`,
        undefined,
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
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsTradesRequestSchema,
        req
      );
      const query = buildQuery({
        limit: parsed.limit,
      });
      return makeJsonRequest<SimpleFunctionsTradesResponse>(
        "GET",
        `/v1/trades/${encodeURIComponent(ticker)}${query}`,
        undefined,
        signal,
        dataBaseURL
      );
    },
    { schema: SimpleFunctionsTradesRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/market/{ticker}{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/market-detail
  const marketDetail = Object.assign(
    async (
      req: SimpleFunctionsMarketDetailRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(
        SimpleFunctionsMarketDetailRequestSchema,
        req
      );
      if (parsed.refresh) {
        requireApiKey(opts.apiKey, "refresh=true");
      }
      const ticker = pathSegment(parsed.ticker);
      const query = buildQuery({
        depth: parsed.depth,
        refresh: parsed.refresh,
        cv_preset: parsed.cvPreset,
        cv_min_conf: parsed.cvMinConf,
        cv_max_dt_days: parsed.cvMaxDtDays,
        nextActions: parsed.nextActions,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/market/${ticker}${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsMarketDetailRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/market/{ticker}/history
  // Docs: https://docs.simplefunctions.dev/api-reference/market-detail
  const marketHistory = Object.assign(
    async (
      req: SimpleFunctionsTickerRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsTickerRequestSchema, req);
      const ticker = pathSegment(parsed.ticker);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/market/${ticker}/history`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsTickerRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/market/{ticker}/candles{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const marketCandles = Object.assign(
    async (
      req: SimpleFunctionsMarketCandlesRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(
        SimpleFunctionsMarketCandlesRequestSchema,
        req
      );
      const ticker = pathSegment(parsed.ticker);
      const query = buildQuery({
        venue: parsed.venue,
        timeframe: parsed.timeframe,
        tf: parsed.tf,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/market/${ticker}/candles${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsMarketCandlesRequestSchema }
  );

  const market = Object.assign(marketDetail, {
    history: marketHistory,
    candles: marketCandles,
  });

  // GET https://simplefunctions.dev/api/public/markets{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const markets = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/markets${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/newmarkets{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const newmarkets = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/newmarkets${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/scan{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const scan = Object.assign(
    async (
      req: SimpleFunctionsScanRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsScanRequestSchema,
        req
      );
      const query = buildQuery({
        q: parsed.q,
        mode: parsed.mode,
        series: parsed.series,
        market: parsed.market,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/scan${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsScanRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/screen{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const screen = Object.assign(
    async (
      req: SimpleFunctionsScreenRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsScreenRequestSchema,
        req
      );
      const query = buildQuery({
        venue: parsed.venue,
        category: parsed.category,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        minVolume: parsed.minVolume,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/screen${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsScreenRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/screen-by-tickers{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const screenByTickers = Object.assign(
    async (
      req: SimpleFunctionsScreenByTickersRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(
        SimpleFunctionsScreenByTickersRequestSchema,
        req
      );
      const query = buildQuery({
        tickers: parsed.tickers,
        venue: parsed.venue,
        minVolume: parsed.minVolume,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/screen-by-tickers${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsScreenByTickersRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/search{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const search = Object.assign(
    async (
      req: SimpleFunctionsPublicSearchRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(
        SimpleFunctionsPublicSearchRequestSchema,
        req
      );
      const query = buildQuery({
        q: parsed.q.trim(),
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/search${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicSearchRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/live-tickers{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const liveTickers = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/live-tickers${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/market-microstructure-history{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const marketMicrostructureHistory = Object.assign(
    async (
      req: SimpleFunctionsMicrostructureHistoryRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(
        SimpleFunctionsMicrostructureHistoryRequestSchema,
        req
      );
      const query = buildQuery({
        ticker: parsed.ticker,
        venue: parsed.venue,
        days: parsed.days,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/market-microstructure-history${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsMicrostructureHistoryRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/cross-venue/pairs{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const crossVenuePairs = Object.assign(
    async (
      req: SimpleFunctionsCrossVenueRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsCrossVenueRequestSchema,
        req
      );
      const query = buildQuery({
        venue: parsed.venue,
        minConfidence: parsed.minConfidence,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/cross-venue/pairs${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsCrossVenueRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/cross-venue/stats{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const crossVenueStats = Object.assign(
    async (
      req: SimpleFunctionsCrossVenueRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsCrossVenueRequestSchema,
        req
      );
      const query = buildQuery({
        venue: parsed.venue,
        minConfidence: parsed.minConfidence,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/cross-venue/stats${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsCrossVenueRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/index
  // Docs: https://docs.simplefunctions.dev/api-reference/index-regime
  const indexCurrent = Object.assign(
    async (
      req: SimpleFunctionsEmptyRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      parseOptionalWithSchema(SimpleFunctionsEmptyRequestSchema, req);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        "/api/public/index",
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsEmptyRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/index/history{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/index-regime
  const indexHistory = Object.assign(
    async (
      req: SimpleFunctionsIndexHistoryRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsIndexHistoryRequestSchema,
        req
      );
      const query = buildQuery({
        days: parsed.days,
        theme: parsed.theme,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/index/history${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsIndexHistoryRequestSchema }
  );

  const index = Object.assign(indexCurrent, {
    history: indexHistory,
  });

  // GET https://simplefunctions.dev/api/public/regime/scan{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/index-regime
  const regimeScan = Object.assign(
    async (
      req: SimpleFunctionsRegimeScanRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsRegimeScanRequestSchema,
        req
      );
      const query = buildQuery({
        label: parsed.label,
        venue: parsed.venue,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/regime/scan${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsRegimeScanRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/odds{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const odds = Object.assign(
    async (
      req: SimpleFunctionsOddsRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsOddsRequestSchema,
        req
      );
      const query = buildQuery({
        category: parsed.category,
        band: parsed.band,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/odds${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsOddsRequestSchema }
  );

  // sig-ok: Markdown filename endpoint uses oddsMd as a JS-safe method name.
  // GET https://simplefunctions.dev/api/public/odds.md{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const oddsMd = Object.assign(
    async (
      req: SimpleFunctionsOddsRequest = {},
      signal?: AbortSignal
    ): Promise<string> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsOddsRequestSchema,
        req
      );
      const query = buildQuery({
        category: parsed.category,
        band: parsed.band,
        limit: parsed.limit,
      });
      return makeGetTextRequest(`/api/public/odds.md${query}`, signal);
    },
    { schema: SimpleFunctionsOddsRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/calendar{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/index-regime
  const calendar = Object.assign(
    async (
      req: SimpleFunctionsCalendarRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsCalendarRequestSchema,
        req
      );
      const query = buildQuery({
        from: parsed.from,
        to: parsed.to,
        category: parsed.category,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/calendar${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsCalendarRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/yield-curves
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const yieldCurvesList = Object.assign(
    async (
      req: SimpleFunctionsEmptyRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      parseOptionalWithSchema(SimpleFunctionsEmptyRequestSchema, req);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        "/api/public/yield-curves",
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsEmptyRequestSchema }
  );

  // sig-ok: detail endpoint hangs off the yieldCurves collection.
  // GET https://simplefunctions.dev/api/public/yield-curves/{event}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const yieldCurveEvent = Object.assign(
    async (
      req: SimpleFunctionsYieldCurveRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(
        SimpleFunctionsYieldCurveRequestSchema,
        req
      );
      const event = pathSegment(parsed.event);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/yield-curves/${event}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsYieldCurveRequestSchema }
  );

  const yieldCurves = Object.assign(yieldCurvesList, {
    event: yieldCurveEvent,
  });

  // GET https://simplefunctions.dev/api/public/liquidity-by-theme{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const liquidityByTheme = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/liquidity-by-theme${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/contagion{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const contagion = Object.assign(
    async (
      req: SimpleFunctionsContagionRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsContagionRequestSchema,
        req
      );
      const query = buildQuery({
        ticker: parsed.ticker,
        window: parsed.window,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/contagion${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsContagionRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/query-gov{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/gov-econ
  const queryGov = Object.assign(
    async (
      req: SimpleFunctionsGovQueryRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsGovQueryRequestSchema, req);
      const query = buildQuery({
        q: parsed.q.trim(),
        mode: parsed.mode,
        sources: parsed.sources,
        limit: parsed.limit,
        depth: parsed.depth,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/query-gov${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsGovQueryRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/legislation{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/gov-econ
  const legislationList = Object.assign(
    async (
      req: SimpleFunctionsLegislationRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsLegislationRequestSchema,
        req
      );
      const query = buildQuery({
        q: parsed.q,
        congress: parsed.congress,
        type: parsed.type,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/legislation${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsLegislationRequestSchema }
  );

  // sig-ok: detail endpoint hangs off the legislation collection.
  // GET https://simplefunctions.dev/api/public/legislation/{billId}
  // Docs: https://docs.simplefunctions.dev/api-reference/gov-econ
  const legislationByBillId = Object.assign(
    async (
      req: SimpleFunctionsBillRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsBillRequestSchema, req);
      const billId = pathSegment(parsed.billId);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/legislation/${billId}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsBillRequestSchema }
  );

  const legislation = Object.assign(legislationList, {
    byBillId: legislationByBillId,
  });

  // GET https://simplefunctions.dev/api/public/congress/members{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const congressMembers = Object.assign(
    async (
      req: SimpleFunctionsCongressMembersRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsCongressMembersRequestSchema,
        req
      );
      const query = buildQuery({
        q: parsed.q,
        state: parsed.state,
        party: parsed.party,
        chamber: parsed.chamber,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/congress/members${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsCongressMembersRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/congress/member/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const congressMember = Object.assign(
    async (
      req: SimpleFunctionsCongressMemberRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(
        SimpleFunctionsCongressMemberRequestSchema,
        req
      );
      const id = pathSegment(parsed.id);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/congress/member/${id}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsCongressMemberRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/query-econ{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/gov-econ
  const queryEcon = Object.assign(
    async (
      req: SimpleFunctionsEconQueryRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(
        SimpleFunctionsEconQueryRequestSchema,
        req
      );
      const query = buildQuery({
        q: parsed.q.trim(),
        mode: parsed.mode,
        limit: parsed.limit,
        includeMarkets: parsed.includeMarkets,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/query-econ${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsEconQueryRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/fred{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/gov-econ
  const fred = Object.assign(
    async (
      req: SimpleFunctionsFredRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsFredRequestSchema, req);
      const query = buildQuery({
        series: parsed.series,
        start: parsed.start,
        end: parsed.end,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/fred${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsFredRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/databento{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const databento = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/databento${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/trad-markets{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const tradMarkets = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/trad-markets${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/changes{query}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const changes = Object.assign(
    async (
      req: SimpleFunctionsChangesRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsChangesRequestSchema,
        req
      );
      const query = buildQuery({
        since: parsed.since,
        type: parsed.type,
        limit: parsed.limit,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/changes${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsChangesRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/context{query}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const context = Object.assign(
    async (
      req: SimpleFunctionsContextRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsContextRequestSchema,
        req
      );
      const query = buildQuery({
        compact: parsed.compact,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/context${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsContextRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/briefing{query}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const briefing = Object.assign(
    async (
      req: SimpleFunctionsBriefingRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsBriefingRequestSchema,
        req
      );
      const query = buildQuery({
        topic: parsed.topic,
        date: parsed.date,
        compact: parsed.compact,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/briefing${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsBriefingRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/topic/{slug}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const topic = Object.assign(
    async (
      req: SimpleFunctionsSlugRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsSlugRequestSchema, req);
      const slug = pathSegment(parsed.slug);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/topic/${slug}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsSlugRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/answer/{slug}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const answer = Object.assign(
    async (
      req: SimpleFunctionsSlugRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsSlugRequestSchema, req);
      const slug = pathSegment(parsed.slug);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/answer/${slug}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsSlugRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/glossary{query}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const glossaryList = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/glossary${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // sig-ok: detail endpoint hangs off the glossary collection.
  // GET https://simplefunctions.dev/api/public/glossary/{slug}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const glossaryEntry = Object.assign(
    async (
      req: SimpleFunctionsSlugRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsSlugRequestSchema, req);
      const slug = pathSegment(parsed.slug);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/glossary/${slug}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsSlugRequestSchema }
  );

  const glossary = Object.assign(glossaryList, {
    entry: glossaryEntry,
  });

  // GET https://simplefunctions.dev/api/public/guide
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const guide = Object.assign(
    async (
      req: SimpleFunctionsEmptyRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      parseOptionalWithSchema(SimpleFunctionsEmptyRequestSchema, req);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        "/api/public/guide",
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsEmptyRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/highlights{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const highlights = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/highlights${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/diff{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const diff = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/diff${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // POST https://simplefunctions.dev/api/public/discuss
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const discuss = Object.assign(
    async (
      req: SimpleFunctionsDiscussRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsDiscussRequestSchema, req);
      return makeJsonRequest<Record<string, unknown>>(
        "POST",
        "/api/public/discuss",
        parsed,
        signal
      );
    },
    { schema: SimpleFunctionsDiscussRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/skills{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const skills = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/skills${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/skill/{slug}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const skill = Object.assign(
    async (
      req: SimpleFunctionsSlugRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsSlugRequestSchema, req);
      const slug = pathSegment(parsed.slug);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/skill/${slug}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsSlugRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/theses{query}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const theses = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/theses${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/thesis/{slug}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const thesis = Object.assign(
    async (
      req: SimpleFunctionsSlugRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsSlugRequestSchema, req);
      const slug = pathSegment(parsed.slug);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/thesis/${slug}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsSlugRequestSchema }
  );

  // GET https://simplefunctions.dev/api/public/opinions{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const opinionsList = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/opinions${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // sig-ok: detail endpoint hangs off the opinions collection.
  // GET https://simplefunctions.dev/api/public/opinions/{slug}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const opinionEntry = Object.assign(
    async (
      req: SimpleFunctionsSlugRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsSlugRequestSchema, req);
      const slug = pathSegment(parsed.slug);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/opinions/${slug}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsSlugRequestSchema }
  );

  const opinions = Object.assign(opinionsList, {
    entry: opinionEntry,
  });

  // GET https://simplefunctions.dev/api/public/technicals{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const technicalsList = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/technicals${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // sig-ok: detail endpoint hangs off the technicals collection.
  // GET https://simplefunctions.dev/api/public/technicals/{slug}
  // Docs: https://docs.simplefunctions.dev/api-reference/public-market-data
  const technicalsEntry = Object.assign(
    async (
      req: SimpleFunctionsSlugRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsSlugRequestSchema, req);
      const slug = pathSegment(parsed.slug);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/technicals/${slug}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsSlugRequestSchema }
  );

  const technicals = Object.assign(technicalsList, {
    entry: technicalsEntry,
  });

  // GET https://simplefunctions.dev/api/public/ideas{query}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const ideasList = Object.assign(
    async (
      req: SimpleFunctionsPublicListRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsPublicListRequestSchema,
        req
      );
      const query = buildListQuery(parsed);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/ideas${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsPublicListRequestSchema }
  );

  // sig-ok: detail endpoint hangs off the ideas collection.
  // GET https://simplefunctions.dev/api/public/ideas/{id}
  // Docs: https://docs.simplefunctions.dev/reference/daily-data
  const ideaById = Object.assign(
    async (
      req: SimpleFunctionsIdeaRequest,
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseWithSchema(SimpleFunctionsIdeaRequestSchema, req);
      const id = pathSegment(parsed.id);
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/ideas/${id}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsIdeaRequestSchema }
  );

  const ideas = Object.assign(ideasList, {
    byId: ideaById,
  });

  // GET https://simplefunctions.dev/api/public/calibration{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/index-regime
  const publicCalibration = Object.assign(
    async (
      req: SimpleFunctionsCalibrationRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsCalibrationRequestSchema,
        req
      );
      const query = buildQuery({
        source: parsed.source,
        period: parsed.period,
        category: parsed.category,
        topic: parsed.topic,
        min_volume: parsed.minVolume,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/public/calibration${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsCalibrationRequestSchema }
  );

  // GET https://simplefunctions.dev/api/calibration{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/index-regime
  const calibration = Object.assign(
    async (
      req: SimpleFunctionsCalibrationRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      requireApiKey(opts.apiKey, "/api/calibration");
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsCalibrationRequestSchema,
        req
      );
      const query = buildQuery({
        source: parsed.source,
        period: parsed.period,
        category: parsed.category,
        topic: parsed.topic,
        min_volume: parsed.minVolume,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/calibration${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsCalibrationRequestSchema }
  );

  // GET https://simplefunctions.dev/api/edges{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/index-regime
  const edges = Object.assign(
    async (
      req: SimpleFunctionsEdgesRequest = {},
      signal?: AbortSignal
    ): Promise<Record<string, unknown>> => {
      requireApiKey(opts.apiKey, "/api/edges");
      const parsed = parseOptionalWithSchema(
        SimpleFunctionsEdgesRequestSchema,
        req
      );
      const query = buildQuery({
        limit: parsed.limit,
        minStrength: parsed.minStrength,
        theme: parsed.theme,
        venue: parsed.venue,
      });
      return makeJsonRequest<Record<string, unknown>>(
        "GET",
        `/api/edges${query}`,
        undefined,
        signal
      );
    },
    { schema: SimpleFunctionsEdgesRequestSchema }
  );

  const publicApi = {
    query,
    market,
    markets,
    newmarkets,
    scan,
    screen,
    screenByTickers,
    search,
    liveTickers,
    marketMicrostructureHistory,
    crossVenue: {
      pairs: crossVenuePairs,
      stats: crossVenueStats,
    },
    index,
    regime: {
      scan: regimeScan,
    },
    odds,
    oddsMd,
    calendar,
    yieldCurves,
    liquidityByTheme,
    contagion,
    queryGov,
    legislation,
    congress: {
      members: congressMembers,
      member: congressMember,
    },
    queryEcon,
    fred,
    databento,
    tradMarkets,
    context,
    briefing,
    topic,
    answer,
    glossary,
    guide,
    highlights,
    diff,
    discuss,
    skills,
    skill,
    theses,
    thesis,
    opinions,
    technicals,
    ideas,
    calibration: publicCalibration,
  };

  const api = {
    agent: {
      world,
      inspect,
      feed: agentFeed,
    },
    calibration,
    changes,
    edges,
    public: publicApi,
  };
  const data: SimpleFunctionsDataNamespace = {
    v1: {
      heartbeat,
      markets: dataMarkets,
      search: dataSearch,
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
    post: {
      api: {
        public: {
          discuss,
        },
      },
    },
  });
}
