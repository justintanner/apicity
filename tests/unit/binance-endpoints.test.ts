import { describe, expect, it, vi } from "vitest";

import {
  createBinance,
  BinanceError,
  BinanceOptionsSchema,
} from "../../packages/provider/binance/src";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Binance endpoint wiring", () => {
  it("exposes ping under the mirrored API path and GET namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
    const binance = createBinance({
      baseURL: "https://binance.local",
      fetch: mockFetch,
    });

    const result = await binance.api.v3.ping();

    expect(result).toEqual({});
    expect(binance.get.api.v3.ping).toBe(binance.api.v3.ping);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://binance.local/api/v3/ping");
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });

  it("passes optional API key header for future signed endpoints", async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}));
    const binance = createBinance({
      apiKey: "binance-test-key",
      fetch: mockFetch,
    });

    await binance.api.v3.ping();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({ "X-MBX-APIKEY": "binance-test-key" });
  });

  it("exposes public no-auth namespaces with host-specific base URLs", async () => {
    const mockFetch = vi.fn(async () => jsonResponse({}));
    const binance = createBinance({
      apiKey: "binance-test-key",
      publicBaseURLs: {
        spot: "https://spot.public.local/",
        spotData: "https://spot-data.public.local/",
        fapi: "https://fapi.public.local/",
        dapi: "https://dapi.public.local/",
        eapi: "https://eapi.public.local/",
      },
      fetch: mockFetch,
    });

    await binance.public.spot.api.v3.ping();
    await binance.public.spotData.api.v3.ping();
    await binance.public.usdMFutures.fapi.v1.ping();
    await binance.public.coinMFutures.dapi.v1.ping();
    await binance.public.options.eapi.v1.ping();

    const calls = mockFetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual([
      "https://spot.public.local/api/v3/ping",
      "https://spot-data.public.local/api/v3/ping",
      "https://fapi.public.local/fapi/v1/ping",
      "https://dapi.public.local/dapi/v1/ping",
      "https://eapi.public.local/eapi/v1/ping",
    ]);
    expect(calls.every(([, init]) => init.method === "GET")).toBe(true);
    expect(
      calls.every(
        ([, init]) =>
          !("X-MBX-APIKEY" in (init.headers as Record<string, string>))
      )
    ).toBe(true);
    expect(binance.get.public.spotData.api.v3.ping).toBe(
      binance.public.spotData.api.v3.ping
    );
  });

  it("omits API key headers for public derivative host requests", async () => {
    const mockFetch = vi.fn(async () => jsonResponse([]));
    const binance = createBinance({
      apiKey: "binance-test-key",
      fapiBaseURL: "https://fapi.public.local",
      futuresDataBaseURL: "https://futures.public.local",
      dapiBaseURL: "https://dapi.public.local",
      eapiBaseURL: "https://eapi.public.local",
      fetch: mockFetch,
    });

    await binance.fapi.v1.trades({ symbol: "BTCUSDT" });
    await binance.futures.data.openInterestHist({
      symbol: "BTCUSDT",
      period: "5m",
    });
    await binance.dapi.v1.trades({ symbol: "BTCUSD_PERP" });
    await binance.eapi.v1.trades({ symbol: "BTC-260626-140000-C" });

    const calls = mockFetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls.map(([url]) => url)).toEqual([
      "https://fapi.public.local/fapi/v1/trades?symbol=BTCUSDT",
      "https://futures.public.local/futures/data/openInterestHist?symbol=BTCUSDT&period=5m",
      "https://dapi.public.local/dapi/v1/trades?symbol=BTCUSD_PERP",
      "https://eapi.public.local/eapi/v1/trades?symbol=BTC-260626-140000-C",
    ]);
    expect(
      calls.every(
        ([, init]) =>
          !("X-MBX-APIKEY" in (init.headers as Record<string, string>))
      )
    ).toBe(true);
  });

  it("serializes Binance array query params as JSON strings", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        timezone: "UTC",
        serverTime: 0,
        rateLimits: [],
        exchangeFilters: [],
        symbols: [],
      })
    );
    const binance = createBinance({ fetch: mockFetch });

    await binance.api.v3.exchangeInfo({
      symbols: ["BTCUSDT", "ETHUSDT"],
      permissions: ["SPOT", "MARGIN"],
    });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    const params = new URL(url).searchParams;
    expect(params.get("symbols")).toBe(JSON.stringify(["BTCUSDT", "ETHUSDT"]));
    expect(params.get("permissions")).toBe(JSON.stringify(["SPOT", "MARGIN"]));
  });

  it("validates public base URL options", () => {
    expect(
      BinanceOptionsSchema.parse({
        publicBaseURLs: {
          spot: "https://spot.example",
          spotData: "https://spot-data.example",
          fapi: "https://fapi.example",
          dapi: "https://dapi.example",
          eapi: "https://eapi.example",
        },
        spotBaseURL: "https://spot-override.example",
        spotDataBaseURL: "https://spot-data-override.example",
        fapiBaseURL: "https://fapi-override.example",
        dapiBaseURL: "https://dapi-override.example",
        eapiBaseURL: "https://eapi-override.example",
      })
    ).toMatchObject({
      publicBaseURLs: {
        spot: "https://spot.example",
        spotData: "https://spot-data.example",
        fapi: "https://fapi.example",
        dapi: "https://dapi.example",
        eapi: "https://eapi.example",
      },
    });
  });

  it("surfaces Binance error responses", async () => {
    const binance = createBinance({
      fetch: async () =>
        jsonResponse({ code: -1003, msg: "Too many requests" }, 429),
    });

    try {
      await binance.api.v3.ping();
    } catch (error) {
      expect(error).toBeInstanceOf(BinanceError);
      const binanceError = error as BinanceError;
      expect(binanceError.status).toBe(429);
      expect(binanceError.code).toBe("-1003");
      expect(binanceError.message).toBe(
        "Binance API error 429: Too many requests"
      );
      return;
    }

    throw new Error("Expected BinanceError");
  });
});
