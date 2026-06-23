import type { z } from "zod";
import { attachExamples } from "./example";
import { SimpleFunctionsError } from "./types";
import type {
  SimpleFunctionsAgentFeedRequest,
  SimpleFunctionsBillRequest,
  SimpleFunctionsBriefingRequest,
  SimpleFunctionsCalendarRequest,
  SimpleFunctionsCalibrationRequest,
  SimpleFunctionsBodyRequest,
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
  SimpleFunctionsIdRequest,
  SimpleFunctionsIdeaRequest,
  SimpleFunctionsIndexHistoryRequest,
  SimpleFunctionsInspectRequest,
  SimpleFunctionsInspectResponse,
  SimpleFunctionsInspectResult,
  SimpleFunctionsLegislationRequest,
  SimpleFunctionsMarketCandlesRequest,
  SimpleFunctionsMarketDetailResponse,
  SimpleFunctionsMarketDetailRequest,
  SimpleFunctionsMarketHistoryResponse,
  SimpleFunctionsMarketsRequest,
  SimpleFunctionsMarketsResponse,
  SimpleFunctionsMicrostructureHistoryRequest,
  SimpleFunctionsMoversRequest,
  SimpleFunctionsMoversResponse,
  SimpleFunctionsOptionalQueryRequest,
  SimpleFunctionsOddsRequest,
  SimpleFunctionsOptions,
  SimpleFunctionsOrderbookResponse,
  SimpleFunctionsPositionRequest,
  SimpleFunctionsProvider,
  SimpleFunctionsPublicListRequest,
  SimpleFunctionsPublicSearchRequest,
  SimpleFunctionsQueryRequest,
  SimpleFunctionsQueryResponse,
  SimpleFunctionsRecordRequest,
  SimpleFunctionsRegimeScanRequest,
  SimpleFunctionsScanRequest,
  SimpleFunctionsScreenByTickersRequest,
  SimpleFunctionsScreenRequest,
  SimpleFunctionsSearchRequest,
  SimpleFunctionsSearchResponse,
  SimpleFunctionsSlugRequest,
  SimpleFunctionsSnapshotResponse,
  SimpleFunctionsStrategyRequest,
  SimpleFunctionsStrict,
  SimpleFunctionsTickerPathRequest,
  SimpleFunctionsTickerRequest,
  SimpleFunctionsTokenRequest,
  SimpleFunctionsTradesRequest,
  SimpleFunctionsTradesResponse,
  SimpleFunctionsTransportRequest,
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
  SimpleFunctionsBodyRequestSchema,
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
  SimpleFunctionsIdRequestSchema,
  SimpleFunctionsIdeaRequestSchema,
  SimpleFunctionsIndexHistoryRequestSchema,
  SimpleFunctionsInspectRequestSchema,
  SimpleFunctionsLegislationRequestSchema,
  SimpleFunctionsMarketCandlesRequestSchema,
  SimpleFunctionsMarketDetailRequestSchema,
  SimpleFunctionsMarketDetailResponseSchema,
  SimpleFunctionsMarketHistoryResponseSchema,
  SimpleFunctionsMarketsRequestSchema,
  SimpleFunctionsMicrostructureHistoryRequestSchema,
  SimpleFunctionsMoversRequestSchema,
  SimpleFunctionsNoRequestSchema,
  SimpleFunctionsOptionalQueryRequestSchema,
  SimpleFunctionsOddsRequestSchema,
  SimpleFunctionsPositionRequestSchema,
  SimpleFunctionsPublicListRequestSchema,
  SimpleFunctionsPublicSearchRequestSchema,
  SimpleFunctionsQueryRequestSchema,
  SimpleFunctionsRecordRequestSchema,
  SimpleFunctionsRegimeScanRequestSchema,
  SimpleFunctionsScanRequestSchema,
  SimpleFunctionsScreenByTickersRequestSchema,
  SimpleFunctionsScreenRequestSchema,
  SimpleFunctionsSearchRequestSchema,
  SimpleFunctionsSlugRequestSchema,
  SimpleFunctionsStrategyRequestSchema,
  SimpleFunctionsTickerPathRequestSchema,
  SimpleFunctionsTickerRequestSchema,
  SimpleFunctionsTickerSchema,
  SimpleFunctionsTokenRequestSchema,
  SimpleFunctionsTradesRequestSchema,
  SimpleFunctionsTransportRequestSchema,
  SimpleFunctionsWorldDeltaRequestSchema,
  SimpleFunctionsWorldPathRequestSchema,
  SimpleFunctionsWorldRequestSchema,
  SimpleFunctionsYieldCurveRequestSchema,
} from "./zod";

interface SimpleFunctionsErrorBody {
  error?: string;
  message?: string;
}

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryValue = string | number | boolean | readonly string[] | undefined;
type QueryRecord = Record<string, QueryValue>;

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

function queryFromRecord(req: Record<string, unknown> = {}): string {
  return buildQuery(req as QueryRecord);
}

function queryFromBodyRequest(req: SimpleFunctionsBodyRequest): string {
  const query = req.query;
  return query ? queryFromRecord(query) : "";
}

function queryFromExplicitQuery(req: Record<string, unknown> = {}): string {
  const query = req.query;
  if (query && typeof query === "object") {
    return queryFromRecord(query as Record<string, unknown>);
  }
  return "";
}

function queryFromRequest(
  req: Record<string, unknown> = {},
  omitKeys: readonly string[] = []
): string {
  const explicitQuery = req.query;
  if (explicitQuery && typeof explicitQuery === "object") {
    return queryFromRecord(explicitQuery as Record<string, unknown>);
  }

  const omitted = new Set(["body", "query", ...omitKeys]);
  const query: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(req)) {
    if (!omitted.has(key) && value !== undefined) {
      query[key] = value;
    }
  }
  return queryFromRecord(query);
}

function bodyFromRequest(
  req: Record<string, unknown> = {},
  omitKeys: readonly string[] = []
): unknown {
  if (Object.prototype.hasOwnProperty.call(req, "body")) {
    return req.body;
  }

  const omitted = new Set(["query", ...omitKeys]);
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(req)) {
    if (!omitted.has(key) && value !== undefined) {
      body[key] = value;
    }
  }
  return Object.keys(body).length > 0 ? body : undefined;
}

function requestId(req: SimpleFunctionsIdRequest): string {
  return pathSegment(req.id.trim());
}

function requestTicker(req: SimpleFunctionsTickerPathRequest): string {
  return pathSegment(req.ticker.trim());
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
    method: RequestMethod,
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

      if (res.status === 204) {
        return null as T;
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

  async function makeRawRequest(
    method: RequestMethod,
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<Response> {
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

      let requestBody: BodyInit | undefined;
      if (
        body instanceof FormData ||
        body instanceof Blob ||
        body instanceof URLSearchParams ||
        typeof body === "string"
      ) {
        requestBody = body;
      } else if (body instanceof ArrayBuffer) {
        requestBody = body;
      } else if (ArrayBuffer.isView(body)) {
        requestBody = body as BodyInit;
      } else if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}`, {
        method,
        headers,
        body: requestBody,
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

      return res;
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

  function jsonGet<TReq extends Record<string, unknown>>(
    schema: z.ZodType<TReq>,
    path: (req: TReq) => string,
    endpoint: string,
    auth = true
  ) {
    return Object.assign(
      async (
        req: TReq = {} as TReq,
        signal?: AbortSignal
      ): Promise<Record<string, unknown>> => {
        if (auth) requireApiKey(opts.apiKey, endpoint);
        const parsed = parseWithSchema(schema, req ?? {});
        return makeJsonRequest<Record<string, unknown>>(
          "GET",
          path(parsed),
          undefined,
          signal
        );
      },
      { schema }
    );
  }

  function jsonBody<TReq extends Record<string, unknown>>(
    method: Exclude<RequestMethod, "GET">,
    schema: z.ZodType<TReq>,
    path: (req: TReq) => string,
    endpoint: string,
    omitKeys: readonly string[] = [],
    auth = true
  ) {
    return Object.assign(
      async (
        req: TReq,
        signal?: AbortSignal
      ): Promise<Record<string, unknown>> => {
        if (auth) requireApiKey(opts.apiKey, endpoint);
        const parsed = parseWithSchema(schema, req ?? {});
        return makeJsonRequest<Record<string, unknown>>(
          method,
          path(parsed),
          bodyFromRequest(parsed, omitKeys),
          signal
        );
      },
      { schema }
    );
  }

  function jsonOptionalBody<TReq extends Record<string, unknown>>(
    method: Exclude<RequestMethod, "GET">,
    schema: z.ZodType<TReq>,
    path: (req: TReq) => string,
    endpoint: string,
    auth = true
  ) {
    return Object.assign(
      async (
        req: TReq = {} as TReq,
        signal?: AbortSignal
      ): Promise<Record<string, unknown>> => {
        if (auth) requireApiKey(opts.apiKey, endpoint);
        const parsed = parseWithSchema(schema, req ?? {});
        return makeJsonRequest<Record<string, unknown>>(
          method,
          path(parsed),
          bodyFromRequest(parsed),
          signal
        );
      },
      { schema }
    );
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
    ): Promise<SimpleFunctionsMarketDetailResponse> => {
      const parsed = parseWithSchema(
        SimpleFunctionsMarketDetailRequestSchema,
        req
      );
      if (parsed.refresh) {
        requireApiKey(opts.apiKey, "refresh=true");
      }
      const ticker = pathSegment(parsed.ticker.trim());
      const query = buildQuery({
        depth: parsed.depth,
        refresh: parsed.refresh,
        cv_preset: parsed.cvPreset,
        cv_min_conf: parsed.cvMinConf,
        cv_max_dt_days: parsed.cvMaxDtDays,
        nextActions: parsed.nextActions,
      });
      return makeJsonRequest<SimpleFunctionsMarketDetailResponse>(
        "GET",
        `/api/public/market/${ticker}${query}`,
        undefined,
        signal
      );
    },
    {
      schema: SimpleFunctionsMarketDetailRequestSchema,
      responseSchema: SimpleFunctionsMarketDetailResponseSchema,
    }
  );

  // GET https://simplefunctions.dev/api/public/market/{ticker}/history
  // Docs: https://docs.simplefunctions.dev/api-reference/market-detail
  const marketHistory = Object.assign(
    async (
      req: SimpleFunctionsTickerRequest,
      signal?: AbortSignal
    ): Promise<SimpleFunctionsMarketHistoryResponse> => {
      const parsed = parseWithSchema(SimpleFunctionsTickerRequestSchema, req);
      const ticker = pathSegment(parsed.ticker.trim());
      return makeJsonRequest<SimpleFunctionsMarketHistoryResponse>(
        "GET",
        `/api/public/market/${ticker}/history`,
        undefined,
        signal
      );
    },
    {
      schema: SimpleFunctionsTickerRequestSchema,
      responseSchema: SimpleFunctionsMarketHistoryResponseSchema,
    }
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
      const ticker = pathSegment(parsed.ticker.trim());
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

  // GET https://simplefunctions.dev/api/keys{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/keys
  const keysList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/keys${queryFromRequest(req)}`,
    "/api/keys"
  );

  // POST https://simplefunctions.dev/api/keys
  // Docs: https://docs.simplefunctions.dev/api-reference/keys
  const keysCreate = jsonBody<SimpleFunctionsBodyRequest>(
    "POST",
    SimpleFunctionsBodyRequestSchema,
    () => "/api/keys",
    "/api/keys"
  );

  // DELETE https://simplefunctions.dev/api/keys/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/keys
  const keysDelete = jsonBody<SimpleFunctionsIdRequest>(
    "DELETE",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/keys/${requestId(req)}`,
    "/api/keys/{id}",
    ["id"]
  );

  const keys = Object.assign(keysList, {
    create: keysCreate,
    delete: keysDelete,
  });

  // POST https://simplefunctions.dev/api/auth/cli
  // Docs: https://docs.simplefunctions.dev/api-reference/keys
  const authCliInit = jsonBody<SimpleFunctionsBodyRequest>(
    "POST",
    SimpleFunctionsBodyRequestSchema,
    () => "/api/auth/cli",
    "/api/auth/cli",
    [],
    false
  );

  // GET https://simplefunctions.dev/api/auth/cli/poll{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/keys
  const authCliPoll = jsonGet<SimpleFunctionsTokenRequest>(
    SimpleFunctionsTokenRequestSchema,
    (req) => `/api/auth/cli/poll${buildQuery({ token: req.token.trim() })}`,
    "/api/auth/cli/poll",
    false
  );

  // POST https://simplefunctions.dev/api/auth/cli/complete
  // Docs: https://docs.simplefunctions.dev/api-reference/keys
  const authCliComplete = jsonBody<SimpleFunctionsBodyRequest>(
    "POST",
    SimpleFunctionsBodyRequestSchema,
    () => "/api/auth/cli/complete",
    "/api/auth/cli/complete",
    [],
    false
  );

  const authCli = Object.assign(authCliInit, {
    poll: authCliPoll,
    complete: authCliComplete,
  });

  // POST https://simplefunctions.dev/api/signup
  // Docs: https://docs.simplefunctions.dev/api-reference/keys
  const signup = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/signup",
    "/api/signup",
    [],
    false
  );

  // GET https://simplefunctions.dev/api/feed{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/account
  const feed = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/feed${queryFromRequest(req)}`,
    "/api/feed"
  );

  // GET https://simplefunctions.dev/api/dashboard/usage{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/account
  const dashboardUsage = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/dashboard/usage${queryFromRequest(req)}`,
    "/api/dashboard/usage"
  );

  // GET https://simplefunctions.dev/api/thesis{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/thesis${queryFromRequest(req)}`,
    "/api/thesis"
  );

  // POST https://simplefunctions.dev/api/thesis/create{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisCreate = jsonBody<SimpleFunctionsBodyRequest>(
    "POST",
    SimpleFunctionsBodyRequestSchema,
    (req) => `/api/thesis/create${queryFromBodyRequest(req)}`,
    "/api/thesis/create"
  );

  // GET https://simplefunctions.dev/api/thesis/{id}{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisRetrieve = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}${queryFromRequest(req, ["id"])}`,
    "/api/thesis/{id}"
  );

  // PATCH https://simplefunctions.dev/api/thesis/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisUpdate = jsonBody<SimpleFunctionsIdRequest>(
    "PATCH",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}`,
    "/api/thesis/{id}",
    ["id"]
  );

  // DELETE https://simplefunctions.dev/api/thesis/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisDelete = jsonBody<SimpleFunctionsIdRequest>(
    "DELETE",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}`,
    "/api/thesis/{id}",
    ["id"]
  );

  // GET https://simplefunctions.dev/api/thesis/by-ticker/{ticker}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisByTicker = jsonGet<SimpleFunctionsTickerPathRequest>(
    SimpleFunctionsTickerPathRequestSchema,
    (req) => `/api/thesis/by-ticker/${requestTicker(req)}`,
    "/api/thesis/by-ticker/{ticker}",
    false
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/signal
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisSignal = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/signal`,
    "/api/thesis/{id}/signal",
    ["id"]
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/evaluate
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisEvaluate = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/evaluate`,
    "/api/thesis/{id}/evaluate",
    ["id"]
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/augment{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisAugment = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) =>
      `/api/thesis/${requestId(req)}/augment${queryFromRequest(req, ["id"])}`,
    "/api/thesis/{id}/augment",
    ["id"]
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/nodes
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisNodes = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/nodes`,
    "/api/thesis/{id}/nodes",
    ["id"]
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/fork
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisFork = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/fork`,
    "/api/thesis/{id}/fork",
    ["id"]
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/whatif
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisWhatif = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/whatif`,
    "/api/thesis/{id}/whatif",
    ["id"]
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/context
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisContext = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/context`,
    "/api/thesis/{id}/context"
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/changes{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisChanges = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) =>
      `/api/thesis/${requestId(req)}/changes${queryFromRequest(req, ["id"])}`,
    "/api/thesis/{id}/changes"
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/prompt
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisPrompt = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/prompt`,
    "/api/thesis/{id}/prompt"
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/evaluations
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisEvaluations = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/evaluations`,
    "/api/thesis/{id}/evaluations"
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/heartbeat
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisHeartbeatGet = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/heartbeat`,
    "/api/thesis/{id}/heartbeat"
  );

  // PATCH https://simplefunctions.dev/api/thesis/{id}/heartbeat
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisHeartbeatUpdate = jsonBody<SimpleFunctionsIdRequest>(
    "PATCH",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/heartbeat`,
    "/api/thesis/{id}/heartbeat",
    ["id"]
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/positions
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisPositionsList = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/positions`,
    "/api/thesis/{id}/positions"
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/positions
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisPositionsCreate = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/positions`,
    "/api/thesis/{id}/positions",
    ["id"]
  );

  // PATCH https://simplefunctions.dev/api/thesis/{id}/positions/{posId}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisPositionsUpdate = jsonBody<SimpleFunctionsPositionRequest>(
    "PATCH",
    SimpleFunctionsPositionRequestSchema,
    (req) =>
      `/api/thesis/${pathSegment(req.id.trim())}/positions/${pathSegment(
        req.posId.trim()
      )}`,
    "/api/thesis/{id}/positions/{posId}",
    ["id", "posId"]
  );

  // DELETE https://simplefunctions.dev/api/thesis/{id}/positions/{posId}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisPositionsDelete = jsonBody<SimpleFunctionsPositionRequest>(
    "DELETE",
    SimpleFunctionsPositionRequestSchema,
    (req) =>
      `/api/thesis/${pathSegment(req.id.trim())}/positions/${pathSegment(
        req.posId.trim()
      )}`,
    "/api/thesis/{id}/positions/{posId}",
    ["id", "posId"]
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/strategies{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisStrategiesList = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) =>
      `/api/thesis/${requestId(req)}/strategies${queryFromRequest(req, [
        "id",
      ])}`,
    "/api/thesis/{id}/strategies"
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/strategies
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisStrategiesCreate = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/strategies`,
    "/api/thesis/{id}/strategies",
    ["id"]
  );

  // PATCH https://simplefunctions.dev/api/thesis/{id}/strategies/{sid}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisStrategiesUpdate = jsonBody<SimpleFunctionsStrategyRequest>(
    "PATCH",
    SimpleFunctionsStrategyRequestSchema,
    (req) =>
      `/api/thesis/${pathSegment(req.id.trim())}/strategies/${pathSegment(
        req.sid.trim()
      )}`,
    "/api/thesis/{id}/strategies/{sid}",
    ["id", "sid"]
  );

  // DELETE https://simplefunctions.dev/api/thesis/{id}/strategies/{sid}
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisStrategiesDelete = jsonBody<SimpleFunctionsStrategyRequest>(
    "DELETE",
    SimpleFunctionsStrategyRequestSchema,
    (req) =>
      `/api/thesis/${pathSegment(req.id.trim())}/strategies/${pathSegment(
        req.sid.trim()
      )}`,
    "/api/thesis/{id}/strategies/{sid}",
    ["id", "sid"]
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/publish
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisPublish = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/publish`,
    "/api/thesis/{id}/publish",
    ["id"]
  );

  // sig-ok: unpublish is the JS-safe semantic alias for DELETE publish.
  // DELETE https://simplefunctions.dev/api/thesis/{id}/publish
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisUnpublish = jsonBody<SimpleFunctionsIdRequest>(
    "DELETE",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/publish`,
    "/api/thesis/{id}/publish",
    ["id"]
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/videos
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisVideosList = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/videos`,
    "/api/thesis/{id}/videos"
  );

  // POST https://simplefunctions.dev/api/thesis/{id}/videos
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisVideosCreate = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/videos`,
    "/api/thesis/{id}/videos",
    ["id"]
  );

  // GET https://simplefunctions.dev/api/thesis/{id}/video-data
  // Docs: https://docs.simplefunctions.dev/api-reference/thesis
  const thesisVideoData = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/thesis/${requestId(req)}/video-data`,
    "/api/thesis/{id}/video-data"
  );

  const authThesis = Object.assign(thesisList, {
    create: thesisCreate,
    retrieve: thesisRetrieve,
    update: thesisUpdate,
    delete: thesisDelete,
    byTicker: thesisByTicker,
    signal: thesisSignal,
    evaluate: thesisEvaluate,
    augment: thesisAugment,
    nodes: thesisNodes,
    fork: thesisFork,
    whatif: thesisWhatif,
    context: thesisContext,
    changes: thesisChanges,
    prompt: thesisPrompt,
    evaluations: thesisEvaluations,
    heartbeat: {
      get: thesisHeartbeatGet,
      update: thesisHeartbeatUpdate,
    },
    positions: {
      list: thesisPositionsList,
      create: thesisPositionsCreate,
      update: thesisPositionsUpdate,
      delete: thesisPositionsDelete,
    },
    strategies: {
      list: thesisStrategiesList,
      create: thesisStrategiesCreate,
      update: thesisStrategiesUpdate,
      delete: thesisStrategiesDelete,
    },
    publish: thesisPublish,
    unpublish: thesisUnpublish,
    videos: {
      list: thesisVideosList,
      create: thesisVideosCreate,
    },
    videoData: thesisVideoData,
  });

  // GET https://simplefunctions.dev/api/portfolio/state
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioStateGet = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    () => "/api/portfolio/state",
    "/api/portfolio/state"
  );

  // PUT https://simplefunctions.dev/api/portfolio/state{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioStateUpdate = jsonBody<SimpleFunctionsRecordRequest>(
    "PUT",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/state${queryFromExplicitQuery(req)}`,
    "/api/portfolio/state"
  );

  const portfolioState = Object.assign(portfolioStateGet, {
    update: portfolioStateUpdate,
  });

  // GET https://simplefunctions.dev/api/portfolio/config
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioConfigGet = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    () => "/api/portfolio/config",
    "/api/portfolio/config"
  );

  // PUT https://simplefunctions.dev/api/portfolio/config{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioConfigUpdate = jsonBody<SimpleFunctionsRecordRequest>(
    "PUT",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/config${queryFromExplicitQuery(req)}`,
    "/api/portfolio/config"
  );

  const portfolioConfig = Object.assign(portfolioConfigGet, {
    update: portfolioConfigUpdate,
  });

  // GET https://simplefunctions.dev/api/portfolio/ticks{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioTicksList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/ticks${queryFromRequest(req)}`,
    "/api/portfolio/ticks"
  );

  // GET https://simplefunctions.dev/api/portfolio/ticks/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioTicksRetrieve = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/portfolio/ticks/${requestId(req)}`,
    "/api/portfolio/ticks/{id}"
  );

  // POST https://simplefunctions.dev/api/portfolio/ticks{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioTicksCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/ticks${queryFromExplicitQuery(req)}`,
    "/api/portfolio/ticks"
  );

  const portfolioTicks = Object.assign(portfolioTicksList, {
    retrieve: portfolioTicksRetrieve,
    create: portfolioTicksCreate,
  });

  // GET https://simplefunctions.dev/api/portfolio/trades{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioTradesList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/trades${queryFromRequest(req)}`,
    "/api/portfolio/trades"
  );

  // GET https://simplefunctions.dev/api/portfolio/trades/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioTradesRetrieve = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/portfolio/trades/${requestId(req)}`,
    "/api/portfolio/trades/{id}"
  );

  // POST https://simplefunctions.dev/api/portfolio/trades{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioTradesCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/trades${queryFromExplicitQuery(req)}`,
    "/api/portfolio/trades"
  );

  const portfolioTrades = Object.assign(portfolioTradesList, {
    retrieve: portfolioTradesRetrieve,
    create: portfolioTradesCreate,
  });

  // GET https://simplefunctions.dev/api/portfolio/ledger{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioLedgerList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/ledger${queryFromRequest(req)}`,
    "/api/portfolio/ledger"
  );

  // POST https://simplefunctions.dev/api/portfolio/ledger/import/kalshi{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioLedgerImportKalshi = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    (req) =>
      `/api/portfolio/ledger/import/kalshi${queryFromExplicitQuery(req)}`,
    "/api/portfolio/ledger/import/kalshi"
  );

  // POST https://simplefunctions.dev/api/portfolio/ledger/import/kalshi/pull{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioLedgerImportKalshiPull =
    jsonBody<SimpleFunctionsRecordRequest>(
      "POST",
      SimpleFunctionsRecordRequestSchema,
      (req) =>
        `/api/portfolio/ledger/import/kalshi/pull${queryFromExplicitQuery(
          req
        )}`,
      "/api/portfolio/ledger/import/kalshi/pull"
    );

  // POST https://simplefunctions.dev/api/portfolio/ledger/import/polymarket{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioLedgerImportPolymarket =
    jsonBody<SimpleFunctionsRecordRequest>(
      "POST",
      SimpleFunctionsRecordRequestSchema,
      (req) =>
        `/api/portfolio/ledger/import/polymarket${queryFromExplicitQuery(req)}`,
      "/api/portfolio/ledger/import/polymarket"
    );

  const portfolioLedgerImport = {
    kalshi: Object.assign(portfolioLedgerImportKalshi, {
      pull: portfolioLedgerImportKalshiPull,
    }),
    polymarket: portfolioLedgerImportPolymarket,
  };

  const portfolioLedger = Object.assign(portfolioLedgerList, {
    import: portfolioLedgerImport,
  });

  // GET https://simplefunctions.dev/api/portfolio/fills{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioFills = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/fills${queryFromRequest(req)}`,
    "/api/portfolio/fills"
  );

  // GET https://simplefunctions.dev/api/portfolio/positions{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioPositions = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/positions${queryFromRequest(req)}`,
    "/api/portfolio/positions"
  );

  // GET https://simplefunctions.dev/api/portfolio/activity{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioActivity = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/activity${queryFromRequest(req)}`,
    "/api/portfolio/activity"
  );

  // GET https://simplefunctions.dev/api/portfolio/attribution/daily{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioAttributionDaily =
    jsonGet<SimpleFunctionsOptionalQueryRequest>(
      SimpleFunctionsOptionalQueryRequestSchema,
      (req) => `/api/portfolio/attribution/daily${queryFromRequest(req)}`,
      "/api/portfolio/attribution/daily"
    );

  // GET https://simplefunctions.dev/api/portfolio/attribution/grouped{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioAttributionGrouped =
    jsonGet<SimpleFunctionsOptionalQueryRequest>(
      SimpleFunctionsOptionalQueryRequestSchema,
      (req) => `/api/portfolio/attribution/grouped${queryFromRequest(req)}`,
      "/api/portfolio/attribution/grouped"
    );

  // GET https://simplefunctions.dev/api/portfolio/risk{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioRisk = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/risk${queryFromRequest(req)}`,
    "/api/portfolio/risk"
  );

  // GET https://simplefunctions.dev/api/portfolio/views{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioViewsList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/views${queryFromRequest(req)}`,
    "/api/portfolio/views"
  );

  // POST https://simplefunctions.dev/api/portfolio/views{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioViewsCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/views${queryFromExplicitQuery(req)}`,
    "/api/portfolio/views"
  );

  // PUT https://simplefunctions.dev/api/portfolio/views{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioViewsUpdate = jsonBody<SimpleFunctionsRecordRequest>(
    "PUT",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/views${queryFromExplicitQuery(req)}`,
    "/api/portfolio/views"
  );

  // DELETE https://simplefunctions.dev/api/portfolio/views{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioViewsDelete = jsonBody<SimpleFunctionsRecordRequest>(
    "DELETE",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/views${queryFromExplicitQuery(req)}`,
    "/api/portfolio/views"
  );

  const portfolioViews = Object.assign(portfolioViewsList, {
    create: portfolioViewsCreate,
    update: portfolioViewsUpdate,
    delete: portfolioViewsDelete,
  });

  // GET https://simplefunctions.dev/api/portfolio/strategy{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioStrategyList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/portfolio/strategy${queryFromRequest(req)}`,
    "/api/portfolio/strategy"
  );

  // POST https://simplefunctions.dev/api/portfolio/strategy{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioStrategyCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/strategy${queryFromExplicitQuery(req)}`,
    "/api/portfolio/strategy"
  );

  // PUT https://simplefunctions.dev/api/portfolio/strategy{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioStrategyUpdate = jsonBody<SimpleFunctionsRecordRequest>(
    "PUT",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/strategy${queryFromExplicitQuery(req)}`,
    "/api/portfolio/strategy"
  );

  // DELETE https://simplefunctions.dev/api/portfolio/strategy{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioStrategyDelete = jsonBody<SimpleFunctionsRecordRequest>(
    "DELETE",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/strategy${queryFromExplicitQuery(req)}`,
    "/api/portfolio/strategy"
  );

  const portfolioStrategy = Object.assign(portfolioStrategyList, {
    create: portfolioStrategyCreate,
    update: portfolioStrategyUpdate,
    delete: portfolioStrategyDelete,
  });

  // POST https://simplefunctions.dev/api/portfolio/secrets{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioSecretsCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/secrets${queryFromExplicitQuery(req)}`,
    "/api/portfolio/secrets"
  );

  // DELETE https://simplefunctions.dev/api/portfolio/secrets{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioSecretsDelete = jsonOptionalBody<SimpleFunctionsRecordRequest>(
    "DELETE",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/secrets${queryFromExplicitQuery(req)}`,
    "/api/portfolio/secrets"
  );

  // POST https://simplefunctions.dev/api/portfolio/trigger{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/portfolio
  const portfolioTrigger = jsonOptionalBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    (req) => `/api/portfolio/trigger${queryFromExplicitQuery(req)}`,
    "/api/portfolio/trigger"
  );

  const portfolio = {
    state: portfolioState,
    config: portfolioConfig,
    ticks: portfolioTicks,
    trades: portfolioTrades,
    ledger: portfolioLedger,
    fills: portfolioFills,
    positions: portfolioPositions,
    activity: portfolioActivity,
    attribution: {
      daily: portfolioAttributionDaily,
      grouped: portfolioAttributionGrouped,
    },
    risk: portfolioRisk,
    views: portfolioViews,
    strategy: portfolioStrategy,
    secrets: {
      create: portfolioSecretsCreate,
      delete: portfolioSecretsDelete,
    },
    trigger: portfolioTrigger,
  };

  // GET https://simplefunctions.dev/api/intents{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/execution-intents
  const intentsList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/intents${queryFromRequest(req)}`,
    "/api/intents"
  );

  // POST https://simplefunctions.dev/api/intents
  // Docs: https://docs.simplefunctions.dev/api-reference/execution-intents
  const intentsCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/intents",
    "/api/intents"
  );

  // GET https://simplefunctions.dev/api/intents/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/execution-intents
  const intentsRetrieve = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/intents/${requestId(req)}`,
    "/api/intents/{id}"
  );

  // PATCH https://simplefunctions.dev/api/intents/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/execution-intents
  const intentsUpdate = jsonBody<SimpleFunctionsIdRequest>(
    "PATCH",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/intents/${requestId(req)}`,
    "/api/intents/{id}",
    ["id"]
  );

  // DELETE https://simplefunctions.dev/api/intents/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/execution-intents
  const intentsDelete = jsonBody<SimpleFunctionsIdRequest>(
    "DELETE",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/intents/${requestId(req)}`,
    "/api/intents/{id}",
    ["id"]
  );

  const intents = Object.assign(intentsList, {
    create: intentsCreate,
    retrieve: intentsRetrieve,
    update: intentsUpdate,
    delete: intentsDelete,
  });

  // GET https://simplefunctions.dev/api/runtime/exec{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/execution-intents
  const runtimeExecStatus = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/runtime/exec${queryFromRequest(req)}`,
    "/api/runtime/exec"
  );

  // sig-ok: trigger distinguishes POST execution from GET status.
  // POST https://simplefunctions.dev/api/runtime/exec
  // Docs: https://docs.simplefunctions.dev/api-reference/execution-intents
  const runtimeExecTrigger = jsonOptionalBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/runtime/exec",
    "/api/runtime/exec"
  );

  const runtimeExec = Object.assign(runtimeExecStatus, {
    trigger: runtimeExecTrigger,
  });

  // GET https://simplefunctions.dev/api/watch{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const watchList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/watch${queryFromRequest(req)}`,
    "/api/watch"
  );

  // POST https://simplefunctions.dev/api/watch
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const watchCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/watch",
    "/api/watch"
  );

  // POST https://simplefunctions.dev/api/watch/identify
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const watchIdentify = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/watch/identify",
    "/api/watch/identify"
  );

  // GET https://simplefunctions.dev/api/watch/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const watchRetrieve = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/watch/${requestId(req)}`,
    "/api/watch/{id}"
  );

  // PATCH https://simplefunctions.dev/api/watch/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const watchUpdate = jsonBody<SimpleFunctionsIdRequest>(
    "PATCH",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/watch/${requestId(req)}`,
    "/api/watch/{id}",
    ["id"]
  );

  // DELETE https://simplefunctions.dev/api/watch/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const watchDelete = jsonBody<SimpleFunctionsIdRequest>(
    "DELETE",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/watch/${requestId(req)}`,
    "/api/watch/{id}",
    ["id"]
  );

  // POST https://simplefunctions.dev/api/watch/{id}/refresh
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const watchRefresh = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/watch/${requestId(req)}/refresh`,
    "/api/watch/{id}/refresh",
    ["id"]
  );

  const watch = Object.assign(watchList, {
    create: watchCreate,
    identify: watchIdentify,
    retrieve: watchRetrieve,
    update: watchUpdate,
    delete: watchDelete,
    refresh: watchRefresh,
  });

  // GET https://simplefunctions.dev/api/alert-rules{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const alertRulesList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/alert-rules${queryFromRequest(req)}`,
    "/api/alert-rules"
  );

  // POST https://simplefunctions.dev/api/alert-rules
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const alertRulesCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/alert-rules",
    "/api/alert-rules"
  );

  // GET https://simplefunctions.dev/api/alert-rules/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const alertRulesRetrieve = jsonGet<SimpleFunctionsIdRequest>(
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/alert-rules/${requestId(req)}`,
    "/api/alert-rules/{id}"
  );

  // PATCH https://simplefunctions.dev/api/alert-rules/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const alertRulesUpdate = jsonBody<SimpleFunctionsIdRequest>(
    "PATCH",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/alert-rules/${requestId(req)}`,
    "/api/alert-rules/{id}",
    ["id"]
  );

  // DELETE https://simplefunctions.dev/api/alert-rules/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const alertRulesDelete = jsonBody<SimpleFunctionsIdRequest>(
    "DELETE",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/alert-rules/${requestId(req)}`,
    "/api/alert-rules/{id}",
    ["id"]
  );

  // POST https://simplefunctions.dev/api/alert-rules/{id}/test
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const alertRulesTest = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/alert-rules/${requestId(req)}/test`,
    "/api/alert-rules/{id}/test",
    ["id"]
  );

  const alertRules = Object.assign(alertRulesList, {
    create: alertRulesCreate,
    retrieve: alertRulesRetrieve,
    update: alertRulesUpdate,
    delete: alertRulesDelete,
    test: alertRulesTest,
  });

  // GET https://simplefunctions.dev/api/webhook-endpoints{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const webhookEndpointsList = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/webhook-endpoints${queryFromRequest(req)}`,
    "/api/webhook-endpoints"
  );

  // POST https://simplefunctions.dev/api/webhook-endpoints
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const webhookEndpointsCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/webhook-endpoints",
    "/api/webhook-endpoints"
  );

  // PATCH https://simplefunctions.dev/api/webhook-endpoints/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const webhookEndpointsUpdate = jsonBody<SimpleFunctionsIdRequest>(
    "PATCH",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/webhook-endpoints/${requestId(req)}`,
    "/api/webhook-endpoints/{id}",
    ["id"]
  );

  // DELETE https://simplefunctions.dev/api/webhook-endpoints/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const webhookEndpointsDelete = jsonBody<SimpleFunctionsIdRequest>(
    "DELETE",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/webhook-endpoints/${requestId(req)}`,
    "/api/webhook-endpoints/{id}",
    ["id"]
  );

  // POST https://simplefunctions.dev/api/webhook-endpoints/{id}/test
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const webhookEndpointsTest = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/webhook-endpoints/${requestId(req)}/test`,
    "/api/webhook-endpoints/{id}/test",
    ["id"]
  );

  const webhookEndpoints = Object.assign(webhookEndpointsList, {
    create: webhookEndpointsCreate,
    update: webhookEndpointsUpdate,
    delete: webhookEndpointsDelete,
    test: webhookEndpointsTest,
  });

  // GET https://simplefunctions.dev/api/alert-deliveries{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/watch-alerts
  const alertDeliveries = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/alert-deliveries${queryFromRequest(req)}`,
    "/api/alert-deliveries"
  );

  // GET https://simplefunctions.dev/api/contracts/tools
  // Docs: https://docs.simplefunctions.dev/api-reference/contract-tools
  const contractTools = jsonGet<SimpleFunctionsEmptyRequest>(
    SimpleFunctionsEmptyRequestSchema,
    () => "/api/contracts/tools",
    "/api/contracts/tools",
    false
  );

  // GET https://simplefunctions.dev/api/tools{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/tools
  const tools = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/tools${queryFromRequest(req)}`,
    "/api/tools",
    false
  );

  // GET https://simplefunctions.dev/api/skills{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/tools
  const apiSkills = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/skills${queryFromRequest(req)}`,
    "/api/skills",
    false
  );

  // GET https://simplefunctions.dev/api/prompt
  // Docs: https://docs.simplefunctions.dev/api-reference/tools
  const prompt = jsonGet<SimpleFunctionsEmptyRequest>(
    SimpleFunctionsEmptyRequestSchema,
    () => "/api/prompt",
    "/api/prompt"
  );

  // GET https://simplefunctions.dev/api/mcp/{transport}
  // Docs: https://docs.simplefunctions.dev/api-reference/tools
  const mcpGet = Object.assign(
    async (
      req: SimpleFunctionsTransportRequest,
      signal?: AbortSignal
    ): Promise<string> => {
      const parsed = parseWithSchema(
        SimpleFunctionsTransportRequestSchema,
        req
      );
      const transport = pathSegment(parsed.transport.trim());
      return makeGetTextRequest(`/api/mcp/${transport}`, signal);
    },
    { schema: SimpleFunctionsTransportRequestSchema }
  );

  // sig-ok: call distinguishes POST MCP calls from GET MCP metadata.
  // POST https://simplefunctions.dev/api/mcp/{transport}
  // Docs: https://docs.simplefunctions.dev/api-reference/tools
  const mcpCall = jsonBody<SimpleFunctionsTransportRequest>(
    "POST",
    SimpleFunctionsTransportRequestSchema,
    (req) => `/api/mcp/${pathSegment(req.transport.trim())}`,
    "/api/mcp/{transport}",
    ["transport"],
    false
  );

  const mcp = Object.assign(mcpGet, {
    call: mcpCall,
  });

  // POST https://simplefunctions.dev/api/proxy/tts
  // Docs: https://docs.simplefunctions.dev/api-reference/tools
  const proxyTts = Object.assign(
    async (
      req: SimpleFunctionsBodyRequest,
      signal?: AbortSignal
    ): Promise<Response> => {
      requireApiKey(opts.apiKey, "/api/proxy/tts");
      const parsed = parseWithSchema(SimpleFunctionsBodyRequestSchema, req);
      return makeRawRequest(
        "POST",
        "/api/proxy/tts",
        bodyFromRequest(parsed),
        signal
      );
    },
    { schema: SimpleFunctionsBodyRequestSchema }
  );

  // POST https://simplefunctions.dev/api/proxy/stt
  // Docs: https://docs.simplefunctions.dev/api-reference/tools
  const proxyStt = Object.assign(
    async (
      req: SimpleFunctionsBodyRequest,
      signal?: AbortSignal
    ): Promise<Response> => {
      requireApiKey(opts.apiKey, "/api/proxy/stt");
      const parsed = parseWithSchema(SimpleFunctionsBodyRequestSchema, req);
      return makeRawRequest(
        "POST",
        "/api/proxy/stt",
        bodyFromRequest(parsed),
        signal
      );
    },
    { schema: SimpleFunctionsBodyRequestSchema }
  );

  const proxy = {
    tts: proxyTts,
    stt: proxyStt,
  };

  // GET https://simplefunctions.dev/api/x/search{query}
  // Docs: https://docs.simplefunctions.dev/inventory/surface-map
  const xSearch = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/x/search${queryFromRequest(req)}`,
    "/api/x/search"
  );

  // GET https://simplefunctions.dev/api/x/volume{query}
  // Docs: https://docs.simplefunctions.dev/inventory/surface-map
  const xVolume = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/x/volume${queryFromRequest(req)}`,
    "/api/x/volume"
  );

  // GET https://simplefunctions.dev/api/x/news{query}
  // Docs: https://docs.simplefunctions.dev/inventory/surface-map
  const xNews = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/x/news${queryFromRequest(req)}`,
    "/api/x/news"
  );

  // GET https://simplefunctions.dev/api/x/account{query}
  // Docs: https://docs.simplefunctions.dev/inventory/surface-map
  const xAccount = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/x/account${queryFromRequest(req)}`,
    "/api/x/account"
  );

  const x = {
    search: xSearch,
    volume: xVolume,
    news: xNews,
    account: xAccount,
  };

  // GET https://simplefunctions.dev/api/dashboard2/market-watch-v2{query}
  // Docs: https://docs.simplefunctions.dev/api-reference/market-watch
  const marketWatchV2 = jsonGet<SimpleFunctionsOptionalQueryRequest>(
    SimpleFunctionsOptionalQueryRequestSchema,
    (req) => `/api/dashboard2/market-watch-v2${queryFromRequest(req)}`,
    "/api/dashboard2/market-watch-v2",
    false
  );

  // POST https://simplefunctions.dev/api/dashboard2/market-watch/panels
  // Docs: https://docs.simplefunctions.dev/api-reference/market-watch
  const marketWatchPanelsCreate = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/dashboard2/market-watch/panels",
    "/api/dashboard2/market-watch/panels",
    [],
    false
  );

  // PATCH https://simplefunctions.dev/api/dashboard2/market-watch/panels/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/market-watch
  const marketWatchPanelsUpdate = jsonBody<SimpleFunctionsIdRequest>(
    "PATCH",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/dashboard2/market-watch/panels/${requestId(req)}`,
    "/api/dashboard2/market-watch/panels/{id}",
    ["id"],
    false
  );

  // DELETE https://simplefunctions.dev/api/dashboard2/market-watch/panels/{id}
  // Docs: https://docs.simplefunctions.dev/api-reference/market-watch
  const marketWatchPanelsDelete = jsonBody<SimpleFunctionsIdRequest>(
    "DELETE",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/dashboard2/market-watch/panels/${requestId(req)}`,
    "/api/dashboard2/market-watch/panels/{id}",
    ["id"],
    false
  );

  // POST https://simplefunctions.dev/api/dashboard2/market-watch/panels/reorder
  // Docs: https://docs.simplefunctions.dev/api-reference/market-watch
  const marketWatchPanelsReorder = jsonBody<SimpleFunctionsRecordRequest>(
    "POST",
    SimpleFunctionsRecordRequestSchema,
    () => "/api/dashboard2/market-watch/panels/reorder",
    "/api/dashboard2/market-watch/panels/reorder",
    [],
    false
  );

  // sig-ok: run is an action method on the panel resource.
  // POST https://simplefunctions.dev/api/dashboard2/market-watch/panels/{id}/run
  // Docs: https://docs.simplefunctions.dev/api-reference/market-watch
  const marketWatchPanelsRun = jsonBody<SimpleFunctionsIdRequest>(
    "POST",
    SimpleFunctionsIdRequestSchema,
    (req) => `/api/dashboard2/market-watch/panels/${requestId(req)}/run`,
    "/api/dashboard2/market-watch/panels/{id}/run",
    ["id"],
    false
  );

  const dashboard2 = {
    marketWatchV2,
    marketWatch: {
      panels: {
        create: marketWatchPanelsCreate,
        update: marketWatchPanelsUpdate,
        delete: marketWatchPanelsDelete,
        reorder: marketWatchPanelsReorder,
        run: marketWatchPanelsRun,
      },
    },
  };

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
    auth: {
      cli: authCli,
    },
    calibration,
    changes,
    contracts: {
      tools: contractTools,
    },
    dashboard: {
      usage: dashboardUsage,
    },
    dashboard2,
    edges,
    feed,
    intents,
    keys,
    mcp,
    portfolio,
    prompt,
    proxy,
    public: publicApi,
    runtime: {
      exec: runtimeExec,
    },
    signup,
    skills: apiSkills,
    thesis: authThesis,
    tools,
    watch,
    alertRules,
    webhookEndpoints,
    alertDeliveries,
    x,
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
        auth: {
          cli: authCli,
        },
        dashboard2: {
          marketWatch: {
            panels: {
              create: marketWatchPanelsCreate,
              reorder: marketWatchPanelsReorder,
              run: marketWatchPanelsRun,
            },
          },
        },
        intents: {
          create: intentsCreate,
        },
        keys: {
          create: keysCreate,
        },
        mcp: {
          call: mcpCall,
        },
        portfolio: {
          ledger: {
            import: portfolioLedgerImport,
          },
          secrets: {
            create: portfolioSecretsCreate,
          },
          strategy: {
            create: portfolioStrategyCreate,
          },
          ticks: {
            create: portfolioTicksCreate,
          },
          trades: {
            create: portfolioTradesCreate,
          },
          trigger: portfolioTrigger,
          views: {
            create: portfolioViewsCreate,
          },
        },
        proxy,
        public: {
          discuss,
        },
        runtime: {
          exec: {
            trigger: runtimeExecTrigger,
          },
        },
        signup,
        thesis: {
          create: thesisCreate,
          signal: thesisSignal,
          evaluate: thesisEvaluate,
          augment: thesisAugment,
          nodes: thesisNodes,
          fork: thesisFork,
          whatif: thesisWhatif,
          positions: {
            create: thesisPositionsCreate,
          },
          strategies: {
            create: thesisStrategiesCreate,
          },
          publish: thesisPublish,
          videos: {
            create: thesisVideosCreate,
          },
        },
        watch: {
          create: watchCreate,
          identify: watchIdentify,
          refresh: watchRefresh,
        },
        alertRules: {
          create: alertRulesCreate,
          test: alertRulesTest,
        },
        webhookEndpoints: {
          create: webhookEndpointsCreate,
          test: webhookEndpointsTest,
        },
      },
    },
    put: {
      api: {
        portfolio: {
          config: {
            update: portfolioConfigUpdate,
          },
          state: {
            update: portfolioStateUpdate,
          },
          strategy: {
            update: portfolioStrategyUpdate,
          },
          views: {
            update: portfolioViewsUpdate,
          },
        },
      },
    },
    patch: {
      api: {
        dashboard2: {
          marketWatch: {
            panels: {
              update: marketWatchPanelsUpdate,
            },
          },
        },
        intents: {
          update: intentsUpdate,
        },
        thesis: {
          update: thesisUpdate,
          heartbeat: {
            update: thesisHeartbeatUpdate,
          },
          positions: {
            update: thesisPositionsUpdate,
          },
          strategies: {
            update: thesisStrategiesUpdate,
          },
        },
        watch: {
          update: watchUpdate,
        },
        alertRules: {
          update: alertRulesUpdate,
        },
        webhookEndpoints: {
          update: webhookEndpointsUpdate,
        },
      },
    },
    delete: {
      api: {
        dashboard2: {
          marketWatch: {
            panels: {
              delete: marketWatchPanelsDelete,
            },
          },
        },
        intents: {
          delete: intentsDelete,
        },
        keys: {
          delete: keysDelete,
        },
        portfolio: {
          secrets: {
            delete: portfolioSecretsDelete,
          },
          strategy: {
            delete: portfolioStrategyDelete,
          },
          views: {
            delete: portfolioViewsDelete,
          },
        },
        thesis: {
          delete: thesisDelete,
          unpublish: thesisUnpublish,
          positions: {
            delete: thesisPositionsDelete,
          },
          strategies: {
            delete: thesisStrategiesDelete,
          },
        },
        watch: {
          delete: watchDelete,
        },
        alertRules: {
          delete: alertRulesDelete,
        },
        webhookEndpoints: {
          delete: webhookEndpointsDelete,
        },
      },
    },
  });
}
