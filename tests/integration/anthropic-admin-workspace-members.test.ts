import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic admin workspace members", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/admin-workspace-members");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should add a workspace member", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.members.add(
      "wrkspc_01TestWorkspace1234",
      {
        user_id: "user_01TestUser1234567890",
        workspace_role: "workspace_developer",
      }
    );
    expect(result.type).toBe("workspace_member");
    expect(result.user_id).toBe("user_01TestUser1234567890");
    expect(result.workspace_id).toBe("wrkspc_01TestWorkspace1234");
    expect(result.workspace_role).toBe("workspace_developer");
  });

  it("should list workspace members", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.members.list(
      "wrkspc_01TestWorkspace1234",
      { limit: 5 }
    );
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].type).toBe("workspace_member");
    expect(result.data[0].user_id).toBeTruthy();
    expect(result.data[0].workspace_id).toBe("wrkspc_01TestWorkspace1234");
  });

  it("should retrieve a workspace member", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.members.retrieve(
      "wrkspc_01TestWorkspace1234",
      "user_01TestUser1234567890"
    );
    expect(result.type).toBe("workspace_member");
    expect(result.user_id).toBe("user_01TestUser1234567890");
    expect(result.workspace_id).toBe("wrkspc_01TestWorkspace1234");
  });

  it("should update a workspace member role", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.members.update(
      "wrkspc_01TestWorkspace1234",
      "user_01TestUser1234567890",
      { workspace_role: "workspace_admin" }
    );
    expect(result.type).toBe("workspace_member");
    expect(result.user_id).toBe("user_01TestUser1234567890");
    expect(result.workspace_role).toBe("workspace_admin");
  });

  it("should delete a workspace member", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.members.del(
      "wrkspc_01TestWorkspace1234",
      "user_01TestMemberDel12345"
    );
    expect(result.type).toBe("workspace_member_deleted");
    expect(result.user_id).toBe("user_01TestMemberDel12345");
    expect(result.workspace_id).toBe("wrkspc_01TestWorkspace1234");
  });
});
