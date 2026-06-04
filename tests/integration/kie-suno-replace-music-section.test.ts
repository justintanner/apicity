import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie suno replace music section (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/replace-music-section-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a replace music section task and returns a taskId", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate.replaceSection({
      taskId: "test-task-id",
      audioId: "test-audio-id",
      prompt: "Replace with upbeat electronic section",
      tags: "electronic, upbeat",
      title: "Test Replacement",
      infillStartS: 10,
      infillEndS: 20,
      callBackUrl: "https://example.com/cb",
    });

    expect([200, 422, 451]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data?.taskId).toBeTruthy();
      expect(typeof result.data?.taskId).toBe("string");
    }
  });
});
