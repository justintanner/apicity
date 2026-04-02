import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic batches CRUD integration", () => {
  let ctx: PollyContext;
  let createdBatchId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("anthropic/batches-crud");
  });

  afterEach(async () => {
    // Cleanup: delete created batch
    if (createdBatchId) {
      try {
        const provider = anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
        });
        await provider.delete.v1.messages.batches.del(createdBatchId);
      } catch {
        // Ignore cleanup errors
      }
      createdBatchId = null;
    }
    await teardownPolly(ctx);
  });

  it("should create a message batch", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.messages.batches({
      requests: [
        {
          custom_id: "req-1",
          params: {
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Hello!" }],
          },
        },
      ],
    });
    expect(result.id).toBeTruthy();
    expect(result.type).toBe("message_batch");
    createdBatchId = result.id;
  });

  it("should list message batches", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });
    const result = await provider.get.v1.messages.batches.list();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should get a message batch by id", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });
    // Create
    const created = await provider.post.v1.messages.batches({
      requests: [
        {
          custom_id: "req-get",
          params: {
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Hi!" }],
          },
        },
      ],
    });
    createdBatchId = created.id;

    // Get
    const result = await provider.get.v1.messages.batches.retrieve(created.id);
    expect(result.id).toBe(created.id);
  });

  it("should cancel a message batch", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });
    // Create
    const created = await provider.post.v1.messages.batches({
      requests: [
        {
          custom_id: "req-cancel",
          params: {
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Hello!" }],
          },
        },
      ],
    });
    createdBatchId = created.id;

    // Cancel
    const result = await provider.post.v1.messages.batches.cancel(created.id);
    expect(result.id).toBe(created.id);
  });

  it("should get batch results", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });
    // Create
    const created = await provider.post.v1.messages.batches({
      requests: [
        {
          custom_id: "req-results",
          params: {
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Test" }],
          },
        },
      ],
    });
    createdBatchId = created.id;

    // Get results
    const result = await provider.get.v1.messages.batches.results(created.id);
    expect(result).toBeDefined();
  });

  it("should delete a message batch", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
    });
    // Create
    const created = await provider.post.v1.messages.batches({
      requests: [
        {
          custom_id: "req-delete",
          params: {
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Delete me" }],
          },
        },
      ],
    });

    // Delete
    await provider.delete.v1.messages.batches.del(created.id);
    createdBatchId = null; // Already deleted
  });
});
