import type { z } from "zod";
import type {
  TelegramSendAnimationRequest,
  TelegramSendAudioRequest,
  TelegramSendChatActionRequest,
  TelegramSendChecklistRequest,
  TelegramSendContactRequest,
  TelegramSendDiceRequest,
  TelegramSendDocumentRequest,
  TelegramSendLivePhotoRequest,
  TelegramSendLocationRequest,
  TelegramSendMediaGroupRequest,
  TelegramSendMessageDraftRequest,
  TelegramSendMessageRequest,
  TelegramSendPaidMediaRequest,
  TelegramSendPhotoRequest,
  TelegramSendPollRequest,
  TelegramSendRichMessageDraftRequest,
  TelegramSendRichMessageRequest,
  TelegramSendVenueRequest,
  TelegramSendVideoNoteRequest,
  TelegramSendVideoRequest,
  TelegramSendVoiceRequest,
} from "./zod";

export type {
  TelegramInputFile,
  TelegramOptions,
  TelegramSendAnimationRequest,
  TelegramSendAudioRequest,
  TelegramSendChatActionRequest,
  TelegramSendChecklistRequest,
  TelegramSendContactRequest,
  TelegramSendDiceRequest,
  TelegramSendDocumentRequest,
  TelegramSendLivePhotoRequest,
  TelegramSendLocationRequest,
  TelegramSendMediaGroupRequest,
  TelegramSendMessageDraftRequest,
  TelegramSendMessageRequest,
  TelegramSendPaidMediaRequest,
  TelegramSendPhotoRequest,
  TelegramSendPollRequest,
  TelegramSendRichMessageDraftRequest,
  TelegramSendRichMessageRequest,
  TelegramSendVenueRequest,
  TelegramSendVideoNoteRequest,
  TelegramSendVideoRequest,
  TelegramSendVoiceRequest,
} from "./zod";

// -- Error -------------------------------------------------------------------

export class TelegramError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "TelegramError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- Response shapes ---------------------------------------------------------

export interface TelegramApiResponse<T> {
  ok: true;
  result: T;
}

export interface TelegramApiErrorResponse {
  ok: false;
  error_code: number;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  message_thread_id?: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  text?: string;
  caption?: string;
  photo?: Array<Record<string, unknown>>;
  video?: Record<string, unknown>;
  animation?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  document?: Record<string, unknown>;
  voice?: Record<string, unknown>;
  video_note?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  location?: Record<string, unknown>;
  venue?: Record<string, unknown>;
  poll?: Record<string, unknown>;
  dice?: Record<string, unknown>;
  checklist?: Record<string, unknown>;
  paid_media?: Record<string, unknown>;
  rich_message?: Record<string, unknown>;
  [key: string]: unknown;
}

export type TelegramMessageResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramMessagesResponse = TelegramApiResponse<TelegramMessage[]>;
export type TelegramTrueResponse = TelegramApiResponse<true>;

export type TelegramSendAnimationResponse = TelegramMessageResponse;
export type TelegramSendAudioResponse = TelegramMessageResponse;
export type TelegramSendChecklistResponse = TelegramMessageResponse;
export type TelegramSendContactResponse = TelegramMessageResponse;
export type TelegramSendDiceResponse = TelegramMessageResponse;
export type TelegramSendDocumentResponse = TelegramMessageResponse;
export type TelegramSendLivePhotoResponse = TelegramMessageResponse;
export type TelegramSendLocationResponse = TelegramMessageResponse;
export type TelegramSendMediaGroupResponse = TelegramMessagesResponse;
export type TelegramSendMessageResponse = TelegramMessageResponse;
export type TelegramSendPaidMediaResponse = TelegramMessageResponse;
export type TelegramSendPhotoResponse = TelegramMessageResponse;
export type TelegramSendPollResponse = TelegramMessageResponse;
export type TelegramSendRichMessageResponse = TelegramMessageResponse;
export type TelegramSendVenueResponse = TelegramMessageResponse;
export type TelegramSendVideoNoteResponse = TelegramMessageResponse;
export type TelegramSendVideoResponse = TelegramMessageResponse;
export type TelegramSendVoiceResponse = TelegramMessageResponse;
export type TelegramSendChatActionResponse = TelegramTrueResponse;
export type TelegramSendMessageDraftResponse = TelegramTrueResponse;
export type TelegramSendRichMessageDraftResponse = TelegramTrueResponse;

// -- Method interfaces -------------------------------------------------------

export interface TelegramMethod<Request, Response> {
  (req: Request, signal?: AbortSignal): Promise<Response>;
  schema: z.ZodType<Request>;
}

export type TelegramSendAnimationMethod = TelegramMethod<
  TelegramSendAnimationRequest,
  TelegramSendAnimationResponse
>;
export type TelegramSendAudioMethod = TelegramMethod<
  TelegramSendAudioRequest,
  TelegramSendAudioResponse
>;
export type TelegramSendChatActionMethod = TelegramMethod<
  TelegramSendChatActionRequest,
  TelegramSendChatActionResponse
>;
export type TelegramSendChecklistMethod = TelegramMethod<
  TelegramSendChecklistRequest,
  TelegramSendChecklistResponse
>;
export type TelegramSendContactMethod = TelegramMethod<
  TelegramSendContactRequest,
  TelegramSendContactResponse
>;
export type TelegramSendDiceMethod = TelegramMethod<
  TelegramSendDiceRequest,
  TelegramSendDiceResponse
>;
export type TelegramSendDocumentMethod = TelegramMethod<
  TelegramSendDocumentRequest,
  TelegramSendDocumentResponse
>;
export type TelegramSendLivePhotoMethod = TelegramMethod<
  TelegramSendLivePhotoRequest,
  TelegramSendLivePhotoResponse
>;
export type TelegramSendLocationMethod = TelegramMethod<
  TelegramSendLocationRequest,
  TelegramSendLocationResponse
>;
export type TelegramSendMediaGroupMethod = TelegramMethod<
  TelegramSendMediaGroupRequest,
  TelegramSendMediaGroupResponse
>;
export type TelegramSendMessageDraftMethod = TelegramMethod<
  TelegramSendMessageDraftRequest,
  TelegramSendMessageDraftResponse
>;
export type TelegramSendMessageMethod = TelegramMethod<
  TelegramSendMessageRequest,
  TelegramSendMessageResponse
>;
export type TelegramSendPaidMediaMethod = TelegramMethod<
  TelegramSendPaidMediaRequest,
  TelegramSendPaidMediaResponse
>;
export type TelegramSendPhotoMethod = TelegramMethod<
  TelegramSendPhotoRequest,
  TelegramSendPhotoResponse
>;
export type TelegramSendPollMethod = TelegramMethod<
  TelegramSendPollRequest,
  TelegramSendPollResponse
>;
export type TelegramSendRichMessageDraftMethod = TelegramMethod<
  TelegramSendRichMessageDraftRequest,
  TelegramSendRichMessageDraftResponse
>;
export type TelegramSendRichMessageMethod = TelegramMethod<
  TelegramSendRichMessageRequest,
  TelegramSendRichMessageResponse
>;
export type TelegramSendVenueMethod = TelegramMethod<
  TelegramSendVenueRequest,
  TelegramSendVenueResponse
>;
export type TelegramSendVideoNoteMethod = TelegramMethod<
  TelegramSendVideoNoteRequest,
  TelegramSendVideoNoteResponse
>;
export type TelegramSendVideoMethod = TelegramMethod<
  TelegramSendVideoRequest,
  TelegramSendVideoResponse
>;
export type TelegramSendVoiceMethod = TelegramMethod<
  TelegramSendVoiceRequest,
  TelegramSendVoiceResponse
>;

// -- Provider ----------------------------------------------------------------

export interface TelegramPostNamespace {
  sendAnimation: TelegramSendAnimationMethod;
  sendAudio: TelegramSendAudioMethod;
  sendChatAction: TelegramSendChatActionMethod;
  sendChecklist: TelegramSendChecklistMethod;
  sendContact: TelegramSendContactMethod;
  sendDice: TelegramSendDiceMethod;
  sendDocument: TelegramSendDocumentMethod;
  sendLivePhoto: TelegramSendLivePhotoMethod;
  sendLocation: TelegramSendLocationMethod;
  sendMediaGroup: TelegramSendMediaGroupMethod;
  sendMessage: TelegramSendMessageMethod;
  sendMessageDraft: TelegramSendMessageDraftMethod;
  sendPaidMedia: TelegramSendPaidMediaMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendPoll: TelegramSendPollMethod;
  sendRichMessage: TelegramSendRichMessageMethod;
  sendRichMessageDraft: TelegramSendRichMessageDraftMethod;
  sendVenue: TelegramSendVenueMethod;
  sendVideo: TelegramSendVideoMethod;
  sendVideoNote: TelegramSendVideoNoteMethod;
  sendVoice: TelegramSendVoiceMethod;
}

export interface TelegramProvider extends TelegramPostNamespace {
  post: TelegramPostNamespace;
}
