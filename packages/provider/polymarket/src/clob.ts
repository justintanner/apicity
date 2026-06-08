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
  PolymarketClobApiKeyResponse,
  PolymarketClobApiKeysResponse,
  PolymarketClobPostOrderResponse,
  PolymarketClobPostOrdersResponse,
  PolymarketClobCancelOrdersResponse,
  PolymarketClobOpenOrderResponse,
  PolymarketClobOpenOrdersResponse,
  PolymarketClobBalanceAllowanceResponse,
  PolymarketClobClosedOnlyResponse,
  PolymarketClobNotificationsResponse,
  PolymarketClobHeartbeatResponse,
  PolymarketClobHeartbeatV1Response,
  PolymarketClobOrderScoringResponse,
  PolymarketClobOrdersScoringResponse,
  PolymarketClobTradesResponse,
  PolymarketClobL1Headers,
  PolymarketClobTokenQuery,
  PolymarketClobPriceQuery,
  PolymarketClobPriceHistoryQuery,
  PolymarketClobPaginationQuery,
  PolymarketClobTokenBatchRequest,
  PolymarketClobPricesBatchRequest,
  PolymarketClobBatchPricesHistoryRequest,
  PolymarketClobPostOrderRequest,
  PolymarketClobPlaceOrderRequest,
  PolymarketClobPostOrdersRequest,
  PolymarketClobCancelOrderRequest,
  PolymarketClobCancelOrdersRequest,
  PolymarketClobCancelMarketOrdersRequest,
  PolymarketClobBalanceAllowanceQuery,
  PolymarketClobUserOrdersQuery,
  PolymarketClobUserTradesQuery,
  PolymarketClobNotificationsQuery,
  PolymarketClobDropNotificationsQuery,
  PolymarketClobOrderScoringQuery,
  PolymarketClobOrdersScoringQuery,
  PolymarketClobOrdersScoringRequest,
  PolymarketClobHeartbeatRequest,
  PolymarketClobGetNamespace,
  PolymarketClobPostNamespace,
  PolymarketClobDeleteNamespace,
  PolymarketClobPutNamespace,
  PolymarketError,
} from "./types";
import {
  PolymarketClobTokenBatchRequestSchema,
  PolymarketClobPricesBatchRequestSchema,
  PolymarketClobBatchPricesHistoryRequestSchema,
  PolymarketClobPostOrderRequestSchema,
  PolymarketClobPlaceOrderRequestSchema,
  PolymarketClobPostOrdersRequestSchema,
  PolymarketClobCancelOrderRequestSchema,
  PolymarketClobCancelOrdersRequestSchema,
  PolymarketClobCancelMarketOrdersRequestSchema,
  PolymarketClobOrdersScoringRequestSchema,
  PolymarketClobHeartbeatRequestSchema,
} from "./zod";
import { createRequestHelpers } from "./_helpers";
import { createClobTrader } from "./sign";

export interface PolymarketClobSubProvider {
  get: { clob: PolymarketClobGetNamespace };
  post: { clob: PolymarketClobPostNamespace };
  put: { clob: PolymarketClobPutNamespace };
  delete: { clob: PolymarketClobDeleteNamespace };
}

// Internal sub-factory for the CLOB host. Owns its own `baseURL` const so the
// endpoint-walker can resolve `https://clob.polymarket.com/...` URLs without
// needing per-provider multi-base support.
export function createClobProvider(
  opts: PolymarketOptions
): PolymarketClobSubProvider {
  const baseURL = opts.clobBaseURL ?? "https://clob.polymarket.com";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const {
    makeGetRequest,
    makeGetTextRequest,
    makeJsonRequest,
    makeAuthenticatedRequest,
    makeL1Request,
  } = createRequestHelpers(doFetch, timeout, opts);

  // Wallet-backed order signer (lazy — only built when a trade is placed).
  const trader = createClobTrader(opts);

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

  function buildQuery(params?: Record<string, unknown>): string {
    if (!params) return "";
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) usp.append(key, String(item));
        continue;
      }
      usp.set(key, String(value));
    }
    const s = usp.toString();
    return s.length > 0 ? `?${s}` : "";
  }

  function resolveL1Args(
    headersOrSignal?: PolymarketClobL1Headers | AbortSignal,
    signal?: AbortSignal
  ): {
    headers?: PolymarketClobL1Headers;
    signal?: AbortSignal;
  } {
    if (headersOrSignal instanceof AbortSignal) {
      return { signal: headersOrSignal };
    }
    return { headers: headersOrSignal, signal };
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

  // POST https://clob.polymarket.com/auth/api-key
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobAuthApiKey(
    headersOrSignal?: PolymarketClobL1Headers | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketClobApiKeyResponse> {
    const args = resolveL1Args(headersOrSignal, signal);
    return makeL1Request<PolymarketClobApiKeyResponse>(
      "POST",
      `${baseURL}/auth/api-key`,
      args.headers,
      args.signal
    );
  }

  // GET https://clob.polymarket.com/auth/api-keys
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobAuthApiKeys(
    headersOrSignal?: PolymarketClobL1Headers | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketClobApiKeysResponse> {
    const args = resolveL1Args(headersOrSignal, signal);
    return makeL1Request<PolymarketClobApiKeysResponse>(
      "GET",
      `${baseURL}/auth/api-keys`,
      args.headers,
      args.signal
    );
  }

  // GET https://clob.polymarket.com/auth/derive-api-key
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobAuthDeriveApiKey(
    headersOrSignal?: PolymarketClobL1Headers | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketClobApiKeyResponse> {
    const args = resolveL1Args(headersOrSignal, signal);
    return makeL1Request<PolymarketClobApiKeyResponse>(
      "GET",
      `${baseURL}/auth/derive-api-key`,
      args.headers,
      args.signal
    );
  }

  // DELETE https://clob.polymarket.com/auth/api-key
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobAuthDeleteApiKey(signal?: AbortSignal): Promise<string> {
    return makeAuthenticatedRequest<string>(
      "DELETE",
      `${baseURL}/auth/api-key`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/auth/ban-status/closed-only
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobAuthClosedOnly(
    signal?: AbortSignal
  ): Promise<PolymarketClobClosedOnlyResponse> {
    return makeAuthenticatedRequest<PolymarketClobClosedOnlyResponse>(
      "GET",
      `${baseURL}/auth/ban-status/closed-only`,
      undefined,
      signal
    );
  }

  const authGet = {
    apiKeys: clobAuthApiKeys,
    deriveApiKey: clobAuthDeriveApiKey,
    banStatus: {
      closedOnly: clobAuthClosedOnly,
    },
  } as PolymarketClobGetNamespace["auth"];

  const authPost = {
    apiKey: clobAuthApiKey,
  };

  const authDelete = {
    apiKey: clobAuthDeleteApiKey,
  };

  // POST https://clob.polymarket.com/order
  // Docs: https://docs.polymarket.com/api-reference/trade/post-a-new-order
  const clobPostOrder = Object.assign(
    async (
      req: PolymarketClobPostOrderRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobPostOrderResponse> => {
      return makeAuthenticatedRequest<PolymarketClobPostOrderResponse>(
        "POST",
        `${baseURL}/order`,
        req,
        signal
      );
    },
    { schema: PolymarketClobPostOrderRequestSchema }
  );

  // Builds + EIP-712-signs a limit order from plain price/size using the
  // configured wallet, then submits it. Returns the CLOB post response.

  // POST https://clob.polymarket.com/order
  // Docs: https://docs.polymarket.com/api-reference/trade/post-a-new-order
  const clobPlaceOrder = Object.assign(
    async (
      req: PolymarketClobPlaceOrderRequest,
      _signal?: AbortSignal
    ): Promise<unknown> => {
      return trader.placeOrder(req);
    },
    { schema: PolymarketClobPlaceOrderRequestSchema }
  );

  // POST https://clob.polymarket.com/orders
  // Docs: https://docs.polymarket.com/api-reference/trade/post-multiple-orders
  const clobPostOrders = Object.assign(
    async (
      req: PolymarketClobPostOrdersRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobPostOrdersResponse> => {
      return makeAuthenticatedRequest<PolymarketClobPostOrdersResponse>(
        "POST",
        `${baseURL}/orders`,
        req,
        signal
      );
    },
    { schema: PolymarketClobPostOrdersRequestSchema }
  );

  // DELETE https://clob.polymarket.com/order
  // Docs: https://docs.polymarket.com/api-reference/trade/cancel-single-order
  const clobCancelOrder = Object.assign(
    async (
      req: PolymarketClobCancelOrderRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobCancelOrdersResponse> => {
      return makeAuthenticatedRequest<PolymarketClobCancelOrdersResponse>(
        "DELETE",
        `${baseURL}/order`,
        req,
        signal
      );
    },
    { schema: PolymarketClobCancelOrderRequestSchema }
  );

  // DELETE https://clob.polymarket.com/orders
  // Docs: https://docs.polymarket.com/api-reference/trade/cancel-multiple-orders
  const clobCancelOrders = Object.assign(
    async (
      req: PolymarketClobCancelOrdersRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobCancelOrdersResponse> => {
      return makeAuthenticatedRequest<PolymarketClobCancelOrdersResponse>(
        "DELETE",
        `${baseURL}/orders`,
        req,
        signal
      );
    },
    { schema: PolymarketClobCancelOrdersRequestSchema }
  );

  // DELETE https://clob.polymarket.com/cancel-all
  // Docs: https://docs.polymarket.com/api-reference/trade/cancel-all-orders
  async function clobCancelAll(
    signal?: AbortSignal
  ): Promise<PolymarketClobCancelOrdersResponse> {
    return makeAuthenticatedRequest<PolymarketClobCancelOrdersResponse>(
      "DELETE",
      `${baseURL}/cancel-all`,
      undefined,
      signal
    );
  }

  // DELETE https://clob.polymarket.com/cancel-market-orders
  // Docs: https://docs.polymarket.com/api-reference/trade/cancel-orders-for-a-market
  const clobCancelMarketOrders = Object.assign(
    async (
      req: PolymarketClobCancelMarketOrdersRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobCancelOrdersResponse> => {
      return makeAuthenticatedRequest<PolymarketClobCancelOrdersResponse>(
        "DELETE",
        `${baseURL}/cancel-market-orders`,
        req,
        signal
      );
    },
    { schema: PolymarketClobCancelMarketOrdersRequestSchema }
  );

  // GET https://clob.polymarket.com/data/orders{query}
  // Docs: https://docs.polymarket.com/api-reference/trade/get-user-orders
  async function clobDataOrders(
    params?: PolymarketClobUserOrdersQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobOpenOrdersResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobOpenOrdersResponse>(
      "GET",
      `${baseURL}/data/orders${query}`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/data/order/{orderID}
  // Docs: https://docs.polymarket.com/api-reference/trade/get-single-order-by-id
  async function clobDataOrder(
    orderID: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobOpenOrderResponse> {
    return makeAuthenticatedRequest<PolymarketClobOpenOrderResponse>(
      "GET",
      `${baseURL}/data/order/${encodeURIComponent(orderID)}`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/data/trades{query}
  // Docs: https://docs.polymarket.com/api-reference/trade/get-trades
  async function clobDataTrades(
    params?: PolymarketClobUserTradesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobTradesResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobTradesResponse>(
      "GET",
      `${baseURL}/data/trades${query}`,
      undefined,
      signal
    );
  }

  const dataGet = {
    orders: clobDataOrders,
    order: clobDataOrder,
    trades: clobDataTrades,
  };

  // GET https://clob.polymarket.com/balance-allowance{query}
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobBalanceAllowanceGet(
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBalanceAllowanceResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobBalanceAllowanceResponse>(
      "GET",
      `${baseURL}/balance-allowance${query}`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/balance-allowance/update{query}
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobBalanceAllowanceUpdateGet(
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBalanceAllowanceResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobBalanceAllowanceResponse>(
      "GET",
      `${baseURL}/balance-allowance/update${query}`,
      undefined,
      signal
    );
  }

  const clobBalanceAllowance = Object.assign(clobBalanceAllowanceGet, {
    update: clobBalanceAllowanceUpdateGet,
  });

  // PUT https://clob.polymarket.com/balance-allowance{query}
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobBalanceAllowancePut(
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<Record<string, unknown>>(
      "PUT",
      `${baseURL}/balance-allowance${query}`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/notifications{query}
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobNotifications(
    params: PolymarketClobNotificationsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobNotificationsResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobNotificationsResponse>(
      "GET",
      `${baseURL}/notifications${query}`,
      undefined,
      signal
    );
  }

  // DELETE https://clob.polymarket.com/notifications{query}
  // Docs: https://docs.polymarket.com/api-reference/authentication
  async function clobDropNotifications(
    params: PolymarketClobDropNotificationsQuery,
    signal?: AbortSignal
  ): Promise<string> {
    const query = `?ids=${encodeURIComponent(params.ids.join(","))}`;
    return makeAuthenticatedRequest<string>(
      "DELETE",
      `${baseURL}/notifications${query}`,
      undefined,
      signal
    );
  }

  // POST https://clob.polymarket.com/heartbeats
  // Docs: https://docs.polymarket.com/api-reference/trade/send-heartbeat
  async function clobHeartbeats(
    signal?: AbortSignal
  ): Promise<PolymarketClobHeartbeatResponse> {
    return makeAuthenticatedRequest<PolymarketClobHeartbeatResponse>(
      "POST",
      `${baseURL}/heartbeats`,
      undefined,
      signal
    );
  }

  // POST https://clob.polymarket.com/v1/heartbeats
  // Docs: https://docs.polymarket.com/api-reference/trade/send-heartbeat
  const clobHeartbeatsV1 = Object.assign(
    async (
      req: PolymarketClobHeartbeatRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobHeartbeatV1Response> => {
      return makeAuthenticatedRequest<PolymarketClobHeartbeatV1Response>(
        "POST",
        `${baseURL}/v1/heartbeats`,
        req,
        signal
      );
    },
    { schema: PolymarketClobHeartbeatRequestSchema }
  );

  // GET https://clob.polymarket.com/order-scoring{query}
  // Docs: https://docs.polymarket.com/api-reference/trade/get-order-scoring-status
  async function clobOrderScoring(
    params: PolymarketClobOrderScoringQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobOrderScoringResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobOrderScoringResponse>(
      "GET",
      `${baseURL}/order-scoring${query}`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/orders-scoring{query}
  // Docs: https://docs.polymarket.com/api-reference/trade/get-order-scoring-status
  async function clobOrdersScoring(
    params: PolymarketClobOrdersScoringQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobOrdersScoringResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobOrdersScoringResponse>(
      "GET",
      `${baseURL}/orders-scoring${query}`,
      undefined,
      signal
    );
  }

  // POST https://clob.polymarket.com/orders-scoring
  // Docs: https://docs.polymarket.com/api-reference/trade/get-order-scoring-status
  const clobOrdersScoringPost = Object.assign(
    async (
      req: PolymarketClobOrdersScoringRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobOrdersScoringResponse> => {
      return makeAuthenticatedRequest<PolymarketClobOrdersScoringResponse>(
        "POST",
        `${baseURL}/orders-scoring`,
        req,
        signal
      );
    },
    { schema: PolymarketClobOrdersScoringRequestSchema }
  );

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
        auth: authGet,
        time: clobTime,
        book: clobBook,
        price: clobPrice,
        midpoint: clobMidpoint,
        spread: clobSpread,
        lastTradePrice: clobLastTradePrice,
        tickSize: clobTickSize,
        feeRate: clobFeeRate,
        pricesHistory: clobPricesHistory,
        markets: clobMarkets as PolymarketClobGetNamespace["markets"],
        samplingMarkets: clobSamplingMarkets,
        simplifiedMarkets: clobSimplifiedMarkets,
        samplingSimplifiedMarkets: clobSamplingSimplifiedMarkets,
        marketsByToken: clobMarketsByToken,
        clobMarkets: clobMarketsCompact,
        data: dataGet,
        balanceAllowance: clobBalanceAllowance,
        notifications: clobNotifications,
        orderScoring: clobOrderScoring,
        ordersScoring: clobOrdersScoring,
      },
    },
    post: {
      clob: {
        auth: authPost,
        order: clobPostOrder,
        placeOrder: clobPlaceOrder,
        orders: clobPostOrders,
        books: clobBooksBatch,
        prices: clobPricesBatch,
        midpoints: clobMidpointsBatch,
        spreads: clobSpreadsBatch,
        lastTradesPrices: clobLastTradesPricesBatch,
        batchPricesHistory: clobBatchPricesHistory,
        heartbeats: clobHeartbeats,
        v1: {
          heartbeats: clobHeartbeatsV1,
        },
        ordersScoring: clobOrdersScoringPost,
      },
    },
    put: {
      clob: {
        balanceAllowance: clobBalanceAllowancePut,
      },
    },
    delete: {
      clob: {
        auth: authDelete,
        order: clobCancelOrder,
        orders: clobCancelOrders,
        cancelAll: clobCancelAll,
        cancelMarketOrders: clobCancelMarketOrders,
        notifications: clobDropNotifications,
      },
    },
  };
}
