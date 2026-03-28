import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks reinforcement fine-tuning jobs", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.reinforcementFineTuningJobs.create.validatePayload(
          {
            dataset: "accounts/test/datasets/my-rft-dataset",
            evaluator: "accounts/test/evaluators/my-evaluator",
          }
        );
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.v1.accounts.reinforcementFineTuningJobs.create.validatePayload(
          {}
        );
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("dataset is required");
      expect(invalid.errors).toContain("evaluator is required");
    });

    it("should validate create payload with training and loss config", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.reinforcementFineTuningJobs.create.validatePayload(
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
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should validate create payload with cloud storage config", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.reinforcementFineTuningJobs.create.validatePayload(
          {
            dataset: "accounts/test/datasets/s3-dataset",
            evaluator: "accounts/test/evaluators/my-evaluator",
            awsS3Config: {
              credentialsSecret: "accounts/test/secrets/aws-creds",
            },
          }
        );
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should expose payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.v1.accounts.reinforcementFineTuningJobs.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe(
        "/v1/accounts/{account_id}/reinforcementFineTuningJobs"
      );
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.dataset.required).toBe(true);
      expect(schema.fields.evaluator.required).toBe(true);
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
      const valid = provider.v1.accounts.rlorTrainerJobs.create.validatePayload(
        {
          dataset: "accounts/test/datasets/my-rlor-dataset",
          evaluator: "accounts/test/evaluators/my-evaluator",
        }
      );
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.v1.accounts.rlorTrainerJobs.create.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("dataset is required");
      expect(invalid.errors).toContain("evaluator is required");
    });

    it("should validate create payload with training config and reward weights", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.rlorTrainerJobs.create.validatePayload(
        {
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
        }
      );
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should expose payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.accounts.rlorTrainerJobs.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/accounts/{account_id}/rlorTrainerJobs");
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.dataset.required).toBe(true);
      expect(schema.fields.evaluator.required).toBe(true);
    });
  });

  describe("executeTrainStep validation", () => {
    it("should validate executeTrainStep payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.rlorTrainerJobs.executeTrainStep.validatePayload({
          dataset: "accounts/test/datasets/step-data",
          outputModel: "accounts/test/models/step-output",
        });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject executeTrainStep payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.v1.accounts.rlorTrainerJobs.executeTrainStep.validatePayload(
          {}
        );
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("dataset is required");
      expect(invalid.errors).toContain("outputModel is required");
    });

    it("should expose executeTrainStep payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.v1.accounts.rlorTrainerJobs.executeTrainStep.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toContain("executeTrainStep");
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
