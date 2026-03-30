import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic admin invites", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/admin-invites");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create an invite", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.invites.create({
      email: "testuser@example.com",
      role: "developer",
    });
    expect(result.id).toBeTruthy();
    expect(result.type).toBe("invite");
    expect(result.email).toBe("testuser@example.com");
    expect(result.role).toBe("developer");
    expect(result.status).toBe("pending");
  });

  it("should list invites", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.invites.list({ limit: 5 });
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
    expect(result.data[0].type).toBe("invite");
    expect(result.data[0].email).toBeTruthy();
  });

  it("should retrieve an invite", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.invites.retrieve(
      "invite_01TestInvite123456"
    );
    expect(result.id).toBe("invite_01TestInvite123456");
    expect(result.type).toBe("invite");
    expect(result.email).toBeTruthy();
  });

  it("should delete an invite", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.invites.del(
      "invite_01TestInviteDel456"
    );
    expect(result.id).toBe("invite_01TestInviteDel456");
    expect(result.type).toBe("invite_deleted");
  });
});
