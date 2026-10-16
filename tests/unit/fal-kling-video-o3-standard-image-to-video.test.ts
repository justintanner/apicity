import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKlingVideoO3StandardImageToVideoParsedRequest,
  type FalKlingVideoO3StandardImageToVideoRequest,
  type FalKlingVideoO3StandardImageToVideoRequestInput,
  type FalKlingVideoO3StandardImageToVideoResponse,
  type FalRunKlingVideoO3Namespace,
  type FalRunKlingVideoO3StandardNamespace,
  type FalRunNamespace,
} from "@apicity/fal";
import {
  FalKlingVideoO3StandardImageToVideoRequestSchema as schema,
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
// (sha256 00992346f735bc23454b2c552bb4ead23bb1b95f987ccc40c37bd7e6e515ddf8,
// the planning archive's JSON) and the free 422 probes of the same day.
const endpoint = "fal-ai/kling-video/o3/standard/image-to-video";
// The recorded call. The integration test sends tests/fixtures/cat1.jpg as a
// data URL; a short URL stands in here. The prompt is reused with that
// fixture from tests/integration/fal-wan3p0-image-to-video.test.ts.
const recorded = {
  image_url: "https://example.com/cat1.jpg",
  prompt: "the cat blinks",
  duration: "3",
} satisfies FalKlingVideoO3StandardImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Kling O3 Standard image-to-video contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.klingVideo.o3.standard.imageToVideo;
    expect(typeof leaf).toBe("function");
    expect(leaf).toBe(provider.post.run.klingVideo.o3.standard.imageToVideo);
    expect(provider.run.klingVideo.o3.standard).toHaveProperty(
      "imageToVideo",
      leaf
    );
    // The o3 object sits beside the existing o3p4k object, which it leaves
    // alone.
    expect(provider.run.klingVideo).toHaveProperty("o3p4k");
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<
      FalRunNamespace["klingVideo"]["o3"]
    >().toEqualTypeOf<FalRunKlingVideoO3Namespace>();
    expectTypeOf<
      FalRunKlingVideoO3Namespace["standard"]
    >().toEqualTypeOf<FalRunKlingVideoO3StandardNamespace>();
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunKlingVideoO3StandardNamespace["imageToVideo"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKlingVideoO3StandardImageToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKlingVideoO3StandardImageToVideoResponse>();
    expectTypeOf<FalKlingVideoO3StandardImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKlingVideoO3StandardImageToVideoRequestInput>().toEqualTypeOf<FalKlingVideoO3StandardImageToVideoRequest>();
    expectTypeOf<FalKlingVideoO3StandardImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKlingVideoO3StandardImageToVideoResponse>().toEqualTypeOf<{
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
        jsonResponse({ video: { url: "https://example.com/cat.mp4" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.klingVideo.o3.standard.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/cat.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/kling-video/o3/standard/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires image_url and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "enable_safety_checker",
      "prompt",
      "image_url",
      "end_image_url",
      "duration",
      "generate_audio",
      "multi_prompt",
      "shot_type",
    ]);
    expect(
      schema.parse({ image_url: recorded.image_url, prompt: recorded.prompt })
    ).toEqual({
      enable_safety_checker: true,
      prompt: recorded.prompt,
      image_url: recorded.image_url,
      duration: "5",
      generate_audio: false,
      shot_type: "customize",
    });
    const missing = schema.safeParse({ prompt: recorded.prompt });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["image_url"],
    ]);
    // The validator ignored an undocumented field, so the schema is not
    // strict.
    expect(accepts({ unknown_field: true })).toBe(true);
  });

  it("needs exactly one of prompt and multi_prompt", () => {
    // From the prompt's description; a guarded 422 probe cannot reach it.
    const multi = [{ prompt: "the cat blinks", duration: "3" }];
    expect(accepts({ prompt: undefined, multi_prompt: multi })).toBe(true);
    expect(accepts({ prompt: null, multi_prompt: multi })).toBe(true);
    expect(accepts({ multi_prompt: multi })).toBe(false);
    expect(accepts({ prompt: undefined })).toBe(false);
    expect(accepts({ prompt: null, multi_prompt: null })).toBe(false);
  });

  it("caps the prompt at 2500 characters", () => {
    expect(accepts({ prompt: "x".repeat(2500) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(2501) })).toBe(false);
    for (const prompt of [1, {}]) expect(accepts({ prompt })).toBe(false);
  });

  it("takes an http(s) URL or a data URI for both frames", () => {
    for (const url of [
      "https://example.com/cat1.jpg",
      "http://example.com/cat1.jpg",
      "data:image/jpeg;base64,AAAA",
      "data:text/plain,hello",
      " https://example.com/cat1.jpg",
    ]) {
      expect(accepts({ image_url: url })).toBe(true);
      expect(accepts({ end_image_url: url })).toBe(true);
    }
    for (const url of [
      "",
      "https://",
      "ftp://example.com/cat1.jpg",
      "HTTPS://example.com/cat1.jpg",
      "DATA:image/jpeg;base64,AAAA",
      "/cat1.jpg",
    ]) {
      expect(accepts({ image_url: url })).toBe(false);
      expect(accepts({ end_image_url: url })).toBe(false);
    }
    expect(accepts({ end_image_url: null })).toBe(true);
    expect(accepts({ image_url: null })).toBe(false);
  });

  it("takes the documented duration strings from 3 to 15 seconds", () => {
    for (const duration of ["3", "5", "10", "15"])
      expect(accepts({ duration })).toBe(true);
    // fal's lax validator coerced the number 3; the schema keeps the
    // documented string enum.
    for (const duration of ["2", "16", 3, null])
      expect(accepts({ duration })).toBe(false);
  });

  it("checks each multi-prompt shot", () => {
    const shot = (value: Record<string, unknown>) =>
      accepts({ prompt: undefined, multi_prompt: [value] });
    expect(shot({ prompt: "a", duration: "1" })).toBe(true);
    expect(shot({ prompt: "a", duration: "15" })).toBe(true);
    expect(
      schema.parse({
        image_url: recorded.image_url,
        multi_prompt: [{ prompt: "a" }],
      }).multi_prompt
    ).toEqual([{ prompt: "a", duration: "5" }]);
    expect(shot({ duration: "3" })).toBe(false);
    expect(shot({ prompt: "a", duration: "16" })).toBe(false);
    expect(shot({ prompt: "a", duration: 3 })).toBe(false);
  });

  it("takes customize or intelligent shots", () => {
    for (const shotType of ["customize", "intelligent"])
      expect(accepts({ shot_type: shotType })).toBe(true);
    for (const shotType of ["auto", null])
      expect(accepts({ shot_type: shotType })).toBe(false);
  });

  it.each(["enable_safety_checker", "generate_audio"])(
    "takes %s as a boolean",
    (field) => {
      for (const value of [true, false])
        expect(accepts({ [field]: value })).toBe(true);
      for (const value of ["true", 1, null, {}])
        expect(accepts({ [field]: value })).toBe(false);
    }
  );

  it("prices the requested seconds by the audio flag", () => {
    // The card bills $0.084 per second with audio off and $0.112 with audio
    // on. fal counts it in seconds of $0.14: the recorded 3 s call with audio
    // off billed 1.8 units ($0.252) and the usage API agrees.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]).toBeDefined();
    expect(MODEL_SLUGS.fal[endpoint]).toBe("klingo3s");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("Kling o3 Standard");
    const estimate = (payload: Record<string, unknown>) =>
      computeEstimate({ provider: "fal", endpoint, payload });
    const recordedEstimate = estimate(recorded);
    expect(recordedEstimate.usd).toBeCloseTo(0.252, 10);
    expect(recordedEstimate.breakdown).toEqual({
      units: 3,
      unit: "seconds",
      perUnitUsd: 0.084,
    });
    expect(recordedEstimate.warnings).toEqual([]);
    // generate_audio and duration default to false and "5".
    expect(
      estimate({ image_url: recorded.image_url, prompt: "x" }).usd
    ).toBeCloseTo(0.42, 10);
    // The card's own example: 5 s with audio on costs $0.56.
    expect(
      estimate({ ...recorded, duration: "5", generate_audio: true }).usd
    ).toBeCloseTo(0.56, 10);
    expect(estimate({ ...recorded, duration: "15" }).usd).toBeCloseTo(1.26, 10);
    // Shots carry their own durations, which the card does not price.
    const shots = estimate({
      image_url: recorded.image_url,
      multi_prompt: [{ prompt: "the cat blinks", duration: "3" }],
    });
    expect(shots.usd).toBe(0);
    expect(shots.warnings.length).toBeGreaterThan(0);
  });
});
