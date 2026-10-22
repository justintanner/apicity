import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen happyhorse-1-1", () => {
  it("generates T2V", async () => {
    await recordMachgen(4, "T2V", () =>
      setupPolly("machgen/happyhorse-1-1-t2v")
    );
  }, 2000000);
  it("generates I2V", async () => {
    await recordMachgen(4, "I2V", () =>
      setupPolly("machgen/happyhorse-1-1-i2v")
    );
  }, 2000000);
  it("generates R2V", async () => {
    await recordMachgen(4, "R2V", () =>
      setupPolly("machgen/happyhorse-1-1-r2v")
    );
  }, 2000000);
});
