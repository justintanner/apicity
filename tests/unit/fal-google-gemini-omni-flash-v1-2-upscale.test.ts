import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p2UpscaleParsedRequest,
  type FalGeminiOmniFlashV1p2UpscaleRequest,
  type FalGeminiOmniFlashV1p2UpscaleRequestInput,
  type FalGeminiOmniFlashV1p2UpscaleResponse,
  type FalRunGeminiOmniFlashV1p2Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p2UpscaleRequestSchema as schema,
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
// 51d3827b0f3ae4c125616ce0044add99adf771b6cfa129c8d585e5cb2d00131e, equal to
// the 2026-11-11 survey copy): only `video_url` is required, beside a target
// `resolution` of 720p, 1080p or 4k.
const endpoint = "google/gemini-omni-flash/v1.2/upscale";
// The owned 3 s, 360p output of the recorded 1.2 text-to-video call.
const recorded = {
  video_url:
    "https://v3b.fal.media/files/b/0ab20aa6/_-uXxPeQ4CvqA-usGco3f_cccfda385c03442bb5fe74b45beb3a8d.mp4",
  resolution: "720p",
} satisfies FalGeminiOmniFlashV1p2UpscaleRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google Gemini Omni Flash 1.2 upscale contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p2.upscale;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p2.upscale);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf on the v1p2 object, beside its other leaves.
    expect(provider.run.geminiOmniFlash.v1p2.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.v1p2.extend).not.toBe(leaf);
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p2
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p2Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p2UpscaleRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2UpscaleRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p2UpscaleRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p2UpscaleParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2UpscaleResponse>().toEqualTypeOf<{
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
    const result = await provider.run.geminiOmniFlash.v1p2.upscale(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.2/upscale"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only the source video and defaults the target to 1080p", () => {
    expect(schema.parse({ video_url: recorded.video_url })).toStrictEqual({
      video_url: recorded.video_url,
      resolution: "1080p",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ resolution: "720p" }).success).toBe(false);
  });

  it("describes the two documented fields in order, with no prompt", () => {
    expect(Object.keys(schema.shape)).toEqual(["video_url", "resolution"]);
    expect(schema.shape.video_url.description).toBe(
      "URL of the video to upscale. Must be at most 15 seconds long."
    );
    expect(schema.shape.resolution.description).toBe(
      "The target resolution of the upscaled video. Must be higher than the source video's resolution."
    );
  });

  it.each(["720p", "1080p", "4k"])("accepts target resolution %s", (r) =>
    expect(accepts({ resolution: r })).toBe(true)
  );

  it("closes the target to the documented values", () => {
    expect(accepts({ resolution: "360p" })).toBe(false);
    expect(accepts({ resolution: "4K" })).toBe(false);
    expect(accepts({ resolution: "1440p" })).toBe(false);
    expect(accepts({ video_url: 1 })).toBe(false);
  });

  // Dynamic. The card bills each second of upscaled output by the source and
  // target resolutions (about $0.041 from 360p to 720p or 720p to 1080p,
  // $0.0819 from 360p to 1080p, $0.1638 to 4K), but the request carries only
  // the target and the source's URL. The recorded 360p-to-720p call on a 3 s
  // clip billed 4.543215 units at $0.0273, USD 0.12403, which fal's usage API
  // confirms: about 1.5 units per second of the 3.029 s output file.
  it.each([
    ["minimal", { video_url: recorded.video_url }],
    ["recorded", recorded],
    ["4k", { ...recorded, resolution: "4k" }],
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
      "Gemini Omni 1.2 Flash Upscale"
    );
  });
});
