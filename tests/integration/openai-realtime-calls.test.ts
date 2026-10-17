import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createOpenAi } from "@apicity/openai";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("OpenAI Realtime calls", () => {
  let ctx: PollyContext | undefined;
  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it("creates and hangs up an audio WebRTC call", async () => {
    ctx = setupPolly("openai/realtime-calls");
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    // SDP lines end in CRLF (RFC 8866). The recording was made with CRLF, and
    // git may check the fixture out with LF, which would change the body.
    const sdp = (
      await readFile(
        new URL("../fixtures/openai-realtime-offer.sdp", import.meta.url),
        "utf8"
      )
    ).replace(/\r?\n/g, "\r\n");
    const result = await provider.post.v1.realtime.calls({
      sdp,
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1-mini",
        reasoning: { effort: "minimal" },
        audio: { output: { voice: "marin" } },
      },
    });
    try {
      expect(result.callId).toMatch(/^rtc_/);
      expect(result.sdp).toContain("m=audio");
    } finally {
      await provider.post.v1.realtime.calls.hangup(result.callId);
    }
  });

  it("exposes a schema for SDP with optional GA session configuration", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    expect(
      provider.post.v1.realtime.calls.schema.safeParse({ sdp: "" }).success
    ).toBe(false);
    expect(
      provider.post.v1.realtime.calls.schema.safeParse({
        sdp: "v=0",
        session: { type: "realtime", model: "gpt-realtime-2.1-mini" },
      }).success
    ).toBe(true);
  });
});
