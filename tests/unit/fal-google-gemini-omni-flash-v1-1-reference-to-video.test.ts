import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p1ReferenceToVideoParsedRequest,
  type FalGeminiOmniFlashV1p1ReferenceToVideoRequest,
  type FalGeminiOmniFlashV1p1ReferenceToVideoRequestInput,
  type FalGeminiOmniFlashV1p1ReferenceToVideoResponse,
  type FalRunGeminiOmniFlashV1p1Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p1ReferenceToVideoRequestSchema as schema,
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
// 9eb950646dd41086c7b02db9ea39574f69ed018404ed39a5c528c22b85a4bd8d, equal to
// the 2026-10-05 capture) and the ten unbilled 422 probes of the same day,
// which showed that upstream requires only `prompt`, bounds it at 20,000
// characters, caps `image_urls` at ten strings and `reference_video_urls` at
// three, takes `duration` as an integer from 3 to 10, and closes
// `aspect_ratio` and `resolution` to the documented values.
const endpoint = "google/gemini-omni-flash/v1.1/reference-to-video";
const input = {
  prompt:
    "A cat inspired by <IMAGE_REF_0> walks through the setting in <VIDEO_REF_0>.",
};
const recorded = {
  prompt:
    "The family in <IMAGE_REF_0> waves from the lawn in front of the white farmhouse, camera holding still.",
  image_urls: [
    "https://v3b.fal.media/files/b/0aa7d0a6/Zxzqx2mbFF7Ey3YVnD-g4_084_monochrome_expressionism.jpg",
  ],
  resolution: "360p" as const,
  duration: 3,
};

const urls = (count: number, extension: string) =>
  Array.from(
    { length: count },
    (_, i) => `https://example.com/ref-${i}.${extension}`
  );

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google Gemini Omni Flash 1.1 reference-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p1.referenceToVideo;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p1.referenceToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf under the existing v1p1 object, beside its edit leaf; the v1
    // callable keeps its own reference-to-video leaf.
    expect(provider.run.geminiOmniFlash.v1p1).toHaveProperty(
      "referenceToVideo",
      leaf
    );
    expect(provider.run.geminiOmniFlash.v1p1.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.referenceToVideo).not.toBe(leaf);
    // Compile-time only: the public namespace and request types, and the
    // documented Output with its File shape, optionality included.
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p1
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p1Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p1ReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p1ReferenceToVideoRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p1ReferenceToVideoRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p1ReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p1ReferenceToVideoResponse>().toEqualTypeOf<{
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
      await provider.run.geminiOmniFlash.v1p1.referenceToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.1/reference-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only the prompt and applies the documented defaults", () => {
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
    expect(
      schema.safeParse({ image_urls: urls(1, "png"), duration: 3 }).success
    ).toBe(false);
  });

  it("caps the prompt at 20,000 characters, with no documented minimum", () => {
    expect(schema.safeParse({ prompt: "" }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(20000) }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(20001) }).success).toBe(false);
  });

  it.each([0, 1, 10])("accepts %i reference images", (count) =>
    expect(
      schema.safeParse({ ...input, image_urls: urls(count, "png") }).success
    ).toBe(true)
  );

  it.each([
    ["eleven images", urls(11, "png")],
    ["a bare string", "https://example.com/ref.png"],
    ["a non-string entry", [123]],
  ])("rejects image_urls given %s", (_label, image_urls) =>
    expect(schema.safeParse({ ...input, image_urls }).success).toBe(false)
  );

  it.each([0, 1, 3])("accepts %i reference videos", (count) =>
    expect(
      schema.safeParse({ ...input, reference_video_urls: urls(count, "mp4") })
        .success
    ).toBe(true)
  );

  it.each([
    ["four videos", urls(4, "mp4")],
    ["a number", 123],
    ["a null entry", [null]],
  ])("rejects reference_video_urls given %s", (_label, reference_video_urls) =>
    expect(schema.safeParse({ ...input, reference_video_urls }).success).toBe(
      false
    )
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
      "image_urls",
      "reference_video_urls",
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
  // track of 3.029333 s, and billed x-fal-billable-units 3.029333 at $0.03,
  // $0.09088, which fal's usage API confirms, where the card predicts $0.09.
  // The billed length is the output file's, not the requested duration, so
  // a payload is deferred whether its duration is sent, defaulted or hinted.
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
