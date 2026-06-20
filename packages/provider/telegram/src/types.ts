import type { z } from "zod";
import type * as TelegramZod from "./zod";

export type * from "./zod";

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
  can_manage_bots?: boolean;
  supports_guest_queries?: boolean;
  supports_join_request_queries?: boolean;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramChatFullInfo extends TelegramChat {
  invite_link?: string;
  pinned_message?: TelegramMessage;
  permissions?: Record<string, unknown>;
  slow_mode_delay?: number;
  message_auto_delete_time?: number;
  has_aggressive_anti_spam_enabled?: boolean;
  has_hidden_members?: boolean;
  has_protected_content?: boolean;
  has_visible_history?: boolean;
  sticker_set_name?: string;
  can_set_sticker_set?: boolean;
  linked_chat_id?: number;
  location?: Record<string, unknown>;
  guard_bot?: TelegramUser;
  [key: string]: unknown;
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

export interface TelegramChatMember {
  status: string;
  user: TelegramUser;
  [key: string]: unknown;
}

export interface TelegramChatInviteLink {
  invite_link: string;
  creator: TelegramUser;
  creates_join_request: boolean;
  is_primary: boolean;
  is_revoked: boolean;
  name?: string;
  expire_date?: number;
  member_limit?: number;
  pending_join_request_count?: number;
  subscription_period?: number;
  subscription_price?: number;
  [key: string]: unknown;
}

export interface TelegramForumTopic {
  message_thread_id: number;
  name: string;
  icon_color: number;
  icon_custom_emoji_id?: string;
  [key: string]: unknown;
}

export interface TelegramSticker {
  file_id: string;
  file_unique_id: string;
  type: string;
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  [key: string]: unknown;
}

export interface TelegramUserChatBoosts {
  boosts: Array<Record<string, unknown>>;
}

export interface TelegramSentGuestMessage {
  message_id: number;
  [key: string]: unknown;
}

export type TelegramTrueResponse = TelegramApiResponse<true>;
export type TelegramStringResponse = TelegramApiResponse<string>;
export type TelegramNumberResponse = TelegramApiResponse<number>;
export type TelegramSendMessageResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendPhotoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendVideoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendAudioResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramAnswerGuestQueryResponse =
  TelegramApiResponse<TelegramSentGuestMessage>;
export type TelegramCreateForumTopicResponse =
  TelegramApiResponse<TelegramForumTopic>;
export type TelegramGetChatResponse = TelegramApiResponse<TelegramChatFullInfo>;
export type TelegramGetChatAdministratorsResponse = TelegramApiResponse<
  TelegramChatMember[]
>;
export type TelegramGetChatMemberResponse =
  TelegramApiResponse<TelegramChatMember>;
export type TelegramGetForumTopicIconStickersResponse = TelegramApiResponse<
  TelegramSticker[]
>;
export type TelegramGetUserChatBoostsResponse =
  TelegramApiResponse<TelegramUserChatBoosts>;
export type TelegramGetUserPersonalChatMessagesResponse = TelegramApiResponse<
  TelegramMessage[]
>;
export type TelegramInviteLinkResponse =
  TelegramApiResponse<TelegramChatInviteLink>;

// -- Method interfaces -------------------------------------------------------

export interface TelegramMethod<TRequest, TResponse> {
  (req: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
}

export interface TelegramOptionalMethod<TRequest, TResponse> {
  (req?: TRequest, signal?: AbortSignal): Promise<TResponse>;
  schema: z.ZodType<TRequest>;
}

export type TelegramAnswerChatJoinRequestQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerChatJoinRequestQueryRequest,
  TelegramTrueResponse
>;
export type TelegramAnswerGuestQueryMethod = TelegramMethod<
  TelegramZod.TelegramAnswerGuestQueryRequest,
  TelegramAnswerGuestQueryResponse
>;
export type TelegramApproveChatJoinRequestMethod = TelegramMethod<
  TelegramZod.TelegramApproveChatJoinRequestRequest,
  TelegramTrueResponse
>;
export type TelegramBanChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramBanChatMemberRequest,
  TelegramTrueResponse
>;
export type TelegramBanChatSenderChatMethod = TelegramMethod<
  TelegramZod.TelegramBanChatSenderChatRequest,
  TelegramTrueResponse
>;
export type TelegramCloseForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramCloseForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramCloseGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramCloseGeneralForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramCreateChatInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramCreateChatInviteLinkRequest,
  TelegramInviteLinkResponse
>;
export type TelegramCreateChatSubscriptionInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramCreateChatSubscriptionInviteLinkRequest,
  TelegramInviteLinkResponse
>;
export type TelegramCreateForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramCreateForumTopicRequest,
  TelegramCreateForumTopicResponse
>;
export type TelegramDeclineChatJoinRequestMethod = TelegramMethod<
  TelegramZod.TelegramDeclineChatJoinRequestRequest,
  TelegramTrueResponse
>;
export type TelegramDeleteChatPhotoMethod = TelegramMethod<
  TelegramZod.TelegramDeleteChatPhotoRequest,
  TelegramTrueResponse
>;
export type TelegramDeleteChatStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramDeleteChatStickerSetRequest,
  TelegramTrueResponse
>;
export type TelegramDeleteForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramDeleteForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramEditChatInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramEditChatInviteLinkRequest,
  TelegramInviteLinkResponse
>;
export type TelegramEditChatSubscriptionInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramEditChatSubscriptionInviteLinkRequest,
  TelegramInviteLinkResponse
>;
export type TelegramEditForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramEditForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramEditGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramEditGeneralForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramExportChatInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramExportChatInviteLinkRequest,
  TelegramStringResponse
>;
export type TelegramGetChatMethod = TelegramMethod<
  TelegramZod.TelegramGetChatRequest,
  TelegramGetChatResponse
>;
export type TelegramGetChatAdministratorsMethod = TelegramMethod<
  TelegramZod.TelegramGetChatAdministratorsRequest,
  TelegramGetChatAdministratorsResponse
>;
export type TelegramGetChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramGetChatMemberRequest,
  TelegramGetChatMemberResponse
>;
export type TelegramGetChatMemberCountMethod = TelegramMethod<
  TelegramZod.TelegramGetChatMemberCountRequest,
  TelegramNumberResponse
>;
export type TelegramGetForumTopicIconStickersMethod = TelegramOptionalMethod<
  TelegramZod.TelegramGetForumTopicIconStickersRequest,
  TelegramGetForumTopicIconStickersResponse
>;
export type TelegramGetUserChatBoostsMethod = TelegramMethod<
  TelegramZod.TelegramGetUserChatBoostsRequest,
  TelegramGetUserChatBoostsResponse
>;
export type TelegramGetUserPersonalChatMessagesMethod = TelegramMethod<
  TelegramZod.TelegramGetUserPersonalChatMessagesRequest,
  TelegramGetUserPersonalChatMessagesResponse
>;
export type TelegramHideGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramHideGeneralForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramLeaveChatMethod = TelegramMethod<
  TelegramZod.TelegramLeaveChatRequest,
  TelegramTrueResponse
>;
export type TelegramPromoteChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramPromoteChatMemberRequest,
  TelegramTrueResponse
>;
export type TelegramReopenForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramReopenForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramReopenGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramReopenGeneralForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramRestrictChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramRestrictChatMemberRequest,
  TelegramTrueResponse
>;
export type TelegramRevokeChatInviteLinkMethod = TelegramMethod<
  TelegramZod.TelegramRevokeChatInviteLinkRequest,
  TelegramInviteLinkResponse
>;
export type TelegramSendAudioMethod = TelegramMethod<
  TelegramZod.TelegramSendAudioRequest,
  TelegramSendAudioResponse
>;
export type TelegramSendChatJoinRequestWebAppMethod = TelegramMethod<
  TelegramZod.TelegramSendChatJoinRequestWebAppRequest,
  TelegramTrueResponse
>;
export type TelegramSendMessageMethod = TelegramMethod<
  TelegramZod.TelegramSendMessageRequest,
  TelegramSendMessageResponse
>;
export type TelegramSendPhotoMethod = TelegramMethod<
  TelegramZod.TelegramSendPhotoRequest,
  TelegramSendPhotoResponse
>;
export type TelegramSendVideoMethod = TelegramMethod<
  TelegramZod.TelegramSendVideoRequest,
  TelegramSendVideoResponse
>;
export type TelegramSetChatAdministratorCustomTitleMethod = TelegramMethod<
  TelegramZod.TelegramSetChatAdministratorCustomTitleRequest,
  TelegramTrueResponse
>;
export type TelegramSetChatDescriptionMethod = TelegramMethod<
  TelegramZod.TelegramSetChatDescriptionRequest,
  TelegramTrueResponse
>;
export type TelegramSetChatMemberTagMethod = TelegramMethod<
  TelegramZod.TelegramSetChatMemberTagRequest,
  TelegramTrueResponse
>;
export type TelegramSetChatPermissionsMethod = TelegramMethod<
  TelegramZod.TelegramSetChatPermissionsRequest,
  TelegramTrueResponse
>;
export type TelegramSetChatPhotoMethod = TelegramMethod<
  TelegramZod.TelegramSetChatPhotoRequest,
  TelegramTrueResponse
>;
export type TelegramSetChatStickerSetMethod = TelegramMethod<
  TelegramZod.TelegramSetChatStickerSetRequest,
  TelegramTrueResponse
>;
export type TelegramSetChatTitleMethod = TelegramMethod<
  TelegramZod.TelegramSetChatTitleRequest,
  TelegramTrueResponse
>;
export type TelegramUnbanChatMemberMethod = TelegramMethod<
  TelegramZod.TelegramUnbanChatMemberRequest,
  TelegramTrueResponse
>;
export type TelegramUnbanChatSenderChatMethod = TelegramMethod<
  TelegramZod.TelegramUnbanChatSenderChatRequest,
  TelegramTrueResponse
>;
export type TelegramUnhideGeneralForumTopicMethod = TelegramMethod<
  TelegramZod.TelegramUnhideGeneralForumTopicRequest,
  TelegramTrueResponse
>;
export type TelegramUnpinAllForumTopicMessagesMethod = TelegramMethod<
  TelegramZod.TelegramUnpinAllForumTopicMessagesRequest,
  TelegramTrueResponse
>;
export type TelegramUnpinAllGeneralForumTopicMessagesMethod = TelegramMethod<
  TelegramZod.TelegramUnpinAllGeneralForumTopicMessagesRequest,
  TelegramTrueResponse
>;

// -- Provider ----------------------------------------------------------------

export interface TelegramPostNamespace {
  answerChatJoinRequestQuery: TelegramAnswerChatJoinRequestQueryMethod;
  answerGuestQuery: TelegramAnswerGuestQueryMethod;
  approveChatJoinRequest: TelegramApproveChatJoinRequestMethod;
  banChatMember: TelegramBanChatMemberMethod;
  banChatSenderChat: TelegramBanChatSenderChatMethod;
  closeForumTopic: TelegramCloseForumTopicMethod;
  closeGeneralForumTopic: TelegramCloseGeneralForumTopicMethod;
  createChatInviteLink: TelegramCreateChatInviteLinkMethod;
  createChatSubscriptionInviteLink: TelegramCreateChatSubscriptionInviteLinkMethod;
  createForumTopic: TelegramCreateForumTopicMethod;
  declineChatJoinRequest: TelegramDeclineChatJoinRequestMethod;
  deleteChatPhoto: TelegramDeleteChatPhotoMethod;
  deleteChatStickerSet: TelegramDeleteChatStickerSetMethod;
  deleteForumTopic: TelegramDeleteForumTopicMethod;
  editChatInviteLink: TelegramEditChatInviteLinkMethod;
  editChatSubscriptionInviteLink: TelegramEditChatSubscriptionInviteLinkMethod;
  editForumTopic: TelegramEditForumTopicMethod;
  editGeneralForumTopic: TelegramEditGeneralForumTopicMethod;
  exportChatInviteLink: TelegramExportChatInviteLinkMethod;
  getChat: TelegramGetChatMethod;
  getChatAdministrators: TelegramGetChatAdministratorsMethod;
  getChatMember: TelegramGetChatMemberMethod;
  getChatMemberCount: TelegramGetChatMemberCountMethod;
  getForumTopicIconStickers: TelegramGetForumTopicIconStickersMethod;
  getUserChatBoosts: TelegramGetUserChatBoostsMethod;
  getUserPersonalChatMessages: TelegramGetUserPersonalChatMessagesMethod;
  hideGeneralForumTopic: TelegramHideGeneralForumTopicMethod;
  leaveChat: TelegramLeaveChatMethod;
  promoteChatMember: TelegramPromoteChatMemberMethod;
  reopenForumTopic: TelegramReopenForumTopicMethod;
  reopenGeneralForumTopic: TelegramReopenGeneralForumTopicMethod;
  restrictChatMember: TelegramRestrictChatMemberMethod;
  revokeChatInviteLink: TelegramRevokeChatInviteLinkMethod;
  sendAudio: TelegramSendAudioMethod;
  sendChatJoinRequestWebApp: TelegramSendChatJoinRequestWebAppMethod;
  sendMessage: TelegramSendMessageMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendVideo: TelegramSendVideoMethod;
  setChatAdministratorCustomTitle: TelegramSetChatAdministratorCustomTitleMethod;
  setChatDescription: TelegramSetChatDescriptionMethod;
  setChatMemberTag: TelegramSetChatMemberTagMethod;
  setChatPermissions: TelegramSetChatPermissionsMethod;
  setChatPhoto: TelegramSetChatPhotoMethod;
  setChatStickerSet: TelegramSetChatStickerSetMethod;
  setChatTitle: TelegramSetChatTitleMethod;
  unbanChatMember: TelegramUnbanChatMemberMethod;
  unbanChatSenderChat: TelegramUnbanChatSenderChatMethod;
  unhideGeneralForumTopic: TelegramUnhideGeneralForumTopicMethod;
  unpinAllForumTopicMessages: TelegramUnpinAllForumTopicMessagesMethod;
  unpinAllGeneralForumTopicMessages: TelegramUnpinAllGeneralForumTopicMessagesMethod;
}

export interface TelegramProvider extends TelegramPostNamespace {
  post: TelegramPostNamespace;
}
