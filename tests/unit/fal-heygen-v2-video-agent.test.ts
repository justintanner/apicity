import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenV2VideoAgentParsedRequest,
  type FalHeygenV2VideoAgentRequest,
  type FalHeygenV2VideoAgentRequestInput,
  type FalHeygenV2VideoAgentResponse,
} from "@apicity/fal";
import {
  FalHeygenV2VideoAgentRequestSchema as schema,
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
// (sha256 896571542e77dada6cfd0bcabc34f17f1db6e4b7afdfa75784e8b3a72461bb05).
const endpoint = "fal-ai/heygen/v2/video-agent";
const recorded = {
  prompt:
    "A five-second clip in which a presenter says: A red panda waves once, then holds still.",
  config: { duration: 5 },
} satisfies FalHeygenV2VideoAgentRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("HeyGen Video Agent 2 contract", () => {
  it("adds videoAgent to its namespace, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.v2.videoAgent;
    expect(provider.run.heygen.v2).toHaveProperty("videoAgent", leaf);
    expect(provider.run.heygen.v2).toHaveProperty("translate");
    expect(leaf).toBe(provider.post.run.heygen.v2.videoAgent);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalHeygenV2VideoAgentRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenV2VideoAgentRequestInput>().toEqualTypeOf<FalHeygenV2VideoAgentRequest>();
    expectTypeOf<FalHeygenV2VideoAgentParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenV2VideoAgentResponse["video"]>().toEqualTypeOf<{
      url: string;
      content_type?: string | null;
      file_name?: string | null;
      file_size?: number | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ video: { url: "https://example.com/out.mp4" } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.heygen.v2.videoAgent(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/fal-ai/heygen/v2/video-agent");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "config",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ prompt: "x" })).toEqual({
      prompt: "x",
      enable_safety_checker: true,
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.parse({ prompt: "x", config: {} }).config).toEqual({
      orientation: "portrait",
      avatar: "Adriana SuitSofa Front",
    });
    expect(accepts({ config: { orientation: "square" } })).toBe(false);
    expect(accepts({ config: { duration: 4 } })).toBe(false);
    expect(accepts({ config: { duration: null } })).toBe(true);
    expect(accepts({ config: { duration: 5.5 } })).toBe(false);
    expect(accepts({ config: null })).toBe(false);
    expect(accepts({ config: { foo: 1 } })).toBe(true);
    expect(accepts({ enable_safety_checker: "maybe" })).toBe(false);
    expect(accepts({ config: { avatar: "Abigail Office Front" } })).toBe(true);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("is dynamically priced: the agent decides the billed output seconds", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Video Agent 2"
    );
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe(
      "seconds of output video at $0.034"
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
