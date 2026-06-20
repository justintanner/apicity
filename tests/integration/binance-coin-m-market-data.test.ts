import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

function expectCoinMKline(row: unknown): void {
  expect(row).toEqual([
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
}

describe("binance COIN-M Futures market data integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("gets public COIN-M Futures market data endpoints", async () => {
    ctx = setupPolly("binance/coin-m-market-data");
    const binance = createBinance();

    await expect(binance.dapi.v1.ping()).resolves.toEqual({});

    const time = await binance.dapi.v1.time();
    expect(time.serverTime).toEqual(expect.any(Number));

    const exchangeInfo = await binance.dapi.v1.exchangeInfo();
    expect(exchangeInfo.timezone).toBe("UTC");
    expect(exchangeInfo.symbols.length).toBeGreaterThan(0);

    const depth = await binance.dapi.v1.depth({
      symbol: "BTCUSD_PERP",
      limit: 5,
    });
    expect(depth.symbol).toBe("BTCUSD_PERP");
    expect(depth.bids[0]).toEqual([expect.any(String), expect.any(String)]);
    expect(depth.asks[0]).toEqual([expect.any(String), expect.any(String)]);

    const trades = await binance.dapi.v1.trades({
      symbol: "BTCUSD_PERP",
      limit: 1,
    });
    expect(trades[0]).toMatchObject({
      id: expect.any(Number),
      price: expect.any(String),
      qty: expect.any(String),
      time: expect.any(Number),
    });

    const aggTrades = await binance.dapi.v1.aggTrades({
      symbol: "BTCUSD_PERP",
      limit: 1,
    });
    expect(aggTrades[0]).toMatchObject({
      a: expect.any(Number),
      p: expect.any(String),
      q: expect.any(String),
      T: expect.any(Number),
    });

    const premiumIndex = await binance.dapi.v1.premiumIndex({
      symbol: "BTCUSD_PERP",
    });
    expect(premiumIndex[0]).toMatchObject({
      symbol: "BTCUSD_PERP",
      pair: "BTCUSD",
      markPrice: expect.any(String),
      indexPrice: expect.any(String),
    });

    const fundingRate = await binance.dapi.v1.fundingRate({
      symbol: "BTCUSD_PERP",
      limit: 1,
    });
    expect(fundingRate[0]).toMatchObject({
      symbol: "BTCUSD_PERP",
      fundingTime: expect.any(Number),
      fundingRate: expect.any(String),
    });

    const fundingInfo = await binance.dapi.v1.fundingInfo();
    expect(Array.isArray(fundingInfo)).toBe(true);

    const klines = await binance.dapi.v1.klines({
      symbol: "BTCUSD_PERP",
      interval: "1m",
      limit: 1,
    });
    expectCoinMKline(klines[0]);

    const continuousKlines = await binance.dapi.v1.continuousKlines({
      pair: "BTCUSD",
      contractType: "PERPETUAL",
      interval: "1m",
      limit: 1,
    });
    expectCoinMKline(continuousKlines[0]);

    const indexPriceKlines = await binance.dapi.v1.indexPriceKlines({
      pair: "BTCUSD",
      interval: "1m",
      limit: 1,
    });
    expectCoinMKline(indexPriceKlines[0]);

    const markPriceKlines = await binance.dapi.v1.markPriceKlines({
      symbol: "BTCUSD_PERP",
      interval: "1m",
      limit: 1,
    });
    expectCoinMKline(markPriceKlines[0]);

    const premiumIndexKlines = await binance.dapi.v1.premiumIndexKlines({
      symbol: "BTCUSD_PERP",
      interval: "1m",
      limit: 1,
    });
    expectCoinMKline(premiumIndexKlines[0]);

    const ticker24hr = await binance.dapi.v1.ticker.twentyFourHr({
      symbol: "BTCUSD_PERP",
    });
    expect(ticker24hr[0]).toMatchObject({
      symbol: "BTCUSD_PERP",
      pair: "BTCUSD",
      lastPrice: expect.any(String),
    });

    const tickerPrice = await binance.dapi.v1.ticker.price({
      symbol: "BTCUSD_PERP",
    });
    expect(tickerPrice[0]).toMatchObject({
      symbol: "BTCUSD_PERP",
      price: expect.any(String),
    });

    const bookTicker = await binance.dapi.v1.ticker.bookTicker({
      symbol: "BTCUSD_PERP",
    });
    expect(bookTicker[0]).toMatchObject({
      symbol: "BTCUSD_PERP",
      bidPrice: expect.any(String),
      askPrice: expect.any(String),
    });

    const openInterest = await binance.dapi.v1.openInterest({
      symbol: "BTCUSD_PERP",
    });
    expect(openInterest).toMatchObject({
      symbol: "BTCUSD_PERP",
      pair: "BTCUSD",
      openInterest: expect.any(String),
    });

    const constituents = await binance.dapi.v1.constituents({
      symbol: "BTCUSD",
    });
    expect(constituents).toMatchObject({
      symbol: "BTCUSD",
      constituents: expect.any(Array),
    });

    const openInterestHist = await binance.coinMFutures.data.openInterestHist({
      pair: "BTCUSD",
      contractType: "PERPETUAL",
      period: "5m",
      limit: 1,
    });
    expect(openInterestHist[0]).toMatchObject({
      pair: "BTCUSD",
      sumOpenInterest: expect.any(String),
      timestamp: expect.any(Number),
    });

    const topPositionRatio =
      await binance.coinMFutures.data.topLongShortPositionRatio({
        pair: "BTCUSD",
        period: "5m",
        limit: 1,
      });
    expect(topPositionRatio[0]).toMatchObject({
      pair: "BTCUSD",
      longShortRatio: expect.any(String),
      longPosition: expect.any(String),
      shortPosition: expect.any(String),
    });

    const topAccountRatio =
      await binance.coinMFutures.data.topLongShortAccountRatio({
        pair: "BTCUSD",
        period: "5m",
        limit: 1,
      });
    expect(topAccountRatio[0]).toMatchObject({
      pair: "BTCUSD",
      longShortRatio: expect.any(String),
      longAccount: expect.any(String),
      shortAccount: expect.any(String),
    });

    const globalAccountRatio =
      await binance.coinMFutures.data.globalLongShortAccountRatio({
        pair: "BTCUSD",
        period: "5m",
        limit: 1,
      });
    expect(globalAccountRatio[0]).toMatchObject({
      pair: "BTCUSD",
      longShortRatio: expect.any(String),
      longAccount: expect.any(String),
      shortAccount: expect.any(String),
    });

    const takerBuySellVol = await binance.coinMFutures.data.takerBuySellVol({
      pair: "BTCUSD",
      contractType: "PERPETUAL",
      period: "5m",
      limit: 1,
    });
    expect(takerBuySellVol[0]).toMatchObject({
      pair: "BTCUSD",
      takerBuyVol: expect.any(String),
      takerSellVol: expect.any(String),
    });

    const deliveryPrice = await binance.coinMFutures.data.deliveryPrice({
      pair: "BTCUSD",
    });
    expect(deliveryPrice[0]).toMatchObject({
      deliveryTime: expect.any(Number),
      deliveryPrice: expect.any(Number),
    });

    const basis = await binance.coinMFutures.data.basis({
      pair: "BTCUSD",
      contractType: "PERPETUAL",
      period: "5m",
      limit: 1,
    });
    expect(basis[0]).toMatchObject({
      pair: "BTCUSD",
      basis: expect.any(String),
      basisRate: expect.any(String),
    });
  });

  it("does not expose API-key-gated COIN-M old trades lookup", () => {
    const binance = createBinance();

    expect("historicalTrades" in binance.dapi.v1).toBe(false);
  });
});
