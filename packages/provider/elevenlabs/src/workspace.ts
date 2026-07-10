import {
  ElevenLabsAddWorkspaceGroupMemberRequest,
  ElevenLabsAddWorkspaceGroupMemberResponse,
  ElevenLabsAddWorkspaceInviteRequest,
  ElevenLabsAddWorkspaceInviteResponse,
  ElevenLabsAddWorkspaceInvitesBulkRequest,
  ElevenLabsCreateWorkspaceAuthConnectionRequest,
  ElevenLabsCreateWorkspaceAuthConnectionResponse,
  ElevenLabsCreateWorkspaceWebhookRequest,
  ElevenLabsCreateWorkspaceWebhookResponse,
  ElevenLabsDeleteWorkspaceAuthConnectionResponse,
  ElevenLabsDeleteWorkspaceInviteRequest,
  ElevenLabsDeleteWorkspaceInviteResponse,
  ElevenLabsDeleteWorkspaceWebhookResponse,
  ElevenLabsDisableWorkspaceApiKeyRequest,
  ElevenLabsDisableWorkspaceApiKeyResponse,
  ElevenLabsGetWorkspaceResourceRequest,
  ElevenLabsListWorkspaceAuditLogsRequest,
  ElevenLabsListWorkspaceAuthConnectionsResponse,
  ElevenLabsListWorkspaceWebhooksRequest,
  ElevenLabsListWorkspaceWebhooksResponse,
  ElevenLabsRemoveWorkspaceGroupMemberRequest,
  ElevenLabsRemoveWorkspaceGroupMemberResponse,
  ElevenLabsSearchWorkspaceGroupsRequest,
  ElevenLabsSearchWorkspaceGroupsResponse,
  ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequest,
  ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingResponse,
  ElevenLabsShareWorkspaceResourceRequest,
  ElevenLabsShareWorkspaceResourceResponse,
  ElevenLabsUnshareWorkspaceResourceRequest,
  ElevenLabsUnshareWorkspaceResourceResponse,
  ElevenLabsUpdateWorkspaceAuthConnectionRequest,
  ElevenLabsUpdateWorkspaceAuthConnectionResponse,
  ElevenLabsUpdateWorkspaceMemberRequest,
  ElevenLabsUpdateWorkspaceMemberResponse,
  ElevenLabsUpdateWorkspaceWebhookRequest,
  ElevenLabsUpdateWorkspaceWebhookResponse,
  ElevenLabsWorkspaceAnalyticsQueryResponse,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsRequestsResponse,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
  ElevenLabsWorkspaceAuditLogsPageResponse,
  ElevenLabsWorkspaceGroupsResponse,
  ElevenLabsWorkspaceResourceMetadataResponse,
} from "./types";
import {
  ElevenLabsAddWorkspaceGroupMemberRequestSchema,
  ElevenLabsAddWorkspaceInviteRequestSchema,
  ElevenLabsAddWorkspaceInvitesBulkRequestSchema,
  ElevenLabsCreateWorkspaceAuthConnectionRequestSchema,
  ElevenLabsCreateWorkspaceWebhookRequestSchema,
  ElevenLabsDeleteWorkspaceInviteRequestSchema,
  ElevenLabsDisableWorkspaceApiKeyRequestSchema,
  ElevenLabsGetWorkspaceResourceRequestSchema,
  ElevenLabsListWorkspaceAuditLogsRequestSchema,
  ElevenLabsListWorkspaceWebhooksRequestSchema,
  ElevenLabsRemoveWorkspaceGroupMemberRequestSchema,
  ElevenLabsSearchWorkspaceGroupsRequestSchema,
  ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequestSchema,
  ElevenLabsShareWorkspaceResourceRequestSchema,
  ElevenLabsUnshareWorkspaceResourceRequestSchema,
  ElevenLabsUpdateWorkspaceAuthConnectionRequestSchema,
  ElevenLabsUpdateWorkspaceMemberRequestSchema,
  ElevenLabsUpdateWorkspaceWebhookRequestSchema,
  ElevenLabsWorkspaceAnalyticsRequestsRequestSchema,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createWorkspaceEndpoints(ctx: ElevenLabsContext) {
  const { makeJsonRequest, makeJsonRequestAllowEmpty, buildQueryString } = ctx;

  // POST https://api.elevenlabs.io/v1/workspace/analytics/query/usage-by-product-over-time
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/usage/get-usage-by-product-over-time
  const usageByProductOverTime = Object.assign(
    async (
      req: ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsWorkspaceAnalyticsQueryResponse> => {
      return makeJsonRequest<ElevenLabsWorkspaceAnalyticsQueryResponse>(
        "POST",
        "/v1/workspace/analytics/query/usage-by-product-over-time",
        req,
        signal
      );
    },
    {
      schema: ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema,
    }
  );

  // POST https://api.elevenlabs.io/v1/workspace/analytics/requests
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/analytics/requests/get
  const workspaceAnalyticsRequests = Object.assign(
    async (
      req: ElevenLabsWorkspaceAnalyticsRequestsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsWorkspaceAnalyticsRequestsResponse> => {
      return makeJsonRequest<ElevenLabsWorkspaceAnalyticsRequestsResponse>(
        "POST",
        "/v1/workspace/analytics/requests",
        req,
        signal
      );
    },
    { schema: ElevenLabsWorkspaceAnalyticsRequestsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/workspace/audit-logs
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/audit-logs/list
  const listWorkspaceAuditLogs = Object.assign(
    async (
      req: ElevenLabsListWorkspaceAuditLogsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsWorkspaceAuditLogsPageResponse> => {
      return makeJsonRequest<ElevenLabsWorkspaceAuditLogsPageResponse>(
        "GET",
        "/v1/workspace/audit-logs",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListWorkspaceAuditLogsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/workspace/groups
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/groups/list
  const listWorkspaceGroups = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsWorkspaceGroupsResponse> => {
      return makeJsonRequest<ElevenLabsWorkspaceGroupsResponse>(
        "GET",
        "/v1/workspace/groups",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/workspace/groups/search
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/groups/search
  const searchWorkspaceGroups = Object.assign(
    async (
      req: ElevenLabsSearchWorkspaceGroupsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSearchWorkspaceGroupsResponse> => {
      return makeJsonRequest<ElevenLabsSearchWorkspaceGroupsResponse>(
        "GET",
        "/v1/workspace/groups/search",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsSearchWorkspaceGroupsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/groups/{groupId}/members
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/groups/members/add
  const addWorkspaceGroupMember = Object.assign(
    async (
      groupId: string,
      req: ElevenLabsAddWorkspaceGroupMemberRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddWorkspaceGroupMemberResponse> => {
      return makeJsonRequest<ElevenLabsAddWorkspaceGroupMemberResponse>(
        "POST",
        `/v1/workspace/groups/${encodeURIComponent(groupId)}/members`,
        req,
        signal
      );
    },
    { schema: ElevenLabsAddWorkspaceGroupMemberRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/groups/{groupId}/members/remove
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/groups/members/remove
  const removeWorkspaceGroupMember = Object.assign(
    async (
      groupId: string,
      req: ElevenLabsRemoveWorkspaceGroupMemberRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsRemoveWorkspaceGroupMemberResponse> => {
      return makeJsonRequest<ElevenLabsRemoveWorkspaceGroupMemberResponse>(
        "POST",
        `/v1/workspace/groups/${encodeURIComponent(groupId)}/members/remove`,
        req,
        signal
      );
    },
    { schema: ElevenLabsRemoveWorkspaceGroupMemberRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/members
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/members/update
  const updateWorkspaceMember = Object.assign(
    async (
      req: ElevenLabsUpdateWorkspaceMemberRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateWorkspaceMemberResponse> => {
      return makeJsonRequest<ElevenLabsUpdateWorkspaceMemberResponse>(
        "POST",
        "/v1/workspace/members",
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateWorkspaceMemberRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/invites/add
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/invites/create
  const addWorkspaceInvite = Object.assign(
    async (
      req: ElevenLabsAddWorkspaceInviteRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddWorkspaceInviteResponse> => {
      return makeJsonRequest<ElevenLabsAddWorkspaceInviteResponse>(
        "POST",
        "/v1/workspace/invites/add",
        req,
        signal
      );
    },
    { schema: ElevenLabsAddWorkspaceInviteRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/invites/add-bulk
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/invites/create-batch
  const addWorkspaceInvitesBulk = Object.assign(
    async (
      req: ElevenLabsAddWorkspaceInvitesBulkRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddWorkspaceInviteResponse> => {
      return makeJsonRequest<ElevenLabsAddWorkspaceInviteResponse>(
        "POST",
        "/v1/workspace/invites/add-bulk",
        req,
        signal
      );
    },
    { schema: ElevenLabsAddWorkspaceInvitesBulkRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/workspace/invites
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/invites/delete
  const deleteWorkspaceInvite = Object.assign(
    async (
      req: ElevenLabsDeleteWorkspaceInviteRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteWorkspaceInviteResponse> => {
      return makeJsonRequest<ElevenLabsDeleteWorkspaceInviteResponse>(
        "DELETE",
        "/v1/workspace/invites",
        req,
        signal
      );
    },
    { schema: ElevenLabsDeleteWorkspaceInviteRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/workspace/resources/{resourceId}
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/resources/get
  const getWorkspaceResource = Object.assign(
    async (
      resourceId: string,
      req: ElevenLabsGetWorkspaceResourceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsWorkspaceResourceMetadataResponse> => {
      return makeJsonRequest<ElevenLabsWorkspaceResourceMetadataResponse>(
        "GET",
        `/v1/workspace/resources/${encodeURIComponent(resourceId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetWorkspaceResourceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/resources/{resourceId}/share
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/resources/share
  const shareWorkspaceResource = Object.assign(
    async (
      resourceId: string,
      req: ElevenLabsShareWorkspaceResourceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsShareWorkspaceResourceResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsShareWorkspaceResourceResponse>(
        "POST",
        `/v1/workspace/resources/${encodeURIComponent(resourceId)}/share`,
        req,
        signal
      );
    },
    { schema: ElevenLabsShareWorkspaceResourceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/resources/{resourceId}/unshare
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/resources/unshare
  const unshareWorkspaceResource = Object.assign(
    async (
      resourceId: string,
      req: ElevenLabsUnshareWorkspaceResourceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUnshareWorkspaceResourceResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsUnshareWorkspaceResourceResponse>(
        "POST",
        `/v1/workspace/resources/${encodeURIComponent(resourceId)}/unshare`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUnshareWorkspaceResourceRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/workspace/webhooks
  // Docs: https://elevenlabs.io/docs/api-reference/webhooks/list
  const listWorkspaceWebhooks = Object.assign(
    async (
      req: ElevenLabsListWorkspaceWebhooksRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListWorkspaceWebhooksResponse> => {
      return makeJsonRequest<ElevenLabsListWorkspaceWebhooksResponse>(
        "GET",
        "/v1/workspace/webhooks",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListWorkspaceWebhooksRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/webhooks
  // Docs: https://elevenlabs.io/docs/api-reference/webhooks/create
  const createWorkspaceWebhook = Object.assign(
    async (
      req: ElevenLabsCreateWorkspaceWebhookRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateWorkspaceWebhookResponse> => {
      return makeJsonRequest<ElevenLabsCreateWorkspaceWebhookResponse>(
        "POST",
        "/v1/workspace/webhooks",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateWorkspaceWebhookRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/workspace/webhooks/{webhookId}
  // Docs: https://elevenlabs.io/docs/api-reference/webhooks/update
  const updateWorkspaceWebhook = Object.assign(
    async (
      webhookId: string,
      req: ElevenLabsUpdateWorkspaceWebhookRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateWorkspaceWebhookResponse> => {
      return makeJsonRequest<ElevenLabsUpdateWorkspaceWebhookResponse>(
        "PATCH",
        `/v1/workspace/webhooks/${encodeURIComponent(webhookId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateWorkspaceWebhookRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/workspace/webhooks/{webhookId}
  // Docs: https://elevenlabs.io/docs/api-reference/webhooks/delete
  const deleteWorkspaceWebhook = Object.assign(
    async (
      webhookId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteWorkspaceWebhookResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteWorkspaceWebhookResponse>(
        "DELETE",
        `/v1/workspace/webhooks/${encodeURIComponent(webhookId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/workspace/auth-connections
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/auth-connections/list
  const listWorkspaceAuthConnections = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsListWorkspaceAuthConnectionsResponse> => {
      return makeJsonRequest<ElevenLabsListWorkspaceAuthConnectionsResponse>(
        "GET",
        "/v1/workspace/auth-connections",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/workspace/auth-connections
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/auth-connections/create
  const createWorkspaceAuthConnection = Object.assign(
    async (
      req: ElevenLabsCreateWorkspaceAuthConnectionRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateWorkspaceAuthConnectionResponse> => {
      return makeJsonRequest<ElevenLabsCreateWorkspaceAuthConnectionResponse>(
        "POST",
        "/v1/workspace/auth-connections",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateWorkspaceAuthConnectionRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/workspace/auth-connections/{authConnectionId}
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/auth-connections/update
  const updateWorkspaceAuthConnection = Object.assign(
    async (
      authConnectionId: string,
      req: ElevenLabsUpdateWorkspaceAuthConnectionRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateWorkspaceAuthConnectionResponse> => {
      return makeJsonRequest<ElevenLabsUpdateWorkspaceAuthConnectionResponse>(
        "PATCH",
        `/v1/workspace/auth-connections/${encodeURIComponent(authConnectionId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateWorkspaceAuthConnectionRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/workspace/auth-connections/{authConnectionId}
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/auth-connections/delete
  const deleteWorkspaceAuthConnection = Object.assign(
    async (
      authConnectionId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteWorkspaceAuthConnectionResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteWorkspaceAuthConnectionResponse>(
        "DELETE",
        `/v1/workspace/auth-connections/${encodeURIComponent(authConnectionId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/workspaces/api-keys/disable
  // Docs: https://elevenlabs.io/docs/api-reference/workspaces/api-keys/disable
  const disableWorkspaceApiKey = Object.assign(
    async (
      req: ElevenLabsDisableWorkspaceApiKeyRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsDisableWorkspaceApiKeyResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDisableWorkspaceApiKeyResponse>(
        "POST",
        "/v1/workspaces/api-keys/disable",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsDisableWorkspaceApiKeyRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspaces/api-keys/third-party-disabling
  // Docs: https://elevenlabs.io/docs/api-reference/workspaces/api-keys/third-party-disabling
  const setWorkspaceApiKeyThirdPartyDisabling = Object.assign(
    async (
      req: ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingResponse>(
        "POST",
        "/v1/workspaces/api-keys/third-party-disabling",
        req,
        signal
      );
    },
    { schema: ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequestSchema }
  );

  const workspaceGroupMembers = {
    add: addWorkspaceGroupMember,
    remove: removeWorkspaceGroupMember,
  };
  const workspaceGroups = {
    list: listWorkspaceGroups,
    search: searchWorkspaceGroups,
    members: workspaceGroupMembers,
  };
  const workspaceMembers = {
    update: updateWorkspaceMember,
  };
  const workspaceInvites = {
    add: addWorkspaceInvite,
    addBulk: addWorkspaceInvitesBulk,
    delete: deleteWorkspaceInvite,
  };
  const workspaceResources = {
    get: getWorkspaceResource,
    share: shareWorkspaceResource,
    unshare: unshareWorkspaceResource,
  };
  const workspaceWebhooks = {
    list: listWorkspaceWebhooks,
    create: createWorkspaceWebhook,
    update: updateWorkspaceWebhook,
    delete: deleteWorkspaceWebhook,
  };
  const workspaceAuthConnections = {
    list: listWorkspaceAuthConnections,
    create: createWorkspaceAuthConnection,
    update: updateWorkspaceAuthConnection,
    delete: deleteWorkspaceAuthConnection,
  };
  const workspace = {
    auditLogs: listWorkspaceAuditLogs,
    groups: workspaceGroups,
    members: workspaceMembers,
    invites: workspaceInvites,
    resources: workspaceResources,
    webhooks: workspaceWebhooks,
    authConnections: workspaceAuthConnections,
    analytics: {
      requests: workspaceAnalyticsRequests,
      query: {
        usageByProductOverTime,
      },
    },
  };
  const workspaces = {
    apiKeys: {
      disable: disableWorkspaceApiKey,
      thirdPartyDisabling: setWorkspaceApiKeyThirdPartyDisabling,
    },
  };
  const getWorkspace = {
    auditLogs: listWorkspaceAuditLogs,
    groups: {
      list: listWorkspaceGroups,
      search: searchWorkspaceGroups,
    },
    resources: {
      get: getWorkspaceResource,
    },
    webhooks: {
      list: listWorkspaceWebhooks,
    },
    authConnections: {
      list: listWorkspaceAuthConnections,
    },
  };
  const postWorkspace = {
    groups: {
      members: workspaceGroupMembers,
    },
    members: workspaceMembers,
    invites: {
      add: addWorkspaceInvite,
      addBulk: addWorkspaceInvitesBulk,
    },
    resources: {
      share: shareWorkspaceResource,
      unshare: unshareWorkspaceResource,
    },
    webhooks: {
      create: createWorkspaceWebhook,
    },
    authConnections: {
      create: createWorkspaceAuthConnection,
    },
    analytics: workspace.analytics,
  };
  const patchWorkspace = {
    webhooks: {
      update: updateWorkspaceWebhook,
    },
    authConnections: {
      update: updateWorkspaceAuthConnection,
    },
  };
  const deleteWorkspace = {
    invites: {
      delete: deleteWorkspaceInvite,
    },
    webhooks: {
      delete: deleteWorkspaceWebhook,
    },
    authConnections: {
      delete: deleteWorkspaceAuthConnection,
    },
  };

  return {
    v1: { workspace, workspaces },
    get: { v1: { workspace: getWorkspace } },
    post: { v1: { workspace: postWorkspace, workspaces } },
    patch: { v1: { workspace: patchWorkspace } },
    delete: { v1: { workspace: deleteWorkspace } },
  };
}
