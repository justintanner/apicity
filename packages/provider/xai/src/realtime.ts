import { WebSocket } from "ws";
import { XaiError } from "./types";
import type { XaiRealtimeConversationItem, XaiRealtimeSession } from "./types";

export interface XaiRealtimeServerEvent {
  type: string;
  event_id?: string;
  item_id?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  delta?: string;
  transcript?: string;
  content_index?: number;
  audio_start_ms?: number;
  audio_end_ms?: number;
  response_id?: string;
  response?: Record<string, unknown>;
  session?: Record<string, unknown>;
  item?: Record<string, unknown>;
  error?: { type?: string; code?: string; message?: string; event_id?: string };
  [key: string]: unknown;
}

export type XaiRealtimeClientEvent = (
  | { type: "session.update"; session: XaiRealtimeSession }
  | {
      type: "conversation.item.create";
      item: XaiRealtimeConversationItem;
      previous_item_id?: string;
    }
  | {
      type: "conversation.item.truncate";
      item_id: string;
      content_index: number;
      audio_end_ms: number;
    }
  | { type: "conversation.item.delete"; item_id: string }
  | { type: "response.create"; response?: Record<string, unknown> }
  | { type: "response.cancel"; response_id?: string }
  | { type: "input_audio_buffer.append"; audio: string }
  | {
      type:
        | "input_audio_buffer.clear"
        | "input_audio_buffer.commit"
        | "output_audio_buffer.clear";
    }
) & { event_id?: string };

export interface XaiRealtimeConnection {
  send(event: XaiRealtimeClientEvent): void;
  close(): void;
  readonly closed: Promise<void>;
}

export interface XaiRealtimeConnectOptions {
  apiKey: string;
  callId?: string;
  model?: string;
  baseURL?: string;
  timeout?: number;
  signal?: AbortSignal;
  onEvent: (event: XaiRealtimeServerEvent) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export function connectXaiRealtime(
  options: XaiRealtimeConnectOptions
): Promise<XaiRealtimeConnection> {
  if (options.signal?.aborted) {
    return Promise.reject(new XaiError("Realtime connection cancelled", 499));
  }
  const url = new URL(options.baseURL ?? "wss://api.x.ai/v1/realtime");
  if (options.callId) url.searchParams.set("call_id", options.callId);
  else if (options.model) url.searchParams.set("model", options.model);
  else
    return Promise.reject(
      new XaiError("Realtime requires a call ID or model", 400)
    );

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, {
      headers: { Authorization: `Bearer ${options.apiKey}` },
      handshakeTimeout: options.timeout ?? 15_000,
      maxPayload: 1024 * 1024,
    });
    let opened = false;
    let stopped = false;
    let resolveClosed: () => void = () => undefined;
    const closed = new Promise<void>((done) => {
      resolveClosed = done;
    });
    const close = () => {
      if (stopped) return;
      stopped = true;
      socket.terminate();
    };
    const abort = () => {
      reject(new XaiError("Realtime connection cancelled", 499));
      close();
    };
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) abort();
    socket.on("open", () => {
      if (stopped) return;
      opened = true;
      resolve({
        closed,
        close,
        send(event) {
          if (stopped || socket.readyState !== WebSocket.OPEN) {
            throw new XaiError("Realtime connection is closed", 499);
          }
          if (socket.bufferedAmount > 1024 * 1024) {
            close();
            throw new XaiError("Realtime connection is backlogged", 503);
          }
          socket.send(JSON.stringify(event));
        },
      });
    });
    socket.on("message", (data, binary) => {
      if (stopped) return;
      let event: unknown;
      try {
        if (binary) throw new Error("Expected a JSON text event");
        event = JSON.parse(data.toString()) as unknown;
        if (
          typeof event !== "object" ||
          event === null ||
          !("type" in event) ||
          typeof event.type !== "string"
        ) {
          throw new Error("Missing event type");
        }
      } catch {
        options.onError?.(new XaiError("Invalid Realtime event", 502));
        close();
        return;
      }
      options.onEvent(event as XaiRealtimeServerEvent);
    });
    socket.on("unexpected-response", (_request, response) => {
      let body = "";
      response.setTimeout(options.timeout ?? 15_000, close);
      response.on("data", (chunk: Buffer) => {
        body += chunk.toString();
        if (body.length > 32_000) {
          reject(
            new XaiError(
              "Realtime handshake failed",
              response.statusCode ?? 502
            )
          );
          response.destroy();
          close();
        }
      });
      response.on("end", () => {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(body) as unknown;
        } catch {
          parsed = null;
        }
        reject(
          new XaiError(
            "Realtime handshake failed",
            response.statusCode ?? 502,
            parsed
          )
        );
        close();
      });
      response.on("error", () => {
        reject(
          new XaiError("Realtime handshake failed", response.statusCode ?? 502)
        );
        close();
      });
    });
    socket.on("error", () => {
      const error = new XaiError("Realtime connection failed", 502);
      if (!opened) reject(error);
      else if (!stopped) options.onError?.(error);
    });
    socket.on("close", () => {
      stopped = true;
      options.signal?.removeEventListener("abort", abort);
      if (!opened)
        reject(new XaiError("Realtime connection closed before opening", 502));
      resolveClosed();
      options.onClose?.();
    });
  });
}
