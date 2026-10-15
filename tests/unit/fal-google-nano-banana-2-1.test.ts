import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalNanoBanana2p1TextToImageParsedRequest,
  type FalNanoBanana2p1TextToImageRequest,
  type FalNanoBanana2p1TextToImageRequestInput,
  type FalNanoBanana2p1TextToImageResponse,
  type FalRunNamespace,
  type FalRunNanoBanana2p1Namespace,
} from "@apicity/fal";
import {
  FalNanoBanana2p1TextToImageRequestSchema as schema,
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
// (sha256 1c5ec483eb4aa2e6efbd59994755d1afaea973d23cda42c6269f43cd0772253b).
const endpoint = "google/nano-banana-2.1";
// The recorded call. The prompt is the repo's house prompt, reused from
// tests/integration/fal-ideogram-v4-5.test.ts and others.
const recorded = {
  prompt: "A red panda waves once, then holds still.",
  num_images: 1,
  resolution: "1K",
  thinking_level: "minimal",
} satisfies FalNanoBanana2p1TextToImageRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Nano Banana 2.1 text-to-image contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.nanoBanana2p1.textToImage;
    expect(leaf).toBe(provider.post.run.nanoBanana2p1.textToImage);
    expect(Object.keys(provider.run.nanoBanana2p1)).toEqual(["textToImage"]);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<
      FalRunNamespace["nanoBanana2p1"]
    >().toEqualTypeOf<FalRunNanoBanana2p1Namespace>();
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunNanoBanana2p1Namespace["textToImage"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalNanoBanana2p1TextToImageRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalNanoBanana2p1TextToImageResponse>();
    expectTypeOf<FalNanoBanana2p1TextToImageRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalNanoBanana2p1TextToImageRequestInput>().toEqualTypeOf<FalNanoBanana2p1TextToImageRequest>();
    expectTypeOf<FalNanoBanana2p1TextToImageParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalNanoBanana2p1TextToImageResponse>().toEqualTypeOf<{
      images: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      }[];
      description: string;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        images: [{ url: "https://example.com/panda.png", width: 1024 }],
        description: "",
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.nanoBanana2p1.textToImage(recorded);
    expect(result.images[0].url).toBe("https://example.com/panda.png");
    expect(result.description).toBe("");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/google/nano-banana-2.1");
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
      "num_images",
      "seed",
      "aspect_ratio",
      "output_format",
      "safety_tolerance",
      "sync_mode",
      "system_prompt",
      "resolution",
      "limit_generations",
      "enable_web_search",
      "thinking_level",
    ]);
    expect(schema.parse({ prompt: recorded.prompt })).toEqual({
      prompt: recorded.prompt,
      num_images: 1,
      aspect_ratio: "auto",
      output_format: "png",
      safety_tolerance: "4",
      sync_mode: false,
      system_prompt: "",
      resolution: "1K",
      limit_generations: true,
      enable_web_search: false,
      thinking_level: "medium",
    });
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["prompt"],
    ]);
    // fal's validator answered 422 for an object prompt (2026-10-15) and
    // ignored an undocumented field in the same free probe series.
    expect(accepts({ prompt: {} })).toBe(false);
    expect(accepts({ prompt: null })).toBe(false);
    expect(accepts({ unknown_field: true })).toBe(true);
  });

  it("bounds prompt at three to fifty thousand characters", () => {
    for (const prompt of ["abc", "a".repeat(50000)])
      expect(accepts({ prompt })).toBe(true);
    // "ab" is the value fal's validator refused with a 422 on 2026-10-15.
    for (const prompt of ["", "ab", "a".repeat(50001)])
      expect(accepts({ prompt })).toBe(false);
  });

  it("bounds num_images at one to four whole images", () => {
    for (const count of [1, 2, 3, 4])
      expect(accepts({ num_images: count })).toBe(true);
    // 5 is the value fal's validator refused with a 422 on 2026-10-15.
    for (const count of [0, 5, 1.5, "1", null])
      expect(accepts({ num_images: count })).toBe(false);
  });

  it("takes an integer or null seed", () => {
    for (const seed of [0, 42, null]) expect(accepts({ seed })).toBe(true);
    expect(schema.parse(recorded).seed).toBeUndefined();
    for (const seed of [1.5, "42"]) expect(accepts({ seed })).toBe(false);
  });

  it.each([
    "auto",
    "21:9",
    "16:9",
    "3:2",
    "4:3",
    "5:4",
    "1:1",
    "4:5",
    "3:4",
    "2:3",
    "9:16",
    "4:1",
    "1:4",
    "8:1",
    "1:8",
  ])("accepts aspect_ratio %s", (aspectRatio) => {
    expect(accepts({ aspect_ratio: aspectRatio })).toBe(true);
  });

  it("keeps an explicit null aspect_ratio and refuses other ratios", () => {
    expect(schema.parse({ ...recorded, aspect_ratio: null }).aspect_ratio).toBe(
      null
    );
    for (const ratio of ["7:3", "1:2", "", 1])
      expect(accepts({ aspect_ratio: ratio })).toBe(false);
  });

  it("accepts only the documented output formats", () => {
    for (const format of ["jpeg", "png", "webp"])
      expect(accepts({ output_format: format })).toBe(true);
    // gif is the value fal's validator refused with a 422 on 2026-10-15.
    for (const format of ["gif", "jpg", null])
      expect(accepts({ output_format: format })).toBe(false);
  });

  it("accepts safety_tolerance as the strings 1 to 6", () => {
    for (const level of ["1", "2", "3", "4", "5", "6"])
      expect(accepts({ safety_tolerance: level })).toBe(true);
    // The contract is a string enum. fal's validator also let the number 4
    // through in the free 2026-10-15 probe; the schema keeps the documented
    // string type.
    for (const level of ["0", "7", 4, null])
      expect(accepts({ safety_tolerance: level })).toBe(false);
  });

  it("accepts only the documented resolutions", () => {
    for (const resolution of ["1K", "2K", "4K"])
      expect(accepts({ resolution })).toBe(true);
    // 0.5K is a Nano Banana 2 tier that 2.1 does not document.
    for (const resolution of ["0.5K", "8K", "1k", null])
      expect(accepts({ resolution })).toBe(false);
  });

  it("takes a thinking level or null", () => {
    for (const level of ["minimal", "medium", "high", null])
      expect(accepts({ thinking_level: level })).toBe(true);
    expect(
      schema.parse({ ...recorded, thinking_level: null }).thinking_level
    ).toBe(null);
    for (const level of ["low", "max", ""])
      expect(accepts({ thinking_level: level })).toBe(false);
  });

  it("bounds system_prompt at fifty thousand characters", () => {
    for (const systemPrompt of ["", "Answer briefly.", "a".repeat(50000)])
      expect(accepts({ system_prompt: systemPrompt })).toBe(true);
    for (const systemPrompt of ["a".repeat(50001), null, 1])
      expect(accepts({ system_prompt: systemPrompt })).toBe(false);
  });

  it.each(["sync_mode", "limit_generations", "enable_web_search"])(
    "takes %s as a boolean",
    (field) => {
      for (const value of [true, false])
        expect(accepts({ [field]: value })).toBe(true);
      for (const value of ["true", 1, null])
        expect(accepts({ [field]: value })).toBe(false);
    }
  );

  it("keeps token billing dynamic", () => {
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
