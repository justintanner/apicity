import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKandinsky6LiteTextToVideoParsedRequest,
  type FalKandinsky6LiteTextToVideoRequest,
  type FalKandinsky6LiteTextToVideoRequestInput,
  type FalKandinsky6LiteTextToVideoResponse,
  type FalRunKandinsky6LiteNamespace,
  type FalRunNamespace,
} from "@apicity/fal";
import {
  FalKandinsky6LiteTextToVideoRequestSchema as schema,
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
// (sha256 23af7b5016f2595f9fd2f8f6513608f1a29c2333633dc2f55c397ee516c2caab)
// and the free 422 probes of the same day.
const endpoint = "fal-ai/kandinsky6-lite/text-to-video";
// The recorded call. The prompt is the repo's house prompt, reused from
// tests/integration/fal-ideogram-v4-5.test.ts and others.
const recorded = {
  prompt: "A red panda waves once, then holds still.",
  num_inference_steps: 4,
} satisfies FalKandinsky6LiteTextToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Kandinsky 6.0 Lite text-to-video contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.kandinsky6Lite.textToVideo;
    expect(typeof leaf).toBe("function");
    expect(leaf).toBe(provider.post.run.kandinsky6Lite.textToVideo);
    expect(provider.run.kandinsky6Lite).toHaveProperty("textToVideo", leaf);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<
      FalRunNamespace["kandinsky6Lite"]
    >().toEqualTypeOf<FalRunKandinsky6LiteNamespace>();
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunKandinsky6LiteNamespace["textToVideo"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKandinsky6LiteTextToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKandinsky6LiteTextToVideoResponse>();
    expectTypeOf<FalKandinsky6LiteTextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKandinsky6LiteTextToVideoRequestInput>().toEqualTypeOf<FalKandinsky6LiteTextToVideoRequest>();
    expectTypeOf<FalKandinsky6LiteTextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKandinsky6LiteTextToVideoResponse>().toEqualTypeOf<{
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
        video: { url: "https://example.com/red-panda.mp4" },
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.kandinsky6Lite.textToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/red-panda.mp4");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/kandinsky6-lite/text-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only prompt and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "aspect_ratio",
      "generate_audio",
      "enable_prompt_expansion",
      "upscale_factor",
      "seed",
      "sync_mode",
      "num_inference_steps",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ prompt: recorded.prompt })).toEqual({
      prompt: recorded.prompt,
      aspect_ratio: "16:9",
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
    ]);
    // The validator took an empty and a blank prompt, and ignored an
    // undocumented field, so the schema sets no minimum and is not strict.
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ prompt: "   " })).toBe(true);
    expect(accepts({ unknown_field: true })).toBe(true);
    for (const prompt of [null, 1, {}]) expect(accepts({ prompt })).toBe(false);
  });

  it("takes only the five documented aspect ratios", () => {
    for (const ratio of ["16:9", "9:16", "1:1", "4:3", "3:4"])
      expect(accepts({ aspect_ratio: ratio })).toBe(true);
    for (const ratio of ["21:9", "auto", "16x9", null])
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
    // The card prices four steps at $0.08, half its $0.16 unit, but the
    // recorded four-step call billed 0.5011 units ($0.080176) and the usage
    // API agrees. The listed step counts are examples, not a formula.
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
