import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3MaxLipSyncImageToVideoParsedRequest,
  type FalMinimaxH3MaxLipSyncImageToVideoRequest,
  type FalMinimaxH3MaxLipSyncImageToVideoRequestInput,
  type FalMinimaxH3MaxLipSyncImageToVideoResponse,
  type FalRunMinimaxH3MaxLipSyncNamespace,
} from "@apicity/fal";
import {
  FalMinimaxH3MaxLipSyncImageToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-08 (sha256
// 6fd934b1218d1a6e409590bca7536b9f2c0a294f075aaf3568f1639e9305cf52) and the
// unbilled 422 probes of the same day, which showed that upstream requires
// `image_url` and `audio_url` alone, closes `resolution` to four values,
// takes integers from 0 to 2147483647 for `seed`, accepts unknown fields,
// and checks neither media URL's form before generation.
const endpoint = "minimax/h3-max/lip-sync/image-to-video";
const input = {
  image_url: "https://example.com/portrait.jpg",
  audio_url: "https://example.com/speech.mp3",
};

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...input, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MiniMax H3 Max lip sync image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3Max.lipSync.imageToVideo;
    expect(leaf).toBe(provider.post.run.minimax.h3Max.lipSync.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // The lipSync object is new here and carries this one leaf.
    expect(Object.keys(provider.run.minimax.h3Max.lipSync)).toEqual([
      "imageToVideo",
    ]);
    // Compile-time only: the public namespace and request types, and the
    // documented Output with its File shape, optionality included.
    expectTypeOf(
      provider.run.minimax.h3Max.lipSync
    ).toEqualTypeOf<FalRunMinimaxH3MaxLipSyncNamespace>();
    expectTypeOf<FalMinimaxH3MaxLipSyncImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxLipSyncImageToVideoRequestInput>().toEqualTypeOf<FalMinimaxH3MaxLipSyncImageToVideoRequest>();
    expectTypeOf<FalMinimaxH3MaxLipSyncImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxLipSyncImageToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      seed: number;
      duration: number;
      timings?: Record<string, number> | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/out.mp4" },
        seed: 7,
        duration: 5.72,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const body = { ...input, resolution: "480P" as const };
    const result = await provider.run.minimax.h3Max.lipSync.imageToVideo(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(result.duration).toBe(5.72);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/minimax/h3-max/lip-sync/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("requires the image and the audio and applies the documented defaults", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      resolution: "768P",
      enable_transcription: false,
      enable_safety_checker: true,
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ image_url: input.image_url }).success).toBe(
      false
    );
    expect(schema.safeParse({ audio_url: input.audio_url }).success).toBe(
      false
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it.each([
    "https://example.com/portrait.jpg",
    "http://example.com/portrait.jpg",
    "data:image/png;base64,iVBORw0KGgo=",
    "not a url",
    "",
  ])("passes the media URL %s through to upstream", (url) => {
    expect(accepts({ image_url: url })).toBe(true);
    expect(accepts({ audio_url: url })).toBe(true);
  });

  it.each([[["x"]], [5], [null]])(
    "refuses the non-string media URL %j",
    (url) => {
      expect(accepts({ image_url: url })).toBe(false);
      expect(accepts({ audio_url: url })).toBe(false);
    }
  );

  it.each(["480P", "768P", "1080P", "2K"])(
    "accepts resolution %s",
    (resolution) => expect(accepts({ resolution })).toBe(true)
  );

  it.each(["720P", "480p", "4K", ""])("rejects resolution %s", (resolution) =>
    expect(accepts({ resolution })).toBe(false)
  );

  it.each([0, 1, 2147483647, null])("accepts seed %s", (seed) =>
    expect(accepts({ seed })).toBe(true)
  );

  it.each([-1, 2147483648, 1.5])("rejects seed %s", (seed) =>
    expect(accepts({ seed })).toBe(false)
  );

  it.each(["enable_transcription", "enable_safety_checker"])(
    "takes %s as a boolean",
    (key) => {
      expect(accepts({ [key]: true })).toBe(true);
      expect(accepts({ [key]: false })).toBe(true);
      expect(accepts({ [key]: "maybe" })).toBe(false);
    }
  );

  it("describes every documented field, in upstream's order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "image_url",
      "audio_url",
      "resolution",
      "enable_transcription",
      "seed",
      "enable_safety_checker",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Dynamic branch (P-7 rules 2 and 4): the card bills each generated second
  // at $0.05/$0.08/$0.16/$0.32 at 480p/768p/1080p/2K, times 1.2 over 15 s,
  // and the video runs as long as the audio, which the payload carries only
  // as a URL. A costHints.durationSeconds rate would not match the billing:
  // the recorded 480P call sent 5.72 s of audio, got back a video fal
  // reports as 5.720844 s (138 frames at 24 fps, 5.75 s) and billed
  // x-fal-billable-units 6.0 at $0.05, $0.30, which fal's usage API
  // confirms, where the card predicts $0.286 to $0.288. So a payload is
  // deferred whether or not its length is hinted.
  it.each([
    ["minimal", input, undefined],
    ["recorded", { ...input, resolution: "480P" }, undefined],
    [
      "recorded, length-hinted",
      { ...input, resolution: "480P" },
      { durationSeconds: 5.72 },
    ],
    [
      "2K over 15 s, length-hinted",
      { ...input, resolution: "2K" },
      { durationSeconds: 30 },
    ],
  ])(
    "defers the %s payload to fal's estimate API",
    (_label, payload, costHints) => {
      expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload,
        costHints,
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings).toHaveLength(1);
      expect(estimate.warnings[0]).toContain(
        "POST https://api.fal.ai/v1/models/pricing/estimate"
      );
      expect(estimate.warnings[0]).toContain("fal.v1.models.pricing.estimate");
    }
  );

  it("carries no local rate, slug or display name", () => {
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect(
      (MODEL_DISPLAY.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
  });
});
