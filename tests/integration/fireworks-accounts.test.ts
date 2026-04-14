import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

describe("fireworks accounts integration", () => {
  describe("accounts get", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/accounts-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get account details", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.inference.v1.accounts.get("jwtanner");
      expect(result.name).toBeTruthy();
    });
  });

  describe("users crud > should list users", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/users-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list users", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.inference.v1.accounts.users.list(
        "jwtanner",
        {
          pageSize: 5,
        }
      );
      expect(result.users).toBeInstanceOf(Array);
    });
  });

  describe("users crud > should get user details", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/users-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get user details", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      // Use the user ID from the recording (jwtanner)
      const result = await provider.inference.v1.accounts.users.get(
        "jwtanner",
        "jwtanner"
      );
      expect(result.name).toBeTruthy();
    });
  });

  describe("api keys", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/apikeys-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list api keys for a user", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      // Use the user ID from the recording (jwtanner)
      const result = await provider.inference.v1.accounts.apiKeys.list(
        "jwtanner",
        "jwtanner"
      );
      expect(result.apiKeys).toBeInstanceOf(Array);
    });
  });

  describe("secrets", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/secrets-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list secrets", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.inference.v1.accounts.secrets.list(
        "jwtanner",
        {
          pageSize: 5,
        }
      );
      expect(result.secrets).toBeInstanceOf(Array);
    });

    it("should get secret details if secrets exist", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const listResult = await provider.inference.v1.accounts.secrets.list(
        "jwtanner",
        {
          pageSize: 5,
        }
      );
      if (listResult.secrets.length > 0) {
        const secretId = listResult.secrets[0].name?.split("/").pop() ?? "";
        if (secretId) {
          const result = await provider.inference.v1.accounts.secrets.get(
            "jwtanner",
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
      const valid =
        provider.inference.v1.accounts.users.create.schema.safeParse({
          role: "user",
          email: "test@example.com",
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create user without role", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.inference.v1.accounts.users.create.schema.safeParse({
          email: "test@example.com",
        });
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should expose create user schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.inference.v1.accounts.users.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should validate update user payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.users.update.schema.safeParse({
          role: "admin",
        });
      expect(valid.success).toBe(true);
    });

    it("should reject update user without role", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.inference.v1.accounts.users.update.schema.safeParse({
          displayName: "New Name",
        });
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should expose update user schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.inference.v1.accounts.users.update.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should validate create api key payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.apiKeys.create.schema.safeParse({
          apiKey: { displayName: "test-key" },
        });
      expect(valid.success).toBe(true);
    });

    it("should reject create api key without apiKey object", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.inference.v1.accounts.apiKeys.create.schema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should validate delete api key payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.apiKeys.delete.schema.safeParse({
          keyId: "key-123",
        });
      expect(valid.success).toBe(true);
    });

    it("should reject delete api key without keyId", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.inference.v1.accounts.apiKeys.delete.schema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should validate create secret payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.secrets.create.schema.safeParse({
          keyName: "MY_SECRET",
          value: "secret-value",
        });
      expect(valid.success).toBe(true);
    });

    it("should reject create secret without keyName", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.inference.v1.accounts.secrets.create.schema.safeParse({
          value: "secret-value",
        });
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should validate update secret payload", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.secrets.update.schema.safeParse({
          keyName: "MY_SECRET",
          value: "new-value",
        });
      expect(valid.success).toBe(true);
    });

    it("should reject update secret without keyName", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const result =
        provider.inference.v1.accounts.secrets.update.schema.safeParse({
          value: "new-value",
        });
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should expose update secret schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema = provider.inference.v1.accounts.secrets.update.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });
});
