import { describe, expect, it } from "vitest";
import {
  createSimpleFunctions,
  SimpleFunctionsError,
} from "@apicity/simplefunctions";

const BASE_URL = "https://simplefunctions.example.test";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function textResponse(body: string): Response {
  return new Response(body, {
    headers: { "content-type": "text/markdown" },
  });
}

function createQueryClient() {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return jsonResponse({ query: "Fed rate cut", meta: { mode: "full" } });
  };

  return {
    provider: createSimpleFunctions({
      baseURL: BASE_URL,
      fetch: fetchImpl,
    }),
    requests,
  };
}

function createClient(response: Response = jsonResponse({ ok: true })) {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return response.clone();
  };

  return {
    provider: createSimpleFunctions({
      baseURL: BASE_URL,
      fetch: fetchImpl,
    }),
    requests,
  };
}

function requestSearchParams(
  requests: Array<{ url: string; init?: RequestInit }>,
  path = "/api/public/query"
): URLSearchParams {
  expect(requests).toHaveLength(1);
  const url = new URL(requests[0].url);
  expect(`${url.origin}${url.pathname}`).toBe(`${BASE_URL}${path}`);
  expect(requests[0].init?.method).toBe("GET");
  return url.searchParams;
}

function requestUrl(
  requests: Array<{ url: string; init?: RequestInit }>,
  path: string,
  method = "GET"
): URL {
  expect(requests).toHaveLength(1);
  const url = new URL(requests[0].url);
  expect(`${url.origin}${url.pathname}`).toBe(`${BASE_URL}${path}`);
  expect(requests[0].init?.method).toBe(method);
  return url;
}

describe("simplefunctions Query API provider", () => {
  it("serializes a default anonymous query without optional params", async () => {
    const { provider, requests } = createQueryClient();

    await provider.api.public.query({ q: "  Fed rate cut  " });

    const params = requestSearchParams(requests);
    expect(params.get("q")).toBe("Fed rate cut");
    expect(params.has("mode")).toBe(false);
    expect(params.has("sources")).toBe(false);
    expect(params.has("limit")).toBe(false);
    expect(params.has("model")).toBe(false);
    expect(params.has("depth")).toBe(false);
    expect(params.has("nextActions")).toBe(false);
    expect(requests[0].init?.headers).toEqual({});
  });

  it("serializes raw mode, source filters, depth, and nextActions=off", async () => {
    const { provider, requests } = createQueryClient();

    await provider.get.api.public.query({
      q: "US recession",
      mode: "raw",
      sources: ["kalshi", "polymarket", "traditional"],
      limit: 20,
      depth: true,
      nextActions: "off",
    });

    const params = requestSearchParams(requests);
    expect(params.get("q")).toBe("US recession");
    expect(params.get("mode")).toBe("raw");
    expect(params.get("sources")).toBe("kalshi,polymarket,traditional");
    expect(params.get("limit")).toBe("20");
    expect(params.get("depth")).toBe("true");
    expect(params.get("nextActions")).toBe("off");
  });

  it("sends bearer auth for authenticated model-tier calls", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      baseURL: BASE_URL,
      fetch: async (url, init) => {
        requests.push({ url: String(url), init });
        return jsonResponse({ query: "Fed rate cut" });
      },
    });

    await provider.api.public.query({
      q: "Fed rate cut",
      model: "medium",
      limit: 3,
    });

    const params = requestSearchParams(requests);
    expect(params.get("model")).toBe("medium");
    expect(params.get("limit")).toBe("3");
    expect(requests[0].init?.headers).toEqual({
      Authorization: "Bearer sf_live_test",
    });
  });

  it("rejects missing or too-short query text locally", async () => {
    const { provider, requests } = createQueryClient();

    await expect(
      provider.api.public.query(
        {} as Parameters<typeof provider.api.public.query>[0]
      )
    ).rejects.toMatchObject({
      name: "SimpleFunctionsError",
      status: 400,
    });
    await expect(provider.api.public.query({ q: " x " })).rejects.toMatchObject(
      {
        name: "SimpleFunctionsError",
        status: 400,
      }
    );
    expect(requests).toHaveLength(0);
  });

  it("rejects limit values outside the documented local range", async () => {
    const { provider, requests } = createQueryClient();

    await expect(
      provider.api.public.query({ q: "Fed rate cut", limit: 21 })
    ).rejects.toBeInstanceOf(SimpleFunctionsError);
    expect(requests).toHaveLength(0);
  });

  it("rejects medium or heavy models without an API key", async () => {
    const { provider, requests } = createQueryClient();

    await expect(
      provider.api.public.query({ q: "Fed rate cut", model: "heavy" })
    ).rejects.toMatchObject({
      name: "SimpleFunctionsError",
      status: 401,
    });
    expect(requests).toHaveLength(0);
  });

  it("wraps provider error bodies in SimpleFunctionsError", async () => {
    const provider = createSimpleFunctions({
      baseURL: BASE_URL,
      fetch: async () =>
        new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Try again in a minute.",
          }),
          { status: 429, headers: { "content-type": "application/json" } }
        ),
    });

    await expect(
      provider.api.public.query({ q: "Fed rate cut" })
    ).rejects.toThrow(SimpleFunctionsError);
  });
});

describe("simplefunctions public analytical endpoints", () => {
  it("serializes market detail, history, and candles paths", async () => {
    const { provider, requests } = createClient();

    await provider.api.public.market({
      ticker: "KXFEDDECISION-26DEC10-T0",
      depth: true,
      cvMinConf: 0.7,
      nextActions: "off",
    });
    let url = requestUrl(
      requests,
      "/api/public/market/KXFEDDECISION-26DEC10-T0"
    );
    expect(url.searchParams.get("depth")).toBe("true");
    expect(url.searchParams.get("cv_min_conf")).toBe("0.7");
    expect(url.searchParams.get("nextActions")).toBe("off");

    requests.length = 0;
    await provider.api.public.market.history({ ticker: "KXFEDDECISION" });
    requestUrl(requests, "/api/public/market/KXFEDDECISION/history");

    requests.length = 0;
    await provider.api.public.market.candles({
      ticker: "KXFEDDECISION",
      venue: "kalshi",
      timeframe: "1h",
      limit: 500,
    });
    url = requestUrl(requests, "/api/public/market/KXFEDDECISION/candles");
    expect(url.searchParams.get("venue")).toBe("kalshi");
    expect(url.searchParams.get("timeframe")).toBe("1h");
    expect(url.searchParams.get("limit")).toBe("500");
  });

  it("serializes market list, search, screen, and cross-venue requests", async () => {
    const { provider, requests } = createClient();

    await provider.api.public.markets({ category: "economy", limit: 25 });
    let url = requestUrl(requests, "/api/public/markets");
    expect(url.searchParams.get("category")).toBe("economy");
    expect(url.searchParams.get("limit")).toBe("25");

    requests.length = 0;
    await provider.api.public.search({ q: "  fed cuts  ", limit: 10 });
    url = requestUrl(requests, "/api/public/search");
    expect(url.searchParams.get("q")).toBe("fed cuts");
    expect(url.searchParams.get("limit")).toBe("10");

    requests.length = 0;
    await provider.api.public.screenByTickers({
      tickers: ["KXFED", "KXGDP"],
      venue: "kalshi",
    });
    url = requestUrl(requests, "/api/public/screen-by-tickers");
    expect(url.searchParams.get("tickers")).toBe("KXFED,KXGDP");
    expect(url.searchParams.get("venue")).toBe("kalshi");

    requests.length = 0;
    await provider.api.public.crossVenue.pairs({
      minConfidence: 0.8,
      limit: 5,
    });
    url = requestUrl(requests, "/api/public/cross-venue/pairs");
    expect(url.searchParams.get("minConfidence")).toBe("0.8");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("serializes index, regime, odds, calendar, and liquidity endpoints", async () => {
    const { provider, requests } = createClient();

    await provider.api.public.index.history({ days: 90, theme: "monetary" });
    let url = requestUrl(requests, "/api/public/index/history");
    expect(url.searchParams.get("days")).toBe("90");
    expect(url.searchParams.get("theme")).toBe("monetary");

    requests.length = 0;
    await provider.api.public.regime.scan({ label: "maker", limit: 20 });
    url = requestUrl(requests, "/api/public/regime/scan");
    expect(url.searchParams.get("label")).toBe("maker");
    expect(url.searchParams.get("limit")).toBe("20");

    requests.length = 0;
    await provider.api.public.odds({ category: "economy", band: "moving" });
    url = requestUrl(requests, "/api/public/odds");
    expect(url.searchParams.get("category")).toBe("economy");
    expect(url.searchParams.get("band")).toBe("moving");

    requests.length = 0;
    const textClient = createClient(textResponse("# odds"));
    await textClient.provider.api.public.oddsMd({ limit: 3 });
    url = requestUrl(textClient.requests, "/api/public/odds.md");
    expect(url.searchParams.get("limit")).toBe("3");

    requests.length = 0;
    await provider.api.public.yieldCurves.event({ event: "fomc" });
    requestUrl(requests, "/api/public/yield-curves/fomc");

    requests.length = 0;
    await provider.api.public.contagion({ ticker: "KXFED", window: "6h" });
    url = requestUrl(requests, "/api/public/contagion");
    expect(url.searchParams.get("ticker")).toBe("KXFED");
    expect(url.searchParams.get("window")).toBe("6h");
  });

  it("serializes government and economic query endpoints", async () => {
    const { provider, requests } = createClient();

    await provider.api.public.queryGov({
      q: "save act",
      sources: ["congress", "kalshi"],
      depth: true,
      limit: 3,
    });
    let url = requestUrl(requests, "/api/public/query-gov");
    expect(url.searchParams.get("q")).toBe("save act");
    expect(url.searchParams.get("sources")).toBe("congress,kalshi");
    expect(url.searchParams.get("depth")).toBe("true");
    expect(url.searchParams.get("limit")).toBe("3");

    requests.length = 0;
    await provider.api.public.legislation.byBillId({ billId: "119-hr-22" });
    requestUrl(requests, "/api/public/legislation/119-hr-22");

    requests.length = 0;
    await provider.api.public.congress.member({ id: "M001" });
    requestUrl(requests, "/api/public/congress/member/M001");

    requests.length = 0;
    await provider.api.public.queryEcon({
      q: "unemployment rate",
      includeMarkets: true,
      limit: 3,
    });
    url = requestUrl(requests, "/api/public/query-econ");
    expect(url.searchParams.get("q")).toBe("unemployment rate");
    expect(url.searchParams.get("includeMarkets")).toBe("true");
    expect(url.searchParams.get("limit")).toBe("3");

    requests.length = 0;
    await provider.api.public.fred({ series: "UNRATE" });
    url = requestUrl(requests, "/api/public/fred");
    expect(url.searchParams.get("series")).toBe("UNRATE");
  });

  it("serializes public content endpoints without auth", async () => {
    const { provider, requests } = createClient();

    await provider.api.changes({ since: "1h", type: "price_move" });
    let url = requestUrl(requests, "/api/changes");
    expect(url.searchParams.get("since")).toBe("1h");
    expect(url.searchParams.get("type")).toBe("price_move");

    requests.length = 0;
    await provider.api.public.context({ compact: true });
    url = requestUrl(requests, "/api/public/context");
    expect(url.searchParams.get("compact")).toBe("true");
    expect(requests[0].init?.headers).toEqual({});

    requests.length = 0;
    await provider.api.public.briefing({
      topic: "macro",
      date: "2026-06-23",
      compact: false,
    });
    url = requestUrl(requests, "/api/public/briefing");
    expect(url.searchParams.get("topic")).toBe("macro");
    expect(url.searchParams.get("date")).toBe("2026-06-23");
    expect(url.searchParams.get("compact")).toBe("false");

    requests.length = 0;
    await provider.api.public.topic({ slug: "fed rates" });
    requestUrl(requests, "/api/public/topic/fed%20rates");

    requests.length = 0;
    await provider.api.public.answer({ slug: "fed/rates" });
    requestUrl(requests, "/api/public/answer/fed%2Frates");

    requests.length = 0;
    await provider.api.public.glossary({
      q: "yield",
      category: "education",
      limit: 5,
      offset: 10,
    });
    url = requestUrl(requests, "/api/public/glossary");
    expect(url.searchParams.get("q")).toBe("yield");
    expect(url.searchParams.get("category")).toBe("education");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("offset")).toBe("10");

    requests.length = 0;
    await provider.api.public.glossary.entry({ slug: "implied-yield" });
    requestUrl(requests, "/api/public/glossary/implied-yield");

    requests.length = 0;
    await provider.api.public.guide();
    requestUrl(requests, "/api/public/guide");

    requests.length = 0;
    await provider.api.public.highlights({ venue: "kalshi", limit: 4 });
    url = requestUrl(requests, "/api/public/highlights");
    expect(url.searchParams.get("venue")).toBe("kalshi");
    expect(url.searchParams.get("limit")).toBe("4");

    requests.length = 0;
    await provider.api.public.diff({ q: "rates", offset: 2 });
    url = requestUrl(requests, "/api/public/diff");
    expect(url.searchParams.get("q")).toBe("rates");
    expect(url.searchParams.get("offset")).toBe("2");
  });

  it("serializes public catalog, thesis, opinion, and guide endpoints", async () => {
    const { provider, requests } = createClient();

    await provider.api.public.skills({ q: "risk", limit: 3 });
    let url = requestUrl(requests, "/api/public/skills");
    expect(url.searchParams.get("q")).toBe("risk");
    expect(url.searchParams.get("limit")).toBe("3");
    expect(requests[0].init?.headers).toEqual({});

    requests.length = 0;
    await provider.api.public.skill({ slug: "market monitor" });
    requestUrl(requests, "/api/public/skill/market%20monitor");

    requests.length = 0;
    await provider.api.public.ideas({
      category: "macro",
      venue: "kalshi",
      limit: 2,
      offset: 1,
    });
    url = requestUrl(requests, "/api/public/ideas");
    expect(url.searchParams.get("category")).toBe("macro");
    expect(url.searchParams.get("venue")).toBe("kalshi");
    expect(url.searchParams.get("limit")).toBe("2");
    expect(url.searchParams.get("offset")).toBe("1");

    requests.length = 0;
    await provider.api.public.ideas.byId({ id: "idea 42" });
    requestUrl(requests, "/api/public/ideas/idea%2042");

    requests.length = 0;
    await provider.api.public.theses({ q: "inflation", limit: 6 });
    url = requestUrl(requests, "/api/public/theses");
    expect(url.searchParams.get("q")).toBe("inflation");
    expect(url.searchParams.get("limit")).toBe("6");

    requests.length = 0;
    await provider.api.public.thesis({ slug: "inflation thesis" });
    requestUrl(requests, "/api/public/thesis/inflation%20thesis");

    requests.length = 0;
    await provider.api.public.opinions({ category: "macro", limit: 7 });
    url = requestUrl(requests, "/api/public/opinions");
    expect(url.searchParams.get("category")).toBe("macro");
    expect(url.searchParams.get("limit")).toBe("7");

    requests.length = 0;
    await provider.api.public.opinions.entry({ slug: "powell path" });
    requestUrl(requests, "/api/public/opinions/powell%20path");

    requests.length = 0;
    await provider.api.public.technicals({ q: "yield curve", limit: 8 });
    url = requestUrl(requests, "/api/public/technicals");
    expect(url.searchParams.get("q")).toBe("yield curve");
    expect(url.searchParams.get("limit")).toBe("8");

    requests.length = 0;
    await provider.api.public.technicals.entry({ slug: "term premium" });
    requestUrl(requests, "/api/public/technicals/term%20premium");
  });

  it("serializes public discuss as JSON POST without credentials", async () => {
    const { provider, requests } = createClient();

    await provider.api.public.discuss({
      topic: "fed",
      question: "why now?",
      context: { tickers: ["KXFED"] },
    });
    requestUrl(requests, "/api/public/discuss", "POST");
    expect(requests[0].init?.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(JSON.parse(requests[0].init?.body as string)).toEqual({
      topic: "fed",
      question: "why now?",
      context: { tickers: ["KXFED"] },
    });

    requests.length = 0;
    await provider.post.api.public.discuss({
      topic: "rates",
      question: "what changed?",
    });
    requestUrl(requests, "/api/public/discuss", "POST");
    expect(JSON.parse(requests[0].init?.body as string)).toEqual({
      topic: "rates",
      question: "what changed?",
    });
  });

  it("validates required params, ranges, auth requirements, and deprecations", async () => {
    const { provider, requests } = createClient();

    await expect(
      provider.api.public.market(
        {} as Parameters<typeof provider.api.public.market>[0]
      )
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.public.market.candles({
        ticker: "KXFED",
        limit: 2001,
      })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.public.queryGov({ q: "x" })
    ).rejects.toMatchObject({ status: 400 });
    await expect(provider.api.edges()).rejects.toMatchObject({ status: 401 });
    await expect(provider.api.calibration()).rejects.toMatchObject({
      status: 401,
    });
    expect(
      Object.prototype.hasOwnProperty.call(
        provider.api.public.regime,
        "history"
      )
    ).toBe(false);
    expect(requests).toHaveLength(0);
  });

  it("sends bearer auth for refresh, calibration, and edges", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      baseURL: BASE_URL,
      fetch: async (url, init) => {
        requests.push({ url: String(url), init });
        return jsonResponse({ ok: true });
      },
    });

    await provider.api.public.market({ ticker: "KXFED", refresh: true });
    let url = requestUrl(requests, "/api/public/market/KXFED");
    expect(url.searchParams.get("refresh")).toBe("true");
    expect(requests[0].init?.headers).toEqual({
      Authorization: "Bearer sf_live_test",
    });

    requests.length = 0;
    await provider.api.calibration({ period: "90d", minVolume: 10000 });
    url = requestUrl(requests, "/api/calibration");
    expect(url.searchParams.get("period")).toBe("90d");
    expect(url.searchParams.get("min_volume")).toBe("10000");
    expect(requests[0].init?.headers).toEqual({
      Authorization: "Bearer sf_live_test",
    });

    requests.length = 0;
    await provider.api.edges({ minStrength: 0.6, venue: "polymarket" });
    url = requestUrl(requests, "/api/edges");
    expect(url.searchParams.get("minStrength")).toBe("0.6");
    expect(url.searchParams.get("venue")).toBe("polymarket");
  });
});
