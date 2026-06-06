import type { z } from "zod";
import type {
  TelegramSendAudioRequest,
  TelegramSendMessageRequest,
  TelegramSendPhotoRequest,
  TelegramSendVideoRequest,
} from "./zod";

export type {
  TelegramInputFile,
  TelegramOptions,
  TelegramSendAudioRequest,
  TelegramSendMessageRequest,
  TelegramSendPhotoRequest,
  TelegramSendVideoRequest,
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

export type TelegramSendMessageResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendPhotoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendVideoResponse = TelegramApiResponse<TelegramMessage>;
export type TelegramSendAudioResponse = TelegramApiResponse<TelegramMessage>;

// -- Method interfaces -------------------------------------------------------

export interface TelegramSendMessageMethod {
  (
    req: TelegramSendMessageRequest,
    signal?: AbortSignal
  ): Promise<TelegramSendMessageResponse>;
  schema: z.ZodType<TelegramSendMessageRequest>;
}

export interface TelegramSendPhotoMethod {
  (
    req: TelegramSendPhotoRequest,
    signal?: AbortSignal
  ): Promise<TelegramSendPhotoResponse>;
  schema: z.ZodType<TelegramSendPhotoRequest>;
}

export interface TelegramSendVideoMethod {
  (
    req: TelegramSendVideoRequest,
    signal?: AbortSignal
  ): Promise<TelegramSendVideoResponse>;
  schema: z.ZodType<TelegramSendVideoRequest>;
}

export interface TelegramSendAudioMethod {
  (
    req: TelegramSendAudioRequest,
    signal?: AbortSignal
  ): Promise<TelegramSendAudioResponse>;
  schema: z.ZodType<TelegramSendAudioRequest>;
}

// -- Provider ----------------------------------------------------------------

export interface TelegramPostNamespace {
  sendMessage: TelegramSendMessageMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendVideo: TelegramSendVideoMethod;
  sendAudio: TelegramSendAudioMethod;
}

export interface TelegramProvider {
  sendMessage: TelegramSendMessageMethod;
  sendPhoto: TelegramSendPhotoMethod;
  sendVideo: TelegramSendVideoMethod;
  sendAudio: TelegramSendAudioMethod;
  post: TelegramPostNamespace;
}
