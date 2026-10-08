import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3MaxThreeDToVideoParsedRequest,
  type FalMinimaxH3MaxThreeDToVideoRequest,
  type FalMinimaxH3MaxThreeDToVideoRequestInput,
  type FalMinimaxH3MaxThreeDToVideoResponse,
} from "@apicity/fal";
import {
  FalMinimaxH3MaxThreeDToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-07 (sha256
// f2ad4912ad21b695f9d274a8daa1492b2f9750de387ceae17c4cf86ab0c5a937) and the
// unbilled 422 probes of the same day, which showed that upstream requires
// `video_url` alone, refuses unknown fields, takes integers only for
// `max_generated_reference_images`, accepts a blank Scene Intent, and refuses
// any media URL that is not "an HTTPS URL without credentials or fragments".
const endpoint = "minimax/h3-max/3d-to-video";
const input = { video_url: "https://example.com/previs.mp4" };
const image = "https://example.com/reference.jpg";

function urls(url: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${url}?n=${i}`);
}

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...input, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MiniMax H3 Max 3D-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3Max.threeDToVideo;
    expect(leaf).toBe(provider.post.run.minimax.h3Max.threeDToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // Compile-time only: the public request types and the one documented
    // Output member with the Video shape, optionality included.
    expectTypeOf<FalMinimaxH3MaxThreeDToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxThreeDToVideoRequestInput>().toEqualTypeOf<FalMinimaxH3MaxThreeDToVideoRequest>();
    expectTypeOf<FalMinimaxH3MaxThreeDToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxThreeDToVideoResponse>().toEqualTypeOf<{
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
    const body = {
      ...input,
      reference_image_urls: [image],
      resolution: "480P" as const,
    };
    const result = await provider.run.minimax.h3Max.threeDToVideo(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/minimax/h3-max/3d-to-video");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("requires only the video and applies the documented defaults", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      max_generated_reference_images: 2,
      resolution: "768P",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ reference_image_urls: [image] }).success).toBe(
      false
    );
  });

  it("refuses the siblings' fields, which the closed input does not document", () => {
    for (const extra of [
      { duration: 5 },
      { prompt_expansion_mode: "disabled" },
      { seed: 1 },
      { aspect_ratio: "16:9" },
    ]) {
      expect(accepts(extra), JSON.stringify(extra)).toBe(false);
    }
  });

  it.each([
    "https://example.com/previs.mp4",
    "https://v3b.fal.media/files/b/0aaaaf78/blender-source.mp4",
    "https://example.com/previs.mp4?token=abc",
    "https://example.com",
    "HTTPS://EXAMPLE.COM/previs.mp4",
  ])("accepts the media URL %s", (url) => {
    expect(accepts({ video_url: url })).toBe(true);
    expect(accepts({ reference_image_urls: [url] })).toBe(true);
  });

  it.each([
    "http://example.com/previs.mp4",
    "https://user:pass@example.com/previs.mp4",
    "https://example.com/previs.mp4#frame",
    "not a url",
    "",
  ])("refuses the media URL %s", (url) => {
    expect(accepts({ video_url: url })).toBe(false);
    expect(accepts({ reference_image_urls: [image, url] })).toBe(false);
  });

  it("takes the Scene Intent as text of at most 2,000 characters, or null", () => {
    for (const prompt of [
      null,
      "",
      "   ",
      "The moving block represents a running person.",
      "p".repeat(2000),
    ]) {
      expect(accepts({ prompt }), String(prompt).slice(0, 20)).toBe(true);
    }
    expect(accepts({ prompt: "p".repeat(2001) })).toBe(false);
    expect(accepts({ prompt: 1 })).toBe(false);
  });

  it("caps the reference images at eight, as a list", () => {
    expect(accepts({ reference_image_urls: [] })).toBe(true);
    expect(accepts({ reference_image_urls: urls(image, 8) })).toBe(true);
    expect(accepts({ reference_image_urls: urls(image, 9) })).toBe(false);
    expect(accepts({ reference_image_urls: image })).toBe(false);
    expect(accepts({ reference_image_urls: [1] })).toBe(false);
  });

  it.each([1, 2, 8])("accepts %s new reference images", (count) =>
    expect(accepts({ max_generated_reference_images: count })).toBe(true)
  );

  it.each([0, 9, 1.5, "2", true])("rejects %s new reference images", (count) =>
    expect(accepts({ max_generated_reference_images: count })).toBe(false)
  );

  it.each(["480P", "768P", "1080P"])("accepts resolution %s", (resolution) =>
    expect(accepts({ resolution })).toBe(true)
  );

  it.each(["720P", "2K", "480p", ""])("rejects resolution %s", (resolution) =>
    expect(accepts({ resolution })).toBe(false)
  );

  it("describes every documented field, in upstream's order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "video_url",
      "prompt",
      "reference_image_urls",
      "max_generated_reference_images",
      "resolution",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Dynamic branch (P-7 rule 1): besides the billed seconds, which follow
  // the source video's shots rather than any request field, the card charges
  // $0.02 per 1,000 input-video and reference-image tokens beyond the 4,096
  // included per shot, and those tokens depend on the source's frames and
  // each image's shape, which the payload carries only as URLs. The page also
  // lists a per-request processing fee and a charge per generated reference.
  // The recorded 480P call (an 8 s source, one 16:9 reference image) billed
  // x-fal-billable-units 15.9832 at $0.05, $0.79916 with no processing fee,
  // and is deferred like any other payload.
  it.each([
    ["minimal", input],
    [
      "recorded",
      { ...input, reference_image_urls: [image], resolution: "480P" },
    ],
    [
      "generated-reference 1080P",
      { ...input, max_generated_reference_images: 8, resolution: "1080P" },
    ],
  ])("defers the %s payload to fal's estimate API", (_label, payload) => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    const estimate = computeEstimate({ provider: "fal", endpoint, payload });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings).toHaveLength(1);
    expect(estimate.warnings[0]).toContain(
      "POST https://api.fal.ai/v1/models/pricing/estimate"
    );
    expect(estimate.warnings[0]).toContain("fal.v1.models.pricing.estimate");
  });

  it("carries no local rate, slug or display name", () => {
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect(
      (MODEL_DISPLAY.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
  });
});
