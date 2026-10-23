import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenV3FillerWordRemovalParsedRequest,
  type FalHeygenV3FillerWordRemovalRequest,
  type FalHeygenV3FillerWordRemovalRequestInput,
  type FalHeygenV3FillerWordRemovalResponse,
  type FalRunHeygenV3Namespace,
} from "@apicity/fal";
import {
  FalHeygenV3FillerWordRemovalRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  falDynamicBilledUnit,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-23
// (sha256 a3b40b064d5e1220d58a17af556cb5f99b1330cdf10b42d97d45ff99c94f8e1c).
const endpoint = "fal-ai/heygen/v3/filler-word-removal";
const recorded = {
  video_url: "https://example.com/avatar.mp4",
} satisfies FalHeygenV3FillerWordRemovalRequest;

describe("HeyGen Filler Word Removal contract", () => {
  it("adds fillerWordRemoval to the v3 object, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.v3.fillerWordRemoval;
    expect(provider.run.heygen.v3).toHaveProperty("fillerWordRemoval", leaf);
    expect(provider.run.heygen.v3).toHaveProperty("lipsync");
    expect(leaf).toBe(provider.post.run.heygen.v3.fillerWordRemoval);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.v3
    ).toEqualTypeOf<FalRunHeygenV3Namespace>();
    expectTypeOf<FalHeygenV3FillerWordRemovalRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenV3FillerWordRemovalRequestInput>().toEqualTypeOf<FalHeygenV3FillerWordRemovalRequest>();
    expectTypeOf<FalHeygenV3FillerWordRemovalParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenV3FillerWordRemovalResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      original_duration: number;
      output_duration: number;
      num_cuts: number;
      reduction_pct: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          video: { url: "https://example.com/out.mp4" },
          original_duration: 3,
          output_duration: 3,
          num_cuts: 0,
          reduction_pct: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.heygen.v3.fillerWordRemoval(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/heygen/v3/filler-word-removal"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(Object.keys(schema.shape)).toEqual(["video_url", "title"]);
    expect(schema.safeParse({}).success).toBe(false);
    expect(
      schema.safeParse({ ...recorded, title: "t".repeat(255) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...recorded, title: "t".repeat(256) }).success
    ).toBe(false);
    expect(schema.safeParse({ ...recorded, title: null }).success).toBe(true);
    expect(schema.safeParse({ ...recorded, title: "" }).success).toBe(true);
    expect(schema.safeParse({ video_url: "" }).success).toBe(true);
    expect(schema.safeParse({ ...recorded, foo: 1 }).success).toBe(true);
  });

  it("is dynamically priced: the input video's length sets the charge", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Filler Word Removal"
    );
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe(
      "seconds of input video at $0.01, with a 60-second minimum"
    );
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("pricing/estimate");
  });
});
