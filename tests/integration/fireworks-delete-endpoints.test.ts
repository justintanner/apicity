import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks DELETE endpoint handlers", () => {
  const provider = fireworks({ apiKey: "test-key" });

  describe("apiKeys delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.apiKeys.delete).toBeTypeOf("function");
    });

    it("should expose payloadSchema with POST method", () => {
      const schema = provider.v1.accounts.apiKeys.delete.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe(
        "/v1/accounts/{accountId}/users/{userId}/apiKeys:delete"
      );
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.keyId.required).toBe(true);
      expect(schema.fields.keyId.type).toBe("string");
    });

    it("should validate payload with keyId", () => {
      const result = provider.v1.accounts.apiKeys.delete.validatePayload({
        keyId: "key-abc123",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject payload missing keyId", () => {
      const result = provider.v1.accounts.apiKeys.delete.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("keyId is required");
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.apiKeys.delete).toBeTypeOf("function");
      expect(provider.delete.v1.accounts.apiKeys.delete).toBe(
        provider.v1.accounts.apiKeys.delete
      );
    });
  });

  describe("secrets delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.secrets.delete).toBeTypeOf("function");
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.secrets.delete).toBeTypeOf("function");
      expect(provider.delete.v1.accounts.secrets.delete).toBe(
        provider.v1.accounts.secrets.delete
      );
    });
  });

  describe("models delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.models.delete).toBeTypeOf("function");
    });

    it("should expose payloadSchema with DELETE method", () => {
      const schema = provider.v1.accounts.models.delete.payloadSchema;
      expect(schema.method).toBe("DELETE");
      expect(schema.path).toBe("/v1/accounts/{account_id}/models/{model_id}");
      expect(schema.contentType).toBe("application/json");
    });

    it("should validate empty payload", () => {
      const result = provider.v1.accounts.models.delete.validatePayload({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.models.delete).toBeTypeOf("function");
      expect(provider.delete.v1.accounts.models.delete).toBe(
        provider.v1.accounts.models.delete
      );
    });
  });

  describe("datasets delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.datasets.delete).toBeTypeOf("function");
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.datasets.delete).toBeTypeOf(
        "function"
      );
      expect(provider.delete.v1.accounts.datasets.delete).toBe(
        provider.v1.accounts.datasets.delete
      );
    });
  });

  describe("supervisedFineTuningJobs delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.supervisedFineTuningJobs.delete).toBeTypeOf(
        "function"
      );
    });

    it("should be accessible via delete namespace", () => {
      expect(
        provider.delete.v1.accounts.supervisedFineTuningJobs.delete
      ).toBeTypeOf("function");
      expect(provider.delete.v1.accounts.supervisedFineTuningJobs.delete).toBe(
        provider.v1.accounts.supervisedFineTuningJobs.delete
      );
    });
  });

  describe("dpoJobs delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.dpoJobs.delete).toBeTypeOf("function");
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.dpoJobs.delete).toBeTypeOf("function");
      expect(provider.delete.v1.accounts.dpoJobs.delete).toBe(
        provider.v1.accounts.dpoJobs.delete
      );
    });
  });

  describe("evaluators delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.evaluators.delete).toBeTypeOf("function");
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.evaluators.delete).toBeTypeOf(
        "function"
      );
      expect(provider.delete.v1.accounts.evaluators.delete).toBe(
        provider.v1.accounts.evaluators.delete
      );
    });
  });

  describe("evaluationJobs delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.evaluationJobs.delete).toBeTypeOf("function");
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.evaluationJobs.delete).toBeTypeOf(
        "function"
      );
      expect(provider.delete.v1.accounts.evaluationJobs.delete).toBe(
        provider.v1.accounts.evaluationJobs.delete
      );
    });
  });

  describe("reinforcementFineTuningJobs delete", () => {
    it("should be a callable function", () => {
      expect(
        provider.v1.accounts.reinforcementFineTuningJobs.delete
      ).toBeTypeOf("function");
    });

    it("should be accessible via delete namespace", () => {
      expect(
        provider.delete.v1.accounts.reinforcementFineTuningJobs.delete
      ).toBeTypeOf("function");
      expect(
        provider.delete.v1.accounts.reinforcementFineTuningJobs.delete
      ).toBe(provider.v1.accounts.reinforcementFineTuningJobs.delete);
    });
  });

  describe("rlorTrainerJobs delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.rlorTrainerJobs.delete).toBeTypeOf(
        "function"
      );
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.rlorTrainerJobs.delete).toBeTypeOf(
        "function"
      );
      expect(provider.delete.v1.accounts.rlorTrainerJobs.delete).toBe(
        provider.v1.accounts.rlorTrainerJobs.delete
      );
    });
  });

  describe("deployments delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.deployments.delete).toBeTypeOf("function");
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.deployments.delete).toBeTypeOf(
        "function"
      );
      expect(provider.delete.v1.accounts.deployments.delete).toBe(
        provider.v1.accounts.deployments.delete
      );
    });
  });

  describe("deployedModels delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.deployedModels.delete).toBeTypeOf("function");
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.deployedModels.delete).toBeTypeOf(
        "function"
      );
      expect(provider.delete.v1.accounts.deployedModels.delete).toBe(
        provider.v1.accounts.deployedModels.delete
      );
    });
  });

  describe("batchInferenceJobs delete", () => {
    it("should be a callable function", () => {
      expect(provider.v1.accounts.batchInferenceJobs.delete).toBeTypeOf(
        "function"
      );
    });

    it("should be accessible via delete namespace", () => {
      expect(provider.delete.v1.accounts.batchInferenceJobs.delete).toBeTypeOf(
        "function"
      );
      expect(provider.delete.v1.accounts.batchInferenceJobs.delete).toBe(
        provider.v1.accounts.batchInferenceJobs.delete
      );
    });
  });

  describe("delete namespace structure", () => {
    it("should expose all 13 delete handlers via delete.v1.accounts", () => {
      const accounts = provider.delete.v1.accounts;
      expect(accounts.apiKeys.delete).toBeTypeOf("function");
      expect(accounts.secrets.delete).toBeTypeOf("function");
      expect(accounts.models.delete).toBeTypeOf("function");
      expect(accounts.datasets.delete).toBeTypeOf("function");
      expect(accounts.batchInferenceJobs.delete).toBeTypeOf("function");
      expect(accounts.supervisedFineTuningJobs.delete).toBeTypeOf("function");
      expect(accounts.deployments.delete).toBeTypeOf("function");
      expect(accounts.deployedModels.delete).toBeTypeOf("function");
      expect(accounts.dpoJobs.delete).toBeTypeOf("function");
      expect(accounts.evaluators.delete).toBeTypeOf("function");
      expect(accounts.evaluationJobs.delete).toBeTypeOf("function");
      expect(accounts.reinforcementFineTuningJobs.delete).toBeTypeOf(
        "function"
      );
      expect(accounts.rlorTrainerJobs.delete).toBeTypeOf("function");
    });

    it("should reference same functions in v1 and delete.v1 namespaces", () => {
      expect(provider.v1.accounts.apiKeys.delete).toBe(
        provider.delete.v1.accounts.apiKeys.delete
      );
      expect(provider.v1.accounts.secrets.delete).toBe(
        provider.delete.v1.accounts.secrets.delete
      );
      expect(provider.v1.accounts.models.delete).toBe(
        provider.delete.v1.accounts.models.delete
      );
      expect(provider.v1.accounts.datasets.delete).toBe(
        provider.delete.v1.accounts.datasets.delete
      );
      expect(provider.v1.accounts.batchInferenceJobs.delete).toBe(
        provider.delete.v1.accounts.batchInferenceJobs.delete
      );
      expect(provider.v1.accounts.supervisedFineTuningJobs.delete).toBe(
        provider.delete.v1.accounts.supervisedFineTuningJobs.delete
      );
      expect(provider.v1.accounts.deployments.delete).toBe(
        provider.delete.v1.accounts.deployments.delete
      );
      expect(provider.v1.accounts.deployedModels.delete).toBe(
        provider.delete.v1.accounts.deployedModels.delete
      );
      expect(provider.v1.accounts.dpoJobs.delete).toBe(
        provider.delete.v1.accounts.dpoJobs.delete
      );
      expect(provider.v1.accounts.evaluators.delete).toBe(
        provider.delete.v1.accounts.evaluators.delete
      );
      expect(provider.v1.accounts.evaluationJobs.delete).toBe(
        provider.delete.v1.accounts.evaluationJobs.delete
      );
      expect(provider.v1.accounts.reinforcementFineTuningJobs.delete).toBe(
        provider.delete.v1.accounts.reinforcementFineTuningJobs.delete
      );
      expect(provider.v1.accounts.rlorTrainerJobs.delete).toBe(
        provider.delete.v1.accounts.rlorTrainerJobs.delete
      );
    });
  });
});
