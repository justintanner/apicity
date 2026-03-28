import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks evaluators", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.evaluators.create.validatePayload({
        evaluator: {
          displayName: "My Evaluator",
          entryPoint: "eval::run",
        },
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create payload missing required evaluator field", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid = provider.v1.accounts.evaluators.create.validatePayload(
        {}
      );
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("evaluator is required");
    });

    it("should validate create payload with criteria and source", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.evaluators.create.validatePayload({
        evaluatorId: "my-eval",
        evaluator: {
          displayName: "Code Quality Evaluator",
          description: "Evaluates code quality",
          requirements: "numpy==1.24.0\npandas==2.0.0",
          entryPoint: "evaluator::evaluate",
          criteria: [
            {
              type: "CODE_SNIPPETS",
              name: "correctness",
              description: "Check code correctness",
              codeSnippets: {
                language: "python",
                fileContents: { "main.py": "def check(): pass" },
                entryFile: "main.py",
                entryFunc: "check",
              },
            },
          ],
          source: {
            type: "TYPE_GITHUB",
            githubRepositoryName: "owner/repo",
          },
        },
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should validate update payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.evaluators.update.validatePayload({
        displayName: "Updated Evaluator",
        description: "Updated description",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should validate getUploadEndpoint payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.evaluators.getUploadEndpoint.validatePayload({
          filenameToSize: {
            "evaluator.py": "1024",
            "requirements.txt": "256",
          },
        });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject getUploadEndpoint payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.v1.accounts.evaluators.getUploadEndpoint.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("filenameToSize is required");
    });

    it("should expose create payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.accounts.evaluators.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/accounts/{account_id}/evaluatorsV2");
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.evaluator.required).toBe(true);
    });

    it("should expose update payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.accounts.evaluators.update.payloadSchema;
      expect(schema.method).toBe("PATCH");
      expect(schema.path).toBe(
        "/v1/accounts/{account_id}/evaluators/{evaluator_id}"
      );
    });
  });

  describe("namespace structure", () => {
    it("should expose all evaluator methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const evaluators = provider.v1.accounts.evaluators;
      expect(typeof evaluators.create).toBe("function");
      expect(typeof evaluators.list).toBe("function");
      expect(typeof evaluators.get).toBe("function");
      expect(typeof evaluators.update).toBe("function");
      expect(typeof evaluators.delete).toBe("function");
      expect(typeof evaluators.getUploadEndpoint).toBe("function");
      expect(typeof evaluators.validateUpload).toBe("function");
      expect(typeof evaluators.getBuildLogEndpoint).toBe("function");
      expect(typeof evaluators.getSourceCodeSignedUrl).toBe("function");
    });
  });
});
