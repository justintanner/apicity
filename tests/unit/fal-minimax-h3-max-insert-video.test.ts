import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalMinimaxH3MaxInsertVideoRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";

const endpoint = "minimax/h3-max/insert-video";
const payload = {
  video_url:
    "https://v3b.fal.media/files/b/0aac0919/5NYtHn5-5dxFlbH_U9oQW_video.mp4",
  prompt: "A red panda waves once, then holds still.",
  duration: 5,
  resume_time: 2.125,
  resolution: "480p",
  start_time: 1.625,
};

describe("Minimax H3 Max Insert Video", () => {
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.minimax.h3Max.insertVideo;
    expect(leaf).toBe(provider.post.run.minimax.h3Max.insertVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and rejects an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(false);
  });

  it("is dynamically priced", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        video_url:
          "https://v3b.fal.media/files/b/0aac0919/5NYtHn5-5dxFlbH_U9oQW_video.mp4",
        prompt: "A red panda waves once, then holds still.",
        duration: 5,
        resume_time: 2.125,
        resolution: "480p",
        start_time: 1.625,
      },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings[0]).toContain("models/pricing/estimate");
  });
});
