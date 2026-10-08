import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p1ImageToVideoParsedRequest,
  type FalGeminiOmniFlashV1p1ImageToVideoRequest,
  type FalGeminiOmniFlashV1p1ImageToVideoRequestInput,
  type FalGeminiOmniFlashV1p1ImageToVideoResponse,
  type FalRunGeminiOmniFlashV1p1Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p1ImageToVideoRequestSchema as schema,
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
// e79c3b8583b43fc832171af11a5001109f4d897fd3ca211055b565b640f74d4e, equal to
// the 2026-10-05 capture) and the eleven unbilled 422 probes of the same day,
// which showed that upstream requires `prompt` and `image_url`, bounds the
// prompt at 20,000 characters, takes `end_image_url` as a string or null,
// takes `duration` as an integer from 3 to 10, and closes `aspect_ratio` and
// `resolution` to the documented values.
const endpoint = "google/gemini-omni-flash/v1.1/image-to-video";
const input = {
  prompt: "The dog turns its head and wags its tail in warm sunlight.",
  image_url:
    "https://storage.googleapis.com/falserverless/example_inputs/dog.png",
};
const recorded = {
  ...input,
  resolution: "360p" as const,
  duration: 3,
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google Gemini Omni Flash 1.1 image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p1.imageToVideo;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p1.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf under the existing v1p1 object, beside its edit and
    // reference-to-video leaves; the v1 callable keeps its own image-to-video
    // leaf.
    expect(provider.run.geminiOmniFlash.v1p1).toHaveProperty(
      "imageToVideo",
      leaf
    );
    expect(provider.run.geminiOmniFlash.v1p1.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p1.referenceToVideo).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.imageToVideo).not.toBe(leaf);
    // Compile-time only: the public namespace and request types, and the
    // documented Output with its File shape, optionality included.
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p1
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p1Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p1ImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p1ImageToVideoRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p1ImageToVideoRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p1ImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p1ImageToVideoResponse>().toEqualTypeOf<{
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
      await provider.run.geminiOmniFlash.v1p1.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.1/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the prompt and the first image and applies the documented defaults", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      aspect_ratio: "16:9",
      resolution: "720p",
      duration: 8,
    });
    expect(schema.parse(recorded)).toStrictEqual({
      ...recorded,
      aspect_ratio: "16:9",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ prompt: input.prompt }).success).toBe(false);
    expect(schema.safeParse({ image_url: input.image_url }).success).toBe(
      false
    );
  });

  it("caps the prompt at 20,000 characters, with no documented minimum", () => {
    expect(schema.safeParse({ ...input, prompt: "" }).success).toBe(true);
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(20000) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(20001) }).success
    ).toBe(false);
  });

  it.each(["https://example.com/first.png", "not-a-url", ""])(
    "accepts the first-frame string %j, as upstream checks no URL",
    (image_url) =>
      expect(schema.safeParse({ ...input, image_url }).success).toBe(true)
  );

  it.each([
    ["a number", 123],
    ["null", null],
    ["a list", ["https://example.com/first.png"]],
  ])("rejects image_url given %s", (_label, image_url) =>
    expect(schema.safeParse({ ...input, image_url }).success).toBe(false)
  );

  it.each([
    ["a URL", "https://example.com/last.png"],
    ["null", null],
  ])("accepts an end frame given %s", (_label, end_image_url) =>
    expect(schema.parse({ ...input, end_image_url }).end_image_url).toBe(
      end_image_url
    )
  );

  it.each([
    ["a number", 123],
    ["a list", ["https://example.com/last.png"]],
  ])("rejects end_image_url given %s", (_label, end_image_url) =>
    expect(schema.safeParse({ ...input, end_image_url }).success).toBe(false)
  );

  it.each(["16:9", "9:16"])("accepts aspect ratio %s", (aspect_ratio) =>
    expect(schema.safeParse({ ...input, aspect_ratio }).success).toBe(true)
  );

  it.each(["1:1", "4:3", "auto", ""])(
    "rejects aspect ratio %s",
    (aspect_ratio) =>
      expect(schema.safeParse({ ...input, aspect_ratio }).success).toBe(false)
  );

  it.each(["360p", "720p", "1080p", "4k"])(
    "accepts resolution %s",
    (resolution) =>
      expect(schema.safeParse({ ...input, resolution }).success).toBe(true)
  );

  it.each(["360P", "480p", "1080P", "4K", "auto", ""])(
    "rejects resolution %s",
    (resolution) =>
      expect(schema.safeParse({ ...input, resolution }).success).toBe(false)
  );

  it.each([3, 10])("accepts duration %i", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(true)
  );

  it.each([2, 11, 4.5])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(false)
  );

  it("strips an unknown field, as upstream ignores one", () => {
    const parsed = schema.parse({ ...input, bogus_field: 1 });
    expect(parsed).not.toHaveProperty("bogus_field");
  });

  it("describes every documented field in order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_url",
      "end_image_url",
      "aspect_ratio",
      "resolution",
      "duration",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Dynamic branch (P-7 rules 2 and 4): the card bills each second of output
  // video at $0.03/$0.10/$0.15/$0.30 at 360p/720p/1080p/4K, and the request
  // carries its duration, so the card predicts 3 units for the recorded 3 s
  // request. That call got back 3.000 s of video with a generated audio
  // track that plays for 3.008 s, and billed x-fal-billable-units 3.008 at
  // $0.03, $0.09024, which fal's usage API confirms, where the card
  // predicts $0.09. The billed length is the output file's, not the
  // requested duration, so a payload is deferred whether its duration is
  // sent, defaulted or hinted.
  it.each([
    ["minimal", input, undefined],
    ["recorded", recorded, undefined],
    ["recorded, length-hinted", recorded, { durationSeconds: 3 }],
    ["4k, ten-second", { ...input, resolution: "4k", duration: 10 }, undefined],
  ])(
    "defers the %s payload to fal's estimate API",
    (_label, payload, costHints) => {
      expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload,
        costHints,
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings).toHaveLength(1);
      expect(estimate.warnings[0]).toContain(
        "POST https://api.fal.ai/v1/models/pricing/estimate"
      );
      expect(estimate.warnings[0]).toContain("fal.v1.models.pricing.estimate");
    }
  );

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
