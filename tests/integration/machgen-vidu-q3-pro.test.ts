import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen vidu-q3-pro", () => {
  it("generates I2V", async () => {
    await recordMachgen(10, "I2V", () => setupPolly("machgen/vidu-q3-pro-i2v"));
  }, 2000000);
  it("generates R2V", async () => {
    await recordMachgen(10, "R2V", () => setupPolly("machgen/vidu-q3-pro-r2v"));
  }, 2000000);
});
