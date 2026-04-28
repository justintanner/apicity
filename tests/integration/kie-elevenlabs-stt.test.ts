import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

// Uses an unreachable audio_url so the API errors before queuing work.
describe("kie elevenlabs stt (error envelope)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/elevenlabs/stt-bogus-audio-url");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a recognizable envelope for an unreachable audio_url", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.elevenlabs.post.api.v1.jobs.createTask.stt({
      audio_url: "https://invalid-host-apicity-test.invalid/voice.mp3",
    });

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("msg");
    expect([400, 404, 422, 500]).toContain(result.code);
  });
});
