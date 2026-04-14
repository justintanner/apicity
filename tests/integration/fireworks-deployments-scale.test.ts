import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks deployments scale integration", () => {
  describe("payload validation", () => {
    it("should have scale method on deployments", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.inference.v1.accounts.deployments.scale).toBeDefined();
      expect(provider.inference.v1.accounts.deployments.scale).toBeTypeOf(
        "function"
      );
    });

    it("should validate scale deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.deployments.scale.schema.safeParse({
          replicaCount: 3,
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject scale without replicaCount", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.inference.v1.accounts.deployments.scale.schema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should expose scale deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.inference.v1.accounts.deployments.scale.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });
});
