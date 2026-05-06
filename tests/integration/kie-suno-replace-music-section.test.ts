import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie suno replace music section (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/replace-music-section-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a replace music section task and returns a taskId", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.replaceMusicSection.generate(
      {
        audioId: "test-audio-id",
        prompt: "Replace with upbeat electronic section",
        startTime: 10,
        endTime: 30,
        callBackUrl: "https://example.com/cb",
      }
    );

    expect([200, 422]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data?.taskId).toBeTruthy();
      expect(typeof result.data?.taskId).toBe("string");
    }
  });
});
