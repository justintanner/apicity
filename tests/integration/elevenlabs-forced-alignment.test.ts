import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

function readAudio(): Blob {
  const mp3Path = resolve(__dirname, "../fixtures/dialog.mp3");
  return new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });
}

describe("elevenlabs v1.forcedAlignment", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("aligns a transcript to audio", async () => {
    ctx = setupPolly("elevenlabs/forced-alignment");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const result = await provider.v1.forcedAlignment({
      file: readAudio(),
      text: "Hello, how are you doing today?",
    });

    expect(Array.isArray(result.characters)).toBe(true);
    expect(Array.isArray(result.words)).toBe(true);
    expect(result.words.length).toBeGreaterThan(0);
    expect(typeof result.loss).toBe("number");

    const word = result.words[0];
    expect(typeof word.text).toBe("string");
    expect(typeof word.start).toBe("number");
    expect(typeof word.end).toBe("number");
    expect(typeof word.loss).toBe("number");
  });
});
