import { describe, it, expect } from "vitest";

import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/mcp-server/src/schema";
import {
  ElevenLabsSoundGenerationRequestSchema,
  ElevenLabsTextToDialogueRequestSchema,
  ElevenLabsTextToSpeechRequestSchema,
  ElevenLabsSpeechToTextRequestSchema,
  ElevenLabsComposeMusicRequestSchema,
  ElevenLabsMusicPlanRequestSchema,
  ElevenLabsVideoToMusicRequestSchema,
  ElevenLabsVoiceDesignRequestSchema,
  ElevenLabsPvcTrainRequestSchema,
  ElevenLabsWorkspaceAnalyticsRequestsRequestSchema,
  ElevenLabsGetAgentSummariesRequestSchema,
  ElevenLabsPostAgentAvatarRequestSchema,
  ElevenLabsSimulateConversationRequestSchema,
  ElevenLabsCreateAgentDraftRequestSchema,
  ElevenLabsCreateAgentDeploymentRequestSchema,
  ElevenLabsCreateAgentBranchRequestSchema,
  ElevenLabsUpdateAgentBranchRequestSchema,
  ElevenLabsMergeAgentBranchRequestSchema,
  ElevenLabsPreviewAgentBranchMergeRequestSchema,
  ElevenLabsGetLiveConversationCountRequestSchema,
  ElevenLabsTextToSpeechModelIdSchema,
  ELEVENLABS_TEXT_TO_SPEECH_MODEL_TEXT_LIMITS,
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

    it("should accept text at the 450 character maximum", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "a".repeat(450),
      });
      expect(result.success).toBe(true);
    });

    it("should reject text above the 450 character maximum", () => {
      const result = ElevenLabsSoundGenerationRequestSchema.safeParse({
        text: "a".repeat(451),
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

  describe("ConvAI agent extension schemas", () => {
    it("validates batch summaries and avatar payloads", () => {
      expect(
        ElevenLabsGetAgentSummariesRequestSchema.safeParse({
          agent_ids: ["agent_1"],
        }).success
      ).toBe(true);
      expect(
        ElevenLabsGetAgentSummariesRequestSchema.safeParse({
          agent_ids: Array.from({ length: 101 }, (_, i) => `agent_${i}`),
        }).success
      ).toBe(false);
      expect(
        ElevenLabsPostAgentAvatarRequestSchema.safeParse({
          avatar_file: new Blob(["png"], { type: "image/png" }),
        }).success
      ).toBe(true);
      expect(
        ElevenLabsPostAgentAvatarRequestSchema.safeParse({
          avatar_file: "not-a-file",
        }).success
      ).toBe(false);
    });

    it("validates simulation, draft, deployment, branch, and analytics payloads", () => {
      expect(
        ElevenLabsSimulateConversationRequestSchema.safeParse({
          simulation_specification: {
            simulated_user_config: { first_message: "Hello" },
          },
          new_turns_limit: 3,
        }).success
      ).toBe(true);
      expect(
        ElevenLabsSimulateConversationRequestSchema.safeParse({}).success
      ).toBe(false);
      expect(
        ElevenLabsCreateAgentDraftRequestSchema.safeParse({
          branch_id: "branch_1",
          conversation_config: {},
          platform_settings: {},
          workflow: {},
          name: "Draft",
          tags: ["test"],
        }).success
      ).toBe(true);
      expect(
        ElevenLabsCreateAgentDeploymentRequestSchema.safeParse({
          deployment_request: {
            requests: [
              {
                branch_id: "branch_1",
                deployment_strategy: { type: "percentage", percentage: 100 },
              },
            ],
          },
        }).success
      ).toBe(true);
      expect(
        ElevenLabsCreateAgentBranchRequestSchema.safeParse({
          parent_version_id: "version_1",
          name: "Draft",
          description: "Draft branch",
        }).success
      ).toBe(true);
      expect(
        ElevenLabsUpdateAgentBranchRequestSchema.safeParse({
          protection_status: "writer_perms_required",
        }).success
      ).toBe(true);
      expect(
        ElevenLabsUpdateAgentBranchRequestSchema.safeParse({
          protection_status: "owner_only",
        }).success
      ).toBe(false);
      expect(
        ElevenLabsMergeAgentBranchRequestSchema.safeParse({
          target_branch_id: "main",
          archive_source_branch: false,
        }).success
      ).toBe(true);
      expect(
        ElevenLabsPreviewAgentBranchMergeRequestSchema.safeParse({
          target_branch_id: "main",
          force: true,
        }).success
      ).toBe(true);
      expect(
        ElevenLabsGetLiveConversationCountRequestSchema.safeParse({
          agent_id: null,
        }).success
      ).toBe(true);
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

    describe("model_id enum", () => {
      it.each(["scribe_v1", "scribe_v2"])(
        "should accept the listed model_id %p",
        (model_id) => {
          const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
            model_id,
          });

          expect(result.success).toBe(true);
        }
      );

      it.each([
        // Unreleased versions: the alias hatch accepts a versioned Scribe id
        // before the enum above catches up.
        "scribe_v3",
        "scribe_v2_5",
      ])("should accept the Scribe alias %p", (model_id) => {
        const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
          model_id,
        });

        expect(result.success).toBe(true);
      });

      it.each([
        // Near-miss typos of a listed id: the family separator is an
        // underscore, and the version must be present and terminal.
        "scribe-v1",
        "scribev1",
        "scribe_v",
        "scribe_v1_",
        // Foreign families — including another ElevenLabs modality. The hatch
        // is a shape check scoped to Scribe, so a text-to-speech id stays out.
        "eleven_flash_v3",
        "music_v1",
        // The hatch is case-sensitive; empty string is not a version.
        "SCRIBE_V1",
        "",
        // Not a string at all.
        42,
      ])("should reject the model_id %p", (model_id) => {
        const result = ElevenLabsSpeechToTextRequestSchema.safeParse({
          model_id,
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some((i) => i.path.includes("model_id"))
        ).toBe(true);
      });

      // Every enumerated id also matches the alias regex, so the enum branch is
      // redundant for *validation* — its job is MCP client autocomplete.
      // Nothing else pins it, so deleting it would leave the suite green while
      // silently dropping every completion. This is that pin.
      it("keeps both ids in the enum branch of the MCP JSON Schema", () => {
        const props = zodToJsonSchema(ElevenLabsSpeechToTextRequestSchema)
          .properties as Record<string, JsonSchema>;
        const branches = props.model_id.anyOf as JsonSchema[];

        expect(branches).toHaveLength(2);
        expect(branches[0]).toMatchObject({
          type: "string",
          enum: ["scribe_v1", "scribe_v2"],
        });
        // The second branch is the hatch; without it the enum would be closed.
        expect(branches[1].type).toBe("string");
        expect(branches[1].pattern).toBeDefined();
      });
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

    describe("per-model text length caps", () => {
      // Caps are upstream's own maximum_text_length_per_request, recorded in
      // tests/recordings/elevenlabs_2379486140/models_343003787.
      const cases = [
        { model_id: "eleven_v3", cap: 5000 },
        { model_id: "eleven_multilingual_v2", cap: 10000 },
        { model_id: "eleven_turbo_v2", cap: 30000 },
        { model_id: "eleven_flash_v2_5", cap: 40000 },
      ] as const;

      it("pins the cap table to the recorded /v1/models values", () => {
        for (const { model_id, cap } of cases) {
          expect(ELEVENLABS_TEXT_TO_SPEECH_MODEL_TEXT_LIMITS[model_id]).toBe(
            cap
          );
        }
      });

      for (const { model_id, cap } of cases) {
        it(`accepts text at the ${model_id} cap of ${cap}`, () => {
          const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
            text: "a".repeat(cap),
            model_id,
          });

          expect(result.success).toBe(true);
        });

        it(`rejects text one character above the ${model_id} cap`, () => {
          const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
            text: "a".repeat(cap + 1),
            model_id,
          });

          expect(result.success).toBe(false);
          expect(
            result.error?.issues.some((i) => i.path.includes("text"))
          ).toBe(true);
        });
      }

      it("distinguishes the caps: text valid for one model fails a stricter one", () => {
        const text = "a".repeat(10000);

        expect(
          ElevenLabsTextToSpeechRequestSchema.safeParse({
            text,
            model_id: "eleven_multilingual_v2",
          }).success
        ).toBe(true);
        expect(
          ElevenLabsTextToSpeechRequestSchema.safeParse({
            text,
            model_id: "eleven_v3",
          }).success
        ).toBe(false);
      });

      // Upstream serves an omitted model_id with its default TTS model,
      // eleven_multilingual_v2, whose cap is 10000 — not with "no model".
      it("caps text at the default model's limit when model_id is omitted", () => {
        expect(
          ElevenLabsTextToSpeechRequestSchema.safeParse({
            text: "a".repeat(10000),
          }).success
        ).toBe(true);

        const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
          text: "a".repeat(10001),
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
          true
        );
      });

      it("names the default model and both lengths for the reported case", () => {
        const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
          text: "a".repeat(25000),
        });

        expect(result.success).toBe(false);

        const message = (result.error?.issues ?? [])
          .map((i) => i.message)
          .join("\n");

        expect(message).toContain("eleven_multilingual_v2");
        expect(message).toContain("10000");
        expect(message).toContain("25000");
        expect(message).toContain("model_id");
      });

      // The static bound is still the ceiling — on an explicit large-cap model.
      it("accepts the static bound for an explicit large-cap model_id", () => {
        expect(
          ElevenLabsTextToSpeechRequestSchema.safeParse({
            text: "a".repeat(40000),
            model_id: "eleven_flash_v2_5",
          }).success
        ).toBe(true);
      });

      it("documents the conditional cap in the MCP JSON Schema", () => {
        const json = zodToJsonSchema(ElevenLabsTextToSpeechRequestSchema);
        const props = json.properties as Record<string, JsonSchema>;

        expect(props.text).toMatchObject({ maxLength: 40000 });
        expect(json.description).toContain("10000");
        expect(json.description).toContain("model_id is omitted");
        expect(json.description).toContain("40000");
      });

      it("still enforces the per-model cap for a listed model_id", () => {
        const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
          text: "a".repeat(6000),
          model_id: "eleven_v3",
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some(
            (i) =>
              i.path.includes("text") &&
              i.message.includes("eleven_v3") &&
              i.message.includes("5000")
          )
        ).toBe(true);
      });

      // A hatched id has no cap-table entry, so only the static bound applies.
      it("falls back to the static bound for a hatched model_id", () => {
        expect(
          ElevenLabsTextToSpeechRequestSchema.safeParse({
            text: "a".repeat(30000),
            model_id: "eleven_flash_v3",
          }).success
        ).toBe(true);
      });

      it("still applies the static bound to a hatched model_id", () => {
        const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
          text: "a".repeat(45000),
          model_id: "eleven_flash_v3",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.some((i) => i.path.includes("text"))).toBe(
          true
        );
      });
    });

    describe("model_id enum", () => {
      it("accepts every model with a documented cap", () => {
        for (const model_id of Object.keys(
          ELEVENLABS_TEXT_TO_SPEECH_MODEL_TEXT_LIMITS
        )) {
          const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
            text: "Hello.",
            model_id,
          });

          expect(result.success).toBe(true);
        }
      });

      it.each([
        // Unreleased point releases: the alias hatch accepts a versioned id
        // before the enum above catches up.
        "eleven_flash_v3",
        "eleven_turbo_v3_5",
        // These two were previously pinned as rejected because
        // can_do_text_to_speech is false upstream. The hatch is a shape check,
        // not an entitlement check — it says the id is well-formed, not that
        // this endpoint serves it. Upstream stays the authority on
        // entitlement, exactly as for the accepted Veo alias precedent. The
        // expectation inverting here is intended.
        "eleven_english_sts_v2",
        "eleven_multilingual_sts_v2",
      ])("accepts versioned alias model_id %p", (model_id) => {
        const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
          text: "Hello.",
          model_id,
        });

        expect(result.success).toBe(true);
      });

      it.each([
        // No version suffix at all — the bare-family-prefix failure case.
        "eleven_typo",
        "eleven_flash_v",
        // Version present but not terminal.
        "eleven_v2_flash",
        "eleven_v2_5_flash",
        // Empty suffix, empty string.
        "eleven_",
        "",
        // Foreign family, and the hatch is case-sensitive.
        "gpt-4",
        "ELEVEN_FLASH_V2",
        // Not a string at all.
        42,
      ])("rejects model_id %p", (model_id) => {
        const result = ElevenLabsTextToSpeechRequestSchema.safeParse({
          text: "Hello.",
          model_id,
        });

        expect(result.success).toBe(false);
        expect(
          result.error?.issues.some((i) => i.path.includes("model_id"))
        ).toBe(true);
      });

      // Every enumerated id also matches the alias regex, so the enum branch
      // is redundant for *validation* — its job is MCP client autocomplete.
      // Nothing else pins it, so deleting it would leave the suite green while
      // silently dropping every completion. This is that pin.
      it("keeps all eight ids in the enum branch of the MCP JSON Schema", () => {
        const json = zodToJsonSchema(ElevenLabsTextToSpeechModelIdSchema);
        const branches = json.anyOf as JsonSchema[];

        expect(branches).toHaveLength(2);
        expect(branches[0]).toMatchObject({
          type: "string",
          enum: [
            "eleven_v3",
            "eleven_flash_v2",
            "eleven_flash_v2_5",
            "eleven_monolingual_v1",
            "eleven_multilingual_v1",
            "eleven_multilingual_v2",
            "eleven_turbo_v2",
            "eleven_turbo_v2_5",
          ],
        });
        // The second branch is the hatch; without it the enum would be closed.
        expect(branches[1].type).toBe("string");
        expect(branches[1].pattern).toBeDefined();
      });
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

  describe("music schema model_id enum", () => {
    const composeBase = { prompt: "A slow piano ballad." };

    it.each(["music_v1", "music_v2"])(
      "should accept the listed model_id %p",
      (model_id) => {
        const result = ElevenLabsComposeMusicRequestSchema.safeParse({
          ...composeBase,
          model_id,
        });

        expect(result.success).toBe(true);
      }
    );

    it.each([
      // Unreleased versions: the alias hatch accepts a versioned music id
      // before the enum above catches up.
      "music_v3",
      "music_v2_5",
    ])("should accept the music alias %p", (model_id) => {
      const result = ElevenLabsComposeMusicRequestSchema.safeParse({
        ...composeBase,
        model_id,
      });

      expect(result.success).toBe(true);
    });

    it.each([
      // Near-miss typos of a listed id: the family separator is an underscore,
      // and the version must be present and terminal.
      "music-v1",
      "musicv1",
      "music_v",
      "music_v1_",
      // Foreign families — including another ElevenLabs modality.
      "eleven_flash_v3",
      "scribe_v1",
      // The hatch is case-sensitive; empty string is not a version.
      "MUSIC_V1",
      "",
      // Not a string at all.
      42,
    ])("should reject the model_id %p", (model_id) => {
      const result = ElevenLabsComposeMusicRequestSchema.safeParse({
        ...composeBase,
        model_id,
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("model_id"))
      ).toBe(true);
    });

    it("should still allow model_id to be omitted", () => {
      const result = ElevenLabsComposeMusicRequestSchema.safeParse(composeBase);

      expect(result.success).toBe(true);
    });

    // The same const backs /v1/music/plan and /v1/music/video-to-music, so
    // opening it opens all three request schemas at once.
    it("should open the other two music request schemas too", () => {
      expect(
        ElevenLabsMusicPlanRequestSchema.safeParse({
          prompt: "A slow piano ballad.",
          model_id: "music_v3",
        }).success
      ).toBe(true);
      expect(
        ElevenLabsVideoToMusicRequestSchema.safeParse({
          videos: [new Blob(["clip"])],
          model_id: "music_v3",
        }).success
      ).toBe(true);
    });

    // Every enumerated id also matches the alias regex, so the enum branch is
    // redundant for *validation* — its job is MCP client autocomplete. Nothing
    // else pins it, so deleting it would leave the suite green while silently
    // dropping every completion. This is that pin.
    it("keeps both ids in the enum branch of the MCP JSON Schema", () => {
      const props = zodToJsonSchema(ElevenLabsComposeMusicRequestSchema)
        .properties as Record<string, JsonSchema>;
      const branches = props.model_id.anyOf as JsonSchema[];

      expect(branches).toHaveLength(2);
      expect(branches[0]).toMatchObject({
        type: "string",
        enum: ["music_v1", "music_v2"],
      });
      // The second branch is the hatch; without it the enum would be closed.
      expect(branches[1].type).toBe("string");
      expect(branches[1].pattern).toBeDefined();
    });
  });

  describe("voice design schema model_id enum", () => {
    const designBase = {
      voice_description:
        "A warm, low-pitched narrator with a measured, unhurried delivery.",
    };

    it.each(["eleven_multilingual_ttv_v2", "eleven_ttv_v3"])(
      "should accept the listed model_id %p",
      (model_id) => {
        const result = ElevenLabsVoiceDesignRequestSchema.safeParse({
          ...designBase,
          model_id,
        });

        expect(result.success).toBe(true);
      }
    );

    it.each([
      // Unreleased versions: the alias hatch accepts a versioned text-to-voice
      // id before the enum above catches up.
      "eleven_ttv_v4",
      "eleven_multilingual_ttv_v3_5",
    ])("should accept the text-to-voice alias %p", (model_id) => {
      const result = ElevenLabsVoiceDesignRequestSchema.safeParse({
        ...designBase,
        model_id,
      });

      expect(result.success).toBe(true);
    });

    it.each([
      // A text-to-speech id. The broader `ElevenLabsModelAliasSchema` would
      // accept this; requiring the `ttv_` modality segment is what keeps this
      // cross-family value out.
      "eleven_flash_v3",
      "eleven_multilingual_v2",
      // Near-miss typos: the version must be present and terminal, and the
      // `eleven_` prefix is required.
      "eleven_ttv",
      "eleven_ttv_v",
      "eleven_ttv_v3_",
      "ttv_v3",
      // Foreign family; the hatch is case-sensitive; empty string.
      "music_v1",
      "ELEVEN_TTV_V3",
      "",
      // Not a string at all.
      42,
    ])("should reject the model_id %p", (model_id) => {
      const result = ElevenLabsVoiceDesignRequestSchema.safeParse({
        ...designBase,
        model_id,
      });

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("model_id"))
      ).toBe(true);
    });

    it("should still allow model_id to be omitted", () => {
      const result = ElevenLabsVoiceDesignRequestSchema.safeParse(designBase);

      expect(result.success).toBe(true);
    });

    // Every enumerated id also matches the alias regex, so the enum branch is
    // redundant for *validation* — its job is MCP client autocomplete. Nothing
    // else pins it, so deleting it would leave the suite green while silently
    // dropping every completion. This is that pin.
    it("keeps both ids in the enum branch of the MCP JSON Schema", () => {
      const props = zodToJsonSchema(ElevenLabsVoiceDesignRequestSchema)
        .properties as Record<string, JsonSchema>;
      const branches = props.model_id.anyOf as JsonSchema[];

      expect(branches).toHaveLength(2);
      expect(branches[0]).toMatchObject({
        type: "string",
        enum: ["eleven_multilingual_ttv_v2", "eleven_ttv_v3"],
      });
      // The second branch is the hatch; without it the enum would be closed.
      expect(branches[1].type).toBe("string");
      expect(branches[1].pattern).toBeDefined();
    });
  });
});
