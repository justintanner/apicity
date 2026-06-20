import {
  PolymarketOptions,
  PolymarketServerTime,
  PolymarketClobBook,
  PolymarketClobPriceResponse,
  PolymarketClobMidpointResponse,
  PolymarketClobSpreadResponse,
  PolymarketClobLastTradePriceResponse,
  PolymarketClobBooksResponse,
  PolymarketClobPricesResponse,
  PolymarketClobMidpointsResponse,
  PolymarketClobLastTradesPricesResponse,
  PolymarketClobTickSizeResponse,
  PolymarketClobFeeRateResponse,
  PolymarketClobNegRiskResponse,
  PolymarketClobPriceHistoryResponse,
  PolymarketClobMarket,
  PolymarketClobMarketListResponse,
  PolymarketClobSimplifiedMarketListResponse,
  PolymarketClobMarketsByTokenResponse,
  PolymarketClobMarketCompact,
  PolymarketClobLiveActivityResponse,
  PolymarketClobBooksBatchResponse,
  PolymarketClobPricesBatchResponse,
  PolymarketClobMidpointsBatchResponse,
  PolymarketClobSpreadsBatchResponse,
  PolymarketClobLastTradesPricesBatchResponse,
  PolymarketClobBatchPricesHistoryResponse,
  PolymarketClobApiKeyResponse,
  PolymarketClobApiKeysResponse,
  PolymarketClobBuilderApiKeyResponse,
  PolymarketClobBuilderApiKeysResponse,
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
  PolymarketClobRewardsUserResponse,
  PolymarketClobRewardsUserTotalResponse,
  PolymarketClobRewardPercentagesResponse,
  PolymarketClobRewardsUserMarketsResponse,
  PolymarketClobRewardsCurrentResponse,
  PolymarketClobRewardsMarketResponse,
  PolymarketClobRewardsMultiMarketsResponse,
  PolymarketClobRebatesCurrentResponse,
  PolymarketClobBuilderTradesResponse,
  PolymarketClobL1Headers,
  PolymarketClobTokenQuery,
  PolymarketClobPriceQuery,
  PolymarketClobTokenIdsQuery,
  PolymarketClobPricesQuery,
  PolymarketClobPriceHistoryQuery,
  PolymarketClobPaginationQuery,
  PolymarketClobLiveActivityRequest,
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
  PolymarketClobRewardsUserQuery,
  PolymarketClobRewardsUserTotalQuery,
  PolymarketClobRewardPercentagesQuery,
  PolymarketClobRewardsUserMarketsQuery,
  PolymarketClobRewardsCurrentQuery,
  PolymarketClobRewardsMarketQuery,
  PolymarketClobRewardsMultiMarketsQuery,
  PolymarketClobRebatesCurrentQuery,
  PolymarketClobBuilderTradesQuery,
  PolymarketClobGetNamespace,
  PolymarketClobPostNamespace,
  PolymarketClobDeleteNamespace,
  PolymarketClobPutNamespace,
  PolymarketError,
} from "./types";
import {
  PolymarketClobLiveActivityRequestSchema,
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
  // Docs: https://docs.polymarket.com/api-reference/data/get-server-time.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-order-book.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-market-price.md
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
  // Docs: https://docs.polymarket.com/api-reference/data/get-midpoint-price.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-spread.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-last-trade-price.md
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

  // GET https://clob.polymarket.com/books{query}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-order-books.md
  async function clobBooks(
    params: PolymarketClobTokenIdsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBooksResponse> {
    const query = tokenIdsQuery(params);
    return makeGetRequest<PolymarketClobBooksResponse>(
      `${baseURL}/books${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/prices{query}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-market-prices.md
  async function clobPrices(
    params: PolymarketClobPricesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobPricesResponse> {
    const query =
      `?token_ids=${encodeURIComponent(params.token_ids.join(","))}` +
      `&sides=${encodeURIComponent(params.sides.join(","))}`;
    return makeGetRequest<PolymarketClobPricesResponse>(
      `${baseURL}/prices${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/midpoints{query}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-midpoint-prices.md
  async function clobMidpoints(
    params: PolymarketClobTokenIdsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobMidpointsResponse> {
    const query = tokenIdsQuery(params);
    return makeGetRequest<PolymarketClobMidpointsResponse>(
      `${baseURL}/midpoints${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/last-trades-prices{query}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-last-trade-prices.md
  async function clobLastTradesPrices(
    params: PolymarketClobTokenIdsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobLastTradesPricesResponse> {
    const query = tokenIdsQuery(params);
    return makeGetRequest<PolymarketClobLastTradesPricesResponse>(
      `${baseURL}/last-trades-prices${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/tick-size/{tokenId}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-tick-size-by-path-parameter.md
  async function clobTickSize(
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobTickSizeResponse> {
    return makeGetRequest<PolymarketClobTickSizeResponse>(
      `${baseURL}/tick-size/${encodeURIComponent(tokenId)}`,
      signal
    );
  }

  // sig-ok: query-form alias kept distinct from path-form tickSize
  // GET https://clob.polymarket.com/tick-size{query}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-tick-size.md
  async function clobTickSizeByQuery(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobTickSizeResponse> {
    const query = tokenQuery(params);
    return makeGetRequest<PolymarketClobTickSizeResponse>(
      `${baseURL}/tick-size${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/fee-rate/{tokenId}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-fee-rate-by-path-parameter.md
  async function clobFeeRate(
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobFeeRateResponse> {
    return makeGetRequest<PolymarketClobFeeRateResponse>(
      `${baseURL}/fee-rate/${encodeURIComponent(tokenId)}`,
      signal
    );
  }

  // sig-ok: query-form alias kept distinct from path-form feeRate
  // GET https://clob.polymarket.com/fee-rate{query}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-fee-rate.md
  async function clobFeeRateByQuery(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobFeeRateResponse> {
    const query = tokenQuery(params);
    return makeGetRequest<PolymarketClobFeeRateResponse>(
      `${baseURL}/fee-rate${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/neg-risk/{tokenId}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-neg-risk-by-path-parameter.md
  async function clobNegRisk(
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobNegRiskResponse> {
    return makeGetRequest<PolymarketClobNegRiskResponse>(
      `${baseURL}/neg-risk/${encodeURIComponent(tokenId)}`,
      signal
    );
  }

  // sig-ok: query-form alias kept distinct from path-form negRisk
  // GET https://clob.polymarket.com/neg-risk{query}
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-neg-risk.md
  async function clobNegRiskByQuery(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobNegRiskResponse> {
    const query = tokenQuery(params);
    return makeGetRequest<PolymarketClobNegRiskResponse>(
      `${baseURL}/neg-risk${query}`,
      signal
    );
  }

  function paginationQuery(params?: PolymarketClobPaginationQuery): string {
    if (!params?.next_cursor) return "";
    return `?next_cursor=${encodeURIComponent(params.next_cursor)}`;
  }

  function tokenQuery(params: PolymarketClobTokenQuery): string {
    return `?token_id=${encodeURIComponent(params.token_id)}`;
  }

  function tokenIdsQuery(params: PolymarketClobTokenIdsQuery): string {
    return `?token_ids=${encodeURIComponent(params.token_ids.join(","))}`;
  }

  // The CLOB `/balance-allowance` endpoints resolve *which* wallet's balance to
  // return from `signature_type`: omit it and the server assumes type 0 (the EOA
  // signer in POLY_ADDRESS), which for proxy/funder setups (types 1/2/3) reads an
  // empty signer instead of the funded proxy. The configured `clobSignatureType`
  // is the right default (mirrors orders, which already use it); an explicit
  // caller value still wins.
  function withDefaultSignatureType(
    params: PolymarketClobBalanceAllowanceQuery
  ): PolymarketClobBalanceAllowanceQuery {
    if (params?.signature_type !== undefined) return params;
    if (opts.clobSignatureType === undefined) return params;
    return { ...params, signature_type: opts.clobSignatureType };
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

  // Legacy compatibility: current public market listings are documented on Gamma.
  // GET https://clob.polymarket.com/markets/{paramsOrConditionIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/markets/list-markets.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/get-sampling-markets.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/get-simplified-markets.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/get-sampling-simplified-markets.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/get-market-by-token.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/get-clob-market-info.md
  async function clobMarketsCompact(
    conditionId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobMarketCompact> {
    return makeGetRequest<PolymarketClobMarketCompact>(
      `${baseURL}/clob-markets/${encodeURIComponent(conditionId)}`,
      signal
    );
  }

  // sig-ok: singular convenience name for markets/live-activity lookup
  // GET https://clob.polymarket.com/markets/live-activity/{conditionId}
  // Docs: https://docs.polymarket.com/api-reference/markets/get-live-activity-by-condition-id.md
  async function clobMarketLiveActivity(
    conditionId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobLiveActivityResponse> {
    return makeGetRequest<PolymarketClobLiveActivityResponse>(
      `${baseURL}/markets/live-activity/${encodeURIComponent(conditionId)}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/prices-history{query}
  // Docs: https://docs.polymarket.com/api-reference/markets/get-prices-history.md
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
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
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
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
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
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
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
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
  async function clobAuthDeleteApiKey(signal?: AbortSignal): Promise<string> {
    return makeAuthenticatedRequest<string>(
      "DELETE",
      `${baseURL}/auth/api-key`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/auth/ban-status/closed-only
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
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

  // GET https://clob.polymarket.com/auth/builder-api-key
  // Docs: https://docs.polymarket.com/api-spec/clob-openapi.yaml
  async function clobAuthBuilderApiKeyGet(
    signal?: AbortSignal
  ): Promise<PolymarketClobBuilderApiKeysResponse> {
    return makeAuthenticatedRequest<PolymarketClobBuilderApiKeysResponse>(
      "GET",
      `${baseURL}/auth/builder-api-key`,
      undefined,
      signal
    );
  }

  // POST https://clob.polymarket.com/auth/builder-api-key
  // Docs: https://docs.polymarket.com/api-spec/clob-openapi.yaml
  async function clobAuthBuilderApiKeyPost(
    signal?: AbortSignal
  ): Promise<PolymarketClobBuilderApiKeyResponse> {
    return makeAuthenticatedRequest<PolymarketClobBuilderApiKeyResponse>(
      "POST",
      `${baseURL}/auth/builder-api-key`,
      undefined,
      signal
    );
  }

  // DELETE https://clob.polymarket.com/auth/builder-api-key
  // Docs: https://docs.polymarket.com/api-spec/clob-openapi.yaml
  async function clobAuthBuilderApiKeyDelete(
    signal?: AbortSignal
  ): Promise<string> {
    return makeAuthenticatedRequest<string>(
      "DELETE",
      `${baseURL}/auth/builder-api-key`,
      undefined,
      signal
    );
  }

  const authGet = {
    apiKeys: clobAuthApiKeys,
    deriveApiKey: clobAuthDeriveApiKey,
    builderApiKey: clobAuthBuilderApiKeyGet,
    banStatus: {
      closedOnly: clobAuthClosedOnly,
    },
  } as PolymarketClobGetNamespace["auth"];

  const authPost = {
    apiKey: clobAuthApiKey,
    builderApiKey: clobAuthBuilderApiKeyPost,
  };

  const authDelete = {
    apiKey: clobAuthDeleteApiKey,
    builderApiKey: clobAuthBuilderApiKeyDelete,
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
      signal?: AbortSignal
    ): Promise<unknown> => {
      return trader.placeOrder(req, clobPostOrder, signal);
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

  // GET https://clob.polymarket.com/rewards/user{query}
  // Docs: https://docs.polymarket.com/api-reference/rewards/get-earnings-for-user-by-date.md
  async function clobRewardsUser(
    params: PolymarketClobRewardsUserQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsUserResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobRewardsUserResponse>(
      "GET",
      `${baseURL}/rewards/user${query}`,
      undefined,
      signal
    );
  }

  // sig-ok: flat userTotal name avoids making rewards.user both callable and nested
  // GET https://clob.polymarket.com/rewards/user/total{query}
  // Docs: https://docs.polymarket.com/api-reference/rewards/get-total-earnings-for-user-by-date.md
  async function clobRewardsUserTotal(
    params: PolymarketClobRewardsUserTotalQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsUserTotalResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobRewardsUserTotalResponse>(
      "GET",
      `${baseURL}/rewards/user/total${query}`,
      undefined,
      signal
    );
  }

  // sig-ok: flat userPercentages name avoids making rewards.user both callable and nested
  // GET https://clob.polymarket.com/rewards/user/percentages{query}
  // Docs: https://docs.polymarket.com/api-reference/rewards/get-reward-percentages-for-user.md
  async function clobRewardsUserPercentages(
    params?: PolymarketClobRewardPercentagesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardPercentagesResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobRewardPercentagesResponse>(
      "GET",
      `${baseURL}/rewards/user/percentages${query}`,
      undefined,
      signal
    );
  }

  // sig-ok: flat userMarkets name avoids making rewards.user both callable and nested
  // GET https://clob.polymarket.com/rewards/user/markets{query}
  // Docs: https://docs.polymarket.com/api-reference/rewards/get-user-earnings-and-markets-configuration.md
  async function clobRewardsUserMarkets(
    params?: PolymarketClobRewardsUserMarketsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsUserMarketsResponse> {
    const query = buildQuery(params);
    return makeAuthenticatedRequest<PolymarketClobRewardsUserMarketsResponse>(
      "GET",
      `${baseURL}/rewards/user/markets${query}`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/rewards/markets/current{query}
  // Docs: https://docs.polymarket.com/api-reference/rewards/get-current-active-rewards-configurations.md
  async function clobRewardsMarketsCurrent(
    params?: PolymarketClobRewardsCurrentQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsCurrentResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketClobRewardsCurrentResponse>(
      `${baseURL}/rewards/markets/current${query}`,
      signal
    );
  }

  // sig-ok: byCondition disambiguates the path-param market rewards lookup
  // GET https://clob.polymarket.com/rewards/markets/{conditionId}{query}
  // Docs: https://docs.polymarket.com/api-reference/rewards/get-raw-rewards-for-a-specific-market.md
  async function clobRewardsMarketsByCondition(
    conditionId: string,
    params?: PolymarketClobRewardsMarketQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsMarketResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketClobRewardsMarketResponse>(
      `${baseURL}/rewards/markets/${encodeURIComponent(conditionId)}${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/rewards/markets/multi{query}
  // Docs: https://docs.polymarket.com/api-reference/rewards/get-multiple-markets-with-rewards.md
  async function clobRewardsMarketsMulti(
    params?: PolymarketClobRewardsMultiMarketsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRewardsMultiMarketsResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketClobRewardsMultiMarketsResponse>(
      `${baseURL}/rewards/markets/multi${query}`,
      signal
    );
  }

  const rewardsGet = {
    user: clobRewardsUser,
    userTotal: clobRewardsUserTotal,
    userPercentages: clobRewardsUserPercentages,
    userMarkets: clobRewardsUserMarkets,
    markets: {
      current: clobRewardsMarketsCurrent,
      byCondition: clobRewardsMarketsByCondition,
      multi: clobRewardsMarketsMulti,
    },
  };

  // GET https://clob.polymarket.com/rebates/current{query}
  // Docs: https://docs.polymarket.com/api-reference/rewards/get-current-rebated-fees-for-a-maker.md
  async function clobRebatesCurrent(
    params: PolymarketClobRebatesCurrentQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobRebatesCurrentResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketClobRebatesCurrentResponse>(
      `${baseURL}/rebates/current${query}`,
      signal
    );
  }

  const rebatesGet = {
    current: clobRebatesCurrent,
  };

  // sig-ok: builderTrades keeps CLOB builder reads in one flat namespace
  // GET https://clob.polymarket.com/builder/trades{query}
  // Docs: https://docs.polymarket.com/api-reference/trade/get-builder-trades.md
  async function clobBuilderTrades(
    params: PolymarketClobBuilderTradesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBuilderTradesResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketClobBuilderTradesResponse>(
      `${baseURL}/builder/trades${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/balance-allowance{query}
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
  async function clobBalanceAllowanceGet(
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBalanceAllowanceResponse> {
    const query = buildQuery(withDefaultSignatureType(params));
    return makeAuthenticatedRequest<PolymarketClobBalanceAllowanceResponse>(
      "GET",
      `${baseURL}/balance-allowance${query}`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/balance-allowance/update{query}
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
  async function clobBalanceAllowanceUpdateGet(
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBalanceAllowanceResponse> {
    const query = buildQuery(withDefaultSignatureType(params));
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
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
  async function clobBalanceAllowancePut(
    params: PolymarketClobBalanceAllowanceQuery,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>> {
    const query = buildQuery(withDefaultSignatureType(params));
    return makeAuthenticatedRequest<Record<string, unknown>>(
      "PUT",
      `${baseURL}/balance-allowance${query}`,
      undefined,
      signal
    );
  }

  // GET https://clob.polymarket.com/notifications{query}
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
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
  // Docs: https://docs.polymarket.com/api-reference/authentication.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-order-books-request-body.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-market-prices-request-body.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-midpoint-prices-request-body.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-spreads.md
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
  // Docs: https://docs.polymarket.com/api-reference/market-data/get-last-trade-prices-request-body.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/get-batch-prices-history.md
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

  // sig-ok: plural POST counterpart to marketLiveActivity
  // POST https://clob.polymarket.com/markets/live-activity
  // Docs: https://docs.polymarket.com/api-reference/markets/get-live-activity-for-markets.md
  const clobMarketsLiveActivity = Object.assign(
    async (
      req: PolymarketClobLiveActivityRequest,
      signal?: AbortSignal
    ): Promise<PolymarketClobLiveActivityResponse> => {
      return makeJsonRequest<PolymarketClobLiveActivityResponse>(
        `${baseURL}/markets/live-activity`,
        req,
        signal
      );
    },
    { schema: PolymarketClobLiveActivityRequestSchema }
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
        books: clobBooks,
        prices: clobPrices,
        midpoints: clobMidpoints,
        lastTradesPrices: clobLastTradesPrices,
        tickSize: clobTickSize,
        tickSizeByQuery: clobTickSizeByQuery,
        feeRate: clobFeeRate,
        feeRateByQuery: clobFeeRateByQuery,
        negRisk: clobNegRisk,
        negRiskByQuery: clobNegRiskByQuery,
        pricesHistory: clobPricesHistory,
        markets: clobMarkets as PolymarketClobGetNamespace["markets"],
        samplingMarkets: clobSamplingMarkets,
        simplifiedMarkets: clobSimplifiedMarkets,
        samplingSimplifiedMarkets: clobSamplingSimplifiedMarkets,
        marketsByToken: clobMarketsByToken,
        clobMarkets: clobMarketsCompact,
        marketLiveActivity: clobMarketLiveActivity,
        rewards: rewardsGet,
        rebates: rebatesGet,
        builderTrades: clobBuilderTrades,
        data: dataGet,
        balanceAllowance: clobBalanceAllowance,
        notifications: clobNotifications,
        orderScoring: clobOrderScoring,
        ordersScoring: clobOrdersScoring,
      } as PolymarketClobGetNamespace,
    },
    post: {
      clob: {
        auth: authPost as PolymarketClobPostNamespace["auth"],
        order: clobPostOrder,
        placeOrder: clobPlaceOrder,
        orders: clobPostOrders,
        books: clobBooksBatch,
        prices: clobPricesBatch,
        midpoints: clobMidpointsBatch,
        spreads: clobSpreadsBatch,
        lastTradesPrices: clobLastTradesPricesBatch,
        batchPricesHistory: clobBatchPricesHistory,
        marketsLiveActivity: clobMarketsLiveActivity,
        heartbeats: clobHeartbeats,
        v1: {
          heartbeats: clobHeartbeatsV1,
        },
        ordersScoring: clobOrdersScoringPost,
      } as unknown as PolymarketClobPostNamespace,
    },
    put: {
      clob: {
        balanceAllowance: clobBalanceAllowancePut,
      },
    },
    delete: {
      clob: {
        auth: authDelete as PolymarketClobDeleteNamespace["auth"],
        order: clobCancelOrder,
        orders: clobCancelOrders,
        cancelAll: clobCancelAll,
        cancelMarketOrders: clobCancelMarketOrders,
        notifications: clobDropNotifications,
      },
    },
  };
}
