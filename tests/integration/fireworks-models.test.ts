import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models CRUD integration", () => {
  let ctx: PollyContext;
  const accountId = "fireworks";

  describe("list models", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/models-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list models for an account", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.models.list(accountId, {
        pageSize: 5,
      });
      expect(result.models).toBeDefined();
      expect(Array.isArray(result.models)).toBe(true);
    });
  });

  describe("get model", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/models-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get a specific model", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.models.get(
        accountId,
        "llama-v3p1-8b-instruct"
      );
      expect(result.name).toBeTruthy();
      expect(result.kind).toBeTruthy();
    });
  });

  describe("schema validation", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/models-schema");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should validate create model payload", () => {
      const provider = fireworks({
        apiKey: "fw-test-key",
      });
      const valid = provider.v1.accounts.models.create.validatePayload({
        modelId: "my-model",
        model: { kind: "HF_BASE_MODEL" },
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create payload missing modelId", () => {
      const provider = fireworks({
        apiKey: "fw-test-key",
      });
      const valid = provider.v1.accounts.models.create.validatePayload({
        model: { kind: "HF_BASE_MODEL" },
      });
      expect(valid.valid).toBe(false);
      expect(valid.errors.some((e: string) => e.includes("modelId"))).toBe(
        true
      );
    });

    it("should expose payloadSchema on all model methods", () => {
      const provider = fireworks({
        apiKey: "fw-test-key",
      });
      const models = provider.v1.accounts.models;
      expect(models.list.payloadSchema.method).toBe("GET");
      expect(models.create.payloadSchema.method).toBe("POST");
      expect(models.get.payloadSchema.method).toBe("GET");
      expect(models.update.payloadSchema.method).toBe("PATCH");
      expect(models.delete.payloadSchema.method).toBe("DELETE");
      expect(models.prepare.payloadSchema.method).toBe("POST");
      expect(models.getUploadEndpoint.payloadSchema.method).toBe("POST");
      expect(models.getDownloadEndpoint.payloadSchema.method).toBe("GET");
      expect(models.validateUpload.payloadSchema.method).toBe("GET");
    });
  });
});
