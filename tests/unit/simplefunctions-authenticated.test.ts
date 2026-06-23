import { describe, expect, it } from "vitest";
import { createSimpleFunctions } from "@apicity/simplefunctions";

const BASE_URL = "https://simplefunctions.example.test";

interface CapturedRequest {
  url: string;
  init?: RequestInit;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function binaryResponse(body = "audio"): Response {
  return new Response(body, {
    headers: { "content-type": "audio/mpeg" },
  });
}

function createClient(
  apiKey = "sf_live_test",
  response: Response | Response[] = jsonResponse({ ok: true })
) {
  const requests: CapturedRequest[] = [];
  const responses = Array.isArray(response) ? response : [response];
  const fallback = jsonResponse({ ok: true });
  const fetchImpl: typeof fetch = async (url, init) => {
    const index = requests.length;
    requests.push({ url: String(url), init });
    return (responses[index] ?? responses.at(-1) ?? fallback).clone();
  };

  return {
    provider: createSimpleFunctions({
      apiKey,
      baseURL: BASE_URL,
      fetch: fetchImpl,
    }),
    requests,
  };
}

function createAnonymousClient(response = jsonResponse({ ok: true })) {
  const requests: CapturedRequest[] = [];
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

function requestUrl(
  requests: CapturedRequest[],
  index: number,
  path: string,
  method: string
): URL {
  const req = requests[index];
  expect(req).toBeDefined();
  const url = new URL(req.url);
  expect(`${url.origin}${url.pathname}`).toBe(`${BASE_URL}${path}`);
  expect(req.init?.method).toBe(method);
  return url;
}

function expectBearerAuth(requests: CapturedRequest[], index: number): void {
  expect(requests[index].init?.headers).toMatchObject({
    Authorization: "Bearer sf_live_test",
  });
}

function expectJsonBody(
  requests: CapturedRequest[],
  index: number,
  body: unknown
): void {
  expect(requests[index].init?.headers).toMatchObject({
    "Content-Type": "application/json",
  });
  expect(requests[index].init?.body).toBe(JSON.stringify(body));
}

describe("simplefunctions authenticated API provider", () => {
  it("serializes API key management with bearer auth", async () => {
    const { provider, requests } = createClient();

    await provider.api.keys();
    await provider.api.keys.create({ name: "agent-key" });
    await provider.api.keys.delete({ id: "key_123" });

    requestUrl(requests, 0, "/api/keys", "GET");
    requestUrl(requests, 1, "/api/keys", "POST");
    requestUrl(requests, 2, "/api/keys/key_123", "DELETE");
    expect(requests[0].init?.headers).toEqual({
      Authorization: "Bearer sf_live_test",
    });
    expect(requests[1].init?.body).toBe(JSON.stringify({ name: "agent-key" }));
  });

  it("serializes CLI auth handshake without requiring bearer auth", async () => {
    const { provider, requests } = createAnonymousClient();
    const sessionToken = "x".repeat(32);

    await provider.api.auth.cli({ sessionToken });
    await provider.api.auth.cli.poll({ token: sessionToken });
    await provider.api.auth.cli.complete({ sessionToken });

    requestUrl(requests, 0, "/api/auth/cli", "POST");
    const poll = requestUrl(requests, 1, "/api/auth/cli/poll", "GET");
    requestUrl(requests, 2, "/api/auth/cli/complete", "POST");
    expect(poll.searchParams.get("token")).toBe(sessionToken);
    expect(requests[0].init?.headers).toEqual({
      "Content-Type": "application/json",
    });
  });

  it("serializes thesis lifecycle paths, query params, and bodies", async () => {
    const { provider, requests } = createClient();

    await provider.api.thesis.create({
      body: { title: "Rates", thesis: "Fed cuts too soon" },
      query: { sync: true },
    });
    await provider.api.thesis.signal({
      id: "th_123",
      content: "CPI came in soft",
    });
    await provider.api.thesis.positions.update({
      id: "th_123",
      posId: "pos_1",
      status: "closed",
    });

    const create = requestUrl(requests, 0, "/api/thesis/create", "POST");
    expect(create.searchParams.get("sync")).toBe("true");
    expect(requests[0].init?.body).toBe(
      JSON.stringify({ title: "Rates", thesis: "Fed cuts too soon" })
    );

    requestUrl(requests, 1, "/api/thesis/th_123/signal", "POST");
    expect(requests[1].init?.body).toBe(
      JSON.stringify({ content: "CPI came in soft" })
    );

    requestUrl(requests, 2, "/api/thesis/th_123/positions/pos_1", "PATCH");
    expect(requests[2].init?.body).toBe(JSON.stringify({ status: "closed" }));
  });

  it("serializes portfolio and execution endpoints", async () => {
    const { provider, requests } = createClient();

    await provider.api.portfolio.state.update({ cashCents: 100_000 });
    await provider.api.portfolio.ledger.import.kalshi.pull({
      dryRun: true,
      limit: 20,
    });
    await provider.api.intents({ active: true, status: "pending" });
    await provider.api.intents.update({ id: "intent_1", status: "cancelled" });
    await provider.api.runtime.exec.trigger({ dryRun: true });

    requestUrl(requests, 0, "/api/portfolio/state", "PUT");
    requestUrl(requests, 1, "/api/portfolio/ledger/import/kalshi/pull", "POST");
    const intents = requestUrl(requests, 2, "/api/intents", "GET");
    expect(intents.searchParams.get("active")).toBe("true");
    expect(intents.searchParams.get("status")).toBe("pending");
    requestUrl(requests, 3, "/api/intents/intent_1", "PATCH");
    requestUrl(requests, 4, "/api/runtime/exec", "POST");
  });

  it("serializes portfolio read endpoints with filters and bearer auth", async () => {
    const responses = [
      { cashCents: 125_000, positions: [] },
      { baseCurrency: "USD", venues: ["kalshi"] },
      { rows: [{ id: "tick_1", ticker: "KXRATECUT-26DEC31" }] },
      { id: "tick/2026 06 22", price: 42 },
      { rows: [{ id: "trade_1", venue: "kalshi" }] },
      { id: "trade/2026 06 22", side: "yes" },
      { rows: [{ id: "ledger_1", type: "deposit" }] },
      { rows: [{ id: "fill_1", price: 43 }] },
      { rows: [{ ticker: "KXRATECUT-26DEC31", qty: 10 }] },
      { rows: [{ type: "rebalance", at: "2026-06-22" }] },
      { rows: [{ date: "2026-06-22", pnlCents: 1200 }] },
      { groups: [{ key: "venue", pnlCents: 1200 }] },
      { grossExposureCents: 50_000, concentration: 0.25 },
      { views: [{ id: "main", name: "Primary" }] },
      { strategies: [{ id: "carry", active: true }] },
    ];
    const { provider, requests } = createClient(
      "sf_live_test",
      responses.map(jsonResponse)
    );

    await expect(provider.api.portfolio.state()).resolves.toEqual(responses[0]);
    await expect(provider.api.portfolio.config()).resolves.toEqual(
      responses[1]
    );
    await expect(
      provider.api.portfolio.ticks({
        venue: "kalshi",
        ticker: "KXRATECUT-26DEC31",
        statuses: ["open", "closed"],
        limit: 25,
      })
    ).resolves.toEqual(responses[2]);
    await expect(
      provider.api.portfolio.ticks.retrieve({ id: "tick/2026 06 22" })
    ).resolves.toEqual(responses[3]);
    await expect(
      provider.api.portfolio.trades({
        account: "main",
        from: "2026-06-01",
        to: "2026-06-22",
        window: "7d",
      })
    ).resolves.toEqual(responses[4]);
    await expect(
      provider.api.portfolio.trades.retrieve({ id: "trade/2026 06 22" })
    ).resolves.toEqual(responses[5]);
    await expect(
      provider.api.portfolio.ledger({
        type: "deposit",
        since: "2026-06-01T00:00:00Z",
      })
    ).resolves.toEqual(responses[6]);
    await expect(
      provider.api.portfolio.fills({
        market: "KXRATECUT-26DEC31",
        venues: ["kalshi", "polymarket"],
      })
    ).resolves.toEqual(responses[7]);
    await expect(
      provider.api.portfolio.positions({ open: true, minQty: 1 })
    ).resolves.toEqual(responses[8]);
    await expect(
      provider.api.portfolio.activity({
        from: "2026-06-01",
        to: "2026-06-22",
        window: "24h",
      })
    ).resolves.toEqual(responses[9]);
    await expect(
      provider.api.portfolio.attribution.daily({
        from: "2026-06-01",
        to: "2026-06-22",
      })
    ).resolves.toEqual(responses[10]);
    await expect(
      provider.api.portfolio.attribution.grouped({
        groupBy: "venue",
        window: "30d",
      })
    ).resolves.toEqual(responses[11]);
    await expect(
      provider.api.portfolio.risk({ window: "7d" })
    ).resolves.toEqual(responses[12]);
    await expect(
      provider.api.portfolio.views({ includeShared: false })
    ).resolves.toEqual(responses[13]);
    await expect(
      provider.api.portfolio.strategy({ active: true })
    ).resolves.toEqual(responses[14]);

    requestUrl(requests, 0, "/api/portfolio/state", "GET");
    requestUrl(requests, 1, "/api/portfolio/config", "GET");

    const ticks = requestUrl(requests, 2, "/api/portfolio/ticks", "GET");
    expect(ticks.searchParams.get("venue")).toBe("kalshi");
    expect(ticks.searchParams.get("ticker")).toBe("KXRATECUT-26DEC31");
    expect(ticks.searchParams.get("statuses")).toBe("open,closed");
    expect(ticks.searchParams.get("limit")).toBe("25");

    requestUrl(
      requests,
      3,
      "/api/portfolio/ticks/tick%2F2026%2006%2022",
      "GET"
    );

    const trades = requestUrl(requests, 4, "/api/portfolio/trades", "GET");
    expect(trades.searchParams.get("account")).toBe("main");
    expect(trades.searchParams.get("from")).toBe("2026-06-01");
    expect(trades.searchParams.get("to")).toBe("2026-06-22");
    expect(trades.searchParams.get("window")).toBe("7d");

    requestUrl(
      requests,
      5,
      "/api/portfolio/trades/trade%2F2026%2006%2022",
      "GET"
    );

    const ledger = requestUrl(requests, 6, "/api/portfolio/ledger", "GET");
    expect(ledger.searchParams.get("type")).toBe("deposit");
    expect(ledger.searchParams.get("since")).toBe("2026-06-01T00:00:00Z");

    const fills = requestUrl(requests, 7, "/api/portfolio/fills", "GET");
    expect(fills.searchParams.get("market")).toBe("KXRATECUT-26DEC31");
    expect(fills.searchParams.get("venues")).toBe("kalshi,polymarket");

    const positions = requestUrl(
      requests,
      8,
      "/api/portfolio/positions",
      "GET"
    );
    expect(positions.searchParams.get("open")).toBe("true");
    expect(positions.searchParams.get("minQty")).toBe("1");

    const activity = requestUrl(requests, 9, "/api/portfolio/activity", "GET");
    expect(activity.searchParams.get("from")).toBe("2026-06-01");
    expect(activity.searchParams.get("to")).toBe("2026-06-22");
    expect(activity.searchParams.get("window")).toBe("24h");

    const daily = requestUrl(
      requests,
      10,
      "/api/portfolio/attribution/daily",
      "GET"
    );
    expect(daily.searchParams.get("from")).toBe("2026-06-01");
    expect(daily.searchParams.get("to")).toBe("2026-06-22");

    const grouped = requestUrl(
      requests,
      11,
      "/api/portfolio/attribution/grouped",
      "GET"
    );
    expect(grouped.searchParams.get("groupBy")).toBe("venue");
    expect(grouped.searchParams.get("window")).toBe("30d");

    const risk = requestUrl(requests, 12, "/api/portfolio/risk", "GET");
    expect(risk.searchParams.get("window")).toBe("7d");

    const views = requestUrl(requests, 13, "/api/portfolio/views", "GET");
    expect(views.searchParams.get("includeShared")).toBe("false");

    const strategy = requestUrl(requests, 14, "/api/portfolio/strategy", "GET");
    expect(strategy.searchParams.get("active")).toBe("true");

    for (const req of requests) {
      expect(req.init?.headers).toEqual({
        Authorization: "Bearer sf_live_test",
      });
    }
  });

  it("rejects portfolio reads before fetch when no API key is configured", async () => {
    const { provider, requests } = createAnonymousClient();

    await expect(provider.api.portfolio.state()).rejects.toMatchObject({
      status: 401,
    });

    expect(requests).toHaveLength(0);
  });

  it("serializes watch, alert, webhook, and prompt/tool endpoints", async () => {
    const { provider, requests } = createClient();

    await provider.api.watch.refresh({ id: "wo_1" });
    await provider.api.alertRules.test({ id: "ar_1" });
    await provider.api.webhookEndpoints.update({
      id: "we_1",
      url: "https://example.test/hook",
    });
    await provider.api.prompt();
    await provider.api.contracts.tools();
    await provider.api.mcp.call({
      transport: "mcp",
      body: { jsonrpc: "2.0", method: "tools/list" },
    });

    requestUrl(requests, 0, "/api/watch/wo_1/refresh", "POST");
    requestUrl(requests, 1, "/api/alert-rules/ar_1/test", "POST");
    requestUrl(requests, 2, "/api/webhook-endpoints/we_1", "PATCH");
    requestUrl(requests, 3, "/api/prompt", "GET");
    requestUrl(requests, 4, "/api/contracts/tools", "GET");
    requestUrl(requests, 5, "/api/mcp/mcp", "POST");
  });

  it("serializes watch workflow mutations with auth, IDs, and bodies", async () => {
    const { provider, requests } = createClient();

    await provider.api.watch.create({
      ticker: "KXINFLATION-26DEC",
      threshold: 0.42,
      channels: ["webhook", "email"],
    });
    await provider.api.watch.update({
      id: " watched/object ",
      threshold: 0.52,
      active: false,
    });
    await provider.api.watch.delete({
      id: "watched object",
      reason: "stale",
    });
    await provider.api.watch.identify({
      url: "https://kalshi.com/markets/KXINFLATION",
    });
    await provider.api.watch.refresh({
      id: "watched/refresh",
      force: true,
    });

    requestUrl(requests, 0, "/api/watch", "POST");
    requestUrl(requests, 1, "/api/watch/watched%2Fobject", "PATCH");
    requestUrl(requests, 2, "/api/watch/watched%20object", "DELETE");
    requestUrl(requests, 3, "/api/watch/identify", "POST");
    requestUrl(requests, 4, "/api/watch/watched%2Frefresh/refresh", "POST");

    for (let i = 0; i < requests.length; i += 1) {
      expectBearerAuth(requests, i);
    }
    expectJsonBody(requests, 0, {
      ticker: "KXINFLATION-26DEC",
      threshold: 0.42,
      channels: ["webhook", "email"],
    });
    expectJsonBody(requests, 1, {
      threshold: 0.52,
      active: false,
    });
    expectJsonBody(requests, 2, { reason: "stale" });
    expectJsonBody(requests, 3, {
      url: "https://kalshi.com/markets/KXINFLATION",
    });
    expectJsonBody(requests, 4, { force: true });
  });

  it("serializes alert-rule mutations and test actions", async () => {
    const { provider, requests } = createClient();

    await provider.api.alertRules.create({
      watchId: "watch_123",
      predicate: { type: "price-above", value: 0.65 },
    });
    await provider.api.alertRules.update({
      id: "rule/primary",
      enabled: true,
      throttleSeconds: 300,
    });
    await provider.api.alertRules.delete({
      id: "rule primary",
      audit: "cleanup",
    });
    await provider.api.alertRules.test({
      id: "rule/test",
      body: { dryRun: true, destination: "preview" },
    });

    requestUrl(requests, 0, "/api/alert-rules", "POST");
    requestUrl(requests, 1, "/api/alert-rules/rule%2Fprimary", "PATCH");
    requestUrl(requests, 2, "/api/alert-rules/rule%20primary", "DELETE");
    requestUrl(requests, 3, "/api/alert-rules/rule%2Ftest/test", "POST");

    for (let i = 0; i < requests.length; i += 1) {
      expectBearerAuth(requests, i);
    }
    expectJsonBody(requests, 0, {
      watchId: "watch_123",
      predicate: { type: "price-above", value: 0.65 },
    });
    expectJsonBody(requests, 1, {
      enabled: true,
      throttleSeconds: 300,
    });
    expectJsonBody(requests, 2, { audit: "cleanup" });
    expectJsonBody(requests, 3, {
      dryRun: true,
      destination: "preview",
    });
  });

  it("serializes webhook endpoint mutations and validates workflow IDs", async () => {
    const { provider, requests } = createClient();

    await provider.api.webhookEndpoints.create({
      url: "https://example.test/hook",
      events: ["alert.triggered"],
      secret: "whsec_test",
    });
    await provider.api.webhookEndpoints.update({
      id: "webhook/primary",
      url: "https://example.test/hook-v2",
      enabled: false,
    });
    await provider.api.webhookEndpoints.delete({
      id: "webhook primary",
      body: { revokeSecret: true },
    });
    await provider.api.webhookEndpoints.test({
      id: "webhook/test",
      payload: { ping: true },
    });

    requestUrl(requests, 0, "/api/webhook-endpoints", "POST");
    requestUrl(
      requests,
      1,
      "/api/webhook-endpoints/webhook%2Fprimary",
      "PATCH"
    );
    requestUrl(
      requests,
      2,
      "/api/webhook-endpoints/webhook%20primary",
      "DELETE"
    );
    requestUrl(
      requests,
      3,
      "/api/webhook-endpoints/webhook%2Ftest/test",
      "POST"
    );

    for (let i = 0; i < requests.length; i += 1) {
      expectBearerAuth(requests, i);
    }
    expectJsonBody(requests, 0, {
      url: "https://example.test/hook",
      events: ["alert.triggered"],
      secret: "whsec_test",
    });
    expectJsonBody(requests, 1, {
      url: "https://example.test/hook-v2",
      enabled: false,
    });
    expectJsonBody(requests, 2, { revokeSecret: true });
    expectJsonBody(requests, 3, { payload: { ping: true } });

    await expect(
      provider.api.watch.update({
        id: " ",
      })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.alertRules.test({
        id: "",
      })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.webhookEndpoints.delete({
        id: "",
      })
    ).rejects.toMatchObject({ status: 400 });
    expect(requests).toHaveLength(4);
  });

  it("supports session-style Market Watch calls without a local API key", async () => {
    const { provider, requests } = createAnonymousClient();

    await provider.api.dashboard2.marketWatchV2();
    await provider.api.dashboard2.marketWatch.panels.create({
      title: "SF Index 24h",
      spec: { version: 1, kind: "preset" },
    });

    requestUrl(requests, 0, "/api/dashboard2/market-watch-v2", "GET");
    requestUrl(requests, 1, "/api/dashboard2/market-watch/panels", "POST");
    expect(requests[0].init?.headers).toEqual({});
  });

  it("returns raw voice proxy responses and validates path ids locally", async () => {
    const { provider, requests } = createClient(
      "sf_live_test",
      binaryResponse()
    );

    const res = await provider.api.proxy.tts({ text: "Fed cuts" });
    expect(await res.text()).toBe("audio");
    requestUrl(requests, 0, "/api/proxy/tts", "POST");
    expect(requests[0].init?.headers).toEqual({
      Authorization: "Bearer sf_live_test",
      "Content-Type": "application/json",
    });

    await expect(
      provider.api.thesis.retrieve(
        {} as Parameters<typeof provider.api.thesis.retrieve>[0]
      )
    ).rejects.toMatchObject({ status: 400 });
  });
});
