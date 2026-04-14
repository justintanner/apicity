import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks batch inference jobs", () => {
  describe("schema validation", () => {
    it("should have batch inference jobs namespace with all methods", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.inference.v1.accounts.batchInferenceJobs).toBeDefined();
      expect(provider.inference.v1.accounts.batchInferenceJobs.list).toBeTypeOf(
        "function"
      );
      expect(provider.inference.v1.accounts.batchInferenceJobs.get).toBeTypeOf(
        "function"
      );
      expect(
        provider.inference.v1.accounts.batchInferenceJobs.delete
      ).toBeTypeOf("function");
    });
  });
});
