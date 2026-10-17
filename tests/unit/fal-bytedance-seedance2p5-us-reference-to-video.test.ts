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
  type FalBytedanceSeedance2p5UsReferenceToVideoRequest,
  type FalBytedanceSeedance2p5UsReferenceToVideoRequestInput,
  type FalBytedanceSeedance2p5UsReferenceToVideoParsedRequest,
  type FalBytedanceSeedance2p5UsReferenceToVideoResponse,
  type FalRunBytedanceSeedance2p5UsNamespace,
} from "@apicity/fal";
import {
  FalBytedanceSeedance2p5UsReferenceToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "bytedance/seedance-2.5/us/reference-to-video";
const payload = {
  prompt:
    "@Image1 follows the gentle head movement from @Video1, cinematic close-up.",
  image_urls: ["https://example.com/cat.jpg"],
  video_urls: ["https://example.com/ref.mp4"],
  resolution: "480p",
  duration: "4",
  aspect_ratio: "1:1",
  generate_audio: false,
} satisfies FalBytedanceSeedance2p5UsReferenceToVideoRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;
const urls = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => `https://example.com/${prefix}${i}`);

describe("Bytedance Seedance 2.5 US reference-to-video", () => {
  it("exports the owned us namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.bytedance.seedance2p5.us)).toEqual([
      "textToVideo",
      "imageToVideo",
      "referenceToVideo",
    ]);
    expect(p.run.bytedance.seedance2p5.us.referenceToVideo).toBe(
      p.post.run.bytedance.seedance2p5.us.referenceToVideo
    );
    expect(p.run.bytedance.seedance2p5.us.referenceToVideo.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.bytedance.seedance2p5.us
    ).toEqualTypeOf<FalRunBytedanceSeedance2p5UsNamespace>();
    expectTypeOf(p.run.bytedance.seedance2p5.us.referenceToVideo)
      .parameter(0)
      .toEqualTypeOf<FalBytedanceSeedance2p5UsReferenceToVideoRequest>();
    expectTypeOf(
      p.run.bytedance.seedance2p5.us.referenceToVideo
    ).returns.resolves.toEqualTypeOf<FalBytedanceSeedance2p5UsReferenceToVideoResponse>();
    expectTypeOf<FalBytedanceSeedance2p5UsReferenceToVideoRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p5UsReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("leaves the existing non-US seedance 2.5 reference leaf in place", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(p.run.bytedance.seedance2p5.us.referenceToVideo).not.toBe(
      p.run.bytedance.seedance2p5.referenceToVideo
    );
    expect(typeof p.run.bytedance.seedance2p5.referenceToVideo).toBe(
      "function"
    );
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalBytedanceSeedance2p5UsReferenceToVideoResponse = {
      video: {
        url: "https://example.com/seedance-2p5-us-r2v.mp4",
        content_type: "video/mp4",
        file_name: null,
        file_size: null,
      },
      seed: 42,
      draft_id: null,
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
    expect(
      await p.run.bytedance.seedance2p5.us.referenceToVideo(payload)
    ).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.5/us/reference-to-video"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output requires video and seed; draft_id is optional and nullable.
    expectTypeOf<{
      video: { url: string };
      seed: number;
    }>().toExtend<FalBytedanceSeedance2p5UsReferenceToVideoResponse>();
    expectTypeOf<{
      video: { url: string };
      seed: number;
      draft_id: string;
    }>().toExtend<FalBytedanceSeedance2p5UsReferenceToVideoResponse>();
    expectTypeOf<{
      video: { url: string };
    }>().not.toExtend<FalBytedanceSeedance2p5UsReferenceToVideoResponse>();
  });
  it("requires nothing and applies all documented defaults", () => {
    expect(schema.parse({})).toEqual({
      task: "reference",
      resolution: "720p",
      duration: "auto",
      aspect_ratio: "auto",
      generate_audio: true,
      bitrate_mode: "standard",
      codec: "auto",
    });
    for (const key of [
      "task",
      "resolution",
      "duration",
      "aspect_ratio",
      "generate_audio",
      "bitrate_mode",
      "codec",
    ])
      expect(valid({ [key]: null })).toBe(false);
  });
  it("takes an optional nullable prompt, seed and end user id", () => {
    for (const prompt of [undefined, null, "follow the motion"])
      expect(valid({ prompt })).toBe(true);
    expect(valid({ prompt: 1 })).toBe(false);
    for (const seed of [undefined, null, 0, 42])
      expect(valid({ seed })).toBe(true);
    for (const seed of [1.5, "42"]) expect(valid({ seed })).toBe(false);
    for (const end_user_id of [undefined, null, "user-1"])
      expect(valid({ end_user_id })).toBe(true);
    expect(valid({ end_user_id: 1 })).toBe(false);
  });
  it("takes the three task types", () => {
    for (const task of ["reference", "editing", "extension"])
      expect(valid({ task })).toBe(true);
    for (const task of ["bogus", "Reference"])
      expect(valid({ task })).toBe(false);
  });
  it("caps references at 30 images, 10 videos and 10 audios", () => {
    for (const key of ["image_urls", "video_urls", "audio_urls"]) {
      expect(valid({ [key]: undefined })).toBe(true);
      expect(valid({ [key]: null })).toBe(false);
      expect(valid({ [key]: "https://example.com/a" })).toBe(false);
      expect(valid({ [key]: [7] })).toBe(false);
    }
    // 30 + 10 + 10 is also the documented 50-file total.
    expect(
      valid({
        image_urls: urls("i", 30),
        video_urls: urls("v", 10),
        audio_urls: urls("a", 10),
      })
    ).toBe(true);
    expect(valid({ image_urls: urls("i", 31) })).toBe(false);
    expect(valid({ video_urls: urls("v", 11) })).toBe(false);
    expect(valid({ audio_urls: urls("a", 11) })).toBe(false);
  });
  it("takes 480p, 720p or 1080p and refuses 4k", () => {
    for (const resolution of ["480p", "720p", "1080p"])
      expect(valid({ resolution })).toBe(true);
    for (const resolution of ["4k", "240p", "1440p", 480])
      expect(valid({ resolution })).toBe(false);
  });
  it("bounds duration to auto or the digit strings 4 through 30", () => {
    for (const duration of ["auto", "4", "15", "16", "30"])
      expect(valid({ duration })).toBe(true);
    for (const duration of ["3", "31", "4.5", "4s", 4])
      expect(valid({ duration })).toBe(false);
  });
  it("takes the seven aspect ratios, two bitrate modes and three codecs", () => {
    for (const aspect_ratio of [
      "auto",
      "21:9",
      "16:9",
      "4:3",
      "1:1",
      "3:4",
      "9:16",
    ])
      expect(valid({ aspect_ratio })).toBe(true);
    expect(valid({ aspect_ratio: "2:3" })).toBe(false);
    for (const bitrate_mode of ["standard", "high"])
      expect(valid({ bitrate_mode })).toBe(true);
    expect(valid({ bitrate_mode: "low" })).toBe(false);
    for (const codec of ["auto", "H264", "H265"])
      expect(valid({ codec })).toBe(true);
    for (const codec of ["h264", "VP9"]) expect(valid({ codec })).toBe(false);
  });
  it("takes a boolean generate_audio only", () => {
    for (const generate_audio of [true, false])
      expect(valid({ generate_audio })).toBe(true);
    expect(valid({ generate_audio: "false" })).toBe(false);
  });
  it("leaves the input open, as upstream does not close it", () => {
    expect(valid({ fps: 24 })).toBe(true);
  });
});

describe("Bytedance Seedance 2.5 US reference-to-video pricing", () => {
  // The recorded 480p, 1:1, 4 s call with one 4.000 s, 96-frame reference
  // video billed 46.32 units ($1.1894976) for a 640x640 clip of 97 frames:
  // 0.6 x 640 x 640 x (96 + 97) / 1024 tokens. The clip's length is
  // declared through costHints.inputDurationSeconds (ac-j3d6ki.3).
  it("prices the recorded call from its output and clip tokens", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeDefined();
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("sd2p5");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Seedance 2.5 US"
    );
    const result = computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      costHints: { inputDurationSeconds: 4 },
    });
    expect(result.usd).toBeCloseTo(1.1894976, 10);
    expect(result.breakdown.units).toBeCloseTo(46320, 6);
    expect(result.warnings).toEqual([]);
  });

  it("fails closed without the reference clip's length", () => {
    const result = computeEstimate({ provider: "fal", endpoint, payload });
    expect(result.usd).toBe(0);
    expect(result.warnings[0]).toContain("costHints.inputDurationSeconds");
  });
});
