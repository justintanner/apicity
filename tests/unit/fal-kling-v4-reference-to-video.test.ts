import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKlingV4ReferenceToVideoParsedRequest,
  type FalKlingV4ReferenceToVideoRequest,
  type FalKlingV4ReferenceToVideoRequestInput,
  type FalKlingV4ReferenceToVideoResponse,
  type FalRunKlingV4Namespace,
} from "@apicity/fal";
import {
  FalKlingV4ReferenceToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-23
// (sha256 3ff67e55f550d7d72418efb1a5fffed687cefd75697c47228e07810bfad583ff).
const endpoint = "kling/v4/reference-to-video";
const recorded = {
  prompt: "@Image1 waves once, then holds still.",
  image_urls: ["https://example.com/cat1.jpg"],
  duration: 3,
  resolution: "720p",
} satisfies FalKlingV4ReferenceToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

const usd = (payload: Record<string, unknown>) =>
  computeEstimate({ provider: "fal", endpoint, payload }).usd;

describe("Kling 4 reference-to-video contract", () => {
  it("adds referenceToVideo to the v4 object, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.kling.v4.referenceToVideo;
    expect(provider.run.kling.v4).toHaveProperty("referenceToVideo", leaf);
    expect(provider.run.kling.v4).toHaveProperty("imageToVideo");
    expect(leaf).toBe(provider.post.run.kling.v4.referenceToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.kling.v4).toEqualTypeOf<FalRunKlingV4Namespace>();
    expectTypeOf<FalKlingV4ReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKlingV4ReferenceToVideoRequestInput>().toEqualTypeOf<FalKlingV4ReferenceToVideoRequest>();
    expectTypeOf<FalKlingV4ReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKlingV4ReferenceToVideoResponse>().toEqualTypeOf<{
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
        new Response(
          JSON.stringify({ video: { url: "https://example.com/out.mp4" } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.kling.v4.referenceToVideo(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/kling/v4/reference-to-video");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "multi_prompt",
      "duration",
      "start_image_url",
      "image_urls",
      "video_urls",
      "elements",
      "resolution",
      "aspect_ratio",
    ]);
    expect(schema.parse({ prompt: "x" })).toEqual({
      prompt: "x",
      duration: 5,
      resolution: "1080p",
      aspect_ratio: "16:9",
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(accepts({ aspect_ratio: "auto" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:3" })).toBe(false);
    expect(
      accepts({ image_urls: Array(11).fill("https://example.com/a.png") })
    ).toBe(false);
    expect(
      accepts({ video_urls: Array(6).fill("https://example.com/v.mp4") })
    ).toBe(false);
    expect(accepts({ image_urls: ["x"] })).toBe(false);
    expect(accepts({ start_image_url: "z" })).toBe(false);
    expect(accepts({ video_urls: ["y"] })).toBe(false);
    const image = {
      frontal_image_url: "https://example.com/f.png",
      reference_image_urls: ["https://example.com/r.png"],
    };
    const video = { video_url: "https://example.com/v.mp4" };
    expect(accepts({ elements: [image] })).toBe(true);
    expect(accepts({ elements: [video] })).toBe(true);
    expect(accepts({ elements: [{ ...image, ...video }] })).toBe(false);
    // An image element needs a frontal image and at least one reference;
    // either one alone fails, and either one beside a video passes.
    expect(
      accepts({ elements: [{ frontal_image_url: image.frontal_image_url }] })
    ).toBe(false);
    expect(
      accepts({
        elements: [{ reference_image_urls: image.reference_image_urls }],
      })
    ).toBe(false);
    expect(
      accepts({ elements: [{ ...image, reference_image_urls: [] }] })
    ).toBe(false);
    expect(
      accepts({
        elements: [{ frontal_image_url: image.frontal_image_url, ...video }],
      })
    ).toBe(true);
    expect(
      accepts({
        elements: [
          { reference_image_urls: image.reference_image_urls, ...video },
        ],
      })
    ).toBe(true);
    expect(
      accepts({ elements: [{ reference_image_urls: [], ...video }] })
    ).toBe(true);
    expect(accepts({ elements: [{ ...video, voice_id: "v1" }] })).toBe(true);
    expect(accepts({ elements: [{ foo: 1 }] })).toBe(false);
    expect(
      accepts({
        elements: [
          {
            ...image,
            reference_image_urls: Array(4).fill("https://example.com/r.png"),
          },
        ],
      })
    ).toBe(false);
    expect(accepts({ elements: Array(8).fill(image) })).toBe(false);
    expect(accepts({ duration: 31 })).toBe(false);
    expect(
      accepts({
        prompt: null,
        multi_prompt: null,
        start_image_url: null,
        image_urls: null,
        video_urls: null,
        elements: null,
      })
    ).toBe(true);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("prices text and image references per requested second by resolution from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.471, 10);
    expect(estimate.breakdown).toMatchObject({ units: 3, unit: "seconds" });
    expect(estimate.warnings).toEqual([]);
    expect(usd({ prompt: "x" })).toBeCloseTo(1.175, 10);
    // A multi-shot video runs the sum of its shot durations (5 s by default).
    expect(
      usd({
        ...recorded,
        multi_prompt: [{ prompt: "a", duration: 3 }, { prompt: "b" }],
      })
    ).toBeCloseTo(1.256, 10);
    expect(usd({ ...recorded, video_urls: [] })).toBeCloseTo(0.471, 10);
    expect(
      usd({
        ...recorded,
        elements: [
          {
            frontal_image_url: "https://example.com/f.png",
            reference_image_urls: ["https://example.com/r.png"],
          },
        ],
      })
    ).toBeCloseTo(0.471, 10);
  });

  it("warns instead of pricing reference videos and video elements", () => {
    for (const extra of [
      { video_urls: ["https://example.com/v.mp4"] },
      { elements: [{ video_url: "https://example.com/v.mp4" }] },
    ]) {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, ...extra },
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings).toHaveLength(1);
      expect(estimate.warnings[0]).toContain("$0.094/s (720p)");
    }
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/kling/v4/reference-to-video",
      asOf: "2026-10-23",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "kling4"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Kling 4"
    );
  });
});
