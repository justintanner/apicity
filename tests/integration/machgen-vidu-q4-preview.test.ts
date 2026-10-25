import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen vidu-q4-preview", () => {
  it("generates I2V", async () => {
    await recordMachgen(14, "I2V", () =>
      setupPolly("machgen/vidu-q4-preview-i2v")
    );
  }, 2000000);
});
