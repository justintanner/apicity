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
