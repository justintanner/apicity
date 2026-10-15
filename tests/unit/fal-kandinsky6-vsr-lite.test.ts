import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKandinsky6VsrLiteParsedRequest,
  type FalKandinsky6VsrLiteRequest,
  type FalKandinsky6VsrLiteRequestInput,
  type FalKandinsky6VsrLiteResponse,
  type FalRunKandinsky6VsrNamespace,
  type FalRunNamespace,
} from "@apicity/fal";
import {
  FalKandinsky6VsrLiteRequestSchema as schema,
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
// (sha256 d69d1f713b172756d70ea3902ba1cfed064c48fcf818f5158fda9b8c6e917051)
// with the documented bounds and defaults.
const endpoint = "fal-ai/kandinsky6-vsr/lite";
// The recorded call. The integration test sends tests/fixtures/seedance-ref.mp4
// as a data URL; a short URL stands in here.
const recorded = {
  video_url: "https://example.com/seedance-ref.mp4",
  upscale_factor: 2,
} satisfies FalKandinsky6VsrLiteRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Kandinsky 6.0 VSR Lite contract", () => {
  it("exposes the callable on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.kandinsky6Vsr.lite;
    expect(typeof leaf).toBe("function");
    expect(leaf).toBe(provider.post.run.kandinsky6Vsr.lite);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<
      FalRunNamespace["kandinsky6Vsr"]
    >().toEqualTypeOf<FalRunKandinsky6VsrNamespace>();
    expectTypeOf(leaf).toEqualTypeOf<FalRunKandinsky6VsrNamespace["lite"]>();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKandinsky6VsrLiteRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKandinsky6VsrLiteResponse>();
    expectTypeOf<FalKandinsky6VsrLiteRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKandinsky6VsrLiteRequestInput>().toEqualTypeOf<FalKandinsky6VsrLiteRequest>();
    expectTypeOf<FalKandinsky6VsrLiteParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKandinsky6VsrLiteResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      seed: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/upscaled.mp4" },
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.kandinsky6Vsr.lite(recorded);
    expect(result.video.url).toBe("https://example.com/upscaled.mp4");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/fal-ai/kandinsky6-vsr/lite");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only video_url and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "video_url",
      "upscale_factor",
      "num_inference_steps",
      "seed",
      "sync_mode",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ video_url: recorded.video_url })).toEqual({
      video_url: recorded.video_url,
      upscale_factor: 2.25,
      num_inference_steps: 5,
      sync_mode: false,
      enable_safety_checker: true,
    });
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["video_url"],
    ]);
    expect(accepts({ video_url: "" })).toBe(true);
    expect(accepts({ unknown_field: true })).toBe(true);
    for (const videoUrl of [null, 1, {}])
      expect(accepts({ video_url: videoUrl })).toBe(false);
  });

  it("takes only the documented upscale factors", () => {
    for (const factor of [2, 2.25, 4])
      expect(accepts({ upscale_factor: factor })).toBe(true);
    for (const factor of [3, 1, 2.5, "2", null])
      expect(accepts({ upscale_factor: factor })).toBe(false);
  });

  it("bounds num_inference_steps at two to fifty whole steps", () => {
    for (const steps of [2, 5, 50])
      expect(accepts({ num_inference_steps: steps })).toBe(true);
    for (const steps of [1, 51, 2.5, "5", null])
      expect(accepts({ num_inference_steps: steps })).toBe(false);
  });

  it("takes an integer or null seed", () => {
    for (const seed of [0, 42, null]) expect(accepts({ seed })).toBe(true);
    expect(schema.parse(recorded).seed).toBeUndefined();
    for (const seed of [1.5, "42", {}]) expect(accepts({ seed })).toBe(false);
  });

  it.each(["sync_mode", "enable_safety_checker"])(
    "takes %s as a boolean",
    (field) => {
      for (const value of [true, false])
        expect(accepts({ [field]: value })).toBe(true);
      for (const value of ["true", 1, null, {}])
        expect(accepts({ [field]: value })).toBe(false);
    }
  );

  it("keeps output-size billing dynamic", () => {
    // Billing depends on output pixels and frames, which are not request fields.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect(MODEL_DISPLAY.fal).not.toHaveProperty(endpoint);
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("pricing/estimate");
  });
});
