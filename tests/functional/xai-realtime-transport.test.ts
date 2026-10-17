import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { createServer } from "node:http";
import { once } from "node:events";
import { WebSocketServer } from "ws";
import type {
  XaiRealtimeAudioConfig,
  XaiRealtimeConversationItem,
  XaiRealtimeConversationItemCreate,
  XaiRealtimeForceMessageItem,
} from "@apicity/xai";
import { connectXaiRealtime } from "../../packages/provider/xai/src/realtime";
import type {
  XaiRealtimeClientEvent,
  XaiRealtimeConnection,
  XaiRealtimeServerEvent,
} from "../../packages/provider/xai/src/realtime";

describe("xAI Realtime WebSocket transport", () => {
  const connections: XaiRealtimeConnection[] = [];
  const servers: WebSocketServer[] = [];

  afterEach(async () => {
    for (const connection of connections.splice(0)) connection.close();
    for (const server of servers.splice(0)) {
      for (const socket of server.clients) socket.terminate();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  async function server() {
    const socket = new WebSocketServer({ port: 0, host: "127.0.0.1" });
    servers.push(socket);
    await once(socket, "listening");
    const address = socket.address();
    if (!address || typeof address === "string")
      throw new Error("Expected TCP address");
    return { socket, baseURL: `ws://127.0.0.1:${address.port}/v1/realtime` };
  }

  it("authenticates a voice session and exchanges JSON events over a real socket", async () => {
    const { socket, baseURL } = await server();
    let authorization = "";
    let path = "";
    const received = new Promise<unknown>((resolve) =>
      socket.once("connection", (peer, request) => {
        authorization = request.headers.authorization ?? "";
        path = request.url ?? "";
        peer.on("message", (data) => {
          resolve(JSON.parse(data.toString()));
          peer.send(
            JSON.stringify({
              type: "session.updated",
              session: { id: "fixture" },
            })
          );
        });
      })
    );
    const events: XaiRealtimeServerEvent[] = [];
    const connection = await connectXaiRealtime({
      apiKey: "sk-fixture",
      baseURL,
      model: "grok-voice-think-fast-2.0",
      onEvent: (event) => events.push(event),
    });
    connections.push(connection);
    connection.send({ type: "response.create" });
    expect(await received).toEqual({ type: "response.create" });
    await expect
      .poll(() => events)
      .toEqual([{ type: "session.updated", session: { id: "fixture" } }]);
    expect(authorization).toBe("Bearer sk-fixture");
    expect(path).toBe("/v1/realtime?model=grok-voice-think-fast-2.0");
    connection.close();
    connection.close();
    await connection.closed;
    expect(() => connection.send({ type: "response.create" })).toThrow(
      "closed"
    );
  });

  it("sends a force_message item and audio.output.speed over a real socket", async () => {
    const { socket, baseURL } = await server();
    const received = new Promise<unknown[]>((resolve) =>
      socket.once("connection", (peer) => {
        const messages: unknown[] = [];
        peer.on("message", (data) => {
          messages.push(JSON.parse(data.toString()));
          if (messages.length === 2) resolve(messages);
        });
      })
    );
    const connection = await connectXaiRealtime({
      apiKey: "sk-fixture",
      baseURL,
      model: "grok-voice-think-fast-2.0",
      onEvent: () => undefined,
    });
    connections.push(connection);
    const sessionUpdate = {
      type: "session.update",
      session: {
        voice: "eve",
        audio: { output: { format: { type: "audio/pcm" }, speed: 1.25 } },
      },
    } satisfies XaiRealtimeClientEvent;
    const activationLine = {
      type: "conversation.item.create",
      item: {
        type: "force_message",
        role: "assistant",
        interruptible: false,
        content: [{ type: "output_text", text: "Voice mode is on." }],
      },
    } satisfies XaiRealtimeClientEvent;
    connection.send(sessionUpdate);
    connection.send(activationLine);
    expect(await received).toEqual([sessionUpdate, activationLine]);
  });

  it("types force_message items and audio.output.speed for both entry points", () => {
    expectTypeOf<
      NonNullable<XaiRealtimeAudioConfig["output"]>["speed"]
    >().toEqualTypeOf<number | undefined>();
    expectTypeOf<XaiRealtimeForceMessageItem>().toEqualTypeOf<{
      type: "force_message";
      role: "assistant";
      content: { type: "output_text"; text: string }[];
      interruptible?: boolean;
    }>();
    expectTypeOf<
      XaiRealtimeConversationItemCreate["item"]
    >().toEqualTypeOf<XaiRealtimeConversationItem>();
    expectTypeOf<
      Extract<
        XaiRealtimeClientEvent,
        { type: "conversation.item.create" }
      >["item"]
    >().toEqualTypeOf<XaiRealtimeConversationItem>();

    const rejected: XaiRealtimeClientEvent[] = [
      {
        type: "conversation.item.create",
        item: {
          type: "force_message",
          // @ts-expect-error force_message items are always assistant turns.
          role: "user",
          content: [{ type: "output_text", text: "Hello" }],
        },
      },
      {
        type: "conversation.item.create",
        item: {
          type: "force_message",
          role: "assistant",
          // @ts-expect-error force_message content parts are output_text.
          content: [{ type: "input_text", text: "Hello" }],
        },
      },
      {
        type: "session.update",
        // @ts-expect-error audio.output.speed is a numeric multiplier.
        session: { audio: { output: { speed: "fast" } } },
      },
    ];
    expect(rejected).toHaveLength(3);
  });

  it("closes malformed events and reports a redacted transport error", async () => {
    const { socket, baseURL } = await server();
    socket.once("connection", (peer) => peer.send("private invalid data"));
    const errors: string[] = [];
    const connection = await connectXaiRealtime({
      apiKey: "sk-fixture",
      baseURL,
      model: "grok-voice-think-fast-2.0",
      onEvent: () => {
        throw new Error("Invalid events must not be delivered");
      },
      onError: (error) => errors.push(error.message),
    });
    connections.push(connection);
    await connection.closed;
    expect(errors).toEqual(["Invalid Realtime event"]);
  });

  it("aborts both an established connection and an unopened one", async () => {
    const { baseURL } = await server();
    const controller = new AbortController();
    const connection = await connectXaiRealtime({
      apiKey: "sk-fixture",
      baseURL,
      model: "grok-voice-think-fast-2.0",
      signal: controller.signal,
      onEvent: () => undefined,
    });
    connections.push(connection);
    controller.abort();
    await connection.closed;
    await expect(
      connectXaiRealtime({
        apiKey: "sk-fixture",
        baseURL,
        model: "grok-voice-think-fast-2.0",
        signal: controller.signal,
        onEvent: () => undefined,
      })
    ).rejects.toThrow("cancelled");
  });

  it("preserves a rejected handshake status and body without copying details into its message", async () => {
    const http = createServer();
    http.on("upgrade", (_request, socket) => {
      const body = JSON.stringify({
        error: {
          code: "rate_limit_exceeded",
          message: "private provider details",
        },
      });
      socket.end(
        `HTTP/1.1 429 Too Many Requests\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`
      );
    });
    http.listen(0, "127.0.0.1");
    await once(http, "listening");
    const address = http.address();
    if (!address || typeof address === "string")
      throw new Error("Expected TCP address");
    try {
      await expect(
        connectXaiRealtime({
          apiKey: "sk-fixture",
          baseURL: `ws://127.0.0.1:${address.port}`,
          model: "grok-voice-think-fast-2.0",
          onEvent: () => undefined,
        })
      ).rejects.toMatchObject({
        status: 429,
        message: "Realtime handshake failed",
        body: { error: { code: "rate_limit_exceeded" } },
      });
    } finally {
      http.closeAllConnections();
      await new Promise<void>((resolve) => http.close(() => resolve()));
    }
  });

  it("bounds a server that never completes the WebSocket handshake", async () => {
    const http = createServer();
    const clients = new Set<import("node:net").Socket>();
    http.on("connection", (client) => {
      clients.add(client);
      client.on("close", () => clients.delete(client));
    });
    http.on("upgrade", () => undefined);
    http.listen(0, "127.0.0.1");
    await once(http, "listening");
    const address = http.address();
    if (!address || typeof address === "string")
      throw new Error("Expected TCP address");
    try {
      await expect(
        connectXaiRealtime({
          apiKey: "sk-fixture",
          baseURL: `ws://127.0.0.1:${address.port}`,
          model: "grok-voice-think-fast-2.0",
          timeout: 50,
          onEvent: () => undefined,
        })
      ).rejects.toThrow("failed");
    } finally {
      for (const client of clients) client.destroy();
      await new Promise<void>((resolve) => http.close(() => resolve()));
    }
  });
});
