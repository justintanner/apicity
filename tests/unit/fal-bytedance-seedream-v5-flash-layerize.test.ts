import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalBytedanceSeedreamV5FlashLayerizeRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "bytedance/seedream/v5/flash/layerize";
const payload = {
  image_url:
    "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
  prompt: "A red panda waves once, then holds still.",
};

describe("Bytedance Seedream V5 Flash Layerize", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("bytedancesee");
    expect(modelDisplay("fal", endpoint)).toBe(
      "Bytedance Seedream V5 Flash Layerize"
    );
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bytedance.seedream.v5.flash.layerize;
    expect(leaf).toBe(provider.post.run.bytedance.seedream.v5.flash.layerize);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and keeps an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(true);
  });

  it("bills each returned image and does not invent a count", () => {
    const missing = computeEstimate({ provider: "fal", endpoint, payload });
    expect(missing.usd).toBe(0);
    expect(missing.warnings[0]).toContain("outputImages");
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload,
        costHints: { outputImages: 2 },
      }).usd
    ).toBeCloseTo(0.027 * 2);
  });
});
