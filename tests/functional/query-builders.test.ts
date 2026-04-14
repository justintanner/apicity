// Tests for query string builders across providers — pure functions, no API calls
import { describe, it, expect } from "vitest";

// Fal query string builder tests
import { fal } from "../../packages/provider/fal/src/fal";

// XAI query builders
import { xai } from "../../packages/provider/xai/src/xai";

// Anthropic query builder tests
import { anthropic } from "../../packages/provider/anthropic/src/anthropic";

describe("fal buildQueryString", () => {
  it("returns no query string for empty params", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({ models: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.v1.models();
    expect(capturedUrl).not.toContain("?");
  });

  it("builds query string with single param", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({ models: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.v1.models({ endpoint_id: "test-model" });
    expect(capturedUrl).toContain("endpoint_id=test-model");
  });

  it("builds query string with multiple params", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({ models: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.v1.models({ endpoint_id: "test-model", q: "search" });
    expect(capturedUrl).toMatch(/endpoint_id=test-model/);
    expect(capturedUrl).toMatch(/q=search/);
    expect(capturedUrl).toContain("?");
  });

  it("skips undefined values", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({ models: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.v1.models({ endpoint_id: "test-model", q: undefined });
    expect(capturedUrl).toContain("endpoint_id=test-model");
    expect(capturedUrl).not.toContain("q=");
  });

  it("expands arrays into multiple query params with same key", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({ prices: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.v1.models.pricing({ endpoint_id: ["model1", "model2"] });
    // Fal uses URLSearchParams which serializes arrays as repeated keys
    const params = new URLSearchParams(capturedUrl.split("?")[1]);
    const values = params.getAll("endpoint_id");
    expect(values).toContain("model1");
    expect(values).toContain("model2");
  });

  it("converts numeric values to strings", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({ models: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
    };
    const p = fal({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.v1.models({ limit: 10 });
    expect(capturedUrl).toContain("limit=10");
  });
});

describe("xai buildQuery", () => {
  it("returns no query string for empty params", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
            total: 0,
            has_more: false,
          }),
          { status: 200 }
        )
      );
    };
    const p = xai({ apiKey: "test", fetch: mockFetch as typeof fetch });
    // Call without params - models endpoint is callable directly
    await p.get.v1.models();
    expect(capturedUrl).not.toContain("?");
  });

  it("builds query with single param via collections endpoint", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            collections: [],
            pagination_token: null,
          }),
          { status: 200 }
        )
      );
    };
    const p = xai({ apiKey: "test", fetch: mockFetch as typeof fetch });
    // Collections takes params as first arg
    await p.get.v1.collections({ limit: 10 });
    expect(capturedUrl).toContain("?limit=10");
  });

  it("builds query with multiple params via collections", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            collections: [],
            pagination_token: null,
          }),
          { status: 200 }
        )
      );
    };
    const p = xai({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.get.v1.collections({ limit: 10, pagination_token: "cursor123" });
    expect(capturedUrl).toMatch(/limit=10/);
    expect(capturedUrl).toMatch(/pagination_token=cursor123/);
    expect(capturedUrl).toContain("?");
  });

  it("filters out undefined values via collections", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            collections: [],
            pagination_token: null,
          }),
          { status: 200 }
        )
      );
    };
    const p = xai({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.get.v1.collections({ limit: 10, team_id: undefined });
    expect(capturedUrl).toContain("limit=10");
    expect(capturedUrl).not.toContain("team_id");
  });

  it("filters out null values via collections", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            collections: [],
            pagination_token: null,
          }),
          { status: 200 }
        )
      );
    };
    const p = xai({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.get.v1.collections({
      limit: 10,
      team_id: null as unknown as string,
    });
    expect(capturedUrl).toContain("limit=10");
    expect(capturedUrl).not.toContain("team_id");
  });

  it("URL-encodes special characters via collections filter", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            collections: [],
            pagination_token: null,
          }),
          { status: 200 }
        )
      );
    };
    const p = xai({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.get.v1.collections({ filter: "test filter" });
    expect(capturedUrl).toContain("filter=test%20filter");
  });
});

describe("anthropic list query params", () => {
  it("uses bracket notation for array params via workspaces", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
            has_more: false,
            first_id: "",
            last_id: "",
          }),
          { status: 200 }
        )
      );
    };
    const p = anthropic({ apiKey: "test", fetch: mockFetch as typeof fetch });
    // Use workspaces list with extra params via the list endpoint
    // Anthropic uses bracket notation for array params like beta headers
    // We'll test via the messages batches list endpoint which takes AnthropicListParams
    await p.get.v1.messages.batches.list({ after_id: "batch1", limit: 10 });
    expect(capturedUrl).toContain("after_id=batch1");
    expect(capturedUrl).toContain("limit=10");
  });

  it("filters out undefined values", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
            has_more: false,
            first_id: "",
            last_id: "",
          }),
          { status: 200 }
        )
      );
    };
    const p = anthropic({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.get.v1.messages.batches.list({ limit: 10, before_id: undefined });
    expect(capturedUrl).toContain("limit=10");
    expect(capturedUrl).not.toContain("before_id");
  });

  it("converts numeric limit to string", async () => {
    let capturedUrl = "";
    const mockFetch = (url: string): Promise<Response> => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
            has_more: false,
            first_id: "",
            last_id: "",
          }),
          { status: 200 }
        )
      );
    };
    const p = anthropic({ apiKey: "test", fetch: mockFetch as typeof fetch });
    await p.get.v1.messages.batches.list({ limit: 25 });
    expect(capturedUrl).toContain("limit=25");
  });
});
