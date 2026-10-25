import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen ltx-2-3-pro", () => {
  it("generates I2V", async () => {
    await recordMachgen(8, "I2V", () => setupPolly("machgen/ltx-2-3-pro-i2v"));
  }, 2000000);
});
