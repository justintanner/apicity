import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalAlibabaHappyHorseVideoEditParsedRequest,
  type FalAlibabaHappyHorseVideoEditRequest,
  type FalAlibabaHappyHorseVideoEditRequestInput,
  type FalAlibabaHappyHorseVideoEditResponse,
} from "@apicity/fal";
import {
  FalAlibabaHappyHorseVideoEditRequestSchema as schema,
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
// (sha256 09b7bf1c49675e4031b99e43fd365628d7deab19aa0bc8432e6374b1d5d91b12)
// and the unbilled 422 probes of the same day.
const endpoint = "alibaba/happy-horse/video-edit";
const recorded = {
  video_url: "https://example.com/source.mp4",
  prompt: "Make the cat's fur bright orange.",
  resolution: "720p",
  audio_setting: "origin",
} satisfies FalAlibabaHappyHorseVideoEditRequest;
const image = "https://example.com/reference.jpg";

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("Happy Horse video edit contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.alibaba.happyHorse.videoEdit;
    expect(leaf).toBe(provider.post.run.alibaba.happyHorse.videoEdit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(Object.keys(provider.run.alibaba.happyHorse)).toEqual([
      "v1p1",
      "videoEdit",
      "textToVideo",
      "imageToVideo",
    ]);
    expectTypeOf<FalAlibabaHappyHorseVideoEditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseVideoEditRequestInput>().toEqualTypeOf<FalAlibabaHappyHorseVideoEditRequest>();
    expectTypeOf<FalAlibabaHappyHorseVideoEditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseVideoEditResponse>().toEqualTypeOf<{
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
    const result = await provider.run.alibaba.happyHorse.videoEdit(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/alibaba/happy-horse/video-edit");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the source video and prompt and applies the defaults", () => {
    expect(
      schema.parse({ video_url: recorded.video_url, prompt: "Edit it." })
    ).toStrictEqual({
      video_url: recorded.video_url,
      prompt: "Edit it.",
      resolution: "1080p",
      audio_setting: "auto",
      enable_safety_checker: true,
    });
    expect(schema.safeParse({ prompt: "Edit it." }).success).toBe(false);
    expect(schema.safeParse({ video_url: recorded.video_url }).success).toBe(
      false
    );
    expect(accepts({ prompt: "" })).toBe(false);
  });

  it("takes an http(s) URL or a data URI, as upstream's validator does", () => {
    for (const url of [
      "https://example.com/a.mp4",
      "http://example.com/a.mp4",
      "data:video/mp4;base64,AAAA",
    ]) {
      expect(accepts({ video_url: url }), url).toBe(true);
      expect(accepts({ reference_image_urls: [url] }), url).toBe(true);
    }
    for (const url of [
      "",
      "ftp://example.com/a.mp4",
      "HTTPS://EXAMPLE.COM/a",
    ]) {
      expect(accepts({ video_url: url }), url).toBe(false);
      expect(accepts({ reference_image_urls: [url] }), url).toBe(false);
    }
  });

  it("caps the reference images at 5", () => {
    expect(accepts({ reference_image_urls: Array(5).fill(image) })).toBe(true);
    expect(accepts({ reference_image_urls: Array(6).fill(image) })).toBe(false);
    expect(accepts({ reference_image_urls: null })).toBe(true);
  });

  it("closes resolution and audio_setting", () => {
    for (const resolution of ["720p", "1080p"])
      expect(accepts({ resolution })).toBe(true);
    for (const resolution of ["480p", "4k", "720P"])
      expect(accepts({ resolution })).toBe(false);
    for (const audio_setting of ["auto", "origin"])
      expect(accepts({ audio_setting })).toBe(true);
    expect(accepts({ audio_setting: "mute" })).toBe(false);
  });

  it("describes every documented field, in upstream's order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "video_url",
      "prompt",
      "reference_image_urls",
      "resolution",
      "audio_setting",
      "seed",
      "enable_safety_checker",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
    }
  });
});

describe("Happy Horse video edit pricing", () => {
  const estimate = (
    payload: Record<string, unknown>,
    durationSeconds?: number
  ) =>
    computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      costHints:
        durationSeconds === undefined ? undefined : { durationSeconds },
    });

  // The recorded 3 s edit at 720p billed x-fal-billable-units 6, three
  // seconds in and three out at $0.14, $0.84.
  it("bills the source's seconds in and out at the resolution's rate", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source.asOf).toBe("2026-10-31");
    const recordedCall = estimate(recorded, 3);
    expect(recordedCall.usd).toBeCloseTo(0.84, 10);
    expect(recordedCall.breakdown.units).toBe(6);
    expect(recordedCall.warnings).toEqual([]);
    expect(estimate({ ...recorded, resolution: undefined }, 3).usd).toBeCloseTo(
      1.68,
      10
    );
    expect(estimate(recorded, 15).usd).toBeCloseTo(4.2, 10);
  });

  it("fails closed without the source length or past the 15 s cap", () => {
    const missing = estimate(recorded);
    expect(missing.usd).toBe(0);
    expect(missing.warnings[0]).toContain("costHints.durationSeconds");
    const long = estimate(recorded, 20);
    expect(long.usd).toBe(0);
    expect(long.warnings).toEqual([
      "fal 'alibaba/happy-horse/video-edit': a 20 s source is truncated to its first 15 s, and fal does not say whether the rest of it bills",
    ]);
  });

  it("carries the HappyHorse 1.0 slug and a display name", () => {
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("hh");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Happy Horse Edit"
    );
  });
});
