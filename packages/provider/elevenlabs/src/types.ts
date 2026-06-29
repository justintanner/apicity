import type { z } from "zod";
import type {
  ElevenLabsCreatePvcVoiceRequest,
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
  ElevenLabsUpdatePvcVoiceSampleRequest,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
  ElevenLabsCreateAgentRequest,
  ElevenLabsGetAgentRequest,
  ElevenLabsListAgentsRequest,
  ElevenLabsUpdateAgentRequest,
  ElevenLabsGetAgentWidgetRequest,
  ElevenLabsListAgentBranchesRequest,
  ElevenLabsCreateToolRequest,
  ElevenLabsListToolsRequest,
  ElevenLabsUpdateToolRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
  ElevenLabsListKnowledgeBaseDocumentsRequest,
  ElevenLabsGetKnowledgeBaseDocumentRequest,
  ElevenLabsDeleteKnowledgeBaseDocumentRequest,
  ElevenLabsListConversationsRequest,
  ElevenLabsGetConversationRequest,
  ElevenLabsGetSignedUrlRequest,
  ElevenLabsCreatePhoneNumberRequest,
  ElevenLabsListPhoneNumbersRequest,
  ElevenLabsUpdatePhoneNumberRequest,
  ElevenLabsTwilioOutboundCallRequest,
  ElevenLabsSipTrunkOutboundCallRequest,
} from "./zod";

export type {
  ElevenLabsOptions,
  ElevenLabsCreatePvcVoiceRequest,
  ElevenLabsCreatePvcVoiceRequestInput,
  ElevenLabsCreatePvcVoiceParsedRequest,
  ElevenLabsGetVoiceRequest,
  ElevenLabsGetVoiceRequestInput,
  ElevenLabsGetVoiceParsedRequest,
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
  ElevenLabsCreateToolRequest,
  ElevenLabsCreateToolRequestInput,
  ElevenLabsCreateToolParsedRequest,
  ElevenLabsListToolsRequest,
  ElevenLabsListToolsRequestInput,
  ElevenLabsListToolsParsedRequest,
  ElevenLabsUpdateToolRequest,
  ElevenLabsUpdateToolRequestInput,
  ElevenLabsUpdateToolParsedRequest,
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
  ElevenLabsListConversationsRequest,
  ElevenLabsListConversationsRequestInput,
  ElevenLabsListConversationsParsedRequest,
  ElevenLabsGetConversationRequest,
  ElevenLabsGetConversationRequestInput,
  ElevenLabsGetConversationParsedRequest,
  ElevenLabsGetSignedUrlRequest,
  ElevenLabsGetSignedUrlRequestInput,
  ElevenLabsGetSignedUrlParsedRequest,
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

// -- Voice response shapes ---------------------------------------------------

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

// -- User/subscription response shapes ---------------------------------------

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

export interface ElevenLabsSubscription {
  tier: string;
  character_count: number;
  character_limit: number;
  remaining_character_count: number;
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

export type ElevenLabsUserSubscriptionResponse = ElevenLabsSubscription;

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
  settings: ElevenLabsGetVoiceSettingsMethod;
  pvc: ElevenLabsPvcVoiceNamespace;
}

export interface ElevenLabsGetVoiceSettingsMethod {
  (voiceId: string, signal?: AbortSignal): Promise<ElevenLabsVoiceSettings>;
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
  captcha: ElevenLabsPvcVoiceCaptchaMethod;
  samples: ElevenLabsPvcVoiceSamplesNamespace;
  train: ElevenLabsPvcTrainMethod;
  verification: ElevenLabsPvcManualVerificationMethod;
}

export interface ElevenLabsUserSubscriptionMethod {
  (signal?: AbortSignal): Promise<ElevenLabsUserSubscriptionResponse>;
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

// -- Namespace interfaces ----------------------------------------------------

export interface ElevenLabsConvaiAgentsNamespace {
  create: ElevenLabsCreateAgentMethod;
  list: ElevenLabsListAgentsMethod;
  get: ElevenLabsGetAgentMethod;
  update: ElevenLabsUpdateAgentMethod;
  delete: ElevenLabsDeleteAgentMethod;
  widget: ElevenLabsGetAgentWidgetMethod;
  link: ElevenLabsGetAgentLinkMethod;
  branches: ElevenLabsListAgentBranchesMethod;
}

export interface ElevenLabsConvaiToolsNamespace {
  create: ElevenLabsCreateToolMethod;
  list: ElevenLabsListToolsMethod;
  get: ElevenLabsGetToolMethod;
  update: ElevenLabsUpdateToolMethod;
  delete: ElevenLabsDeleteToolMethod;
}

export interface ElevenLabsConvaiKnowledgeBaseNamespace {
  url: ElevenLabsCreateKnowledgeBaseDocumentFromUrlMethod;
  text: ElevenLabsCreateKnowledgeBaseDocumentFromTextMethod;
  file: ElevenLabsCreateKnowledgeBaseDocumentFromFileMethod;
  list: ElevenLabsListKnowledgeBaseDocumentsMethod;
  get: ElevenLabsGetKnowledgeBaseDocumentMethod;
  delete: ElevenLabsDeleteKnowledgeBaseDocumentMethod;
}

export interface ElevenLabsConvaiConversationsNamespace {
  list: ElevenLabsListConversationsMethod;
  get: ElevenLabsGetConversationMethod;
  delete: ElevenLabsDeleteConversationMethod;
  audio: ElevenLabsGetConversationAudioMethod;
}

export interface ElevenLabsConvaiConversationNamespace {
  getSignedUrl: ElevenLabsGetSignedUrlMethod;
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

export interface ElevenLabsConvaiNamespace {
  agents: ElevenLabsConvaiAgentsNamespace;
  tools: ElevenLabsConvaiToolsNamespace;
  knowledgeBase: ElevenLabsConvaiKnowledgeBaseNamespace;
  conversations: ElevenLabsConvaiConversationsNamespace;
  conversation: ElevenLabsConvaiConversationNamespace;
  phoneNumbers: ElevenLabsConvaiPhoneNumbersNamespace;
  twilio: ElevenLabsConvaiTwilioNamespace;
  sipTrunk: ElevenLabsConvaiSipTrunkNamespace;
}

export interface ElevenLabsUserNamespace {
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

export interface ElevenLabsPvcVoiceSamplesSpeakersNamespace {
  audio: ElevenLabsGetSeparatedSpeakerAudioMethod;
}

export interface ElevenLabsPvcVoiceSamplesNamespace extends ElevenLabsUpdatePvcVoiceSampleMethod {
  delete: ElevenLabsDeletePvcVoiceSampleMethod;
  speakers: ElevenLabsPvcVoiceSamplesSpeakersNamespace;
  waveform: ElevenLabsPvcVoiceSampleWaveformMethod;
}

export type ElevenLabsPvcVoicesNamespace = ElevenLabsPvcVoiceNamespace;

export interface ElevenLabsV1Namespace {
  models: ElevenLabsListModelsMethod;
  voices: ElevenLabsGetVoiceMethod;
  soundGeneration: ElevenLabsSoundGenerationMethod;
  textToSpeech: ElevenLabsTextToSpeechMethod;
  textToDialogue: ElevenLabsTextToDialogueMethod;
  speechToText: ElevenLabsSpeechToTextMethod;
  speechToSpeech: ElevenLabsSpeechToSpeechMethod;
  user: ElevenLabsUserNamespace;
  workspace: ElevenLabsWorkspaceNamespace;
  convai: ElevenLabsConvaiNamespace;
}

export interface ElevenLabsV2Namespace {
  voices: ElevenLabsListVoicesMethod;
}

export interface ElevenLabsPostConvaiAgentsNamespace {
  create: ElevenLabsCreateAgentMethod;
}

export interface ElevenLabsPostConvaiToolsNamespace {
  create: ElevenLabsCreateToolMethod;
}

export interface ElevenLabsPostConvaiKnowledgeBaseNamespace {
  url: ElevenLabsCreateKnowledgeBaseDocumentFromUrlMethod;
  text: ElevenLabsCreateKnowledgeBaseDocumentFromTextMethod;
  file: ElevenLabsCreateKnowledgeBaseDocumentFromFileMethod;
}

export interface ElevenLabsPostConvaiPhoneNumbersNamespace {
  create: ElevenLabsCreatePhoneNumberMethod;
}

export interface ElevenLabsPostConvaiNamespace {
  agents: ElevenLabsPostConvaiAgentsNamespace;
  tools: ElevenLabsPostConvaiToolsNamespace;
  knowledgeBase: ElevenLabsPostConvaiKnowledgeBaseNamespace;
  phoneNumbers: ElevenLabsPostConvaiPhoneNumbersNamespace;
  twilio: ElevenLabsConvaiTwilioNamespace;
  sipTrunk: ElevenLabsConvaiSipTrunkNamespace;
}

export interface ElevenLabsPostV1Namespace {
  soundGeneration: ElevenLabsSoundGenerationMethod;
  textToSpeech: ElevenLabsTextToSpeechMethod;
  textToDialogue: ElevenLabsTextToDialogueMethod;
  speechToText: ElevenLabsSpeechToTextMethod;
  speechToSpeech: ElevenLabsSpeechToSpeechMethod;
  voices: ElevenLabsPostV1VoicesNamespace;
  workspace: ElevenLabsWorkspaceNamespace;
  convai: ElevenLabsPostConvaiNamespace;
}

export interface ElevenLabsPostV1VoicesNamespace {
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
}

export interface ElevenLabsPatchConvaiToolsNamespace {
  update: ElevenLabsUpdateToolMethod;
}

export interface ElevenLabsPatchConvaiPhoneNumbersNamespace {
  update: ElevenLabsUpdatePhoneNumberMethod;
}

export interface ElevenLabsPatchConvaiNamespace {
  agents: ElevenLabsPatchConvaiAgentsNamespace;
  tools: ElevenLabsPatchConvaiToolsNamespace;
  phoneNumbers: ElevenLabsPatchConvaiPhoneNumbersNamespace;
}

export interface ElevenLabsPatchV1Namespace {
  convai: ElevenLabsPatchConvaiNamespace;
}

export interface ElevenLabsPatchNamespace {
  v1: ElevenLabsPatchV1Namespace;
}

export interface ElevenLabsGetConvaiAgentsNamespace {
  list: ElevenLabsListAgentsMethod;
  get: ElevenLabsGetAgentMethod;
  widget: ElevenLabsGetAgentWidgetMethod;
  link: ElevenLabsGetAgentLinkMethod;
  branches: ElevenLabsListAgentBranchesMethod;
}

export interface ElevenLabsGetConvaiToolsNamespace {
  list: ElevenLabsListToolsMethod;
  get: ElevenLabsGetToolMethod;
}

export interface ElevenLabsGetConvaiKnowledgeBaseNamespace {
  list: ElevenLabsListKnowledgeBaseDocumentsMethod;
  get: ElevenLabsGetKnowledgeBaseDocumentMethod;
}

export interface ElevenLabsGetConvaiConversationsNamespace {
  list: ElevenLabsListConversationsMethod;
  get: ElevenLabsGetConversationMethod;
  audio: ElevenLabsGetConversationAudioMethod;
}

export interface ElevenLabsGetConvaiConversationNamespace {
  getSignedUrl: ElevenLabsGetSignedUrlMethod;
}

export interface ElevenLabsGetConvaiPhoneNumbersNamespace {
  list: ElevenLabsListPhoneNumbersMethod;
  get: ElevenLabsGetPhoneNumberMethod;
}

export interface ElevenLabsGetConvaiNamespace {
  agents: ElevenLabsGetConvaiAgentsNamespace;
  tools: ElevenLabsGetConvaiToolsNamespace;
  knowledgeBase: ElevenLabsGetConvaiKnowledgeBaseNamespace;
  conversations: ElevenLabsGetConvaiConversationsNamespace;
  conversation: ElevenLabsGetConvaiConversationNamespace;
  phoneNumbers: ElevenLabsGetConvaiPhoneNumbersNamespace;
}

export interface ElevenLabsGetV1Namespace {
  models: ElevenLabsListModelsMethod;
  voices: ElevenLabsGetVoiceMethod;
  user: ElevenLabsUserNamespace;
  convai: ElevenLabsGetConvaiNamespace;
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
}

export interface ElevenLabsDeleteConvaiToolsNamespace {
  delete: ElevenLabsDeleteToolMethod;
}

export interface ElevenLabsDeleteConvaiKnowledgeBaseNamespace {
  delete: ElevenLabsDeleteKnowledgeBaseDocumentMethod;
}

export interface ElevenLabsDeleteConvaiConversationsNamespace {
  delete: ElevenLabsDeleteConversationMethod;
}

export interface ElevenLabsDeleteConvaiPhoneNumbersNamespace {
  delete: ElevenLabsDeletePhoneNumberMethod;
}

export interface ElevenLabsDeleteConvaiNamespace {
  agents: ElevenLabsDeleteConvaiAgentsNamespace;
  tools: ElevenLabsDeleteConvaiToolsNamespace;
  knowledgeBase: ElevenLabsDeleteConvaiKnowledgeBaseNamespace;
  conversations: ElevenLabsDeleteConvaiConversationsNamespace;
  phoneNumbers: ElevenLabsDeleteConvaiPhoneNumbersNamespace;
}

export interface ElevenLabsDeleteV1Namespace {
  voices: {
    pvc: {
      samples: {
        delete: ElevenLabsDeletePvcVoiceSampleMethod;
      };
    };
  };
  convai: ElevenLabsDeleteConvaiNamespace;
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
  get: ElevenLabsGetNamespace;
  delete: ElevenLabsDeleteNamespace;
}
