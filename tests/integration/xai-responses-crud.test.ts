import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI responses CRUD integration", () => {
  let ctx: PollyContext;
  let createdResponseId: string | null = null;

  afterEach(async () => {
    // Cleanup
    if (createdResponseId) {
      try {
        const provider = xai({
          apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
        });
        await provider.delete.v1.responses(createdResponseId);
      } catch {
        // Ignore cleanup errors
      }
      createdResponseId = null;
    }
    await teardownPolly(ctx);
  });

  it("should create a response", async () => {
    ctx = setupPolly("xai/responses-crud-create");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.post.v1.responses({
      model: "grok-4-fast",
      input: "Hello!",
    });
    expect(result.id).toBeTruthy();
    expect(result.output).toBeDefined();
    createdResponseId = result.id;
  });

  it("should get a response by id", async () => {
    ctx = setupPolly("xai/responses-crud-get");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create
    const created = await provider.post.v1.responses({
      model: "grok-4-fast",
      input: "Get this response",
    });
    createdResponseId = created.id;

    // Get
    const result = await provider.get.v1.responses(created.id);
    expect(result.id).toBe(created.id);
  });

  it("should delete a response", async () => {
    ctx = setupPolly("xai/responses-crud-delete");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create
    const created = await provider.post.v1.responses({
      model: "grok-4-fast",
      input: "Delete this",
    });

    // Delete
    const result = await provider.delete.v1.responses(created.id);
    expect(result.id).toBe(created.id);
    expect(result.deleted).toBe(true);
    createdResponseId = null; // Already deleted
  });
});
