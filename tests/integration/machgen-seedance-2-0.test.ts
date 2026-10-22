import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen seedance-2-0", () => {
  it("generates T2V", async () => {
    await recordMachgen(2, "T2V", () => setupPolly("machgen/seedance-2-0-t2v"));
  }, 2000000);
  it("generates I2V", async () => {
    await recordMachgen(2, "I2V", () => setupPolly("machgen/seedance-2-0-i2v"));
  }, 2000000);
  it("generates R2V", async () => {
    await recordMachgen(2, "R2V", () => setupPolly("machgen/seedance-2-0-r2v"));
  }, 2000000);
});
