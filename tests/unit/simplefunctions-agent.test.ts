import { describe, expect, it } from "vitest";
import { createSimpleFunctions } from "@apicity/simplefunctions";

const BASE_URL = "https://simplefunctions.example.test";

function response(body: unknown): Response {
  if (typeof body === "string") {
    return new Response(body, {
      headers: { "content-type": "text/plain" },
    });
  }
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function createAgentClient(body: unknown = { ok: true }) {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return response(body);
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
  path: string
): URL {
  expect(requests).toHaveLength(1);
  const url = new URL(requests[0].url);
  expect(`${url.origin}${url.pathname}`).toBe(`${BASE_URL}${path}`);
  expect(requests[0].init?.method).toBe("GET");
  return url;
}

describe("simplefunctions Agent API provider", () => {
  it("serializes a JSON world snapshot request", async () => {
    const { provider, requests } = createAgentClient({ index: {} });

    await provider.api.agent.world({
      depth: 1,
      format: "json",
      limit: 10,
      op: "snapshot",
    });

    const url = requestUrl(requests, "/api/agent/world");
    expect(url.searchParams.get("format")).toBe("json");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("depth")).toBe("1");
    expect(url.searchParams.get("op")).toBe("snapshot");
    expect(requests[0].init?.headers).toEqual({});
  });

  it("serializes a drill path with path segments and query params", async () => {
    const { provider, requests } = createAgentClient({ region: {} });

    await provider.api.agent.world.path({
      path: ["iran", "hormuz"],
      depth: 2,
      format: "json",
      limit: 8,
    });

    const url = requestUrl(requests, "/api/agent/world/iran/hormuz");
    expect(url.searchParams.get("format")).toBe("json");
    expect(url.searchParams.get("limit")).toBe("8");
    expect(url.searchParams.get("depth")).toBe("2");
  });

  it("serializes world delta since and format parameters", async () => {
    const { provider, requests } = createAgentClient({ changes: [] });

    await provider.api.agent.world.delta({
      since: "1h",
      format: "json",
    });

    const url = requestUrl(requests, "/api/agent/world/delta");
    expect(url.searchParams.get("since")).toBe("1h");
    expect(url.searchParams.get("format")).toBe("json");
  });

  it("serializes inspect ticker and payload-trimming flags", async () => {
    const { provider, requests } = createAgentClient({
      ticker: "KXRATECUT-26DEC31",
    });

    await provider.api.agent.inspect({
      ticker: " KXRATECUT-26DEC31 ",
      contagion: false,
      diff: false,
      trend: false,
      nextActions: "off",
    });

    const url = requestUrl(requests, "/api/agent/inspect/KXRATECUT-26DEC31");
    expect(url.searchParams.get("contagion")).toBe("false");
    expect(url.searchParams.get("diff")).toBe("false");
    expect(url.searchParams.get("trend")).toBe("false");
    expect(url.searchParams.get("nextActions")).toBe("off");
  });

  it("reads the world Atom feed as text", async () => {
    const { provider, requests } = createAgentClient("<feed />");

    await expect(provider.api.agent.world.feed()).resolves.toBe("<feed />");

    const url = requestUrl(requests, "/api/agent/world/feed");
    expect(url.search).toBe("");
  });

  it("serializes topic feed path and query parameters", async () => {
    const { provider, requests } = createAgentClient({ topic: "fed_rates" });

    await provider.api.agent.feed({
      topic: " fed_rates ",
      since: "24h",
      limit: 5,
      format: "json",
    });

    const url = requestUrl(requests, "/api/agent/feed/fed_rates");
    expect(url.searchParams.get("since")).toBe("24h");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("format")).toBe("json");
  });

  it("sends bearer auth to agent reads when configured", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      baseURL: BASE_URL,
      fetch: async (url, init) => {
        requests.push({ url: String(url), init });
        return response({ index: {} });
      },
    });

    await provider.api.agent.world({ format: "json" });

    requestUrl(requests, "/api/agent/world");
    expect(requests[0].init?.headers).toEqual({
      Authorization: "Bearer sf_live_test",
    });
  });
});
