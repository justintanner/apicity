import type { z } from "zod";
import type {
  ElevenLabsSoundGenerationRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsSpeechToTextRequest,
} from "./zod";

export type {
  ElevenLabsOptions,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsSpeechToTextRequest,
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

// -- Method interfaces -------------------------------------------------------

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

export interface ElevenLabsUserSubscriptionMethod {
  (signal?: AbortSignal): Promise<ElevenLabsUserSubscriptionResponse>;
}

// -- Namespace interfaces ----------------------------------------------------

export interface ElevenLabsUserNamespace {
  subscription: ElevenLabsUserSubscriptionMethod;
}

export interface ElevenLabsV1Namespace {
  soundGeneration: ElevenLabsSoundGenerationMethod;
  textToSpeech: ElevenLabsTextToSpeechMethod;
  textToDialogue: ElevenLabsTextToDialogueMethod;
  speechToText: ElevenLabsSpeechToTextMethod;
  user: ElevenLabsUserNamespace;
}

export interface ElevenLabsPostV1Namespace {
  soundGeneration: ElevenLabsSoundGenerationMethod;
  textToSpeech: ElevenLabsTextToSpeechMethod;
  textToDialogue: ElevenLabsTextToDialogueMethod;
  speechToText: ElevenLabsSpeechToTextMethod;
}

export interface ElevenLabsPostNamespace {
  v1: ElevenLabsPostV1Namespace;
}

export interface ElevenLabsGetV1Namespace {
  user: ElevenLabsUserNamespace;
}

export interface ElevenLabsGetNamespace {
  v1: ElevenLabsGetV1Namespace;
}

export interface ElevenLabsProvider {
  v1: ElevenLabsV1Namespace;
  post: ElevenLabsPostNamespace;
  get: ElevenLabsGetNamespace;
}
