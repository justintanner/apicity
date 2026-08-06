import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieSunoOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie suno wav.generate (error envelope)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/wav-bogus-ids");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a recognizable envelope when taskId/audioId do not exist", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const request = {
      taskId: "apicity-test-bogus-task-id",
      audioId: "apicity-test-bogus-audio-id",
      callBackUrl: "https://example.com/cb",
    };

    const result = await provider.suno.post.api.v1.wav.generate(
      request,
      mintKieSunoOtp("api.v1.wav.generate", request)
    );

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("msg");
    expect([400, 404, 422, 500]).toContain(result.code);
  });
});
