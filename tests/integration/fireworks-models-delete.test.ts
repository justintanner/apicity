import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks models delete integration", () => {
  describe("schema validation", () => {
    it("should have delete method on models", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.inference.v1.accounts.models.delete).toBeDefined();
      expect(provider.inference.v1.accounts.models.delete).toBeTypeOf(
        "function"
      );
    });
  });
});
