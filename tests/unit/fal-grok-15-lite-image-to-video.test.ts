import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalXaiGrokImagineVideoV1p5LiteImageToVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "xai/grok-imagine-video/v1.5/lite/image-to-video";
describe("Grok 1.5 Lite image-to-video", () => {
  it("registers the leaf, aliases, and queue schema", () => {
    const p = createFal({ apiKey: "test-key" });
    const leaf = p.run.xai.grokImagineVideo.v1p5.lite.imageToVideo;
    expect(leaf).toBe(p.post.run.xai.grokImagineVideo.v1p5.lite.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("uses six seconds and 720p by default", () =>
    expect(
      schema.parse({
        prompt: "Panda",
        image_url: "https://example.com/image.png",
      })
    ).toEqual({
      prompt: "Panda",
      image_url: "https://example.com/image.png",
      duration: 6,
      resolution: "720p",
    }));
  it("requires an image and omits the text-only aspect ratio", () => {
    expect(schema.safeParse({ prompt: "Panda" }).success).toBe(false);
    expect(Object.keys(schema.shape)).not.toContain("aspect_ratio");
  });
  it("charges the image once for a one-second clip", () => {
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: {
          image_url: "https://example.com/image.png",
          prompt: "Panda",
          duration: 1,
          resolution: "480p",
        },
      }).usd
    ).toBeCloseTo(0.03);
  });
  it.each([1, 15])("accepts duration %s", (duration) =>
    expect(
      schema.safeParse({
        prompt: "Panda",
        image_url: "https://example.com/image.png",
        duration,
      }).success
    ).toBe(true)
  );
  it.each([0, 16, 1.5, "6"])("rejects duration %s", (duration) =>
    expect(
      schema.safeParse({
        prompt: "Panda",
        image_url: "https://example.com/image.png",
        duration,
      }).success
    ).toBe(false)
  );
  it("enforces the 4096-character prompt maximum", () => {
    expect(
      schema.safeParse({
        image_url: "https://example.com/image.png",
        prompt: "p".repeat(4096),
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        image_url: "https://example.com/image.png",
        prompt: "p".repeat(4097),
      }).success
    ).toBe(false);
  });
  it.each([
    ["480p", 0.02],
    ["720p", 0.03],
    ["1080p", 0.14],
  ] as const)("prices %s output", (resolution, rate) => {
    const e = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        prompt: "Panda",
        image_url: "https://example.com/image.png",
        resolution,
        duration: 5,
      },
    });
    expect(e.usd).toBeCloseTo(rate * 5 + 0.01);
    expect(e.warnings).toEqual([]);
  });
  it("estimates the default duration and resolution", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: {
          prompt: "Panda",
          image_url: "https://example.com/image.png",
        },
      }).usd
    ).toBeCloseTo(0.19));
});
