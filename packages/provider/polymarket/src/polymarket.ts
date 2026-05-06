import {
  PolymarketOptions,
  PolymarketServerTime,
  PolymarketClobBook,
  PolymarketClobPriceResponse,
  PolymarketClobMidpointResponse,
  PolymarketClobSpreadResponse,
  PolymarketClobLastTradePriceResponse,
  PolymarketClobTickSizeResponse,
  PolymarketClobFeeRateResponse,
  PolymarketClobPriceHistoryResponse,
  PolymarketClobMarket,
  PolymarketClobMarketListResponse,
  PolymarketClobSimplifiedMarketListResponse,
  PolymarketClobMarketsByTokenResponse,
  PolymarketClobMarketCompact,
  PolymarketClobBooksBatchResponse,
  PolymarketClobPricesBatchResponse,
  PolymarketClobMidpointsBatchResponse,
  PolymarketClobSpreadsBatchResponse,
  PolymarketClobLastTradesPricesBatchResponse,
  PolymarketClobBatchPricesHistoryResponse,
  PolymarketClobTokenQuery,
  PolymarketClobPriceQuery,
  PolymarketClobPriceHistoryQuery,
  PolymarketClobPaginationQuery,
  PolymarketClobTokenBatchRequest,
  PolymarketClobPricesBatchRequest,
  PolymarketClobBatchPricesHistoryRequest,
  PolymarketProvider,
  PolymarketError,
} from "./types";
import {
  PolymarketClobTokenBatchRequestSchema,
  PolymarketClobPricesBatchRequestSchema,
  PolymarketClobBatchPricesHistoryRequestSchema,
} from "./zod";

export function polymarket(opts: PolymarketOptions = {}): PolymarketProvider {
  // PR 1 + C1 only ship CLOB endpoints, so a single `baseURL` covers the
  // factory's needs and lets the endpoint-walker resolve full URLs against
  // it. When subsequent PRs add Gamma and Data endpoints, this factory will
  // be split into sub-factories (one per host) following the pattern in
  // packages/provider/kie/src/kie.ts.
  const baseURL = opts.clobBaseURL ?? "https://clob.polymarket.com";
  // Reserve the option keys so the public surface is stable from day one
  // even though no endpoint reads them yet.
  void opts.gammaBaseURL;
  void opts.dataBaseURL;
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

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

  // Polymarket's APIs return errors with several shapes — Gamma typically
  // returns `{ error }` or `{ message }`, CLOB returns `{ error }` or a plain
  // string, Data API returns `{ message }`. Surface whatever string the
  // server provided rather than a generic "Polymarket API error: 500".
  function formatErrorMessage(status: number, body: unknown): string {
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

  async function readErrorBody(res: Response): Promise<unknown> {
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

  // GET https://clob.polymarket.com/time
  // Docs: https://docs.polymarket.com/api-reference/clob/get-server-time
  async function clobTime(signal?: AbortSignal): Promise<PolymarketServerTime> {
    const text = (await makeGetTextRequest(`${baseURL}/time`, signal)).trim();
    const n = Number(text);
    if (!Number.isFinite(n)) {
      throw new PolymarketError(
        `Polymarket /time response was not a finite number: ${text}`,
        200,
        text
      );
    }
    return n;
  }

  // GET https://clob.polymarket.com/book{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-order-book
  async function clobBook(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBook> {
    const query = `?token_id=${encodeURIComponent(params.token_id)}`;
    return makeGetRequest<PolymarketClobBook>(
      `${baseURL}/book${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/price{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-market-price
  async function clobPrice(
    params: PolymarketClobPriceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobPriceResponse> {
    const query =
      `?token_id=${encodeURIComponent(params.token_id)}` +
      `&side=${encodeURIComponent(params.side)}`;
    return makeGetRequest<PolymarketClobPriceResponse>(
      `${baseURL}/price${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/midpoint{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-midpoint
  async function clobMidpoint(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobMidpointResponse> {
    const query = `?token_id=${encodeURIComponent(params.token_id)}`;
    return makeGetRequest<PolymarketClobMidpointResponse>(
      `${baseURL}/midpoint${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/spread{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-spread
  async function clobSpread(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobSpreadResponse> {
    const query = `?token_id=${encodeURIComponent(params.token_id)}`;
    return makeGetRequest<PolymarketClobSpreadResponse>(
      `${baseURL}/spread${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/last-trade-price{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-last-trade-price
  async function clobLastTradePrice(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobLastTradePriceResponse> {
    const query = `?token_id=${encodeURIComponent(params.token_id)}`;
    return makeGetRequest<PolymarketClobLastTradePriceResponse>(
      `${baseURL}/last-trade-price${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/tick-size/{tokenId}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-tick-size
  async function clobTickSize(
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobTickSizeResponse> {
    return makeGetRequest<PolymarketClobTickSizeResponse>(
      `${baseURL}/tick-size/${encodeURIComponent(tokenId)}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/fee-rate/{tokenId}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-fee-rate
  async function clobFeeRate(
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobFeeRateResponse> {
    return makeGetRequest<PolymarketClobFeeRateResponse>(
      `${baseURL}/fee-rate/${encodeURIComponent(tokenId)}`,
      signal
    );
  }

  function paginationQuery(params?: PolymarketClobPaginationQuery): string {
    if (!params?.next_cursor) return "";
    return `?next_cursor=${encodeURIComponent(params.next_cursor)}`;
  }

  // GET https://clob.polymarket.com/markets/{paramsOrConditionIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-markets
  async function clobMarkets(
    paramsOrConditionIdOrSignal?:
      | PolymarketClobPaginationQuery
      | string
      | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarket | PolymarketClobMarketListResponse> {
    if (typeof paramsOrConditionIdOrSignal === "string") {
      return makeGetRequest<PolymarketClobMarket>(
        `${baseURL}/markets/${encodeURIComponent(paramsOrConditionIdOrSignal)}`,
        signal
      );
    }
    // The first arg may also be an AbortSignal when the caller passes a
    // signal directly to list-form (`clob.markets(signal)`); treat anything
    // that isn't a plain object as the signal.
    const isPagination =
      paramsOrConditionIdOrSignal !== undefined &&
      paramsOrConditionIdOrSignal !== null &&
      typeof paramsOrConditionIdOrSignal === "object" &&
      !(paramsOrConditionIdOrSignal instanceof AbortSignal);
    const params = isPagination
      ? (paramsOrConditionIdOrSignal as PolymarketClobPaginationQuery)
      : undefined;
    const effectiveSignal = isPagination
      ? signal
      : (paramsOrConditionIdOrSignal as AbortSignal | undefined);
    const query = paginationQuery(params);
    return makeGetRequest<PolymarketClobMarketListResponse>(
      `${baseURL}/markets${query}`,
      effectiveSignal
    );
  }

  // GET https://clob.polymarket.com/sampling-markets{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-sampling-markets
  async function clobSamplingMarkets(
    params?: PolymarketClobPaginationQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarketListResponse> {
    const query = paginationQuery(params);
    return makeGetRequest<PolymarketClobMarketListResponse>(
      `${baseURL}/sampling-markets${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/simplified-markets{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-simplified-markets
  async function clobSimplifiedMarkets(
    params?: PolymarketClobPaginationQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobSimplifiedMarketListResponse> {
    const query = paginationQuery(params);
    return makeGetRequest<PolymarketClobSimplifiedMarketListResponse>(
      `${baseURL}/simplified-markets${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/sampling-simplified-markets{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-sampling-simplified-markets
  async function clobSamplingSimplifiedMarkets(
    params?: PolymarketClobPaginationQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobSimplifiedMarketListResponse> {
    const query = paginationQuery(params);
    return makeGetRequest<PolymarketClobSimplifiedMarketListResponse>(
      `${baseURL}/sampling-simplified-markets${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/markets-by-token/{tokenId}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-market-by-token
  async function clobMarketsByToken(
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarketsByTokenResponse> {
    return makeGetRequest<PolymarketClobMarketsByTokenResponse>(
      `${baseURL}/markets-by-token/${encodeURIComponent(tokenId)}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/clob-markets/{conditionId}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-clob-market-info
  async function clobMarketsCompact(
    conditionId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarketCompact> {
    return makeGetRequest<PolymarketClobMarketCompact>(
      `${baseURL}/clob-markets/${encodeURIComponent(conditionId)}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/prices-history{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-prices-history
  async function clobPricesHistory(
    params: PolymarketClobPriceHistoryQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobPriceHistoryResponse> {
    const usp = new URLSearchParams();
    usp.set("market", params.market);
    if (params.interval !== undefined) usp.set("interval", params.interval);
    if (params.startTs !== undefined)
      usp.set("startTs", String(params.startTs));
    if (params.endTs !== undefined) usp.set("endTs", String(params.endTs));
    if (params.fidelity !== undefined)
      usp.set("fidelity", String(params.fidelity));
    const query = `?${usp.toString()}`;
    return makeGetRequest<PolymarketClobPriceHistoryResponse>(
      `${baseURL}/prices-history${query}`,
      signal
    );
  }

  // POST https://clob.polymarket.com/books
  // Docs: https://docs.polymarket.com/api-reference/clob/get-order-books
  const clobBooksBatch = Object.assign(
    async (
      req: PolymarketClobTokenBatchRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobBooksBatchResponse> => {
      return makeJsonRequest<PolymarketClobBooksBatchResponse>(
        `${baseURL}/books`,
        req,
        signal
      );
    },
    { schema: PolymarketClobTokenBatchRequestSchema }
  );

  // POST https://clob.polymarket.com/prices
  // Docs: https://docs.polymarket.com/api-reference/clob/get-market-prices
  const clobPricesBatch = Object.assign(
    async (
      req: PolymarketClobPricesBatchRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobPricesBatchResponse> => {
      return makeJsonRequest<PolymarketClobPricesBatchResponse>(
        `${baseURL}/prices`,
        req,
        signal
      );
    },
    { schema: PolymarketClobPricesBatchRequestSchema }
  );

  // POST https://clob.polymarket.com/midpoints
  // Docs: https://docs.polymarket.com/api-reference/clob/get-midpoints
  const clobMidpointsBatch = Object.assign(
    async (
      req: PolymarketClobTokenBatchRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobMidpointsBatchResponse> => {
      return makeJsonRequest<PolymarketClobMidpointsBatchResponse>(
        `${baseURL}/midpoints`,
        req,
        signal
      );
    },
    { schema: PolymarketClobTokenBatchRequestSchema }
  );

  // POST https://clob.polymarket.com/spreads
  // Docs: https://docs.polymarket.com/api-reference/clob/get-spreads
  const clobSpreadsBatch = Object.assign(
    async (
      req: PolymarketClobTokenBatchRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobSpreadsBatchResponse> => {
      return makeJsonRequest<PolymarketClobSpreadsBatchResponse>(
        `${baseURL}/spreads`,
        req,
        signal
      );
    },
    { schema: PolymarketClobTokenBatchRequestSchema }
  );

  // POST https://clob.polymarket.com/last-trades-prices
  // Docs: https://docs.polymarket.com/api-reference/clob/get-last-trades-prices
  const clobLastTradesPricesBatch = Object.assign(
    async (
      req: PolymarketClobTokenBatchRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobLastTradesPricesBatchResponse> => {
      return makeJsonRequest<PolymarketClobLastTradesPricesBatchResponse>(
        `${baseURL}/last-trades-prices`,
        req,
        signal
      );
    },
    { schema: PolymarketClobTokenBatchRequestSchema }
  );

  // POST https://clob.polymarket.com/batch-prices-history
  // Docs: https://docs.polymarket.com/api-reference/clob/get-batch-prices-history
  const clobBatchPricesHistory = Object.assign(
    async (
      req: PolymarketClobBatchPricesHistoryRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobBatchPricesHistoryResponse> => {
      return makeJsonRequest<PolymarketClobBatchPricesHistoryResponse>(
        `${baseURL}/batch-prices-history`,
        req,
        signal
      );
    },
    { schema: PolymarketClobBatchPricesHistoryRequestSchema }
  );

  return {
    get: {
      clob: {
        time: clobTime,
        book: clobBook,
        price: clobPrice,
        midpoint: clobMidpoint,
        spread: clobSpread,
        lastTradePrice: clobLastTradePrice,
        tickSize: clobTickSize,
        feeRate: clobFeeRate,
        pricesHistory: clobPricesHistory,
        markets: clobMarkets as PolymarketProvider["get"]["clob"]["markets"],
        samplingMarkets: clobSamplingMarkets,
        simplifiedMarkets: clobSimplifiedMarkets,
        samplingSimplifiedMarkets: clobSamplingSimplifiedMarkets,
        marketsByToken: clobMarketsByToken,
        clobMarkets: clobMarketsCompact,
      },
    },
    post: {
      clob: {
        books: clobBooksBatch,
        prices: clobPricesBatch,
        midpoints: clobMidpointsBatch,
        spreads: clobSpreadsBatch,
        lastTradesPrices: clobLastTradesPricesBatch,
        batchPricesHistory: clobBatchPricesHistory,
      },
    },
  };
}
