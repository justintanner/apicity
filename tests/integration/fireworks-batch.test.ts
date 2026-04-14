import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks batch inference jobs", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.batchInferenceJobs.create.schema.safeParse(
          {
            model: "accounts/fireworks/models/llama-v3p1-8b-instruct",
            inputDatasetId: "accounts/test/datasets/my-dataset",
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.inference.v1.accounts.batchInferenceJobs.create.schema.safeParse(
          {}
        );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate create payload with optional fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.batchInferenceJobs.create.schema.safeParse(
          {
            model: "accounts/fireworks/models/llama-v3p1-8b-instruct",
            inputDatasetId: "accounts/test/datasets/input",
            displayName: "My Batch Job",
            inferenceParameters: { maxTokens: 100, temperature: 0.7 },
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.inference.v1.accounts.batchInferenceJobs.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose create, get, list, and delete methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const batch = provider.inference.v1.accounts.batchInferenceJobs;
      expect(typeof batch.create).toBe("function");
      expect(typeof batch.get).toBe("function");
      expect(typeof batch.list).toBe("function");
      expect(typeof batch.delete).toBe("function");
    });
  });
});
