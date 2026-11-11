import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p2ImageToVideoParsedRequest,
  type FalGeminiOmniFlashV1p2ImageToVideoRequest,
  type FalGeminiOmniFlashV1p2ImageToVideoRequestInput,
  type FalGeminiOmniFlashV1p2ImageToVideoResponse,
  type FalRunGeminiOmniFlashV1p2Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p2ImageToVideoRequestSchema as schema,
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
// 333c44ce2e20f0122928184dba7d73deb14b318b2d8e016fe1b8ef04341e0827, equal to
// the 2026-11-11 survey copy): `prompt` and `image_url` are required, and the
// duration is an integer from 3 to 15 seconds.
const endpoint = "google/gemini-omni-flash/v1.2/image-to-video";
// The recording sends tests/fixtures/cat1.jpg as a data URL; a short URL
// stands in for it here, since these checks never reach fal.
const recorded = {
  prompt: "The cat turns its head toward the camera.",
  image_url: "https://example.com/cat1.jpg",
  duration: 3,
  resolution: "360p",
  aspect_ratio: "16:9",
} satisfies FalGeminiOmniFlashV1p2ImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google Gemini Omni Flash 1.2 image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p2.imageToVideo;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p2.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf on the v1p2 object, beside its other leaves; the v1.1 twin is
    // separate.
    expect(provider.run.geminiOmniFlash.v1p2.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p2.referenceToVideo).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p2.textToVideo).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p1.imageToVideo).not.toBe(leaf);
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p2
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p2Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p2ImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2ImageToVideoRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p2ImageToVideoRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p2ImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2ImageToVideoResponse>().toEqualTypeOf<{
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
      await provider.run.geminiOmniFlash.v1p2.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.2/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the prompt and the first frame and applies the documented defaults", () => {
    const minimal = { prompt: recorded.prompt, image_url: recorded.image_url };
    expect(schema.parse(minimal)).toStrictEqual({
      ...minimal,
      aspect_ratio: "16:9",
      resolution: "720p",
      duration: 8,
    });
    expect(schema.safeParse({ prompt: recorded.prompt }).success).toBe(false);
    expect(schema.safeParse({ image_url: recorded.image_url }).success).toBe(
      false
    );
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_url",
      "end_image_url",
      "aspect_ratio",
      "resolution",
      "duration",
    ]);
    expect(schema.shape.image_url.description).toBe(
      "URL of the first frame to animate."
    );
    expect(schema.shape.end_image_url.description).toContain(
      "the duration is capped at 10 seconds"
    );
    expect(schema.shape.duration.description).toContain(
      "At most 10 seconds when an end image is provided."
    );
  });

  // The unbilled 422 pairing probes of 2026-11-11 drew `string_too_long` for
  // 20,001 characters.
  it("caps the prompt at 20,000 characters, with no documented minimum", () => {
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ prompt: "p".repeat(20000) })).toBe(true);
    expect(accepts({ prompt: "p".repeat(20001) })).toBe(false);
  });

  // The probes drew `less_than_equal` (le 15) for a 16-second request.
  it("takes whole seconds from 3 to 15", () => {
    expect(accepts({ duration: 3 })).toBe(true);
    expect(accepts({ duration: 15 })).toBe(true);
    expect(accepts({ duration: 2 })).toBe(false);
    expect(accepts({ duration: 16 })).toBe(false);
    expect(accepts({ duration: 4.5 })).toBe(false);
    expect(accepts({ duration: "3" })).toBe(false);
  });

  it("takes an optional end frame as a string or null", () => {
    expect(accepts({ end_image_url: "https://example.com/last.jpg" })).toBe(
      true
    );
    expect(accepts({ end_image_url: null })).toBe(true);
    expect(accepts({ end_image_url: 1 })).toBe(false);
  });

  // The descriptions cap an interpolation at 10 seconds, but the same probes
  // drew no `duration` error for 15 or 11 seconds with `end_image_url` set
  // (beside the guard errors that kept them unbilled), so upstream does not
  // check the cap at field level. The schema leaves it to the descriptions.
  it("leaves the documented 10-second end-frame cap to upstream", () => {
    const end = "https://example.com/last.jpg";
    expect(accepts({ end_image_url: end, duration: 10 })).toBe(true);
    expect(accepts({ end_image_url: end, duration: 15 })).toBe(true);
  });

  it.each(["360p", "720p", "1080p", "4k"])("accepts resolution %s", (r) =>
    expect(accepts({ resolution: r })).toBe(true)
  );

  // The probes drew `literal_error` for aspect ratio 1:1.
  it("closes resolution and aspect ratio to the documented values", () => {
    expect(accepts({ resolution: "4K" })).toBe(false);
    expect(accepts({ resolution: "480p" })).toBe(false);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "1:1" })).toBe(false);
  });

  // Dynamic, as the other 1.2 endpoints are. The card bills output seconds
  // at $0.0273/$0.0819/$0.1229/$0.2457 by resolution plus input tokens at
  // $1.50 per 1M. The recorded 3 s, 360p call from the owned cat photo billed
  // 3.277456 seconds at $0.0273, USD 0.089475, which fal's usage API
  // confirms: about 3.03 seconds for the output file (its generated audio
  // runs 3.029333 s) and 0.25 (about 4,500 tokens) for input tokens.
  it.each([
    ["minimal", { prompt: recorded.prompt, image_url: recorded.image_url }],
    ["recorded", recorded],
    [
      "4k, 15 s, with an end frame",
      {
        ...recorded,
        end_image_url: "https://example.com/last.jpg",
        resolution: "4k",
        duration: 15,
      },
    ],
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
