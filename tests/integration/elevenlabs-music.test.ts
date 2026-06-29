import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

function readAudio(): Blob {
  const wavPath = resolve(__dirname, "../fixtures/music-sample.wav");
  return new Blob([readFileSync(wavPath)], { type: "audio/wav" });
}

function readVideo(): Blob {
  const mp4Path = resolve(__dirname, "../fixtures/seedance-ref.mp4");
  return new Blob([readFileSync(mp4Path)], { type: "video/mp4" });
}

describe("elevenlabs v1.music", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  function makeProvider() {
    return createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });
  }

  it(
    "composes music and returns binary audio",
    { timeout: 180000 },
    async () => {
      ctx = setupPolly("elevenlabs/music-compose");
      const audio = await makeProvider().v1.music({
        prompt: "calm lo-fi piano loop",
        music_length_ms: 10000,
        force_instrumental: true,
      });

      expect(audio).toBeInstanceOf(ArrayBuffer);
      expect(audio.byteLength).toBeGreaterThan(0);
    }
  );

  it(
    "composes music with a detailed response",
    { timeout: 180000 },
    async () => {
      ctx = setupPolly("elevenlabs/music-detailed");
      const result = await makeProvider().v1.music.detailed({
        prompt: "calm lo-fi piano loop",
        music_length_ms: 10000,
        force_instrumental: true,
      });

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    }
  );

  it("generates a composition plan", { timeout: 180000 }, async () => {
    ctx = setupPolly("elevenlabs/music-plan");
    const plan = await makeProvider().v1.music.plan({
      prompt: "calm lo-fi piano loop",
      music_length_ms: 10000,
    });

    expect(plan).toBeTruthy();
    const hasSections = "sections" in plan && Array.isArray(plan.sections);
    const hasChunks = "chunks" in plan && Array.isArray(plan.chunks);
    expect(hasSections || hasChunks).toBe(true);
  });

  it(
    "streams composed music as binary audio",
    { timeout: 180000 },
    async () => {
      ctx = setupPolly("elevenlabs/music-stream");
      const audio = await makeProvider().v1.music.stream({
        prompt: "calm lo-fi piano loop",
        music_length_ms: 10000,
        force_instrumental: true,
      });

      expect(audio).toBeInstanceOf(ArrayBuffer);
      expect(audio.byteLength).toBeGreaterThan(0);
    }
  );

  it("separates a song into stems", { timeout: 180000 }, async () => {
    ctx = setupPolly("elevenlabs/music-stem-separation");
    const zip = await makeProvider().v1.music.stemSeparation({
      file: readAudio(),
      stem_variation_id: "two_stems_v1",
    });

    expect(zip).toBeInstanceOf(ArrayBuffer);
    expect(zip.byteLength).toBeGreaterThan(0);
  });

  it("uploads a song", { timeout: 180000 }, async () => {
    ctx = setupPolly("elevenlabs/music-upload");
    const result = await makeProvider().v1.music.upload({
      file: readAudio(),
    });

    expect(typeof result.song_id).toBe("string");
    expect(result.song_id.length).toBeGreaterThan(0);
  });

  it(
    "generates music from a video and returns binary audio",
    { timeout: 180000 },
    async () => {
      ctx = setupPolly("elevenlabs/music-video-to-music");
      const audio = await makeProvider().v1.music.videoToMusic({
        videos: [readVideo()],
        description: "cinematic ambient score",
      });

      expect(audio).toBeInstanceOf(ArrayBuffer);
      expect(audio.byteLength).toBeGreaterThan(0);
    }
  );
});
