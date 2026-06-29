import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.voices add/edit/samples/delete", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("adds, inspects, edits and deletes an instant voice clone", async () => {
    ctx = setupPolly("elevenlabs/voice-crud");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // Method-grouped aliases point at the same callables.
    expect(provider.post.v1.voices.add).toBe(provider.v1.voices.add);
    expect(provider.post.v1.voices.edit).toBe(provider.v1.voices.edit);
    expect(provider.post.v1.voices.settings.edit).toBe(
      provider.v1.voices.settings.edit
    );
    expect(provider.delete.v1.voices.delete).toBe(provider.v1.voices.delete);
    expect(provider.delete.v1.voices.samples.delete).toBe(
      provider.v1.voices.samples.delete
    );

    // 1. POST /v1/voices/add — instant voice clone from an audio sample.
    // dialog.mp3 (~3s of speech) satisfies the API's 1s-minimum sample length.
    const mp3Path = resolve(__dirname, "../fixtures/dialog.mp3");
    const file = new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });
    const added = await provider.v1.voices.add({
      name: "Apicity Test IVC",
      files: [file],
      description: "Temporary voice created by the apicity test suite.",
    });
    expect(typeof added.voice_id).toBe("string");
    const voiceId = added.voice_id;

    // 2. GET /v1/voices/{voiceId} — read the new voice and its sample id.
    const voice = await provider.v1.voices(voiceId);
    expect(voice.voice_id).toBe(voiceId);
    const sampleId = voice.samples?.[0]?.sample_id;
    expect(typeof sampleId).toBe("string");

    // 3. GET /v1/voices/{voiceId}/samples/{sampleId}/audio — raw sample bytes.
    const sampleAudio = await provider.v1.voices.samples.audio(
      voiceId,
      sampleId as string
    );
    expect(sampleAudio).toBeInstanceOf(ArrayBuffer);
    expect(sampleAudio.byteLength).toBeGreaterThan(0);

    // 4. POST /v1/voices/{voiceId}/edit — rename the voice.
    const edited = await provider.v1.voices.edit(voiceId, {
      name: "Apicity Test IVC (renamed)",
    });
    expect(typeof edited.status).toBe("string");

    // 5. POST /v1/voices/{voiceId}/settings/edit — adjust voice settings.
    const settings = await provider.v1.voices.settings.edit(voiceId, {
      stability: 0.4,
      similarity_boost: 0.8,
    });
    expect(typeof settings.status).toBe("string");

    // 6. DELETE /v1/voices/{voiceId}/samples/{sampleId} — remove the sample.
    const deletedSample = await provider.v1.voices.samples.delete(
      voiceId,
      sampleId as string
    );
    expect(typeof deletedSample.status).toBe("string");

    // 7. DELETE /v1/voices/{voiceId} — clean up the temporary voice.
    const deletedVoice = await provider.v1.voices.delete(voiceId);
    expect(typeof deletedVoice.status).toBe("string");
  }, 120000);
});
