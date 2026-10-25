import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen veo-3-1-fast", () => {
  it("generates T2V", async () => {
    await recordMachgen(22, "T2V", () =>
      setupPolly("machgen/veo-3-1-fast-t2v")
    );
  }, 2000000);
});
