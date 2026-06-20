import type { z } from "zod";
import type {
  TelegramCopyMessageRequest,
  TelegramCopyMessagesRequest,
  TelegramDeleteAllMessageReactionsRequest,
  TelegramDeleteMessageReactionRequest,
  TelegramDeleteMessageRequest,
  TelegramDeleteMessagesRequest,
  TelegramEditMessageCaptionRequest,
  TelegramEditMessageChecklistRequest,
  TelegramEditMessageLiveLocationRequest,
  TelegramEditMessageMediaRequest,
  TelegramEditMessageReplyMarkupRequest,
  TelegramEditMessageTextRequest,
  TelegramForwardMessageRequest,
  TelegramForwardMessagesRequest,
  TelegramPinChatMessageRequest,
  TelegramSendAudioRequest,
  TelegramSendMessageRequest,
  TelegramSendPhotoRequest,
  TelegramSendVideoRequest,
  TelegramSetMessageReactionRequest,
  TelegramStopMessageLiveLocationRequest,
  TelegramStopPollRequest,
  TelegramUnpinAllChatMessagesRequest,
  TelegramUnpinChatMessageRequest,
} from "./zod";

export type {
  TelegramCopyMessageRequest,
  TelegramCopyMessagesRequest,
  TelegramDeleteAllMessageReactionsRequest,
  TelegramDeleteMessageReactionRequest,
  TelegramDeleteMessageRequest,
  TelegramDeleteMessagesRequest,
  TelegramEditMessageCaptionRequest,
  TelegramEditMessageChecklistRequest,
  TelegramEditMessageLiveLocationRequest,
  TelegramEditMessageMediaRequest,
  TelegramEditMessageReplyMarkupRequest,
  TelegramEditMessageTextRequest,
  TelegramForwardMessageRequest,
  TelegramForwardMessagesRequest,
  TelegramInputChecklist,
  TelegramInputMedia,
  TelegramInputFile,
  TelegramOptions,
  TelegramPinChatMessageRequest,
  TelegramSetMessageReactionRequest,
  TelegramSendAudioRequest,
  TelegramSendMessageRequest,
  TelegramSendPhotoRequest,
  TelegramSendVideoRequest,
  TelegramStopMessageLiveLocationRequest,
  TelegramStopPollRequest,
  TelegramUnpinAllChatMessagesRequest,
  TelegramUnpinChatMessageRequest,
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
  audio?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TelegramMessageId {
  message_id: number;
}

export interface TelegramPoll {
  id: string;
  question: string;
  [key: string]: unknown;
}

export type TelegramSendMessageResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendPhotoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendVideoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendAudioResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramForwardMessageResponse =
  TelegramApiResponse<TelegramMessage>;
export type TelegramForwardMessagesResponse = TelegramApiResponse<
  TelegramMessageId[]
>;
export type TelegramCopyMessageResponse =
  TelegramApiResponse<TelegramMessageId>;
export type TelegramCopyMessagesResponse = TelegramApiResponse<
  TelegramMessageId[]
>;
export type TelegramDeleteMessageResponse = TelegramApiResponse<true>;
export type TelegramDeleteMessagesResponse = TelegramApiResponse<true>;
export type TelegramPinChatMessageResponse = TelegramApiResponse<true>;
export type TelegramUnpinChatMessageResponse = TelegramApiResponse<true>;
export type TelegramUnpinAllChatMessagesResponse = TelegramApiResponse<true>;
export type TelegramEditMessageTextResponse = TelegramApiResponse<
  TelegramMessage | true
>;
export type TelegramEditMessageCaptionResponse = TelegramApiResponse<
  TelegramMessage | true
>;
export type TelegramEditMessageMediaResponse = TelegramApiResponse<
  TelegramMessage | true
>;
export type TelegramEditMessageLiveLocationResponse = TelegramApiResponse<
  TelegramMessage | true
>;
export type TelegramStopMessageLiveLocationResponse = TelegramApiResponse<
  TelegramMessage | true
>;
export type TelegramEditMessageChecklistResponse =
  TelegramApiResponse<TelegramMessage>;
export type TelegramEditMessageReplyMarkupResponse = TelegramApiResponse<
  TelegramMessage | true
>;
export type TelegramStopPollResponse = TelegramApiResponse<TelegramPoll>;
export type TelegramSetMessageReactionResponse = TelegramApiResponse<true>;
export type TelegramDeleteMessageReactionResponse = TelegramApiResponse<true>;
export type TelegramDeleteAllMessageReactionsResponse =
  TelegramApiResponse<true>;

// -- Method interfaces -------------------------------------------------------

export interface TelegramMethod<TRequest, TResponse> {
  (req: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
}

export type TelegramSendMessageMethod = TelegramMethod<
  TelegramSendMessageRequest,
  TelegramSendMessageResponse
>;

export type TelegramSendPhotoMethod = TelegramMethod<
  TelegramSendPhotoRequest,
  TelegramSendPhotoResponse
>;

export type TelegramSendVideoMethod = TelegramMethod<
  TelegramSendVideoRequest,
  TelegramSendVideoResponse
>;

export type TelegramSendAudioMethod = TelegramMethod<
  TelegramSendAudioRequest,
  TelegramSendAudioResponse
>;

export type TelegramForwardMessageMethod = TelegramMethod<
  TelegramForwardMessageRequest,
  TelegramForwardMessageResponse
>;

export type TelegramForwardMessagesMethod = TelegramMethod<
  TelegramForwardMessagesRequest,
  TelegramForwardMessagesResponse
>;

export type TelegramCopyMessageMethod = TelegramMethod<
  TelegramCopyMessageRequest,
  TelegramCopyMessageResponse
>;

export type TelegramCopyMessagesMethod = TelegramMethod<
  TelegramCopyMessagesRequest,
  TelegramCopyMessagesResponse
>;

export type TelegramDeleteMessageMethod = TelegramMethod<
  TelegramDeleteMessageRequest,
  TelegramDeleteMessageResponse
>;

export type TelegramDeleteMessagesMethod = TelegramMethod<
  TelegramDeleteMessagesRequest,
  TelegramDeleteMessagesResponse
>;

export type TelegramPinChatMessageMethod = TelegramMethod<
  TelegramPinChatMessageRequest,
  TelegramPinChatMessageResponse
>;

export type TelegramUnpinChatMessageMethod = TelegramMethod<
  TelegramUnpinChatMessageRequest,
  TelegramUnpinChatMessageResponse
>;

export type TelegramUnpinAllChatMessagesMethod = TelegramMethod<
  TelegramUnpinAllChatMessagesRequest,
  TelegramUnpinAllChatMessagesResponse
>;

export type TelegramEditMessageTextMethod = TelegramMethod<
  TelegramEditMessageTextRequest,
  TelegramEditMessageTextResponse
>;

export type TelegramEditMessageCaptionMethod = TelegramMethod<
  TelegramEditMessageCaptionRequest,
  TelegramEditMessageCaptionResponse
>;

export type TelegramEditMessageMediaMethod = TelegramMethod<
  TelegramEditMessageMediaRequest,
  TelegramEditMessageMediaResponse
>;

export type TelegramEditMessageLiveLocationMethod = TelegramMethod<
  TelegramEditMessageLiveLocationRequest,
  TelegramEditMessageLiveLocationResponse
>;

export type TelegramStopMessageLiveLocationMethod = TelegramMethod<
  TelegramStopMessageLiveLocationRequest,
  TelegramStopMessageLiveLocationResponse
>;

export type TelegramEditMessageChecklistMethod = TelegramMethod<
  TelegramEditMessageChecklistRequest,
  TelegramEditMessageChecklistResponse
>;

export type TelegramEditMessageReplyMarkupMethod = TelegramMethod<
  TelegramEditMessageReplyMarkupRequest,
  TelegramEditMessageReplyMarkupResponse
>;

export type TelegramStopPollMethod = TelegramMethod<
  TelegramStopPollRequest,
  TelegramStopPollResponse
>;

export type TelegramSetMessageReactionMethod = TelegramMethod<
  TelegramSetMessageReactionRequest,
  TelegramSetMessageReactionResponse
>;

export type TelegramDeleteMessageReactionMethod = TelegramMethod<
  TelegramDeleteMessageReactionRequest,
  TelegramDeleteMessageReactionResponse
>;

export type TelegramDeleteAllMessageReactionsMethod = TelegramMethod<
  TelegramDeleteAllMessageReactionsRequest,
  TelegramDeleteAllMessageReactionsResponse
>;

// -- Provider ----------------------------------------------------------------

export interface TelegramPostNamespace {
  copyMessage: TelegramCopyMessageMethod;
  copyMessages: TelegramCopyMessagesMethod;
  deleteAllMessageReactions: TelegramDeleteAllMessageReactionsMethod;
  deleteMessage: TelegramDeleteMessageMethod;
  deleteMessageReaction: TelegramDeleteMessageReactionMethod;
  deleteMessages: TelegramDeleteMessagesMethod;
  editMessageCaption: TelegramEditMessageCaptionMethod;
  editMessageChecklist: TelegramEditMessageChecklistMethod;
  editMessageLiveLocation: TelegramEditMessageLiveLocationMethod;
  editMessageMedia: TelegramEditMessageMediaMethod;
  editMessageReplyMarkup: TelegramEditMessageReplyMarkupMethod;
  editMessageText: TelegramEditMessageTextMethod;
  forwardMessage: TelegramForwardMessageMethod;
  forwardMessages: TelegramForwardMessagesMethod;
  pinChatMessage: TelegramPinChatMessageMethod;
  sendMessage: TelegramSendMessageMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendVideo: TelegramSendVideoMethod;
  sendAudio: TelegramSendAudioMethod;
  setMessageReaction: TelegramSetMessageReactionMethod;
  stopMessageLiveLocation: TelegramStopMessageLiveLocationMethod;
  stopPoll: TelegramStopPollMethod;
  unpinAllChatMessages: TelegramUnpinAllChatMessagesMethod;
  unpinChatMessage: TelegramUnpinChatMessageMethod;
}

export interface TelegramProvider {
  copyMessage: TelegramCopyMessageMethod;
  copyMessages: TelegramCopyMessagesMethod;
  deleteAllMessageReactions: TelegramDeleteAllMessageReactionsMethod;
  deleteMessage: TelegramDeleteMessageMethod;
  deleteMessageReaction: TelegramDeleteMessageReactionMethod;
  deleteMessages: TelegramDeleteMessagesMethod;
  editMessageCaption: TelegramEditMessageCaptionMethod;
  editMessageChecklist: TelegramEditMessageChecklistMethod;
  editMessageLiveLocation: TelegramEditMessageLiveLocationMethod;
  editMessageMedia: TelegramEditMessageMediaMethod;
  editMessageReplyMarkup: TelegramEditMessageReplyMarkupMethod;
  editMessageText: TelegramEditMessageTextMethod;
  forwardMessage: TelegramForwardMessageMethod;
  forwardMessages: TelegramForwardMessagesMethod;
  pinChatMessage: TelegramPinChatMessageMethod;
  sendMessage: TelegramSendMessageMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendVideo: TelegramSendVideoMethod;
  sendAudio: TelegramSendAudioMethod;
  setMessageReaction: TelegramSetMessageReactionMethod;
  stopMessageLiveLocation: TelegramStopMessageLiveLocationMethod;
  stopPoll: TelegramStopPollMethod;
  unpinAllChatMessages: TelegramUnpinAllChatMessagesMethod;
  unpinChatMessage: TelegramUnpinChatMessageMethod;
  post: TelegramPostNamespace;
}
