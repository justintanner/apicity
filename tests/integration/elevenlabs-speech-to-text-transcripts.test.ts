import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";
import type { ElevenLabsTranscript } from "@apicity/elevenlabs";

describe("elevenlabs v1.speechToText.transcripts", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/speech-to-text-transcripts");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets and deletes a transcript by id", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Endpoints are exposed on the ergonomic `v1` tree under the
    // speechToText callable's `transcripts` namespace.
    expect(typeof provider.v1.speechToText.transcripts.get).toBe("function");
    expect(typeof provider.v1.speechToText.transcripts.delete).toBe("function");

    // 1. Convert audio to obtain a persisted transcription id.
    const mp3Path = resolve(__dirname, "../fixtures/tone.mp3");
    const file = new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });
    const created = (await provider.v1.speechToText({
      file,
      model_id: "scribe_v2",
      language_code: "eng",
    })) as ElevenLabsTranscript;
    expect(typeof created.transcription_id).toBe("string");
    const transcriptionId = created.transcription_id as string;

    // 2. Get the transcript by id.
    const fetched = (await provider.v1.speechToText.transcripts.get(
      transcriptionId
    )) as ElevenLabsTranscript;
    expect(fetched.transcription_id).toBe(transcriptionId);
    expect(typeof fetched.text).toBe("string");
    expect(Array.isArray(fetched.words)).toBe(true);

    // 3. Delete the transcript by id.
    await expect(
      provider.v1.speechToText.transcripts.delete(transcriptionId)
    ).resolves.toBeDefined();
  });
});
