import { describe, expect, it, vi } from "vitest";

import { createXai } from "../../packages/provider/xai/src/xai";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("xAI management endpoint wiring", () => {
  it("sends api key info requests to the inference API", async () => {
    const responseBody = {
      redacted_api_key: "xai-...",
      user_id: "user-1",
      name: "test key",
      create_time: "2026-01-01T00:00:00Z",
      modify_time: "2026-01-01T00:00:00Z",
      modified_by: "user-1",
      team_id: "team-1",
      acls: ["api-key:model:*"],
      api_key_id: "key-1",
      team_blocked: false,
      api_key_blocked: false,
      api_key_disabled: false,
    };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    const xai = createXai({ apiKey: "xai-test", fetch: mockFetch });

    const result = await xai.get.v1.apiKey();

    expect(result).toEqual(responseBody);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.x.ai/v1/api-key");
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer xai-test",
    });
  });

  it("sends prepaid balance requests with the management API key", async () => {
    const responseBody = {
      currentBalance: {
        val: "10000",
      },
      balanceChanges: [],
    };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    const xai = createXai({
      apiKey: "xai-api",
      managementApiKey: "xai-management",
      fetch: mockFetch,
    });

    const result =
      await xai.get.managementApi.v1.billing.teams.prepaid.balance("team/1");

    expect(result).toEqual(responseBody);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://management-api.x.ai/v1/billing/teams/team%2F1/prepaid/balance"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer xai-management",
    });
  });

  it("sends billing usage requests as management JSON posts", async () => {
    const request = {
      analyticsRequest: {
        timeRange: {
          startTime: "2026-01-01T00:00:00Z",
          endTime: "2026-01-02T00:00:00Z",
          timezone: "UTC",
        },
        timeUnit: "TIME_UNIT_DAY" as const,
        values: [{ name: "usd", aggregation: "AGGREGATION_SUM" as const }],
      },
    };
    const responseBody = {
      timeSeries: [],
    };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    const xai = createXai({
      apiKey: "xai-api",
      managementApiKey: "xai-management",
      fetch: mockFetch,
    });

    const result = await xai.post.managementApi.v1.billing.teams.usage(
      "team-1",
      request
    );

    expect(result).toEqual(responseBody);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://management-api.x.ai/v1/billing/teams/team-1/usage"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer xai-management",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it("lists management API keys from the management auth root", async () => {
    const responseBody = {
      apiKeys: [],
      paginationToken: "",
    };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    const xai = createXai({
      apiKey: "xai-api",
      managementApiKey: "xai-management",
      fetch: mockFetch,
    });

    const result = await xai.get.managementApi.auth.teams.apiKeys("team-1", {
      pageSize: 10,
      activeOnly: true,
      aclFilters: ["api-key:model:*"],
    });

    expect(result).toEqual(responseBody);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://management-api.x.ai/auth/teams/team-1/api-keys"
    );
    expect(parsed.searchParams.get("pageSize")).toBe("10");
    expect(parsed.searchParams.get("activeOnly")).toBe("true");
    expect(parsed.searchParams.getAll("aclFilters")).toEqual([
      "api-key:model:*",
    ]);
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer xai-management",
    });
  });
});
