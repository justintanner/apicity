import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

// Audio fixture: tests/fixtures/dialog.mp3 (48KB, multi-speaker meeting dialog)

describe("fireworks audio transcriptions", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should transcribe speech and detect dialog content", async () => {
    ctx = setupPolly("fireworks/audio-transcribe-dialog");

    const mp3Path = resolve(__dirname, "../fixtures/dialog.mp3");
    const mp3Buffer = readFileSync(mp3Path);
    const file = new Blob([mp3Buffer], { type: "audio/mp3" });

    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.v1.audio.transcriptions({
      file,
      model: "whisper-v3",
      response_format: "json",
      language: "en",
    });

    expect(result).toHaveProperty("text");
    expect(result.text.length).toBeGreaterThan(0);

    const lower = result.text.toLowerCase();
    expect(lower).toMatch(/meeting|project|timeline|deliverables/);
  });
});

describe("fireworks audio translations", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should translate speech and detect dialog content", async () => {
    ctx = setupPolly("fireworks/audio-translate-dialog");

    const mp3Path = resolve(__dirname, "../fixtures/dialog.mp3");
    const mp3Buffer = readFileSync(mp3Path);
    const file = new Blob([mp3Buffer], { type: "audio/mp3" });

    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.v1.audio.translations({
      file,
      model: "whisper-v3",
      response_format: "json",
    });

    expect(result).toHaveProperty("text");
    expect(result.text.length).toBeGreaterThan(0);

    const lower = result.text.toLowerCase();
    expect(lower).toMatch(/meeting|project|timeline|deliverables/);
  });
});
