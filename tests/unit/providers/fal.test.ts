// Tests for the fal provider
import { describe, it, expect, vi } from "vitest";
import { fal, FalError } from "../../../packages/provider/fal/src";

describe("fal provider", () => {
  interface FalModel {
    endpoint_id: string;
    metadata?: {
      display_name: string;
      category: string;
      description: string;
      status: "active" | "deprecated";
      tags: string[];
      updated_at: string;
      is_favorited: boolean | null;
      thumbnail_url: string;
      model_url: string;
      date: string;
      highlighted: boolean;
      pinned: boolean;
    };
  }

  interface FalModelSearchResponse {
    models: FalModel[];
    next_cursor: string | null;
    has_more: boolean;
  }

  interface FalPricingResponse {
    prices: Array<{
      endpoint_id: string;
      unit_price: number;
      unit: string;
      currency: string;
    }>;
    next_cursor: string | null;
    has_more: boolean;
  }

  interface FalEstimateResponse {
    estimate_type: "historical_api_price" | "unit_price";
    total_cost: number;
    currency: string;
  }

  interface FalUsageResponse {
    next_cursor: string | null;
    has_more: boolean;
    time_series?: Array<{
      bucket: string;
      results: Array<{
        endpoint_id: string;
        unit: string;
        quantity: number;
        unit_price: number;
        cost: number;
        currency: string;
      }>;
    }>;
  }

  interface FalAnalyticsResponse {
    next_cursor: string | null;
    has_more: boolean;
    time_series?: Array<{
      bucket: string;
      results: Array<{
        endpoint_id: string;
        request_count?: number;
        success_count?: number;
      }>;
    }>;
  }

  interface FalRequestsResponse {
    next_cursor: string | null;
    has_more: boolean;
    items: Array<{
      request_id: string;
      endpoint_id: string;
      started_at: string;
      sent_at: string;
      ended_at?: string;
      status_code?: number;
      duration?: number;
    }>;
  }

  interface FalDeletePayloadsResponse {
    cdn_delete_results: Array<{
      link: string;
      exception: string | null;
    }>;
  }

  interface FalModelsCallable {
    (params?: unknown, signal?: AbortSignal): Promise<FalModelSearchResponse>;
    pricing: FalPricingCallable;
    usage(params?: unknown, signal?: AbortSignal): Promise<FalUsageResponse>;
    analytics(
      params: { endpoint_id: string | string[] },
      signal?: AbortSignal
    ): Promise<FalAnalyticsResponse>;
    requests: {
      byEndpoint(
        params: {
          endpoint_id: string;
          status?: "success" | "error" | "user_error";
        },
        signal?: AbortSignal
      ): Promise<FalRequestsResponse>;
      payloads(
        params: { request_id: string; idempotency_key?: string },
        signal?: AbortSignal
      ): Promise<FalDeletePayloadsResponse>;
    };
  }

  interface FalPricingCallable {
    (
      params: { endpoint_id: string | string[] },
      signal?: AbortSignal
    ): Promise<FalPricingResponse>;
    estimate(req: unknown, signal?: AbortSignal): Promise<FalEstimateResponse>;
  }

  interface FalProvider {
    v1: {
      models: FalModelsCallable;
    };
  }

  function createMockProvider(): FalProvider {
    const pricing = Object.assign(
      vi.fn().mockResolvedValue({
        prices: [
          {
            endpoint_id: "fal-ai/flux/dev",
            unit_price: 0.025,
            unit: "image",
            currency: "USD",
          },
        ],
        next_cursor: null,
        has_more: false,
      }),
      {
        estimate: vi.fn().mockResolvedValue({
          estimate_type: "unit_price",
          total_cost: 1.25,
          currency: "USD",
        }),
      }
    );
    const models = Object.assign(
      vi.fn().mockResolvedValue({
        models: [
          {
            endpoint_id: "fal-ai/flux/dev",
            metadata: {
              display_name: "FLUX.1 [dev]",
              category: "text-to-image",
              description: "Fast text-to-image generation",
              status: "active",
              tags: ["fast", "pro"],
              updated_at: "2025-01-15T12:00:00Z",
              is_favorited: false,
              thumbnail_url: "https://fal.media/files/example.jpg",
              model_url: "https://fal.run/fal-ai/flux/dev",
              date: "2024-08-01T00:00:00Z",
              highlighted: true,
              pinned: false,
            },
          },
        ],
        next_cursor: null,
        has_more: false,
      }),
      {
        pricing,
        usage: vi.fn().mockResolvedValue({
          next_cursor: null,
          has_more: false,
          time_series: [
            {
              bucket: "2025-01-15T00:00:00-05:00",
              results: [
                {
                  endpoint_id: "fal-ai/flux/dev",
                  unit: "image",
                  quantity: 4,
                  unit_price: 0.1,
                  cost: 0.4,
                  currency: "USD",
                },
              ],
            },
          ],
        }),
        analytics: vi.fn().mockResolvedValue({
          next_cursor: null,
          has_more: false,
          time_series: [
            {
              bucket: "2025-01-15T12:00:00-05:00",
              results: [
                {
                  endpoint_id: "fal-ai/flux/dev",
                  request_count: 1500,
                  success_count: 1450,
                },
              ],
            },
          ],
        }),
        requests: {
          byEndpoint: vi.fn().mockResolvedValue({
            next_cursor: "Mg==",
            has_more: true,
            items: [
              {
                request_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                endpoint_id: "fal-ai/flux/dev",
                started_at: "2025-01-01T00:00:05Z",
                sent_at: "2025-01-01T00:00:01Z",
                ended_at: "2025-01-01T00:00:08Z",
                status_code: 200,
                duration: 7.8,
              },
            ],
          }),
          payloads: vi.fn().mockResolvedValue({
            cdn_delete_results: [
              {
                link: "https://v3.fal.media/files/abc123/output.png",
                exception: null,
              },
            ],
          }),
        },
      }
    );
    return {
      v1: {
        models,
      },
    };
  }

  describe("models", () => {
    it("should return a list of models", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models();

      expect(result.models).toHaveLength(1);
      expect(result.models[0].endpoint_id).toBe("fal-ai/flux/dev");
      expect(result.models[0].metadata?.display_name).toBe("FLUX.1 [dev]");
      expect(result.has_more).toBe(false);
    });

    it("should support pagination", async () => {
      const provider = createMockProvider();
      await provider.v1.models({ limit: 10 });

      expect(provider.v1.models).toHaveBeenCalledWith({ limit: 10 });
    });

    it("should support searching by endpoint ID", async () => {
      const provider = createMockProvider();
      await provider.v1.models({ endpoint_id: "fal-ai/flux/dev" });

      expect(provider.v1.models).toHaveBeenCalledWith({
        endpoint_id: "fal-ai/flux/dev",
      });
    });

    it("should support searching by query", async () => {
      const provider = createMockProvider();
      await provider.v1.models({ q: "image generation" });

      expect(provider.v1.models).toHaveBeenCalledWith({
        q: "image generation",
      });
    });
  });

  describe("pricing", () => {
    it("should return pricing for a specific endpoint", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.pricing({
        endpoint_id: "fal-ai/flux/dev",
      });

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0].unit_price).toBe(0.025);
      expect(result.prices[0].unit).toBe("image");
      expect(result.prices[0].currency).toBe("USD");
    });

    it("should support multiple endpoint IDs", async () => {
      const provider = createMockProvider();
      await provider.v1.models.pricing({
        endpoint_id: ["fal-ai/flux/dev", "fal-ai/flux/schnell"],
      });

      expect(provider.v1.models.pricing).toHaveBeenCalledWith({
        endpoint_id: ["fal-ai/flux/dev", "fal-ai/flux/schnell"],
      });
    });
  });

  describe("estimateCost", () => {
    it("should estimate cost using unit price", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.pricing.estimate({
        estimate_type: "unit_price",
        endpoints: {
          "fal-ai/flux/dev": { unit_quantity: 50 },
        },
      });

      expect(result.estimate_type).toBe("unit_price");
      expect(result.total_cost).toBe(1.25);
      expect(result.currency).toBe("USD");
    });

    it("should estimate cost using historical API price", async () => {
      const provider = createMockProvider();
      (
        provider.v1.models.pricing.estimate as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        estimate_type: "historical_api_price",
        total_cost: 3.75,
        currency: "USD",
      });

      const result = await provider.v1.models.pricing.estimate({
        estimate_type: "historical_api_price",
        endpoints: {
          "fal-ai/flux/dev": { call_quantity: 100 },
        },
      });

      expect(result.estimate_type).toBe("historical_api_price");
    });
  });

  describe("usage", () => {
    it("should return usage data", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.usage();

      expect(result.time_series).toBeDefined();
      expect(result.time_series?.[0].results[0].quantity).toBe(4);
      expect(result.time_series?.[0].results[0].cost).toBe(0.4);
    });

    it("should support date range filtering", async () => {
      const provider = createMockProvider();
      await provider.v1.models.usage({
        start: "2025-01-01",
        end: "2025-01-31",
      });

      expect(provider.v1.models.usage).toHaveBeenCalledWith({
        start: "2025-01-01",
        end: "2025-01-31",
      });
    });

    it("should support endpoint filtering", async () => {
      const provider = createMockProvider();
      await provider.v1.models.usage({ endpoint_id: "fal-ai/flux/dev" });

      expect(provider.v1.models.usage).toHaveBeenCalledWith({
        endpoint_id: "fal-ai/flux/dev",
      });
    });
  });

  describe("analytics", () => {
    it("should return analytics data", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.analytics({
        endpoint_id: "fal-ai/flux/dev",
      });

      expect(result.time_series).toBeDefined();
      expect(result.time_series?.[0].results[0].request_count).toBe(1500);
      expect(result.time_series?.[0].results[0].success_count).toBe(1450);
    });

    it("should require endpoint ID", async () => {
      const provider = createMockProvider();
      await provider.v1.models.analytics({
        endpoint_id: "fal-ai/flux/dev",
      });

      expect(provider.v1.models.analytics).toHaveBeenCalledWith({
        endpoint_id: "fal-ai/flux/dev",
      });
    });
  });

  describe("requests", () => {
    it("should return request history", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.requests.byEndpoint({
        endpoint_id: "fal-ai/flux/dev",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].request_id).toBe(
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      );
      expect(result.has_more).toBe(true);
    });

    it("should support status filtering", async () => {
      const provider = createMockProvider();
      await provider.v1.models.requests.byEndpoint({
        endpoint_id: "fal-ai/flux/dev",
        status: "success",
      });

      expect(provider.v1.models.requests.byEndpoint).toHaveBeenCalledWith({
        endpoint_id: "fal-ai/flux/dev",
        status: "success",
      });
    });
  });

  describe("deletePayloads", () => {
    it("should delete request payloads", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.requests.payloads({
        request_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      });

      expect(result.cdn_delete_results).toHaveLength(1);
      expect(result.cdn_delete_results[0].exception).toBeNull();
    });

    it("should support idempotency key", async () => {
      const provider = createMockProvider();
      await provider.v1.models.requests.payloads({
        request_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        idempotency_key: "unique-key-123",
      });

      expect(provider.v1.models.requests.payloads).toHaveBeenCalledWith({
        request_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        idempotency_key: "unique-key-123",
      });
    });
  });

  describe("payloadSchema", () => {
    const provider = fal({
      apiKey: "test-key",
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    });

    it("v1.models.pricing.estimate.payloadSchema has method POST and path /models/pricing/estimate", () => {
      const schema = provider.v1.models.pricing.estimate.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/models/pricing/estimate");
    });

    it("v1.models.requests.payloads.payloadSchema has method DELETE and path contains payloads", () => {
      const schema = provider.v1.models.requests.payloads.payloadSchema;
      expect(schema.method).toBe("DELETE");
      expect(schema.path).toContain("payloads");
    });

    it("v1.models.pricing.estimate.validatePayload accepts valid estimate request", () => {
      const result = provider.v1.models.pricing.estimate.validatePayload({
        estimate_type: "unit_price",
        endpoints: {},
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("v1.models.pricing.estimate.validatePayload rejects empty object", () => {
      const result = provider.v1.models.pricing.estimate.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.join(" ")).toContain("estimate_type");
      expect(result.errors.join(" ")).toContain("endpoints");
    });
  });

  describe("real factory", () => {
    it("should list models with correct URL and auth header", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ models: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
      const provider = fal({ apiKey: "test-key-123", fetch: mockFetch });
      const result = await provider.v1.models();

      expect(result.models).toEqual([]);
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.fal.ai/v1/models");
      expect(init.method).toBe("GET");
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Key test-key-123"
      );
    });

    it("should pass query params for models search", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ models: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.models({ q: "flux", limit: 5 });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("q=flux");
      expect(url).toContain("limit=5");
    });

    it("should fetch pricing with endpoint_id query param", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            prices: [
              {
                endpoint_id: "fal-ai/flux/dev",
                unit_price: 0.025,
                unit: "image",
                currency: "USD",
              },
            ],
            next_cursor: null,
            has_more: false,
          }),
          { status: 200 }
        )
      );
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.models.pricing({
        endpoint_id: "fal-ai/flux/dev",
      });

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0].unit_price).toBe(0.025);
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/models/pricing");
      expect(url).toContain("endpoint_id=fal-ai");
    });

    it("should POST pricing estimate with JSON body", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            estimate_type: "unit_price",
            total_cost: 1.25,
            currency: "USD",
          }),
          { status: 200 }
        )
      );
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.models.pricing.estimate({
        estimate_type: "unit_price",
        endpoints: { "fal-ai/flux/dev": { unit_quantity: 50 } },
      });

      expect(result.total_cost).toBe(1.25);
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.fal.ai/v1/models/pricing/estimate");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.estimate_type).toBe("unit_price");
    });

    it("should fetch usage data", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            next_cursor: null,
            has_more: false,
            time_series: [],
          }),
          { status: 200 }
        )
      );
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });
      const result = await provider.v1.models.usage({
        endpoint_id: "fal-ai/flux/dev",
        start: "2025-01-01",
      });

      expect(result.has_more).toBe(false);
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/models/usage");
      expect(url).toContain("endpoint_id=fal-ai");
    });

    it("should fetch analytics data", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            next_cursor: null,
            has_more: false,
            time_series: [],
          }),
          { status: 200 }
        )
      );
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.models.analytics({
        endpoint_id: "fal-ai/flux/dev",
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/models/analytics");
    });

    it("should fetch requests by endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ next_cursor: null, has_more: false, items: [] }),
          { status: 200 }
        )
      );
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.models.requests.byEndpoint({
        endpoint_id: "fal-ai/flux/dev",
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/models/requests/by-endpoint");
      expect(url).toContain("endpoint_id=fal-ai");
    });

    it("should DELETE payloads with correct URL and idempotency header", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ cdn_delete_results: [] }),
          { status: 200 }
        )
      );
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });
      await provider.v1.models.requests.payloads({
        request_id: "req-123",
        idempotency_key: "idem-abc",
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        "https://api.fal.ai/v1/models/requests/req-123/payloads"
      );
      expect(init.method).toBe("DELETE");
      expect(
        (init.headers as Record<string, string>)["Idempotency-Key"]
      ).toBe("idem-abc");
    });

    it("should use custom baseURL", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ models: [], next_cursor: null, has_more: false }),
          { status: 200 }
        )
      );
      const provider = fal({
        apiKey: "test-key",
        baseURL: "https://custom.fal.ai/v1",
        fetch: mockFetch,
      });
      await provider.v1.models();

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://custom.fal.ai/v1/models");
    });
  });

  describe("error handling (real factory)", () => {
    it("should throw FalError with parsed error on API error", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              type: "authentication_error",
              message: "Invalid API key",
              request_id: "req-xyz",
            },
          }),
          { status: 401 }
        )
      );
      const provider = fal({ apiKey: "bad-key", fetch: mockFetch });

      try {
        await provider.v1.models();
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(FalError);
        expect((err as FalError).status).toBe(401);
        expect((err as FalError).message).toContain("Invalid API key");
        expect((err as FalError).type).toBe("authentication_error");
        expect((err as FalError).request_id).toBe("req-xyz");
      }
    });

    it("should throw FalError with generic message on non-structured error", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response("Internal Server Error", { status: 500 })
      );
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });

      try {
        await provider.v1.models();
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(FalError);
        expect((err as FalError).status).toBe(500);
        expect((err as FalError).type).toBe("server_error");
      }
    });

    it("should throw FalError on network failure", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed"));
      const provider = fal({ apiKey: "test-key", fetch: mockFetch });

      try {
        await provider.v1.models();
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(FalError);
        expect((err as FalError).message).toContain("Fal request failed");
      }
    });
  });
});
