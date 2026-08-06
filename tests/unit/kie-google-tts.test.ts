import { describe, expect, it, vi } from "vitest";

import {
  createKie,
  KieError,
  type GoogleGemini25ProTtsRequest,
  type GoogleGemini31FlashTtsRequest,
  type GoogleGeminiTtsInput,
  type MediaGenerationRequest,
} from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  GoogleGemini25ProTtsRequestSchema,
  GoogleGemini31FlashTtsRequestSchema,
  GoogleGeminiTtsAccentSchema,
  GoogleGeminiTtsDialogueTextMaxLength,
  GoogleGeminiTtsPaceSchema,
  GoogleGeminiTtsStyleSchema,
  GoogleGeminiTtsTemperatureContract,
  GoogleGeminiTtsVoiceNameSchema,
} from "@apicity/kie/zod";

import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const MODELS = [
  "google/gemini-2-5-pro-tts",
  "google/gemini-3-1-flash-tts",
] as const;

const MAX_TEXT = "t".repeat(GoogleGeminiTtsDialogueTextMaxLength);
const TOO_LONG_TEXT = "t".repeat(GoogleGeminiTtsDialogueTextMaxLength + 1);

const BASE_INPUT = {
  speakers: [
    {
      speaker_id: "Speaker 1",
      voice_name: "Fenrir",
      accent: "British (RP)",
    },
  ],
  dialogue_turns: [
    {
      speaker_id: "Speaker 1",
      text: "Hello from the quiet valley.",
    },
  ],
} as const satisfies GoogleGeminiTtsInput;

const FULL_INPUT = {
  temperature: 1,
  scene: "A dark, crumbling dungeon...",
  sample_context: "Fantasy RPG style...",
  speakers: [
    {
      speaker_id: "Speaker 1",
      voice_name: "Fenrir",
      audio_profile: "A stern and weary gatekeeper",
      accent: "British (RP)",
      style: "Deadpan",
      pace: "Natural",
    },
    {
      speaker_id: "Speaker 2",
      voice_name: "Puck",
      audio_profile: "A determined and courageous traveler seeking answers.",
      accent: "American (Gen)",
      style: "Empathetic",
      pace: "Staccato",
    },
  ],
  dialogue_turns: [
    {
      speaker_id: "Speaker 1",
      text: "[shouting] Halt, traveler! The northern pass is sealed.",
    },
    {
      speaker_id: "Speaker 2",
      text: "[determination] I carry a message for the elder.",
    },
  ],
} as const satisfies GoogleGeminiTtsInput;

interface NegativeCase {
  label: string;
  request: Record<string, unknown>;
  expectedPath: string;
}

interface IssueBody {
  issues: Array<{ path: PropertyKey[] }>;
}

function expectAccepted(request: MediaGenerationRequest): void {
  const result = CreateTaskRequestSchema.safeParse(request);

  expect(result.success).toBe(true);
  if (!result.success) throw result.error;
  expect(result.data).toEqual(request);
}

function malformedRequest(
  model: (typeof MODELS)[number],
  input: Record<string, unknown>
): Record<string, unknown> {
  return { model, input };
}

const NEGATIVE_CASES: NegativeCase[] = MODELS.flatMap((model) => [
  {
    label: `${model} missing speakers`,
    request: malformedRequest(model, {
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers",
  },
  {
    label: `${model} empty speakers`,
    request: malformedRequest(model, {
      speakers: [],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers",
  },
  {
    label: `${model} missing dialogue_turns`,
    request: malformedRequest(model, {
      speakers: BASE_INPUT.speakers,
    }),
    expectedPath: "input.dialogue_turns",
  },
  {
    label: `${model} empty dialogue_turns`,
    request: malformedRequest(model, {
      speakers: BASE_INPUT.speakers,
      dialogue_turns: [],
    }),
    expectedPath: "input.dialogue_turns",
  },
  {
    label: `${model} speaker_id not Speaker N`,
    request: malformedRequest(model, {
      speakers: [
        {
          speaker_id: "Narrator",
          voice_name: "Zephyr",
          accent: "Neutral",
        },
      ],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers.0.speaker_id",
  },
  {
    label: `${model} missing voice_name`,
    request: malformedRequest(model, {
      speakers: [{ speaker_id: "Speaker 1", accent: "Neutral" }],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers.0.voice_name",
  },
  {
    label: `${model} lowercase voice_name`,
    request: malformedRequest(model, {
      speakers: [
        {
          speaker_id: "Speaker 1",
          voice_name: "fenrir",
          accent: "Neutral",
        },
      ],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers.0.voice_name",
  },
  {
    label: `${model} missing accent`,
    request: malformedRequest(model, {
      speakers: [{ speaker_id: "Speaker 1", voice_name: "Zephyr" }],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers.0.accent",
  },
  {
    label: `${model} unknown accent`,
    request: malformedRequest(model, {
      speakers: [
        {
          speaker_id: "Speaker 1",
          voice_name: "Zephyr",
          accent: "Canadian",
        },
      ],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers.0.accent",
  },
  {
    label: `${model} unknown style`,
    request: malformedRequest(model, {
      speakers: [
        {
          speaker_id: "Speaker 1",
          voice_name: "Zephyr",
          accent: "Neutral",
          style: "Gentle",
        },
      ],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers.0.style",
  },
  {
    label: `${model} unknown pace`,
    request: malformedRequest(model, {
      speakers: [
        {
          speaker_id: "Speaker 1",
          voice_name: "Zephyr",
          accent: "Neutral",
          pace: "Slow",
        },
      ],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers.0.pace",
  },
  {
    label: `${model} dialogue speaker_id not Speaker N`,
    request: malformedRequest(model, {
      speakers: BASE_INPUT.speakers,
      dialogue_turns: [{ speaker_id: "SpeakerA", text: "Hi" }],
    }),
    expectedPath: "input.dialogue_turns.0.speaker_id",
  },
  {
    label: `${model} empty dialogue text`,
    request: malformedRequest(model, {
      speakers: BASE_INPUT.speakers,
      dialogue_turns: [{ speaker_id: "Speaker 1", text: "" }],
    }),
    expectedPath: "input.dialogue_turns.0.text",
  },
  {
    label: `${model} dialogue text over max length`,
    request: malformedRequest(model, {
      speakers: BASE_INPUT.speakers,
      dialogue_turns: [{ speaker_id: "Speaker 1", text: TOO_LONG_TEXT }],
    }),
    expectedPath: "input.dialogue_turns.0.text",
  },
  {
    label: `${model} temperature below 0`,
    request: malformedRequest(model, {
      ...BASE_INPUT,
      temperature: -0.1,
    }),
    expectedPath: "input.temperature",
  },
  {
    label: `${model} temperature above 2`,
    request: malformedRequest(model, {
      ...BASE_INPUT,
      temperature: 2.1,
    }),
    expectedPath: "input.temperature",
  },
  {
    label: `${model} unknown input field`,
    request: malformedRequest(model, {
      ...BASE_INPUT,
      language: "en",
    }),
    expectedPath: "input",
  },
  {
    label: `${model} unknown speaker field`,
    request: malformedRequest(model, {
      speakers: [
        {
          speaker_id: "Speaker 1",
          voice_name: "Zephyr",
          accent: "Neutral",
          pitch: "high",
        },
      ],
      dialogue_turns: BASE_INPUT.dialogue_turns,
    }),
    expectedPath: "input.speakers.0",
  },
]);

describe("KIE Google Gemini TTS createTask contracts", () => {
  describe("accepted payloads", () => {
    it.each(MODELS)("accepts the minimal required payload for %s", (model) => {
      const request = {
        model,
        input: BASE_INPUT,
      } as MediaGenerationRequest;

      expectAccepted(request);
    });

    it.each(MODELS)("accepts the full documented example for %s", (model) => {
      const request = {
        model,
        callBackUrl: "https://your-domain.com/api/callback",
        input: FULL_INPUT,
      } as MediaGenerationRequest;

      expectAccepted(request);
    });

    it.each(MODELS)(
      "accepts temperature bounds and max dialogue text for %s",
      (model) => {
        for (const temperature of [
          GoogleGeminiTtsTemperatureContract.minimum,
          GoogleGeminiTtsTemperatureContract.default,
          GoogleGeminiTtsTemperatureContract.maximum,
        ]) {
          expectAccepted({
            model,
            input: {
              ...BASE_INPUT,
              temperature,
              dialogue_turns: [{ speaker_id: "Speaker 1", text: MAX_TEXT }],
            },
          } as MediaGenerationRequest);
        }
      }
    );

    it.each(GoogleGeminiTtsVoiceNameSchema.options)(
      "accepts voice_name %s on google/gemini-2-5-pro-tts",
      (voiceName) => {
        expectAccepted({
          model: "google/gemini-2-5-pro-tts",
          input: {
            speakers: [
              {
                speaker_id: "Speaker 1",
                voice_name: voiceName,
                accent: "Neutral",
              },
            ],
            dialogue_turns: BASE_INPUT.dialogue_turns,
          },
        } satisfies GoogleGemini25ProTtsRequest);
      }
    );

    it.each(GoogleGeminiTtsAccentSchema.options)(
      "accepts accent %s on google/gemini-3-1-flash-tts",
      (accent) => {
        expectAccepted({
          model: "google/gemini-3-1-flash-tts",
          input: {
            speakers: [
              {
                speaker_id: "Speaker 1",
                voice_name: "Zephyr",
                accent,
              },
            ],
            dialogue_turns: BASE_INPUT.dialogue_turns,
          },
        } satisfies GoogleGemini31FlashTtsRequest);
      }
    );

    it.each(GoogleGeminiTtsStyleSchema.options)("accepts style %s", (style) => {
      expectAccepted({
        model: "google/gemini-2-5-pro-tts",
        input: {
          speakers: [
            {
              speaker_id: "Speaker 1",
              voice_name: "Zephyr",
              accent: "Neutral",
              style,
            },
          ],
          dialogue_turns: BASE_INPUT.dialogue_turns,
        },
      } satisfies GoogleGemini25ProTtsRequest);
    });

    it.each(GoogleGeminiTtsPaceSchema.options)("accepts pace %s", (pace) => {
      expectAccepted({
        model: "google/gemini-3-1-flash-tts",
        input: {
          speakers: [
            {
              speaker_id: "Speaker 1",
              voice_name: "Zephyr",
              accent: "Neutral",
              pace,
            },
          ],
          dialogue_turns: BASE_INPUT.dialogue_turns,
        },
      } satisfies GoogleGemini31FlashTtsRequest);
    });
  });

  it("keeps documented temperature default in metadata without injecting parse output", () => {
    const proRequest = {
      model: "google/gemini-2-5-pro-tts",
      input: BASE_INPUT,
    } satisfies GoogleGemini25ProTtsRequest;
    const flashRequest = {
      model: "google/gemini-3-1-flash-tts",
      input: BASE_INPUT,
    } satisfies GoogleGemini31FlashTtsRequest;

    const parsedPro = GoogleGemini25ProTtsRequestSchema.parse(proRequest);
    const parsedFlash = GoogleGemini31FlashTtsRequestSchema.parse(flashRequest);

    expect(parsedPro.input).not.toHaveProperty("temperature");
    expect(parsedFlash.input).not.toHaveProperty("temperature");
    expect(parsedPro.input).not.toHaveProperty("scene");
    expect(parsedPro.input).not.toHaveProperty("sample_context");

    expect(
      modelInputSchemas["google/gemini-2-5-pro-tts"].fields.temperature.default
    ).toBe(GoogleGeminiTtsTemperatureContract.default);
    expect(
      modelInputSchemas["google/gemini-3-1-flash-tts"].fields.temperature
        .default
    ).toBe(GoogleGeminiTtsTemperatureContract.default);
  });

  it.each(NEGATIVE_CASES)(
    "rejects $label at the provider boundary before fetch",
    async ({ label, request, expectedPath }) => {
      const mockFetch = vi.fn<typeof globalThis.fetch>(() => {
        throw new Error(`Google TTS validation reached fetch for ${label}`);
      });
      const provider = createKie({
        apiKey: "test-key",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      const rejection: unknown = await provider.post.api.v1.jobs
        .createTask(
          request as unknown as MediaGenerationRequest,
          mintKieCreateTaskOtp(request)
        )
        .catch((error: unknown) => error);

      expect(rejection).toBeInstanceOf(KieError);
      if (!(rejection instanceof KieError)) throw rejection;
      expect(rejection.status).toBe(400);
      expect(rejection.message).toContain("Invalid Kie createTask request");
      expect(rejection.message).toContain(expectedPath);

      const { issues } = rejection.body as IssueBody;
      expect(issues.length).toBeGreaterThan(0);
      expect(
        issues.some((issue) => issue.path.join(".") === expectedPath)
      ).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );
});
