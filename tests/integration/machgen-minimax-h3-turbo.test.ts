import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen minimax-h3-turbo", () => {
  it("generates I2V from a start frame", async () => {
    await recordMachgen(6, "I2V", () =>
      setupPolly("machgen/minimax-h3-turbo-i2v")
    );
  }, 2000000);
  it("generates I2V between a start frame and an end frame", async () => {
    await recordMachgen(
      6,
      "I2V",
      () => setupPolly("machgen/minimax-h3-turbo-i2v-end-frame"),
      { frames: "end-frame" }
    );
  }, 2000000);
  it("generates I2V toward a lone end frame", async () => {
    await recordMachgen(
      6,
      "I2V",
      () => setupPolly("machgen/minimax-h3-turbo-i2v-lone-end-frame"),
      { frames: "lone-end-frame" }
    );
  }, 2000000);
});
