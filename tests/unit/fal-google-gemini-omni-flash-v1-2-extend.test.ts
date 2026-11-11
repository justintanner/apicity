import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p2ExtendParsedRequest,
  type FalGeminiOmniFlashV1p2ExtendRequest,
  type FalGeminiOmniFlashV1p2ExtendRequestInput,
  type FalGeminiOmniFlashV1p2ExtendResponse,
  type FalRunGeminiOmniFlashV1p2Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p2ExtendRequestSchema as schema,
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
// af1581b1a8499a3245d80ae7cfb050e4821ee4e9cfae0dc2bc540f0a5cc4b054, equal to
// the 2026-11-11 survey copy): `prompt` and `video_url` are required, and the
// continuation runs a whole number of seconds from 3 to 10.
const endpoint = "google/gemini-omni-flash/v1.2/extend";
const recorded = {
  prompt: "Continue the scene for a moment.",
  video_url:
    "https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_input.mp4",
  resolution: "360p",
  duration: 3,
} satisfies FalGeminiOmniFlashV1p2ExtendRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google Gemini Omni Flash 1.2 extend contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p2.extend;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p2.extend);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf on the v1p2 object, beside its other leaves.
    expect(provider.run.geminiOmniFlash.v1p2.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p2.imageToVideo).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p2.referenceToVideo).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p2.textToVideo).not.toBe(leaf);
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p2
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p2Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p2ExtendRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2ExtendRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p2ExtendRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p2ExtendParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2ExtendResponse>().toEqualTypeOf<{
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
    const result = await provider.run.geminiOmniFlash.v1p2.extend(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.2/extend"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the prompt and the source video and applies the documented defaults", () => {
    const minimal = { prompt: recorded.prompt, video_url: recorded.video_url };
    expect(schema.parse(minimal)).toStrictEqual({
      ...minimal,
      resolution: "720p",
      duration: 8,
    });
    expect(schema.safeParse({ prompt: recorded.prompt }).success).toBe(false);
    expect(schema.safeParse({ video_url: recorded.video_url }).success).toBe(
      false
    );
  });

  it("describes the documented fields in order, with no aspect ratio", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "video_url",
      "resolution",
      "duration",
    ]);
    expect(schema.shape.video_url.description).toBe(
      "URL of the video to extend. Any length is accepted; the model conditions on the last 10 seconds and appends the continuation."
    );
    expect(schema.shape.duration.description).toBe(
      "The duration of the continuation, in seconds."
    );
  });

  it("caps the prompt at 20,000 characters, with no documented minimum", () => {
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ prompt: "p".repeat(20000) })).toBe(true);
    expect(accepts({ prompt: "p".repeat(20001) })).toBe(false);
  });

  it("takes a continuation of whole seconds from 3 to 10", () => {
    expect(accepts({ duration: 3 })).toBe(true);
    expect(accepts({ duration: 10 })).toBe(true);
    expect(accepts({ duration: 2 })).toBe(false);
    expect(accepts({ duration: 11 })).toBe(false);
    expect(accepts({ duration: 4.5 })).toBe(false);
    expect(accepts({ duration: "3" })).toBe(false);
  });

  it.each(["360p", "720p", "1080p", "4k"])("accepts resolution %s", (r) =>
    expect(accepts({ resolution: r })).toBe(true)
  );

  it("closes resolution to the documented values", () => {
    expect(accepts({ resolution: "4K" })).toBe(false);
    expect(accepts({ resolution: "480p" })).toBe(false);
  });

  // Dynamic, as the other 1.2 endpoints are. The card bills newly generated
  // seconds at $0.0273/$0.0819/$0.1229/$0.2457 by resolution plus input
  // tokens at $1.50 per 1M. The recorded 3 s, 360p extension of fal's 5 s
  // example clip returned the whole 8 s video and billed 4.956952 seconds at
  // $0.0273, USD 0.135325, which fal's usage API confirms: about 3 seconds
  // for the new footage and 1.96 (about 36,000 tokens) for input tokens,
  // mostly the source video the request carries only as a URL.
  it.each([
    ["minimal", { prompt: recorded.prompt, video_url: recorded.video_url }],
    ["recorded", recorded],
    ["4k, 10 s", { ...recorded, resolution: "4k", duration: 10 }],
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
      "Gemini Omni 1.2 Flash Extend"
    );
  });
});
