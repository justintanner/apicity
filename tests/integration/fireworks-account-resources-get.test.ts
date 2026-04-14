import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

describe("fireworks account resources GET endpoints integration", () => {
  const accountId = "jwtanner";

  function provider() {
    return fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });
  }

  describe("deployments", () => {
    describe("get deployment", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/deployments-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should handle get deployment for non-existent resource", async () => {
        // Demo deployment does not exist - API returns 404
        await expect(
          provider().inference.v1.accounts.deployments.get(
            accountId,
            "demo-deployment"
          )
        ).rejects.toThrow(/Fireworks API error/);
      });
    });
  });

  describe("deployedModels", () => {
    describe("get deployed model", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/deployedmodels-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should handle get deployed model for non-existent resource", async () => {
        // Demo deployed model does not exist - API returns 404
        await expect(
          provider().inference.v1.accounts.deployedModels.get(
            accountId,
            "demo-deployed-model"
          )
        ).rejects.toThrow(/Fireworks API error/);
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
    describe("get secret", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/secrets-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should handle get secret for non-existent resource", async () => {
        // Demo secret does not exist - API returns error
        await expect(
          provider().inference.v1.accounts.secrets.get(accountId, "demo-secret")
        ).rejects.toThrow(/Fireworks API error/);
      });
    });
  });

  describe("datasets", () => {
    describe("get dataset", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/datasets-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should handle get dataset for non-existent resource", async () => {
        // Demo dataset does not exist - API returns 404
        await expect(
          provider().inference.v1.accounts.datasets.get(
            accountId,
            "demo-dataset"
          )
        ).rejects.toThrow(/Fireworks API error/);
      });
    });

    describe("get dataset download endpoint", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/datasets-get-download-endpoint");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should handle get download endpoint for non-existent dataset", async () => {
        // Demo dataset does not exist - API returns 404
        await expect(
          provider().inference.v1.accounts.datasets.getDownloadEndpoint(
            accountId,
            "demo-dataset"
          )
        ).rejects.toThrow(/Fireworks API error/);
      });
    });
  });

  describe("batchInferenceJobs", () => {
    describe("get batch inference job", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/batch-inference-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should handle get batch inference job for non-existent resource", async () => {
        // Demo batch job does not exist - API returns 404
        await expect(
          provider().inference.v1.accounts.batchInferenceJobs.get(
            accountId,
            "demo-batch-job"
          )
        ).rejects.toThrow(/Fireworks API error/);
      });
    });
  });

  describe("supervisedFineTuningJobs", () => {
    describe("get SFT job", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/sft-jobs-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should handle get SFT job for non-existent resource", async () => {
        // Demo SFT job does not exist - API returns 403/404
        await expect(
          provider().inference.v1.accounts.supervisedFineTuningJobs.get(
            accountId,
            "demo-sft-job"
          )
        ).rejects.toThrow(/Fireworks API error/);
      });
    });
  });

  describe("dpoJobs", () => {
    describe("get DPO job", () => {
      let ctx: PollyContext;
      beforeEach(() => {
        ctx = setupPolly("fireworks/dpo-jobs-get");
      });
      afterEach(async () => {
        await teardownPolly(ctx);
      });

      it("should handle get DPO job for non-existent resource", async () => {
        // Demo DPO job does not exist - API returns 404
        await expect(
          provider().inference.v1.accounts.dpoJobs.get(
            accountId,
            "demo-dpo-job"
          )
        ).rejects.toThrow(/Fireworks API error/);
      });
    });
  });
});
