import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalBytedanceSeedreamV5FlashEditRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "bytedance/seedream/v5/flash/edit";
const payload = {
  num_images: 1,
  prompt: "A red panda waves once, then holds still.",
  image_urls: [
    "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
  ],
};

describe("Bytedance Seedream V5 Flash Edit", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("bytedancesee");
    expect(modelDisplay("fal", endpoint)).toBe(
      "Bytedance Seedream V5 Flash Edit"
    );
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bytedance.seedream.v5.flash.edit;
    expect(leaf).toBe(provider.post.run.bytedance.seedream.v5.flash.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and keeps an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(true);
  });

  it("prices each output image at the published flat rate", () => {
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: {
          num_images: 1,
          prompt: "A red panda waves once, then holds still.",
          image_urls: [
            "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
          ],
        },
      }).usd
    ).toBeCloseTo(0.027);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: {
          ...{
            num_images: 1,
            prompt: "A red panda waves once, then holds still.",
            image_urls: [
              "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
            ],
          },
          num_images: 3,
        },
      }).usd
    ).toBeCloseTo(0.081);
  });
});
