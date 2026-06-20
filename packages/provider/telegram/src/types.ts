import type { z } from "zod";
import type {
  TelegramBotCommand,
  TelegramChatAdministratorRights,
  TelegramDeleteMyCommandsRequest,
  TelegramDeleteWebhookRequest,
  TelegramEmptyRequest,
  TelegramGetChatMenuButtonRequest,
  TelegramGetFileRequest,
  TelegramGetMyCommandsRequest,
  TelegramGetMyDefaultAdministratorRightsRequest,
  TelegramGetUpdatesRequest,
  TelegramLanguageCodeRequest,
  TelegramManagedBotUserRequest,
  TelegramMenuButton,
  TelegramSendAudioRequest,
  TelegramSendMessageRequest,
  TelegramSendPhotoRequest,
  TelegramSendVideoRequest,
  TelegramSetChatMenuButtonRequest,
  TelegramSetManagedBotAccessSettingsRequest,
  TelegramSetMyCommandsRequest,
  TelegramSetMyDefaultAdministratorRightsRequest,
  TelegramSetMyDescriptionRequest,
  TelegramSetMyNameRequest,
  TelegramSetMyShortDescriptionRequest,
  TelegramSetWebhookRequest,
} from "./zod";

export type {
  TelegramBotCommand,
  TelegramBotCommandScope,
  TelegramChatAdministratorRights,
  TelegramDeleteMyCommandsRequest,
  TelegramDeleteWebhookRequest,
  TelegramEmptyRequest,
  TelegramGetChatMenuButtonRequest,
  TelegramGetFileRequest,
  TelegramGetMyCommandsRequest,
  TelegramGetMyDefaultAdministratorRightsRequest,
  TelegramGetUpdatesRequest,
  TelegramInputFile,
  TelegramLanguageCodeRequest,
  TelegramManagedBotUserRequest,
  TelegramMenuButton,
  TelegramOptions,
  TelegramSendAudioRequest,
  TelegramSendMessageRequest,
  TelegramSendPhotoRequest,
  TelegramSendVideoRequest,
  TelegramSetChatMenuButtonRequest,
  TelegramSetManagedBotAccessSettingsRequest,
  TelegramSetMyCommandsRequest,
  TelegramSetMyDefaultAdministratorRightsRequest,
  TelegramSetMyDescriptionRequest,
  TelegramSetMyNameRequest,
  TelegramSetMyShortDescriptionRequest,
  TelegramSetWebhookRequest,
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
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
  can_connect_to_business?: boolean;
  has_main_web_app?: boolean;
  supports_guest_queries?: boolean;
  supports_join_request_queries?: boolean;
  can_manage_bots?: boolean;
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

export interface TelegramUpdate {
  update_id: number;
  [key: string]: unknown;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  last_synchronization_error_date?: number;
  max_connections?: number;
  allowed_updates?: string[];
}

export interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

export interface TelegramBotName {
  name: string;
}

export interface TelegramBotDescription {
  description: string;
}

export interface TelegramBotShortDescription {
  short_description: string;
}

export interface TelegramBotAccessSettings {
  is_access_restricted: boolean;
  added_users?: TelegramUser[];
}

export type TelegramBooleanResponse = TelegramApiResponse<boolean>;
export type TelegramStringResponse = TelegramApiResponse<string>;
export type TelegramGetUpdatesResponse = TelegramApiResponse<TelegramUpdate[]>;
export type TelegramSetWebhookResponse = TelegramBooleanResponse;
export type TelegramDeleteWebhookResponse = TelegramBooleanResponse;
export type TelegramGetWebhookInfoResponse =
  TelegramApiResponse<TelegramWebhookInfo>;
export type TelegramGetMeResponse = TelegramApiResponse<TelegramUser>;
export type TelegramLogOutResponse = TelegramBooleanResponse;
export type TelegramCloseResponse = TelegramBooleanResponse;
export type TelegramGetFileResponse = TelegramApiResponse<TelegramFile>;
export type TelegramGetManagedBotTokenResponse = TelegramStringResponse;
export type TelegramReplaceManagedBotTokenResponse = TelegramStringResponse;
export type TelegramGetManagedBotAccessSettingsResponse =
  TelegramApiResponse<TelegramBotAccessSettings>;
export type TelegramSetManagedBotAccessSettingsResponse =
  TelegramBooleanResponse;
export type TelegramSetMyCommandsResponse = TelegramBooleanResponse;
export type TelegramDeleteMyCommandsResponse = TelegramBooleanResponse;
export type TelegramGetMyCommandsResponse = TelegramApiResponse<
  TelegramBotCommand[]
>;
export type TelegramSetMyNameResponse = TelegramBooleanResponse;
export type TelegramGetMyNameResponse = TelegramApiResponse<TelegramBotName>;
export type TelegramSetMyDescriptionResponse = TelegramBooleanResponse;
export type TelegramGetMyDescriptionResponse =
  TelegramApiResponse<TelegramBotDescription>;
export type TelegramSetMyShortDescriptionResponse = TelegramBooleanResponse;
export type TelegramGetMyShortDescriptionResponse =
  TelegramApiResponse<TelegramBotShortDescription>;
export type TelegramSetChatMenuButtonResponse = TelegramBooleanResponse;
export type TelegramGetChatMenuButtonResponse =
  TelegramApiResponse<TelegramMenuButton>;
export type TelegramSetMyDefaultAdministratorRightsResponse =
  TelegramBooleanResponse;
export type TelegramGetMyDefaultAdministratorRightsResponse =
  TelegramApiResponse<TelegramChatAdministratorRights>;
export type TelegramSendMessageResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendPhotoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendVideoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendAudioResponse = TelegramApiResponse<TelegramMessage>;

// -- Method interfaces -------------------------------------------------------

export interface TelegramMethod<TRequest, TResponse> {
  (req: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
}

export interface TelegramOptionalMethod<TRequest, TResponse> {
  (req?: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
}

export interface TelegramEmptyMethod<TResponse> {
  (req?: TelegramEmptyRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TelegramEmptyRequest>;
}

export type TelegramGetUpdatesMethod = TelegramOptionalMethod<
  TelegramGetUpdatesRequest,
  TelegramGetUpdatesResponse
>;
export type TelegramSetWebhookMethod = TelegramMethod<
  TelegramSetWebhookRequest,
  TelegramSetWebhookResponse
>;
export type TelegramDeleteWebhookMethod = TelegramOptionalMethod<
  TelegramDeleteWebhookRequest,
  TelegramDeleteWebhookResponse
>;
export type TelegramGetWebhookInfoMethod =
  TelegramEmptyMethod<TelegramGetWebhookInfoResponse>;
export type TelegramGetMeMethod = TelegramEmptyMethod<TelegramGetMeResponse>;
export type TelegramLogOutMethod = TelegramEmptyMethod<TelegramLogOutResponse>;
export type TelegramCloseMethod = TelegramEmptyMethod<TelegramCloseResponse>;
export type TelegramGetFileMethod = TelegramMethod<
  TelegramGetFileRequest,
  TelegramGetFileResponse
>;
export type TelegramGetManagedBotTokenMethod = TelegramMethod<
  TelegramManagedBotUserRequest,
  TelegramGetManagedBotTokenResponse
>;
export type TelegramReplaceManagedBotTokenMethod = TelegramMethod<
  TelegramManagedBotUserRequest,
  TelegramReplaceManagedBotTokenResponse
>;
export type TelegramGetManagedBotAccessSettingsMethod = TelegramMethod<
  TelegramManagedBotUserRequest,
  TelegramGetManagedBotAccessSettingsResponse
>;
export type TelegramSetManagedBotAccessSettingsMethod = TelegramMethod<
  TelegramSetManagedBotAccessSettingsRequest,
  TelegramSetManagedBotAccessSettingsResponse
>;
export type TelegramSetMyCommandsMethod = TelegramMethod<
  TelegramSetMyCommandsRequest,
  TelegramSetMyCommandsResponse
>;
export type TelegramDeleteMyCommandsMethod = TelegramOptionalMethod<
  TelegramDeleteMyCommandsRequest,
  TelegramDeleteMyCommandsResponse
>;
export type TelegramGetMyCommandsMethod = TelegramOptionalMethod<
  TelegramGetMyCommandsRequest,
  TelegramGetMyCommandsResponse
>;
export type TelegramSetMyNameMethod = TelegramOptionalMethod<
  TelegramSetMyNameRequest,
  TelegramSetMyNameResponse
>;
export type TelegramGetMyNameMethod = TelegramOptionalMethod<
  TelegramLanguageCodeRequest,
  TelegramGetMyNameResponse
>;
export type TelegramSetMyDescriptionMethod = TelegramOptionalMethod<
  TelegramSetMyDescriptionRequest,
  TelegramSetMyDescriptionResponse
>;
export type TelegramGetMyDescriptionMethod = TelegramOptionalMethod<
  TelegramLanguageCodeRequest,
  TelegramGetMyDescriptionResponse
>;
export type TelegramSetMyShortDescriptionMethod = TelegramOptionalMethod<
  TelegramSetMyShortDescriptionRequest,
  TelegramSetMyShortDescriptionResponse
>;
export type TelegramGetMyShortDescriptionMethod = TelegramOptionalMethod<
  TelegramLanguageCodeRequest,
  TelegramGetMyShortDescriptionResponse
>;
export type TelegramSetChatMenuButtonMethod = TelegramOptionalMethod<
  TelegramSetChatMenuButtonRequest,
  TelegramSetChatMenuButtonResponse
>;
export type TelegramGetChatMenuButtonMethod = TelegramOptionalMethod<
  TelegramGetChatMenuButtonRequest,
  TelegramGetChatMenuButtonResponse
>;
export type TelegramSetMyDefaultAdministratorRightsMethod =
  TelegramOptionalMethod<
    TelegramSetMyDefaultAdministratorRightsRequest,
    TelegramSetMyDefaultAdministratorRightsResponse
  >;
export type TelegramGetMyDefaultAdministratorRightsMethod =
  TelegramOptionalMethod<
    TelegramGetMyDefaultAdministratorRightsRequest,
    TelegramGetMyDefaultAdministratorRightsResponse
  >;
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

// -- Provider ----------------------------------------------------------------

export interface TelegramPostNamespace {
  getUpdates: TelegramGetUpdatesMethod;
  setWebhook: TelegramSetWebhookMethod;
  deleteWebhook: TelegramDeleteWebhookMethod;
  getWebhookInfo: TelegramGetWebhookInfoMethod;
  getMe: TelegramGetMeMethod;
  logOut: TelegramLogOutMethod;
  close: TelegramCloseMethod;
  getFile: TelegramGetFileMethod;
  getManagedBotToken: TelegramGetManagedBotTokenMethod;
  replaceManagedBotToken: TelegramReplaceManagedBotTokenMethod;
  getManagedBotAccessSettings: TelegramGetManagedBotAccessSettingsMethod;
  setManagedBotAccessSettings: TelegramSetManagedBotAccessSettingsMethod;
  setMyCommands: TelegramSetMyCommandsMethod;
  deleteMyCommands: TelegramDeleteMyCommandsMethod;
  getMyCommands: TelegramGetMyCommandsMethod;
  setMyName: TelegramSetMyNameMethod;
  getMyName: TelegramGetMyNameMethod;
  setMyDescription: TelegramSetMyDescriptionMethod;
  getMyDescription: TelegramGetMyDescriptionMethod;
  setMyShortDescription: TelegramSetMyShortDescriptionMethod;
  getMyShortDescription: TelegramGetMyShortDescriptionMethod;
  setChatMenuButton: TelegramSetChatMenuButtonMethod;
  getChatMenuButton: TelegramGetChatMenuButtonMethod;
  setMyDefaultAdministratorRights: TelegramSetMyDefaultAdministratorRightsMethod;
  getMyDefaultAdministratorRights: TelegramGetMyDefaultAdministratorRightsMethod;
  sendMessage: TelegramSendMessageMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendVideo: TelegramSendVideoMethod;
  sendAudio: TelegramSendAudioMethod;
}

export interface TelegramProvider extends TelegramPostNamespace {
  post: TelegramPostNamespace;
}
