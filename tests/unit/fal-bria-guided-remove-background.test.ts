import fs from "node:fs";
import path from "node:path";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBriaGuidedRemoveBackgroundParsedRequest,
  type FalBriaGuidedRemoveBackgroundRequest,
  type FalBriaGuidedRemoveBackgroundRequestInput,
  type FalBriaGuidedRemoveBackgroundResponse,
  type FalRunBriaNamespace,
} from "@apicity/fal";
import {
  FalBriaGuidedRemoveBackgroundRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-15
// (sha256 353903ec2cbb67e9e3dac7c1f98d674c803b1d1d728878685a63dcf0974bf16a).
const endpoint = "bria/guided-remove-background";
// The recorded call: our own tests/fixtures/cat2.jpg as a data URL,
// with the prompt reused from fal-bytedance-seedream-v5-pro-layerize.
const recorded = {
  image_url: `data:image/jpeg;base64,${fs
    .readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat2.jpg")
    )
    .toString("base64")}`,
  prompt: "separate the cat from the background",
} satisfies FalBriaGuidedRemoveBackgroundRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Bria Guided Remove Background contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bria.guidedRemoveBackground;
    expect(leaf).toBe(provider.post.run.bria.guidedRemoveBackground);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.bria).toEqualTypeOf<FalRunBriaNamespace>();
    expectTypeOf<FalBriaGuidedRemoveBackgroundRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBriaGuidedRemoveBackgroundRequestInput>().toEqualTypeOf<FalBriaGuidedRemoveBackgroundRequest>();
    expectTypeOf<FalBriaGuidedRemoveBackgroundParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalBriaGuidedRemoveBackgroundResponse>().toEqualTypeOf<{
      image: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      };
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        image: { url: "https://example.com/out.png" },
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.bria.guidedRemoveBackground(recorded);
    expect(result.image.url).toBe("https://example.com/out.png");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/bria/guided-remove-background");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("has no required fields and fills only documented defaults", () => {
    expect(schema.parse({})).toEqual({
      image_url:
        "https://labs-assets.bria.ai/api-examples/guided-remove-background/yoga_studio_input.jpg",
      autocrop: false,
      sync_mode: false,
    });
    expect(Object.keys(schema.shape)).toEqual([
      "image_url",
      "prompt",
      "autocrop",
      "sync_mode",
    ]);
    expect(schema.parse(recorded).prompt).toBe(recorded.prompt);
  });

  it("accepts optional nullable prompt and unbounded strings", () => {
    expect(accepts({ prompt: null })).toBe(true);
    expect(accepts({ prompt: "", image_url: "" })).toBe(true);
    expect(accepts({ prompt: 1 })).toBe(false);
    expect(accepts({ image_url: null })).toBe(false);
    expect(accepts({ image_url: {} })).toBe(false);
    expect(accepts({ unknown_field: true })).toBe(true);
  });

  it.each(["autocrop", "sync_mode"])("accepts only boolean %s", (field) => {
    expect(accepts({ [field]: true })).toBe(true);
    expect(accepts({ [field]: false })).toBe(true);
    for (const invalid of [null, "true", 1, {}]) {
      expect(accepts({ [field]: invalid })).toBe(false);
    }
  });

  it("prices the recorded payload from the card", () => {
    // The recorded call billed x-fal-billable-units 1 at $0.03 per image.
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.03, 10);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/bria/guided-remove-background",
      asOf: "2026-10-15",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "briagrb"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Bria Guided Remove Background"
    );
  });
});
