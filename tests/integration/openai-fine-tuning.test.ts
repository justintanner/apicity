import { describe, it, expect } from "vitest";
import { createOpenAi } from "@apicity/openai";
import { OpenAiFineTuningJobCreateRequestSchema } from "@apicity/openai/zod";

describe("openai fine-tuning", () => {
  describe("payload validation", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });

    it("should expose schema on jobs create", () => {
      // Bind the identity, not just presence: the MCP server derives this
      // endpoint's tool input JSON Schema from `.schema`, so attaching a
      // sibling's schema here would ship a wrong tool contract silently.
      expect(provider.post.v1.fineTuning.jobs.schema).toBe(
        OpenAiFineTuningJobCreateRequestSchema
      );
      expect(typeof provider.post.v1.fineTuning.jobs.schema.safeParse).toBe(
        "function"
      );
    });

    it("should validate create request - valid", () => {
      const result = provider.post.v1.fineTuning.jobs.schema.safeParse({
        model: "gpt-4o-mini-2024-07-18",
        training_file: "file-abc123",
      });
      expect(result.success).toBe(true);
    });

    it("should validate create request - missing required fields", () => {
      const result = provider.post.v1.fineTuning.jobs.schema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
    });

    it("should validate create request with optional fields", () => {
      const result = provider.post.v1.fineTuning.jobs.schema.safeParse({
        model: "gpt-4o-mini-2024-07-18",
        training_file: "file-abc123",
        suffix: "my-model",
        seed: 42,
        validation_file: "file-val456",
        method: {
          type: "supervised",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should expose schema on checkpoint permissions create", () => {
      expect(
        provider.post.v1.fineTuning.checkpoints.permissions.schema
      ).toBeDefined();
      expect(
        typeof provider.post.v1.fineTuning.checkpoints.permissions.schema
          .safeParse
      ).toBe("function");
    });

    it("should validate checkpoint permissions create - valid", () => {
      const result =
        provider.post.v1.fineTuning.checkpoints.permissions.schema.safeParse({
          project_ids: ["proj-abc123"],
        });
      expect(result.success).toBe(true);
    });

    it("should validate checkpoint permissions create - missing project_ids", () => {
      const result =
        provider.post.v1.fineTuning.checkpoints.permissions.schema.safeParse(
          {}
        );
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("project_ids"))
      ).toBe(true);
    });
  });

  describe("namespace wiring", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });

    it("should expose fineTuning.jobs as callable with child methods", () => {
      expect(typeof provider.post.v1.fineTuning.jobs).toBe("function");
      expect(typeof provider.get.v1.fineTuning.jobs).toBe("function");
      expect(typeof provider.post.v1.fineTuning.jobs.cancel).toBe("function");
      expect(typeof provider.post.v1.fineTuning.jobs.pause).toBe("function");
      expect(typeof provider.post.v1.fineTuning.jobs.resume).toBe("function");
      expect(typeof provider.get.v1.fineTuning.jobs.events).toBe("function");
      expect(typeof provider.get.v1.fineTuning.jobs.checkpoints).toBe(
        "function"
      );
    });

    it("should expose fineTuning.checkpoints.permissions as callable with child methods", () => {
      expect(typeof provider.post.v1.fineTuning.checkpoints.permissions).toBe(
        "function"
      );
      expect(typeof provider.get.v1.fineTuning.checkpoints.permissions).toBe(
        "function"
      );
      expect(typeof provider.delete.v1.fineTuning.checkpoints.permissions).toBe(
        "function"
      );
    });
  });
});
