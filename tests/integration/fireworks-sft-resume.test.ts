import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks sft resume integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/sft-resume");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should resume a supervised fine-tuning job", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result =
      await provider.post.v1.accounts.supervisedFineTuningJobs.resume({
        accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
        jobId: process.env.FIREWORKS_SFT_JOB_ID ?? "test-sft-job-id",
      });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.state).toBeDefined();
  });

  it("should list supervised fine-tuning jobs", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.get.v1.accounts.supervisedFineTuningJobs.list(
      {
        accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      }
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("should get a supervised fine-tuning job", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.get.v1.accounts.supervisedFineTuningJobs.get({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      jobId: process.env.FIREWORKS_SFT_JOB_ID ?? "test-sft-job-id",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.state).toBeDefined();
  });
});
