import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai batches integration", () => {
  function createProvider() {
    return xai({ apiKey: process.env.XAI_API_KEY ?? "sk-test-key" });
  }

  describe("create and list batches", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/batch-create-and-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create a batch and list it", async () => {
      const provider = createProvider();
      const created = await provider.v1.batches.create({
        name: "Integration Test Batch",
      });
      expect(created.batch_id).toBeTruthy();
      expect(created.name).toBe("Integration Test Batch");
      expect(created.state.num_requests).toBe(0);

      const list = await provider.v1.batches();
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
      const provider = createProvider();
      const created = await provider.v1.batches.create({
        name: "Get Test Batch",
      });
      const fetched = await provider.v1.batches.get(created.batch_id);
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

    it("should cancel a batch", async () => {
      const provider = createProvider();
      const created = await provider.v1.batches.create({
        name: "Cancel Test Batch",
      });
      const cancelled = await provider.v1.batches.cancel(created.batch_id);
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

    it("should add requests and list them", async () => {
      const provider = createProvider();
      const created = await provider.v1.batches.create({
        name: "Requests Test Batch",
      });
      await provider.v1.batches.requests.add(created.batch_id, {
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

      const requests = await provider.v1.batches.requests(created.batch_id);
      expect(requests.batch_request_metadata.length).toBeGreaterThan(0);
    });
  });
});
