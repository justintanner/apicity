import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks deployed models (LoRA) integration", () => {
  describe("payload validation", () => {
    it("should validate create deployed model payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployedModels.create.schema.safeParse(
        {
          model: "accounts/fireworks/models/my-lora",
          deployment: "accounts/fireworks/deployments/my-deployment",
        }
      );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create deployed model without model", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.v1.accounts.deployedModels.create.schema.safeParse({
          deployment: "accounts/fireworks/deployments/my-deployment",
        });
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should reject create deployed model without deployment", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.v1.accounts.deployedModels.create.schema.safeParse({
          model: "accounts/fireworks/models/my-lora",
        });
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should expose create deployed model schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        typeof provider.v1.accounts.deployedModels.create.schema.safeParse
      ).toBe("function");
    });

    it("should validate update deployed model payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployedModels.update.schema.safeParse(
        {
          displayName: "updated-lora",
        }
      );
      expect(valid.success).toBe(true);
    });

    it("should expose update deployed model schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        typeof provider.v1.accounts.deployedModels.update.schema.safeParse
      ).toBe("function");
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
