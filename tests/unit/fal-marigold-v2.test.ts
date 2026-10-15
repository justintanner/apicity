import fs from "node:fs";
import path from "node:path";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMarigoldV2ParsedRequest,
  type FalMarigoldV2Request,
  type FalMarigoldV2RequestInput,
  type FalMarigoldV2Response,
  type FalRunNamespace,
} from "@apicity/fal";
import {
  FalMarigoldV2RequestSchema as schema,
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
// (sha256 f29dd92e601effe057892d51be46ec5c097c84cd5060b6f6454ed7f447a1108c).
const endpoint = "fal-ai/marigold-v2";
// The recorded call: our own tests/fixtures/beach.png as a data URL. The
// endpoint has no prompt field.
const recorded = {
  image_url: `data:image/png;base64,${fs
    .readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "beach.png")
    )
    .toString("base64")}`,
  prediction_type: "depth",
} satisfies FalMarigoldV2Request;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Marigold V2 contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.marigoldV2;
    expect(leaf).toBe(provider.post.run.marigoldV2);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.marigoldV2).toEqualTypeOf<
      FalRunNamespace["marigoldV2"]
    >();
    expectTypeOf(provider.run.marigoldV2)
      .parameter(0)
      .toEqualTypeOf<FalMarigoldV2Request>();
    expectTypeOf(
      provider.run.marigoldV2
    ).returns.resolves.toEqualTypeOf<FalMarigoldV2Response>();
    expectTypeOf<FalMarigoldV2Request>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMarigoldV2RequestInput>().toEqualTypeOf<FalMarigoldV2Request>();
    expectTypeOf<FalMarigoldV2ParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMarigoldV2Response>().toEqualTypeOf<{
      image: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      };
      seed: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        image: { url: "https://example.com/depth.png" },
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.marigoldV2(recorded);
    expect(result.image.url).toBe("https://example.com/depth.png");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/fal-ai/marigold-v2");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only image_url and fills only documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prediction_type",
      "image_url",
      "image_size",
      "seed",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ image_url: "https://example.com/in.png" })).toEqual({
      prediction_type: "depth",
      image_url: "https://example.com/in.png",
      enable_safety_checker: true,
    });
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["image_url"],
    ]);
    // fal's validator answered 422 for an object image_url (2026-10-15).
    expect(accepts({ image_url: {} })).toBe(false);
    expect(accepts({ image_url: null })).toBe(false);
    expect(accepts({ unknown_field: true })).toBe(true);
  });

  it.each(["depth", "see-through-depth", "normals", "albedo"])(
    "accepts prediction_type %s",
    (predictionType) => {
      expect(accepts({ prediction_type: predictionType })).toBe(true);
    }
  );

  it("refuses any other prediction_type", () => {
    // The value fal's validator refused with a 422 on 2026-10-15.
    expect(accepts({ prediction_type: "not-a-prediction-type" })).toBe(false);
    expect(accepts({ prediction_type: null })).toBe(false);
  });

  it.each([
    "square_hd",
    "square",
    "portrait_4_3",
    "portrait_16_9",
    "landscape_4_3",
    "landscape_16_9",
  ])("accepts the image_size preset %s", (preset) => {
    expect(accepts({ image_size: preset })).toBe(true);
  });

  it("accepts null, an omitted size and explicit sizes inside fal's rules", () => {
    expect(accepts({ image_size: null })).toBe(true);
    expect(schema.parse(recorded).image_size).toBeUndefined();
    expect(schema.parse({ ...recorded, image_size: {} }).image_size).toEqual({
      width: 512,
      height: 512,
    });
    for (const size of [
      { width: 16, height: 16 },
      { width: 1664, height: 944 },
      { width: 2048, height: 2048 },
      { width: 1024, height: 64 },
      { width: 64, height: 1024 },
    ]) {
      expect(accepts({ image_size: size }), JSON.stringify(size)).toBe(true);
    }
  });

  it("refuses the explicit sizes fal's validator refuses", () => {
    // Each answered 422 on 2026-10-15: 1000x1000 (not a multiple of 16),
    // 4096x4096 (over 2048), 16x512 (aspect ratio 1:32), 0x512 (not
    // positive) and the unknown preset square_xl.
    for (const size of [
      { width: 1000, height: 1000 },
      { width: 4096, height: 4096 },
      { width: 16, height: 512 },
      { width: 0, height: 512 },
      "square_xl",
    ]) {
      expect(accepts({ image_size: size }), JSON.stringify(size)).toBe(false);
    }
    for (const size of [
      { width: 512, height: 1000 },
      { width: 512, height: 2064 },
      { width: 1040, height: 64 },
      { width: 512.5, height: 512 },
      { width: "512", height: 512 },
    ]) {
      expect(accepts({ image_size: size }), JSON.stringify(size)).toBe(false);
    }
  });

  it("takes an optional nullable integer seed", () => {
    expect(accepts({ seed: null })).toBe(true);
    expect(accepts({ seed: 42 })).toBe(true);
    expect(accepts({ seed: 1.5 })).toBe(false);
    expect(accepts({ seed: "42" })).toBe(false);
  });

  it("takes a boolean enable_safety_checker", () => {
    expect(accepts({ enable_safety_checker: false })).toBe(true);
    expect(accepts({ enable_safety_checker: "false" })).toBe(false);
    expect(accepts({ enable_safety_checker: null })).toBe(false);
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

  it("charges the same for any output size", () => {
    // The card: the output size does not change the price.
    for (const size of ["square_hd", { width: 2048, height: 2048 }]) {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, image_size: size },
      });
      expect(estimate.usd).toBeCloseTo(0.03, 10);
    }
  });

  it("is statically priced, with a slug and a display name", () => {
    const dynamic: readonly string[] = FAL_DYNAMIC_PRICING_ENDPOINTS;
    expect(dynamic).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/fal-ai/marigold-v2",
      asOf: "2026-10-15",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "marigold2"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Marigold V2"
    );
  });
});
