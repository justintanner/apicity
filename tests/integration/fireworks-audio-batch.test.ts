import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks audio batch processing", () => {
  describe("payload validation", () => {
    it("should validate batch transcription with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.audio.batch.transcriptions.validatePayload({
        file: "https://example.com/audio.mp3",
        endpoint_id: "ep-test-123",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject batch transcription missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid = provider.v1.audio.batch.transcriptions.validatePayload(
        {}
      );
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("file is required");
      expect(invalid.errors).toContain("endpoint_id is required");
    });

    it("should validate batch transcription with optional fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.audio.batch.transcriptions.validatePayload({
        file: "https://example.com/audio.mp3",
        endpoint_id: "ep-test-123",
        model: "whisper-v3",
        language: "en",
        response_format: "json",
        diarize: "true",
        min_speakers: 2,
        max_speakers: 5,
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should validate batch translation with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.audio.batch.translations.validatePayload({
        file: "https://example.com/audio.mp3",
        endpoint_id: "ep-test-123",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject batch translation missing required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const invalid = provider.v1.audio.batch.translations.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("file is required");
      expect(invalid.errors).toContain("endpoint_id is required");
    });

    it("should expose transcription payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.audio.batch.transcriptions.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/audio/transcriptions");
      expect(schema.contentType).toBe("multipart/form-data");
      expect(schema.fields.file.required).toBe(true);
      expect(schema.fields.endpoint_id.required).toBe(true);
    });

    it("should expose translation payload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.audio.batch.translations.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/audio/translations");
      expect(schema.contentType).toBe("multipart/form-data");
      expect(schema.fields.file.required).toBe(true);
      expect(schema.fields.endpoint_id.required).toBe(true);
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
  });
});
