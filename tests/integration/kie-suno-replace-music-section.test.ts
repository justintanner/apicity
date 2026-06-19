import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie suno replace music section (validation)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/replace-music-section-full-lyrics-validation");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("records upstream fullLyrics validation for a schema-valid payload", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const replaceSection = provider.suno.post.api.v1.generate.replaceSection;
    const payload = {
      taskId: "test-task-id",
      audioId: "test-audio-id",
      prompt: "Replace with upbeat electronic section",
      tags: "electronic, upbeat",
      title: "Test Replacement",
      infillStartS: 10,
      infillEndS: 20,
      callBackUrl: "https://example.com/cb",
    };

    expect(replaceSection.schema.safeParse(payload).success).toBe(true);

    const result = await replaceSection(payload);

    expect(result.code).toBe(422);
    expect(result.msg).toBe("fullLyrics cannot be blank");
    expect(result.data).toBeNull();
  });
});
