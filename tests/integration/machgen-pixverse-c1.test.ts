import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen pixverse-c1", () => {
  it("generates I2V without audio", async () => {
    await recordMachgen(17, "I2V", () => setupPolly("machgen/pixverse-c1-i2v"));
  }, 2000000);
  it("generates I2V with audio", async () => {
    await recordMachgen(
      17,
      "I2V",
      () => setupPolly("machgen/pixverse-c1-i2v-audio"),
      { audio: true }
    );
  }, 2000000);
});
