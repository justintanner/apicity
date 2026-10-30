import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createFal,
  type FalKlingVideoO3ProVideoToVideoEditRequest,
  type FalKlingVideoO3ProVideoToVideoEditResponse,
} from "@apicity/fal";
import {
  FalKlingVideoO3ProVideoToVideoEditRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "fal-ai/kling-video/o3/pro/video-to-video/edit";
const video_url = "https://example.com/cat.mp4";
const url = "https://example.com/cat.jpg";
describe("Kling O3 Pro video editing", () => {
  it("owns the videoToVideo namespace with an edit leaf", () => {
    const p = createFal({ apiKey: "test-key" });
    const leaf = p.run.klingVideo.o3.pro.videoToVideo.edit;
    expect(leaf).toBe(p.post.run.klingVideo.o3.pro.videoToVideo.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(typeof p.run.klingVideo.o3.pro.referenceToVideo).toBe("function");
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKlingVideoO3ProVideoToVideoEditRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKlingVideoO3ProVideoToVideoEditResponse>();
  });
  it("requires prompt and video and defaults to keeping audio", () => {
    expect(schema.safeParse({ video_url }).success).toBe(false);
    expect(schema.safeParse({ prompt: "cat" }).success).toBe(false);
    expect(schema.parse({ video_url, prompt: "cat" })).toEqual({
      video_url,
      prompt: "cat",
      enable_safety_checker: true,
      keep_audio: true,
      shot_type: "customize",
    });
    expect(
      schema.safeParse({ video_url, prompt: "cat", shot_type: "intelligent" })
        .success
    ).toBe(false);
    expect(
      schema.safeParse({ video_url, prompt: "x".repeat(2501) }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        video_url: "data:video/mp4;base64,AAAA",
        prompt: "cat",
        keep_audio: false,
      }).success
    ).toBe(true);
  });
  it("caps combined references at four and element angles at three", () => {
    const element = { frontal_image_url: url, reference_image_urls: [url] };
    expect(
      schema.safeParse({
        video_url,
        prompt: "cat",
        elements: [element],
        image_urls: [url, url, url],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        video_url,
        prompt: "cat",
        elements: [element],
        image_urls: [url, url, url, url],
      }).success
    ).toBe(false);
    for (const references of [[], [url, url, url, url]])
      expect(
        schema.safeParse({
          video_url,
          prompt: "cat",
          elements: [{ ...element, reference_image_urls: references }],
        }).success
      ).toBe(false);
  });
  it("requires a duration hint and has no audio discount", () => {
    const estimate = (keep_audio: boolean) =>
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { video_url, prompt: "cat", keep_audio },
        costHints: { durationSeconds: 3 },
      });
    expect(estimate(false).usd).toBeCloseTo(0.504);
    expect(estimate(true).usd).toBeCloseTo(0.504);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { video_url, prompt: "cat" },
      }).warnings.length
    ).toBeGreaterThan(0);
  });
});
