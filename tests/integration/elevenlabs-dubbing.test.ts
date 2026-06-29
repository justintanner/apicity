import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.dubbing", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "dubs an audio file, then reads, lists, fetches and deletes it",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("elevenlabs/dubbing");

      const provider = createElevenLabs({
        apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
      });

      // Endpoints are exposed on the ergonomic `v1` tree under `dubbing`.
      expect(typeof provider.v1.dubbing.list).toBe("function");
      expect(typeof provider.v1.dubbing.create).toBe("function");
      expect(typeof provider.v1.dubbing.get).toBe("function");
      expect(typeof provider.v1.dubbing.delete).toBe("function");
      expect(typeof provider.v1.dubbing.audio.get).toBe("function");
      expect(typeof provider.v1.dubbing.transcripts.get).toBe("function");

      // 1. Kick off a dubbing job (English → Spanish) from a short clip.
      const mp3Path = resolve(__dirname, "../fixtures/dialog.mp3");
      const file = new Blob([readFileSync(mp3Path)], { type: "audio/mpeg" });
      const created = await provider.v1.dubbing.create({
        file,
        name: "apicity-dubbing-test",
        source_lang: "en",
        target_lang: "es",
        num_speakers: 1,
      });
      expect(typeof created.dubbing_id).toBe("string");
      expect(typeof created.expected_duration_sec).toBe("number");
      const dubbingId = created.dubbing_id;

      // 2. Poll the dubbing metadata until the job finishes.
      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      let status = "dubbing";
      for (let i = 0; i < 120; i++) {
        const meta = await provider.v1.dubbing.get(dubbingId);
        expect(meta.dubbing_id).toBe(dubbingId);
        status = meta.status;
        if (status === "dubbed" || status === "failed") {
          expect(Array.isArray(meta.target_languages)).toBe(true);
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }
      expect(status).toBe("dubbed");

      // 3. List dubs and confirm the new project is present.
      const listed = await provider.v1.dubbing.list({ page_size: 50 });
      expect(Array.isArray(listed.dubs)).toBe(true);
      expect(typeof listed.has_more).toBe("boolean");
      expect(listed.dubs.some((d) => d.dubbing_id === dubbingId)).toBe(true);

      // 4. Download the dubbed audio for the target language.
      const audio = await provider.v1.dubbing.audio.get(dubbingId, "es");
      expect(audio).toBeInstanceOf(ArrayBuffer);
      expect(audio.byteLength).toBeGreaterThan(0);

      // 5. Retrieve the SRT transcript for the target language.
      const transcript = await provider.v1.dubbing.transcripts.get(
        dubbingId,
        "es",
        "srt"
      );
      expect(transcript.transcript_format).toBe("srt");
      expect(typeof transcript.srt).toBe("string");

      // 6. Delete the dubbing project.
      const deleted = await provider.v1.dubbing.delete(dubbingId);
      expect(typeof deleted.status).toBe("string");
    }
  );
});
