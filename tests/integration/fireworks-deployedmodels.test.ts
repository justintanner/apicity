import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks deployed models (LoRA) integration", () => {
  describe("payload validation", () => {
    it("should validate create deployed model payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployedModels.create.validatePayload({
        model: "accounts/fireworks/models/my-lora",
        deployment: "accounts/fireworks/deployments/my-deployment",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create deployed model without model", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.deployedModels.create.validatePayload(
        {
          deployment: "accounts/fireworks/deployments/my-deployment",
        }
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should reject create deployed model without deployment", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.deployedModels.create.validatePayload(
        {
          model: "accounts/fireworks/models/my-lora",
        }
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("deployment is required");
    });

    it("should expose create deployed model schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        provider.v1.accounts.deployedModels.create.payloadSchema.path
      ).toBe("/v1/accounts/{account_id}/deployedModels");
      expect(
        provider.v1.accounts.deployedModels.create.payloadSchema.method
      ).toBe("POST");
    });

    it("should validate update deployed model payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployedModels.update.validatePayload({
        displayName: "updated-lora",
      });
      expect(valid.valid).toBe(true);
    });

    it("should expose update deployed model schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        provider.v1.accounts.deployedModels.update.payloadSchema.method
      ).toBe("PATCH");
    });

    it("should have deployed models namespace with all methods", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.deployedModels).toBeDefined();
      expect(provider.v1.accounts.deployedModels.list).toBeTypeOf("function");
      expect(provider.v1.accounts.deployedModels.create).toBeTypeOf("function");
      expect(provider.v1.accounts.deployedModels.get).toBeTypeOf("function");
      expect(provider.v1.accounts.deployedModels.update).toBeTypeOf("function");
      expect(provider.v1.accounts.deployedModels.delete).toBeTypeOf("function");
    });
  });
});
