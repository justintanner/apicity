import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen vidu-q3-turbo", () => {
  it("generates I2V", async () => {
    await recordMachgen(9, "I2V", () =>
      setupPolly("machgen/vidu-q3-turbo-i2v")
    );
  }, 2000000);
  it("bills a 6 s I2V clip across two duration bands", async () => {
    await recordMachgen(
      9,
      "I2V",
      () => setupPolly("machgen/vidu-q3-turbo-i2v-6s"),
      { durationSecs: 6 }
    );
  }, 2000000);
});
