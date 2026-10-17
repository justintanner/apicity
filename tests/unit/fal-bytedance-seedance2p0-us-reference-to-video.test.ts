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
  type FalBytedanceSeedance2p0UsReferenceToVideoRequest,
  type FalBytedanceSeedance2p0UsReferenceToVideoRequestInput,
  type FalBytedanceSeedance2p0UsReferenceToVideoParsedRequest,
  type FalBytedanceSeedance2p0UsReferenceToVideoResponse,
  type FalRunBytedanceSeedance2p0UsNamespace,
} from "@apicity/fal";
import {
  FalBytedanceSeedance2p0UsReferenceToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "bytedance/seedance-2.0/us/reference-to-video";
const payload = {
  prompt:
    "@Image1 follows the gentle head movement from @Video1, cinematic close-up.",
  image_urls: ["https://example.com/cat.jpg"],
  video_urls: ["https://example.com/ref.mp4"],
  resolution: "480p",
  duration: "4",
  aspect_ratio: "1:1",
  generate_audio: false,
} satisfies FalBytedanceSeedance2p0UsReferenceToVideoRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;
const urls = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => `https://example.com/${prefix}${i}`);

describe("Bytedance Seedance 2.0 US reference-to-video", () => {
  it("exports the owned us namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.bytedance.seedance2p0.us)).toEqual([
      "textToVideo",
      "imageToVideo",
      "referenceToVideo",
    ]);
    expect(p.run.bytedance.seedance2p0.us.referenceToVideo).toBe(
      p.post.run.bytedance.seedance2p0.us.referenceToVideo
    );
    expect(p.run.bytedance.seedance2p0.us.referenceToVideo.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.bytedance.seedance2p0.us
    ).toEqualTypeOf<FalRunBytedanceSeedance2p0UsNamespace>();
    expectTypeOf(p.run.bytedance.seedance2p0.us.referenceToVideo)
      .parameter(0)
      .toEqualTypeOf<FalBytedanceSeedance2p0UsReferenceToVideoRequest>();
    expectTypeOf(
      p.run.bytedance.seedance2p0.us.referenceToVideo
    ).returns.resolves.toEqualTypeOf<FalBytedanceSeedance2p0UsReferenceToVideoResponse>();
    expectTypeOf<FalBytedanceSeedance2p0UsReferenceToVideoRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p0UsReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("leaves the existing non-US seedance 2.0 reference leaves in place", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(p.run.bytedance.seedance2p0.us.referenceToVideo).not.toBe(
      p.run.bytedance.seedance2p0.referenceToVideo
    );
    expect(typeof p.run.bytedance.seedance2p0.referenceToVideo).toBe(
      "function"
    );
    expect(typeof p.run.bytedance.seedance2p0.fast.referenceToVideo).toBe(
      "function"
    );
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalBytedanceSeedance2p0UsReferenceToVideoResponse = {
      video: {
        url: "https://example.com/seedance-us-reference.mp4",
        content_type: "video/mp4",
        file_name: null,
        file_size: null,
      },
      seed: 42,
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
      await p.run.bytedance.seedance2p0.us.referenceToVideo(payload)
    ).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.0/us/reference-to-video"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output declares both video and seed required.
    expectTypeOf<{
      video: { url: string };
      seed: number;
    }>().toExtend<FalBytedanceSeedance2p0UsReferenceToVideoResponse>();
    expectTypeOf<{
      video: { url: string };
    }>().not.toExtend<FalBytedanceSeedance2p0UsReferenceToVideoResponse>();
  });
  it("requires the prompt and applies all documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(valid({ prompt: undefined })).toBe(false);
    expect(valid({ prompt: null })).toBe(false);
    expect(valid({ prompt: 1 })).toBe(false);
    expect(schema.parse({ prompt: payload.prompt })).toEqual({
      prompt: payload.prompt,
      resolution: "720p",
      duration: "auto",
      aspect_ratio: "auto",
      generate_audio: true,
      bitrate_mode: "standard",
      codec: "auto",
    });
    for (const key of [
      "resolution",
      "duration",
      "aspect_ratio",
      "generate_audio",
      "bitrate_mode",
      "codec",
    ])
      expect(valid({ [key]: null })).toBe(false);
  });
  it("takes optional string arrays of up to 9 images, 3 videos and 3 audios", () => {
    for (const key of ["image_urls", "video_urls", "audio_urls"]) {
      expect(valid({ [key]: undefined })).toBe(true);
      expect(valid({ [key]: null })).toBe(false);
      expect(valid({ [key]: "https://example.com/a" })).toBe(false);
      expect(valid({ [key]: [7] })).toBe(false);
    }
    expect(valid({ image_urls: urls("i", 9) })).toBe(true);
    expect(valid({ image_urls: urls("i", 10) })).toBe(false);
    expect(valid({ video_urls: urls("v", 3) })).toBe(true);
    expect(valid({ video_urls: urls("v", 4) })).toBe(false);
    expect(valid({ audio_urls: urls("a", 3) })).toBe(true);
    expect(valid({ audio_urls: urls("a", 4) })).toBe(false);
  });
  it("caps the files across all modalities at 12", () => {
    const at = (images: number, videos: number, audios: number) =>
      schema.safeParse({
        prompt: "combine the references",
        image_urls: urls("i", images),
        video_urls: urls("v", videos),
        audio_urls: urls("a", audios),
      });
    expect(at(9, 3, 0).success).toBe(true);
    expect(at(6, 3, 3).success).toBe(true);
    for (const result of [at(9, 3, 1), at(9, 1, 3), at(9, 3, 3)]) {
      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected failure");
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "Total files across all modalities must not exceed 12"
      );
    }
  });
  it("requires an image or video when audio is provided", () => {
    const audioOnly = schema.safeParse({
      prompt: "follow the rhythm",
      audio_urls: ["https://example.com/audio.mp3"],
    });
    expect(audioOnly.success).toBe(false);
    if (audioOnly.success) throw new Error("expected failure");
    expect(audioOnly.error.issues).toEqual([
      expect.objectContaining({
        path: ["audio_urls"],
        message: "Audio references require at least one image or video",
      }),
    ]);
    for (const reference of [
      { image_urls: ["https://example.com/image.jpg"] },
      { video_urls: ["https://example.com/video.mp4"] },
    ])
      expect(
        schema.safeParse({
          prompt: "follow the rhythm",
          audio_urls: ["https://example.com/audio.mp3"],
          ...reference,
        }).success
      ).toBe(true);
    expect(
      schema.safeParse({ prompt: "follow the rhythm", audio_urls: [] }).success
    ).toBe(true);
  });
  it("takes 480p through 4k and nothing else", () => {
    for (const resolution of ["480p", "720p", "1080p", "4k"])
      expect(valid({ resolution })).toBe(true);
    for (const resolution of ["240p", "2k", "4K", "1440p", 480])
      expect(valid({ resolution })).toBe(false);
  });
  it("bounds duration to auto or the digit strings 4 through 15", () => {
    for (const duration of ["auto", "4", "10", "15"])
      expect(valid({ duration })).toBe(true);
    for (const duration of ["3", "16", "4.5", "4s", 4])
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
  it("accepts null or omission for the optional end user id", () => {
    expect(valid({ end_user_id: null })).toBe(true);
    expect(valid({ end_user_id: undefined })).toBe(true);
    expect(valid({ end_user_id: "user-1" })).toBe(true);
    expect(valid({ end_user_id: 1 })).toBe(false);
  });
  it("leaves the input open, as upstream does not close it", () => {
    expect(valid({ seed: 7 })).toBe(true);
  });
});

describe("Bytedance Seedance 2.0 US reference-to-video pricing", () => {
  // The recorded 480p, 1:1, 4 s call with one 4 s reference video billed
  // 47.43168 units ($0.796852224) for a 640x640 clip of 97 frames. An
  // output-only 16:9 per-second table predicts 23.328, and the reference
  // video's length is not a request field, so it stays dynamic (P-7 rules 1, 4).
  it("stays dynamically priced because the reference video's length bills", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeUndefined();
    expect(Object.keys(MODEL_SLUGS.fal)).not.toContain(endpoint);
    expect(Object.keys(MODEL_DISPLAY.fal)).not.toContain(endpoint);
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(0);
  });
});
