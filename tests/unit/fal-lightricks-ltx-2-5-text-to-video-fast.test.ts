import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalLightricksLtx2p5TextToVideoFastParsedRequest,
  type FalLightricksLtx2p5TextToVideoFastRequest,
  type FalLightricksLtx2p5TextToVideoFastRequestInput,
  type FalLightricksLtx2p5TextToVideoFastResponse,
  type FalRunLightricksLtx2p5TextToVideoNamespace,
} from "@apicity/fal";
import {
  FalLightricksLtx2p5TextToVideoFastRequestSchema as schema,
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
// e28b04b1ed0b6c5db949484bb010eb2a010b8c795d72a2ab9e8a41fe946fa412, equal to
// the 2026-10-05 capture) and the sixteen unbilled 422 probes of the same day,
// which showed that upstream requires only `prompt`, bounds it at 1 to 5,000
// characters, and closes `duration`, `resolution`, `aspect_ratio`, `fps` and
// `camera_motion` to the documented values.
const endpoint = "lightricks/ltx-2.5/text-to-video/fast";
const input = {
  prompt:
    "Through-the-veil shot of a bride's face during an Indian wedding ceremony, camera positioned behind the sheer red dupatta fabric, the embroidered pattern creating a textured overlay on her face, her eyes lined with kohl looking down at henna-covered hands, marigold garlands in soft background bokeh, 85mm f/1.2 focused through the fabric layer, warm tungsten and candlelight, Mira Nair Monsoon Wedding intimacy",
};
const recorded = {
  ...input,
  duration: 6 as const,
  resolution: "720p" as const,
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Lightricks LTX-2.5 text-to-video fast contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.lightricks.ltx2p5.textToVideo.fast;
    expect(leaf).toBe(provider.post.run.lightricks.ltx2p5.textToVideo.fast);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // This item owns the new textToVideo object under the existing
    // lightricks.ltx2p5 object, beside its imageToVideo sibling; the
    // image-to-video fast leaf keeps its own function and schema.
    expect(provider.run.lightricks.ltx2p5).toHaveProperty("textToVideo");
    expect(provider.run.lightricks.ltx2p5.textToVideo).toHaveProperty(
      "fast",
      leaf
    );
    expect(provider.run.lightricks.ltx2p5.imageToVideo.fast).not.toBe(leaf);
    expect(provider.run.lightricks.ltx2p5.imageToVideo.fast.schema).not.toBe(
      schema
    );
    // Compile-time only: the public namespace and request types, and the
    // documented Output with its VideoFile shape, optionality included.
    expectTypeOf(
      provider.run.lightricks.ltx2p5.textToVideo
    ).toEqualTypeOf<FalRunLightricksLtx2p5TextToVideoNamespace>();
    expectTypeOf<FalLightricksLtx2p5TextToVideoFastRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalLightricksLtx2p5TextToVideoFastRequestInput>().toEqualTypeOf<FalLightricksLtx2p5TextToVideoFastRequest>();
    expectTypeOf<FalLightricksLtx2p5TextToVideoFastParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalLightricksLtx2p5TextToVideoFastResponse>().toEqualTypeOf<{
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
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ video: { url: "https://example.com/out.mp4" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.lightricks.ltx2p5.textToVideo.fast(recorded);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/lightricks/ltx-2.5/text-to-video/fast"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires the prompt alone and applies the documented defaults", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      duration: "auto",
      resolution: "1080p",
      aspect_ratio: "16:9",
      fps: 25,
      generate_audio: true,
    });
    expect(schema.parse(recorded)).toStrictEqual({
      ...recorded,
      aspect_ratio: "16:9",
      fps: 25,
      generate_audio: true,
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ duration: 6, resolution: "720p" }).success).toBe(
      false
    );
  });

  it("bounds the prompt at 1 to 5,000 characters", () => {
    expect(schema.safeParse({ prompt: "" }).success).toBe(false);
    expect(schema.safeParse({ prompt: "   " }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(5000) }).success).toBe(true);
    expect(schema.safeParse({ prompt: "p".repeat(5001) }).success).toBe(false);
  });

  it("rejects a prompt that is not a string, as upstream does", () => {
    expect(schema.safeParse({ prompt: 123 }).success).toBe(false);
  });

  it.each([6, 8, 10, 12, 14, 16, 18, 20, "auto"])(
    "accepts duration %s",
    (duration) =>
      expect(schema.safeParse({ ...input, duration }).success).toBe(true)
  );

  it.each([5, 7, 22, 8.5, "Auto", null])("rejects duration %s", (duration) =>
    expect(schema.safeParse({ ...input, duration }).success).toBe(false)
  );

  it.each(["720p", "1080p", "1440p", "2160p"])(
    "accepts resolution %s",
    (resolution) =>
      expect(schema.safeParse({ ...input, resolution }).success).toBe(true)
  );

  it.each(["720P", "4K", "4k", "480p", "auto", "", null])(
    "rejects resolution %s",
    (resolution) =>
      expect(schema.safeParse({ ...input, resolution }).success).toBe(false)
  );

  it.each(["16:9", "9:16"])("accepts aspect ratio %s", (aspect_ratio) =>
    expect(schema.safeParse({ ...input, aspect_ratio }).success).toBe(true)
  );

  it.each(["1:1", "auto", "", null])(
    "rejects aspect ratio %s",
    (aspect_ratio) =>
      expect(schema.safeParse({ ...input, aspect_ratio }).success).toBe(false)
  );

  it.each([24, 25, 48, 50])("accepts fps %i", (fps) =>
    expect(schema.safeParse({ ...input, fps }).success).toBe(true)
  );

  it.each([30, "25", null])("rejects fps %s", (fps) =>
    expect(schema.safeParse({ ...input, fps }).success).toBe(false)
  );

  it.each([true, false])("accepts generate_audio %s", (generate_audio) =>
    expect(schema.safeParse({ ...input, generate_audio }).success).toBe(true)
  );

  it.each(["maybe", null])("rejects generate_audio %s", (generate_audio) =>
    expect(schema.safeParse({ ...input, generate_audio }).success).toBe(false)
  );

  it.each([
    "dolly_in",
    "dolly_out",
    "dolly_left",
    "dolly_right",
    "jib_up",
    "jib_down",
    "static",
    "focus_shift",
    null,
  ])("accepts camera motion %s", (camera_motion) =>
    expect(schema.safeParse({ ...input, camera_motion }).success).toBe(true)
  );

  it.each(["zoom_in", "Dolly_In", ""])(
    "rejects camera motion %s",
    (camera_motion) =>
      expect(schema.safeParse({ ...input, camera_motion }).success).toBe(false)
  );

  it("strips an unknown field, as upstream ignores one", () => {
    const parsed = schema.parse({ ...input, bogus_field: 1 });
    expect(parsed).not.toHaveProperty("bogus_field");
  });

  it("describes every documented field in order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "duration",
      "resolution",
      "aspect_ratio",
      "fps",
      "generate_audio",
      "camera_motion",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Static branch (P-7 rules 2 and 3): fal's pricing API quotes $0.01 per
  // unit where the card quotes $0.09 to $0.30 per second, because fal counts
  // the charge in cents. The recorded 6 s 720p call billed
  // x-fal-billable-units 54.0, which its usage API priced at $0.01 each,
  // $0.54: the card's price for six seconds at 720p. The returned clip ran
  // 6.12 s, so the bill follows the requested seconds, not the file.
  it.each([
    ["720p", 0.09],
    ["1080p", 0.13],
    ["1440p", 0.19],
    ["2160p", 0.3],
  ] as const)(
    "prices %s at the card's rate per requested second",
    (resolution, rate) => {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, resolution, duration: 8 },
      });
      expect(estimate.usd).toBeCloseTo(rate * 8);
      expect(estimate.warnings).toEqual([]);
    }
  );

  it("prices the recorded payload at the billed $0.54", () =>
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: recorded }).usd
    ).toBeCloseTo(0.54));

  it("prices an omitted resolution at the default 1080p", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...input, duration: 6 },
      }).usd
    ).toBeCloseTo(0.78));

  it("prices by seconds and resolution alone, as the card does", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: {
          ...recorded,
          aspect_ratio: "9:16",
          fps: 50,
          generate_audio: false,
        },
      }).usd
    ).toBeCloseTo(0.54));

  // The duration defaults to "auto", which lets the model choose the length,
  // so an omitted or "auto" duration prices only through the cost-only hint.
  it.each([
    ["an omitted", input],
    ["an auto", { ...input, duration: "auto" as const }],
  ])("prices %s duration only through a length hint", (_label, payload) => {
    const unhinted = computeEstimate({ provider: "fal", endpoint, payload });
    expect(unhinted.usd).toBe(0);
    expect(unhinted.warnings.join(" ")).toMatch(/could not derive units/);
    expect(unhinted.warnings.join(" ")).toContain("costHints.durationSeconds");
    const hinted = computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      costHints: { durationSeconds: 10 },
    });
    expect(hinted.usd).toBeCloseTo(1.3);
    expect(hinted.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/lightricks/ltx-2.5/text-to-video/fast",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "ltx2p5f"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "LTX 2.5 Fast"
    );
  });
});
