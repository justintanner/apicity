import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen vidu-q3-pro-fast", () => {
  it("generates I2V", async () => {
    await recordMachgen(15, "I2V", () =>
      setupPolly("machgen/vidu-q3-pro-fast-i2v")
    );
  }, 2000000);
});
