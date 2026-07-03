import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

const recordingName = "openai/realtime-client-secrets";

describe("openai realtime client secrets integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should create a realtime client secret", async () => {
    ctx = setupPolly(recordingName);
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.realtime.clientSecrets({
      expires_after: {
        anchor: "created_at",
        seconds: 600,
      },
      session: {
        type: "realtime",
        model: "gpt-realtime",
        instructions: "You are a concise test assistant.",
      },
    });

    expect(result.value).toMatch(/^ek_/);
    expect(typeof result.expires_at).toBe("number");
    expect(result.expires_at).toBeGreaterThan(0);
    expect(result.session.type).toBe("realtime");
  });

  it("exposes a request schema with realtime and transcription sessions", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    const endpoint = provider.post.v1.realtime.clientSecrets;

    expect(endpoint).toBeDefined();
    expect(endpoint).toBeTypeOf("function");
    expect(endpoint.schema.safeParse({}).success).toBe(true);

    expect(
      endpoint.schema.safeParse({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: "gpt-realtime",
          output_modalities: ["text"],
          audio: {
            input: {
              turn_detection: { type: "server_vad", threshold: 0.5 },
            },
          },
        },
      }).success
    ).toBe(true);

    expect(
      endpoint.schema.safeParse({
        session: {
          type: "transcription",
          audio: {
            input: {
              transcription: { model: "gpt-realtime-whisper" },
            },
          },
        },
      }).success
    ).toBe(true);

    expect(
      endpoint.schema.safeParse({
        expires_after: { seconds: 9 },
      }).success
    ).toBe(false);
  });
});
