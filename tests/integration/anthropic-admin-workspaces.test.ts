import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic admin workspaces", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/admin-workspaces");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a workspace", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.create({
      name: "Test Workspace",
    });
    expect(result.id).toBeTruthy();
    expect(result.type).toBe("workspace");
    expect(result.name).toBe("Test Workspace");
    expect(result.created_at).toBeTruthy();
  });

  it("should list workspaces", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.list({
      limit: 5,
    });
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
    expect(result.data[0].type).toBe("workspace");
    expect(result.data[0].name).toBeTruthy();
  });

  it("should retrieve a workspace", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.retrieve(
      "wrkspc_01TestWorkspace1234"
    );
    expect(result.id).toBe("wrkspc_01TestWorkspace1234");
    expect(result.type).toBe("workspace");
    expect(result.name).toBeTruthy();
  });

  it("should update a workspace", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.update(
      "wrkspc_01TestWorkspace1234",
      { name: "Updated Workspace" }
    );
    expect(result.id).toBe("wrkspc_01TestWorkspace1234");
    expect(result.type).toBe("workspace");
    expect(result.name).toBe("Updated Workspace");
  });

  it("should archive a workspace", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.workspaces.archive(
      "wrkspc_01TestWsArchive5678"
    );
    expect(result.id).toBe("wrkspc_01TestWsArchive5678");
    expect(result.type).toBe("workspace");
    expect(result.archived_at).toBeTruthy();
  });
});
