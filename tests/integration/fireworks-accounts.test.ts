import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks accounts integration", () => {
  describe("payload validation", () => {
    it("should validate create user payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.users.create.validatePayload({
        role: "user",
        email: "test@example.com",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create user without role", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.users.create.validatePayload({
        email: "test@example.com",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("role is required");
    });

    it("should expose create user schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.v1.accounts.users.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.fields.role.required).toBe(true);
    });

    it("should validate update user payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.users.update.validatePayload({
        role: "admin",
      });
      expect(valid.valid).toBe(true);
    });

    it("should validate create api key payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.apiKeys.create.validatePayload({
        apiKey: { displayName: "test-key" },
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject create api key without apiKey object", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.apiKeys.create.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("apiKey is required");
    });

    it("should validate delete api key payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.apiKeys.delete.validatePayload({
        keyId: "key-123",
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject delete api key without keyId", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.apiKeys.delete.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("keyId is required");
    });

    it("should validate create secret payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.secrets.create.validatePayload({
        keyName: "MY_SECRET",
        value: "secret-value",
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject create secret without keyName", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.secrets.create.validatePayload({
        value: "secret-value",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("keyName is required");
    });

    it("should validate update secret payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.secrets.update.validatePayload({
        keyName: "MY_SECRET",
        value: "new-value",
      });
      expect(valid.valid).toBe(true);
    });
  });
});
