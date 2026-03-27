import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai translate", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should translate an mp3 file with whisper-1", async () => {
    ctx = setupPolly("openai/translate-tone");

    const mp3Path = resolve(__dirname, "../fixtures/tone.mp3");
    const mp3Buffer = readFileSync(mp3Path);
    const file = new Blob([mp3Buffer], { type: "audio/mp3" });

    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.v1.audio.translations({
      file,
      model: "whisper-1",
      response_format: "json",
    });

    expect(result).toHaveProperty("text");
    expect(typeof result.text).toBe("string");
  });
});
