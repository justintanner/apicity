import { afterEach, describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

function expectKline(row: unknown): void {
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

describe("binance USD-M futures market data integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets USD-M /fapi market data endpoints without auth", async () => {
    ctx = setupPolly("binance/fapi-market-data");
    const binance = createBinance();

    expect(await binance.fapi.v1.ping()).toEqual({});

    const time = await binance.fapi.v1.time();
    expect(time.serverTime).toEqual(expect.any(Number));

    const exchangeInfo = await binance.fapi.v1.exchangeInfo();
    expect(exchangeInfo.symbols.length).toBeGreaterThan(0);

    const depth = await binance.fapi.v1.depth({
      symbol: "BTCUSDT",
      limit: 5,
    });
    expect(depth.lastUpdateId).toEqual(expect.any(Number));
    expect(depth.bids[0]).toEqual([expect.any(String), expect.any(String)]);

    const rpiDepth = await binance.fapi.v1.rpiDepth({ symbol: "BTCUSDT" });
    expect(rpiDepth.asks[0]).toEqual([expect.any(String), expect.any(String)]);

    const trades = await binance.fapi.v1.trades({
      symbol: "BTCUSDT",
      limit: 1,
    });
    expect(trades[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        price: expect.any(String),
        qty: expect.any(String),
        time: expect.any(Number),
      })
    );

    const aggTrades = await binance.fapi.v1.aggTrades({
      symbol: "BTCUSDT",
      limit: 1,
    });
    expect(aggTrades[0]).toEqual(
      expect.objectContaining({
        a: expect.any(Number),
        p: expect.any(String),
        q: expect.any(String),
        T: expect.any(Number),
      })
    );

    expectKline(
      (
        await binance.fapi.v1.klines({
          symbol: "BTCUSDT",
          interval: "1m",
          limit: 1,
        })
      )[0]
    );
    expectKline(
      (
        await binance.fapi.v1.continuousKlines({
          pair: "BTCUSDT",
          contractType: "PERPETUAL",
          interval: "1m",
          limit: 1,
        })
      )[0]
    );
    expectKline(
      (
        await binance.fapi.v1.indexPriceKlines({
          pair: "BTCUSDT",
          interval: "1m",
          limit: 1,
        })
      )[0]
    );
    expectKline(
      (
        await binance.fapi.v1.markPriceKlines({
          symbol: "BTCUSDT",
          interval: "1m",
          limit: 1,
        })
      )[0]
    );
    expectKline(
      (
        await binance.fapi.v1.premiumIndexKlines({
          symbol: "BTCUSDT",
          interval: "1m",
          limit: 1,
        })
      )[0]
    );

    const premiumIndex = await binance.fapi.v1.premiumIndex({
      symbol: "BTCUSDT",
    });
    expect(premiumIndex).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        markPrice: expect.any(String),
        indexPrice: expect.any(String),
      })
    );

    const fundingRate = await binance.fapi.v1.fundingRate({
      symbol: "BTCUSDT",
      limit: 1,
    });
    expect(fundingRate[0]).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        fundingRate: expect.any(String),
      })
    );

    const fundingInfo = await binance.fapi.v1.fundingInfo();
    expect(fundingInfo.length).toBeGreaterThan(0);

    const ticker24hr = await binance.fapi.v1.ticker.twentyFourHr({
      symbol: "BTCUSDT",
    });
    expect(ticker24hr).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        lastPrice: expect.any(String),
      })
    );

    const price = await binance.fapi.v2.ticker.price({ symbol: "BTCUSDT" });
    expect(price).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        price: expect.any(String),
      })
    );

    const bookTicker = await binance.fapi.v1.ticker.bookTicker({
      symbol: "BTCUSDT",
    });
    expect(bookTicker).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        bidPrice: expect.any(String),
        askPrice: expect.any(String),
      })
    );

    const openInterest = await binance.fapi.v1.openInterest({
      symbol: "BTCUSDT",
    });
    expect(openInterest.openInterest).toEqual(expect.any(String));

    const indexInfo = await binance.fapi.v1.indexInfo();
    expect(indexInfo.length).toBeGreaterThan(0);

    const assetIndex = await binance.fapi.v1.assetIndex({
      symbol: "USDTUSD",
    });
    expect(assetIndex).toEqual(
      expect.objectContaining({
        symbol: "USDTUSD",
        index: expect.any(String),
      })
    );

    const constituents = await binance.fapi.v1.constituents({
      symbol: "BTCUSDT",
    });
    expect(constituents.constituents.length).toBeGreaterThan(0);

    const insuranceBalance = await binance.fapi.v1.insuranceBalance({
      symbol: "BTCUSDT",
    });
    expect(insuranceBalance).toEqual(
      expect.objectContaining({
        symbols: expect.any(Array),
        assets: expect.any(Array),
      })
    );

    const adlRisk = await binance.fapi.v1.symbolAdlRisk({
      symbol: "BTCUSDT",
    });
    expect(adlRisk).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        adlRisk: expect.any(String),
      })
    );

    const tradingSchedule = await binance.fapi.v1.tradingSchedule();
    expect(tradingSchedule.marketSchedules).toEqual(expect.any(Object));
  });

  it("gets USD-M /futures/data statistics endpoints without auth", async () => {
    ctx = setupPolly("binance/futures-data-market-data");
    const binance = createBinance();

    const deliveryPrice = await binance.futures.data.deliveryPrice({
      pair: "BTCUSDT",
    });
    expect(deliveryPrice[0]).toEqual(
      expect.objectContaining({
        deliveryTime: expect.any(Number),
        deliveryPrice: expect.any(Number),
      })
    );

    const openInterestHist = await binance.futures.data.openInterestHist({
      symbol: "BTCUSDT",
      period: "5m",
      limit: 1,
    });
    expect(openInterestHist[0]).toEqual(
      expect.objectContaining({
        symbol: "BTCUSDT",
        sumOpenInterest: expect.any(String),
      })
    );

    const topPositionRatio =
      await binance.futures.data.topLongShortPositionRatio({
        symbol: "BTCUSDT",
        period: "5m",
        limit: 1,
      });
    expect(topPositionRatio[0].longShortRatio).toEqual(expect.any(String));

    const topAccountRatio = await binance.futures.data.topLongShortAccountRatio(
      {
        symbol: "BTCUSDT",
        period: "5m",
        limit: 1,
      }
    );
    expect(topAccountRatio[0].longShortRatio).toEqual(expect.any(String));

    const globalRatio = await binance.futures.data.globalLongShortAccountRatio({
      symbol: "BTCUSDT",
      period: "5m",
      limit: 1,
    });
    expect(globalRatio[0].longShortRatio).toEqual(expect.any(String));

    const takerRatio = await binance.futures.data.takerlongshortRatio({
      symbol: "BTCUSDT",
      period: "5m",
      limit: 1,
    });
    expect(takerRatio[0]).toEqual(
      expect.objectContaining({
        buySellRatio: expect.any(String),
        buyVol: expect.any(String),
        sellVol: expect.any(String),
      })
    );

    const basis = await binance.futures.data.basis({
      pair: "BTCUSDT",
      contractType: "PERPETUAL",
      period: "5m",
      limit: 1,
    });
    expect(basis[0]).toEqual(
      expect.objectContaining({
        contractType: "PERPETUAL",
        basis: expect.any(String),
      })
    );
  });

  it("documents the USD-M historicalTrades no-auth skip", () => {
    const binance = createBinance();

    // /fapi/v1/historicalTrades is a MARKET_DATA endpoint but live no-key
    // requests return Binance -2014, so it stays outside this no-auth surface.
    expect("historicalTrades" in binance.fapi.v1).toBe(false);
  });
});
