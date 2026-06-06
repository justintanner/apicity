import { describe, expect, it, vi } from "vitest";

import { createOpenAi } from "../../packages/provider/openai/src/openai";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OpenAI organization endpoint wiring", () => {
  it("sends organization usage requests with query filters", async () => {
    const responseBody = {
      object: "page",
      data: [],
      has_more: false,
    };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    const openai = createOpenAi({ apiKey: "sk-test", fetch: mockFetch });

    const result = await openai.get.v1.organization.usage.completions({
      start_time: 1700000000,
      models: ["gpt-5"],
      group_by: ["model"],
      batch: true,
    });

    expect(result).toEqual(responseBody);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://api.openai.com/v1/organization/usage/completions"
    );
    expect(parsed.searchParams.get("start_time")).toBe("1700000000");
    expect(parsed.searchParams.getAll("models[]")).toEqual(["gpt-5"]);
    expect(parsed.searchParams.getAll("group_by[]")).toEqual(["model"]);
    expect(parsed.searchParams.get("batch")).toBe("true");
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer sk-test",
    });
  });

  it("sends project rate limit list requests with encoded project ids", async () => {
    const responseBody = {
      object: "list",
      data: [],
      has_more: false,
    };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    const openai = createOpenAi({ apiKey: "sk-test", fetch: mockFetch });

    const result = await openai.get.v1.organization.projects.rateLimits(
      "proj/123",
      { limit: 20 }
    );

    expect(result).toEqual(responseBody);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://api.openai.com/v1/organization/projects/proj%2F123/rate_limits"
    );
    expect(parsed.searchParams.get("limit")).toBe("20");
    expect(init.method).toBe("GET");
  });
});
