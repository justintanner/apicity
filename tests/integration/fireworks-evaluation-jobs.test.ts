import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks evaluation jobs", () => {
  describe("payload validation", () => {
    it("should validate create payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.evaluationJobs.create.schema.safeParse(
        {
          evaluationJob: {
            evaluator: "accounts/test/evaluators/my-eval",
            inputDataset: "accounts/test/datasets/input-ds",
            outputDataset: "accounts/test/datasets/output-ds",
          },
        }
      );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create payload missing required evaluationJob field", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid =
        provider.v1.accounts.evaluationJobs.create.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate create payload with optional fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.evaluationJobs.create.schema.safeParse(
        {
          evaluationJobId: "my-eval-job",
          leaderboardIds: ["leaderboard-1", "leaderboard-2"],
          evaluationJob: {
            displayName: "My Evaluation Job",
            evaluator: "accounts/test/evaluators/my-eval",
            inputDataset: "accounts/test/datasets/input-ds",
            outputDataset: "accounts/test/datasets/output-ds",
            outputStats: "some-stats",
            awsS3Config: {
              credentialsSecret: "accounts/test/secrets/aws-creds",
              iamRoleArn: "arn:aws:iam::123456:role/my-role",
            },
          },
        }
      );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose create payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.accounts.evaluationJobs.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose all evaluation job methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const evalJobs = provider.v1.accounts.evaluationJobs;
      expect(typeof evalJobs.create).toBe("function");
      expect(typeof evalJobs.list).toBe("function");
      expect(typeof evalJobs.get).toBe("function");
      expect(typeof evalJobs.delete).toBe("function");
      expect(typeof evalJobs.getExecutionLogEndpoint).toBe("function");
    });
  });
});
