import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalRunBytedanceSeedance2p0MiniNamespace,
  type FalSeedance2p0MiniReferenceToVideoParsedRequest,
  type FalSeedance2p0MiniReferenceToVideoRequest,
  type FalSeedance2p0MiniReferenceToVideoRequestInput,
  type FalSeedance2p0MiniReferenceToVideoResponse,
} from "@apicity/fal";
import {
  FalSeedance2p0MiniReferenceToVideoRequestSchema as schema,
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
// (sha256 d74c296efb90bd55ae0f1936bdd22be6097d4e91d70b1da66df81a0533da6965).
const endpoint = "bytedance/seedance-2.0/mini/reference-to-video";
// The recording sends tests/fixtures/cat1.jpg as a data URL; a short URL
// stands in for it here, since these checks never reach fal.
const recorded = {
  prompt: "The cat from the reference sits on a windowsill and blinks.",
  image_urls: ["https://example.com/cat1.jpg"],
  resolution: "480p",
  duration: "4",
  aspect_ratio: "1:1",
  generate_audio: false,
} satisfies FalSeedance2p0MiniReferenceToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

const urls = (n: number, kind: string) =>
  Array.from({ length: n }, (_, i) => `https://example.com/${kind}${i}`);

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Seedance 2.0 Mini reference-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bytedance.seedance2p0.mini.referenceToVideo;
    expect(leaf).toBe(
      provider.post.run.bytedance.seedance2p0.mini.referenceToVideo
    );
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // A leaf on the mini object, beside imageToVideo.
    expect(provider.run.bytedance.seedance2p0.mini.imageToVideo).not.toBe(leaf);
    expect(provider.run.bytedance.seedance2p0.fast.referenceToVideo).not.toBe(
      leaf
    );
    expectTypeOf(
      provider.run.bytedance.seedance2p0.mini
    ).toEqualTypeOf<FalRunBytedanceSeedance2p0MiniNamespace>();
    expectTypeOf<FalSeedance2p0MiniReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalSeedance2p0MiniReferenceToVideoRequestInput>().toEqualTypeOf<FalSeedance2p0MiniReferenceToVideoRequest>();
    expectTypeOf<FalSeedance2p0MiniReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<
      FalSeedance2p0MiniReferenceToVideoResponse["seed"]
    >().toEqualTypeOf<number>();
    expectTypeOf<
      FalSeedance2p0MiniReferenceToVideoResponse["video"]["url"]
    >().toEqualTypeOf<string>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/out.mp4" },
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.bytedance.seedance2p0.mini.referenceToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.0/mini/reference-to-video"
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
      "image_urls",
      "video_urls",
      "audio_urls",
      "resolution",
      "duration",
      "aspect_ratio",
      "generate_audio",
      "codec",
      "end_user_id",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The text prompt used to generate the video."
    );
    expect(schema.shape.image_urls.description).toContain("@Image1");
    expect(schema.shape.video_urls.description).toContain("@Video1");
    expect(schema.shape.audio_urls.description).toContain("@Audio1");
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
    }
  });

  it("requires only the prompt and applies the documented defaults", () => {
    expect(schema.parse({ prompt: recorded.prompt })).toStrictEqual({
      prompt: recorded.prompt,
      resolution: "720p",
      duration: "auto",
      aspect_ratio: "auto",
      generate_audio: true,
      codec: "auto",
    });
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("bounds each reference list and the files across them", () => {
    expect(accepts({ image_urls: urls(9, "i") })).toBe(true);
    expect(accepts({ image_urls: urls(10, "i") })).toBe(false);
    expect(accepts({ video_urls: urls(3, "v") })).toBe(true);
    expect(accepts({ video_urls: urls(4, "v") })).toBe(false);
    expect(accepts({ audio_urls: urls(3, "a") })).toBe(true);
    expect(accepts({ audio_urls: urls(4, "a") })).toBe(false);
    // 9 + 3 = 12 files is the most; 9 + 3 + 1 is one too many.
    expect(
      accepts({ image_urls: urls(9, "i"), video_urls: urls(3, "v") })
    ).toBe(true);
    expect(
      accepts({
        image_urls: urls(9, "i"),
        video_urls: urls(3, "v"),
        audio_urls: urls(1, "a"),
      })
    ).toBe(false);
  });

  it("refuses audio references without an image or a video", () => {
    expect(
      schema.safeParse({ prompt: "x", audio_urls: urls(1, "a") }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        prompt: "x",
        audio_urls: urls(1, "a"),
        video_urls: urls(1, "v"),
      }).success
    ).toBe(true);
  });

  it("closes resolution, duration and aspect ratio to the documented values", () => {
    expect(accepts({ resolution: "720p" })).toBe(true);
    expect(accepts({ resolution: "1080p" })).toBe(false);
    expect(accepts({ duration: "15" })).toBe(true);
    expect(accepts({ duration: "3" })).toBe(false);
    expect(accepts({ aspect_ratio: "21:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "2:1" })).toBe(false);
    expect("bitrate_mode" in schema.shape).toBe(false);
  });

  // Static token pricing for image references alone: 0.007 USD per 1000
  // tokens at 480p and 720p, tokens = width x height x (24 x seconds + 1) /
  // 1024. The recorded call billed x-fal-billable-units 38.8 (thousand
  // tokens), 0.2716 USD, which fal's usage API confirms.
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

  it("prices a prompt with no references at the same rate", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, image_urls: [] },
    });
    expect(estimate.usd).toBeCloseTo(0.2716, 10);
  });

  // The card bills video references at $0.0042 per 1000 on input plus output
  // tokens; no call has recorded that, or what audio references do.
  it.each([
    ["a video reference", { video_urls: urls(1, "v") }],
    ["an audio reference", { audio_urls: urls(1, "a") }],
  ])("fails closed on %s", (_label, refs) => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, ...refs },
      costHints: { inputDurationSeconds: 5 },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings[0]).toContain(
      "only a request whose references are images alone is priced"
    );
  });

  it("warns instead of guessing when the model picks the size or length", () => {
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, aspect_ratio: "auto" },
      }).warnings[0]
    ).toContain('aspect_ratio "auto"');
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, duration: "auto" },
      }).warnings[0]
    ).toContain('duration "auto"');
  });

  it("shares the Seedance 2 Mini slug and name", () => {
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("sd2m");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Seedance 2 Mini"
    );
  });
});
