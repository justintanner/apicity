import type { z } from "zod";

export class QuoError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "QuoError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

export interface QuoOptions {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export interface QuoSendMessageRequest {
  content: string;
  from: string;
  to: string[];
  /** @deprecated Use `from` instead. */
  phoneNumberId?: string;
  userId?: string;
  setInboxStatus?: "done";
}

export interface QuoMessage {
  id: string;
  to: string[];
  from: string;
  text: string;
  phoneNumberId: string | null;
  conversationId: string;
  direction: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface QuoSendMessageResponse {
  data: QuoMessage;
  [key: string]: unknown;
}

export interface QuoMessagesMethod {
  (
    request: QuoSendMessageRequest,
    signal?: AbortSignal
  ): Promise<QuoSendMessageResponse>;
  schema: z.ZodType<QuoSendMessageRequest>;
}

export interface QuoV1Namespace {
  messages: QuoMessagesMethod;
}

export interface QuoProvider {
  v1: QuoV1Namespace;
}
