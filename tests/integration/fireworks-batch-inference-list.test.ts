import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks batch inference list integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/batch-inference-list");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list batch inference jobs", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.get.v1.accounts.batchInferenceJobs.list({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("should get a batch inference job", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.get.v1.accounts.batchInferenceJobs.get({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      jobId: process.env.FIREWORKS_BATCH_JOB_ID ?? "test-batch-job-id",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.state).toBeDefined();
  });

  it("should delete a batch inference job", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.delete.v1.accounts.batchInferenceJobs.delete({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      jobId: process.env.FIREWORKS_BATCH_JOB_ID ?? "test-batch-job-id",
    });

    expect(result).toBeDefined();
  });
});
