import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks supervised fine-tuning integration", () => {
  describe("schema validation", () => {
    it("should expose payloadSchema on create", () => {
      const provider = fireworks({ apiKey: "fw-test-key" });
      const schema =
        provider.inference.v1.accounts.supervisedFineTuningJobs.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should validate a valid create payload", () => {
      const provider = fireworks({ apiKey: "fw-test-key" });
      const result =
        provider.inference.v1.accounts.supervisedFineTuningJobs.create.schema.safeParse(
          {
            accountId: "test-account",
            dataset: "accounts/test-account/datasets/my-dataset",
            baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
            epochs: 3,
          }
        );
      expect(result.success).toBe(true);
      // errors checked via success;
    });

    it("should reject a payload missing required fields", () => {
      const provider = fireworks({ apiKey: "fw-test-key" });
      const result =
        provider.inference.v1.accounts.supervisedFineTuningJobs.create.schema.safeParse(
          {
            epochs: 3,
          }
        );
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should have supervised fine-tuning namespace with all methods", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        provider.inference.v1.accounts.supervisedFineTuningJobs
      ).toBeDefined();
      expect(
        provider.inference.v1.accounts.supervisedFineTuningJobs.create
      ).toBeTypeOf("function");
      expect(
        provider.inference.v1.accounts.supervisedFineTuningJobs.list
      ).toBeTypeOf("function");
      expect(
        provider.inference.v1.accounts.supervisedFineTuningJobs.get
      ).toBeTypeOf("function");
      expect(
        provider.inference.v1.accounts.supervisedFineTuningJobs.delete
      ).toBeTypeOf("function");
      expect(
        provider.inference.v1.accounts.supervisedFineTuningJobs.resume
      ).toBeTypeOf("function");
    });
  });
});
