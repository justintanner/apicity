import { describe, expect, it } from "vitest";

import { createBinance } from "@apicity/binance";

describe("binance options eapi", () => {
  it("uses the eapi base url and maps empty block trades responses to an array", async () => {
    const urls: string[] = [];
    const fakeFetch: typeof fetch = async (input) => {
      urls.push(String(input));
      return new Response("", { status: 200 });
    };
    const binance = createBinance({
      eapiBaseURL: "https://example.test",
      fetch: fakeFetch,
    });

    const result = await binance.eapi.v1.blockTrades({
      symbol: "BTC-260626-140000-C",
      limit: 5,
    });

    expect(result).toEqual([]);
    expect(urls).toEqual([
      "https://example.test/eapi/v1/blockTrades?symbol=BTC-260626-140000-C&limit=5",
    ]);
  });
});
