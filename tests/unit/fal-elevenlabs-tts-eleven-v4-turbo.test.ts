import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalElevenlabsTtsElevenV4TurboRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "elevenlabs/tts/eleven-v4-turbo";
const payload = {
  text: "A red panda waves once, then holds still.",
};

describe("Elevenlabs TTS Eleven V4 Turbo", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("elevenlabstt");
    expect(modelDisplay("fal", endpoint)).toBe(
      "Elevenlabs TTS Eleven V4 Turbo"
    );
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.elevenlabs.tts.elevenV4Turbo;
    expect(leaf).toBe(provider.post.run.elevenlabs.tts.elevenV4Turbo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and keeps an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(true);
  });

  it("prices the published per-character rate", () => {
    const estimate = computeEstimate({ provider: "fal", endpoint, payload });
    expect(estimate.usd).toBeCloseTo(4e-5 * 41);
  });
});
