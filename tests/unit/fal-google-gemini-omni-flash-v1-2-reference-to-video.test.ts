import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p2ReferenceToVideoParsedRequest,
  type FalGeminiOmniFlashV1p2ReferenceToVideoRequest,
  type FalGeminiOmniFlashV1p2ReferenceToVideoRequestInput,
  type FalGeminiOmniFlashV1p2ReferenceToVideoResponse,
  type FalRunGeminiOmniFlashV1p2Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p2ReferenceToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-11-11 (sha256
// 804f837794efcde3514911f4b6089a42c04003b194f2077262b28da6d1175570, equal to
// the 2026-11-11 survey copy): only `prompt` is required, at most ten
// reference images and three reference videos, and an integer duration from
// 3 to 15 seconds.
const endpoint = "google/gemini-omni-flash/v1.2/reference-to-video";
// The recording sends tests/fixtures/cat1.jpg as a data URL; a short URL
// stands in for it here, since these checks never reach fal.
const recorded = {
  prompt: "The cat in <IMAGE_REF_0> stretches, then sits still.",
  image_urls: ["https://example.com/cat1.jpg"],
  duration: 3,
  resolution: "360p",
  aspect_ratio: "16:9",
} satisfies FalGeminiOmniFlashV1p2ReferenceToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google Gemini Omni Flash 1.2 reference-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p2.referenceToVideo;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p2.referenceToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf on the v1p2 object, beside its edit leaf; the v1.1 twin is
    // separate.
    expect(provider.run.geminiOmniFlash.v1p2.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p1.referenceToVideo).not.toBe(leaf);
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p2
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p2Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p2ReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2ReferenceToVideoRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p2ReferenceToVideoRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p2ReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2ReferenceToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ video: { url: "https://example.com/out.mp4" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.geminiOmniFlash.v1p2.referenceToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.2/reference-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only the prompt and applies the documented defaults", () => {
    expect(schema.parse({ prompt: recorded.prompt })).toStrictEqual({
      prompt: recorded.prompt,
      aspect_ratio: "16:9",
      resolution: "720p",
      duration: 8,
    });
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_urls",
      "reference_video_urls",
      "aspect_ratio",
      "resolution",
      "duration",
    ]);
    expect(schema.shape.image_urls.description).toBe(
      "URLs of up to ten reference images to incorporate."
    );
    expect(schema.shape.reference_video_urls.description).toBe(
      "URLs of up to three reference videos. Each video must be at most 15 seconds long."
    );
  });

  it("caps the prompt at 20,000 characters, with no documented minimum", () => {
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ prompt: "p".repeat(20000) })).toBe(true);
    expect(accepts({ prompt: "p".repeat(20001) })).toBe(false);
  });

  it("holds at most ten reference images and three reference videos", () => {
    const urls = (n: number) =>
      Array.from({ length: n }, (_, i) => `https://example.com/${i}`);
    expect(accepts({ image_urls: urls(10) })).toBe(true);
    expect(accepts({ image_urls: urls(11) })).toBe(false);
    expect(accepts({ reference_video_urls: urls(3) })).toBe(true);
    expect(accepts({ reference_video_urls: urls(4) })).toBe(false);
  });

  it("takes whole seconds from 3 to 15", () => {
    expect(accepts({ duration: 3 })).toBe(true);
    expect(accepts({ duration: 15 })).toBe(true);
    expect(accepts({ duration: 2 })).toBe(false);
    expect(accepts({ duration: 16 })).toBe(false);
    expect(accepts({ duration: 4.5 })).toBe(false);
    expect(accepts({ duration: "3" })).toBe(false);
  });

  it.each(["360p", "720p", "1080p", "4k"])("accepts resolution %s", (r) =>
    expect(accepts({ resolution: r })).toBe(true)
  );

  it("closes resolution and aspect ratio to the documented values", () => {
    expect(accepts({ resolution: "4K" })).toBe(false);
    expect(accepts({ resolution: "480p" })).toBe(false);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "1:1" })).toBe(false);
  });

  // Dynamic, as C12's edit and every v1.1 endpoint are. The card bills output
  // seconds at $0.0273/$0.0819/$0.1229/$0.2457 by resolution plus input
  // tokens at $1.50 per 1M. The recorded 3 s, 360p call billed 3.401161
  // seconds at $0.0273, USD 0.092852, which fal's usage API confirms: about
  // 3.03 seconds for the output file (its generated audio runs 3.029333 s)
  // and 0.37 for the input tokens of the reference image and the prompt.
  it.each([
    ["minimal", { prompt: recorded.prompt }],
    ["recorded", recorded],
    ["4k, 15 s", { ...recorded, resolution: "4k", duration: 15 }],
  ])("defers the %s payload to fal's estimate API", (_label, payload) => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    const estimate = computeEstimate({ provider: "fal", endpoint, payload });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings).toHaveLength(1);
    expect(estimate.warnings[0]).toContain(
      "POST https://api.fal.ai/v1/models/pricing/estimate"
    );
    expect(estimate.warnings[0]).toContain(
      `fal '${endpoint}' bills ${falDynamicBilledUnit(endpoint)?.unit}.`
    );
  });

  it("carries no local rate or slug, only a display name", () => {
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Gemini Omni 1.2 Flash"
    );
  });
});
