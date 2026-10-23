import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKlingV4TextToVideoParsedRequest,
  type FalKlingV4TextToVideoRequest,
  type FalKlingV4TextToVideoRequestInput,
  type FalKlingV4TextToVideoResponse,
  type FalRunKlingNamespace,
  type FalRunKlingV4Namespace,
} from "@apicity/fal";
import {
  FalKlingV4TextToVideoRequestSchema as schema,
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
// (sha256 ea74eb8549123787065241f081373a6d1da0272b1cb1a0206ae5be42d70f5e40).
const endpoint = "kling/v4/text-to-video";
const recorded = {
  prompt: "A red panda waves once, then holds still.",
  duration: 3,
  resolution: "720p",
} satisfies FalKlingV4TextToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

const usd = (payload: Record<string, unknown>) =>
  computeEstimate({ provider: "fal", endpoint, payload }).usd;

describe("Kling 4 text-to-video contract", () => {
  it("owns run.kling and its v4 object, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.kling.v4.textToVideo;
    expect(provider.run.kling.v4).toHaveProperty("textToVideo", leaf);
    expect(provider.run).toHaveProperty("klingVideo");
    expect(leaf).toBe(provider.post.run.kling.v4.textToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.kling).toEqualTypeOf<FalRunKlingNamespace>();
    expectTypeOf(provider.run.kling.v4).toEqualTypeOf<FalRunKlingV4Namespace>();
    expectTypeOf<FalKlingV4TextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKlingV4TextToVideoRequestInput>().toEqualTypeOf<FalKlingV4TextToVideoRequest>();
    expectTypeOf<FalKlingV4TextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKlingV4TextToVideoResponse>().toEqualTypeOf<{
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
    await provider.run.kling.v4.textToVideo(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/kling/v4/text-to-video");
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
      "multi_prompt",
      "duration",
      "resolution",
      "aspect_ratio",
    ]);
    expect(schema.parse({ prompt: "x" })).toEqual({
      prompt: "x",
      duration: 5,
      resolution: "1080p",
      aspect_ratio: "16:9",
    });
    expect(
      schema.parse({ multi_prompt: [{ prompt: "a" }] }).multi_prompt
    ).toEqual([{ prompt: "a", duration: 5 }]);
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(accepts({ duration: 2 })).toBe(false);
    expect(accepts({ duration: 30 })).toBe(true);
    expect(accepts({ duration: 31 })).toBe(false);
    expect(accepts({ aspect_ratio: "21:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:3" })).toBe(false);
    expect(accepts({ resolution: "480p" })).toBe(false);
    expect(accepts({ multi_prompt: [] })).toBe(false);
    expect(accepts({ multi_prompt: [{ prompt: "" }] })).toBe(false);
    expect(accepts({ multi_prompt: [{ prompt: "x".repeat(513) }] })).toBe(
      false
    );
    expect(accepts({ multi_prompt: [{ prompt: "a", duration: 0 }] })).toBe(
      false
    );
    expect(accepts({ multi_prompt: [{ prompt: "a", duration: 31 }] })).toBe(
      false
    );
    expect(
      accepts({ multi_prompt: [{ prompt: "a", duration: 1, foo: 1 }] })
    ).toBe(true);
    expect(accepts({ prompt: "x".repeat(26001) })).toBe(false);
    expect(accepts({ prompt: "   " })).toBe(true);
    expect(accepts({ prompt: null, multi_prompt: null })).toBe(true);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("prices requested seconds by resolution from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.471, 10);
    expect(estimate.breakdown).toMatchObject({ units: 3, unit: "seconds" });
    expect(estimate.warnings).toEqual([]);
    expect(usd({ prompt: "x" })).toBeCloseTo(1.175, 10);
    expect(usd({ prompt: "x", resolution: "720p", duration: 10 })).toBeCloseTo(
      1.57,
      10
    );
    // A multi-shot video runs the sum of its shot durations (5 s by default).
    expect(
      usd({
        multi_prompt: [{ prompt: "a", duration: 3 }, { prompt: "b" }],
        resolution: "720p",
      })
    ).toBeCloseTo(1.256, 10);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/kling/v4/text-to-video",
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
