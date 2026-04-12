import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks models create integration", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.models.create.schema.safeParse({
        modelId: "my-custom-model",
        model: { displayName: "My Custom Model" },
      });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const invalid = provider.v1.accounts.models.create.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate create payload with optional cluster field", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.models.create.schema.safeParse({
        modelId: "my-custom-model",
        model: { displayName: "My Custom Model" },
        cluster: "accounts/test/clusters/my-cluster",
      });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose create payload schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.v1.accounts.models.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });
});
