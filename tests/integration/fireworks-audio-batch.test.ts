import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks audio batch integration", () => {
  let ctx: PollyContext;

  // TODO: re-record missing "fireworks/audio-batch-transcription" and
  // "fireworks/audio-batch-translation" HARs. Skipped because the recording
  // directories were never committed alongside the tests.
  describe.skip("batch transcription job lifecycle", () => {
    beforeEach(() => {
      ctx = setupPollyForFileUploads("fireworks/audio-batch-transcription");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create and retrieve batch transcription job", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      // Create a mock audio file blob
      const audioBlob = new Blob([new Uint8Array(1024).fill(0)], {
        type: "audio/mp3",
      });

      // Submit batch transcription job
      const submitResult = await provider.v1.audio.batch.transcriptions({
        file: audioBlob,
        endpoint_id: "ep-test-123",
        model: "whisper-v3",
        language: "en",
        response_format: "json",
      });

      expect(submitResult).toBeDefined();
      expect(submitResult.request_id).toBeTruthy();

      // Retrieve job status
      const jobResult = await provider.v1.audio.batch.get(
        "fireworks",
        submitResult.request_id
      );

      expect(jobResult).toBeDefined();
      expect(jobResult.request_id).toBe(submitResult.request_id);
    });
  });

  describe.skip("batch translation job lifecycle", () => {
    beforeEach(() => {
      ctx = setupPollyForFileUploads("fireworks/audio-batch-translation");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create and retrieve batch translation job", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      // Create a mock audio file blob
      const audioBlob = new Blob([new Uint8Array(1024).fill(0)], {
        type: "audio/mp3",
      });

      // Submit batch translation job
      const submitResult = await provider.v1.audio.batch.translations({
        file: audioBlob,
        endpoint_id: "ep-test-123",
        model: "whisper-v3",
        language: "en",
        response_format: "json",
      });

      expect(submitResult).toBeDefined();
      expect(submitResult.request_id).toBeTruthy();

      // Retrieve job status
      const jobResult = await provider.v1.audio.batch.get(
        "fireworks",
        submitResult.request_id
      );

      expect(jobResult).toBeDefined();
      expect(jobResult.request_id).toBe(submitResult.request_id);
    });
  });

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

    it("should expose payload schemas on all methods", () => {
      const provider = fireworks({ apiKey: "test" });
      expect(
        provider.v1.audio.batch.transcriptions.payloadSchema
      ).toBeDefined();
      expect(provider.v1.audio.batch.translations.payloadSchema).toBeDefined();
    });
  });
});
