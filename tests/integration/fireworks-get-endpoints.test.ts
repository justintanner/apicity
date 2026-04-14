import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

describe("fireworks GET endpoints integration", () => {
  const accountId = "jwtanner";

  function provider() {
    return fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });
  }

  describe("accounts", () => {
    describe("list accounts", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/accounts-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list accounts", async () => {
        const result = await provider().inference.v1.accounts.list({
          pageSize: 5,
        });
        expect(result).toBeDefined();
        expect(result.accounts).toBeDefined();
        expect(Array.isArray(result.accounts)).toBe(true);
      });
    });

    describe("get account", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/accounts-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should get a specific account", async () => {
        const result = await provider().inference.v1.accounts.get(accountId);
        expect(result).toBeDefined();
      });
    });
  });

  describe("users", () => {
    describe("list users", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/users-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list users for an account", async () => {
        const result = await provider().inference.v1.accounts.users.list(
          accountId,
          {
            pageSize: 5,
          }
        );
        expect(result).toBeDefined();
        expect(result.users).toBeDefined();
        expect(Array.isArray(result.users)).toBe(true);
      });
    });

    describe("get user", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/users-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should get a specific user", async () => {
        const result = await provider().inference.v1.accounts.users.get(
          accountId,
          "jwtanner"
        );
        expect(result).toBeDefined();
        expect(result.name).toBeTruthy();
      });
    });
  });

  describe("apiKeys", () => {
    describe("list api keys", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/apikeys-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list api keys for a user", async () => {
        const result = await provider().inference.v1.accounts.apiKeys.list(
          accountId,
          "jwtanner"
        );
        expect(result).toBeDefined();
        expect(result.apiKeys).toBeDefined();
        expect(Array.isArray(result.apiKeys)).toBe(true);
      });
    });
  });

  describe("secrets", () => {
    describe("list secrets", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/secrets-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list secrets for an account", async () => {
        const result = await provider().inference.v1.accounts.secrets.list(
          accountId,
          {
            pageSize: 5,
          }
        );
        expect(result).toBeDefined();
        expect(result.secrets).toBeDefined();
        expect(Array.isArray(result.secrets)).toBe(true);
      });
    });
  });

  describe("datasets", () => {
    describe("list datasets", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/datasets-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list datasets for an account", async () => {
        const result = await provider().inference.v1.accounts.datasets.list(
          accountId,
          {
            pageSize: 5,
          }
        );
        expect(result).toBeDefined();
        expect(result.datasets).toBeDefined();
        expect(Array.isArray(result.datasets)).toBe(true);
      });
    });
  });

  describe("batchInferenceJobs", () => {
    describe("list batch inference jobs", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/batch-inference-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list batch inference jobs", async () => {
        const result =
          await provider().inference.v1.accounts.batchInferenceJobs.list(
            accountId,
            {
              pageSize: 5,
            }
          );
        expect(result).toBeDefined();
        expect(result.batchInferenceJobs).toBeDefined();
        expect(Array.isArray(result.batchInferenceJobs)).toBe(true);
      });
    });
  });

  describe("supervisedFineTuningJobs", () => {
    describe("list SFT jobs", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/sft-jobs-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list supervised fine-tuning jobs", async () => {
        const result =
          await provider().inference.v1.accounts.supervisedFineTuningJobs.list({
            accountId,
            pageSize: 5,
          });
        expect(result).toBeDefined();
      });
    });
  });

  describe("deployments", () => {
    describe("list deployments", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/deployments-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list deployments for an account", async () => {
        const result = await provider().inference.v1.accounts.deployments.list(
          accountId,
          { pageSize: 5 }
        );
        expect(result).toBeDefined();
        expect(result.deployments).toBeDefined();
        expect(Array.isArray(result.deployments)).toBe(true);
      });
    });
  });

  describe("deployedModels", () => {
    describe("list deployed models", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/deployedmodels-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list deployed models for an account", async () => {
        const result =
          await provider().inference.v1.accounts.deployedModels.list(
            accountId,
            { pageSize: 5 }
          );
        expect(result).toBeDefined();
        expect(result.deployedModels).toBeDefined();
        expect(Array.isArray(result.deployedModels)).toBe(true);
      });
    });
  });

  describe("deploymentShapes", () => {
    describe("list deployment shape versions", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/deployment-shapes-versions-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list deployment shape versions", async () => {
        const result =
          await provider().inference.v1.accounts.deploymentShapes.versions.list(
            accountId,
            "llama-v3p1-8b-instruct-a100-80gb-1x",
            { pageSize: 5 }
          );
        expect(result).toBeDefined();
        expect(result.deploymentShapeVersions).toBeDefined();
        expect(Array.isArray(result.deploymentShapeVersions)).toBe(true);
      });
    });
  });

  describe("dpoJobs", () => {
    describe("list DPO jobs", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/dpo-jobs-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list DPO jobs for an account", async () => {
        const result = await provider().inference.v1.accounts.dpoJobs.list(
          accountId,
          {
            pageSize: 5,
          }
        );
        expect(result).toBeDefined();
        expect(result.dpoJobs).toBeDefined();
        expect(Array.isArray(result.dpoJobs)).toBe(true);
      });
    });
  });

  describe("evaluators", () => {
    describe("list evaluators", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/evaluators-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list evaluators for an account", async () => {
        const result = await provider().inference.v1.accounts.evaluators.list(
          accountId,
          {
            pageSize: 5,
          }
        );
        expect(result).toBeDefined();
        expect(result.evaluators).toBeDefined();
        expect(Array.isArray(result.evaluators)).toBe(true);
      });
    });

    describe("get evaluator", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/evaluators-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should get a specific evaluator", async () => {
        const result = await provider().inference.v1.accounts.evaluators.get(
          accountId,
          "gsm8k-evaluator"
        );
        expect(result).toBeDefined();
        expect(result.name).toBeTruthy();
      });
    });

    describe("getBuildLogEndpoint", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/evaluators-build-log-endpoint");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should call getBuildLogEndpoint and handle API response", async () => {
        const p = provider();
        const call = p.inference.v1.accounts.evaluators.getBuildLogEndpoint(
          accountId,
          "gsm8k-evaluator"
        );
        // Demo evaluator has no build log — API returns 400
        await expect(call).rejects.toThrow(/Fireworks API error/);
      });
    });

    describe("getSourceCodeSignedUrl", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/evaluators-source-code-url");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should call getSourceCodeSignedUrl and handle API response", async () => {
        const p = provider();
        const call = p.inference.v1.accounts.evaluators.getSourceCodeSignedUrl(
          accountId,
          "gsm8k-evaluator"
        );
        // Demo evaluator has no source code URL — API returns 400
        await expect(call).rejects.toThrow(/Fireworks API error/);
      });
    });
  });

  describe("evaluationJobs", () => {
    describe("list evaluation jobs", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/evaluation-jobs-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list evaluation jobs for an account", async () => {
        const result =
          await provider().inference.v1.accounts.evaluationJobs.list(
            accountId,
            { pageSize: 5 }
          );
        expect(result).toBeDefined();
        expect(result.evaluationJobs).toBeDefined();
        expect(Array.isArray(result.evaluationJobs)).toBe(true);
      });
    });
  });

  describe("reinforcementFineTuningJobs", () => {
    describe("list RFT jobs", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/rft-jobs-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list reinforcement fine-tuning jobs", async () => {
        const result =
          await provider().inference.v1.accounts.reinforcementFineTuningJobs.list(
            accountId,
            { pageSize: 5 }
          );
        expect(result).toBeDefined();
        expect(result.reinforcementFineTuningJobs).toBeDefined();
        expect(Array.isArray(result.reinforcementFineTuningJobs)).toBe(true);
      });
    });

    describe("get RFT job", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/rft-jobs-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should get a specific RFT job", async () => {
        const result =
          await provider().inference.v1.accounts.reinforcementFineTuningJobs.get(
            accountId,
            "demo-rft-job"
          );
        expect(result).toBeDefined();
        expect(result.name).toBeTruthy();
      });
    });
  });

  describe("rlorTrainerJobs", () => {
    describe("list RLOR trainer jobs", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/rlor-trainer-jobs-list");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should list RLOR trainer jobs", async () => {
        const result =
          await provider().inference.v1.accounts.rlorTrainerJobs.list(
            accountId,
            { pageSize: 5 }
          );
        expect(result).toBeDefined();
        expect(result.rlorTrainerJobs).toBeDefined();
        expect(Array.isArray(result.rlorTrainerJobs)).toBe(true);
      });
    });
  });
});
