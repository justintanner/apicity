import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen vidu-q3", () => {
  it("generates R2V", async () => {
    await recordMachgen(19, "R2V", () => setupPolly("machgen/vidu-q3-r2v"));
  }, 2000000);
});
