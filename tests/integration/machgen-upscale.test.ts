import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import {
  MACHGEN_UPSCALE_SOURCE,
  recordMachgenUpscale,
} from "../machgen-helpers";

describe("MachGen UPSCALE", () => {
  // MiniMax-H3 upscales only its own 768p outputs, from 5 s up, to 2K.
  it("regenerates a MiniMax-H3 768p video at 2K", async () => {
    await recordMachgenUpscale(
      "machgen/minimax-h3-upscale",
      () => setupPolly("machgen/minimax-h3-upscale"),
      {
        model: "MiniMax-H3",
        height: 1440,
        sourceSecs: 5,
        source: {
          model: "MiniMax-H3",
          task_type: "T2V",
          prompt: "A red paper boat drifts across a calm pond at sunrise.",
          video_config: { height: 768, duration_secs: 5, audio: false },
        },
      }
    );
  }, 2000000);
  it("bills a Topaz upscale at MachGen's quote", async () => {
    await recordMachgenUpscale(
      "machgen/topaz-video-precision-upscale",
      () => setupPolly("machgen/topaz-video-precision-upscale"),
      {
        model: "Topaz-Video-Precision",
        height: 1080,
        sourceSecs: 4,
        sourceTaskId: MACHGEN_UPSCALE_SOURCE,
        engine: "proteus",
      }
    );
  }, 2000000);
});
