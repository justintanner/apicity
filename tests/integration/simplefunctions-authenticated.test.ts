import { describe, expect, it } from "vitest";

import { createSimpleFunctions } from "@apicity/simplefunctions";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

function inputUrl(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function createJsonFetch(
  calls: FetchCall[],
  bodies: readonly unknown[]
): typeof fetch {
  const queue = [...bodies];
  return async (input, init) => {
    calls.push({ url: inputUrl(input), init });
    const body = queue.shift() ?? {};
    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
    });
  };
}

function requestHeaders(call: FetchCall): Headers {
  return new Headers(call.init?.headers);
}

function expectAuthenticatedGet(call: FetchCall, pathname: string): URL {
  const url = new URL(call.url);
  expect(call.init?.method).toBe("GET");
  expect(requestHeaders(call).get("Authorization")).toBe("Bearer sf_live_test");
  expect(requestHeaders(call).has("Content-Type")).toBe(false);
  expect(url.pathname).toBe(pathname);
  return url;
}

describe("simplefunctions authenticated workflow-state reads", () => {
  it("serializes list queries and propagates bearer auth", async () => {
    const calls: FetchCall[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls, [
        { items: [{ id: "watch_1" }], nextCursor: "watch_next" },
        { rules: [{ id: "rule_1" }], total: 1 },
        { endpoints: [{ id: "webhook_1" }] },
        { deliveries: [{ id: "delivery_1" }] },
      ]),
    });

    await expect(
      provider.api.watch({
        status: "active",
        tags: ["macro", "fed"],
        includeInactive: false,
        limit: 10,
      })
    ).resolves.toMatchObject({
      items: [{ id: "watch_1" }],
      nextCursor: "watch_next",
    });
    await expect(
      provider.api.alertRules({
        query: { watch_id: "watch_1", enabled: true, limit: 2 },
      })
    ).resolves.toMatchObject({
      rules: [{ id: "rule_1" }],
      total: 1,
    });
    await expect(
      provider.api.webhookEndpoints({ cursor: "abc123", limit: 5 })
    ).resolves.toMatchObject({
      endpoints: [{ id: "webhook_1" }],
    });
    await expect(
      provider.api.alertDeliveries({
        rule_id: "rule_1",
        success: false,
        limit: 3,
      })
    ).resolves.toMatchObject({
      deliveries: [{ id: "delivery_1" }],
    });

    expect(calls).toHaveLength(4);

    const watchUrl = expectAuthenticatedGet(calls[0], "/api/watch");
    expect(watchUrl.searchParams.get("status")).toBe("active");
    expect(watchUrl.searchParams.get("tags")).toBe("macro,fed");
    expect(watchUrl.searchParams.get("includeInactive")).toBe("false");
    expect(watchUrl.searchParams.get("limit")).toBe("10");

    const rulesUrl = expectAuthenticatedGet(calls[1], "/api/alert-rules");
    expect(rulesUrl.searchParams.get("watch_id")).toBe("watch_1");
    expect(rulesUrl.searchParams.get("enabled")).toBe("true");
    expect(rulesUrl.searchParams.get("limit")).toBe("2");

    const webhooksUrl = expectAuthenticatedGet(
      calls[2],
      "/api/webhook-endpoints"
    );
    expect(webhooksUrl.searchParams.get("cursor")).toBe("abc123");
    expect(webhooksUrl.searchParams.get("limit")).toBe("5");

    const deliveriesUrl = expectAuthenticatedGet(
      calls[3],
      "/api/alert-deliveries"
    );
    expect(deliveriesUrl.searchParams.get("rule_id")).toBe("rule_1");
    expect(deliveriesUrl.searchParams.get("success")).toBe("false");
    expect(deliveriesUrl.searchParams.get("limit")).toBe("3");
  });

  it("encodes read-by-id paths and parses JSON responses", async () => {
    const calls: FetchCall[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls, [
        { id: "watch/id 1", kind: "watch" },
        { id: "rule/id 1", kind: "alert_rule" },
      ]),
    });

    await expect(
      provider.api.watch.retrieve({ id: " watch/id 1 " })
    ).resolves.toMatchObject({
      id: "watch/id 1",
      kind: "watch",
    });
    await expect(
      provider.api.alertRules.retrieve({ id: " rule/id 1 " })
    ).resolves.toMatchObject({
      id: "rule/id 1",
      kind: "alert_rule",
    });

    expect(calls).toHaveLength(2);
    expectAuthenticatedGet(calls[0], "/api/watch/watch%2Fid%201");
    expectAuthenticatedGet(calls[1], "/api/alert-rules/rule%2Fid%201");
  });

  it("rejects workflow-state reads before fetch when apiKey is missing", async () => {
    const calls: FetchCall[] = [];
    const provider = createSimpleFunctions({
      fetch: createJsonFetch(calls, []),
    });

    await expect(provider.api.watch()).rejects.toMatchObject({ status: 401 });
    await expect(
      provider.api.watch.retrieve({ id: "watch_1" })
    ).rejects.toMatchObject({ status: 401 });
    await expect(provider.api.alertRules()).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      provider.api.alertRules.retrieve({ id: "rule_1" })
    ).rejects.toMatchObject({ status: 401 });
    await expect(provider.api.webhookEndpoints()).rejects.toMatchObject({
      status: 401,
    });
    await expect(provider.api.alertDeliveries()).rejects.toMatchObject({
      status: 401,
    });

    expect(calls).toHaveLength(0);
  });
});
