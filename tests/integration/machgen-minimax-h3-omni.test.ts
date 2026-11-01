import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen minimax-h3-omni", () => {
  it("generates R2V", async () => {
    await recordMachgen(24, "R2V", () =>
      setupPolly("machgen/minimax-h3-omni-r2v")
    );
  }, 2000000);
  it("bills R2V with a reference video on input plus output seconds", async () => {
    await recordMachgen(
      24,
      "R2V",
      () => setupPolly("machgen/minimax-h3-omni-r2v-video"),
      { video: {} }
    );
  }, 2000000);
});
