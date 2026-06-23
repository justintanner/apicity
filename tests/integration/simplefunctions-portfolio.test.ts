import { describe, expect, it } from "vitest";

import { createSimpleFunctions } from "@apicity/simplefunctions";

type SimpleFunctionsClient = ReturnType<typeof createSimpleFunctions>;

interface CapturedRequest {
  body?: string;
  headers: Record<string, string>;
  method: string;
  url: string;
}

interface PortfolioWriteCase {
  invoke: (
    provider: SimpleFunctionsClient,
    req: Record<string, unknown>
  ) => Promise<unknown>;
  method: string;
  name: string;
  path: string;
}

function inputUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function headersRecord(
  headers: HeadersInit | undefined
): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function createCapturedFetch(
  calls: CapturedRequest[],
  status = 200,
  body: unknown = { ok: true }
): typeof fetch {
  return async (input, init) => {
    calls.push({
      body: typeof init?.body === "string" ? init.body : undefined,
      headers: headersRecord(init?.headers),
      method: init?.method ?? "GET",
      url: inputUrl(input),
    });

    return new Response(status === 204 ? null : JSON.stringify(body), {
      headers:
        status === 204 ? undefined : { "content-type": "application/json" },
      status,
    });
  };
}

const portfolioWriteCases: PortfolioWriteCase[] = [
  {
    name: "state update",
    method: "PUT",
    path: "/api/portfolio/state",
    invoke: (provider, req) => provider.api.portfolio.state.update(req),
  },
  {
    name: "state update verb namespace",
    method: "PUT",
    path: "/api/portfolio/state",
    invoke: (provider, req) => provider.put.api.portfolio.state.update(req),
  },
  {
    name: "config update",
    method: "PUT",
    path: "/api/portfolio/config",
    invoke: (provider, req) => provider.api.portfolio.config.update(req),
  },
  {
    name: "config update verb namespace",
    method: "PUT",
    path: "/api/portfolio/config",
    invoke: (provider, req) => provider.put.api.portfolio.config.update(req),
  },
  {
    name: "ticks create",
    method: "POST",
    path: "/api/portfolio/ticks",
    invoke: (provider, req) => provider.api.portfolio.ticks.create(req),
  },
  {
    name: "ticks create verb namespace",
    method: "POST",
    path: "/api/portfolio/ticks",
    invoke: (provider, req) => provider.post.api.portfolio.ticks.create(req),
  },
  {
    name: "trades create",
    method: "POST",
    path: "/api/portfolio/trades",
    invoke: (provider, req) => provider.api.portfolio.trades.create(req),
  },
  {
    name: "trades create verb namespace",
    method: "POST",
    path: "/api/portfolio/trades",
    invoke: (provider, req) => provider.post.api.portfolio.trades.create(req),
  },
  {
    name: "ledger kalshi import",
    method: "POST",
    path: "/api/portfolio/ledger/import/kalshi",
    invoke: (provider, req) => provider.api.portfolio.ledger.import.kalshi(req),
  },
  {
    name: "ledger kalshi pull",
    method: "POST",
    path: "/api/portfolio/ledger/import/kalshi/pull",
    invoke: (provider, req) =>
      provider.api.portfolio.ledger.import.kalshi.pull(req),
  },
  {
    name: "ledger polymarket import",
    method: "POST",
    path: "/api/portfolio/ledger/import/polymarket",
    invoke: (provider, req) =>
      provider.api.portfolio.ledger.import.polymarket(req),
  },
  {
    name: "secrets create",
    method: "POST",
    path: "/api/portfolio/secrets",
    invoke: (provider, req) => provider.api.portfolio.secrets.create(req),
  },
  {
    name: "secrets create verb namespace",
    method: "POST",
    path: "/api/portfolio/secrets",
    invoke: (provider, req) => provider.post.api.portfolio.secrets.create(req),
  },
  {
    name: "secrets delete",
    method: "DELETE",
    path: "/api/portfolio/secrets",
    invoke: (provider, req) => provider.api.portfolio.secrets.delete(req),
  },
  {
    name: "secrets delete verb namespace",
    method: "DELETE",
    path: "/api/portfolio/secrets",
    invoke: (provider, req) =>
      provider.delete.api.portfolio.secrets.delete(req),
  },
  {
    name: "strategy create",
    method: "POST",
    path: "/api/portfolio/strategy",
    invoke: (provider, req) => provider.api.portfolio.strategy.create(req),
  },
  {
    name: "strategy update",
    method: "PUT",
    path: "/api/portfolio/strategy",
    invoke: (provider, req) => provider.api.portfolio.strategy.update(req),
  },
  {
    name: "strategy delete",
    method: "DELETE",
    path: "/api/portfolio/strategy",
    invoke: (provider, req) => provider.api.portfolio.strategy.delete(req),
  },
  {
    name: "views create",
    method: "POST",
    path: "/api/portfolio/views",
    invoke: (provider, req) => provider.api.portfolio.views.create(req),
  },
  {
    name: "views update",
    method: "PUT",
    path: "/api/portfolio/views",
    invoke: (provider, req) => provider.api.portfolio.views.update(req),
  },
  {
    name: "views delete",
    method: "DELETE",
    path: "/api/portfolio/views",
    invoke: (provider, req) => provider.api.portfolio.views.delete(req),
  },
  {
    name: "trigger",
    method: "POST",
    path: "/api/portfolio/trigger",
    invoke: (provider, req) => provider.api.portfolio.trigger(req),
  },
  {
    name: "trigger verb namespace",
    method: "POST",
    path: "/api/portfolio/trigger",
    invoke: (provider, req) => provider.post.api.portfolio.trigger(req),
  },
];

describe("simplefunctions portfolio injected fetch", () => {
  it.each(portfolioWriteCases)(
    "serializes $name writes without live side effects",
    async ({ invoke, method, path }) => {
      const calls: CapturedRequest[] = [];
      const provider = createSimpleFunctions({
        apiKey: "sf_live_test",
        fetch: createCapturedFetch(calls),
      });
      const body = {
        market: "KXRATECUT-26DEC31",
        size: 2,
      };

      await invoke(provider, {
        body,
        query: {
          dryRun: true,
          source: "unit",
          tags: ["alpha", "beta"],
        },
      });

      expect(calls).toHaveLength(1);
      const call = calls[0];
      const url = new URL(call.url);
      expect(url.pathname).toBe(path);
      expect(url.searchParams.get("dryRun")).toBe("true");
      expect(url.searchParams.get("source")).toBe("unit");
      expect(url.searchParams.get("tags")).toBe("alpha,beta");
      expect(call.method).toBe(method);
      expect(call.headers.Authorization).toBe("Bearer sf_live_test");
      expect(call.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(call.body ?? "")).toEqual(body);
    }
  );

  it("returns null for portfolio mutation 204 responses", async () => {
    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createCapturedFetch(calls, 204),
    });

    const result = await provider.api.portfolio.trigger();

    expect(result).toBeNull();
    expect(calls).toHaveLength(1);
    expect(new URL(calls[0].url).pathname).toBe("/api/portfolio/trigger");
    expect(calls[0].body).toBeUndefined();
  });

  it("requires API keys before portfolio writes reach fetch", async () => {
    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      fetch: createCapturedFetch(calls),
    });

    await expect(
      provider.api.portfolio.state.update({ body: { cash: 100 } })
    ).rejects.toMatchObject({ status: 401 });
    expect(calls).toHaveLength(0);
  });

  it("validates portfolio request bodies and row ids before fetch", async () => {
    const calls: CapturedRequest[] = [];
    const provider = createSimpleFunctions({
      apiKey: "sf_live_test",
      fetch: createCapturedFetch(calls),
    });

    await expect(
      provider.api.portfolio.state.update(
        "bad" as unknown as Record<string, unknown>
      )
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      provider.api.portfolio.ticks.retrieve({ id: "   " })
    ).rejects.toMatchObject({ status: 400 });
    expect(calls).toHaveLength(0);
  });
});
