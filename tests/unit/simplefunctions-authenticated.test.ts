import { describe, expect, it } from "vitest";
import { createSimpleFunctions } from "@apicity/simplefunctions";

const BASE_URL = "https://simplefunctions.example.test";

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
  response = jsonResponse({ ok: true })
) {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return response.clone();
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

function requestUrl(
  requests: Array<{ url: string; init?: RequestInit }>,
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
