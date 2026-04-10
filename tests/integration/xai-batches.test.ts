import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xai batches integration", () => {
  describe("create and list batches", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/batch-create-and-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create a batch and list it", async () => {
      const provider = createXaiProvider();
      const created = await provider.post.v1.batches({
        name: "Integration Test Batch",
      });
      expect(created.batch_id).toBeTruthy();
      expect(created.name).toBe("Integration Test Batch");
      expect(created.state.num_requests).toBe(0);

      const list = await provider.get.v1.batches();
      expect(list.batches.length).toBeGreaterThan(0);
      const found = list.batches.find((b) => b.batch_id === created.batch_id);
      expect(found).toBeTruthy();
    });
  });

  describe("get batch", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/batch-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get a specific batch by id", async () => {
      const provider = createXaiProvider();
      const created = await provider.post.v1.batches({
        name: "Get Test Batch",
      });
      const fetched = await provider.get.v1.batches(created.batch_id);
      expect(fetched.batch_id).toBe(created.batch_id);
      expect(fetched.name).toBe("Get Test Batch");
    });
  });

  describe("cancel batch", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/batch-cancel");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should cancel a batch", { timeout: 60_000 }, async () => {
      const provider = createXaiProvider();
      const created = await provider.post.v1.batches({
        name: "Cancel Test Batch",
      });
      const cancelled = await provider.post.v1.batches.cancel(created.batch_id);
      expect(cancelled.batch_id).toBe(created.batch_id);
      expect(cancelled.cancel_time).toBeTruthy();
    });
  });

  describe("batch requests", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/batch-requests");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should add requests and list them", { timeout: 60_000 }, async () => {
      const provider = createXaiProvider();
      const created = await provider.post.v1.batches({
        name: "Requests Test Batch",
      });
      await provider.post.v1.batches.requests(created.batch_id, {
        batch_requests: [
          {
            batch_request_id: "test_req_0",
            batch_request: {
              chat_get_completion: {
                messages: [{ role: "user", content: "What is 2+2?" }],
                model: "grok-3",
              },
            },
          },
        ],
      });

      const requests = await provider.get.v1.batches.requests(created.batch_id);
      expect(requests.batch_request_metadata.length).toBeGreaterThan(0);
    });
  });
});
