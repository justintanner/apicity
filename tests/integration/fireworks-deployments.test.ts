import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks deployments integration", () => {
  describe("payload validation", () => {
    it("should validate create deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.deployments.create.schema.safeParse({
          baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create deployment without baseModel", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.inference.v1.accounts.deployments.create.schema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should expose create deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        typeof provider.inference.v1.accounts.deployments.create.schema
          .safeParse
      ).toBe("function");
      expect(
        typeof provider.inference.v1.accounts.deployments.create.schema
          .safeParse
      ).toBe("function");
    });

    it("should validate update deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.deployments.update.schema.safeParse({
          displayName: "updated-name",
        });
      expect(valid.success).toBe(true);
    });

    it("should expose update deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        typeof provider.inference.v1.accounts.deployments.update.schema
          .safeParse
      ).toBe("function");
    });

    it("should validate scale deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.deployments.scale.schema.safeParse({
          replicaCount: 2,
        });
      expect(valid.success).toBe(true);
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
      expect(
        typeof provider.inference.v1.accounts.deployments.scale.schema.safeParse
      ).toBe("function");
    });
  });
});
