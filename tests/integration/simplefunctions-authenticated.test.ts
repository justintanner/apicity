import { describe, expect, it } from "vitest";

import {
  createSimpleFunctions,
  SimpleFunctionsBodyRequestSchema,
  SimpleFunctionsError,
  SimpleFunctionsIdRequestSchema,
  SimpleFunctionsOptionalQueryRequestSchema,
  SimpleFunctionsRecordRequestSchema,
  type SimpleFunctionsOptionalQueryRequest,
} from "@apicity/simplefunctions";

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

interface CapturedRequest {
  url: string;
  init: RequestInit;
  jsonBody?: unknown;
}

function createCapturedJsonFetch(
  body: unknown = { ok: true },
  status = 200
): { calls: CapturedRequest[]; fetch: typeof fetch } {
  const calls: CapturedRequest[] = [];

  return {
    calls,
    fetch: async (input, init = {}) => {
      let jsonBody: unknown;
      if (typeof init.body === "string") {
        jsonBody = JSON.parse(init.body);
      }

      calls.push({
        url: inputUrl(input),
        init,
        jsonBody,
      });

      return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    },
  };
}

function header(init: RequestInit, name: string): string | undefined {
  return new Headers(init.headers).get(name) ?? undefined;
}

function parsedUrl(call: CapturedRequest): URL {
  return new URL(call.url);
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
      // The declared request type's catchall index signature contradicts its
      // own `query` object property, so this valid payload needs a cast
      // through the specific declared request type.
      provider.api.alertRules({
        query: { watch_id: "watch_1", enabled: true, limit: 2 },
      } as unknown as SimpleFunctionsOptionalQueryRequest)
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

describe("simplefunctions authenticated account endpoints", () => {
  it("exposes schemas for account, key, intent, and runtime methods", () => {
    const provider = createSimpleFunctions({ apiKey: "sf_live_test" });

    expect(provider.api.feed.schema).toBe(
      SimpleFunctionsOptionalQueryRequestSchema
    );
    expect(provider.api.keys.schema).toBe(
      SimpleFunctionsOptionalQueryRequestSchema
    );
    expect(provider.api.keys.create.schema).toBe(
      SimpleFunctionsBodyRequestSchema
    );
    expect(provider.api.keys.delete.schema).toBe(
      SimpleFunctionsIdRequestSchema
    );
    expect(provider.api.intents.schema).toBe(
      SimpleFunctionsOptionalQueryRequestSchema
    );
    expect(provider.api.intents.create.schema).toBe(
      SimpleFunctionsRecordRequestSchema
    );
    expect(provider.api.intents.retrieve.schema).toBe(
      SimpleFunctionsIdRequestSchema
    );
    expect(provider.api.runtime.exec.schema).toBe(
      SimpleFunctionsOptionalQueryRequestSchema
    );
    expect(provider.api.runtime.exec.trigger.schema).toBe(
      SimpleFunctionsRecordRequestSchema
    );
  });

  it("sends bearer auth and query parameters for read endpoints", async () => {
    const { calls, fetch } = createCapturedJsonFetch({ items: [] });
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch,
    });

    await provider.api.feed({ limit: 2, cursor: "abc", tags: ["one", "two"] });
    await provider.api.keys({ limit: 3, search: "primary" });
    await provider.api.intents({ status: "open", limit: 4 });
    await provider.api.runtime.exec({ runId: "run-1", verbose: true });

    for (const call of calls) {
      expect(call.init.method).toBe("GET");
      expect(header(call.init, "Authorization")).toBe("Bearer sf_live_test");
    }

    let url = parsedUrl(calls[0]);
    expect(url.pathname).toBe("/api/feed");
    expect(url.searchParams.get("limit")).toBe("2");
    expect(url.searchParams.get("cursor")).toBe("abc");
    expect(url.searchParams.get("tags")).toBe("one,two");

    url = parsedUrl(calls[1]);
    expect(url.pathname).toBe("/api/keys");
    expect(url.searchParams.get("limit")).toBe("3");
    expect(url.searchParams.get("search")).toBe("primary");

    url = parsedUrl(calls[2]);
    expect(url.pathname).toBe("/api/intents");
    expect(url.searchParams.get("status")).toBe("open");
    expect(url.searchParams.get("limit")).toBe("4");

    url = parsedUrl(calls[3]);
    expect(url.pathname).toBe("/api/runtime/exec");
    expect(url.searchParams.get("runId")).toBe("run-1");
    expect(url.searchParams.get("verbose")).toBe("true");
  });

  it("serializes key lifecycle requests locally", async () => {
    const { calls, fetch } = createCapturedJsonFetch({ ok: true });
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch,
    });

    await provider.api.keys.create({
      body: { name: "primary", scopes: ["read"] },
    });
    await provider.api.keys.delete({ id: " key/with space " });

    expect(calls[0].init.method).toBe("POST");
    expect(parsedUrl(calls[0]).pathname).toBe("/api/keys");
    expect(header(calls[0].init, "Authorization")).toBe("Bearer sf_live_test");
    expect(header(calls[0].init, "Content-Type")).toBe("application/json");
    expect(calls[0].jsonBody).toEqual({
      name: "primary",
      scopes: ["read"],
    });

    expect(calls[1].init.method).toBe("DELETE");
    expect(parsedUrl(calls[1]).pathname).toBe("/api/keys/key%2Fwith%20space");
    expect(header(calls[1].init, "Authorization")).toBe("Bearer sf_live_test");
    expect(calls[1].init.body).toBeUndefined();
  });

  it("serializes intent lifecycle requests locally", async () => {
    const { calls, fetch } = createCapturedJsonFetch({ ok: true });
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch,
    });

    await provider.api.intents.create({
      kind: "workflow",
      args: { ticker: "KXTEST" },
    });
    await provider.api.intents.retrieve({ id: "intent/123" });
    await provider.api.intents.update({
      id: "intent/123",
      status: "paused",
    });
    await provider.api.intents.delete({
      id: "intent/123",
      reason: "done",
    });

    expect(calls[0].init.method).toBe("POST");
    expect(parsedUrl(calls[0]).pathname).toBe("/api/intents");
    expect(calls[0].jsonBody).toEqual({
      kind: "workflow",
      args: { ticker: "KXTEST" },
    });

    expect(calls[1].init.method).toBe("GET");
    expect(parsedUrl(calls[1]).pathname).toBe("/api/intents/intent%2F123");
    expect(calls[1].init.body).toBeUndefined();

    expect(calls[2].init.method).toBe("PATCH");
    expect(parsedUrl(calls[2]).pathname).toBe("/api/intents/intent%2F123");
    expect(calls[2].jsonBody).toEqual({ status: "paused" });

    expect(calls[3].init.method).toBe("DELETE");
    expect(parsedUrl(calls[3]).pathname).toBe("/api/intents/intent%2F123");
    expect(calls[3].jsonBody).toEqual({ reason: "done" });
  });

  it("distinguishes runtime exec status from trigger", async () => {
    const { calls, fetch } = createCapturedJsonFetch({ ok: true });
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch,
    });

    await provider.api.runtime.exec({ runId: "run-1" });
    await provider.api.runtime.exec.trigger({
      command: "sync",
      dryRun: true,
    });

    expect(calls[0].init.method).toBe("GET");
    let url = parsedUrl(calls[0]);
    expect(url.pathname).toBe("/api/runtime/exec");
    expect(url.searchParams.get("runId")).toBe("run-1");
    expect(calls[0].init.body).toBeUndefined();

    expect(calls[1].init.method).toBe("POST");
    url = parsedUrl(calls[1]);
    expect(url.pathname).toBe("/api/runtime/exec");
    expect(url.search).toBe("");
    expect(calls[1].jsonBody).toEqual({
      command: "sync",
      dryRun: true,
    });
  });

  it("rejects authenticated endpoints locally without an API key", async () => {
    const { calls, fetch } = createCapturedJsonFetch({ ok: true });
    const provider = createSimpleFunctions({ fetch });

    await expect(provider.api.feed()).rejects.toMatchObject({ status: 401 });
    await expect(
      provider.api.keys.create({ body: { name: "primary" } })
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      provider.api.runtime.exec.trigger({ command: "sync" })
    ).rejects.toMatchObject({ status: 401 });

    expect(calls).toHaveLength(0);
  });

  it("validates encoded id paths before fetch", async () => {
    const { calls, fetch } = createCapturedJsonFetch({ ok: true });
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch,
    });

    await expect(provider.api.keys.delete({ id: "   " })).rejects.toMatchObject(
      { status: 400 }
    );

    expect(calls).toHaveLength(0);
  });

  it("surfaces API error bodies for authenticated requests", async () => {
    const { calls, fetch } = createCapturedJsonFetch(
      { error: "forbidden" },
      403
    );
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch,
    });

    let error: unknown;
    try {
      await provider.api.feed();
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(SimpleFunctionsError);
    expect(error).toMatchObject({
      status: 403,
      body: { error: "forbidden" },
    });

    expect(calls).toHaveLength(1);
  });
});
