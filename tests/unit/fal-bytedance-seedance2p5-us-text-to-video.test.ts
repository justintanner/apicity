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
  type FalBytedanceSeedance2p5UsTextToVideoRequest,
  type FalBytedanceSeedance2p5UsTextToVideoRequestInput,
  type FalBytedanceSeedance2p5UsTextToVideoParsedRequest,
  type FalBytedanceSeedance2p5UsTextToVideoResponse,
  type FalRunBytedanceSeedance2p5UsNamespace,
} from "@apicity/fal";
import {
  FalBytedanceSeedance2p5UsTextToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "bytedance/seedance-2.5/us/text-to-video";
const payload = {
  prompt:
    "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
  resolution: "480p",
  duration: "4",
  aspect_ratio: "1:1",
  generate_audio: false,
} satisfies FalBytedanceSeedance2p5UsTextToVideoRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("Bytedance Seedance 2.5 US text-to-video", () => {
  it("exports the owned us namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.bytedance.seedance2p5.us)).toEqual([
      "textToVideo",
    ]);
    expect(p.run.bytedance.seedance2p5.us.textToVideo).toBe(
      p.post.run.bytedance.seedance2p5.us.textToVideo
    );
    expect(p.run.bytedance.seedance2p5.us.textToVideo.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.bytedance.seedance2p5.us
    ).toEqualTypeOf<FalRunBytedanceSeedance2p5UsNamespace>();
    expectTypeOf(p.run.bytedance.seedance2p5.us.textToVideo)
      .parameter(0)
      .toEqualTypeOf<FalBytedanceSeedance2p5UsTextToVideoRequest>();
    expectTypeOf(
      p.run.bytedance.seedance2p5.us.textToVideo
    ).returns.resolves.toEqualTypeOf<FalBytedanceSeedance2p5UsTextToVideoResponse>();
    expectTypeOf<FalBytedanceSeedance2p5UsTextToVideoRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p5UsTextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("leaves the existing non-US seedance 2.5 leaves in place", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(p.run.bytedance.seedance2p5.us.textToVideo).not.toBe(
      p.run.bytedance.seedance2p5.textToVideo
    );
    expect(typeof p.run.bytedance.seedance2p5.textToVideo).toBe("function");
    expect(typeof p.run.bytedance.seedance2p5.imageToVideo).toBe("function");
    expect(typeof p.run.bytedance.seedance2p5.referenceToVideo).toBe(
      "function"
    );
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalBytedanceSeedance2p5UsTextToVideoResponse = {
      video: {
        url: "https://example.com/seedance-2p5-us.mp4",
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
    expect(await p.run.bytedance.seedance2p5.us.textToVideo(payload)).toEqual(
      response
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.5/us/text-to-video"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output requires video and seed; draft_id is optional and nullable.
    expectTypeOf<{
      video: { url: string };
      seed: number;
    }>().toExtend<FalBytedanceSeedance2p5UsTextToVideoResponse>();
    expectTypeOf<{
      video: { url: string };
      seed: number;
      draft_id: string;
    }>().toExtend<FalBytedanceSeedance2p5UsTextToVideoResponse>();
    expectTypeOf<{
      video: { url: string };
    }>().not.toExtend<FalBytedanceSeedance2p5UsTextToVideoResponse>();
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

describe("Bytedance Seedance 2.5 US text-to-video pricing", () => {
  // The recorded 480p, 1:1, 4 s call billed 38.8 units ($0.996384): 640x640
  // with 97 frames. The seedance 2.5 table predicts 38.88; output dimensions
  // and frame count keep this dynamic (P-7 rules 1, 4).
  it("stays dynamically priced because output frames set the charge", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeUndefined();
    expect(Object.keys(MODEL_SLUGS.fal)).not.toContain(endpoint);
    expect(Object.keys(MODEL_DISPLAY.fal)).not.toContain(endpoint);
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(0);
  });
});
