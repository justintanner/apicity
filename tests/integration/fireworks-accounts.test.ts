import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

const ACCOUNT_ID = process.env.FIREWORKS_ACCOUNT_ID ?? "test-account";
const USER_ID = process.env.FIREWORKS_USER_ID ?? "test-user";

describe("fireworks accounts integration", () => {
  describe("list accounts", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/accounts-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list accounts", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.list({ pageSize: 5 });
      expect(result).toHaveProperty("accounts");
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

    it("should get an account by id", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.get(ACCOUNT_ID);
      expect(result).toHaveProperty("name");
    });
  });

  describe("list users", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/accounts-users-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list users for an account", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.users.list(ACCOUNT_ID, {
        pageSize: 5,
      });
      expect(result).toHaveProperty("users");
      expect(Array.isArray(result.users)).toBe(true);
    });
  });

  describe("get user", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/accounts-users-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get a user by id", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.users.get(
        ACCOUNT_ID,
        USER_ID
      );
      expect(result).toHaveProperty("name");
    });
  });

  describe("list api keys", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/accounts-apikeys-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list api keys for a user", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.apiKeys.list(
        ACCOUNT_ID,
        USER_ID,
        { pageSize: 5 }
      );
      expect(result).toHaveProperty("apiKeys");
      expect(Array.isArray(result.apiKeys)).toBe(true);
    });
  });

  describe("list secrets", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/accounts-secrets-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list secrets for an account", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.secrets.list(ACCOUNT_ID, {
        pageSize: 5,
      });
      expect(result).toHaveProperty("secrets");
      expect(Array.isArray(result.secrets)).toBe(true);
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
  });
});
