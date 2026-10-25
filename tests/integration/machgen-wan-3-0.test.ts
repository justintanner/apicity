import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen wan-3-0", () => {
  it("generates T2V", async () => {
    await recordMachgen(3, "T2V", () => setupPolly("machgen/wan-3-0-t2v"));
  }, 2000000);
  it("generates I2V", async () => {
    await recordMachgen(3, "I2V", () => setupPolly("machgen/wan-3-0-i2v"));
  }, 2000000);
  it("generates R2V", async () => {
    await recordMachgen(3, "R2V", () => setupPolly("machgen/wan-3-0-r2v"));
  }, 2000000);
  it("generates R2V from a reference video", async () => {
    await recordMachgen(
      3,
      "R2V",
      () => setupPolly("machgen/wan-3-0-r2v-video"),
      { video: {} }
    );
  }, 2000000);
});
