import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models prepare integration", () => {
  describe("payload validation", () => {
    it("should validate prepare payload with required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.models.prepare.validatePayload({
        precision: "FP16",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject prepare payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const invalid = provider.v1.accounts.models.prepare.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("precision is required");
    });

    it("should validate prepare payload with optional readMask", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.models.prepare.validatePayload({
        precision: "FP8",
        readMask: "*",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should expose prepare payload schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.v1.accounts.models.prepare.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe(
        "/v1/accounts/{account_id}/models/{model_id}:prepare"
      );
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.precision.required).toBe(true);
    });
  });
});
