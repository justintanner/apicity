import { describe, expect, it } from "vitest";
import { createSimpleFunctions } from "@apicity/simplefunctions";

const BASE_URL = "https://simplefunctions.example.test";
const DATA_BASE_URL = "https://data.simplefunctions.example.test";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function createDataClient() {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return jsonResponse({});
  };

  return {
    provider: createSimpleFunctions({
      baseURL: BASE_URL,
      dataBaseURL: DATA_BASE_URL,
      fetch: fetchImpl,
    }),
    requests,
  };
}

function requestUrl(
  requests: Array<{ url: string; init?: RequestInit }>,
  index: number,
  path: string
): URL {
  const req = requests[index];
  expect(req).toBeDefined();
  const url = new URL(req.url);
  expect(`${url.origin}${url.pathname}`).toBe(`${DATA_BASE_URL}${path}`);
  expect(req.init?.method).toBe("GET");
  return url;
}

describe("simplefunctions Real-Time Data API provider", () => {
  it("serializes heartbeat to the data API base URL", async () => {
    const { provider, requests } = createDataClient();

    await provider.data.v1.heartbeat();

    expect(requests).toHaveLength(1);
    const url = requestUrl(requests, 0, "/v1/heartbeat");
    expect(url.search).toBe("");
  });

  it("serializes markets list, featured markets, and exact ticker reads", async () => {
    const { provider, requests } = createDataClient();

    await provider.data.v1.markets({ q: "newsom", venue: "kalshi" });
    await provider.data.v1.markets.featured({ n: 50 });
    await provider.data.v1.markets.retrieve("KXPRESNOMD-28-GN");

    expect(requests).toHaveLength(3);
    const marketsUrl = requestUrl(requests, 0, "/v1/markets");
    expect(marketsUrl.searchParams.get("q")).toBe("newsom");
    expect(marketsUrl.searchParams.get("venue")).toBe("kalshi");

    const featuredUrl = requestUrl(requests, 1, "/v1/markets/featured");
    expect(featuredUrl.searchParams.get("n")).toBe("50");

    const marketUrl = requestUrl(requests, 2, "/v1/markets/KXPRESNOMD-28-GN");
    expect(marketUrl.search).toBe("");
  });

  it("serializes autocomplete search parameters", async () => {
    const { provider, requests } = createDataClient();

    await provider.data.v1.search({
      q: " rate cut ",
      limit: 10,
      venue: "kalshi",
      strict: false,
    });

    const url = requestUrl(requests, 0, "/v1/search");
    expect(url.searchParams.get("q")).toBe("rate cut");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("venue")).toBe("kalshi");
    expect(url.searchParams.get("strict")).toBe("0");
  });

  it("serializes snapshot and movers reads", async () => {
    const { provider, requests } = createDataClient();

    await provider.data.v1.snapshot();
    await provider.data.v1.movers({
      window: "1h",
      n: 50,
      minVol: 1000,
      dir: "both",
    });

    expect(requests).toHaveLength(2);
    const snapshotUrl = requestUrl(requests, 0, "/v1/snapshot");
    expect(snapshotUrl.search).toBe("");

    const moversUrl = requestUrl(requests, 1, "/v1/movers");
    expect(moversUrl.searchParams.get("window")).toBe("1h");
    expect(moversUrl.searchParams.get("n")).toBe("50");
    expect(moversUrl.searchParams.get("minVol")).toBe("1000");
    expect(moversUrl.searchParams.get("dir")).toBe("both");
  });

  it("serializes orderbook, candles, and trades ticker reads", async () => {
    const { provider, requests } = createDataClient();

    await provider.data.v1.orderbook("KXPRESNOMD-28-GN");
    await provider.data.v1.candles("KXPRESNOMD-28-GN", {
      tf: "1h",
      limit: 500,
    });
    await provider.data.v1.trades("KXPRESNOMD-28-GN", { limit: 50 });

    expect(requests).toHaveLength(3);
    const orderbookUrl = requestUrl(
      requests,
      0,
      "/v1/orderbook/KXPRESNOMD-28-GN"
    );
    expect(orderbookUrl.search).toBe("");

    const candlesUrl = requestUrl(requests, 1, "/v1/candles/KXPRESNOMD-28-GN");
    expect(candlesUrl.searchParams.get("tf")).toBe("1h");
    expect(candlesUrl.searchParams.get("limit")).toBe("500");

    const tradesUrl = requestUrl(requests, 2, "/v1/trades/KXPRESNOMD-28-GN");
    expect(tradesUrl.searchParams.get("limit")).toBe("50");
  });
});
