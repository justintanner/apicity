import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p2TextToVideoParsedRequest,
  type FalGeminiOmniFlashV1p2TextToVideoRequest,
  type FalGeminiOmniFlashV1p2TextToVideoRequestInput,
  type FalGeminiOmniFlashV1p2TextToVideoResponse,
  type FalRunGeminiOmniFlashV1p2Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p2TextToVideoRequestSchema as schema,
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
// 70ab26589e1d0941277201af135bf4e80b1e63548444258e4997ebcf465d7505, equal to
// the 2026-11-11 survey copy): only `prompt` is required, and the duration is
// an integer from 3 to 15 seconds.
const endpoint = "google/gemini-omni-flash/v1.2/text-to-video";
const recorded = {
  prompt: "A red panda waves once, then holds still.",
  duration: 3,
  resolution: "360p",
  aspect_ratio: "16:9",
} satisfies FalGeminiOmniFlashV1p2TextToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google Gemini Omni Flash 1.2 text-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p2.textToVideo;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p2.textToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf on the v1p2 object, beside edit and referenceToVideo; the v1.1
    // twin is separate.
    expect(provider.run.geminiOmniFlash.v1p2.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p2.referenceToVideo).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p1.textToVideo).not.toBe(leaf);
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p2
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p2Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p2TextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2TextToVideoRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p2TextToVideoRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p2TextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2TextToVideoResponse>().toEqualTypeOf<{
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
      await provider.run.geminiOmniFlash.v1p2.textToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.2/text-to-video"
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
      "aspect_ratio",
      "resolution",
      "duration",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The text prompt describing the video you want to generate."
    );
  });

  it("caps the prompt at 20,000 characters, with no documented minimum", () => {
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ prompt: "p".repeat(20000) })).toBe(true);
    expect(accepts({ prompt: "p".repeat(20001) })).toBe(false);
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

  // Dynamic, as the 1.2 edit and reference-to-video are. The card bills
  // output seconds at $0.0273/$0.0819/$0.1229/$0.2457 by resolution plus
  // input tokens at $1.50 per 1M. The recorded 3 s, 360p call billed 3.252469
  // seconds at $0.0273, USD 0.088792, which fal's usage API confirms: about
  // 3.03 seconds for the output file (its generated audio runs 3.029333 s)
  // and 0.22 (about 4,000 tokens) for input tokens, far more than the prompt.
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
