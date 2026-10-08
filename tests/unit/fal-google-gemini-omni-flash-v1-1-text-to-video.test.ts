import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p1TextToVideoParsedRequest,
  type FalGeminiOmniFlashV1p1TextToVideoRequest,
  type FalGeminiOmniFlashV1p1TextToVideoRequestInput,
  type FalGeminiOmniFlashV1p1TextToVideoResponse,
  type FalRunGeminiOmniFlashV1p1Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p1TextToVideoRequestSchema as schema,
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
// ea374c7fa55e7ad535d5796acd99dd527213b81a18b5cbd777fff3fba0ae5688, equal to
// the 2026-10-05 capture) and the twelve unbilled 422 probes of the same day,
// which showed that upstream requires only `prompt`, bounds it at 20,000
// characters with no minimum, takes `duration` as an integer from 3 to 10, and
// closes `aspect_ratio` and `resolution` to the documented values.
const endpoint = "google/gemini-omni-flash/v1.1/text-to-video";
const input = {
  prompt:
    "A cinematic wide shot of a lighthouse on a rocky cliff at dusk, waves crashing below, the beam sweeping across the dark sea.",
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

describe("Google Gemini Omni Flash 1.1 text-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p1.textToVideo;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p1.textToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf under the existing v1p1 object, beside its edit,
    // reference-to-video and image-to-video leaves; the v1 callable, itself
    // the v1 text-to-video endpoint, keeps its own function and schema.
    expect(provider.run.geminiOmniFlash.v1p1).toHaveProperty(
      "textToVideo",
      leaf
    );
    expect(provider.run.geminiOmniFlash.v1p1.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p1.referenceToVideo).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p1.imageToVideo).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.schema).not.toBe(schema);
    // Compile-time only: the public namespace and request types, and the
    // documented Output with its File shape, optionality included.
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p1
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p1Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p1TextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p1TextToVideoRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p1TextToVideoRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p1TextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p1TextToVideoResponse>().toEqualTypeOf<{
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
      await provider.run.geminiOmniFlash.v1p1.textToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.1/text-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the prompt alone and applies the documented defaults", () => {
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
    expect(schema.safeParse({ resolution: "360p", duration: 3 }).success).toBe(
      false
    );
  });

  it("caps the prompt at 20,000 characters, with no documented minimum", () => {
    expect(schema.safeParse({ prompt: "" }).success).toBe(true);
    expect(schema.safeParse({ prompt: "   " }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(20000) }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(20001) }).success).toBe(false);
  });

  it("rejects a prompt that is not a string, as upstream does", () => {
    expect(schema.safeParse({ prompt: 123 }).success).toBe(false);
  });

  it.each(["16:9", "9:16"])("accepts aspect ratio %s", (aspect_ratio) =>
    expect(schema.safeParse({ ...input, aspect_ratio }).success).toBe(true)
  );

  it.each(["1:1", "4:3", "auto", "", null])(
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

  it.each([2, 11, 4.5, null])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(false)
  );

  it("strips an unknown field, as upstream ignores one", () => {
    const parsed = schema.parse({ ...input, bogus_field: 1 });
    expect(parsed).not.toHaveProperty("bogus_field");
  });

  it("describes every documented field in order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
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
  // $0.09088, which fal's usage API confirms, where the card predicts
  // $0.09. The billed length is the output file's, not the requested
  // duration, so a payload is deferred whether its duration is sent,
  // defaulted or hinted.
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
