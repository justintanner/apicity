import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalAlibabaHappyHorseImageToVideoParsedRequest,
  type FalAlibabaHappyHorseImageToVideoRequest,
  type FalAlibabaHappyHorseImageToVideoRequestInput,
  type FalAlibabaHappyHorseImageToVideoResponse,
} from "@apicity/fal";
import {
  FalAlibabaHappyHorseImageToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-31
// (sha256 93960e9d97e21a4681e2671bca46adb9f6c79a1fa10296f0762b44264e2f8d7a)
// and the unbilled 422 probes of the same day.
const endpoint = "alibaba/happy-horse/image-to-video";
const recorded = {
  image_url: "https://example.com/cat1.jpg",
  prompt: "The cat slowly blinks.",
  resolution: "720p",
  duration: 3,
} satisfies FalAlibabaHappyHorseImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("Happy Horse image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.alibaba.happyHorse.imageToVideo;
    expect(leaf).toBe(provider.post.run.alibaba.happyHorse.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalAlibabaHappyHorseImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseImageToVideoRequestInput>().toEqualTypeOf<FalAlibabaHappyHorseImageToVideoRequest>();
    expectTypeOf<FalAlibabaHappyHorseImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseImageToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
        fps?: number | null;
        duration?: number | null;
        num_frames?: number | null;
      };
      seed: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          video: { url: "https://example.com/out.mp4" },
          seed: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.alibaba.happyHorse.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/alibaba/happy-horse/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the first frame, takes an optional prompt and applies the defaults", () => {
    expect(schema.parse({ image_url: recorded.image_url })).toStrictEqual({
      image_url: recorded.image_url,
      resolution: "1080p",
      duration: 5,
      enable_safety_checker: true,
    });
    expect(schema.safeParse({ prompt: "x" }).success).toBe(false);
    expect(accepts({ prompt: null })).toBe(true);
  });

  it("takes an http(s) URL or a data URI, as upstream's validator does", () => {
    for (const image_url of [
      "https://example.com/a.jpg",
      "http://example.com/a.jpg",
      "data:image/jpeg;base64,AAAA",
    ])
      expect(accepts({ image_url }), image_url).toBe(true);
    for (const image_url of [
      "",
      "ftp://example.com/a.jpg",
      "HTTPS://EXAMPLE.COM/a.jpg",
    ])
      expect(accepts({ image_url }), image_url).toBe(false);
  });

  it("takes 3 to 15 whole seconds and the two resolutions", () => {
    for (let duration = 3; duration <= 15; duration++)
      expect(accepts({ duration }), String(duration)).toBe(true);
    for (const duration of [2, 16, 3.5, "5"])
      expect(accepts({ duration }), String(duration)).toBe(false);
    for (const resolution of ["720p", "1080p"])
      expect(accepts({ resolution })).toBe(true);
    for (const resolution of ["480p", "720P"])
      expect(accepts({ resolution })).toBe(false);
  });

  it("describes every documented field, in upstream's order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "image_url",
      "prompt",
      "resolution",
      "duration",
      "seed",
      "enable_safety_checker",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
    }
  });
});

describe("Happy Horse image-to-video pricing", () => {
  // The recorded 3 s 720p call billed x-fal-billable-units 3, $0.42.
  it("bills the requested seconds at the resolution's rate", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source.asOf).toBe("2026-10-31");
    const priced = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(priced.usd).toBeCloseTo(0.42, 10);
    expect(priced.breakdown.units).toBe(3);
    expect(priced.warnings).toEqual([]);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { image_url: recorded.image_url },
      }).usd
    ).toBeCloseTo(1.4, 10);
  });

  it("carries the HappyHorse 1.0 slug and a display name", () => {
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("hh");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Happy Horse"
    );
  });
});
