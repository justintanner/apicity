import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

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
    });

    const result = await provider.post.api.v1.omni.audio.create({
      audio_id: "achernar",
      name: "Apicity HAR Test Narrator",
      voice_description:
        "A calm, clear, friendly voice for a short API smoke test.",
      example_dialogue: "Hello from the Apicity Kie audio HAR test.",
    });

    expect(result).toBeDefined();
    expect(result.code).toBe(200);
    expect(result.msg).toBe("success");
    expect(result.data?.audioId).toBeTruthy();
    expect(result.data?.name).toBeTruthy();
  });
});
