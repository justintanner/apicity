import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks audio translations integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/audio-translations");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should translate audio to English", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    // Note: This requires an actual audio file
    // The test assumes proper audio data is available
    const audioBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    const file = new File([blob], "test-spanish.wav", { type: "audio/wav" });

    const result = await provider.post.v1.audio.translations({
      model: "accounts/fireworks/models/whisper-v3-large",
      file,
      prompt: "Translate this to English",
      temperature: 0.2,
    });

    expect(result).toBeDefined();
    expect(result.text).toBeDefined();
    expect(typeof result.text).toBe("string");
  });

  it("should validate payload schema for required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation = provider.post.v1.audio.translations.validatePayload({
      model: "accounts/fireworks/models/whisper-v3-large",
      file: {},
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation = provider.post.v1.audio.translations.validatePayload({});

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("model is required");
    expect(validation.errors).toContain("file is required");
  });
});
