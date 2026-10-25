import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen happyhorse-1-0", () => {
  it("generates I2V", async () => {
    await recordMachgen(18, "I2V", () =>
      setupPolly("machgen/happyhorse-1-0-i2v")
    );
  }, 2000000);
  it("generates R2V", async () => {
    await recordMachgen(18, "R2V", () =>
      setupPolly("machgen/happyhorse-1-0-r2v")
    );
  }, 2000000);
});
