// Tests for the fal provider
import { describe, it, expect, vi } from "vitest";

describe("fal provider", () => {
  interface FalModel {
    endpointId: string;
    metadata?: {
      displayName: string;
      category: string;
      description: string;
      status: "active" | "deprecated";
      tags: string[];
      updatedAt: string;
      isFavorited: boolean | null;
      thumbnailUrl: string;
      modelUrl: string;
      date: string;
      highlighted: boolean;
      pinned: boolean;
    };
  }

  interface FalModelSearchResponse {
    models: FalModel[];
    nextCursor: string | null;
    hasMore: boolean;
  }

  interface FalPricingResponse {
    prices: Array<{
      endpointId: string;
      unitPrice: number;
      unit: string;
      currency: string;
    }>;
    nextCursor: string | null;
    hasMore: boolean;
  }

  interface FalEstimateResponse {
    estimateType: "historical_api_price" | "unit_price";
    totalCost: number;
    currency: string;
  }

  interface FalUsageResponse {
    nextCursor: string | null;
    hasMore: boolean;
    timeSeries?: Array<{
      bucket: string;
      results: Array<{
        endpointId: string;
        unit: string;
        quantity: number;
        unitPrice: number;
        cost: number;
        currency: string;
      }>;
    }>;
  }

  interface FalAnalyticsResponse {
    nextCursor: string | null;
    hasMore: boolean;
    timeSeries?: Array<{
      bucket: string;
      results: Array<{
        endpointId: string;
        requestCount?: number;
        successCount?: number;
      }>;
    }>;
  }

  interface FalRequestsResponse {
    nextCursor: string | null;
    hasMore: boolean;
    items: Array<{
      requestId: string;
      endpointId: string;
      startedAt: string;
      sentAt: string;
      endedAt?: string;
      statusCode?: number;
      duration?: number;
    }>;
  }

  interface FalDeletePayloadsResponse {
    cdnDeleteResults: Array<{
      link: string;
      exception: string | null;
    }>;
  }

  interface FalModelsCallable {
    (params?: unknown, signal?: AbortSignal): Promise<FalModelSearchResponse>;
    pricing: FalPricingCallable;
    usage(params?: unknown, signal?: AbortSignal): Promise<FalUsageResponse>;
    analytics(
      params: { endpointId: string | string[] },
      signal?: AbortSignal
    ): Promise<FalAnalyticsResponse>;
    requests: {
      byEndpoint(
        params: {
          endpointId: string;
          status?: "success" | "error" | "user_error";
        },
        signal?: AbortSignal
      ): Promise<FalRequestsResponse>;
      payloads(
        params: { requestId: string; idempotencyKey?: string },
        signal?: AbortSignal
      ): Promise<FalDeletePayloadsResponse>;
    };
  }

  interface FalPricingCallable {
    (
      params: { endpointId: string | string[] },
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
            endpointId: "fal-ai/flux/dev",
            unitPrice: 0.025,
            unit: "image",
            currency: "USD",
          },
        ],
        nextCursor: null,
        hasMore: false,
      }),
      {
        estimate: vi.fn().mockResolvedValue({
          estimateType: "unit_price",
          totalCost: 1.25,
          currency: "USD",
        }),
      }
    );
    const models = Object.assign(
      vi.fn().mockResolvedValue({
        models: [
          {
            endpointId: "fal-ai/flux/dev",
            metadata: {
              displayName: "FLUX.1 [dev]",
              category: "text-to-image",
              description: "Fast text-to-image generation",
              status: "active",
              tags: ["fast", "pro"],
              updatedAt: "2025-01-15T12:00:00Z",
              isFavorited: false,
              thumbnailUrl: "https://fal.media/files/example.jpg",
              modelUrl: "https://fal.run/fal-ai/flux/dev",
              date: "2024-08-01T00:00:00Z",
              highlighted: true,
              pinned: false,
            },
          },
        ],
        nextCursor: null,
        hasMore: false,
      }),
      {
        pricing,
        usage: vi.fn().mockResolvedValue({
          nextCursor: null,
          hasMore: false,
          timeSeries: [
            {
              bucket: "2025-01-15T00:00:00-05:00",
              results: [
                {
                  endpointId: "fal-ai/flux/dev",
                  unit: "image",
                  quantity: 4,
                  unitPrice: 0.1,
                  cost: 0.4,
                  currency: "USD",
                },
              ],
            },
          ],
        }),
        analytics: vi.fn().mockResolvedValue({
          nextCursor: null,
          hasMore: false,
          timeSeries: [
            {
              bucket: "2025-01-15T12:00:00-05:00",
              results: [
                {
                  endpointId: "fal-ai/flux/dev",
                  requestCount: 1500,
                  successCount: 1450,
                },
              ],
            },
          ],
        }),
        requests: {
          byEndpoint: vi.fn().mockResolvedValue({
            nextCursor: "Mg==",
            hasMore: true,
            items: [
              {
                requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                endpointId: "fal-ai/flux/dev",
                startedAt: "2025-01-01T00:00:05Z",
                sentAt: "2025-01-01T00:00:01Z",
                endedAt: "2025-01-01T00:00:08Z",
                statusCode: 200,
                duration: 7.8,
              },
            ],
          }),
          payloads: vi.fn().mockResolvedValue({
            cdnDeleteResults: [
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
      expect(result.models[0].endpointId).toBe("fal-ai/flux/dev");
      expect(result.models[0].metadata?.displayName).toBe("FLUX.1 [dev]");
      expect(result.hasMore).toBe(false);
    });

    it("should support pagination", async () => {
      const provider = createMockProvider();
      await provider.v1.models({ limit: 10 });

      expect(provider.v1.models).toHaveBeenCalledWith({ limit: 10 });
    });

    it("should support searching by endpoint ID", async () => {
      const provider = createMockProvider();
      await provider.v1.models({ endpointId: "fal-ai/flux/dev" });

      expect(provider.v1.models).toHaveBeenCalledWith({
        endpointId: "fal-ai/flux/dev",
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
        endpointId: "fal-ai/flux/dev",
      });

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0].unitPrice).toBe(0.025);
      expect(result.prices[0].unit).toBe("image");
      expect(result.prices[0].currency).toBe("USD");
    });

    it("should support multiple endpoint IDs", async () => {
      const provider = createMockProvider();
      await provider.v1.models.pricing({
        endpointId: ["fal-ai/flux/dev", "fal-ai/flux/schnell"],
      });

      expect(provider.v1.models.pricing).toHaveBeenCalledWith({
        endpointId: ["fal-ai/flux/dev", "fal-ai/flux/schnell"],
      });
    });
  });

  describe("estimateCost", () => {
    it("should estimate cost using unit price", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.pricing.estimate({
        estimateType: "unit_price",
        endpoints: {
          "fal-ai/flux/dev": { unitQuantity: 50 },
        },
      });

      expect(result.estimateType).toBe("unit_price");
      expect(result.totalCost).toBe(1.25);
      expect(result.currency).toBe("USD");
    });

    it("should estimate cost using historical API price", async () => {
      const provider = createMockProvider();
      (
        provider.v1.models.pricing.estimate as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        estimateType: "historical_api_price",
        totalCost: 3.75,
        currency: "USD",
      });

      const result = await provider.v1.models.pricing.estimate({
        estimateType: "historical_api_price",
        endpoints: {
          "fal-ai/flux/dev": { callQuantity: 100 },
        },
      });

      expect(result.estimateType).toBe("historical_api_price");
    });
  });

  describe("usage", () => {
    it("should return usage data", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.usage();

      expect(result.timeSeries).toBeDefined();
      expect(result.timeSeries?.[0].results[0].quantity).toBe(4);
      expect(result.timeSeries?.[0].results[0].cost).toBe(0.4);
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
      await provider.v1.models.usage({ endpointId: "fal-ai/flux/dev" });

      expect(provider.v1.models.usage).toHaveBeenCalledWith({
        endpointId: "fal-ai/flux/dev",
      });
    });
  });

  describe("analytics", () => {
    it("should return analytics data", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.analytics({
        endpointId: "fal-ai/flux/dev",
      });

      expect(result.timeSeries).toBeDefined();
      expect(result.timeSeries?.[0].results[0].requestCount).toBe(1500);
      expect(result.timeSeries?.[0].results[0].successCount).toBe(1450);
    });

    it("should require endpoint ID", async () => {
      const provider = createMockProvider();
      await provider.v1.models.analytics({ endpointId: "fal-ai/flux/dev" });

      expect(provider.v1.models.analytics).toHaveBeenCalledWith({
        endpointId: "fal-ai/flux/dev",
      });
    });
  });

  describe("requests", () => {
    it("should return request history", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.requests.byEndpoint({
        endpointId: "fal-ai/flux/dev",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].requestId).toBe(
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      );
      expect(result.hasMore).toBe(true);
    });

    it("should support status filtering", async () => {
      const provider = createMockProvider();
      await provider.v1.models.requests.byEndpoint({
        endpointId: "fal-ai/flux/dev",
        status: "success",
      });

      expect(provider.v1.models.requests.byEndpoint).toHaveBeenCalledWith({
        endpointId: "fal-ai/flux/dev",
        status: "success",
      });
    });
  });

  describe("deletePayloads", () => {
    it("should delete request payloads", async () => {
      const provider = createMockProvider();
      const result = await provider.v1.models.requests.payloads({
        requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      });

      expect(result.cdnDeleteResults).toHaveLength(1);
      expect(result.cdnDeleteResults[0].exception).toBeNull();
    });

    it("should support idempotency key", async () => {
      const provider = createMockProvider();
      await provider.v1.models.requests.payloads({
        requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        idempotencyKey: "unique-key-123",
      });

      expect(provider.v1.models.requests.payloads).toHaveBeenCalledWith({
        requestId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        idempotencyKey: "unique-key-123",
      });
    });
  });
});
