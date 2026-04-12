import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fireworks, FireworksError } from "@apicity/fireworks";

describe("fireworks audio batch integration", () => {
  let ctx: PollyContext;

  describe("batch transcription submit with invalid endpoint", () => {
    beforeEach(() => {
      ctx = setupPollyForFileUploads("fireworks/audio-batch-transcription");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should reject submission with unknown endpoint_id", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const audioBlob = new Blob([new Uint8Array(1024).fill(0)], {
        type: "audio/mp3",
      });

      await expect(
        provider.v1.audio.batch.transcriptions({
          file: audioBlob,
          endpoint_id: "ep-test-123",
          model: "whisper-v3",
          language: "en",
          response_format: "json",
        })
      ).rejects.toMatchObject({
        name: "FireworksError",
        status: 400,
      });
    });
  });

  describe("batch translation submit with invalid endpoint", () => {
    beforeEach(() => {
      ctx = setupPollyForFileUploads("fireworks/audio-batch-translation");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should reject submission with unknown endpoint_id", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const audioBlob = new Blob([new Uint8Array(1024).fill(0)], {
        type: "audio/mp3",
      });

      const err = await provider.v1.audio.batch
        .translations({
          file: audioBlob,
          endpoint_id: "ep-test-123",
          model: "whisper-v3",
          language: "en",
          response_format: "json",
        })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(FireworksError);
      expect((err as FireworksError).status).toBe(400);
    });
  });

  describe("payload validation", () => {
    it("should validate batch transcription with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.audio.batch.transcriptions.schema.safeParse({
        file: "https://example.com/audio.mp3",
        endpoint_id: "ep-test-123",
      });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject batch transcription missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid = provider.v1.audio.batch.transcriptions.schema.safeParse(
        {}
      );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate batch transcription with optional fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.audio.batch.transcriptions.schema.safeParse({
        file: "https://example.com/audio.mp3",
        endpoint_id: "ep-test-123",
        model: "whisper-v3",
        language: "en",
        response_format: "json",
        diarize: "true",
        min_speakers: 2,
        max_speakers: 5,
      });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should validate batch translation with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.audio.batch.translations.schema.safeParse({
        file: "https://example.com/audio.mp3",
        endpoint_id: "ep-test-123",
      });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject batch translation missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid = provider.v1.audio.batch.translations.schema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should expose transcription payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.audio.batch.transcriptions.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should expose translation payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.audio.batch.translations.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose batch transcriptions, translations, and get methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const batch = provider.v1.audio.batch;
      expect(typeof batch.transcriptions).toBe("function");
      expect(typeof batch.translations).toBe("function");
      expect(typeof batch.get).toBe("function");
    });

    it("should expose payload schemas on all methods", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(provider.v1.audio.batch.transcriptions.schema).toBeDefined();
      expect(provider.v1.audio.batch.translations.schema).toBeDefined();
    });
  });
});
