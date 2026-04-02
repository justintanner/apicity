import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks deployment shapes integration", () => {
  describe("namespace structure", () => {
    it("should have deployment shapes namespace", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.deploymentShapes).toBeDefined();
      expect(provider.v1.accounts.deploymentShapes.get).toBeTypeOf("function");
      expect(provider.v1.accounts.deploymentShapes.versions).toBeDefined();
      expect(provider.v1.accounts.deploymentShapes.versions.list).toBeTypeOf(
        "function"
      );
      expect(provider.v1.accounts.deploymentShapes.versions.get).toBeTypeOf(
        "function"
      );
    });
  });
});
