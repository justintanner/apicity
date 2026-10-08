import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalXaiGrokImagineVideoV1p5ImageToVideoParsedRequest,
  type FalXaiGrokImagineVideoV1p5ImageToVideoRequest,
  type FalXaiGrokImagineVideoV1p5ImageToVideoRequestInput,
  type FalXaiGrokImagineVideoV1p5ImageToVideoResponse,
} from "@apicity/fal";
import {
  FalXaiGrokImagineVideoV1p5ImageToVideoRequestSchema as schema,
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
// 3f06be653d95086ff8776a5e764402b2d96fb717cc2858ff582ec34614b4f684, equal to
// the 2026-10-05 capture) and the six unbilled 422 probes of the same day,
// which showed that upstream requires `prompt` and `image_url`, bounds the
// prompt at 4096 characters, takes `duration` as an integer from 1 to 15,
// closes `resolution` to the documented values, and checks `image_url` only
// as a string.
const endpoint = "xai/grok-imagine-video/v1.5/image-to-video";
const input = {
  prompt: "The fox turns its head toward the camera.",
  image_url: "https://example.com/first.jpg",
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("xAI Grok Imagine Video 1.5 image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.xai.grokImagineVideo.v1p5.imageToVideo;
    expect(leaf).toBe(provider.post.run.xai.grokImagineVideo.v1p5.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // Compile-time only: the public request types and the documented Output,
    // whose `video` is upstream's VideoFile, optionality included.
    expectTypeOf<FalXaiGrokImagineVideoV1p5ImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalXaiGrokImagineVideoV1p5ImageToVideoRequestInput>().toEqualTypeOf<FalXaiGrokImagineVideoV1p5ImageToVideoRequest>();
    expectTypeOf<FalXaiGrokImagineVideoV1p5ImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalXaiGrokImagineVideoV1p5ImageToVideoResponse>().toEqualTypeOf<{
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
    const body = { ...input, duration: 1, resolution: "480p" as const };
    const result =
      await provider.run.xai.grokImagineVideo.v1p5.imageToVideo(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/xai/grok-imagine-video/v1.5/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("requires the prompt and the image and applies the documented defaults", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      duration: 6,
      resolution: "720p",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ prompt: input.prompt }).success).toBe(false);
    expect(schema.safeParse({ image_url: input.image_url }).success).toBe(
      false
    );
  });

  it("caps the prompt at 4,096 characters, with no documented minimum", () => {
    expect(schema.safeParse({ ...input, prompt: "" }).success).toBe(true);
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(4096) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(4097) }).success
    ).toBe(false);
  });

  it.each([
    "https://example.com/first.png",
    "data:image/png;base64,iVBORw0KGgo=",
  ])("accepts image URL %s", (image_url) =>
    expect(schema.safeParse({ ...input, image_url }).success).toBe(true)
  );

  it.each([123, null, ["https://example.com/first.jpg"]])(
    "rejects image URL %s",
    (image_url) =>
      expect(schema.safeParse({ ...input, image_url }).success).toBe(false)
  );

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

  it("strips an aspect ratio, which this endpoint does not document", () => {
    const parsed = schema.parse({ ...input, aspect_ratio: "9:16" });
    expect(parsed).not.toHaveProperty("aspect_ratio");
  });

  it("describes every documented field without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "image_url",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Static branch (P-7): fal's pricing API quotes $0.01 per unit where the
  // card quotes $0.08 to $0.25 per second plus $0.01 per image, because fal
  // counts the charge in cents. The recorded 1 s 480p call billed
  // x-fal-billable-units 9.0, which its usage API priced at $0.01 each,
  // $0.09: the card's $0.08 for the second plus $0.01 for the image.
  it.each([
    ["480p", 0.08],
    ["720p", 0.14],
    ["1080p", 0.25],
  ] as const)(
    "prices %s at the card's rate per requested second, plus the image",
    (resolution, rate) => {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, resolution, duration: 2 },
      });
      expect(estimate.usd).toBeCloseTo(rate * 2 + 0.01);
      expect(estimate.breakdown).toMatchObject({
        units: 2,
        unit: "seconds",
        perUnitUsd: rate,
        extraUsd: 0.01,
      });
      expect(estimate.warnings).toEqual([]);
    }
  );

  it("prices the recorded payload at the billed $0.09", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, duration: 1, resolution: "480p" },
      }).usd
    ).toBeCloseTo(0.09));

  it("prices the default six seconds at 720p", () =>
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: input }).usd
    ).toBeCloseTo(0.85));

  it("keeps the image charge flat at the longest 1080p clip", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, duration: 15, resolution: "1080p" },
      }).usd
    ).toBeCloseTo(3.76));

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/xai/grok-imagine-video/v1.5/image-to-video",
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
