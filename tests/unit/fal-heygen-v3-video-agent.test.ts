import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenV3VideoAgentParsedRequest,
  type FalHeygenV3VideoAgentRequest,
  type FalHeygenV3VideoAgentRequestInput,
  type FalHeygenV3VideoAgentResponse,
} from "@apicity/fal";
import {
  FalHeygenV3VideoAgentRequestSchema as schema,
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
// (sha256 c4ff495b4c92891649987e740ec38b8ef706aa8fe238c4d508eca84e3dbbd7dd).
const endpoint = "fal-ai/heygen/v3/video-agent";
const recorded = {
  prompt:
    "A five-second clip in which a presenter says: A red panda waves once, then holds still. Keep it under ten seconds.",
  orientation: "landscape",
} satisfies FalHeygenV3VideoAgentRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("HeyGen Video Agent 3 contract", () => {
  it("adds videoAgent to its namespace, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.v3.videoAgent;
    expect(provider.run.heygen.v3).toHaveProperty("videoAgent", leaf);
    expect(provider.run.heygen.v3).toHaveProperty("lipsync");
    expect(leaf).toBe(provider.post.run.heygen.v3.videoAgent);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalHeygenV3VideoAgentRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenV3VideoAgentRequestInput>().toEqualTypeOf<FalHeygenV3VideoAgentRequest>();
    expectTypeOf<FalHeygenV3VideoAgentParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenV3VideoAgentResponse["video"]>().toEqualTypeOf<{
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
    await provider.run.heygen.v3.videoAgent(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/fal-ai/heygen/v3/video-agent");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "avatar",
      "voice",
      "style_id",
      "orientation",
      "file_urls",
      "incognito_mode",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ prompt: "x" })).toEqual({
      prompt: "x",
      avatar: "auto",
      voice: "auto",
      incognito_mode: false,
      enable_safety_checker: true,
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ prompt: "x".repeat(10001) })).toBe(false);
    expect(accepts({ orientation: "square" })).toBe(false);
    expect(accepts({ orientation: null })).toBe(true);
    expect(accepts({ file_urls: Array(20).fill("u") })).toBe(true);
    expect(accepts({ file_urls: Array(21).fill("u") })).toBe(false);
    expect(accepts({ avatar: "Abigail Office Front", voice: "Ivy" })).toBe(
      true
    );
    expect(z.toJSONSchema(schema.shape.avatar).enum).toHaveLength(1287);
    expect(z.toJSONSchema(schema.shape.voice).enum).toHaveLength(103);
    expect(accepts({ style_id: null, file_urls: null })).toBe(true);
    expect(accepts({ file_urls: [1] })).toBe(false);
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ incognito_mode: "maybe" })).toBe(false);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("is dynamically priced: the agent decides the billed output seconds", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Video Agent 3"
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
