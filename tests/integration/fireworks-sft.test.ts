import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

const ACCOUNT_ID = process.env.FIREWORKS_ACCOUNT_ID ?? "test-account";

describe("fireworks supervised fine-tuning integration", () => {
  let ctx: PollyContext;

  describe("create SFT job", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/sft-create");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create a supervised fine-tuning job", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.supervisedFineTuningJobs.create(
        {
          accountId: ACCOUNT_ID,
          dataset: "accounts/test-account/datasets/test-dataset",
          baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
          epochs: 1,
        }
      );

      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("state");
      expect(result).toHaveProperty("dataset");
    });
  });

  describe("list SFT jobs", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/sft-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list supervised fine-tuning jobs", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.supervisedFineTuningJobs.list({
        accountId: ACCOUNT_ID,
        pageSize: 5,
      });

      expect(result).toHaveProperty("supervisedFineTuningJobs");
      expect(Array.isArray(result.supervisedFineTuningJobs)).toBe(true);
    });
  });

  describe("get SFT job", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/sft-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get a supervised fine-tuning job by ID", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.supervisedFineTuningJobs.get({
        accountId: ACCOUNT_ID,
        jobId: "test-job-id",
      });

      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("state");
    });
  });

  describe("delete SFT job", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/sft-delete");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should delete a supervised fine-tuning job", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.supervisedFineTuningJobs.delete(
        {
          accountId: ACCOUNT_ID,
          jobId: "test-job-id",
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe("resume SFT job", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/sft-resume");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should resume a paused supervised fine-tuning job", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.supervisedFineTuningJobs.resume(
        {
          accountId: ACCOUNT_ID,
          jobId: "test-job-id",
        }
      );

      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("state");
    });
  });

  describe("create validation", () => {
    it("should expose payloadSchema on create", () => {
      const provider = fireworks({ apiKey: "fw-test-key" });
      const schema =
        provider.v1.accounts.supervisedFineTuningJobs.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toContain("supervisedFineTuningJobs");
      expect(schema.fields.dataset.required).toBe(true);
      expect(schema.fields.accountId.required).toBe(true);
    });

    it("should validate a valid create payload", () => {
      const provider = fireworks({ apiKey: "fw-test-key" });
      const result =
        provider.v1.accounts.supervisedFineTuningJobs.create.validatePayload({
          accountId: "test-account",
          dataset: "accounts/test-account/datasets/my-dataset",
          baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
          epochs: 3,
        });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject a payload missing required fields", () => {
      const provider = fireworks({ apiKey: "fw-test-key" });
      const result =
        provider.v1.accounts.supervisedFineTuningJobs.create.validatePayload({
          epochs: 3,
        });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("accountId is required");
      expect(result.errors).toContain("dataset is required");
    });
  });
});
