import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal workflows create integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/workflows-create");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // TODO: re-record missing "fal/workflows-create" HAR. Skipped because the
  // recording directory was never committed alongside the test.
  it.skip("should create a workflow", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.v1.workflows.create({
      name: "test-workflow-" + Date.now(),
      title: "Test Workflow",
      description: "A test workflow created via API",
      tags: ["test", "api"],
      is_public: false,
      contents: {
        nodes: [],
        edges: [],
      },
    });

    expect(result).toBeDefined();
    expect(result.workflow).toBeDefined();
    expect(result.workflow.name).toBeDefined();
  });

  it.skip("should create a workflow using post namespace", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.post.v1.workflows.create({
      name: "test-workflow-post-" + Date.now(),
      title: "Test Workflow via POST",
      contents: {
        nodes: [],
        edges: [],
      },
    });

    expect(result).toBeDefined();
    expect(result.workflow).toBeDefined();
  });

  it("should validate workflow create payload schema", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation = provider.v1.workflows.create.validatePayload({
      name: "test-workflow",
      title: "Test Workflow",
      contents: {
        nodes: [],
        edges: [],
      },
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject workflow create payload missing required fields", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation = provider.v1.workflows.create.validatePayload({
      title: "Test Workflow without name",
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("name is required");
    expect(validation.errors).toContain("contents is required");
  });

  it("should expose workflow create payloadSchema", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const schema = provider.v1.workflows.create.payloadSchema;
    expect(schema).toBeDefined();
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe("/workflows");
    expect(schema.fields.name).toBeDefined();
    expect(schema.fields.name.required).toBe(true);
    expect(schema.fields.contents).toBeDefined();
    expect(schema.fields.contents.required).toBe(true);
  });
});
