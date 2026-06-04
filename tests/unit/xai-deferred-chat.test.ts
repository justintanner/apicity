import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  XaiRealtimeClientEvent,
  XaiRealtimeServerEvent,
} from "../../packages/provider/xai/src/types";
import { createXai, XaiError } from "../../packages/provider/xai/src/index";

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readonly protocols: string[];
  readonly sent: string[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string, protocols: string | string[]) {
    this.url = url;
    this.protocols = Array.isArray(protocols) ? protocols : [protocols];
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.onclose?.();
  }

  emitMessage(event: XaiRealtimeServerEvent): void {
    this.onmessage?.({
      data: JSON.stringify(event),
    } as MessageEvent);
  }

  emitClose(): void {
    this.onclose?.();
  }

  emitError(): void {
    this.onerror?.();
  }
}

const completedResponse = {
  id: "chatcmpl_123",
  object: "chat.completion",
  created: 1752077400,
  model: "grok-3-fast",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "Completed response",
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 5,
    total_tokens: 15,
  },
};

afterEach(() => {
  MockWebSocket.instances = [];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("xAI deferred chat completion", () => {
  it("returns ready:false while a deferred completion is still pending", async () => {
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async () => new Response(null, { status: 202 }),
    });

    const result = await provider.get.v1.chat.deferredCompletion("req-pending");

    expect(result).toEqual({ ready: false, data: null });
  });

  it("returns ready:true with the completed chat payload", async () => {
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async () =>
        new Response(JSON.stringify(completedResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });

    const result =
      await provider.get.v1.chat.deferredCompletion("req-complete");

    expect(result).toEqual({
      ready: true,
      data: completedResponse,
    });
  });

  it("wraps API polling failures in XaiError with the parsed error message", async () => {
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async () =>
        new Response(
          JSON.stringify({
            error: { message: "Request not found" },
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        ),
    });

    try {
      await provider.get.v1.chat.deferredCompletion("req-missing");
      throw new Error("Expected deferred completion polling to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(XaiError);
      expect(error).toMatchObject({
        status: 404,
        message: "XAI API error 404: Request not found",
      });
    }
  });

  it("wraps thrown fetch failures while polling deferred completions", async () => {
    const provider = createXai({
      apiKey: "sk-test-key",
      fetch: async () => {
        throw new Error("socket hang up");
      },
    });

    try {
      await provider.get.v1.chat.deferredCompletion("req-network-failure");
      throw new Error("Expected deferred completion polling to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(XaiError);
      expect(error).toMatchObject({
        status: 500,
        message: "XAI request failed: Error: socket hang up",
      });
    }
  });
});

describe("xAI realtime websocket connection", () => {
  it("uses the websocket endpoint and token override when connecting", () => {
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const provider = createXai({
      apiKey: "sk-test-key",
      baseURL: "https://custom.api.x.ai/v1",
    });

    provider.ws.v1.realtime();
    provider.ws.v1.realtime({ token: "rt-ephemeral-token" });

    expect(MockWebSocket.instances[0].url).toBe(
      "wss://custom.api.x.ai/v1/realtime"
    );
    expect(MockWebSocket.instances[0].protocols).toEqual([
      "realtime",
      "openai-insecure-api-key.sk-test-key",
      "openai-beta.realtime-v1",
    ]);
    expect(MockWebSocket.instances[1].protocols).toEqual([
      "realtime",
      "openai-insecure-api-key.rt-ephemeral-token",
      "openai-beta.realtime-v1",
    ]);
  });

  it("serializes client events before sending them to the websocket", () => {
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const provider = createXai({ apiKey: "sk-test-key" });
    const connection = provider.ws.v1.realtime();
    const socket = MockWebSocket.instances[0];
    const event: XaiRealtimeClientEvent = {
      type: "response.create",
      response: { modalities: ["text"] },
    };

    connection.send(event);

    expect(socket.sent).toEqual([JSON.stringify(event)]);
  });

  it("yields queued realtime events through the async iterator", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const provider = createXai({ apiKey: "sk-test-key" });
    const connection = provider.ws.v1.realtime();
    const socket = MockWebSocket.instances[0];
    const iterator = connection[Symbol.asyncIterator]();
    const event: XaiRealtimeServerEvent = {
      event_id: "evt_123",
      type: "response.created",
      response: {
        id: "resp_123",
        object: "response",
        status: "in_progress",
      },
    };

    socket.emitMessage(event);

    await expect(iterator.next()).resolves.toEqual({
      value: event,
      done: false,
    });
  });

  it("resolves pending iterators and future reads when the websocket closes or errors", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const provider = createXai({ apiKey: "sk-test-key" });

    const closedConnection = provider.ws.v1.realtime();
    const closingSocket = MockWebSocket.instances[0];
    const closingIterator = closedConnection[Symbol.asyncIterator]();
    const pendingClose = closingIterator.next();

    closingSocket.emitClose();

    await expect(pendingClose).resolves.toEqual({
      value: undefined,
      done: true,
    });

    const erroredConnection = provider.ws.v1.realtime();
    const erroredSocket = MockWebSocket.instances[1];
    const erroredIterator = erroredConnection[Symbol.asyncIterator]();
    const pendingError = erroredIterator.next();

    erroredSocket.emitError();

    await expect(pendingError).resolves.toEqual({
      value: undefined,
      done: true,
    });
    await expect(erroredIterator.next()).resolves.toEqual({
      value: undefined,
      done: true,
    });
  });
});
