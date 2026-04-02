import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai batches CRUD integration", () => {
  let ctx: PollyContext;
  let createdBatchId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("openai/batches-crud");
  });

  afterEach(async () => {
    // Cleanup
    if (createdBatchId) {
      try {
        const provider = openai({
          apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
        });
        await provider.post.v1.batches.cancel(createdBatchId);
      } catch {
        // Ignore cleanup errors
      }
      createdBatchId = null;
    }
    await teardownPolly(ctx);
  });

  it("should create a batch", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-" + Date.now(),
    });
    expect(result.id).toBeTruthy();
    expect(result.status).toBeDefined();
    createdBatchId = result.id;
  });

  it("should list batches", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.get.v1.batches();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should get a batch by id", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    // Create
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-get-" + Date.now(),
    });
    createdBatchId = created.id;

    // Get
    const result = await provider.get.v1.batches(created.id);
    expect(result.id).toBe(created.id);
  });

  it("should cancel a batch", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    // Create
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-cancel-" + Date.now(),
    });
    createdBatchId = created.id;

    // Cancel
    const result = await provider.post.v1.batches.cancel(created.id);
    expect(result.id).toBe(created.id);
  });
});
