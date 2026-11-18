import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgenImage2p6 } from "../machgen-helpers";

describe("MachGen GPT Image 2.6 Sunburst", () => {
  it("generates a low-quality T2I image", async () => {
    const t2iRecording = "machgen/gpt-image-2-6-sunburst-t2i";
    await recordMachgenImage2p6(
      "GPT-Image-2.6-Sunburst",
      "T2I",
      t2iRecording,
      setupPolly(t2iRecording)
    );
  }, 2000000);
  it("edits a source image with low-quality I2I", async () => {
    const i2iRecording = "machgen/gpt-image-2-6-sunburst-i2i";
    await recordMachgenImage2p6(
      "GPT-Image-2.6-Sunburst",
      "I2I",
      i2iRecording,
      setupPolly(i2iRecording)
    );
  }, 2000000);
});
