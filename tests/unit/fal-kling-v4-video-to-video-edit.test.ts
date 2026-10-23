import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKlingV4VideoToVideoEditParsedRequest,
  type FalKlingV4VideoToVideoEditRequest,
  type FalKlingV4VideoToVideoEditRequestInput,
  type FalKlingV4VideoToVideoEditResponse,
  type FalRunKlingV4VideoToVideoNamespace,
} from "@apicity/fal";
import {
  FalKlingV4VideoToVideoEditRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-23
// (sha256 6b77dabd8cb452df550e38c2a03125a725c2f26ba13b993d53863ce7509090e2).
const endpoint = "kling/v4/video-to-video/edit";
const recorded = {
  prompt: "Make it snow in @Video1.",
  video_url: "https://example.com/clip.mp4",
  resolution: "720p",
} satisfies FalKlingV4VideoToVideoEditRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("Kling 4 video edit contract", () => {
  it("owns the videoToVideo object under v4, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.kling.v4.videoToVideo.edit;
    expect(provider.run.kling.v4.videoToVideo).toHaveProperty("edit", leaf);
    expect(provider.run.kling.v4).toHaveProperty("textToVideo");
    expect(leaf).toBe(provider.post.run.kling.v4.videoToVideo.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.kling.v4.videoToVideo
    ).toEqualTypeOf<FalRunKlingV4VideoToVideoNamespace>();
    expectTypeOf<FalKlingV4VideoToVideoEditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKlingV4VideoToVideoEditRequestInput>().toEqualTypeOf<FalKlingV4VideoToVideoEditRequest>();
    expectTypeOf<FalKlingV4VideoToVideoEditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKlingV4VideoToVideoEditResponse>().toEqualTypeOf<{
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
    await provider.run.kling.v4.videoToVideo.edit(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/kling/v4/video-to-video/edit");
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
      "video_url",
      "image_urls",
      "elements",
      "duration",
      "resolution",
    ]);
    expect(
      schema.parse({ prompt: "x", video_url: "https://example.com/v.mp4" })
    ).toEqual({
      prompt: "x",
      video_url: "https://example.com/v.mp4",
      resolution: "1080p",
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ prompt: "x" }).success).toBe(false);
    expect(accepts({ video_url: "x" })).toBe(false);
    expect(accepts({ image_urls: ["x"] })).toBe(false);
    expect(
      accepts({ image_urls: Array(11).fill("https://example.com/a.png") })
    ).toBe(false);
    expect(accepts({ duration: 2 })).toBe(false);
    expect(accepts({ duration: 30 })).toBe(true);
    expect(accepts({ duration: null })).toBe(true);
    expect(
      accepts({
        elements: [
          {
            frontal_image_url: "https://example.com/f.png",
            reference_image_urls: ["https://example.com/r.png"],
          },
        ],
      })
    ).toBe(true);
    expect(
      accepts({
        elements: [
          {
            frontal_image_url: "https://example.com/f.png",
            reference_image_urls: [],
          },
        ],
      })
    ).toBe(false);
    expect(accepts({ elements: [{ foo: 1 }] })).toBe(false);
    const element = {
      frontal_image_url: "https://example.com/f.png",
      reference_image_urls: ["https://example.com/r.png"],
    };
    expect(
      accepts({
        elements: [
          {
            ...element,
            reference_image_urls: Array(4).fill("https://example.com/r.png"),
          },
        ],
      })
    ).toBe(false);
    expect(accepts({ elements: [{ ...element, foo: 1 }] })).toBe(true);
    expect(accepts({ elements: Array(8).fill(element) })).toBe(false);
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ prompt: "x".repeat(26001) })).toBe(false);
    expect(accepts({ duration: 31 })).toBe(false);
    expect(accepts({ image_urls: null, elements: null })).toBe(true);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("is dynamically priced: the source video's length is billed too", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Kling 4 Video Edit"
    );
    // The recording billed 3.6175 units ($0.568) for 3.04 s in and 3.04 s out.
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe(
      "units at $0.157, with the card quoting $0.094 (720p) or $0.141 (1080p) per second of input plus output video, at least twice the output"
    );
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("pricing/estimate");
  });
});
