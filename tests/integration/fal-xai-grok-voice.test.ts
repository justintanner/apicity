import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Grok Voice", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/xai-grok-voice");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns a spoken reply to our speech fixture", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const audio = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "dialog.mp3")
    );
    const result = await provider.run.xai.grokVoice({
      audio_url: `data:audio/mpeg;base64,${audio.toString("base64")}`,
      // Reused from elevenlabs-convai-agent-testing.test.ts.
      prompt: "You are a concise Apicity route-test assistant.",
    });
    expect(result.audio.url).toMatch(/^https?:\/\//);
    expect(result.duration).toBeGreaterThan(0);
    if (result.text !== undefined) expect(typeof result.text).toBe("string");
  }, 900000);
});
