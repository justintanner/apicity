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

  it("quotes requested seconds at the card rate, as a lower bound", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload,
    });
    // 5 s at $0.05. 768p is $0.06/s, not the extend-video ladder's $0.08.
    expect(estimate.usd).toBeCloseTo(0.25, 12);
    expect(estimate.breakdown).toMatchObject({
      units: 5,
      unit: "seconds",
      perUnitUsd: 0.05,
    });
    expect(estimate.warnings).toEqual([
      "fal 'minimax/h3-max/insert-video': prices the requested seconds only; reference tokens beyond the included 4,096 ($0.02 per 1,000) are not counted, so this estimate is a lower bound",
    ]);
    const at768 = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...payload, resolution: "768p" },
    });
    expect(at768.usd).toBeCloseTo(0.3, 12);
    expect(at768.breakdown.perUnitUsd).toBe(0.06);
  });

  it("stays dynamic when duration or resolution is omitted", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        video_url: payload.video_url,
        prompt: payload.prompt,
      },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings[0]).toContain("models/pricing/estimate");
  });
});
