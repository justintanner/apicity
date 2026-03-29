import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai auth integration", () => {
  const teamId = process.env.XAI_TEAM_ID ?? "test-team-id";

  function createProvider() {
    return xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      managementApiKey: process.env.XAI_MANAGEMENT_API_KEY ?? "mgmt-test-key",
    });
  }

  describe("create and list api keys", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/auth-apikeys-create-and-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create an api key and list it", async () => {
      const provider = createProvider();
      const created = await provider.v1.auth.apiKeys.create(teamId, {
        name: "Integration Test Key",
        acls: ["api-key:endpoint:*", "api-key:model:*"],
      });
      expect(created.apiKeyId).toBeTruthy();
      expect(created.name).toBe("Integration Test Key");
      expect(created.apiKey).toBeTruthy();
      expect(created.aclStrings).toContain("api-key:endpoint:*");

      const list = await provider.v1.auth.apiKeys(teamId);
      expect(list.apiKeys.length).toBeGreaterThan(0);
      const found = list.apiKeys.find((k) => k.apiKeyId === created.apiKeyId);
      expect(found).toBeTruthy();
    });
  });

  describe("update api key", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/auth-apikeys-update");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should update an api key", async () => {
      const provider = createProvider();
      const created = await provider.v1.auth.apiKeys.create(teamId, {
        name: "Update Test Key",
      });
      const updated = await provider.v1.auth.apiKeys.update(created.apiKeyId, {
        apiKey: { name: "Updated Key Name", qpm: 200 },
        fieldMask: "name,qpm",
      });
      expect(updated.apiKeyId).toBe(created.apiKeyId);
      expect(updated.name).toBe("Updated Key Name");
      expect(updated.qpm).toBe(200);
    });
  });

  describe("rotate api key", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/auth-apikeys-rotate");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should rotate an api key and return new secret", async () => {
      const provider = createProvider();
      const created = await provider.v1.auth.apiKeys.create(teamId, {
        name: "Rotate Test Key",
      });
      const originalKey = created.apiKey;
      const rotated = await provider.v1.auth.apiKeys.rotate(created.apiKeyId);
      expect(rotated.apiKeyId).toBe(created.apiKeyId);
      expect(rotated.apiKey).toBeTruthy();
      expect(rotated.apiKey).not.toBe(originalKey);
    });
  });

  describe("delete api key", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/auth-apikeys-delete");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should delete an api key", async () => {
      const provider = createProvider();
      const created = await provider.v1.auth.apiKeys.create(teamId, {
        name: "Delete Test Key",
      });
      await provider.v1.auth.apiKeys.delete(created.apiKeyId);
      // Successful deletion returns without error
    });
  });

  describe("api key propagation", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/auth-apikeys-propagation");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should check api key propagation status", async () => {
      const provider = createProvider();
      const created = await provider.v1.auth.apiKeys.create(teamId, {
        name: "Propagation Test Key",
      });
      const status = await provider.v1.auth.apiKeys.propagation(
        created.apiKeyId
      );
      expect(status.icPropagation).toBeDefined();
      expect(typeof status.icPropagation).toBe("object");
    });
  });

  describe("team models", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/auth-team-models");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list team models", async () => {
      const provider = createProvider();
      const models = await provider.v1.auth.teams.models(teamId);
      expect(models.clusterConfigs).toBeDefined();
      expect(Array.isArray(models.clusterConfigs)).toBe(true);
    });
  });

  describe("team endpoints", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/auth-team-endpoints");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list team endpoints", async () => {
      const provider = createProvider();
      const endpoints = await provider.v1.auth.teams.endpoints(teamId);
      expect(endpoints.acls).toBeDefined();
      expect(Array.isArray(endpoints.acls)).toBe(true);
      if (endpoints.acls.length > 0) {
        expect(endpoints.acls[0].acl).toBeTruthy();
        expect(endpoints.acls[0].namespace).toBeTruthy();
      }
    });
  });

  describe("management key validation", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("xai/auth-management-key-validation");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should validate the management key", async () => {
      const provider = createProvider();
      const validation = await provider.v1.auth.managementKeys.validation();
      expect(validation.apiKeyId).toBeTruthy();
      expect(validation.scope).toBeTruthy();
      expect(validation.name).toBeTruthy();
      expect(validation.acls).toBeDefined();
      expect(Array.isArray(validation.acls)).toBe(true);
    });
  });

  describe("payload schemas", () => {
    it("should expose create schema and validate", () => {
      const provider = createProvider();
      const schema = provider.v1.auth.apiKeys.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toContain("/auth/teams/");

      const valid = provider.v1.auth.apiKeys.create.validatePayload({
        name: "test",
      });
      expect(valid.valid).toBe(true);

      const invalid = provider.v1.auth.apiKeys.create.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });

    it("should expose update schema and validate", () => {
      const provider = createProvider();
      const schema = provider.v1.auth.apiKeys.update.payloadSchema;
      expect(schema.method).toBe("PUT");
      expect(schema.path).toContain("/auth/api-keys/");

      const valid = provider.v1.auth.apiKeys.update.validatePayload({
        apiKey: { name: "new" },
        fieldMask: "name",
      });
      expect(valid.valid).toBe(true);

      const invalid = provider.v1.auth.apiKeys.update.validatePayload({});
      expect(invalid.valid).toBe(false);
    });
  });
});
