import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen wan-2-2-a14b", () => {
  it("generates T2V", async () => {
    await recordMachgen(7, "T2V", () => setupPolly("machgen/wan-2-2-a14b-t2v"));
  }, 2000000);
  it("generates I2V", async () => {
    await recordMachgen(7, "I2V", () => setupPolly("machgen/wan-2-2-a14b-i2v"));
  }, 2000000);
});
