import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalRunBytedanceSeedance2p0MiniNamespace,
  type FalSeedance2p0MiniImageToVideoParsedRequest,
  type FalSeedance2p0MiniImageToVideoRequest,
  type FalSeedance2p0MiniImageToVideoRequestInput,
  type FalSeedance2p0MiniImageToVideoResponse,
} from "@apicity/fal";
import {
  FalSeedance2p0MiniImageToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-11-11
// (sha256 53f5a77a6aa221f36913231b20e96d01fa1358bea2e9101bb6bf7b0993d189e7).
const endpoint = "bytedance/seedance-2.0/mini/image-to-video";
// The recording sends tests/fixtures/cat1.jpg as a data URL; a short URL
// stands in for it here, since these checks never reach fal.
const recorded = {
  prompt: "The cat turns its head toward the camera.",
  image_url: "https://example.com/cat1.jpg",
  resolution: "480p",
  duration: "4",
  aspect_ratio: "1:1",
  generate_audio: false,
} satisfies FalSeedance2p0MiniImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Seedance 2.0 Mini image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bytedance.seedance2p0.mini.imageToVideo;
    expect(leaf).toBe(
      provider.post.run.bytedance.seedance2p0.mini.imageToVideo
    );
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // The mini object is new here, beside the fast and us objects.
    expect(provider.run.bytedance.seedance2p0.fast.imageToVideo).not.toBe(leaf);
    expect(provider.run.bytedance.seedance2p0.us.imageToVideo).not.toBe(leaf);
    expectTypeOf(
      provider.run.bytedance.seedance2p0.mini
    ).toEqualTypeOf<FalRunBytedanceSeedance2p0MiniNamespace>();
    expectTypeOf<FalSeedance2p0MiniImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalSeedance2p0MiniImageToVideoRequestInput>().toEqualTypeOf<FalSeedance2p0MiniImageToVideoRequest>();
    expectTypeOf<FalSeedance2p0MiniImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<
      FalSeedance2p0MiniImageToVideoResponse["seed"]
    >().toEqualTypeOf<number>();
    expectTypeOf<
      FalSeedance2p0MiniImageToVideoResponse["video"]["url"]
    >().toEqualTypeOf<string>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/out.mp4" },
        seed: 42,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.bytedance.seedance2p0.mini.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(result.seed).toBe(42);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.0/mini/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order, without bitrate_mode", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_url",
      "end_image_url",
      "resolution",
      "duration",
      "aspect_ratio",
      "generate_audio",
      "codec",
      "end_user_id",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The text prompt describing the desired motion and action for the video."
    );
    expect(schema.shape.resolution.description).toBe(
      "Video resolution - 480p for faster generation, 720p for balance."
    );
    expect(schema.shape.codec.description).toBe(
      "'auto' retains default video codec behaviour; 'H264' uses H.264; 'H265' uses H.265."
    );
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
    }
  });

  it("requires the prompt and the image and applies the documented defaults", () => {
    const minimal = {
      prompt: recorded.prompt,
      image_url: recorded.image_url,
    };
    expect(schema.parse(minimal)).toStrictEqual({
      ...minimal,
      resolution: "720p",
      duration: "auto",
      aspect_ratio: "auto",
      generate_audio: true,
      codec: "auto",
    });
    expect(schema.safeParse({ prompt: recorded.prompt }).success).toBe(false);
    expect(schema.safeParse({ image_url: recorded.image_url }).success).toBe(
      false
    );
  });

  it("accepts a last frame and an end user id, or null for either", () => {
    expect(accepts({ end_image_url: "https://example.com/end.jpg" })).toBe(
      true
    );
    expect(accepts({ end_image_url: null })).toBe(true);
    expect(accepts({ end_user_id: "user-1" })).toBe(true);
    expect(accepts({ end_user_id: null })).toBe(true);
  });

  it.each(["480p", "720p"])("accepts resolution %s", (resolution) =>
    expect(accepts({ resolution })).toBe(true)
  );

  it.each(["1080p", "4k", "480P", ""])("rejects resolution %s", (resolution) =>
    expect(accepts({ resolution })).toBe(false)
  );

  it("accepts auto or 4 to 15 whole seconds, as strings", () => {
    expect(accepts({ duration: "auto" })).toBe(true);
    for (let s = 4; s <= 15; s += 1) {
      expect(accepts({ duration: String(s) }), String(s)).toBe(true);
    }
    expect(accepts({ duration: "3" })).toBe(false);
    expect(accepts({ duration: "16" })).toBe(false);
    expect(accepts({ duration: 4 })).toBe(false);
  });

  it.each(["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])(
    "accepts aspect ratio %s",
    (aspect_ratio) => expect(accepts({ aspect_ratio })).toBe(true)
  );

  it("rejects an undocumented aspect ratio, codec or bitrate mode value", () => {
    expect(accepts({ aspect_ratio: "2:1" })).toBe(false);
    expect(accepts({ codec: "VP9" })).toBe(false);
    expect("bitrate_mode" in schema.shape).toBe(false);
  });

  // Static token pricing, as 2.0 Fast: 0.007 USD per 1000 tokens at 480p and
  // 720p, tokens = width x height x (24 x seconds + 1) / 1024. The recorded
  // call billed x-fal-billable-units 38.8 (thousand tokens), 0.2716 USD.
  it("prices the recorded request exactly as billed", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]).toBeDefined();
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.warnings).toEqual([]);
    expect(estimate.breakdown).toMatchObject({ units: 38800, unit: "tokens" });
    expect(estimate.usd).toBeCloseTo(0.2716, 10);
  });

  it("prices 720p at the same per-token rate", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, resolution: "720p" },
    });
    // 960 x 960 x 97 / 1024 = 87,300 tokens.
    expect(estimate.breakdown).toMatchObject({ units: 87300 });
    expect(estimate.usd).toBeCloseTo(0.6111, 10);
  });

  it("warns instead of guessing when the model picks the size or length", () => {
    const autoRatio = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, aspect_ratio: "auto" },
    });
    expect(autoRatio.usd).toBe(0);
    expect(autoRatio.warnings[0]).toContain('aspect_ratio "auto"');
    const autoDuration = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, duration: "auto" },
    });
    expect(autoDuration.usd).toBe(0);
    expect(autoDuration.warnings[0]).toContain('duration "auto"');
  });

  it("shares the Seedance 2 Mini slug and name", () => {
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("sd2m");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Seedance 2 Mini"
    );
  });
});
