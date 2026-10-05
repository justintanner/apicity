import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalMeshyV7p1ImageTo3dRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "meshy/v7.1/image-to-3d";
const payload = {
  image_url:
    "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
};

describe("Meshy 7.1 Image To 3d", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("meshyv71");
    expect(modelDisplay("fal", endpoint)).toBe("Meshy 7.1 Image To 3d");
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.meshy.v7p1.imageTo3d;
    expect(leaf).toBe(provider.post.run.meshy.v7p1.imageTo3d);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and keeps an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(true);
  });

  it("prices Meshy 7.1 texture, rigging, and animation add-ons", () => {
    expect(
      computeEstimate({ provider: "fal", endpoint, payload }).usd
    ).toBeCloseTo(1.2);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, mode: "preview" },
      }).usd
    ).toBeCloseTo(0.8);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, enable_rigging: true },
      }).usd
    ).toBeCloseTo(1.4);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, enable_rigging: true, enable_animation: true },
      }).usd
    ).toBeCloseTo(1.52);
    const unknown = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...payload, mode: "draft" },
    });
    expect(unknown.usd).toBe(0);
    expect(unknown.warnings[0]).toContain("no rate");
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, should_texture: false },
      }).usd
    ).toBeCloseTo(0.8);
  });
});
