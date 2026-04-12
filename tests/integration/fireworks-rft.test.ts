import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks reinforcement fine-tuning jobs", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.reinforcementFineTuningJobs.create.schema.safeParse(
          {
            dataset: "accounts/test/datasets/my-rft-dataset",
            evaluator: "accounts/test/evaluators/my-evaluator",
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.v1.accounts.reinforcementFineTuningJobs.create.schema.safeParse(
          {}
        );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate create payload with training and loss config", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.reinforcementFineTuningJobs.create.schema.safeParse(
          {
            dataset: "accounts/test/datasets/my-rft-dataset",
            evaluator: "accounts/test/evaluators/my-evaluator",
            displayName: "My RFT Job",
            trainingConfig: {
              baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
              epochs: 3,
              learningRate: 1e-5,
              loraRank: 8,
            },
            lossConfig: {
              method: "GRPO",
              klBeta: 0.04,
            },
            inferenceParams: {
              maxTokens: 2048,
              temperature: 0.7,
            },
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should validate create payload with cloud storage config", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.reinforcementFineTuningJobs.create.schema.safeParse(
          {
            dataset: "accounts/test/datasets/s3-dataset",
            evaluator: "accounts/test/evaluators/my-evaluator",
            awsS3Config: {
              credentialsSecret: "accounts/test/secrets/aws-creds",
            },
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.v1.accounts.reinforcementFineTuningJobs.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose create, get, list, delete, and resume methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const rft = provider.v1.accounts.reinforcementFineTuningJobs;
      expect(typeof rft.create).toBe("function");
      expect(typeof rft.get).toBe("function");
      expect(typeof rft.list).toBe("function");
      expect(typeof rft.delete).toBe("function");
      expect(typeof rft.resume).toBe("function");
    });
  });
});

describe("fireworks rlor trainer jobs", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.rlorTrainerJobs.create.schema.safeParse({
          dataset: "accounts/test/datasets/my-rlor-dataset",
          evaluator: "accounts/test/evaluators/my-evaluator",
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.v1.accounts.rlorTrainerJobs.create.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate create payload with training config and reward weights", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.rlorTrainerJobs.create.schema.safeParse({
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

    it("should expose payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.accounts.rlorTrainerJobs.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("executeTrainStep validation", () => {
    it("should validate executeTrainStep payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.rlorTrainerJobs.executeTrainStep.schema.safeParse({
          dataset: "accounts/test/datasets/step-data",
          outputModel: "accounts/test/models/step-output",
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject executeTrainStep payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.v1.accounts.rlorTrainerJobs.executeTrainStep.schema.safeParse(
          {}
        );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should expose executeTrainStep payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.v1.accounts.rlorTrainerJobs.executeTrainStep.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose create, get, list, delete, executeTrainStep, and resume methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const rlor = provider.v1.accounts.rlorTrainerJobs;
      expect(typeof rlor.create).toBe("function");
      expect(typeof rlor.get).toBe("function");
      expect(typeof rlor.list).toBe("function");
      expect(typeof rlor.delete).toBe("function");
      expect(typeof rlor.executeTrainStep).toBe("function");
      expect(typeof rlor.resume).toBe("function");
    });
  });
});
