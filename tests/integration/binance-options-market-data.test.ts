import { afterEach, describe, expect, it } from "vitest";

import {
  createBinance,
  type BinanceOptionContract,
  type BinanceOptionExchangeInfoResponse,
  type BinanceOptionSymbolInfo,
} from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

function expirationCode(expiryDate: number): string {
  return new Date(expiryDate).toISOString().slice(2, 10).replace(/-/g, "");
}

function selectSymbolInfo(
  exchangeInfo: BinanceOptionExchangeInfoResponse
): BinanceOptionSymbolInfo {
  const symbolInfo =
    exchangeInfo.optionSymbols.find((item) => item.status === "TRADING") ??
    exchangeInfo.optionSymbols[0];
  if (!symbolInfo) {
    throw new Error("Binance Options exchangeInfo had no option symbols");
  }
  return symbolInfo;
}

function findContract(
  exchangeInfo: BinanceOptionExchangeInfoResponse,
  underlying: string
): BinanceOptionContract {
  const contract =
    exchangeInfo.optionContracts.find(
      (item) => item.underlying === underlying
    ) ?? exchangeInfo.optionContracts[0];
  if (!contract) {
    throw new Error("Binance Options exchangeInfo had no option contracts");
  }
  return contract;
}

describe("binance options market data integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets no-auth Options EAPI market data", async () => {
    ctx = setupPolly("binance/options-market-data");
    const binance = createBinance();

    await expect(binance.eapi.v1.ping()).resolves.toEqual({});

    const time = await binance.eapi.v1.time();
    expect(time.serverTime).toEqual(expect.any(Number));

    const exchangeInfo = await binance.eapi.v1.exchangeInfo();
    expect(exchangeInfo.timezone).toBe("UTC");
    expect(exchangeInfo.optionSymbols.length).toBeGreaterThan(0);

    const symbolInfo = selectSymbolInfo(exchangeInfo);
    const contract = findContract(exchangeInfo, symbolInfo.underlying);

    const tickers = await binance.eapi.v1.ticker({
      symbol: symbolInfo.symbol,
    });
    expect(tickers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: symbolInfo.symbol,
          lastPrice: expect.any(String),
          openTime: expect.any(Number),
          closeTime: expect.any(Number),
        }),
      ])
    );

    const exerciseHistory = await binance.eapi.v1.exerciseHistory({
      underlying: symbolInfo.underlying,
      limit: 1,
    });
    expect(Array.isArray(exerciseHistory)).toBe(true);

    const openInterest = await binance.eapi.v1.openInterest({
      underlyingAsset: contract.baseAsset,
      expiration: expirationCode(symbolInfo.expiryDate),
    });
    expect(openInterest.length).toBeGreaterThan(0);
    expect(openInterest[0]).toEqual(
      expect.objectContaining({
        symbol: expect.any(String),
        sumOpenInterest: expect.any(String),
        sumOpenInterestUsd: expect.any(String),
      })
    );

    const depth = await binance.eapi.v1.depth({
      symbol: symbolInfo.symbol,
      limit: 10,
    });
    expect(depth.lastUpdateId).toEqual(expect.any(Number));
    expect(Array.isArray(depth.bids)).toBe(true);
    expect(Array.isArray(depth.asks)).toBe(true);
    expect(depth.bids.length + depth.asks.length).toBeGreaterThan(0);

    const trades = await binance.eapi.v1.trades({
      symbol: symbolInfo.symbol,
      limit: 5,
    });
    expect(Array.isArray(trades)).toBe(true);
    if (trades.length > 0) {
      expect(trades[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          tradeId: expect.any(Number),
          symbol: symbolInfo.symbol,
          price: expect.any(String),
          qty: expect.any(String),
          quoteQty: expect.any(String),
          side: expect.any(Number),
          time: expect.any(Number),
        })
      );
    }

    const blockTrades = await binance.eapi.v1.blockTrades({ limit: 5 });
    expect(Array.isArray(blockTrades)).toBe(true);

    const index = await binance.eapi.v1.index({
      underlying: symbolInfo.underlying,
    });
    expect(index).toEqual(
      expect.objectContaining({
        indexPrice: expect.any(String),
        time: expect.any(Number),
      })
    );

    const klines = await binance.eapi.v1.klines({
      symbol: symbolInfo.symbol,
      interval: "1m",
      limit: 1,
    });
    expect(klines.length).toBeGreaterThan(0);
    expect(klines[0]).toEqual([
      expect.any(Number),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(Number),
      expect.any(String),
      expect.any(Number),
      expect.any(String),
      expect.any(String),
      expect.any(String),
    ]);

    const markPrices = await binance.eapi.v1.mark({
      symbol: symbolInfo.symbol,
    });
    expect(markPrices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: symbolInfo.symbol,
          markPrice: expect.any(String),
          markIV: expect.any(String),
        }),
      ])
    );
  });
});
