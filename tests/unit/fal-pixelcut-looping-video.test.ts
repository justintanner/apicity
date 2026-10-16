import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "../../packages/provider/cost/src/slugs";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalPixelcutLoopingVideoRequest,
  type FalPixelcutLoopingVideoRequestInput,
  type FalPixelcutLoopingVideoParsedRequest,
  type FalPixelcutLoopingVideoResponse,
  type FalRunPixelcutNamespace,
} from "@apicity/fal";
import {
  FalPixelcutLoopingVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "pixelcut/looping-video";
const payload = {
  image_url: "data:image/jpeg;base64,Y2F0",
  duration: 5,
  resolution: "480p",
} satisfies FalPixelcutLoopingVideoRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("Pixelcut Looping Video", () => {
  it("exports the owned namespace, schema, registry and input/output types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.pixelcut)).toEqual(["loopingVideo"]);
    expect(p.run.pixelcut.loopingVideo).toBe(p.post.run.pixelcut.loopingVideo);
    expect(p.run.pixelcut.loopingVideo.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(p.run.pixelcut).toEqualTypeOf<FalRunPixelcutNamespace>();
    expectTypeOf(p.run.pixelcut.loopingVideo)
      .parameter(0)
      .toEqualTypeOf<FalPixelcutLoopingVideoRequest>();
    expectTypeOf(
      p.run.pixelcut.loopingVideo
    ).returns.resolves.toEqualTypeOf<FalPixelcutLoopingVideoResponse>();
    expectTypeOf<FalPixelcutLoopingVideoRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalPixelcutLoopingVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalPixelcutLoopingVideoResponse = {
      video: {
        url: "https://example.com/loop.mp4",
        content_type: "video/mp4",
        file_name: null,
        file_size: null,
      },
    };
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 })
      );
    const p = createFal({
      apiKey: "test-key",
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(await p.run.pixelcut.loopingVideo(payload)).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://fal.run/pixelcut/looping-video");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    const missing: FalPixelcutLoopingVideoResponse = {};
    expect(missing.video).toBeUndefined();
    expectTypeOf<{ video: null }>().toExtend<FalPixelcutLoopingVideoResponse>();
  });
  it("requires image_url and applies all documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(valid({ image_url: {} })).toBe(false);
    expect(schema.parse({ image_url: payload.image_url })).toEqual({
      image_url: payload.image_url,
      prompt: "",
      duration: 5,
      resolution: "1080p",
      motion: "subtle",
      include_audio: false,
    });
    // Input does not declare minLength or additionalProperties:false.
    expect(valid({ image_url: "", extra: true })).toBe(true);
    for (const key of [
      "image_url",
      "prompt",
      "duration",
      "resolution",
      "motion",
      "include_audio",
    ])
      expect(valid({ [key]: null })).toBe(false);
  });
  it("bounds duration to integer seconds 5 through 15", () => {
    for (const duration of [5, 10, 15]) expect(valid({ duration })).toBe(true);
    for (const duration of [4, 16, 5.5, "5"])
      expect(valid({ duration })).toBe(false);
  });
  it("bounds the optional prompt to 4000 characters", () => {
    for (const prompt of ["", "x".repeat(4000)])
      expect(valid({ prompt })).toBe(true);
    for (const prompt of [1, "x".repeat(4001)])
      expect(valid({ prompt })).toBe(false);
  });
  it("takes the fixed resolutions, motion styles and audio boolean", () => {
    for (const resolution of ["480p", "768p", "1080p"])
      expect(valid({ resolution })).toBe(true);
    expect(valid({ resolution: "720p" })).toBe(false);
    for (const motion of ["subtle", "spin"])
      expect(valid({ motion })).toBe(true);
    expect(valid({ motion: "pan" })).toBe(false);
    for (const include_audio of [true, false])
      expect(valid({ include_audio })).toBe(true);
    expect(valid({ include_audio: "true" })).toBe(false);
  });
});

describe("Pixelcut Looping Video pricing", () => {
  it("prices the recorded five seconds at 480p at exactly $0.40", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeDefined();
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(
      0.4
    );
    expect(MODEL_SLUGS.fal[endpoint]).toBe("pixelloop");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("Pixelcut Looping Video");
  });
  it("uses the card's three rates and upstream duration/resolution defaults", () => {
    for (const [resolution, rate] of [
      ["480p", 0.08],
      ["768p", 0.16],
      ["1080p", 0.32],
    ] as const) {
      for (const duration of [5, 15])
        expect(
          computeEstimate({
            provider: "fal",
            endpoint,
            payload: { image_url: payload.image_url, resolution, duration },
          }).usd
        ).toBeCloseTo(duration * rate, 10);
    }
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { image_url: payload.image_url },
      }).usd
    ).toBe(1.6);
  });
});
