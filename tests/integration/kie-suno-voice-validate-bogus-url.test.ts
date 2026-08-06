import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieSunoOtp, TEST_PAYGATE_SECRET } from "../harness";

// Kie defers voiceUrl reachability checks to the worker, so submit returns
// 200 with a taskId even for an unreachable URL (no real audio processing).
const RECORDING_NAME = "kie/suno/voice-validate-bogus-url";

describe("kie suno voice.validate (bogus url)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns 200 with a taskId even when voiceUrl is unreachable", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const validate = provider.suno.post.api.v1.voice.validate;

    const request = {
      voiceUrl: "https://invalid-host-apicity-test.invalid/user_voice.mp3",
      vocalStartS: 0,
      vocalEndS: 10,
      language: "en",
      callBackUrl: "https://example.com/cb",
    };

    const result = await validate(
      request,
      mintKieSunoOtp("api.v1.voice.validate", request)
    );

    expect(result.code).toBe(200);
    expect(result.msg).toBe("success");
    expect(result.data?.taskId).toBeTruthy();
    expect(typeof result.data?.taskId).toBe("string");
    expect(validate.responseSchema.safeParse(result).success).toBe(true);
  });
});
