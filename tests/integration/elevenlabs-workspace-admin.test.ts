import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsAddWorkspaceGroupMemberRequest,
  type ElevenLabsAddWorkspaceInviteRequest,
  type ElevenLabsAddWorkspaceInvitesBulkRequest,
  type ElevenLabsCreateWorkspaceAuthConnectionRequest,
  type ElevenLabsCreateWorkspaceWebhookRequest,
  type ElevenLabsDeleteWorkspaceInviteRequest,
  type ElevenLabsRemoveWorkspaceGroupMemberRequest,
  type ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequest,
  type ElevenLabsShareWorkspaceResourceRequest,
  type ElevenLabsUnshareWorkspaceResourceRequest,
  type ElevenLabsUpdateWorkspaceAuthConnectionRequest,
  type ElevenLabsUpdateWorkspaceMemberRequest,
  type ElevenLabsUpdateWorkspaceWebhookRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

async function expectWorkspaceRead<T>(
  request: Promise<T>,
  assertResponse: (response: T) => void
): Promise<void> {
  try {
    assertResponse(await request);
  } catch (error) {
    expect(error).toBeInstanceOf(ElevenLabsError);
    expect((error as ElevenLabsError).status).toBe(403);
  }
}

describe("elevenlabs v1.workspace administration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/workspace-admin");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists workspace resources and exposes admin mutation schemas", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.get.v1.workspace.auditLogs).toBe(
      provider.v1.workspace.auditLogs
    );
    expect(provider.get.v1.workspace.groups.list).toBe(
      provider.v1.workspace.groups.list
    );
    expect(provider.get.v1.workspace.groups.search).toBe(
      provider.v1.workspace.groups.search
    );
    expect(provider.post.v1.workspace.groups.members.add).toBe(
      provider.v1.workspace.groups.members.add
    );
    expect(provider.post.v1.workspace.groups.members.remove).toBe(
      provider.v1.workspace.groups.members.remove
    );
    expect(provider.post.v1.workspace.members.update).toBe(
      provider.v1.workspace.members.update
    );
    expect(provider.post.v1.workspace.invites.add).toBe(
      provider.v1.workspace.invites.add
    );
    expect(provider.post.v1.workspace.invites.addBulk).toBe(
      provider.v1.workspace.invites.addBulk
    );
    expect(provider.delete.v1.workspace.invites.delete).toBe(
      provider.v1.workspace.invites.delete
    );
    expect(provider.get.v1.workspace.resources.get).toBe(
      provider.v1.workspace.resources.get
    );
    expect(provider.post.v1.workspace.resources.share).toBe(
      provider.v1.workspace.resources.share
    );
    expect(provider.post.v1.workspace.resources.unshare).toBe(
      provider.v1.workspace.resources.unshare
    );
    expect(provider.get.v1.workspace.webhooks.list).toBe(
      provider.v1.workspace.webhooks.list
    );
    expect(provider.post.v1.workspace.webhooks.create).toBe(
      provider.v1.workspace.webhooks.create
    );
    expect(provider.patch.v1.workspace.webhooks.update).toBe(
      provider.v1.workspace.webhooks.update
    );
    expect(provider.delete.v1.workspace.webhooks.delete).toBe(
      provider.v1.workspace.webhooks.delete
    );
    expect(provider.get.v1.workspace.authConnections.list).toBe(
      provider.v1.workspace.authConnections.list
    );
    expect(provider.post.v1.workspace.authConnections.create).toBe(
      provider.v1.workspace.authConnections.create
    );
    expect(provider.patch.v1.workspace.authConnections.update).toBe(
      provider.v1.workspace.authConnections.update
    );
    expect(provider.delete.v1.workspace.authConnections.delete).toBe(
      provider.v1.workspace.authConnections.delete
    );
    expect(provider.post.v1.workspaces.apiKeys.disable).toBe(
      provider.v1.workspaces.apiKeys.disable
    );
    expect(provider.post.v1.workspaces.apiKeys.thirdPartyDisabling).toBe(
      provider.v1.workspaces.apiKeys.thirdPartyDisabling
    );

    const addMemberReq: ElevenLabsAddWorkspaceGroupMemberRequest = {
      email: "apicity-route-test@example.com",
    };
    const removeMemberReq: ElevenLabsRemoveWorkspaceGroupMemberRequest = {
      email: "apicity-route-test@example.com",
    };
    const updateMemberReq: ElevenLabsUpdateWorkspaceMemberRequest = {
      email: "apicity-route-test@example.com",
      workspace_seat_type: "workspace_lite_member",
    };
    const inviteReq: ElevenLabsAddWorkspaceInviteRequest = {
      email: "apicity-route-test@example.com",
      seat_type: "workspace_lite_member",
      group_ids: null,
    };
    const bulkInviteReq: ElevenLabsAddWorkspaceInvitesBulkRequest = {
      emails: ["apicity-route-test@example.com"],
      seat_type: "workspace_lite_member",
    };
    const deleteInviteReq: ElevenLabsDeleteWorkspaceInviteRequest = {
      email: "apicity-route-test@example.com",
    };
    const shareReq: ElevenLabsShareWorkspaceResourceRequest = {
      role: "viewer",
      resource_type: "convai_agents",
      group_id: "default",
    };
    const unshareReq: ElevenLabsUnshareWorkspaceResourceRequest = {
      resource_type: "convai_agents",
      group_id: "default",
    };
    const createWebhookReq: ElevenLabsCreateWorkspaceWebhookRequest = {
      settings: {
        auth_type: "hmac",
        name: "apicity-route-test",
        webhook_url: "https://example.com/apicity/elevenlabs-workspace",
        request_headers: {
          "x-apicity-test": "workspace-admin",
        },
      },
    };
    const updateWebhookReq: ElevenLabsUpdateWorkspaceWebhookRequest = {
      is_disabled: false,
      name: "apicity-route-test",
      retry_enabled: true,
    };
    const createAuthConnectionReq: ElevenLabsCreateWorkspaceAuthConnectionRequest =
      {
        auth_type: "bearer_auth",
        name: "apicity-route-test",
        provider: "apicity",
        token: "apicity-test-token",
      };
    const updateAuthConnectionReq: ElevenLabsUpdateWorkspaceAuthConnectionRequest =
      {
        auth_type: "bearer_auth",
        token: null,
      };
    const thirdPartyPolicyReq: ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequest =
      {
        third_party_disable_allowed: null,
      };

    expect(
      provider.v1.workspace.groups.members.add.schema.safeParse(addMemberReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.workspace.groups.members.remove.schema.safeParse(
        removeMemberReq
      ).success
    ).toBe(true);
    expect(
      provider.v1.workspace.members.update.schema.safeParse(updateMemberReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.workspace.invites.add.schema.safeParse(inviteReq).success
    ).toBe(true);
    expect(
      provider.v1.workspace.invites.addBulk.schema.safeParse(bulkInviteReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.workspace.invites.delete.schema.safeParse(deleteInviteReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.workspace.resources.share.schema.safeParse(shareReq).success
    ).toBe(true);
    expect(
      provider.v1.workspace.resources.unshare.schema.safeParse(unshareReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.workspace.webhooks.create.schema.safeParse(createWebhookReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.workspace.webhooks.update.schema.safeParse(updateWebhookReq)
        .success
    ).toBe(true);
    expect(
      provider.v1.workspace.authConnections.create.schema.safeParse(
        createAuthConnectionReq
      ).success
    ).toBe(true);
    expect(
      provider.v1.workspace.authConnections.update.schema.safeParse(
        updateAuthConnectionReq
      ).success
    ).toBe(true);
    expect(
      provider.v1.workspaces.apiKeys.disable.schema.safeParse({
        api_key_name: "self",
      }).success
    ).toBe(true);
    expect(
      provider.v1.workspaces.apiKeys.disable.schema.safeParse({
        api_key_name: "not-self",
      }).success
    ).toBe(false);
    expect(
      provider.v1.workspaces.apiKeys.thirdPartyDisabling.schema.safeParse(
        thirdPartyPolicyReq
      ).success
    ).toBe(true);

    await expectWorkspaceRead(
      provider.v1.workspace.auditLogs({ limit: 1 }),
      (auditLogs) => {
        expect(Array.isArray(auditLogs.entries)).toBe(true);
        expect(typeof auditLogs.has_more).toBe("boolean");
      }
    );

    await expectWorkspaceRead(provider.v1.workspace.groups.list(), (groups) => {
      expect(groups).toBeTypeOf("object");
    });

    await expectWorkspaceRead(
      provider.v1.workspace.groups.search({
        name: "apicity",
      }),
      (searchedGroups) => {
        expect(Array.isArray(searchedGroups)).toBe(true);
      }
    );

    await expectWorkspaceRead(
      provider.v1.workspace.webhooks.list({
        include_usages: false,
      }),
      (webhooks) => {
        expect(Array.isArray(webhooks.webhooks)).toBe(true);
      }
    );

    await expectWorkspaceRead(
      provider.v1.workspace.authConnections.list(),
      (authConnections) => {
        expect(Array.isArray(authConnections.auth_connections)).toBe(true);
      }
    );
  });
});
