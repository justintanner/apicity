import { describe, it, expect } from "vitest";
import { createFireworks } from "@apicity/fireworks";

describe("fireworks models update integration", () => {
  describe("payload validation", () => {
    it("should have update method on models", () => {
      const provider = createFireworks({ apiKey: "test-key" });
      expect(provider.inference.v1.accounts.models.update).toBeDefined();
      expect(provider.inference.v1.accounts.models.update).toBeTypeOf(
        "function"
      );
    });

    it("should validate update model payload", () => {
      const provider = createFireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.models.update.schema.safeParse({
          displayName: "Updated Model",
          description: "An updated model description",
          public: true,
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should validate update model payload with all optional fields", () => {
      const provider = createFireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.models.update.schema.safeParse({
          displayName: "Full Update",
          description: "Full description",
          kind: "HF_CKPT",
          public: false,
          contextLength: 8192,
          supportsImageInput: true,
          supportsTools: true,
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should accept empty update model payload", () => {
      const provider = createFireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.models.update.schema.safeParse({});
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose update model schema", () => {
      const provider = createFireworks({ apiKey: "test-key" });
      const schema = provider.inference.v1.accounts.models.update.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });
});
