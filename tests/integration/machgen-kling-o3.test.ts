import { describe, it } from "vitest";
import { setupPolly } from "../harness";
import { recordMachgen } from "../machgen-helpers";

describe("MachGen kling-o3", () => {
  it("generates R2V without audio", async () => {
    await recordMachgen(20, "R2V", () => setupPolly("machgen/kling-o3-r2v"));
  }, 2000000);
  it("generates R2V with audio", async () => {
    await recordMachgen(
      20,
      "R2V",
      () => setupPolly("machgen/kling-o3-r2v-audio"),
      { audio: true }
    );
  }, 2000000);
});
