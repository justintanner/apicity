import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic admin users", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/admin-users");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list users", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.users.list({ limit: 5 });
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
    expect(result.data[0].type).toBe("user");
    expect(result.data[0].email).toBeTruthy();
    expect(result.data[0].role).toBeTruthy();
  });

  it("should retrieve a user", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.users.retrieve(
      "user_01TestUser1234567890"
    );
    expect(result.id).toBe("user_01TestUser1234567890");
    expect(result.type).toBe("user");
    expect(result.name).toBeTruthy();
    expect(result.email).toBeTruthy();
  });

  it("should update a user role", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.users.update(
      "user_01TestUser1234567890",
      { role: "developer" }
    );
    expect(result.id).toBe("user_01TestUser1234567890");
    expect(result.type).toBe("user");
    expect(result.role).toBe("developer");
  });

  it("should delete a user", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.users.del(
      "user_01TestUserToDelete890"
    );
    expect(result.id).toBe("user_01TestUserToDelete890");
    expect(result.type).toBe("user_deleted");
  });
});
