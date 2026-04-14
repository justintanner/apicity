import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

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
      const result = await provider.inference.v1.accounts.models.list(
        accountId,
        {
          pageSize: 5,
        }
      );
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
      const result = await provider.inference.v1.accounts.models.get(
        accountId,
        "llama-v3p3-70b-instruct"
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
      const valid =
        provider.inference.v1.accounts.models.create.schema.safeParse({
          modelId: "my-model",
          model: { kind: "HF_BASE_MODEL" },
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create payload missing modelId", () => {
      const provider = fireworks({
        apiKey: "fw-test-key",
      });
      const valid =
        provider.inference.v1.accounts.models.create.schema.safeParse({
          model: { kind: "HF_BASE_MODEL" },
        });
      expect(valid.success).toBe(false);
      expect(valid.error?.issues.some((i) => i.path.includes("modelId"))).toBe(
        true
      );
    });

    it("should expose payloadSchema on all model methods", () => {
      const provider = fireworks({
        apiKey: "fw-test-key",
      });
      const models = provider.inference.v1.accounts.models;
      expect(typeof models.list.schema.safeParse).toBe("function");
      expect(typeof models.create.schema.safeParse).toBe("function");
      expect(typeof models.get.schema.safeParse).toBe("function");
      expect(typeof models.update.schema.safeParse).toBe("function");
      expect(typeof models.delete.schema.safeParse).toBe("function");
      expect(typeof models.prepare.schema.safeParse).toBe("function");
      expect(typeof models.getUploadEndpoint.schema.safeParse).toBe("function");
      expect(typeof models.getDownloadEndpoint.schema.safeParse).toBe(
        "function"
      );
      expect(typeof models.validateUpload.schema.safeParse).toBe("function");
    });
  });
});
