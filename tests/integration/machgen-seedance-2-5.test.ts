import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen seedance-2-5", () => {
  it("generates T2V", async () => {
    await recordMachgen(1, "T2V", () => setupPolly("machgen/seedance-2-5-t2v"));
  }, 2000000);
  it("generates I2V", async () => {
    await recordMachgen(1, "I2V", () => setupPolly("machgen/seedance-2-5-i2v"));
  }, 2000000);
  it("generates R2V", async () => {
    await recordMachgen(1, "R2V", () => setupPolly("machgen/seedance-2-5-r2v"));
  }, 2000000);
});
