import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Qwen Audio 3 text-to-speech", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/alibaba-qwen-audio-3-tts");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.alibaba.qwenAudio3Tts({
      text: "A",
    });
    expect(result.audio.url).toMatch(/^https?:\/\//);
  }, 900000);
});
