import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKandinsky6LiteImageToVideoParsedRequest,
  type FalKandinsky6LiteImageToVideoRequest,
  type FalKandinsky6LiteImageToVideoRequestInput,
  type FalKandinsky6LiteImageToVideoResponse,
  type FalRunKandinsky6LiteNamespace,
} from "@apicity/fal";
import {
  FalKandinsky6LiteImageToVideoRequestSchema as schema,
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
// (sha256 019f1e67574cd43527d8f7e5e8dacb29e136dee4a8bdba5770c13a1f8bfe6efa)
// and the free 422 probes of the same day.
const endpoint = "fal-ai/kandinsky6-lite/image-to-video";
// The recorded call. The integration test sends tests/fixtures/cat1.jpg as a
// data URL; a short URL stands in here. The prompt is reused with that
// fixture from tests/integration/fal-wan3p0-image-to-video.test.ts.
const recorded = {
  prompt: "the cat blinks",
  image_url: "https://example.com/cat1.jpg",
  num_inference_steps: 4,
} satisfies FalKandinsky6LiteImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Kandinsky 6.0 Lite image-to-video contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.kandinsky6Lite.imageToVideo;
    expect(typeof leaf).toBe("function");
    expect(leaf).toBe(provider.post.run.kandinsky6Lite.imageToVideo);
    expect(provider.run.kandinsky6Lite).toHaveProperty("imageToVideo", leaf);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunKandinsky6LiteNamespace["imageToVideo"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKandinsky6LiteImageToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKandinsky6LiteImageToVideoResponse>();
    expectTypeOf<FalKandinsky6LiteImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKandinsky6LiteImageToVideoRequestInput>().toEqualTypeOf<FalKandinsky6LiteImageToVideoRequest>();
    expectTypeOf<FalKandinsky6LiteImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKandinsky6LiteImageToVideoResponse>().toEqualTypeOf<{
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
        video: { url: "https://example.com/cat.mp4" },
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.kandinsky6Lite.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/cat.mp4");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/kandinsky6-lite/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires prompt and image_url and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_url",
      "aspect_ratio",
      "generate_audio",
      "enable_prompt_expansion",
      "upscale_factor",
      "seed",
      "sync_mode",
      "num_inference_steps",
      "enable_safety_checker",
    ]);
    expect(
      schema.parse({ prompt: recorded.prompt, image_url: recorded.image_url })
    ).toEqual({
      prompt: recorded.prompt,
      image_url: recorded.image_url,
      aspect_ratio: "auto",
      generate_audio: true,
      enable_prompt_expansion: false,
      sync_mode: false,
      num_inference_steps: 10,
      enable_safety_checker: true,
    });
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["prompt"],
      ["image_url"],
    ]);
    // The validator took an empty prompt and an empty image_url, and ignored
    // an undocumented field, so the schema sets no minimum and is not strict.
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ image_url: "" })).toBe(true);
    expect(accepts({ unknown_field: true })).toBe(true);
    for (const value of [null, 1, {}]) {
      expect(accepts({ prompt: value })).toBe(false);
      expect(accepts({ image_url: value })).toBe(false);
    }
  });

  it("takes the five documented aspect ratios or auto", () => {
    for (const ratio of ["16:9", "9:16", "1:1", "4:3", "3:4", "auto"])
      expect(accepts({ aspect_ratio: ratio })).toBe(true);
    for (const ratio of ["21:9", "Auto", "16x9", null])
      expect(accepts({ aspect_ratio: ratio })).toBe(false);
  });

  it("takes the documented upscale factors or null, with no default", () => {
    for (const factor of [2, 2.25, 4, null])
      expect(accepts({ upscale_factor: factor })).toBe(true);
    expect(schema.parse(recorded).upscale_factor).toBeUndefined();
    for (const factor of [3, 1, 2.5, "2"])
      expect(accepts({ upscale_factor: factor })).toBe(false);
  });

  it("bounds num_inference_steps at four to sixteen whole steps", () => {
    for (const steps of [4, 10, 16])
      expect(accepts({ num_inference_steps: steps })).toBe(true);
    for (const steps of [3, 17, 4.5, "4", null])
      expect(accepts({ num_inference_steps: steps })).toBe(false);
  });

  it("takes an integer or null seed", () => {
    for (const seed of [0, 42, null]) expect(accepts({ seed })).toBe(true);
    expect(schema.parse(recorded).seed).toBeUndefined();
    for (const seed of [1.5, "42", {}]) expect(accepts({ seed })).toBe(false);
  });

  it.each([
    "generate_audio",
    "enable_prompt_expansion",
    "sync_mode",
    "enable_safety_checker",
  ])("takes %s as a boolean", (field) => {
    for (const value of [true, false])
      expect(accepts({ [field]: value })).toBe(true);
    for (const value of ["true", 1, null, {}])
      expect(accepts({ [field]: value })).toBe(false);
  });

  it("keeps billing dynamic because the recorded units miss the card", () => {
    // The card prices four steps at $0.085, half its $0.17 unit, but the
    // recorded four-step call billed 0.5011 units ($0.085187) and the usage
    // API agrees, as the text-to-video sibling did at $0.16.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Kandinsky 6.0 Lite"
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
