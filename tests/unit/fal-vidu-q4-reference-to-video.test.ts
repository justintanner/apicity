import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalRunViduQ4Namespace,
  type FalViduQ4ReferenceToVideoParsedRequest,
  type FalViduQ4ReferenceToVideoRequest,
  type FalViduQ4ReferenceToVideoRequestInput,
  type FalViduQ4ReferenceToVideoResponse,
} from "@apicity/fal";
import {
  FalViduQ4ReferenceToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-15
// (sha256 6e7d7ffccca066c5971c586e7ee4da9d15c97987b694c90f4010ef50cab096d2)
// and the free 422 probes of the same day.
const endpoint = "fal-ai/vidu/q4/reference-to-video";
// The recorded call. The integration test sends tests/fixtures/beach.png and
// tests/fixtures/cat2.jpg as data URLs with the prompt from
// tests/integration/kie-vidu-q4-reference-to-video.test.ts; short URLs stand
// in for the images here.
const recorded = {
  prompt:
    "In the scene of [@reference_image_1], the white cat from [@reference_image_2] sits on the wet sand, blinks, and turns its head toward the waves.",
  reference_image_urls: [
    "https://example.com/beach.png",
    "https://example.com/cat2.jpg",
  ],
  duration: 3,
  resolution: "540p",
  audio: false,
} satisfies FalViduQ4ReferenceToVideoRequest;

const urls = (count: number, ext: string) =>
  Array.from(
    { length: count },
    (_, i) => `https://example.com/ref${i + 1}.${ext}`
  );

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Vidu Q4 reference-to-video contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.vidu.q4.referenceToVideo;
    expect(leaf).toBe(provider.post.run.vidu.q4.referenceToVideo);
    expect(provider.run.vidu.q4).toHaveProperty("referenceToVideo", leaf);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunViduQ4Namespace["referenceToVideo"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalViduQ4ReferenceToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalViduQ4ReferenceToVideoResponse>();
    expectTypeOf<FalViduQ4ReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalViduQ4ReferenceToVideoRequestInput>().toEqualTypeOf<FalViduQ4ReferenceToVideoRequest>();
    expectTypeOf<FalViduQ4ReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalViduQ4ReferenceToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      cover_image?: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      } | null;
      seed: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/beach-cat.mp4" },
        cover_image: null,
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.vidu.q4.referenceToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/beach-cat.mp4");
    expect(result.cover_image).toBeNull();
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/vidu/q4/reference-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only prompt and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "reference_image_urls",
      "reference_audio_urls",
      "duration",
      "seed",
      "aspect_ratio",
      "resolution",
      "audio",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ prompt: recorded.prompt })).toEqual({
      prompt: recorded.prompt,
      duration: 5,
      aspect_ratio: "16:9",
      resolution: "720p",
      audio: false,
      enable_safety_checker: true,
    });
    // fal's validator answered a body without prompt with one "missing" error
    // for prompt alone, and passed a prompt with no references at field level
    // (free 422 probes, 2026-10-15).
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["prompt"],
    ]);
    // The same probe series showed an undocumented field is ignored.
    expect(accepts({ unknown_field: true })).toBe(true);
  });

  it("bounds prompt at one to five thousand characters", () => {
    for (const prompt of ["a", "a".repeat(5000)])
      expect(accepts({ prompt })).toBe(true);
    // "" and 5001 characters are the values fal's validator refused on 2026-10-15.
    for (const prompt of ["", "a".repeat(5001), null, 1])
      expect(accepts({ prompt })).toBe(false);
  });

  it("takes up to twelve reference images", () => {
    for (const count of [0, 1, 12])
      expect(accepts({ reference_image_urls: urls(count, "png") })).toBe(true);
    expect(schema.parse({ prompt: "a" }).reference_image_urls).toBeUndefined();
    // fal's validator refused 13 with "Maximum 12 reference images are
    // allowed", and refused a bare string, on 2026-10-15.
    for (const value of [
      urls(13, "png"),
      "https://example.com/ref1.png",
      [1],
      null,
    ])
      expect(accepts({ reference_image_urls: value })).toBe(false);
  });

  it("takes up to three reference audio clips", () => {
    for (const count of [0, 1, 3])
      expect(accepts({ reference_audio_urls: urls(count, "mp3") })).toBe(true);
    // fal's validator refused 4 with "Maximum 3 reference audio clips are
    // allowed", and refused a non-string item, on 2026-10-15.
    for (const value of [urls(4, "mp3"), [1], "voice.mp3", null])
      expect(accepts({ reference_audio_urls: value })).toBe(false);
  });

  it("bounds duration at three to sixteen whole seconds", () => {
    for (const duration of [3, 5, 16]) expect(accepts({ duration })).toBe(true);
    // 2, 17 and 3.5 are the values fal's validator refused on 2026-10-15.
    for (const duration of [2, 17, 3.5, "5", null])
      expect(accepts({ duration })).toBe(false);
  });

  it("accepts only the documented aspect ratios", () => {
    for (const ratio of ["16:9", "9:16", "4:3", "3:4", "1:1"])
      expect(accepts({ aspect_ratio: ratio })).toBe(true);
    // "21:9" and "2:1" are the values fal's validator refused on 2026-10-15.
    for (const ratio of ["21:9", "2:1", "auto", null])
      expect(accepts({ aspect_ratio: ratio })).toBe(false);
  });

  it("accepts only the documented resolutions, case-sensitively", () => {
    for (const resolution of ["540p", "720p", "1080p", "2K", "4K"])
      expect(accepts({ resolution })).toBe(true);
    // "2k" and "8K" are the values fal's validator refused on 2026-10-15.
    for (const resolution of ["2k", "8K", "480p", "1080P", null])
      expect(accepts({ resolution })).toBe(false);
  });

  it("takes an integer or null seed", () => {
    for (const seed of [0, 42, null]) expect(accepts({ seed })).toBe(true);
    expect(schema.parse(recorded).seed).toBeUndefined();
    for (const seed of [1.5, "42", {}]) expect(accepts({ seed })).toBe(false);
  });

  it.each(["audio", "enable_safety_checker"])(
    "takes %s as a boolean",
    (field) => {
      for (const value of [true, false])
        expect(accepts({ [field]: value })).toBe(true);
      for (const value of ["true", 1, null, {}])
        expect(accepts({ [field]: value })).toBe(false);
    }
  );

  it("prices the recorded payload at the list rate", () => {
    // The recorded call billed 27 units of $0.0035 ($0.0945), the card's
    // promotional $0.0315/s at 540p; the entry carries the $0.045/s list rate.
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.135, 10);
    expect(estimate.warnings).toEqual([]);
  });

  it("charges the same with audio on or off", () => {
    for (const audio of [true, false]) {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, audio },
      });
      expect(estimate.usd).toBeCloseTo(0.135, 10);
      expect(estimate.warnings).toEqual([]);
    }
  });

  it.each([
    ["540p", 0.045],
    ["720p", 0.095],
    ["1080p", 0.12],
    ["2K", 0.19],
    ["4K", 0.39],
  ])("bills %s at $%s per requested second", (resolution, rate) => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, resolution, duration: 16 },
    });
    expect(estimate.usd).toBeCloseTo(rate * 16, 10);
    expect(estimate.warnings).toEqual([]);
  });

  it("prices the default five seconds at 720p", () => {
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { prompt: recorded.prompt },
      }).usd
    ).toBeCloseTo(0.475, 10);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/fal-ai/vidu/q4/reference-to-video",
      asOf: "2026-10-15",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "viduq4"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Vidu Q4"
    );
  });
});
