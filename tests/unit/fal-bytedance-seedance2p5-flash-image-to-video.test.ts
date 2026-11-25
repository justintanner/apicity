import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBytedanceSeedance2p5FlashImageToVideoParsedRequest,
  type FalBytedanceSeedance2p5FlashImageToVideoRequest,
  type FalBytedanceSeedance2p5FlashImageToVideoRequestInput,
} from "@apicity/fal";
import {
  FalBytedanceSeedance2p5FlashImageToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-11-25
// (Seedance25FlashImageToVideoInput, ac-706s29).
const endpoint = "bytedance/seedance-2.5/flash/image-to-video";
const CAT =
  "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg";
const recorded = {
  prompt: "The cat blinks slowly and turns its head toward the camera.",
  image_url: CAT,
  resolution: "480p",
  duration: "4",
} satisfies FalBytedanceSeedance2p5FlashImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("Seedance 2.5 Flash image-to-video contract", () => {
  it("owns the bytedance.seedance2p5.flash object", () => {
    const provider = createFal({ apiKey: "test-key" });
    const flash = provider.run.bytedance.seedance2p5.flash;
    expect(Object.keys(flash)).toEqual(["imageToVideo", "referenceToVideo"]);
    expect(flash.imageToVideo).toBe(
      provider.post.run.bytedance.seedance2p5.flash.imageToVideo
    );
    expect(flash.imageToVideo.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalBytedanceSeedance2p5FlashImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p5FlashImageToVideoRequestInput>().toEqualTypeOf<FalBytedanceSeedance2p5FlashImageToVideoRequest>();
    expectTypeOf<FalBytedanceSeedance2p5FlashImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          video: { url: "https://example.com/v.mp4" },
          seed: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.bytedance.seedance2p5.flash.imageToVideo(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.5/flash/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_url",
      "end_image_url",
      "resolution",
      "duration",
      "aspect_ratio",
      "generate_audio",
      "bitrate_mode",
      "codec",
      "output_format",
      "return_last_frame",
      "end_user_id",
    ]);
    expect(schema.parse({ image_url: CAT })).toMatchObject({
      resolution: "720p",
      duration: "auto",
      aspect_ratio: "auto",
      generate_audio: true,
      bitrate_mode: "standard",
      codec: "auto",
      output_format: "mp4",
      return_last_frame: false,
    });
  });

  it("accepts the live enums and rejects what Flash does not offer", () => {
    for (const body of [
      { resolution: "720p" },
      { duration: "auto" },
      { duration: "30" },
      { output_format: "mov" },
      { return_last_frame: true },
      { codec: "H265", bitrate_mode: "high" },
      { end_image_url: CAT },
      { prompt: null },
    ]) {
      expect(accepts(body), JSON.stringify(body)).toBe(true);
    }
    for (const body of [
      { resolution: "1080p" },
      { resolution: "4k" },
      { duration: "3" },
      { duration: 4 },
      { output_format: "webm" },
      { aspect_ratio: "16:9" },
      { image_url: undefined },
    ]) {
      expect(accepts(body), JSON.stringify(body)).toBe(false);
    }
  });

  it("is dynamically priced: billed tokens follow the input image", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Seedance 2.5 Flash"
    );
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe("1000 tokens at $0.014");
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings).toHaveLength(1);
    expect(estimate.warnings[0]).toContain("1000 tokens at $0.014");
  });
});
