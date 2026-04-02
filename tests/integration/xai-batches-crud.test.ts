import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI batches CRUD integration", () => {
  let ctx: PollyContext;
  let createdBatchId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("xai/batches-crud");
  });

  afterEach(async () => {
    // Cleanup: cancel and delete created batch
    if (createdBatchId) {
      try {
        const provider = xai({
          apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
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
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
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
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.get.v1.batches();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should get a batch by id", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // First create a batch
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-get-" + Date.now(),
    });
    createdBatchId = created.id;

    // Then get it
    const result = await provider.get.v1.batches(created.id);
    expect(result.id).toBe(created.id);
  });

  it("should cancel a batch", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
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
    expect(result.status).toMatch(/cancelling|canceled/);
  });

  it("should add requests to batch", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create batch first
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-req-" + Date.now(),
    });
    createdBatchId = created.id;

    // Add requests
    await provider.post.v1.batches.requests(created.id, {
      requests: [
        {
          custom_id: "req-1",
          method: "POST",
          url: "/v1/chat/completions",
          body: {
            model: "grok-2",
            messages: [{ role: "user", content: "Hi" }],
          },
        },
      ],
    });
  });

  it("should list batch requests", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create batch first
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-list-req-" + Date.now(),
    });
    createdBatchId = created.id;

    // List requests
    const result = await provider.get.v1.batches.requests(created.id);
    expect(result.data).toBeDefined();
  });

  it("should list batch results", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create batch first
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-results-" + Date.now(),
    });
    createdBatchId = created.id;

    // List results
    const result = await provider.get.v1.batches.results(created.id);
    expect(result.data).toBeDefined();
  });
});
