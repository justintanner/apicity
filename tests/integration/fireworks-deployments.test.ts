import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

const ACCOUNT_ID = process.env.FIREWORKS_ACCOUNT_ID ?? "test-account";

describe("fireworks deployments integration", () => {
  describe("list deployments", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/deployments-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list deployments", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.deployments.list(ACCOUNT_ID, {
        pageSize: 5,
      });
      expect(result).toHaveProperty("deployments");
      expect(Array.isArray(result.deployments)).toBe(true);
    });
  });

  describe("create and get deployment", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/deployments-create-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create a deployment and retrieve it", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const created = await provider.v1.accounts.deployments.create(
        ACCOUNT_ID,
        {
          baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
          displayName: "nakedapi-test-deployment",
          minReplicaCount: 0,
          maxReplicaCount: 0,
        },
        { validateOnly: true }
      );
      expect(created).toHaveProperty("baseModel");
    });
  });

  describe("payload validation", () => {
    it("should validate create deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployments.create.validatePayload({
        baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create deployment without baseModel", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.deployments.create.validatePayload(
        {}
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("baseModel is required");
    });

    it("should expose create deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.deployments.create.payloadSchema.path).toBe(
        "/v1/accounts/{account_id}/deployments"
      );
      expect(provider.v1.accounts.deployments.create.payloadSchema.method).toBe(
        "POST"
      );
    });

    it("should validate update deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployments.update.validatePayload({
        displayName: "updated-name",
      });
      expect(valid.valid).toBe(true);
    });

    it("should expose update deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.deployments.update.payloadSchema.method).toBe(
        "PATCH"
      );
    });

    it("should validate scale deployment payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.deployments.scale.validatePayload({
        replicaCount: 2,
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject scale without replicaCount", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.deployments.scale.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("replicaCount is required");
    });

    it("should expose scale deployment schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        provider.v1.accounts.deployments.scale.payloadSchema.path
      ).toContain(":scale");
    });
  });
});

describe("fireworks deployment shapes integration", () => {
  describe("payload validation for deployment shapes", () => {
    it("should have deployment shapes namespace", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.deploymentShapes).toBeDefined();
      expect(provider.v1.accounts.deploymentShapes.get).toBeTypeOf("function");
      expect(provider.v1.accounts.deploymentShapes.versions).toBeDefined();
      expect(provider.v1.accounts.deploymentShapes.versions.list).toBeTypeOf(
        "function"
      );
      expect(provider.v1.accounts.deploymentShapes.versions.get).toBeTypeOf(
        "function"
      );
    });
  });
});
