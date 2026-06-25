import { describe, it, expect } from "vitest";

import {
  ElevenLabsSoundGenerationRequestSchema,
  ElevenLabsTextToDialogueRequestSchema,
  ElevenLabsTextToSpeechRequestSchema,
  ElevenLabsSpeechToTextRequestSchema,
  ElevenLabsPvcTrainRequestSchema,
  ElevenLabsWorkspaceAnalyticsRequestsRequestSchema,
} from "../../packages/provider/elevenlabs/src/zod";

describe("ElevenLabs Zod schema validation", () => {
  describe("sound generation schema", () => {
    it("should validate with required text field only", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "Generate a thunderstorm sound",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "Generate a thunderstorm sound",
        model_id: "eleven_multilingual_v2",
        duration_seconds: 10,
        prompt_influence: 0.5,
        loop: true,
        output_format: "mp3_44100_128",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing required text field", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        model_id: "eleven_multilingual_v2",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
        true
      );
    });

    it("should reject empty text string", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
        true
      );
    });

    it("should reject duration_seconds below minimum", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "short sound",
        duration_seconds: 0.1,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("duration_seconds"))
      ).toBe(true);
    });

    it("should reject duration_seconds above maximum", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "long sound",
        duration_seconds: 31,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("duration_seconds"))
      ).toBe(true);
    });

    it("should reject prompt_influence above maximum", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "sound",
        prompt_influence: 1.5,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("prompt_influence"))
      ).toBe(true);
    });

    it("should reject prompt_influence below minimum", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "sound",
        prompt_influence: -0.5,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("prompt_influence"))
      ).toBe(true);
    });

    it("should accept null for nullable optional fields", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "sound",
        duration_seconds: null,
        prompt_influence: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("PVC train schema", () => {
    it("should validate optional PVC train payloads", () => {
      expect(ElevenLabsPvcTrainRequestSchema.safeParse({}).success).toBe(true);
      expect(
        ElevenLabsPvcTrainRequestSchema.safeParse({
          model_id: "eleven_turbo_v2",
        }).success
      ).toBe(true);
      expect(
        ElevenLabsPvcTrainRequestSchema.safeParse({ model_id: null }).success
      ).toBe(true);
      expect(
        ElevenLabsPvcTrainRequestSchema.safeParse({ model_id: 123 }).success
      ).toBe(false);
    });
  });

  describe("speech to text schema", () => {
    it("should validate with minimal required fields", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v2",
        cloud_storage_url: "https://example.com/audio.mp3",
        source_url: "https://example.com/audio.mp3",
        language_code: "en",
        tag_audio_events: true,
        num_speakers: 2,
        timestamps_granularity: "word",
        diarize: true,
        diarization_threshold: 0.5,
        additional_formats: [{ format: "json" }],
        file_format: "pcm_s16le_16",
        webhook: false,
        webhook_id: "wh-123",
        webhook_metadata: { key: "value" },
        temperature: 0.5,
        seed: 42,
        use_multi_channel: false,
        entity_detection: "person",
        entity_redaction: ["email", "phone"],
        entity_redaction_mode: "redacted",
        no_verbatim: false,
        detect_speaker_roles: true,
        keyterms: ["AI", "machine learning"],
        enable_logging: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid model_id", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "invalid_model",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("model_id"))
      ).toBe(true);
    });

    it("should reject num_speakers below minimum", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        num_speakers: 0,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("num_speakers"))
      ).toBe(true);
    });

    it("should reject num_speakers above maximum", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        num_speakers: 33,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("num_speakers"))
      ).toBe(true);
    });

    it("should reject diarization_threshold above maximum", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        diarization_threshold: 2.5,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) =>
          i.path.includes("diarization_threshold")
        )
      ).toBe(true);
    });

    it("should reject temperature above maximum", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        temperature: 2.1,
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("temperature"))
      ).toBe(true);
    });

    it("should reject seed above maximum", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        seed: 2147483648,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("seed"))).toBe(
        true
      );
    });

    it("should reject invalid timestamps_granularity", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        timestamps_granularity: "sentence",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) =>
          i.path.includes("timestamps_granularity")
        )
      ).toBe(true);
    });

    it("should reject invalid file_format", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        file_format: "mp3",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("file_format"))
      ).toBe(true);
    });

    it("should reject invalid entity_redaction_mode", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        entity_redaction_mode: "full",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) =>
          i.path.includes("entity_redaction_mode")
        )
      ).toBe(true);
    });

    it("should reject too many keyterms", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        keyterms: Array(1001).fill("term"),
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("keyterms"))
      ).toBe(true);
    });

    it("should reject keyterm exceeding max length", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        keyterms: ["a".repeat(51)],
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("keyterms"))
      ).toBe(true);
    });

    it("should accept null for nullable optional fields", () => {
      const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
        model_id: "scribe_v1",
        cloud_storage_url: null,
        source_url: null,
        language_code: null,
        num_speakers: null,
        diarization_threshold: null,
        temperature: null,
        seed: null,
        webhook_metadata: null,
        entity_detection: null,
        entity_redaction: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("text to speech schema", () => {
    it("should validate a text-to-speech request", () => {
      const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
        text: "The first move sets everything in motion.",
        model_id: "eleven_multilingual_v2",
        language_code: "en",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
          speed: 1,
        },
        pronunciation_dictionary_locators: [
          {
            pronunciation_dictionary_id: "dict_123",
            version_id: "v1",
          },
        ],
        seed: 42,
        previous_text: "Before.",
        next_text: "After.",
        previous_request_ids: ["req_prev"],
        next_request_ids: ["req_next"],
        use_pvc_as_ivc: false,
        apply_text_normalization: "auto",
        output_format: "mp3_44100_128",
        enable_logging: false,
      });

      expect(result.success).toBe(true);
    });

    it("should reject text-to-speech without text", () => {
      const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
        model_id: "eleven_multilingual_v2",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
        true
      );
    });
  });

  describe("text to dialogue schema", () => {
    it("should validate a text-to-dialogue request", () => {
      const result = ElevenLabsTextToDialogueRequestSchema.safeParse({
        inputs: [
          {
            text: "[curious] Who is there?",
            voice_id: "JBFqnCBsd6RMkjVDRZzb",
          },
        ],
        model_id: "eleven_v3",
        language_code: "en",
        settings: { stability: 0.5 },
        seed: 42,
        apply_text_normalization: "auto",
        output_format: "mp3_44100_128",
      });

      expect(result.success).toBe(true);
    });

    it("should reject text-to-dialogue without turns", () => {
      const result = ElevenLabsTextToDialogueRequestSchema.safeParse({
        inputs: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("inputs"))).toBe(
        true
      );
    });
  });

  describe("workspace analytics requests schema", () => {
    it("should validate request filters and search", () => {
      const result =
        ElevenLabsWorkspaceAnalyticsRequestsRequestSchema.safeParse({
          start_time: 1764547200000,
          limit: 100,
          sort: "desc",
          filters: [
            {
              column: "success",
              operation: "eq",
              values: [true],
            },
          ],
          search: "text-to-speech",
        });

      expect(result.success).toBe(true);
    });

    it("should reject requests without a time bound", () => {
      const result =
        ElevenLabsWorkspaceAnalyticsRequestsRequestSchema.safeParse({
          limit: 10,
        });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("start_time"))
      ).toBe(true);
    });

    it("should reject invalid limit and sort values", () => {
      const result =
        ElevenLabsWorkspaceAnalyticsRequestsRequestSchema.safeParse({
          end_time: 1764547200000,
          limit: 1001,
          sort: "newest",
        });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("limit"))).toBe(
        true
      );
      expect(result.error?.issues.some((i) => i.path.includes("sort"))).toBe(
        true
      );
    });
  });
});
