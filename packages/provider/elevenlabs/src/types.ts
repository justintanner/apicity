import type { z } from "zod";
import type {
  ElevenLabsGetVoiceRequest,
  ElevenLabsListVoicesRequest,
  ElevenLabsPvcVoiceCaptchaRequest,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
} from "./zod";

export type {
  ElevenLabsOptions,
  ElevenLabsGetVoiceRequest,
  ElevenLabsListVoicesRequest,
  ElevenLabsPvcVoiceCaptchaRequest,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
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

export interface ElevenLabsPvcVoiceCaptchaResponse {
  status: string;
}

export type ElevenLabsGetPvcVoiceCaptchaResponse = Record<string, unknown>;

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

export interface ElevenLabsTextToSpeechMethod {
  (
    voiceId: string,
    req: ElevenLabsTextToSpeechRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsTextToSpeechRequest>;
}

export interface ElevenLabsTextToDialogueMethod {
  (
    req: ElevenLabsTextToDialogueRequest,
    signal?: AbortSignal
  ): Promise<ArrayBuffer>;
  schema: z.ZodType<ElevenLabsTextToDialogueRequest>;
}

export interface ElevenLabsSpeechToTextMethod {
  (
    req: ElevenLabsSpeechToTextRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsSpeechToTextResponse>;
  schema: z.ZodType<ElevenLabsSpeechToTextRequest>;
}

export interface ElevenLabsStartSpeakerSeparationMethod {
  (
    voiceId: string,
    sampleId: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsStartSpeakerSeparationResponse>;
  schema: undefined;
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

export interface ElevenLabsPvcVoiceNamespace {
  captcha: ElevenLabsPvcVoiceCaptchaMethod;
  samples: ElevenLabsPvcVoiceSamplesNamespace;
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

// -- Namespace interfaces ----------------------------------------------------

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

export interface ElevenLabsPvcVoiceSamplesNamespace {
  separateSpeakers: ElevenLabsStartSpeakerSeparationMethod;
}

export type ElevenLabsPvcVoicesNamespace = ElevenLabsPvcVoiceNamespace;

export interface ElevenLabsV1Namespace {
  models: ElevenLabsListModelsMethod;
  voices: ElevenLabsGetVoiceMethod;
  soundGeneration: ElevenLabsSoundGenerationMethod;
  textToSpeech: ElevenLabsTextToSpeechMethod;
  textToDialogue: ElevenLabsTextToDialogueMethod;
  speechToText: ElevenLabsSpeechToTextMethod;
  user: ElevenLabsUserNamespace;
  workspace: ElevenLabsWorkspaceNamespace;
}

export interface ElevenLabsV2Namespace {
  voices: ElevenLabsListVoicesMethod;
}

export interface ElevenLabsPostV1Namespace {
  soundGeneration: ElevenLabsSoundGenerationMethod;
  textToSpeech: ElevenLabsTextToSpeechMethod;
  textToDialogue: ElevenLabsTextToDialogueMethod;
  speechToText: ElevenLabsSpeechToTextMethod;
  voices: ElevenLabsPostV1VoicesNamespace;
  workspace: ElevenLabsWorkspaceNamespace;
}

export interface ElevenLabsPostV1VoicesNamespace {
  pvc: ElevenLabsPvcVoiceNamespace;
}

export interface ElevenLabsPostNamespace {
  v1: ElevenLabsPostV1Namespace;
}

export interface ElevenLabsGetV1Namespace {
  models: ElevenLabsListModelsMethod;
  voices: ElevenLabsGetVoiceMethod;
  user: ElevenLabsUserNamespace;
}

export interface ElevenLabsGetV2Namespace {
  voices: ElevenLabsListVoicesMethod;
}

export interface ElevenLabsGetNamespace {
  docs: ElevenLabsDocsMethod;
  v1: ElevenLabsGetV1Namespace;
  v2: ElevenLabsGetV2Namespace;
}

export interface ElevenLabsProvider {
  docs: ElevenLabsDocsMethod;
  v1: ElevenLabsV1Namespace;
  v2: ElevenLabsV2Namespace;
  post: ElevenLabsPostNamespace;
  get: ElevenLabsGetNamespace;
}
