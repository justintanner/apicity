import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalAlibabaHappyHorseReferenceToVideoParsedRequest,
  type FalAlibabaHappyHorseReferenceToVideoRequest,
  type FalAlibabaHappyHorseReferenceToVideoRequestInput,
  type FalAlibabaHappyHorseReferenceToVideoResponse,
} from "@apicity/fal";
import {
  FalAlibabaHappyHorseReferenceToVideoRequestSchema as schema,
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
// (sha256 273b084e9ee70e333a94d35a0abf6e212eb2fc7a96ccb9200ff64f5793b3610a)
// and the unbilled 422 probes of the same day.
const endpoint = "alibaba/happy-horse/reference-to-video";
const image = "https://example.com/cat1.jpg";
const recorded = {
  prompt: "character1 slowly blinks, static camera.",
  image_urls: [image],
  resolution: "720p",
  duration: 3,
} satisfies FalAlibabaHappyHorseReferenceToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function issues(body: Record<string, unknown>): string[] {
  const result = schema.safeParse({ ...recorded, ...body });
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("Happy Horse reference-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.alibaba.happyHorse.referenceToVideo;
    expect(leaf).toBe(provider.post.run.alibaba.happyHorse.referenceToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalAlibabaHappyHorseReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseReferenceToVideoRequestInput>().toEqualTypeOf<FalAlibabaHappyHorseReferenceToVideoRequest>();
    expectTypeOf<FalAlibabaHappyHorseReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseReferenceToVideoResponse>().toEqualTypeOf<{
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
    const result =
      await provider.run.alibaba.happyHorse.referenceToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/alibaba/happy-horse/reference-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the prompt and references and applies the defaults", () => {
    expect(
      schema.parse({ prompt: "A horse.", image_urls: [image] })
    ).toStrictEqual({
      prompt: "A horse.",
      image_urls: [image],
      aspect_ratio: "16:9",
      resolution: "1080p",
      duration: 5,
      enable_safety_checker: true,
    });
    expect(schema.safeParse({ prompt: "A horse." }).success).toBe(false);
    expect(schema.safeParse({ image_urls: [image] }).success).toBe(false);
    expect(accepts({ prompt: "" })).toBe(false);
  });

  it("takes 1 to 9 references, each an http(s) URL or a data URI", () => {
    expect(accepts({ image_urls: Array(9).fill(image) })).toBe(true);
    expect(issues({ image_urls: [] })).toEqual([
      "At least 1 reference image is required",
    ]);
    expect(issues({ image_urls: Array(10).fill(image) })).toEqual([
      "Maximum 9 reference images allowed",
    ]);
    for (const url of ["http://example.com/a.jpg", "data:image/jpeg;base64,AA"])
      expect(accepts({ image_urls: [url] }), url).toBe(true);
    for (const url of ["", "ftp://example.com/a.jpg", "HTTPS://EXAMPLE.COM/a"])
      expect(accepts({ image_urls: [url] }), url).toBe(false);
  });

  it("takes the five 1.0 aspect ratios, 3 to 15 s and the two resolutions", () => {
    for (const aspect_ratio of ["16:9", "9:16", "1:1", "4:3", "3:4"])
      expect(accepts({ aspect_ratio }), aspect_ratio).toBe(true);
    for (const aspect_ratio of ["21:9", "9:21", "5:4", "4:5"])
      expect(accepts({ aspect_ratio }), aspect_ratio).toBe(false);
    for (let duration = 3; duration <= 15; duration++)
      expect(accepts({ duration }), String(duration)).toBe(true);
    for (const duration of [2, 16, "5"])
      expect(accepts({ duration }), String(duration)).toBe(false);
    for (const resolution of ["720p", "1080p"])
      expect(accepts({ resolution })).toBe(true);
    expect(accepts({ resolution: "480p" })).toBe(false);
  });

  it("describes every documented field, in upstream's order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_urls",
      "aspect_ratio",
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

describe("Happy Horse reference-to-video pricing", () => {
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
        payload: { prompt: "x", image_urls: [image] },
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
