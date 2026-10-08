import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalXaiGrokImagineVideoV1p5TextToVideoParsedRequest,
  type FalXaiGrokImagineVideoV1p5TextToVideoRequest,
  type FalXaiGrokImagineVideoV1p5TextToVideoRequestInput,
  type FalXaiGrokImagineVideoV1p5TextToVideoResponse,
} from "@apicity/fal";
import {
  FalXaiGrokImagineVideoV1p5TextToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-08 (sha256
// 55b0d86a711ebd1d894e4d0f08c61e2f1f35cc5f6ab1e0d5597a32725de2c810, equal to
// the 2026-10-05 capture) and the five unbilled 422 probes of the same day,
// which showed that upstream requires `prompt` alone, bounds it at 4096
// characters, takes `duration` as an integer from 1 to 15, and closes
// `resolution` and `aspect_ratio` to the documented values.
const endpoint = "xai/grok-imagine-video/v1.5/text-to-video";
const input = { prompt: "A red fox runs through fresh snow." };

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("xAI Grok Imagine Video 1.5 text-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.xai.grokImagineVideo.v1p5.textToVideo;
    expect(leaf).toBe(provider.post.run.xai.grokImagineVideo.v1p5.textToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // Compile-time only: the public request types and the documented Output,
    // whose `video` is upstream's VideoFile, optionality included.
    expectTypeOf<FalXaiGrokImagineVideoV1p5TextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalXaiGrokImagineVideoV1p5TextToVideoRequestInput>().toEqualTypeOf<FalXaiGrokImagineVideoV1p5TextToVideoRequest>();
    expectTypeOf<FalXaiGrokImagineVideoV1p5TextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalXaiGrokImagineVideoV1p5TextToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
        fps?: number | null;
        duration?: number | null;
        num_frames?: number | null;
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
      duration: 1,
      resolution: "480p" as const,
      aspect_ratio: "9:16" as const,
    };
    const result =
      await provider.run.xai.grokImagineVideo.v1p5.textToVideo(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/xai/grok-imagine-video/v1.5/text-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("requires only the prompt and applies the documented defaults", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      duration: 6,
      resolution: "720p",
      aspect_ratio: "16:9",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ duration: 1 }).success).toBe(false);
  });

  it("caps the prompt at 4,096 characters, with no documented minimum", () => {
    expect(schema.safeParse({ prompt: "" }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(4096) }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(4097) }).success).toBe(false);
  });

  it.each([1, 6, 15])("accepts duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(true)
  );

  it.each([0, 16, 1.5, "6", null])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(false)
  );

  it.each(["480p", "720p", "1080p"])("accepts resolution %s", (resolution) =>
    expect(schema.safeParse({ ...input, resolution }).success).toBe(true)
  );

  it.each(["480P", "1080P", "4K", "auto", ""])(
    "rejects resolution %s",
    (resolution) =>
      expect(schema.safeParse({ ...input, resolution }).success).toBe(false)
  );

  it.each(["16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"])(
    "accepts aspect ratio %s",
    (aspect_ratio) =>
      expect(schema.safeParse({ ...input, aspect_ratio }).success).toBe(true)
  );

  it.each(["21:9", "auto", "16:10", "", null])(
    "rejects aspect ratio %s",
    (aspect_ratio) =>
      expect(schema.safeParse({ ...input, aspect_ratio }).success).toBe(false)
  );

  it("strips an image URL, which this endpoint does not document", () => {
    const parsed = schema.parse({
      ...input,
      image_url: "https://example.com/first.jpg",
    });
    expect(parsed).not.toHaveProperty("image_url");
  });

  it("describes every documented field without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "aspect_ratio",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Static branch (P-7): fal's pricing API quotes $0.01 per unit where the
  // card quotes $0.08 to $0.25 per second, because fal counts the charge in
  // cents. The recorded 1 s 480p call billed x-fal-billable-units 8.0, which
  // its usage API priced at $0.01 each, $0.08: the card's price.
  it.each([
    ["480p", 0.08],
    ["720p", 0.14],
    ["1080p", 0.25],
  ] as const)(
    "prices %s at the card's rate per requested second",
    (resolution, rate) => {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, resolution, duration: 2 },
      });
      expect(estimate.usd).toBeCloseTo(rate * 2);
      expect(estimate.warnings).toEqual([]);
    }
  );

  it("prices the recorded payload at the billed $0.08", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, duration: 1, resolution: "480p" },
      }).usd
    ).toBeCloseTo(0.08));

  it("prices the default six seconds at 720p", () =>
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: input }).usd
    ).toBeCloseTo(0.84));

  it("does not price by aspect ratio", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, resolution: "480p", aspect_ratio: "9:16" },
      }).usd
    ).toBeCloseTo(0.48));

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/xai/grok-imagine-video/v1.5/text-to-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "grokimgv1p5"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Grok Imagine Video 1.5"
    );
  });
});
