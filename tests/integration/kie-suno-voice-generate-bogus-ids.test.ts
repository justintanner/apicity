import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieSunoOtp, TEST_PAYGATE_SECRET } from "../harness";

// Free error path: bogus taskId + verifyUrl — do not create a real custom voice.
describe("kie suno voice.generate (error envelope)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/voice-generate-bogus-ids");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a recognizable envelope when taskId/verifyUrl are not valid", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const request = {
      taskId: "apicity-test-bogus-task-id",
      verifyUrl: "https://invalid-host-apicity-test.invalid/verify.mp3",
      voiceName: "Apicity Test Voice",
      description: "error-path fixture only",
      style: "Pop",
      callBackUrl: "https://example.com/cb",
      singerSkillLevel: "beginner" as const,
    };

    const generate = provider.suno.post.api.v1.voice.generate;
    const result = await generate(
      request,
      mintKieSunoOtp("api.v1.voice.generate", request)
    );

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("msg");
    expect([400, 404, 422, 500]).toContain(result.code);
    expect(generate.schema.safeParse(request).success).toBe(true);
  });
});
