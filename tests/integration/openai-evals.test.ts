import { afterEach, describe, expect, it } from "vitest";
import { createOpenAi } from "@apicity/openai";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const RECORDING_NAME = "openai/evals-create";

describe("openai evals integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  describe("payload validation", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });

    it("should expose schema on create method", () => {
      expect(provider.post.v1.evals.schema).toBeDefined();
      expect(typeof provider.post.v1.evals.schema.safeParse).toBe("function");
    });

    it("should validate custom data source with string check grader", () => {
      const result = provider.post.v1.evals.schema.safeParse({
        name: "Support ticket categorization",
        data_source_config: {
          type: "custom",
          item_schema: {
            type: "object",
            properties: {
              ticket: { type: "string" },
              category: { type: "string" },
            },
            required: ["ticket", "category"],
          },
          include_sample_schema: true,
        },
        testing_criteria: [
          {
            type: "string_check",
            name: "Category string match",
            input: "{{ sample.output_text }}",
            operation: "eq",
            reference: "{{ item.category }}",
          },
        ],
        metadata: { source: "apicity" },
      });

      expect(result.success).toBe(true);
    });

    it("should reject payload missing required fields", () => {
      const result = provider.post.v1.evals.schema.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  it("should create an eval", async () => {
    ctx = setupPolly(RECORDING_NAME);
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.evals({
      name: "Apicity support ticket fixture",
      data_source_config: {
        type: "custom",
        item_schema: {
          type: "object",
          properties: {
            ticket: { type: "string" },
            category: { type: "string" },
          },
          required: ["ticket", "category"],
        },
        include_sample_schema: true,
      },
      testing_criteria: [
        {
          type: "string_check",
          name: "Category string match",
          input: "{{ sample.output_text }}",
          operation: "eq",
          reference: "{{ item.category }}",
        },
      ],
      metadata: { source: "apicity" },
    });

    expect(result.id).toMatch(/^eval_/);
    expect(result.object).toBe("eval");
    expect(result.name).toBe("Apicity support ticket fixture");
    expect(result.data_source_config.type).toBe("custom");
    expect(result.testing_criteria[0]?.type).toBe("string_check");
  });
});
