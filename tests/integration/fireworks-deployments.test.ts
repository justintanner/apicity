import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks deployments integration", () => {
  describe("payload validation", () => {
    it("should validate create deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployments.create.validatePayload({
        baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create deployment without baseModel", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.deployments.create.validatePayload(
        {}
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("baseModel is required");
    });

    it("should expose create deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.deployments.create.payloadSchema.path).toBe(
        "/v1/accounts/{account_id}/deployments"
      );
      expect(provider.v1.accounts.deployments.create.payloadSchema.method).toBe(
        "POST"
      );
    });

    it("should validate update deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployments.update.validatePayload({
        displayName: "updated-name",
      });
      expect(valid.valid).toBe(true);
    });

    it("should expose update deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.deployments.update.payloadSchema.method).toBe(
        "PATCH"
      );
    });

    it("should validate scale deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployments.scale.validatePayload({
        replicaCount: 2,
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject scale without replicaCount", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.deployments.scale.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("replicaCount is required");
    });

    it("should expose scale deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        provider.v1.accounts.deployments.scale.payloadSchema.path
      ).toContain(":scale");
    });
  });
});
