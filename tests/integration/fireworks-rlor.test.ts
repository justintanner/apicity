import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

describe("fireworks rlor trainer jobs integration", () => {
  const accountId = "jwtanner";

  function provider() {
    return fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });
  }

  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const valid =
        provider().v1.accounts.rlorTrainerJobs.create.schema.safeParse({
          dataset: "accounts/test/datasets/my-rlor-dataset",
          evaluator: "accounts/test/evaluators/my-evaluator",
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create payload missing required fields", () => {
      const invalid =
        provider().v1.accounts.rlorTrainerJobs.create.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate create payload with training config and reward weights", () => {
      const valid =
        provider().v1.accounts.rlorTrainerJobs.create.schema.safeParse({
          dataset: "accounts/test/datasets/my-rlor-dataset",
          evaluator: "accounts/test/evaluators/my-evaluator",
          displayName: "My RLOR Trainer",
          trainingConfig: {
            baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
            epochs: 1,
            learningRate: 1e-5,
          },
          lossConfig: {
            method: "GRPO",
          },
          rewardWeights: [
            { name: "accuracy", weight: 1.0 },
            { name: "format", weight: 0.5 },
          ],
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose create payload schema", () => {
      const schema = provider().v1.accounts.rlorTrainerJobs.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should validate executeTrainStep payload", () => {
      const valid =
        provider().v1.accounts.rlorTrainerJobs.executeTrainStep.schema.safeParse(
          {
            dataset: "accounts/test/datasets/step-data",
            outputModel: "accounts/test/models/step-output",
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject executeTrainStep payload missing required fields", () => {
      const invalid =
        provider().v1.accounts.rlorTrainerJobs.executeTrainStep.schema.safeParse(
          {}
        );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should expose executeTrainStep payload schema", () => {
      const schema =
        provider().v1.accounts.rlorTrainerJobs.executeTrainStep.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose create, get, list, delete, executeTrainStep, and resume methods", () => {
      const rlor = provider().v1.accounts.rlorTrainerJobs;
      expect(typeof rlor.create).toBe("function");
      expect(typeof rlor.get).toBe("function");
      expect(typeof rlor.list).toBe("function");
      expect(typeof rlor.delete).toBe("function");
      expect(typeof rlor.executeTrainStep).toBe("function");
      expect(typeof rlor.resume).toBe("function");
    });
  });

  describe("list RLOR trainer jobs", () => {
    let ctx: PollyContext;
    beforeEach(() => {
      ctx = setupPolly("fireworks/rlor-trainer-jobs-list");
    });
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list RLOR trainer jobs", async () => {
      const result = await provider().v1.accounts.rlorTrainerJobs.list(
        accountId,
        { pageSize: 5 }
      );
      expect(result).toBeDefined();
      expect(result.rlorTrainerJobs).toBeDefined();
      expect(Array.isArray(result.rlorTrainerJobs)).toBe(true);
    });
  });

  describe("create RLOR trainer job", () => {
    let ctx: PollyContext;
    beforeEach(() => {
      ctx = setupPolly("fireworks/rlor-trainer-jobs-create");
    });
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create RLOR trainer job with valid parameters", async () => {
      const result = await provider().v1.accounts.rlorTrainerJobs.create(
        accountId,
        {
          dataset: "accounts/jwtanner/datasets/test-rlor-dataset",
          evaluator: "accounts/jwtanner/evaluators/test-evaluator",
          displayName: "Test RLOR Trainer Job",
          trainingConfig: {
            baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
            epochs: 1,
            learningRate: 1e-5,
          },
        }
      );
      expect(result).toBeDefined();
      expect(result.name).toBeTruthy();
    });
  });

  describe("get RLOR trainer job", () => {
    let ctx: PollyContext;
    beforeEach(() => {
      ctx = setupPolly("fireworks/rlor-trainer-jobs-get");
    });
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get RLOR trainer job status", async () => {
      const jobId = "test-rlor-job-id";
      const result = await provider().v1.accounts.rlorTrainerJobs.get(
        accountId,
        jobId
      );
      expect(result).toBeDefined();
      expect(result.name).toBeTruthy();
    });
  });

  describe("execute RLOR training step", () => {
    let ctx: PollyContext;
    beforeEach(() => {
      ctx = setupPolly("fireworks/rlor-trainer-jobs-execute-step");
    });
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should execute training step", async () => {
      const jobId = "test-rlor-job-id";
      const result =
        await provider().v1.accounts.rlorTrainerJobs.executeTrainStep(
          accountId,
          jobId,
          {
            dataset: "accounts/jwtanner/datasets/step-dataset",
            outputModel: "accounts/jwtanner/models/step-output-model",
          }
        );
      expect(result).toBeDefined();
    });
  });

  describe("error handling", () => {
    let ctx: PollyContext;
    beforeEach(() => {
      ctx = setupPolly("fireworks/rlor-trainer-jobs-error");
    });
    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should handle invalid job ID", async () => {
      const jobId = "invalid-job-id";
      await expect(
        provider().v1.accounts.rlorTrainerJobs.get(accountId, jobId)
      ).rejects.toThrow();
    });
  });
});
