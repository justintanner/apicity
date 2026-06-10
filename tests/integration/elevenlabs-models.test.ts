import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.models", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/models");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists available models", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const models = await provider.v1.models();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(provider.get.v1.models).toBe(provider.v1.models);

    const textToSpeechModel = models.find(
      (model) => model.can_do_text_to_speech
    );
    expect(textToSpeechModel).toBeDefined();
    expect(typeof textToSpeechModel?.model_id).toBe("string");
    expect(textToSpeechModel?.model_id.length).toBeGreaterThan(0);
    expect(typeof textToSpeechModel?.name).toBe("string");
    expect(textToSpeechModel?.name.length).toBeGreaterThan(0);
  });
});
