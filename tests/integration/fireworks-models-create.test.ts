import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models create integration", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.models.create.validatePayload({
        modelId: "my-custom-model",
        model: { displayName: "My Custom Model" },
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const invalid = provider.v1.accounts.models.create.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("modelId is required");
      expect(invalid.errors).toContain("model is required");
    });

    it("should validate create payload with optional cluster field", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.models.create.validatePayload({
        modelId: "my-custom-model",
        model: { displayName: "My Custom Model" },
        cluster: "accounts/test/clusters/my-cluster",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should expose create payload schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.v1.accounts.models.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/accounts/{account_id}/models");
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.modelId.required).toBe(true);
      expect(schema.fields.model.required).toBe(true);
    });
  });
});
