import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalTripo3dP2TextTo3dRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "tripo3d/p2/text-to-3d";
const payload = {
  prompt: "A red panda waves once, then holds still.",
};

describe("Tripo3d P2 Text To 3d", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("tripo3dp2");
    expect(modelDisplay("fal", endpoint)).toBe("Tripo3d P2 Text To 3d");
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.tripo3d.p2.textTo3d;
    expect(leaf).toBe(provider.post.run.tripo3d.p2.textTo3d);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and keeps an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(true);
  });

  it("prices each Tripo P2 texture tier per generated model", () => {
    expect(
      computeEstimate({ provider: "fal", endpoint, payload }).usd
    ).toBeCloseTo(1.1);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, texture: false, pbr: false },
      }).usd
    ).toBeCloseTo(1);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, texture_quality: "fast" },
      }).usd
    ).toBeCloseTo(1.1);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, texture_quality: "detailed" },
      }).usd
    ).toBeCloseTo(1.2);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, texture_quality: "extreme" },
      }).usd
    ).toBeCloseTo(1.3);
    // pbr alone enables textures, so omitting texture still bills the quality.
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, texture: false },
      }).usd
    ).toBeCloseTo(1.1);
    const unknown = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...payload, texture_quality: "studio" },
    });
    expect(unknown.usd).toBe(0);
    expect(unknown.warnings[0]).toContain("no rate");
  });
});
