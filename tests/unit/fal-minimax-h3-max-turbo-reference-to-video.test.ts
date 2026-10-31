import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3MaxTurboReferenceToVideoParsedRequest,
  type FalMinimaxH3MaxTurboReferenceToVideoRequest,
  type FalMinimaxH3MaxTurboReferenceToVideoRequestInput,
  type FalMinimaxH3MaxTurboReferenceToVideoResponse,
} from "@apicity/fal";
import {
  FalMinimaxH3MaxTurboReferenceToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-31 (sha256
// 97502d6895ddc31ca4b703478e2541faf76daf683ec5930e44ff9a20ddee929c) and the
// unbilled 422 probes of the same day: upstream requires `prompt` alone,
// refuses a whitespace-only prompt, takes four expansion modes, checks each
// reference condition's type and URL, and refuses a non-null `image_url`.
// The two refinements restate the field descriptions.
const endpoint = "minimax/h3-max-turbo/reference-to-video";
const input = { prompt: "Image 1 is the cat. The cat slowly blinks." };
const image = "https://example.com/reference.jpg";
const video = "https://example.com/motion.mp4";
const audio = "https://example.com/voice.mp3";

function urls(url: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${url}?n=${i}`);
}

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...input, ...body }).success;
}

function issuePaths(body: Record<string, unknown>): string[] {
  const result = schema.safeParse({ ...input, ...body });
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join("."));
}

describe("MiniMax H3 Max Turbo reference-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3MaxTurbo.referenceToVideo;
    expect(leaf).toBe(provider.post.run.minimax.h3MaxTurbo.referenceToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(Object.keys(provider.run.minimax.h3MaxTurbo)).toEqual([
      "textToVideo",
      "imageToVideo",
      "extendVideo",
      "referenceToVideo",
    ]);
    expectTypeOf<FalMinimaxH3MaxTurboReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxTurboReferenceToVideoRequestInput>().toEqualTypeOf<FalMinimaxH3MaxTurboReferenceToVideoRequest>();
    expectTypeOf<FalMinimaxH3MaxTurboReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxTurboReferenceToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      expanded_prompt?: string | null;
      seed: number;
      reference_tokens?: number | null;
      timings?: Record<string, number> | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          video: { url: "https://example.com/out.mp4" },
          expanded_prompt: null,
          seed: 7,
          reference_tokens: 1024,
          timings: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const body = {
      ...input,
      reference_image_urls: [image],
      duration: 2,
      resolution: "480P" as const,
      prompt_expansion_mode: "disabled" as const,
    };
    const result = await provider.run.minimax.h3MaxTurbo.referenceToVideo(body);
    expect(result.seed).toBe(7);
    expect(result.reference_tokens).toBe(1024);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/minimax/h3-max-turbo/reference-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("requires only the prompt and applies the documented defaults", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      duration: 5,
      resolution: "768P",
      enable_safety_checker: true,
      sync_mode: false,
      prompt_expansion_mode: "balanced",
      aspect_ratio: "adaptive",
    });
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("refuses an empty or whitespace-only prompt and caps it at 50,000", () => {
    expect(accepts({ prompt: "" })).toBe(false);
    expect(accepts({ prompt: " \n\t " })).toBe(false);
    expect(accepts({ prompt: "p".repeat(50000) })).toBe(true);
    expect(accepts({ prompt: "p".repeat(50001) })).toBe(false);
  });

  it("bounds duration, resolution, aspect ratio and expansion mode", () => {
    for (const duration of [0.92, 2, 15])
      expect(accepts({ duration })).toBe(true);
    for (const duration of [0.91, 15.1, "2"])
      expect(accepts({ duration })).toBe(false);
    for (const resolution of ["480P", "768P", "1080P"])
      expect(accepts({ resolution })).toBe(true);
    for (const resolution of ["480p", "720P", "2K"])
      expect(accepts({ resolution })).toBe(false);
    for (const aspect_ratio of ["adaptive", "21:9", "1:1", "9:16"])
      expect(accepts({ aspect_ratio })).toBe(true);
    expect(accepts({ aspect_ratio: "auto" })).toBe(false);
    for (const mode of ["disabled", "fast", "balanced", "quality"])
      expect(accepts({ prompt_expansion_mode: mode })).toBe(true);
    for (const mode of ["bogus", ""])
      expect(accepts({ prompt_expansion_mode: mode })).toBe(false);
  });

  it.each([
    ["reference_image_urls", 9, image],
    ["reference_video_urls", 3, video],
    ["reference_audio_urls", 3, audio],
  ] as const)("caps %s at its documented %i items", (key, max, url) => {
    expect(accepts({ [key]: urls(url, max) })).toBe(true);
    expect(accepts({ [key]: urls(url, max + 1) })).toBe(false);
  });

  it("caps the per-type lists at 12 reference files in total", () => {
    expect(
      accepts({
        reference_image_urls: urls(image, 9),
        reference_video_urls: urls(video, 3),
      })
    ).toBe(true);
    expect(
      issuePaths({
        reference_image_urls: urls(image, 9),
        reference_video_urls: urls(video, 3),
        reference_audio_urls: urls(audio, 1),
      })
    ).toEqual(["reference_image_urls"]);
  });

  it("takes an ordered reference list of up to 12 typed conditions", () => {
    const conditions = [
      { type: "image", url: image },
      { type: "video", url: video },
      { type: "audio", url: audio },
    ];
    expect(accepts({ reference_conditions: conditions })).toBe(true);
    expect(
      accepts({
        reference_conditions: Array.from({ length: 12 }, () => conditions[0]),
      })
    ).toBe(true);
    expect(
      accepts({
        reference_conditions: Array.from({ length: 13 }, () => conditions[0]),
      })
    ).toBe(false);
    expect(
      accepts({ reference_conditions: [{ type: "bogus", url: image }] })
    ).toBe(false);
    expect(
      accepts({ reference_conditions: [{ type: "image", url: "" }] })
    ).toBe(false);
    expect(accepts({ reference_conditions: [{ type: "image" }] })).toBe(false);
  });

  it("refuses the ordered list beside the per-type lists", () => {
    expect(
      issuePaths({
        reference_conditions: [{ type: "image", url: image }],
        reference_image_urls: [image],
      })
    ).toEqual(["reference_conditions"]);
    expect(
      accepts({ reference_conditions: [], reference_image_urls: [image] })
    ).toBe(true);
  });

  it("strips the H3 Max frame fields, which upstream refuses here", () => {
    const parsed = schema.parse({
      ...input,
      image_url: image,
      end_image_url: image,
      middle_image_url: image,
      middle_frame_time: 1,
    });
    for (const key of [
      "image_url",
      "end_image_url",
      "middle_image_url",
      "middle_frame_time",
    ])
      expect(parsed).not.toHaveProperty(key);
  });

  it("describes every documented field, in upstream's order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "reference_image_urls",
      "reference_video_urls",
      "reference_audio_urls",
      "duration",
      "resolution",
      "seed",
      "enable_safety_checker",
      "sync_mode",
      "prompt_expansion_mode",
      "aspect_ratio",
      "reference_conditions",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Dynamic, like minimax/h3-max/reference-to-video: the card adds $0.016
  // per 1,000 reference tokens beyond the 4,096 included, and those depend
  // on the references, which the payload carries only as URLs.
  it("defers every payload to fal's estimate API", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        ...input,
        reference_image_urls: [image],
        duration: 2,
        resolution: "480P",
      },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings).toHaveLength(1);
    expect(estimate.warnings[0]).toContain(
      "POST https://api.fal.ai/v1/models/pricing/estimate"
    );
  });

  it("carries no local rate or slug, only a display name", () => {
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "H3 Max Turbo Reference To Video"
    );
  });
});
