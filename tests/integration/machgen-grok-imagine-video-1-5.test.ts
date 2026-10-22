import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen grok-imagine-video-1-5", () => {
  it("generates I2V", async () => {
    await recordMachgen(5, "I2V", () =>
      setupPolly("machgen/grok-imagine-video-1-5-i2v")
    );
  }, 2000000);
});
