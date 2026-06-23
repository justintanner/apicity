import { describe, expect, it } from "vitest";

import { createSimpleFunctions } from "@apicity/simplefunctions";

interface CapturedRequest {
  url: string;
  method: string;
  headers: Headers;
  body?: string;
}

interface MockResponse {
  status?: number;
  body?: unknown;
}

function inputUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function createJsonFetch(
  calls: CapturedRequest[],
  responses: MockResponse[] = []
): typeof fetch {
  return async (input, init) => {
    calls.push({
      url: inputUrl(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : undefined,
    });

    const response = responses.shift() ?? { body: { ok: true } };
    return new Response(JSON.stringify(response.body ?? { ok: true }), {
      status: response.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
}

function parsedUrl(call: CapturedRequest): URL {
  return new URL(call.url);
}

function expectAuth(call: CapturedRequest): void {
  expect(call.headers.get("Authorization")).toBe("Bearer sf_live_test");
}

function expectJsonBody(call: CapturedRequest): Record<string, unknown> {
  expect(call.body).toBeTypeOf("string");
  return JSON.parse(call.body ?? "{}") as Record<string, unknown>;
}

describe("simplefunctions thesis injected fetch coverage", () => {
  it("serializes top-level thesis lifecycle calls", async () => {
    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls),
    });

    const result = await provider.api.thesis({ limit: 2, status: "active" });
    await provider.api.thesis.create({
      body: { title: "Macro thesis" },
      query: { dryRun: true },
    });
    await provider.api.thesis.retrieve({
      id: " thesis/1 ",
      include: "nodes",
    });
    await provider.api.thesis.update({
      id: "thesis 1",
      score: 0.7,
      title: "Updated",
    });
    await provider.api.thesis.delete({
      id: "thesis 1",
      reason: "cleanup",
    });

    expect(result).toEqual({ ok: true });
    expect(calls).toHaveLength(5);

    const listUrl = parsedUrl(calls[0]);
    expect(calls[0].method).toBe("GET");
    expect(listUrl.pathname).toBe("/api/thesis");
    expect(listUrl.searchParams.get("limit")).toBe("2");
    expect(listUrl.searchParams.get("status")).toBe("active");
    expectAuth(calls[0]);

    const createUrl = parsedUrl(calls[1]);
    expect(calls[1].method).toBe("POST");
    expect(createUrl.pathname).toBe("/api/thesis/create");
    expect(createUrl.searchParams.get("dryRun")).toBe("true");
    expect(expectJsonBody(calls[1])).toEqual({ title: "Macro thesis" });
    expectAuth(calls[1]);

    const retrieveUrl = parsedUrl(calls[2]);
    expect(calls[2].method).toBe("GET");
    expect(retrieveUrl.pathname).toBe("/api/thesis/thesis%2F1");
    expect(retrieveUrl.searchParams.get("include")).toBe("nodes");
    expectAuth(calls[2]);

    expect(calls[3].method).toBe("PATCH");
    expect(parsedUrl(calls[3]).pathname).toBe("/api/thesis/thesis%201");
    expect(expectJsonBody(calls[3])).toEqual({
      score: 0.7,
      title: "Updated",
    });
    expectAuth(calls[3]);

    expect(calls[4].method).toBe("DELETE");
    expect(parsedUrl(calls[4]).pathname).toBe("/api/thesis/thesis%201");
    expect(expectJsonBody(calls[4])).toEqual({ reason: "cleanup" });
    expectAuth(calls[4]);
  });

  it("serializes thesis lookup and analysis actions", async () => {
    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls),
    });

    await provider.api.thesis.byTicker({ ticker: " KX RATE " });
    await provider.api.thesis.signal({
      body: { direction: "up" },
      id: "thesis/1",
    });
    await provider.api.thesis.evaluate({ force: true, id: "thesis/1" });
    await provider.api.thesis.augment({
      body: { context: "macro" },
      id: "thesis/1",
      mode: "fast",
    });
    await provider.api.thesis.nodes({
      body: { nodes: [{ id: "node-1" }] },
      id: "thesis/1",
    });
    await provider.api.thesis.fork({ id: "thesis/1", name: "Copy" });
    await provider.api.thesis.whatif({
      body: { shock: "rates" },
      id: "thesis/1",
    });
    await provider.api.thesis.context({ id: "thesis/1" });
    await provider.api.thesis.changes({
      id: "thesis/1",
      since: "2026-01-01",
    });
    await provider.api.thesis.prompt({ id: "thesis/1" });
    await provider.api.thesis.evaluations({ id: "thesis/1" });

    expect(calls).toHaveLength(11);
    expect(parsedUrl(calls[0]).pathname).toBe(
      "/api/thesis/by-ticker/KX%20RATE"
    );

    expect(calls[1].method).toBe("POST");
    expect(parsedUrl(calls[1]).pathname).toBe("/api/thesis/thesis%2F1/signal");
    expect(expectJsonBody(calls[1])).toEqual({ direction: "up" });

    expect(calls[2].method).toBe("POST");
    expect(parsedUrl(calls[2]).pathname).toBe(
      "/api/thesis/thesis%2F1/evaluate"
    );
    expect(expectJsonBody(calls[2])).toEqual({ force: true });

    const augmentUrl = parsedUrl(calls[3]);
    expect(calls[3].method).toBe("POST");
    expect(augmentUrl.pathname).toBe("/api/thesis/thesis%2F1/augment");
    expect(augmentUrl.searchParams.get("mode")).toBe("fast");
    expect(expectJsonBody(calls[3])).toEqual({ context: "macro" });

    expect(parsedUrl(calls[4]).pathname).toBe("/api/thesis/thesis%2F1/nodes");
    expect(expectJsonBody(calls[4])).toEqual({
      nodes: [{ id: "node-1" }],
    });

    expect(parsedUrl(calls[5]).pathname).toBe("/api/thesis/thesis%2F1/fork");
    expect(expectJsonBody(calls[5])).toEqual({ name: "Copy" });

    expect(parsedUrl(calls[6]).pathname).toBe("/api/thesis/thesis%2F1/whatif");
    expect(expectJsonBody(calls[6])).toEqual({ shock: "rates" });

    expect(parsedUrl(calls[7]).pathname).toBe("/api/thesis/thesis%2F1/context");
    const changesUrl = parsedUrl(calls[8]);
    expect(changesUrl.pathname).toBe("/api/thesis/thesis%2F1/changes");
    expect(changesUrl.searchParams.get("since")).toBe("2026-01-01");
    expect(parsedUrl(calls[9]).pathname).toBe("/api/thesis/thesis%2F1/prompt");
    expect(parsedUrl(calls[10]).pathname).toBe(
      "/api/thesis/thesis%2F1/evaluations"
    );

    for (const call of calls) {
      expectAuth(call);
    }
  });

  it("serializes nested thesis resource endpoints", async () => {
    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls),
    });

    await provider.api.thesis.heartbeat.get({ id: "thesis/1" });
    await provider.api.thesis.heartbeat.update({
      id: "thesis/1",
      status: "alive",
    });
    await provider.api.thesis.positions.list({ id: "thesis/1" });
    await provider.api.thesis.positions.create({
      body: { ticker: "KX" },
      id: "thesis/1",
    });
    await provider.api.thesis.positions.update({
      body: { size: 2 },
      id: "thesis/1",
      posId: "pos/1",
    });
    await provider.api.thesis.positions.delete({
      id: "thesis/1",
      posId: "pos/1",
      reason: "flat",
    });
    await provider.api.thesis.strategies.list({
      id: "thesis/1",
      include: "archived",
    });
    await provider.api.thesis.strategies.create({
      body: { name: "Hedge" },
      id: "thesis/1",
    });
    await provider.api.thesis.strategies.update({
      id: "thesis/1",
      sid: "strat/1",
      weight: 0.5,
    });
    await provider.api.thesis.strategies.delete({
      id: "thesis/1",
      reason: "done",
      sid: "strat/1",
    });
    await provider.api.thesis.publish({
      body: { visibility: "public" },
      id: "thesis/1",
    });
    await provider.api.thesis.unpublish({
      id: "thesis/1",
      reason: "private",
    });
    await provider.api.thesis.videos.list({ id: "thesis/1" });
    await provider.api.thesis.videos.create({
      body: { kind: "brief" },
      id: "thesis/1",
    });
    await provider.api.thesis.videoData({ id: "thesis/1" });

    expect(calls).toHaveLength(15);

    expect(calls[0].method).toBe("GET");
    expect(parsedUrl(calls[0]).pathname).toBe(
      "/api/thesis/thesis%2F1/heartbeat"
    );

    expect(calls[1].method).toBe("PATCH");
    expect(expectJsonBody(calls[1])).toEqual({ status: "alive" });

    expect(calls[2].method).toBe("GET");
    expect(parsedUrl(calls[2]).pathname).toBe(
      "/api/thesis/thesis%2F1/positions"
    );

    expect(calls[3].method).toBe("POST");
    expect(expectJsonBody(calls[3])).toEqual({ ticker: "KX" });

    expect(calls[4].method).toBe("PATCH");
    expect(parsedUrl(calls[4]).pathname).toBe(
      "/api/thesis/thesis%2F1/positions/pos%2F1"
    );
    expect(expectJsonBody(calls[4])).toEqual({ size: 2 });

    expect(calls[5].method).toBe("DELETE");
    expect(expectJsonBody(calls[5])).toEqual({ reason: "flat" });

    const strategiesUrl = parsedUrl(calls[6]);
    expect(calls[6].method).toBe("GET");
    expect(strategiesUrl.pathname).toBe("/api/thesis/thesis%2F1/strategies");
    expect(strategiesUrl.searchParams.get("include")).toBe("archived");

    expect(calls[7].method).toBe("POST");
    expect(expectJsonBody(calls[7])).toEqual({ name: "Hedge" });

    expect(calls[8].method).toBe("PATCH");
    expect(parsedUrl(calls[8]).pathname).toBe(
      "/api/thesis/thesis%2F1/strategies/strat%2F1"
    );
    expect(expectJsonBody(calls[8])).toEqual({ weight: 0.5 });

    expect(calls[9].method).toBe("DELETE");
    expect(expectJsonBody(calls[9])).toEqual({ reason: "done" });

    expect(calls[10].method).toBe("POST");
    expect(parsedUrl(calls[10]).pathname).toBe(
      "/api/thesis/thesis%2F1/publish"
    );
    expect(expectJsonBody(calls[10])).toEqual({ visibility: "public" });

    expect(calls[11].method).toBe("DELETE");
    expect(parsedUrl(calls[11]).pathname).toBe(
      "/api/thesis/thesis%2F1/publish"
    );
    expect(expectJsonBody(calls[11])).toEqual({ reason: "private" });

    expect(calls[12].method).toBe("GET");
    expect(parsedUrl(calls[12]).pathname).toBe("/api/thesis/thesis%2F1/videos");

    expect(calls[13].method).toBe("POST");
    expect(expectJsonBody(calls[13])).toEqual({ kind: "brief" });

    expect(calls[14].method).toBe("GET");
    expect(parsedUrl(calls[14]).pathname).toBe(
      "/api/thesis/thesis%2F1/video-data"
    );

    for (const call of calls) {
      expectAuth(call);
    }
  });

  it("exposes thesis write endpoints through method namespaces", async () => {
    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls),
    });

    await provider.post.api.thesis.create({ body: { title: "Post ns" } });
    await provider.patch.api.thesis.positions.update({
      body: { size: 3 },
      id: "thesis/1",
      posId: "pos/1",
    });
    await provider.delete.api.thesis.unpublish({ id: "thesis/1" });

    expect(calls).toHaveLength(3);
    expect(calls[0].method).toBe("POST");
    expect(parsedUrl(calls[0]).pathname).toBe("/api/thesis/create");
    expect(expectJsonBody(calls[0])).toEqual({ title: "Post ns" });

    expect(calls[1].method).toBe("PATCH");
    expect(parsedUrl(calls[1]).pathname).toBe(
      "/api/thesis/thesis%2F1/positions/pos%2F1"
    );
    expect(expectJsonBody(calls[1])).toEqual({ size: 3 });

    expect(calls[2].method).toBe("DELETE");
    expect(parsedUrl(calls[2]).pathname).toBe("/api/thesis/thesis%2F1/publish");
  });

  it("fails locally for missing auth and invalid path parameters", async () => {
    const unauthenticatedCalls: CapturedRequest[] = [];
    const unauthenticated = createSimpleFunctions({
      fetch: createJsonFetch(unauthenticatedCalls),
    });

    await expect(unauthenticated.api.thesis()).rejects.toMatchObject({
      status: 401,
    });
    expect(unauthenticatedCalls).toHaveLength(0);

    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls),
    });

    await expect(
      provider.api.thesis.retrieve({ id: "   " })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.thesis.byTicker({ ticker: " " })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.thesis.positions.update({ id: "t", posId: " " })
    ).rejects.toMatchObject({ status: 400 });
    expect(calls).toHaveLength(0);
  });

  it("maps non-ok thesis responses to SimpleFunctionsError", async () => {
    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createJsonFetch(calls, [
        { status: 403, body: { error: "forbidden" } },
      ]),
    });

    await expect(provider.api.thesis()).rejects.toMatchObject({
      body: { error: "forbidden" },
      message: "SimpleFunctions API error 403: forbidden",
      status: 403,
    });
    expect(calls).toHaveLength(1);
    expect(parsedUrl(calls[0]).pathname).toBe("/api/thesis");
  });
});
