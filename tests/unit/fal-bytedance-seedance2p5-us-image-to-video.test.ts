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
  type FalBytedanceSeedance2p5UsImageToVideoRequest,
  type FalBytedanceSeedance2p5UsImageToVideoRequestInput,
  type FalBytedanceSeedance2p5UsImageToVideoParsedRequest,
  type FalBytedanceSeedance2p5UsImageToVideoResponse,
  type FalRunBytedanceSeedance2p5UsNamespace,
} from "@apicity/fal";
import {
  FalBytedanceSeedance2p5UsImageToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "bytedance/seedance-2.5/us/image-to-video";
const payload = {
  prompt:
    "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
  image_url: "https://example.com/cat.jpg",
  resolution: "480p",
  duration: "4",
  aspect_ratio: "auto",
  generate_audio: false,
} satisfies FalBytedanceSeedance2p5UsImageToVideoRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("Bytedance Seedance 2.5 US image-to-video", () => {
  it("exports the owned us namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.bytedance.seedance2p5.us)).toEqual([
      "textToVideo",
      "imageToVideo",
      "referenceToVideo",
    ]);
    expect(p.run.bytedance.seedance2p5.us.imageToVideo).toBe(
      p.post.run.bytedance.seedance2p5.us.imageToVideo
    );
    expect(p.run.bytedance.seedance2p5.us.imageToVideo.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.bytedance.seedance2p5.us
    ).toEqualTypeOf<FalRunBytedanceSeedance2p5UsNamespace>();
    expectTypeOf(p.run.bytedance.seedance2p5.us.imageToVideo)
      .parameter(0)
      .toEqualTypeOf<FalBytedanceSeedance2p5UsImageToVideoRequest>();
    expectTypeOf(
      p.run.bytedance.seedance2p5.us.imageToVideo
    ).returns.resolves.toEqualTypeOf<FalBytedanceSeedance2p5UsImageToVideoResponse>();
    expectTypeOf<FalBytedanceSeedance2p5UsImageToVideoRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p5UsImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("leaves the existing non-US seedance 2.5 leaves in place", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(p.run.bytedance.seedance2p5.us.imageToVideo).not.toBe(
      p.run.bytedance.seedance2p5.imageToVideo
    );
    expect(typeof p.run.bytedance.seedance2p5.imageToVideo).toBe("function");
    expect(typeof p.run.bytedance.seedance2p5.us.textToVideo).toBe("function");
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalBytedanceSeedance2p5UsImageToVideoResponse = {
      video: {
        url: "https://example.com/seedance-2p5-us-i2v.mp4",
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
    expect(await p.run.bytedance.seedance2p5.us.imageToVideo(payload)).toEqual(
      response
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.5/us/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output requires video and seed; draft_id is optional and nullable.
    expectTypeOf<{
      video: { url: string };
      seed: number;
    }>().toExtend<FalBytedanceSeedance2p5UsImageToVideoResponse>();
    expectTypeOf<{
      video: { url: string };
      seed: number;
      draft_id: string;
    }>().toExtend<FalBytedanceSeedance2p5UsImageToVideoResponse>();
    expectTypeOf<{
      video: { url: string };
    }>().not.toExtend<FalBytedanceSeedance2p5UsImageToVideoResponse>();
  });
  it("requires only the image and applies all documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    for (const image_url of [undefined, null, 7])
      expect(valid({ image_url })).toBe(false);
    expect(schema.parse({ image_url: payload.image_url })).toEqual({
      image_url: payload.image_url,
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
  it("takes an optional nullable prompt and end frame", () => {
    for (const prompt of [undefined, null, "turn toward the camera"])
      expect(valid({ prompt })).toBe(true);
    expect(valid({ prompt: 1 })).toBe(false);
    for (const end_image_url of [
      undefined,
      null,
      "https://example.com/end.jpg",
    ])
      expect(valid({ end_image_url })).toBe(true);
    expect(valid({ end_image_url: 7 })).toBe(false);
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
  it("holds aspect_ratio to the documented const auto", () => {
    // fal's validator accepted "1:1" in a free probe, but the published
    // Input declares const "auto" ("Always auto for image-to-video").
    expect(valid({ aspect_ratio: "auto" })).toBe(true);
    expect(valid({ aspect_ratio: undefined })).toBe(true);
    for (const aspect_ratio of ["1:1", "16:9", "Auto"])
      expect(valid({ aspect_ratio })).toBe(false);
  });
  it("takes two bitrate modes, three codecs and a boolean generate_audio", () => {
    for (const bitrate_mode of ["standard", "high"])
      expect(valid({ bitrate_mode })).toBe(true);
    expect(valid({ bitrate_mode: "low" })).toBe(false);
    for (const codec of ["auto", "H264", "H265"])
      expect(valid({ codec })).toBe(true);
    for (const codec of ["h264", "VP9"]) expect(valid({ codec })).toBe(false);
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

describe("Bytedance Seedance 2.5 US image-to-video pricing", () => {
  // The recorded 480p, 4 s call billed 38.671 units ($0.99307128): 648x630,
  // the input image's aspect, with 97 frames. aspect_ratio is the const
  // "auto" and ByteDance publishes no sizing rule for it, so no request field
  // fixes the output size and this stays dynamic while its text- and
  // reference-to-video twins are priced (P-7 rules 1, 4; ac-j3d6ki.3).
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
