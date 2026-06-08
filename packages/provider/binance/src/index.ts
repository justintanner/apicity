export { createBinance } from "./binance";
export { BinanceError } from "./types";

export { BinanceOptionsSchema, type BinanceOptions } from "./zod";

export type {
  BinanceProvider,
  BinanceGetNamespace,
  BinanceApiNamespace,
  BinanceApiV3Namespace,
  BinanceDepthMethod,
  BinanceDepthRequest,
  BinanceDepthResponse,
  BinanceExchangeFilter,
  BinanceExchangeInfoMethod,
  BinanceExchangeInfoRequest,
  BinanceExchangeInfoResponse,
  BinanceHistoricalTradesMethod,
  BinanceHistoricalTradesRequest,
  BinanceHistoricalTradesResponse,
  BinancePingMethod,
  BinancePingResponse,
  BinanceOrderBookLevel,
  BinanceRateLimit,
  BinanceSorInfo,
  BinanceSymbolInfo,
  BinanceTimeMethod,
  BinanceTimeResponse,
  BinanceTrade,
  BinanceTradesMethod,
  BinanceTradesRequest,
  BinanceTradesResponse,
} from "./types";

export {
  BinanceDepthRequestSchema,
  BinanceExchangeInfoRequestSchema,
  BinanceHistoricalTradesRequestSchema,
  BinanceTradesRequestSchema,
} from "./zod";
