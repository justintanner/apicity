import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen kling-v3", () => {
  it("generates I2V without audio", async () => {
    await recordMachgen(13, "I2V", () => setupPolly("machgen/kling-v3-i2v"));
  }, 2000000);
  it("generates I2V with audio", async () => {
    await recordMachgen(
      13,
      "I2V",
      () => setupPolly("machgen/kling-v3-i2v-audio"),
      { audio: true }
    );
  }, 2000000);
});
