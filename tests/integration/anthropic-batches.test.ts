import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic message batches", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a message batch", async () => {
    ctx = setupPolly("anthropic/batches-create");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const result = await provider.v1.messages.batches({
      requests: [
        {
          custom_id: "req-1",
          params: {
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 128,
            messages: [{ role: "user", content: "Say hello." }],
          },
        },
      ],
    });
    expect(result.id).toBeTruthy();
    expect(result.type).toBe("message_batch");
    expect(result.processing_status).toBe("in_progress");
    expect(result.request_counts.processing).toBeGreaterThanOrEqual(0);
    expect(result.created_at).toBeTruthy();
    expect(result.expires_at).toBeTruthy();
  });

  it("should list message batches", async () => {
    ctx = setupPolly("anthropic/batches-list");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const result = await provider.v1.messages.batches.list({ limit: 5 });
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
    expect(result.data[0].type).toBe("message_batch");
  });

  it("should retrieve a message batch", async () => {
    ctx = setupPolly("anthropic/batches-retrieve");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    const list = await provider.v1.messages.batches.list({ limit: 1 });
    const batchId = list.data[0].id;
    const result = await provider.v1.messages.batches.retrieve(batchId);
    expect(result.id).toBe(batchId);
    expect(result.type).toBe("message_batch");
    expect(result.processing_status).toBeTruthy();
    expect(result.request_counts).toBeTruthy();
  });

  it("should cancel a message batch", async () => {
    ctx = setupPolly("anthropic/batches-cancel");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    // Create a batch to cancel
    const batch = await provider.v1.messages.batches({
      requests: [
        {
          custom_id: "cancel-req-1",
          params: {
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 128,
            messages: [{ role: "user", content: "Hello." }],
          },
        },
      ],
    });
    const result = await provider.v1.messages.batches.cancel(batch.id);
    expect(result.id).toBe(batch.id);
    expect(result.type).toBe("message_batch");
    expect(["canceling", "ended"]).toContain(result.processing_status);
  });

  it("should get batch results", async () => {
    ctx = setupPolly("anthropic/batches-results");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    // Use a known ended batch
    const list = await provider.v1.messages.batches.list({ limit: 20 });
    const ended = list.data.find((b) => b.processing_status === "ended");
    if (!ended) {
      // Skip if no ended batch exists (recording will have one)
      return;
    }
    const result = await provider.v1.messages.batches.results(ended.id);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should delete a message batch", async () => {
    ctx = setupPolly("anthropic/batches-delete");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });
    // Create a batch to delete
    const batch = await provider.v1.messages.batches({
      requests: [
        {
          custom_id: "delete-req-1",
          params: {
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 128,
            messages: [{ role: "user", content: "Hi." }],
          },
        },
      ],
    });
    // Cancel and wait for it to end before deleting
    await provider.v1.messages.batches.cancel(batch.id);
    const result = await provider.v1.messages.batches.del(batch.id);
    expect(result.id).toBe(batch.id);
    expect(result.type).toBe("message_batch_deleted");
  });
});
