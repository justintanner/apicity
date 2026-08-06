import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createKie,
  GeminiOmniAudioCreateRequestSchema,
  GeminiOmniAudioVoiceIds,
} from "@apicity/kie";
import {
  mintKieCreateTaskOtp,
  mintKieOmniOtp,
  TEST_PAYGATE_SECRET,
} from "../harness";

describe("kie audio endpoints integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("records an ElevenLabs text-to-speech createTask envelope", async () => {
    ctx = setupPolly("kie/audio/elevenlabs-text-to-speech-turbo-25");

    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const request = {
      model: "elevenlabs/text-to-speech-turbo-2-5" as const,
      input: {
        text: "A concise Apicity smoke test for Kie text to audio.",
        voice: "Rachel",
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        speed: 1,
        timestamps: false,
        previous_text: "",
        next_text: "",
        language_code: "",
      },
    };

    const result = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(result).toBeDefined();
    expect(result.code).toBe(200);
    expect(result.msg).toBe("success");
    expect(result.data?.taskId).toBeTruthy();
    expect(typeof result.data?.taskId).toBe("string");
  });

  it("creates a Gemini Omni Audio voice preset", async () => {
    ctx = setupPolly("kie/audio/gemini-omni-audio-create");

    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const request = {
      audio_id: "achernar" as const,
      name: "Apicity HAR Test Narrator",
      voice_description:
        "A calm, clear, friendly voice for a short API smoke test.",
      example_dialogue: "Hello from the Apicity Kie audio HAR test.",
    };

    const result = await provider.post.api.v1.omni.audio.create(
      request,
      mintKieOmniOtp("api.v1.omni.audio.create", request)
    );

    expect(result).toBeDefined();
    expect(result.code).toBe(200);
    expect(result.msg).toBe("success");
    expect(result.data?.audioId).toBeTruthy();
    expect(result.data?.kieAudioId).toBe(result.data?.audioId);
    expect(result.data?.name).toBeTruthy();
  });

  it("validates Gemini Omni Audio voice metadata", () => {
    const provider = createKie({
      apiKey: "kie-test-key",
    });
    const schema = provider.post.api.v1.omni.audio.create.schema;

    expect(GeminiOmniAudioVoiceIds).toHaveLength(30);
    expect(GeminiOmniAudioVoiceIds).toContain("achernar");
    expect(GeminiOmniAudioVoiceIds).toContain("zubenelgenubi");

    expect(
      schema.safeParse({
        audio_id: "achird",
        name: "n".repeat(210),
      }).success
    ).toBe(true);

    expect(
      GeminiOmniAudioCreateRequestSchema.safeParse({
        audio_id: "zubenelgenubi",
        name: "Zubenelgenubi Narrator",
        voice_description: "A casual mid-low male voice.",
        example_dialogue: "Hello from Gemini Omni Audio.",
      }).success
    ).toBe(true);

    expect(
      schema.safeParse({
        audio_id: "unknown-voice",
        name: "Narrator",
      }).success
    ).toBe(false);

    expect(
      schema.safeParse({
        audio_id: "achernar",
        name: "n".repeat(211),
      }).success
    ).toBe(false);

    expect(
      schema.safeParse({
        audio_id: "achernar",
        name: "Narrator",
        voice_description: "v".repeat(20001),
      }).success
    ).toBe(false);

    expect(
      schema.safeParse({
        audio_id: "achernar",
        name: "Narrator",
        example_dialogue: "d".repeat(121),
      }).success
    ).toBe(false);
  });
});
