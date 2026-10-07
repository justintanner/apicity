import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3MaxReferenceToVideoParsedRequest,
  type FalMinimaxH3MaxReferenceToVideoRequest,
  type FalMinimaxH3MaxReferenceToVideoRequestInput,
  type FalMinimaxH3MaxReferenceToVideoResponse,
} from "@apicity/fal";
import {
  FalMinimaxH3MaxReferenceToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-07 (sha256
// 58864d590b5d4660d62f854943d60c376684ba2a464556aac59df22a1319916d) and the
// unbilled 422 probes of the same day, which showed that upstream requires
// `prompt` alone, refuses a prompt of only whitespace, closes
// `prompt_expansion_mode` and `aspect_ratio`, and bounds the reference lists
// at 9, 3 and 3 items. The cross-field refinements restate the rules the
// field descriptions publish.
const endpoint = "minimax/h3-max/reference-to-video";
const input = { prompt: "Image 1 rides along the forest trail." };
const image = "https://example.com/reference.jpg";
const video = "https://example.com/motion.mp4";
const audio = "https://example.com/voice.mp3";
const start = "https://example.com/first.jpg";
const middle = "https://example.com/middle.jpg";
const end = "https://example.com/last.jpg";

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

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MiniMax H3 Max reference-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3Max.referenceToVideo;
    expect(leaf).toBe(provider.post.run.minimax.h3Max.referenceToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // Compile-time only: the public request types and the four documented
    // Output members with the File shape, optionality included.
    expectTypeOf<FalMinimaxH3MaxReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxReferenceToVideoRequestInput>().toEqualTypeOf<FalMinimaxH3MaxReferenceToVideoRequest>();
    expectTypeOf<FalMinimaxH3MaxReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxReferenceToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      expanded_prompt?: string | null;
      seed: number;
      timings?: Record<string, number> | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/out.mp4" },
        expanded_prompt: null,
        seed: 7,
        timings: null,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const body = {
      ...input,
      reference_image_urls: [image],
      duration: 0.92,
      resolution: "480P" as const,
      prompt_expansion_mode: "disabled" as const,
    };
    const result = await provider.run.minimax.h3Max.referenceToVideo(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/minimax/h3-max/reference-to-video"
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
    expect(schema.safeParse({ reference_image_urls: [image] }).success).toBe(
      false
    );
  });

  it("refuses an empty or whitespace-only prompt and caps it at 50,000", () => {
    expect(accepts({ prompt: "" })).toBe(false);
    expect(accepts({ prompt: " \n\t " })).toBe(false);
    expect(accepts({ prompt: " Image 1 " })).toBe(true);
    expect(accepts({ prompt: "p".repeat(50000) })).toBe(true);
    expect(accepts({ prompt: "p".repeat(50001) })).toBe(false);
  });

  it.each([0.92, 1, 5.5, 15])("accepts duration %s", (duration) =>
    expect(accepts({ duration })).toBe(true)
  );

  it.each([0, 0.91, 15.1, "5"])("rejects duration %s", (duration) =>
    expect(accepts({ duration })).toBe(false)
  );

  it.each(["480P", "768P", "1080P"])("accepts resolution %s", (resolution) =>
    expect(accepts({ resolution })).toBe(true)
  );

  it.each(["2K", "4K", "720P", "480p"])("rejects resolution %s", (resolution) =>
    expect(accepts({ resolution })).toBe(false)
  );

  it.each(["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])(
    "accepts aspect ratio %s",
    (aspect_ratio) => expect(accepts({ aspect_ratio })).toBe(true)
  );

  it.each(["2:1", "9:21", "auto", ""])(
    "rejects aspect ratio %s",
    (aspect_ratio) => expect(accepts({ aspect_ratio })).toBe(false)
  );

  it("takes the four expansion modes upstream's validator accepts", () => {
    for (const mode of ["disabled", "fast", "balanced", "quality"]) {
      expect(accepts({ prompt_expansion_mode: mode }), mode).toBe(true);
    }
    for (const mode of ["bogus", "", null]) {
      expect(accepts({ prompt_expansion_mode: mode }), String(mode)).toBe(
        false
      );
    }
  });

  it.each([null, -1, 0, 42])("accepts seed %s", (seed) =>
    expect(accepts({ seed })).toBe(true)
  );

  it("rejects a fractional seed", () =>
    expect(accepts({ seed: 1.5 })).toBe(false));

  it.each(["enable_safety_checker", "sync_mode"])(
    "takes a boolean %s only",
    (key) => {
      expect(accepts({ [key]: false })).toBe(true);
      expect(accepts({ [key]: "false" })).toBe(false);
    }
  );

  it.each([
    ["reference_image_urls", 9, image],
    ["reference_video_urls", 3, video],
    ["reference_audio_urls", 3, audio],
  ] as const)("caps %s at its documented %i items", (key, max, url) => {
    expect(accepts({ [key]: [] })).toBe(true);
    expect(accepts({ [key]: urls(url, max) })).toBe(true);
    expect(accepts({ [key]: urls(url, max + 1) })).toBe(false);
    expect(accepts({ [key]: [1] })).toBe(false);
    expect(accepts({ [key]: url })).toBe(false);
  });

  it("caps all reference files at 12 in total", () => {
    expect(
      accepts({
        reference_image_urls: urls(image, 9),
        reference_video_urls: urls(video, 3),
      })
    ).toBe(true);
    expect(
      accepts({
        reference_image_urls: urls(image, 9),
        reference_video_urls: urls(video, 2),
        reference_audio_urls: urls(audio, 1),
      })
    ).toBe(true);
    expect(
      issuePaths({
        reference_image_urls: urls(image, 9),
        reference_video_urls: urls(video, 3),
        reference_audio_urls: urls(audio, 1),
      })
    ).toEqual(["reference_image_urls"]);
    expect(
      accepts({
        reference_image_urls: urls(image, 6),
        reference_video_urls: urls(video, 3),
        reference_audio_urls: urls(audio, 3),
      })
    ).toBe(true);
  });

  it("takes audio as the only reference modality, unlike minimax/h3", () =>
    expect(accepts({ reference_audio_urls: [audio] })).toBe(true));

  it.each(["image_url", "middle_image_url", "end_image_url"])(
    "takes %s as a non-empty string or null",
    (key) => {
      const frames = { image_url: start, end_image_url: end };
      expect(accepts({ ...frames, [key]: null })).toBe(true);
      expect(accepts({ ...frames, [key]: "" })).toBe(false);
      expect(accepts({ ...frames, [key]: 1 })).toBe(false);
    }
  );

  it("takes start and end frames on their own", () => {
    expect(accepts({ image_url: start })).toBe(true);
    expect(accepts({ end_image_url: end })).toBe(true);
  });

  it("needs start and end frames and a native resolution for a middle frame", () => {
    const framed = {
      image_url: start,
      middle_image_url: middle,
      end_image_url: end,
    };
    expect(accepts(framed)).toBe(true);
    expect(accepts({ ...framed, resolution: "480P" })).toBe(true);
    expect(accepts({ ...framed, resolution: "768P" })).toBe(true);
    expect(issuePaths({ ...framed, resolution: "1080P" })).toEqual([
      "middle_image_url",
    ]);
    expect(issuePaths({ ...framed, image_url: null })).toEqual([
      "middle_image_url",
    ]);
    expect(issuePaths({ ...framed, end_image_url: undefined })).toEqual([
      "middle_image_url",
    ]);
  });

  it("bounds the middle frame time strictly inside 0 to 15 seconds", () => {
    const framed = {
      image_url: start,
      middle_image_url: middle,
      end_image_url: end,
    };
    for (const time of [0.01, 2.5, 14.99, null]) {
      expect(
        accepts({ ...framed, middle_frame_time: time }),
        String(time)
      ).toBe(true);
    }
    for (const time of [0, -1, 15, 15.5, "2.5"]) {
      expect(
        accepts({ ...framed, middle_frame_time: time }),
        String(time)
      ).toBe(false);
    }
  });

  it("needs a middle image for a middle frame time", () => {
    expect(issuePaths({ middle_frame_time: 2.5 })).toEqual([
      "middle_frame_time",
    ]);
    expect(accepts({ middle_frame_time: null })).toBe(true);
  });

  it("strips the siblings' fields, which it does not document", () => {
    const parsed = schema.parse({
      ...input,
      target_audio_url: "https://example.com/a.wav",
      camera_trajectory: [],
      video_url: video,
    });
    expect(parsed).not.toHaveProperty("target_audio_url");
    expect(parsed).not.toHaveProperty("camera_trajectory");
    expect(parsed).not.toHaveProperty("video_url");
  });

  it("describes every documented field, in upstream's order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "reference_image_urls",
      "reference_video_urls",
      "reference_audio_urls",
      "image_url",
      "middle_image_url",
      "middle_frame_time",
      "end_image_url",
      "duration",
      "resolution",
      "seed",
      "enable_safety_checker",
      "sync_mode",
      "prompt_expansion_mode",
      "aspect_ratio",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Dynamic branch (P-7 rule 1): the card adds $0.02 per 1,000 reference
  // tokens beyond the 4,096 included with each request, and those tokens
  // depend on each reference's shape, frame count or length, which the
  // payload carries only as URLs. The recorded 480P call (0.92 s, one square
  // reference image inside the allowance) billed x-fal-billable-units 0.92,
  // $0.046, and is deferred like any other payload.
  it.each([
    ["minimal", input],
    [
      "recorded",
      {
        ...input,
        reference_image_urls: [image],
        duration: 0.92,
        resolution: "480P",
        prompt_expansion_mode: "disabled",
      },
    ],
    [
      "reference-heavy 1080P",
      {
        ...input,
        reference_image_urls: urls(image, 9),
        reference_video_urls: urls(video, 3),
        duration: 15,
        resolution: "1080P",
      },
    ],
  ])("defers the %s payload to fal's estimate API", (_label, payload) => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    const estimate = computeEstimate({ provider: "fal", endpoint, payload });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings).toHaveLength(1);
    expect(estimate.warnings[0]).toContain(
      "POST https://api.fal.ai/v1/models/pricing/estimate"
    );
    expect(estimate.warnings[0]).toContain("fal.v1.models.pricing.estimate");
  });

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
