import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalRecraftV4p1FlashTextToImageRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "recraft/v4.1/flash/text-to-image";
const payload = {
  prompt: "A red panda waves once, then holds still.",
};

describe("Recraft 4.1 Flash Text To Image", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("recraftv41fl");
    expect(modelDisplay("fal", endpoint)).toBe(
      "Recraft 4.1 Flash Text To Image"
    );
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.recraft.v4p1.flash.textToImage;
    expect(leaf).toBe(provider.post.run.recraft.v4p1.flash.textToImage);
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
        payload: { prompt: "A red panda waves once, then holds still." },
      }).usd
    ).toBeCloseTo(0.007);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: {
          ...{ prompt: "A red panda waves once, then holds still." },
          num_images: 3,
        },
      }).usd
    ).toBeCloseTo(0.021);
  });
});
