import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie elevenlabs ttsMultilingual (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/elevenlabs/tts-multilingual-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a multilingual TTS task and returns a taskId", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result =
      await provider.elevenlabs.post.api.v1.jobs.createTask.ttsMultilingual({
        text: "Bonjour.",
        voice: "Sarah",
        language_code: "fr",
      });

    expect([200, 422, 451]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data?.taskId).toBeTruthy();
      expect(typeof result.data?.taskId).toBe("string");
    }
  });
});
