import {
  ElevenLabsAgentBranchMutationResponse,
  ElevenLabsAgentBranchPreviewResponse,
  ElevenLabsAgentBranchResponse,
  ElevenLabsAgentDeploymentResponse,
  ElevenLabsAgentDraftResponse,
  ElevenLabsAgentKnowledgeBaseSizeResponse,
  ElevenLabsAgentTestFolderResponse,
  ElevenLabsAgentTestResponse,
  ElevenLabsAgentVersionMetadata,
  ElevenLabsAssignConversationTagsRequest,
  ElevenLabsAssignConversationTagsResponse,
  ElevenLabsBatchCallDetailedResponse,
  ElevenLabsBatchCallResponse,
  ElevenLabsBulkMoveAgentTestsRequest,
  ElevenLabsBulkMoveAgentTestsResponse,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsResponse,
  ElevenLabsCalculateAgentLlmUsageRequest,
  ElevenLabsCalculateAgentLlmUsageResponse,
  ElevenLabsCalculateLlmUsageRequest,
  ElevenLabsCalculateLlmUsageResponse,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexResponse,
  ElevenLabsComputeKnowledgeBaseRagIndexesRequest,
  ElevenLabsComputeKnowledgeBaseRagIndexesResponse,
  ElevenLabsConvaiDashboardSettingsResponse,
  ElevenLabsConvaiSettingsResponse,
  ElevenLabsConversationFeedbackRequest,
  ElevenLabsConversationFeedbackResponse,
  ElevenLabsCreateAgentBranchRequest,
  ElevenLabsCreateAgentBranchResponse,
  ElevenLabsCreateAgentDeploymentRequest,
  ElevenLabsCreateAgentDraftRequest,
  ElevenLabsCreateAgentRequest,
  ElevenLabsCreateAgentResponse,
  ElevenLabsCreateAgentTestFolderRequest,
  ElevenLabsCreateAgentTestFolderResponse,
  ElevenLabsCreateAgentTestRequest,
  ElevenLabsCreateAgentTestResponse,
  ElevenLabsCreateConversationTagRequest,
  ElevenLabsCreateConversationTagResponse,
  ElevenLabsCreateEnvironmentVariableRequest,
  ElevenLabsCreateEnvironmentVariableResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse,
  ElevenLabsCreateKnowledgeBaseFolderRequest,
  ElevenLabsCreateKnowledgeBaseFolderResponse,
  ElevenLabsCreateMcpServerRequest,
  ElevenLabsCreateMcpServerToolApprovalRequest,
  ElevenLabsCreateMcpToolConfigOverrideRequest,
  ElevenLabsCreatePhoneNumberRequest,
  ElevenLabsCreatePhoneNumberResponse,
  ElevenLabsCreateToolRequest,
  ElevenLabsCreateToolResponse,
  ElevenLabsCreateWorkspaceSecretRequest,
  ElevenLabsCreateWorkspaceSecretResponse,
  ElevenLabsDeleteAgentDraftRequest,
  ElevenLabsDeleteAgentResponse,
  ElevenLabsDeleteAgentTestFolderRequest,
  ElevenLabsDeleteAgentTestFolderResponse,
  ElevenLabsDeleteAgentTestResponse,
  ElevenLabsDeleteBatchCallResponse,
  ElevenLabsDeleteConversationFileResponse,
  ElevenLabsDeleteConversationResponse,
  ElevenLabsDeleteConversationTagResponse,
  ElevenLabsDeleteKnowledgeBaseDocumentRagIndexResponse,
  ElevenLabsDeleteKnowledgeBaseDocumentRequest,
  ElevenLabsDeleteKnowledgeBaseDocumentResponse,
  ElevenLabsDeleteMcpServerResponse,
  ElevenLabsDeletePhoneNumberResponse,
  ElevenLabsDeleteToolResponse,
  ElevenLabsDeleteWhatsAppAccountResponse,
  ElevenLabsDeleteWorkspaceSecretResponse,
  ElevenLabsDuplicateAgentRequest,
  ElevenLabsDuplicateAgentResponse,
  ElevenLabsExotelOutboundCallRequest,
  ElevenLabsExotelOutboundCallResponse,
  ElevenLabsGetAgentLinkResponse,
  ElevenLabsGetAgentRequest,
  ElevenLabsGetAgentResponse,
  ElevenLabsGetAgentSummariesRequest,
  ElevenLabsGetAgentSummariesResponse,
  ElevenLabsGetAgentTestSummariesRequest,
  ElevenLabsGetAgentTestSummariesResponse,
  ElevenLabsGetAgentTopicsRequest,
  ElevenLabsGetAgentTopicsResponse,
  ElevenLabsGetAgentWidgetRequest,
  ElevenLabsGetAgentWidgetResponse,
  ElevenLabsGetConversationRequest,
  ElevenLabsGetConversationResponse,
  ElevenLabsGetConversationSipMessagesRequest,
  ElevenLabsGetConversationSipMessagesResponse,
  ElevenLabsGetConversationTagResponse,
  ElevenLabsGetConversationTokenRequest,
  ElevenLabsGetConversationTokenResponse,
  ElevenLabsGetEnvironmentVariableResponse,
  ElevenLabsGetKnowledgeBaseDependentAgentsRequest,
  ElevenLabsGetKnowledgeBaseDependentAgentsResponse,
  ElevenLabsGetKnowledgeBaseDocumentChunkRequest,
  ElevenLabsGetKnowledgeBaseDocumentChunkResponse,
  ElevenLabsGetKnowledgeBaseDocumentContentResponse,
  ElevenLabsGetKnowledgeBaseDocumentRagIndexesResponse,
  ElevenLabsGetKnowledgeBaseDocumentRequest,
  ElevenLabsGetKnowledgeBaseDocumentResponse,
  ElevenLabsGetKnowledgeBaseRagIndexOverviewResponse,
  ElevenLabsGetKnowledgeBaseSourceFileUrlResponse,
  ElevenLabsGetKnowledgeBaseSummariesRequest,
  ElevenLabsGetKnowledgeBaseSummariesResponse,
  ElevenLabsGetLiveConversationCountRequest,
  ElevenLabsGetPhoneNumberResponse,
  ElevenLabsGetPhoneNumberSipMessagesRequest,
  ElevenLabsGetPhoneNumberSipMessagesResponse,
  ElevenLabsGetSecretDependenciesRequest,
  ElevenLabsGetSecretDependenciesResponse,
  ElevenLabsGetSignedUrlRequest,
  ElevenLabsGetSignedUrlResponse,
  ElevenLabsGetTestInvocationResponse,
  ElevenLabsGetToolDependentAgentsRequest,
  ElevenLabsGetToolDependentAgentsResponse,
  ElevenLabsGetToolExecutionsRequest,
  ElevenLabsGetToolExecutionsResponse,
  ElevenLabsGetWhatsAppAccountResponse,
  ElevenLabsGetWorkspaceSecretResponse,
  ElevenLabsListAgentBranchesRequest,
  ElevenLabsListAgentBranchesResponse,
  ElevenLabsListAgentTestsRequest,
  ElevenLabsListAgentTestsResponse,
  ElevenLabsListAgentsRequest,
  ElevenLabsListAgentsResponse,
  ElevenLabsListConversationTagsRequest,
  ElevenLabsListConversationTagsResponse,
  ElevenLabsListConversationUsersRequest,
  ElevenLabsListConversationUsersResponse,
  ElevenLabsListConversationsRequest,
  ElevenLabsListConversationsResponse,
  ElevenLabsListEnvironmentVariablesRequest,
  ElevenLabsListEnvironmentVariablesResponse,
  ElevenLabsListKnowledgeBaseDocumentChunksRequest,
  ElevenLabsListKnowledgeBaseDocumentChunksResponse,
  ElevenLabsListKnowledgeBaseDocumentsRequest,
  ElevenLabsListKnowledgeBaseDocumentsResponse,
  ElevenLabsListLlmsResponse,
  ElevenLabsListMcpServerToolsResponse,
  ElevenLabsListMcpServersResponse,
  ElevenLabsListPhoneNumbersRequest,
  ElevenLabsListPhoneNumbersResponse,
  ElevenLabsListTestInvocationsRequest,
  ElevenLabsListTestInvocationsResponse,
  ElevenLabsListToolsRequest,
  ElevenLabsListToolsResponse,
  ElevenLabsListWhatsAppAccountsRequest,
  ElevenLabsListWhatsAppAccountsResponse,
  ElevenLabsListWorkspaceBatchCallsRequest,
  ElevenLabsListWorkspaceSecretsRequest,
  ElevenLabsListWorkspaceSecretsResponse,
  ElevenLabsLiveConversationCountResponse,
  ElevenLabsMcpServerResponse,
  ElevenLabsMcpToolConfigOverride,
  ElevenLabsMergeAgentBranchRequest,
  ElevenLabsMoveKnowledgeBaseEntityRequest,
  ElevenLabsMoveKnowledgeBaseEntityResponse,
  ElevenLabsPostAgentAvatarRequest,
  ElevenLabsPostAgentAvatarResponse,
  ElevenLabsPreviewAgentBranchMergeRequest,
  ElevenLabsRefreshKnowledgeBaseDocumentResponse,
  ElevenLabsRegisterTwilioCallRequest,
  ElevenLabsRegisterTwilioCallResponse,
  ElevenLabsResubmitTestsRequest,
  ElevenLabsResubmitTestsResponse,
  ElevenLabsRunAgentTestsRequest,
  ElevenLabsRunAgentTestsResponse,
  ElevenLabsRunConversationAnalysisResponse,
  ElevenLabsRunConversationEvaluationsRequest,
  ElevenLabsRunConversationEvaluationsResponse,
  ElevenLabsSearchKnowledgeBaseContentRequest,
  ElevenLabsSearchKnowledgeBaseContentResponse,
  ElevenLabsSecretDependencyResourceType,
  ElevenLabsSimulateConversationRequest,
  ElevenLabsSimulatedConversationResponse,
  ElevenLabsSipTrunkOutboundCallRequest,
  ElevenLabsSipTrunkOutboundCallResponse,
  ElevenLabsSmartSearchConversationMessagesRequest,
  ElevenLabsSmartSearchConversationMessagesResponse,
  ElevenLabsSubmitBatchCallRequest,
  ElevenLabsTextSearchConversationMessagesRequest,
  ElevenLabsTextSearchConversationMessagesResponse,
  ElevenLabsToolResponse,
  ElevenLabsTwilioOutboundCallRequest,
  ElevenLabsTwilioOutboundCallResponse,
  ElevenLabsUnassignConversationTagResponse,
  ElevenLabsUpdateAgentBranchRequest,
  ElevenLabsUpdateAgentRequest,
  ElevenLabsUpdateAgentTestFolderRequest,
  ElevenLabsUpdateAgentTestFolderResponse,
  ElevenLabsUpdateAgentTestRequest,
  ElevenLabsUpdateAgentTestResponse,
  ElevenLabsUpdateConvaiDashboardSettingsRequest,
  ElevenLabsUpdateConvaiSettingsRequest,
  ElevenLabsUpdateConversationTagRequest,
  ElevenLabsUpdateConversationTagResponse,
  ElevenLabsUpdateEnvironmentVariableRequest,
  ElevenLabsUpdateEnvironmentVariableResponse,
  ElevenLabsUpdateKnowledgeBaseDocumentRequest,
  ElevenLabsUpdateKnowledgeBaseDocumentResponse,
  ElevenLabsUpdateKnowledgeBaseFileDocumentRequest,
  ElevenLabsUpdateKnowledgeBaseFileDocumentResponse,
  ElevenLabsUpdateMcpServerRequest,
  ElevenLabsUpdateMcpToolConfigOverrideRequest,
  ElevenLabsUpdatePhoneNumberRequest,
  ElevenLabsUpdatePhoneNumberResponse,
  ElevenLabsUpdateToolRequest,
  ElevenLabsUpdateWhatsAppAccountRequest,
  ElevenLabsUpdateWhatsAppAccountResponse,
  ElevenLabsUpdateWorkspaceSecretRequest,
  ElevenLabsUpdateWorkspaceSecretResponse,
  ElevenLabsUploadConversationFileRequest,
  ElevenLabsUploadConversationFileResponse,
  ElevenLabsWhatsAppOutboundCallRequest,
  ElevenLabsWhatsAppOutboundCallResponse,
  ElevenLabsWhatsAppOutboundMessageRequest,
  ElevenLabsWhatsAppOutboundMessageResponse,
  ElevenLabsWorkspaceBatchCallsResponse,
} from "./types";
import {
  ElevenLabsAssignConversationTagsRequestSchema,
  ElevenLabsBulkMoveAgentTestsRequestSchema,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsRequestSchema,
  ElevenLabsCalculateAgentLlmUsageRequestSchema,
  ElevenLabsCalculateLlmUsageRequestSchema,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequestSchema,
  ElevenLabsComputeKnowledgeBaseRagIndexesRequestSchema,
  ElevenLabsConversationFeedbackRequestSchema,
  ElevenLabsCreateAgentBranchRequestSchema,
  ElevenLabsCreateAgentDeploymentRequestSchema,
  ElevenLabsCreateAgentDraftRequestSchema,
  ElevenLabsCreateAgentRequestSchema,
  ElevenLabsCreateAgentTestFolderRequestSchema,
  ElevenLabsCreateAgentTestRequestSchema,
  ElevenLabsCreateConversationTagRequestSchema,
  ElevenLabsCreateEnvironmentVariableRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestSchema,
  ElevenLabsCreateKnowledgeBaseFolderRequestSchema,
  ElevenLabsCreateMcpServerRequestSchema,
  ElevenLabsCreateMcpServerToolApprovalRequestSchema,
  ElevenLabsCreateMcpToolConfigOverrideRequestSchema,
  ElevenLabsCreatePhoneNumberRequestSchema,
  ElevenLabsCreateToolRequestSchema,
  ElevenLabsCreateWorkspaceSecretRequestSchema,
  ElevenLabsDeleteAgentDraftRequestSchema,
  ElevenLabsDeleteAgentTestFolderRequestSchema,
  ElevenLabsDeleteKnowledgeBaseDocumentRequestSchema,
  ElevenLabsDuplicateAgentRequestSchema,
  ElevenLabsExotelOutboundCallRequestSchema,
  ElevenLabsGetAgentRequestSchema,
  ElevenLabsGetAgentSummariesRequestSchema,
  ElevenLabsGetAgentTestSummariesRequestSchema,
  ElevenLabsGetAgentTopicsRequestSchema,
  ElevenLabsGetAgentWidgetRequestSchema,
  ElevenLabsGetConversationRequestSchema,
  ElevenLabsGetConversationSipMessagesRequestSchema,
  ElevenLabsGetConversationTokenRequestSchema,
  ElevenLabsGetKnowledgeBaseDependentAgentsRequestSchema,
  ElevenLabsGetKnowledgeBaseDocumentChunkRequestSchema,
  ElevenLabsGetKnowledgeBaseDocumentRequestSchema,
  ElevenLabsGetKnowledgeBaseSummariesRequestSchema,
  ElevenLabsGetLiveConversationCountRequestSchema,
  ElevenLabsGetPhoneNumberSipMessagesRequestSchema,
  ElevenLabsGetSecretDependenciesRequestSchema,
  ElevenLabsGetSignedUrlRequestSchema,
  ElevenLabsGetToolDependentAgentsRequestSchema,
  ElevenLabsGetToolExecutionsRequestSchema,
  ElevenLabsListAgentBranchesRequestSchema,
  ElevenLabsListAgentTestsRequestSchema,
  ElevenLabsListAgentsRequestSchema,
  ElevenLabsListConversationTagsRequestSchema,
  ElevenLabsListConversationUsersRequestSchema,
  ElevenLabsListConversationsRequestSchema,
  ElevenLabsListEnvironmentVariablesRequestSchema,
  ElevenLabsListKnowledgeBaseDocumentChunksRequestSchema,
  ElevenLabsListKnowledgeBaseDocumentsRequestSchema,
  ElevenLabsListPhoneNumbersRequestSchema,
  ElevenLabsListTestInvocationsRequestSchema,
  ElevenLabsListToolsRequestSchema,
  ElevenLabsListWhatsAppAccountsRequestSchema,
  ElevenLabsListWorkspaceBatchCallsRequestSchema,
  ElevenLabsListWorkspaceSecretsRequestSchema,
  ElevenLabsMergeAgentBranchRequestSchema,
  ElevenLabsMoveKnowledgeBaseEntityRequestSchema,
  ElevenLabsPostAgentAvatarRequestSchema,
  ElevenLabsPreviewAgentBranchMergeRequestSchema,
  ElevenLabsRegisterTwilioCallRequestSchema,
  ElevenLabsResubmitTestsRequestSchema,
  ElevenLabsRunAgentTestsRequestSchema,
  ElevenLabsRunConversationEvaluationsRequestSchema,
  ElevenLabsSearchKnowledgeBaseContentRequestSchema,
  ElevenLabsSimulateConversationRequestSchema,
  ElevenLabsSipTrunkOutboundCallRequestSchema,
  ElevenLabsSmartSearchConversationMessagesRequestSchema,
  ElevenLabsSubmitBatchCallRequestSchema,
  ElevenLabsTextSearchConversationMessagesRequestSchema,
  ElevenLabsTwilioOutboundCallRequestSchema,
  ElevenLabsUpdateAgentBranchRequestSchema,
  ElevenLabsUpdateAgentRequestSchema,
  ElevenLabsUpdateAgentTestFolderRequestSchema,
  ElevenLabsUpdateAgentTestRequestSchema,
  ElevenLabsUpdateConvaiDashboardSettingsRequestSchema,
  ElevenLabsUpdateConvaiSettingsRequestSchema,
  ElevenLabsUpdateConversationTagRequestSchema,
  ElevenLabsUpdateEnvironmentVariableRequestSchema,
  ElevenLabsUpdateKnowledgeBaseDocumentRequestSchema,
  ElevenLabsUpdateKnowledgeBaseFileDocumentRequestSchema,
  ElevenLabsUpdateMcpServerRequestSchema,
  ElevenLabsUpdateMcpToolConfigOverrideRequestSchema,
  ElevenLabsUpdatePhoneNumberRequestSchema,
  ElevenLabsUpdateToolRequestSchema,
  ElevenLabsUpdateWhatsAppAccountRequestSchema,
  ElevenLabsUpdateWorkspaceSecretRequestSchema,
  ElevenLabsUploadConversationFileRequestSchema,
  ElevenLabsWhatsAppOutboundCallRequestSchema,
  ElevenLabsWhatsAppOutboundMessageRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createConvaiEndpoints(ctx: ElevenLabsContext) {
  const {
    makeBinaryRequest,
    makeGetBinaryRequest,
    makeTextRequest,
    makeTextBodyRequest,
    makeJsonRequest,
    makeJsonRequestAllowEmpty,
    makeMultipartJsonRequest,
    makeMultipartJsonRequestWithMethod,
    appendFormField,
    buildQueryString,
  } = ctx;

  // POST https://api.elevenlabs.io/v1/convai/agents/create
  // Docs: https://elevenlabs.io/docs/api-reference/agents/create
  const createAgent = Object.assign(
    async (
      req: ElevenLabsCreateAgentRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateAgentResponse> => {
      const { enable_versioning, ...body } = req;
      const query = buildQueryString({ enable_versioning });
      return makeJsonRequest<ElevenLabsCreateAgentResponse>(
        "POST",
        "/v1/convai/agents/create",
        body,
        signal,
        query
      );
    },
    { schema: ElevenLabsCreateAgentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents
  // Docs: https://elevenlabs.io/docs/api-reference/agents/list
  const listAgents = Object.assign(
    async (
      req: ElevenLabsListAgentsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListAgentsResponse> => {
      return makeJsonRequest<ElevenLabsListAgentsResponse>(
        "GET",
        "/v1/convai/agents",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListAgentsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/get
  const getAgent = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsGetAgentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetAgentRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/agents/{agentId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/update
  const updateAgent = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsUpdateAgentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentResponse> => {
      const { enable_versioning_if_not_enabled, branch_id, ...body } = req;
      const query = buildQueryString({
        enable_versioning_if_not_enabled,
        branch_id,
      });
      return makeJsonRequest<ElevenLabsGetAgentResponse>(
        "PATCH",
        `/v1/convai/agents/${encodeURIComponent(agentId)}`,
        body,
        signal,
        query
      );
    },
    { schema: ElevenLabsUpdateAgentRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/agents/{agentId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/delete
  const deleteAgent = Object.assign(
    async (
      agentId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteAgentResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteAgentResponse>(
        "DELETE",
        `/v1/convai/agents/${encodeURIComponent(agentId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/widget
  // Docs: https://elevenlabs.io/docs/api-reference/widget/get
  const getAgentWidget = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsGetAgentWidgetRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentWidgetResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentWidgetResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/widget`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetAgentWidgetRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/link
  // Docs: https://elevenlabs.io/docs/api-reference/agents/get-link
  const getAgentLink = Object.assign(
    async (
      agentId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentLinkResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentLinkResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/link`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches
  const listAgentBranches = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsListAgentBranchesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListAgentBranchesResponse> => {
      return makeJsonRequest<ElevenLabsListAgentBranchesResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListAgentBranchesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/summaries
  // Docs: https://elevenlabs.io/docs/api-reference/agents/get-summaries
  const getAgentSummaries = Object.assign(
    async (
      req: ElevenLabsGetAgentSummariesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentSummariesResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentSummariesResponse>(
        "GET",
        "/v1/convai/agents/summaries",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetAgentSummariesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/duplicate
  // Docs: https://elevenlabs.io/docs/api-reference/agents/duplicate
  const duplicateAgent = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsDuplicateAgentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsDuplicateAgentResponse> => {
      return makeJsonRequest<ElevenLabsDuplicateAgentResponse>(
        "POST",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/duplicate`,
        Object.keys(req).length > 0 ? req : undefined,
        signal
      );
    },
    { schema: ElevenLabsDuplicateAgentRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/avatar
  // Docs: https://elevenlabs.io/docs/api-reference/widget/create
  const postAgentAvatar = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsPostAgentAvatarRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPostAgentAvatarResponse> => {
      const form = new FormData();
      appendFormField(form, "avatar_file", req.avatar_file);
      return makeMultipartJsonRequest<ElevenLabsPostAgentAvatarResponse>(
        `/v1/convai/agents/${encodeURIComponent(agentId)}/avatar`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsPostAgentAvatarRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/versions/{versionId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/versions/get
  const getAgentVersion = Object.assign(
    async (
      agentId: string,
      versionId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentVersionMetadata> => {
      return makeJsonRequest<ElevenLabsAgentVersionMetadata>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/versions/${encodeURIComponent(versionId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/simulate-conversation/stream
  // Docs: https://elevenlabs.io/docs/api-reference/agents/simulate-conversation-stream
  const simulateConversationStream = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsSimulateConversationRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest(
        `/v1/convai/agents/${encodeURIComponent(agentId)}/simulate-conversation/stream`,
        req,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsSimulateConversationRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/simulate-conversation
  // Docs: https://elevenlabs.io/docs/api-reference/agents/simulate-conversation
  const simulateConversation = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsSimulateConversationRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSimulatedConversationResponse> => {
      return makeJsonRequest<ElevenLabsSimulatedConversationResponse>(
        "POST",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/simulate-conversation`,
        req,
        signal
      );
    },
    {
      schema: ElevenLabsSimulateConversationRequestSchema,
      stream: simulateConversationStream,
    }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/topics
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/topics/get
  const getAgentTopics = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsGetAgentTopicsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentTopicsResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentTopicsResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/topics`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetAgentTopicsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agent/{agentId}/knowledge-base/size
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/size
  const getAgentKnowledgeBaseSize = Object.assign(
    async (
      agentId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentKnowledgeBaseSizeResponse> => {
      return makeJsonRequest<ElevenLabsAgentKnowledgeBaseSizeResponse>(
        "GET",
        `/v1/convai/agent/${encodeURIComponent(agentId)}/knowledge-base/size`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/agent/{agentId}/llm-usage/calculate
  // Docs: https://elevenlabs.io/docs/api-reference/agents/calculate
  const calculateAgentLlmUsage = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsCalculateAgentLlmUsageRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsCalculateAgentLlmUsageResponse> => {
      return makeJsonRequest<ElevenLabsCalculateAgentLlmUsageResponse>(
        "POST",
        `/v1/convai/agent/${encodeURIComponent(agentId)}/llm-usage/calculate`,
        Object.keys(req).length > 0 ? req : undefined,
        signal
      );
    },
    { schema: ElevenLabsCalculateAgentLlmUsageRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/drafts
  // Docs: https://elevenlabs.io/docs/api-reference/agents/drafts/create
  const createAgentDraft = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsCreateAgentDraftRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentDraftResponse> => {
      const { branch_id, ...body } = req;
      return makeJsonRequest<ElevenLabsAgentDraftResponse>(
        "POST",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/drafts`,
        body,
        signal,
        buildQueryString({ branch_id })
      );
    },
    { schema: ElevenLabsCreateAgentDraftRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/agents/{agentId}/drafts
  // Docs: https://elevenlabs.io/docs/api-reference/agents/drafts/delete
  const deleteAgentDraft = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsDeleteAgentDraftRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentDraftResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsAgentDraftResponse>(
        "DELETE",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/drafts`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsDeleteAgentDraftRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/deployments
  // Docs: https://elevenlabs.io/docs/api-reference/agents/deployments/create
  const createAgentDeployment = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsCreateAgentDeploymentRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentDeploymentResponse> => {
      return makeJsonRequest<ElevenLabsAgentDeploymentResponse>(
        "POST",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/deployments`,
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateAgentDeploymentRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches/create
  const createAgentBranch = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsCreateAgentBranchRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateAgentBranchResponse> => {
      return makeJsonRequest<ElevenLabsCreateAgentBranchResponse>(
        "POST",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches`,
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateAgentBranchRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{branchId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches/get
  const getAgentBranch = Object.assign(
    async (
      agentId: string,
      branchId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentBranchResponse> => {
      return makeJsonRequest<ElevenLabsAgentBranchResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches/${encodeURIComponent(branchId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{branchId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches/update
  const updateAgentBranch = Object.assign(
    async (
      agentId: string,
      branchId: string,
      req: ElevenLabsUpdateAgentBranchRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentBranchResponse> => {
      return makeJsonRequest<ElevenLabsAgentBranchResponse>(
        "PATCH",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches/${encodeURIComponent(branchId)}`,
        Object.keys(req).length > 0 ? req : undefined,
        signal
      );
    },
    { schema: ElevenLabsUpdateAgentBranchRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{branchId}/rebase
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches/rebase
  const rebaseAgentBranch = Object.assign(
    async (
      agentId: string,
      branchId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentBranchMutationResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsAgentBranchMutationResponse>(
        "POST",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches/${encodeURIComponent(branchId)}/rebase`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{branchId}/rebase-preview
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches/preview
  const previewAgentBranchRebase = Object.assign(
    async (
      agentId: string,
      branchId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentBranchPreviewResponse> => {
      return makeJsonRequest<ElevenLabsAgentBranchPreviewResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches/${encodeURIComponent(branchId)}/rebase-preview`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{sourceBranchId}/merge
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches/merge
  const mergeAgentBranch = Object.assign(
    async (
      agentId: string,
      sourceBranchId: string,
      req: ElevenLabsMergeAgentBranchRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentBranchMutationResponse> => {
      const { target_branch_id, ...body } = req;
      return makeJsonRequestAllowEmpty<ElevenLabsAgentBranchMutationResponse>(
        "POST",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches/${encodeURIComponent(sourceBranchId)}/merge`,
        Object.keys(body).length > 0 ? body : undefined,
        signal,
        buildQueryString({ target_branch_id })
      );
    },
    { schema: ElevenLabsMergeAgentBranchRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{sourceBranchId}/merge-preview
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches/preview
  const previewAgentBranchMerge = Object.assign(
    async (
      agentId: string,
      sourceBranchId: string,
      req: ElevenLabsPreviewAgentBranchMergeRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentBranchPreviewResponse> => {
      return makeJsonRequest<ElevenLabsAgentBranchPreviewResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches/${encodeURIComponent(sourceBranchId)}/merge-preview`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsPreviewAgentBranchMergeRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/analytics/live-count
  // Docs: https://elevenlabs.io/docs/api-reference/analytics/get
  const getLiveConversationCount = Object.assign(
    async (
      req: ElevenLabsGetLiveConversationCountRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsLiveConversationCountResponse> => {
      return makeJsonRequest<ElevenLabsLiveConversationCountResponse>(
        "GET",
        "/v1/convai/analytics/live-count",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetLiveConversationCountRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/users
  // Docs: https://elevenlabs.io/docs/api-reference/users/list
  const listConversationUsers = Object.assign(
    async (
      req: ElevenLabsListConversationUsersRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListConversationUsersResponse> => {
      return makeJsonRequest<ElevenLabsListConversationUsersResponse>(
        "GET",
        "/v1/convai/users",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListConversationUsersRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/llm-usage/calculate
  // Docs: https://elevenlabs.io/docs/api-reference/llm/calculate
  const calculateLlmUsage = Object.assign(
    async (
      req: ElevenLabsCalculateLlmUsageRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCalculateLlmUsageResponse> => {
      return makeJsonRequest<ElevenLabsCalculateLlmUsageResponse>(
        "POST",
        "/v1/convai/llm-usage/calculate",
        req,
        signal
      );
    },
    { schema: ElevenLabsCalculateLlmUsageRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/llm/list
  // Docs: https://elevenlabs.io/docs/api-reference/llm/list
  const listLlms = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsListLlmsResponse> => {
      return makeJsonRequest<ElevenLabsListLlmsResponse>(
        "GET",
        "/v1/convai/llm/list",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/agent-testing/create
  // Docs: https://elevenlabs.io/docs/api-reference/tests/create
  const createAgentTest = Object.assign(
    async (
      req: ElevenLabsCreateAgentTestRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateAgentTestResponse> => {
      return makeJsonRequest<ElevenLabsCreateAgentTestResponse>(
        "POST",
        "/v1/convai/agent-testing/create",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateAgentTestRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agent-testing
  // Docs: https://elevenlabs.io/docs/api-reference/tests/list
  const listAgentTests = Object.assign(
    async (
      req: ElevenLabsListAgentTestsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListAgentTestsResponse> => {
      return makeJsonRequest<ElevenLabsListAgentTestsResponse>(
        "GET",
        "/v1/convai/agent-testing",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListAgentTestsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agent-testing/{testId}
  // Docs: https://elevenlabs.io/docs/api-reference/tests/get
  const getAgentTest = Object.assign(
    async (
      testId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentTestResponse> => {
      return makeJsonRequest<ElevenLabsAgentTestResponse>(
        "GET",
        `/v1/convai/agent-testing/${encodeURIComponent(testId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PUT https://api.elevenlabs.io/v1/convai/agent-testing/{testId}
  // Docs: https://elevenlabs.io/docs/api-reference/tests/update
  const updateAgentTest = Object.assign(
    async (
      testId: string,
      req: ElevenLabsUpdateAgentTestRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateAgentTestResponse> => {
      return makeJsonRequest<ElevenLabsUpdateAgentTestResponse>(
        "PUT",
        `/v1/convai/agent-testing/${encodeURIComponent(testId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateAgentTestRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/agent-testing/{testId}
  // Docs: https://elevenlabs.io/docs/api-reference/tests/delete
  const deleteAgentTest = Object.assign(
    async (
      testId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteAgentTestResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteAgentTestResponse>(
        "DELETE",
        `/v1/convai/agent-testing/${encodeURIComponent(testId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/agent-testing/summaries
  // Docs: https://elevenlabs.io/docs/api-reference/tests/summaries
  const getAgentTestSummaries = Object.assign(
    async (
      req: ElevenLabsGetAgentTestSummariesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentTestSummariesResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentTestSummariesResponse>(
        "POST",
        "/v1/convai/agent-testing/summaries",
        req,
        signal
      );
    },
    { schema: ElevenLabsGetAgentTestSummariesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agent-testing/bulk-move
  // Docs: https://elevenlabs.io/docs/api-reference/tests/move
  const bulkMoveAgentTests = Object.assign(
    async (
      req: ElevenLabsBulkMoveAgentTestsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsBulkMoveAgentTestsResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsBulkMoveAgentTestsResponse>(
        "POST",
        "/v1/convai/agent-testing/bulk-move",
        req,
        signal
      );
    },
    { schema: ElevenLabsBulkMoveAgentTestsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agent-testing/folders
  // Docs: https://elevenlabs.io/docs/api-reference/tests/test-folders/create
  const createAgentTestFolder = Object.assign(
    async (
      req: ElevenLabsCreateAgentTestFolderRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateAgentTestFolderResponse> => {
      return makeJsonRequest<ElevenLabsCreateAgentTestFolderResponse>(
        "POST",
        "/v1/convai/agent-testing/folders",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateAgentTestFolderRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agent-testing/folders/{folderId}
  // Docs: https://elevenlabs.io/docs/api-reference/tests/test-folders/get
  const getAgentTestFolder = Object.assign(
    async (
      folderId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAgentTestFolderResponse> => {
      return makeJsonRequest<ElevenLabsAgentTestFolderResponse>(
        "GET",
        `/v1/convai/agent-testing/folders/${encodeURIComponent(folderId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/agent-testing/folders/{folderId}
  // Docs: https://elevenlabs.io/docs/api-reference/tests/test-folders/update
  const updateAgentTestFolder = Object.assign(
    async (
      folderId: string,
      req: ElevenLabsUpdateAgentTestFolderRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateAgentTestFolderResponse> => {
      return makeJsonRequest<ElevenLabsUpdateAgentTestFolderResponse>(
        "PATCH",
        `/v1/convai/agent-testing/folders/${encodeURIComponent(folderId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateAgentTestFolderRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/agent-testing/folders/{folderId}
  // Docs: https://elevenlabs.io/docs/api-reference/tests/test-folders/delete
  const deleteAgentTestFolder = Object.assign(
    async (
      folderId: string,
      req: ElevenLabsDeleteAgentTestFolderRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteAgentTestFolderResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteAgentTestFolderResponse>(
        "DELETE",
        `/v1/convai/agent-testing/folders/${encodeURIComponent(folderId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsDeleteAgentTestFolderRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/run-tests
  // Docs: https://elevenlabs.io/docs/api-reference/tests/run-tests
  const runAgentTests = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsRunAgentTestsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsRunAgentTestsResponse> => {
      return makeJsonRequest<ElevenLabsRunAgentTestsResponse>(
        "POST",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/run-tests`,
        req,
        signal
      );
    },
    { schema: ElevenLabsRunAgentTestsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/test-invocations
  // Docs: https://elevenlabs.io/docs/api-reference/tests/test-invocations/list
  const listTestInvocations = Object.assign(
    async (
      req: ElevenLabsListTestInvocationsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListTestInvocationsResponse> => {
      return makeJsonRequest<ElevenLabsListTestInvocationsResponse>(
        "GET",
        "/v1/convai/test-invocations",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListTestInvocationsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/test-invocations/{testInvocationId}
  // Docs: https://elevenlabs.io/docs/api-reference/tests/test-invocations/get
  const getTestInvocation = Object.assign(
    async (
      testInvocationId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetTestInvocationResponse> => {
      return makeJsonRequest<ElevenLabsGetTestInvocationResponse>(
        "GET",
        `/v1/convai/test-invocations/${encodeURIComponent(testInvocationId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/test-invocations/{testInvocationId}/resubmit
  // Docs: https://elevenlabs.io/docs/api-reference/tests/test-invocations/resubmit
  const resubmitTests = Object.assign(
    async (
      testInvocationId: string,
      req: ElevenLabsResubmitTestsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsResubmitTestsResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsResubmitTestsResponse>(
        "POST",
        `/v1/convai/test-invocations/${encodeURIComponent(testInvocationId)}/resubmit`,
        req,
        signal
      );
    },
    { schema: ElevenLabsResubmitTestsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/phone-numbers
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/create
  const createPhoneNumber = Object.assign(
    async (
      req: ElevenLabsCreatePhoneNumberRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreatePhoneNumberResponse> => {
      return makeJsonRequest<ElevenLabsCreatePhoneNumberResponse>(
        "POST",
        "/v1/convai/phone-numbers",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreatePhoneNumberRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/phone-numbers
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/list
  const listPhoneNumbers = Object.assign(
    async (
      req: ElevenLabsListPhoneNumbersRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListPhoneNumbersResponse> => {
      return makeJsonRequest<ElevenLabsListPhoneNumbersResponse>(
        "GET",
        "/v1/convai/phone-numbers",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListPhoneNumbersRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/get
  const getPhoneNumber = Object.assign(
    async (
      phoneNumberId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetPhoneNumberResponse> => {
      return makeJsonRequest<ElevenLabsGetPhoneNumberResponse>(
        "GET",
        `/v1/convai/phone-numbers/${encodeURIComponent(phoneNumberId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/update
  const updatePhoneNumber = Object.assign(
    async (
      phoneNumberId: string,
      req: ElevenLabsUpdatePhoneNumberRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdatePhoneNumberResponse> => {
      return makeJsonRequest<ElevenLabsUpdatePhoneNumberResponse>(
        "PATCH",
        `/v1/convai/phone-numbers/${encodeURIComponent(phoneNumberId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdatePhoneNumberRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/delete
  const deletePhoneNumber = Object.assign(
    async (
      phoneNumberId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeletePhoneNumberResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeletePhoneNumberResponse>(
        "DELETE",
        `/v1/convai/phone-numbers/${encodeURIComponent(phoneNumberId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}/sip-messages
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/get-sip-messages
  const getPhoneNumberSipMessages = Object.assign(
    async (
      phoneNumberId: string,
      req: ElevenLabsGetPhoneNumberSipMessagesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetPhoneNumberSipMessagesResponse> => {
      return makeJsonRequest<ElevenLabsGetPhoneNumberSipMessagesResponse>(
        "GET",
        `/v1/convai/phone-numbers/${encodeURIComponent(phoneNumberId)}/sip-messages`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetPhoneNumberSipMessagesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/twilio/register-call
  // Docs: https://elevenlabs.io/docs/api-reference/twilio/register-call
  const registerTwilioCall = Object.assign(
    async (
      req: ElevenLabsRegisterTwilioCallRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsRegisterTwilioCallResponse> => {
      return makeTextBodyRequest(
        "POST",
        "/v1/convai/twilio/register-call",
        req,
        signal
      );
    },
    { schema: ElevenLabsRegisterTwilioCallRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call
  // Docs: https://elevenlabs.io/docs/api-reference/twilio/outbound-call
  const twilioOutboundCall = Object.assign(
    async (
      req: ElevenLabsTwilioOutboundCallRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsTwilioOutboundCallResponse> => {
      return makeJsonRequest<ElevenLabsTwilioOutboundCallResponse>(
        "POST",
        "/v1/convai/twilio/outbound-call",
        req,
        signal
      );
    },
    { schema: ElevenLabsTwilioOutboundCallRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call
  // Docs: https://elevenlabs.io/docs/api-reference/sip-trunk/outbound-call
  const sipTrunkOutboundCall = Object.assign(
    async (
      req: ElevenLabsSipTrunkOutboundCallRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSipTrunkOutboundCallResponse> => {
      return makeJsonRequest<ElevenLabsSipTrunkOutboundCallResponse>(
        "POST",
        "/v1/convai/sip-trunk/outbound-call",
        req,
        signal
      );
    },
    { schema: ElevenLabsSipTrunkOutboundCallRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/exotel/outbound-call
  // Docs: https://elevenlabs.io/docs/api-reference/exotel/outbound-call
  const exotelOutboundCall = Object.assign(
    async (
      req: ElevenLabsExotelOutboundCallRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsExotelOutboundCallResponse> => {
      return makeJsonRequest<ElevenLabsExotelOutboundCallResponse>(
        "POST",
        "/v1/convai/exotel/outbound-call",
        req,
        signal
      );
    },
    { schema: ElevenLabsExotelOutboundCallRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/whatsapp/outbound-call
  // Docs: https://elevenlabs.io/docs/api-reference/whats-app/outbound-call
  const whatsAppOutboundCall = Object.assign(
    async (
      req: ElevenLabsWhatsAppOutboundCallRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsWhatsAppOutboundCallResponse> => {
      return makeJsonRequest<ElevenLabsWhatsAppOutboundCallResponse>(
        "POST",
        "/v1/convai/whatsapp/outbound-call",
        req,
        signal
      );
    },
    { schema: ElevenLabsWhatsAppOutboundCallRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/whatsapp/outbound-message
  // Docs: https://elevenlabs.io/docs/api-reference/whats-app/outbound-message
  const whatsAppOutboundMessage = Object.assign(
    async (
      req: ElevenLabsWhatsAppOutboundMessageRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsWhatsAppOutboundMessageResponse> => {
      return makeJsonRequest<ElevenLabsWhatsAppOutboundMessageResponse>(
        "POST",
        "/v1/convai/whatsapp/outbound-message",
        req,
        signal
      );
    },
    { schema: ElevenLabsWhatsAppOutboundMessageRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/whatsapp-accounts
  // Docs: https://elevenlabs.io/docs/api-reference/whats-app/accounts/list
  const listWhatsAppAccounts = Object.assign(
    async (
      req: ElevenLabsListWhatsAppAccountsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListWhatsAppAccountsResponse> => {
      return makeJsonRequest<ElevenLabsListWhatsAppAccountsResponse>(
        "GET",
        "/v1/convai/whatsapp-accounts",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListWhatsAppAccountsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/whatsapp-accounts/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/whats-app/accounts/get
  const getWhatsAppAccount = Object.assign(
    async (
      phoneNumberId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetWhatsAppAccountResponse> => {
      return makeJsonRequest<ElevenLabsGetWhatsAppAccountResponse>(
        "GET",
        `/v1/convai/whatsapp-accounts/${encodeURIComponent(phoneNumberId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/whatsapp-accounts/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/whats-app/accounts/update
  const updateWhatsAppAccount = Object.assign(
    async (
      phoneNumberId: string,
      req: ElevenLabsUpdateWhatsAppAccountRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateWhatsAppAccountResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsUpdateWhatsAppAccountResponse>(
        "PATCH",
        `/v1/convai/whatsapp-accounts/${encodeURIComponent(phoneNumberId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateWhatsAppAccountRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/whatsapp-accounts/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/whats-app/accounts/delete
  const deleteWhatsAppAccount = Object.assign(
    async (
      phoneNumberId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteWhatsAppAccountResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteWhatsAppAccountResponse>(
        "DELETE",
        `/v1/convai/whatsapp-accounts/${encodeURIComponent(phoneNumberId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const convaiAgentBranches = Object.assign(listAgentBranches, {
    create: createAgentBranch,
    get: getAgentBranch,
    update: updateAgentBranch,
    rebase: rebaseAgentBranch,
    rebasePreview: previewAgentBranchRebase,
    merge: mergeAgentBranch,
    mergePreview: previewAgentBranchMerge,
  });

  const convaiAgents = {
    create: createAgent,
    list: listAgents,
    get: getAgent,
    update: updateAgent,
    delete: deleteAgent,
    widget: getAgentWidget,
    link: getAgentLink,
    branches: convaiAgentBranches,
    summaries: getAgentSummaries,
    duplicate: duplicateAgent,
    avatar: postAgentAvatar,
    versions: { get: getAgentVersion },
    simulateConversation,
    topics: getAgentTopics,
    drafts: {
      create: createAgentDraft,
      delete: deleteAgentDraft,
    },
    deployments: createAgentDeployment,
    runTests: runAgentTests,
  };

  const convaiAgentTestFolders = {
    create: createAgentTestFolder,
    get: getAgentTestFolder,
    update: updateAgentTestFolder,
    delete: deleteAgentTestFolder,
  };
  const convaiAgentTesting = {
    create: createAgentTest,
    list: listAgentTests,
    get: getAgentTest,
    update: updateAgentTest,
    delete: deleteAgentTest,
    summaries: getAgentTestSummaries,
    bulkMove: bulkMoveAgentTests,
    folders: convaiAgentTestFolders,
  };
  const convaiTestInvocations = {
    list: listTestInvocations,
    get: getTestInvocation,
    resubmit: resubmitTests,
  };

  // GET https://api.elevenlabs.io/v1/convai/tags
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/tags/list
  const listConversationTags = Object.assign(
    async (
      req: ElevenLabsListConversationTagsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListConversationTagsResponse> => {
      return makeJsonRequest<ElevenLabsListConversationTagsResponse>(
        "GET",
        "/v1/convai/tags",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListConversationTagsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/tags
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/tags/create
  const createConversationTag = Object.assign(
    async (
      req: ElevenLabsCreateConversationTagRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateConversationTagResponse> => {
      return makeJsonRequest<ElevenLabsCreateConversationTagResponse>(
        "POST",
        "/v1/convai/tags",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateConversationTagRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/tags/{tagId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/tags/get
  const getConversationTag = Object.assign(
    async (
      tagId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetConversationTagResponse> => {
      return makeJsonRequest<ElevenLabsGetConversationTagResponse>(
        "GET",
        `/v1/convai/tags/${encodeURIComponent(tagId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/tags/{tagId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/tags/update
  const updateConversationTag = Object.assign(
    async (
      tagId: string,
      req: ElevenLabsUpdateConversationTagRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateConversationTagResponse> => {
      return makeJsonRequest<ElevenLabsUpdateConversationTagResponse>(
        "PATCH",
        `/v1/convai/tags/${encodeURIComponent(tagId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateConversationTagRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/tags/{tagId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/tags/delete
  const deleteConversationTag = Object.assign(
    async (
      tagId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteConversationTagResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteConversationTagResponse>(
        "DELETE",
        `/v1/convai/tags/${encodeURIComponent(tagId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/settings
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/get
  const getConvaiSettings = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsConvaiSettingsResponse> => {
      return makeJsonRequest<ElevenLabsConvaiSettingsResponse>(
        "GET",
        "/v1/convai/settings",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/settings
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/update
  const updateConvaiSettings = Object.assign(
    async (
      req: ElevenLabsUpdateConvaiSettingsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsConvaiSettingsResponse> => {
      return makeJsonRequest<ElevenLabsConvaiSettingsResponse>(
        "PATCH",
        "/v1/convai/settings",
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateConvaiSettingsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/settings/dashboard
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/dashboard/get
  const getConvaiDashboardSettings = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsConvaiDashboardSettingsResponse> => {
      return makeJsonRequest<ElevenLabsConvaiDashboardSettingsResponse>(
        "GET",
        "/v1/convai/settings/dashboard",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/settings/dashboard
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/dashboard/update
  const updateConvaiDashboardSettings = Object.assign(
    async (
      req: ElevenLabsUpdateConvaiDashboardSettingsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsConvaiDashboardSettingsResponse> => {
      return makeJsonRequest<ElevenLabsConvaiDashboardSettingsResponse>(
        "PATCH",
        "/v1/convai/settings/dashboard",
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateConvaiDashboardSettingsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/secrets
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/secrets/create
  const createWorkspaceSecret = Object.assign(
    async (
      req: ElevenLabsCreateWorkspaceSecretRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateWorkspaceSecretResponse> => {
      return makeJsonRequest<ElevenLabsCreateWorkspaceSecretResponse>(
        "POST",
        "/v1/convai/secrets",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateWorkspaceSecretRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/secrets
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/secrets/list
  const listWorkspaceSecrets = Object.assign(
    async (
      req: ElevenLabsListWorkspaceSecretsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListWorkspaceSecretsResponse> => {
      return makeJsonRequest<ElevenLabsListWorkspaceSecretsResponse>(
        "GET",
        "/v1/convai/secrets",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListWorkspaceSecretsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/secrets/{secretId}
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/secrets/get
  const getWorkspaceSecret = Object.assign(
    async (
      secretId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetWorkspaceSecretResponse> => {
      return makeJsonRequest<ElevenLabsGetWorkspaceSecretResponse>(
        "GET",
        `/v1/convai/secrets/${encodeURIComponent(secretId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/secrets/{secretId}
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/secrets/update
  const updateWorkspaceSecret = Object.assign(
    async (
      secretId: string,
      req: ElevenLabsUpdateWorkspaceSecretRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateWorkspaceSecretResponse> => {
      return makeJsonRequest<ElevenLabsUpdateWorkspaceSecretResponse>(
        "PATCH",
        `/v1/convai/secrets/${encodeURIComponent(secretId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateWorkspaceSecretRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/secrets/{secretId}
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/secrets/delete
  const deleteWorkspaceSecret = Object.assign(
    async (
      secretId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteWorkspaceSecretResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteWorkspaceSecretResponse>(
        "DELETE",
        `/v1/convai/secrets/${encodeURIComponent(secretId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/secrets/{secretId}/dependencies/{resourceType}
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/secrets/get-dependencies
  const getSecretDependencies = Object.assign(
    async (
      secretId: string,
      resourceType: ElevenLabsSecretDependencyResourceType,
      req: ElevenLabsGetSecretDependenciesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetSecretDependenciesResponse> => {
      return makeJsonRequest<ElevenLabsGetSecretDependenciesResponse>(
        "GET",
        `/v1/convai/secrets/${encodeURIComponent(secretId)}/dependencies/${encodeURIComponent(resourceType)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetSecretDependenciesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/environment-variables
  // Docs: https://elevenlabs.io/docs/api-reference/environment-variables/list
  const listEnvironmentVariables = Object.assign(
    async (
      req: ElevenLabsListEnvironmentVariablesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListEnvironmentVariablesResponse> => {
      return makeJsonRequest<ElevenLabsListEnvironmentVariablesResponse>(
        "GET",
        "/v1/convai/environment-variables",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListEnvironmentVariablesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/environment-variables
  // Docs: https://elevenlabs.io/docs/api-reference/environment-variables/create
  const createEnvironmentVariable = Object.assign(
    async (
      req: ElevenLabsCreateEnvironmentVariableRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateEnvironmentVariableResponse> => {
      return makeJsonRequest<ElevenLabsCreateEnvironmentVariableResponse>(
        "POST",
        "/v1/convai/environment-variables",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateEnvironmentVariableRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/environment-variables/{envVarId}
  // Docs: https://elevenlabs.io/docs/api-reference/environment-variables/get
  const getEnvironmentVariable = Object.assign(
    async (
      envVarId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetEnvironmentVariableResponse> => {
      return makeJsonRequest<ElevenLabsGetEnvironmentVariableResponse>(
        "GET",
        `/v1/convai/environment-variables/${encodeURIComponent(envVarId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/environment-variables/{envVarId}
  // Docs: https://elevenlabs.io/docs/api-reference/environment-variables/update
  const updateEnvironmentVariable = Object.assign(
    async (
      envVarId: string,
      req: ElevenLabsUpdateEnvironmentVariableRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateEnvironmentVariableResponse> => {
      return makeJsonRequest<ElevenLabsUpdateEnvironmentVariableResponse>(
        "PATCH",
        `/v1/convai/environment-variables/${encodeURIComponent(envVarId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateEnvironmentVariableRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/tools
  // Docs: https://elevenlabs.io/docs/api-reference/tools/create
  const createTool = Object.assign(
    async (
      req: ElevenLabsCreateToolRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateToolResponse> => {
      return makeJsonRequest<ElevenLabsCreateToolResponse>(
        "POST",
        "/v1/convai/tools",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateToolRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/tools
  // Docs: https://elevenlabs.io/docs/api-reference/tools/list
  const listTools = Object.assign(
    async (
      req: ElevenLabsListToolsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListToolsResponse> => {
      return makeJsonRequest<ElevenLabsListToolsResponse>(
        "GET",
        "/v1/convai/tools",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListToolsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/tools/{toolId}
  // Docs: https://elevenlabs.io/docs/api-reference/tools/get
  const getTool = Object.assign(
    async (
      toolId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsToolResponse> => {
      return makeJsonRequest<ElevenLabsToolResponse>(
        "GET",
        `/v1/convai/tools/${encodeURIComponent(toolId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/tools/{toolId}
  // Docs: https://elevenlabs.io/docs/api-reference/tools/update
  const updateTool = Object.assign(
    async (
      toolId: string,
      req: ElevenLabsUpdateToolRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsToolResponse> => {
      return makeJsonRequest<ElevenLabsToolResponse>(
        "PATCH",
        `/v1/convai/tools/${encodeURIComponent(toolId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateToolRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/tools/{toolId}
  // Docs: https://elevenlabs.io/docs/api-reference/tools/delete
  const deleteTool = Object.assign(
    async (
      toolId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteToolResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteToolResponse>(
        "DELETE",
        `/v1/convai/tools/${encodeURIComponent(toolId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/tools/{toolId}/dependent-agents
  // Docs: https://elevenlabs.io/docs/api-reference/tools/get-dependent-agents
  const getToolDependentAgents = Object.assign(
    async (
      toolId: string,
      req: ElevenLabsGetToolDependentAgentsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetToolDependentAgentsResponse> => {
      return makeJsonRequest<ElevenLabsGetToolDependentAgentsResponse>(
        "GET",
        `/v1/convai/tools/${encodeURIComponent(toolId)}/dependent-agents`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetToolDependentAgentsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/tools/{toolId}/executions
  // Docs: https://elevenlabs.io/docs/api-reference/tools/get-executions
  const getToolExecutions = Object.assign(
    async (
      toolId: string,
      req: ElevenLabsGetToolExecutionsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetToolExecutionsResponse> => {
      return makeJsonRequest<ElevenLabsGetToolExecutionsResponse>(
        "GET",
        `/v1/convai/tools/${encodeURIComponent(toolId)}/executions`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetToolExecutionsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/mcp-servers
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/create
  const createMcpServer = Object.assign(
    async (
      req: ElevenLabsCreateMcpServerRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpServerResponse> => {
      return makeJsonRequest<ElevenLabsMcpServerResponse>(
        "POST",
        "/v1/convai/mcp-servers",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateMcpServerRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/mcp-servers
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/list
  const listMcpServers = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsListMcpServersResponse> => {
      return makeJsonRequest<ElevenLabsListMcpServersResponse>(
        "GET",
        "/v1/convai/mcp-servers",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/get
  const getMcpServer = Object.assign(
    async (
      mcpServerId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpServerResponse> => {
      return makeJsonRequest<ElevenLabsMcpServerResponse>(
        "GET",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/update
  const updateMcpServer = Object.assign(
    async (
      mcpServerId: string,
      req: ElevenLabsUpdateMcpServerRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpServerResponse> => {
      return makeJsonRequest<ElevenLabsMcpServerResponse>(
        "PATCH",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateMcpServerRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/delete
  const deleteMcpServer = Object.assign(
    async (
      mcpServerId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteMcpServerResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteMcpServerResponse>(
        "DELETE",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tools
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/list-tools
  const listMcpServerTools = Object.assign(
    async (
      mcpServerId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsListMcpServerToolsResponse> => {
      return makeJsonRequest<ElevenLabsListMcpServerToolsResponse>(
        "GET",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}/tools`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-approvals
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/approval-policies/create
  const createMcpServerToolApproval = Object.assign(
    async (
      mcpServerId: string,
      req: ElevenLabsCreateMcpServerToolApprovalRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpServerResponse> => {
      return makeJsonRequest<ElevenLabsMcpServerResponse>(
        "POST",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}/tool-approvals`,
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateMcpServerToolApprovalRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-approvals/{toolName}
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/approval-policies/delete
  const deleteMcpServerToolApproval = Object.assign(
    async (
      mcpServerId: string,
      toolName: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpServerResponse> => {
      return makeJsonRequest<ElevenLabsMcpServerResponse>(
        "DELETE",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}/tool-approvals/${encodeURIComponent(toolName)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-configs
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/tool-configuration/create
  const createMcpToolConfigOverride = Object.assign(
    async (
      mcpServerId: string,
      req: ElevenLabsCreateMcpToolConfigOverrideRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpServerResponse> => {
      return makeJsonRequest<ElevenLabsMcpServerResponse>(
        "POST",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}/tool-configs`,
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateMcpToolConfigOverrideRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-configs/{toolName}
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/tool-configuration/get
  const getMcpToolConfigOverride = Object.assign(
    async (
      mcpServerId: string,
      toolName: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpToolConfigOverride> => {
      return makeJsonRequest<ElevenLabsMcpToolConfigOverride>(
        "GET",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}/tool-configs/${encodeURIComponent(toolName)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-configs/{toolName}
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/tool-configuration/update
  const updateMcpToolConfigOverride = Object.assign(
    async (
      mcpServerId: string,
      toolName: string,
      req: ElevenLabsUpdateMcpToolConfigOverrideRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpServerResponse> => {
      return makeJsonRequest<ElevenLabsMcpServerResponse>(
        "PATCH",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}/tool-configs/${encodeURIComponent(toolName)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateMcpToolConfigOverrideRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-configs/{toolName}
  // Docs: https://elevenlabs.io/docs/api-reference/mcp/tool-configuration/delete
  const deleteMcpToolConfigOverride = Object.assign(
    async (
      mcpServerId: string,
      toolName: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsMcpServerResponse> => {
      return makeJsonRequest<ElevenLabsMcpServerResponse>(
        "DELETE",
        `/v1/convai/mcp-servers/${encodeURIComponent(mcpServerId)}/tool-configs/${encodeURIComponent(toolName)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/list
  const listConversations = Object.assign(
    async (
      req: ElevenLabsListConversationsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListConversationsResponse> => {
      return makeJsonRequest<ElevenLabsListConversationsResponse>(
        "GET",
        "/v1/convai/conversations",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListConversationsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/get
  const getConversation = Object.assign(
    async (
      conversationId: string,
      req: ElevenLabsGetConversationRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetConversationResponse> => {
      return makeJsonRequest<ElevenLabsGetConversationResponse>(
        "GET",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetConversationRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/conversations/{conversationId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/delete
  const deleteConversation = Object.assign(
    async (
      conversationId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteConversationResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteConversationResponse>(
        "DELETE",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/get-audio
  const getConversationAudio = Object.assign(
    async (
      conversationId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/audio`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/get-signed-url
  const getSignedUrl = Object.assign(
    async (
      req: ElevenLabsGetSignedUrlRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetSignedUrlResponse> => {
      return makeJsonRequest<ElevenLabsGetSignedUrlResponse>(
        "GET",
        "/v1/convai/conversation/get-signed-url",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetSignedUrlRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversation/token
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/get-webrtc-token
  const getConversationToken = Object.assign(
    async (
      req: ElevenLabsGetConversationTokenRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetConversationTokenResponse> => {
      return makeJsonRequest<ElevenLabsGetConversationTokenResponse>(
        "GET",
        "/v1/convai/conversation/token",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetConversationTokenRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations/messages/smart-search
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/messages/search
  const smartSearchConversationMessages = Object.assign(
    async (
      req: ElevenLabsSmartSearchConversationMessagesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSmartSearchConversationMessagesResponse> => {
      return makeJsonRequest<ElevenLabsSmartSearchConversationMessagesResponse>(
        "GET",
        "/v1/convai/conversations/messages/smart-search",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsSmartSearchConversationMessagesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations/messages/text-search
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/messages/text-search
  const textSearchConversationMessages = Object.assign(
    async (
      req: ElevenLabsTextSearchConversationMessagesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsTextSearchConversationMessagesResponse> => {
      return makeJsonRequest<ElevenLabsTextSearchConversationMessagesResponse>(
        "GET",
        "/v1/convai/conversations/messages/text-search",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsTextSearchConversationMessagesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/feedback
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/create
  const sendConversationFeedback = Object.assign(
    async (
      conversationId: string,
      req: ElevenLabsConversationFeedbackRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsConversationFeedbackResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsConversationFeedbackResponse>(
        "POST",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/feedback`,
        req,
        signal
      );
    },
    { schema: ElevenLabsConversationFeedbackRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/files
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/upload-file
  const uploadConversationFile = Object.assign(
    async (
      conversationId: string,
      req: ElevenLabsUploadConversationFileRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUploadConversationFileResponse> => {
      const form = new FormData();
      appendFormField(form, "file", req.file);
      return makeMultipartJsonRequest<ElevenLabsUploadConversationFileResponse>(
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/files`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsUploadConversationFileRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/files/{fileId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/delete-file
  const deleteConversationFile = Object.assign(
    async (
      conversationId: string,
      fileId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteConversationFileResponse> => {
      return makeJsonRequest<ElevenLabsDeleteConversationFileResponse>(
        "DELETE",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/files/${encodeURIComponent(fileId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/sip-messages
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/get-sip-messages
  const getConversationSipMessages = Object.assign(
    async (
      conversationId: string,
      req: ElevenLabsGetConversationSipMessagesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetConversationSipMessagesResponse> => {
      return makeJsonRequest<ElevenLabsGetConversationSipMessagesResponse>(
        "GET",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/sip-messages`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetConversationSipMessagesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/tags
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/tags/assign
  const assignConversationTags = Object.assign(
    async (
      conversationId: string,
      req: ElevenLabsAssignConversationTagsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAssignConversationTagsResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsAssignConversationTagsResponse>(
        "POST",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/tags`,
        req,
        signal
      );
    },
    { schema: ElevenLabsAssignConversationTagsRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/tags/{tagId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/tags/unassign
  const unassignConversationTag = Object.assign(
    async (
      conversationId: string,
      tagId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsUnassignConversationTagResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsUnassignConversationTagResponse>(
        "DELETE",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/tags/${encodeURIComponent(tagId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/analysis/run
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/analysis/run-analysis
  const runConversationAnalysis = Object.assign(
    async (
      conversationId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsRunConversationAnalysisResponse> => {
      return makeJsonRequest<ElevenLabsRunConversationAnalysisResponse>(
        "POST",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/analysis/run`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/analysis/evaluations/run
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/analysis/run-evaluation
  const runConversationEvaluations = Object.assign(
    async (
      conversationId: string,
      req: ElevenLabsRunConversationEvaluationsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsRunConversationEvaluationsResponse> => {
      return makeJsonRequest<ElevenLabsRunConversationEvaluationsResponse>(
        "POST",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/analysis/evaluations/run`,
        req,
        signal
      );
    },
    { schema: ElevenLabsRunConversationEvaluationsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/batch-calling/submit
  // Docs: https://elevenlabs.io/docs/api-reference/batch-calling/create
  const submitBatchCall = Object.assign(
    async (
      req: ElevenLabsSubmitBatchCallRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsBatchCallResponse> => {
      return makeJsonRequest<ElevenLabsBatchCallResponse>(
        "POST",
        "/v1/convai/batch-calling/submit",
        req,
        signal
      );
    },
    { schema: ElevenLabsSubmitBatchCallRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/batch-calling/workspace
  // Docs: https://elevenlabs.io/docs/api-reference/batch-calling/list
  const listWorkspaceBatchCalls = Object.assign(
    async (
      req: ElevenLabsListWorkspaceBatchCallsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsWorkspaceBatchCallsResponse> => {
      return makeJsonRequest<ElevenLabsWorkspaceBatchCallsResponse>(
        "GET",
        "/v1/convai/batch-calling/workspace",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListWorkspaceBatchCallsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/batch-calling/{batchId}
  // Docs: https://elevenlabs.io/docs/api-reference/batch-calling/get
  const getBatchCall = Object.assign(
    async (
      batchId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsBatchCallDetailedResponse> => {
      return makeJsonRequest<ElevenLabsBatchCallDetailedResponse>(
        "GET",
        `/v1/convai/batch-calling/${encodeURIComponent(batchId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/batch-calling/{batchId}
  // Docs: https://elevenlabs.io/docs/api-reference/batch-calling/delete
  const deleteBatchCall = Object.assign(
    async (
      batchId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteBatchCallResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteBatchCallResponse>(
        "DELETE",
        `/v1/convai/batch-calling/${encodeURIComponent(batchId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/batch-calling/{batchId}/cancel
  // Docs: https://elevenlabs.io/docs/api-reference/batch-calling/cancel
  const cancelBatchCall = Object.assign(
    async (
      batchId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsBatchCallResponse> => {
      return makeJsonRequest<ElevenLabsBatchCallResponse>(
        "POST",
        `/v1/convai/batch-calling/${encodeURIComponent(batchId)}/cancel`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/batch-calling/{batchId}/retry
  // Docs: https://elevenlabs.io/docs/api-reference/batch-calling/retry
  const retryBatchCall = Object.assign(
    async (
      batchId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsBatchCallResponse> => {
      return makeJsonRequest<ElevenLabsBatchCallResponse>(
        "POST",
        `/v1/convai/batch-calling/${encodeURIComponent(batchId)}/retry`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const convaiDashboardSettings = Object.assign(getConvaiDashboardSettings, {
    update: updateConvaiDashboardSettings,
  });
  const convaiSettings = Object.assign(getConvaiSettings, {
    update: updateConvaiSettings,
    dashboard: convaiDashboardSettings,
  });
  const convaiSecrets = {
    create: createWorkspaceSecret,
    list: listWorkspaceSecrets,
    get: getWorkspaceSecret,
    update: updateWorkspaceSecret,
    delete: deleteWorkspaceSecret,
    dependencies: getSecretDependencies,
  };
  const convaiEnvironmentVariables = {
    create: createEnvironmentVariable,
    list: listEnvironmentVariables,
    get: getEnvironmentVariable,
    update: updateEnvironmentVariable,
  };
  const convaiTools = {
    create: createTool,
    list: listTools,
    get: getTool,
    update: updateTool,
    delete: deleteTool,
    dependentAgents: getToolDependentAgents,
    executions: getToolExecutions,
  };
  const convaiTags = {
    create: createConversationTag,
    list: listConversationTags,
    get: getConversationTag,
    update: updateConversationTag,
    delete: deleteConversationTag,
  };
  const convaiMcpServerToolApprovals = {
    create: createMcpServerToolApproval,
    delete: deleteMcpServerToolApproval,
  };
  const convaiMcpServerToolConfigs = {
    create: createMcpToolConfigOverride,
    get: getMcpToolConfigOverride,
    update: updateMcpToolConfigOverride,
    delete: deleteMcpToolConfigOverride,
  };
  const convaiMcpServers = {
    create: createMcpServer,
    list: listMcpServers,
    get: getMcpServer,
    update: updateMcpServer,
    delete: deleteMcpServer,
    tools: listMcpServerTools,
    toolApprovals: convaiMcpServerToolApprovals,
    toolConfigs: convaiMcpServerToolConfigs,
  };
  const convaiBatchCalling = {
    submit: submitBatchCall,
    workspace: listWorkspaceBatchCalls,
    get: getBatchCall,
    delete: deleteBatchCall,
    cancel: cancelBatchCall,
    retry: retryBatchCall,
  };
  const convaiUsers = {
    list: listConversationUsers,
  };
  const convaiLlmUsage = {
    calculate: calculateLlmUsage,
  };
  const convaiLlm = {
    list: listLlms,
  };

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/url
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-url
  const createKnowledgeBaseDocumentFromUrl = Object.assign(
    async (
      req: ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse> => {
      return makeJsonRequest<ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse>(
        "POST",
        "/v1/convai/knowledge-base/url",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/text
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-text
  const createKnowledgeBaseDocumentFromText = Object.assign(
    async (
      req: ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse> => {
      return makeJsonRequest<ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse>(
        "POST",
        "/v1/convai/knowledge-base/text",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/file
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-file
  const createKnowledgeBaseDocumentFromFile = Object.assign(
    async (
      req: ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }
      return makeMultipartJsonRequest<ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse>(
        "/v1/convai/knowledge-base/file",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/list
  const listKnowledgeBaseDocuments = Object.assign(
    async (
      req: ElevenLabsListKnowledgeBaseDocumentsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListKnowledgeBaseDocumentsResponse> => {
      return makeJsonRequest<ElevenLabsListKnowledgeBaseDocumentsResponse>(
        "GET",
        "/v1/convai/knowledge-base",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListKnowledgeBaseDocumentsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-document
  const getKnowledgeBaseDocument = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsGetKnowledgeBaseDocumentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseDocumentResponse> => {
      return makeJsonRequest<ElevenLabsGetKnowledgeBaseDocumentResponse>(
        "GET",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetKnowledgeBaseDocumentRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/delete
  const deleteKnowledgeBaseDocument = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsDeleteKnowledgeBaseDocumentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteKnowledgeBaseDocumentResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteKnowledgeBaseDocumentResponse>(
        "DELETE",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsDeleteKnowledgeBaseDocumentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/summaries
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-summaries
  const getKnowledgeBaseSummaries = Object.assign(
    async (
      req: ElevenLabsGetKnowledgeBaseSummariesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseSummariesResponse> => {
      return makeJsonRequest<ElevenLabsGetKnowledgeBaseSummariesResponse>(
        "GET",
        "/v1/convai/knowledge-base/summaries",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetKnowledgeBaseSummariesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/search
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/search
  const searchKnowledgeBaseContent = Object.assign(
    async (
      req: ElevenLabsSearchKnowledgeBaseContentRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSearchKnowledgeBaseContentResponse> => {
      return makeJsonRequest<ElevenLabsSearchKnowledgeBaseContentResponse>(
        "GET",
        "/v1/convai/knowledge-base/search",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsSearchKnowledgeBaseContentRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/update
  const updateKnowledgeBaseDocument = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsUpdateKnowledgeBaseDocumentRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateKnowledgeBaseDocumentResponse> => {
      return makeJsonRequest<ElevenLabsUpdateKnowledgeBaseDocumentResponse>(
        "PATCH",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateKnowledgeBaseDocumentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/content
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-content
  const getKnowledgeBaseDocumentContent = Object.assign(
    async (
      documentationId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseDocumentContentResponse> => {
      return makeTextRequest(
        "GET",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/content`,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/chunks
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-chunks
  const listKnowledgeBaseDocumentChunks = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsListKnowledgeBaseDocumentChunksRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsListKnowledgeBaseDocumentChunksResponse> => {
      return makeJsonRequest<ElevenLabsListKnowledgeBaseDocumentChunksResponse>(
        "GET",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/chunks`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListKnowledgeBaseDocumentChunksRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/chunk/{chunkId}
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-chunk
  const getKnowledgeBaseDocumentChunk = Object.assign(
    async (
      documentationId: string,
      chunkId: string,
      req: ElevenLabsGetKnowledgeBaseDocumentChunkRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseDocumentChunkResponse> => {
      return makeJsonRequest<ElevenLabsGetKnowledgeBaseDocumentChunkResponse>(
        "GET",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/chunk/${encodeURIComponent(chunkId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetKnowledgeBaseDocumentChunkRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/dependent-agents
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-agents
  const getKnowledgeBaseDependentAgents = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsGetKnowledgeBaseDependentAgentsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseDependentAgentsResponse> => {
      return makeJsonRequest<ElevenLabsGetKnowledgeBaseDependentAgentsResponse>(
        "GET",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/dependent-agents`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetKnowledgeBaseDependentAgentsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/source-file-url
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-source-file-url
  const getKnowledgeBaseSourceFileUrl = Object.assign(
    async (
      documentationId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseSourceFileUrlResponse> => {
      return makeJsonRequest<ElevenLabsGetKnowledgeBaseSourceFileUrlResponse>(
        "GET",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/source-file-url`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/refresh
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/refresh
  const refreshKnowledgeBaseDocument = Object.assign(
    async (
      documentationId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsRefreshKnowledgeBaseDocumentResponse> => {
      return makeJsonRequest<ElevenLabsRefreshKnowledgeBaseDocumentResponse>(
        "POST",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/refresh`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/update-file
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/update-file
  const updateKnowledgeBaseFileDocument = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsUpdateKnowledgeBaseFileDocumentRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateKnowledgeBaseFileDocumentResponse> => {
      const form = new FormData();
      appendFormField(form, "file", req.file);
      return makeMultipartJsonRequestWithMethod<ElevenLabsUpdateKnowledgeBaseFileDocumentResponse>(
        "PATCH",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/update-file`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsUpdateKnowledgeBaseFileDocumentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/rag-index
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/rag-index-overview
  const getKnowledgeBaseRagIndexOverview = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseRagIndexOverviewResponse> => {
      return makeJsonRequest<ElevenLabsGetKnowledgeBaseRagIndexOverviewResponse>(
        "GET",
        "/v1/convai/knowledge-base/rag-index",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/rag-index
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/compute-rag-index-batch
  const computeKnowledgeBaseRagIndexes = Object.assign(
    async (
      req: ElevenLabsComputeKnowledgeBaseRagIndexesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsComputeKnowledgeBaseRagIndexesResponse> => {
      return makeJsonRequest<ElevenLabsComputeKnowledgeBaseRagIndexesResponse>(
        "POST",
        "/v1/convai/knowledge-base/rag-index",
        req,
        signal
      );
    },
    { schema: ElevenLabsComputeKnowledgeBaseRagIndexesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/rag-index
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-rag-index
  const getKnowledgeBaseDocumentRagIndexes = Object.assign(
    async (
      documentationId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseDocumentRagIndexesResponse> => {
      return makeJsonRequest<ElevenLabsGetKnowledgeBaseDocumentRagIndexesResponse>(
        "GET",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/rag-index`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/rag-index
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/compute-rag-index
  const computeKnowledgeBaseDocumentRagIndex = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsComputeKnowledgeBaseDocumentRagIndexResponse> => {
      return makeJsonRequest<ElevenLabsComputeKnowledgeBaseDocumentRagIndexResponse>(
        "POST",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/rag-index`,
        req,
        signal
      );
    },
    { schema: ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/rag-index/{ragIndexId}
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/delete-rag-index
  const deleteKnowledgeBaseDocumentRagIndex = Object.assign(
    async (
      documentationId: string,
      ragIndexId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteKnowledgeBaseDocumentRagIndexResponse> => {
      return makeJsonRequest<ElevenLabsDeleteKnowledgeBaseDocumentRagIndexResponse>(
        "DELETE",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}/rag-index/${encodeURIComponent(ragIndexId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/folder
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/create-folder
  const createKnowledgeBaseFolder = Object.assign(
    async (
      req: ElevenLabsCreateKnowledgeBaseFolderRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateKnowledgeBaseFolderResponse> => {
      return makeJsonRequest<ElevenLabsCreateKnowledgeBaseFolderResponse>(
        "POST",
        "/v1/convai/knowledge-base/folder",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateKnowledgeBaseFolderRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/bulk-move
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/bulk-move
  const bulkMoveKnowledgeBaseDocuments = Object.assign(
    async (
      req: ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsBulkMoveKnowledgeBaseDocumentsResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsBulkMoveKnowledgeBaseDocumentsResponse>(
        "POST",
        "/v1/convai/knowledge-base/bulk-move",
        req,
        signal
      );
    },
    { schema: ElevenLabsBulkMoveKnowledgeBaseDocumentsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/{documentId}/move
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/move-document
  const moveKnowledgeBaseEntity = Object.assign(
    async (
      documentId: string,
      req: ElevenLabsMoveKnowledgeBaseEntityRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsMoveKnowledgeBaseEntityResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsMoveKnowledgeBaseEntityResponse>(
        "POST",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentId)}/move`,
        req,
        signal
      );
    },
    { schema: ElevenLabsMoveKnowledgeBaseEntityRequestSchema }
  );

  const convaiKnowledgeBaseChunks = Object.assign(
    listKnowledgeBaseDocumentChunks,
    {
      get: getKnowledgeBaseDocumentChunk,
    }
  );

  const convaiKnowledgeBaseRagIndex = Object.assign(
    getKnowledgeBaseRagIndexOverview,
    {
      batch: computeKnowledgeBaseRagIndexes,
      get: getKnowledgeBaseDocumentRagIndexes,
      compute: computeKnowledgeBaseDocumentRagIndex,
      delete: deleteKnowledgeBaseDocumentRagIndex,
    }
  );

  const convaiKnowledgeBase = {
    url: createKnowledgeBaseDocumentFromUrl,
    text: createKnowledgeBaseDocumentFromText,
    file: createKnowledgeBaseDocumentFromFile,
    folder: createKnowledgeBaseFolder,
    list: listKnowledgeBaseDocuments,
    get: getKnowledgeBaseDocument,
    update: updateKnowledgeBaseDocument,
    delete: deleteKnowledgeBaseDocument,
    summaries: getKnowledgeBaseSummaries,
    search: searchKnowledgeBaseContent,
    content: getKnowledgeBaseDocumentContent,
    chunks: convaiKnowledgeBaseChunks,
    dependentAgents: getKnowledgeBaseDependentAgents,
    sourceFileUrl: getKnowledgeBaseSourceFileUrl,
    refresh: refreshKnowledgeBaseDocument,
    updateFile: updateKnowledgeBaseFileDocument,
    ragIndex: convaiKnowledgeBaseRagIndex,
    bulkMove: bulkMoveKnowledgeBaseDocuments,
    move: moveKnowledgeBaseEntity,
  };
  const convaiConversationMessages = {
    smartSearch: smartSearchConversationMessages,
    textSearch: textSearchConversationMessages,
  };
  const convaiConversationFiles = Object.assign(uploadConversationFile, {
    delete: deleteConversationFile,
  });
  const convaiConversationTags = Object.assign(assignConversationTags, {
    unassign: unassignConversationTag,
  });
  const convaiConversationAnalysis = Object.assign(runConversationAnalysis, {
    evaluations: runConversationEvaluations,
  });
  const convaiConversations = {
    list: listConversations,
    get: getConversation,
    delete: deleteConversation,
    audio: getConversationAudio,
    messages: convaiConversationMessages,
    feedback: sendConversationFeedback,
    files: convaiConversationFiles,
    sipMessages: getConversationSipMessages,
    tags: convaiConversationTags,
    analysis: convaiConversationAnalysis,
  };
  const convaiConversation = {
    getSignedUrl,
    token: getConversationToken,
  };
  const convaiPhoneNumbers = {
    create: createPhoneNumber,
    list: listPhoneNumbers,
    get: getPhoneNumber,
    update: updatePhoneNumber,
    delete: deletePhoneNumber,
    sipMessages: getPhoneNumberSipMessages,
  };
  const convaiTwilio = {
    outboundCall: twilioOutboundCall,
    registerCall: registerTwilioCall,
  };
  const convaiSipTrunk = { outboundCall: sipTrunkOutboundCall };
  const convaiExotel = { outboundCall: exotelOutboundCall };
  const convaiWhatsApp = {
    outboundCall: whatsAppOutboundCall,
    outboundMessage: whatsAppOutboundMessage,
  };
  const convaiWhatsAppAccounts = {
    list: listWhatsAppAccounts,
    get: getWhatsAppAccount,
    update: updateWhatsAppAccount,
    delete: deleteWhatsAppAccount,
  };
  const convai = {
    agents: convaiAgents,
    agent: {
      knowledgeBase: { size: getAgentKnowledgeBaseSize },
      llmUsage: { calculate: calculateAgentLlmUsage },
    },
    analytics: { liveCount: getLiveConversationCount },
    users: convaiUsers,
    llmUsage: convaiLlmUsage,
    llm: convaiLlm,
    agentTesting: convaiAgentTesting,
    testInvocations: convaiTestInvocations,
    tags: convaiTags,
    settings: convaiSettings,
    secrets: convaiSecrets,
    environmentVariables: convaiEnvironmentVariables,
    tools: convaiTools,
    mcpServers: convaiMcpServers,
    knowledgeBase: convaiKnowledgeBase,
    conversations: convaiConversations,
    conversation: convaiConversation,
    batchCalling: convaiBatchCalling,
    phoneNumbers: convaiPhoneNumbers,
    twilio: convaiTwilio,
    sipTrunk: convaiSipTrunk,
    exotel: convaiExotel,
    whatsapp: convaiWhatsApp,
    whatsappAccounts: convaiWhatsAppAccounts,
  };

  return {
    v1: { convai },
    get: {
      v1: {
        convai: {
          agents: {
            list: listAgents,
            get: getAgent,
            widget: getAgentWidget,
            link: getAgentLink,
            summaries: getAgentSummaries,
            versions: { get: getAgentVersion },
            topics: getAgentTopics,
            branches: convaiAgentBranches,
          },
          agent: {
            knowledgeBase: { size: getAgentKnowledgeBaseSize },
          },
          analytics: {
            liveCount: getLiveConversationCount,
          },
          users: {
            list: listConversationUsers,
          },
          llm: {
            list: listLlms,
          },
          agentTesting: {
            list: listAgentTests,
            get: getAgentTest,
            folders: {
              get: getAgentTestFolder,
            },
          },
          testInvocations: {
            list: listTestInvocations,
            get: getTestInvocation,
          },
          tags: {
            list: listConversationTags,
            get: getConversationTag,
          },
          settings: convaiSettings,
          secrets: {
            list: listWorkspaceSecrets,
            get: getWorkspaceSecret,
            dependencies: getSecretDependencies,
          },
          environmentVariables: {
            list: listEnvironmentVariables,
            get: getEnvironmentVariable,
          },
          tools: {
            list: listTools,
            get: getTool,
            dependentAgents: getToolDependentAgents,
            executions: getToolExecutions,
          },
          mcpServers: {
            list: listMcpServers,
            get: getMcpServer,
            tools: listMcpServerTools,
            toolConfigs: {
              get: getMcpToolConfigOverride,
            },
          },
          batchCalling: {
            workspace: listWorkspaceBatchCalls,
            get: getBatchCall,
          },
          knowledgeBase: {
            list: listKnowledgeBaseDocuments,
            get: getKnowledgeBaseDocument,
            summaries: getKnowledgeBaseSummaries,
            search: searchKnowledgeBaseContent,
            content: getKnowledgeBaseDocumentContent,
            chunks: convaiKnowledgeBaseChunks,
            dependentAgents: getKnowledgeBaseDependentAgents,
            sourceFileUrl: getKnowledgeBaseSourceFileUrl,
            ragIndex: {
              overview: getKnowledgeBaseRagIndexOverview,
              get: getKnowledgeBaseDocumentRagIndexes,
            },
          },
          conversations: {
            list: listConversations,
            get: getConversation,
            audio: getConversationAudio,
            messages: convaiConversationMessages,
            sipMessages: getConversationSipMessages,
          },
          conversation: {
            getSignedUrl,
            token: getConversationToken,
          },
          phoneNumbers: {
            list: listPhoneNumbers,
            get: getPhoneNumber,
            sipMessages: getPhoneNumberSipMessages,
          },
          whatsappAccounts: {
            list: listWhatsAppAccounts,
            get: getWhatsAppAccount,
          },
        },
      },
    },
    post: {
      v1: {
        convai: {
          agents: {
            create: createAgent,
            duplicate: duplicateAgent,
            avatar: postAgentAvatar,
            simulateConversation,
            drafts: { create: createAgentDraft },
            deployments: createAgentDeployment,
            runTests: runAgentTests,
            branches: {
              create: createAgentBranch,
              rebase: rebaseAgentBranch,
              merge: mergeAgentBranch,
            },
          },
          agent: {
            llmUsage: { calculate: calculateAgentLlmUsage },
          },
          llmUsage: {
            calculate: calculateLlmUsage,
          },
          agentTesting: {
            create: createAgentTest,
            summaries: getAgentTestSummaries,
            bulkMove: bulkMoveAgentTests,
            folders: {
              create: createAgentTestFolder,
            },
          },
          testInvocations: {
            resubmit: resubmitTests,
          },
          tags: { create: createConversationTag },
          secrets: { create: createWorkspaceSecret },
          environmentVariables: { create: createEnvironmentVariable },
          tools: { create: createTool },
          mcpServers: {
            create: createMcpServer,
            toolApprovals: { create: createMcpServerToolApproval },
            toolConfigs: { create: createMcpToolConfigOverride },
          },
          batchCalling: {
            submit: submitBatchCall,
            cancel: cancelBatchCall,
            retry: retryBatchCall,
          },
          knowledgeBase: {
            url: createKnowledgeBaseDocumentFromUrl,
            text: createKnowledgeBaseDocumentFromText,
            file: createKnowledgeBaseDocumentFromFile,
            folder: createKnowledgeBaseFolder,
            refresh: refreshKnowledgeBaseDocument,
            ragIndex: {
              batch: computeKnowledgeBaseRagIndexes,
              compute: computeKnowledgeBaseDocumentRagIndex,
            },
            bulkMove: bulkMoveKnowledgeBaseDocuments,
            move: moveKnowledgeBaseEntity,
          },
          conversations: {
            feedback: sendConversationFeedback,
            files: uploadConversationFile,
            tags: assignConversationTags,
            analysis: convaiConversationAnalysis,
          },
          phoneNumbers: { create: createPhoneNumber },
          twilio: convaiTwilio,
          sipTrunk: convaiSipTrunk,
          exotel: convaiExotel,
          whatsapp: convaiWhatsApp,
        },
      },
    },
    patch: {
      v1: {
        convai: {
          agents: {
            update: updateAgent,
            branches: { update: updateAgentBranch },
          },
          agentTesting: {
            folders: { update: updateAgentTestFolder },
          },
          tags: { update: updateConversationTag },
          settings: {
            update: updateConvaiSettings,
            dashboard: { update: updateConvaiDashboardSettings },
          },
          secrets: { update: updateWorkspaceSecret },
          environmentVariables: { update: updateEnvironmentVariable },
          tools: { update: updateTool },
          mcpServers: {
            update: updateMcpServer,
            toolConfigs: { update: updateMcpToolConfigOverride },
          },
          knowledgeBase: {
            update: updateKnowledgeBaseDocument,
            updateFile: updateKnowledgeBaseFileDocument,
          },
          phoneNumbers: { update: updatePhoneNumber },
          whatsappAccounts: { update: updateWhatsAppAccount },
        },
      },
    },
    put: {
      v1: {
        convai: {
          agentTesting: {
            update: updateAgentTest,
          },
        },
      },
    },
    delete: {
      v1: {
        convai: {
          agents: {
            delete: deleteAgent,
            drafts: { delete: deleteAgentDraft },
          },
          agentTesting: {
            delete: deleteAgentTest,
            folders: { delete: deleteAgentTestFolder },
          },
          tags: { delete: deleteConversationTag },
          secrets: { delete: deleteWorkspaceSecret },
          tools: { delete: deleteTool },
          mcpServers: {
            delete: deleteMcpServer,
            toolApprovals: { delete: deleteMcpServerToolApproval },
            toolConfigs: { delete: deleteMcpToolConfigOverride },
          },
          batchCalling: { delete: deleteBatchCall },
          knowledgeBase: {
            delete: deleteKnowledgeBaseDocument,
            ragIndex: { delete: deleteKnowledgeBaseDocumentRagIndex },
          },
          conversations: {
            delete: deleteConversation,
            files: { delete: deleteConversationFile },
            tags: { unassign: unassignConversationTag },
          },
          phoneNumbers: { delete: deletePhoneNumber },
          whatsappAccounts: { delete: deleteWhatsAppAccount },
        },
      },
    },
  };
}
