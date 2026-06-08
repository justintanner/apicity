import { BinanceError } from "./types";
import type {
  BinanceAggTradesRequest,
  BinanceAggTradesResponse,
  BinanceAvgPriceRequest,
  BinanceAvgPriceResponse,
  BinanceDepthRequest,
  BinanceDepthResponse,
  BinanceExchangeInfoRequest,
  BinanceExchangeInfoResponse,
  BinanceHistoricalBlockTradesRequest,
  BinanceHistoricalBlockTradesResponse,
  BinanceHistoricalTradesRequest,
  BinanceHistoricalTradesResponse,
  BinanceKlinesRequest,
  BinanceKlinesResponse,
  BinanceOptions,
  BinancePingResponse,
  BinanceProvider,
  BinanceReferencePriceCalculationRequest,
  BinanceReferencePriceCalculationResponse,
  BinanceReferencePriceRequest,
  BinanceReferencePriceResponse,
  BinanceTicker24hrRequest,
  BinanceTicker24hrResponse,
  BinanceTickerBookTickerRequest,
  BinanceTickerBookTickerResponse,
  BinanceTickerPriceRequest,
  BinanceTickerPriceResponse,
  BinanceTickerRequest,
  BinanceTickerResponse,
  BinanceTickerTradingDayRequest,
  BinanceTickerTradingDayResponse,
  BinanceTimeResponse,
  BinanceTradesRequest,
  BinanceTradesResponse,
  BinanceUiKlinesRequest,
  BinanceUiKlinesResponse,
} from "./types";
import {
  BinanceAggTradesRequestSchema,
  BinanceAvgPriceRequestSchema,
  BinanceDepthRequestSchema,
  BinanceExchangeInfoRequestSchema,
  BinanceHistoricalBlockTradesRequestSchema,
  BinanceHistoricalTradesRequestSchema,
  BinanceKlinesRequestSchema,
  BinanceReferencePriceCalculationRequestSchema,
  BinanceReferencePriceRequestSchema,
  BinanceTicker24hrRequestSchema,
  BinanceTickerBookTickerRequestSchema,
  BinanceTickerPriceRequestSchema,
  BinanceTickerRequestSchema,
  BinanceTickerTradingDayRequestSchema,
  BinanceTradesRequestSchema,
  BinanceUiKlinesRequestSchema,
} from "./zod";

type BinanceQueryValue =
  | string
  | number
  | boolean
  | readonly string[]
  | undefined;

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

  function buildQuery(params: Record<string, BinanceQueryValue>): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) {
        continue;
      }
      qs.append(
        key,
        Array.isArray(value) ? JSON.stringify(value) : String(value)
      );
    }
    const query = qs.toString();
    return query ? `?${query}` : "";
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

  // GET https://api.binance.com/api/v3/time
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#check-server-time
  const time = Object.assign(
    async (signal?: AbortSignal): Promise<BinanceTimeResponse> => {
      return makeJsonRequest<BinanceTimeResponse>(
        "GET",
        "/api/v3/time",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.binance.com/api/v3/exchangeInfo{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#exchange-information
  const exchangeInfo = Object.assign(
    async (
      req: BinanceExchangeInfoRequest = {},
      signal?: AbortSignal
    ): Promise<BinanceExchangeInfoResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        symbols: req.symbols,
        permissions: req.permissions,
        showPermissionSets: req.showPermissionSets,
        symbolStatus: req.symbolStatus,
      });
      return makeJsonRequest<BinanceExchangeInfoResponse>(
        "GET",
        `/api/v3/exchangeInfo${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceExchangeInfoRequestSchema }
  );

  // GET https://api.binance.com/api/v3/depth{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#order-book
  const depth = Object.assign(
    async (
      req: BinanceDepthRequest,
      signal?: AbortSignal
    ): Promise<BinanceDepthResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        limit: req.limit,
        symbolStatus: req.symbolStatus,
      });
      return makeJsonRequest<BinanceDepthResponse>(
        "GET",
        `/api/v3/depth${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceDepthRequestSchema }
  );

  // GET https://api.binance.com/api/v3/trades{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#recent-trades-list
  const trades = Object.assign(
    async (
      req: BinanceTradesRequest,
      signal?: AbortSignal
    ): Promise<BinanceTradesResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        limit: req.limit,
      });
      return makeJsonRequest<BinanceTradesResponse>(
        "GET",
        `/api/v3/trades${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceTradesRequestSchema }
  );

  // GET https://api.binance.com/api/v3/historicalTrades{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#old-trade-lookup
  const historicalTrades = Object.assign(
    async (
      req: BinanceHistoricalTradesRequest,
      signal?: AbortSignal
    ): Promise<BinanceHistoricalTradesResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        limit: req.limit,
        fromId: req.fromId,
      });
      return makeJsonRequest<BinanceHistoricalTradesResponse>(
        "GET",
        `/api/v3/historicalTrades${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceHistoricalTradesRequestSchema }
  );

  // GET https://api.binance.com/api/v3/historicalBlockTrades{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#historical-block-trades
  const historicalBlockTrades = Object.assign(
    async (
      req: BinanceHistoricalBlockTradesRequest,
      signal?: AbortSignal
    ): Promise<BinanceHistoricalBlockTradesResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        fromId: req.fromId,
        limit: req.limit,
      });
      return makeJsonRequest<BinanceHistoricalBlockTradesResponse>(
        "GET",
        `/api/v3/historicalBlockTrades${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceHistoricalBlockTradesRequestSchema }
  );

  // GET https://api.binance.com/api/v3/aggTrades{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#compressedaggregate-trades-list
  const aggTrades = Object.assign(
    async (
      req: BinanceAggTradesRequest,
      signal?: AbortSignal
    ): Promise<BinanceAggTradesResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        fromId: req.fromId,
        startTime: req.startTime,
        endTime: req.endTime,
        limit: req.limit,
      });
      return makeJsonRequest<BinanceAggTradesResponse>(
        "GET",
        `/api/v3/aggTrades${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceAggTradesRequestSchema }
  );

  // GET https://api.binance.com/api/v3/klines{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#klinecandlestick-data
  const klines = Object.assign(
    async (
      req: BinanceKlinesRequest,
      signal?: AbortSignal
    ): Promise<BinanceKlinesResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        interval: req.interval,
        startTime: req.startTime,
        endTime: req.endTime,
        timeZone: req.timeZone,
        limit: req.limit,
      });
      return makeJsonRequest<BinanceKlinesResponse>(
        "GET",
        `/api/v3/klines${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceKlinesRequestSchema }
  );

  // GET https://api.binance.com/api/v3/avgPrice{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#current-average-price
  const avgPrice = Object.assign(
    async (
      req: BinanceAvgPriceRequest,
      signal?: AbortSignal
    ): Promise<BinanceAvgPriceResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
      });
      return makeJsonRequest<BinanceAvgPriceResponse>(
        "GET",
        `/api/v3/avgPrice${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceAvgPriceRequestSchema }
  );

  // GET https://api.binance.com/api/v3/referencePrice/calculation{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#query-reference-price-calculation
  const referencePriceCalculation = Object.assign(
    async (
      req: BinanceReferencePriceCalculationRequest,
      signal?: AbortSignal
    ): Promise<BinanceReferencePriceCalculationResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        symbolStatus: req.symbolStatus,
      });
      return makeJsonRequest<BinanceReferencePriceCalculationResponse>(
        "GET",
        `/api/v3/referencePrice/calculation${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceReferencePriceCalculationRequestSchema }
  );

  // GET https://api.binance.com/api/v3/referencePrice{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#query-reference-price
  const referencePrice = Object.assign(
    async (
      req: BinanceReferencePriceRequest,
      signal?: AbortSignal
    ): Promise<BinanceReferencePriceResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
      });
      return makeJsonRequest<BinanceReferencePriceResponse>(
        "GET",
        `/api/v3/referencePrice${query}`,
        undefined,
        signal
      );
    },
    {
      calculation: referencePriceCalculation,
      schema: BinanceReferencePriceRequestSchema,
    }
  );

  // GET https://api.binance.com/api/v3/uiKlines{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#uiklines
  const uiKlines = Object.assign(
    async (
      req: BinanceUiKlinesRequest,
      signal?: AbortSignal
    ): Promise<BinanceUiKlinesResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        interval: req.interval,
        startTime: req.startTime,
        endTime: req.endTime,
        timeZone: req.timeZone,
        limit: req.limit,
      });
      return makeJsonRequest<BinanceUiKlinesResponse>(
        "GET",
        `/api/v3/uiKlines${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceUiKlinesRequestSchema }
  );

  // sig-ok: upstream numeric segment exposed as a TypeScript-friendly name.
  // GET https://api.binance.com/api/v3/ticker/24hr{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#24hr-ticker-price-change-statistics
  const tickerTwentyFourHr = Object.assign(
    async (
      req: BinanceTicker24hrRequest = {},
      signal?: AbortSignal
    ): Promise<BinanceTicker24hrResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        symbols: req.symbols,
        type: req.type,
      });
      return makeJsonRequest<BinanceTicker24hrResponse>(
        "GET",
        `/api/v3/ticker/24hr${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceTicker24hrRequestSchema }
  );

  // GET https://api.binance.com/api/v3/ticker/tradingDay{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#trading-day-ticker
  const tickerTradingDay = Object.assign(
    async (
      req: BinanceTickerTradingDayRequest,
      signal?: AbortSignal
    ): Promise<BinanceTickerTradingDayResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        symbols: req.symbols,
        timeZone: req.timeZone,
        type: req.type,
        symbolStatus: req.symbolStatus,
      });
      return makeJsonRequest<BinanceTickerTradingDayResponse>(
        "GET",
        `/api/v3/ticker/tradingDay${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceTickerTradingDayRequestSchema }
  );

  // GET https://api.binance.com/api/v3/ticker/price{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#symbol-price-ticker
  const tickerPrice = Object.assign(
    async (
      req: BinanceTickerPriceRequest = {},
      signal?: AbortSignal
    ): Promise<BinanceTickerPriceResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        symbols: req.symbols,
        symbolStatus: req.symbolStatus,
      });
      return makeJsonRequest<BinanceTickerPriceResponse>(
        "GET",
        `/api/v3/ticker/price${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceTickerPriceRequestSchema }
  );

  // GET https://api.binance.com/api/v3/ticker/bookTicker{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#symbol-order-book-ticker
  const tickerBookTicker = Object.assign(
    async (
      req: BinanceTickerBookTickerRequest = {},
      signal?: AbortSignal
    ): Promise<BinanceTickerBookTickerResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        symbols: req.symbols,
        symbolStatus: req.symbolStatus,
      });
      return makeJsonRequest<BinanceTickerBookTickerResponse>(
        "GET",
        `/api/v3/ticker/bookTicker${query}`,
        undefined,
        signal
      );
    },
    { schema: BinanceTickerBookTickerRequestSchema }
  );

  // GET https://api.binance.com/api/v3/ticker{query}
  // Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints#rolling-window-price-change-statistics
  const ticker = Object.assign(
    async (
      req: BinanceTickerRequest,
      signal?: AbortSignal
    ): Promise<BinanceTickerResponse> => {
      const query = buildQuery({
        symbol: req.symbol,
        symbols: req.symbols,
        windowSize: req.windowSize,
        type: req.type,
        symbolStatus: req.symbolStatus,
      });
      return makeJsonRequest<BinanceTickerResponse>(
        "GET",
        `/api/v3/ticker${query}`,
        undefined,
        signal
      );
    },
    {
      bookTicker: tickerBookTicker,
      price: tickerPrice,
      schema: BinanceTickerRequestSchema,
      tradingDay: tickerTradingDay,
      twentyFourHr: tickerTwentyFourHr,
    }
  );

  const api = {
    v3: {
      aggTrades,
      avgPrice,
      depth,
      exchangeInfo,
      historicalBlockTrades,
      historicalTrades,
      klines,
      ping,
      referencePrice,
      time,
      ticker,
      trades,
      uiKlines,
    },
  };

  return {
    api,
    get: {
      api,
    },
  };
}
