import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import {
  MACHGEN_SHARPEN_SOURCE,
  recordMachgenSharpen,
} from "../machgen-helpers";

describe("MachGen SHARPEN", () => {
  // MiniMax-H3 sharpens one owned video at 480p or 768p, keeping its length.
  it("sharpens a MiniMax-H3 480p video", async () => {
    await recordMachgenSharpen(
      "machgen/minimax-h3-sharpen",
      () => setupPolly("machgen/minimax-h3-sharpen"),
      { sourceTaskId: MACHGEN_SHARPEN_SOURCE, height: 480, sourceSecs: 1 }
    );
  }, 2000000);
});
