import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3MaxTurboImageToVideoParsedRequest,
  type FalMinimaxH3MaxTurboImageToVideoRequest,
  type FalMinimaxH3MaxTurboImageToVideoRequestInput,
  type FalMinimaxH3MaxTurboImageToVideoResponse,
} from "@apicity/fal";
import {
  FalMinimaxH3MaxTurboImageToVideoRequestSchema as schema,
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
// 65c25b16af90148933c34da73af22c9614473eea0fa9628abaae1a0311d2e536) and the
// three unbilled 422 probes of the same day, which showed that upstream
// requires `prompt` alone, closes `prompt_expansion_mode` to four values and
// bounds `duration` from 0.92 to 15 seconds.
const endpoint = "minimax/h3-max-turbo/image-to-video";
const input = { prompt: "The camera slowly pulls back." };

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MiniMax H3 Max Turbo image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3MaxTurbo.imageToVideo;
    expect(leaf).toBe(provider.post.run.minimax.h3MaxTurbo.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // Compile-time only: the public request types and the three documented
    // Output members with the File shape, optionality included.
    expectTypeOf<FalMinimaxH3MaxTurboImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxTurboImageToVideoRequestInput>().toEqualTypeOf<FalMinimaxH3MaxTurboImageToVideoRequest>();
    expectTypeOf<FalMinimaxH3MaxTurboImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxTurboImageToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      expanded_prompt?: string | null;
      timings?: Record<string, number> | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/out.mp4" },
        expanded_prompt: null,
        timings: null,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const body = {
      ...input,
      image_url: "https://example.com/first.jpg",
      end_image_url: "https://example.com/last.jpg",
      duration: 0.92,
      resolution: "480P" as const,
      prompt_expansion_mode: "disabled" as const,
    };
    const result = await provider.run.minimax.h3MaxTurbo.imageToVideo(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/minimax/h3-max-turbo/image-to-video"
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
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(
      schema.safeParse({ image_url: "https://example.com/a.jpg" }).success
    ).toBe(false);
  });

  it("caps the prompt between 1 and 50,000 characters", () => {
    expect(schema.safeParse({ prompt: "" }).success).toBe(false);
    expect(schema.safeParse({ prompt: "p".repeat(50000) }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(50001) }).success).toBe(false);
  });

  it.each([0.92, 1, 5.5, 15])("accepts duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(true)
  );

  it.each([0, 0.91, 15.01, "5"])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(false)
  );

  it.each(["480P", "768P", "1080P"])("accepts resolution %s", (resolution) =>
    expect(schema.safeParse({ ...input, resolution }).success).toBe(true)
  );

  it.each(["2K", "4K", "720P", "480p"])("rejects resolution %s", (resolution) =>
    expect(schema.safeParse({ ...input, resolution }).success).toBe(false)
  );

  it("takes the four expansion modes upstream's validator accepts", () => {
    for (const mode of ["disabled", "fast", "balanced", "quality"]) {
      expect(
        schema.safeParse({ ...input, prompt_expansion_mode: mode }).success,
        mode
      ).toBe(true);
    }
    for (const mode of ["bogus", "", null]) {
      expect(
        schema.safeParse({ ...input, prompt_expansion_mode: mode }).success,
        String(mode)
      ).toBe(false);
    }
  });

  it.each([null, 0, 42])("accepts seed %s", (seed) =>
    expect(schema.safeParse({ ...input, seed }).success).toBe(true)
  );

  it("rejects a fractional seed", () =>
    expect(schema.safeParse({ ...input, seed: 1.5 }).success).toBe(false));

  it("accepts either keyframe alone, both, or null", () => {
    for (const frames of [
      { image_url: "https://example.com/a.jpg" },
      { end_image_url: "https://example.com/b.jpg" },
      {
        image_url: "https://example.com/a.jpg",
        end_image_url: "https://example.com/b.jpg",
      },
      { image_url: null, end_image_url: null },
    ]) {
      expect(schema.safeParse({ ...input, ...frames }).success).toBe(true);
    }
  });

  it.each(["image_url", "end_image_url"])("takes a string %s only", (key) =>
    expect(schema.safeParse({ ...input, [key]: 5 }).success).toBe(false)
  );

  it("needs a non-blank target audio URL when one is given", () => {
    for (const target_audio_url of [
      "https://example.com/a.wav",
      "data:audio/wav;base64,AAAA",
      null,
    ]) {
      expect(
        schema.safeParse({ ...input, target_audio_url }).success,
        String(target_audio_url)
      ).toBe(true);
    }
    for (const target_audio_url of ["", "   "]) {
      expect(
        schema.safeParse({ ...input, target_audio_url }).success,
        JSON.stringify(target_audio_url)
      ).toBe(false);
    }
  });

  it.each(["enable_safety_checker", "sync_mode"])(
    "takes a boolean %s only",
    (key) => {
      expect(schema.safeParse({ ...input, [key]: false }).success).toBe(true);
      expect(schema.safeParse({ ...input, [key]: "false" }).success).toBe(
        false
      );
    }
  );

  it("strips an unknown key, as the h3Max image-to-video sibling does", () =>
    expect(schema.parse({ ...input, legacy: true })).not.toHaveProperty(
      "legacy"
    ));

  it("describes every documented field without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "seed",
      "enable_safety_checker",
      "sync_mode",
      "prompt_expansion_mode",
      "target_audio_url",
      "image_url",
      "end_image_url",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Static branch (P-7): the recorded 480P call asked for 0.92 s and fal
  // billed x-fal-billable-units 0.92, which its usage API priced at the
  // card's promotional $0.015/s. The entry carries the post-promotion list
  // rates (OQ-3), so the recorded payload estimates at 0.92 x $0.025.
  it.each([
    ["480P", 0.025],
    ["768P", 0.04],
    ["1080P", 0.08],
  ] as const)(
    "prices %s at its list rate per requested second",
    (tier, rate) => {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, resolution: tier, duration: 2 },
      });
      expect(estimate.usd).toBeCloseTo(rate * 2);
      expect(estimate.warnings).toEqual([]);
    }
  );

  it("prices the recorded fractional duration exactly", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, resolution: "480P", duration: 0.92 },
      }).usd
    ).toBeCloseTo(0.023));

  it("prices the default five seconds at 768P", () =>
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: input }).usd
    ).toBeCloseTo(0.2));

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/minimax/h3-max-turbo/image-to-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "h3mti2v"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "H3 Max Turbo Image To Video"
    );
  });
});
