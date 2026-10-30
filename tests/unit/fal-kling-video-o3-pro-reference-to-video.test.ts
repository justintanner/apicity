import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createFal,
  type FalKlingVideoO3ProReferenceToVideoRequest,
  type FalKlingVideoO3ProReferenceToVideoResponse,
} from "@apicity/fal";
import {
  FalKlingVideoO3ProReferenceToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "fal-ai/kling-video/o3/pro/reference-to-video";
const url = "https://example.com/cat.jpg";
describe("Kling O3 Pro reference-to-video", () => {
  it("adds the reference leaf beside existing Pro leaves", () => {
    const p = createFal({ apiKey: "test-key" });
    const leaf = p.run.klingVideo.o3.pro.referenceToVideo;
    expect(leaf).toBe(p.post.run.klingVideo.o3.pro.referenceToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(typeof p.run.klingVideo.o3.pro.imageToVideo).toBe("function");
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKlingVideoO3ProReferenceToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKlingVideoO3ProReferenceToVideoResponse>();
  });
  it("requires exactly one prompt mode and supplies the documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(
      schema.safeParse({ prompt: "cat", multi_prompt: [{ prompt: "cat" }] })
        .success
    ).toBe(false);
    expect(schema.parse({ prompt: "cat", image_urls: [url] })).toEqual({
      prompt: "cat",
      image_urls: [url],
      duration: "5",
      generate_audio: false,
      enable_safety_checker: true,
      shot_type: "customize",
      aspect_ratio: "16:9",
    });
    expect(
      schema.parse({ multi_prompt: [{ prompt: "cat" }] }).multi_prompt
    ).toEqual([{ prompt: "cat", duration: "5" }]);
  });
  it("accepts reference media and checks duration and prompt boundaries", () => {
    expect(
      schema.safeParse({
        prompt: "cat",
        start_image_url: url,
        end_image_url: null,
        image_urls: ["data:image/jpeg;base64,AAAA"],
        duration: "3",
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({ prompt: "x".repeat(2500), duration: "15" }).success
    ).toBe(true);
    expect(schema.safeParse({ prompt: "x".repeat(2501) }).success).toBe(false);
    for (const duration of ["2", "16", 3])
      expect(schema.safeParse({ prompt: "cat", duration }).success).toBe(false);
  });
  it("checks documented element reference and video limits", () => {
    const element = {
      frontal_image_url: url,
      reference_image_urls: [url],
      voice_id: null,
    };
    expect(
      schema.safeParse({ prompt: "cat", elements: [element] }).success
    ).toBe(true);
    for (const references of [[], [url, url, url, url]])
      expect(
        schema.safeParse({
          prompt: "cat",
          elements: [{ ...element, reference_image_urls: references }],
        }).success
      ).toBe(false);
    const video = { video_url: "https://example.com/cat.mp4" };
    expect(
      schema.safeParse({
        prompt: "cat",
        elements: [video],
        image_urls: [url, url, url],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({ prompt: "cat", elements: [video, video] }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        prompt: "cat",
        elements: [video],
        image_urls: [url, url, url, url],
      }).success
    ).toBe(false);
  });
  it("uses audio-dependent Pro rates", () => {
    const estimate = (payload: Record<string, unknown>) =>
      computeEstimate({ provider: "fal", endpoint, payload });
    expect(
      estimate({ prompt: "cat", duration: "3", generate_audio: false }).usd
    ).toBeCloseTo(0.336);
    expect(estimate({ prompt: "cat" }).usd).toBeCloseTo(0.56);
    expect(estimate({ prompt: "cat", generate_audio: true }).usd).toBeCloseTo(
      0.7
    );
    expect(
      estimate({ multi_prompt: [{ prompt: "cat", duration: "3" }] }).warnings
        .length
    ).toBeGreaterThan(0);
  });
});
