import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalMinimaxH3MaxRecastRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
const endpoint = "minimax/h3-max/recast";
const input = {
  video_url: "https://example.com/video.mp4",
  reference_image_urls: ["https://example.com/person.png"],
};
describe("MiniMax H3 Max Recast", () => {
  it("registers the leaf and both run aliases", () => {
    const p = createFal({ apiKey: "test-key" });
    const leaf = p.run.minimax.h3Max.recast;
    expect(leaf).toBe(p.post.run.minimax.h3Max.recast);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("defaults to1080P and allows omitted prompt/seed", () =>
    expect(schema.parse(input)).toEqual({ ...input, resolution: "1080P" }));
  it.each([1, 4])("accepts %s reference images", (count) =>
    expect(
      schema.safeParse({
        ...input,
        reference_image_urls: Array(count).fill("image"),
      }).success
    ).toBe(true)
  );
  it.each([0, 5])("rejects %s reference images", (count) =>
    expect(
      schema.safeParse({
        ...input,
        reference_image_urls: Array(count).fill("image"),
      }).success
    ).toBe(false)
  );
  it("accepts nullable prompt and seed", () =>
    expect(
      schema.safeParse({ ...input, prompt: null, seed: null }).success
    ).toBe(true));
  it.each([-1, 1.5])("rejects seed%s", (seed) =>
    expect(schema.safeParse({ ...input, seed }).success).toBe(false)
  );
  it("enforces the strict field set", () =>
    expect(schema.safeParse({ ...input, duration: 5 }).success).toBe(false));
  it("rejects prompt over2000characters", () =>
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(2001) }).success
    ).toBe(false));
  it.each([
    ["768P", 0.3],
    ["1080P", 0.45],
  ] as const)(
    "prices%s output duration with references included",
    (resolution, rate) => {
      const e = computeEstimate({
        provider: "fal",
        endpoint,
        payload: {
          ...input,
          resolution,
          reference_image_urls: ["a", "b", "c", "d"],
        },
        costHints: { durationSeconds: 5 },
      });
      expect(e.usd).toBeCloseTo(rate * 5);
      expect(e.warnings).toEqual([]);
    }
  );
  it("prices the default resolution", () =>
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: input,
        costHints: { durationSeconds: 5 },
      }).usd
    ).toBe(2.25));
  it("requires a duration hint instead of guessing from the URL", () => {
    const e = computeEstimate({ provider: "fal", endpoint, payload: input });
    expect(e.usd).toBe(0);
    expect(e.warnings.join(" ")).toContain("costHints.durationSeconds");
  });
});
