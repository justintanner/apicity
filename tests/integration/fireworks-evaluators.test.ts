import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks evaluators", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.evaluators.create.schema.safeParse({
          evaluator: {
            displayName: "My Evaluator",
            entryPoint: "eval::run",
          },
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create payload missing required evaluator field", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.inference.v1.accounts.evaluators.create.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate create payload with criteria and source", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.evaluators.create.schema.safeParse({
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
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should validate update payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.evaluators.update.schema.safeParse({
          displayName: "Updated Evaluator",
          description: "Updated description",
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should validate getUploadEndpoint payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.evaluators.getUploadEndpoint.schema.safeParse(
          {
            filenameToSize: {
              "evaluator.py": "1024",
              "requirements.txt": "256",
            },
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject getUploadEndpoint payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.inference.v1.accounts.evaluators.getUploadEndpoint.schema.safeParse(
          {}
        );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should expose create payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.inference.v1.accounts.evaluators.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should expose update payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.inference.v1.accounts.evaluators.update.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose all evaluator methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const evaluators = provider.inference.v1.accounts.evaluators;
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
