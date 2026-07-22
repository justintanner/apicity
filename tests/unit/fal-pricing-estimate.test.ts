import { describe, expect, it, vi } from "vitest";

import { createFal } from "../../packages/provider/fal/src/fal";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fal pricing estimate verb surface", () => {
  it("keeps pricing lookup on the GET namespace without estimate", async () => {
    const mockFetch = vi.fn(async () =>
      jsonResponse({
        prices: [],
        next_cursor: null,
        has_more: false,
      })
    );

    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });

    await provider.get.v1.models.pricing({
      endpoint_id: "fal-ai/flux/dev",
    });

    expect(
      Object.prototype.hasOwnProperty.call(
        provider.get.v1.models.pricing,
        "estimate"
      )
    ).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://api.fal.ai/v1/models/pricing?endpoint_id=fal-ai%2Fflux%2Fdev"
    );
    expect(init.method).toBe("GET");
  });

  it("keeps pricing estimate on the POST namespace", async () => {
    const mockFetch = vi.fn(async () =>
      jsonResponse({
        estimate_type: "unit_price",
        total_cost: 2.5,
        currency: "USD",
      })
    );

    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.post.v1.models.pricing.estimate({
      estimate_type: "unit_price",
      endpoints: {
        "fal-ai/flux/dev": { unit_quantity: 100 },
      },
    });

    expect(result.total_cost).toBe(2.5);
    expect(provider.post.v1.models.pricing.estimate.schema).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://api.fal.ai/v1/models/pricing/estimate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      estimate_type: "unit_price",
      endpoints: {
        "fal-ai/flux/dev": { unit_quantity: 100 },
      },
    });
  });
});
