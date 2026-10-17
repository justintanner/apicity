import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalNanoBanana2p1EditParsedRequest,
  type FalNanoBanana2p1EditRequest,
  type FalNanoBanana2p1EditRequestInput,
  type FalNanoBanana2p1EditResponse,
  type FalRunNamespace,
  type FalRunNanoBanana2p1Namespace,
} from "@apicity/fal";
import {
  FalNanoBanana2p1EditRequestSchema as schema,
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
// (sha256 05484a53bb030d157a1f2afd93122309b94d686760de0cdb76359562a9a1c462).
const endpoint = "google/nano-banana-2.1/edit";
// Payload shape recorded with cat1.jpg. Prompt reused from
// tests/integration/fal-alibaba-qwen-image-3-edit.test.ts.
const recorded = {
  prompt: "Give the cat in image 1 a small red knitted scarf.",
  image_urls: ["https://example.com/cat.jpg"],
  resolution: "1K",
  thinking_level: "minimal",
} satisfies FalNanoBanana2p1EditRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Nano Banana 2.1 edit contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.nanoBanana2p1.edit;
    expect(leaf).toBe(provider.post.run.nanoBanana2p1.edit);
    expect(Object.keys(provider.run.nanoBanana2p1)).toEqual([
      "edit",
      "textToImage",
    ]);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<
      FalRunNamespace["nanoBanana2p1"]
    >().toEqualTypeOf<FalRunNanoBanana2p1Namespace>();
    expectTypeOf(leaf).toEqualTypeOf<FalRunNanoBanana2p1Namespace["edit"]>();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalNanoBanana2p1EditRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalNanoBanana2p1EditResponse>();
    expectTypeOf<FalNanoBanana2p1EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalNanoBanana2p1EditRequestInput>().toEqualTypeOf<FalNanoBanana2p1EditRequest>();
    expectTypeOf<FalNanoBanana2p1EditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalNanoBanana2p1EditResponse>().toEqualTypeOf<{
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
    const result = await provider.run.nanoBanana2p1.edit(recorded);
    expect(result.images[0].url).toBe("https://example.com/panda.png");
    expect(result.description).toBe("");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/google/nano-banana-2.1/edit");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires prompt and input media and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "num_images",
      "seed",
      "aspect_ratio",
      "output_format",
      "safety_tolerance",
      "sync_mode",
      "image_urls",
      "system_prompt",
      "resolution",
      "video_url",
      "pdf_url",
      "limit_generations",
      "enable_web_search",
      "thinking_level",
    ]);
    expect(
      schema.parse({ prompt: recorded.prompt, image_urls: recorded.image_urls })
    ).toEqual({
      prompt: recorded.prompt,
      image_urls: recorded.image_urls,
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
    // The free probe returned 422 for an object prompt. OpenAPI does not
    // set additionalProperties=false, so the schema allows unknown fields.
    expect(accepts({ prompt: {} })).toBe(false);
    expect(accepts({ prompt: null })).toBe(false);
    expect(accepts({ unknown_field: true })).toBe(true);
  });

  it("bounds prompt at three to fifty thousand characters", () => {
    for (const prompt of ["abc", "a".repeat(50000)])
      expect(accepts({ prompt })).toBe(true);
    for (const prompt of ["", "ab", "a".repeat(50001)])
      expect(accepts({ prompt })).toBe(false);
  });

  it("bounds num_images at one to four whole images", () => {
    for (const count of [1, 2, 3, 4])
      expect(accepts({ num_images: count })).toBe(true);
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
    // Preserve the documented string enum.
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

  it("requires one media source and supports video or PDF alternatives", () => {
    expect(schema.safeParse({ prompt: recorded.prompt }).success).toBe(false);
    expect(accepts({ image_urls: [] })).toBe(false);
    for (const field of ["video_url", "pdf_url"]) {
      expect(
        accepts({ image_urls: undefined, [field]: "https://example.com/input" })
      ).toBe(true);
      expect(accepts({ [field]: null })).toBe(true);
      expect(accepts({ [field]: 42 })).toBe(false);
      expect(accepts({ image_urls: undefined, [field]: null })).toBe(false);
    }
    expect(accepts({ image_urls: null })).toBe(false);
    expect(accepts({ image_urls: [1] })).toBe(false);
    expect(accepts({ image_urls: "https://example.com/cat.jpg" })).toBe(false);
  });

  it("keeps token billing dynamic", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Nano Banana 2.1 Edit"
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
