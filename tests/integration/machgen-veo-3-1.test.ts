import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen veo-3-1", () => {
  it("generates T2V", async () => {
    await recordMachgen(21, "T2V", () => setupPolly("machgen/veo-3-1-t2v"));
  }, 2000000);
});
