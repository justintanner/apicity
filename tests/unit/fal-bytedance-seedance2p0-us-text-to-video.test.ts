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
  type FalBytedanceSeedance2p0UsTextToVideoRequest,
  type FalBytedanceSeedance2p0UsTextToVideoRequestInput,
  type FalBytedanceSeedance2p0UsTextToVideoParsedRequest,
  type FalBytedanceSeedance2p0UsTextToVideoResponse,
  type FalRunBytedanceSeedance2p0UsNamespace,
} from "@apicity/fal";
import {
  FalBytedanceSeedance2p0UsTextToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "bytedance/seedance-2.0/us/text-to-video";
const payload = {
  prompt:
    "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
  resolution: "480p",
  duration: "4",
  aspect_ratio: "1:1",
  generate_audio: false,
} satisfies FalBytedanceSeedance2p0UsTextToVideoRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("Bytedance Seedance 2.0 US text-to-video", () => {
  it("exports the owned us namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.bytedance.seedance2p0.us)).toEqual([
      "textToVideo",
      "imageToVideo",
      "referenceToVideo",
    ]);
    expect(p.run.bytedance.seedance2p0.us.textToVideo).toBe(
      p.post.run.bytedance.seedance2p0.us.textToVideo
    );
    expect(p.run.bytedance.seedance2p0.us.textToVideo.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.bytedance.seedance2p0.us
    ).toEqualTypeOf<FalRunBytedanceSeedance2p0UsNamespace>();
    expectTypeOf(p.run.bytedance.seedance2p0.us.textToVideo)
      .parameter(0)
      .toEqualTypeOf<FalBytedanceSeedance2p0UsTextToVideoRequest>();
    expectTypeOf(
      p.run.bytedance.seedance2p0.us.textToVideo
    ).returns.resolves.toEqualTypeOf<FalBytedanceSeedance2p0UsTextToVideoResponse>();
    expectTypeOf<FalBytedanceSeedance2p0UsTextToVideoRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p0UsTextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("leaves the existing non-US seedance 2.0 leaves in place", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(p.run.bytedance.seedance2p0.us.textToVideo).not.toBe(
      p.run.bytedance.seedance2p0.textToVideo
    );
    expect(typeof p.run.bytedance.seedance2p0.textToVideo).toBe("function");
    expect(typeof p.run.bytedance.seedance2p0.fast.textToVideo).toBe(
      "function"
    );
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalBytedanceSeedance2p0UsTextToVideoResponse = {
      video: {
        url: "https://example.com/seedance-us.mp4",
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
    expect(await p.run.bytedance.seedance2p0.us.textToVideo(payload)).toEqual(
      response
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.0/us/text-to-video"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output declares both video and seed required.
    expectTypeOf<{
      video: { url: string };
      seed: number;
    }>().toExtend<FalBytedanceSeedance2p0UsTextToVideoResponse>();
    expectTypeOf<{
      video: { url: string };
    }>().not.toExtend<FalBytedanceSeedance2p0UsTextToVideoResponse>();
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
  it("takes 480p through 4k and nothing else", () => {
    for (const resolution of ["480p", "720p", "1080p", "4k"])
      expect(valid({ resolution })).toBe(true);
    for (const resolution of ["2k", "4K", "1440p", 480])
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

describe("Bytedance Seedance 2.0 US text-to-video pricing", () => {
  // The recorded 480p, 1:1, "4" s call billed 38.8 units of 1000 tokens
  // ($0.65184): 640x640 (ByteDance's published 480p 1:1 size) at 97 frames,
  // 640 x 640 x 97 / 1024 tokens at the card's $0.0168 (ac-j3d6ki.3).
  it("prices the recorded call from its output tokens", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeDefined();
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("sd2");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Seedance 2 US"
    );
    const result = computeEstimate({ provider: "fal", endpoint, payload });
    expect(result.usd).toBeCloseTo(0.65184, 10);
    expect(result.breakdown.units).toBeCloseTo(38800, 6);
    expect(result.warnings).toEqual([]);
  });
});
