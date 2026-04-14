import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks sft resume integration", () => {
  describe("schema validation", () => {
    it("should have resume method on supervisedFineTuningJobs", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        provider.inference.v1.accounts.supervisedFineTuningJobs.resume
      ).toBeDefined();
      expect(
        provider.inference.v1.accounts.supervisedFineTuningJobs.resume
      ).toBeTypeOf("function");
    });
  });
});
