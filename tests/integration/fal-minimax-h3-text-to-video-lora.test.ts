import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// Weights from the already-billed H3 t2v trainer recording
// (lora_weights_step_00001.safetensors, 131229784 bytes). No new training.
const LORA_URL =
  "https://v3b.fal.media/files/b/0ab058f9/aofDUIQaypkDoDSR5qbeD_lora_weights_step_00001.safetensors";

describe("fal MiniMax H3 text-to-video LoRA", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-text-to-video-lora");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("generates a 5s 480P clip with the trained cat LoRA", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3.textToVideo.lora({
      prompt: "apct cat walks across a sunlit garden.",
      duration: 5,
      resolution: "480P",
      prompt_expansion_mode: "disabled",
      loras: [{ path: LORA_URL, scale: 1 }],
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(result.expanded_prompt ?? null).toBeNull();
  }, 900000);
});
