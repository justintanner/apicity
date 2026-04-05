import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks accounts integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/accounts-admin");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // TODO: re-record "fireworks/accounts-admin" HAR against live Fireworks
  // admin API. Skipped because the recording directory was never committed
  // alongside the test (same for users/apiKeys/secrets blocks below).
  describe.skip("accounts get", () => {
    it("should get account details", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.get("fireworks");
      expect(result.name).toBeTruthy();
      expect(result.displayName).toBeTruthy();
    });
  });

  describe.skip("users crud", () => {
    it("should list users", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.users.list("fireworks");
      expect(result.users).toBeInstanceOf(Array);
    });

    it("should get user details", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      // First list users to get a valid user ID
      const listResult = await provider.v1.accounts.users.list("fireworks");
      if (listResult.users.length > 0) {
        const userId = listResult.users[0].name?.split("/").pop() ?? "";
        if (userId) {
          const result = await provider.v1.accounts.users.get(
            "fireworks",
            userId
          );
          expect(result.name).toBeTruthy();
        }
      }
    });
  });

  describe.skip("api keys", () => {
    it("should list api keys for a user", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      // First list users to get a valid user ID
      const listResult = await provider.v1.accounts.users.list("fireworks");
      if (listResult.users.length > 0) {
        const userId = listResult.users[0].name?.split("/").pop() ?? "";
        if (userId) {
          const result = await provider.v1.accounts.apiKeys.list(
            "fireworks",
            userId
          );
          expect(result.apiKeys).toBeInstanceOf(Array);
        }
      }
    });
  });

  describe.skip("secrets", () => {
    it("should list secrets", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.secrets.list("fireworks");
      expect(result.secrets).toBeInstanceOf(Array);
    });

    it("should get secret details if secrets exist", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const listResult = await provider.v1.accounts.secrets.list("fireworks");
      if (listResult.secrets.length > 0) {
        const secretId = listResult.secrets[0].name?.split("/").pop() ?? "";
        if (secretId) {
          const result = await provider.v1.accounts.secrets.get(
            "fireworks",
            secretId
          );
          expect(result.name).toBeTruthy();
          expect(result.keyName).toBeTruthy();
        }
      }
    });
  });

  describe("payload validation", () => {
    it("should validate create user payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.users.create.validatePayload({
        role: "user",
        email: "test@example.com",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create user without role", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.users.create.validatePayload({
        email: "test@example.com",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("role is required");
    });

    it("should expose create user schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.v1.accounts.users.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.fields.role.required).toBe(true);
    });

    it("should validate update user payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.users.update.validatePayload({
        role: "admin",
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject update user without role", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.users.update.validatePayload({
        displayName: "New Name",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("role is required");
    });

    it("should expose update user schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.v1.accounts.users.update.payloadSchema;
      expect(schema.method).toBe("PATCH");
      expect(schema.path).toBe("/v1/accounts/{accountId}/users/{userId}");
      expect(schema.fields.role.required).toBe(true);
    });

    it("should validate create api key payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.apiKeys.create.validatePayload({
        apiKey: { displayName: "test-key" },
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject create api key without apiKey object", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.apiKeys.create.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("apiKey is required");
    });

    it("should validate delete api key payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.apiKeys.delete.validatePayload({
        keyId: "key-123",
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject delete api key without keyId", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.apiKeys.delete.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("keyId is required");
    });

    it("should validate create secret payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.secrets.create.validatePayload({
        keyName: "MY_SECRET",
        value: "secret-value",
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject create secret without keyName", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.secrets.create.validatePayload({
        value: "secret-value",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("keyName is required");
    });

    it("should validate update secret payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid = provider.v1.accounts.secrets.update.validatePayload({
        keyName: "MY_SECRET",
        value: "new-value",
      });
      expect(valid.valid).toBe(true);
    });

    it("should reject update secret without keyName", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result = provider.v1.accounts.secrets.update.validatePayload({
        value: "new-value",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("keyName is required");
    });

    it("should expose update secret schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.v1.accounts.secrets.update.payloadSchema;
      expect(schema.method).toBe("PATCH");
      expect(schema.path).toBe("/v1/accounts/{accountId}/secrets/{secretId}");
      expect(schema.fields.keyName.required).toBe(true);
    });
  });
});
