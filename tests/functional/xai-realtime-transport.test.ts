import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { once } from "node:events";
import { WebSocketServer } from "ws";
import { connectXaiRealtime } from "../../packages/provider/xai/src/realtime";
import type {
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
