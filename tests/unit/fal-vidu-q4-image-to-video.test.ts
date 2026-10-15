import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalRunNamespace,
  type FalRunViduNamespace,
  type FalRunViduQ4Namespace,
  type FalViduQ4ImageToVideoParsedRequest,
  type FalViduQ4ImageToVideoRequest,
  type FalViduQ4ImageToVideoRequestInput,
  type FalViduQ4ImageToVideoResponse,
} from "@apicity/fal";
import {
  FalViduQ4ImageToVideoRequestSchema as schema,
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
// (sha256 6d9c73eca933c4393df207f09673c106c7d141ee3c8f051ff1439ba18ba8acb8)
// and the free 422 probes of the same day.
const endpoint = "fal-ai/vidu/q4/image-to-video";
// The recorded call. The integration test sends tests/fixtures/cat1.jpg as a
// data URL with the prompt from tests/integration/kie-vidu-q4-image-to-video.test.ts;
// a short URL stands in for the image here.
const recorded = {
  image_url: "https://example.com/cat1.jpg",
  prompt:
    "The white cat looks toward the camera, blinks slowly, and gently tilts its head.",
  duration: 3,
  resolution: "540p",
} satisfies FalViduQ4ImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Vidu Q4 image-to-video contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.vidu.q4.imageToVideo;
    expect(leaf).toBe(provider.post.run.vidu.q4.imageToVideo);
    expect(provider.run.vidu).toHaveProperty("q4", provider.run.vidu.q4);
    expect(provider.run.vidu.q4).toHaveProperty("imageToVideo", leaf);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<
      FalRunNamespace["vidu"]
    >().toEqualTypeOf<FalRunViduNamespace>();
    expectTypeOf<
      FalRunViduNamespace["q4"]
    >().toEqualTypeOf<FalRunViduQ4Namespace>();
    expectTypeOf(leaf).toEqualTypeOf<FalRunViduQ4Namespace["imageToVideo"]>();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalViduQ4ImageToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalViduQ4ImageToVideoResponse>();
    expectTypeOf<FalViduQ4ImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalViduQ4ImageToVideoRequestInput>().toEqualTypeOf<FalViduQ4ImageToVideoRequest>();
    expectTypeOf<FalViduQ4ImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalViduQ4ImageToVideoResponse>().toEqualTypeOf<{
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
        video: { url: "https://example.com/cat.mp4" },
        cover_image: null,
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.vidu.q4.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/cat.mp4");
    expect(result.cover_image).toBeNull();
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/fal-ai/vidu/q4/image-to-video");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only image_url and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_url",
      "duration",
      "seed",
      "resolution",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ image_url: recorded.image_url })).toEqual({
      prompt: "",
      image_url: recorded.image_url,
      duration: 5,
      resolution: "720p",
      enable_safety_checker: true,
    });
    // fal's validator answered a body without image_url with one "missing"
    // error for image_url alone (free 422 probe, 2026-10-15).
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["image_url"],
    ]);
    for (const imageUrl of [null, 1, {}])
      expect(accepts({ image_url: imageUrl })).toBe(false);
    // The same probe series showed an undocumented field is ignored.
    expect(accepts({ unknown_field: true })).toBe(true);
  });

  it("bounds prompt at five thousand characters", () => {
    for (const prompt of ["", "a", "a".repeat(5000)])
      expect(accepts({ prompt })).toBe(true);
    // 5001 characters is the value fal's validator refused on 2026-10-15.
    for (const prompt of ["a".repeat(5001), null, 1])
      expect(accepts({ prompt })).toBe(false);
  });

  it("bounds duration at three to sixteen whole seconds", () => {
    for (const duration of [3, 5, 16]) expect(accepts({ duration })).toBe(true);
    // 2, 17 and 3.5 are the values fal's validator refused on 2026-10-15.
    for (const duration of [2, 17, 3.5, "5", null])
      expect(accepts({ duration })).toBe(false);
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

  it("takes enable_safety_checker as a boolean", () => {
    for (const value of [true, false])
      expect(accepts({ enable_safety_checker: value })).toBe(true);
    for (const value of ["true", 1, null, {}])
      expect(accepts({ enable_safety_checker: value })).toBe(false);
  });

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
        payload: { image_url: recorded.image_url },
      }).usd
    ).toBeCloseTo(0.475, 10);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/fal-ai/vidu/q4/image-to-video",
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
