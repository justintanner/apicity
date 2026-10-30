import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createFal,
  type FalKlingVideoO3ProVideoToVideoReferenceRequest,
  type FalKlingVideoO3ProVideoToVideoReferenceResponse,
} from "@apicity/fal";
import {
  FalKlingVideoO3ProVideoToVideoReferenceRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "fal-ai/kling-video/o3/pro/video-to-video/reference";
const video_url = "https://example.com/cat.mp4";
const url = "https://example.com/cat.jpg";
describe("Kling O3 Pro video reference", () => {
  it("adds a reference leaf beside video editing", () => {
    const p = createFal({ apiKey: "test-key" });
    const leaf = p.run.klingVideo.o3.pro.videoToVideo.reference;
    expect(leaf).toBe(p.post.run.klingVideo.o3.pro.videoToVideo.reference);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(typeof p.run.klingVideo.o3.pro.referenceToVideo).toBe("function");
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKlingVideoO3ProVideoToVideoReferenceRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKlingVideoO3ProVideoToVideoReferenceResponse>();
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
      aspect_ratio: "auto",
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
  it("validates optional duration and aspect controls", () => {
    for (const duration of ["3", "15", null])
      expect(
        schema.safeParse({ video_url, prompt: "cat", duration }).success
      ).toBe(true);
    for (const duration of ["2", "16", 3])
      expect(
        schema.safeParse({ video_url, prompt: "cat", duration }).success
      ).toBe(false);
    for (const aspect_ratio of ["auto", "16:9", "9:16", "1:1"])
      expect(
        schema.safeParse({ video_url, prompt: "cat", aspect_ratio }).success
      ).toBe(true);
  });
  it("prices explicit output duration or a hint without an audio discount", () => {
    for (const keep_audio of [false, true])
      expect(
        computeEstimate({
          provider: "fal",
          endpoint,
          payload: { video_url, prompt: "cat", keep_audio, duration: "3" },
        }).usd
      ).toBeCloseTo(0.504);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { video_url, prompt: "cat" },
        costHints: { durationSeconds: 3 },
      }).usd
    ).toBeCloseTo(0.504);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { video_url, prompt: "cat", duration: null },
        costHints: { durationSeconds: 5 },
      }).usd
    ).toBeCloseTo(0.84);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { video_url, prompt: "cat" },
      }).warnings.length
    ).toBeGreaterThan(0);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { video_url, prompt: "cat", duration: "16" },
      }).warnings.length
    ).toBeGreaterThan(0);
  });
});
