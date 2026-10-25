import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen seedance-2-0-mini", () => {
  it("generates I2V", async () => {
    await recordMachgen(12, "I2V", () =>
      setupPolly("machgen/seedance-2-0-mini-i2v")
    );
  }, 2000000);
});
