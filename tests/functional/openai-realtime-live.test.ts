import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createOpenAi } from "@apicity/openai";
import { connectOpenAiRealtime } from "../../packages/provider/openai/src/realtime";
import type {
  OpenAiRealtimeConnection,
  OpenAiRealtimeServerEvent,
} from "../../packages/provider/openai/src/realtime";

it.runIf(process.env.OPENAI_RUN_REALTIME_LIVE === "1")(
  "controls an actual OpenAI WebRTC call over its sideband",
  async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      throw new Error("OPENAI_API_KEY is required for the live test");
    const provider = createOpenAi({ apiKey });
    // SDP lines end in CRLF (RFC 8866); git may check the fixture out with LF.
    const sdp = (
      await readFile(
        new URL("../fixtures/openai-realtime-offer.sdp", import.meta.url),
        "utf8"
      )
    ).replace(/\r?\n/g, "\r\n");
    const call = await provider.post.v1.realtime.calls({
      sdp,
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1-mini",
        reasoning: { effort: "minimal" },
      },
    });
    let connection: OpenAiRealtimeConnection | undefined;
    const events: OpenAiRealtimeServerEvent[] = [];
    const errors: string[] = [];
    try {
      connection = await connectOpenAiRealtime({
        apiKey,
        callId: call.callId,
        onEvent: (event) => events.push(event),
        onError: (error) => errors.push(error.message),
      });
      connection.send({
        type: "session.update",
        session: { type: "realtime", instructions: "Keep replies short." },
      });
      await expect
        .poll(() => events.some((event) => event.type === "session.updated"), {
          timeout: 10_000,
        })
        .toBe(true);
      expect(errors).toEqual([]);
      expect(events.filter((event) => event.type === "error")).toEqual([]);
    } finally {
      connection?.close();
      await provider.post.v1.realtime.calls.hangup(call.callId);
      await connection?.closed;
    }
  }
);
