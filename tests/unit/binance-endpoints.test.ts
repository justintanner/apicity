import { describe, expect, it, vi } from "vitest";

import {
  createBinance,
  BinanceError,
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
