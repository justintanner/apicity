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
  type FalPixverseMusicVideoVibemvRequest,
  type FalPixverseMusicVideoVibemvRequestInput,
  type FalPixverseMusicVideoVibemvParsedRequest,
  type FalPixverseMusicVideoVibemvResponse,
  type FalRunPixverseNamespace,
  type FalRunPixverseMusicVideoNamespace,
} from "@apicity/fal";
import {
  FalPixverseMusicVideoVibemvRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "pixverse/music-video/vibemv";
const payload = {
  audio_url: "data:audio/wav;base64,UklGRg==",
} satisfies FalPixverseMusicVideoVibemvRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

const MUSIC_STYLES = [
  "Pop",
  "Rock",
  "Hip Hop",
  "R&B",
  "Jazz",
  "Reggae",
  "Country",
  "Folk",
  "Electronic",
  "Classical",
  "Soul",
  "Funk",
  "Metal",
  "Ambient",
  "Others",
];
const STYLES = [
  "Custom",
  "Cinematic",
  "Lo-fi",
  "Dreamscape",
  "Woolen Felt",
  "Candy",
  "Golden Age",
  "Voxel",
  "Retro Game",
  "Claymation",
  "Woodland Tale",
  "Impressionism",
  "Decadence",
  "Futuristic",
  "Chromatic Clash",
  "Holiday",
];

describe("PixVerse VibeMV music video", () => {
  it("exports the owned namespaces, schema, registry and input/output types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.pixverse)).toEqual(["musicVideo"]);
    expect(Object.keys(p.run.pixverse.musicVideo)).toEqual(["vibemv"]);
    expect(p.run.pixverse.musicVideo.vibemv).toBe(
      p.post.run.pixverse.musicVideo.vibemv
    );
    expect(p.run.pixverse.musicVideo.vibemv.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(p.run.pixverse).toEqualTypeOf<FalRunPixverseNamespace>();
    expectTypeOf(
      p.run.pixverse.musicVideo
    ).toEqualTypeOf<FalRunPixverseMusicVideoNamespace>();
    expectTypeOf(p.run.pixverse.musicVideo.vibemv)
      .parameter(0)
      .toEqualTypeOf<FalPixverseMusicVideoVibemvRequest>();
    expectTypeOf(
      p.run.pixverse.musicVideo.vibemv
    ).returns.resolves.toEqualTypeOf<FalPixverseMusicVideoVibemvResponse>();
    expectTypeOf<FalPixverseMusicVideoVibemvRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalPixverseMusicVideoVibemvParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalPixverseMusicVideoVibemvResponse = {
      video: {
        url: "https://example.com/vibemv.mp4",
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
    expect(await p.run.pixverse.musicVideo.vibemv(payload)).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://fal.run/pixverse/music-video/vibemv");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output declares video required; only its url is required inside.
    expectTypeOf<{
      video: { url: string };
    }>().toExtend<FalPixverseMusicVideoVibemvResponse>();
    expectTypeOf<{
      video?: { url: string };
    }>().not.toExtend<FalPixverseMusicVideoVibemvResponse>();
  });
  it("requires audio_url and applies all documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(valid({ audio_url: {} })).toBe(false);
    expect(valid({ audio_url: null })).toBe(false);
    expect(schema.parse(payload)).toEqual({
      audio_url: payload.audio_url,
      style: "Cinematic",
      aspect_ratio: "16:9",
      resolution: "720p",
      lip_sync_switch: false,
      enable_safety_checker: true,
    });
    // Input declares no minLength and no additionalProperties:false.
    expect(valid({ audio_url: "", extra: true })).toBe(true);
    for (const key of [
      "style",
      "aspect_ratio",
      "resolution",
      "lip_sync_switch",
      "enable_safety_checker",
    ])
      expect(valid({ [key]: null })).toBe(false);
  });
  it("accepts null or omission for the optional nullable fields", () => {
    for (const key of [
      "image_url",
      "style_image_url",
      "music_style",
      "lyrics",
    ]) {
      expect(valid({ [key]: null })).toBe(true);
      expect(valid({ [key]: undefined })).toBe(true);
    }
    expect(
      valid({
        image_url: "https://example.com/singer.jpg",
        style_image_url: "https://example.com/style.jpg",
        style: "Custom",
      })
    ).toBe(true);
    for (const key of ["image_url", "style_image_url"])
      expect(valid({ [key]: 1 })).toBe(false);
  });
  it("takes exactly the fifteen music styles and sixteen visual styles", () => {
    for (const music_style of MUSIC_STYLES)
      expect(valid({ music_style })).toBe(true);
    for (const music_style of ["pop", "Blues", ""])
      expect(valid({ music_style })).toBe(false);
    for (const style of STYLES) expect(valid({ style })).toBe(true);
    for (const style of ["cinematic", "Anime", ""])
      expect(valid({ style })).toBe(false);
  });
  it("takes the fixed aspect ratios, resolutions and booleans", () => {
    for (const aspect_ratio of ["16:9", "9:16", "1:1", "4:3", "3:4"])
      expect(valid({ aspect_ratio })).toBe(true);
    expect(valid({ aspect_ratio: "21:9" })).toBe(false);
    for (const resolution of ["720p", "1080p"])
      expect(valid({ resolution })).toBe(true);
    for (const resolution of ["480p", "4k"])
      expect(valid({ resolution })).toBe(false);
    for (const key of ["lip_sync_switch", "enable_safety_checker"]) {
      expect(valid({ [key]: true })).toBe(true);
      expect(valid({ [key]: false })).toBe(true);
      expect(valid({ [key]: "true" })).toBe(false);
    }
  });
  it("bounds lyrics to 5000 characters", () => {
    for (const lyrics of ["", "x".repeat(5000)])
      expect(valid({ lyrics })).toBe(true);
    for (const lyrics of [1, "x".repeat(5001)])
      expect(valid({ lyrics })).toBe(false);
  });
});

describe("PixVerse VibeMV pricing", () => {
  const estimate = (extra: Record<string, unknown>, durationSeconds?: number) =>
    computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...payload, ...extra },
      ...(durationSeconds === undefined
        ? {}
        : { costHints: { durationSeconds } }),
    });

  it("prices the recorded 12-second clip at 720p at exactly $0.72", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeDefined();
    expect(estimate({}, 12).usd).toBe(0.72);
    expect(MODEL_SLUGS.fal[endpoint]).toBe("vibemv");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("PixVerse VibeMV");
  });
  it("bills whole input seconds at the card's two resolution rates", () => {
    for (const [resolution, rate] of [
      ["720p", 0.06],
      ["1080p", 0.09],
    ] as const) {
      expect(estimate({ resolution }, 30).usd).toBeCloseTo(30 * rate, 10);
      // Rounded up to whole seconds.
      expect(estimate({ resolution }, 12.2).usd).toBeCloseTo(13 * rate, 10);
    }
  });
  it("applies the 10-second minimum and the 6-minute maximum", () => {
    expect(estimate({}, 3).usd).toBeCloseTo(0.6, 10);
    expect(estimate({}, 360).usd).toBeCloseTo(21.6, 10);
    expect(estimate({ resolution: "1080p" }, 400).usd).toBeCloseTo(32.4, 10);
  });
  it("fails closed without the input-length hint", () => {
    const result = estimate({});
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain("costHints.durationSeconds");
  });
});
