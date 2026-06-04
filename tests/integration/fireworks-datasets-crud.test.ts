import { describe, it, expect } from "vitest";
import { createFireworks } from "@apicity/fireworks";

describe("fireworks datasets crud integration", () => {
  describe("schema validation", () => {
    it("should have datasets namespace with all methods", () => {
      const provider = createFireworks({ apiKey: "test-key" });
      expect(provider.inference.v1.accounts.datasets).toBeDefined();
      expect(provider.inference.v1.accounts.datasets.create).toBeTypeOf(
        "function"
      );
      expect(provider.inference.v1.accounts.datasets.get).toBeTypeOf(
        "function"
      );
      expect(provider.inference.v1.accounts.datasets.update).toBeTypeOf(
        "function"
      );
      expect(provider.inference.v1.accounts.datasets.delete).toBeTypeOf(
        "function"
      );
      expect(provider.inference.v1.accounts.datasets.list).toBeTypeOf(
        "function"
      );
    });
  });
});
