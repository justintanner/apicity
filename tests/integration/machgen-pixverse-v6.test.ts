import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen pixverse-v6", () => {
  it("generates I2V without audio", async () => {
    await recordMachgen(16, "I2V", () => setupPolly("machgen/pixverse-v6-i2v"));
  }, 2000000);
  it("generates I2V with audio", async () => {
    await recordMachgen(
      16,
      "I2V",
      () => setupPolly("machgen/pixverse-v6-i2v-audio"),
      { audio: true }
    );
  }, 2000000);
  it("generates R2V", async () => {
    await recordMachgen(16, "R2V", () => setupPolly("machgen/pixverse-v6-r2v"));
  }, 2000000);
});
