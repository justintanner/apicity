import {
  ElevenLabsCreatePvcVoiceResponse,
  ElevenLabsDeleteVoiceSampleResponse,
  ElevenLabsDocsRedirectResponse,
  ElevenLabsGetPvcVoiceCaptchaResponse,
  ElevenLabsGetVoiceRequest,
  ElevenLabsListModelsResponse,
  ElevenLabsListVoicesRequest,
  ElevenLabsListVoicesResponse,
  ElevenLabsOptions,
  ElevenLabsCreatePvcVoiceRequest,
  ElevenLabsEditPvcVoiceRequest,
  ElevenLabsEditPvcVoiceResponse,
  ElevenLabsAddPvcSamplesRequest,
  ElevenLabsAddPvcSamplesResponse,
  ElevenLabsGetPvcSampleAudioRequest,
  ElevenLabsVoiceSamplePreviewResponse,
  ElevenLabsSpeakerSeparation,
  ElevenLabsPvcTrainRequest,
  ElevenLabsPvcTrainResponse,
  ElevenLabsPvcVoiceCaptchaRequest,
  ElevenLabsPvcVoiceCaptchaResponse,
  ElevenLabsPvcManualVerificationRequest,
  ElevenLabsPvcManualVerificationResponse,
  ElevenLabsPvcVoiceSampleWaveformResponse,
  ElevenLabsSpeakerAudioResponse,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsAudioIsolationRequest,
  ElevenLabsAudioIsolationStreamRequest,
  ElevenLabsAudioIsolationHistoryListRequest,
  ElevenLabsAudioIsolationHistoryListResponse,
  ElevenLabsAudioIsolationDeleteHistoryResponse,
  ElevenLabsAudioNativeCreateProjectRequest,
  ElevenLabsAudioNativeCreateProjectResponse,
  ElevenLabsAudioNativeUpdateContentFromUrlRequest,
  ElevenLabsAudioNativeUpdateProjectContentRequest,
  ElevenLabsAudioNativeEditContentResponse,
  ElevenLabsAudioNativeProjectSettingsResponse,
  ElevenLabsForcedAlignmentRequest,
  ElevenLabsForcedAlignmentResponse,
  ElevenLabsComposeMusicRequest,
  ElevenLabsComposeMusicDetailedRequest,
  ElevenLabsComposeMusicStreamRequest,
  ElevenLabsMusicPlanRequest,
  ElevenLabsMusicPlanResponse,
  ElevenLabsMusicStemSeparationRequest,
  ElevenLabsMusicUploadRequest,
  ElevenLabsMusicUploadResponse,
  ElevenLabsVideoToMusicRequest,
  ElevenLabsListSpeechEnginesRequest,
  ElevenLabsListSpeechEnginesResponse,
  ElevenLabsCreateSpeechEngineRequest,
  ElevenLabsSpeechEngineResponse,
  ElevenLabsUpdateSpeechEngineRequest,
  ElevenLabsDeleteSpeechEngineResponse,
  ElevenLabsListOrdersRequest,
  ElevenLabsListOrdersResponse,
  ElevenLabsCreateOrderRequest,
  ElevenLabsCreateOrderResponse,
  ElevenLabsOrderResponse,
  ElevenLabsUpdateOrderRequest,
  ElevenLabsUpdateOrderResponse,
  ElevenLabsSubmitOrderResponse,
  ElevenLabsOrderDeliverablesResponse,
  ElevenLabsUpsertOrderItemRequest,
  ElevenLabsUpsertOrderItemResponse,
  ElevenLabsRemoveOrderItemResponse,
  ElevenLabsRegisterOrderMediaRequest,
  ElevenLabsRegisterOrderMediaResponse,
  ElevenLabsOrderMediaResponse,
  ElevenLabsOrderItemKind,
  ElevenLabsOrderLanguagesResponse,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsAudioWithTimestampsResponse,
  ElevenLabsStreamingAudioChunkWithTimestampsResponse,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsSpeechToTextResponse,
  ElevenLabsGetTranscriptResponse,
  ElevenLabsDeleteTranscriptResponse,
  ElevenLabsSpeechToSpeechRequest,
  ElevenLabsStartSpeakerSeparationResponse,
  ElevenLabsUpdatePvcVoiceSampleRequest,
  ElevenLabsUpdatePvcVoiceSampleResponse,
  ElevenLabsUserResponse,
  ElevenLabsUserSubscriptionResponse,
  ElevenLabsSingleUseTokenType,
  ElevenLabsSingleUseTokenResponse,
  ElevenLabsUsageCharacterStatsRequest,
  ElevenLabsUsageCharacterStatsResponse,
  ElevenLabsVoice,
  ElevenLabsVoiceSettings,
  ElevenLabsWorkspaceAnalyticsQueryResponse,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsRequestsResponse,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
  ElevenLabsListWorkspaceAuditLogsRequest,
  ElevenLabsWorkspaceAuditLogsPageResponse,
  ElevenLabsWorkspaceGroupsResponse,
  ElevenLabsSearchWorkspaceGroupsRequest,
  ElevenLabsSearchWorkspaceGroupsResponse,
  ElevenLabsAddWorkspaceGroupMemberRequest,
  ElevenLabsAddWorkspaceGroupMemberResponse,
  ElevenLabsRemoveWorkspaceGroupMemberRequest,
  ElevenLabsRemoveWorkspaceGroupMemberResponse,
  ElevenLabsUpdateWorkspaceMemberRequest,
  ElevenLabsUpdateWorkspaceMemberResponse,
  ElevenLabsAddWorkspaceInviteRequest,
  ElevenLabsAddWorkspaceInviteResponse,
  ElevenLabsAddWorkspaceInvitesBulkRequest,
  ElevenLabsDeleteWorkspaceInviteRequest,
  ElevenLabsDeleteWorkspaceInviteResponse,
  ElevenLabsGetWorkspaceResourceRequest,
  ElevenLabsWorkspaceResourceMetadataResponse,
  ElevenLabsShareWorkspaceResourceRequest,
  ElevenLabsShareWorkspaceResourceResponse,
  ElevenLabsUnshareWorkspaceResourceRequest,
  ElevenLabsUnshareWorkspaceResourceResponse,
  ElevenLabsListWorkspaceWebhooksRequest,
  ElevenLabsListWorkspaceWebhooksResponse,
  ElevenLabsCreateWorkspaceWebhookRequest,
  ElevenLabsCreateWorkspaceWebhookResponse,
  ElevenLabsUpdateWorkspaceWebhookRequest,
  ElevenLabsUpdateWorkspaceWebhookResponse,
  ElevenLabsDeleteWorkspaceWebhookResponse,
  ElevenLabsListWorkspaceAuthConnectionsResponse,
  ElevenLabsCreateWorkspaceAuthConnectionRequest,
  ElevenLabsCreateWorkspaceAuthConnectionResponse,
  ElevenLabsUpdateWorkspaceAuthConnectionRequest,
  ElevenLabsUpdateWorkspaceAuthConnectionResponse,
  ElevenLabsDeleteWorkspaceAuthConnectionResponse,
  ElevenLabsDisableWorkspaceApiKeyRequest,
  ElevenLabsDisableWorkspaceApiKeyResponse,
  ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequest,
  ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingResponse,
  ElevenLabsCreateServiceAccountApiKeyRequest,
  ElevenLabsCreateServiceAccountApiKeyResponse,
  ElevenLabsDeleteServiceAccountApiKeyResponse,
  ElevenLabsServiceAccountApiKeysResponse,
  ElevenLabsServiceAccountsResponse,
  ElevenLabsUpdateServiceAccountApiKeyRequest,
  ElevenLabsUpdateServiceAccountApiKeyResponse,
  ElevenLabsCreateAgentRequest,
  ElevenLabsCreateAgentResponse,
  ElevenLabsGetAgentRequest,
  ElevenLabsGetAgentResponse,
  ElevenLabsListAgentsRequest,
  ElevenLabsListAgentsResponse,
  ElevenLabsUpdateAgentRequest,
  ElevenLabsDeleteAgentResponse,
  ElevenLabsGetAgentWidgetRequest,
  ElevenLabsGetAgentWidgetResponse,
  ElevenLabsGetAgentLinkResponse,
  ElevenLabsListAgentBranchesRequest,
  ElevenLabsListAgentBranchesResponse,
  ElevenLabsGetAgentSummariesRequest,
  ElevenLabsGetAgentSummariesResponse,
  ElevenLabsDuplicateAgentRequest,
  ElevenLabsDuplicateAgentResponse,
  ElevenLabsPostAgentAvatarRequest,
  ElevenLabsPostAgentAvatarResponse,
  ElevenLabsAgentVersionMetadata,
  ElevenLabsSimulateConversationRequest,
  ElevenLabsSimulatedConversationResponse,
  ElevenLabsGetAgentTopicsRequest,
  ElevenLabsGetAgentTopicsResponse,
  ElevenLabsAgentKnowledgeBaseSizeResponse,
  ElevenLabsCalculateAgentLlmUsageRequest,
  ElevenLabsCalculateAgentLlmUsageResponse,
  ElevenLabsCreateAgentDraftRequest,
  ElevenLabsDeleteAgentDraftRequest,
  ElevenLabsAgentDraftResponse,
  ElevenLabsCreateAgentDeploymentRequest,
  ElevenLabsAgentDeploymentResponse,
  ElevenLabsCreateAgentBranchRequest,
  ElevenLabsCreateAgentBranchResponse,
  ElevenLabsAgentBranchResponse,
  ElevenLabsUpdateAgentBranchRequest,
  ElevenLabsAgentBranchMutationResponse,
  ElevenLabsAgentBranchPreviewResponse,
  ElevenLabsMergeAgentBranchRequest,
  ElevenLabsPreviewAgentBranchMergeRequest,
  ElevenLabsGetLiveConversationCountRequest,
  ElevenLabsLiveConversationCountResponse,
  ElevenLabsListConversationUsersRequest,
  ElevenLabsListConversationUsersResponse,
  ElevenLabsCalculateLlmUsageRequest,
  ElevenLabsCalculateLlmUsageResponse,
  ElevenLabsListLlmsResponse,
  ElevenLabsListConversationTagsRequest,
  ElevenLabsListConversationTagsResponse,
  ElevenLabsCreateConversationTagRequest,
  ElevenLabsCreateConversationTagResponse,
  ElevenLabsGetConversationTagResponse,
  ElevenLabsUpdateConversationTagRequest,
  ElevenLabsUpdateConversationTagResponse,
  ElevenLabsDeleteConversationTagResponse,
  ElevenLabsUpdateConvaiSettingsRequest,
  ElevenLabsConvaiSettingsResponse,
  ElevenLabsUpdateConvaiDashboardSettingsRequest,
  ElevenLabsConvaiDashboardSettingsResponse,
  ElevenLabsCreateWorkspaceSecretRequest,
  ElevenLabsCreateWorkspaceSecretResponse,
  ElevenLabsListWorkspaceSecretsRequest,
  ElevenLabsListWorkspaceSecretsResponse,
  ElevenLabsGetWorkspaceSecretResponse,
  ElevenLabsUpdateWorkspaceSecretRequest,
  ElevenLabsUpdateWorkspaceSecretResponse,
  ElevenLabsDeleteWorkspaceSecretResponse,
  ElevenLabsSecretDependencyResourceType,
  ElevenLabsGetSecretDependenciesRequest,
  ElevenLabsGetSecretDependenciesResponse,
  ElevenLabsListEnvironmentVariablesRequest,
  ElevenLabsListEnvironmentVariablesResponse,
  ElevenLabsCreateEnvironmentVariableRequest,
  ElevenLabsCreateEnvironmentVariableResponse,
  ElevenLabsGetEnvironmentVariableResponse,
  ElevenLabsUpdateEnvironmentVariableRequest,
  ElevenLabsUpdateEnvironmentVariableResponse,
  ElevenLabsCreateToolRequest,
  ElevenLabsCreateToolResponse,
  ElevenLabsListToolsRequest,
  ElevenLabsListToolsResponse,
  ElevenLabsToolResponse,
  ElevenLabsUpdateToolRequest,
  ElevenLabsDeleteToolResponse,
  ElevenLabsGetToolDependentAgentsRequest,
  ElevenLabsGetToolDependentAgentsResponse,
  ElevenLabsGetToolExecutionsRequest,
  ElevenLabsGetToolExecutionsResponse,
  ElevenLabsCreateMcpServerRequest,
  ElevenLabsMcpServerResponse,
  ElevenLabsListMcpServersResponse,
  ElevenLabsUpdateMcpServerRequest,
  ElevenLabsDeleteMcpServerResponse,
  ElevenLabsListMcpServerToolsResponse,
  ElevenLabsCreateMcpServerToolApprovalRequest,
  ElevenLabsCreateMcpToolConfigOverrideRequest,
  ElevenLabsMcpToolConfigOverride,
  ElevenLabsUpdateMcpToolConfigOverrideRequest,
  ElevenLabsCreateAgentTestRequest,
  ElevenLabsCreateAgentTestResponse,
  ElevenLabsListAgentTestsRequest,
  ElevenLabsListAgentTestsResponse,
  ElevenLabsAgentTestResponse,
  ElevenLabsUpdateAgentTestRequest,
  ElevenLabsUpdateAgentTestResponse,
  ElevenLabsDeleteAgentTestResponse,
  ElevenLabsGetAgentTestSummariesRequest,
  ElevenLabsGetAgentTestSummariesResponse,
  ElevenLabsBulkMoveAgentTestsRequest,
  ElevenLabsBulkMoveAgentTestsResponse,
  ElevenLabsCreateAgentTestFolderRequest,
  ElevenLabsCreateAgentTestFolderResponse,
  ElevenLabsAgentTestFolderResponse,
  ElevenLabsUpdateAgentTestFolderRequest,
  ElevenLabsUpdateAgentTestFolderResponse,
  ElevenLabsDeleteAgentTestFolderRequest,
  ElevenLabsDeleteAgentTestFolderResponse,
  ElevenLabsRunAgentTestsRequest,
  ElevenLabsRunAgentTestsResponse,
  ElevenLabsListTestInvocationsRequest,
  ElevenLabsListTestInvocationsResponse,
  ElevenLabsGetTestInvocationResponse,
  ElevenLabsResubmitTestsRequest,
  ElevenLabsResubmitTestsResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse,
  ElevenLabsListKnowledgeBaseDocumentsRequest,
  ElevenLabsListKnowledgeBaseDocumentsResponse,
  ElevenLabsGetKnowledgeBaseDocumentRequest,
  ElevenLabsGetKnowledgeBaseDocumentResponse,
  ElevenLabsDeleteKnowledgeBaseDocumentRequest,
  ElevenLabsDeleteKnowledgeBaseDocumentResponse,
  ElevenLabsGetKnowledgeBaseSummariesRequest,
  ElevenLabsGetKnowledgeBaseSummariesResponse,
  ElevenLabsSearchKnowledgeBaseContentRequest,
  ElevenLabsSearchKnowledgeBaseContentResponse,
  ElevenLabsUpdateKnowledgeBaseDocumentRequest,
  ElevenLabsUpdateKnowledgeBaseDocumentResponse,
  ElevenLabsGetKnowledgeBaseDocumentContentResponse,
  ElevenLabsListKnowledgeBaseDocumentChunksRequest,
  ElevenLabsListKnowledgeBaseDocumentChunksResponse,
  ElevenLabsGetKnowledgeBaseDocumentChunkRequest,
  ElevenLabsGetKnowledgeBaseDocumentChunkResponse,
  ElevenLabsGetKnowledgeBaseDependentAgentsRequest,
  ElevenLabsGetKnowledgeBaseDependentAgentsResponse,
  ElevenLabsGetKnowledgeBaseSourceFileUrlResponse,
  ElevenLabsRefreshKnowledgeBaseDocumentResponse,
  ElevenLabsUpdateKnowledgeBaseFileDocumentRequest,
  ElevenLabsUpdateKnowledgeBaseFileDocumentResponse,
  ElevenLabsComputeKnowledgeBaseRagIndexesRequest,
  ElevenLabsComputeKnowledgeBaseRagIndexesResponse,
  ElevenLabsGetKnowledgeBaseRagIndexOverviewResponse,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexResponse,
  ElevenLabsGetKnowledgeBaseDocumentRagIndexesResponse,
  ElevenLabsDeleteKnowledgeBaseDocumentRagIndexResponse,
  ElevenLabsCreateKnowledgeBaseFolderRequest,
  ElevenLabsCreateKnowledgeBaseFolderResponse,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsResponse,
  ElevenLabsMoveKnowledgeBaseEntityRequest,
  ElevenLabsMoveKnowledgeBaseEntityResponse,
  ElevenLabsListConversationsRequest,
  ElevenLabsListConversationsResponse,
  ElevenLabsGetConversationRequest,
  ElevenLabsGetConversationResponse,
  ElevenLabsDeleteConversationResponse,
  ElevenLabsGetSignedUrlRequest,
  ElevenLabsGetSignedUrlResponse,
  ElevenLabsGetConversationTokenRequest,
  ElevenLabsGetConversationTokenResponse,
  ElevenLabsSmartSearchConversationMessagesRequest,
  ElevenLabsSmartSearchConversationMessagesResponse,
  ElevenLabsTextSearchConversationMessagesRequest,
  ElevenLabsTextSearchConversationMessagesResponse,
  ElevenLabsConversationFeedbackRequest,
  ElevenLabsConversationFeedbackResponse,
  ElevenLabsUploadConversationFileRequest,
  ElevenLabsUploadConversationFileResponse,
  ElevenLabsDeleteConversationFileResponse,
  ElevenLabsGetConversationSipMessagesRequest,
  ElevenLabsGetConversationSipMessagesResponse,
  ElevenLabsAssignConversationTagsRequest,
  ElevenLabsAssignConversationTagsResponse,
  ElevenLabsUnassignConversationTagResponse,
  ElevenLabsRunConversationAnalysisResponse,
  ElevenLabsRunConversationEvaluationsRequest,
  ElevenLabsRunConversationEvaluationsResponse,
  ElevenLabsSubmitBatchCallRequest,
  ElevenLabsBatchCallResponse,
  ElevenLabsListWorkspaceBatchCallsRequest,
  ElevenLabsWorkspaceBatchCallsResponse,
  ElevenLabsBatchCallDetailedResponse,
  ElevenLabsDeleteBatchCallResponse,
  ElevenLabsCreatePhoneNumberRequest,
  ElevenLabsCreatePhoneNumberResponse,
  ElevenLabsListPhoneNumbersRequest,
  ElevenLabsListPhoneNumbersResponse,
  ElevenLabsGetPhoneNumberResponse,
  ElevenLabsUpdatePhoneNumberRequest,
  ElevenLabsUpdatePhoneNumberResponse,
  ElevenLabsDeletePhoneNumberResponse,
  ElevenLabsGetPhoneNumberSipMessagesRequest,
  ElevenLabsGetPhoneNumberSipMessagesResponse,
  ElevenLabsRegisterTwilioCallRequest,
  ElevenLabsRegisterTwilioCallResponse,
  ElevenLabsTwilioOutboundCallRequest,
  ElevenLabsTwilioOutboundCallResponse,
  ElevenLabsSipTrunkOutboundCallRequest,
  ElevenLabsSipTrunkOutboundCallResponse,
  ElevenLabsExotelOutboundCallRequest,
  ElevenLabsExotelOutboundCallResponse,
  ElevenLabsWhatsAppOutboundCallRequest,
  ElevenLabsWhatsAppOutboundCallResponse,
  ElevenLabsWhatsAppOutboundMessageRequest,
  ElevenLabsWhatsAppOutboundMessageResponse,
  ElevenLabsListWhatsAppAccountsRequest,
  ElevenLabsListWhatsAppAccountsResponse,
  ElevenLabsGetWhatsAppAccountResponse,
  ElevenLabsUpdateWhatsAppAccountRequest,
  ElevenLabsUpdateWhatsAppAccountResponse,
  ElevenLabsDeleteWhatsAppAccountResponse,
  ElevenLabsCreateVoiceFromPreviewRequest,
  ElevenLabsVoiceDesignRequest,
  ElevenLabsVoicePreviewsResponse,
  ElevenLabsVoiceRemixRequest,
  ElevenLabsListV1VoicesRequest,
  ElevenLabsListV1VoicesResponse,
  ElevenLabsDeleteVoiceResponse,
  ElevenLabsAddVoiceRequest,
  ElevenLabsAddVoiceResponse,
  ElevenLabsEditVoiceRequest,
  ElevenLabsEditVoiceResponse,
  ElevenLabsEditVoiceSettingsRequest,
  ElevenLabsEditVoiceSettingsResponse,
  ElevenLabsAddSharedVoiceRequest,
  ElevenLabsAddSharedVoiceResponse,
  ElevenLabsSharedVoicesRequest,
  ElevenLabsSimilarVoicesRequest,
  ElevenLabsLibraryVoicesResponse,
  ElevenLabsHistoryListRequest,
  ElevenLabsHistoryListResponse,
  ElevenLabsHistoryItem,
  ElevenLabsHistoryDeleteResponse,
  ElevenLabsHistoryDownloadRequest,
  ElevenLabsListDubbingRequest,
  ElevenLabsListDubbingResponse,
  ElevenLabsCreateDubbingRequest,
  ElevenLabsCreateDubbingResponse,
  ElevenLabsDubbingMetadata,
  ElevenLabsDeleteDubbingResponse,
  ElevenLabsDubbingResourceResponse,
  ElevenLabsDubbingTranscriptsResponse,
  ElevenLabsStudioCreatePodcastRequest,
  ElevenLabsStudioCreatePodcastResponse,
  ElevenLabsStudioListProjectsResponse,
  ElevenLabsStudioCreateProjectRequest,
  ElevenLabsStudioAddProjectResponse,
  ElevenLabsStudioGetProjectRequest,
  ElevenLabsStudioProjectExtended,
  ElevenLabsStudioUpdateProjectRequest,
  ElevenLabsStudioEditProjectResponse,
  ElevenLabsStudioDeleteProjectResponse,
  ElevenLabsStudioConvertProjectResponse,
  ElevenLabsStudioUpdateProjectContentRequest,
  ElevenLabsStudioMutedTracksResponse,
  ElevenLabsStudioCreatePronunciationDictionariesRequest,
  ElevenLabsStudioCreatePronunciationDictionariesResponse,
  ElevenLabsStudioListProjectSnapshotsResponse,
  ElevenLabsStudioProjectSnapshotExtended,
  ElevenLabsStudioStreamAudioRequest,
  ElevenLabsStudioListChaptersResponse,
  ElevenLabsStudioCreateChapterRequest,
  ElevenLabsStudioAddChapterResponse,
  ElevenLabsStudioChapterWithContent,
  ElevenLabsStudioUpdateChapterRequest,
  ElevenLabsStudioEditChapterResponse,
  ElevenLabsStudioDeleteChapterResponse,
  ElevenLabsStudioConvertChapterResponse,
  ElevenLabsStudioListChapterSnapshotsResponse,
  ElevenLabsStudioChapterSnapshotExtended,
  ElevenLabsProvider,
  ElevenLabsError,
  ElevenLabsListPronunciationDictionariesRequest,
  ElevenLabsListPronunciationDictionariesResponse,
  ElevenLabsAddPronunciationDictionaryFromFileRequest,
  ElevenLabsAddPronunciationDictionaryResponse,
  ElevenLabsAddPronunciationDictionaryFromRulesRequest,
  ElevenLabsGetPronunciationDictionaryRequest,
  ElevenLabsGetPronunciationDictionaryResponse,
  ElevenLabsUpdatePronunciationDictionaryRequest,
  ElevenLabsPronunciationDictionaryMetadata,
  ElevenLabsAddPronunciationDictionaryRulesRequest,
  ElevenLabsPronunciationDictionaryRulesResponse,
  ElevenLabsRemovePronunciationDictionaryRulesRequest,
  ElevenLabsSetPronunciationDictionaryRulesRequest,
  ElevenLabsDownloadPronunciationDictionaryRequest,
} from "./types";
import {
  ElevenLabsCreatePvcVoiceRequestSchema,
  ElevenLabsEditPvcVoiceRequestSchema,
  ElevenLabsAddPvcSamplesRequestSchema,
  ElevenLabsGetPvcSampleAudioRequestSchema,
  ElevenLabsGetVoiceRequestSchema,
  ElevenLabsListVoicesRequestSchema,
  ElevenLabsPvcTrainRequestSchema,
  ElevenLabsPvcVoiceCaptchaRequestSchema,
  ElevenLabsPvcManualVerificationRequestSchema,
  ElevenLabsSoundGenerationRequestSchema,
  ElevenLabsAudioIsolationRequestSchema,
  ElevenLabsAudioIsolationStreamRequestSchema,
  ElevenLabsAudioIsolationHistoryListRequestSchema,
  ElevenLabsAudioNativeCreateProjectRequestSchema,
  ElevenLabsAudioNativeUpdateContentFromUrlRequestSchema,
  ElevenLabsAudioNativeUpdateProjectContentRequestSchema,
  ElevenLabsForcedAlignmentRequestSchema,
  ElevenLabsComposeMusicRequestSchema,
  ElevenLabsComposeMusicDetailedRequestSchema,
  ElevenLabsComposeMusicStreamRequestSchema,
  ElevenLabsMusicPlanRequestSchema,
  ElevenLabsMusicStemSeparationRequestSchema,
  ElevenLabsMusicUploadRequestSchema,
  ElevenLabsVideoToMusicRequestSchema,
  ElevenLabsListSpeechEnginesRequestSchema,
  ElevenLabsCreateSpeechEngineRequestSchema,
  ElevenLabsUpdateSpeechEngineRequestSchema,
  ElevenLabsListOrdersRequestSchema,
  ElevenLabsCreateOrderRequestSchema,
  ElevenLabsUpdateOrderRequestSchema,
  ElevenLabsUpsertOrderItemRequestSchema,
  ElevenLabsRegisterOrderMediaRequestSchema,
  ElevenLabsTextToDialogueRequestSchema,
  ElevenLabsTextToSpeechRequestSchema,
  ElevenLabsSpeechToTextRequestSchema,
  ElevenLabsSpeechToSpeechRequestSchema,
  ElevenLabsUpdatePvcVoiceSampleRequestSchema,
  ElevenLabsUsageCharacterStatsRequestSchema,
  ElevenLabsWorkspaceAnalyticsRequestsRequestSchema,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema,
  ElevenLabsListWorkspaceAuditLogsRequestSchema,
  ElevenLabsSearchWorkspaceGroupsRequestSchema,
  ElevenLabsAddWorkspaceGroupMemberRequestSchema,
  ElevenLabsRemoveWorkspaceGroupMemberRequestSchema,
  ElevenLabsUpdateWorkspaceMemberRequestSchema,
  ElevenLabsAddWorkspaceInviteRequestSchema,
  ElevenLabsAddWorkspaceInvitesBulkRequestSchema,
  ElevenLabsDeleteWorkspaceInviteRequestSchema,
  ElevenLabsGetWorkspaceResourceRequestSchema,
  ElevenLabsShareWorkspaceResourceRequestSchema,
  ElevenLabsUnshareWorkspaceResourceRequestSchema,
  ElevenLabsListWorkspaceWebhooksRequestSchema,
  ElevenLabsCreateWorkspaceWebhookRequestSchema,
  ElevenLabsUpdateWorkspaceWebhookRequestSchema,
  ElevenLabsCreateWorkspaceAuthConnectionRequestSchema,
  ElevenLabsUpdateWorkspaceAuthConnectionRequestSchema,
  ElevenLabsDisableWorkspaceApiKeyRequestSchema,
  ElevenLabsSetWorkspaceApiKeyThirdPartyDisablingRequestSchema,
  ElevenLabsCreateServiceAccountApiKeyRequestSchema,
  ElevenLabsUpdateServiceAccountApiKeyRequestSchema,
  ElevenLabsCreateAgentRequestSchema,
  ElevenLabsGetAgentRequestSchema,
  ElevenLabsListAgentsRequestSchema,
  ElevenLabsUpdateAgentRequestSchema,
  ElevenLabsGetAgentWidgetRequestSchema,
  ElevenLabsListAgentBranchesRequestSchema,
  ElevenLabsGetAgentSummariesRequestSchema,
  ElevenLabsDuplicateAgentRequestSchema,
  ElevenLabsPostAgentAvatarRequestSchema,
  ElevenLabsSimulateConversationRequestSchema,
  ElevenLabsGetAgentTopicsRequestSchema,
  ElevenLabsCalculateAgentLlmUsageRequestSchema,
  ElevenLabsCreateAgentDraftRequestSchema,
  ElevenLabsDeleteAgentDraftRequestSchema,
  ElevenLabsCreateAgentDeploymentRequestSchema,
  ElevenLabsCreateAgentBranchRequestSchema,
  ElevenLabsUpdateAgentBranchRequestSchema,
  ElevenLabsMergeAgentBranchRequestSchema,
  ElevenLabsPreviewAgentBranchMergeRequestSchema,
  ElevenLabsGetLiveConversationCountRequestSchema,
  ElevenLabsListConversationUsersRequestSchema,
  ElevenLabsCalculateLlmUsageRequestSchema,
  ElevenLabsListConversationTagsRequestSchema,
  ElevenLabsCreateConversationTagRequestSchema,
  ElevenLabsUpdateConversationTagRequestSchema,
  ElevenLabsUpdateConvaiSettingsRequestSchema,
  ElevenLabsUpdateConvaiDashboardSettingsRequestSchema,
  ElevenLabsCreateWorkspaceSecretRequestSchema,
  ElevenLabsListWorkspaceSecretsRequestSchema,
  ElevenLabsUpdateWorkspaceSecretRequestSchema,
  ElevenLabsGetSecretDependenciesRequestSchema,
  ElevenLabsListEnvironmentVariablesRequestSchema,
  ElevenLabsCreateEnvironmentVariableRequestSchema,
  ElevenLabsUpdateEnvironmentVariableRequestSchema,
  ElevenLabsCreateToolRequestSchema,
  ElevenLabsListToolsRequestSchema,
  ElevenLabsUpdateToolRequestSchema,
  ElevenLabsGetToolDependentAgentsRequestSchema,
  ElevenLabsGetToolExecutionsRequestSchema,
  ElevenLabsCreateMcpServerRequestSchema,
  ElevenLabsUpdateMcpServerRequestSchema,
  ElevenLabsCreateMcpServerToolApprovalRequestSchema,
  ElevenLabsCreateMcpToolConfigOverrideRequestSchema,
  ElevenLabsUpdateMcpToolConfigOverrideRequestSchema,
  ElevenLabsCreateAgentTestRequestSchema,
  ElevenLabsListAgentTestsRequestSchema,
  ElevenLabsUpdateAgentTestRequestSchema,
  ElevenLabsGetAgentTestSummariesRequestSchema,
  ElevenLabsBulkMoveAgentTestsRequestSchema,
  ElevenLabsCreateAgentTestFolderRequestSchema,
  ElevenLabsUpdateAgentTestFolderRequestSchema,
  ElevenLabsDeleteAgentTestFolderRequestSchema,
  ElevenLabsRunAgentTestsRequestSchema,
  ElevenLabsListTestInvocationsRequestSchema,
  ElevenLabsResubmitTestsRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestSchema,
  ElevenLabsListKnowledgeBaseDocumentsRequestSchema,
  ElevenLabsGetKnowledgeBaseDocumentRequestSchema,
  ElevenLabsDeleteKnowledgeBaseDocumentRequestSchema,
  ElevenLabsGetKnowledgeBaseSummariesRequestSchema,
  ElevenLabsSearchKnowledgeBaseContentRequestSchema,
  ElevenLabsUpdateKnowledgeBaseDocumentRequestSchema,
  ElevenLabsListKnowledgeBaseDocumentChunksRequestSchema,
  ElevenLabsGetKnowledgeBaseDocumentChunkRequestSchema,
  ElevenLabsGetKnowledgeBaseDependentAgentsRequestSchema,
  ElevenLabsUpdateKnowledgeBaseFileDocumentRequestSchema,
  ElevenLabsComputeKnowledgeBaseRagIndexesRequestSchema,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequestSchema,
  ElevenLabsCreateKnowledgeBaseFolderRequestSchema,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsRequestSchema,
  ElevenLabsMoveKnowledgeBaseEntityRequestSchema,
  ElevenLabsListConversationsRequestSchema,
  ElevenLabsGetConversationRequestSchema,
  ElevenLabsGetSignedUrlRequestSchema,
  ElevenLabsGetConversationTokenRequestSchema,
  ElevenLabsSmartSearchConversationMessagesRequestSchema,
  ElevenLabsTextSearchConversationMessagesRequestSchema,
  ElevenLabsConversationFeedbackRequestSchema,
  ElevenLabsUploadConversationFileRequestSchema,
  ElevenLabsGetConversationSipMessagesRequestSchema,
  ElevenLabsAssignConversationTagsRequestSchema,
  ElevenLabsRunConversationEvaluationsRequestSchema,
  ElevenLabsSubmitBatchCallRequestSchema,
  ElevenLabsListWorkspaceBatchCallsRequestSchema,
  ElevenLabsCreatePhoneNumberRequestSchema,
  ElevenLabsListPhoneNumbersRequestSchema,
  ElevenLabsUpdatePhoneNumberRequestSchema,
  ElevenLabsGetPhoneNumberSipMessagesRequestSchema,
  ElevenLabsRegisterTwilioCallRequestSchema,
  ElevenLabsTwilioOutboundCallRequestSchema,
  ElevenLabsSipTrunkOutboundCallRequestSchema,
  ElevenLabsExotelOutboundCallRequestSchema,
  ElevenLabsWhatsAppOutboundCallRequestSchema,
  ElevenLabsWhatsAppOutboundMessageRequestSchema,
  ElevenLabsListWhatsAppAccountsRequestSchema,
  ElevenLabsUpdateWhatsAppAccountRequestSchema,
  ElevenLabsCreateVoiceFromPreviewRequestSchema,
  ElevenLabsVoiceDesignRequestSchema,
  ElevenLabsVoiceRemixRequestSchema,
  ElevenLabsListV1VoicesRequestSchema,
  ElevenLabsAddVoiceRequestSchema,
  ElevenLabsEditVoiceRequestSchema,
  ElevenLabsEditVoiceSettingsRequestSchema,
  ElevenLabsAddSharedVoiceRequestSchema,
  ElevenLabsSharedVoicesRequestSchema,
  ElevenLabsSimilarVoicesRequestSchema,
  ElevenLabsHistoryListRequestSchema,
  ElevenLabsHistoryDownloadRequestSchema,
  ElevenLabsListDubbingRequestSchema,
  ElevenLabsCreateDubbingRequestSchema,
  ElevenLabsStudioCreatePodcastRequestSchema,
  ElevenLabsStudioGetProjectRequestSchema,
  ElevenLabsStudioCreateProjectRequestSchema,
  ElevenLabsStudioUpdateProjectRequestSchema,
  ElevenLabsStudioUpdateProjectContentRequestSchema,
  ElevenLabsStudioCreatePronunciationDictionariesRequestSchema,
  ElevenLabsStudioStreamAudioRequestSchema,
  ElevenLabsStudioCreateChapterRequestSchema,
  ElevenLabsStudioUpdateChapterRequestSchema,
  ElevenLabsListPronunciationDictionariesRequestSchema,
  ElevenLabsAddPronunciationDictionaryFromFileRequestSchema,
  ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema,
  ElevenLabsGetPronunciationDictionaryRequestSchema,
  ElevenLabsUpdatePronunciationDictionaryRequestSchema,
  ElevenLabsAddPronunciationDictionaryRulesRequestSchema,
  ElevenLabsRemovePronunciationDictionaryRulesRequestSchema,
  ElevenLabsSetPronunciationDictionaryRulesRequestSchema,
  ElevenLabsDownloadPronunciationDictionaryRequestSchema,
} from "./zod";
import { attachExamples } from "./example";

export function createElevenLabs(opts: ElevenLabsOptions): ElevenLabsProvider {
  const baseURL = opts.baseURL ?? "https://api.elevenlabs.io";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  interface ElevenLabsSubscriptionPayload extends Record<string, unknown> {
    tier: string;
    character_count: number;
    character_limit: number;
    remaining_character_count?: number;
  }

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
      return;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  // ElevenLabs returns either FastAPI 422 `{ detail: [{loc,msg,type}, ...] }` or
  // the wider `{ detail: { status, message } }` shape. Surface whichever the
  // server sent so the caller sees the real reason.
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string };
        if (first?.msg) {
          return `ElevenLabs API error ${status}: ${first.msg}`;
        }
      }
      if (typeof detail === "object" && detail !== null) {
        const d = detail as { message?: string; status?: string };
        if (d.message) {
          return `ElevenLabs API error ${status}: ${d.message}`;
        }
      }
      if (typeof detail === "string") {
        return `ElevenLabs API error ${status}: ${detail}`;
      }
    }
    return `ElevenLabs API error: ${status}`;
  }

  function extractErrorCode(body: unknown): string | undefined {
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "object" && detail !== null) {
        const d = detail as { status?: string };
        if (typeof d.status === "string") return d.status;
      }
    }
    return undefined;
  }

  async function makeBinaryRequest(
    path: string,
    body: unknown,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

    try {
      const res = await doFetch(`${baseURL}${path}${qs}`, {
        method: "POST",
        headers: {
          "xi-api-key": opts.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  // GET variant of makeBinaryRequest: fetches an endpoint that responds with
  // raw bytes (e.g. the conversation audio recording) and returns the buffer.
  async function makeGetBinaryRequest(
    path: string,
    queryString = "",
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}${queryString}`, {
        method: "GET",
        headers: {
          "xi-api-key": opts.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeTextRequest(
    method: "GET",
    path: string,
    signal?: AbortSignal,
    queryString = ""
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}${queryString}`, {
        method,
        headers: {
          "xi-api-key": opts.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeTextBodyRequest(
    method: "POST",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        "xi-api-key": opts.apiKey,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeJsonRequest<T>(
    method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT",
    path: string,
    body?: unknown,
    signal?: AbortSignal,
    queryString = ""
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        "xi-api-key": opts.apiKey,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}${queryString}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  // Like makeJsonRequest, but tolerates an empty success body (HTTP 204 / 200
  // with no content), which the agent DELETE endpoint returns. Parses JSON when
  // present, otherwise resolves to an empty object.
  async function makeJsonRequestAllowEmpty<T>(
    method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT",
    path: string,
    body?: unknown,
    signal?: AbortSignal,
    queryString = ""
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        "xi-api-key": opts.apiKey,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}${queryString}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      const text = await res.text();
      return (text ? JSON.parse(text) : {}) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeMultipartJsonRequest<T>(
    path: string,
    form: FormData,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<T> {
    return makeMultipartJsonRequestWithMethod(
      "POST",
      path,
      form,
      query,
      signal
    );
  }

  async function makeMultipartJsonRequestWithMethod<T>(
    method: "POST" | "PATCH",
    path: string,
    form: FormData,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

    try {
      const res = await doFetch(`${baseURL}${path}${qs}`, {
        method,
        headers: {
          "xi-api-key": opts.apiKey,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  // Like makeMultipartJsonRequest, but for endpoints that respond with raw
  // audio bytes (e.g. the speech-to-speech voice changer) — uploads a multipart
  // form and returns the response buffer.
  async function makeMultipartBinaryRequest(
    path: string,
    form: FormData,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

    try {
      const res = await doFetch(`${baseURL}${path}${qs}`, {
        method: "POST",
        headers: {
          "xi-api-key": opts.apiKey,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeRedirectRequest(
    method: "GET",
    path: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDocsRedirectResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method,
        headers: {
          "xi-api-key": opts.apiKey,
        },
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok && (res.status < 300 || res.status >= 400)) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return {
        status: res.status,
        location: res.headers.get("location"),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  function appendFormField(form: FormData, key: string, value: unknown): void {
    if (value === undefined || value === null) return;
    if (value instanceof Blob) {
      form.append(key, value);
      return;
    }
    if (typeof value === "string") {
      form.append(key, value);
      return;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      form.append(key, String(value));
      return;
    }
    form.append(key, JSON.stringify(value));
  }

  function optionalQuery(
    pairs: Record<string, string | undefined>
  ): Record<string, string> | undefined {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(pairs)) {
      if (value !== undefined) {
        query[key] = value;
      }
    }
    return Object.keys(query).length > 0 ? query : undefined;
  }

  // Parse a newline-delimited JSON (NDJSON) response body into an array of
  // chunk objects. The streaming text-to-speech-with-timestamps endpoint emits
  // one JSON object per line as audio is generated.
  function decodeNdjson<T>(buffer: ArrayBuffer): T[] {
    const text = new TextDecoder().decode(buffer);
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as T);
  }

  function buildQueryString(params: object): string {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null) {
            query.append(key, String(item));
          }
        }
        continue;
      }
      query.append(key, String(value));
    }

    const serialized = query.toString();
    return serialized ? `?${serialized}` : "";
  }

  // GET https://api.elevenlabs.io/v1/pronunciation-dictionaries
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/list
  const listPronunciationDictionaries = Object.assign(
    async (
      req: ElevenLabsListPronunciationDictionariesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListPronunciationDictionariesResponse> => {
      return makeJsonRequest<ElevenLabsListPronunciationDictionariesResponse>(
        "GET",
        "/v1/pronunciation-dictionaries",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListPronunciationDictionariesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-file
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-file
  const addPronunciationDictionaryFromFile = Object.assign(
    async (
      req: ElevenLabsAddPronunciationDictionaryFromFileRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddPronunciationDictionaryResponse> => {
      const form = new FormData();
      appendFormField(form, "name", req.name);
      if (req.file) appendFormField(form, "file", req.file);
      if (req.description)
        appendFormField(form, "description", req.description);
      if (req.workspace_access)
        appendFormField(form, "workspace_access", req.workspace_access);

      return makeMultipartJsonRequest<ElevenLabsAddPronunciationDictionaryResponse>(
        "/v1/pronunciation-dictionaries/add-from-file",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAddPronunciationDictionaryFromFileRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-rules
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-rules
  const addPronunciationDictionaryFromRules = Object.assign(
    async (
      req: ElevenLabsAddPronunciationDictionaryFromRulesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddPronunciationDictionaryResponse> => {
      return makeJsonRequest<ElevenLabsAddPronunciationDictionaryResponse>(
        "POST",
        "/v1/pronunciation-dictionaries/add-from-rules",
        req,
        signal
      );
    },
    { schema: ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/get
  const getPronunciationDictionary = Object.assign(
    async (
      id: string,
      req: ElevenLabsGetPronunciationDictionaryRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetPronunciationDictionaryResponse> => {
      return makeJsonRequest<ElevenLabsGetPronunciationDictionaryResponse>(
        "GET",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetPronunciationDictionaryRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/update
  const updatePronunciationDictionary = Object.assign(
    async (
      id: string,
      req: ElevenLabsUpdatePronunciationDictionaryRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsPronunciationDictionaryMetadata> => {
      return makeJsonRequest<ElevenLabsPronunciationDictionaryMetadata>(
        "PATCH",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdatePronunciationDictionaryRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/add-rules
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/add
  const addPronunciationDictionaryRules = Object.assign(
    async (
      id: string,
      req: ElevenLabsAddPronunciationDictionaryRulesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPronunciationDictionaryRulesResponse> => {
      return makeJsonRequest<ElevenLabsPronunciationDictionaryRulesResponse>(
        "POST",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}/add-rules`,
        req,
        signal
      );
    },
    { schema: ElevenLabsAddPronunciationDictionaryRulesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/remove-rules
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/remove
  const removePronunciationDictionaryRules = Object.assign(
    async (
      id: string,
      req: ElevenLabsRemovePronunciationDictionaryRulesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPronunciationDictionaryRulesResponse> => {
      return makeJsonRequest<ElevenLabsPronunciationDictionaryRulesResponse>(
        "POST",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}/remove-rules`,
        req,
        signal
      );
    },
    { schema: ElevenLabsRemovePronunciationDictionaryRulesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/set-rules
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/set
  const setPronunciationDictionaryRules = Object.assign(
    async (
      id: string,
      req: ElevenLabsSetPronunciationDictionaryRulesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPronunciationDictionaryRulesResponse> => {
      return makeJsonRequest<ElevenLabsPronunciationDictionaryRulesResponse>(
        "POST",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}/set-rules`,
        req,
        signal
      );
    },
    { schema: ElevenLabsSetPronunciationDictionaryRulesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/{versionId}/download
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/download
  const downloadPronunciationDictionary = Object.assign(
    async (
      id: string,
      versionId: string,
      req: ElevenLabsDownloadPronunciationDictionaryRequest = {},
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}/${encodeURIComponent(versionId)}/download`,
        buildQueryString(req),
        signal
      );
    },
    { schema: ElevenLabsDownloadPronunciationDictionaryRequestSchema }
  );

  // -- Endpoints -------------------------------------------------------------

  // GET https://api.elevenlabs.io/docs
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech
  const docs = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsDocsRedirectResponse> => {
      return makeRedirectRequest("GET", "/docs", signal);
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/models
  // Docs: https://elevenlabs.io/docs/api-reference/models/list
  const models = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsListModelsResponse> => {
      return makeJsonRequest<ElevenLabsListModelsResponse>(
        "GET",
        "/v1/models",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/usage/character-stats
  // Docs: https://elevenlabs.io/docs/api-reference/usage/get
  const characterStats = Object.assign(
    async (
      req: ElevenLabsUsageCharacterStatsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUsageCharacterStatsResponse> => {
      return makeJsonRequest<ElevenLabsUsageCharacterStatsResponse>(
        "GET",
        "/v1/usage/character-stats",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsUsageCharacterStatsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get
  const getVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsGetVoiceRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsVoice> => {
      return makeJsonRequest<ElevenLabsVoice>(
        "GET",
        `/v1/voices/${encodeURIComponent(voiceId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetVoiceRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}/settings
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-settings
  const getVoiceSettings = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoiceSettings> => {
      return makeJsonRequest<ElevenLabsVoiceSettings>(
        "GET",
        `/v1/voices/${encodeURIComponent(voiceId)}/settings`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-all
  const listV1Voices = Object.assign(
    async (
      req: ElevenLabsListV1VoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListV1VoicesResponse> => {
      return makeJsonRequest<ElevenLabsListV1VoicesResponse>(
        "GET",
        "/v1/voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListV1VoicesRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/delete
  const deleteVoice = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceResponse>(
        "DELETE",
        `/v1/voices/${encodeURIComponent(voiceId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/add
  // Docs: https://elevenlabs.io/docs/api-reference/voices/ivc/create
  const addVoice = async (
    req: ElevenLabsAddVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAddVoiceResponse> => {
    const { files, ...rest } = req;
    const form = new FormData();
    for (const file of files) {
      form.append("files", file);
    }
    for (const [key, value] of Object.entries(rest)) {
      appendFormField(form, key, value);
    }

    return makeMultipartJsonRequest<ElevenLabsAddVoiceResponse>(
      "/v1/voices/add",
      form,
      undefined,
      signal
    );
  };

  // POST https://api.elevenlabs.io/v1/voices/add/{publicUserId}/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/share
  const addSharedVoice = Object.assign(
    async (
      publicUserId: string,
      voiceId: string,
      req: ElevenLabsAddSharedVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddSharedVoiceResponse> => {
      return makeJsonRequest<ElevenLabsAddSharedVoiceResponse>(
        "POST",
        `/v1/voices/add/${encodeURIComponent(
          publicUserId
        )}/${encodeURIComponent(voiceId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsAddSharedVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/{voiceId}/edit
  // Docs: https://elevenlabs.io/docs/api-reference/voices/edit
  const editVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditVoiceResponse> => {
      const { files, ...rest } = req;
      const form = new FormData();
      if (files) {
        for (const file of files) {
          form.append("files", file);
        }
      }
      for (const [key, value] of Object.entries(rest)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsEditVoiceResponse>(
        `/v1/voices/${encodeURIComponent(voiceId)}/edit`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsEditVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/{voiceId}/settings/edit
  // Docs: https://elevenlabs.io/docs/api-reference/voices/settings/update
  const editVoiceSettings = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditVoiceSettingsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditVoiceSettingsResponse> => {
      return makeJsonRequest<ElevenLabsEditVoiceSettingsResponse>(
        "POST",
        `/v1/voices/${encodeURIComponent(voiceId)}/settings/edit`,
        req,
        signal
      );
    },
    { schema: ElevenLabsEditVoiceSettingsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/settings/default
  // Docs: https://elevenlabs.io/docs/api-reference/voices/settings/get-default
  const getDefaultVoiceSettings = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsVoiceSettings> => {
      return makeJsonRequest<ElevenLabsVoiceSettings>(
        "GET",
        "/v1/voices/settings/default",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/samples/delete
  const deleteVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceSampleResponse>(
        "DELETE",
        `/v1/voices/${encodeURIComponent(voiceId)}/samples/${encodeURIComponent(
          sampleId
        )}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/samples/audio
  const getVoiceSampleAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/voices/${encodeURIComponent(voiceId)}/samples/${encodeURIComponent(
          sampleId
        )}/audio`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/shared-voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-shared
  const getSharedVoices = Object.assign(
    async (
      req: ElevenLabsSharedVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsLibraryVoicesResponse> => {
      return makeJsonRequest<ElevenLabsLibraryVoicesResponse>(
        "GET",
        "/v1/shared-voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsSharedVoicesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/similar-voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/find-similar-voices
  const getSimilarVoices = Object.assign(
    async (
      req: ElevenLabsSimilarVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsLibraryVoicesResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsLibraryVoicesResponse>(
        "/v1/similar-voices",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsSimilarVoicesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/create
  const createPvcVoice = Object.assign(
    async (
      req: ElevenLabsCreatePvcVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreatePvcVoiceResponse> => {
      return makeJsonRequest<ElevenLabsCreatePvcVoiceResponse>(
        "POST",
        "/v1/voices/pvc",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreatePvcVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/edit
  const editPvcVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditPvcVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditPvcVoiceResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsEditPvcVoiceResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsEditPvcVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha/verify
  const pvcVoiceCaptcha = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcVoiceCaptchaRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcVoiceCaptchaResponse> => {
      const form = new FormData();
      appendFormField(form, "recording", req.recording);

      return makeMultipartJsonRequest<ElevenLabsPvcVoiceCaptchaResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/captcha`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsPvcVoiceCaptchaRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha
  const getPvcVoiceCaptcha = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetPvcVoiceCaptchaResponse> => {
      return makeJsonRequest<ElevenLabsGetPvcVoiceCaptchaResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/captcha`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/update
  const updatePvcVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      req: ElevenLabsUpdatePvcVoiceSampleRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdatePvcVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsUpdatePvcVoiceSampleResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdatePvcVoiceSampleRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/create
  const addPvcSamples = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsAddPvcSamplesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddPvcSamplesResponse> => {
      const { files, ...rest } = req;
      const form = new FormData();
      for (const file of files) {
        form.append("files", file);
      }
      for (const [key, value] of Object.entries(rest)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsAddPvcSamplesResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/samples`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAddPvcSamplesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/audio
  const getPvcSampleAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      req: ElevenLabsGetPvcSampleAudioRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsVoiceSamplePreviewResponse> => {
      return makeJsonRequest<ElevenLabsVoiceSamplePreviewResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/audio`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetPvcSampleAudioRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/speakers
  const getPvcSampleSpeakers = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeakerSeparation> => {
      return makeJsonRequest<ElevenLabsSpeakerSeparation>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/speakers`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/separate-speakers
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/separate-speakers
  const startSpeakerSeparation = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStartSpeakerSeparationResponse> => {
      return makeJsonRequest<ElevenLabsStartSpeakerSeparationResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/separate-speakers`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers/{speakerId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-separated-speaker-audio
  const getSeparatedSpeakerAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      speakerId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeakerAudioResponse> => {
      return makeJsonRequest<ElevenLabsSpeakerAudioResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(
          sampleId
        )}/speakers/${encodeURIComponent(speakerId)}/audio`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/waveform
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-waveform
  const getPvcVoiceSampleWaveform = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcVoiceSampleWaveformResponse> => {
      return makeJsonRequest<ElevenLabsPvcVoiceSampleWaveformResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/waveform`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/delete
  const deletePvcVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceSampleResponse>(
        "DELETE",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/train
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/train
  const pvcTrain = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcTrainRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcTrainResponse> => {
      return makeJsonRequest<ElevenLabsPvcTrainResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/train`,
        req,
        signal
      );
    },
    { schema: ElevenLabsPvcTrainRequestSchema }
  );

  // GET https://api.elevenlabs.io/v2/voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/search
  const voices = Object.assign(
    async (
      req: ElevenLabsListVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListVoicesResponse> => {
      return makeJsonRequest<ElevenLabsListVoicesResponse>(
        "GET",
        "/v2/voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListVoicesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/sound-generation
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert
  const soundGeneration = Object.assign(
    async (
      req: ElevenLabsSoundGenerationRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = output_format ? { output_format } : undefined;
      return makeBinaryRequest("/v1/sound-generation", body, query, signal);
    },
    { schema: ElevenLabsSoundGenerationRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/audio-isolation/stream
  // Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/stream
  const audioIsolationStream = Object.assign(
    async (
      req: ElevenLabsAudioIsolationStreamRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartBinaryRequest(
        "/v1/audio-isolation/stream",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAudioIsolationStreamRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/audio-isolation/history
  // Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/list
  const listAudioIsolationHistory = Object.assign(
    async (
      req: ElevenLabsAudioIsolationHistoryListRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioIsolationHistoryListResponse> => {
      return makeJsonRequest<ElevenLabsAudioIsolationHistoryListResponse>(
        "GET",
        "/v1/audio-isolation/history",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsAudioIsolationHistoryListRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/audio-isolation/history/{historyItemId}
  // Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/delete
  const deleteAudioIsolationHistoryItem = Object.assign(
    async (
      historyItemId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioIsolationDeleteHistoryResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsAudioIsolationDeleteHistoryResponse>(
        "DELETE",
        `/v1/audio-isolation/history/${encodeURIComponent(historyItemId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/audio-isolation
  // Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/convert
  const audioIsolation = Object.assign(
    async (
      req: ElevenLabsAudioIsolationRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartBinaryRequest(
        "/v1/audio-isolation",
        form,
        undefined,
        signal
      );
    },
    {
      schema: ElevenLabsAudioIsolationRequestSchema,
      stream: audioIsolationStream,
      history: {
        list: listAudioIsolationHistory,
        delete: deleteAudioIsolationHistoryItem,
      },
    }
  );

  // POST https://api.elevenlabs.io/v1/audio-native/content
  // Docs: https://elevenlabs.io/docs/api-reference/audio-native/update-content
  const updateAudioNativeContentFromUrl = Object.assign(
    async (
      req: ElevenLabsAudioNativeUpdateContentFromUrlRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioNativeEditContentResponse> => {
      return makeJsonRequest<ElevenLabsAudioNativeEditContentResponse>(
        "POST",
        "/v1/audio-native/content",
        req,
        signal
      );
    },
    { schema: ElevenLabsAudioNativeUpdateContentFromUrlRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/audio-native/{projectId}/content
  // Docs: https://elevenlabs.io/docs/api-reference/audio-native/update-content
  const updateAudioNativeProjectContent = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsAudioNativeUpdateProjectContentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioNativeEditContentResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsAudioNativeEditContentResponse>(
        `/v1/audio-native/${encodeURIComponent(projectId)}/content`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAudioNativeUpdateProjectContentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/audio-native/{projectId}/settings
  // Docs: https://elevenlabs.io/docs/api-reference/audio-native/get-settings
  const getAudioNativeProjectSettings = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioNativeProjectSettingsResponse> => {
      return makeJsonRequest<ElevenLabsAudioNativeProjectSettingsResponse>(
        "GET",
        `/v1/audio-native/${encodeURIComponent(projectId)}/settings`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/audio-native
  // Docs: https://elevenlabs.io/docs/api-reference/audio-native/create
  const audioNative = Object.assign(
    async (
      req: ElevenLabsAudioNativeCreateProjectRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioNativeCreateProjectResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsAudioNativeCreateProjectResponse>(
        "/v1/audio-native",
        form,
        undefined,
        signal
      );
    },
    {
      schema: ElevenLabsAudioNativeCreateProjectRequestSchema,
      content: {
        fromUrl: updateAudioNativeContentFromUrl,
        update: updateAudioNativeProjectContent,
      },
      settings: getAudioNativeProjectSettings,
    }
  );

  // POST https://api.elevenlabs.io/v1/forced-alignment
  // Docs: https://elevenlabs.io/docs/api-reference/forced-alignment/create
  const forcedAlignment = Object.assign(
    async (
      req: ElevenLabsForcedAlignmentRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsForcedAlignmentResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsForcedAlignmentResponse>(
        "/v1/forced-alignment",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsForcedAlignmentRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/detailed
  // Docs: https://elevenlabs.io/docs/api-reference/music/compose-detailed
  const composeMusicDetailed = Object.assign(
    async (
      req: ElevenLabsComposeMusicDetailedRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = output_format ? { output_format } : undefined;
      return makeBinaryRequest("/v1/music/detailed", body, query, signal);
    },
    { schema: ElevenLabsComposeMusicDetailedRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/plan
  // Docs: https://elevenlabs.io/docs/api-reference/music/compose-plan
  const musicPlan = Object.assign(
    async (
      req: ElevenLabsMusicPlanRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMusicPlanResponse> => {
      return makeJsonRequest<ElevenLabsMusicPlanResponse>(
        "POST",
        "/v1/music/plan",
        req,
        signal
      );
    },
    { schema: ElevenLabsMusicPlanRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/stream
  // Docs: https://elevenlabs.io/docs/api-reference/music/compose-stream
  const composeMusicStream = Object.assign(
    async (
      req: ElevenLabsComposeMusicStreamRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = output_format ? { output_format } : undefined;
      return makeBinaryRequest("/v1/music/stream", body, query, signal);
    },
    { schema: ElevenLabsComposeMusicStreamRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/stem-separation
  // Docs: https://elevenlabs.io/docs/api-reference/music/stem-separation
  const musicStemSeparation = Object.assign(
    async (
      req: ElevenLabsMusicStemSeparationRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const form = new FormData();
      for (const [key, value] of Object.entries(body)) {
        appendFormField(form, key, value);
      }
      const query = output_format ? { output_format } : undefined;
      return makeMultipartBinaryRequest(
        "/v1/music/stem-separation",
        form,
        query,
        signal
      );
    },
    { schema: ElevenLabsMusicStemSeparationRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/upload
  // Docs: https://elevenlabs.io/docs/api-reference/music/upload
  const musicUpload = Object.assign(
    async (
      req: ElevenLabsMusicUploadRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsMusicUploadResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }
      return makeMultipartJsonRequest<ElevenLabsMusicUploadResponse>(
        "/v1/music/upload",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsMusicUploadRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music/video-to-music
  // Docs: https://elevenlabs.io/docs/api-reference/music/video-to-music
  const videoToMusic = Object.assign(
    async (
      req: ElevenLabsVideoToMusicRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, videos, tags, ...rest } = req;
      const form = new FormData();
      for (const video of videos) {
        form.append("videos", video);
      }
      if (tags) {
        for (const tag of tags) {
          form.append("tags", tag);
        }
      }
      for (const [key, value] of Object.entries(rest)) {
        appendFormField(form, key, value);
      }
      const query = output_format ? { output_format } : undefined;
      return makeMultipartBinaryRequest(
        "/v1/music/video-to-music",
        form,
        query,
        signal
      );
    },
    { schema: ElevenLabsVideoToMusicRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/music
  // Docs: https://elevenlabs.io/docs/api-reference/music/compose
  const music = Object.assign(
    async (
      req: ElevenLabsComposeMusicRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = output_format ? { output_format } : undefined;
      return makeBinaryRequest("/v1/music", body, query, signal);
    },
    {
      schema: ElevenLabsComposeMusicRequestSchema,
      detailed: composeMusicDetailed,
      plan: musicPlan,
      stream: composeMusicStream,
      stemSeparation: musicStemSeparation,
      upload: musicUpload,
      videoToMusic: videoToMusic,
    }
  );

  // GET https://api.elevenlabs.io/v1/speech-engine
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/list
  const listSpeechEngines = Object.assign(
    async (
      req: ElevenLabsListSpeechEnginesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListSpeechEnginesResponse> => {
      return makeJsonRequest<ElevenLabsListSpeechEnginesResponse>(
        "GET",
        "/v1/speech-engine",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListSpeechEnginesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/speech-engine
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/create
  const createSpeechEngine = Object.assign(
    async (
      req: ElevenLabsCreateSpeechEngineRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeechEngineResponse> => {
      return makeJsonRequest<ElevenLabsSpeechEngineResponse>(
        "POST",
        "/v1/speech-engine",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateSpeechEngineRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/get
  const getSpeechEngine = Object.assign(
    async (
      speechEngineId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeechEngineResponse> => {
      return makeJsonRequest<ElevenLabsSpeechEngineResponse>(
        "GET",
        `/v1/speech-engine/${encodeURIComponent(speechEngineId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/update
  const updateSpeechEngine = Object.assign(
    async (
      speechEngineId: string,
      req: ElevenLabsUpdateSpeechEngineRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeechEngineResponse> => {
      return makeJsonRequest<ElevenLabsSpeechEngineResponse>(
        "PATCH",
        `/v1/speech-engine/${encodeURIComponent(speechEngineId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateSpeechEngineRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/delete
  const deleteSpeechEngine = Object.assign(
    async (
      speechEngineId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteSpeechEngineResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteSpeechEngineResponse>(
        "DELETE",
        `/v1/speech-engine/${encodeURIComponent(speechEngineId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const speechEngine = {
    list: listSpeechEngines,
    create: createSpeechEngine,
    get: getSpeechEngine,
    update: updateSpeechEngine,
    delete: deleteSpeechEngine,
  };

  // GET https://api.elevenlabs.io/v1/productions/orders
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/list
  const listOrders = Object.assign(
    async (
      req: ElevenLabsListOrdersRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListOrdersResponse> => {
      return makeJsonRequest<ElevenLabsListOrdersResponse>(
        "GET",
        "/v1/productions/orders",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListOrdersRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/productions/orders
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/create
  const createOrder = Object.assign(
    async (
      req: ElevenLabsCreateOrderRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateOrderResponse> => {
      return makeJsonRequest<ElevenLabsCreateOrderResponse>(
        "POST",
        "/v1/productions/orders",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateOrderRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/productions/orders/{orderId}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/get
  const getOrder = Object.assign(
    async (
      orderId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsOrderResponse> => {
      return makeJsonRequest<ElevenLabsOrderResponse>(
        "GET",
        `/v1/productions/orders/${encodeURIComponent(orderId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/productions/orders/{orderId}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/update
  const updateOrder = Object.assign(
    async (
      orderId: string,
      req: ElevenLabsUpdateOrderRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateOrderResponse> => {
      return makeJsonRequest<ElevenLabsUpdateOrderResponse>(
        "PATCH",
        `/v1/productions/orders/${encodeURIComponent(orderId)}`,
        { request: req },
        signal
      );
    },
    { schema: ElevenLabsUpdateOrderRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/submit
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/submit
  const submitOrder = Object.assign(
    async (
      orderId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSubmitOrderResponse> => {
      return makeJsonRequest<ElevenLabsSubmitOrderResponse>(
        "POST",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/submit`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/productions/orders/{orderId}/deliverables
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/deliverables
  const getOrderDeliverables = Object.assign(
    async (
      orderId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsOrderDeliverablesResponse> => {
      return makeJsonRequest<ElevenLabsOrderDeliverablesResponse>(
        "GET",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/deliverables`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/items
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/items/upsert
  const upsertOrderItem = Object.assign(
    async (
      orderId: string,
      req: ElevenLabsUpsertOrderItemRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUpsertOrderItemResponse> => {
      return makeJsonRequest<ElevenLabsUpsertOrderItemResponse>(
        "POST",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/items`,
        { request: req },
        signal
      );
    },
    { schema: ElevenLabsUpsertOrderItemRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/productions/orders/{orderId}/items/{itemId}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/items/remove
  const removeOrderItem = Object.assign(
    async (
      orderId: string,
      itemId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsRemoveOrderItemResponse> => {
      return makeJsonRequest<ElevenLabsRemoveOrderItemResponse>(
        "DELETE",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/media
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/media/register
  const registerOrderMedia = Object.assign(
    async (
      orderId: string,
      req: ElevenLabsRegisterOrderMediaRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsRegisterOrderMediaResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }
      return makeMultipartJsonRequest<ElevenLabsRegisterOrderMediaResponse>(
        `/v1/productions/orders/${encodeURIComponent(orderId)}/media`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsRegisterOrderMediaRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/productions/orders/{orderId}/media/{mediaId}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/media/get
  const getOrderMedia = Object.assign(
    async (
      orderId: string,
      mediaId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsOrderMediaResponse> => {
      return makeJsonRequest<ElevenLabsOrderMediaResponse>(
        "GET",
        `/v1/productions/orders/${encodeURIComponent(orderId)}/media/${encodeURIComponent(mediaId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/productions/orders/languages/{orderItemKind}
  // Docs: https://elevenlabs.io/docs/api-reference/productions/orders/languages
  const getOrderLanguages = Object.assign(
    async (
      orderItemKind: ElevenLabsOrderItemKind,
      signal?: AbortSignal
    ): Promise<ElevenLabsOrderLanguagesResponse> => {
      return makeJsonRequest<ElevenLabsOrderLanguagesResponse>(
        "GET",
        `/v1/productions/orders/languages/${encodeURIComponent(orderItemKind)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const productionsOrders = {
    list: listOrders,
    create: createOrder,
    get: getOrder,
    update: updateOrder,
    submit: submitOrder,
    deliverables: getOrderDeliverables,
    items: {
      upsert: upsertOrderItem,
      remove: removeOrderItem,
    },
    media: {
      register: registerOrderMedia,
      get: getOrderMedia,
    },
    languages: getOrderLanguages,
  };

  const productions = {
    orders: productionsOrders,
  };

  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream/with-timestamps
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/stream-with-timestamps
  const textToSpeechStreamWithTimestamps = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsTextToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStreamingAudioChunkWithTimestampsResponse[]> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      const buffer = await makeBinaryRequest(
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream/with-timestamps`,
        body,
        query,
        signal
      );
      return decodeNdjson<ElevenLabsStreamingAudioChunkWithTimestampsResponse>(
        buffer
      );
    },
    { schema: ElevenLabsTextToSpeechRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/stream
  const textToSpeechStream = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsTextToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      return makeBinaryRequest(
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`,
        body,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsTextToSpeechRequestSchema,
      withTimestamps: textToSpeechStreamWithTimestamps,
    }
  );

  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/with-timestamps
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
  const textToSpeechWithTimestamps = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsTextToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioWithTimestampsResponse> => {
      const { output_format, enable_logging, ...body } = req;
      const query = buildQueryString({ output_format, enable_logging });
      return makeJsonRequest<ElevenLabsAudioWithTimestampsResponse>(
        "POST",
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`,
        body,
        signal,
        query
      );
    },
    { schema: ElevenLabsTextToSpeechRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
  const textToSpeech = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsTextToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      return makeBinaryRequest(
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
        body,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsTextToSpeechRequestSchema,
      stream: textToSpeechStream,
      withTimestamps: textToSpeechWithTimestamps,
    }
  );

  // POST https://api.elevenlabs.io/v1/text-to-dialogue/stream/with-timestamps
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/stream-with-timestamps
  const textToDialogueStreamWithTimestamps = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStreamingAudioChunkWithTimestampsResponse[]> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      const buffer = await makeBinaryRequest(
        "/v1/text-to-dialogue/stream/with-timestamps",
        body,
        query,
        signal
      );
      return decodeNdjson<ElevenLabsStreamingAudioChunkWithTimestampsResponse>(
        buffer
      );
    },
    { schema: ElevenLabsTextToDialogueRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-dialogue/stream
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/stream
  const textToDialogueStream = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      return makeBinaryRequest(
        "/v1/text-to-dialogue/stream",
        body,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsTextToDialogueRequestSchema,
      withTimestamps: textToDialogueStreamWithTimestamps,
    }
  );

  // POST https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps
  const textToDialogueWithTimestamps = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioWithTimestampsResponse> => {
      const { output_format, enable_logging, ...body } = req;
      const query = buildQueryString({ output_format, enable_logging });
      return makeJsonRequest<ElevenLabsAudioWithTimestampsResponse>(
        "POST",
        "/v1/text-to-dialogue/with-timestamps",
        body,
        signal,
        query
      );
    },
    { schema: ElevenLabsTextToDialogueRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-dialogue
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert
  const textToDialogue = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      return makeBinaryRequest("/v1/text-to-dialogue", body, query, signal);
    },
    {
      schema: ElevenLabsTextToDialogueRequestSchema,
      stream: textToDialogueStream,
      withTimestamps: textToDialogueWithTimestamps,
    }
  );

  // POST https://api.elevenlabs.io/v1/text-to-voice
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-voice/create
  const textToVoiceCreateVoice = Object.assign(
    async (
      req: ElevenLabsCreateVoiceFromPreviewRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoice> => {
      return makeJsonRequest<ElevenLabsVoice>(
        "POST",
        "/v1/text-to-voice",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateVoiceFromPreviewRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-voice/design
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-voice/design
  const textToVoiceDesign = Object.assign(
    async (
      req: ElevenLabsVoiceDesignRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoicePreviewsResponse> => {
      const { output_format, ...body } = req;
      const query = optionalQuery({ output_format });
      return makeJsonRequest<ElevenLabsVoicePreviewsResponse>(
        "POST",
        "/v1/text-to-voice/design",
        Object.keys(body).length > 0 ? body : undefined,
        signal,
        query ? buildQueryString(query) : ""
      );
    },
    { schema: ElevenLabsVoiceDesignRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-voice/{voiceId}/remix
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-voice/remix
  const textToVoiceRemix = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsVoiceRemixRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoicePreviewsResponse> => {
      const { output_format, ...body } = req;
      const query = optionalQuery({ output_format });
      return makeJsonRequest<ElevenLabsVoicePreviewsResponse>(
        "POST",
        `/v1/text-to-voice/${encodeURIComponent(voiceId)}/remix`,
        Object.keys(body).length > 0 ? body : undefined,
        signal,
        query ? buildQueryString(query) : ""
      );
    },
    { schema: ElevenLabsVoiceRemixRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/text-to-voice/{generatedVoiceId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-voice/stream
  const textToVoiceStream = Object.assign(
    async (
      generatedVoiceId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/text-to-voice/${encodeURIComponent(generatedVoiceId)}/stream`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // Callable text-to-voice namespace: create (POST) is the base call, with
  // design/remix (POST) and stream (GET) attached as sub-methods.
  const textToVoice = Object.assign(textToVoiceCreateVoice, {
    design: textToVoiceDesign,
    remix: textToVoiceRemix,
    stream: textToVoiceStream,
  });

  // GET https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcriptionId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/transcripts/get
  const getTranscript = Object.assign(
    async (
      transcriptionId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetTranscriptResponse> => {
      return makeJsonRequest<ElevenLabsGetTranscriptResponse>(
        "GET",
        `/v1/speech-to-text/transcripts/${encodeURIComponent(transcriptionId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcriptionId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/transcripts/delete
  const deleteTranscript = Object.assign(
    async (
      transcriptionId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteTranscriptResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteTranscriptResponse>(
        "DELETE",
        `/v1/speech-to-text/transcripts/${encodeURIComponent(transcriptionId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/speech-to-text
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
  const speechToText = Object.assign(
    async (
      req: ElevenLabsSpeechToTextRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeechToTextResponse> => {
      const { enable_logging, ...body } = req;
      const query =
        enable_logging !== undefined
          ? { enable_logging: String(enable_logging) }
          : undefined;

      const form = new FormData();
      for (const [key, value] of Object.entries(body)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsSpeechToTextResponse>(
        "/v1/speech-to-text",
        form,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsSpeechToTextRequestSchema,
      transcripts: {
        get: getTranscript,
        delete: deleteTranscript,
      },
    }
  );

  // GET https://api.elevenlabs.io/v1/dubbing
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/list
  const listDubbing = Object.assign(
    async (
      req: ElevenLabsListDubbingRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListDubbingResponse> => {
      return makeJsonRequest<ElevenLabsListDubbingResponse>(
        "GET",
        "/v1/dubbing",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListDubbingRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/dubbing
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/create
  const createDubbing = Object.assign(
    async (
      req: ElevenLabsCreateDubbingRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateDubbingResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsCreateDubbingResponse>(
        "/v1/dubbing",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsCreateDubbingRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/get
  const getDubbing = Object.assign(
    async (
      dubbingId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDubbingMetadata> => {
      return makeJsonRequest<ElevenLabsDubbingMetadata>(
        "GET",
        `/v1/dubbing/${encodeURIComponent(dubbingId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/dubbing/{dubbingId}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/delete
  const deleteDubbing = Object.assign(
    async (
      dubbingId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteDubbingResponse> => {
      return makeJsonRequest<ElevenLabsDeleteDubbingResponse>(
        "DELETE",
        `/v1/dubbing/${encodeURIComponent(dubbingId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/dubbing/resource/{dubbingId}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/resources/get-resource
  const getDubbingResource = Object.assign(
    async (
      dubbingId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDubbingResourceResponse> => {
      return makeJsonRequest<ElevenLabsDubbingResourceResponse>(
        "GET",
        `/v1/dubbing/resource/${encodeURIComponent(dubbingId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}/audio/{languageCode}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/audio/get
  const getDubbingAudio = Object.assign(
    async (
      dubbingId: string,
      languageCode: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/dubbing/${encodeURIComponent(dubbingId)}/audio/${encodeURIComponent(
          languageCode
        )}`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}/transcripts/{languageCode}/format/{formatType}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/transcripts/get
  const getDubbingTranscript = Object.assign(
    async (
      dubbingId: string,
      languageCode: string,
      formatType: "srt" | "webvtt" | "json",
      signal?: AbortSignal
    ): Promise<ElevenLabsDubbingTranscriptsResponse> => {
      return makeJsonRequest<ElevenLabsDubbingTranscriptsResponse>(
        "GET",
        `/v1/dubbing/${encodeURIComponent(dubbingId)}/transcripts/${encodeURIComponent(
          languageCode
        )}/format/${encodeURIComponent(formatType)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const dubbing = {
    list: listDubbing,
    create: createDubbing,
    get: getDubbing,
    delete: deleteDubbing,
    audio: {
      get: getDubbingAudio,
    },
    resource: {
      get: getDubbingResource,
    },
    transcripts: {
      get: getDubbingTranscript,
    },
  };

  // Append a multipart form body for the Studio project endpoints, expanding
  // array-valued fields (e.g. pronunciation_dictionary_locators, genres) into
  // one repeated form line per item as the upstream API expects.
  function appendStudioForm(form: FormData, req: object): void {
    for (const [key, value] of Object.entries(req)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          appendFormField(form, key, item);
        }
      } else {
        appendFormField(form, key, value);
      }
    }
  }

  // POST https://api.elevenlabs.io/v1/studio/podcasts
  // Docs: https://elevenlabs.io/docs/api-reference/studio/create-podcast
  const studioCreatePodcast = Object.assign(
    async (
      req: ElevenLabsStudioCreatePodcastRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioCreatePodcastResponse> => {
      return makeJsonRequest<ElevenLabsStudioCreatePodcastResponse>(
        "POST",
        "/v1/studio/podcasts",
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioCreatePodcastRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-projects
  const studioListProjects = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioListProjectsResponse> => {
      return makeJsonRequest<ElevenLabsStudioListProjectsResponse>(
        "GET",
        "/v1/studio/projects",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects
  // Docs: https://elevenlabs.io/docs/api-reference/studio/add-project
  const studioCreateProject = Object.assign(
    async (
      req: ElevenLabsStudioCreateProjectRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioAddProjectResponse> => {
      const form = new FormData();
      appendStudioForm(form, req);
      return makeMultipartJsonRequest<ElevenLabsStudioAddProjectResponse>(
        "/v1/studio/projects",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsStudioCreateProjectRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-project
  const studioGetProject = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioGetProjectRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioProjectExtended> => {
      return makeJsonRequest<ElevenLabsStudioProjectExtended>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(projectId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsStudioGetProjectRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/edit-project
  const studioUpdateProject = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioUpdateProjectRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioEditProjectResponse> => {
      return makeJsonRequest<ElevenLabsStudioEditProjectResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(projectId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioUpdateProjectRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/studio/projects/{projectId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/delete-project
  const studioDeleteProject = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioDeleteProjectResponse> => {
      return makeJsonRequest<ElevenLabsStudioDeleteProjectResponse>(
        "DELETE",
        `/v1/studio/projects/${encodeURIComponent(projectId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/convert
  // Docs: https://elevenlabs.io/docs/api-reference/studio/convert-project
  const studioConvertProject = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioConvertProjectResponse> => {
      return makeJsonRequest<ElevenLabsStudioConvertProjectResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/convert`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/content
  // Docs: https://elevenlabs.io/docs/api-reference/studio/edit-project-content
  const studioUpdateProjectContent = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioUpdateProjectContentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioEditProjectResponse> => {
      const form = new FormData();
      appendStudioForm(form, req);
      return makeMultipartJsonRequest<ElevenLabsStudioEditProjectResponse>(
        `/v1/studio/projects/${encodeURIComponent(projectId)}/content`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsStudioUpdateProjectContentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/muted-tracks
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-project-muted-tracks
  const studioGetMutedTracks = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioMutedTracksResponse> => {
      return makeJsonRequest<ElevenLabsStudioMutedTracksResponse>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/muted-tracks`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/pronunciation-dictionaries
  // Docs: https://elevenlabs.io/docs/api-reference/studio/create-pronunciation-dictionaries
  const studioCreatePronunciationDictionaries = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioCreatePronunciationDictionariesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioCreatePronunciationDictionariesResponse> => {
      return makeJsonRequest<ElevenLabsStudioCreatePronunciationDictionariesResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/pronunciation-dictionaries`,
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioCreatePronunciationDictionariesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-project-snapshots
  const studioListProjectSnapshots = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioListProjectSnapshotsResponse> => {
      return makeJsonRequest<ElevenLabsStudioListProjectSnapshotsResponse>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/snapshots`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-project-snapshot
  const studioGetProjectSnapshot = Object.assign(
    async (
      projectId: string,
      snapshotId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioProjectSnapshotExtended> => {
      return makeJsonRequest<ElevenLabsStudioProjectSnapshotExtended>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/snapshots/${encodeURIComponent(snapshotId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/studio/stream-project-audio
  const studioStreamProjectSnapshot = Object.assign(
    async (
      projectId: string,
      snapshotId: string,
      req: ElevenLabsStudioStreamAudioRequest = {},
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest(
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/snapshots/${encodeURIComponent(snapshotId)}/stream`,
        req,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsStudioStreamAudioRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}/archive
  // Docs: https://elevenlabs.io/docs/api-reference/studio/archive-project-snapshot
  const studioArchiveProjectSnapshot = Object.assign(
    async (
      projectId: string,
      snapshotId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest(
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/snapshots/${encodeURIComponent(snapshotId)}/archive`,
        undefined,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-chapters
  const studioListChapters = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioListChaptersResponse> => {
      return makeJsonRequest<ElevenLabsStudioListChaptersResponse>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/chapters`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters
  // Docs: https://elevenlabs.io/docs/api-reference/studio/create-chapter
  const studioCreateChapter = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsStudioCreateChapterRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioAddChapterResponse> => {
      return makeJsonRequest<ElevenLabsStudioAddChapterResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(projectId)}/chapters`,
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioCreateChapterRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-chapter
  const studioGetChapter = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioChapterWithContent> => {
      return makeJsonRequest<ElevenLabsStudioChapterWithContent>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/edit-chapter
  const studioUpdateChapter = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      req: ElevenLabsStudioUpdateChapterRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioEditChapterResponse> => {
      return makeJsonRequest<ElevenLabsStudioEditChapterResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsStudioUpdateChapterRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/delete-chapter
  const studioDeleteChapter = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioDeleteChapterResponse> => {
      return makeJsonRequest<ElevenLabsStudioDeleteChapterResponse>(
        "DELETE",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/convert
  // Docs: https://elevenlabs.io/docs/api-reference/studio/convert-chapter
  const studioConvertChapter = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioConvertChapterResponse> => {
      return makeJsonRequest<ElevenLabsStudioConvertChapterResponse>(
        "POST",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}/convert`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-chapter-snapshots
  const studioListChapterSnapshots = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioListChapterSnapshotsResponse> => {
      return makeJsonRequest<ElevenLabsStudioListChapterSnapshotsResponse>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(chapterId)}/snapshots`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots/{chapterSnapshotId}
  // Docs: https://elevenlabs.io/docs/api-reference/studio/get-chapter-snapshot
  const studioGetChapterSnapshot = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      chapterSnapshotId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStudioChapterSnapshotExtended> => {
      return makeJsonRequest<ElevenLabsStudioChapterSnapshotExtended>(
        "GET",
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(
          chapterId
        )}/snapshots/${encodeURIComponent(chapterSnapshotId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots/{chapterSnapshotId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/studio/stream-chapter-audio
  const studioStreamChapterSnapshot = Object.assign(
    async (
      projectId: string,
      chapterId: string,
      chapterSnapshotId: string,
      req: ElevenLabsStudioStreamAudioRequest = {},
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest(
        `/v1/studio/projects/${encodeURIComponent(
          projectId
        )}/chapters/${encodeURIComponent(
          chapterId
        )}/snapshots/${encodeURIComponent(chapterSnapshotId)}/stream`,
        req,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsStudioStreamAudioRequestSchema }
  );

  const studio = {
    podcasts: {
      create: studioCreatePodcast,
    },
    projects: {
      list: studioListProjects,
      create: studioCreateProject,
      get: studioGetProject,
      update: studioUpdateProject,
      delete: studioDeleteProject,
      convert: studioConvertProject,
      content: {
        update: studioUpdateProjectContent,
      },
      mutedTracks: {
        get: studioGetMutedTracks,
      },
      pronunciationDictionaries: {
        create: studioCreatePronunciationDictionaries,
      },
      snapshots: {
        list: studioListProjectSnapshots,
        get: studioGetProjectSnapshot,
        stream: studioStreamProjectSnapshot,
        archive: studioArchiveProjectSnapshot,
      },
      chapters: {
        list: studioListChapters,
        create: studioCreateChapter,
        get: studioGetChapter,
        update: studioUpdateChapter,
        delete: studioDeleteChapter,
        convert: studioConvertChapter,
        snapshots: {
          list: studioListChapterSnapshots,
          get: studioGetChapterSnapshot,
          stream: studioStreamChapterSnapshot,
        },
      },
    },
  };

  // POST https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-speech/stream
  const speechToSpeechStream = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsSpeechToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });

      const form = new FormData();
      for (const [key, value] of Object.entries(body)) {
        appendFormField(form, key, value);
      }

      return makeMultipartBinaryRequest(
        `/v1/speech-to-speech/${encodeURIComponent(voiceId)}/stream`,
        form,
        query,
        signal
      );
    },
    { schema: ElevenLabsSpeechToSpeechRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-speech/convert
  const speechToSpeech = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsSpeechToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });

      const form = new FormData();
      for (const [key, value] of Object.entries(body)) {
        appendFormField(form, key, value);
      }

      return makeMultipartBinaryRequest(
        `/v1/speech-to-speech/${encodeURIComponent(voiceId)}`,
        form,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsSpeechToSpeechRequestSchema,
      stream: speechToSpeechStream,
    }
  );

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

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/verification
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/request
  const pvcManualVerification = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcManualVerificationRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcManualVerificationResponse> => {
      const form = new FormData();
      for (const file of req.files) {
        form.append("files", file);
      }
      appendFormField(form, "extra_text", req.extra_text);

      return makeMultipartJsonRequest<ElevenLabsPvcManualVerificationResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/verification`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsPvcManualVerificationRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/user
  // Docs: https://elevenlabs.io/docs/api-reference/user/get
  const getUser = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsUserResponse> => {
      return makeJsonRequest<ElevenLabsUserResponse>(
        "GET",
        "/v1/user",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/user/subscription
  // Docs: https://elevenlabs.io/docs/api-reference/user/subscription/get
  const userSubscription = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsUserSubscriptionResponse> => {
      const subscription = await makeJsonRequest<ElevenLabsSubscriptionPayload>(
        "GET",
        "/v1/user/subscription",
        undefined,
        signal
      );

      return {
        ...subscription,
        remaining_character_count: Math.max(
          0,
          subscription.character_limit - subscription.character_count
        ),
      };
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/single-use-token/{tokenType}
  // Docs: https://elevenlabs.io/docs/api-reference/tokens/create
  const singleUseToken = Object.assign(
    async (
      tokenType: ElevenLabsSingleUseTokenType,
      signal?: AbortSignal
    ): Promise<ElevenLabsSingleUseTokenResponse> => {
      return makeJsonRequest<ElevenLabsSingleUseTokenResponse>(
        "POST",
        `/v1/single-use-token/${encodeURIComponent(tokenType)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
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

  // GET https://api.elevenlabs.io/v1/service-accounts
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/list
  const listServiceAccounts = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsServiceAccountsResponse> => {
      return makeJsonRequest<ElevenLabsServiceAccountsResponse>(
        "GET",
        "/v1/service-accounts",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/list
  const listServiceAccountApiKeys = Object.assign(
    async (
      serviceAccountUserId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsServiceAccountApiKeysResponse> => {
      return makeJsonRequest<ElevenLabsServiceAccountApiKeysResponse>(
        "GET",
        `/v1/service-accounts/${encodeURIComponent(serviceAccountUserId)}/api-keys`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/create
  const createServiceAccountApiKey = Object.assign(
    async (
      serviceAccountUserId: string,
      req: ElevenLabsCreateServiceAccountApiKeyRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateServiceAccountApiKeyResponse> => {
      return makeJsonRequest<ElevenLabsCreateServiceAccountApiKeyResponse>(
        "POST",
        `/v1/service-accounts/${encodeURIComponent(serviceAccountUserId)}/api-keys`,
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateServiceAccountApiKeyRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys/{apiKeyId}
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/update
  const updateServiceAccountApiKey = Object.assign(
    async (
      serviceAccountUserId: string,
      apiKeyId: string,
      req: ElevenLabsUpdateServiceAccountApiKeyRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateServiceAccountApiKeyResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsUpdateServiceAccountApiKeyResponse>(
        "PATCH",
        `/v1/service-accounts/${encodeURIComponent(serviceAccountUserId)}/api-keys/${encodeURIComponent(apiKeyId)}`,
        Object.keys(req).length > 0 ? req : undefined,
        signal
      );
    },
    { schema: ElevenLabsUpdateServiceAccountApiKeyRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys/{apiKeyId}
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/delete
  const deleteServiceAccountApiKey = Object.assign(
    async (
      serviceAccountUserId: string,
      apiKeyId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteServiceAccountApiKeyResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteServiceAccountApiKeyResponse>(
        "DELETE",
        `/v1/service-accounts/${encodeURIComponent(serviceAccountUserId)}/api-keys/${encodeURIComponent(apiKeyId)}`,
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

  // GET https://api.elevenlabs.io/v1/history
  // Docs: https://elevenlabs.io/docs/api-reference/history/get-generated-items
  const listHistory = Object.assign(
    async (
      req: ElevenLabsHistoryListRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsHistoryListResponse> => {
      return makeJsonRequest<ElevenLabsHistoryListResponse>(
        "GET",
        "/v1/history",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsHistoryListRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/history/{historyItemId}
  // Docs: https://elevenlabs.io/docs/api-reference/history/get-history-item-by-id
  const getHistoryItem = Object.assign(
    async (
      historyItemId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsHistoryItem> => {
      return makeJsonRequest<ElevenLabsHistoryItem>(
        "GET",
        `/v1/history/${encodeURIComponent(historyItemId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/history/{historyItemId}
  // Docs: https://elevenlabs.io/docs/api-reference/history/delete-history-item
  const deleteHistoryItem = Object.assign(
    async (
      historyItemId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsHistoryDeleteResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsHistoryDeleteResponse>(
        "DELETE",
        `/v1/history/${encodeURIComponent(historyItemId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/history/{historyItemId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/history/get-audio-from-history-item
  const getHistoryItemAudio = Object.assign(
    async (
      historyItemId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/history/${encodeURIComponent(historyItemId)}/audio`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/history/download
  // Docs: https://elevenlabs.io/docs/api-reference/history/download-history-items
  const downloadHistory = Object.assign(
    async (
      req: ElevenLabsHistoryDownloadRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest("/v1/history/download", req, undefined, signal);
    },
    { schema: ElevenLabsHistoryDownloadRequestSchema }
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

  const user = Object.assign(getUser, {
    subscription: userSubscription,
  });
  const pvcSamplesSpeakers = Object.assign(getPvcSampleSpeakers, {
    audio: getSeparatedSpeakerAudio,
  });
  const pvcVoiceSamples = Object.assign(updatePvcVoiceSample, {
    add: addPvcSamples,
    audio: getPvcSampleAudio,
    delete: deletePvcVoiceSample,
    separateSpeakers: startSpeakerSeparation,
    speakers: pvcSamplesSpeakers,
    waveform: getPvcVoiceSampleWaveform,
  });
  const postPvcVoiceSamples = Object.assign(updatePvcVoiceSample, {
    add: addPvcSamples,
    separateSpeakers: startSpeakerSeparation,
  });
  const pvcVoiceCaptchaWithGet = Object.assign(pvcVoiceCaptcha, {
    get: getPvcVoiceCaptcha,
  });
  const pvcVoices = Object.assign(createPvcVoice, {
    edit: editPvcVoice,
    captcha: pvcVoiceCaptchaWithGet,
    samples: pvcVoiceSamples,
    train: pvcTrain,
    verification: pvcManualVerification,
  });
  const postPvcVoices = Object.assign(createPvcVoice, {
    edit: editPvcVoice,
    captcha: pvcVoiceCaptchaWithGet,
    samples: postPvcVoiceSamples,
    train: pvcTrain,
    verification: pvcManualVerification,
  });

  const pronunciationDictionaries = {
    list: listPronunciationDictionaries,
    addFromFile: addPronunciationDictionaryFromFile,
    addFromRules: addPronunciationDictionaryFromRules,
    get: getPronunciationDictionary,
    update: updatePronunciationDictionary,
    addRules: addPronunciationDictionaryRules,
    removeRules: removePronunciationDictionaryRules,
    setRules: setPronunciationDictionaryRules,
    download: downloadPronunciationDictionary,
  };

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
  const usage = {
    characterStats,
  };
  const serviceAccountApiKeys = {
    list: listServiceAccountApiKeys,
    create: createServiceAccountApiKey,
    update: updateServiceAccountApiKey,
    delete: deleteServiceAccountApiKey,
  };
  const serviceAccounts = {
    list: listServiceAccounts,
    apiKeys: serviceAccountApiKeys,
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
  const postServiceAccounts = {
    apiKeys: {
      create: createServiceAccountApiKey,
    },
  };
  const patchWorkspace = {
    webhooks: {
      update: updateWorkspaceWebhook,
    },
    authConnections: {
      update: updateWorkspaceAuthConnection,
    },
  };
  const patchServiceAccounts = {
    apiKeys: {
      update: updateServiceAccountApiKey,
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
  const deleteServiceAccounts = {
    apiKeys: {
      delete: deleteServiceAccountApiKey,
    },
  };
  const v1VoicesAdd = Object.assign(addVoice, {
    schema: ElevenLabsAddVoiceRequestSchema,
    share: addSharedVoice,
  });
  const v1VoiceSettings = Object.assign(getVoiceSettings, {
    default: getDefaultVoiceSettings,
    edit: editVoiceSettings,
  });
  const v1VoiceSamples = {
    delete: deleteVoiceSample,
    audio: getVoiceSampleAudio,
  };
  const v1Voices = Object.assign(getVoice, {
    list: listV1Voices,
    delete: deleteVoice,
    add: v1VoicesAdd,
    edit: editVoice,
    settings: v1VoiceSettings,
    samples: v1VoiceSamples,
    pvc: pvcVoices,
  });
  const v2 = {
    voices,
  };
  const postV1 = {
    pronunciationDictionaries: {
      addFromFile: addPronunciationDictionaryFromFile,
      addFromRules: addPronunciationDictionaryFromRules,
      addRules: addPronunciationDictionaryRules,
      removeRules: removePronunciationDictionaryRules,
      setRules: setPronunciationDictionaryRules,
    },
    soundGeneration,
    audioIsolation,
    audioNative,
    forcedAlignment,
    music,
    speechEngine: {
      create: createSpeechEngine,
    },
    productions: {
      orders: {
        create: createOrder,
        submit: submitOrder,
        items: { upsert: upsertOrderItem },
        media: { register: registerOrderMedia },
      },
    },
    textToSpeech,
    textToDialogue,
    textToVoice,
    singleUseToken,
    speechToText,
    speechToSpeech,
    similarVoices: getSimilarVoices,
    voices: {
      add: v1VoicesAdd,
      edit: editVoice,
      settings: {
        edit: editVoiceSettings,
      },
      pvc: postPvcVoices,
    },
    workspace: postWorkspace,
    workspaces,
    serviceAccounts: postServiceAccounts,
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
    history: {
      download: downloadHistory,
    },
  };
  const patchV1 = {
    pronunciationDictionaries: {
      update: updatePronunciationDictionary,
    },
    speechEngine: {
      update: updateSpeechEngine,
    },
    productions: {
      orders: { update: updateOrder },
    },
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
    workspace: patchWorkspace,
    serviceAccounts: patchServiceAccounts,
  };
  const putV1 = {
    convai: {
      agentTesting: {
        update: updateAgentTest,
      },
    },
  };
  const deleteV1 = {
    audioIsolation: {
      history: {
        delete: deleteAudioIsolationHistoryItem,
      },
    },
    speechEngine: {
      delete: deleteSpeechEngine,
    },
    productions: {
      orders: {
        items: { remove: removeOrderItem },
      },
    },
    voices: {
      delete: deleteVoice,
      samples: {
        delete: deleteVoiceSample,
      },
      pvc: {
        samples: {
          delete: deletePvcVoiceSample,
        },
      },
    },
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
    workspace: deleteWorkspace,
    serviceAccounts: deleteServiceAccounts,
    history: {
      delete: deleteHistoryItem,
    },
  };
  const v1 = {
    pronunciationDictionaries,

    models,
    usage,
    voices: v1Voices,
    sharedVoices: getSharedVoices,
    similarVoices: getSimilarVoices,
    soundGeneration,
    audioIsolation,
    audioNative,
    forcedAlignment,
    music,
    speechEngine,
    productions,
    textToSpeech,
    textToDialogue,
    textToVoice,
    singleUseToken,
    speechToText,
    speechToSpeech,
    dubbing,
    studio,
    user,
    workspace,
    workspaces,
    serviceAccounts,
    convai,
    history: {
      list: listHistory,
      get: getHistoryItem,
      delete: deleteHistoryItem,
      audio: getHistoryItemAudio,
      download: downloadHistory,
    },
  };

  return attachExamples({
    docs,
    v1,
    v2,
    get: {
      docs,
      v1: {
        pronunciationDictionaries: {
          list: listPronunciationDictionaries,
          get: getPronunciationDictionary,
          download: downloadPronunciationDictionary,
        },
        models,
        usage,
        voices: v1Voices,
        sharedVoices: getSharedVoices,
        user,
        audioIsolation: {
          history: {
            list: listAudioIsolationHistory,
          },
        },
        audioNative: {
          settings: getAudioNativeProjectSettings,
        },
        speechEngine: {
          list: listSpeechEngines,
          get: getSpeechEngine,
        },
        productions: {
          orders: {
            list: listOrders,
            get: getOrder,
            deliverables: getOrderDeliverables,
            languages: getOrderLanguages,
            media: { get: getOrderMedia },
          },
        },
        textToVoice: {
          stream: textToVoiceStream,
        },
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
        workspace: getWorkspace,
        serviceAccounts: {
          list: listServiceAccounts,
          apiKeys: {
            list: listServiceAccountApiKeys,
          },
        },
        history: {
          list: listHistory,
          get: getHistoryItem,
          audio: getHistoryItemAudio,
        },
      },
      v2,
    },
    post: { v1: postV1 },
    patch: { v1: patchV1 },
    put: { v1: putV1 },
    delete: { v1: deleteV1 },
  });
}
