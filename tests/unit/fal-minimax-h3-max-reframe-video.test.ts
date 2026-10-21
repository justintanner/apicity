import { describe, expect, it } from "vitest";
import {
  createFal,
  type FalMinimaxH3MaxReframeVideoRequest,
} from "@apicity/fal";
import { FAL_ENDPOINT_REQUEST_SCHEMAS } from "../../packages/provider/fal/src/zod";

const endpoint = "minimax/h3-max/reframe-video";
const schema = createFal({ apiKey: "test" }).run.minimax.h3Max.reframeVideo
  .schema;

describe("MiniMax H3 Max reframe-video input", () => {
  it("requires only video_url and preserves the pinned defaults", () => {
    const input: FalMinimaxH3MaxReframeVideoRequest = {
      video_url: "https://example.com/house.mp4",
    };
    expect(schema.parse(input)).toEqual({
      ...input,
      prompt: "",
      aspect_ratio: "16:9",
      resolution: "768p",
      enable_safety_checker: true,
    });
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });

  it("enforces seed bounds, prompt length, lowercase resolutions and strict fields", () => {
    const input = { video_url: "https://example.com/house.mp4" };
    for (const fields of [
      { seed: -1 },
      { seed: 4294967296 },
      { seed: 0.5 },
      { prompt: "x".repeat(50001) },
      { resolution: "480P" },
      { sync_mode: true },
    ]) {
      expect(schema.safeParse({ ...input, ...fields }).success).toBe(false);
    }
    for (const seed of [0, 4294967295, null]) {
      expect(
        schema.safeParse({
          ...input,
          seed,
          resolution: "1080p",
          aspect_ratio: "9:21",
        }).success
      ).toBe(true);
    }
    expect(schema.safeParse({}).success).toBe(false);
  });
});
