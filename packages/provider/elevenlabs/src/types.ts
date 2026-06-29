import type { z } from "zod";
import type {
  ElevenLabsCreatePvcVoiceRequest,
  ElevenLabsEditPvcVoiceRequest,
  ElevenLabsAddPvcSamplesRequest,
  ElevenLabsGetPvcSampleAudioRequest,
  ElevenLabsGetVoiceRequest,
  ElevenLabsListVoicesRequest,
  ElevenLabsPvcTrainRequest,
  ElevenLabsPvcVoiceCaptchaRequest,
  ElevenLabsPvcManualVerificationRequest,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsSpeechToSpeechRequest,
  ElevenLabsAudioIsolationRequest,
  ElevenLabsAudioIsolationStreamRequest,
  ElevenLabsAudioIsolationHistoryListRequest,
  ElevenLabsAudioNativeCreateProjectRequest,
  ElevenLabsAudioNativeUpdateContentFromUrlRequest,
  ElevenLabsAudioNativeUpdateProjectContentRequest,
  ElevenLabsForcedAlignmentRequest,
  ElevenLabsComposeMusicRequest,
  ElevenLabsComposeMusicDetailedRequest,
  ElevenLabsComposeMusicStreamRequest,
  ElevenLabsMusicPlanRequest,
  ElevenLabsMusicStemSeparationRequest,
  ElevenLabsMusicUploadRequest,
  ElevenLabsVideoToMusicRequest,
  ElevenLabsListSpeechEnginesRequest,
  ElevenLabsCreateSpeechEngineRequest,
  ElevenLabsUpdateSpeechEngineRequest,
  ElevenLabsListOrdersRequest,
  ElevenLabsCreateOrderRequest,
  ElevenLabsUpdateOrderRequest,
  ElevenLabsUpsertOrderItemRequest,
  ElevenLabsRegisterOrderMediaRequest,
  ElevenLabsUpdatePvcVoiceSampleRequest,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
  ElevenLabsCreateAgentRequest,
  ElevenLabsGetAgentRequest,
  ElevenLabsListAgentsRequest,
  ElevenLabsUpdateAgentRequest,
  ElevenLabsGetAgentWidgetRequest,
  ElevenLabsListAgentBranchesRequest,
  ElevenLabsGetAgentSummariesRequest,
  ElevenLabsDuplicateAgentRequest,
  ElevenLabsPostAgentAvatarRequest,
  ElevenLabsSimulateConversationRequest,
  ElevenLabsGetAgentTopicsRequest,
  ElevenLabsCalculateAgentLlmUsageRequest,
  ElevenLabsCreateAgentDraftRequest,
  ElevenLabsDeleteAgentDraftRequest,
  ElevenLabsCreateAgentDeploymentRequest,
  ElevenLabsCreateAgentBranchRequest,
  ElevenLabsUpdateAgentBranchRequest,
  ElevenLabsMergeAgentBranchRequest,
  ElevenLabsPreviewAgentBranchMergeRequest,
  ElevenLabsGetLiveConversationCountRequest,
  ElevenLabsCreateToolRequest,
  ElevenLabsListToolsRequest,
  ElevenLabsUpdateToolRequest,
  ElevenLabsGetToolDependentAgentsRequest,
  ElevenLabsGetToolExecutionsRequest,
  ElevenLabsCreateMcpServerRequest,
  ElevenLabsUpdateMcpServerRequest,
  ElevenLabsCreateMcpServerToolApprovalRequest,
  ElevenLabsCreateMcpToolConfigOverrideRequest,
  ElevenLabsUpdateMcpToolConfigOverrideRequest,
  ElevenLabsCreateAgentTestRequest,
  ElevenLabsListAgentTestsRequest,
  ElevenLabsUpdateAgentTestRequest,
  ElevenLabsGetAgentTestSummariesRequest,
  ElevenLabsBulkMoveAgentTestsRequest,
  ElevenLabsCreateAgentTestFolderRequest,
  ElevenLabsUpdateAgentTestFolderRequest,
  ElevenLabsDeleteAgentTestFolderRequest,
  ElevenLabsRunAgentTestsRequest,
  ElevenLabsListTestInvocationsRequest,
  ElevenLabsResubmitTestsRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
  ElevenLabsListKnowledgeBaseDocumentsRequest,
  ElevenLabsGetKnowledgeBaseDocumentRequest,
  ElevenLabsDeleteKnowledgeBaseDocumentRequest,
  ElevenLabsGetKnowledgeBaseSummariesRequest,
  ElevenLabsSearchKnowledgeBaseContentRequest,
  ElevenLabsUpdateKnowledgeBaseDocumentRequest,
  ElevenLabsListKnowledgeBaseDocumentChunksRequest,
  ElevenLabsGetKnowledgeBaseDocumentChunkRequest,
  ElevenLabsGetKnowledgeBaseDependentAgentsRequest,
  ElevenLabsUpdateKnowledgeBaseFileDocumentRequest,
  ElevenLabsComputeKnowledgeBaseRagIndexesRequest,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest,
  ElevenLabsCreateKnowledgeBaseFolderRequest,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest,
  ElevenLabsMoveKnowledgeBaseEntityRequest,
  ElevenLabsListConversationsRequest,
  ElevenLabsGetConversationRequest,
  ElevenLabsGetSignedUrlRequest,
  ElevenLabsGetConversationTokenRequest,
  ElevenLabsSmartSearchConversationMessagesRequest,
  ElevenLabsTextSearchConversationMessagesRequest,
  ElevenLabsConversationFeedbackRequest,
  ElevenLabsUploadConversationFileRequest,
  ElevenLabsGetConversationSipMessagesRequest,
  ElevenLabsAssignConversationTagsRequest,
  ElevenLabsRunConversationEvaluationsRequest,
  ElevenLabsCreatePhoneNumberRequest,
  ElevenLabsListPhoneNumbersRequest,
  ElevenLabsUpdatePhoneNumberRequest,
  ElevenLabsTwilioOutboundCallRequest,
  ElevenLabsSipTrunkOutboundCallRequest,
  ElevenLabsCreateVoiceFromPreviewRequest,
  ElevenLabsVoiceDesignRequest,
  ElevenLabsVoiceRemixRequest,
  ElevenLabsListV1VoicesRequest,
  ElevenLabsAddVoiceRequest,
  ElevenLabsEditVoiceRequest,
  ElevenLabsEditVoiceSettingsRequest,
  ElevenLabsAddSharedVoiceRequest,
  ElevenLabsSharedVoicesRequest,
  ElevenLabsSimilarVoicesRequest,
  ElevenLabsHistoryListRequest,
  ElevenLabsHistoryDownloadRequest,
  ElevenLabsListDubbingRequest,
  ElevenLabsCreateDubbingRequest,
  ElevenLabsStudioCreatePodcastRequest,
  ElevenLabsStudioGetProjectRequest,
  ElevenLabsStudioCreateProjectRequest,
  ElevenLabsStudioUpdateProjectRequest,
  ElevenLabsStudioUpdateProjectContentRequest,
  ElevenLabsStudioCreatePronunciationDictionariesRequest,
  ElevenLabsStudioStreamAudioRequest,
  ElevenLabsStudioCreateChapterRequest,
  ElevenLabsStudioUpdateChapterRequest,
  ElevenLabsListPronunciationDictionariesRequest,
  ElevenLabsAddPronunciationDictionaryFromFileRequest,
  ElevenLabsAddPronunciationDictionaryFromRulesRequest,
  ElevenLabsGetPronunciationDictionaryRequest,
  ElevenLabsUpdatePronunciationDictionaryRequest,
  ElevenLabsAddPronunciationDictionaryRulesRequest,
  ElevenLabsRemovePronunciationDictionaryRulesRequest,
  ElevenLabsSetPronunciationDictionaryRulesRequest,
  ElevenLabsDownloadPronunciationDictionaryRequest,
} from "./zod";

export type {
  ElevenLabsOptions,
  ElevenLabsCreatePvcVoiceRequest,
  ElevenLabsCreatePvcVoiceRequestInput,
  ElevenLabsCreatePvcVoiceParsedRequest,
  ElevenLabsEditPvcVoiceRequest,
  ElevenLabsEditPvcVoiceRequestInput,
  ElevenLabsEditPvcVoiceParsedRequest,
  ElevenLabsAddPvcSamplesRequest,
  ElevenLabsAddPvcSamplesRequestInput,
  ElevenLabsAddPvcSamplesParsedRequest,
  ElevenLabsGetPvcSampleAudioRequest,
  ElevenLabsGetPvcSampleAudioRequestInput,
  ElevenLabsGetPvcSampleAudioParsedRequest,
  ElevenLabsGetVoiceRequest,
  ElevenLabsGetVoiceRequestInput,
  ElevenLabsGetVoiceParsedRequest,
  ElevenLabsListV1VoicesRequest,
  ElevenLabsListV1VoicesRequestInput,
  ElevenLabsListV1VoicesParsedRequest,
  ElevenLabsAddVoiceRequest,
  ElevenLabsAddVoiceRequestInput,
  ElevenLabsAddVoiceParsedRequest,
  ElevenLabsEditVoiceRequest,
  ElevenLabsEditVoiceRequestInput,
  ElevenLabsEditVoiceParsedRequest,
  ElevenLabsEditVoiceSettingsRequest,
  ElevenLabsEditVoiceSettingsRequestInput,
  ElevenLabsEditVoiceSettingsParsedRequest,
  ElevenLabsAddSharedVoiceRequest,
  ElevenLabsAddSharedVoiceRequestInput,
  ElevenLabsAddSharedVoiceParsedRequest,
  ElevenLabsSharedVoicesRequest,
  ElevenLabsSharedVoicesRequestInput,
  ElevenLabsSharedVoicesParsedRequest,
  ElevenLabsSimilarVoicesRequest,
  ElevenLabsSimilarVoicesRequestInput,
  ElevenLabsSimilarVoicesParsedRequest,
  ElevenLabsListVoicesRequest,
  ElevenLabsListVoicesRequestInput,
  ElevenLabsListVoicesParsedRequest,
  ElevenLabsPvcTrainRequest,
  ElevenLabsPvcTrainRequestInput,
  ElevenLabsPvcTrainParsedRequest,
  ElevenLabsPvcVoiceCaptchaRequest,
  ElevenLabsPvcVoiceCaptchaRequestInput,
  ElevenLabsPvcVoiceCaptchaParsedRequest,
  ElevenLabsPvcManualVerificationRequest,
  ElevenLabsPvcManualVerificationRequestInput,
  ElevenLabsPvcManualVerificationParsedRequest,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsSoundGenerationRequestInput,
  ElevenLabsSoundGenerationParsedRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToDialogueRequestInput,
  ElevenLabsTextToDialogueParsedRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsTextToSpeechRequestInput,
  ElevenLabsTextToSpeechParsedRequest,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsSpeechToTextRequestInput,
  ElevenLabsSpeechToTextParsedRequest,
  ElevenLabsSpeechToSpeechRequest,
  ElevenLabsSpeechToSpeechRequestInput,
  ElevenLabsSpeechToSpeechParsedRequest,
  ElevenLabsAudioIsolationRequest,
  ElevenLabsAudioIsolationRequestInput,
  ElevenLabsAudioIsolationParsedRequest,
  ElevenLabsAudioIsolationStreamRequest,
  ElevenLabsAudioIsolationStreamRequestInput,
  ElevenLabsAudioIsolationStreamParsedRequest,
  ElevenLabsAudioIsolationHistoryListRequest,
  ElevenLabsAudioIsolationHistoryListRequestInput,
  ElevenLabsAudioIsolationHistoryListParsedRequest,
  ElevenLabsAudioNativeCreateProjectRequest,
  ElevenLabsAudioNativeCreateProjectRequestInput,
  ElevenLabsAudioNativeCreateProjectParsedRequest,
  ElevenLabsAudioNativeUpdateContentFromUrlRequest,
  ElevenLabsAudioNativeUpdateContentFromUrlRequestInput,
  ElevenLabsAudioNativeUpdateContentFromUrlParsedRequest,
  ElevenLabsAudioNativeUpdateProjectContentRequest,
  ElevenLabsAudioNativeUpdateProjectContentRequestInput,
  ElevenLabsAudioNativeUpdateProjectContentParsedRequest,
  ElevenLabsForcedAlignmentRequest,
  ElevenLabsForcedAlignmentRequestInput,
  ElevenLabsForcedAlignmentParsedRequest,
  ElevenLabsComposeMusicRequest,
  ElevenLabsComposeMusicRequestInput,
  ElevenLabsComposeMusicParsedRequest,
  ElevenLabsComposeMusicDetailedRequest,
  ElevenLabsComposeMusicDetailedRequestInput,
  ElevenLabsComposeMusicDetailedParsedRequest,
  ElevenLabsComposeMusicStreamRequest,
  ElevenLabsComposeMusicStreamRequestInput,
  ElevenLabsComposeMusicStreamParsedRequest,
  ElevenLabsMusicPlanRequest,
  ElevenLabsMusicPlanRequestInput,
  ElevenLabsMusicPlanParsedRequest,
  ElevenLabsMusicStemSeparationRequest,
  ElevenLabsMusicStemSeparationRequestInput,
  ElevenLabsMusicStemSeparationParsedRequest,
  ElevenLabsMusicUploadRequest,
  ElevenLabsMusicUploadRequestInput,
  ElevenLabsMusicUploadParsedRequest,
  ElevenLabsVideoToMusicRequest,
  ElevenLabsVideoToMusicRequestInput,
  ElevenLabsVideoToMusicParsedRequest,
  ElevenLabsListSpeechEnginesRequest,
  ElevenLabsListSpeechEnginesRequestInput,
  ElevenLabsListSpeechEnginesParsedRequest,
  ElevenLabsCreateSpeechEngineRequest,
  ElevenLabsCreateSpeechEngineRequestInput,
  ElevenLabsCreateSpeechEngineParsedRequest,
  ElevenLabsUpdateSpeechEngineRequest,
  ElevenLabsUpdateSpeechEngineRequestInput,
  ElevenLabsUpdateSpeechEngineParsedRequest,
  ElevenLabsListOrdersRequest,
  ElevenLabsListOrdersRequestInput,
  ElevenLabsListOrdersParsedRequest,
  ElevenLabsCreateOrderRequest,
  ElevenLabsCreateOrderRequestInput,
  ElevenLabsCreateOrderParsedRequest,
  ElevenLabsUpdateOrderRequest,
  ElevenLabsUpdateOrderRequestInput,
  ElevenLabsUpdateOrderParsedRequest,
  ElevenLabsUpsertOrderItemRequest,
  ElevenLabsUpsertOrderItemRequestInput,
  ElevenLabsUpsertOrderItemParsedRequest,
  ElevenLabsRegisterOrderMediaRequest,
  ElevenLabsRegisterOrderMediaRequestInput,
  ElevenLabsRegisterOrderMediaParsedRequest,
  ElevenLabsUpdatePvcVoiceSampleRequest,
  ElevenLabsUpdatePvcVoiceSampleRequestInput,
  ElevenLabsUpdatePvcVoiceSampleParsedRequest,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsRequestsRequestInput,
  ElevenLabsWorkspaceAnalyticsRequestsParsedRequest,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestInput,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeParsedRequest,
  ElevenLabsCreateAgentRequest,
  ElevenLabsCreateAgentRequestInput,
  ElevenLabsCreateAgentParsedRequest,
  ElevenLabsGetAgentRequest,
  ElevenLabsGetAgentRequestInput,
  ElevenLabsGetAgentParsedRequest,
  ElevenLabsListAgentsRequest,
  ElevenLabsListAgentsRequestInput,
  ElevenLabsListAgentsParsedRequest,
  ElevenLabsUpdateAgentRequest,
  ElevenLabsUpdateAgentRequestInput,
  ElevenLabsUpdateAgentParsedRequest,
  ElevenLabsGetAgentWidgetRequest,
  ElevenLabsGetAgentWidgetRequestInput,
  ElevenLabsGetAgentWidgetParsedRequest,
  ElevenLabsListAgentBranchesRequest,
  ElevenLabsListAgentBranchesRequestInput,
  ElevenLabsListAgentBranchesParsedRequest,
  ElevenLabsGetAgentSummariesRequest,
  ElevenLabsGetAgentSummariesRequestInput,
  ElevenLabsGetAgentSummariesParsedRequest,
  ElevenLabsDuplicateAgentRequest,
  ElevenLabsDuplicateAgentRequestInput,
  ElevenLabsDuplicateAgentParsedRequest,
  ElevenLabsPostAgentAvatarRequest,
  ElevenLabsPostAgentAvatarRequestInput,
  ElevenLabsPostAgentAvatarParsedRequest,
  ElevenLabsSimulateConversationRequest,
  ElevenLabsSimulateConversationRequestInput,
  ElevenLabsSimulateConversationParsedRequest,
  ElevenLabsGetAgentTopicsRequest,
  ElevenLabsGetAgentTopicsRequestInput,
  ElevenLabsGetAgentTopicsParsedRequest,
  ElevenLabsCalculateAgentLlmUsageRequest,
  ElevenLabsCalculateAgentLlmUsageRequestInput,
  ElevenLabsCalculateAgentLlmUsageParsedRequest,
  ElevenLabsCreateAgentDraftRequest,
  ElevenLabsCreateAgentDraftRequestInput,
  ElevenLabsCreateAgentDraftParsedRequest,
  ElevenLabsDeleteAgentDraftRequest,
  ElevenLabsDeleteAgentDraftRequestInput,
  ElevenLabsDeleteAgentDraftParsedRequest,
  ElevenLabsCreateAgentDeploymentRequest,
  ElevenLabsCreateAgentDeploymentRequestInput,
  ElevenLabsCreateAgentDeploymentParsedRequest,
  ElevenLabsCreateAgentBranchRequest,
  ElevenLabsCreateAgentBranchRequestInput,
  ElevenLabsCreateAgentBranchParsedRequest,
  ElevenLabsUpdateAgentBranchRequest,
  ElevenLabsUpdateAgentBranchRequestInput,
  ElevenLabsUpdateAgentBranchParsedRequest,
  ElevenLabsMergeAgentBranchRequest,
  ElevenLabsMergeAgentBranchRequestInput,
  ElevenLabsMergeAgentBranchParsedRequest,
  ElevenLabsPreviewAgentBranchMergeRequest,
  ElevenLabsPreviewAgentBranchMergeRequestInput,
  ElevenLabsPreviewAgentBranchMergeParsedRequest,
  ElevenLabsGetLiveConversationCountRequest,
  ElevenLabsGetLiveConversationCountRequestInput,
  ElevenLabsGetLiveConversationCountParsedRequest,
  ElevenLabsCreateToolRequest,
  ElevenLabsCreateToolRequestInput,
  ElevenLabsCreateToolParsedRequest,
  ElevenLabsListToolsRequest,
  ElevenLabsListToolsRequestInput,
  ElevenLabsListToolsParsedRequest,
  ElevenLabsUpdateToolRequest,
  ElevenLabsUpdateToolRequestInput,
  ElevenLabsUpdateToolParsedRequest,
  ElevenLabsGetToolDependentAgentsRequest,
  ElevenLabsGetToolDependentAgentsRequestInput,
  ElevenLabsGetToolDependentAgentsParsedRequest,
  ElevenLabsGetToolExecutionsRequest,
  ElevenLabsGetToolExecutionsRequestInput,
  ElevenLabsGetToolExecutionsParsedRequest,
  ElevenLabsCreateMcpServerRequest,
  ElevenLabsCreateMcpServerRequestInput,
  ElevenLabsCreateMcpServerParsedRequest,
  ElevenLabsUpdateMcpServerRequest,
  ElevenLabsUpdateMcpServerRequestInput,
  ElevenLabsUpdateMcpServerParsedRequest,
  ElevenLabsCreateMcpServerToolApprovalRequest,
  ElevenLabsCreateMcpServerToolApprovalRequestInput,
  ElevenLabsCreateMcpServerToolApprovalParsedRequest,
  ElevenLabsCreateMcpToolConfigOverrideRequest,
  ElevenLabsCreateMcpToolConfigOverrideRequestInput,
  ElevenLabsCreateMcpToolConfigOverrideParsedRequest,
  ElevenLabsUpdateMcpToolConfigOverrideRequest,
  ElevenLabsUpdateMcpToolConfigOverrideRequestInput,
  ElevenLabsUpdateMcpToolConfigOverrideParsedRequest,
  ElevenLabsCreateAgentTestRequest,
  ElevenLabsCreateAgentTestRequestInput,
  ElevenLabsCreateAgentTestParsedRequest,
  ElevenLabsListAgentTestsRequest,
  ElevenLabsListAgentTestsRequestInput,
  ElevenLabsListAgentTestsParsedRequest,
  ElevenLabsUpdateAgentTestRequest,
  ElevenLabsUpdateAgentTestRequestInput,
  ElevenLabsUpdateAgentTestParsedRequest,
  ElevenLabsGetAgentTestSummariesRequest,
  ElevenLabsGetAgentTestSummariesRequestInput,
  ElevenLabsGetAgentTestSummariesParsedRequest,
  ElevenLabsBulkMoveAgentTestsRequest,
  ElevenLabsBulkMoveAgentTestsRequestInput,
  ElevenLabsBulkMoveAgentTestsParsedRequest,
  ElevenLabsCreateAgentTestFolderRequest,
  ElevenLabsCreateAgentTestFolderRequestInput,
  ElevenLabsCreateAgentTestFolderParsedRequest,
  ElevenLabsUpdateAgentTestFolderRequest,
  ElevenLabsUpdateAgentTestFolderRequestInput,
  ElevenLabsUpdateAgentTestFolderParsedRequest,
  ElevenLabsDeleteAgentTestFolderRequest,
  ElevenLabsDeleteAgentTestFolderRequestInput,
  ElevenLabsDeleteAgentTestFolderParsedRequest,
  ElevenLabsRunAgentTestsRequest,
  ElevenLabsRunAgentTestsRequestInput,
  ElevenLabsRunAgentTestsParsedRequest,
  ElevenLabsListTestInvocationsRequest,
  ElevenLabsListTestInvocationsRequestInput,
  ElevenLabsListTestInvocationsParsedRequest,
  ElevenLabsResubmitTestsRequest,
  ElevenLabsResubmitTestsRequestInput,
  ElevenLabsResubmitTestsParsedRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestInput,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlParsedRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestInput,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextParsedRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestInput,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileParsedRequest,
  ElevenLabsListKnowledgeBaseDocumentsRequest,
  ElevenLabsListKnowledgeBaseDocumentsRequestInput,
  ElevenLabsListKnowledgeBaseDocumentsParsedRequest,
  ElevenLabsGetKnowledgeBaseDocumentRequest,
  ElevenLabsGetKnowledgeBaseDocumentRequestInput,
  ElevenLabsGetKnowledgeBaseDocumentParsedRequest,
  ElevenLabsDeleteKnowledgeBaseDocumentRequest,
  ElevenLabsDeleteKnowledgeBaseDocumentRequestInput,
  ElevenLabsDeleteKnowledgeBaseDocumentParsedRequest,
  ElevenLabsGetKnowledgeBaseSummariesRequest,
  ElevenLabsGetKnowledgeBaseSummariesRequestInput,
  ElevenLabsGetKnowledgeBaseSummariesParsedRequest,
  ElevenLabsSearchKnowledgeBaseContentRequest,
  ElevenLabsSearchKnowledgeBaseContentRequestInput,
  ElevenLabsSearchKnowledgeBaseContentParsedRequest,
  ElevenLabsUpdateKnowledgeBaseDocumentRequest,
  ElevenLabsUpdateKnowledgeBaseDocumentRequestInput,
  ElevenLabsUpdateKnowledgeBaseDocumentParsedRequest,
  ElevenLabsListKnowledgeBaseDocumentChunksRequest,
  ElevenLabsListKnowledgeBaseDocumentChunksRequestInput,
  ElevenLabsListKnowledgeBaseDocumentChunksParsedRequest,
  ElevenLabsGetKnowledgeBaseDocumentChunkRequest,
  ElevenLabsGetKnowledgeBaseDocumentChunkRequestInput,
  ElevenLabsGetKnowledgeBaseDocumentChunkParsedRequest,
  ElevenLabsGetKnowledgeBaseDependentAgentsRequest,
  ElevenLabsGetKnowledgeBaseDependentAgentsRequestInput,
  ElevenLabsGetKnowledgeBaseDependentAgentsParsedRequest,
  ElevenLabsUpdateKnowledgeBaseFileDocumentRequest,
  ElevenLabsUpdateKnowledgeBaseFileDocumentRequestInput,
  ElevenLabsUpdateKnowledgeBaseFileDocumentParsedRequest,
  ElevenLabsComputeKnowledgeBaseRagIndexesRequest,
  ElevenLabsComputeKnowledgeBaseRagIndexesRequestInput,
  ElevenLabsComputeKnowledgeBaseRagIndexesParsedRequest,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequestInput,
  ElevenLabsComputeKnowledgeBaseDocumentRagIndexParsedRequest,
  ElevenLabsCreateKnowledgeBaseFolderRequest,
  ElevenLabsCreateKnowledgeBaseFolderRequestInput,
  ElevenLabsCreateKnowledgeBaseFolderParsedRequest,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsRequestInput,
  ElevenLabsBulkMoveKnowledgeBaseDocumentsParsedRequest,
  ElevenLabsMoveKnowledgeBaseEntityRequest,
  ElevenLabsMoveKnowledgeBaseEntityRequestInput,
  ElevenLabsMoveKnowledgeBaseEntityParsedRequest,
  ElevenLabsListConversationsRequest,
  ElevenLabsListConversationsRequestInput,
  ElevenLabsListConversationsParsedRequest,
  ElevenLabsGetConversationRequest,
  ElevenLabsGetConversationRequestInput,
  ElevenLabsGetConversationParsedRequest,
  ElevenLabsGetSignedUrlRequest,
  ElevenLabsGetSignedUrlRequestInput,
  ElevenLabsGetSignedUrlParsedRequest,
  ElevenLabsGetConversationTokenRequest,
  ElevenLabsGetConversationTokenRequestInput,
  ElevenLabsGetConversationTokenParsedRequest,
  ElevenLabsSmartSearchConversationMessagesRequest,
  ElevenLabsSmartSearchConversationMessagesRequestInput,
  ElevenLabsSmartSearchConversationMessagesParsedRequest,
  ElevenLabsTextSearchConversationMessagesRequest,
  ElevenLabsTextSearchConversationMessagesRequestInput,
  ElevenLabsTextSearchConversationMessagesParsedRequest,
  ElevenLabsConversationFeedbackRequest,
  ElevenLabsConversationFeedbackRequestInput,
  ElevenLabsConversationFeedbackParsedRequest,
  ElevenLabsUploadConversationFileRequest,
  ElevenLabsUploadConversationFileRequestInput,
  ElevenLabsUploadConversationFileParsedRequest,
  ElevenLabsGetConversationSipMessagesRequest,
  ElevenLabsGetConversationSipMessagesRequestInput,
  ElevenLabsGetConversationSipMessagesParsedRequest,
  ElevenLabsAssignConversationTagsRequest,
  ElevenLabsAssignConversationTagsRequestInput,
  ElevenLabsAssignConversationTagsParsedRequest,
  ElevenLabsRunConversationEvaluationsRequest,
  ElevenLabsRunConversationEvaluationsRequestInput,
  ElevenLabsRunConversationEvaluationsParsedRequest,
  ElevenLabsCreatePhoneNumberRequest,
  ElevenLabsCreatePhoneNumberRequestInput,
  ElevenLabsCreatePhoneNumberParsedRequest,
  ElevenLabsListPhoneNumbersRequest,
  ElevenLabsListPhoneNumbersRequestInput,
  ElevenLabsListPhoneNumbersParsedRequest,
  ElevenLabsUpdatePhoneNumberRequest,
  ElevenLabsUpdatePhoneNumberRequestInput,
  ElevenLabsUpdatePhoneNumberParsedRequest,
  ElevenLabsTwilioOutboundCallRequest,
  ElevenLabsTwilioOutboundCallRequestInput,
  ElevenLabsTwilioOutboundCallParsedRequest,
  ElevenLabsSipTrunkOutboundCallRequest,
  ElevenLabsSipTrunkOutboundCallRequestInput,
  ElevenLabsSipTrunkOutboundCallParsedRequest,
  ElevenLabsCreateVoiceFromPreviewRequest,
  ElevenLabsCreateVoiceFromPreviewRequestInput,
  ElevenLabsCreateVoiceFromPreviewParsedRequest,
  ElevenLabsVoiceDesignRequest,
  ElevenLabsVoiceDesignRequestInput,
  ElevenLabsVoiceDesignParsedRequest,
  ElevenLabsVoiceRemixRequest,
  ElevenLabsVoiceRemixRequestInput,
  ElevenLabsVoiceRemixParsedRequest,
  ElevenLabsHistoryListRequest,
  ElevenLabsHistoryListRequestInput,
  ElevenLabsHistoryListParsedRequest,
  ElevenLabsHistoryDownloadRequest,
  ElevenLabsHistoryDownloadRequestInput,
  ElevenLabsHistoryDownloadParsedRequest,
  ElevenLabsListDubbingRequest,
  ElevenLabsListDubbingRequestInput,
  ElevenLabsListDubbingParsedRequest,
  ElevenLabsCreateDubbingRequest,
  ElevenLabsCreateDubbingRequestInput,
  ElevenLabsCreateDubbingParsedRequest,
  ElevenLabsStudioCreatePodcastRequest,
  ElevenLabsStudioCreatePodcastRequestInput,
  ElevenLabsStudioCreatePodcastParsedRequest,
  ElevenLabsStudioGetProjectRequest,
  ElevenLabsStudioGetProjectRequestInput,
  ElevenLabsStudioGetProjectParsedRequest,
  ElevenLabsStudioCreateProjectRequest,
  ElevenLabsStudioCreateProjectRequestInput,
  ElevenLabsStudioCreateProjectParsedRequest,
  ElevenLabsStudioUpdateProjectRequest,
  ElevenLabsStudioUpdateProjectRequestInput,
  ElevenLabsStudioUpdateProjectParsedRequest,
  ElevenLabsStudioUpdateProjectContentRequest,
  ElevenLabsStudioUpdateProjectContentRequestInput,
  ElevenLabsStudioUpdateProjectContentParsedRequest,
  ElevenLabsStudioCreatePronunciationDictionariesRequest,
  ElevenLabsStudioCreatePronunciationDictionariesRequestInput,
  ElevenLabsStudioCreatePronunciationDictionariesParsedRequest,
  ElevenLabsStudioStreamAudioRequest,
  ElevenLabsStudioStreamAudioRequestInput,
  ElevenLabsStudioStreamAudioParsedRequest,
  ElevenLabsStudioCreateChapterRequest,
  ElevenLabsStudioCreateChapterRequestInput,
  ElevenLabsStudioCreateChapterParsedRequest,
  ElevenLabsStudioUpdateChapterRequest,
  ElevenLabsStudioUpdateChapterRequestInput,
  ElevenLabsStudioUpdateChapterParsedRequest,
  ElevenLabsListPronunciationDictionariesRequest,
  ElevenLabsListPronunciationDictionariesRequestInput,
  ElevenLabsListPronunciationDictionariesParsedRequest,
  ElevenLabsAddPronunciationDictionaryFromFileRequest,
  ElevenLabsAddPronunciationDictionaryFromFileRequestInput,
  ElevenLabsAddPronunciationDictionaryFromFileParsedRequest,
  ElevenLabsAddPronunciationDictionaryFromRulesRequest,
  ElevenLabsAddPronunciationDictionaryFromRulesRequestInput,
  ElevenLabsAddPronunciationDictionaryFromRulesParsedRequest,
  ElevenLabsGetPronunciationDictionaryRequest,
  ElevenLabsGetPronunciationDictionaryRequestInput,
  ElevenLabsGetPronunciationDictionaryParsedRequest,
  ElevenLabsUpdatePronunciationDictionaryRequest,
  ElevenLabsUpdatePronunciationDictionaryRequestInput,
  ElevenLabsUpdatePronunciationDictionaryParsedRequest,
  ElevenLabsAddPronunciationDictionaryRulesRequest,
  ElevenLabsAddPronunciationDictionaryRulesRequestInput,
  ElevenLabsAddPronunciationDictionaryRulesParsedRequest,
  ElevenLabsRemovePronunciationDictionaryRulesRequest,
  ElevenLabsRemovePronunciationDictionaryRulesRequestInput,
  ElevenLabsRemovePronunciationDictionaryRulesParsedRequest,
  ElevenLabsSetPronunciationDictionaryRulesRequest,
  ElevenLabsSetPronunciationDictionaryRulesRequestInput,
  ElevenLabsSetPronunciationDictionaryRulesParsedRequest,
  ElevenLabsDownloadPronunciationDictionaryRequest,
  ElevenLabsDownloadPronunciationDictionaryRequestInput,
  ElevenLabsDownloadPronunciationDictionaryParsedRequest,
  ElevenLabsPronunciationDictionaryAliasRuleRequest,
  ElevenLabsPronunciationDictionaryAliasRuleRequestInput,
  ElevenLabsPronunciationDictionaryAliasRuleParsedRequest,
  ElevenLabsPronunciationDictionaryPhonemeRuleRequest,
  ElevenLabsPronunciationDictionaryPhonemeRuleRequestInput,
  ElevenLabsPronunciationDictionaryPhonemeRuleParsedRequest,
  ElevenLabsPronunciationDictionaryRuleRequest,
  ElevenLabsPronunciationDictionaryRuleRequestInput,
  ElevenLabsPronunciationDictionaryRuleParsedRequest,
} from "./zod";

// -- Error -------------------------------------------------------------------

export class ElevenLabsError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "ElevenLabsError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- Speech-to-Text response shapes ------------------------------------------

export type ElevenLabsTranscriptWordType = "word" | "spacing" | "audio_event";

export interface ElevenLabsTranscriptCharacter {
  text: string;
  start: number;
  end: number;
}

export interface ElevenLabsTranscriptWord {
  text: string;
  start: number;
  end: number;
  type: ElevenLabsTranscriptWordType;
  speaker_id: string | null;
  logprob?: number;
  characters?: ElevenLabsTranscriptCharacter[];
}

export interface ElevenLabsTranscriptAdditionalFormat {
  requested_format: string;
  file_extension: string;
  content_type: string;
  is_base64_encoded: boolean;
  content: string;
}

export interface ElevenLabsTranscriptEntity {
  text: string;
  entity_type: string;
  start_char: number;
  end_char: number;
}

export interface ElevenLabsTranscript {
  language_code: string;
  language_probability: number;
  text: string;
  words: ElevenLabsTranscriptWord[];
  channel_index: number;
  additional_formats?: ElevenLabsTranscriptAdditionalFormat[];
  transcription_id: string | null;
  entities?: ElevenLabsTranscriptEntity[];
  audio_duration_secs: number;
}

export interface ElevenLabsMultichannelTranscript {
  transcripts: ElevenLabsTranscript[];
  transcription_id: string | null;
  audio_duration_secs: number;
}

export interface ElevenLabsWebhookAcknowledgement {
  message: string;
  request_id: string;
  transcription_id: string | null;
}

export type ElevenLabsSpeechToTextResponse =
  | ElevenLabsTranscript
  | ElevenLabsMultichannelTranscript
  | ElevenLabsWebhookAcknowledgement;

export type ElevenLabsGetTranscriptResponse =
  | ElevenLabsTranscript
  | ElevenLabsMultichannelTranscript;

export type ElevenLabsDeleteTranscriptResponse = Record<string, unknown>;

// -- Dubbing response shapes -------------------------------------------------

export interface ElevenLabsDubbingMediaMetadata {
  content_type: string;
  duration: number;
}

export interface ElevenLabsDubbingMetadata {
  dubbing_id: string;
  name: string;
  status: string;
  source_language: string | null;
  target_languages: string[];
  editable?: boolean;
  created_at: string;
  media_metadata?: ElevenLabsDubbingMediaMetadata | null;
  error?: string | null;
}

export interface ElevenLabsListDubbingResponse {
  dubs: ElevenLabsDubbingMetadata[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ElevenLabsCreateDubbingResponse {
  dubbing_id: string;
  expected_duration_sec: number;
}

export interface ElevenLabsDeleteDubbingResponse {
  status: string;
}

export interface ElevenLabsDubbingTranscriptUtterance {
  text: string;
  speaker_id: string;
  start_s: number;
  end_s: number;
  words: Record<string, unknown>[];
}

export interface ElevenLabsDubbingTranscript {
  language: string;
  utterances: ElevenLabsDubbingTranscriptUtterance[];
}

export interface ElevenLabsDubbingTranscriptsResponse {
  transcript_format: "srt" | "webvtt" | "json";
  srt?: string | null;
  webvtt?: string | null;
  json?: ElevenLabsDubbingTranscript | null;
}

// -- Studio / Projects response shapes ---------------------------------------

export interface ElevenLabsStudioProject {
  project_id: string;
  name: string;
  create_date_unix: number;
  created_by_user_id: string | null;
  default_title_voice_ref_id: string;
  default_paragraph_voice_ref_id: string;
  default_model_id: string;
  last_conversion_date_unix?: number | null;
  can_be_downloaded: boolean;
  title?: string | null;
  author?: string | null;
  description?: string | null;
  genres?: string[] | null;
  cover_image_url?: string | null;
  target_audience?: string | null;
  language?: string | null;
  content_type?: string | null;
  original_publication_date?: string | null;
  mature_content?: boolean | null;
  isbn_number?: string | null;
  volume_normalization: boolean;
  state: "creating" | "default" | "converting" | "in_queue";
  access_level: "admin" | "editor" | "commenter" | "viewer";
  fiction?: string | null;
  quality_check_on: boolean;
  quality_check_on_when_bulk_convert: boolean;
  creation_meta?: Record<string, unknown> | null;
  source_type?: string | null;
  chapters_enabled?: boolean | null;
  captions_enabled?: boolean | null;
  caption_style?: Record<string, unknown> | null;
  caption_style_template_overrides?: Record<string, unknown> | null;
  public_share_id?: string | null;
  aspect_ratio?: string | null;
  agent_settings?: Record<string, unknown> | null;
  default_title_voice_id: string;
  default_paragraph_voice_id: string;
}

export interface ElevenLabsStudioProjectExtended extends ElevenLabsStudioProject {
  quality_preset?: string;
  chapters?: ElevenLabsStudioChapter[];
  pronunciation_dictionary_versions?: Record<string, unknown>[];
  pronunciation_dictionary_locators?: Record<string, unknown>[];
  voices?: Record<string, unknown>[];
  base_voices?: Record<string, unknown>[];
  assets?: Record<string, unknown>[];
  experimental?: Record<string, unknown> | null;
  publishing_read?: Record<string, unknown> | null;
}

export interface ElevenLabsStudioListProjectsResponse {
  projects: ElevenLabsStudioProject[];
}

export interface ElevenLabsStudioAddProjectResponse {
  project: ElevenLabsStudioProject;
}

export interface ElevenLabsStudioEditProjectResponse {
  project: ElevenLabsStudioProject;
}

export interface ElevenLabsStudioCreatePodcastResponse {
  project: ElevenLabsStudioProject;
}

export interface ElevenLabsStudioDeleteProjectResponse {
  status: string;
}

export interface ElevenLabsStudioConvertProjectResponse {
  status: string;
}

export interface ElevenLabsStudioCreatePronunciationDictionariesResponse {
  status: string;
}

export interface ElevenLabsStudioMutedTracksResponse {
  chapter_ids: string[];
}

export interface ElevenLabsStudioProjectSnapshot {
  project_snapshot_id: string;
  project_id: string;
  created_at_unix: number;
  name: string;
  audio_upload?: Record<string, unknown> | null;
  zip_upload?: Record<string, unknown> | null;
}

export interface ElevenLabsStudioProjectSnapshotExtended extends ElevenLabsStudioProjectSnapshot {
  character_alignments: Record<string, unknown>[];
  audio_duration_secs: number;
}

export interface ElevenLabsStudioListProjectSnapshotsResponse {
  snapshots: ElevenLabsStudioProjectSnapshot[];
}

export interface ElevenLabsStudioChapter {
  chapter_id: string;
  name: string;
  last_conversion_date_unix?: number | null;
  conversion_progress?: number | null;
  can_be_downloaded: boolean;
  state: "default" | "converting";
  has_video?: boolean | null;
  has_visual_content?: boolean | null;
  voice_ids?: string[] | null;
  statistics?: Record<string, unknown> | null;
  last_conversion_error?: string | null;
}

export interface ElevenLabsStudioChapterWithContent extends ElevenLabsStudioChapter {
  content: Record<string, unknown>;
}

export interface ElevenLabsStudioListChaptersResponse {
  chapters: ElevenLabsStudioChapter[];
}

export interface ElevenLabsStudioAddChapterResponse {
  chapter: ElevenLabsStudioChapterWithContent;
}

export interface ElevenLabsStudioEditChapterResponse {
  chapter: ElevenLabsStudioChapterWithContent;
}

export interface ElevenLabsStudioDeleteChapterResponse {
  status: string;
}

export interface ElevenLabsStudioConvertChapterResponse {
  status: string;
}

export interface ElevenLabsStudioChapterSnapshot {
  chapter_snapshot_id: string;
  project_id: string;
  chapter_id: string;
  created_at_unix: number;
  name: string;
}

export interface ElevenLabsStudioChapterSnapshotExtended extends ElevenLabsStudioChapterSnapshot {
  character_alignments: Record<string, unknown>[];
}

export interface ElevenLabsStudioListChapterSnapshotsResponse {
  snapshots: ElevenLabsStudioChapterSnapshot[];
}

// -- Voice response shapes ---------------------------------------------------

export interface ElevenLabsVoicePreview {
  audio_base_64: string;
  generated_voice_id: string;
  media_type: string;
  duration_secs: number;
  language: string | null;
}

export interface ElevenLabsVoicePreviewsResponse {
  previews: ElevenLabsVoicePreview[];
  text: string;
}

export type ElevenLabsSpeakerSeparationStatus =
  | "not_started"
  | "pending"
  | "completed"
  | "failed";

export interface ElevenLabsUtterance {
  start: number;
  end: number;
}

export interface ElevenLabsSpeaker {
  speaker_id: string;
  duration_secs: number;
  utterances?: ElevenLabsUtterance[] | null;
}

export interface ElevenLabsSpeakerSeparation {
  voice_id: string;
  sample_id: string;
  status: ElevenLabsSpeakerSeparationStatus;
  speakers?: Record<string, ElevenLabsSpeaker> | null;
  selected_speaker_ids?: string[] | null;
}

export interface ElevenLabsVoiceSample {
  sample_id?: string;
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
  hash?: string;
  duration_secs?: number | null;
  remove_background_noise?: boolean | null;
  has_isolated_audio?: boolean | null;
  has_isolated_audio_preview?: boolean | null;
  speaker_separation?: ElevenLabsSpeakerSeparation | null;
  trim_start?: number | null;
  trim_end?: number | null;
}

export type ElevenLabsVoiceCategory =
  | "generated"
  | "cloned"
  | "premade"
  | "professional"
  | "famous"
  | "high_quality";

export type ElevenLabsFineTuningState =
  | "not_started"
  | "queued"
  | "fine_tuning"
  | "fine_tuned"
  | "failed"
  | "delayed";

export interface ElevenLabsRecording {
  recording_id: string;
  mime_type: string;
  size_bytes: number;
  upload_date_unix: number;
  transcription: string;
}

export interface ElevenLabsVerificationAttempt {
  text: string;
  date_unix: number;
  accepted: boolean;
  similarity: number;
  levenshtein_distance: number;
  recording?: ElevenLabsRecording | null;
}

export interface ElevenLabsManualVerificationFile {
  file_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  upload_date_unix: number;
}

export interface ElevenLabsManualVerification {
  extra_text: string;
  request_time_unix: number;
  files: ElevenLabsManualVerificationFile[];
}

export interface ElevenLabsFineTuning {
  is_allowed_to_fine_tune?: boolean;
  state?: Record<string, ElevenLabsFineTuningState>;
  verification_failures?: string[];
  verification_attempts_count?: number;
  manual_verification_requested?: boolean;
  language?: string | null;
  progress?: Record<string, number> | null;
  message?: Record<string, string> | null;
  dataset_duration_seconds?: number | null;
  verification_attempts?: ElevenLabsVerificationAttempt[] | null;
  slice_ids?: string[] | null;
  manual_verification?: ElevenLabsManualVerification | null;
  max_verification_attempts?: number | null;
  next_max_verification_attempts_reset_unix_ms?: number | null;
  finetuning_state?: unknown;
}

export interface ElevenLabsVoiceSettings {
  stability?: number | null;
  use_speaker_boost?: boolean | null;
  similarity_boost?: number | null;
  style?: number | null;
  speed?: number | null;
}

export type ElevenLabsVoiceSharingState =
  | "enabled"
  | "disabled"
  | "copied"
  | "copied_disabled";

export type ElevenLabsReviewStatus =
  | "not_requested"
  | "pending"
  | "declined"
  | "allowed"
  | "allowed_with_changes";

export interface ElevenLabsVoiceSharingModerationCheck {
  date_checked_unix?: number | null;
  name_value?: string | null;
  name_check?: boolean | null;
  description_value?: string | null;
  description_check?: boolean | null;
  sample_ids?: string[] | null;
  sample_checks?: number[] | null;
  captcha_ids?: string[] | null;
  captcha_checks?: number[] | null;
}

export type ElevenLabsReaderResourceType = "read" | "collection";

export interface ElevenLabsReaderResource {
  resource_type: ElevenLabsReaderResourceType;
  resource_id: string;
}

export interface ElevenLabsVoiceSharing {
  status?: ElevenLabsVoiceSharingState;
  history_item_sample_id?: string | null;
  date_unix?: number;
  whitelisted_emails?: string[];
  public_owner_id?: string;
  original_voice_id?: string;
  financial_rewards_enabled?: boolean;
  free_users_allowed?: boolean;
  live_moderation_enabled?: boolean;
  rate?: number | null;
  fiat_rate?: number | null;
  notice_period?: number;
  disable_at_unix?: number | null;
  voice_mixing_allowed?: boolean;
  featured?: boolean;
  category?: ElevenLabsVoiceCategory;
  reader_app_enabled?: boolean | null;
  image_url?: string | null;
  ban_reason?: string | null;
  liked_by_count?: number;
  cloned_by_count?: number;
  name?: string;
  description?: string | null;
  labels?: Record<string, string>;
  review_status?: ElevenLabsReviewStatus;
  review_message?: string | null;
  enabled_in_library?: boolean;
  instagram_username?: string | null;
  twitter_username?: string | null;
  youtube_username?: string | null;
  tiktok_username?: string | null;
  moderation_check?: ElevenLabsVoiceSharingModerationCheck | null;
  reader_restricted_on?: ElevenLabsReaderResource[] | null;
}

export interface ElevenLabsVerifiedVoiceLanguage {
  language: string;
  model_id: string;
  accent?: string | null;
  locale?: string | null;
  preview_url?: string | null;
}

export type ElevenLabsVoiceSafetyControl =
  | "NONE"
  | "BAN"
  | "CAPTCHA"
  | "ENTERPRISE_BAN"
  | "ENTERPRISE_CAPTCHA";

export interface ElevenLabsVoiceVerification {
  requires_verification: boolean;
  is_verified: boolean;
  verification_failures: string[];
  verification_attempts_count: number;
  language?: string | null;
  verification_attempts?: ElevenLabsVerificationAttempt[] | null;
}

export type ElevenLabsRecordingQuality =
  | "studio"
  | "good"
  | "ok"
  | "poor"
  | "bad";

export type ElevenLabsLabellingStatus = "in_review" | "review_complete";

export interface ElevenLabsVoice {
  voice_id: string;
  name?: string;
  samples?: ElevenLabsVoiceSample[] | null;
  category?: ElevenLabsVoiceCategory;
  fine_tuning?: ElevenLabsFineTuning | null;
  labels?: Record<string, string>;
  description?: string | null;
  preview_url?: string | null;
  available_for_tiers?: string[];
  settings?: ElevenLabsVoiceSettings | null;
  sharing?: ElevenLabsVoiceSharing | null;
  high_quality_base_model_ids?: string[];
  verified_languages?: ElevenLabsVerifiedVoiceLanguage[] | null;
  collection_ids?: string[] | null;
  safety_control?: ElevenLabsVoiceSafetyControl | null;
  voice_verification?: ElevenLabsVoiceVerification | null;
  permission_on_resource?: string | null;
  is_owner?: boolean | null;
  is_legacy?: boolean;
  is_mixed?: boolean;
  favorited_at_unix?: number | null;
  created_at_unix?: number | null;
  is_bookmarked?: boolean | null;
  recording_quality?: ElevenLabsRecordingQuality | null;
  labelling_status?: ElevenLabsLabellingStatus | null;
  recording_quality_reason?: string | null;
}

export interface ElevenLabsListVoicesResponse {
  voices: ElevenLabsVoice[];
  has_more: boolean;
  total_count: number;
  next_page_token?: string | null;
}

export interface ElevenLabsListV1VoicesResponse {
  voices: ElevenLabsVoice[];
}

export interface ElevenLabsDeleteVoiceResponse {
  status: string;
}

export interface ElevenLabsAddVoiceResponse {
  voice_id: string;
  requires_verification: boolean;
}

export interface ElevenLabsEditVoiceResponse {
  status: string;
}

export interface ElevenLabsEditVoiceSettingsResponse {
  status: string;
}

export interface ElevenLabsAddSharedVoiceResponse {
  voice_id: string;
}

export interface ElevenLabsLibraryVoice {
  public_owner_id: string;
  voice_id: string;
  date_unix: number;
  name: string;
  accent: string;
  gender: string;
  age: string;
  descriptive: string;
  use_case: string;
  category: ElevenLabsVoiceCategory;
  language?: string | null;
  locale?: string | null;
  description?: string | null;
  preview_url?: string | null;
  usage_character_count_1y: number;
  usage_character_count_7d: number;
  play_api_usage_character_count_1y: number;
  cloned_by_count: number;
  rate?: number | null;
  fiat_rate?: number | null;
  free_users_allowed: boolean;
  live_moderation_enabled: boolean;
  featured: boolean;
  verified_languages?: ElevenLabsVerifiedVoiceLanguage[] | null;
  notice_period?: number | null;
  instagram_username?: string | null;
  twitter_username?: string | null;
  youtube_username?: string | null;
  tiktok_username?: string | null;
  image_url?: string | null;
  is_added_by_user?: boolean | null;
  is_bookmarked?: boolean | null;
}

export interface ElevenLabsLibraryVoicesResponse {
  voices: ElevenLabsLibraryVoice[];
  has_more: boolean;
  total_count?: number;
  last_sort_id?: string | null;
}

export interface ElevenLabsPvcManualVerificationResponse {
  status: string;
}

export interface ElevenLabsPvcVoiceCaptchaResponse {
  status: string;
}

export interface ElevenLabsCreatePvcVoiceResponse {
  voice_id: string;
}

export type ElevenLabsGetPvcVoiceCaptchaResponse = Record<string, unknown>;

export interface ElevenLabsSpeakerAudioResponse {
  audio_base_64: string;
  media_type: string;
  duration_secs: number;
}

export interface ElevenLabsUpdatePvcVoiceSampleResponse {
  voice_id: string;
}

export interface ElevenLabsEditPvcVoiceResponse {
  status?: string;
  [key: string]: unknown;
}

export type ElevenLabsAddPvcSamplesResponse = ElevenLabsVoiceSample[];

export interface ElevenLabsVoiceSamplePreviewResponse {
  audio_base_64: string;
  voice_id: string;
  sample_id: string;
  media_type: string;
  duration_secs?: number | null;
}

export interface ElevenLabsPvcVoiceSampleWaveformResponse {
  sample_id: string;
  visual_waveform: number[];
}

export interface ElevenLabsPvcTrainResponse {
  status: string;
}

export interface ElevenLabsDeleteVoiceSampleResponse {
  status: string;
}

// -- Audio Isolation response shapes -----------------------------------------

export interface ElevenLabsAudioIsolationHistoryItem {
  id: string;
  title: string | null;
  created_at_unix: number;
  format: string;
  duration_seconds: number | null;
  download_url: string | null;
  icon_url: string | null;
  source_video_url: string | null;
  supports_video: boolean;
  processing: boolean;
  video_processing_failed: boolean;
  preview_b64: string | null;
}

export interface ElevenLabsAudioIsolationHistoryListResponse {
  items: ElevenLabsAudioIsolationHistoryItem[];
  has_more: boolean;
}

export type ElevenLabsAudioIsolationDeleteHistoryResponse = Record<
  string,
  unknown
>;

// -- Audio Native response shapes -------------------------------------------

export interface ElevenLabsAudioNativeCreateProjectResponse {
  project_id: string;
  converting: boolean;
  html_snippet: string;
}

export interface ElevenLabsAudioNativeEditContentResponse {
  project_id: string;
  converting: boolean;
  publishing: boolean;
  html_snippet: string;
}

export type ElevenLabsAudioNativeProjectStatus = "processing" | "ready";

export interface ElevenLabsAudioNativeProjectSettings {
  title: string;
  image: string;
  author: string;
  small: boolean;
  text_color: string;
  background_color: string;
  sessionization: number;
  audio_path?: string | null;
  audio_url?: string | null;
  status?: ElevenLabsAudioNativeProjectStatus;
}

export interface ElevenLabsAudioNativeProjectSettingsResponse {
  enabled: boolean;
  snapshot_id?: string | null;
  settings?: ElevenLabsAudioNativeProjectSettings | null;
}

// -- Forced alignment response shapes ----------------------------------------

export interface ElevenLabsForcedAlignmentCharacter {
  text: string;
  start: number;
  end: number;
}

export interface ElevenLabsForcedAlignmentWord {
  text: string;
  start: number;
  end: number;
  loss: number;
}

export interface ElevenLabsForcedAlignmentResponse {
  characters: ElevenLabsForcedAlignmentCharacter[];
  words: ElevenLabsForcedAlignmentWord[];
  loss: number;
}

// -- Music response shapes ---------------------------------------------------

export interface ElevenLabsMusicTimeRange {
  start_ms: number;
  end_ms: number;
}

export interface ElevenLabsMusicSectionSource {
  song_id: string;
  range: ElevenLabsMusicTimeRange;
  negative_ranges?: ElevenLabsMusicTimeRange[];
}

export interface ElevenLabsMusicSongSection {
  section_name: string;
  positive_local_styles: string[];
  negative_local_styles: string[];
  duration_ms: number;
  lines: string[];
  source_from?: ElevenLabsMusicSectionSource | null;
}

// Composition plan for the `music_v1` model.
export interface ElevenLabsMusicPrompt {
  positive_global_styles: string[];
  negative_global_styles: string[];
  sections: ElevenLabsMusicSongSection[];
}

export interface ElevenLabsMusicAudioRefChunk {
  song_id: string;
  range: ElevenLabsMusicTimeRange;
}

export interface ElevenLabsMusicGenerationChunk {
  text: string;
  duration_ms: number;
  positive_styles: string[];
  negative_styles?: string[];
  context_adherence?: "low" | "medium" | "high";
  conditioning_ref?: ElevenLabsMusicAudioRefChunk | null;
  condition_strength?: "low" | "medium" | "high" | "xhigh" | null;
}

// Composition plan for the `music_v2` model.
export interface ElevenLabsCompositionPlan {
  chunks: Array<ElevenLabsMusicGenerationChunk | ElevenLabsMusicAudioRefChunk>;
}

export type ElevenLabsMusicCompositionPlan =
  | ElevenLabsMusicPrompt
  | ElevenLabsCompositionPlan;

export type ElevenLabsMusicPlanResponse = ElevenLabsMusicCompositionPlan;

export interface ElevenLabsMusicWordTimestamp {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface ElevenLabsMusicUploadResponse {
  song_id: string;
  composition_plan?: ElevenLabsMusicCompositionPlan | null;
  words_timestamps?: ElevenLabsMusicWordTimestamp[] | null;
}

// -- Speech Engine response shapes ------------------------------------------

export interface ElevenLabsSpeechEngineSecretLocator {
  secret_id: string;
}

export interface ElevenLabsSpeechEngineDynamicVariable {
  variable_name: string;
}

export type ElevenLabsSpeechEngineHeaderValue =
  | string
  | ElevenLabsSpeechEngineSecretLocator
  | ElevenLabsSpeechEngineDynamicVariable;

export interface ElevenLabsSpeechEngineConfig {
  ws_url: string;
  request_headers?: Record<string, ElevenLabsSpeechEngineHeaderValue>;
}

export type ElevenLabsSpeechEngineObjectConfig = Record<string, unknown>;

export interface ElevenLabsSpeechEngineSummary {
  speech_engine_id: string;
  name: string;
  created_at_unix_secs: number;
  tags: string[];
  access_info: ElevenLabsResourceAccessInfo;
}

export interface ElevenLabsListSpeechEnginesResponse {
  speech_engines: ElevenLabsSpeechEngineSummary[];
  has_more: boolean;
  next_cursor?: string | null;
}

export interface ElevenLabsSpeechEngineResponse {
  speech_engine_id: string;
  name: string;
  speech_engine: ElevenLabsSpeechEngineConfig;
  asr: ElevenLabsSpeechEngineObjectConfig;
  tts: ElevenLabsSpeechEngineObjectConfig;
  turn: ElevenLabsSpeechEngineObjectConfig;
  conversation: ElevenLabsSpeechEngineObjectConfig;
  privacy: ElevenLabsSpeechEngineObjectConfig;
  call_limits: ElevenLabsSpeechEngineObjectConfig;
  language: string;
  tags: string[];
  overrides: ElevenLabsSpeechEngineObjectConfig;
  metadata: ElevenLabsAgentMetadata;
  access_info?: ElevenLabsResourceAccessInfo | null;
}

// DELETE returns an empty body (HTTP 204); surface it as an empty record.
export type ElevenLabsDeleteSpeechEngineResponse = Record<string, unknown>;

// -- Productions / Orders response shapes ------------------------------------

export type ElevenLabsOrderState =
  | "open"
  | "submitted"
  | "paid"
  | "accepted"
  | "rejected"
  | "done";

export type ElevenLabsOrderItemKind = "dub" | "subtitles";

export interface ElevenLabsDubOrderItem {
  kind: "dub";
  media_id: string;
  source_language: string;
  destination_languages: string[];
  include_captions: boolean;
  include_source_captions: boolean;
  instructions?: string | null;
  captions_sdh?: boolean | null;
}

export interface ElevenLabsSubtitleCueOptions {
  min_duration_ms?: number;
  max_duration_ms?: number;
  max_lines_per_cue?: number;
  max_chars_per_line?: number;
  max_chars_per_s?: number | null;
  min_gap_between_cues_frames?: number | null;
}

export interface ElevenLabsSubtitleOrderItem {
  kind: "subtitles";
  media_ids: string[];
  source_language: string;
  destination_languages: string[];
  cue_options?: ElevenLabsSubtitleCueOptions;
  sdh?: boolean;
  instructions?: string | null;
}

export type ElevenLabsOrderItem =
  | ElevenLabsDubOrderItem
  | ElevenLabsSubtitleOrderItem;

export interface ElevenLabsOrderQuote {
  amount_usd: number;
}

export interface ElevenLabsOrderItemInfo {
  item_id: string;
  item: ElevenLabsOrderItem;
  quote?: ElevenLabsOrderQuote | null;
}

export interface ElevenLabsOrderSummary {
  order_id: string;
  name: string;
  state: ElevenLabsOrderState;
  total_amount_usd?: number | null;
  sandbox?: boolean;
  submitted_at?: string | null;
  updated_at?: string | null;
}

export interface ElevenLabsListOrdersResponse {
  orders: ElevenLabsOrderSummary[];
}

export interface ElevenLabsCreateOrderResponse {
  order_id: string;
  sandbox?: boolean;
}

export interface ElevenLabsOrderResponse {
  order_id: string;
  name: string;
  state: ElevenLabsOrderState;
  items: ElevenLabsOrderItemInfo[];
  total_amount_usd?: number | null;
  sandbox?: boolean;
  created_at: string;
  submitted_at?: string | null;
  paid_at?: string | null;
  accepted_at?: string | null;
  completed_at?: string | null;
}

export interface ElevenLabsUpdateOrderResponse {
  name: string;
}

export interface ElevenLabsSubmitOrderResponse {
  order_id: string;
  state: ElevenLabsOrderState;
  submitted_at: string;
}

export interface ElevenLabsOrderDeliverable {
  signed_url: string;
  content_type: string;
  name: string;
  version?: number;
}

export interface ElevenLabsOrderDeliverablesResponse {
  deliverables: ElevenLabsOrderDeliverable[];
}

export interface ElevenLabsUpsertOrderItemResponse {
  item_id: string;
  quote?: ElevenLabsOrderQuote | null;
}

export interface ElevenLabsRemoveOrderItemResponse {
  success: boolean;
}

export interface ElevenLabsRegisterOrderMediaResponse {
  media_id: string;
}

export interface ElevenLabsOrderMediaResponse {
  media_id: string;
  name: string;
  content_type: string;
  language?: string | null;
  signed_url: string;
}

export interface ElevenLabsOrderLanguageInfo {
  code: string;
  label: string;
}

export interface ElevenLabsOrderLanguagePairInfo {
  source_language: ElevenLabsOrderLanguageInfo;
  destination_languages: ElevenLabsOrderLanguageInfo[];
}

export interface ElevenLabsPairedLanguagesResponse {
  kind: "pair";
  language_pairs: ElevenLabsOrderLanguagePairInfo[];
}

export interface ElevenLabsSingleLanguagesResponse {
  kind: "single";
  languages: ElevenLabsOrderLanguageInfo[];
}

export type ElevenLabsOrderLanguagesResponse =
  | ElevenLabsPairedLanguagesResponse
  | ElevenLabsSingleLanguagesResponse;

// -- History response shapes -------------------------------------------------

export interface ElevenLabsHistoryFeedback {
  thumbs_up: boolean;
  feedback: string;
  emotions: boolean;
  inaccurate_clone: boolean;
  glitches: boolean;
  audio_quality: boolean;
  other: boolean;
  review_status?: string;
}

export interface ElevenLabsHistoryAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ElevenLabsHistoryAlignments {
  alignment: ElevenLabsHistoryAlignment;
  normalized_alignment: ElevenLabsHistoryAlignment;
}

export interface ElevenLabsDialogueInput {
  text: string;
  voice_id: string;
  voice_name: string;
}

export interface ElevenLabsHistoryItem {
  history_item_id: string;
  request_id?: string | null;
  voice_id?: string | null;
  model_id?: string | null;
  voice_name?: string | null;
  voice_category?: "premade" | "cloned" | "generated" | "professional" | null;
  text?: string | null;
  date_unix: number;
  character_count_change_from: number;
  character_count_change_to: number;
  content_type: string;
  state: "created" | "deleted" | "processing";
  settings?: Record<string, unknown> | null;
  feedback?: ElevenLabsHistoryFeedback | null;
  share_link_id?: string | null;
  source?:
    | "TTS"
    | "STS"
    | "Projects"
    | "PD"
    | "AN"
    | "Dubbing"
    | "PlayAPI"
    | "ConvAI"
    | "VoiceGeneration"
    | "InVPC"
    | "Flows"
    | null;
  alignments?: ElevenLabsHistoryAlignments | null;
  dialogue?: ElevenLabsDialogueInput[] | null;
  output_format?: string | null;
}

export interface ElevenLabsHistoryListResponse {
  history: ElevenLabsHistoryItem[];
  last_history_item_id?: string | null;
  has_more: boolean;
  scanned_until?: number | null;
}

export interface ElevenLabsHistoryDeleteResponse {
  status: string;
}

// -- Model response shapes ---------------------------------------------------

export interface ElevenLabsModelLanguage {
  language_id: string;
  name: string;
}

export interface ElevenLabsModelRates {
  character_cost_multiplier?: number;
  cost_discount_multiplier?: number;
  [key: string]: unknown;
}

export interface ElevenLabsModel {
  model_id: string;
  name: string;
  can_be_finetuned?: boolean;
  can_do_text_to_speech?: boolean;
  can_do_voice_conversion?: boolean;
  can_use_style?: boolean;
  can_use_speaker_boost?: boolean;
  serves_pro_voices?: boolean;
  token_cost_factor?: number;
  description?: string;
  requires_alpha_access?: boolean;
  max_characters_request_free_user?: number;
  max_characters_request_subscribed_user?: number;
  maximum_text_length_per_request?: number;
  languages?: ElevenLabsModelLanguage[];
  model_rates?: ElevenLabsModelRates;
  concurrency_group?: string;
  [key: string]: unknown;
}

export type ElevenLabsListModelsResponse = ElevenLabsModel[];

// -- User/account response shapes -------------------------------------------

export type ElevenLabsSeatType =
  | "workspace_admin"
  | "workspace_member"
  | "workspace_lite_member";

export interface ElevenLabsMoneyAmount {
  amount: string;
  currency: string;
}

export interface ElevenLabsInvoiceDiscount {
  discount_percent_off?: number;
}

export interface ElevenLabsInvoice {
  amount_due_cents?: number;
  discounts?: ElevenLabsInvoiceDiscount[];
  next_payment_attempt_unix?: number;
  payment_intent_status?: string;
  payment_intent_statusses?: string[];
  subtotal_cents?: number;
  tax_cents?: number;
  total_cents?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface ElevenLabsPendingSubscriptionChange {
  type?: string;
  next_invoice?: ElevenLabsInvoice | null;
  [key: string]: unknown;
}

export interface ElevenLabsSubscriptionDetails {
  tier: string;
  character_count: number;
  character_limit: number;
  max_character_limit_extension?: number | null;
  max_credit_limit_extension?: number | "unlimited" | null;
  can_extend_character_limit?: boolean;
  allowed_to_extend_character_limit?: boolean;
  voice_slots_used?: number;
  professional_voice_slots_used?: number;
  voice_limit?: number;
  voice_add_edit_counter?: number;
  professional_voice_limit?: number;
  can_extend_voice_limit?: boolean;
  can_use_instant_voice_cloning?: boolean;
  can_use_professional_voice_cloning?: boolean;
  current_overage?: ElevenLabsMoneyAmount;
  status?: string;
  open_invoices?: ElevenLabsInvoice[];
  has_open_invoices?: boolean;
  next_character_count_reset_unix?: number | null;
  max_voice_add_edits?: number | null;
  currency?: string | null;
  billing_period?: string | null;
  character_refresh_period?: string | null;
  next_invoice?: ElevenLabsInvoice | null;
  pending_change?: ElevenLabsPendingSubscriptionChange | null;
  has_used_starter_coupon_on_account?: boolean;
  has_used_creator_coupon_on_account?: boolean;
  [key: string]: unknown;
}

export interface ElevenLabsSubscription extends ElevenLabsSubscriptionDetails {
  remaining_character_count: number;
}

export type ElevenLabsUserSubscriptionResponse = ElevenLabsSubscription;

export interface ElevenLabsUserResponse {
  user_id: string;
  subscription: ElevenLabsSubscriptionDetails;
  is_new_user: boolean;
  xi_api_key?: string | null;
  can_use_delayed_payment_methods: boolean;
  is_onboarding_completed: boolean;
  is_onboarding_checklist_completed: boolean;
  show_compliance_terms?: boolean;
  first_name?: string | null;
  is_api_key_hashed?: boolean;
  xi_api_key_preview?: string | null;
  referral_link_code?: string | null;
  partnerstack_partner_default_link?: string | null;
  created_at: number;
  seat_type: ElevenLabsSeatType;
  [key: string]: unknown;
}

export type ElevenLabsSingleUseTokenType = "realtime_scribe" | "tts_websocket";

export interface ElevenLabsSingleUseTokenResponse {
  token: string;
  [key: string]: unknown;
}

// -- Docs redirect response shape -------------------------------------------

export interface ElevenLabsDocsRedirectResponse {
  status: number;
  location: string | null;
}

// -- Workspace analytics response shapes ------------------------------------

export type ElevenLabsWorkspaceAnalyticsSortDirection = "asc" | "desc";

export type ElevenLabsWorkspaceAnalyticsFilterOperation =
  | "in"
  | "not_in"
  | "le"
  | "ge"
  | "lt"
  | "gt"
  | "eq"
  | "neq";

export type ElevenLabsWorkspaceAnalyticsColumnType =
  | "String"
  | "Float"
  | "DateTime"
  | "Int"
  | "Bool"
  | "JSON"
  | "Map";

export type ElevenLabsWorkspaceAnalyticsColumnUnit =
  | ""
  | "ms"
  | "s"
  | "min"
  | "duration"
  | "credits"
  | "usd"
  | "eur"
  | "inr"
  | "pln"
  | "ratio"
  | "rating";

export type ElevenLabsWorkspaceAnalyticsCellValue =
  | string
  | number
  | boolean
  | null;

export interface ElevenLabsWorkspaceAnalyticsColumnFilter {
  column: string;
  operation: ElevenLabsWorkspaceAnalyticsFilterOperation;
  values: ElevenLabsWorkspaceAnalyticsCellValue[];
}

export interface ElevenLabsWorkspaceAnalyticsQueryResponse {
  columns: string[];
  column_types: ElevenLabsWorkspaceAnalyticsColumnType[];
  rows: ElevenLabsWorkspaceAnalyticsCellValue[][];
  column_units: (ElevenLabsWorkspaceAnalyticsColumnUnit | null)[];
}

export interface ElevenLabsStartSpeakerSeparationResponse {
  status: string;
}

export type ElevenLabsWorkspaceAnalyticsRequestsResponse =
  ElevenLabsWorkspaceAnalyticsQueryResponse;

// -- Agents Platform (Conversational AI) response shapes ---------------------

export interface ElevenLabsCreateAgentResponse {
  agent_id: string;
}

export interface ElevenLabsAgentMetadata {
  created_at_unix_secs: number;
  updated_at_unix_secs: number;
  [key: string]: unknown;
}

export interface ElevenLabsResourceAccessInfo {
  is_creator: boolean;
  creator_name: string;
  creator_email: string;
  role: string;
  anonymous_access_level_override?: string | null;
  access_source?: string | null;
}

// `conversation_config`, `platform_settings`, and `workflow` are large nested
// config trees; we surface them as opaque records rather than mirroring the
// entire upstream model graph.
export interface ElevenLabsGetAgentResponse {
  agent_id: string;
  name: string;
  conversation_config: Record<string, unknown>;
  metadata: ElevenLabsAgentMetadata;
  platform_settings?: Record<string, unknown> | null;
  phone_numbers?: Record<string, unknown>[];
  whatsapp_accounts?: Record<string, unknown>[];
  workflow?: Record<string, unknown> | null;
  access_info?: ElevenLabsResourceAccessInfo | null;
  tags?: string[];
  version_id?: string | null;
  branch_id?: string | null;
  main_branch_id?: string | null;
  [key: string]: unknown;
}

export interface ElevenLabsAgentSummary {
  agent_id: string;
  name: string;
  tags: string[];
  created_at_unix_secs: number;
  access_info: ElevenLabsResourceAccessInfo;
  last_call_time_unix_secs?: number | null;
  archived?: boolean;
}

export interface ElevenLabsListAgentsResponse {
  agents: ElevenLabsAgentSummary[];
  has_more: boolean;
  next_cursor?: string | null;
}

// DELETE returns an empty body (HTTP 200/204); we surface it as an empty record.
export type ElevenLabsDeleteAgentResponse = Record<string, unknown>;

export interface ElevenLabsGetAgentWidgetResponse {
  agent_id: string;
  widget_config: Record<string, unknown>;
}

export type ElevenLabsConversationTokenPurpose =
  | "signed_url"
  | "shareable_link";

export interface ElevenLabsConversationToken {
  agent_id: string;
  conversation_token: string;
  expiration_time_unix_secs?: number | null;
  conversation_id?: string | null;
  purpose?: ElevenLabsConversationTokenPurpose;
  token_requester_user_id?: string | null;
}

export interface ElevenLabsGetAgentLinkResponse {
  agent_id: string;
  token?: ElevenLabsConversationToken | null;
}

export type ElevenLabsAgentBranchProtectionStatus =
  | "writer_perms_required"
  | "admin_perms_required";

export interface ElevenLabsAgentBranchSummary {
  id: string;
  name: string;
  agent_id: string;
  description: string;
  created_at: number;
  last_committed_at: number;
  is_archived: boolean;
  protection_status: ElevenLabsAgentBranchProtectionStatus;
  access_info?: ElevenLabsResourceAccessInfo | null;
  current_live_percentage: number;
  parent_branch_id?: string | null;
  draft_exists: boolean;
  calls_7d: number;
}

export interface ElevenLabsListAgentBranchesMeta {
  total?: number | null;
  page?: number | null;
  page_size?: number | null;
}

export interface ElevenLabsListAgentBranchesResponse {
  meta: ElevenLabsListAgentBranchesMeta;
  results: ElevenLabsAgentBranchSummary[];
}

export interface ElevenLabsAgentSummaryBatchSuccess {
  status: "success";
  data: ElevenLabsAgentSummary;
}

export interface ElevenLabsBatchFailure {
  status: "failure";
  error_code: number;
  error_status: string;
  error_message: string;
}

export type ElevenLabsAgentSummaryBatchResult =
  | ElevenLabsAgentSummaryBatchSuccess
  | ElevenLabsBatchFailure;

export type ElevenLabsGetAgentSummariesResponse = Record<
  string,
  ElevenLabsAgentSummaryBatchResult
>;

export type ElevenLabsDuplicateAgentResponse = ElevenLabsCreateAgentResponse;

export interface ElevenLabsPostAgentAvatarResponse {
  agent_id: string;
  avatar_url?: string | null;
}

export interface ElevenLabsAgentVersionParents {
  in_branch_parent_id?: string | null;
  out_of_branch_parent_id?: string | null;
  merged_into_branch_id?: string | null;
  merged_from_branch_id?: string | null;
  merged_from_version_id?: string | null;
  rebased_from_version_id?: string | null;
}

export interface ElevenLabsAgentVersionMetadata {
  id: string;
  agent_id: string;
  branch_id: string;
  version_description: string;
  seq_no_in_branch: number;
  time_committed_secs: number;
  parents: ElevenLabsAgentVersionParents;
  access_info?: ElevenLabsResourceAccessInfo | null;
}

export interface ElevenLabsSimulatedConversationResponse {
  simulated_conversation: Record<string, unknown>[];
  analysis: Record<string, unknown>;
}

export interface ElevenLabsAgentTopic {
  topic_id: string;
  label: string;
  description: string;
  conversation_count: number;
  parent_topic_id?: string | null;
  x_2d?: number | null;
  y_2d?: number | null;
}

export interface ElevenLabsGetAgentTopicsResponse {
  topics: ElevenLabsAgentTopic[];
  window_start_unix_secs: number;
  window_end_unix_secs: number;
}

export interface ElevenLabsAgentKnowledgeBaseSizeResponse {
  number_of_pages: number;
}

export interface ElevenLabsAgentLlmUsagePrice {
  llm: string;
  price_per_minute: number;
}

export interface ElevenLabsCalculateAgentLlmUsageResponse {
  llm_prices: ElevenLabsAgentLlmUsagePrice[];
}

export type ElevenLabsAgentDraftResponse = Record<string, unknown>;

export interface ElevenLabsAgentDeploymentRequestItem {
  branch_id: string;
  deployment_strategy: Record<string, unknown>;
}

export interface ElevenLabsAgentDeploymentRequestPayload {
  requests: ElevenLabsAgentDeploymentRequestItem[];
}

export interface ElevenLabsAgentDeploymentResponse {
  traffic_percentage_branch_id_map?: Record<string, number>;
}

export interface ElevenLabsCreateAgentBranchResponse {
  created_branch_id: string;
  created_version_id: string;
}

export interface ElevenLabsAgentBranchBasicInfo {
  id: string;
  name: string;
}

export interface ElevenLabsAgentBranchResponse {
  id: string;
  name: string;
  agent_id: string;
  description: string;
  created_at: number;
  last_committed_at: number;
  is_archived: boolean;
  protection_status?: ElevenLabsAgentBranchProtectionStatus;
  access_info?: ElevenLabsResourceAccessInfo | null;
  current_live_percentage?: number;
  parent_branch?: ElevenLabsAgentBranchBasicInfo | null;
  most_recent_versions?: ElevenLabsAgentVersionMetadata[];
}

export type ElevenLabsAgentBranchMutationResponse = Record<string, unknown>;

export interface ElevenLabsAgentBranchPreviewResponse extends ElevenLabsGetAgentResponse {
  overridden_fields?: string[];
  source_identical_to_target?: boolean;
}

export interface ElevenLabsLiveConversationCountResponse {
  count: number;
}

// -- Agents Platform (Conversational AI) Tests response shapes ---------------

export type ElevenLabsAgentTestType = "llm" | "tool" | "simulation" | "folder";

export interface ElevenLabsAgentTestFolderPathSegment {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface ElevenLabsAgentTestSummary {
  id: string;
  name: string;
  created_at_unix_secs: number;
  last_updated_at_unix_secs: number;
  type: ElevenLabsAgentTestType;
  access_info?: ElevenLabsResourceAccessInfo | null;
  entity_type?: "test" | "folder";
  folder_parent_id?: string | null;
  folder_path?: ElevenLabsAgentTestFolderPathSegment[];
  children_count?: number | null;
  conversation_initiation_source?: string | null;
  [key: string]: unknown;
}

export interface ElevenLabsCreateAgentTestResponse {
  id: string;
}

export interface ElevenLabsListAgentTestsResponse {
  tests: ElevenLabsAgentTestSummary[];
  has_more: boolean;
  next_cursor?: string | null;
}

export interface ElevenLabsAgentTestResponse {
  id: string;
  name: string;
  type?: "llm" | "tool" | "simulation";
  from_conversation_metadata?: Record<string, unknown> | null;
  dynamic_variables?: Record<string, unknown>;
  chat_history?: Record<string, unknown>[];
  conversation_initiation_source?: string | null;
  success_condition?: string | null;
  success_conditions?: string[];
  success_examples?: Record<string, unknown>[];
  failure_examples?: Record<string, unknown>[];
  tool_call_parameters?: Record<string, unknown> | null;
  check_any_tool_matches?: boolean | null;
  simulation_scenario?: string;
  simulation_max_turns?: number;
  simulation_environment?: string | null;
  tool_mock_config?: Record<string, unknown>;
  evaluation_model?: string | Record<string, unknown> | null;
  simulated_user_model?: string | Record<string, unknown> | null;
  [key: string]: unknown;
}

export type ElevenLabsUpdateAgentTestResponse = ElevenLabsAgentTestResponse;

export type ElevenLabsDeleteAgentTestResponse = Record<string, unknown>;

export interface ElevenLabsGetAgentTestSummariesResponse {
  tests: Record<string, ElevenLabsAgentTestSummary>;
}

export type ElevenLabsBulkMoveAgentTestsResponse = Record<string, unknown>;

export interface ElevenLabsCreateAgentTestFolderResponse {
  id: string;
  name: string;
}

export interface ElevenLabsAgentTestFolderResponse extends ElevenLabsCreateAgentTestFolderResponse {
  folder_path?: ElevenLabsAgentTestFolderPathSegment[];
  children_count?: number;
}

export type ElevenLabsUpdateAgentTestFolderResponse =
  ElevenLabsAgentTestFolderResponse;

export type ElevenLabsDeleteAgentTestFolderResponse = Record<string, unknown>;

export interface ElevenLabsTestRunRequestItem {
  test_id: string;
  workflow_node_id?: string | null;
  root_folder_id?: string | null;
  root_folder_name?: string | null;
}

export interface ElevenLabsTestInvocationSummary {
  id: string;
  created_at_unix_secs: number;
  test_run_count: number;
  passed_count: number;
  failed_count: number;
  pending_count: number;
  title: string;
  agent_id?: string | null;
  branch_id?: string | null;
  access_info?: ElevenLabsResourceAccessInfo | null;
  repeat_count?: number;
  [key: string]: unknown;
}

export interface ElevenLabsListTestInvocationsMeta {
  total?: number | null;
  page?: number | null;
  page_size?: number | null;
}

export interface ElevenLabsListTestInvocationsResponse {
  results: ElevenLabsTestInvocationSummary[];
  has_more: boolean;
  meta?: ElevenLabsListTestInvocationsMeta;
  next_cursor?: string | null;
}

export interface ElevenLabsTestRunResponse {
  test_run_id: string;
  test_invocation_id: string;
  agent_id: string;
  status: string;
  test_id: string;
  test_info?: Record<string, unknown> | null;
  branch_id?: string | null;
  workflow_node_id?: string | null;
  agent_responses?: Record<string, unknown>[] | null;
  test_name?: string;
  condition_result?: Record<string, unknown> | null;
  last_updated_at_unix?: number;
  metadata?: Record<string, unknown> | null;
  root_folder_id?: string | null;
  root_folder_name?: string | null;
  environment?: string | null;
  [key: string]: unknown;
}

export interface ElevenLabsTestRunResultSummary {
  test_id: string;
  test_name: string;
  workflow_node_id?: string | null;
  buckets: Record<string, unknown>[];
}

export interface ElevenLabsTestSuiteInvocationResponse {
  id: string;
  test_runs: ElevenLabsTestRunResponse[];
  agent_id?: string | null;
  branch_id?: string | null;
  created_at?: number;
  folder_id?: string | null;
  repeat_count?: number;
  bucketing_status?: "pending" | "completed" | "failed" | null;
  result_groups?: ElevenLabsTestRunResultSummary[];
  [key: string]: unknown;
}

export type ElevenLabsRunAgentTestsResponse =
  ElevenLabsTestSuiteInvocationResponse;

export type ElevenLabsGetTestInvocationResponse =
  ElevenLabsTestSuiteInvocationResponse;

export type ElevenLabsResubmitTestsResponse = Record<string, unknown>;

// -- Agents Platform (Conversational AI) Tools response shapes ---------------

export interface ElevenLabsToolUsageStats {
  total_calls: number;
  avg_latency_secs: number;
  [key: string]: unknown;
}

// `tool_config` is a discriminated union over four tool types (client, webhook,
// system, mcp); `response_mocks` are equally open-ended. We surface them as
// opaque records rather than mirroring the entire upstream model graph.
export interface ElevenLabsToolResponse {
  id: string;
  tool_config: Record<string, unknown>;
  access_info?: ElevenLabsResourceAccessInfo | null;
  usage_stats?: ElevenLabsToolUsageStats | null;
  response_mocks?: Record<string, unknown>[] | null;
  [key: string]: unknown;
}

export type ElevenLabsCreateToolResponse = ElevenLabsToolResponse;

export interface ElevenLabsListToolsResponse {
  tools: ElevenLabsToolResponse[];
  has_more?: boolean;
  next_cursor?: string | null;
}

// DELETE returns an empty body (HTTP 200/204); we surface it as an empty record.
export type ElevenLabsDeleteToolResponse = Record<string, unknown>;

export type ElevenLabsToolDependentAgent =
  ElevenLabsKnowledgeBaseDependentAgent;

export type ElevenLabsToolDependentBranch =
  ElevenLabsKnowledgeBaseDependentBranch;

export interface ElevenLabsGetToolDependentAgentsResponse {
  agents: ElevenLabsToolDependentAgent[];
  branches?: ElevenLabsToolDependentBranch[];
  has_more: boolean;
  next_cursor?: string | null;
  [key: string]: unknown;
}

export interface ElevenLabsToolExecutionResponse {
  id: string;
  tool_id: string;
  tool_request_id: string;
  conversation_id: string;
  agent_id: string;
  branch_id?: string | null;
  timestamp: number;
  latency_secs: number;
  is_error?: boolean;
  request_payload?: string | null;
  response_payload?: string | null;
  error_message?: string | null;
  error_type?: string | null;
  tool_call_details?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ElevenLabsGetToolExecutionsResponse {
  executions: ElevenLabsToolExecutionResponse[];
  has_more: boolean;
  next_cursor?: string | null;
  [key: string]: unknown;
}

// -- Agents Platform (Conversational AI) MCP Servers response shapes ---------

export type ElevenLabsMcpApprovalPolicy =
  | "auto_approve_all"
  | "require_approval_all"
  | "require_approval_per_tool";

export type ElevenLabsMcpToolApprovalPolicy =
  | "auto_approved"
  | "requires_approval";

export type ElevenLabsMcpServerTransport = "SSE" | "STREAMABLE_HTTP";
export type ElevenLabsPreToolSpeechMode = "auto" | "force" | "off";
export type ElevenLabsToolCallSoundType =
  | "typing"
  | "elevator1"
  | "elevator2"
  | "elevator3"
  | "elevator4";
export type ElevenLabsToolCallSoundBehavior = "auto" | "always";
export type ElevenLabsToolExecutionMode =
  | "immediate"
  | "post_tool_speech"
  | "async";

export interface ElevenLabsMcpToolApprovalHash {
  tool_name: string;
  tool_hash: string;
  approval_policy?: ElevenLabsMcpToolApprovalPolicy;
  [key: string]: unknown;
}

export interface ElevenLabsMcpToolConfigOverride {
  tool_name: string;
  force_pre_tool_speech?: boolean | null;
  pre_tool_speech?: ElevenLabsPreToolSpeechMode | null;
  disable_interruptions?: boolean | null;
  tool_call_sound?: ElevenLabsToolCallSoundType | null;
  tool_call_sound_behavior?: ElevenLabsToolCallSoundBehavior | null;
  execution_mode?: ElevenLabsToolExecutionMode | null;
  response_timeout_secs?: number | null;
  assignments?: Record<string, unknown>[] | null;
  input_overrides?: Record<string, Record<string, unknown>> | null;
  response_mocks?: Record<string, unknown>[] | null;
  [key: string]: unknown;
}

export interface ElevenLabsMcpServerConfig {
  approval_policy?: ElevenLabsMcpApprovalPolicy;
  tool_approval_hashes?: ElevenLabsMcpToolApprovalHash[];
  transport?: ElevenLabsMcpServerTransport;
  url: string | Record<string, unknown>;
  secret_token?: Record<string, unknown> | null;
  request_headers?: Record<string, string | Record<string, unknown>>;
  auth_connection?: Record<string, unknown> | null;
  name: string;
  description?: string;
  force_pre_tool_speech?: boolean;
  pre_tool_speech?: ElevenLabsPreToolSpeechMode;
  disable_interruptions?: boolean;
  tool_call_sound?: ElevenLabsToolCallSoundType | null;
  tool_call_sound_behavior?: ElevenLabsToolCallSoundBehavior;
  execution_mode?: ElevenLabsToolExecutionMode;
  response_timeout_secs?: number;
  tool_config_overrides?: ElevenLabsMcpToolConfigOverride[];
  disable_compression?: boolean;
  [key: string]: unknown;
}

export interface ElevenLabsMcpServerMetadata {
  created_at: number;
  owner_user_id?: string | null;
  [key: string]: unknown;
}

export interface ElevenLabsMcpServerResponse {
  id: string;
  config: ElevenLabsMcpServerConfig;
  access_info?: ElevenLabsResourceAccessInfo | null;
  dependent_agents?: Record<string, unknown>[];
  metadata: ElevenLabsMcpServerMetadata;
  [key: string]: unknown;
}

export interface ElevenLabsListMcpServersResponse {
  mcp_servers: ElevenLabsMcpServerResponse[];
  [key: string]: unknown;
}

// DELETE returns a 200 with an unspecified body; tolerate either empty JSON or
// a provider-specific payload.
export type ElevenLabsDeleteMcpServerResponse = Record<string, unknown>;

export interface ElevenLabsMcpToolDefinition {
  name: string;
  title?: string | null;
  description?: string | null;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown> | null;
  icons?: Record<string, unknown>[] | null;
  annotations?: Record<string, unknown> | null;
  _meta?: Record<string, unknown> | null;
  execution?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ElevenLabsListMcpServerToolsResponse {
  success: boolean;
  tools: ElevenLabsMcpToolDefinition[];
  error_message?: string | null;
  [key: string]: unknown;
}

// -- Agents Platform — Knowledge Base response shapes ------------------------

// Each folder-path segment leading from the workspace root to the document's
// parent folder.
export interface ElevenLabsKnowledgeBaseFolderPathSegment {
  id: string;
  [key: string]: unknown;
}

// Shared shape returned by all three create endpoints (url / text / file).
export interface ElevenLabsCreateKnowledgeBaseDocumentResponse {
  id: string;
  name: string;
  folder_path?: ElevenLabsKnowledgeBaseFolderPathSegment[];
  [key: string]: unknown;
}

export type ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse =
  ElevenLabsCreateKnowledgeBaseDocumentResponse;
export type ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse =
  ElevenLabsCreateKnowledgeBaseDocumentResponse;
export type ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse =
  ElevenLabsCreateKnowledgeBaseDocumentResponse;

export interface ElevenLabsKnowledgeBaseDocumentMetadata {
  created_at_unix_secs: number;
  last_updated_at_unix_secs: number;
  size_bytes: number;
  [key: string]: unknown;
}

export type ElevenLabsKnowledgeBaseDocumentType =
  | "file"
  | "url"
  | "text"
  | "folder";

// The list / get responses use a discriminated union over `type` with large,
// type-specific config trees. We surface the common fields and keep the rest as
// an opaque record rather than mirroring the entire upstream model graph.
export interface ElevenLabsKnowledgeBaseDocument {
  id: string;
  name: string;
  type: ElevenLabsKnowledgeBaseDocumentType;
  metadata: ElevenLabsKnowledgeBaseDocumentMetadata;
  supported_usages?: string[];
  access_info?: ElevenLabsResourceAccessInfo | null;
  folder_parent_id?: string | null;
  folder_path?: ElevenLabsKnowledgeBaseFolderPathSegment[];
  dependent_agents?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface ElevenLabsListKnowledgeBaseDocumentsResponse {
  documents: ElevenLabsKnowledgeBaseDocument[];
  has_more: boolean;
  next_cursor?: string | null;
}

// -- Conversations -----------------------------------------------------------

export type ElevenLabsConversationStatus =
  | "initiated"
  | "in-progress"
  | "processing"
  | "done"
  | "failed";

export type ElevenLabsConversationCallSuccessful =
  | "success"
  | "failure"
  | "unknown";

export interface ElevenLabsConversationSentimentAnalysis {
  overall_label: "positive" | "neutral" | "negative";
  overall_sentiment_score: number;
  overall_frustration_score: number;
  min_user_sentiment_score: number;
  max_user_frustration_score: number;
  num_scored_user_turns: number;
  [key: string]: unknown;
}

export interface ElevenLabsConversationSummary {
  agent_id: string;
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  status: ElevenLabsConversationStatus;
  call_successful: ElevenLabsConversationCallSuccessful;
  agent_name?: string | null;
  branch_id?: string | null;
  version_id?: string | null;
  transcript_summary?: string | null;
  call_summary_title?: string | null;
  main_language?: string | null;
  direction?: "inbound" | "outbound" | null;
  rating?: number | null;
  sentiment_analysis?: ElevenLabsConversationSentimentAnalysis | null;
  [key: string]: unknown;
}

export interface ElevenLabsListConversationsResponse {
  conversations: ElevenLabsConversationSummary[];
  has_more: boolean;
  next_cursor?: string | null;
}

export type ElevenLabsGetKnowledgeBaseDocumentResponse =
  ElevenLabsKnowledgeBaseDocument;

// DELETE returns a 200 with an unspecified body; we surface it as a record.
export type ElevenLabsDeleteKnowledgeBaseDocumentResponse = Record<
  string,
  unknown
>;

export interface ElevenLabsKnowledgeBaseBatchFailure {
  status: "failure";
  error_code: number;
  error_status: string;
  error_message: string;
  [key: string]: unknown;
}

export interface ElevenLabsKnowledgeBaseSummaryBatchSuccess {
  status: "success";
  data: ElevenLabsKnowledgeBaseDocument;
  [key: string]: unknown;
}

export type ElevenLabsKnowledgeBaseSummaryBatchResult =
  | ElevenLabsKnowledgeBaseSummaryBatchSuccess
  | ElevenLabsKnowledgeBaseBatchFailure;

export type ElevenLabsGetKnowledgeBaseSummariesResponse = Record<
  string,
  ElevenLabsKnowledgeBaseSummaryBatchResult
>;

export interface ElevenLabsKnowledgeBaseContentSearchResult {
  document: ElevenLabsKnowledgeBaseDocument;
  score: number;
  search_snippet?: Record<string, unknown>[] | null;
  [key: string]: unknown;
}

export interface ElevenLabsSearchKnowledgeBaseContentResponse {
  results: ElevenLabsKnowledgeBaseContentSearchResult[];
  next_cursor?: string | null;
  [key: string]: unknown;
}

export type ElevenLabsUpdateKnowledgeBaseDocumentResponse =
  ElevenLabsKnowledgeBaseDocument;

export type ElevenLabsGetKnowledgeBaseDocumentContentResponse = string;

export interface ElevenLabsKnowledgeBaseDocumentChunk {
  id: string;
  name: string;
  content: string;
  [key: string]: unknown;
}

export interface ElevenLabsListKnowledgeBaseDocumentChunksResponse {
  chunks: ElevenLabsKnowledgeBaseDocumentChunk[];
  next_cursor?: string | null;
  [key: string]: unknown;
}

export type ElevenLabsGetKnowledgeBaseDocumentChunkResponse =
  ElevenLabsKnowledgeBaseDocumentChunk;

export type ElevenLabsKnowledgeBaseDependentType =
  | "direct"
  | "transitive"
  | "all";

export interface ElevenLabsKnowledgeBaseDependentAgent {
  id?: string;
  name?: string;
  type?: "available" | "unknown" | string;
  referenced_resource_ids?: string[];
  created_at_unix_secs?: number;
  access_level?: string;
  [key: string]: unknown;
}

export interface ElevenLabsKnowledgeBaseDependentBranch {
  agent_id: string;
  agent_name: string;
  branch_id: string;
  branch_name: string;
  is_main: boolean;
  [key: string]: unknown;
}

export interface ElevenLabsGetKnowledgeBaseDependentAgentsResponse {
  agents: ElevenLabsKnowledgeBaseDependentAgent[];
  branches?: ElevenLabsKnowledgeBaseDependentBranch[];
  has_more: boolean;
  next_cursor?: string | null;
  [key: string]: unknown;
}

export interface ElevenLabsGetKnowledgeBaseSourceFileUrlResponse {
  signed_url: string;
  [key: string]: unknown;
}

export type ElevenLabsRefreshKnowledgeBaseDocumentResponse =
  ElevenLabsKnowledgeBaseDocument;

export type ElevenLabsUpdateKnowledgeBaseFileDocumentResponse =
  ElevenLabsKnowledgeBaseDocument;

export type ElevenLabsKnowledgeBaseEmbeddingModel =
  | "e5_mistral_7b_instruct"
  | "multilingual_e5_large_instruct";

export type ElevenLabsKnowledgeBaseRagIndexStatus =
  | "new"
  | "created"
  | "processing"
  | "failed"
  | "succeeded"
  | "rag_limit_exceeded"
  | "document_too_small"
  | "cannot_index_folder";

export interface ElevenLabsKnowledgeBaseRagIndexUsage {
  used_bytes: number;
  [key: string]: unknown;
}

export interface ElevenLabsKnowledgeBaseRagIndex {
  id: string;
  model: ElevenLabsKnowledgeBaseEmbeddingModel;
  status: ElevenLabsKnowledgeBaseRagIndexStatus;
  progress_percentage: number;
  document_model_index_usage: ElevenLabsKnowledgeBaseRagIndexUsage;
  [key: string]: unknown;
}

export interface ElevenLabsKnowledgeBaseRagIndexBatchSuccess {
  status: "success";
  data: ElevenLabsKnowledgeBaseRagIndex;
  [key: string]: unknown;
}

export type ElevenLabsKnowledgeBaseRagIndexBatchResult =
  | ElevenLabsKnowledgeBaseRagIndexBatchSuccess
  | ElevenLabsKnowledgeBaseBatchFailure;

export type ElevenLabsComputeKnowledgeBaseRagIndexesResponse = Record<
  string,
  ElevenLabsKnowledgeBaseRagIndexBatchResult
>;

export interface ElevenLabsKnowledgeBaseRagIndexOverviewModel {
  model: ElevenLabsKnowledgeBaseEmbeddingModel;
  used_bytes: number;
  [key: string]: unknown;
}

export interface ElevenLabsGetKnowledgeBaseRagIndexOverviewResponse {
  total_used_bytes: number;
  total_max_bytes: number;
  models: ElevenLabsKnowledgeBaseRagIndexOverviewModel[];
  [key: string]: unknown;
}

export interface ElevenLabsGetKnowledgeBaseDocumentRagIndexesResponse {
  indexes: ElevenLabsKnowledgeBaseRagIndex[];
  [key: string]: unknown;
}

export type ElevenLabsComputeKnowledgeBaseDocumentRagIndexResponse =
  ElevenLabsKnowledgeBaseRagIndex;

export type ElevenLabsDeleteKnowledgeBaseDocumentRagIndexResponse =
  ElevenLabsKnowledgeBaseRagIndex;

export type ElevenLabsCreateKnowledgeBaseFolderResponse =
  ElevenLabsCreateKnowledgeBaseDocumentResponse;

export type ElevenLabsMoveKnowledgeBaseEntityResponse = Record<string, unknown>;

export type ElevenLabsBulkMoveKnowledgeBaseDocumentsResponse = Record<
  string,
  unknown
>;

// The transcript entries and the `metadata`/`analysis`/`conversation_initiation_client_data`
// trees are large, free-form upstream models; we surface the stable top-level
// fields and keep the nested structures as opaque records.
export interface ElevenLabsTranscriptEntry {
  role: string;
  message?: string | null;
  time_in_call_secs?: number | null;
  [key: string]: unknown;
}

export interface ElevenLabsGetConversationResponse {
  conversation_id: string;
  agent_id: string;
  status: ElevenLabsConversationStatus;
  transcript: ElevenLabsTranscriptEntry[];
  metadata: Record<string, unknown>;
  agent_name?: string | null;
  conversation_product?: string;
  user_id?: string | null;
  branch_id?: string | null;
  version_id?: string | null;
  analysis?: Record<string, unknown> | null;
  conversation_initiation_client_data?: Record<string, unknown> | null;
  has_audio?: boolean;
  has_user_audio?: boolean;
  has_response_audio?: boolean;
  tag_ids?: string[];
  [key: string]: unknown;
}

// DELETE returns an empty body (HTTP 200/204); we surface it as an empty record.
export type ElevenLabsDeleteConversationResponse = Record<string, unknown>;

export interface ElevenLabsGetSignedUrlResponse {
  signed_url: string;
  [key: string]: unknown;
}

export interface ElevenLabsGetConversationTokenResponse {
  token: string;
  [key: string]: unknown;
}

export interface ElevenLabsMessagesSearchListMeta {
  total?: number | null;
  page?: number | null;
  page_size?: number | null;
  [key: string]: unknown;
}

export interface ElevenLabsMessagesSearchHighlightSegment {
  value: string;
  is_hit: boolean;
  [key: string]: unknown;
}

export interface ElevenLabsMessagesSearchResult {
  conversation_id: string;
  agent_id: string;
  transcript_index: number;
  chunk_text: string;
  score: number;
  conversation_start_time_unix_secs: number;
  agent_name?: string | null;
  chunk_highlights?: ElevenLabsMessagesSearchHighlightSegment[] | null;
  [key: string]: unknown;
}

export interface ElevenLabsConversationMessagesSearchResponse {
  results: ElevenLabsMessagesSearchResult[];
  has_more: boolean;
  meta?: ElevenLabsMessagesSearchListMeta;
  next_cursor?: string | null;
  [key: string]: unknown;
}

export type ElevenLabsSmartSearchConversationMessagesResponse =
  ElevenLabsConversationMessagesSearchResponse;

export type ElevenLabsTextSearchConversationMessagesResponse =
  ElevenLabsConversationMessagesSearchResponse;

export type ElevenLabsConversationFeedbackResponse = Record<string, unknown>;

export interface ElevenLabsConversationFileResponse {
  file_id: string;
  [key: string]: unknown;
}

export type ElevenLabsUploadConversationFileResponse =
  ElevenLabsConversationFileResponse;

export type ElevenLabsDeleteConversationFileResponse =
  ElevenLabsConversationFileResponse;

export interface ElevenLabsSipLogMessage {
  call_id: string;
  phone_numbers: string[];
  local_address: string;
  remote_address: string;
  transport: string;
  raw_message: string;
  error_message: string;
  direction: "in" | "out";
  created_at_unix_micro: number;
  [key: string]: unknown;
}

export interface ElevenLabsGetConversationSipMessagesResponse {
  sip_messages: ElevenLabsSipLogMessage[];
  next_cursor?: string | null;
  has_more?: boolean;
  [key: string]: unknown;
}

export type ElevenLabsAssignConversationTagsResponse = Record<string, unknown>;

export type ElevenLabsUnassignConversationTagResponse = Record<string, unknown>;

export type ElevenLabsRunConversationAnalysisResponse =
  ElevenLabsGetConversationResponse;

export type ElevenLabsRunConversationEvaluationsResponse =
  ElevenLabsGetConversationResponse;

// -- Phone numbers & outbound calls ------------------------------------------

export type ElevenLabsPhoneNumberProviderType =
  | "twilio"
  | "exotel"
  | "sip_trunk";

// Importing a phone number returns just the new id.
export interface ElevenLabsCreatePhoneNumberResponse {
  phone_number_id: string;
}

export interface ElevenLabsAssignedAgent {
  agent_id: string;
  agent_name: string;
}

// Upstream returns a discriminated union keyed on `provider`; the SIP-trunk
// variant carries extra trunk/livekit config. We surface the common fields
// concretely and keep provider-specific extras as an open index signature.
export interface ElevenLabsPhoneNumber {
  phone_number_id: string;
  phone_number: string;
  label: string;
  provider: ElevenLabsPhoneNumberProviderType;
  assigned_agent?: ElevenLabsAssignedAgent | null;
  supports_inbound?: boolean;
  supports_outbound?: boolean;
  [key: string]: unknown;
}

export type ElevenLabsListPhoneNumbersResponse = ElevenLabsPhoneNumber[];

export type ElevenLabsGetPhoneNumberResponse = ElevenLabsPhoneNumber;

export type ElevenLabsUpdatePhoneNumberResponse = ElevenLabsPhoneNumber;

// DELETE returns an arbitrary success body; surface it as an open record.
export type ElevenLabsDeletePhoneNumberResponse = Record<string, unknown>;

export interface ElevenLabsTwilioOutboundCallResponse {
  success: boolean;
  message: string;
  conversation_id?: string | null;
  callSid?: string | null;
}

export interface ElevenLabsSipTrunkOutboundCallResponse {
  success: boolean;
  message: string;
  conversation_id?: string | null;
  sip_call_id?: string | null;
}

// -- Method interfaces -------------------------------------------------------

export interface ElevenLabsDocsMethod {
  (signal?: AbortSignal): Promise<ElevenLabsDocsRedirectResponse>;
}

export interface ElevenLabsSoundGenerationMethod {
  (
    req: ElevenLabsSoundGenerationRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsSoundGenerationRequest>;
}

export interface ElevenLabsAudioIsolationStreamMethod {
  (
    req: ElevenLabsAudioIsolationStreamRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsAudioIsolationStreamRequest>;
}

export interface ElevenLabsAudioIsolationHistoryListMethod {
  (
    req?: ElevenLabsAudioIsolationHistoryListRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAudioIsolationHistoryListResponse>;
  schema: z.ZodType<ElevenLabsAudioIsolationHistoryListRequest>;
}

export interface ElevenLabsAudioIsolationHistoryDeleteMethod {
  (
    historyItemId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsAudioIsolationDeleteHistoryResponse>;
  schema: undefined;
}

export interface ElevenLabsAudioIsolationHistoryNamespace {
  list: ElevenLabsAudioIsolationHistoryListMethod;
  delete: ElevenLabsAudioIsolationHistoryDeleteMethod;
}

export interface ElevenLabsAudioIsolationMethod {
  (
    req: ElevenLabsAudioIsolationRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsAudioIsolationRequest>;
  stream: ElevenLabsAudioIsolationStreamMethod;
  history: ElevenLabsAudioIsolationHistoryNamespace;
}

export interface ElevenLabsAudioNativeUpdateContentFromUrlMethod {
  (
    req: ElevenLabsAudioNativeUpdateContentFromUrlRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAudioNativeEditContentResponse>;
  schema: z.ZodType<ElevenLabsAudioNativeUpdateContentFromUrlRequest>;
}

export interface ElevenLabsAudioNativeUpdateProjectContentMethod {
  (
    projectId: string,
    req?: ElevenLabsAudioNativeUpdateProjectContentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAudioNativeEditContentResponse>;
  schema: z.ZodType<ElevenLabsAudioNativeUpdateProjectContentRequest>;
}

export interface ElevenLabsAudioNativeProjectSettingsMethod {
  (
    projectId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsAudioNativeProjectSettingsResponse>;
  schema: undefined;
}

export interface ElevenLabsAudioNativeContentNamespace {
  fromUrl: ElevenLabsAudioNativeUpdateContentFromUrlMethod;
  update: ElevenLabsAudioNativeUpdateProjectContentMethod;
}

export interface ElevenLabsAudioNativeMethod {
  (
    req: ElevenLabsAudioNativeCreateProjectRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAudioNativeCreateProjectResponse>;
  schema: z.ZodType<ElevenLabsAudioNativeCreateProjectRequest>;
  content: ElevenLabsAudioNativeContentNamespace;
  settings: ElevenLabsAudioNativeProjectSettingsMethod;
}

export interface ElevenLabsForcedAlignmentMethod {
  (
    req: ElevenLabsForcedAlignmentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsForcedAlignmentResponse>;
  schema: z.ZodType<ElevenLabsForcedAlignmentRequest>;
}

export interface ElevenLabsComposeMusicDetailedMethod {
  (
    req: ElevenLabsComposeMusicDetailedRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsComposeMusicDetailedRequest>;
}

export interface ElevenLabsComposeMusicStreamMethod {
  (
    req: ElevenLabsComposeMusicStreamRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsComposeMusicStreamRequest>;
}

export interface ElevenLabsMusicPlanMethod {
  (
    req: ElevenLabsMusicPlanRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsMusicPlanResponse>;
  schema: z.ZodType<ElevenLabsMusicPlanRequest>;
}

export interface ElevenLabsMusicStemSeparationMethod {
  (
    req: ElevenLabsMusicStemSeparationRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsMusicStemSeparationRequest>;
}

export interface ElevenLabsMusicUploadMethod {
  (
    req: ElevenLabsMusicUploadRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsMusicUploadResponse>;
  schema: z.ZodType<ElevenLabsMusicUploadRequest>;
}

export interface ElevenLabsVideoToMusicMethod {
  (
    req: ElevenLabsVideoToMusicRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsVideoToMusicRequest>;
}

export interface ElevenLabsMusicMethod {
  (
    req: ElevenLabsComposeMusicRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsComposeMusicRequest>;
  detailed: ElevenLabsComposeMusicDetailedMethod;
  plan: ElevenLabsMusicPlanMethod;
  stream: ElevenLabsComposeMusicStreamMethod;
  stemSeparation: ElevenLabsMusicStemSeparationMethod;
  upload: ElevenLabsMusicUploadMethod;
  videoToMusic: ElevenLabsVideoToMusicMethod;
}

export interface ElevenLabsListSpeechEnginesMethod {
  (
    req?: ElevenLabsListSpeechEnginesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListSpeechEnginesResponse>;
  schema: z.ZodType<ElevenLabsListSpeechEnginesRequest>;
}

export interface ElevenLabsCreateSpeechEngineMethod {
  (
    req: ElevenLabsCreateSpeechEngineRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsSpeechEngineResponse>;
  schema: z.ZodType<ElevenLabsCreateSpeechEngineRequest>;
}

export interface ElevenLabsGetSpeechEngineMethod {
  (
    speechEngineId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsSpeechEngineResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdateSpeechEngineMethod {
  (
    speechEngineId: string,
    req: ElevenLabsUpdateSpeechEngineRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsSpeechEngineResponse>;
  schema: z.ZodType<ElevenLabsUpdateSpeechEngineRequest>;
}

export interface ElevenLabsDeleteSpeechEngineMethod {
  (
    speechEngineId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteSpeechEngineResponse>;
  schema: undefined;
}

export interface ElevenLabsSpeechEngineNamespace {
  list: ElevenLabsListSpeechEnginesMethod;
  create: ElevenLabsCreateSpeechEngineMethod;
  get: ElevenLabsGetSpeechEngineMethod;
  update: ElevenLabsUpdateSpeechEngineMethod;
  delete: ElevenLabsDeleteSpeechEngineMethod;
}

export interface ElevenLabsListOrdersMethod {
  (
    req?: ElevenLabsListOrdersRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListOrdersResponse>;
  schema: z.ZodType<ElevenLabsListOrdersRequest>;
}

export interface ElevenLabsCreateOrderMethod {
  (
    req?: ElevenLabsCreateOrderRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateOrderResponse>;
  schema: z.ZodType<ElevenLabsCreateOrderRequest>;
}

export interface ElevenLabsGetOrderMethod {
  (orderId: string, signal?: AbortSignal): Promise<ElevenLabsOrderResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdateOrderMethod {
  (
    orderId: string,
    req: ElevenLabsUpdateOrderRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUpdateOrderResponse>;
  schema: z.ZodType<ElevenLabsUpdateOrderRequest>;
}

export interface ElevenLabsSubmitOrderMethod {
  (
    orderId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsSubmitOrderResponse>;
  schema: undefined;
}

export interface ElevenLabsGetOrderDeliverablesMethod {
  (
    orderId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsOrderDeliverablesResponse>;
  schema: undefined;
}

export interface ElevenLabsUpsertOrderItemMethod {
  (
    orderId: string,
    req: ElevenLabsUpsertOrderItemRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUpsertOrderItemResponse>;
  schema: z.ZodType<ElevenLabsUpsertOrderItemRequest>;
}

export interface ElevenLabsRemoveOrderItemMethod {
  (
    orderId: string,
    itemId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsRemoveOrderItemResponse>;
  schema: undefined;
}

export interface ElevenLabsRegisterOrderMediaMethod {
  (
    orderId: string,
    req: ElevenLabsRegisterOrderMediaRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsRegisterOrderMediaResponse>;
  schema: z.ZodType<ElevenLabsRegisterOrderMediaRequest>;
}

export interface ElevenLabsGetOrderMediaMethod {
  (
    orderId: string,
    mediaId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsOrderMediaResponse>;
  schema: undefined;
}

export interface ElevenLabsGetOrderLanguagesMethod {
  (
    orderItemKind: ElevenLabsOrderItemKind,
    signal?: AbortSignal
  ): Promise<ElevenLabsOrderLanguagesResponse>;
  schema: undefined;
}

export interface ElevenLabsProductionsOrdersItemsNamespace {
  upsert: ElevenLabsUpsertOrderItemMethod;
  remove: ElevenLabsRemoveOrderItemMethod;
}

export interface ElevenLabsProductionsOrdersMediaNamespace {
  register: ElevenLabsRegisterOrderMediaMethod;
  get: ElevenLabsGetOrderMediaMethod;
}

export interface ElevenLabsProductionsOrdersNamespace {
  list: ElevenLabsListOrdersMethod;
  create: ElevenLabsCreateOrderMethod;
  get: ElevenLabsGetOrderMethod;
  update: ElevenLabsUpdateOrderMethod;
  submit: ElevenLabsSubmitOrderMethod;
  deliverables: ElevenLabsGetOrderDeliverablesMethod;
  items: ElevenLabsProductionsOrdersItemsNamespace;
  media: ElevenLabsProductionsOrdersMediaNamespace;
  languages: ElevenLabsGetOrderLanguagesMethod;
}

export interface ElevenLabsProductionsNamespace {
  orders: ElevenLabsProductionsOrdersNamespace;
}

export interface ElevenLabsCharacterAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ElevenLabsAudioWithTimestampsResponse {
  audio_base64: string;
  alignment: ElevenLabsCharacterAlignment | null;
  normalized_alignment: ElevenLabsCharacterAlignment | null;
}

export interface ElevenLabsStreamingAudioChunkWithTimestampsResponse {
  audio_base64: string;
  alignment: ElevenLabsCharacterAlignment | null;
  normalized_alignment: ElevenLabsCharacterAlignment | null;
}

export interface ElevenLabsTextToSpeechStreamWithTimestampsMethod {
  (
    voiceId: string,
    req: ElevenLabsTextToSpeechRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStreamingAudioChunkWithTimestampsResponse[]>;
  schema: z.ZodType<ElevenLabsTextToSpeechRequest>;
}

export interface ElevenLabsTextToSpeechStreamMethod {
  (
    voiceId: string,
    req: ElevenLabsTextToSpeechRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsTextToSpeechRequest>;
  withTimestamps: ElevenLabsTextToSpeechStreamWithTimestampsMethod;
}

export interface ElevenLabsTextToSpeechWithTimestampsMethod {
  (
    voiceId: string,
    req: ElevenLabsTextToSpeechRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAudioWithTimestampsResponse>;
  schema: z.ZodType<ElevenLabsTextToSpeechRequest>;
}

export interface ElevenLabsTextToSpeechMethod {
  (
    voiceId: string,
    req: ElevenLabsTextToSpeechRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsTextToSpeechRequest>;
  stream: ElevenLabsTextToSpeechStreamMethod;
  withTimestamps: ElevenLabsTextToSpeechWithTimestampsMethod;
}

export interface ElevenLabsTextToDialogueStreamWithTimestampsMethod {
  (
    req: ElevenLabsTextToDialogueRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStreamingAudioChunkWithTimestampsResponse[]>;
  schema: z.ZodType<ElevenLabsTextToDialogueRequest>;
}

export interface ElevenLabsTextToDialogueStreamMethod {
  (
    req: ElevenLabsTextToDialogueRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsTextToDialogueRequest>;
  withTimestamps: ElevenLabsTextToDialogueStreamWithTimestampsMethod;
}

export interface ElevenLabsTextToDialogueWithTimestampsMethod {
  (
    req: ElevenLabsTextToDialogueRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAudioWithTimestampsResponse>;
  schema: z.ZodType<ElevenLabsTextToDialogueRequest>;
}

export interface ElevenLabsTextToDialogueMethod {
  (
    req: ElevenLabsTextToDialogueRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsTextToDialogueRequest>;
  stream: ElevenLabsTextToDialogueStreamMethod;
  withTimestamps: ElevenLabsTextToDialogueWithTimestampsMethod;
}

export interface ElevenLabsSpeechToTextGetTranscriptMethod {
  (
    transcriptionId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetTranscriptResponse>;
  schema: undefined;
}

export interface ElevenLabsSpeechToTextDeleteTranscriptMethod {
  (
    transcriptionId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteTranscriptResponse>;
  schema: undefined;
}

export interface ElevenLabsSpeechToTextTranscripts {
  get: ElevenLabsSpeechToTextGetTranscriptMethod;
  delete: ElevenLabsSpeechToTextDeleteTranscriptMethod;
}

export interface ElevenLabsSpeechToTextMethod {
  (
    req: ElevenLabsSpeechToTextRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsSpeechToTextResponse>;
  schema: z.ZodType<ElevenLabsSpeechToTextRequest>;
  transcripts: ElevenLabsSpeechToTextTranscripts;
}

export interface ElevenLabsListDubbingMethod {
  (
    req?: ElevenLabsListDubbingRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListDubbingResponse>;
  schema: z.ZodType<ElevenLabsListDubbingRequest>;
}

export interface ElevenLabsCreateDubbingMethod {
  (
    req: ElevenLabsCreateDubbingRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateDubbingResponse>;
  schema: z.ZodType<ElevenLabsCreateDubbingRequest>;
}

export interface ElevenLabsGetDubbingMethod {
  (dubbingId: string, signal?: AbortSignal): Promise<ElevenLabsDubbingMetadata>;
  schema: undefined;
}

export interface ElevenLabsDeleteDubbingMethod {
  (
    dubbingId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteDubbingResponse>;
  schema: undefined;
}

export interface ElevenLabsGetDubbingAudioMethod {
  (
    dubbingId: string,
    languageCode: string,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: undefined;
}

export interface ElevenLabsGetDubbingTranscriptMethod {
  (
    dubbingId: string,
    languageCode: string,
    formatType: "srt" | "webvtt" | "json",
    signal?: AbortSignal
  ): Promise<ElevenLabsDubbingTranscriptsResponse>;
  schema: undefined;
}

export interface ElevenLabsDubbingAudioNamespace {
  get: ElevenLabsGetDubbingAudioMethod;
}

export interface ElevenLabsDubbingTranscriptsNamespace {
  get: ElevenLabsGetDubbingTranscriptMethod;
}

export interface ElevenLabsDubbingNamespace {
  list: ElevenLabsListDubbingMethod;
  create: ElevenLabsCreateDubbingMethod;
  get: ElevenLabsGetDubbingMethod;
  delete: ElevenLabsDeleteDubbingMethod;
  audio: ElevenLabsDubbingAudioNamespace;
  transcripts: ElevenLabsDubbingTranscriptsNamespace;
}

// -- Studio / Projects method + namespace shapes -----------------------------

export interface ElevenLabsStudioCreatePodcastMethod {
  (
    req: ElevenLabsStudioCreatePodcastRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioCreatePodcastResponse>;
  schema: z.ZodType<ElevenLabsStudioCreatePodcastRequest>;
}

export interface ElevenLabsStudioListProjectsMethod {
  (signal?: AbortSignal): Promise<ElevenLabsStudioListProjectsResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioCreateProjectMethod {
  (
    req: ElevenLabsStudioCreateProjectRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioAddProjectResponse>;
  schema: z.ZodType<ElevenLabsStudioCreateProjectRequest>;
}

export interface ElevenLabsStudioGetProjectMethod {
  (
    projectId: string,
    req?: ElevenLabsStudioGetProjectRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioProjectExtended>;
  schema: z.ZodType<ElevenLabsStudioGetProjectRequest>;
}

export interface ElevenLabsStudioUpdateProjectMethod {
  (
    projectId: string,
    req: ElevenLabsStudioUpdateProjectRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioEditProjectResponse>;
  schema: z.ZodType<ElevenLabsStudioUpdateProjectRequest>;
}

export interface ElevenLabsStudioDeleteProjectMethod {
  (
    projectId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioDeleteProjectResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioConvertProjectMethod {
  (
    projectId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioConvertProjectResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioUpdateProjectContentMethod {
  (
    projectId: string,
    req?: ElevenLabsStudioUpdateProjectContentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioEditProjectResponse>;
  schema: z.ZodType<ElevenLabsStudioUpdateProjectContentRequest>;
}

export interface ElevenLabsStudioGetMutedTracksMethod {
  (
    projectId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioMutedTracksResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioCreatePronunciationDictionariesMethod {
  (
    projectId: string,
    req: ElevenLabsStudioCreatePronunciationDictionariesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioCreatePronunciationDictionariesResponse>;
  schema: z.ZodType<ElevenLabsStudioCreatePronunciationDictionariesRequest>;
}

export interface ElevenLabsStudioListProjectSnapshotsMethod {
  (
    projectId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioListProjectSnapshotsResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioGetProjectSnapshotMethod {
  (
    projectId: string,
    snapshotId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioProjectSnapshotExtended>;
  schema: undefined;
}

export interface ElevenLabsStudioStreamProjectSnapshotMethod {
  (
    projectId: string,
    snapshotId: string,
    req?: ElevenLabsStudioStreamAudioRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsStudioStreamAudioRequest>;
}

export interface ElevenLabsStudioArchiveProjectSnapshotMethod {
  (
    projectId: string,
    snapshotId: string,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: undefined;
}

export interface ElevenLabsStudioListChaptersMethod {
  (
    projectId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioListChaptersResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioCreateChapterMethod {
  (
    projectId: string,
    req: ElevenLabsStudioCreateChapterRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioAddChapterResponse>;
  schema: z.ZodType<ElevenLabsStudioCreateChapterRequest>;
}

export interface ElevenLabsStudioGetChapterMethod {
  (
    projectId: string,
    chapterId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioChapterWithContent>;
  schema: undefined;
}

export interface ElevenLabsStudioUpdateChapterMethod {
  (
    projectId: string,
    chapterId: string,
    req: ElevenLabsStudioUpdateChapterRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioEditChapterResponse>;
  schema: z.ZodType<ElevenLabsStudioUpdateChapterRequest>;
}

export interface ElevenLabsStudioDeleteChapterMethod {
  (
    projectId: string,
    chapterId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioDeleteChapterResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioConvertChapterMethod {
  (
    projectId: string,
    chapterId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioConvertChapterResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioListChapterSnapshotsMethod {
  (
    projectId: string,
    chapterId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioListChapterSnapshotsResponse>;
  schema: undefined;
}

export interface ElevenLabsStudioGetChapterSnapshotMethod {
  (
    projectId: string,
    chapterId: string,
    chapterSnapshotId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStudioChapterSnapshotExtended>;
  schema: undefined;
}

export interface ElevenLabsStudioStreamChapterSnapshotMethod {
  (
    projectId: string,
    chapterId: string,
    chapterSnapshotId: string,
    req?: ElevenLabsStudioStreamAudioRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsStudioStreamAudioRequest>;
}

export interface ElevenLabsStudioProjectSnapshotsNamespace {
  list: ElevenLabsStudioListProjectSnapshotsMethod;
  get: ElevenLabsStudioGetProjectSnapshotMethod;
  stream: ElevenLabsStudioStreamProjectSnapshotMethod;
  archive: ElevenLabsStudioArchiveProjectSnapshotMethod;
}

export interface ElevenLabsStudioChapterSnapshotsNamespace {
  list: ElevenLabsStudioListChapterSnapshotsMethod;
  get: ElevenLabsStudioGetChapterSnapshotMethod;
  stream: ElevenLabsStudioStreamChapterSnapshotMethod;
}

export interface ElevenLabsStudioChaptersNamespace {
  list: ElevenLabsStudioListChaptersMethod;
  create: ElevenLabsStudioCreateChapterMethod;
  get: ElevenLabsStudioGetChapterMethod;
  update: ElevenLabsStudioUpdateChapterMethod;
  delete: ElevenLabsStudioDeleteChapterMethod;
  convert: ElevenLabsStudioConvertChapterMethod;
  snapshots: ElevenLabsStudioChapterSnapshotsNamespace;
}

export interface ElevenLabsStudioProjectContentNamespace {
  update: ElevenLabsStudioUpdateProjectContentMethod;
}

export interface ElevenLabsStudioProjectMutedTracksNamespace {
  get: ElevenLabsStudioGetMutedTracksMethod;
}

export interface ElevenLabsStudioProjectPronunciationDictionariesNamespace {
  create: ElevenLabsStudioCreatePronunciationDictionariesMethod;
}

export interface ElevenLabsStudioProjectsNamespace {
  list: ElevenLabsStudioListProjectsMethod;
  create: ElevenLabsStudioCreateProjectMethod;
  get: ElevenLabsStudioGetProjectMethod;
  update: ElevenLabsStudioUpdateProjectMethod;
  delete: ElevenLabsStudioDeleteProjectMethod;
  convert: ElevenLabsStudioConvertProjectMethod;
  content: ElevenLabsStudioProjectContentNamespace;
  mutedTracks: ElevenLabsStudioProjectMutedTracksNamespace;
  pronunciationDictionaries: ElevenLabsStudioProjectPronunciationDictionariesNamespace;
  snapshots: ElevenLabsStudioProjectSnapshotsNamespace;
  chapters: ElevenLabsStudioChaptersNamespace;
}

export interface ElevenLabsStudioPodcastsNamespace {
  create: ElevenLabsStudioCreatePodcastMethod;
}

export interface ElevenLabsStudioNamespace {
  podcasts: ElevenLabsStudioPodcastsNamespace;
  projects: ElevenLabsStudioProjectsNamespace;
}

export interface ElevenLabsSpeechToSpeechStreamMethod {
  (
    voiceId: string,
    req: ElevenLabsSpeechToSpeechRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsSpeechToSpeechRequest>;
}

export interface ElevenLabsSpeechToSpeechMethod {
  (
    voiceId: string,
    req: ElevenLabsSpeechToSpeechRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsSpeechToSpeechRequest>;
  stream: ElevenLabsSpeechToSpeechStreamMethod;
}

export interface ElevenLabsTextToVoiceDesignMethod {
  (
    req: ElevenLabsVoiceDesignRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsVoicePreviewsResponse>;
  schema: z.ZodType<ElevenLabsVoiceDesignRequest>;
}

export interface ElevenLabsTextToVoiceRemixMethod {
  (
    voiceId: string,
    req: ElevenLabsVoiceRemixRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsVoicePreviewsResponse>;
  schema: z.ZodType<ElevenLabsVoiceRemixRequest>;
}

export interface ElevenLabsTextToVoiceStreamMethod {
  (generatedVoiceId: string, signal?: AbortSignal): Promise<ArrayBuffer>;
  schema: undefined;
}

export interface ElevenLabsTextToVoiceMethod {
  (
    req: ElevenLabsCreateVoiceFromPreviewRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsVoice>;
  schema: z.ZodType<ElevenLabsCreateVoiceFromPreviewRequest>;
  design: ElevenLabsTextToVoiceDesignMethod;
  remix: ElevenLabsTextToVoiceRemixMethod;
  stream: ElevenLabsTextToVoiceStreamMethod;
}

export interface ElevenLabsGetV1TextToVoiceNamespace {
  stream: ElevenLabsTextToVoiceStreamMethod;
}

export interface ElevenLabsStartSpeakerSeparationMethod {
  (
    voiceId: string,
    sampleId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStartSpeakerSeparationResponse>;
  schema: undefined;
}

export interface ElevenLabsCreatePvcVoiceMethod {
  (
    req: ElevenLabsCreatePvcVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreatePvcVoiceResponse>;
  schema: z.ZodType<ElevenLabsCreatePvcVoiceRequest>;
}

export interface ElevenLabsUpdatePvcVoiceSampleMethod {
  (
    voiceId: string,
    sampleId: string,
    req?: ElevenLabsUpdatePvcVoiceSampleRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUpdatePvcVoiceSampleResponse>;
  schema: z.ZodType<ElevenLabsUpdatePvcVoiceSampleRequest>;
  separateSpeakers: ElevenLabsStartSpeakerSeparationMethod;
}

export interface ElevenLabsEditPvcVoiceMethod {
  (
    voiceId: string,
    req: ElevenLabsEditPvcVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsEditPvcVoiceResponse>;
  schema: z.ZodType<ElevenLabsEditPvcVoiceRequest>;
}

export interface ElevenLabsAddPvcSamplesMethod {
  (
    voiceId: string,
    req: ElevenLabsAddPvcSamplesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAddPvcSamplesResponse>;
  schema: z.ZodType<ElevenLabsAddPvcSamplesRequest>;
}

export interface ElevenLabsGetPvcSampleAudioMethod {
  (
    voiceId: string,
    sampleId: string,
    req?: ElevenLabsGetPvcSampleAudioRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsVoiceSamplePreviewResponse>;
  schema: z.ZodType<ElevenLabsGetPvcSampleAudioRequest>;
}

export interface ElevenLabsGetPvcSampleSpeakersMethod {
  (
    voiceId: string,
    sampleId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsSpeakerSeparation>;
  schema: undefined;
}

export interface ElevenLabsDeletePvcVoiceSampleMethod {
  (
    voiceId: string,
    sampleId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteVoiceSampleResponse>;
  schema: undefined;
}

export interface ElevenLabsPvcManualVerificationMethod {
  (
    voiceId: string,
    req: ElevenLabsPvcManualVerificationRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsPvcManualVerificationResponse>;
  schema: z.ZodType<ElevenLabsPvcManualVerificationRequest>;
}

export interface ElevenLabsListVoicesMethod {
  (
    req?: ElevenLabsListVoicesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListVoicesResponse>;
  schema: z.ZodType<ElevenLabsListVoicesRequest>;
}

export interface ElevenLabsGetVoiceMethod {
  (
    voiceId: string,
    req?: ElevenLabsGetVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsVoice>;
  schema: z.ZodType<ElevenLabsGetVoiceRequest>;
  list: ElevenLabsListV1VoicesMethod;
  delete: ElevenLabsDeleteVoiceMethod;
  add: ElevenLabsAddVoiceMethod;
  edit: ElevenLabsEditVoiceMethod;
  settings: ElevenLabsGetVoiceSettingsMethod;
  samples: ElevenLabsVoiceSamplesNamespace;
  pvc: ElevenLabsPvcVoiceNamespace;
}

export interface ElevenLabsGetVoiceSettingsMethod {
  (voiceId: string, signal?: AbortSignal): Promise<ElevenLabsVoiceSettings>;
  default: ElevenLabsGetDefaultVoiceSettingsMethod;
  edit: ElevenLabsEditVoiceSettingsMethod;
}

export interface ElevenLabsListV1VoicesMethod {
  (
    req?: ElevenLabsListV1VoicesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListV1VoicesResponse>;
  schema: z.ZodType<ElevenLabsListV1VoicesRequest>;
}

export interface ElevenLabsDeleteVoiceMethod {
  (
    voiceId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteVoiceResponse>;
  schema: undefined;
}

export interface ElevenLabsAddSharedVoiceMethod {
  (
    publicUserId: string,
    voiceId: string,
    req: ElevenLabsAddSharedVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAddSharedVoiceResponse>;
  schema: z.ZodType<ElevenLabsAddSharedVoiceRequest>;
}

export interface ElevenLabsAddVoiceMethod {
  (
    req: ElevenLabsAddVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAddVoiceResponse>;
  schema: z.ZodType<ElevenLabsAddVoiceRequest>;
  share: ElevenLabsAddSharedVoiceMethod;
}

export interface ElevenLabsEditVoiceMethod {
  (
    voiceId: string,
    req: ElevenLabsEditVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsEditVoiceResponse>;
  schema: z.ZodType<ElevenLabsEditVoiceRequest>;
}

export interface ElevenLabsEditVoiceSettingsMethod {
  (
    voiceId: string,
    req: ElevenLabsEditVoiceSettingsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsEditVoiceSettingsResponse>;
  schema: z.ZodType<ElevenLabsEditVoiceSettingsRequest>;
}

export interface ElevenLabsGetDefaultVoiceSettingsMethod {
  (signal?: AbortSignal): Promise<ElevenLabsVoiceSettings>;
}

export interface ElevenLabsSharedVoicesMethod {
  (
    req?: ElevenLabsSharedVoicesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsLibraryVoicesResponse>;
  schema: z.ZodType<ElevenLabsSharedVoicesRequest>;
}

export interface ElevenLabsSimilarVoicesMethod {
  (
    req?: ElevenLabsSimilarVoicesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsLibraryVoicesResponse>;
  schema: z.ZodType<ElevenLabsSimilarVoicesRequest>;
}

export interface ElevenLabsDeleteVoiceSampleMethod {
  (
    voiceId: string,
    sampleId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteVoiceSampleResponse>;
  schema: undefined;
}

export interface ElevenLabsGetVoiceSampleAudioMethod {
  (
    voiceId: string,
    sampleId: string,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
}

export interface ElevenLabsVoiceSamplesNamespace {
  delete: ElevenLabsDeleteVoiceSampleMethod;
  audio: ElevenLabsGetVoiceSampleAudioMethod;
}

export interface ElevenLabsPvcVoiceCaptchaMethod {
  (
    voiceId: string,
    req: ElevenLabsPvcVoiceCaptchaRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsPvcVoiceCaptchaResponse>;
  schema: z.ZodType<ElevenLabsPvcVoiceCaptchaRequest>;
  get: ElevenLabsGetPvcVoiceCaptchaMethod;
}

export interface ElevenLabsGetPvcVoiceCaptchaMethod {
  (
    voiceId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetPvcVoiceCaptchaResponse>;
}

export interface ElevenLabsGetSeparatedSpeakerAudioMethod {
  (
    voiceId: string,
    sampleId: string,
    speakerId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsSpeakerAudioResponse>;
}

export interface ElevenLabsPvcVoiceSampleWaveformMethod {
  (
    voiceId: string,
    sampleId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsPvcVoiceSampleWaveformResponse>;
}

export interface ElevenLabsPvcTrainMethod {
  (
    voiceId: string,
    req?: ElevenLabsPvcTrainRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsPvcTrainResponse>;
  schema: z.ZodType<ElevenLabsPvcTrainRequest>;
}

export interface ElevenLabsPvcVoiceNamespace {
  (
    req: ElevenLabsCreatePvcVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreatePvcVoiceResponse>;
  schema: z.ZodType<ElevenLabsCreatePvcVoiceRequest>;
  edit: ElevenLabsEditPvcVoiceMethod;
  captcha: ElevenLabsPvcVoiceCaptchaMethod;
  samples: ElevenLabsPvcVoiceSamplesNamespace;
  train: ElevenLabsPvcTrainMethod;
  verification: ElevenLabsPvcManualVerificationMethod;
}

export interface ElevenLabsUserSubscriptionMethod {
  (signal?: AbortSignal): Promise<ElevenLabsUserSubscriptionResponse>;
}

export interface ElevenLabsGetUserMethod {
  (signal?: AbortSignal): Promise<ElevenLabsUserResponse>;
  schema: undefined;
}

export interface ElevenLabsCreateSingleUseTokenMethod {
  (
    tokenType: ElevenLabsSingleUseTokenType,
    signal?: AbortSignal
  ): Promise<ElevenLabsSingleUseTokenResponse>;
  schema: undefined;
}

export interface ElevenLabsListModelsMethod {
  (signal?: AbortSignal): Promise<ElevenLabsListModelsResponse>;
}

export interface ElevenLabsWorkspaceAnalyticsRequestsMethod {
  (
    req: ElevenLabsWorkspaceAnalyticsRequestsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsWorkspaceAnalyticsRequestsResponse>;
  schema: z.ZodType<ElevenLabsWorkspaceAnalyticsRequestsRequest>;
}

export interface ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeMethod {
  (
    req: ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsWorkspaceAnalyticsQueryResponse>;
  schema: z.ZodType<ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest>;
}

export interface ElevenLabsCreateAgentMethod {
  (
    req: ElevenLabsCreateAgentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateAgentResponse>;
  schema: z.ZodType<ElevenLabsCreateAgentRequest>;
}

export interface ElevenLabsGetAgentMethod {
  (
    agentId: string,
    req?: ElevenLabsGetAgentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetAgentResponse>;
  schema: z.ZodType<ElevenLabsGetAgentRequest>;
}

export interface ElevenLabsListAgentsMethod {
  (
    req?: ElevenLabsListAgentsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListAgentsResponse>;
  schema: z.ZodType<ElevenLabsListAgentsRequest>;
}

export interface ElevenLabsUpdateAgentMethod {
  (
    agentId: string,
    req?: ElevenLabsUpdateAgentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetAgentResponse>;
  schema: z.ZodType<ElevenLabsUpdateAgentRequest>;
}

export interface ElevenLabsDeleteAgentMethod {
  (
    agentId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteAgentResponse>;
  schema: undefined;
}

export interface ElevenLabsGetAgentWidgetMethod {
  (
    agentId: string,
    req?: ElevenLabsGetAgentWidgetRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetAgentWidgetResponse>;
  schema: z.ZodType<ElevenLabsGetAgentWidgetRequest>;
}

export interface ElevenLabsGetAgentLinkMethod {
  (
    agentId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetAgentLinkResponse>;
  schema: undefined;
}

export interface ElevenLabsListAgentBranchesMethod {
  (
    agentId: string,
    req?: ElevenLabsListAgentBranchesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListAgentBranchesResponse>;
  schema: z.ZodType<ElevenLabsListAgentBranchesRequest>;
}

export interface ElevenLabsGetAgentSummariesMethod {
  (
    req: ElevenLabsGetAgentSummariesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetAgentSummariesResponse>;
  schema: z.ZodType<ElevenLabsGetAgentSummariesRequest>;
}

export interface ElevenLabsDuplicateAgentMethod {
  (
    agentId: string,
    req?: ElevenLabsDuplicateAgentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsDuplicateAgentResponse>;
  schema: z.ZodType<ElevenLabsDuplicateAgentRequest>;
}

export interface ElevenLabsPostAgentAvatarMethod {
  (
    agentId: string,
    req: ElevenLabsPostAgentAvatarRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsPostAgentAvatarResponse>;
  schema: z.ZodType<ElevenLabsPostAgentAvatarRequest>;
}

export interface ElevenLabsGetAgentVersionMethod {
  (
    agentId: string,
    versionId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentVersionMetadata>;
  schema: undefined;
}

export interface ElevenLabsSimulateConversationStreamMethod {
  (
    agentId: string,
    req: ElevenLabsSimulateConversationRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsSimulateConversationRequest>;
}

export interface ElevenLabsSimulateConversationMethod {
  (
    agentId: string,
    req: ElevenLabsSimulateConversationRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsSimulatedConversationResponse>;
  schema: z.ZodType<ElevenLabsSimulateConversationRequest>;
  stream: ElevenLabsSimulateConversationStreamMethod;
}

export interface ElevenLabsGetAgentTopicsMethod {
  (
    agentId: string,
    req?: ElevenLabsGetAgentTopicsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetAgentTopicsResponse>;
  schema: z.ZodType<ElevenLabsGetAgentTopicsRequest>;
}

export interface ElevenLabsGetAgentKnowledgeBaseSizeMethod {
  (
    agentId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentKnowledgeBaseSizeResponse>;
  schema: undefined;
}

export interface ElevenLabsCalculateAgentLlmUsageMethod {
  (
    agentId: string,
    req?: ElevenLabsCalculateAgentLlmUsageRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCalculateAgentLlmUsageResponse>;
  schema: z.ZodType<ElevenLabsCalculateAgentLlmUsageRequest>;
}

export interface ElevenLabsCreateAgentDraftMethod {
  (
    agentId: string,
    req: ElevenLabsCreateAgentDraftRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentDraftResponse>;
  schema: z.ZodType<ElevenLabsCreateAgentDraftRequest>;
}

export interface ElevenLabsDeleteAgentDraftMethod {
  (
    agentId: string,
    req: ElevenLabsDeleteAgentDraftRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentDraftResponse>;
  schema: z.ZodType<ElevenLabsDeleteAgentDraftRequest>;
}

export interface ElevenLabsCreateAgentDeploymentMethod {
  (
    agentId: string,
    req: ElevenLabsCreateAgentDeploymentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentDeploymentResponse>;
  schema: z.ZodType<ElevenLabsCreateAgentDeploymentRequest>;
}

export interface ElevenLabsCreateAgentBranchMethod {
  (
    agentId: string,
    req: ElevenLabsCreateAgentBranchRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateAgentBranchResponse>;
  schema: z.ZodType<ElevenLabsCreateAgentBranchRequest>;
}

export interface ElevenLabsGetAgentBranchMethod {
  (
    agentId: string,
    branchId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentBranchResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdateAgentBranchMethod {
  (
    agentId: string,
    branchId: string,
    req?: ElevenLabsUpdateAgentBranchRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentBranchResponse>;
  schema: z.ZodType<ElevenLabsUpdateAgentBranchRequest>;
}

export interface ElevenLabsRebaseAgentBranchMethod {
  (
    agentId: string,
    branchId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentBranchMutationResponse>;
  schema: undefined;
}

export interface ElevenLabsPreviewAgentBranchRebaseMethod {
  (
    agentId: string,
    branchId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentBranchPreviewResponse>;
  schema: undefined;
}

export interface ElevenLabsMergeAgentBranchMethod {
  (
    agentId: string,
    sourceBranchId: string,
    req: ElevenLabsMergeAgentBranchRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentBranchMutationResponse>;
  schema: z.ZodType<ElevenLabsMergeAgentBranchRequest>;
}

export interface ElevenLabsPreviewAgentBranchMergeMethod {
  (
    agentId: string,
    sourceBranchId: string,
    req: ElevenLabsPreviewAgentBranchMergeRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentBranchPreviewResponse>;
  schema: z.ZodType<ElevenLabsPreviewAgentBranchMergeRequest>;
}

export interface ElevenLabsGetLiveConversationCountMethod {
  (
    req?: ElevenLabsGetLiveConversationCountRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsLiveConversationCountResponse>;
  schema: z.ZodType<ElevenLabsGetLiveConversationCountRequest>;
}

export interface ElevenLabsCreateAgentTestMethod {
  (
    req: ElevenLabsCreateAgentTestRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateAgentTestResponse>;
  schema: z.ZodType<ElevenLabsCreateAgentTestRequest>;
}

export interface ElevenLabsListAgentTestsMethod {
  (
    req?: ElevenLabsListAgentTestsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListAgentTestsResponse>;
  schema: z.ZodType<ElevenLabsListAgentTestsRequest>;
}

export interface ElevenLabsGetAgentTestMethod {
  (testId: string, signal?: AbortSignal): Promise<ElevenLabsAgentTestResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdateAgentTestMethod {
  (
    testId: string,
    req: ElevenLabsUpdateAgentTestRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUpdateAgentTestResponse>;
  schema: z.ZodType<ElevenLabsUpdateAgentTestRequest>;
}

export interface ElevenLabsDeleteAgentTestMethod {
  (
    testId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteAgentTestResponse>;
  schema: undefined;
}

export interface ElevenLabsGetAgentTestSummariesMethod {
  (
    req: ElevenLabsGetAgentTestSummariesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetAgentTestSummariesResponse>;
  schema: z.ZodType<ElevenLabsGetAgentTestSummariesRequest>;
}

export interface ElevenLabsBulkMoveAgentTestsMethod {
  (
    req: ElevenLabsBulkMoveAgentTestsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsBulkMoveAgentTestsResponse>;
  schema: z.ZodType<ElevenLabsBulkMoveAgentTestsRequest>;
}

export interface ElevenLabsCreateAgentTestFolderMethod {
  (
    req: ElevenLabsCreateAgentTestFolderRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateAgentTestFolderResponse>;
  schema: z.ZodType<ElevenLabsCreateAgentTestFolderRequest>;
}

export interface ElevenLabsGetAgentTestFolderMethod {
  (
    folderId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsAgentTestFolderResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdateAgentTestFolderMethod {
  (
    folderId: string,
    req: ElevenLabsUpdateAgentTestFolderRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUpdateAgentTestFolderResponse>;
  schema: z.ZodType<ElevenLabsUpdateAgentTestFolderRequest>;
}

export interface ElevenLabsDeleteAgentTestFolderMethod {
  (
    folderId: string,
    req?: ElevenLabsDeleteAgentTestFolderRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteAgentTestFolderResponse>;
  schema: z.ZodType<ElevenLabsDeleteAgentTestFolderRequest>;
}

export interface ElevenLabsRunAgentTestsMethod {
  (
    agentId: string,
    req: ElevenLabsRunAgentTestsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsRunAgentTestsResponse>;
  schema: z.ZodType<ElevenLabsRunAgentTestsRequest>;
}

export interface ElevenLabsListTestInvocationsMethod {
  (
    req?: ElevenLabsListTestInvocationsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListTestInvocationsResponse>;
  schema: z.ZodType<ElevenLabsListTestInvocationsRequest>;
}

export interface ElevenLabsGetTestInvocationMethod {
  (
    testInvocationId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetTestInvocationResponse>;
  schema: undefined;
}

export interface ElevenLabsResubmitTestsMethod {
  (
    testInvocationId: string,
    req: ElevenLabsResubmitTestsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsResubmitTestsResponse>;
  schema: z.ZodType<ElevenLabsResubmitTestsRequest>;
}

export interface ElevenLabsCreateToolMethod {
  (
    req: ElevenLabsCreateToolRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateToolResponse>;
  schema: z.ZodType<ElevenLabsCreateToolRequest>;
}

export interface ElevenLabsListToolsMethod {
  (
    req?: ElevenLabsListToolsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListToolsResponse>;
  schema: z.ZodType<ElevenLabsListToolsRequest>;
}

export interface ElevenLabsGetToolMethod {
  (toolId: string, signal?: AbortSignal): Promise<ElevenLabsToolResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdateToolMethod {
  (
    toolId: string,
    req: ElevenLabsUpdateToolRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsToolResponse>;
  schema: z.ZodType<ElevenLabsUpdateToolRequest>;
}

export interface ElevenLabsDeleteToolMethod {
  (toolId: string, signal?: AbortSignal): Promise<ElevenLabsDeleteToolResponse>;
  schema: undefined;
}

export interface ElevenLabsGetToolDependentAgentsMethod {
  (
    toolId: string,
    req?: ElevenLabsGetToolDependentAgentsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetToolDependentAgentsResponse>;
  schema: z.ZodType<ElevenLabsGetToolDependentAgentsRequest>;
}

export interface ElevenLabsGetToolExecutionsMethod {
  (
    toolId: string,
    req?: ElevenLabsGetToolExecutionsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetToolExecutionsResponse>;
  schema: z.ZodType<ElevenLabsGetToolExecutionsRequest>;
}

export interface ElevenLabsCreateMcpServerMethod {
  (
    req: ElevenLabsCreateMcpServerRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpServerResponse>;
  schema: z.ZodType<ElevenLabsCreateMcpServerRequest>;
}

export interface ElevenLabsListMcpServersMethod {
  (signal?: AbortSignal): Promise<ElevenLabsListMcpServersResponse>;
  schema: undefined;
}

export interface ElevenLabsGetMcpServerMethod {
  (
    mcpServerId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpServerResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdateMcpServerMethod {
  (
    mcpServerId: string,
    req: ElevenLabsUpdateMcpServerRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpServerResponse>;
  schema: z.ZodType<ElevenLabsUpdateMcpServerRequest>;
}

export interface ElevenLabsDeleteMcpServerMethod {
  (
    mcpServerId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteMcpServerResponse>;
  schema: undefined;
}

export interface ElevenLabsListMcpServerToolsMethod {
  (
    mcpServerId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsListMcpServerToolsResponse>;
  schema: undefined;
}

export interface ElevenLabsCreateMcpServerToolApprovalMethod {
  (
    mcpServerId: string,
    req: ElevenLabsCreateMcpServerToolApprovalRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpServerResponse>;
  schema: z.ZodType<ElevenLabsCreateMcpServerToolApprovalRequest>;
}

export interface ElevenLabsDeleteMcpServerToolApprovalMethod {
  (
    mcpServerId: string,
    toolName: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpServerResponse>;
  schema: undefined;
}

export interface ElevenLabsCreateMcpToolConfigOverrideMethod {
  (
    mcpServerId: string,
    req: ElevenLabsCreateMcpToolConfigOverrideRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpServerResponse>;
  schema: z.ZodType<ElevenLabsCreateMcpToolConfigOverrideRequest>;
}

export interface ElevenLabsGetMcpToolConfigOverrideMethod {
  (
    mcpServerId: string,
    toolName: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpToolConfigOverride>;
  schema: undefined;
}

export interface ElevenLabsUpdateMcpToolConfigOverrideMethod {
  (
    mcpServerId: string,
    toolName: string,
    req: ElevenLabsUpdateMcpToolConfigOverrideRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpServerResponse>;
  schema: z.ZodType<ElevenLabsUpdateMcpToolConfigOverrideRequest>;
}

export interface ElevenLabsDeleteMcpToolConfigOverrideMethod {
  (
    mcpServerId: string,
    toolName: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsMcpServerResponse>;
  schema: undefined;
}

export interface ElevenLabsCreateKnowledgeBaseDocumentFromUrlMethod {
  (
    req: ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse>;
  schema: z.ZodType<ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest>;
}

export interface ElevenLabsCreateKnowledgeBaseDocumentFromTextMethod {
  (
    req: ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse>;
  schema: z.ZodType<ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest>;
}

export interface ElevenLabsCreateKnowledgeBaseDocumentFromFileMethod {
  (
    req: ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse>;
  schema: z.ZodType<ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest>;
}

export interface ElevenLabsListKnowledgeBaseDocumentsMethod {
  (
    req?: ElevenLabsListKnowledgeBaseDocumentsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListKnowledgeBaseDocumentsResponse>;
  schema: z.ZodType<ElevenLabsListKnowledgeBaseDocumentsRequest>;
}

export interface ElevenLabsGetKnowledgeBaseDocumentMethod {
  (
    documentationId: string,
    req?: ElevenLabsGetKnowledgeBaseDocumentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetKnowledgeBaseDocumentResponse>;
  schema: z.ZodType<ElevenLabsGetKnowledgeBaseDocumentRequest>;
}

export interface ElevenLabsDeleteKnowledgeBaseDocumentMethod {
  (
    documentationId: string,
    req?: ElevenLabsDeleteKnowledgeBaseDocumentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteKnowledgeBaseDocumentResponse>;
  schema: z.ZodType<ElevenLabsDeleteKnowledgeBaseDocumentRequest>;
}

export interface ElevenLabsGetKnowledgeBaseSummariesMethod {
  (
    req: ElevenLabsGetKnowledgeBaseSummariesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetKnowledgeBaseSummariesResponse>;
  schema: z.ZodType<ElevenLabsGetKnowledgeBaseSummariesRequest>;
}

export interface ElevenLabsSearchKnowledgeBaseContentMethod {
  (
    req: ElevenLabsSearchKnowledgeBaseContentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsSearchKnowledgeBaseContentResponse>;
  schema: z.ZodType<ElevenLabsSearchKnowledgeBaseContentRequest>;
}

export interface ElevenLabsUpdateKnowledgeBaseDocumentMethod {
  (
    documentationId: string,
    req: ElevenLabsUpdateKnowledgeBaseDocumentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUpdateKnowledgeBaseDocumentResponse>;
  schema: z.ZodType<ElevenLabsUpdateKnowledgeBaseDocumentRequest>;
}

export interface ElevenLabsGetKnowledgeBaseDocumentContentMethod {
  (
    documentationId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetKnowledgeBaseDocumentContentResponse>;
  schema: undefined;
}

export interface ElevenLabsListKnowledgeBaseDocumentChunksMethod {
  (
    documentationId: string,
    req: ElevenLabsListKnowledgeBaseDocumentChunksRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListKnowledgeBaseDocumentChunksResponse>;
  schema: z.ZodType<ElevenLabsListKnowledgeBaseDocumentChunksRequest>;
}

export interface ElevenLabsGetKnowledgeBaseDocumentChunkMethod {
  (
    documentationId: string,
    chunkId: string,
    req?: ElevenLabsGetKnowledgeBaseDocumentChunkRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetKnowledgeBaseDocumentChunkResponse>;
  schema: z.ZodType<ElevenLabsGetKnowledgeBaseDocumentChunkRequest>;
}

export interface ElevenLabsGetKnowledgeBaseDependentAgentsMethod {
  (
    documentationId: string,
    req?: ElevenLabsGetKnowledgeBaseDependentAgentsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetKnowledgeBaseDependentAgentsResponse>;
  schema: z.ZodType<ElevenLabsGetKnowledgeBaseDependentAgentsRequest>;
}

export interface ElevenLabsGetKnowledgeBaseSourceFileUrlMethod {
  (
    documentationId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetKnowledgeBaseSourceFileUrlResponse>;
  schema: undefined;
}

export interface ElevenLabsRefreshKnowledgeBaseDocumentMethod {
  (
    documentationId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsRefreshKnowledgeBaseDocumentResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdateKnowledgeBaseFileDocumentMethod {
  (
    documentationId: string,
    req: ElevenLabsUpdateKnowledgeBaseFileDocumentRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUpdateKnowledgeBaseFileDocumentResponse>;
  schema: z.ZodType<ElevenLabsUpdateKnowledgeBaseFileDocumentRequest>;
}

export interface ElevenLabsGetKnowledgeBaseRagIndexOverviewMethod {
  (
    signal?: AbortSignal
  ): Promise<ElevenLabsGetKnowledgeBaseRagIndexOverviewResponse>;
  schema: undefined;
}

export interface ElevenLabsComputeKnowledgeBaseRagIndexesMethod {
  (
    req: ElevenLabsComputeKnowledgeBaseRagIndexesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsComputeKnowledgeBaseRagIndexesResponse>;
  schema: z.ZodType<ElevenLabsComputeKnowledgeBaseRagIndexesRequest>;
}

export interface ElevenLabsGetKnowledgeBaseDocumentRagIndexesMethod {
  (
    documentationId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetKnowledgeBaseDocumentRagIndexesResponse>;
  schema: undefined;
}

export interface ElevenLabsComputeKnowledgeBaseDocumentRagIndexMethod {
  (
    documentationId: string,
    req: ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsComputeKnowledgeBaseDocumentRagIndexResponse>;
  schema: z.ZodType<ElevenLabsComputeKnowledgeBaseDocumentRagIndexRequest>;
}

export interface ElevenLabsDeleteKnowledgeBaseDocumentRagIndexMethod {
  (
    documentationId: string,
    ragIndexId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteKnowledgeBaseDocumentRagIndexResponse>;
  schema: undefined;
}

export interface ElevenLabsCreateKnowledgeBaseFolderMethod {
  (
    req: ElevenLabsCreateKnowledgeBaseFolderRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreateKnowledgeBaseFolderResponse>;
  schema: z.ZodType<ElevenLabsCreateKnowledgeBaseFolderRequest>;
}

export interface ElevenLabsBulkMoveKnowledgeBaseDocumentsMethod {
  (
    req: ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsBulkMoveKnowledgeBaseDocumentsResponse>;
  schema: z.ZodType<ElevenLabsBulkMoveKnowledgeBaseDocumentsRequest>;
}

export interface ElevenLabsMoveKnowledgeBaseEntityMethod {
  (
    documentId: string,
    req?: ElevenLabsMoveKnowledgeBaseEntityRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsMoveKnowledgeBaseEntityResponse>;
  schema: z.ZodType<ElevenLabsMoveKnowledgeBaseEntityRequest>;
}

export interface ElevenLabsListConversationsMethod {
  (
    req?: ElevenLabsListConversationsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListConversationsResponse>;
  schema: z.ZodType<ElevenLabsListConversationsRequest>;
}

export interface ElevenLabsGetConversationMethod {
  (
    conversationId: string,
    req?: ElevenLabsGetConversationRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetConversationResponse>;
  schema: z.ZodType<ElevenLabsGetConversationRequest>;
}

export interface ElevenLabsDeleteConversationMethod {
  (
    conversationId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteConversationResponse>;
  schema: undefined;
}

// Returns the conversation recording as raw audio bytes (audio/mpeg).
export interface ElevenLabsGetConversationAudioMethod {
  (conversationId: string, signal?: AbortSignal): Promise<ArrayBuffer>;
  schema: undefined;
}

export interface ElevenLabsGetSignedUrlMethod {
  (
    req: ElevenLabsGetSignedUrlRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetSignedUrlResponse>;
  schema: z.ZodType<ElevenLabsGetSignedUrlRequest>;
}

export interface ElevenLabsGetConversationTokenMethod {
  (
    req: ElevenLabsGetConversationTokenRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetConversationTokenResponse>;
  schema: z.ZodType<ElevenLabsGetConversationTokenRequest>;
}

export interface ElevenLabsSmartSearchConversationMessagesMethod {
  (
    req: ElevenLabsSmartSearchConversationMessagesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsSmartSearchConversationMessagesResponse>;
  schema: z.ZodType<ElevenLabsSmartSearchConversationMessagesRequest>;
}

export interface ElevenLabsTextSearchConversationMessagesMethod {
  (
    req: ElevenLabsTextSearchConversationMessagesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsTextSearchConversationMessagesResponse>;
  schema: z.ZodType<ElevenLabsTextSearchConversationMessagesRequest>;
}

export interface ElevenLabsConversationFeedbackMethod {
  (
    conversationId: string,
    req: ElevenLabsConversationFeedbackRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsConversationFeedbackResponse>;
  schema: z.ZodType<ElevenLabsConversationFeedbackRequest>;
}

export interface ElevenLabsUploadConversationFileMethod {
  (
    conversationId: string,
    req: ElevenLabsUploadConversationFileRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUploadConversationFileResponse>;
  schema: z.ZodType<ElevenLabsUploadConversationFileRequest>;
}

export interface ElevenLabsDeleteConversationFileMethod {
  (
    conversationId: string,
    fileId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeleteConversationFileResponse>;
  schema: undefined;
}

export interface ElevenLabsGetConversationSipMessagesMethod {
  (
    conversationId: string,
    req?: ElevenLabsGetConversationSipMessagesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetConversationSipMessagesResponse>;
  schema: z.ZodType<ElevenLabsGetConversationSipMessagesRequest>;
}

export interface ElevenLabsAssignConversationTagsMethod {
  (
    conversationId: string,
    req: ElevenLabsAssignConversationTagsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAssignConversationTagsResponse>;
  schema: z.ZodType<ElevenLabsAssignConversationTagsRequest>;
}

export interface ElevenLabsUnassignConversationTagMethod {
  (
    conversationId: string,
    tagId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsUnassignConversationTagResponse>;
  schema: undefined;
}

export interface ElevenLabsRunConversationAnalysisMethod {
  (
    conversationId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsRunConversationAnalysisResponse>;
  schema: undefined;
}

export interface ElevenLabsRunConversationEvaluationsMethod {
  (
    conversationId: string,
    req: ElevenLabsRunConversationEvaluationsRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsRunConversationEvaluationsResponse>;
  schema: z.ZodType<ElevenLabsRunConversationEvaluationsRequest>;
}

export interface ElevenLabsCreatePhoneNumberMethod {
  (
    req: ElevenLabsCreatePhoneNumberRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreatePhoneNumberResponse>;
  schema: z.ZodType<ElevenLabsCreatePhoneNumberRequest>;
}

export interface ElevenLabsListPhoneNumbersMethod {
  (
    req?: ElevenLabsListPhoneNumbersRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListPhoneNumbersResponse>;
  schema: z.ZodType<ElevenLabsListPhoneNumbersRequest>;
}

export interface ElevenLabsGetPhoneNumberMethod {
  (
    phoneNumberId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetPhoneNumberResponse>;
  schema: undefined;
}

export interface ElevenLabsUpdatePhoneNumberMethod {
  (
    phoneNumberId: string,
    req?: ElevenLabsUpdatePhoneNumberRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsUpdatePhoneNumberResponse>;
  schema: z.ZodType<ElevenLabsUpdatePhoneNumberRequest>;
}

export interface ElevenLabsDeletePhoneNumberMethod {
  (
    phoneNumberId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDeletePhoneNumberResponse>;
  schema: undefined;
}

export interface ElevenLabsTwilioOutboundCallMethod {
  (
    req: ElevenLabsTwilioOutboundCallRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsTwilioOutboundCallResponse>;
  schema: z.ZodType<ElevenLabsTwilioOutboundCallRequest>;
}

export interface ElevenLabsSipTrunkOutboundCallMethod {
  (
    req: ElevenLabsSipTrunkOutboundCallRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsSipTrunkOutboundCallResponse>;
  schema: z.ZodType<ElevenLabsSipTrunkOutboundCallRequest>;
}

// -- History methods ---------------------------------------------------------

export interface ElevenLabsHistoryListMethod {
  (
    req?: ElevenLabsHistoryListRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsHistoryListResponse>;
  schema: z.ZodType<ElevenLabsHistoryListRequest>;
}

export interface ElevenLabsHistoryGetMethod {
  (historyItemId: string, signal?: AbortSignal): Promise<ElevenLabsHistoryItem>;
  schema: undefined;
}

export interface ElevenLabsHistoryDeleteMethod {
  (
    historyItemId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsHistoryDeleteResponse>;
  schema: undefined;
}

export interface ElevenLabsHistoryGetAudioMethod {
  (historyItemId: string, signal?: AbortSignal): Promise<ArrayBuffer>;
  schema: undefined;
}

export interface ElevenLabsHistoryDownloadMethod {
  (
    req: ElevenLabsHistoryDownloadRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsHistoryDownloadRequest>;
}

export interface ElevenLabsHistoryNamespace {
  list: ElevenLabsHistoryListMethod;
  get: ElevenLabsHistoryGetMethod;
  delete: ElevenLabsHistoryDeleteMethod;
  audio: ElevenLabsHistoryGetAudioMethod;
  download: ElevenLabsHistoryDownloadMethod;
}

// -- Namespace interfaces ----------------------------------------------------

export interface ElevenLabsConvaiAgentVersionsNamespace {
  get: ElevenLabsGetAgentVersionMethod;
}

export interface ElevenLabsConvaiAgentDraftsNamespace {
  create: ElevenLabsCreateAgentDraftMethod;
  delete: ElevenLabsDeleteAgentDraftMethod;
}

export interface ElevenLabsConvaiAgentBranchesNamespace extends ElevenLabsListAgentBranchesMethod {
  create: ElevenLabsCreateAgentBranchMethod;
  get: ElevenLabsGetAgentBranchMethod;
  update: ElevenLabsUpdateAgentBranchMethod;
  rebase: ElevenLabsRebaseAgentBranchMethod;
  rebasePreview: ElevenLabsPreviewAgentBranchRebaseMethod;
  merge: ElevenLabsMergeAgentBranchMethod;
  mergePreview: ElevenLabsPreviewAgentBranchMergeMethod;
}

export interface ElevenLabsConvaiAgentsNamespace {
  create: ElevenLabsCreateAgentMethod;
  list: ElevenLabsListAgentsMethod;
  get: ElevenLabsGetAgentMethod;
  update: ElevenLabsUpdateAgentMethod;
  delete: ElevenLabsDeleteAgentMethod;
  widget: ElevenLabsGetAgentWidgetMethod;
  link: ElevenLabsGetAgentLinkMethod;
  branches: ElevenLabsConvaiAgentBranchesNamespace;
  summaries: ElevenLabsGetAgentSummariesMethod;
  duplicate: ElevenLabsDuplicateAgentMethod;
  avatar: ElevenLabsPostAgentAvatarMethod;
  versions: ElevenLabsConvaiAgentVersionsNamespace;
  simulateConversation: ElevenLabsSimulateConversationMethod;
  topics: ElevenLabsGetAgentTopicsMethod;
  drafts: ElevenLabsConvaiAgentDraftsNamespace;
  deployments: ElevenLabsCreateAgentDeploymentMethod;
  runTests: ElevenLabsRunAgentTestsMethod;
}

export interface ElevenLabsConvaiAgentTestFoldersNamespace {
  create: ElevenLabsCreateAgentTestFolderMethod;
  get: ElevenLabsGetAgentTestFolderMethod;
  update: ElevenLabsUpdateAgentTestFolderMethod;
  delete: ElevenLabsDeleteAgentTestFolderMethod;
}

export interface ElevenLabsConvaiAgentTestingNamespace {
  create: ElevenLabsCreateAgentTestMethod;
  list: ElevenLabsListAgentTestsMethod;
  get: ElevenLabsGetAgentTestMethod;
  update: ElevenLabsUpdateAgentTestMethod;
  delete: ElevenLabsDeleteAgentTestMethod;
  summaries: ElevenLabsGetAgentTestSummariesMethod;
  bulkMove: ElevenLabsBulkMoveAgentTestsMethod;
  folders: ElevenLabsConvaiAgentTestFoldersNamespace;
}

export interface ElevenLabsConvaiTestInvocationsNamespace {
  list: ElevenLabsListTestInvocationsMethod;
  get: ElevenLabsGetTestInvocationMethod;
  resubmit: ElevenLabsResubmitTestsMethod;
}

export interface ElevenLabsConvaiToolsNamespace {
  create: ElevenLabsCreateToolMethod;
  list: ElevenLabsListToolsMethod;
  get: ElevenLabsGetToolMethod;
  update: ElevenLabsUpdateToolMethod;
  delete: ElevenLabsDeleteToolMethod;
  dependentAgents: ElevenLabsGetToolDependentAgentsMethod;
  executions: ElevenLabsGetToolExecutionsMethod;
}

export interface ElevenLabsConvaiMcpServerToolApprovalsNamespace {
  create: ElevenLabsCreateMcpServerToolApprovalMethod;
  delete: ElevenLabsDeleteMcpServerToolApprovalMethod;
}

export interface ElevenLabsConvaiMcpServerToolConfigsNamespace {
  create: ElevenLabsCreateMcpToolConfigOverrideMethod;
  get: ElevenLabsGetMcpToolConfigOverrideMethod;
  update: ElevenLabsUpdateMcpToolConfigOverrideMethod;
  delete: ElevenLabsDeleteMcpToolConfigOverrideMethod;
}

export interface ElevenLabsConvaiMcpServersNamespace {
  create: ElevenLabsCreateMcpServerMethod;
  list: ElevenLabsListMcpServersMethod;
  get: ElevenLabsGetMcpServerMethod;
  update: ElevenLabsUpdateMcpServerMethod;
  delete: ElevenLabsDeleteMcpServerMethod;
  tools: ElevenLabsListMcpServerToolsMethod;
  toolApprovals: ElevenLabsConvaiMcpServerToolApprovalsNamespace;
  toolConfigs: ElevenLabsConvaiMcpServerToolConfigsNamespace;
}

export interface ElevenLabsConvaiKnowledgeBaseNamespace {
  url: ElevenLabsCreateKnowledgeBaseDocumentFromUrlMethod;
  text: ElevenLabsCreateKnowledgeBaseDocumentFromTextMethod;
  file: ElevenLabsCreateKnowledgeBaseDocumentFromFileMethod;
  folder: ElevenLabsCreateKnowledgeBaseFolderMethod;
  list: ElevenLabsListKnowledgeBaseDocumentsMethod;
  get: ElevenLabsGetKnowledgeBaseDocumentMethod;
  update: ElevenLabsUpdateKnowledgeBaseDocumentMethod;
  delete: ElevenLabsDeleteKnowledgeBaseDocumentMethod;
  summaries: ElevenLabsGetKnowledgeBaseSummariesMethod;
  search: ElevenLabsSearchKnowledgeBaseContentMethod;
  content: ElevenLabsGetKnowledgeBaseDocumentContentMethod;
  chunks: ElevenLabsConvaiKnowledgeBaseChunksNamespace;
  dependentAgents: ElevenLabsGetKnowledgeBaseDependentAgentsMethod;
  sourceFileUrl: ElevenLabsGetKnowledgeBaseSourceFileUrlMethod;
  refresh: ElevenLabsRefreshKnowledgeBaseDocumentMethod;
  updateFile: ElevenLabsUpdateKnowledgeBaseFileDocumentMethod;
  ragIndex: ElevenLabsConvaiKnowledgeBaseRagIndexNamespace;
  bulkMove: ElevenLabsBulkMoveKnowledgeBaseDocumentsMethod;
  move: ElevenLabsMoveKnowledgeBaseEntityMethod;
}

export interface ElevenLabsConvaiKnowledgeBaseChunksNamespace extends ElevenLabsListKnowledgeBaseDocumentChunksMethod {
  get: ElevenLabsGetKnowledgeBaseDocumentChunkMethod;
}

export interface ElevenLabsConvaiKnowledgeBaseRagIndexNamespace extends ElevenLabsGetKnowledgeBaseRagIndexOverviewMethod {
  batch: ElevenLabsComputeKnowledgeBaseRagIndexesMethod;
  get: ElevenLabsGetKnowledgeBaseDocumentRagIndexesMethod;
  compute: ElevenLabsComputeKnowledgeBaseDocumentRagIndexMethod;
  delete: ElevenLabsDeleteKnowledgeBaseDocumentRagIndexMethod;
}

export interface ElevenLabsConvaiConversationMessagesNamespace {
  smartSearch: ElevenLabsSmartSearchConversationMessagesMethod;
  textSearch: ElevenLabsTextSearchConversationMessagesMethod;
}

export interface ElevenLabsConvaiConversationFilesNamespace extends ElevenLabsUploadConversationFileMethod {
  delete: ElevenLabsDeleteConversationFileMethod;
}

export interface ElevenLabsConvaiConversationTagsNamespace extends ElevenLabsAssignConversationTagsMethod {
  unassign: ElevenLabsUnassignConversationTagMethod;
}

export type ElevenLabsConvaiConversationAnalysisEvaluationsNamespace =
  ElevenLabsRunConversationEvaluationsMethod;

export interface ElevenLabsConvaiConversationAnalysisNamespace extends ElevenLabsRunConversationAnalysisMethod {
  evaluations: ElevenLabsConvaiConversationAnalysisEvaluationsNamespace;
}

export interface ElevenLabsConvaiConversationsNamespace {
  list: ElevenLabsListConversationsMethod;
  get: ElevenLabsGetConversationMethod;
  delete: ElevenLabsDeleteConversationMethod;
  audio: ElevenLabsGetConversationAudioMethod;
  messages: ElevenLabsConvaiConversationMessagesNamespace;
  feedback: ElevenLabsConversationFeedbackMethod;
  files: ElevenLabsConvaiConversationFilesNamespace;
  sipMessages: ElevenLabsGetConversationSipMessagesMethod;
  tags: ElevenLabsConvaiConversationTagsNamespace;
  analysis: ElevenLabsConvaiConversationAnalysisNamespace;
}

export interface ElevenLabsConvaiConversationNamespace {
  getSignedUrl: ElevenLabsGetSignedUrlMethod;
  token: ElevenLabsGetConversationTokenMethod;
}

export interface ElevenLabsConvaiPhoneNumbersNamespace {
  create: ElevenLabsCreatePhoneNumberMethod;
  list: ElevenLabsListPhoneNumbersMethod;
  get: ElevenLabsGetPhoneNumberMethod;
  update: ElevenLabsUpdatePhoneNumberMethod;
  delete: ElevenLabsDeletePhoneNumberMethod;
}

export interface ElevenLabsConvaiTwilioNamespace {
  outboundCall: ElevenLabsTwilioOutboundCallMethod;
}

export interface ElevenLabsConvaiSipTrunkNamespace {
  outboundCall: ElevenLabsSipTrunkOutboundCallMethod;
}

export interface ElevenLabsConvaiAgentKnowledgeBaseNamespace {
  size: ElevenLabsGetAgentKnowledgeBaseSizeMethod;
}

export interface ElevenLabsConvaiAgentLlmUsageNamespace {
  calculate: ElevenLabsCalculateAgentLlmUsageMethod;
}

export interface ElevenLabsConvaiAgentNamespace {
  knowledgeBase: ElevenLabsConvaiAgentKnowledgeBaseNamespace;
  llmUsage: ElevenLabsConvaiAgentLlmUsageNamespace;
}

export interface ElevenLabsConvaiAnalyticsNamespace {
  liveCount: ElevenLabsGetLiveConversationCountMethod;
}

export interface ElevenLabsConvaiNamespace {
  agents: ElevenLabsConvaiAgentsNamespace;
  agent: ElevenLabsConvaiAgentNamespace;
  analytics: ElevenLabsConvaiAnalyticsNamespace;
  agentTesting: ElevenLabsConvaiAgentTestingNamespace;
  testInvocations: ElevenLabsConvaiTestInvocationsNamespace;
  tools: ElevenLabsConvaiToolsNamespace;
  mcpServers: ElevenLabsConvaiMcpServersNamespace;
  knowledgeBase: ElevenLabsConvaiKnowledgeBaseNamespace;
  conversations: ElevenLabsConvaiConversationsNamespace;
  conversation: ElevenLabsConvaiConversationNamespace;
  phoneNumbers: ElevenLabsConvaiPhoneNumbersNamespace;
  twilio: ElevenLabsConvaiTwilioNamespace;
  sipTrunk: ElevenLabsConvaiSipTrunkNamespace;
}

export interface ElevenLabsUserNamespace extends ElevenLabsGetUserMethod {
  subscription: ElevenLabsUserSubscriptionMethod;
}

export interface ElevenLabsWorkspaceAnalyticsQueryNamespace {
  usageByProductOverTime: ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeMethod;
}

export interface ElevenLabsWorkspaceAnalyticsNamespace {
  requests: ElevenLabsWorkspaceAnalyticsRequestsMethod;
  query: ElevenLabsWorkspaceAnalyticsQueryNamespace;
}

export interface ElevenLabsWorkspaceNamespace {
  analytics: ElevenLabsWorkspaceAnalyticsNamespace;
}

export interface ElevenLabsPvcVoiceSamplesSpeakersNamespace extends ElevenLabsGetPvcSampleSpeakersMethod {
  audio: ElevenLabsGetSeparatedSpeakerAudioMethod;
}

export interface ElevenLabsPvcVoiceSamplesNamespace extends ElevenLabsUpdatePvcVoiceSampleMethod {
  add: ElevenLabsAddPvcSamplesMethod;
  audio: ElevenLabsGetPvcSampleAudioMethod;
  delete: ElevenLabsDeletePvcVoiceSampleMethod;
  speakers: ElevenLabsPvcVoiceSamplesSpeakersNamespace;
  waveform: ElevenLabsPvcVoiceSampleWaveformMethod;
}

export type ElevenLabsPvcVoicesNamespace = ElevenLabsPvcVoiceNamespace;

// -- Pronunciation Dictionaries ----------------------------------------------

export interface ElevenLabsPronunciationDictionaryMetadata {
  id: string;
  name: string;
  created_by: string;
  creation_time_unix: number;
  latest_version_id: string;
  latest_version_rules_num: number;
  permission_on_resource?: "admin" | "editor" | "commenter" | "viewer" | null;
  archived_time_unix?: number | null;
  description?: string | null;
}

export interface ElevenLabsListPronunciationDictionariesResponse {
  pronunciation_dictionaries: ElevenLabsPronunciationDictionaryMetadata[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ElevenLabsAddPronunciationDictionaryResponse {
  id: string;
  name: string;
  created_by: string;
  creation_time_unix: number;
  version_id: string;
  version_rules_num: number;
  permission_on_resource?: "admin" | "editor" | "commenter" | "viewer" | null;
  description?: string | null;
}

export interface ElevenLabsPronunciationDictionaryAliasRuleResponse {
  string_to_replace: string;
  type: "alias";
  alias: string;
  case_sensitive?: boolean;
  word_boundaries?: boolean;
}

export interface ElevenLabsPronunciationDictionaryPhonemeRuleResponse {
  string_to_replace: string;
  type: "phoneme";
  phoneme: string;
  alphabet: string;
  case_sensitive?: boolean;
  word_boundaries?: boolean;
}

export type ElevenLabsPronunciationDictionaryRuleResponse =
  | ElevenLabsPronunciationDictionaryAliasRuleResponse
  | ElevenLabsPronunciationDictionaryPhonemeRuleResponse;

export interface ElevenLabsGetPronunciationDictionaryResponse extends ElevenLabsPronunciationDictionaryMetadata {
  rules: ElevenLabsPronunciationDictionaryRuleResponse[];
}

export interface ElevenLabsPronunciationDictionaryRulesResponse {
  id: string;
  version_id: string;
  version_rules_num: number;
}

export interface ElevenLabsListPronunciationDictionariesMethod {
  (
    req?: ElevenLabsListPronunciationDictionariesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsListPronunciationDictionariesResponse>;
  schema: z.ZodType<ElevenLabsListPronunciationDictionariesRequest>;
}

export interface ElevenLabsAddPronunciationDictionaryFromFileMethod {
  (
    req: ElevenLabsAddPronunciationDictionaryFromFileRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAddPronunciationDictionaryResponse>;
  schema: z.ZodType<ElevenLabsAddPronunciationDictionaryFromFileRequest>;
}

export interface ElevenLabsAddPronunciationDictionaryFromRulesMethod {
  (
    req: ElevenLabsAddPronunciationDictionaryFromRulesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAddPronunciationDictionaryResponse>;
  schema: z.ZodType<ElevenLabsAddPronunciationDictionaryFromRulesRequest>;
}

export interface ElevenLabsGetPronunciationDictionaryMethod {
  (
    id: string,
    req?: ElevenLabsGetPronunciationDictionaryRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsGetPronunciationDictionaryResponse>;
  schema: z.ZodType<ElevenLabsGetPronunciationDictionaryRequest>;
}

export interface ElevenLabsUpdatePronunciationDictionaryMethod {
  (
    id: string,
    req?: ElevenLabsUpdatePronunciationDictionaryRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsPronunciationDictionaryMetadata>;
  schema: z.ZodType<ElevenLabsUpdatePronunciationDictionaryRequest>;
}

export interface ElevenLabsAddPronunciationDictionaryRulesMethod {
  (
    id: string,
    req: ElevenLabsAddPronunciationDictionaryRulesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsPronunciationDictionaryRulesResponse>;
  schema: z.ZodType<ElevenLabsAddPronunciationDictionaryRulesRequest>;
}

export interface ElevenLabsRemovePronunciationDictionaryRulesMethod {
  (
    id: string,
    req: ElevenLabsRemovePronunciationDictionaryRulesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsPronunciationDictionaryRulesResponse>;
  schema: z.ZodType<ElevenLabsRemovePronunciationDictionaryRulesRequest>;
}

export interface ElevenLabsSetPronunciationDictionaryRulesMethod {
  (
    id: string,
    req: ElevenLabsSetPronunciationDictionaryRulesRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsPronunciationDictionaryRulesResponse>;
  schema: z.ZodType<ElevenLabsSetPronunciationDictionaryRulesRequest>;
}

export interface ElevenLabsDownloadPronunciationDictionaryMethod {
  (
    id: string,
    versionId: string,
    req?: ElevenLabsDownloadPronunciationDictionaryRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsDownloadPronunciationDictionaryRequest>;
}

export interface ElevenLabsPronunciationDictionariesNamespace {
  list: ElevenLabsListPronunciationDictionariesMethod;
  addFromFile: ElevenLabsAddPronunciationDictionaryFromFileMethod;
  addFromRules: ElevenLabsAddPronunciationDictionaryFromRulesMethod;
  get: ElevenLabsGetPronunciationDictionaryMethod;
  update: ElevenLabsUpdatePronunciationDictionaryMethod;
  addRules: ElevenLabsAddPronunciationDictionaryRulesMethod;
  removeRules: ElevenLabsRemovePronunciationDictionaryRulesMethod;
  setRules: ElevenLabsSetPronunciationDictionaryRulesMethod;
  download: ElevenLabsDownloadPronunciationDictionaryMethod;
}

export interface ElevenLabsGetPronunciationDictionariesNamespace {
  list: ElevenLabsListPronunciationDictionariesMethod;
  get: ElevenLabsGetPronunciationDictionaryMethod;
  download: ElevenLabsDownloadPronunciationDictionaryMethod;
}

export interface ElevenLabsPostPronunciationDictionariesNamespace {
  addFromFile: ElevenLabsAddPronunciationDictionaryFromFileMethod;
  addFromRules: ElevenLabsAddPronunciationDictionaryFromRulesMethod;
  addRules: ElevenLabsAddPronunciationDictionaryRulesMethod;
  removeRules: ElevenLabsRemovePronunciationDictionaryRulesMethod;
  setRules: ElevenLabsSetPronunciationDictionaryRulesMethod;
}

export interface ElevenLabsPatchPronunciationDictionariesNamespace {
  update: ElevenLabsUpdatePronunciationDictionaryMethod;
}

export interface ElevenLabsV1Namespace {
  pronunciationDictionaries: ElevenLabsPronunciationDictionariesNamespace;
  models: ElevenLabsListModelsMethod;
  voices: ElevenLabsGetVoiceMethod;
  sharedVoices: ElevenLabsSharedVoicesMethod;
  similarVoices: ElevenLabsSimilarVoicesMethod;
  soundGeneration: ElevenLabsSoundGenerationMethod;
  audioIsolation: ElevenLabsAudioIsolationMethod;
  forcedAlignment: ElevenLabsForcedAlignmentMethod;
  music: ElevenLabsMusicMethod;
  speechEngine: ElevenLabsSpeechEngineNamespace;
  productions: ElevenLabsProductionsNamespace;
  textToSpeech: ElevenLabsTextToSpeechMethod;
  textToDialogue: ElevenLabsTextToDialogueMethod;
  textToVoice: ElevenLabsTextToVoiceMethod;
  singleUseToken: ElevenLabsCreateSingleUseTokenMethod;
  speechToText: ElevenLabsSpeechToTextMethod;
  speechToSpeech: ElevenLabsSpeechToSpeechMethod;
  dubbing: ElevenLabsDubbingNamespace;
  studio: ElevenLabsStudioNamespace;
  user: ElevenLabsUserNamespace;
  workspace: ElevenLabsWorkspaceNamespace;
  convai: ElevenLabsConvaiNamespace;
  history: ElevenLabsHistoryNamespace;
}

export interface ElevenLabsV2Namespace {
  voices: ElevenLabsListVoicesMethod;
}

export interface ElevenLabsPostConvaiAgentsNamespace {
  create: ElevenLabsCreateAgentMethod;
  duplicate: ElevenLabsDuplicateAgentMethod;
  avatar: ElevenLabsPostAgentAvatarMethod;
  simulateConversation: ElevenLabsSimulateConversationMethod;
  drafts: {
    create: ElevenLabsCreateAgentDraftMethod;
  };
  deployments: ElevenLabsCreateAgentDeploymentMethod;
  runTests: ElevenLabsRunAgentTestsMethod;
  branches: {
    create: ElevenLabsCreateAgentBranchMethod;
    rebase: ElevenLabsRebaseAgentBranchMethod;
    merge: ElevenLabsMergeAgentBranchMethod;
  };
}

export interface ElevenLabsPostConvaiToolsNamespace {
  create: ElevenLabsCreateToolMethod;
}

export interface ElevenLabsPostConvaiAgentTestingNamespace {
  create: ElevenLabsCreateAgentTestMethod;
  summaries: ElevenLabsGetAgentTestSummariesMethod;
  bulkMove: ElevenLabsBulkMoveAgentTestsMethod;
  folders: {
    create: ElevenLabsCreateAgentTestFolderMethod;
  };
}

export interface ElevenLabsPostConvaiTestInvocationsNamespace {
  resubmit: ElevenLabsResubmitTestsMethod;
}

export interface ElevenLabsPostConvaiKnowledgeBaseNamespace {
  url: ElevenLabsCreateKnowledgeBaseDocumentFromUrlMethod;
  text: ElevenLabsCreateKnowledgeBaseDocumentFromTextMethod;
  file: ElevenLabsCreateKnowledgeBaseDocumentFromFileMethod;
  folder: ElevenLabsCreateKnowledgeBaseFolderMethod;
  refresh: ElevenLabsRefreshKnowledgeBaseDocumentMethod;
  ragIndex: {
    batch: ElevenLabsComputeKnowledgeBaseRagIndexesMethod;
    compute: ElevenLabsComputeKnowledgeBaseDocumentRagIndexMethod;
  };
  bulkMove: ElevenLabsBulkMoveKnowledgeBaseDocumentsMethod;
  move: ElevenLabsMoveKnowledgeBaseEntityMethod;
}

export interface ElevenLabsPostConvaiConversationsNamespace {
  feedback: ElevenLabsConversationFeedbackMethod;
  files: ElevenLabsUploadConversationFileMethod;
  tags: ElevenLabsAssignConversationTagsMethod;
  analysis: ElevenLabsConvaiConversationAnalysisNamespace;
}

export interface ElevenLabsPostConvaiPhoneNumbersNamespace {
  create: ElevenLabsCreatePhoneNumberMethod;
}

export interface ElevenLabsPostConvaiAgentNamespace {
  llmUsage: {
    calculate: ElevenLabsCalculateAgentLlmUsageMethod;
  };
}

export interface ElevenLabsPostConvaiNamespace {
  agents: ElevenLabsPostConvaiAgentsNamespace;
  agent: ElevenLabsPostConvaiAgentNamespace;
  agentTesting: ElevenLabsPostConvaiAgentTestingNamespace;
  testInvocations: ElevenLabsPostConvaiTestInvocationsNamespace;
  tools: ElevenLabsPostConvaiToolsNamespace;
  mcpServers: ElevenLabsPostConvaiMcpServersNamespace;
  knowledgeBase: ElevenLabsPostConvaiKnowledgeBaseNamespace;
  conversations: ElevenLabsPostConvaiConversationsNamespace;
  phoneNumbers: ElevenLabsPostConvaiPhoneNumbersNamespace;
  twilio: ElevenLabsConvaiTwilioNamespace;
  sipTrunk: ElevenLabsConvaiSipTrunkNamespace;
}

export interface ElevenLabsPostV1Namespace {
  pronunciationDictionaries: ElevenLabsPostPronunciationDictionariesNamespace;
  soundGeneration: ElevenLabsSoundGenerationMethod;
  audioIsolation: ElevenLabsAudioIsolationMethod;
  forcedAlignment: ElevenLabsForcedAlignmentMethod;
  music: ElevenLabsMusicMethod;
  speechEngine: {
    create: ElevenLabsCreateSpeechEngineMethod;
  };
  productions: {
    orders: {
      create: ElevenLabsCreateOrderMethod;
      submit: ElevenLabsSubmitOrderMethod;
      items: { upsert: ElevenLabsUpsertOrderItemMethod };
      media: { register: ElevenLabsRegisterOrderMediaMethod };
    };
  };
  textToSpeech: ElevenLabsTextToSpeechMethod;
  textToDialogue: ElevenLabsTextToDialogueMethod;
  textToVoice: ElevenLabsTextToVoiceMethod;
  singleUseToken: ElevenLabsCreateSingleUseTokenMethod;
  speechToText: ElevenLabsSpeechToTextMethod;
  speechToSpeech: ElevenLabsSpeechToSpeechMethod;
  similarVoices: ElevenLabsSimilarVoicesMethod;
  voices: ElevenLabsPostV1VoicesNamespace;
  workspace: ElevenLabsWorkspaceNamespace;
  convai: ElevenLabsPostConvaiNamespace;
  history: { download: ElevenLabsHistoryDownloadMethod };
}

export interface ElevenLabsPostV1VoicesSettingsNamespace {
  edit: ElevenLabsEditVoiceSettingsMethod;
}

export interface ElevenLabsPostV1VoicesNamespace {
  add: ElevenLabsAddVoiceMethod;
  edit: ElevenLabsEditVoiceMethod;
  settings: ElevenLabsPostV1VoicesSettingsNamespace;
  pvc: ElevenLabsPostV1VoicesPvcNamespace;
}

export interface ElevenLabsPostV1VoicesPvcNamespace {
  (
    req: ElevenLabsCreatePvcVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsCreatePvcVoiceResponse>;
  schema: z.ZodType<ElevenLabsCreatePvcVoiceRequest>;
  captcha: ElevenLabsPvcVoiceCaptchaMethod;
  samples: ElevenLabsPostV1VoicesPvcSamplesNamespace;
  train: ElevenLabsPvcTrainMethod;
  verification: ElevenLabsPvcManualVerificationMethod;
}

export type ElevenLabsPostV1VoicesPvcSamplesNamespace =
  ElevenLabsUpdatePvcVoiceSampleMethod;

export interface ElevenLabsPostNamespace {
  v1: ElevenLabsPostV1Namespace;
}

export interface ElevenLabsPatchConvaiAgentsNamespace {
  update: ElevenLabsUpdateAgentMethod;
  branches: {
    update: ElevenLabsUpdateAgentBranchMethod;
  };
}

export interface ElevenLabsPatchConvaiToolsNamespace {
  update: ElevenLabsUpdateToolMethod;
}

export interface ElevenLabsPostConvaiMcpServersNamespace {
  create: ElevenLabsCreateMcpServerMethod;
  toolApprovals: {
    create: ElevenLabsCreateMcpServerToolApprovalMethod;
  };
  toolConfigs: {
    create: ElevenLabsCreateMcpToolConfigOverrideMethod;
  };
}

export interface ElevenLabsPatchConvaiMcpServersNamespace {
  update: ElevenLabsUpdateMcpServerMethod;
  toolConfigs: {
    update: ElevenLabsUpdateMcpToolConfigOverrideMethod;
  };
}

export interface ElevenLabsPatchConvaiAgentTestingNamespace {
  folders: {
    update: ElevenLabsUpdateAgentTestFolderMethod;
  };
}

export interface ElevenLabsPatchConvaiKnowledgeBaseNamespace {
  update: ElevenLabsUpdateKnowledgeBaseDocumentMethod;
  updateFile: ElevenLabsUpdateKnowledgeBaseFileDocumentMethod;
}

export interface ElevenLabsPatchConvaiPhoneNumbersNamespace {
  update: ElevenLabsUpdatePhoneNumberMethod;
}

export interface ElevenLabsPatchConvaiNamespace {
  agents: ElevenLabsPatchConvaiAgentsNamespace;
  agentTesting: ElevenLabsPatchConvaiAgentTestingNamespace;
  tools: ElevenLabsPatchConvaiToolsNamespace;
  mcpServers: ElevenLabsPatchConvaiMcpServersNamespace;
  knowledgeBase: ElevenLabsPatchConvaiKnowledgeBaseNamespace;
  phoneNumbers: ElevenLabsPatchConvaiPhoneNumbersNamespace;
}

export interface ElevenLabsPatchV1Namespace {
  pronunciationDictionaries: ElevenLabsPatchPronunciationDictionariesNamespace;
  speechEngine: {
    update: ElevenLabsUpdateSpeechEngineMethod;
  };
  productions: {
    orders: { update: ElevenLabsUpdateOrderMethod };
  };
  convai: ElevenLabsPatchConvaiNamespace;
}

export interface ElevenLabsPatchNamespace {
  v1: ElevenLabsPatchV1Namespace;
}

export interface ElevenLabsPutConvaiAgentTestingNamespace {
  update: ElevenLabsUpdateAgentTestMethod;
}

export interface ElevenLabsPutConvaiNamespace {
  agentTesting: ElevenLabsPutConvaiAgentTestingNamespace;
}

export interface ElevenLabsPutV1Namespace {
  convai: ElevenLabsPutConvaiNamespace;
}

export interface ElevenLabsPutNamespace {
  v1: ElevenLabsPutV1Namespace;
}

export interface ElevenLabsGetConvaiAgentsNamespace {
  list: ElevenLabsListAgentsMethod;
  get: ElevenLabsGetAgentMethod;
  widget: ElevenLabsGetAgentWidgetMethod;
  link: ElevenLabsGetAgentLinkMethod;
  summaries: ElevenLabsGetAgentSummariesMethod;
  versions: {
    get: ElevenLabsGetAgentVersionMethod;
  };
  topics: ElevenLabsGetAgentTopicsMethod;
  branches: ElevenLabsConvaiAgentBranchesNamespace;
}

export interface ElevenLabsGetConvaiToolsNamespace {
  list: ElevenLabsListToolsMethod;
  get: ElevenLabsGetToolMethod;
  dependentAgents: ElevenLabsGetToolDependentAgentsMethod;
  executions: ElevenLabsGetToolExecutionsMethod;
}

export interface ElevenLabsGetConvaiMcpServersNamespace {
  list: ElevenLabsListMcpServersMethod;
  get: ElevenLabsGetMcpServerMethod;
  tools: ElevenLabsListMcpServerToolsMethod;
  toolConfigs: {
    get: ElevenLabsGetMcpToolConfigOverrideMethod;
  };
}

export interface ElevenLabsGetConvaiAgentTestingNamespace {
  list: ElevenLabsListAgentTestsMethod;
  get: ElevenLabsGetAgentTestMethod;
  folders: {
    get: ElevenLabsGetAgentTestFolderMethod;
  };
}

export interface ElevenLabsGetConvaiTestInvocationsNamespace {
  list: ElevenLabsListTestInvocationsMethod;
  get: ElevenLabsGetTestInvocationMethod;
}

export interface ElevenLabsGetConvaiKnowledgeBaseNamespace {
  list: ElevenLabsListKnowledgeBaseDocumentsMethod;
  get: ElevenLabsGetKnowledgeBaseDocumentMethod;
  summaries: ElevenLabsGetKnowledgeBaseSummariesMethod;
  search: ElevenLabsSearchKnowledgeBaseContentMethod;
  content: ElevenLabsGetKnowledgeBaseDocumentContentMethod;
  chunks: ElevenLabsConvaiKnowledgeBaseChunksNamespace;
  dependentAgents: ElevenLabsGetKnowledgeBaseDependentAgentsMethod;
  sourceFileUrl: ElevenLabsGetKnowledgeBaseSourceFileUrlMethod;
  ragIndex: {
    overview: ElevenLabsGetKnowledgeBaseRagIndexOverviewMethod;
    get: ElevenLabsGetKnowledgeBaseDocumentRagIndexesMethod;
  };
}

export interface ElevenLabsGetConvaiConversationsNamespace {
  list: ElevenLabsListConversationsMethod;
  get: ElevenLabsGetConversationMethod;
  audio: ElevenLabsGetConversationAudioMethod;
  messages: ElevenLabsConvaiConversationMessagesNamespace;
  sipMessages: ElevenLabsGetConversationSipMessagesMethod;
}

export interface ElevenLabsGetConvaiConversationNamespace {
  getSignedUrl: ElevenLabsGetSignedUrlMethod;
  token: ElevenLabsGetConversationTokenMethod;
}

export interface ElevenLabsGetConvaiPhoneNumbersNamespace {
  list: ElevenLabsListPhoneNumbersMethod;
  get: ElevenLabsGetPhoneNumberMethod;
}

export interface ElevenLabsGetConvaiAgentNamespace {
  knowledgeBase: {
    size: ElevenLabsGetAgentKnowledgeBaseSizeMethod;
  };
}

export interface ElevenLabsGetConvaiAnalyticsNamespace {
  liveCount: ElevenLabsGetLiveConversationCountMethod;
}

export interface ElevenLabsGetConvaiNamespace {
  agents: ElevenLabsGetConvaiAgentsNamespace;
  agent: ElevenLabsGetConvaiAgentNamespace;
  analytics: ElevenLabsGetConvaiAnalyticsNamespace;
  agentTesting: ElevenLabsGetConvaiAgentTestingNamespace;
  testInvocations: ElevenLabsGetConvaiTestInvocationsNamespace;
  tools: ElevenLabsGetConvaiToolsNamespace;
  mcpServers: ElevenLabsGetConvaiMcpServersNamespace;
  knowledgeBase: ElevenLabsGetConvaiKnowledgeBaseNamespace;
  conversations: ElevenLabsGetConvaiConversationsNamespace;
  conversation: ElevenLabsGetConvaiConversationNamespace;
  phoneNumbers: ElevenLabsGetConvaiPhoneNumbersNamespace;
}

export interface ElevenLabsGetV1Namespace {
  pronunciationDictionaries: ElevenLabsGetPronunciationDictionariesNamespace;
  models: ElevenLabsListModelsMethod;
  voices: ElevenLabsGetVoiceMethod;
  sharedVoices: ElevenLabsSharedVoicesMethod;
  user: ElevenLabsUserNamespace;
  textToVoice: ElevenLabsGetV1TextToVoiceNamespace;
  audioIsolation: {
    history: {
      list: ElevenLabsAudioIsolationHistoryListMethod;
    };
  };
  speechEngine: {
    list: ElevenLabsListSpeechEnginesMethod;
    get: ElevenLabsGetSpeechEngineMethod;
  };
  productions: {
    orders: {
      list: ElevenLabsListOrdersMethod;
      get: ElevenLabsGetOrderMethod;
      deliverables: ElevenLabsGetOrderDeliverablesMethod;
      languages: ElevenLabsGetOrderLanguagesMethod;
      media: { get: ElevenLabsGetOrderMediaMethod };
    };
  };
  convai: ElevenLabsGetConvaiNamespace;
  history: {
    list: ElevenLabsHistoryListMethod;
    get: ElevenLabsHistoryGetMethod;
    audio: ElevenLabsHistoryGetAudioMethod;
  };
}

export interface ElevenLabsGetV2Namespace {
  voices: ElevenLabsListVoicesMethod;
}

export interface ElevenLabsGetNamespace {
  docs: ElevenLabsDocsMethod;
  v1: ElevenLabsGetV1Namespace;
  v2: ElevenLabsGetV2Namespace;
}

export interface ElevenLabsDeleteConvaiAgentsNamespace {
  delete: ElevenLabsDeleteAgentMethod;
  drafts: {
    delete: ElevenLabsDeleteAgentDraftMethod;
  };
}

export interface ElevenLabsDeleteConvaiToolsNamespace {
  delete: ElevenLabsDeleteToolMethod;
}

export interface ElevenLabsDeleteConvaiMcpServersNamespace {
  delete: ElevenLabsDeleteMcpServerMethod;
  toolApprovals: {
    delete: ElevenLabsDeleteMcpServerToolApprovalMethod;
  };
  toolConfigs: {
    delete: ElevenLabsDeleteMcpToolConfigOverrideMethod;
  };
}

export interface ElevenLabsDeleteConvaiAgentTestingNamespace {
  delete: ElevenLabsDeleteAgentTestMethod;
  folders: {
    delete: ElevenLabsDeleteAgentTestFolderMethod;
  };
}

export interface ElevenLabsDeleteConvaiKnowledgeBaseNamespace {
  delete: ElevenLabsDeleteKnowledgeBaseDocumentMethod;
  ragIndex: {
    delete: ElevenLabsDeleteKnowledgeBaseDocumentRagIndexMethod;
  };
}

export interface ElevenLabsDeleteConvaiConversationsNamespace {
  delete: ElevenLabsDeleteConversationMethod;
  files: {
    delete: ElevenLabsDeleteConversationFileMethod;
  };
  tags: {
    unassign: ElevenLabsUnassignConversationTagMethod;
  };
}

export interface ElevenLabsDeleteConvaiPhoneNumbersNamespace {
  delete: ElevenLabsDeletePhoneNumberMethod;
}

export interface ElevenLabsDeleteConvaiNamespace {
  agents: ElevenLabsDeleteConvaiAgentsNamespace;
  agentTesting: ElevenLabsDeleteConvaiAgentTestingNamespace;
  tools: ElevenLabsDeleteConvaiToolsNamespace;
  mcpServers: ElevenLabsDeleteConvaiMcpServersNamespace;
  knowledgeBase: ElevenLabsDeleteConvaiKnowledgeBaseNamespace;
  conversations: ElevenLabsDeleteConvaiConversationsNamespace;
  phoneNumbers: ElevenLabsDeleteConvaiPhoneNumbersNamespace;
}

export interface ElevenLabsDeleteV1Namespace {
  audioIsolation: {
    history: {
      delete: ElevenLabsAudioIsolationHistoryDeleteMethod;
    };
  };
  voices: {
    delete: ElevenLabsDeleteVoiceMethod;
    samples: {
      delete: ElevenLabsDeleteVoiceSampleMethod;
    };
    pvc: {
      samples: {
        delete: ElevenLabsDeletePvcVoiceSampleMethod;
      };
    };
  };
  productions: {
    orders: {
      items: { remove: ElevenLabsRemoveOrderItemMethod };
    };
  };
  speechEngine: {
    delete: ElevenLabsDeleteSpeechEngineMethod;
  };
  convai: ElevenLabsDeleteConvaiNamespace;
  history: {
    delete: ElevenLabsHistoryDeleteMethod;
  };
}

export interface ElevenLabsDeleteNamespace {
  v1: ElevenLabsDeleteV1Namespace;
}

export interface ElevenLabsProvider {
  docs: ElevenLabsDocsMethod;
  v1: ElevenLabsV1Namespace;
  v2: ElevenLabsV2Namespace;
  post: ElevenLabsPostNamespace;
  patch: ElevenLabsPatchNamespace;
  put: ElevenLabsPutNamespace;
  get: ElevenLabsGetNamespace;
  delete: ElevenLabsDeleteNamespace;
}
