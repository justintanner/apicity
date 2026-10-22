import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen minimax-h3", () => {
  it("generates T2V", async () => {
    await recordMachgen(0, "T2V", () => setupPolly("machgen/minimax-h3-t2v"));
  }, 2000000);
  it("generates I2V", async () => {
    await recordMachgen(0, "I2V", () => setupPolly("machgen/minimax-h3-i2v"));
  }, 2000000);
  it("generates R2V", async () => {
    await recordMachgen(0, "R2V", () => setupPolly("machgen/minimax-h3-r2v"));
  }, 2000000);
});
