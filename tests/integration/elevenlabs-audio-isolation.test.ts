import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

const PREVIEW_B64 = Buffer.from("apicity-audio-isolation").toString("base64");

function readAudio(): Blob {
  const mp3Path = resolve(__dirname, "../fixtures/dialog.mp3");
  return new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });
}

describe("elevenlabs v1.audioIsolation", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("isolates audio, streams output, and manages history", async () => {
    ctx = setupPolly("elevenlabs/audio-isolation");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const audio = await provider.v1.audioIsolation({
      audio: readAudio(),
      file_format: "other",
      preview_b64: PREVIEW_B64,
    });

    expect(audio).toBeInstanceOf(ArrayBuffer);
    expect(audio.byteLength).toBeGreaterThan(0);

    const streamed = await provider.v1.audioIsolation.stream({
      audio: readAudio(),
      file_format: "other",
    });

    expect(streamed).toBeInstanceOf(ArrayBuffer);
    expect(streamed.byteLength).toBeGreaterThan(0);

    let history = await provider.v1.audioIsolation.history.list({
      page_size: 1000,
    });
    let item = history.items.find(
      (candidate) => candidate.preview_b64 === PREVIEW_B64
    );

    for (let attempt = 0; !item && attempt < 4; attempt++) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
      history = await provider.v1.audioIsolation.history.list({
        page_size: 1000,
      });
      item = history.items.find(
        (candidate) => candidate.preview_b64 === PREVIEW_B64
      );
    }

    expect(history.has_more).toEqual(expect.any(Boolean));
    expect(item).toBeDefined();
    if (!item) {
      throw new Error("Audio isolation history item was not found");
    }

    const deleted = await provider.v1.audioIsolation.history.delete(item.id);
    expect(deleted).toEqual({});
  });
});
