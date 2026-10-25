import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen grok-imagine-video", () => {
  it("generates T2V", async () => {
    await recordMachgen(23, "T2V", () =>
      setupPolly("machgen/grok-imagine-video-t2v")
    );
  }, 2000000);
});
