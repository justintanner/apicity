import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal VEED Clean Audio", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/veed-clean-audio");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("cleans our speech fixture and returns the documented audio", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Owned committed speech fixture; this endpoint has no prompt field.
    const audio = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "dialog.mp3")
    );
    const result = await provider.run.veed.cleanAudio({
      audio_url: `data:audio/mpeg;base64,${audio.toString("base64")}`,
    });
    expect(result.audio.url).toMatch(/^https?:\/\//);
    expect(result.audio.content_type).toBe("audio/flac");
    expect(result.audio_duration).toBeGreaterThan(0);
  }, 900000);
});
