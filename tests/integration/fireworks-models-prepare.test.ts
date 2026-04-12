import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks models prepare integration", () => {
  describe("payload validation", () => {
    it("should validate prepare payload with required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.models.prepare.schema.safeParse({
        precision: "FP16",
      });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject prepare payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const invalid = provider.v1.accounts.models.prepare.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate prepare payload with optional readMask", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.models.prepare.schema.safeParse({
        precision: "FP8",
        readMask: "*",
      });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose prepare payload schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.v1.accounts.models.prepare.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });
});
