import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalGoogleGemini3p8FlashTtsRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "google/gemini-3.8-flash-tts";
const payload = {
  prompt: "A red panda waves once, then holds still.",
};

describe("Google Gemini 3.8 Flash TTS", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("googlegemini");
    expect(modelDisplay("fal", endpoint)).toBe("Google Gemini 3.8 Flash TTS");
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.google.gemini3p8FlashTts;
    expect(leaf).toBe(provider.post.run.google.gemini3p8FlashTts);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and rejects an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(false);
  });

  it("prices spoken text and ignores style and speaker aliases", () => {
    expect(
      computeEstimate({ provider: "fal", endpoint, payload }).usd
    ).toBeCloseTo(4.5e-5 * 41);
    const dialogue = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        speakers: [
          { speaker_id: "Annabelle", voice: "Kore" },
          { speaker_id: "Benedict", voice: "Puck" },
        ],
        turns: [
          {
            speaker_id: "Annabelle",
            text: "Hello",
            style_instructions: "whisper the whole aside",
          },
          { speaker_id: "Benedict", text: "There" },
        ],
        style_instructions: "bright and quick",
      },
    });
    expect(dialogue.usd).toBeCloseTo(4.5e-5 * 10);
    const missing = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { voice: "Kore", style_instructions: "whisper" },
    });
    expect(missing.usd).toBe(0);
    expect(missing.warnings[0]).toContain("could not derive units");
  });
});
