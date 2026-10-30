import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createFal,
  type FalKlingVideoO3ProImageToVideoRequest,
  type FalKlingVideoO3ProImageToVideoResponse,
} from "@apicity/fal";
import {
  FalKlingVideoO3ProImageToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

const endpoint = "fal-ai/kling-video/o3/pro/image-to-video";
const image_url = "https://example.com/cat.jpg";

describe("Kling O3 Pro image-to-video", () => {
  it("adds a leaf beside Pro text-to-video", () => {
    const p = createFal({ apiKey: "test-key" });
    const leaf = p.run.klingVideo.o3.pro.imageToVideo;
    expect(leaf).toBe(p.post.run.klingVideo.o3.pro.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(typeof p.run.klingVideo.o3.pro.textToVideo).toBe("function");
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKlingVideoO3ProImageToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKlingVideoO3ProImageToVideoResponse>();
  });
  it("requires a start frame and exactly one prompt mode", () => {
    expect(schema.safeParse({ prompt: "cat" }).success).toBe(false);
    expect(schema.safeParse({ image_url }).success).toBe(false);
    expect(
      schema.safeParse({
        image_url,
        prompt: "cat",
        multi_prompt: [{ prompt: "cat" }],
      }).success
    ).toBe(false);
    expect(
      schema.parse({ image_url, multi_prompt: [{ prompt: "cat" }] })
        .multi_prompt
    ).toEqual([{ prompt: "cat", duration: "5" }]);
    expect(schema.parse({ image_url, prompt: "cat" })).toEqual({
      image_url,
      prompt: "cat",
      duration: "5",
      generate_audio: false,
      enable_safety_checker: true,
      shot_type: "customize",
    });
  });
  it("supports data URIs, optional end frames, and documented duration boundaries", () => {
    expect(
      schema.safeParse({
        image_url: "data:image/jpeg;base64,AAAA",
        prompt: "cat",
        end_image_url: null,
        duration: "3",
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        image_url,
        prompt: "cat",
        end_image_url: image_url,
        duration: "15",
      }).success
    ).toBe(true);
    for (const duration of ["2", "16", 3])
      expect(
        schema.safeParse({ image_url, prompt: "cat", duration }).success
      ).toBe(false);
    expect(
      schema.safeParse({ image_url, prompt: "x".repeat(2501) }).success
    ).toBe(false);
    expect(
      schema.safeParse({ image_url: "file:///cat.jpg", prompt: "cat" }).success
    ).toBe(false);
  });
  it("prices requested seconds with the Pro audio rates", () => {
    const estimate = (payload: Record<string, unknown>) =>
      computeEstimate({ provider: "fal", endpoint, payload });
    expect(
      estimate({
        image_url,
        prompt: "cat",
        duration: "3",
        generate_audio: false,
      }).usd
    ).toBeCloseTo(0.336);
    expect(estimate({ image_url, prompt: "cat" }).usd).toBeCloseTo(0.56);
    expect(
      estimate({ image_url, prompt: "cat", generate_audio: true }).usd
    ).toBeCloseTo(0.7);
    expect(
      estimate({ image_url, multi_prompt: [{ prompt: "cat", duration: "3" }] })
        .warnings.length
    ).toBeGreaterThan(0);
  });
});
